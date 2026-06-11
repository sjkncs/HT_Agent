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
@TableName("conversation")
public class Conversation {

    @TableId(type = IdType.INPUT)
    private String id;

    private Long userId;

    private String title;

    private String lastMessage;

    private String intent;

    private String label;

    private String riskLevel;

    private String sessionState;

    private String handler;

    private Integer turnCount;

    private String slaStatus;

    /**
     * JSON stored as text
     */
    private String classification;

    private String metadata;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
