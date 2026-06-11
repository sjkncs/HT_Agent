package com.heytea.agent.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@TableName("message")
public class Message {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String conversationId;

    private String role;

    private String content;

    private String contentType;

    private Integer tokenCount;

    private Integer latencyMs;

    private String metadata;

    private LocalDateTime createdAt;
}
