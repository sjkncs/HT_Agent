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

function DirectionBadge({ direction }) {
  const cfg = DIRECTION_CONFIG[direction]
  return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: cfg.bg, color: cfg.color }}>
      {direction === 'input' && <ArrowDown className="h-2.5 w-2.5" />}
      {direction === 'output' && <ArrowRight className="h-2.5 w-2.5" />}
      {direction === 'intermediate' && <Zap className="h-2.5 w-2.5" />}
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ color: cfg.color }}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  )
}

function TypeBadge({ type }) {
  return (
    <span className="rounded px-1 py-0.5 text-[10px] font-mono" style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-border-55)' }}>
      {type}
    </span>
  )
}

function FieldDetailRow({ field, expanded, onToggle }) {
  return (
    <div data-component="field-detail-row">
      <div
        className="flex items-center gap-3 border-b px-4 py-2.5 cursor-pointer transition-colors hover:bg-[var(--cursor-surface-300)]"
        style={{ borderColor: 'var(--cursor-border-10)' }}
        onClick={onToggle}
      >
        <div className="w-5 flex-shrink-0">
          {expanded ? <ChevronDown className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }} /> : <ChevronRight className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }} />}
        </div>
        <div className="w-[140px] flex-shrink-0">
          <span className="text-xs font-mono font-medium" style={{ color: 'var(--cursor-ink)' }}>{field.id}</span>
        </div>
        <div className="w-[120px] flex-shrink-0">
          <span className="text-xs" style={{ color: 'var(--cursor-ink)' }}>{field.name}</span>
        </div>
        <div className="w-[70px] flex-shrink-0"><TypeBadge type={field.type} /></div>
        <div className="w-[80px] flex-shrink-0"><DirectionBadge direction={field.direction} /></div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }}>{field.node}</span>
        </div>
        <div className="w-[100px] flex-shrink-0">
          <span className="text-[11px] font-mono" style={{ color: 'var(--cursor-orange)' }}>{field.coze_var}</span>
        </div>
        <div className="w-[100px] flex-shrink-0">
          {field.qiyu_field ? (
            <span className="text-[11px] font-mono" style={{ color: 'var(--cursor-success)' }}>{field.qiyu_field}</span>
          ) : (
            <span className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }}>—</span>
          )}
        </div>
        <div className="w-[70px] flex-shrink-0"><StatusBadge status={field.qiyu_status} /></div>
      </div>

      {expanded && (
        <div className="border-b px-4 py-3 ml-8 animate-fade-in" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
            <div>
              <span className="font-medium" style={{ color: 'var(--cursor-border-55)' }}>描述: </span>
              <span style={{ color: 'var(--cursor-ink)' }}>{field.desc}</span>
            </div>
            <div>
              <span className="font-medium" style={{ color: 'var(--cursor-border-55)' }}>必填: </span>
              <span style={{ color: field.required ? 'var(--cursor-orange)' : 'var(--cursor-ink)' }}>{field.required ? '是' : '否'}</span>
            </div>
            <div>
              <span className="font-medium" style={{ color: 'var(--cursor-border-55)' }}>Coze 变量: </span>
              <span className="font-mono" style={{ color: 'var(--cursor-orange)' }}>{field.coze_var}</span>
            </div>
            <div>
              <span className="font-medium" style={{ color: 'var(--cursor-border-55)' }}>七鱼映射: </span>
              <span className="font-mono" style={{ color: field.qiyu_field ? 'var(--cursor-success)' : 'var(--cursor-border-55)' }}>{field.qiyu_field || '未映射'}</span>
            </div>
            <div>
              <span className="font-medium" style={{ color: 'var(--cursor-border-55)' }}>所属工作流: </span>
              <span style={{ color: 'var(--cursor-ink)' }}>{WORKFLOW_META[field.workflow]?.name}</span>
            </div>
            <div>
              <span className="font-medium" style={{ color: 'var(--cursor-border-55)' }}>所属节点: </span>
              <span style={{ color: 'var(--cursor-ink)' }}>{field.node}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function WorkflowOverviewCard({ meta, fieldCount, nodeCount, connectionCount }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)' }} data-component="workflow-overview">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-sm font-semibold cursor-title" style={{ color: 'var(--cursor-ink)' }}>{meta.name}</h4>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }}>{meta.description}</p>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-orange)' }}>v{meta.version}</span>
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px]" style={{ color: 'var(--cursor-border-55)' }}>
        <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{fieldCount} 字段</span>
        <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" />{connectionCount} 连接</span>
        <span className="flex items-center gap-1"><Database className="h-3 w-3" />{nodeCount} 节点</span>
        <span className="flex items-center gap-1"><ExternalLink className="h-3 w-3" />{meta.platform}</span>
      </div>
    </div>
  )
}

