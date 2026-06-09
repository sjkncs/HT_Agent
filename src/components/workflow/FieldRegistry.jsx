import { useState, useMemo } from 'react'
import {
  Database, ArrowRight, ArrowDown, Search, Filter, ChevronDown, ChevronRight,
  FileText, Image, ExternalLink, CheckCircle2, Clock,
  GitBranch, Zap, BookOpen, Tag, Server
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// Field Registry Data — Complete Coze Workflow Field Definitions
// ═══════════════════════════════════════════════════════════════════════════

const WORKFLOW_META = {
  aiqc_v2: {
    id: 'aiqc_v2',
    name: 'AIQC_V2 质检工作流',
    version: '2.0',
    description: '多模型多阶段质检，对齐 Coze AIQC_V2 架构（7 节点 · 3 模型）',
    platform: 'Coze (扣子)',
    qiyu_url: 'https://heytea.qiyukf.com/madmin/session/history',
  },
  order_processing: {
    id: 'order_processing',
    name: '客服订单处理工作流',
    version: '1.0',
    description: '5 路意图分支订单处理（11 节点 · 豆包 Pro）',
    platform: 'Coze (扣子)',
    qiyu_url: 'https://heytea.qiyukf.com/madmin/session/history',
  },
}

const FIELD_REGISTRY = [
  // ─── AIQC_V2: 输入字段 (COZE_FIELD_MAP) ───
  { id: 'CONTENT_INPUT', name: '对话完整内容', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: true, desc: '多轮对话拼接后的完整文本', coze_var: 'CONTENT_INPUT', qiyu_field: 'session_content', qiyu_status: 'mapped' },
  { id: 'CONVERSATION_ID', name: '会话唯一标识', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: true, desc: '七鱼会话 ID，用于追踪关联', coze_var: 'CONVERSATION_ID', qiyu_field: 'session_id', qiyu_status: 'mapped' },
  { id: 'AGENT_NAME', name: '客服坐席名称', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: '当班客服姓名', coze_var: 'AGENT_NAME', qiyu_field: 'staff_name', qiyu_status: 'mapped' },
  { id: 'CUSTOMER_NAME', name: '顾客姓名', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: '顾客注册名或昵称', coze_var: 'CUSTOMER_NAME', qiyu_field: 'user_name', qiyu_status: 'mapped' },
  { id: 'CUSTOMER_TP', name: '顾客类型标签', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: 'VIP / 普通 / 新客等', coze_var: 'CUSTOMER_TP', qiyu_field: 'user_tag', qiyu_status: 'mapped' },
  { id: 'CUSTOMER_PHONE', name: '顾客手机号', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: '脱敏手机号', coze_var: 'CUSTOMER_PHONE', qiyu_field: 'user_phone', qiyu_status: 'mapped' },
  { id: 'TK_INPUT', name: '工单输入文本', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: '工单备注或客服录入', coze_var: 'TK_INPUT', qiyu_field: 'ticket_content', qiyu_status: 'mapped' },
  { id: 'TK_ID', name: '工单 ID', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: '七鱼工单编号', coze_var: 'TK_ID', qiyu_field: 'ticket_id', qiyu_status: 'mapped' },
  { id: 'TK_TP', name: '工单类型', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: '投诉 / 咨询 / 售后等', coze_var: 'TK_TP', qiyu_field: 'ticket_type', qiyu_status: 'mapped' },
  { id: 'CategoryLabel', name: '分类标签', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: '食安/异物 等预分类', coze_var: 'CategoryLabel', qiyu_field: 'category', qiyu_status: 'mapped' },
  { id: 'Order', name: '订单号', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: '关联订单编号', coze_var: 'Order', qiyu_field: 'order_id', qiyu_status: 'mapped' },
  { id: 'Store', name: '门店名称', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: '涉事门店', coze_var: 'Store', qiyu_field: 'store_name', qiyu_status: 'mapped' },
  { id: 'product', name: '产品名称', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: '涉及产品', coze_var: 'product', qiyu_field: 'product_name', qiyu_status: 'mapped' },
  { id: 'START_TIME', name: '会话开始时间', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: 'ISO 时间戳', coze_var: 'START_TIME', qiyu_field: 'session_start', qiyu_status: 'mapped' },
  { id: 'SM', name: '门店经理 / SM', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: '门店经理信息', coze_var: 'SM', qiyu_field: 'store_manager', qiyu_status: 'mapped' },
  { id: 'SOP', name: 'SOP 参考规则', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: '匹配的 SOP 规则文本', coze_var: 'SOP', qiyu_field: '', qiyu_status: 'pending' },
  { id: 'HAS_NOT_TOPPED', name: '是否未停止', type: 'boolean', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: '持续对话标记', coze_var: 'HAS_NOT_TOPPED', qiyu_field: '', qiyu_status: 'pending' },
  { id: 'OT', name: '加班/超时标记', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: '客服超时标记', coze_var: 'OT', qiyu_field: '', qiyu_status: 'pending' },
  { id: 'CSAT', name: '客户满意度评分', type: 'string', direction: 'input', workflow: 'aiqc_v2', node: '开始 (Node 1)', required: false, desc: '1-5 分', coze_var: 'CSAT', qiyu_field: 'satisfaction', qiyu_status: 'mapped' },

  // ─── AIQC_V2: 中间变量 (Node 2 输出) ───
  { id: 'normalized', name: '标准化输入', type: 'object', direction: 'intermediate', workflow: 'aiqc_v2', node: '开始 → 对话解构', required: false, desc: 'Node 1 标准化后的输入对象', coze_var: 'normalized', qiyu_field: '', qiyu_status: 'internal' },
  { id: 'to_block5_scene', name: '场景摘要（传红线）', type: 'string', direction: 'intermediate', workflow: 'aiqc_v2', node: '对话解构 (Node 2)', required: false, desc: '传给红线检测的场景上下文', coze_var: 'to_block5_scene', qiyu_field: '', qiyu_status: 'internal' },
  { id: 'to_block6_issue', name: '问题标记（传结案）', type: 'string', direction: 'intermediate', workflow: 'aiqc_v2', node: '对话解构 (Node 2)', required: false, desc: '标记核心问题类型', coze_var: 'to_block6_issue', qiyu_field: '', qiyu_status: 'internal' },
  { id: 'process_trace', name: '处理轨迹', type: 'object', direction: 'intermediate', workflow: 'aiqc_v2', node: '对话解构 (Node 2)', required: false, desc: '各阶段处理记录链', coze_var: 'process_trace', qiyu_field: '', qiyu_status: 'internal' },
  { id: 'Dc_check', name: '数据完整性校验', type: 'object', direction: 'intermediate', workflow: 'aiqc_v2', node: '对话解构 (Node 2)', required: false, desc: '输入数据缺失项标记', coze_var: 'Dc_check', qiyu_field: '', qiyu_status: 'internal' },

  // ─── AIQC_V2: Node 2 核心输出 ───
  { id: 'sq3', name: '对话解构结果', type: 'object', direction: 'output', workflow: 'aiqc_v2', node: '对话解构 (Node 2)', required: true, desc: '食安问题识别、情绪分析、关键信息提取', coze_var: 'sq3', qiyu_field: 'deconstruct_result', qiyu_status: 'mapped' },
  { id: 'sq1', name: '四维质检评分', type: 'object', direction: 'output', workflow: 'aiqc_v2', node: '对话解构 (Node 2)', required: true, desc: '理解能力/响应速度/解决能力/服务态度 达标/不达标', coze_var: 'sq1', qiyu_field: 'qc_4dim', qiyu_status: 'mapped' },
  { id: 'sq2', name: '优化建议', type: 'string', direction: 'output', workflow: 'aiqc_v2', node: '对话解构 (Node 2)', required: false, desc: '仅不达标时生成的改进建议', coze_var: 'sq2', qiyu_field: 'improvement', qiyu_status: 'mapped' },
  { id: 'cont_js', name: '综合摘要', type: 'object', direction: 'output', workflow: 'aiqc_v2', node: '对话解构 (Node 2)', required: true, desc: '融合 sq3+sq1+sq2+分类+情绪的结论', coze_var: 'cont_js', qiyu_field: 'summary', qiyu_status: 'mapped' },

  // ─── AIQC_V2: Node 3 工单操作专家输出 ───
  { id: 'sqm1', name: '工单合规判定', type: 'string', direction: 'output', workflow: 'aiqc_v2', node: '工单操作专家 (Node 3)', required: true, desc: '合规 / 不合规', coze_var: 'sqm1', qiyu_field: 'biz_compliance', qiyu_status: 'mapped' },
  { id: 'sqm2', name: '工单补充说明', type: 'string', direction: 'output', workflow: 'aiqc_v2', node: '工单操作专家 (Node 3)', required: false, desc: '合规判定的补充理由', coze_var: 'sqm2', qiyu_field: 'biz_remark', qiyu_status: 'mapped' },

  // ─── AIQC_V2: Node 4 分类质检输出 ───
  { id: 'qc1', name: '分类质检判定', type: 'string', direction: 'output', workflow: 'aiqc_v2', node: '分类质检 (Node 4)', required: true, desc: '分类正确 / 分类错误', coze_var: 'qc1', qiyu_field: 'classification_qc', qiyu_status: 'mapped' },
  { id: 'qc2', name: '分类质检详情', type: 'string', direction: 'output', workflow: 'aiqc_v2', node: '分类质检 (Node 4)', required: false, desc: '分类判定依据说明', coze_var: 'qc2', qiyu_field: 'classification_detail', qiyu_status: 'mapped' },

  // ─── AIQC_V2: Node 5 红线检测输出 ───
  { id: 'is_violate', name: '红线违规标记', type: 'boolean', direction: 'output', workflow: 'aiqc_v2', node: '红线检测 (Node 5)', required: true, desc: 'true=触发红线 / false=正常', coze_var: 'is_violate', qiyu_field: 'redline_flag', qiyu_status: 'mapped' },
  { id: 'violation_type', name: '违规类型', type: 'string', direction: 'output', workflow: 'aiqc_v2', node: '红线检测 (Node 5)', required: false, desc: '6 类红线之一', coze_var: 'violation_type', qiyu_field: 'violation_category', qiyu_status: 'mapped' },
  { id: 'violation_behavior', name: '违规行为描述', type: 'string', direction: 'output', workflow: 'aiqc_v2', node: '红线检测 (Node 5)', required: false, desc: '具体违规行为', coze_var: 'violation_behavior', qiyu_field: 'violation_desc', qiyu_status: 'mapped' },
  { id: 'violation_quote', name: '违规原文引用', type: 'string', direction: 'output', workflow: 'aiqc_v2', node: '红线检测 (Node 5)', required: false, desc: '触发红线的客服原话', coze_var: 'violation_quote', qiyu_field: 'violation_quote', qiyu_status: 'mapped' },
  { id: 'risk_flag', name: '风险标记', type: 'string', direction: 'intermediate', workflow: 'aiqc_v2', node: '红线报警器 (Node 5.5)', required: false, desc: 'continue_to_conclusion / red_line_alert_triggered', coze_var: 'risk_flag', qiyu_field: '', qiyu_status: 'internal' },

  // ─── AIQC_V2: Node 6 结案输出 ───
  { id: 'reasoning_content', name: '推理过程', type: 'string', direction: 'output', workflow: 'aiqc_v2', node: '结案 (Node 6)', required: false, desc: '深度思考链式推理过程', coze_var: 'reasoning_content', qiyu_field: '', qiyu_status: 'pending' },
  { id: 'final_result', name: '最终结果', type: 'object', direction: 'output', workflow: 'aiqc_v2', node: '结案 (Node 6)', required: true, desc: '汇总所有质检维度的最终输出', coze_var: 'final_result', qiyu_field: 'aiqc_result', qiyu_status: 'mapped' },

  // ─── 订单处理工作流: 输入字段 ───
  { id: 'op_userInput', name: '用户输入', type: 'string', direction: 'input', workflow: 'order_processing', node: '开始 (Node A)', required: true, desc: '顾客当前消息文本', coze_var: 'userInput', qiyu_field: 'user_message', qiyu_status: 'mapped' },
  { id: 'op_conversation', name: '会话上下文', type: 'string', direction: 'input', workflow: 'order_processing', node: '开始 (Node A)', required: false, desc: '历史会话 ID', coze_var: 'conversation', qiyu_field: 'session_id', qiyu_status: 'mapped' },
  { id: 'op_orderId', name: '订单号', type: 'string', direction: 'input', workflow: 'order_processing', node: '开始 (Node A)', required: false, desc: '关联订单编号', coze_var: 'orderId', qiyu_field: 'order_id', qiyu_status: 'mapped' },

  // ─── 订单处理: 中间变量 ───
  { id: 'op_order_info', name: '订单查询结果', type: 'object', direction: 'intermediate', workflow: 'order_processing', node: '查询订单 (Node B)', required: false, desc: '{ order_id, status, number } 从 DB 查询', coze_var: 'orderInfo', qiyu_field: '', qiyu_status: 'internal' },
  { id: 'op_scene', name: '意图场景', type: 'string', direction: 'intermediate', workflow: 'order_processing', node: '意图识别 (Node C)', required: true, desc: '5 类场景之一', coze_var: 'scene', qiyu_field: '', qiyu_status: 'internal' },
  { id: 'op_branch_result', name: '分支处理结果', type: 'object', direction: 'intermediate', workflow: 'order_processing', node: '分支处理 (Node E)', required: true, desc: '{ reply, compensate, amount, ticket }', coze_var: 'branchResult', qiyu_field: '', qiyu_status: 'internal' },

  // ─── 订单处理: 输出字段 ───
  { id: 'op_output', name: '回复内容', type: 'string', direction: 'output', workflow: 'order_processing', node: '结束 (Node G)', required: true, desc: '聚合后的客服回复文本', coze_var: 'output', qiyu_field: 'agent_reply', qiyu_status: 'mapped' },
  { id: 'op_out_scene', name: '匹配场景', type: 'string', direction: 'output', workflow: 'order_processing', node: '结束 (Node G)', required: true, desc: '不满足制作时效/没叫号/叫号没完成/超预计时间/其他', coze_var: 'scene', qiyu_field: 'intent_scene', qiyu_status: 'mapped' },
  { id: 'op_out_order_id', name: '订单号', type: 'string', direction: 'output', workflow: 'order_processing', node: '结束 (Node G)', required: true, desc: '关联订单 ID', coze_var: 'order_id', qiyu_field: 'order_id', qiyu_status: 'mapped' },
  { id: 'op_out_status', name: '订单状态', type: 'string', direction: 'output', workflow: 'order_processing', node: '结束 (Node G)', required: true, desc: '制作中/待取餐/配送中/已完成', coze_var: 'order_status', qiyu_field: 'order_status', qiyu_status: 'mapped' },
  { id: 'op_out_queue', name: '排队号', type: 'number', direction: 'output', workflow: 'order_processing', node: '结束 (Node G)', required: false, desc: '前方等待单数', coze_var: 'queue_number', qiyu_field: 'queue_position', qiyu_status: 'mapped' },
  { id: 'op_out_compensate', name: '是否补偿', type: 'boolean', direction: 'output', workflow: 'order_processing', node: '结束 (Node G)', required: false, desc: '是否触发补偿方案', coze_var: 'compensate', qiyu_field: 'compensation', qiyu_status: 'mapped' },
  { id: 'op_out_amount', name: '补偿金额', type: 'number', direction: 'output', workflow: 'order_processing', node: '结束 (Node G)', required: false, desc: '补偿金额（元）', coze_var: 'compensate_amount', qiyu_field: 'compensate_amount', qiyu_status: 'mapped' },
  { id: 'op_out_ticket', name: '工单号', type: 'string', direction: 'output', workflow: 'order_processing', node: '结束 (Node G)', required: false, desc: '自动创建的跟进工单', coze_var: 'ticket', qiyu_field: 'follow_up_ticket', qiyu_status: 'mapped' },
  { id: 'op_out_trace', name: '执行轨迹', type: 'array', direction: 'output', workflow: 'order_processing', node: '结束 (Node G)', required: false, desc: '各节点执行记录', coze_var: 'trace', qiyu_field: '', qiyu_status: 'pending' },
]

const INTENT_SCENES = [
  { id: 'unmet_deadline', name: '不满足制作时效/未优先', priority: 1, keywords: ['催单', '怎么还没好', '太慢了', '多久', '还要等', '制作', '优先', '等了很久', '加急'] },
  { id: 'no_call_number', name: '没叫号', priority: 2, keywords: ['没叫号', '没有叫', '不叫号', '怎么没叫', '忘记叫号', '漏叫'] },
  { id: 'call_incomplete', name: '叫号没完成', priority: 3, keywords: ['叫号没完成', '叫了没做', '叫号了但是', '叫了号没取', '叫号没取餐'] },
  { id: 'over_estimated_time', name: '超预计时间', priority: 4, keywords: ['超时', '超预计', '预计时间', '比说的久', '说好', '超过了'] },
  { id: 'other', name: '其他', priority: 5, keywords: ['转人工', '投诉', '其他问题', '退款'] },
]

const WORKFLOW_CONNECTIONS = [
  { from: '开始 (1)', to: '对话解构 (2)', data: 'normalized_input', workflow: 'aiqc_v2' },
  { from: '对话解构 (2)', to: '工单操作专家 (3)', data: 'sq3 + process_trace', workflow: 'aiqc_v2' },
  { from: '对话解构 (2)', to: '分类质检 (4)', data: 'scene_context', workflow: 'aiqc_v2' },
  { from: '对话解构 (2)', to: '红线检测 (5)', data: 'to_block5_scene + process_trace', workflow: 'aiqc_v2' },
  { from: '工单操作专家 (3)', to: '结案 (6)', data: 'sqm1 + sqm2', workflow: 'aiqc_v2' },
  { from: '分类质检 (4)', to: '结案 (6)', data: 'qc1 + qc2', workflow: 'aiqc_v2' },
  { from: '红线检测 (5)', to: '红线报警器 (5.5)', data: 'is_violate', workflow: 'aiqc_v2' },
  { from: '红线报警器 (5.5)', to: '结案 (6)', data: 'risk_flag (pass-through)', workflow: 'aiqc_v2' },
  { from: '对话解构 (2)', to: '结案 (6)', data: 'sq1 + sq2 + sq3 + cont_js', workflow: 'aiqc_v2' },
  { from: '开始 (A)', to: '查询订单 (B)', data: 'orderId', workflow: 'order_processing' },
  { from: '查询订单 (B)', to: '意图识别 (C)', data: 'orderInfo + userInput', workflow: 'order_processing' },
  { from: '意图识别 (C)', to: '判断意图 (D)', data: 'scene', workflow: 'order_processing' },
  { from: '判断意图 (D)', to: '分支处理 (E1-E5)', data: 'scene → branch', workflow: 'order_processing' },
  { from: '分支处理 (E)', to: '聚合 (F)', data: 'branchResult', workflow: 'order_processing' },
  { from: '聚合 (F)', to: '结束 (G)', data: 'output + scene + order_id', workflow: 'order_processing' },
]

const DB_TABLES = [
  {
    id: 'reading_notes_966025',
    name: '订单相关表',
    description: '存储订单基本信息，用于工作流中查询订单状态与排队情况',
    used_in: ['order_processing'],
    columns: [
      { name: 'id', desc: '数据的唯一标识（主键）', type: 'Integer', indexed: true, required: true },
      { name: 'sys_platform', desc: '数据产生或使用的渠道', type: 'String', indexed: false, required: true },
      { name: 'uuid', desc: '用户唯一标识，由系统生成', type: 'String', indexed: false, required: true },
      { name: 'bstudio_create_time', desc: '数据插入的时间', type: 'Time', indexed: false, required: true },
      { name: 'order_id', desc: '订单编号，数据的唯一标识', type: 'String', indexed: false, required: true },
      { name: 'status', desc: '订单状态', type: 'String', indexed: false, required: true },
      { name: 'number', desc: '前面订单数量', type: 'Integer', indexed: false, required: true },
    ],
  },
  {
    id: 'cat_sm_111104_213002',
    name: '分类定义与服务小计',
    description: '根据字段填写与服务小计，匹配分类定义，判断标准',
    used_in: ['aiqc_v2'],
    columns: [
      { name: 'id', desc: '数据的唯一标识（主键）', type: 'Integer', indexed: true, required: true },
      { name: 'sys_platform', desc: '数据产生或使用的渠道', type: 'String', indexed: false, required: true },
      { name: 'uuid', desc: '用户唯一标识，由系统生成', type: 'String', indexed: false, required: true },
      { name: 'bstudio_create_time', desc: '数据插入的时间', type: 'Time', indexed: false, required: true },
      { name: 'chat2', desc: '客服填写服务小计', type: 'String', indexed: false, required: false },
      { name: 'sm', desc: '各分类服务小计说明', type: 'String', indexed: false, required: false },
    ],
  },
  {
    id: 'cs_sop_2_746890',
    name: '售后标准处理流程',
    description: '根据咨询分类匹配标准售后处理流程 (SOP)，供工单操作专家校验客服处理合规性',
    used_in: ['aiqc_v2', 'order_processing'],
    columns: [
      { name: 'id', desc: '数据的唯一标识（主键）', type: 'Integer', indexed: true, required: true },
      { name: 'sys_platform', desc: '数据产生或使用的渠道', type: 'String', indexed: false, required: true },
      { name: 'uuid', desc: '用户唯一标识，由系统生成', type: 'String', indexed: false, required: true },
      { name: 'bstudio_create_time', desc: '数据插入的时间', type: 'Time', indexed: false, required: true },
      { name: 'cat', desc: '咨询分类', type: 'String', indexed: false, required: true },
      { name: 'sop', desc: '标准售后处理流程', type: 'String', indexed: false, required: true },
    ],
  },
  {
    id: 'reading_notes_870730',
    name: '订单相关消息',
    description: '记录订单状态变更消息，用于工作流中追踪订单流转情况',
    used_in: ['order_processing'],
    columns: [
      { name: 'id', desc: '数据的唯一标识（主键）', type: 'Integer', indexed: true, required: true },
      { name: 'sys_platform', desc: '数据产生或使用的渠道', type: 'String', indexed: false, required: true },
      { name: 'uuid', desc: '用户唯一标识，由系统生成', type: 'String', indexed: false, required: true },
      { name: 'bstudio_create_time', desc: '数据插入的时间', type: 'Time', indexed: false, required: true },
      { name: 'order_id', desc: '订单编号，数据的唯一标识', type: 'String', indexed: false, required: true },
      { name: 'status', desc: '订单状态', type: 'String', indexed: false, required: true },
      { name: 'number', desc: '前面订单数量', type: 'Integer', indexed: false, required: true },
    ],
  },
  {
    id: 'cat_sop_980160_541321',
    name: '分类SOP匹配表',
    description: '根据服务小计（对访分类）匹配对后台线上客服处理流程，用AI质检',
    used_in: ['aiqc_v2', 'order_processing'],
    columns: [
      { name: 'id', desc: '数据的唯一标识（主键）', type: 'Integer', indexed: true, required: true },
      { name: 'sys_platform', desc: '数据产生或使用的渠道', type: 'String', indexed: false, required: true },
      { name: 'uuid', desc: '用户唯一标识，由系统生成', type: 'String', indexed: false, required: true },
      { name: 'bstudio_create_time', desc: '数据插入的时间', type: 'Time', indexed: false, required: true },
      { name: 'chat1', desc: '客服填写服务小计', type: 'String', indexed: false, required: false },
      { name: 'cat_sop', desc: '根据服务小计匹配对应的SOP', type: 'String', indexed: false, required: false },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// UI Components
// ═══════════════════════════════════════════════════════════════════════════

const DIRECTION_CONFIG = {
  input: { label: '输入', color: 'var(--cursor-info)', bg: 'hsl(207 70% 95%)' },
  output: { label: '输出', color: 'var(--cursor-success)', bg: 'hsl(159 40% 94%)' },
  intermediate: { label: '中间变量', color: 'var(--cursor-gold)', bg: 'hsl(33 80% 94%)' },
}

const STATUS_CONFIG = {
  mapped: { label: '已映射', color: 'var(--cursor-success)', icon: CheckCircle2 },
  pending: { label: '待映射', color: 'var(--cursor-gold)', icon: Clock },
  internal: { label: '内部', color: 'var(--cursor-border-55)', icon: Zap },
}

function DirectionBadge({ direction, ...qoderProps }) {
  const cfg = DIRECTION_CONFIG[direction]
  return (
    <span className={["inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ background: cfg.bg, color: cfg.color }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {direction === 'input' && <ArrowDown className="h-2.5 w-2.5"  data-qoder-id="qel-h-2-5-1cd1f916" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-1cd1f916&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DirectionBadge&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:228,&quot;column&quot;:33}}"/>}
      {direction === 'output' && <ArrowRight className="h-2.5 w-2.5"  data-qoder-id="qel-h-2-5-9c6866a1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-9c6866a1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DirectionBadge&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:229,&quot;column&quot;:34}}"/>}
      {direction === 'intermediate' && <Zap className="h-2.5 w-2.5"  data-qoder-id="qel-h-2-5-3ede0bd6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-3ede0bd6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DirectionBadge&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:230,&quot;column&quot;:40}}"/>}
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status, ...qoderProps }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span className={["inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ color: cfg.color }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <Icon className="h-2.5 w-2.5"  data-qoder-id="qel-h-2-5-43c1d345" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-43c1d345&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;StatusBadge&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:241,&quot;column&quot;:7}}"/>
      {cfg.label}
    </span>
  )
}

function TypeBadge({ type, ...qoderProps }) {
  return (
    <span className={["rounded px-1 py-0.5 text-[10px] font-mono", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ background: 'var(--cursor-surface-300)', color: 'var(--cursor-border-55)' }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {type}
    </span>
  )
}

function FieldDetailRow({ field, expanded, onToggle, ...qoderProps }) {
  return (
    <div data-component="field-detail-row" style={qoderProps?.style} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div
        className="flex items-center gap-3 border-b px-4 py-2.5 cursor-pointer transition-colors hover:bg-[var(--cursor-surface-300)]"
        style={{ borderColor: 'var(--cursor-border-10)' }}
        onClick={onToggle}
       data-qoder-id="qel-flex-a94f0094" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a94f0094&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:258,&quot;column&quot;:7}}">
        <div className="w-5 flex-shrink-0" data-qoder-id="qel-w-5-065ef264" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-5-065ef264&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;w-5&quot;,&quot;loc&quot;:{&quot;line&quot;:263,&quot;column&quot;:9}}">
          {expanded ? <ChevronDown className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-e73029b6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-e73029b6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:264,&quot;column&quot;:23}}"/> : <ChevronRight className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-80b47c05" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-80b47c05&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:264,&quot;column&quot;:106}}"/>}
        </div>
        <div className="w-[140px] flex-shrink-0" data-qoder-id="qel-w-140px-2d83be2d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-140px-2d83be2d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;w-140px&quot;,&quot;loc&quot;:{&quot;line&quot;:266,&quot;column&quot;:9}}">
          <span className="text-xs font-mono font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-8f9981ff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-8f9981ff&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:267,&quot;column&quot;:11}}">{field.id}</span>
        </div>
        <div className="w-[120px] flex-shrink-0" data-qoder-id="qel-w-120px-c5b80459" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-120px-c5b80459&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;w-120px&quot;,&quot;loc&quot;:{&quot;line&quot;:269,&quot;column&quot;:9}}">
          <span className="text-xs" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-91998525" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-91998525&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:270,&quot;column&quot;:11}}">{field.name}</span>
        </div>
        <div className="w-[70px] flex-shrink-0" data-qoder-id="qel-w-70px-b9a83bd9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-70px-b9a83bd9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;w-70px&quot;,&quot;loc&quot;:{&quot;line&quot;:272,&quot;column&quot;:9}}"><TypeBadge type={field.type}  data-qoder-id="qel-typebadge-f6d1f790" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-typebadge-f6d1f790&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;typebadge&quot;,&quot;loc&quot;:{&quot;line&quot;:272,&quot;column&quot;:49}}"/></div>
        <div className="w-[80px] flex-shrink-0" data-qoder-id="qel-w-80px-9440ec3e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-80px-9440ec3e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;w-80px&quot;,&quot;loc&quot;:{&quot;line&quot;:273,&quot;column&quot;:9}}"><DirectionBadge direction={field.direction}  data-qoder-id="qel-directionbadge-6ec12db7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-directionbadge-6ec12db7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;directionbadge&quot;,&quot;loc&quot;:{&quot;line&quot;:273,&quot;column&quot;:49}}"/></div>
        <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-31537ce2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-31537ce2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:274,&quot;column&quot;:9}}">
          <span className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-a8012c67" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-a8012c67&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:275,&quot;column&quot;:11}}">{field.node}</span>
        </div>
        <div className="w-[100px] flex-shrink-0" data-qoder-id="qel-w-100px-209ef926" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-100px-209ef926&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;w-100px&quot;,&quot;loc&quot;:{&quot;line&quot;:277,&quot;column&quot;:9}}">
          <span className="text-[11px] font-mono" style={{ color: 'var(--cursor-orange)' }} data-qoder-id="qel-text-11px-a6012941" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-a6012941&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:278,&quot;column&quot;:11}}">{field.coze_var}</span>
        </div>
        <div className="w-[100px] flex-shrink-0" data-qoder-id="qel-w-100px-229efc4c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-100px-229efc4c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;w-100px&quot;,&quot;loc&quot;:{&quot;line&quot;:280,&quot;column&quot;:9}}">
          {field.qiyu_field ? (
            <span className="text-[11px] font-mono" style={{ color: 'var(--cursor-success)' }} data-qoder-id="qel-text-11px-a401261b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-a401261b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:282,&quot;column&quot;:13}}">{field.qiyu_field}</span>
          ) : (
            <span className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-a3012488" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-a3012488&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:284,&quot;column&quot;:13}}">—</span>
          )}
        </div>
        <div className="w-[70px] flex-shrink-0" data-qoder-id="qel-w-70px-44afd26f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-70px-44afd26f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;w-70px&quot;,&quot;loc&quot;:{&quot;line&quot;:287,&quot;column&quot;:9}}"><StatusBadge status={field.qiyu_status}  data-qoder-id="qel-statusbadge-4f92fc24" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-statusbadge-4f92fc24&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;statusbadge&quot;,&quot;loc&quot;:{&quot;line&quot;:287,&quot;column&quot;:49}}"/></div>
      </div>

      {expanded && (
        <div className="border-b px-4 py-3 ml-8 animate-fade-in" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-border-b-c17ea018" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-border-b-c17ea018&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;border-b&quot;,&quot;loc&quot;:{&quot;line&quot;:291,&quot;column&quot;:9}}">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs" data-qoder-id="qel-grid-dcfbee50" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-dcfbee50&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:292,&quot;column&quot;:11}}">
            <div data-qoder-id="qel-div-074d510c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-074d510c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:293,&quot;column&quot;:13}}">
              <span className="font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-font-medium-a0fd82f0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-a0fd82f0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:294,&quot;column&quot;:15}}">描述: </span>
              <span style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-span-eee88392" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-eee88392&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:295,&quot;column&quot;:15}}">{field.desc}</span>
            </div>
            <div data-qoder-id="qel-div-064d4f79" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-064d4f79&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:297,&quot;column&quot;:13}}">
              <span className="font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-font-medium-a5fd8acf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-a5fd8acf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:298,&quot;column&quot;:15}}">必填: </span>
              <span style={{ color: field.required ? 'var(--cursor-orange)' : 'var(--cursor-ink)' }} data-qoder-id="qel-span-ede881ff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-ede881ff&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:299,&quot;column&quot;:15}}">{field.required ? '是' : '否'}</span>
            </div>
            <div data-qoder-id="qel-div-114d60ca" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-114d60ca&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:301,&quot;column&quot;:13}}">
              <span className="font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-font-medium-aafd92ae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-aafd92ae&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:302,&quot;column&quot;:15}}">Coze 变量: </span>
              <span className="font-mono" style={{ color: 'var(--cursor-orange)' }} data-qoder-id="qel-font-mono-5cd9a8ca" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-mono-5cd9a8ca&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;font-mono&quot;,&quot;loc&quot;:{&quot;line&quot;:303,&quot;column&quot;:15}}">{field.coze_var}</span>
            </div>
            <div data-qoder-id="qel-div-9a54f43a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9a54f43a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:305,&quot;column&quot;:13}}">
              <span className="font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-font-medium-a00a4d50" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-a00a4d50&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:306,&quot;column&quot;:15}}">七鱼映射: </span>
              <span className="font-mono" style={{ color: field.qiyu_field ? 'var(--cursor-success)' : 'var(--cursor-border-55)' }} data-qoder-id="qel-font-mono-5bd9a737" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-mono-5bd9a737&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;font-mono&quot;,&quot;loc&quot;:{&quot;line&quot;:307,&quot;column&quot;:15}}">{field.qiyu_field || '未映射'}</span>
            </div>
            <div data-qoder-id="qel-div-9754ef81" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9754ef81&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:309,&quot;column&quot;:13}}">
              <span className="font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-font-medium-a70a5855" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-a70a5855&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:310,&quot;column&quot;:15}}">所属工作流: </span>
              <span style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-span-eedbb79f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-eedbb79f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:311,&quot;column&quot;:15}}">{WORKFLOW_META[field.workflow]?.name}</span>
            </div>
            <div data-qoder-id="qel-div-9454eac8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9454eac8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:313,&quot;column&quot;:13}}">
              <span className="font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-font-medium-aa0a5d0e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-aa0a5d0e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:314,&quot;column&quot;:15}}">所属节点: </span>
              <span style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-span-f3dbbf7e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-f3dbbf7e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldDetailRow&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:315,&quot;column&quot;:15}}">{field.node}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function WorkflowOverviewCard({ meta, fieldCount, nodeCount, connectionCount, ...qoderProps }) {
  return (
    <div className={["rounded-lg border p-4", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)' }), ...(qoderProps?.style) }} data-component="workflow-overview" data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="flex items-start justify-between mb-2" data-qoder-id="qel-flex-76a6b4e8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-76a6b4e8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowOverviewCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:327,&quot;column&quot;:7}}">
        <div data-qoder-id="qel-div-6038c58f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-6038c58f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowOverviewCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:328,&quot;column&quot;:9}}">
          <h4 className="text-sm font-semibold cursor-title" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-80b50392" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-80b50392&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowOverviewCard&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:329,&quot;column&quot;:11}}">{meta.name}</h4>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-33dc7a59" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-33dc7a59&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowOverviewCard&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:330,&quot;column&quot;:11}}">{meta.description}</p>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-orange)' }} data-qoder-id="qel-text-10px-d5ba7fd3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-d5ba7fd3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowOverviewCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:332,&quot;column&quot;:9}}">v{meta.version}</span>
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-flex-7da6bfed" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-7da6bfed&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowOverviewCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:334,&quot;column&quot;:7}}">
        <span className="flex items-center gap-1" data-qoder-id="qel-flex-5829c831" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-5829c831&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowOverviewCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:335,&quot;column&quot;:9}}"><FileText className="h-3 w-3"  data-qoder-id="qel-h-3-aed96522" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-aed96522&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowOverviewCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:335,&quot;column&quot;:51}}"/>{fieldCount} 字段</span>
        <span className="flex items-center gap-1" data-qoder-id="qel-flex-5229bebf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-5229bebf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowOverviewCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:336,&quot;column&quot;:9}}"><GitBranch className="h-3 w-3"  data-qoder-id="qel-h-3-a401e0ae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-a401e0ae&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowOverviewCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:336,&quot;column&quot;:51}}"/>{connectionCount} 连接</span>
        <span className="flex items-center gap-1" data-qoder-id="qel-flex-ca31376c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-ca31376c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowOverviewCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:337,&quot;column&quot;:9}}"><Database className="h-3 w-3"  data-qoder-id="qel-h-3-9e66e75b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-9e66e75b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowOverviewCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:337,&quot;column&quot;:51}}"/>{nodeCount} 节点</span>
        <span className="flex items-center gap-1" data-qoder-id="qel-flex-cc313a92" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-cc313a92&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowOverviewCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:338,&quot;column&quot;:9}}"><ExternalLink className="h-3 w-3"  data-qoder-id="qel-h-3-a7969067" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-a7969067&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowOverviewCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:338,&quot;column&quot;:51}}"/>{meta.platform}</span>
      </div>
    </div>
  )
}

