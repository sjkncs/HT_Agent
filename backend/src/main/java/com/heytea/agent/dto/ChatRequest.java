package com.heytea.agent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Map;

@Data
public class ChatRequest {

    @NotBlank(message = "消息内容不能为空")
    @Size(max = 5000, message = "消息长度不能超过5000字")
    private String message;

    /** null = new conversation */
    private String conversationId;

    /** optional: ordering / general_knowledge / food_safety */
    private String intent;

    /** extra context (images, etc.) */
    private Map<String, Object> context;
}
