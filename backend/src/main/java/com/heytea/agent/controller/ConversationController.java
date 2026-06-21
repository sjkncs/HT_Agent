package com.heytea.agent.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.heytea.agent.common.Result;
import com.heytea.agent.entity.Conversation;
import com.heytea.agent.entity.Message;
import com.heytea.agent.mapper.ConversationMapper;
import com.heytea.agent.mapper.MessageMapper;
import com.heytea.agent.util.JwtUtil;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Conversation controller — list, detail, delete, and statistics.
 */
@Slf4j
@RestController
@RequestMapping("/conversations")
public class ConversationController {

    @Resource
    private ConversationMapper conversationMapper;

    @Resource
    private MessageMapper messageMapper;

    @Value("${jwt.secret}")
    private String jwtSecret;

    // ──────────────────────────────────────────
    // GET /conversations
    // ──────────────────────────────────────────

    @GetMapping
    public Result<IPage<Conversation>> list(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String intent,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String status) {

        Long userId = JwtUtil.extractUserId(authHeader, jwtSecret);
        if (userId == null) {
            return Result.error(401, "Invalid or expired token");
        }

        LambdaQueryWrapper<Conversation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Conversation::getUserId, userId);

        if (StringUtils.hasText(intent)) {
            wrapper.eq(Conversation::getIntent, intent);
        }
        if (StringUtils.hasText(riskLevel)) {
            wrapper.eq(Conversation::getRiskLevel, riskLevel);
        }
        if (StringUtils.hasText(status)) {
            wrapper.eq(Conversation::getSessionState, status);
        }

        wrapper.orderByDesc(Conversation::getUpdatedAt);

        IPage<Conversation> result = conversationMapper.selectPage(
                new Page<>(page, size), wrapper);

        return Result.success(result);
    }

    // ──────────────────────────────────────────
    // GET /conversations/{id}
    // ──────────────────────────────────────────

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id) {

        Long userId = JwtUtil.extractUserId(authHeader, jwtSecret);
        if (userId == null) {
            return Result.error(401, "Invalid or expired token");
        }

        Conversation conversation = conversationMapper.selectById(id);
        if (conversation == null) {
            return Result.error(404, "Conversation not found");
        }
        if (!conversation.getUserId().equals(userId)) {
            return Result.error(403, "Access denied");
        }

        // Fetch all messages belonging to this conversation
        LambdaQueryWrapper<Message> msgWrapper = new LambdaQueryWrapper<>();
        msgWrapper.eq(Message::getConversationId, id)
                  .orderByAsc(Message::getCreatedAt);
        List<Message> messages = messageMapper.selectList(msgWrapper);

        Map<String, Object> detail = new HashMap<>();
        detail.put("conversation", conversation);
        detail.put("messages", messages);

        return Result.success(detail);
    }

    // ──────────────────────────────────────────
    // DELETE /conversations/{id}
    // ──────────────────────────────────────────

    @DeleteMapping("/{id}")
    public Result<Void> delete(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String id) {

        Long userId = JwtUtil.extractUserId(authHeader, jwtSecret);
        if (userId == null) {
            return Result.error(401, "Invalid or expired token");
        }

        Conversation conversation = conversationMapper.selectById(id);
        if (conversation == null) {
            return Result.error(404, "Conversation not found");
        }
        if (!conversation.getUserId().equals(userId)) {
            return Result.error(403, "Access denied");
        }

        // Delete associated messages first, then the conversation
        LambdaQueryWrapper<Message> msgWrapper = new LambdaQueryWrapper<>();
        msgWrapper.eq(Message::getConversationId, id);
        messageMapper.delete(msgWrapper);

        conversationMapper.deleteById(id);
        log.info("Conversation {} deleted by user {}", id, userId);

        return Result.success();
    }

    // ──────────────────────────────────────────
    // GET /conversations/stats
    // ──────────────────────────────────────────

    @GetMapping("/stats")
    public Result<Map<String, Object>> stats(
            @RequestHeader("Authorization") String authHeader) {

        Long userId = JwtUtil.extractUserId(authHeader, jwtSecret);
        if (userId == null) {
            return Result.error(401, "Invalid or expired token");
        }

        LambdaQueryWrapper<Conversation> baseWrapper = new LambdaQueryWrapper<>();
        baseWrapper.eq(Conversation::getUserId, userId);

        long total = conversationMapper.selectCount(baseWrapper);

        // Active conversations
        LambdaQueryWrapper<Conversation> activeWrapper = new LambdaQueryWrapper<>();
        activeWrapper.eq(Conversation::getUserId, userId)
                     .eq(Conversation::getSessionState, "active");
        long activeCount = conversationMapper.selectCount(activeWrapper);

        // Closed conversations
        LambdaQueryWrapper<Conversation> closedWrapper = new LambdaQueryWrapper<>();
        closedWrapper.eq(Conversation::getUserId, userId)
                     .eq(Conversation::getSessionState, "closed");
        long closedCount = conversationMapper.selectCount(closedWrapper);

        // Escalated conversations
        LambdaQueryWrapper<Conversation> escalatedWrapper = new LambdaQueryWrapper<>();
        escalatedWrapper.eq(Conversation::getUserId, userId)
                        .eq(Conversation::getSessionState, "escalated");
        long escalatedCount = conversationMapper.selectCount(escalatedWrapper);

        // High-risk conversations
        LambdaQueryWrapper<Conversation> highRiskWrapper = new LambdaQueryWrapper<>();
        highRiskWrapper.eq(Conversation::getUserId, userId)
                       .eq(Conversation::getRiskLevel, "high");
        long highRiskCount = conversationMapper.selectCount(highRiskWrapper);

        Map<String, Object> statsMap = new HashMap<>();
        statsMap.put("total", total);
        statsMap.put("active", activeCount);
        statsMap.put("closed", closedCount);
        statsMap.put("escalated", escalatedCount);
        statsMap.put("highRisk", highRiskCount);

        return Result.success(statsMap);
    }
}
