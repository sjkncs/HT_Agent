package com.heytea.agent.service;

import com.heytea.agent.entity.Conversation;
import com.heytea.agent.entity.Message;

import java.util.List;
import java.util.Map;

public interface ConversationService {

    Conversation createConversation(Long userId, String title);

    Conversation getConversation(String conversationId);

    List<Conversation> getUserConversations(Long userId, int limit);

    void updateConversation(Conversation conversation);

    void deleteConversation(String conversationId);

    Message addMessage(String conversationId, String role, String content);

    List<Message> getConversationMessages(String conversationId);

    Map<String, Object> getStats();
}
