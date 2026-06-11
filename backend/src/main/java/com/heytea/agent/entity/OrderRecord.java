package com.heytea.agent.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@TableName("order_record")
public class OrderRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String orderNo;

    private String conversationId;

    private Long userId;

    private String storeId;

    private String storeName;

    /**
     * JSON stored as text
     */
    private String items;

    private BigDecimal totalAmount;

    private String status;

    private String paymentStatus;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
