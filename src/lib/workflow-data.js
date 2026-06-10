// Palantir-style workflow data model for HEYTEA Food Safety Agent
// Mirrors Coze workflow structure for low-code/high-code integration

export const NODE_TYPES = {
  trigger: { label: '触发器', icon: 'Zap', color: '#dfa88f', description: '对话入口或事件触发' },
  llm: { label: 'LLM 调用', icon: 'Brain', color: '#c0a8dd', description: '大模型推理节点' },
  classifier: { label: '分类器', icon: 'GitBranch', color: '#9fbbe0', description: '食安问题自动分类' },
  condition: { label: '条件分支', icon: 'GitFork', color: '#f54e00', description: '基于条件分流处理' },
  plugin: { label: '插件调用', icon: 'Puzzle', color: '#9fc9a2', description: '调用外部业务 API' },
  script: { label: '话术生成', icon: 'MessageCircle', color: '#dfa88f', description: '生成客服回复话术' },
  action: { label: '执行动作', icon: 'Play', color: '#cf2d56', description: '创建工单/通知/补偿' },
  knowledge: { label: '知识库检索', icon: 'BookOpen', color: '#9fbbe0', description: 'RAG 向量检索' },
  human: { label: '人工介入', icon: 'UserCheck', color: '#c08532', description: '转接人工客服' },
  delay: { label: '延时等待', icon: 'Clock', color: 'rgba(38, 37, 30, 0.4)', description: '等待指定时间后继续' },
  // ─── Coze 兼容节点类型 ───
  code: { label: '代码执行', icon: 'Code', color: '#6366f1', description: '执行自定义 JS/Python 代码' },
  variable: { label: '变量赋值', icon: 'Variable', color: '#8b5cf6', description: '声明或赋值工作流变量' },
  http_request: { label: 'HTTP 请求', icon: 'Globe', color: '#0891b2', description: '发送 HTTP 请求到外部服务' },
  end: { label: '结束', icon: 'Square', color: '#64748b', description: '工作流终止并输出结果' },
  question: { label: '问答节点', icon: 'HelpCircle', color: '#d97706', description: '向用户提问并等待回复' },
  loop: { label: '循环', icon: 'Repeat', color: '#059669', description: '遍历数组逐项处理' },
}

/* ─── Model Registry (compatible with DashScope / self-hosted) ─── */
export const MODEL_OPTIONS = [
  { id: 'qwen2.5-vl-finetuned', label: 'Qwen2.5-VL 微调版', provider: 'self-hosted', type: 'vision', note: '食安分类专用，RTX 6000 部署' },
  { id: 'qwen-vl-max', label: 'Qwen-VL-Max', provider: 'dashscope', type: 'vision', note: '多模态 2 代，云端 API' },
  { id: 'qwen-max', label: 'Qwen-Max', provider: 'dashscope', type: 'text', note: '通用对话，回复生成' },
  { id: 'qwen-turbo', label: 'Qwen-Turbo', provider: 'dashscope', type: 'text', note: '轻量快速，意图识别' },
  { id: 'qwen3.7-vl', label: 'Qwen3.7-VL (实验)', provider: 'self-hosted', type: 'vision', note: '待部署，需评估显存' },
  { id: 'intent-ximi-7b', label: '西米意图识别 7B', provider: 'self-hosted', type: 'text', note: '已微调上线，VB7 架构' },
]

/* ─── Classifier Category Config (with sample distribution) ─── */
export const CLASSIFIER_CATEGORIES = [
  { id: 'foreign-body-ext', label: '外源性异物', samples: 142, weight: 1.0, children: ['毛发', '塑料片', '金属', '昆虫'] },
  { id: 'foreign-body-int', label: '内源性异物', samples: 87, weight: 1.2, children: ['茶渣', '果肉结块', '杯壁残留'] },
  { id: 'health-concern', label: '身体不适', samples: 34, weight: 2.5, children: ['腹痛', '腹泻', '过敏反应', '恶心呕吐'] },
  { id: 'ingredient-spoilage', label: '原料变质', samples: 98, weight: 1.0, children: ['OEM原料', '鲜果变质', '乳制品过期'] },
  { id: 'shelf-life', label: '产品有效期', samples: 56, weight: 1.5, children: ['过期销售', '临期未标注'] },
  { id: 'abnormal-taste', label: '饮品异味', samples: 63, weight: 1.3, children: ['化学味', '酸败味', '异味混入'] },
  { id: 'packaging', label: '包装问题', samples: 28, weight: 1.8, children: ['漏杯', '封口破损', '标签错误'] },
  { id: 'temperature', label: '温度异常', samples: 15, weight: 2.0, children: ['热饮不热', '冷饮不冷'] },
  { id: 'other', label: '其他/未分类', samples: 93, weight: 0.5, children: [] },
]