function IntentScenesTable(qoderProps) {
  return (
    <div className={["rounded-lg border overflow-hidden", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ borderColor: 'var(--cursor-border-10)' }), ...(qoderProps?.style) }} data-component="intent-scenes" data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="px-4 py-2.5 border-b" style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-px-4-c0f66d0d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-c0f66d0d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;IntentScenesTable&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:347,&quot;column&quot;:7}}">
        <h4 className="text-xs font-semibold cursor-title flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-97ca35d3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-97ca35d3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;IntentScenesTable&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:348,&quot;column&quot;:9}}">
          <Tag className="h-3 w-3" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-3-f074b46d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-f074b46d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;IntentScenesTable&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:349,&quot;column&quot;:11}}"/>
          订单处理 · 5 路意图场景定义
        </h4>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-divide-y-2ee8f00a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-divide-y-2ee8f00a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;IntentScenesTable&quot;,&quot;elementRole&quot;:&quot;divide-y&quot;,&quot;loc&quot;:{&quot;line&quot;:353,&quot;column&quot;:7}}">
        {INTENT_SCENES.map(scene => (
          <div key={scene.id} className="px-4 py-2.5 flex items-center gap-3" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-px-4-b4f41b92" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-b4f41b92&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;IntentScenesTable&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:355,&quot;column&quot;:11}}">
            <span className="text-[10px] font-mono w-5 text-center rounded px-1 py-0.5" style={{ background: 'var(--cursor-orange)', color: '#fff' }} data-qoder-id="qel-text-10px-ebb8f040" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-ebb8f040&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;IntentScenesTable&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:356,&quot;column&quot;:13}}">
              {scene.priority}
            </span>
            <span className="text-xs font-medium w-[160px]" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-8e019239" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-8e019239&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;IntentScenesTable&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:359,&quot;column&quot;:13}}">{scene.name}</span>
            <div className="flex flex-wrap gap-1" data-qoder-id="qel-flex-e392ac8d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-e392ac8d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;IntentScenesTable&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:360,&quot;column&quot;:13}}">
              {scene.keywords.map(kw => (
                <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-f0b8f81f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-f0b8f81f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;IntentScenesTable&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:362,&quot;column&quot;:17}}">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ConnectionsTable({ connections, workflow, ...qoderProps }) {
  const filtered = workflow === 'all' ? connections : connections.filter(c => c.workflow === workflow)
  return (
    <div className={["rounded-lg border overflow-hidden", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ borderColor: 'var(--cursor-border-10)' }), ...(qoderProps?.style) }} data-component="connections-table" data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="px-4 py-2.5 border-b" style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-px-4-f8b3d98e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-f8b3d98e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ConnectionsTable&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:378,&quot;column&quot;:7}}">
        <h4 className="text-xs font-semibold cursor-title flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-f1f3b040" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-f1f3b040&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ConnectionsTable&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:379,&quot;column&quot;:9}}">
          <GitBranch className="h-3 w-3" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-3-7b5bb076" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-7b5bb076&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ConnectionsTable&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:380,&quot;column&quot;:11}}"/>
          节点连接 · 数据流向
        </h4>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-divide-y-ff6709f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-divide-y-ff6709f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ConnectionsTable&quot;,&quot;elementRole&quot;:&quot;divide-y&quot;,&quot;loc&quot;:{&quot;line&quot;:384,&quot;column&quot;:7}}">
        {filtered.map((conn, i) => (
          <div key={i} className="px-4 py-2 flex items-center gap-3 text-xs" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-px-4-e4c50333" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-e4c50333&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ConnectionsTable&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:386,&quot;column&quot;:11}}">
            <span className="w-5 text-center text-[10px] font-mono" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-w-5-f8823d99" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-5-f8823d99&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ConnectionsTable&quot;,&quot;elementRole&quot;:&quot;w-5&quot;,&quot;loc&quot;:{&quot;line&quot;:387,&quot;column&quot;:13}}">{i + 1}</span>
            <span className="font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-font-medium-000425bc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-000425bc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ConnectionsTable&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:388,&quot;column&quot;:13}}">{conn.from}</span>
            <ArrowRight className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-3-ce618a79" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-ce618a79&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ConnectionsTable&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:389,&quot;column&quot;:13}}"/>
            <span className="font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-font-medium-fe042296" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-fe042296&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ConnectionsTable&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:390,&quot;column&quot;:13}}">{conn.to}</span>
            <span className="ml-auto text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-orange)' }} data-qoder-id="qel-ml-auto-b60d8281" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-auto-b60d8281&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ConnectionsTable&quot;,&quot;elementRole&quot;:&quot;ml-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:391,&quot;column&quot;:13}}">
              {conn.data}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
              background: conn.workflow === 'aiqc_v2' ? 'hsl(207 70% 95%)' : 'hsl(33 80% 94%)',
              color: conn.workflow === 'aiqc_v2' ? 'var(--cursor-info)' : 'var(--cursor-gold)',
            }} data-qoder-id="qel-text-10px-aebe1ad4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-aebe1ad4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ConnectionsTable&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:394,&quot;column&quot;:13}}">
              {conn.workflow === 'aiqc_v2' ? 'AIQC' : '订单'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScreenshotReferencePanel(qoderProps) {
  return (
    <div className={["rounded-lg border overflow-hidden", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ borderColor: 'var(--cursor-border-10)' }), ...(qoderProps?.style) }} data-component="screenshot-reference" data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="px-4 py-2.5 border-b" style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-px-4-b4905fa5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-b4905fa5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:410,&quot;column&quot;:7}}">
        <h4 className="text-xs font-semibold cursor-title flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-794a613f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-794a613f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:411,&quot;column&quot;:9}}">
          <Image className="h-3 w-3" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-3-da069951" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-da069951&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:412,&quot;column&quot;:11}}"/>
          Coze 工作流截图存档
        </h4>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-28c1e208" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-28c1e208&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:415,&quot;column&quot;:9}}">
          来自 Coze 平台的原始截图，用于前后排查字段对齐与完整性验证
        </p>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3" data-qoder-id="qel-p-4-d04d86f6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-4-d04d86f6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;p-4&quot;,&quot;loc&quot;:{&quot;line&quot;:419,&quot;column&quot;:7}}">
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-rounded-lg-a870f579" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-a870f579&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:420,&quot;column&quot;:9}}">
          <h5 className="text-xs font-medium mb-2 cursor-title" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-101b318c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-101b318c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:421,&quot;column&quot;:11}}">AIQC_V2 质检工作流</h5>
          <ul className="text-[11px] space-y-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-8003e548" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-8003e548&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:422,&quot;column&quot;:11}}">
            <li data-qoder-id="qel-li-0757785e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-li-0757785e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;li&quot;,&quot;loc&quot;:{&quot;line&quot;:423,&quot;column&quot;:13}}">· Coze 结果节点 — 输出变量 (sq1, qc1, sqm1, is_violate, sq3, sq2, qc2, sqm2, cont_js, reasoning_content)</li>
            <li data-qoder-id="qel-li-085779f1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-li-085779f1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;li&quot;,&quot;loc&quot;:{&quot;line&quot;:424,&quot;column&quot;:13}}">· 工作流全局视图 — 7 节点 + 连接</li>
            <li data-qoder-id="qel-li-01576eec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-li-01576eec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;li&quot;,&quot;loc&quot;:{&quot;line&quot;:425,&quot;column&quot;:13}}">· 各节点 Prompt 配置截图</li>
          </ul>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-rounded-lg-ae70feeb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-ae70feeb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:428,&quot;column&quot;:9}}">
          <h5 className="text-xs font-medium mb-2 cursor-title" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-76e87e48" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-76e87e48&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:429,&quot;column&quot;:11}}">客服订单处理工作流</h5>
          <ul className="text-[11px] space-y-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-2447ba0a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-2447ba0a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:430,&quot;column&quot;:11}}">
            <li data-qoder-id="qel-li-e14ebf9a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-li-e14ebf9a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;li&quot;,&quot;loc&quot;:{&quot;line&quot;:431,&quot;column&quot;:13}}">· 开始节点 — 输入参数定义</li>
            <li data-qoder-id="qel-li-e24ec12d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-li-e24ec12d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;li&quot;,&quot;loc&quot;:{&quot;line&quot;:432,&quot;column&quot;:13}}">· 查询订单信息 — DB 查询节点</li>
            <li data-qoder-id="qel-li-db4eb628" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-li-db4eb628&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;li&quot;,&quot;loc&quot;:{&quot;line&quot;:433,&quot;column&quot;:13}}">· 意图识别 — LLM Prompt 配置</li>
            <li data-qoder-id="qel-li-dc4eb7bb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-li-dc4eb7bb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;li&quot;,&quot;loc&quot;:{&quot;line&quot;:434,&quot;column&quot;:13}}">· 判断意图 — 5 路条件分支</li>
            <li data-qoder-id="qel-li-dd4eb94e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-li-dd4eb94e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;li&quot;,&quot;loc&quot;:{&quot;line&quot;:435,&quot;column&quot;:13}}">· 分支处理节点 (E1-E5) — 各场景 Prompt</li>
            <li data-qoder-id="qel-li-de4ebae1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-li-de4ebae1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;li&quot;,&quot;loc&quot;:{&quot;line&quot;:436,&quot;column&quot;:13}}">· 聚合内容 — 结果汇总</li>
            <li data-qoder-id="qel-li-d74eafdc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-li-d74eafdc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;li&quot;,&quot;loc&quot;:{&quot;line&quot;:437,&quot;column&quot;:13}}">· 结束节点 — 输出变量定义</li>
          </ul>
        </div>
      </div>
      <div className="px-4 pb-3" data-qoder-id="qel-px-4-d559a75f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-d559a75f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:441,&quot;column&quot;:7}}">
        <a
          href="https://heytea.qiyukf.com/madmin/session/history"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-md transition-colors"
          style={{ background: 'var(--cursor-orange)', color: '#fff' }}
         data-qoder-id="qel-inline-flex-17e61d1b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-inline-flex-17e61d1b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;inline-flex&quot;,&quot;loc&quot;:{&quot;line&quot;:442,&quot;column&quot;:9}}">
          <ExternalLink className="h-3 w-3"  data-qoder-id="qel-h-3-d6663c95" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-d6663c95&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;ScreenshotReferencePanel&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:449,&quot;column&quot;:11}}"/>
          七鱼会话历史 (heytea.qiyukf.com)
        </a>
      </div>
    </div>
  )
}