function IntentScenesTable() {
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)' }} data-component="intent-scenes">
      <div className="px-4 py-2.5 border-b" style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }}>
        <h4 className="text-xs font-semibold cursor-title flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }}>
          <Tag className="h-3 w-3" style={{ color: 'var(--cursor-orange)' }} />
          订单处理 · 5 路意图场景定义
        </h4>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--cursor-border-10)' }}>
        {INTENT_SCENES.map(scene => (
          <div key={scene.id} className="px-4 py-2.5 flex items-center gap-3" style={{ borderColor: 'var(--cursor-border-10)' }}>
            <span className="text-[10px] font-mono w-5 text-center rounded px-1 py-0.5" style={{ background: 'var(--cursor-orange)', color: '#fff' }}>
              {scene.priority}
            </span>
            <span className="text-xs font-medium w-[160px]" style={{ color: 'var(--cursor-ink)' }}>{scene.name}</span>
            <div className="flex flex-wrap gap-1">
              {scene.keywords.map(kw => (
                <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-border-55)' }}>
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

function ConnectionsTable({ connections, workflow }) {
  const filtered = workflow === 'all' ? connections : connections.filter(c => c.workflow === workflow)
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)' }} data-component="connections-table">
      <div className="px-4 py-2.5 border-b" style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }}>
        <h4 className="text-xs font-semibold cursor-title flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }}>
          <GitBranch className="h-3 w-3" style={{ color: 'var(--cursor-orange)' }} />
          节点连接 · 数据流向
        </h4>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--cursor-border-10)' }}>
        {filtered.map((conn, i) => (
          <div key={i} className="px-4 py-2 flex items-center gap-3 text-xs" style={{ borderColor: 'var(--cursor-border-10)' }}>
            <span className="w-5 text-center text-[10px] font-mono" style={{ color: 'var(--cursor-border-55)' }}>{i + 1}</span>
            <span className="font-medium" style={{ color: 'var(--cursor-ink)' }}>{conn.from}</span>
            <ArrowRight className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--cursor-orange)' }} />
            <span className="font-medium" style={{ color: 'var(--cursor-ink)' }}>{conn.to}</span>
            <span className="ml-auto text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-orange)' }}>
              {conn.data}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
              background: conn.workflow === 'aiqc_v2' ? 'hsl(207 70% 95%)' : 'hsl(33 80% 94%)',
              color: conn.workflow === 'aiqc_v2' ? 'var(--cursor-info)' : 'var(--cursor-gold)',
            }}>
              {conn.workflow === 'aiqc_v2' ? 'AIQC' : '订单'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScreenshotReferencePanel() {
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)' }} data-component="screenshot-reference">
      <div className="px-4 py-2.5 border-b" style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }}>
        <h4 className="text-xs font-semibold cursor-title flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }}>
          <Image className="h-3 w-3" style={{ color: 'var(--cursor-orange)' }} />
          Coze 工作流截图存档
        </h4>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }}>
          来自 Coze 平台的原始截图，用于前后排查字段对齐与完整性验证
        </p>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
          <h5 className="text-xs font-medium mb-2 cursor-title" style={{ color: 'var(--cursor-ink)' }}>AIQC_V2 质检工作流</h5>
          <ul className="text-[11px] space-y-1" style={{ color: 'var(--cursor-border-55)' }}>
            <li>· Coze 结果节点 — 输出变量 (sq1, qc1, sqm1, is_violate, sq3, sq2, qc2, sqm2, cont_js, reasoning_content)</li>
            <li>· 工作流全局视图 — 7 节点 + 连接</li>
            <li>· 各节点 Prompt 配置截图</li>
          </ul>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
          <h5 className="text-xs font-medium mb-2 cursor-title" style={{ color: 'var(--cursor-ink)' }}>客服订单处理工作流</h5>
          <ul className="text-[11px] space-y-1" style={{ color: 'var(--cursor-border-55)' }}>
            <li>· 开始节点 — 输入参数定义</li>
            <li>· 查询订单信息 — DB 查询节点</li>
            <li>· 意图识别 — LLM Prompt 配置</li>
            <li>· 判断意图 — 5 路条件分支</li>
            <li>· 分支处理节点 (E1-E5) — 各场景 Prompt</li>
            <li>· 聚合内容 — 结果汇总</li>
            <li>· 结束节点 — 输出变量定义</li>
          </ul>
        </div>
      </div>
      <div className="px-4 pb-3">
        <a
          href="https://heytea.qiyukf.com/madmin/session/history"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-md transition-colors"
          style={{ background: 'var(--cursor-orange)', color: '#fff' }}
        >
          <ExternalLink className="h-3 w-3" />
          七鱼会话历史 (heytea.qiyukf.com)
        </a>
      </div>
    </div>
  )
}

