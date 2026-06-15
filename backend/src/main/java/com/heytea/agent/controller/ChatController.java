package com.heytea.agent.controller;

import com.heytea.agent.common.Result;
import com.heytea.agent.dto.ChatRequest;
import com.heytea.agent.dto.ChatResponse;
import com.heytea.agent.entity.Conversation;
import com.heytea.agent.entity.Message;
import com.heytea.agent.service.ConversationService;
import com.heytea.agent.service.LLMService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Chat controller — send messages, reload history, and streaming placeholder.
 */
@Slf4j
@RestController
@RequestMapping("/chat")
public class ChatController {

    @Resource
    private ConversationService conversationService;

    @Resource
    private LLMService llmService;

    @Value("${jwt.secret}")
    private String jwtSecret;

    // ──────────────────────────────────────────
    // POST /chat/send
    // ──────────────────────────────────────────

    @PostMapping("/send")
    public Result<ChatResponse> send(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ChatRequest request) {

        Long userId = extractUserIdFromToken(authHeader);
        if (userId == null) {
            return Result.error(401, "Invalid or expired token");
        }

        long startMs = System.currentTimeMillis();

        // 1. Resolve or create conversation
        String conversationId = request.getConversationId();
        Conversation conversation;

        if (conversationId != null && !conversationId.isBlank()) {
            conversation = conversationService.getConversation(conversationId);
            if (conversation == null) {
                return Result.error(404, "Conversation not found");
            }
            if (!conversation.getUserId().equals(userId)) {
                return Result.error(403, "Access denied");
            }
        } else {
            // Create a new conversation via service
            conversation = conversationService.createConversation(userId, truncate(request.getMessage(), 50));
            conversationId = conversation.getId();
        }

        // 2. Save the user message
        conversationService.addMessage(conversationId, "user", request.getMessage());

        // 3. Get conversation history for LLM context
        List<Message> history = conversationService.getConversationMessages(conversationId);

        // 4. Classify intent if not provided
        String intent = request.getIntent();
        if (intent == null || intent.isBlank()) {
            intent = llmService.classifyIntent(request.getMessage());
            log.info("Auto-classified intent: {} for message: {}", intent, truncate(request.getMessage(), 50));

            // 4.1 Intent inheritance: generic messages inherit conversation's prior intent
            //     Solves "人工"/"转人工"/"你好"/"是人工客服吗" etc. defaulting to general_knowledge
            if ("general_knowledge".equals(intent)) {
                String prevIntent = conversation.getIntent();
                String msg = request.getMessage().trim();
                String cleaned = msg.replaceAll("[^\\u4e00-\\u9fffa-zA-Z]", "");
                boolean isGenericMsg = msg.length() <= 8 ||
                        msg.matches("^(人工|转人工|人工客服|人工人工|人工服务|在线客服|你好|在吗|嗯|好|对|是|继续|谢谢|感谢).{0,3}$") ||
                        cleaned.matches(".*(人工|转人工|客服).{0,3}") && cleaned.length() <= 8 ||
                        msg.matches("^.{0,3}(人工客服|在线客服|人工服务).{0,3}$");
                if (isGenericMsg && prevIntent != null && !prevIntent.isBlank()
                        && !"general_knowledge".equals(prevIntent)) {
                    intent = prevIntent;
                    log.info("Intent inherited from conversation: {} (was general_knowledge)", prevIntent);
                }
            }
        }

        // 4.5 Log image evidence if provided (food safety channel)
        if (request.getContext() != null && request.getContext().containsKey("imageUrls")) {
            Object imageUrlsObj = request.getContext().get("imageUrls");
            log.info("Received image evidence for conversation {}: {}", conversationId, imageUrlsObj);
        }

        // 5. Call LLM to generate a response
        ChatResponse chatResponse = llmService.chat(conversationId, request.getMessage(), intent, history);

        long latencyMs = System.currentTimeMillis() - startMs;

        // 6. Save the assistant message
        conversationService.addMessage(conversationId, "assistant", chatResponse.getContent());

        // 7. Update conversation metadata
        conversation.setLastMessage(truncate(chatResponse.getContent(), 100));
        conversation.setIntent(intent);
        conversation.setTurnCount(conversation.getTurnCount() + 1);
        conversationService.updateConversation(conversation);

        log.info("Chat processed — conversation={}, latency={}ms", conversationId, latencyMs);

        // 8. Enrich and return response
        chatResponse.setConversationId(conversationId);
        chatResponse.setIntent(intent);
        chatResponse.setLatencyMs(latencyMs);

        return Result.success(chatResponse);
    }

    // ──────────────────────────────────────────
    // GET /chat/{conversationId}/messages
    // ──────────────────────────────────────────

    @GetMapping("/{conversationId}/messages")
    public Result<List<Message>> messages(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String conversationId) {

        Long userId = extractUserIdFromToken(authHeader);
        if (userId == null) {
            return Result.error(401, "Invalid or expired token");
        }

        Conversation conversation = conversationService.getConversation(conversationId);
        if (conversation == null) {
            return Result.error(404, "Conversation not found");
        }
        if (!conversation.getUserId().equals(userId)) {
            return Result.error(403, "Access denied");
        }

        List<Message> messages = conversationService.getConversationMessages(conversationId);
        return Result.success(messages);
    }

    // ──────────────────────────────────────────
    // GET /chat/{conversationId}/stream
    // ──────────────────────────────────────────

    @GetMapping("/{conversationId}/stream")
    public Result<String> stream(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String conversationId) {

        Long userId = extractUserIdFromToken(authHeader);
        if (userId == null) {
            return Result.error(401, "Invalid or expired token");
        }

        // Placeholder — SSE streaming will be implemented in a future iteration
        return Result.success(
                "SSE streaming endpoint for conversation " + conversationId +
                ". Streaming support will be implemented in a future iteration.");
    }

    // ──────────────────────────────────────────
    // Helper methods
    // ──────────────────────────────────────────

    private String truncate(String text, int maxLen) {
        if (text == null) return "";
        return text.length() > maxLen ? text.substring(0, maxLen) + "..." : text;
    }

    private Long extractUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        try {
            String token = authHeader.substring(7);
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String subject = claims.getSubject();
            return subject != null ? Long.parseLong(subject) : null;
        } catch (Exception e) {
            log.warn("Failed to parse JWT token: {}", e.getMessage());
            return null;
        }
    }
}
