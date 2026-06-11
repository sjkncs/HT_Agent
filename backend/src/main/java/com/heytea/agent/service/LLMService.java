package com.heytea.agent.service;

import com.heytea.agent.dto.ChatResponse;
import com.heytea.agent.entity.Message;

import java.util.List;

public interface LLMService {

    ChatResponse chat(String conversationId, String userMessage, String intent, List<Message> history);

    String classifyIntent(String userMessage);
}
