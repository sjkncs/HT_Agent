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
@TableName("food_safety_case")
public class FoodSafetyCase {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String caseNo;

    private String conversationId;

    private Long userId;

    private String category;

    private String description;

    private String riskLevel;

    private String status;

    private Long handlerId;

    private String resolution;

    /**
     * JSON stored as text
     */
    private String compensation;

    private LocalDateTime slaDeadline;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
