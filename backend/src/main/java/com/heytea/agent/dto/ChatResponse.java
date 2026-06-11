package com.heytea.agent.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class ChatResponse {

    private String conversationId;

    private String messageId;

    private String content;

    private String intent;

    /** always "assistant" */
    private String role;

    /** tool calls, sources, etc. */
    private Map<String, Object> metadata;

    private long latencyMs;

    private LocalDateTime createdAt;
}
