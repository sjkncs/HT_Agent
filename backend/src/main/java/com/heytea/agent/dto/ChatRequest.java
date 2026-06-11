package com.heytea.agent.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

@Data
public class ChatRequest {

    @NotBlank(message = "消息内容不能为空")
    private String message;

    /** null = new conversation */
    private String conversationId;

    /** optional: ordering / general_knowledge / food_safety */
    private String intent;

    /** extra context (images, etc.) */
    private Map<String, Object> context;
}
