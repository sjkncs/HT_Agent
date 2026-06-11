package com.heytea.agent.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.heytea.agent.entity.Conversation;
import com.heytea.agent.entity.Message;
import com.heytea.agent.mapper.ConversationMapper;
import com.heytea.agent.mapper.MessageMapper;
import com.heytea.agent.service.ConversationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationServiceImpl implements ConversationService {

    private final ConversationMapper conversationMapper;
    private final MessageMapper messageMapper;

    @Override
    @Transactional
    public Conversation createConversation(Long userId, String title) {
        Conversation conversation = Conversation.builder()
                .id(UUID.randomUUID().toString().replace("-", ""))
                .userId(userId)
                .title(title != null ? title : "New Conversation")
                .turnCount(0)
                .riskLevel("low")
                .sessionState("active")
                .handler("AI")
                .slaStatus("normal")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        conversationMapper.insert(conversation);
        log.info("Created conversation {} for user {}", conversation.getId(), userId);
        return conversation;
    }

    @Override
    public Conversation getConversation(String conversationId) {
        Conversation conversation = conversationMapper.selectById(conversationId);
        if (conversation == null) {
            throw new RuntimeException("Conversation not found: " + conversationId);
        }
        return conversation;
    }

    @Override
    public List<Conversation> getUserConversations(Long userId, int limit) {
        LambdaQueryWrapper<Conversation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Conversation::getUserId, userId)
               .orderByDesc(Conversation::getCreatedAt)
               .last("LIMIT " + Math.max(1, limit));
        return conversationMapper.selectList(wrapper);
    }

    @Override
    @Transactional
    public void updateConversation(Conversation conversation) {
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationMapper.updateById(conversation);
    }

    @Override
    @Transactional
    public void deleteConversation(String conversationId) {
        // Messages are cascade-deleted by the foreign key constraint
        conversationMapper.deleteById(conversationId);
        log.info("Deleted conversation {}", conversationId);
    }

    @Override
    @Transactional
    public Message addMessage(String conversationId, String role, String content) {
        Message message = Message.builder()
                .conversationId(conversationId)
                .role(role)
                .content(content)
                .contentType("text")
                .createdAt(LocalDateTime.now())
                .build();

        messageMapper.insert(message);

        // Update conversation metadata
        Conversation conversation = conversationMapper.selectById(conversationId);
        if (conversation != null) {
            conversation.setLastMessage(content.length() > 200 ? content.substring(0, 200) + "..." : content);
            conversation.setTurnCount(conversation.getTurnCount() + 1);
            conversation.setUpdatedAt(LocalDateTime.now());
            conversationMapper.updateById(conversation);
        }

        log.debug("Added {} message to conversation {}", role, conversationId);
        return message;
    }

    @Override
    public List<Message> getConversationMessages(String conversationId) {
        LambdaQueryWrapper<Message> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Message::getConversationId, conversationId)
               .orderByAsc(Message::getCreatedAt);
        return messageMapper.selectList(wrapper);
    }

    @Override
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();

        // Total conversations
        Long totalConversations = conversationMapper.selectCount(null);
        stats.put("totalConversations", totalConversations);

        // Count by intent
        Map<String, Long> byIntent = new HashMap<>();
        for (String intent : List.of("ordering", "general_knowledge", "food_safety")) {
            LambdaQueryWrapper<Conversation> intentWrapper = new LambdaQueryWrapper<>();
            intentWrapper.eq(Conversation::getIntent, intent);
            byIntent.put(intent, conversationMapper.selectCount(intentWrapper));
        }
        stats.put("byIntent", byIntent);

        // Count by risk level
        Map<String, Long> byRiskLevel = new HashMap<>();
        for (String risk : List.of("high", "medium", "low")) {
            LambdaQueryWrapper<Conversation> riskWrapper = new LambdaQueryWrapper<>();
            riskWrapper.eq(Conversation::getRiskLevel, risk);
            byRiskLevel.put(risk, conversationMapper.selectCount(riskWrapper));
        }
        stats.put("byRiskLevel", byRiskLevel);

        // Count by session state
        Map<String, Long> bySessionState = new HashMap<>();
        for (String state : List.of("active", "closed", "escalated")) {
            LambdaQueryWrapper<Conversation> stateWrapper = new LambdaQueryWrapper<>();
            stateWrapper.eq(Conversation::getSessionState, state);
            bySessionState.put(state, conversationMapper.selectCount(stateWrapper));
        }
        stats.put("bySessionState", bySessionState);

        // Total messages
        Long totalMessages = messageMapper.selectCount(null);
        stats.put("totalMessages", totalMessages);

        return stats;
    }
}
