-- ============================================================
-- 喜茶智能客服 Agent — 数据库初始化脚本
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS heytea_agent
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE heytea_agent;

-- ── 用户表 ──
CREATE TABLE IF NOT EXISTS sys_user (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(64)  NOT NULL UNIQUE COMMENT '登录用户名',
    password    VARCHAR(255) NOT NULL COMMENT 'BCrypt 加密密码',
    nickname    VARCHAR(64)  COMMENT '显示名称',
    role        VARCHAR(32)  NOT NULL DEFAULT 'consumer' COMMENT '角色: consumer/agent/admin',
    avatar_url  VARCHAR(512) COMMENT '头像URL',
    status      TINYINT      NOT NULL DEFAULT 1 COMMENT '1=正常 0=禁用',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB COMMENT='系统用户';

-- ── 对话表 ──
CREATE TABLE IF NOT EXISTS conversation (
    id              VARCHAR(64) PRIMARY KEY COMMENT '会话ID (UUID)',
    user_id         BIGINT      NOT NULL COMMENT '所属用户ID',
    title           VARCHAR(255) COMMENT '对话标题（自动生成）',
    last_message    TEXT         COMMENT '最后一条消息摘要',
    intent          VARCHAR(64)  COMMENT '检测到的意图: ordering/general_knowledge/food_safety',
    label           VARCHAR(128) COMMENT '分类标签',
    risk_level      VARCHAR(16)  DEFAULT 'low' COMMENT '风险等级: high/medium/low',
    session_state   VARCHAR(32)  DEFAULT 'active' COMMENT '会话状态: active/closed/escalated',
    handler         VARCHAR(32)  DEFAULT 'AI' COMMENT '处理人: AI/人工',
    turn_count      INT          DEFAULT 0 COMMENT '对话轮数',
    sla_status      VARCHAR(16)  DEFAULT 'normal' COMMENT 'SLA状态: normal/warning/breached',
    classification  JSON         COMMENT '分类结果 JSON',
    metadata        JSON         COMMENT '扩展元数据',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_intent (intent),
    INDEX idx_risk (risk_level),
    INDEX idx_state (session_state),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES sys_user(id)
) ENGINE=InnoDB COMMENT='对话记录';

-- ── 消息表 ──
CREATE TABLE IF NOT EXISTS message (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id VARCHAR(64)  NOT NULL COMMENT '所属会话ID',
    role            VARCHAR(16)  NOT NULL COMMENT '角色: user/assistant/system',
    content         LONGTEXT     NOT NULL COMMENT '消息内容',
    content_type    VARCHAR(32)  DEFAULT 'text' COMMENT '内容类型: text/image/markdown',
    token_count     INT          COMMENT 'Token 消耗数',
    latency_ms      INT          COMMENT '响应延迟(ms)',
    metadata        JSON         COMMENT '扩展信息（工具调用、引用来源等）',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conv_id (conversation_id),
    INDEX idx_role (role),
    INDEX idx_created (created_at),
    FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='对话消息';

-- ── 订单记录表 ──
CREATE TABLE IF NOT EXISTS order_record (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no        VARCHAR(64)  NOT NULL UNIQUE COMMENT '订单号',
    conversation_id VARCHAR(64)  COMMENT '关联会话ID',
    user_id         BIGINT       NOT NULL COMMENT '下单用户ID',
    store_id        VARCHAR(64)  COMMENT '门店ID',
    store_name      VARCHAR(128) COMMENT '门店名称',
    items           JSON         NOT NULL COMMENT '商品明细 JSON',
    total_amount    DECIMAL(10,2) COMMENT '订单金额',
    status          VARCHAR(32)  DEFAULT 'pending' COMMENT '状态: pending/confirmed/preparing/completed/cancelled',
    payment_status  VARCHAR(16)  DEFAULT 'unpaid' COMMENT '支付状态: unpaid/paid/refunded',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_conv (conversation_id),
    INDEX idx_status (status),
    FOREIGN KEY (conversation_id) REFERENCES conversation(id),
    FOREIGN KEY (user_id) REFERENCES sys_user(id)
) ENGINE=InnoDB COMMENT='订单记录';

-- ── 食品安全工单表 ──
CREATE TABLE IF NOT EXISTS food_safety_case (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_no         VARCHAR(64)  NOT NULL UNIQUE COMMENT '工单号',
    conversation_id VARCHAR(64)  COMMENT '关联会话ID',
    user_id         BIGINT       NOT NULL COMMENT '投诉用户ID',
    category        VARCHAR(64)  NOT NULL COMMENT '问题分类: 外源性异物/内源性异物/变质/过敏/其他',
    description     TEXT         NOT NULL COMMENT '问题描述',
    risk_level      VARCHAR(16)  NOT NULL DEFAULT 'medium' COMMENT '风险等级: high/medium/low',
    status          VARCHAR(32)  DEFAULT 'open' COMMENT '状态: open/investigating/resolved/closed',
    handler_id      BIGINT       COMMENT '处理人ID',
    resolution      TEXT         COMMENT '处理结果',
    compensation    JSON         COMMENT '赔偿方案 JSON',
    sla_deadline    DATETIME     COMMENT 'SLA 截止时间',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_conv (conversation_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_risk (risk_level),
    INDEX idx_category (category),
    FOREIGN KEY (conversation_id) REFERENCES conversation(id),
    FOREIGN KEY (user_id) REFERENCES sys_user(id)
) ENGINE=InnoDB COMMENT='食品安全工单';

-- ── 审计日志表 ──
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       COMMENT '操作用户',
    action      VARCHAR(64)  NOT NULL COMMENT '操作类型',
    target_type VARCHAR(64)  COMMENT '操作对象类型',
    target_id   VARCHAR(128) COMMENT '操作对象ID',
    detail      JSON         COMMENT '操作详情',
    ip_address  VARCHAR(64)  COMMENT 'IP 地址',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB COMMENT='审计日志';

-- ── 初始数据：默认管理员 ──
INSERT IGNORE INTO sys_user (username, password, nickname, role) VALUES
  ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '系统管理员', 'admin'),
  ('agent01', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '客服小王', 'agent');