function DatabaseTablesPanel() {
  const [expandedTable, setExpandedTable] = useState(null)

  return (
    <div className="p-4 space-y-4" data-component="database-tables">
      <div className="rounded-lg border p-4" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)' }}>
        <h4 className="text-sm font-semibold cursor-title flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }}>
          <Database className="h-4 w-4" style={{ color: 'var(--cursor-orange)' }} />
          Coze 数据库表结构
        </h4>
        <p className="text-[11px] mt-1" style={{ color: 'var(--cursor-border-55)' }}>
          工作流运行时使用的数据库表，定义于 Coze 平台。后台自动执行查询，此处记录完整结构用于字段对齐。
        </p>
      </div>

      {DB_TABLES.map(table => {
        const isExpanded = expandedTable === table.id
        return (
          <div key={table.id} className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)' }}>
            {/* Table header */}
            <div
              className="px-4 py-3 border-b cursor-pointer transition-colors hover:bg-[var(--cursor-surface-300)]"
              style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }}
              onClick={() => setExpandedTable(isExpanded ? null : table.id)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--cursor-orange)' }} /> : <ChevronRight className="h-3.5 w-3.5" style={{ color: 'var(--cursor-border-55)' }} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold" style={{ color: 'var(--cursor-ink)' }}>{table.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-orange)' }}>
                      {table.name}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }}>{table.description}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
                  <span>{table.columns.length} 字段</span>
                  {table.used_in.map(wf => (
                    <span key={wf} className="px-1.5 py-0.5 rounded" style={{
                      background: wf === 'aiqc_v2' ? 'hsl(207 70% 95%)' : 'hsl(33 80% 94%)',
                      color: wf === 'aiqc_v2' ? 'var(--cursor-info)' : 'var(--cursor-gold)',
                    }}>
                      {wf === 'aiqc_v2' ? 'AIQC_V2' : '订单处理'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Table columns */}
            {isExpanded && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 px-4 py-2 text-[10px] font-medium uppercase tracking-wider border-b" style={{ background: 'var(--cursor-surface-300)', borderColor: 'var(--cursor-border-10)', color: 'var(--cursor-border-55)' }}>
                  <div className="w-[160px] flex-shrink-0">存储字段名称</div>
                  <div className="flex-1">描述</div>
                  <div className="w-[80px] flex-shrink-0 text-center">设为索引</div>
                  <div className="w-[80px] flex-shrink-0">数据类型</div>
                  <div className="w-[70px] flex-shrink-0 text-center">是否必填</div>
                </div>
                {table.columns.map((col, i) => (
                  <div
                    key={col.name}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs border-b"
                    style={{ borderColor: 'var(--cursor-border-10)' }}
                  >
                    <div className="w-[160px] flex-shrink-0">
                      <span className="font-mono font-medium" style={{ color: 'var(--cursor-ink)' }}>{col.name}</span>
                    </div>
                    <div className="flex-1">
                      <span style={{ color: 'var(--cursor-border-55)' }}>{col.desc}</span>
                    </div>
                    <div className="w-[80px] flex-shrink-0 text-center">
                      {col.indexed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 mx-auto" style={{ color: 'var(--cursor-success)' }} />
                      ) : (
                        <span style={{ color: 'var(--cursor-border-55)' }}>—</span>
                      )}
                    </div>
                    <div className="w-[80px] flex-shrink-0">
                      <TypeBadge type={col.type} />
                    </div>
                    <div className="w-[70px] flex-shrink-0 text-center">
                      <span style={{ color: col.required ? 'var(--cursor-orange)' : 'var(--cursor-border-55)' }}>
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
      <div className="rounded-lg border p-3" style={{ borderColor: 'var(--cursor-border-10)', background: 'hsl(33 80% 97%)' }}>
        <p className="text-[11px] flex items-start gap-2" style={{ color: 'var(--cursor-border-55)' }}>
          <BookOpen className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--cursor-gold)' }} />
          <span>
            <strong style={{ color: 'var(--cursor-ink)' }}>字段对齐提示：</strong>
            订单表 <code className="text-[10px] font-mono px-1 py-0.5 rounded" style={{ background: 'var(--cursor-surface-300)' }}>order_id / status / number</code> 对应订单处理工作流 Node B (查询订单信息) 的 DB 查询输出；
            分类定义表 <code className="text-[10px] font-mono px-1 py-0.5 rounded" style={{ background: 'var(--cursor-surface-300)' }}>chat2 / sm</code> 对应 AIQC_V2 Node 4 (分类质检) 的分类匹配依据；
            SOP 表 <code className="text-[10px] font-mono px-1 py-0.5 rounded" style={{ background: 'var(--cursor-surface-300)' }}>cat / sop</code> 对应 AIQC_V2 Node 3 (工单操作专家) 的 SOP 校验规则输入；
            订单消息表 <code className="text-[10px] font-mono px-1 py-0.5 rounded" style={{ background: 'var(--cursor-surface-300)' }}>order_id / status / number</code> 用于追踪订单状态流转。
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

export default function FieldRegistry() {
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
    <div className="flex h-full flex-col" data-component="field-registry">
      {/* Content area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Compact inline sub-nav — replaces the old header bar */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2" style={{ background: 'var(--cursor-canvas)' }}>
          <div className="flex items-center rounded-lg border p-0.5" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
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
                >
                  <Icon className="h-3 w-3" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Stats */}
          <div className="ml-auto flex items-center gap-3 text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
            <span>共 {stats.total} 字段</span>
            <span className="flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" style={{ color: 'var(--cursor-success)' }} /> {stats.mapped} 已映射</span>
            <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" style={{ color: 'var(--cursor-gold)' }} /> {stats.pending} 待映射</span>
            <span className="flex items-center gap-0.5"><Zap className="h-2.5 w-2.5" /> {stats.internal} 内部</span>
          </div>
        </div>
        {activeTab === 'fields' && (
          <div className="p-4 space-y-4">
            {/* Workflow overview cards */}
            <div className="grid grid-cols-2 gap-3">
              <WorkflowOverviewCard
                meta={WORKFLOW_META.aiqc_v2}
                fieldCount={FIELD_REGISTRY.filter(f => f.workflow === 'aiqc_v2').length}
                nodeCount={7}
                connectionCount={WORKFLOW_CONNECTIONS.filter(c => c.workflow === 'aiqc_v2').length}
              />
              <WorkflowOverviewCard
                meta={WORKFLOW_META.order_processing}
                fieldCount={FIELD_REGISTRY.filter(f => f.workflow === 'order_processing').length}
                nodeCount={11}
                connectionCount={WORKFLOW_CONNECTIONS.filter(c => c.workflow === 'order_processing').length}
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap" data-component="field-filters">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--cursor-border-55)' }} />
                <input
                  type="text"
                  placeholder="搜索字段 ID、名称、Coze 变量、七鱼映射..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border py-1.5 pl-8 pr-3 text-xs outline-none transition-colors focus:border-[var(--cursor-orange)]"
                  style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)', color: 'var(--cursor-ink)' }}
                />
              </div>
              <select
                value={filterWorkflow}
                onChange={(e) => setFilterWorkflow(e.target.value)}
                className="rounded-md border px-2 py-1.5 text-xs outline-none"
                style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)', color: 'var(--cursor-ink)' }}
              >
                {FILTER_OPTIONS.workflow.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select
                value={filterDirection}
                onChange={(e) => setFilterDirection(e.target.value)}
                className="rounded-md border px-2 py-1.5 text-xs outline-none"
                style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)', color: 'var(--cursor-ink)' }}
              >
                {FILTER_OPTIONS.direction.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-md border px-2 py-1.5 text-xs outline-none"
                style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)', color: 'var(--cursor-ink)' }}
              >
                {FILTER_OPTIONS.status.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Field table */}
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)' }} data-component="field-table">
              {/* Table header */}
              <div className="flex items-center gap-3 border-b px-4 py-2 text-[10px] font-medium uppercase tracking-wider" style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)', color: 'var(--cursor-border-55)' }}>
                <div className="w-5 flex-shrink-0" />
                <div className="w-[140px] flex-shrink-0">字段 ID</div>
                <div className="w-[120px] flex-shrink-0">名称</div>
                <div className="w-[70px] flex-shrink-0">类型</div>
                <div className="w-[80px] flex-shrink-0">方向</div>
                <div className="flex-1 min-w-0">所属节点</div>
                <div className="w-[100px] flex-shrink-0">Coze 变量</div>
                <div className="w-[100px] flex-shrink-0">七鱼映射</div>
                <div className="w-[70px] flex-shrink-0">状态</div>
              </div>

              {/* Table body */}
              {filteredFields.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs" style={{ color: 'var(--cursor-border-55)' }}>
                  <Filter className="h-5 w-5 mx-auto mb-2 opacity-40" />
                  没有匹配的字段，请调整筛选条件
                </div>
              ) : (
                filteredFields.map(field => (
                  <FieldDetailRow
                    key={field.id}
                    field={field}
                    expanded={expandedField === field.id}
                    onToggle={() => setExpandedField(expandedField === field.id ? null : field.id)}
                  />
                ))
              )}
            </div>

            <p className="text-[10px] text-center" style={{ color: 'var(--cursor-border-55)' }}>
              显示 {filteredFields.length} / {FIELD_REGISTRY.length} 字段 · 点击行展开详情
            </p>
          </div>
        )}

        {activeTab === 'database' && <DatabaseTablesPanel />}

        {activeTab === 'connections' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <select
                className="rounded-md border px-2 py-1.5 text-xs outline-none"
                style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)', color: 'var(--cursor-ink)' }}
                value={filterWorkflow}
                onChange={(e) => setFilterWorkflow(e.target.value)}
              >
                <option value="all">全部工作流</option>
                <option value="aiqc_v2">AIQC_V2</option>
                <option value="order_processing">订单处理</option>
              </select>
            </div>
            <ConnectionsTable connections={WORKFLOW_CONNECTIONS} workflow={filterWorkflow} />
          </div>
        )}

        {activeTab === 'intents' && (
          <div className="p-4 space-y-4">
            <IntentScenesTable />
          </div>
        )}

        {activeTab === 'reference' && (
          <div className="p-4 space-y-4">
            <ScreenshotReferencePanel />
          </div>
        )}
      </div>
    </div>
  )
}