export const MOCK_WORKFLOWS = [
  {
    id: 'wf-main',
    name: '食安主控流程',
    description: '消费者食安投诉的端到端处理流程',
    status: 'active',
    version: '2.1',
    updatedAt: '2026-06-05T10:00:00',
    nodes: [
      {
        id: 'n-trigger',
        type: 'trigger',
        label: '用户输入',
        x: 60, y: 200,
        config: { triggerType: 'message', channel: ['wechat', 'app', 'web'] },
      },
      {
        id: 'n-classify',
        type: 'classifier',
        label: '食安分类',
        x: 260, y: 200,
        config: {
          model: 'qwen2.5-vl-finetuned',
          categories: ['外源性异物', '内源性异物', '身体不适', '原料变质', '产品有效期', '饮品异味', '包装问题', '温度异常', '食安待确认', 'OEM变质', 'OEM过期', '其他/未分类'],
          confidence_threshold: 0.85,
          sample_weights_enabled: true,
          fallback_to_human: true,
        },
      },
      {
        id: 'n-knowledge',
        type: 'knowledge',
        label: '知识库检索',
        x: 460, y: 120,
        config: {
          index: 'food_safety_kb_v2',
          topK: 3,
          similarity_threshold: 0.7,
        },
      },
      {
        id: 'n-risk',
        type: 'condition',
        label: '风险评估',
        x: 460, y: 280,
        config: {
          branches: [
            { condition: 'risk_level == "high"', target: 'n-human' },
            { condition: 'risk_level == "medium"', target: 'n-plugin-history' },
            { condition: 'risk_level == "low"', target: 'n-script-low' },
          ],
        },
      },
      {
        id: 'n-plugin-history',
        type: 'plugin',
        label: '查询历史',
        x: 660, y: 200,
        config: {
          plugin: 'query_history',
          params: { lookback_days: 30, phone: '{{user.phone}}', order_id: '{{order.id}}' },
        },
      },
      {
        id: 'n-llm-reply',
        type: 'llm',
        label: '回复生成',
        x: 660, y: 360,
        config: {
          model: 'qwen-max',
          model_options: ['qwen-max', 'qwen-turbo', 'qwen-vl-max', 'qwen3.7-vl'],
          temperature: 0.7,
          system_prompt: '你是喜茶的食品安全客服助手"阿喜"，语气温暖专业...',
          max_tokens: 800,
        },
      },
      {
        id: 'n-script-low',
        type: 'script',
        label: '低风险话术',
        x: 660, y: 120,
        config: {
          template_id: 'tpl-low-risk',
          variables: ['category', 'product_name', 'store_name'],
        },
      },
      {
        id: 'n-plugin-compensation',
        type: 'plugin',
        label: '补偿方案',
        x: 860, y: 200,
        config: {
          plugin: 'query_compensation',
          params: {
            food_safety_label: '{{classify.result}}',
            risk_level: '{{risk.level}}',
            order_verified: '{{order.verified}}',
            amount: '{{order.amount}}',
          },
        },
      },
      {
        id: 'n-human',
        type: 'human',
        label: '人工升级',
        x: 860, y: 360,
        config: {
          escalation_group: 'region_manager',
          sla_hours: 1,
          notify_channels: ['dingtalk', 'sms'],
        },
      },
      {
        id: 'n-action-ticket',
        type: 'action',
        label: '创建工单',
        x: 1060, y: 280,
        config: {
          action: 'create_ticket',
          priority: '{{risk.level}}',
          assignee: '{{store.handler_group}}',
          sla: '{{compensation.store_callback_sla_hours}}h',
        },
      },
    ],
    edges: [
      { from: 'n-trigger', to: 'n-classify' },
      { from: 'n-classify', to: 'n-knowledge' },
      { from: 'n-classify', to: 'n-risk' },
      { from: 'n-knowledge', to: 'n-llm-reply' },
      { from: 'n-risk', to: 'n-plugin-history', branch: 'medium' },
      { from: 'n-risk', to: 'n-human', branch: 'high' },
      { from: 'n-risk', to: 'n-script-low', branch: 'low' },
      { from: 'n-plugin-history', to: 'n-plugin-compensation' },
      { from: 'n-plugin-compensation', to: 'n-action-ticket' },
      { from: 'n-script-low', to: 'n-llm-reply' },
      { from: 'n-llm-reply', to: 'n-action-ticket' },
      { from: 'n-human', to: 'n-action-ticket' },
    ],
  },
  {
    id: 'wf-followup',
    name: '回访跟进流程',
    description: '工单创建后的门店回访和客户跟进',
    status: 'draft',
    version: '1.0',
    updatedAt: '2026-06-04T15:00:00',
    nodes: [
      { id: 'fu-start', type: 'trigger', label: '工单触发', x: 60, y: 200, config: { triggerType: 'ticket_created', inputs: ['ticket_id', 'store_name', 'customer_phone', 'category'] } },
      { id: 'fu-delay', type: 'delay', label: '等待处理', x: 260, y: 200, config: { seconds: 14400, description: '等待4小时让门店处理' } },
      { id: 'fu-query', type: 'plugin', label: '查询工单状态', x: 460, y: 200, config: { plugin: 'query_history', params: { ticket_id: '{{fu-start.ticket_id}}' } } },
      { id: 'fu-condition', type: 'condition', label: '是否已处理', x: 660, y: 200, config: { branches: [{ condition: 'status == "resolved"', target: 'fu-verify' }, { condition: 'status == "pending"', target: 'fu-remind' }] } },
      { id: 'fu-remind', type: 'action', label: '发送提醒', x: 660, y: 100, config: { action: 'send_reminder', channel: ['dingtalk', 'sms'], message: '工单 {{fu-start.ticket_id}} 尚未处理，请尽快跟进' } },
      { id: 'fu-verify', type: 'question', label: '确认满意度', x: 860, y: 200, config: { question: '您好，关于您反馈的{{fu-start.category}}问题，门店已处理完毕。请问您对处理结果是否满意？', type: 'selection', options: ['非常满意', '满意', '一般', '不满意'] } },
      { id: 'fu-satisfaction', type: 'condition', label: '满意度判断', x: 1060, y: 200, config: { branches: [{ condition: 'answer == "不满意"', target: 'fu-escalate' }, { condition: 'answer != "不满意"', target: 'fu-close' }] } },
      { id: 'fu-escalate', type: 'human', label: '二次升级', x: 1060, y: 100, config: { escalation_group: 'senior_manager', sla_hours: 2, notify_channels: ['dingtalk'] } },
      { id: 'fu-close', type: 'end', label: '结案', x: 1260, y: 200, config: { outputs: ['ticket_id', 'satisfaction', 'resolution_time'] } },
    ],
    edges: [
      { from: 'fu-start', to: 'fu-delay' },
      { from: 'fu-delay', to: 'fu-query' },
      { from: 'fu-query', to: 'fu-condition' },
      { from: 'fu-condition', to: 'fu-remind', branch: 'pending' },
      { from: 'fu-condition', to: 'fu-verify', branch: 'resolved' },
      { from: 'fu-remind', to: 'fu-verify' },
      { from: 'fu-verify', to: 'fu-satisfaction' },
      { from: 'fu-satisfaction', to: 'fu-escalate', branch: 'unsatisfied' },
      { from: 'fu-satisfaction', to: 'fu-close', branch: 'satisfied' },
    ],
  },
  {
    id: 'wf-escalation',
    name: '紧急升级流程',
    description: '高风险食安事件的紧急上报和处置链路',
    status: 'active',
    version: '1.3',
    updatedAt: '2026-06-03T09:00:00',
    nodes: [
      { id: 'esc-start', type: 'trigger', label: '事件触发', x: 60, y: 200, config: { triggerType: 'high_risk_alert', inputs: ['case_id', 'risk_level', 'category', 'customer_phone', 'store_name', 'description'] } },
      { id: 'esc-classify', type: 'classifier', label: '风险定级', x: 260, y: 200, config: { model: 'qwen-max', categories: ['一级(生命安全)', '二级(群体事件)', '三级(媒体风险)', '四级(个案投诉)'], confidence_threshold: 0.9 } },
      { id: 'esc-condition', type: 'condition', label: '风险等级判断', x: 460, y: 200, config: { branches: [{ condition: 'result contains "一级"', target: 'esc-immediate' }, { condition: 'result contains "二级"', target: 'esc-team' }, { condition: 'result contains "三级"', target: 'esc-pr' }, { condition: 'result contains "四级"', target: 'esc-normal' }] } },
      { id: 'esc-immediate', type: 'action', label: '即时响应', x: 660, y: 80, config: { action: 'emergency_response', notify: ['CEO', 'VP_operations', 'legal', 'safety_officer'], sla_minutes: 15, channels: ['phone', 'dingtalk', 'sms'] } },
      { id: 'esc-team', type: 'action', label: '团队响应', x: 660, y: 180, config: { action: 'team_response', notify: ['regional_manager', 'quality_team'], sla_hours: 1, channels: ['dingtalk', 'sms'] } },
      { id: 'esc-pr', type: 'action', label: '公关响应', x: 660, y: 280, config: { action: 'pr_response', notify: ['pr_team', 'brand_manager'], sla_hours: 2, channels: ['dingtalk'] } },
      { id: 'esc-normal', type: 'plugin', label: '常规处理', x: 660, y: 380, config: { plugin: 'query_compensation', params: { risk_level: '{{esc-classify.result}}', case_id: '{{esc-start.case_id}}' } } },
      { id: 'esc-track', type: 'code', label: '记录追踪', x: 860, y: 200, config: { language: 'javascript', code: 'const now = new Date().toISOString();\nreturn { tracked_at: now, case_id: input.case_id || "unknown", action_taken: "escalation_logged" };' } },
      { id: 'esc-end', type: 'end', label: '升级完成', x: 1060, y: 200, config: { outputs: ['case_id', 'escalation_level', 'response_team', 'sla_deadline'] } },
    ],
    edges: [
      { from: 'esc-start', to: 'esc-classify' },
      { from: 'esc-classify', to: 'esc-condition' },
      { from: 'esc-condition', to: 'esc-immediate', branch: 'level1' },
      { from: 'esc-condition', to: 'esc-team', branch: 'level2' },
      { from: 'esc-condition', to: 'esc-pr', branch: 'level3' },
      { from: 'esc-condition', to: 'esc-normal', branch: 'level4' },
      { from: 'esc-immediate', to: 'esc-track' },
      { from: 'esc-team', to: 'esc-track' },
      { from: 'esc-pr', to: 'esc-track' },
      { from: 'esc-normal', to: 'esc-track' },
      { from: 'esc-track', to: 'esc-end' },
    ],
  },
  {
    id: 'wf-order-verify',
    name: '订单核验工作流',
    nameEn: 'FoodSafety_OrderVerify_v1',
    description: '食安工单前置订单核验：抽取订单信息 → 判断是否有订单号/手机号 → 调用 query_order 插件 → 规范化结果',
    status: 'standby',
    version: '1.0',
    updatedAt: '2026-06-08T18:00:00',
    source: 'codex',
    nodes: [
      {
        id: 'ov-start', type: 'trigger', label: '开始',
        x: 60, y: 200,
        config: { inputs: ['CONTENT_INPUT', 'CONVERSATION_ID', 'image_urls'] },
      },
      {
        id: 'ov-extract', type: 'llm', label: '订单信息抽取与清洗',
        x: 260, y: 200,
        config: {
          model: '豆包·1.5·Pro·32k',
          description: '从对话中抽取 order_id, phone, store_name 并清洗格式',
          outputs: ['order_id', 'phone', 'store_name', 'query_key_type', 'query_key'],
        },
      },
      {
        id: 'ov-condition', type: 'condition', label: '是否有订单号/手机号',
        x: 460, y: 200,
        config: {
          condition: 'order_id 或 phone 非空',
          branches: {
            yes: 'ov-query',
            no: 'ov-missing',
          },
        },
      },
      {
        id: 'ov-query', type: 'plugin', label: '订单查询(query_order)',
        x: 660, y: 140,
        config: {
          plugin: 'query_order',
          params: { order_id: '{{ov-extract.order_id}}', phone: '{{ov-extract.phone}}', store_name: '{{ov-extract.store_name}}', scene: 'food_safety' },
          description: '调用订单查询插件核验订单，未接真实API时返回 ORDER_API_NOT_CONFIGURED',
        },
      },
      {
        id: 'ov-normalize', type: 'script', label: '订单结果规范化',
        x: 860, y: 140,
        config: {
          description: '将 query_order 插件输出 + 抽取节点输出合并为统一结构',
          inputs: ['order_query_result', 'query_key_type', 'query_key', 'order_id_input', 'phone_input'],
        },
      },
      {
        id: 'ov-missing', type: 'action', label: '缺失订单返回',
        x: 660, y: 280,
        config: {
          description: '无订单号/手机号时返回固定结构：order_verified=false, next_action_hint=ask_order_or_phone',
          outputs: ['order_verified', 'query_key_type', 'next_action_hint', 'order_summary', 'missing_fields'],
        },
      },
      {
        id: 'ov-end', type: 'trigger', label: '结束',
        x: 1060, y: 200,
        config: { outputs: ['order_verified', 'order_summary', 'next_action_hint', 'error_code'] },
      },
    ],
    edges: [
      { from: 'ov-start', to: 'ov-extract' },
      { from: 'ov-extract', to: 'ov-condition' },
      { from: 'ov-condition', to: 'ov-query', label: '有订单号/手机号' },
      { from: 'ov-condition', to: 'ov-missing', label: '无订单信息' },
      { from: 'ov-query', to: 'ov-normalize' },
      { from: 'ov-normalize', to: 'ov-end' },
      { from: 'ov-missing', to: 'ov-end' },
    ],
  },
]