function DatabaseTablesPanel(qoderProps) {
  const [expandedTable, setExpandedTable] = useState(null)

  return (
    <div className={["p-4 space-y-4", qoderProps?.className].filter(Boolean).join(" ")} data-component="database-tables" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="rounded-lg border p-4" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)' }} data-qoder-id="qel-rounded-lg-54c78991" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-54c78991&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:462,&quot;column&quot;:7}}">
        <h4 className="text-sm font-semibold cursor-title flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-900592be" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-900592be&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:463,&quot;column&quot;:9}}">
          <Database className="h-4 w-4" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-4-3b068127" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-3b068127&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:464,&quot;column&quot;:11}}"/>
          Coze 数据库表结构
        </h4>
        <p className="text-[11px] mt-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-de3a061e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-de3a061e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:467,&quot;column&quot;:9}}">
          工作流运行时使用的数据库表，定义于 Coze 平台。后台自动执行查询，此处记录完整结构用于字段对齐。
        </p>
      </div>

      {DB_TABLES.map(table => {
        const isExpanded = expandedTable === table.id
        return (
          <div key={table.id} className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-rounded-lg-58c78fdd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-58c78fdd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:475,&quot;column&quot;:11}}">
            {/* Table header */}
            <div
              className="px-4 py-3 border-b cursor-pointer transition-colors hover:bg-[var(--cursor-surface-300)]"
              style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }}
              onClick={() => setExpandedTable(isExpanded ? null : table.id)}
             data-qoder-id="qel-px-4-47d6c9e8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-47d6c9e8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:477,&quot;column&quot;:13}}">
              <div className="flex items-center gap-3" data-qoder-id="qel-flex-e343015d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-e343015d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:482,&quot;column&quot;:15}}">
                <div className="flex-shrink-0" data-qoder-id="qel-flex-shrink-0-7a4de0be" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-7a4de0be&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:483,&quot;column&quot;:17}}">
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-3-5-ecfd2ce5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-ecfd2ce5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:484,&quot;column&quot;:33}}"/> : <ChevronRight className="h-3.5 w-3.5" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-5-333680ec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-333680ec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:484,&quot;column&quot;:117}}"/>}
                </div>
                <div className="flex-1" data-qoder-id="qel-flex-1-940fb42a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-940fb42a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:486,&quot;column&quot;:17}}">
                  <div className="flex items-center gap-2" data-qoder-id="qel-flex-d840b175" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-d840b175&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:487,&quot;column&quot;:19}}">
                    <span className="text-xs font-mono font-semibold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-761e0953" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-761e0953&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:488,&quot;column&quot;:21}}">{table.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-orange)' }} data-qoder-id="qel-text-10px-87c9065e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-87c9065e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:489,&quot;column&quot;:21}}">
                      {table.name}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-4f4173c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-4f4173c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:493,&quot;column&quot;:19}}">{table.description}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-flex-dc40b7c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-dc40b7c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:495,&quot;column&quot;:17}}">
                  <span data-qoder-id="qel-span-30bba888" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-30bba888&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:496,&quot;column&quot;:19}}">{table.columns.length} 字段</span>
                  {table.used_in.map(wf => (
                    <span key={wf} className="px-1.5 py-0.5 rounded" style={{
                      background: wf === 'aiqc_v2' ? 'hsl(207 70% 95%)' : 'hsl(33 80% 94%)',
                      color: wf === 'aiqc_v2' ? 'var(--cursor-info)' : 'var(--cursor-gold)',
                    }} data-qoder-id="qel-px-1-5-8e5275fa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-8e5275fa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:498,&quot;column&quot;:21}}">
                      {wf === 'aiqc_v2' ? 'AIQC_V2' : '订单处理'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Table columns */}
            {isExpanded && (
              <div className="animate-fade-in" data-qoder-id="qel-animate-fade-in-6e176276" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animate-fade-in-6e176276&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;animate-fade-in&quot;,&quot;loc&quot;:{&quot;line&quot;:511,&quot;column&quot;:15}}">
                <div className="flex items-center gap-3 px-4 py-2 text-[10px] font-medium uppercase tracking-wider border-b" style={{ background: 'var(--cursor-surface-300)', borderColor: 'var(--cursor-border-10)', color: 'var(--cursor-border-55)' }} data-qoder-id="qel-flex-d03e6646" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-d03e6646&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:512,&quot;column&quot;:17}}">
                  <div className="w-[160px] flex-shrink-0" data-qoder-id="qel-w-160px-98494055" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-160px-98494055&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;w-160px&quot;,&quot;loc&quot;:{&quot;line&quot;:513,&quot;column&quot;:19}}">存储字段名称</div>
                  <div className="flex-1" data-qoder-id="qel-flex-1-910d70da" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-910d70da&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:514,&quot;column&quot;:19}}">描述</div>
                  <div className="w-[80px] flex-shrink-0 text-center" data-qoder-id="qel-w-80px-07ee8d78" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-80px-07ee8d78&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;w-80px&quot;,&quot;loc&quot;:{&quot;line&quot;:515,&quot;column&quot;:19}}">设为索引</div>
                  <div className="w-[80px] flex-shrink-0" data-qoder-id="qel-w-80px-0aee9231" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-80px-0aee9231&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;w-80px&quot;,&quot;loc&quot;:{&quot;line&quot;:516,&quot;column&quot;:19}}">数据类型</div>
                  <div className="w-[70px] flex-shrink-0 text-center" data-qoder-id="qel-w-70px-13ee644d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-70px-13ee644d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;w-70px&quot;,&quot;loc&quot;:{&quot;line&quot;:517,&quot;column&quot;:19}}">是否必填</div>
                </div>
                {table.columns.map((col, i) => (
                  <div
                    key={col.name}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs border-b"
                    style={{ borderColor: 'var(--cursor-border-10)' }}
                   data-qoder-id="qel-flex-d63e6fb8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-d63e6fb8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:520,&quot;column&quot;:19}}">
                    <div className="w-[160px] flex-shrink-0" data-qoder-id="qel-w-160px-9e4949c7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-160px-9e4949c7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;w-160px&quot;,&quot;loc&quot;:{&quot;line&quot;:525,&quot;column&quot;:21}}">
                      <span className="font-mono font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-font-mono-0ec59e9a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-mono-0ec59e9a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;font-mono&quot;,&quot;loc&quot;:{&quot;line&quot;:526,&quot;column&quot;:23}}">{col.name}</span>
                    </div>
                    <div className="flex-1" data-qoder-id="qel-flex-1-8e00a02e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-8e00a02e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:528,&quot;column&quot;:21}}">
                      <span style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-span-b3c0f3ef" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b3c0f3ef&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:529,&quot;column&quot;:23}}">{col.desc}</span>
                    </div>
                    <div className="w-[80px] flex-shrink-0 text-center" data-qoder-id="qel-w-80px-05dd4131" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-80px-05dd4131&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;w-80px&quot;,&quot;loc&quot;:{&quot;line&quot;:531,&quot;column&quot;:21}}">
                      {col.indexed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 mx-auto" style={{ color: 'var(--cursor-success)' }}  data-qoder-id="qel-h-3-5-e4e2985d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-e4e2985d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:533,&quot;column&quot;:25}}"/>
                      ) : (
                        <span style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-span-b0c0ef36" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b0c0ef36&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:535,&quot;column&quot;:25}}">—</span>
                      )}
                    </div>
                    <div className="w-[80px] flex-shrink-0" data-qoder-id="qel-w-80px-08dd45ea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-80px-08dd45ea&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;w-80px&quot;,&quot;loc&quot;:{&quot;line&quot;:538,&quot;column&quot;:21}}">
                      <TypeBadge type={col.type}  data-qoder-id="qel-typebadge-a04e1d84" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-typebadge-a04e1d84&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;typebadge&quot;,&quot;loc&quot;:{&quot;line&quot;:539,&quot;column&quot;:23}}"/>
                    </div>
                    <div className="w-[70px] flex-shrink-0 text-center" data-qoder-id="qel-w-70px-0effa58f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-70px-0effa58f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;w-70px&quot;,&quot;loc&quot;:{&quot;line&quot;:541,&quot;column&quot;:21}}">
                      <span style={{ color: col.required ? 'var(--cursor-orange)' : 'var(--cursor-border-55)' }} data-qoder-id="qel-span-bcc1021a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-bcc1021a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:542,&quot;column&quot;:23}}">
                        {col.required ? '是' : '否'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Field mapping hint */}
      <div className="rounded-lg border p-3" style={{ borderColor: 'var(--cursor-border-10)', background: 'hsl(33 80% 97%)' }} data-qoder-id="qel-rounded-lg-49d2059c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-49d2059c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:555,&quot;column&quot;:7}}">
        <p className="text-[11px] flex items-start gap-2" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-49302133" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-49302133&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:556,&quot;column&quot;:9}}">
          <BookOpen className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--cursor-gold)' }}  data-qoder-id="qel-h-3-5-982bca45" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-982bca45&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:557,&quot;column&quot;:11}}"/>
          <span data-qoder-id="qel-span-32bdea45" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-32bdea45&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:558,&quot;column&quot;:11}}">
            <strong style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-strong-de3b2f1a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strong-de3b2f1a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;strong&quot;,&quot;loc&quot;:{&quot;line&quot;:559,&quot;column&quot;:13}}">字段对齐提示：</strong>
            订单表 <code className="text-[10px] font-mono px-1 py-0.5 rounded" style={{ background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-text-10px-4b69ff65" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-4b69ff65&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:560,&quot;column&quot;:17}}">order_id / status / number</code> 对应订单处理工作流 Node B (查询订单信息) 的 DB 查询输出；
            分类定义表 <code className="text-[10px] font-mono px-1 py-0.5 rounded" style={{ background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-text-10px-4869faac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-4869faac&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:561,&quot;column&quot;:19}}">chat2 / sm</code> 对应 AIQC_V2 Node 4 (分类质检) 的分类匹配依据；
            SOP 表 <code className="text-[10px] font-mono px-1 py-0.5 rounded" style={{ background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-text-10px-4969fc3f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-4969fc3f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:562,&quot;column&quot;:19}}">cat / sop</code> 对应 AIQC_V2 Node 3 (工单操作专家) 的 SOP 校验规则输入；
            订单消息表 <code className="text-[10px] font-mono px-1 py-0.5 rounded" style={{ background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-text-10px-4e6a041e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-4e6a041e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;DatabaseTablesPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:563,&quot;column&quot;:19}}">order_id / status / number</code> 用于追踪订单状态流转。
          </span>
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

const FILTER_OPTIONS = {
  workflow: [
    { value: 'all', label: '全部工作流' },
    { value: 'aiqc_v2', label: 'AIQC_V2 质检' },
    { value: 'order_processing', label: '订单处理' },
  ],
  direction: [
    { value: 'all', label: '全部方向' },
    { value: 'input', label: '输入字段' },
    { value: 'output', label: '输出字段' },
    { value: 'intermediate', label: '中间变量' },
  ],
  status: [
    { value: 'all', label: '全部状态' },
    { value: 'mapped', label: '已映射' },
    { value: 'pending', label: '待映射' },
    { value: 'internal', label: '内部' },
  ],
}

const TABS = [
  { id: 'fields', label: '字段字典', icon: Database },
  { id: 'database', label: '数据库', icon: Server },
  { id: 'connections', label: '数据流向', icon: GitBranch },
  { id: 'intents', label: '意图场景', icon: Tag },
  { id: 'reference', label: '截图存档', icon: Image },
]

export default function FieldRegistry(qoderProps) {
  const [activeTab, setActiveTab] = useState('fields')
  const [search, setSearch] = useState('')
  const [filterWorkflow, setFilterWorkflow] = useState('all')
  const [filterDirection, setFilterDirection] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedField, setExpandedField] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  const filteredFields = useMemo(() => {
    return FIELD_REGISTRY.filter(f => {
      if (filterWorkflow !== 'all' && f.workflow !== filterWorkflow) return false
      if (filterDirection !== 'all' && f.direction !== filterDirection) return false
      if (filterStatus !== 'all' && f.qiyu_status !== filterStatus) return false
      if (search) {
        const q = search.toLowerCase()
        return f.id.toLowerCase().includes(q) ||
               f.name.toLowerCase().includes(q) ||
               f.coze_var.toLowerCase().includes(q) ||
               f.qiyu_field?.toLowerCase().includes(q) ||
               f.desc.toLowerCase().includes(q) ||
               f.node.toLowerCase().includes(q)
      }
      return true
    })
  }, [search, filterWorkflow, filterDirection, filterStatus])

  const stats = useMemo(() => {
    const total = FIELD_REGISTRY.length
    const mapped = FIELD_REGISTRY.filter(f => f.qiyu_status === 'mapped').length
    const pending = FIELD_REGISTRY.filter(f => f.qiyu_status === 'pending').length
    const internal = FIELD_REGISTRY.filter(f => f.qiyu_status === 'internal').length
    return { total, mapped, pending, internal }
  }, [])

  const handleCopyId = (fieldId) => {
    navigator.clipboard.writeText(fieldId).catch(() => {})
    setCopiedId(fieldId)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className={["flex h-full flex-col", qoderProps?.className].filter(Boolean).join(" ")} data-component="field-registry" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Content area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin" data-qoder-id="qel-flex-1-7c352204" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-7c352204&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:647,&quot;column&quot;:7}}">
        {/* Compact inline sub-nav — replaces the old header bar */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2" style={{ background: 'var(--cursor-canvas)' }} data-qoder-id="qel-flex-57d98bd5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-57d98bd5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:649,&quot;column&quot;:9}}">
          <div className="flex items-center rounded-lg border p-0.5" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-flex-54d9871c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-54d9871c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:650,&quot;column&quot;:11}}">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-colors"
                  style={{
                    color: isActive ? '#fff' : 'var(--cursor-border-55)',
                    background: isActive ? 'var(--cursor-orange)' : 'transparent',
                  }}
                  onClick={() => setActiveTab(tab.id)}
                 data-qoder-id="qel-flex-4a1a7828" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-4a1a7828&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:655,&quot;column&quot;:17}}">
                  <Icon className="h-3 w-3"  data-qoder-id="qel-h-3-bcf56795" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-bcf56795&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:664,&quot;column&quot;:19}}"/>
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Stats */}
          <div className="ml-auto flex items-center gap-3 text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-ml-auto-ffdeed85" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-auto-ffdeed85&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;ml-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:672,&quot;column&quot;:11}}">
            <span data-qoder-id="qel-span-bc0de4c0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-bc0de4c0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:673,&quot;column&quot;:13}}">共 {stats.total} 字段</span>
            <span className="flex items-center gap-0.5" data-qoder-id="qel-flex-b8b60204" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b8b60204&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:674,&quot;column&quot;:13}}"><CheckCircle2 className="h-2.5 w-2.5" style={{ color: 'var(--cursor-success)' }}  data-qoder-id="qel-h-2-5-094a15ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-094a15ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:674,&quot;column&quot;:57}}"/> {stats.mapped} 已映射</span>
            <span className="flex items-center gap-0.5" data-qoder-id="qel-flex-aeb5f246" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-aeb5f246&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:675,&quot;column&quot;:13}}"><Clock className="h-2.5 w-2.5" style={{ color: 'var(--cursor-gold)' }}  data-qoder-id="qel-h-2-5-45028350" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-45028350&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:675,&quot;column&quot;:57}}"/> {stats.pending} 待映射</span>
            <span className="flex items-center gap-0.5" data-qoder-id="qel-flex-b2b3b9fb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b2b3b9fb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:676,&quot;column&quot;:13}}"><Zap className="h-2.5 w-2.5"  data-qoder-id="qel-h-2-5-fef9c027" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-fef9c027&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:676,&quot;column&quot;:57}}"/> {stats.internal} 内部</span>
          </div>
        </div>
        {activeTab === 'fields' && (
          <div className="p-4 space-y-4" data-qoder-id="qel-p-4-f59e0070" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-4-f59e0070&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;p-4&quot;,&quot;loc&quot;:{&quot;line&quot;:680,&quot;column&quot;:11}}">
            {/* Workflow overview cards */}
            <div className="grid grid-cols-2 gap-3" data-qoder-id="qel-grid-b848c5d8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-b848c5d8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:682,&quot;column&quot;:13}}">
              <WorkflowOverviewCard
                meta={WORKFLOW_META.aiqc_v2}
                fieldCount={FIELD_REGISTRY.filter(f => f.workflow === 'aiqc_v2').length}
                nodeCount={7}
                connectionCount={WORKFLOW_CONNECTIONS.filter(c => c.workflow === 'aiqc_v2').length}
               data-qoder-id="qel-workflowoverviewcard-e6549a7c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-workflowoverviewcard-e6549a7c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;workflowoverviewcard&quot;,&quot;loc&quot;:{&quot;line&quot;:683,&quot;column&quot;:15}}"/>
              <WorkflowOverviewCard
                meta={WORKFLOW_META.order_processing}
                fieldCount={FIELD_REGISTRY.filter(f => f.workflow === 'order_processing').length}
                nodeCount={11}
                connectionCount={WORKFLOW_CONNECTIONS.filter(c => c.workflow === 'order_processing').length}
               data-qoder-id="qel-workflowoverviewcard-e9549f35" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-workflowoverviewcard-e9549f35&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;workflowoverviewcard&quot;,&quot;loc&quot;:{&quot;line&quot;:689,&quot;column&quot;:15}}"/>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap" data-component="field-filters" data-qoder-id="qel-field-filters-5150d30b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-field-filters-5150d30b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;field-filters&quot;,&quot;loc&quot;:{&quot;line&quot;:698,&quot;column&quot;:13}}">
              <div className="relative flex-1 min-w-[200px]" data-qoder-id="qel-relative-b303320c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-relative-b303320c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;relative&quot;,&quot;loc&quot;:{&quot;line&quot;:699,&quot;column&quot;:15}}">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-absolute-a5a6f4c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-a5a6f4c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:700,&quot;column&quot;:17}}"/>
                <input
                  type="text"
                  placeholder="搜索字段 ID、名称、Coze 变量、七鱼映射..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border py-1.5 pl-8 pr-3 text-xs outline-none transition-colors focus:border-[var(--cursor-orange)]"
                  style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)', color: 'var(--cursor-ink)' }}
                 data-qoder-id="qel-w-full-56e4aac7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-56e4aac7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:701,&quot;column&quot;:17}}"/>
              </div>
              <select
                value={filterWorkflow}
                onChange={(e) => setFilterWorkflow(e.target.value)}
                className="rounded-md border px-2 py-1.5 text-xs outline-none"
                style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)', color: 'var(--cursor-ink)' }}
               data-qoder-id="qel-rounded-md-92caeaa2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-md-92caeaa2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;rounded-md&quot;,&quot;loc&quot;:{&quot;line&quot;:710,&quot;column&quot;:15}}">
                {FILTER_OPTIONS.workflow.map(o => <option key={o.value} value={o.value} data-qoder-id="qel-option-e8e7a5f4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-e8e7a5f4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:716,&quot;column&quot;:51}}">{o.label}</option>)}
              </select>
              <select
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
                className="rounded-md border px-2 py-1.5 text-xs outline-none"
                style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)', color: 'var(--cursor-ink)' }}
               data-qoder-id="qel-rounded-md-90cae77c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-md-90cae77c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;rounded-md&quot;,&quot;loc&quot;:{&quot;line&quot;:718,&quot;column&quot;:15}}">
                {FILTER_OPTIONS.direction.map(o => <option key={o.value} value={o.value} data-qoder-id="qel-option-e6e7a2ce" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-e6e7a2ce&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:724,&quot;column&quot;:52}}">{o.label}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-md border px-2 py-1.5 text-xs outline-none"
                style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)', color: 'var(--cursor-ink)' }}
               data-qoder-id="qel-rounded-md-8ecae456" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-md-8ecae456&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;rounded-md&quot;,&quot;loc&quot;:{&quot;line&quot;:726,&quot;column&quot;:15}}">
                {FILTER_OPTIONS.status.map(o => <option key={o.value} value={o.value} data-qoder-id="qel-option-e4e79fa8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-e4e79fa8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:732,&quot;column&quot;:49}}">{o.label}</option>)}
              </select>
            </div>

            {/* Field table */}
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)' }} data-component="field-table" data-qoder-id="qel-field-table-5aa07293" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-field-table-5aa07293&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;field-table&quot;,&quot;loc&quot;:{&quot;line&quot;:737,&quot;column&quot;:13}}">
              {/* Table header */}
              <div className="flex items-center gap-3 border-b px-4 py-2 text-[10px] font-medium uppercase tracking-wider" style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)', color: 'var(--cursor-border-55)' }} data-qoder-id="qel-flex-daf25ef4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-daf25ef4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:739,&quot;column&quot;:15}}">
                <div className="w-5 flex-shrink-0"  data-qoder-id="qel-w-5-19890d07" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-5-19890d07&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;w-5&quot;,&quot;loc&quot;:{&quot;line&quot;:740,&quot;column&quot;:17}}"/>
                <div className="w-[140px] flex-shrink-0" data-qoder-id="qel-w-140px-f8898a85" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-140px-f8898a85&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;w-140px&quot;,&quot;loc&quot;:{&quot;line&quot;:741,&quot;column&quot;:17}}">字段 ID</div>
                <div className="w-[120px] flex-shrink-0" data-qoder-id="qel-w-120px-eeb176dc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-120px-eeb176dc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;w-120px&quot;,&quot;loc&quot;:{&quot;line&quot;:742,&quot;column&quot;:17}}">名称</div>
                <div className="w-[70px] flex-shrink-0" data-qoder-id="qel-w-70px-151604a7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-70px-151604a7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;w-70px&quot;,&quot;loc&quot;:{&quot;line&quot;:743,&quot;column&quot;:17}}">类型</div>
                <div className="w-[80px] flex-shrink-0" data-qoder-id="qel-w-80px-3922276f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-80px-3922276f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;w-80px&quot;,&quot;loc&quot;:{&quot;line&quot;:744,&quot;column&quot;:17}}">方向</div>
                <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-6a464ecf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-6a464ecf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:745,&quot;column&quot;:17}}">所属节点</div>
                <div className="w-[100px] flex-shrink-0" data-qoder-id="qel-w-100px-377defea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-100px-377defea&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;w-100px&quot;,&quot;loc&quot;:{&quot;line&quot;:746,&quot;column&quot;:17}}">Coze 变量</div>
                <div className="w-[100px] flex-shrink-0" data-qoder-id="qel-w-100px-367dee57" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-100px-367dee57&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;w-100px&quot;,&quot;loc&quot;:{&quot;line&quot;:747,&quot;column&quot;:17}}">七鱼映射</div>
                <div className="w-[70px] flex-shrink-0" data-qoder-id="qel-w-70px-1015fcc8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-70px-1015fcc8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;w-70px&quot;,&quot;loc&quot;:{&quot;line&quot;:748,&quot;column&quot;:17}}">状态</div>
              </div>

              {/* Table body */}
              {filteredFields.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-px-4-e16b47df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-e16b47df&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:753,&quot;column&quot;:17}}">
                  <Filter className="h-5 w-5 mx-auto mb-2 opacity-40"  data-qoder-id="qel-h-5-17847634" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-5-17847634&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;h-5&quot;,&quot;loc&quot;:{&quot;line&quot;:754,&quot;column&quot;:19}}"/>
                  没有匹配的字段，请调整筛选条件
                </div>
              ) : (
                filteredFields.map(field => (
                  <FieldDetailRow
                    key={field.id}
                    field={field}
                    expanded={expandedField === field.id}
                    onToggle={() => setExpandedField(expandedField === field.id ? null : field.id)}
                   data-qoder-id="qel-fielddetailrow-8f72ba13" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-fielddetailrow-8f72ba13&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;fielddetailrow&quot;,&quot;loc&quot;:{&quot;line&quot;:759,&quot;column&quot;:19}}"/>
                ))
              )}
            </div>

            <p className="text-[10px] text-center" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-841136b9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-841136b9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:769,&quot;column&quot;:13}}">
              显示 {filteredFields.length} / {FIELD_REGISTRY.length} 字段 · 点击行展开详情
            </p>
          </div>
        )}

        {activeTab === 'database' && <DatabaseTablesPanel  data-qoder-id="qel-databasetablespanel-05e359cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-databasetablespanel-05e359cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;databasetablespanel&quot;,&quot;loc&quot;:{&quot;line&quot;:775,&quot;column&quot;:38}}"/>}

        {activeTab === 'connections' && (
          <div className="p-4 space-y-4" data-qoder-id="qel-p-4-17d59dbe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-4-17d59dbe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;p-4&quot;,&quot;loc&quot;:{&quot;line&quot;:778,&quot;column&quot;:11}}">
            <div className="flex items-center gap-2" data-qoder-id="qel-flex-1be1dfc9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1be1dfc9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:779,&quot;column&quot;:13}}">
              <select
                className="rounded-md border px-2 py-1.5 text-xs outline-none"
                style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)', color: 'var(--cursor-ink)' }}
                value={filterWorkflow}
                onChange={(e) => setFilterWorkflow(e.target.value)}
               data-qoder-id="qel-rounded-md-c4032cb3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-md-c4032cb3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;rounded-md&quot;,&quot;loc&quot;:{&quot;line&quot;:780,&quot;column&quot;:15}}">
                <option value="all" data-qoder-id="qel-option-f94e8521" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-f94e8521&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:786,&quot;column&quot;:17}}">全部工作流</option>
                <option value="aiqc_v2" data-qoder-id="qel-option-f84e838e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-f84e838e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:787,&quot;column&quot;:17}}">AIQC_V2</option>
                <option value="order_processing" data-qoder-id="qel-option-f34e7baf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-f34e7baf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:788,&quot;column&quot;:17}}">订单处理</option>
              </select>
            </div>
            <ConnectionsTable connections={WORKFLOW_CONNECTIONS} workflow={filterWorkflow}  data-qoder-id="qel-connectionstable-c0a5d084" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-connectionstable-c0a5d084&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;connectionstable&quot;,&quot;loc&quot;:{&quot;line&quot;:791,&quot;column&quot;:13}}"/>
          </div>
        )}

        {activeTab === 'intents' && (
          <div className="p-4 space-y-4" data-qoder-id="qel-p-4-10d35422" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-4-10d35422&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;p-4&quot;,&quot;loc&quot;:{&quot;line&quot;:796,&quot;column&quot;:11}}">
            <IntentScenesTable  data-qoder-id="qel-intentscenestable-db74c4d7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-intentscenestable-db74c4d7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;intentscenestable&quot;,&quot;loc&quot;:{&quot;line&quot;:797,&quot;column&quot;:13}}"/>
          </div>
        )}

        {activeTab === 'reference' && (
          <div className="p-4 space-y-4" data-qoder-id="qel-p-4-0ed350fc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-4-0ed350fc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;p-4&quot;,&quot;loc&quot;:{&quot;line&quot;:802,&quot;column&quot;:11}}">
            <ScreenshotReferencePanel  data-qoder-id="qel-screenshotreferencepanel-ba297b13" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-screenshotreferencepanel-ba297b13&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/FieldRegistry.jsx&quot;,&quot;componentName&quot;:&quot;FieldRegistry&quot;,&quot;elementRole&quot;:&quot;screenshotreferencepanel&quot;,&quot;loc&quot;:{&quot;line&quot;:803,&quot;column&quot;:13}}"/>
          </div>
        )}
      </div>
    </div>
  )
}
