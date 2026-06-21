package com.heytea.agent.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heytea.agent.dto.ChatResponse;
import com.heytea.agent.entity.Message;
import com.heytea.agent.service.LLMService;
import com.heytea.agent.service.llm.IntentClassifier;
import com.heytea.agent.service.llm.PromptBuilder;
import com.heytea.agent.service.llm.SubScenarioDetector;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

/**
 * LLM Service — orchestrates intent classification, prompt building, and API calls.
 * Refactored from 930 lines to ~120 by delegating to:
 *   - IntentClassifier (regex + LLM classification)
 *   - SubScenarioDetector (second-level scenario detection)
 *   - PromptBuilder (dynamic system prompt assembly)
 */
@Slf4j
@Service
public class LLMServiceImpl implements LLMService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final IntentClassifier intentClassifier;
    private final SubScenarioDetector subScenarioDetector;
    private final PromptBuilder promptBuilder;

    @Value("${llm.api-key}")
    private String apiKey;

    @Value("${llm.model}")
    private String model;

    @Value("${llm.base-url}")
    private String baseUrl;

    @Value("${llm.max-tokens}")
    private int maxTokens;

    @Value("${llm.temperature}")
    private double temperature;

    private static final Duration TIMEOUT = Duration.ofSeconds(60);

    public LLMServiceImpl(ObjectMapper objectMapper,
                          IntentClassifier intentClassifier,
                          SubScenarioDetector subScenarioDetector,
                          PromptBuilder promptBuilder) {
        this.objectMapper = objectMapper;
        this.intentClassifier = intentClassifier;
        this.subScenarioDetector = subScenarioDetector;
        this.promptBuilder = promptBuilder;
        this.webClient = WebClient.builder().build();
    }

    @Override
    public String classifyIntent(String userMessage) {
        return intentClassifier.classify(userMessage);
    }

    @Override
    public ChatResponse chat(String conversationId, String userMessage, String intent, List<Message> history) {
        long startTime = System.currentTimeMillis();
        String subScenario = subScenarioDetector.detect(userMessage, intent);
        log.info("Sub-scenario: {} for intent: {}", subScenario, intent);

        try {
            String systemPrompt = promptBuilder.build(intent, subScenario, userMessage);

            // Build message list
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));

            if (history != null && !history.isEmpty()) {
                int fromIndex = Math.max(0, history.size() - 20);
                for (Message msg : history.subList(fromIndex, history.size())) {
                    messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
                }
            }
            messages.add(Map.of("role", "user", "content", userMessage));

            // Build request body
            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", maxTokens);
            requestBody.put("temperature", temperature);

            String requestBodyJson = objectMapper.writeValueAsString(requestBody);
            log.debug("LLM request: model={}, messages={}, sub={}", model, messages.size(), subScenario);

            String responseBody;
            try {
                responseBody = webClient.post()
                        .uri(baseUrl + "/chat/completions")
                        .header("Authorization", "Bearer " + apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(requestBodyJson)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(TIMEOUT)
                        .block();
            } catch (WebClientResponseException wcre) {
                log.error("LLM API error: status={}, body={}", wcre.getStatusCode(), wcre.getResponseBodyAsString());
                throw wcre;
            }

            long latencyMs = System.currentTimeMillis() - startTime;

            Map<String, Object> responseMap = objectMapper.readValue(responseBody, new TypeReference<>() {});

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
            String content = "抱歉，系统暂时无法响应。";
            if (choices != null && !choices.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> messageObj = (Map<String, Object>) choices.get(0).get("message");
                if (messageObj != null && messageObj.get("content") != null) {
                    content = messageObj.get("content").toString();
                }
            }

            Map<String, Object> metadata = new LinkedHashMap<>();
            if (responseMap.containsKey("usage")) metadata.put("usage", responseMap.get("usage"));
            metadata.put("model", model);
            metadata.put("intent", intent);
            metadata.put("subScenario", subScenario);

            return ChatResponse.builder()
                    .conversationId(conversationId)
                    .messageId(UUID.randomUUID().toString())
                    .content(content)
                    .intent(intent)
                    .role("assistant")
                    .metadata(metadata)
                    .latencyMs(latencyMs)
                    .createdAt(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            long latencyMs = System.currentTimeMillis() - startTime;
            log.error("LLM call failed for conversation {}: {}", conversationId, e.getMessage(), e);
            return buildFallback(conversationId, latencyMs, intent, subScenario);
        }
    }

    /**
     * SSE streaming chat — returns a Flux of content chunks.
     * Used by ChatController for /chat/{id}/stream endpoint.
     */
    public reactor.core.publisher.Flux<String> chatStream(String conversationId, String userMessage,
                                                          String intent, List<Message> history) {
        String subScenario = subScenarioDetector.detect(userMessage, intent);
        String systemPrompt = promptBuilder.build(intent, subScenario, userMessage);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        if (history != null && !history.isEmpty()) {
            int fromIndex = Math.max(0, history.size() - 20);
            for (Message msg : history.subList(fromIndex, history.size())) {
                messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
            }
        }
        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", messages);
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("temperature", temperature);
        requestBody.put("stream", true);

        try {
            String requestBodyJson = objectMapper.writeValueAsString(requestBody);

            return webClient.post()
                    .uri(baseUrl + "/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBodyJson)
                    .retrieve()
                    .bodyToFlux(String.class)
                    .timeout(TIMEOUT)
                    .filter(line -> line.startsWith("data:") && !line.contains("[DONE]"))
                    .map(line -> {
                        try {
                            String json = line.substring(5).trim();
                            Map<String, Object> parsed = objectMapper.readValue(json, new TypeReference<>() {});
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> choices = (List<Map<String, Object>>) parsed.get("choices");
                            if (choices != null && !choices.isEmpty()) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> delta = (Map<String, Object>) choices.get(0).get("delta");
                                if (delta != null && delta.get("content") != null) {
                                    return delta.get("content").toString();
                                }
                            }
                        } catch (Exception ignored) { /* skip non-JSON lines */ }
                        return "";
                    })
                    .filter(s -> !s.isEmpty());

        } catch (Exception e) {
            log.error("SSE stream setup failed: {}", e.getMessage());
            return reactor.core.publisher.Flux.just("抱歉，系统暂时无法响应，请稍后再试。");
        }
    }

    private ChatResponse buildFallback(String conversationId, long latencyMs, String intent, String subScenario) {
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("error", "LLM call failed");
        meta.put("fallback", true);
        meta.put("intent", intent);
        meta.put("subScenario", subScenario);
        return ChatResponse.builder()
                .conversationId(conversationId)
                .messageId(UUID.randomUUID().toString())
                .content("抱歉，系统暂时无法响应，请稍后再试或转接人工客服。")
                .intent(intent)
                .role("assistant")
                .metadata(meta)
                .latencyMs(latencyMs)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