export const SCRIPT_TEMPLATES = [
  {
    id: 'tpl-low-risk',
    name: '低风险标准话术',
    category: '低风险回复',
    template: `您好！感谢您反馈的情况。\n\n根据您描述的「{{category}}」问题，阿喜为您建议以下处理方案：\n\n{{#if product_name}}关于您购买的**{{product_name}}**，{{/if}}我们可以为您安排重新制作一杯，或者为您申请{{coupon_amount}}元代金券作为补偿。\n\n请问您更倾向哪种方式呢？`,
    variables: ['category', 'product_name', 'store_name', 'coupon_amount'],
    updatedAt: '2026-06-05',
  },
  {
    id: 'tpl-foreign-body',
    name: '外源性异物话术',
    category: '异物处理',
    template: `非常抱歉给您带来了不好的体验。阿喜非常重视您反馈的异物问题。\n\n根据您的描述，这属于**{{subcategory}}**类情况。为了更好地帮您处理：\n\n1. 请问方便拍照发给我吗？照片有助于更准确地判断\n2. 您是在哪家门店购买的？\n3. 方便提供订单号或下单手机号吗？\n\n阿喜会全程跟进，确保问题得到妥善解决。门店伙伴会在{{sla_hours}}小时内与您联系。`,
    variables: ['subcategory', 'sla_hours', 'store_name'],
    updatedAt: '2026-06-04',
  },
  {
    id: 'tpl-health-concern',
    name: '身体不适话术',
    category: '健康类处理',
    template: `听到您身体不舒服，阿喜非常重视，也非常担心。\n\n**首先请您注意**：如果您目前仍感到不适，建议您及时就医，身体健康是最重要的。\n\n为了更好地跟进处理，请告诉我：\n1. 您饮用了什么产品？在哪家门店购买的？\n2. 您目前的具体症状是什么？\n3. 是什么时候开始感到不舒服的？\n\n阿喜会立即通知相关负责人跟进处理。`,
    variables: ['symptoms', 'product_name', 'store_name'],
    updatedAt: '2026-06-03',
  },
  {
    id: 'tpl-compensation-offer',
    name: '补偿方案话术',
    category: '补偿沟通',
    template: `为了弥补这次不好的体验，阿喜为您申请了以下方案：\n\n{{#if refund_amount}}- 全额退款 **{{refund_amount}}元**\n{{/if}}{{#if coupon_amount}}- **{{coupon_amount}}元代金券**（有效期{{coupon_valid_days}}天）\n{{/if}}{{#if store_callback}}- 门店伙伴会在**{{store_callback_sla_hours}}小时**内与您联系确认\n{{/if}}\n请问这个方案您是否满意？如果有其他需要，阿喜会继续帮您跟进。`,
    variables: ['refund_amount', 'coupon_amount', 'coupon_valid_days', 'store_callback', 'store_callback_sla_hours'],
    updatedAt: '2026-06-05',
  },
]

