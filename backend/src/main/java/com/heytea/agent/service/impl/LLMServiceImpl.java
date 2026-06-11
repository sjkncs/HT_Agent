package com.heytea.agent.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heytea.agent.dto.ChatResponse;
import com.heytea.agent.entity.Message;
import com.heytea.agent.service.LLMService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class LLMServiceImpl implements LLMService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

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

    private static final Map<String, String> SYSTEM_PROMPTS = Map.of(
            "ordering",
            """
            你是喜茶智能点单助手。你可以帮助用户浏览菜单、推荐饮品、完成点单和查询订单状态。
            请用友好、简洁的语气回复，主动推荐当季热门饮品。
            如果用户要下单，请确认饮品名称、规格（杯型、甜度、冰量）和数量。
            """,
            "general_knowledge",
            """
            你是喜茶智能客服助手。你可以回答关于喜茶品牌、门店信息、营业时间、会员制度、
            优惠活动等一般性问题。请用专业、友好的语气回复，如果不确定信息请如实告知。
            """,
            "food_safety",
            """
            你是喜茶食品安全专员助手。你需要认真对待每一个食品安全问题，详细记录用户描述的问题，
            安抚用户情绪，并引导用户提供以下信息：问题类型、购买门店、购买时间、具体问题描述。
            请表达对问题的重视，并告知处理流程和预计处理时间。
            """
    );

    private static final String DEFAULT_SYSTEM_PROMPT =
            "你是喜茶智能客服助手，可以帮助用户处理点单、咨询和投诉等问题。请用友好、专业的语气回复。";

    public LLMServiceImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder().build();
    }

    @Override
    public ChatResponse chat(String conversationId, String userMessage, String intent, List<Message> history) {
        long startTime = System.currentTimeMillis();

        try {
            // Build message list for the LLM
            List<Map<String, String>> messages = new ArrayList<>();

            // System prompt based on intent
            String systemPrompt = SYSTEM_PROMPTS.getOrDefault(intent, DEFAULT_SYSTEM_PROMPT);
            messages.add(Map.of("role", "system", "content", systemPrompt));

            // Include conversation history (last 20 messages max)
            if (history != null && !history.isEmpty()) {
                int fromIndex = Math.max(0, history.size() - 20);
                for (Message msg : history.subList(fromIndex, history.size())) {
                    messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
                }
            }

            // Current user message
            messages.add(Map.of("role", "user", "content", userMessage));

            // Build request body (OpenAI-compatible format)
            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", maxTokens);
            requestBody.put("temperature", temperature);

            String requestBodyJson = objectMapper.writeValueAsString(requestBody);

            log.debug("LLM request: model={}, messages={}, conversationId={}", model, messages.size(), conversationId);

            // Call DashScope compatible API
            String responseBody = webClient.post()
                    .uri(baseUrl + "/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBodyJson)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(TIMEOUT)
                    .block();

            long latencyMs = System.currentTimeMillis() - startTime;

            // Parse the response
            Map<String, Object> responseMap = objectMapper.readValue(responseBody, new TypeReference<>() {});

            // Extract assistant content
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
            String content = "Sorry, I could not generate a response.";
            if (choices != null && !choices.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> messageObj = (Map<String, Object>) choices.get(0).get("message");
                if (messageObj != null && messageObj.get("content") != null) {
                    content = messageObj.get("content").toString();
                }
            }

            // Extract usage metadata
            Map<String, Object> metadata = new LinkedHashMap<>();
            if (responseMap.containsKey("usage")) {
                metadata.put("usage", responseMap.get("usage"));
            }
            metadata.put("model", model);
            metadata.put("intent", intent);

            @SuppressWarnings("unchecked")
            Map<String, Object> usage = (Map<String, Object>) responseMap.get("usage");
            int tokenCount = 0;
            if (usage != null && usage.containsKey("total_tokens")) {
                tokenCount = ((Number) usage.get("total_tokens")).intValue();
            }

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
            return buildFallbackResponse(conversationId, latencyMs);
        }
    }

    @Override
    public String classifyIntent(String userMessage) {
        try {
            String classificationPrompt = """
                    你是一个意图分类器。请根据用户消息判断其意图类别。
                    只返回以下三个类别之一（仅返回类别名称，不要附加任何其他文字）：
                    - ordering: 用户想要点单、查看菜单、推荐饮品、修改订单、查询订单状态
                    - general_knowledge: 用户询问门店信息、营业时间、会员、优惠活动等一般性问题
                    - food_safety: 用户反馈食品安全问题，如异物、变质、过敏、卫生问题等
                    
                    用户消息：%s
                    """.formatted(userMessage);

            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", List.of(
                    Map.of("role", "system", "content", "你是意图分类器，只返回类别名称。"),
                    Map.of("role", "user", "content", classificationPrompt)
            ));
            requestBody.put("max_tokens", 20);
            requestBody.put("temperature", 0.1);

            String requestBodyJson = objectMapper.writeValueAsString(requestBody);

            String responseBody = webClient.post()
                    .uri(baseUrl + "/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBodyJson)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(15))
                    .block();

            Map<String, Object> responseMap = objectMapper.readValue(responseBody, new TypeReference<>() {});

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
            if (choices != null && !choices.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> messageObj = (Map<String, Object>) choices.get(0).get("message");
                if (messageObj != null && messageObj.get("content") != null) {
                    String result = messageObj.get("content").toString().trim().toLowerCase();
                    // Normalize: extract just the intent keyword
                    if (result.contains("ordering")) return "ordering";
                    if (result.contains("food_safety")) return "food_safety";
                    return "general_knowledge";
                }
            }

        } catch (Exception e) {
            log.error("Intent classification failed: {}", e.getMessage(), e);
        }

        // Default fallback
        return "general_knowledge";
    }

    /**
     * Build a fallback ChatResponse when the LLM call fails.
     */
    private ChatResponse buildFallbackResponse(String conversationId, long latencyMs) {
        return ChatResponse.builder()
                .conversationId(conversationId)
                .messageId(UUID.randomUUID().toString())
                .content("抱歉，系统暂时无法响应，请稍后再试或转接人工客服。")
                .intent("unknown")
                .role("assistant")
                .metadata(Map.of("error", "LLM call failed", "fallback", true))
                .latencyMs(latencyMs)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