export const PLUGINS = [
  {
    id: 'query_compensation',
    name: '补偿方案查询',
    description: '根据食安标签、风险等级和订单信息，查询或生成可建议的补偿方案',
    status: 'active',
    version: '1.2',
    endpoint: { url: 'https://api.coze.cn/v3/plugins/query_compensation', method: 'POST', auth: 'bearer_token', timeout: 5000 },
    inputFields: ['case_id', 'food_safety_label', 'risk_level', 'order_verified', 'order_id', 'phone', 'store_name', 'product_name', 'amount', 'image_status'],
    outputFields: ['compensation_allowed', 'solution_type', 'refund_amount', 'coupon_amount', 'store_callback_required', 'human_followup_required'],
    lastUsed: '2026-06-05T10:30:00',
    callCount: 342,
  },
  {
    id: 'query_history',
    name: '历史投诉查询',
    description: '查询顾客历史投诉和食安记录，判断重复投诉和高风险顾客',
    status: 'standby',
    version: '1.0',
    endpoint: { url: 'https://api.coze.cn/v3/plugins/query_history', method: 'POST', auth: 'bearer_token', timeout: 8000 },
    inputFields: ['customer_id', 'phone', 'order_id', 'food_safety_label', 'store_name', 'lookback_days'],
    outputFields: ['history_found', 'repeat_customer', 'complaint_count', 'food_safety_count', 'high_risk_history'],
    lastUsed: '2026-06-04T16:00:00',
    callCount: 128,
  },
  {
    id: 'store_query',
    name: '门店信息查询',
    description: '查询订单或门店对应的门店信息、区域信息和回访处理建议',
    status: 'standby',
    version: '1.0',
    endpoint: { url: 'https://api.coze.cn/v3/plugins/store_query', method: 'POST', auth: 'bearer_token', timeout: 5000 },
    inputFields: ['store_id', 'store_name', 'order_id', 'city', 'food_safety_label', 'risk_level'],
    outputFields: ['store_found', 'store_id', 'store_name', 'city', 'district', 'handler_group', 'callback_sla_hours'],
    lastUsed: '2026-06-03T14:00:00',
    callCount: 89,
  },
  {
    id: 'query_order',
    name: '订单核验查询',
    description: '根据订单号或手机号查询订单信息，核验订单状态、门店、产品、金额等，用于食安工单前置核验',
    status: 'standby',
    version: '1.0',
    endpoint: { url: 'https://api.coze.cn/v3/plugins/query_order', method: 'POST', auth: 'bearer_token', timeout: 5000 },
    inputFields: ['order_id', 'phone', 'store_name', 'scene'],
    outputFields: [
      'success', 'order_verified', 'query_key_type', 'query_key', 'order_id', 'phone',
      'store_name', 'product_name', 'amount', 'order_time', 'platform', 'status',
      'missing_fields', 'next_action_hint', 'order_summary', 'error_code', 'error_message', 'raw_order_result',
    ],
    lastUsed: '2026-06-08T14:00:00',
    callCount: 56,
    source: 'codex',
    workflowBinding: 'FoodSafety_OrderVerify_v1',
    codeLanguage: 'TypeScript',
    codeSnippet: `import { Args } from "@/runtime";

function maskPhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/^(\\d{3})\\d{4}(\\d{4})$/, "$1****$2");
}

export async function handler({ input, logger }: Args<any>): Promise<any> {
  const orderId = String(input.order_id || "").trim();
  const phone = String(input.phone || "").trim();
  const storeName = String(input.store_name || "").trim();
  const scene = String(input.scene || "food_safety").trim();

  if (!orderId && !phone) {
    return { success: false, order_verified: false, query_key_type: "missing", error_code: "MISSING_ORDER_KEY" };
  }
  // TODO: 接入真实订单 API
  return { success: false, order_verified: false, error_code: "ORDER_API_NOT_CONFIGURED" };
}`,
  },
]

export const EXECUTION_LOG = [
  { id: 'log-001', workflow: '食安主控流程', timestamp: '10:32:15', status: 'success', duration: '2.3s', summary: '外源性异物/毛发 → 中风险 → 退款+代金券' },
  { id: 'log-002', workflow: '食安主控流程', timestamp: '10:28:40', status: 'success', duration: '1.8s', summary: '饮品异味 → 中风险 → 重做或退款' },
  { id: 'log-003', workflow: '食安主控流程', timestamp: '10:15:22', status: 'escalated', duration: '0.5s', summary: '身体不适 → 高风险 → 人工升级' },
  { id: 'log-004', workflow: '紧急升级流程', timestamp: '09:45:10', status: 'success', duration: '3.1s', summary: 'OEM变质 → 高风险 → 建单+区域负责人' },
  { id: 'log-005', workflow: '食安主控流程', timestamp: '09:30:55', status: 'success', duration: '1.5s', summary: '内源性异物/茶渣 → 低风险 → 重做' },
]
