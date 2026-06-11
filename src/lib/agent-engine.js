/**
 * 阿喜食安客服 Agent 引擎 — AIQC_V2 架构 + 感知-决策-执行闭环
 * 多模型、多阶段质检工作流管线
 * 严格对齐 Coze AIQC_V2 工作流节点定义
 *
 * ─── 理论基础 ───
 * 基于具身大模型理论 "感知-决策-行动" 闭环 (空间智能范式):
 *   PerceptionLayer  — 多通道信号融合感知 (情绪/意图/风险/信息完整度)
 *   AgentMemory      — 外置记忆系统 (短期/情景/身份记忆)
 *   DecisionLayer    — CoT 推理链 + Least-to-Most 任务分解 + 反思机制
 *   ActionLayer      — 工具选择与执行 + 反馈信号
 *   ClosedLoopEngine — 感知→决策→行动→再感知 闭环自适应
 *
 * ─── AIQC_V2 节点总览 ───
 *   Node 1   — 开始 (Start / Input Normalization)
 *   Node 2   — 对话解构+服务分析 (Dialogue Deconstruction + Service Analysis)  [豆包·1.8·深度思考]
 *   Node 3   — 工单操作专家 (Business Process Expert)                          [豆包·1.5·Lite·32k]
 *   Node 4   — 对话分类质检专家 (Classification QC Expert)                     [豆包·1.6·极致速度]
 *   Node 5   — 红线行为检测 (Red Line Detection / Risk Control)                [豆包·1.5·Lite·32k]
 *   Node 5.5 — 红线报警器 (Red Line Alert / Conditional Branch)
 *   Node 6   — 结案 (Conclusion)
 *
 * 保留: 贝叶斯食安分类、5 级补偿矩阵、3 级升级体系、阿喜人设回复
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1 — COZE FIELD MAP (19 输入字段)
// ═══════════════════════════════════════════════════════════════════════════

export const COZE_FIELD_MAP = Object.freeze({
  CONTENT_INPUT:    { type: 'string',  desc: '对话完整内容（多轮拼接）',         required: true  },
  CONVERSATION_ID:  { type: 'string',  desc: '会话唯一标识',                   required: true  },
  AGENT_NAME:       { type: 'string',  desc: '客服坐席名称',                   required: false },
  CUSTOMER_NAME:    { type: 'string',  desc: '顾客姓名',                       required: false },
  CUSTOMER_TP:      { type: 'string',  desc: '顾客类型标签',                   required: false },
  CUSTOMER_PHONE:   { type: 'string',  desc: '顾客手机号',                     required: false },
  TK_INPUT:         { type: 'string',  desc: '工单输入文本',                   required: false },
  TK_ID:            { type: 'string',  desc: '工单 ID',                        required: false },
  TK_TP:            { type: 'string',  desc: '工单类型',                       required: false },
  CategoryLabel:    { type: 'string',  desc: '分类标签（如 "食安/异物"）',      required: false },
  Order:            { type: 'string',  desc: '订单号',                         required: false },
  Store:            { type: 'string',  desc: '门店名称',                       required: false },
  product:          { type: 'string',  desc: '产品名称',                       required: false },
  START_TIME:       { type: 'string',  desc: '会话开始时间',                   required: false },
  SM:               { type: 'string',  desc: '门店经理 / SM 信息',             required: false },
  SOP:              { type: 'string',  desc: 'SOP 参考规则文本',               required: false },
  HAS_NOT_TOPPED:   { type: 'boolean', desc: '是否未停止（持续对话标记）',      required: false },
  OT:               { type: 'string',  desc: '加班 / 超时标记',                required: false },
  CSAT:             { type: 'string',  desc: '客户满意度评分',                 required: false },
})

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2 — 可配置字段映射 (向后兼容, 已更新为 Coze 真实字段)
// ═══════════════════════════════════════════════════════════════════════════

export const configurableFieldMap = {
  sessionId:      'CONVERSATION_ID',
  userText:       'CONTENT_INPUT',
  mergedText:     'CONTENT_INPUT',
  imageUrls:      'image_urls',
  orderId:        'Order',
  phone:          'CUSTOMER_PHONE',
  channel:        'channel',
  agentName:      'AGENT_NAME',
  customerName:   'CUSTOMER_NAME',
  customerType:   'CUSTOMER_TP',
  ticketInput:    'TK_INPUT',
  ticketId:       'TK_ID',
  ticketType:     'TK_TP',
  categoryLabel:  'CategoryLabel',
  store:          'Store',
  product:        'product',
  startTime:      'START_TIME',
  storeManager:   'SM',
  sop:            'SOP',
  hasNotStopped:  'HAS_NOT_TOPPED',
  overtime:       'OT',
  csat:           'CSAT',
  cozeNodeIds:    {},
  cozePluginNames: {},
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3 — QC 四维度定义 + 红线规则
// ═══════════════════════════════════════════════════════════════════════════

export const QC_DIMENSIONS = Object.freeze({
  '理解能力': {
    definition: '客服是否正确理解顾客意图与诉求',
    redlines: [
      { code: '答非所问', desc: '回复内容完全偏离顾客问题，未针对顾客诉求作答' },
      { code: '张冠李戴', desc: '将 A 顾客的问题/订单信息混淆到 B 顾客' },
    ],
  },
  '表达能力': {
    definition: '客服回复的语言规范性、礼貌性和清晰度',
    redlines: [
      { code: '不礼貌("你")', desc: '使用"你"而非"您"，或直接命令语气' },
      { code: '复读机',       desc: '连续 2 轮以上重复相同话术，未推进问题解决' },
      { code: '违禁词(亲/亲亲/!)', desc: '使用"亲""亲亲"或感叹号"!"等淘宝客服用语' },
      { code: '致命错字',     desc: '关键信息错字导致语义歧义（如金额、产品名错误）' },
      { code: '负面表达',     desc: '使用消极、推诿、否定性表达' },
      { code: '表达不清',     desc: '语句冗长或逻辑混乱，顾客难以理解' },
      { code: '表达过简',     desc: '回复过于简短，缺乏必要信息（<5字敷衍回复）' },
      { code: '回复不正面',   desc: '回避核心问题，不正面回答顾客疑问' },
    ],
  },
  '安抚技巧': {
    definition: '客服对顾客情绪的感知与安抚能力',
    redlines: [
      { code: '情绪视盲1', desc: '顾客发出长段愤怒文字（≥30字含感叹号/负面情绪词），客服完全无视情绪直接回复业务内容' },
      { code: '情绪视盲2', desc: '顾客表达不满后 2 个对话回合内客服仍未表达道歉或共情' },
    ],
  },
  '服务积极性': {
    definition: '客服主动服务意识与边界把控',
    redlines: [
      { code: '模糊投诉未追问', desc: '顾客表达模糊不满（如"不太满意""有点问题"），客服未追问具体原因' },
      { code: '越权承诺退款',     desc: '超出客服权限主动承诺退款金额或方式' },
      { code: '主动退款',         desc: '顾客未提出退款诉求，客服主动提议退款' },
      { code: '生日祝福缺失',     desc: '系统标记顾客生日当天，客服未发送祝福' },
    ],
  },
})

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4 — 6 大红线行为分类
// ═══════════════════════════════════════════════════════════════════════════

export const REDLINE_CATEGORIES = Object.freeze([
  {
    id: 1,
    name: '服务态度红线',
    definition: '客服使用侮辱性、蔑视性语言对待顾客',
    examples: [
      '你懂不懂规矩？',
      '这点小事也要投诉？',
      '你自己不会看吗？',
      '我们没义务给你解释',
    ],
    keywords: ['懂不懂规矩', '小事也', '不会看', '没义务', '活该', '怪谁'],
  },
  {
    id: 2,
    name: '敏感信息红线',
    definition: '客服泄露其他顾客信息或内部敏感数据',
    examples: [
      '你对顾客说的……',
      '我都没说了你还想偷听？',
      '上一个顾客也是这样',
    ],
    keywords: ['上一个顾客', '别的顾客', '其他客户', '内部数据'],
  },
  {
    id: 3,
    name: '内部流程红线',
    definition: '客服暴露公司内部流程、系统名称、工作流节点等技术信息',
    examples: [
      '我们的系统显示……',
      '工单已经流转到XX节点',
      '我们内部分类是食安问题',
    ],
    keywords: ['系统显示', '工单流转', '内部流程', '节点', '工作流', '分类器', '模型', 'JSON', 'Phase'],
  },
  {
    id: 4,
    name: '个人信息红线',
    definition: '客服透露个人联系方式、身份信息或非官方渠道',
    examples: [
      '加我微信xxxxx',
      '我的手机号是……',
      '我用私人号给你转',
    ],
    keywords: ['加微信', '加我', '私人号', '我个人', '我的手机'],
  },
  {
    id: 5,
    name: '客服违规红线',
    definition: '客服讨论非业务范围内的敏感社会话题',
    examples: [
      '我觉得这个政策确实不合理',
      '这种事网上很多人都在说',
    ],
    keywords: ['政策不合理', '网上都在说', '社会事件'],
  },
  {
    id: 6,
    name: '其它违规红线',
    definition: '涉及政治/时事评论、性别/群体对立等极端言论',
    examples: [
      '政治相关评论',
      '性别歧视言论',
      '群体对立言论',
    ],
    keywords: ['政治', '时事', '性别', '歧视', '对立'],
  },
])

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5 — 12 条公共业务规则
// ═══════════════════════════════════════════════════════════════════════════

export const PUBLIC_RULES = Object.freeze([
  {
    id: 1,
    name: '退款状态规则',
    desc: '若订单已完成退款，客服不应重复承诺退款；若退款中，需告知预计到账时间',
    validate(orderCtx) {
      if (!orderCtx) return { pass: true }
      if (orderCtx.hasRefund && orderCtx.refundStatus === 'completed') {
        return { pass: true, note: '订单已退款完成，无需重复处理' }
      }
      if (orderCtx.hasRefund && orderCtx.refundStatus === 'processing') {
        return { pass: true, note: '退款处理中，需告知预计时间' }
      }
      return { pass: true }
    },
  },
  {
    id: 2,
    name: '已完成订单退款规则',
    desc: '已完成订单需先核实退款状态，已退款不可再退，未退款按 SOP 流程',
    validate(orderCtx) {
      if (!orderCtx) return { pass: true }
      if (orderCtx.orderStatus === 'completed' && orderCtx.hasRefund) {
        return { pass: false, reason: '订单已完成且已退款，不可重复退款' }
      }
      return { pass: true }
    },
  },
  {
    id: 3,
    name: '未收到订单处理规则',
    desc: '顾客反馈未收到订单时，需先确认配送状态再决定处理方案',
    validate(orderCtx) {
      if (!orderCtx) return { pass: true }
      if (orderCtx.deliveryStatus === 'delivered') {
        return { pass: true, note: '配送状态为已送达，需进一步核实' }
      }
      return { pass: true }
    },
  },
  {
    id: 4,
    name: '沉默≠拒绝规则',
    desc: '顾客未回复不代表拒绝处理方案，不可据此关闭工单',
    validate(_orderCtx, sessionCtx) {
      if (sessionCtx?.agentClosedOnSilence) {
        return { pass: false, reason: '不可将顾客沉默视为拒绝' }
      }
      return { pass: true }
    },
  },
  {
    id: 5,
    name: '概念区分规则',
    desc: '代金券 ≠ 退款，两者不可混用或互相替代',
    validate(_orderCtx, sessionCtx) {
      if (sessionCtx?.voucherAsRefund) {
        return { pass: false, reason: '代金券与退款概念混淆' }
      }
      return { pass: true }
    },
  },
  {
    id: 6,
    name: '免运费券豁免规则',
    desc: '免运费券不计入代金券补偿额度上限',
    validate(orderCtx) {
      if (!orderCtx) return { pass: true }
      if (orderCtx.compensationType === 'free_shipping_voucher') {
        return { pass: true, note: '免运费券豁免，不受额度上限约束' }
      }
      return { pass: true }
    },
  },
  {
    id: 7,
    name: '顾客主动表达诉求豁免',
    desc: '顾客主动提出退款/补偿诉求时，客服响应不受"主动退款"红线限制',
    validate(_orderCtx, sessionCtx) {
      if (sessionCtx?.customerInitiatedRefund) {
        return { pass: true, note: '顾客主动诉求，豁免主动退款检测' }
      }
      return { pass: true }
    },
  },
  {
    id: 8,
    name: '顾客拒绝后通用处理流程',
    desc: '顾客拒绝初始方案后：代金券 ≤3 张且 ≤30 元/张可同意；>3 张需反馈负责人',
    validate(orderCtx, sessionCtx) {
      if (!sessionCtx?.customerRejected) return { pass: true }
      const voucherCount = sessionCtx.voucherCount || 0
      const voucherAmount = sessionCtx.voucherAmount || 0
      if (voucherCount <= 3 && voucherAmount <= 30) {
        return { pass: true, note: '≤3张且≤30元/张，客服可自行处理' }
      }
      if (voucherCount > 3 || voucherAmount > 30) {
        return { pass: false, reason: `顾客拒绝后补偿超限（${voucherCount}张/${voucherAmount}元/张），需反馈负责人` }
      }
      return { pass: true }
    },
  },
  {
    id: 9,
    name: '免运费券豁免补充',
    desc: '免运费券作为补偿时独立核算，不影响其他补偿方案',
    validate(orderCtx) {
      if (!orderCtx) return { pass: true }
      return { pass: true }
    },
  },
  {
    id: 10,
    name: '模糊放过原则',
    desc: '顾客描述模糊但无明显违规时，不强制追问，按最合理解释处理',
    validate(_orderCtx, sessionCtx) {
      if (sessionCtx?.customerVague && !sessionCtx.hasObviousViolation) {
        return { pass: true, note: '模糊放过，按最合理解释处理' }
      }
      return { pass: true }
    },
  },
  {
    id: 11,
    name: '边界时间规则',
    desc: '21:00 之后视为"21点后"，第 7 天视为"7天内"——时间边界采用包容性解读',
    validate(orderCtx) {
      if (!orderCtx) return { pass: true }
      if (orderCtx.dialogueHour !== undefined) {
        const label = orderCtx.dialogueHour >= 21 ? '21点后' : '21点前'
        return { pass: true, note: `对话时间判定: ${label}` }
      }
      return { pass: true }
    },
  },
  {
    id: 12,
    name: '代金券金额精度',
    desc: '代金券金额必须为整数元，不可出现小数',
    validate(_orderCtx, sessionCtx) {
      const amount = sessionCtx?.voucherAmount
      if (amount !== undefined && amount !== null && !Number.isInteger(amount)) {
        return { pass: false, reason: `代金券金额 ${amount} 非整数` }
      }
      return { pass: true }
    },
  },
])

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6 — 23 标签闭集 + 非食安 (贝叶斯分类)
// ═══════════════════════════════════════════════════════════════════════════

export const LABEL_CLOSED_SET = [
  '食安问题/外源性异物/毛发',
  '食安问题/外源性异物/虫类',
  '食安问题/外源性异物/苍蝇或蟑螂',
  '食安问题/外源性异物/塑料',
  '食安问题/外源性异物/纸类',
  '食安问题/外源性异物/金属',
  '食安问题/外源性异物/杯盖或小白塞',
  '食安问题/外源性异物/不明物',
  '食安问题/内源性异物/果核',
  '食安问题/内源性异物/果皮',
  '食安问题/内源性异物/茶渣',
  '食安问题/内源性异物/水果纤维',
  '食安问题/内源性异物/果蔬杂质或其它原料',
  '食安问题/身体不适/腹泻',
  '食安问题/身体不适/呕吐',
  '食安问题/身体不适/过敏',
  '食安问题/身体不适/其它不适',
  '食安问题/原料变质',
  '食安问题/原料未熟',
  '食安问题/饮品异味',
  '食安问题/产品有效期',
  '食安问题/OEM/OEM过期',
  '食安问题/OEM/OEM变质',
  '非食安问题',
]

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7 — 贝叶斯决策阈值 + 高风险标签 + 边界对 + 证据权重
// ═══════════════════════════════════════════════════════════════════════════

const THRESHOLDS = {
  high_confidence: 0.8,
  minimum_auto_label_confidence: 0.7,
  boundary_margin: 0.2,
  body_discomfort_trigger_probability: 0.3,
  malignant_food_safety_trigger_probability: 0.2,
  food_safety_image_required_probability: 0.5,
}

const HIGH_RISK_LABELS = new Set([
  '食安问题/外源性异物/苍蝇或蟑螂',
  '食安问题/外源性异物/金属',
  '食安问题/身体不适/腹泻',
  '食安问题/身体不适/呕吐',
  '食安问题/身体不适/过敏',
  '食安问题/身体不适/其它不适',
  '食安问题/原料变质',
  '食安问题/原料未熟',
  '食安问题/产品有效期',
  '食安问题/OEM/OEM过期',
  '食安问题/OEM/OEM变质',
])

const KNOWN_BOUNDARY_PAIRS = [
  ['食安问题/OEM/OEM变质', '食安问题/原料变质'],
  ['食安问题/OEM/OEM变质', '食安问题/饮品异味'],
  ['食安问题/产品有效期', '食安问题/OEM/OEM过期'],
  ['食安问题/外源性异物/虫类', '食安问题/外源性异物/苍蝇或蟑螂'],
  ['食安问题/外源性异物/不明物', '食安问题/外源性异物/杯盖或小白塞'],
  ['食安问题/外源性异物/不明物', '食安问题/内源性异物/果蔬杂质或其它原料'],
  ['食安问题/内源性异物/果皮', '食安问题/内源性异物/果蔬杂质或其它原料'],
  ['食安问题/内源性异物/水果纤维', '食安问题/内源性异物/果蔬杂质或其它原料'],
  ['食安问题/身体不适/腹泻', '食安问题/身体不适/其它不适'],
  ['食安问题/身体不适/呕吐', '食安问题/身体不适/其它不适'],
]

const EVIDENCE_WEIGHTS = {
  text: 1.0,
  image: 1.15,
  order_context: 0.9,
  history: 0.7,
  emotion: 0.85,
  business_rule: 1.3,
  quality_training_bad_case: 0.8,
}

const KEYWORD_LIKELIHOOD = {
  '食安问题/身体不适/腹泻':              ['腹泻', '拉肚子', '水样便', '肚子痛'],
  '食安问题/身体不适/呕吐':              ['呕吐', '吐了', '恶心'],
  '食安问题/身体不适/过敏':              ['过敏', '起疹', '喉咙痒', '嘴唇肿'],
  '食安问题/身体不适/其它不适':          ['不舒服', '头晕', '腹痛'],
  '食安问题/外源性异物/毛发':            ['毛发', '头发', '发丝'],
  '食安问题/外源性异物/苍蝇或蟑螂':      ['苍蝇', '蟑螂'],
  '食安问题/外源性异物/虫类':            ['虫', '飞虫', '小虫', '虫子'],
  '食安问题/外源性异物/塑料':            ['塑料', '包装膜', '吸管碎片', '透明硬片'],
  '食安问题/外源性异物/纸类':            ['纸', '标签', '便签', '纸屑', '纸片'],
  '食安问题/外源性异物/金属':            ['金属', '铁丝', '刀片', '订书钉', '铁屑', '玻璃'],
  '食安问题/外源性异物/杯盖或小白塞':    ['杯盖', '小白塞', '封口塞', '盖子'],
  '食安问题/外源性异物/不明物':          ['异物', '黑点', '不明物', '有东西', '品控不行', '品控', '品质问题', '质量问题'],
  '食安问题/内源性异物/果核':            ['果核', '籽', '核', '葡萄籽', '果籽', '颗粒物'],
  '食安问题/内源性异物/果皮':            ['果皮', '葡萄皮', '柠檬皮'],
  '食安问题/内源性异物/茶渣':            ['茶渣', '茶叶', '茶梗', '茶叶梗'],
  '食安问题/内源性异物/水果纤维':        ['水果纤维', '果肉丝', '纤维丝', '果肉块', '果肉残留'],
  '食安问题/内源性异物/果蔬杂质或其它原料': ['原料碎屑', '果蔬杂质'],
  '食安问题/产品有效期':                 ['生产日期', '保质期', '推荐赏味期', '有效期', '日期看不清'],
  '食安问题/OEM/OEM过期':               ['过期'],
  '食安问题/OEM/OEM变质':               ['发霉', '涨袋', '变质', '发酸', '腐坏'],
  '食安问题/饮品异味':                   ['酸臭', '馊味', '异味', '味道不对', '怪味', '味道怪', '难喝', '变味'],
  '食安问题/原料变质':                   ['原料发霉', '腐烂', '明显坏了', '发霉', '变质', '馊了', '酸了'],
  '食安问题/原料未熟':                   ['夹生', '没熟', '未煮熟', '硬', '没煮熟', '半生不熟'],
}

const OEM_CONTEXT_KEYWORDS = ['蛋糕', '瓶装', '包装', '袋装', '茶包', '糕点', '周边食品']

const ACTION_COSTS = {
  miss_body_discomfort: 100,
  miss_high_risk_foreign_object: 90,
  wrong_oem_or_expiry_boundary: 70,
  wrong_spoilage_boundary: 70,
  unnecessary_human_review: 20,
  ask_one_more_info_round: 15,
  repeat_ask_existing_image: 50,
  redline_violation: 100,
  wrong_order_fact: 100,
}

const EMOTION_URGENT_KEYWORDS = [
  '投诉', '曝光', '12315', '媒体', '太差了', '离谱',
  '恶心', '拉肚子', '过敏', '垃圾', '恶心死了', '举报',
]

const REDLINE_FORBIDDEN_WORDS = [
  '赔偿', '工具', '调用', 'order_query', 'Phase', 'JSON',
  '节点', '工作流', '系统', '模型', '分类器', '推理过程',
  '思考过程', '内部', '违法', '承担法律责任', '医疗费',
  '报销', '承担治疗费用',
]

const HIGH_RISK_FOREIGN_OBJECTS = ['金属', '刀片', '玻璃', '活虫', '苍蝇', '蟑螂']

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8 — 贝叶斯食安分类器 (集成至 Node 2)
// ═══════════════════════════════════════════════════════════════════════════

export function classifyFoodSafety(userText, mergedText = '', imageInfo = '', orderContext = '') {
  const combined = (userText + ' ' + mergedText).toLowerCase()
  const isOEMContext = OEM_CONTEXT_KEYWORDS.some(kw => combined.includes(kw))

  const labelScores = {}
  LABEL_CLOSED_SET.forEach(label => { labelScores[label] = 0 })

  // 文本证据
  for (const [label, keywords] of Object.entries(KEYWORD_LIKELIHOOD)) {
    for (const kw of keywords) {
      if (combined.includes(kw)) {
        labelScores[label] = (labelScores[label] || 0) + EVIDENCE_WEIGHTS.text
      }
    }
  }

  // OEM 上下文增强
  if (isOEMContext) {
    labelScores['食安问题/OEM/OEM变质'] += EVIDENCE_WEIGHTS.order_context * 0.5
    labelScores['食安问题/OEM/OEM过期'] += EVIDENCE_WEIGHTS.order_context * 0.5
    labelScores['食安问题/产品有效期']  += EVIDENCE_WEIGHTS.order_context * 0.3
  }

  // 图片证据
  if (imageInfo && imageInfo.length > 0) {
    const imgLower = imageInfo.toLowerCase()
    for (const [label, keywords] of Object.entries(KEYWORD_LIKELIHOOD)) {
      for (const kw of keywords) {
        if (imgLower.includes(kw)) {
          labelScores[label] = (labelScores[label] || 0) + EVIDENCE_WEIGHTS.image
        }
      }
    }
  }

  // 身体不适优先规则
  const bodyDiscomfortLabels = [
    '食安问题/身体不适/腹泻', '食安问题/身体不适/呕吐',
    '食安问题/身体不适/过敏', '食安问题/身体不适/其它不适',
  ]
  const bodyKeywords = ['拉肚子', '腹泻', '呕吐', '吐了', '过敏', '起疹', '喉咙痒', '嘴唇肿', '恶心', '腹痛', '肚子痛', '头晕', '不舒服']
  const bodyHit = bodyKeywords.some(kw => combined.includes(kw))
  if (bodyHit) {
    bodyDiscomfortLabels.forEach(label => {
      labelScores[label] += EVIDENCE_WEIGHTS.business_rule
    })
  }

  // 非食安检测
  const nonFSKeywords = ['退款', '配送', '活动', '会员', '优惠券', '口感', '甜', '淡', '冰多', '少料', '少件', '服务态度']
  const nonFSScore = nonFSKeywords.filter(kw => combined.includes(kw)).length * 0.3
  labelScores['非食安问题'] += nonFSScore

  // Softmax 归一化
  const entries = Object.entries(labelScores)
  const maxScore = Math.max(...entries.map(([, v]) => v), 0.001)
  const expScores = entries.map(([label, score]) => [label, Math.exp(score - maxScore)])
  const sumExp = expScores.reduce((acc, [, v]) => acc + v, 0)
  const posteriors = expScores.map(([label, v]) => ({ label, prob: v / sumExp }))
  posteriors.sort((a, b) => b.prob - a.prob)

  const topLabel = posteriors[0]
  const secondLabel = posteriors[1]
  const isFoodSafety = topLabel.label !== '非食安问题' && topLabel.prob > 0.25

  const boundaryRisk = KNOWN_BOUNDARY_PAIRS.some(
    ([a, b]) => (topLabel.label === a && secondLabel.label === b) || (topLabel.label === b && secondLabel.label === a)
  )

  const confidence = isFoodSafety ? topLabel.prob : Math.max(topLabel.prob, 0.5)

  const isHighRisk = HIGH_RISK_LABELS.has(topLabel.label) ||
    HIGH_RISK_FOREIGN_OBJECTS.some(kw => combined.includes(kw))

  let needHumanReview = false
  const humanReviewReasons = []
  if (bodyHit) { needHumanReview = true; humanReviewReasons.push('身体不适') }
  if (HIGH_RISK_FOREIGN_OBJECTS.some(kw => combined.includes(kw))) { needHumanReview = true; humanReviewReasons.push('高危异物') }
  if (['食安问题/原料变质', '食安问题/OEM/OEM变质', '食安问题/OEM/OEM过期', '食安问题/产品有效期'].includes(topLabel.label)) {
    needHumanReview = true; humanReviewReasons.push('高风险标签')
  }
  if (confidence < THRESHOLDS.minimum_auto_label_confidence) { needHumanReview = true; humanReviewReasons.push('低置信度') }
  if (boundaryRisk) { needHumanReview = true; humanReviewReasons.push('边界风险') }
  if (combined.includes('投诉') || combined.includes('曝光') || combined.includes('12315') || combined.includes('媒体')) {
    needHumanReview = true; humanReviewReasons.push('投诉/曝光/12315')
  }

  const parts = (isFoodSafety ? topLabel.label : '非食安问题').split('/')
  const hasImage = imageInfo && imageInfo.trim().length > 0
  let imageStatus = '无图片需求'
  if (isFoodSafety) { imageStatus = hasImage ? '已提供' : '未提供未引导' }

  const missingInfo = {
    order_missing:   !orderContext || orderContext.trim().length === 0,
    image_missing:   isFoodSafety && !hasImage,
    contact_missing: bodyHit,
    health_status_missing: bodyHit && !combined.includes('好转'),
    store_missing:   false,
  }

  let nextAction = 'generate_reply'
  if (bodyHit) nextAction = 'ask_health_status_and_contact'
  else if (isFoodSafety && missingInfo.image_missing) nextAction = 'ask_order_and_image'
  else if (missingInfo.order_missing && isFoodSafety) nextAction = 'ask_order_and_image'
  else if (needHumanReview && isHighRisk) nextAction = 'escalate_human'
  else if (!isFoodSafety) nextAction = 'transfer_non_food_safety'

  let riskLevel = 'low'
  if (isHighRisk || bodyHit) riskLevel = 'high'
  else if (confidence < THRESHOLDS.minimum_auto_label_confidence || boundaryRisk) riskLevel = 'medium'

  return {
    is_food_safety:    isFoodSafety,
    consult_type:      isFoodSafety ? topLabel.label : '非食安问题',
    level_1:           parts[0] || '',
    level_2:           parts[1] || '',
    level_3:           parts[2] || '',
    image_status:      imageStatus,
    is_high_risk:      isHighRisk || bodyHit,
    need_human_review: needHumanReview,
    confidence:        Math.round(confidence * 100) / 100,
    evidence:          buildEvidence(combined, topLabel.label),
    missing_info:      missingInfo,
    boundary_risk:     boundaryRisk ? `${topLabel.label} vs ${secondLabel.label}` : '',
    next_action:       nextAction,
    risk_level:        riskLevel,
    posteriors:        posteriors.slice(0, 5),
    human_review_reasons: humanReviewReasons,
  }
}

function buildEvidence(text, label) {
  const evidence = []
  const keywords = KEYWORD_LIKELIHOOD[label] || []
  keywords.forEach(kw => {
    if (text.includes(kw)) evidence.push(`文本命中关键词"${kw}"`)
  })
  if (evidence.length === 0) evidence.push('基于上下文综合判断')
  return evidence
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 9 — 情绪检测 (向后兼容导出)
// ═══════════════════════════════════════════════════════════════════════════

export function detectEmotion(userText, mergedText = '') {
  const combined = (userText + ' ' + mergedText).toLowerCase()
  const hitKeywords = EMOTION_URGENT_KEYWORDS.filter(kw => combined.includes(kw))
  const exclamationCount = (userText.match(/！|!/g) || []).length

  let emotionLevel = 'normal'
  let isUrgent = false
  let shortReplyRequired = false

  if (hitKeywords.length > 0 || exclamationCount >= 3) {
    emotionLevel = 'urgent'
    isUrgent = true
    shortReplyRequired = true
  } else if (exclamationCount >= 2) {
    emotionLevel = 'elevated'
  }

  return {
    emotion_level: emotionLevel,
    is_urgent: isUrgent,
    short_reply_required: shortReplyRequired,
    hit_keywords: hitKeywords,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 10 — 图片状态追踪 (向后兼容导出)
// ═══════════════════════════════════════════════════════════════════════════

export function trackImageStatus(session) {
  const { imageProvided, imageGuided, guideCount, imageValid } = session
  if (!imageProvided && !imageGuided) return { image_status: '未提供未引导', need_image_prompt: true }
  if (!imageProvided && imageGuided) {
    if (guideCount >= 2) return { image_status: '引导未提供', need_image_prompt: false, trust_customer: true }
    return { image_status: '引导未提供', need_image_prompt: true }
  }
  if (imageProvided && !imageValid) return { image_status: '已提供但无效', need_image_prompt: false, suggest_reshoot: true }
  if (imageProvided && imageValid) return { image_status: '已提供', need_image_prompt: false }
  return { image_status: '无图片需求', need_image_prompt: false }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 11 — 信息缺口检测 (向后兼容导出)
// ═══════════════════════════════════════════════════════════════════════════

export function checkInfoGap(session) {
  return {
    order_missing:   !session.orderId && !session.phone,
    image_missing:   session.isFoodSafety && !session.imageValid,
    contact_missing: session.isBodyDiscomfort && !session.contact,
    health_status_missing: session.isBodyDiscomfort && !session.healthStatus,
    store_missing:   !session.storeName,
    missing_count: [
      !session.orderId && !session.phone,
      session.isFoodSafety && !session.imageValid,
      session.isBodyDiscomfort && !session.contact,
      session.isBodyDiscomfort && !session.healthStatus,
      !session.storeName,
    ].filter(Boolean).length,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 12 — 5 级补偿方案矩阵 (集成至 Node 3 SOP 验证)
// ═══════════════════════════════════════════════════════════════════════════

export function generateSolution(classification, orderContext, emotionState) {
  if (!classification.is_food_safety) {
    return { level: null, action: 'transfer', detail: '转非食安流程', approval: '无需' }
  }

  const label = classification.consult_type
  const risk = classification.risk_level
  const cupCount = orderContext?.cupCount || 1

  // L1: 轻微 — 内源性异物
  if (label.startsWith('食安问题/内源性异物') && risk === 'low') {
    return {
      level: 'L1',
      action: 'replace_or_voucher',
      detail: '1:1 重做或 ≤20 元代金券',
      voucher_max: 20,
      approval: '客服权限',
      store_callback: false,
    }
  }

  // L2: 一般 — 外源性异物 (非高危)
  if (label.startsWith('食安问题/外源性异物') && !classification.is_high_risk) {
    if (cupCount <= 3) {
      return {
        level: 'L2',
        action: 'refund_and_voucher',
        detail: '全额退款 + ≤30 元代金券 + 门店负责人 12h 内联系',
        refund: orderContext?.amount || null,
        voucher_max: 30,
        approval: '主管审批',
        store_callback: true,
        store_callback_hours: 12,
      }
    }
    return {
      level: 'L2',
      action: 'escalate_to_manager',
      detail: '杯数 > 3，转门店负责人处理',
      approval: '主管审批',
      store_callback: true,
      store_callback_hours: 12,
    }
  }

  // L3: 严重 — 原料变质 / 饮品异味 / 原料未熟
  if (label === '食安问题/原料变质' || label === '食安问题/饮品异味' || label === '食安问题/原料未熟') {
    return {
      level: 'L3',
      action: 'refund_voucher_callback',
      detail: '全额退款 + 50 元代金券 + 门店 4h 内致电 + 紧急排查批次',
      refund: orderContext?.amount || null,
      voucher_max: 50,
      approval: '主管审批',
      store_callback: true,
      store_callback_hours: 4,
      urgent_inspection: true,
    }
  }

  // L4: 紧急 — 身体不适 / OEM 变质
  if (label.startsWith('食安问题/身体不适') || label === '食安问题/OEM/OEM变质') {
    return {
      level: 'L4',
      action: 'health_first_escalate',
      detail: '建议就医 + 通知地区负责人 1h 内跟进 + 专人协调',
      refund: orderContext?.amount || null,
      approval: '区域经理审批',
      medical_note: '不主动承诺医疗费/报销',
      store_callback: true,
      store_callback_hours: 1,
      escalate_level: 'Level2',
    }
  }

  // L5: 危机 — 恶性食安 / 高危异物
  if (classification.is_high_risk && (
    label.includes('苍蝇或蟑螂') || label.includes('金属') || emotionState?.is_urgent
  )) {
    return {
      level: 'L5',
      action: 'immediate_escalation',
      detail: '立即升级客诉 + 强钉门店及区域负责人',
      approval: '总部审批',
      escalate_level: 'Level3',
      no_online_commitment: true,
    }
  }

  // 默认: OEM 过期 / 产品有效期
  if (label === '食安问题/OEM/OEM过期' || label === '食安问题/产品有效期') {
    return {
      level: 'L3',
      action: 'refund_voucher_callback',
      detail: '全额退款 + 50 元代金券 + 紧急排查',
      refund: orderContext?.amount || null,
      voucher_max: 50,
      approval: '主管审批',
      store_callback: true,
      store_callback_hours: 4,
    }
  }

  // 兜底
  return {
    level: 'L2',
    action: 'standard_process',
    detail: '按标准流程处理',
    approval: '主管审批',
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 13 — 3 级升级体系 + 工单管理 (集成至 Node 3)
// ═══════════════════════════════════════════════════════════════════════════

export function manageTickets(classification, solution, session) {
  const tickets = []
  const label = classification.consult_type

  // 门店工单
  if (classification.is_food_safety && classification.confidence >= THRESHOLDS.minimum_auto_label_confidence) {
    tickets.push({
      type: 'store_ticket',
      title: `${classification.level_2}/${classification.level_3 || classification.level_2} — ${session.storeName || session.Store || '未知门店'}`,
      classification: label,
      risk_level: classification.risk_level,
      order_id: session.orderId || session.Order || null,
      store_name: session.storeName || session.Store || null,
      user_phone: session.phone || session.CUSTOMER_PHONE || null,
      sla_hours: 12,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
  }

  // 升级判断 — 3 级体系
  let escalateLevel = null

  // Level 3: 住院/多人不适≥3/疑似批量/监管介入
  if (session.hospitalized || session.affectedCount >= 3 || session.batchSuspicion || session.regulatoryInvolvement) {
    escalateLevel = 'Level3'
  }
  // Level 2: 身体不适/恶性食安/媒体威胁/同门店7天3+投诉
  else if (label.startsWith('食安问题/身体不适') || (classification.is_high_risk && HIGH_RISK_FOREIGN_OBJECTS.some(kw => label.includes(kw)))) {
    escalateLevel = 'Level2'
  } else if (session.repeatComplaints >= 3 || session.mediaThreat) {
    escalateLevel = 'Level2'
  }
  // Level 1: 一般投诉/外源性异物杯数≤3
  else if (session.userComplaint || (label.startsWith('食安问题/外源性异物') && (session.cupCount || 1) <= 3)) {
    escalateLevel = 'Level1'
  }

  if (escalateLevel) {
    const slaMap = { Level1: 4, Level2: 1, Level3: 0.5 }
    tickets.push({
      type: 'escalation',
      level: escalateLevel,
      title: `${escalateLevel} 升级 — ${classification.level_2}`,
      reason: buildEscalationReason(escalateLevel, classification, session),
      sla_hours: slaMap[escalateLevel],
      status: 'pending',
      created_at: new Date().toISOString(),
    })
  }

  // 钉钉强提醒
  if (escalateLevel === 'Level2' || escalateLevel === 'Level3') {
    tickets.push({
      type: 'dingtalk_alert',
      title: `强钉通知 — ${escalateLevel}`,
      notify_target: escalateLevel === 'Level3' ? '总部品质+法务' : '区域经理+店长',
      message: `会话 ${session.sessionId || session.CONVERSATION_ID}: ${label} ${classification.risk_level === 'high' ? '高风险' : ''}`,
      read_status: false,
      created_at: new Date().toISOString(),
    })
  }

  // 升级客诉
  if (classification.need_human_review && classification.risk_level === 'high') {
    tickets.push({
      type: 'customer_complaint',
      title: `客诉升级 — ${classification.level_2}`,
      escalation_level: escalateLevel || 'Level2',
      reason: classification.human_review_reasons.join('; '),
      status: 'pending',
      created_at: new Date().toISOString(),
    })
  }

  return tickets
}

function buildEscalationReason(level, classification, session) {
  const reasons = []
  if (level === 'Level3') {
    if (session.hospitalized) reasons.push('顾客住院')
    if (session.affectedCount >= 3) reasons.push(`${session.affectedCount}人不适`)
    if (session.batchSuspicion) reasons.push('疑似批量问题')
    if (session.regulatoryInvolvement) reasons.push('监管部门介入')
  } else if (level === 'Level2') {
    if (classification.consult_type.startsWith('食安问题/身体不适')) reasons.push('身体不适')
    if (session.mediaThreat) reasons.push('媒体威胁')
    if (session.repeatComplaints >= 3) reasons.push('同门店多次投诉')
  } else {
    reasons.push('一般投诉处理')
  }
  return reasons.join('; ') || '升级处理'
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 14 — 红线审核 (旧版 11 条, 向后兼容)
// ═══════════════════════════════════════════════════════════════════════════

export function auditRedlines(draftReply, classification, emotionState) {
  const violations = []

  const internalTerms = ['工具', '调用', 'order_query', 'Phase', 'JSON', '节点', '工作流', '系统', '模型', '分类器', '推理过程', '思考过程']
  internalTerms.forEach(term => {
    if (draftReply.includes(term)) violations.push({ rule: 1, term, desc: '暴露内部术语' })
  })

  if (draftReply.includes('赔偿')) violations.push({ rule: 2, term: '赔偿', desc: '应使用"补偿方案"' })

  if (draftReply.includes('法律责任') || draftReply.includes('我们负责全部') || draftReply.includes('违法')) {
    violations.push({ rule: 3, term: '法律责任', desc: '承认法律责任' })
  }

  const medicalTerms = ['医疗费', '报销', '承担治疗费用', '承担费用']
  medicalTerms.forEach(term => {
    if (draftReply.includes(term)) violations.push({ rule: 4, term, desc: '主动承诺医疗费用' })
  })

  const argueTerms = ['您自己', '不是我们的', '不可能', '您搞错了']
  argueTerms.forEach(term => {
    if (draftReply.includes(term)) violations.push({ rule: 6, term, desc: '疑似与顾客争论' })
  })

  const excuseTerms = ['正常现象', '这是正常的', '每家店都这样']
  excuseTerms.forEach(term => {
    if (draftReply.includes(term)) violations.push({ rule: 7, term, desc: '替门店找借口' })
  })

  if (!classification?.solution_from_workflow) {
    const moneyPattern = /退[款回]\d+元|补偿\d+元|\d+元代金券/
    if (moneyPattern.test(draftReply)) {
      violations.push({ rule: 8, term: '自行金额', desc: '未经工作流自行承诺金额' })
    }
  }

  if (emotionState?.is_urgent && draftReply.length > 30) {
    violations.push({ rule: 9, term: `${draftReply.length}字`, desc: '情绪激烈期回复超过30字' })
  }

  if (classification?.is_food_safety && draftReply.includes('春光明媚')) {
    violations.push({ rule: 10, term: '开场白', desc: '食安问题时不应输出品牌开场白' })
  }

  if (classification?.image_status === '已提供' && draftReply.includes('照片') && draftReply.includes('提供')) {
    violations.push({ rule: 11, term: '重复索图', desc: '已提供图片仍索要图片' })
  }

  return {
    pass: violations.length === 0,
    risk_items: violations,
    rewrite_required: violations.length > 0,
    violation_count: violations.length,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 15 — 阿喜人设回复生成 (8 种模板, 结案后使用)
// ═══════════════════════════════════════════════════════════════════════════

export function generateReply(context) {
  const {
    route, classification, orderContext, emotionState,
    solution, turnIndex, session, imageAskedBefore,
  } = context

  // 情绪急救 — 30 字以内
  if (route === 'emotion_first' || emotionState?.is_urgent) {
    const comfortReplies = [
      '实在非常抱歉，还请您消消气。阿喜完全理解您的心情，会马上为您跟进。',
      '让您久等了，阿喜正火速核查。',
      '您说得对，这种事情确实不应该发生。',
      '阿喜完全理解您的心情。',
    ]
    return comfortReplies[Math.floor(Math.random() * comfortReplies.length)]
  }

  if (route === 'opening') {
    const drinkName = session?.hotDrinkName || '清爽芭乐提'
    // 使用 OPENING_SCRIPTS 标准模板: [主题]，浓厚甜润，[产品]为您服务，请问有什么可以为您效劳？
    const month = new Date().getMonth() + 1
    const seasonLabel = [3,4,5].includes(month) ? '春茶季'
      : [6,7,8].includes(month) ? '夏日冰饮季'
      : [9,10,11].includes(month) ? '秋韵暖饮季'
      : '冬日暖心季'
    return `${seasonLabel}，浓厚甜润，${drinkName}为您服务，请问有什么可以为您效劳？`
  }

  if (route === 'ask_order_and_image') {
    return '非常抱歉给您带来不好的体验，为了更好地帮您处理，麻烦您提供下单手机号或订单编号，以及饮品+标签同框照片，阿喜马上为您核实。'
  }

  if (route === 'body_discomfort') {
    return '对于您描述的情况阿喜非常重视，请问您目前有没有好转一些？如果仍感到不舒服，阿喜建议您及时就医。辛苦您提供一下方便的联系方式，阿喜马上通知地区负责人跟进，如果您需要陪同就医，也请您及时告知阿喜。'
  }

  if (route === 'high_risk_foreign_object') {
    const object = classification?.level_3 || '异物'
    return `饮品中出现${object}这绝对不应该发生，阿喜非常抱歉。请问您有没有受伤或身体不舒服？我们会立即安排门店排查，同时全力帮您处理。`
  }

  if (route === 'normal_foreign_object') {
    const object = classification?.level_3 || '异物'
    return `饮品中出现${object}实在太不应该了，给您带来不好的体验真的非常抱歉。阿喜全力帮您解决，也会安排门店排查原因。`
  }

  if (route === 'internal_material') {
    const drinkName = orderContext?.drinkName || '该饮品'
    const material = classification?.level_3 || '原料残留'
    return `给您带来不好的体验很抱歉。${drinkName}使用的是新鲜水果或茶叶，偶尔可能会有少量${material}，但我们应该做得更好，阿喜来帮您处理。`
  }

  if (route === 'solution_offer' && solution) {
    if (solution.no_online_commitment) {
      return '阿喜非常重视您的反馈，这件事我们会马上升级给相关负责人处理，会尽快与您联系确认后续安排。'
    }
    let reply = '为了弥补这次的不好体验，阿喜为您申请了以下补偿方案：'
    if (solution.refund) reply += `\n1. 全额退款${solution.refund}元，原路退回`
    if (solution.voucher_max) reply += `\n2. 额外${solution.voucher_max}元代金券到您的账户`
    if (solution.store_callback) reply += `\n3. 店长会在${solution.store_callback_hours}小时内致电致歉`
    reply += '\n您看这样可以吗？'
    return reply
  }

  if (route === 'closing_confirm') {
    return '感谢您的理解和包容。退款和优惠券会按方案时效处理，门店伙伴也会继续跟进。我们一定认真排查整改，还有其他可以帮您的吗？'
  }

  if (route === 'non_food_safety_transfer') {
    return '阿喜已经了解您的问题，这个情况我帮您转到对应专员继续处理。'
  }

  return '阿喜已收到您的信息，正在为您核实处理，请稍等。'
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 16 — AIQC_V2 工作流定义
// ═══════════════════════════════════════════════════════════════════════════

export const AIQC_V2_WORKFLOW = Object.freeze({
  name: 'AIQC_V2',
  version: '2.0',
  description: '多模型多阶段质检工作流，对齐 Coze AIQC_V2 架构',
  nodes: [
    {
      id: 1,
      name: '开始',
      name_en: 'Start / Input Normalization',
      type: 'input',
      model: null,
      inputs: Object.keys(COZE_FIELD_MAP),
      outputs: ['normalized'],
    },
    {
      id: 2,
      name: '对话解构+服务分析',
      name_en: 'Dialogue Deconstruction + Service Analysis',
      type: 'llm',
      model: '豆包·1.8·深度思考',
      inputs: ['normalized', 'CONTENT_INPUT', 'CONVERSATION_ID'],
      outputs: [
        'to_block5_scene', 'to_block6_issue', 'process_trace',
        'sq3', 'sq1', 'sq2', 'cont_js', 'Dc_check',
      ],
      sub_modules: ['food_safety_bayesian', 'emotion_detection', 'qc_4dim'],
    },
    {
      id: 3,
      name: '工单操作专家',
      name_en: 'Business Process Expert',
      type: 'llm',
      model: '豆包·1.5·Lite·32k',
      inputs: ['normalized', 'sq3', 'SOP', 'process_trace'],
      outputs: ['sqm1', 'sqm2'],
      sub_modules: ['public_rules_12', 'sop_validation', 'compensation_matrix', 'escalation_system'],
    },
    {
      id: 4,
      name: '对话分类质检专家',
      name_en: 'Classification QC Expert',
      type: 'llm',
      model: '豆包·1.6·极致速度',
      inputs: ['normalized', 'CategoryLabel', 'product', 'Store'],
      outputs: ['qc1', 'qc2'],
      sub_modules: ['empty_interception', 'required_field_validation', 'classification_match'],
    },
    {
      id: 5,
      name: '红线行为检测',
      name_en: 'Red Line Detection / Risk Control',
      type: 'llm',
      model: '豆包·1.5·Lite·32k',
      inputs: ['normalized', 'process_trace', 'to_block5_scene'],
      outputs: ['is_violate', 'violation_type', 'violation_behavior', 'violation_quote'],
      sub_modules: ['redline_6_categories'],
    },
    {
      id: '5.5',
      name: '红线报警器',
      name_en: 'Red Line Alert / Conditional Branch',
      type: 'conditional',
      model: null,
      inputs: ['is_violate'],
      outputs: ['risk_flag'],
      branches: {
        false: 'continue_to_conclusion',
        true: 'red_line_alert_triggered',
      },
    },
    {
      id: 6,
      name: '结案',
      name_en: 'Conclusion',
      type: 'output',
      model: null,
      inputs: ['sq1', 'qc1', 'sqm1', 'is_violate', 'sq3', 'sq2', 'qc2', 'sqm2', 'cont_js', 'reasoning_content'],
      outputs: ['final_result'],
    },
  ],
  connections: [
    { from: 1,   to: 2,   label: 'normalized_input' },
    { from: 2,   to: 3,   label: 'sq3 + process_trace' },
    { from: 2,   to: 4,   label: 'scene_context' },
    { from: 2,   to: 5,   label: 'to_block5_scene + process_trace' },
    { from: 3,   to: 6,   label: 'sqm1 + sqm2' },
    { from: 4,   to: 6,   label: 'qc1 + qc2' },
    { from: 5,   to: '5.5', label: 'is_violate' },
    { from: '5.5', to: 6,  label: 'risk_flag (pass-through)' },
    { from: 2,   to: 6,   label: 'sq1 + sq2 + sq3 + cont_js' },
  ],
})

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 17 — AIQC_V2 节点执行器
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Node 1: 开始 — 输入标准化
 * 从 19 个 Coze 字段提取并归一化输入
 */
function executeNode1_Start(rawInput) {
  const normalized = {
    CONTENT_INPUT:   rawInput.CONTENT_INPUT   || rawInput.user_text   || rawInput.merged_text || '',
    CONVERSATION_ID: rawInput.CONVERSATION_ID || rawInput.session_id  || `sess-${Date.now()}`,
    AGENT_NAME:      rawInput.AGENT_NAME      || rawInput.agent_name  || '',
    CUSTOMER_NAME:   rawInput.CUSTOMER_NAME   || rawInput.customer_name || '',
    CUSTOMER_TP:     rawInput.CUSTOMER_TP     || rawInput.customer_type || '',
    CUSTOMER_PHONE:  rawInput.CUSTOMER_PHONE  || rawInput.phone || '',
    TK_INPUT:        rawInput.TK_INPUT        || rawInput.ticket_input || '',
    TK_ID:           rawInput.TK_ID           || rawInput.ticket_id || '',
    TK_TP:           rawInput.TK_TP           || rawInput.ticket_type || '',
    CategoryLabel:   rawInput.CategoryLabel   || rawInput.category_label || '',
    Order:           rawInput.Order           || rawInput.order_id || '',
    Store:           rawInput.Store           || rawInput.store || '',
    product:         rawInput.product         || '',
    START_TIME:      rawInput.START_TIME      || rawInput.start_time || new Date().toISOString(),
    SM:              rawInput.SM              || rawInput.store_manager || '',
    SOP:             rawInput.SOP             || rawInput.sop || '',
    HAS_NOT_TOPPED:  rawInput.HAS_NOT_TOPPED  ?? rawInput.has_not_stopped ?? false,
    OT:              rawInput.OT              || rawInput.overtime || '',
    CSAT:            rawInput.CSAT            || rawInput.csat || '',
  }

  // 额外携带非 Coze 字段
  const extra = {
    image_urls:    rawInput.image_urls    || [],
    session:       rawInput.session       || {},
    orderContext:  rawInput.orderContext  || null,
    channel:       rawInput.channel       || 'online',
  }

  return {
    normalized,
    extra,
    _node: { id: 1, name: '开始', model: null, status: 'completed' },
  }
}

/**
 * Node 2: 对话解构 + 服务分析
 * 模型: 豆包·1.8·深度思考
 * 集成: 贝叶斯食安分类 + 情绪检测 + 4 维度 QC
 */
function executeNode2_DialogueAnalysis(normalized, extra) {
  const contentText = normalized.CONTENT_INPUT
  const session = extra.session || {}

  // ── 2a. 对话解构: 提取订单/时间/门店/产品 ──
  const orderStatus = _extractOrderStatus(contentText, normalized.Order)
  const orderDate = _extractOrderDate(contentText)
  const dialogueHour = _extractDialogueHour(normalized.START_TIME, contentText)
  const storeName = normalized.Store || _extractStore(contentText)
  const productName = normalized.product || _extractProduct(contentText)

  const sq3 = {
    '订单号':  normalized.Order || orderStatus.orderId || '',
    '状态':    orderStatus.status || '未知',
    '日期':    orderDate || '',
    '时间':    dialogueHour >= 21 ? '21点后' : (dialogueHour !== null ? `${dialogueHour}点` : '未知'),
    '门店':    storeName || '',
    '产品':    productName || '',
  }

  // ── 2b. 场景摘要 (to_block5_scene) ──
  const to_block5_scene = _buildSceneSummary(normalized, sq3)

  // ── 2c. 顾客核心问题 (to_block6_issue) ──
  const to_block6_issue = _extractCoreIssue(contentText)

  // ── 2d. 过程追踪 (process_trace) ──
  const process_trace = _buildProcessTrace(contentText, normalized)

  // ── 2e. 贝叶斯食安分类 (集成) ──
  const classification = classifyFoodSafety(
    contentText,
    '',
    (extra.image_urls || []).join(','),
    normalized.Order || ''
  )

  // ── 2f. 情绪检测 (集成) ──
  const emotion = detectEmotion(contentText, '')

  // ── 2g. 4 维度 QC 评估 (sq1) ──
  const sq1 = _evaluateQC4Dimensions(contentText, classification, emotion, session)

  // ── 2h. 优化建议 (sq2, 仅不达标时生成) ──
  const hasFailure = Object.values(sq1).some(v => v === '不达标')
  const sq2 = hasFailure ? _generateOptimizationSuggestions(sq1, contentText) : ''

  // ── 2i. 综合摘要 (cont_js) ──
  const cont_js = _buildCombinedSummary(sq3, sq1, sq2, classification, emotion, to_block6_issue)

  // ── 2j. 复核标记 (Dc_check) ──
  const Dc_check = classification.need_human_review ? 'true' : 'false'

  return {
    to_block5_scene,
    to_block6_issue,
    process_trace,
    sq3,
    sq1,
    sq2,
    cont_js,
    Dc_check,
    // 中间态传递
    _classification: classification,
    _emotion: emotion,
    _dialogueHour: dialogueHour,
    _node: { id: 2, name: '对话解构+服务分析', model: '豆包·1.8·深度思考', status: 'completed' },
  }
}

/**
 * Node 3: 工单操作专家
 * 模型: 豆包·1.5·Lite·32k
 * 集成: 12 条公共规则 + SOP 验证 + 5 级补偿矩阵 + 3 级升级体系
 */
function executeNode3_BusinessProcessExpert(normalized, extra, node2Output) {
  const contentText = normalized.CONTENT_INPUT
  const sq3 = node2Output.sq3
  const classification = node2Output._classification
  const emotion = node2Output._emotion
  const session = extra.session || {}

  // ── 3a. 构建订单上下文 ──
  const orderCtx = extra.orderContext || {
    orderId:       normalized.Order || sq3['订单号'],
    drinkName:     normalized.product || sq3['产品'],
    cupCount:      session.cupCount || 1,
    storeName:     normalized.Store || sq3['门店'],
    orderTime:     sq3['日期'] ? `${sq3['日期']} ${sq3['时间']}` : '',
    amount:        session.amount || null,
    hasRefund:     session.hasRefund || false,
    refundStatus:  session.refundStatus || null,
    orderStatus:   sq3['状态'],
    deliveryStatus: session.deliveryStatus || null,
    dialogueHour:  node2Output._dialogueHour,
    compensationType: session.compensationType || null,
  }

  const sessionCtx = {
    agentClosedOnSilence:  session.agentClosedOnSilence || false,
    voucherAsRefund:       session.voucherAsRefund || false,
    customerInitiatedRefund: session.customerInitiatedRefund || false,
    customerRejected:      session.customerRejected || false,
    voucherCount:          session.voucherCount || 0,
    voucherAmount:         session.voucherAmount || 0,
    customerVague:         session.customerVague || false,
    hasObviousViolation:   session.hasObviousViolation || false,
  }

  // ── 3b. 逐条校验 12 条公共规则 ──
  const ruleResults = []
  let anyRuleFailed = false
  const ruleFailureReasons = []

  for (const rule of PUBLIC_RULES) {
    const result = rule.validate(orderCtx, sessionCtx)
    ruleResults.push({ id: rule.id, name: rule.name, pass: result.pass, reason: result.reason || result.note || '' })
    if (!result.pass) {
      anyRuleFailed = true
      ruleFailureReasons.push(`规则${rule.id}(${rule.name}): ${result.reason}`)
    }
  }

  // ── 3c. SOP 字段验证 ──
  const sopValidation = _validateSOP(normalized.SOP, orderCtx, sessionCtx, sq3)

  // ── 3d. 5 级补偿方案 ──
  const solution = classification.is_food_safety
    ? generateSolution(classification, orderCtx, emotion)
    : { level: null, action: 'transfer', detail: '转非食安流程', approval: '无需' }

  // ── 3e. 3 级升级体系 ──
  const tickets = classification.is_food_safety
    ? manageTickets(classification, solution, { ...session, Store: normalized.Store, Order: normalized.Order, CUSTOMER_PHONE: normalized.CUSTOMER_PHONE, CONVERSATION_ID: normalized.CONVERSATION_ID })
    : []

  // ── 3f. 工单操作 QC 判定 ──
  const bizFailures = []

  if (anyRuleFailed) {
    bizFailures.push(...ruleFailureReasons)
  }
  if (!sopValidation.pass) {
    bizFailures.push(...sopValidation.failures)
  }

  const sqm1 = bizFailures.length === 0 ? '达标' : '不达标'
  const sqm2 = bizFailures.length > 0
    ? bizFailures.join('；')
    : ''

  return {
    sqm1,
    sqm2,
    _ruleResults: ruleResults,
    _sopValidation: sopValidation,
    _solution: solution,
    _tickets: tickets,
    _orderCtx: orderCtx,
    _node: { id: 3, name: '工单操作专家', model: '豆包·1.5·Lite·32k', status: 'completed' },
  }
}

/**
 * Node 4: 对话分类质检专家
 * 模型: 豆包·1.6·极致速度
 * 3 步验证: 空值/格式拦截 → 必填字段校验 → 分类定义匹配
 */
function executeNode4_ClassificationQC(normalized, extra, node2Output) {
  const failures = []

  // ── Step 1: 空值/格式拦截 ──
  if (normalized.product) {
    const vagueProductPattern = /等\s*\d+\s*商品|等\s*\d+\s*件/
    if (vagueProductPattern.test(normalized.product)) {
      failures.push(`产品名称包含模糊描述"${normalized.product}"，应使用具体产品名`)
    }
  }

  if (normalized.Store && !normalized.Store.includes('店')) {
    failures.push(`门店名称"${normalized.Store}"缺少"店"字后缀`)
  }

  if (normalized.CategoryLabel === '--' || normalized.CategoryLabel === '') {
    if (node2Output._classification?.is_food_safety) {
      failures.push('CategoryLabel 为"--"或空，但对话内容涉及食安问题')
    }
  }

  // ── Step 2: 必填字段校验 ──
  const requiredFields = ['CONTENT_INPUT', 'CONVERSATION_ID']
  for (const field of requiredFields) {
    if (!normalized[field] || normalized[field].trim() === '') {
      failures.push(`必填字段 ${field} 为空`)
    }
  }

  // 食安场景额外必填
  if (node2Output._classification?.is_food_safety) {
    if (!normalized.Order && !normalized.CUSTOMER_PHONE) {
      failures.push('食安场景下 Order 和 CUSTOMER_PHONE 均为空，无法关联订单')
    }
  }

  // ── Step 3: 分类定义匹配 ──
  if (normalized.CategoryLabel && normalized.CategoryLabel !== '--') {
    const catLabel = normalized.CategoryLabel.trim()
    const isInClosedSet = LABEL_CLOSED_SET.some(label => label === catLabel || label.endsWith(catLabel))
    if (!isInClosedSet && catLabel !== '' && catLabel !== '非食安问题') {
      failures.push(`CategoryLabel"${catLabel}"不在 23 标签闭集中`)
    }
  }

  // 一致性检查: 贝叶斯分类 vs CategoryLabel
  if (normalized.CategoryLabel && normalized.CategoryLabel !== '--' && node2Output._classification) {
    const bayesLabel = node2Output._classification.consult_type
    const catLabel = normalized.CategoryLabel.trim()
    if (catLabel !== '' && bayesLabel !== '非食安问题' && catLabel !== '非食安问题') {
      const catParts = catLabel.split('/')
      const bayesParts = bayesLabel.split('/')
      // 至少一级分类需要一致
      const level1Match = catParts[0] === bayesParts[0]
      if (!level1Match) {
        failures.push(`CategoryLabel"${catLabel}"与贝叶斯分类"${bayesLabel}"一级分类不一致`)
      }
    }
  }

  const qc1 = failures.length === 0 ? '达标' : '不达标'
  const qc2 = failures.length > 0 ? failures.join('；') : ''

  return {
    qc1,
    qc2,
    _classificationFailures: failures,
    _node: { id: 4, name: '对话分类质检专家', model: '豆包·1.6·极致速度', status: 'completed' },
  }
}

/**
 * Node 5: 红线行为检测
 * 模型: 豆包·1.5·Lite·32k
 * 6 大红线分类 + 黑名单关键词匹配 + 规则优先级
 */
function executeNode5_RedLineDetection(normalized, node2Output) {
  const contentText = normalized.CONTENT_INPUT
  const processTrace = node2Output.process_trace

  // 合并所有需检测的文本
  const detectionText = (contentText + ' ' + processTrace).toLowerCase()
  const originalText = contentText + ' ' + processTrace

  let is_violate = false
  let violation_type = ''
  let violation_behavior = ''
  let violation_quote = ''

  // 按优先级顺序逐类检测（优先级: 1 > 2 > 3 > 4 > 5 > 6）
  for (const category of REDLINE_CATEGORIES) {
    const hits = []

    // 关键词匹配
    for (const kw of category.keywords) {
      if (detectionText.includes(kw.toLowerCase())) {
        // 找到原文中对应的片段
        const idx = originalText.toLowerCase().indexOf(kw.toLowerCase())
        const snippet = idx >= 0
          ? originalText.substring(Math.max(0, idx - 10), Math.min(originalText.length, idx + kw.length + 20))
          : kw
        hits.push({ keyword: kw, snippet: snippet.trim() })
      }
    }

    if (hits.length > 0) {
      is_violate = true
      violation_type = category.name
      violation_behavior = `${category.definition}；命中关键词: ${hits.map(h => h.keyword).join(', ')}`
      violation_quote = hits[0].snippet
      break // 输出唯一性: 仅报告最高优先级的违规
    }
  }

  // 额外: 内部术语泄漏深度检测 (基于 REDLINE_FORBIDDEN_WORDS)
  if (!is_violate) {
    const internalHits = REDLINE_FORBIDDEN_WORDS.filter(word => originalText.includes(word))
    if (internalHits.length >= 2) {
      is_violate = true
      violation_type = '内部流程红线'
      violation_behavior = `回复中同时出现多个内部术语: ${internalHits.join(', ')}`
      violation_quote = internalHits.slice(0, 3).join(', ')
    }
  }

  return {
    is_violate,
    violation_type,
    violation_behavior,
    violation_quote,
    _node: { id: 5, name: '红线行为检测', model: '豆包·1.5·Lite·32k', status: 'completed' },
  }
}

/**
 * Node 5.5: 红线报警器 (条件分支)
 * 纯逻辑节点, 无模型
 */
function executeNode5_5_RedLineAlert(node5Output) {
  const isViolated = node5Output.is_violate

  return {
    risk_flag: isViolated ? 'red_line_alert_triggered' : 'continue_to_conclusion',
    is_high_risk_session: isViolated,
    _node: {
      id: '5.5',
      name: '红线报警器',
      model: null,
      status: 'completed',
      branch_taken: isViolated ? 'red_line_alert_triggered' : 'continue_to_conclusion',
    },
  }
}

/**
 * Node 6: 结案
 * 汇总 10 个输出变量
 */
function executeNode6_Conclusion(node2Output, node3Output, node4Output, node5Output, node5_5Output) {
  // 推理内容: 汇总各节点推理过程
  const reasoningParts = []

  reasoningParts.push(`[Node2 对话解构] 场景: ${node2Output.to_block5_scene}`)
  reasoningParts.push(`[Node2 核心问题] ${node2Output.to_block6_issue}`)

  if (node2Output.sq2) {
    reasoningParts.push(`[Node2 QC建议] ${node2Output.sq2}`)
  }

  if (node3Output.sqm1 === '不达标') {
    reasoningParts.push(`[Node3 工单操作] 不达标: ${node3Output.sqm2}`)
  } else {
    reasoningParts.push('[Node3 工单操作] 达标')
  }

  if (node4Output.qc1 === '不达标') {
    reasoningParts.push(`[Node4 分类质检] 不达标: ${node4Output.qc2}`)
  } else {
    reasoningParts.push('[Node4 分类质检] 达标')
  }

  if (node5Output.is_violate) {
    reasoningParts.push(`[Node5 红线检测] 违规: ${node5Output.violation_type} — ${node5Output.violation_behavior}`)
  } else {
    reasoningParts.push('[Node5 红线检测] 无违规')
  }

  reasoningParts.push(`[Node5.5 报警器] ${node5_5Output.risk_flag}`)

  const reasoning_content = reasoningParts.join('\n')

  return {
    // 10 个 Coze 输出变量
    sq1:                node2Output.sq1,
    qc1:                node4Output.qc1,
    sqm1:           node3Output.sqm1,
    is_violate:         node5Output.is_violate,
    sq3:                node2Output.sq3,
    sq2:                node2Output.sq2,
    qc2:                node4Output.qc2,
    sqm2:           node3Output.sqm2,
    cont_js:            node2Output.cont_js,
    reasoning_content:  reasoning_content,

    // 额外元数据
    _violation_type:     node5Output.violation_type,
    _violation_behavior: node5Output.violation_behavior,
    _violation_quote:    node5Output.violation_quote,
    _risk_flag:          node5_5Output.risk_flag,
    _is_high_risk:       node5_5Output.is_high_risk_session,
    _node: { id: 6, name: '结案', model: null, status: 'completed' },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 18 — Node 2 辅助函数
// ═══════════════════════════════════════════════════════════════════════════

function _extractOrderStatus(text, orderId) {
  const statusKeywords = {
    '已完成':   ['已完成', '已送达', '已取餐', '已配送'],
    '配送中':   ['配送中', '正在送', '骑手', '外卖中'],
    '已取消':   ['已取消', '取消了', '退单了'],
    '退款中':   ['退款中', '申请退款', '退款处理'],
    '已退款':   ['已退款', '退款成功', '退款到账'],
    '制作中':   ['制作中', '正在做', '备餐中'],
    '待取餐':   ['待取餐', '等取餐', '到店取'],
  }

  for (const [status, keywords] of Object.entries(statusKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      return { status, orderId: orderId || '' }
    }
  }

  return { status: orderId ? '未知(有订单号)' : '未知', orderId: orderId || '' }
}

function _extractOrderDate(text) {
  // 尝试提取日期模式
  const datePatterns = [
    /(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日号]?)/,
    /(\d{1,2}[-/月]\d{1,2}[日号]?)/,
    /(昨天|今天|前天|上周[一二三四五六日天])/,
  ]

  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) return match[1]
  }

  return new Date().toISOString().slice(0, 10)
}

function _extractDialogueHour(startTime, text) {
  // 从 START_TIME 提取小时
  if (startTime) {
    try {
      const hourMatch = startTime.match(/(\d{1,2}):\d{2}/)
      if (hourMatch) return parseInt(hourMatch[1], 10)
    } catch (_e) {
      // ignore parse errors
    }
  }

  // 从文本推断
  const hourMatch = text.match(/(\d{1,2})[点时:]\d{0,2}/)
  if (hourMatch) {
    const hour = parseInt(hourMatch[1], 10)
    if (hour >= 0 && hour <= 23) return hour
  }

  return null
}

function _extractStore(text) {
  const storePatterns = [
    /([\u4e00-\u9fa5]+店)/,
    /([\u4e00-\u9fa5]{2,8}门店)/,
    /([\u4e00-\u9fa5]+分店)/,
  ]
  for (const pattern of storePatterns) {
    const match = text.match(pattern)
    if (match) return match[1]
  }
  return ''
}

function _extractProduct(text) {
  // 常见饮品关键词提取
  const drinkKeywords = [
    '多肉芒芒', '芝芝莓莓', '清爽芭乐提', '烤黑糖波波', '满杯红柚',
    '生打椰椰', '超级杯', '真果茶', '纯茶', '拿铁', '奶茶',
    '果茶', '冰沙', '奶昔', '气泡水', '柠檬茶',
  ]
  for (const kw of drinkKeywords) {
    if (text.includes(kw)) return kw
  }
  return ''
}

function _buildSceneSummary(normalized, sq3) {
  const parts = []
  if (normalized.CUSTOMER_NAME) parts.push(`顾客${normalized.CUSTOMER_NAME}`)
  if (sq3['门店']) parts.push(`在${sq3['门店']}`)
  if (sq3['产品']) parts.push(`购买了${sq3['产品']}`)
  if (sq3['状态']) parts.push(`订单状态: ${sq3['状态']}`)
  if (parts.length === 0) return '对话场景信息不完整'
  return parts.join('，')
}

function _extractCoreIssue(text) {
  // 按优先级提取核心问题
  const issuePatterns = [
    { pattern: /(拉肚子|腹泻|肚子痛|呕吐|过敏|不舒服)/, issue: '身体不适' },
    { pattern: /(异物|虫子|头发|金属|塑料|黑点|不明物)/, issue: '食品异物' },
    { pattern: /(退款|退钱|退单)/, issue: '退款诉求' },
    { pattern: /(过期|变质|发霉|涨袋|酸臭|异味)/, issue: '食品质量' },
    { pattern: /(投诉|曝光|12315|举报|媒体)/, issue: '投诉升级' },
    { pattern: /(配送|外卖|没收到|送错)/, issue: '配送问题' },
    { pattern: /(少[件杯料]|漏[件杯])/, issue: '订单缺漏' },
    { pattern: /(服务态度|态度差|不理人)/, issue: '服务态度' },
  ]

  for (const { pattern, issue } of issuePatterns) {
    if (pattern.test(text)) return issue
  }

  return '一般咨询'
}

function _buildProcessTrace(text, normalized) {
  const events = []
  const lines = text.split(/[。！？\n]+/).filter(l => l.trim())

  // 构建时间线
  if (normalized.START_TIME) {
    events.push(`[${normalized.START_TIME}] 会话开始`)
  }

  // 从对话内容推断事件
  for (const line of lines.slice(0, 10)) {
    const trimmed = line.trim()
    if (trimmed.length < 2) continue

    if (/顾客|客户|用户/.test(trimmed) || /^(我|我们)/.test(trimmed)) {
      events.push(`[顾客] ${trimmed.slice(0, 50)}`)
    } else if (/客服|坐席|阿喜/.test(trimmed) || /^(您|亲)/.test(trimmed)) {
      events.push(`[客服] ${trimmed.slice(0, 50)}`)
    }
  }

  if (events.length === 0) {
    events.push('[系统] 对话内容已接收，待详细解析')
  }

  return events.join('\n')
}

/**
 * 4 维度 QC 评估 → sq1
 * 返回 { 理解能力, 表达能力, 安抚技巧, 服务积极性 } 每项为 "达标" / "不达标"
 */
function _evaluateQC4Dimensions(text, classification, emotion, session) {
  const result = {
    '理解能力':   '达标',
    '表达能力':   '达标',
    '安抚技巧':   '达标',
    '服务积极性': '达标',
  }

  const failureDetails = {
    '理解能力':   [],
    '表达能力':   [],
    '安抚技巧':   [],
    '服务积极性': [],
  }

  // ── 理解能力检测 ──
  // 答非所问: 如果有明确的问题但回复偏离 (简化检测: 问号和回复主题不匹配)
  const questionMarks = (text.match(/？|\?/g) || []).length
  if (questionMarks >= 3 && !session.agentProvidedAnswer) {
    result['理解能力'] = '不达标'
    failureDetails['理解能力'].push('答非所问')
  }

  // ── 表达能力检测 ──
  // 不礼貌: 使用"你"而非"您" (在客服发言中)
  const agentSegments = _extractAgentSegments(text)
  for (const seg of agentSegments) {
    // 检测"你" (排除"你们""你好")
    const youPattern = /(?<![你您])你(?!们|好|的)/g
    if (youPattern.test(seg) && !seg.includes('您好') && !seg.includes('你好')) {
      result['表达能力'] = '不达标'
      failureDetails['表达能力'].push('不礼貌("你")')
      break
    }
  }

  // 违禁词: 亲/亲亲/!
  for (const seg of agentSegments) {
    if (seg.includes('亲亲') || seg.includes('亲，') || seg.includes('亲 ')) {
      result['表达能力'] = '不达标'
      failureDetails['表达能力'].push('违禁词(亲/亲亲/!)')
      break
    }
    // 感叹号在客服回复中
    if (/[!！]{2,}/.test(seg)) {
      result['表达能力'] = '不达标'
      failureDetails['表达能力'].push('违禁词(亲/亲亲/!)')
      break
    }
  }

  // 复读机: 连续重复
  if (agentSegments.length >= 2) {
    const lastTwo = agentSegments.slice(-2)
    if (lastTwo[0].trim() === lastTwo[1].trim() && lastTwo[0].trim().length > 5) {
      result['表达能力'] = '不达标'
      failureDetails['表达能力'].push('复读机')
    }
  }

  // 表达过简: 客服回复 <5 字
  for (const seg of agentSegments) {
    if (seg.trim().length > 0 && seg.trim().length < 5 && !['好的', '收到', '明白', '了解', '稍等'].includes(seg.trim())) {
      result['表达能力'] = '不达标'
      failureDetails['表达能力'].push('表达过简')
      break
    }
  }

  // ── 安抚技巧检测 ──
  // 情绪视盲1: 顾客长段愤怒文字但客服无视情绪
  const customerSegments = _extractCustomerSegments(text)
  for (const seg of customerSegments) {
    const isAngry = seg.length >= 30 && (
      (seg.match(/！|!/g) || []).length >= 2 ||
      EMOTION_URGENT_KEYWORDS.some(kw => seg.includes(kw))
    )
    if (isAngry) {
      // 检查下一句客服回复是否有道歉/共情
      const nextAgentReply = agentSegments.find(a => a.length > 0)
      const hasEmpathy = nextAgentReply && (
        nextAgentReply.includes('抱歉') || nextAgentReply.includes('理解') ||
        nextAgentReply.includes('对不起') || nextAgentReply.includes('不好意思') ||
        nextAgentReply.includes('非常抱歉')
      )
      if (!hasEmpathy) {
        result['安抚技巧'] = '不达标'
        failureDetails['安抚技巧'].push('情绪视盲1')
        break
      }
    }
  }

  // 情绪视盲2: 顾客不满后 2 回合内未道歉
  if (emotion.is_urgent) {
    const hasApology = agentSegments.slice(0, 2).some(seg =>
      seg.includes('抱歉') || seg.includes('对不起') || seg.includes('不好意思')
    )
    if (!hasApology && agentSegments.length > 0) {
      result['安抚技巧'] = '不达标'
      failureDetails['安抚技巧'].push('情绪视盲2')
    }
  }

  // ── 服务积极性检测 ──
  // 模糊投诉未追问
  const vagueComplaintPatterns = [/不太满意/, /有点问题/, /不太好/, /有问题/, /不满意/]
  const hasVagueComplaint = vagueComplaintPatterns.some(p => p.test(text))
  if (hasVagueComplaint) {
    const hasFollowUp = agentSegments.some(seg =>
      seg.includes('具体') || seg.includes('详细') || seg.includes('请问') ||
      seg.includes('能不能') || seg.includes('麻烦您说')
    )
    if (!hasFollowUp) {
      result['服务积极性'] = '不达标'
      failureDetails['服务积极性'].push('模糊投诉未追问')
    }
  }

  // 越权承诺退款: 客服主动提出退款且无工作流授权
  if (!session.customerInitiatedRefund) {
    for (const seg of agentSegments) {
      if (/帮您退款|给您退|可以退/.test(seg) && !seg.includes('方案') && !seg.includes('申请')) {
        result['服务积极性'] = '不达标'
        failureDetails['服务积极性'].push('越权承诺退款')
        break
      }
    }
  }

  // 主动退款: 顾客未提退款但客服主动提议
  const customerMentionRefund = customerSegments.some(seg => /退款|退钱/.test(seg))
  if (!customerMentionRefund) {
    for (const seg of agentSegments) {
      if (/退款|退钱|退回/.test(seg) && !seg.includes('方案')) {
        result['服务积极性'] = '不达标'
        failureDetails['服务积极性'].push('主动退款')
        break
      }
    }
  }

  // 生日祝福缺失
  if (session.isBirthday && agentSegments.length > 0) {
    const hasBirthdayWish = agentSegments.some(seg =>
      seg.includes('生日') || seg.includes('快乐') || seg.includes('祝福')
    )
    if (!hasBirthdayWish) {
      result['服务积极性'] = '不达标'
      failureDetails['服务积极性'].push('生日祝福缺失')
    }
  }

  return result
}

function _extractAgentSegments(text) {
  // 简化: 按对话分隔符提取客服发言
  const segments = []
  const lines = text.split(/[。\n]/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (/^(客服|坐席|阿喜|您好|非常抱歉|请问)/.test(trimmed)) {
      segments.push(trimmed)
    }
  }
  return segments
}

function _extractCustomerSegments(text) {
  const segments = []
  const lines = text.split(/[。\n]/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (/^(顾客|客户|用户|我|我们)/.test(trimmed) || /[！!？?]{1,}$/.test(trimmed)) {
      segments.push(trimmed)
    }
  }
  return segments
}

function _generateOptimizationSuggestions(sq1, text) {
  const suggestions = []
  const dims = Object.entries(sq1)

  for (const [dim, status] of dims) {
    if (status === '不达标') {
      switch (dim) {
        case '理解能力':
          suggestions.push('【理解能力】建议客服先确认顾客核心诉求后再回复，避免答非所问或张冠李戴')
          break
        case '表达能力':
          suggestions.push('【表达能力】建议使用"您"代替"你"，避免淘宝用语(亲/亲亲)，回复需正面且完整')
          break
        case '安抚技巧':
          suggestions.push('【安抚技巧】检测到顾客情绪波动时，应首先表达共情和歉意，再进入业务处理')
          break
        case '服务积极性':
          suggestions.push('【服务积极性】对模糊投诉应主动追问细节，避免越权承诺退款，注意生日祝福等关怀动作')
          break
      }
    }
  }

  return suggestions.join('\n')
}

function _buildCombinedSummary(sq3, sq1, sq2, classification, emotion, coreIssue) {
  const parts = []

  parts.push(`订单: ${sq3['订单号'] || '未知'} | 门店: ${sq3['门店'] || '未知'} | 产品: ${sq3['产品'] || '未知'}`)
  parts.push(`状态: ${sq3['状态']} | 时间: ${sq3['时间']}`)
  parts.push(`核心问题: ${coreIssue}`)
  parts.push(`食安分类: ${classification.consult_type} (置信度: ${classification.confidence})`)
  parts.push(`情绪: ${emotion.emotion_level}${emotion.is_urgent ? ' [紧急]' : ''}`)

  const qcParts = Object.entries(sq1).map(([dim, status]) => `${dim}: ${status}`)
  parts.push(`QC: ${qcParts.join(', ')}`)

  if (sq2) {
    parts.push(`建议: ${sq2.replace(/\n/g, ' | ')}`)
  }

  return parts.join(' || ')
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 19 — Node 3 辅助函数: SOP 验证
// ═══════════════════════════════════════════════════════════════════════════

function _validateSOP(sopText, orderCtx, sessionCtx, sq3) {
  const failures = []
  const passes = []

  // 金额范围校验
  if (orderCtx.amount !== null && orderCtx.amount !== undefined) {
    const amount = Number(orderCtx.amount)
    if (isNaN(amount) || amount < 0) {
      failures.push(`SOP-金额: 订单金额异常 (${orderCtx.amount})`)
    } else if (amount > 500) {
      failures.push(`SOP-金额: 订单金额 ${amount} 元超出常规范围，需人工确认`)
    } else {
      passes.push('金额范围正常')
    }
  }

  // 退款校验 (集成公共规则 1, 2)
  if (orderCtx.hasRefund) {
    if (orderCtx.refundStatus === 'completed') {
      passes.push('退款已完成，无需重复处理')
    } else if (orderCtx.refundStatus === 'processing') {
      passes.push('退款处理中')
    }
  }

  // 时间维度校验 (集成公共规则 11)
  if (orderCtx.dialogueHour !== undefined && orderCtx.dialogueHour !== null) {
    if (orderCtx.dialogueHour >= 21) {
      passes.push('21点后对话，适用延迟处理流程')
    } else {
      passes.push('21点前对话，适用标准处理流程')
    }
  }

  // 杯数匹配校验
  if (orderCtx.cupCount !== undefined) {
    const cups = Number(orderCtx.cupCount)
    if (isNaN(cups) || cups <= 0) {
      failures.push(`SOP-杯数: 杯数异常 (${orderCtx.cupCount})`)
    } else if (cups > 10) {
      passes.push(`杯数 ${cups}，属大额订单，适用升级流程`)
    } else if (cups <= 3) {
      passes.push(`杯数 ${cups}，客服权限范围内`)
    } else {
      passes.push(`杯数 ${cups}，需主管审批`)
    }
  }

  // 特殊产品豁免 (OEM / 预包装食品)
  const productName = (orderCtx.drinkName || '').toLowerCase()
  if (OEM_CONTEXT_KEYWORDS.some(kw => productName.includes(kw))) {
    passes.push('OEM/预包装食品，适用 OEM 专属流程')
  }

  // 拒绝后诉求 (集成公共规则 8)
  if (sessionCtx.customerRejected) {
    const voucherCount = sessionCtx.voucherCount || 0
    const voucherAmount = sessionCtx.voucherAmount || 0
    if (voucherCount <= 3 && voucherAmount <= 30) {
      passes.push(`顾客拒绝后补偿方案: ${voucherCount}张/${voucherAmount}元，客服权限内可处理`)
    } else {
      failures.push(`SOP-拒绝后: 补偿超限 (${voucherCount}张/${voucherAmount}元/张)，需反馈负责人`)
    }
  }

  // SOP 文本中的额外规则检测
  if (sopText && sopText.trim().length > 0) {
    // 解析 SOP 中的关键规则
    if (sopText.includes('不允许退款') && sessionCtx.customerInitiatedRefund) {
      failures.push('SOP 明确规定不允许退款，但客服响应了退款诉求')
    }
  }

  return {
    pass: failures.length === 0,
    failures,
    passes,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 20 — AIQC_V2 工作流执行引擎
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 执行完整 AIQC_V2 工作流
 * @param {Object} input — 原始输入, 可包含 Coze 字段名或旧字段名
 * @returns {Object} 完整工作流输出, 含所有节点结果和 trace
 */
export function executeAIQCWorkflow(input) {
  const trace = []
  const timestamp = () => new Date().toISOString()

  // ── Node 1: 开始 ──
  const node1 = executeNode1_Start(input)
  trace.push({
    node_id: 1,
    node_name: '开始',
    model: null,
    status: 'completed',
    timestamp: timestamp(),
    output_summary: `会话 ${node1.normalized.CONVERSATION_ID} 输入标准化完成`,
  })

  // ── Node 2: 对话解构+服务分析 ──
  const node2 = executeNode2_DialogueAnalysis(node1.normalized, node1.extra)
  trace.push({
    node_id: 2,
    node_name: '对话解构+服务分析',
    model: '豆包·1.8·深度思考',
    status: 'completed',
    timestamp: timestamp(),
    output_summary: `sq1: ${JSON.stringify(node2.sq1)} | Dc_check: ${node2.Dc_check}`,
  })

  // ── Node 3: 工单操作专家 ──
  const node3 = executeNode3_BusinessProcessExpert(node1.normalized, node1.extra, node2)
  trace.push({
    node_id: 3,
    node_name: '工单操作专家',
    model: '豆包·1.5·Lite·32k',
    status: 'completed',
    timestamp: timestamp(),
    output_summary: `sqm1: ${node3.sqm1}${node3.sqm1 === '不达标' ? ' — ' + node3.sqm2 : ''}`,
  })

  // ── Node 4: 对话分类质检专家 ──
  const node4 = executeNode4_ClassificationQC(node1.normalized, node1.extra, node2)
  trace.push({
    node_id: 4,
    node_name: '对话分类质检专家',
    model: '豆包·1.6·极致速度',
    status: 'completed',
    timestamp: timestamp(),
    output_summary: `qc1: ${node4.qc1}${node4.qc1 === '不达标' ? ' — ' + node4.qc2 : ''}`,
  })

  // ── Node 5: 红线行为检测 ──
  const node5 = executeNode5_RedLineDetection(node1.normalized, node2)
  trace.push({
    node_id: 5,
    node_name: '红线行为检测',
    model: '豆包·1.5·Lite·32k',
    status: 'completed',
    timestamp: timestamp(),
    output_summary: `is_violate: ${node5.is_violate}${node5.is_violate ? ' — ' + node5.violation_type : ''}`,
  })

  // ── Node 5.5: 红线报警器 ──
  const node5_5 = executeNode5_5_RedLineAlert(node5)
  trace.push({
    node_id: '5.5',
    node_name: '红线报警器',
    model: null,
    status: 'completed',
    timestamp: timestamp(),
    output_summary: `risk_flag: ${node5_5.risk_flag}`,
  })

  // ── Node 6: 结案 ──
  const node6 = executeNode6_Conclusion(node2, node3, node4, node5, node5_5)
  trace.push({
    node_id: 6,
    node_name: '结案',
    model: null,
    status: 'completed',
    timestamp: timestamp(),
    output_summary: `10 变量输出完成`,
  })

  // ── 汇总输出 ──
  return {
    // Coze 工作流标准输出 (10 变量)
    sq1:               node6.sq1,
    qc1:               node6.qc1,
    sqm1:          node6.sqm1,
    is_violate:        node6.is_violate,
    sq3:               node6.sq3,
    sq2:               node6.sq2,
    qc2:               node6.qc2,
    sqm2:          node6.sqm2,
    cont_js:           node6.cont_js,
    reasoning_content: node6.reasoning_content,

    // 扩展元数据
    trace:              trace,
    normalized_input:   node1.normalized,
    classification:     node2._classification,
    emotion:            node2._emotion,
    to_block5_scene:    node2.to_block5_scene,
    to_block6_issue:    node2.to_block6_issue,
    process_trace:      node2.process_trace,
    Dc_check:           node2.Dc_check,
    violation_type:     node6._violation_type,
    violation_behavior: node6._violation_behavior,
    violation_quote:    node6._violation_quote,
    risk_flag:          node6._risk_flag,
    is_high_risk:       node6._is_high_risk,
    solution:           node3._solution,
    tickets:            node3._tickets,
    rule_results:       node3._ruleResults,
    sop_validation:     node3._sopValidation,

    // 向后兼容字段
    session_id:         node1.normalized.CONVERSATION_ID,
    need_human_review:  node2._classification?.need_human_review || false,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 21 — 旧版 Pipeline 类 (向后兼容包装)
// ═══════════════════════════════════════════════════════════════════════════

export class Pipeline {
  constructor() {
    this.workflow = AIQC_V2_WORKFLOW
  }

  /**
   * 执行完整管线 (兼容旧接口, 内部转调 AIQC_V2)
   * @param {Object} input — { session_id, user_text, merged_text, image_urls, order_id, phone, channel, session }
   * @returns {Object} 完整决策帧
   */
  execute(input) {
    const result = executeAIQCWorkflow({
      CONTENT_INPUT:   input.merged_text || input.user_text || '',
      CONVERSATION_ID: input.session_id || `sess-${Date.now()}`,
      AGENT_NAME:      input.session?.agentName || '',
      CUSTOMER_NAME:   input.session?.customerName || '',
      CUSTOMER_PHONE:  input.phone || '',
      Order:           input.order_id || '',
      Store:           input.session?.storeName || '',
      product:         input.session?.drinkName || '',
      SOP:             input.session?.sop || '',
      image_urls:      input.image_urls || [],
      session:         input.session || {},
      orderContext:    input.session?.orderContext || null,
    })

    // 构建旧版兼容的决策帧
    const decisionFrame = {
      decision_frame:         'food_safety_after_sales',
      prior_sources:          ['质培数据', '业务规则', '订单上下文'],
      top_label:              result.classification?.consult_type || '非食安问题',
      top_label_confidence:   result.classification?.confidence || 0,
      second_label:           result.classification?.posteriors?.[1]?.label || '',
      boundary_risk:          !!result.classification?.boundary_risk,
      risk_level:             result.classification?.risk_level || 'low',
      need_human_review:      result.classification?.need_human_review || false,
      next_action:            result.classification?.next_action || 'generate_reply',
      required_control_steps: _buildControlStepsFromResult(result),
      reason_code:            _buildReasonCodesFromResult(result),
    }

    // 生成回复 (阿喜人设)
    const route = _determineRoute(result)
    const reply = generateReply({
      route,
      classification: result.classification,
      orderContext:   result.solution ? { amount: result.solution.refund } : null,
      emotionState:   result.emotion,
      solution:       result.solution,
      turnIndex:      input.session?.turnIndex || 0,
      session:        input.session,
      imageAskedBefore: input.session?.imageGuided,
    })

    // 红线审核 (旧版 11 条, 用于回复质量检查)
    const redlineAudit = auditRedlines(reply, result.classification, result.emotion)

    return {
      session_id:      input.session_id,
      round_id:        (input.session?.turnIndex || 0) + 1,
      trace:           result.trace,
      decision_frame:  decisionFrame,
      classification:  result.classification,
      emotion:         result.emotion,
      image_status:    result.classification?.image_status,
      info_gap:        result.classification?.missing_info,
      solution:        result.solution,
      tickets:         result.tickets,
      reply:           reply,
      redline_audit:   redlineAudit,
      need_human_review: result.need_human_review,

      // AIQC_V2 扩展输出
      aiqc_v2: {
        sq1:               result.sq1,
        qc1:               result.qc1,
        sqm1:          result.sqm1,
        is_violate:        result.is_violate,
        sq3:               result.sq3,
        sq2:               result.sq2,
        qc2:               result.qc2,
        sqm2:          result.sqm2,
        cont_js:           result.cont_js,
        reasoning_content: result.reasoning_content,
      },
    }
  }
}

function _determineRoute(result) {
  if (!result.classification?.is_food_safety) return 'non_food_safety_transfer'
  if (result.emotion?.is_urgent) return 'emotion_first'
  if (result.classification.consult_type.startsWith('食安问题/身体不适')) return 'body_discomfort'
  if (result.classification.is_high_risk && HIGH_RISK_FOREIGN_OBJECTS.some(kw => result.classification.consult_type.includes(kw))) return 'high_risk_foreign_object'
  if (result.classification.consult_type.startsWith('食安问题/外源性异物')) return 'normal_foreign_object'
  if (result.classification.consult_type.startsWith('食安问题/内源性异物')) return 'internal_material'
  if (result.solution?.level) return 'solution_offer'
  return 'generate_reply'
}

function _buildControlStepsFromResult(result) {
  const steps = []
  if (result.classification?.missing_info?.order_missing || result.classification?.missing_info?.image_missing) {
    steps.push('ask_order_and_image')
  }
  if (result.classification?.consult_type?.startsWith('食安问题/身体不适')) {
    steps.push('ask_health_status_and_contact')
  }
  if (result.tickets?.some(t => t.type === 'store_ticket')) steps.push('create_ticket')
  if (result.tickets?.some(t => t.type === 'dingtalk_alert')) steps.push('dingtalk_escalate')
  if (result.tickets?.some(t => t.type === 'escalation')) steps.push('escalate_human')
  if (result.is_violate) steps.push('redline_review')
  steps.push('generate_reply')
  return steps
}

function _buildReasonCodesFromResult(result) {
  const codes = []
  if (result.classification?.is_food_safety) codes.push('FOOD_SAFETY_DETECTED')
  if (result.classification?.is_high_risk) codes.push('HIGH_RISK')
  if (result.classification?.boundary_risk) codes.push('BOUNDARY_RISK')
  if (result.classification?.need_human_review) codes.push('HUMAN_REVIEW_REQUIRED')
  if (result.emotion?.is_urgent) codes.push('EMOTION_URGENT')
  if (result.is_violate) codes.push('REDLINE_VIOLATION')
  if (result.sqm1 === '不达标') codes.push('BIZ_PROCESS_FAIL')
  if (result.qc1 === '不达标') codes.push('CLASSIFICATION_QC_FAIL')
  if (result.solution?.level) codes.push(`SOLUTION_${result.solution.level}`)
  return codes
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 22 — 快捷入口
// ═══════════════════════════════════════════════════════════════════════════

let _pipeline = null

export function getEngine() {
  if (!_pipeline) _pipeline = new Pipeline()
  return _pipeline
}

/**
 * 消息处理入口 — 单次执行 AIQC_V2 工作流
 * 同时返回旧版兼容格式和新版 AIQC_V2 输出
 *
 * @param {string} userText — 用户输入文本
 * @param {Object} session  — 会话上下文
 * @returns {Object} 完整处理结果
 */
export function processMessage(userText, session = {}) {
  const engine = getEngine()
  return engine.execute({
    session_id: session.sessionId || session.CONVERSATION_ID || `sess-${Date.now()}`,
    user_text:  userText,
    merged_text: session.mergedText || session.CONTENT_INPUT || userText,
    image_urls: session.imageUrls || [],
    order_id:   session.orderId || session.Order || null,
    phone:      session.phone || session.CUSTOMER_PHONE || null,
    channel:    session.channel || 'online',
    session: {
      ...session,
      turnIndex:   session.turnIndex || 0,
      hotDrinkName: session.hotDrinkName || '清爽芭乐提',
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 23 — 客服订单处理工作流 (Coze Order Processing Workflow)
// 独立于 AIQC_V2 质检工作流，处理顾客催单/订单状态/叫号等场景
//
// 节点总览:
//   Node A  — 开始 (Start)
//   Node B  — 查询订单信息 (DB Query)
//   Node C  — 意图识别 (Intent Recognition)         [豆包·1.5·Pro·32k]
//   Node D  — 判断意图 (Intent Branching, 5 路)
//   Node E1 — 不满足制作时效/未优先处理              [豆包·1.5·Pro·32k]
//   Node E2 — 没叫号处理                             [豆包·1.5·Pro·32k]
//   Node E3 — 叫号没完成处理                          [豆包·1.5·Pro·32k]
//   Node E4 — 超预计时间处理                          [豆包·1.5·Pro·32k]
//   Node E5 — 其他场景处理                            [豆包·1.5·Pro·32k]
//   Node F  — 聚合内容 (Content Aggregation)
//   Node G  — 结束 (End)
// ═══════════════════════════════════════════════════════════════════════════

export const ORDER_INTENT_SCENES = Object.freeze([
  {
    id: 'unmet_deadline',
    name: '不满足制作时效/未优先',
    taxonomyCategory: 'A',      // 时效类
    taxonomySubcategory: 'A1', // 催单催制
    priority: 1,
    description: '顾客反馈订单制作时间过长、未被优先处理',
    triggerKeywords: ['太慢了', '等了好久', '多久', '催单', '优先', '制作时间', '还要等', '什么时候好', '怎么还没好', '等了很久', '加急'],
    systemPrompt: `# 场景：不满足制作时效/未优先
1. 订单状态确认：若 {status} 为"制作中"，安抚顾客并告知前方还有 {number} 单
2. 催单处理：告知顾客已为您加急处理，预计 X 分钟内完成
3. 补偿方案：若等待超过30分钟，可提供5元代金券补偿
4. 确认方案：确认顾客是否接受方案`,
  },
  {
    id: 'no_call_number',
    name: '没叫号',
    taxonomyCategory: 'B',      // 取餐类
    taxonomySubcategory: 'B1', // 没叫号
    priority: 2,
    description: '顾客反馈到门店后没有被叫号',
    triggerKeywords: ['没叫号', '不叫号', '没人理', '到了没叫', '等叫号', '怎么不叫', '没有叫', '忘记叫号', '漏叫'],
    systemPrompt: `# 场景：没叫号
1. 确认顾客是否已到门店
2. 查询订单状态，若 {status} 为"待取餐"，告知前台会尽快叫号
3. 若 {number} 显示前方无人排队，建议直接到柜台取餐
4. 若订单异常，转人工处理`,
  },
  {
    id: 'call_incomplete',
    name: '叫号没完成',
    taxonomyCategory: 'B',      // 取餐类
    taxonomySubcategory: 'B2', // 叫号没完成
    priority: 3,
    description: '叫号后饮品未完成制作',
    triggerKeywords: ['叫了号但是没做好', '叫号了还没好', '取餐等了', '叫号后多久', '号码叫了', '叫了没做', '叫号了但是', '叫了号没取', '叫号没取餐'],
    systemPrompt: `# 场景：叫号没完成
1. 确认叫号时间，若 {status} 仍为"制作中"，告知预计完成时间
2. 若 {number} > 5，说明当前出杯压力较大，请耐心等待
3. 若已等待超过15分钟，提供优先制作承诺
4. 确认顾客是否愿意继续等待`,
  },
  {
    id: 'over_estimated_time',
    name: '超预计时间',
    taxonomyCategory: 'A',      // 时效类
    taxonomySubcategory: 'A2', // 超预计时间
    priority: 4,
    description: '订单超过预计送达/完成时间',
    triggerKeywords: ['超时', '超过了', '预计时间', '说好几点', '迟到了', '等了很久', '外卖还没到', '超预计', '比说的久'],
    systemPrompt: `# 场景：超预计时间
1. 订单状态确认：若 {status} 为"配送中"，查询骑手位置并告知预计到达时间
2. 若 {status} 为"制作中"且已超时，致歉并加急处理
3. 协商补偿：若超时超过24h且未补偿过，可提供10元代金券
4. 确认方案：确认顾客是否接受`,
  },
  {
    id: 'refund',
    name: '退款退单',
    taxonomyCategory: 'D',      // 订单变更类
    taxonomySubcategory: 'D1', // 退款退单
    priority: 5,
    description: '顾客要求退款或取消已有订单',
    triggerKeywords: ['退款', '退单', '不想要了', '取消订单', '退钱', '申请退款', '怎么退款', '能退吗'],
    systemPrompt: `# 场景：退款退单
1. 确认退款原因：了解顾客退款原因（品质问题/不想要/下错单等）
2. 订单状态判断：若 {status} 为"制作中"，可取消并全额退款
3. 若 {status} 为"已完成"或"待取餐"，按已完成订单退款规则处理
4. 退款方式：原路退回，预计1-3个工作日到账
5. 挽留方案：可先提供重做或代金券方案，顾客拒绝后再退款`,
  },
  {
    id: 'modify_order',
    name: '修改订单',
    taxonomyCategory: 'D',      // 订单变更类
    taxonomySubcategory: 'D2', // 修改订单
    priority: 6,
    description: '顾客要求修改订单商品规格、数量或配送信息',
    triggerKeywords: ['改一下', '换一个', '加料', '去冰', '少糖', '修改订单', '改地址', '换一杯', '改成', '帮我改'],
    systemPrompt: `# 场景：修改订单
1. 确认修改内容：明确顾客需要修改的具体信息（规格/数量/地址等）
2. 制作状态判断：若 {status} 为"制作中"，告知可能无法修改，尝试联系门店
3. 若 {status} 为"待制作"，可直接修改并确认新订单信息
4. 若已"配送中"，配送地址不可改，其他可备注给骑手
5. 修改确认：告知顾客修改结果`,
  },
  {
    id: 'delivery_delay',
    name: '配送延迟',
    taxonomyCategory: 'G',      // 配送类
    taxonomySubcategory: 'G1', // 配送延迟/异常
    priority: 7,
    description: '外卖配送时间超出预期或配送过程出现异常',
    triggerKeywords: ['骑手', '配送', '还没送到', '路上多久', '配送太慢', '外卖什么时候到', '送餐', '到了吗', '骑手在哪'],
    systemPrompt: `# 场景：配送延迟
1. 配送状态确认：若 {status} 为"配送中"，查询骑手位置
2. 预估时间：告知顾客骑手预计到达时间
3. 若配送异常（骑手取消/地址错误），创建工单通知门店重新配送
4. 安抚致歉：高峰期延迟致歉，超30分钟可补5元代金券
5. 若骑手失联超过15分钟，转人工处理`,
  },
  {
    id: 'package_damage',
    name: '包装破损',
    taxonomyCategory: 'G',      // 配送类
    taxonomySubcategory: 'G2', // 包装破损/撒漏
    priority: 8,
    description: '外卖送达后包装破损或饮品撒漏',
    triggerKeywords: ['洒了', '漏了', '包装破了', '撒了', '撒了一半', '杯子歪了', '漏出来', '包装烂了', '打翻了', '溢出来'],
    systemPrompt: `# 场景：包装破损/撒漏
1. 收集信息：请顾客提供破损/撒漏的照片
2. 安抚致歉：对包装问题表示歉意
3. 解决方案：提供全额退款或重做（推荐重做+优先配送）
4. 若顾客接受重做，通知门店优先制作并改进包装
5. 反馈门店：记录包装问题，建议门店改进打包方式`,
  },
  {
    id: 'other',
    name: '其他',
    taxonomyCategory: 'F',      // 服务体验类
    taxonomySubcategory: 'F1', // 转人工/投诉
    priority: 9,
    description: '不属于上述场景的通用客服问题',
    triggerKeywords: [],
    systemPrompt: `# 场景：其他
1. 如果用户要求"人工"/"人工客服"/"投诉"，转人工处理
2. 如果 [CONVERSATION] 中已有处理方案，确认是否满意
3. 如果难以辨别意图，礼貌追问确认
4. 保持专业，避免推诿责任，严格遵循内部流程`,
  },
])

export const ORDER_WORKFLOW_NODES = Object.freeze([
  {
    id: 'start',
    name: '开始',
    type: 'input',
    model: null,
    inputs: ['USER_INPUT', 'CONVERSATION', 'order_id'],
    description: '工作流起始节点，接收用户输入、历史对话和订单号',
  },
  {
    id: 'query_order',
    name: '查询订单信息',
    type: 'database',
    model: null,
    inputs: ['order_id'],
    outputs: ['order_id', 'status', 'number'],
    description: '从订单数据库查询订单状态、前方排队数等信息',
  },
  {
    id: 'intent_recognition',
    name: '意图识别',
    type: 'llm',
    model: '豆包·1.5·Pro·32k',
    inputs: ['CONVERSATION', 'USER_INPUT'],
    outputs: ['scene'],
    description: '使用大模型识别用户意图，输出场景分类(scene)',
  },
  {
    id: 'intent_branching',
    name: '判断意图',
    type: 'condition',
    model: null,
    condition: 'scene',
    branches: {
      '不满足制作时效/未优先': 'E1',
      '没叫号': 'E2',
      '叫号没完成': 'E3',
      '超预计时间': 'E4',
      '退款退单': 'E6',
      '修改订单': 'E7',
      '配送延迟': 'E8',
      '包装破损': 'E9',
      '其他': 'E5',
    },
    description: '根据意图识别结果路由到对应处理分支（9路优先级匹配）',
  },
  {
    id: 'handle_unmet_deadline',
    name: '不满足制作时效/未优先',
    type: 'llm',
    model: '豆包·1.5·Pro·32k',
    inputs: ['CONVERSATION', 'USER_INPUT', 'order_id', 'status', 'number'],
    outputs: ['reply'],
    description: '处理制作时效超时、未优先处理场景',
  },
  {
    id: 'handle_no_call',
    name: '没叫号处理',
    type: 'llm',
    model: '豆包·1.5·Pro·32k',
    inputs: ['CONVERSATION', 'USER_INPUT', 'order_id', 'status', 'number'],
    outputs: ['reply'],
    description: '处理顾客到店后未被叫号场景',
  },
  {
    id: 'handle_call_incomplete',
    name: '叫号没完成处理',
    type: 'llm',
    model: '豆包·1.5·Pro·32k',
    inputs: ['CONVERSATION', 'USER_INPUT', 'order_id', 'status', 'number'],
    outputs: ['reply'],
    description: '处理叫号后饮品未完成场景',
  },
  {
    id: 'handle_over_time',
    name: '超预计时间处理',
    type: 'llm',
    model: '豆包·1.5·Pro·32k',
    inputs: ['CONVERSATION', 'USER_INPUT', 'order_id', 'status', 'number'],
    outputs: ['reply'],
    description: '处理订单超过预计时间场景，含补偿协商',
  },
  {
    id: 'handle_refund',
    name: '退款退单处理',
    type: 'llm',
    model: '豆包·1.5·Pro·32k',
    inputs: ['CONVERSATION', 'USER_INPUT', 'order_id', 'status'],
    outputs: ['reply'],
    description: '处理顾客退款/退单请求，根据订单状态决定退款方式',
  },
  {
    id: 'handle_modify',
    name: '修改订单处理',
    type: 'llm',
    model: '豆包·1.5·Pro·32k',
    inputs: ['CONVERSATION', 'USER_INPUT', 'order_id', 'status'],
    outputs: ['reply'],
    description: '处理顾客修改订单请求（规格/数量/地址等）',
  },
  {
    id: 'handle_delivery_delay',
    name: '配送延迟处理',
    type: 'llm',
    model: '豆包·1.5·Pro·32k',
    inputs: ['CONVERSATION', 'USER_INPUT', 'order_id', 'status'],
    outputs: ['reply'],
    description: '处理外卖配送延迟场景，查询骑手状态并安抚',
  },
  {
    id: 'handle_package_damage',
    name: '包装破损处理',
    type: 'llm',
    model: '豆包·1.5·Pro·32k',
    inputs: ['CONVERSATION', 'USER_INPUT', 'order_id', 'status'],
    outputs: ['reply'],
    description: '处理外卖包装破损/撒漏，提供退款或重做方案',
  },
  {
    id: 'handle_other',
    name: '其他场景处理',
    type: 'llm',
    model: '豆包·1.5·Pro·32k',
    inputs: ['CONVERSATION', 'USER_INPUT'],
    outputs: ['output'],
    description: '处理不属于上述场景的通用客服问题',
  },
  {
    id: 'aggregate',
    name: '聚合内容',
    type: 'aggregator',
    model: null,
    inputs: ['E1.reply', 'E2.reply', 'E3.reply', 'E4.reply', 'E5.output', 'E6.reply', 'E7.reply', 'E8.reply', 'E9.reply'],
    outputs: ['output'],
    description: '拼接9路分支输出（仅命中分支有内容），生成最终回复',
  },
  {
    id: 'end',
    name: '结束',
    type: 'output',
    model: null,
    outputs: ['output', 'scene', 'order_id'],
    description: '返回最终回复(output)、场景(scene)、订单号(order_id)',
  },
])

/**
 * 模拟订单数据库查询
 * @param {string} orderId
 * @returns {{ order_id: string, status: string, number: number }}
 */
function queryOrderInfo(orderId) {
  const mockOrders = {
    'ORD-20260608-001': { order_id: 'ORD-20260608-001', status: '制作中', number: 3 },
    'ORD-20260608-002': { order_id: 'ORD-20260608-002', status: '待取餐', number: 0 },
    'ORD-20260608-003': { order_id: 'ORD-20260608-003', status: '配送中', number: 0 },
    'ORD-20260608-004': { order_id: 'ORD-20260608-004', status: '已完成', number: 0 },
    'ORD-20260608-005': { order_id: 'ORD-20260608-005', status: '制作中', number: 8 },
    'ORD-20260608-006': { order_id: 'ORD-20260608-006', status: '制作中', number: 2 },
    'ORD-20260608-007': { order_id: 'ORD-20260608-007', status: '配送中', number: 0 },
    'ORD-20260608-008': { order_id: 'ORD-20260608-008', status: '已完成', number: 0 },
  }
  return mockOrders[orderId] || { order_id: orderId || 'unknown', status: '未查询到', number: -1 }
}

/**
 * 意图识别 — 关键词匹配 + 优先级路由
 * @param {string} userInput
 * @param {string} conversation
 * @returns {string} scene name
 */
function recognizeIntent(userInput, conversation) {
  const text = (userInput + ' ' + conversation).toLowerCase()
  let bestScene = ORDER_INTENT_SCENES[ORDER_INTENT_SCENES.length - 1] // default: 其他
  let bestScore = 0

  for (const scene of ORDER_INTENT_SCENES) {
    if (scene.id === 'other') continue
    let score = 0
    for (const kw of scene.triggerKeywords) {
      if (text.includes(kw)) score++
    }
    if (score > bestScore) {
      bestScore = score
      bestScene = scene
    }
  }

  return bestScene.name
}

/**
 * 分支处理 — 根据场景生成回复
 * @param {string} scene
 * @param {Object} orderInfo
 * @param {string} userInput
 * @param {string} conversation
 * @returns {{ reply: string, ticket: string, compensate: boolean, amount: number }}
 */
function handleBranch(scene, orderInfo, userInput, conversation) {
  const { order_id, status, number } = orderInfo

  const responses = {
    '不满足制作时效/未优先': () => {
      if (status === '制作中' && number > 0) {
        return {
          reply: `非常抱歉让您久等了！您的订单 ${order_id} 目前正在制作中，前方还有 ${number} 单。我们已经为您加急处理，预计 5-8 分钟内可以完成。给您带来不便，真的非常抱歉！`,
          ticket: '', compensate: number >= 5, amount: number >= 5 ? 5 : 0,
        }
      }
      return {
        reply: `非常抱歉让您久等了！您的订单 ${order_id} 当前状态为「${status}」，我们已为您标记优先处理。如果还有其他问题，请随时告诉我。`,
        ticket: '', compensate: false, amount: 0,
      }
    },
    '没叫号': () => {
      if (status === '待取餐' && number === 0) {
        return {
          reply: `您好！您的订单 ${order_id} 已经准备好了，您可以直接到柜台报订单号取餐哦。如果前台暂时无人，请稍等片刻，马上会有伙伴为您服务。`,
          ticket: '', compensate: false, amount: 0,
        }
      }
      return {
        reply: `非常抱歉给您带来不便！您的订单 ${order_id} 当前状态为「${status}」，我已通知门店伙伴尽快为您叫号。请再稍等片刻，如果5分钟内仍未叫号，请再联系我。`,
        ticket: '已通知门店催叫号', compensate: false, amount: 0,
      }
    },
    '叫号没完成': () => {
      if (status === '制作中') {
        return {
          reply: `非常抱歉！您的订单 ${order_id} 叫号后仍在制作中，当前前方还有 ${number} 单。门店伙伴正在加紧制作，预计 3-5 分钟内完成。如等待超过15分钟，我们会为您优先制作。`,
          ticket: '', compensate: number > 5, amount: 0,
        }
      }
      return {
        reply: `您好，您的订单 ${order_id} 当前状态为「${status}」。如果叫号后长时间未取到饮品，请再告诉我，我们马上为您核实处理。`,
        ticket: '', compensate: false, amount: 0,
      }
    },
    '超预计时间': () => {
      if (status === '配送中') {
        return {
          reply: `非常抱歉让您久等了！您的订单 ${order_id} 目前正在配送中，骑手正在赶来的路上。因配送高峰期可能稍有延迟，请您再耐心等待几分钟。感谢您的理解！`,
          ticket: '', compensate: false, amount: 0,
        }
      }
      if (status === '制作中') {
        return {
          reply: `非常抱歉！您的订单 ${order_id} 制作时间超出预期，我们已为您加急处理。给您带来不好的体验，真的非常抱歉！`,
          ticket: '', compensate: true, amount: 10,
        }
      }
      return {
        reply: `非常抱歉！您的订单 ${order_id} 当前状态为「${status}」，我们已记录超时情况并会跟进处理。如有其他问题请随时联系。`,
        ticket: '', compensate: false, amount: 0,
      }
    },
    '其他': () => ({
      reply: `阿喜已收到您的信息，正在为您处理中。如果您需要人工客服，请回复"转人工"。`,
      ticket: '', compensate: false, amount: 0,
    }),
    '退款退单': () => {
      if (status === '制作中') {
        return {
          reply: `非常抱歉！您的订单 ${order_id} 目前还在制作中，阿喜可以帮您取消并安排全额退款，退款将原路退回，预计1-3个工作日到账。不过在退款之前，阿喜也可以为您安排重做一杯或者给您一张代金券，您看哪种方式更方便？`,
          ticket: '', compensate: false, amount: 0,
        }
      }
      if (status === '待取餐') {
        return {
          reply: `您好，您的订单 ${order_id} 已经制作完成等待取餐。如果您确定不需要了，阿喜可以帮您申请退款，退款将原路退回。您确认要退款吗？或者阿喜也可以帮您联系门店优先取餐。`,
          ticket: '', compensate: false, amount: 0,
        }
      }
      if (status === '已完成') {
        return {
          reply: `您好，您的订单 ${order_id} 已完成。如果您对产品不满意，阿喜非常抱歉。请问方便告知退款原因吗？阿喜会尽力为您处理。如果是品质问题，阿喜可以为您申请退款并反馈门店排查。`,
          ticket: '已完成订单退款申请', compensate: true, amount: 10,
        }
      }
      return {
        reply: `非常抱歉！您的订单 ${order_id} 当前状态为「${status}」，阿喜正在为您查询退款可行性。请稍等片刻，阿喜马上为您处理。`,
        ticket: '退款状态核实中', compensate: false, amount: 0,
      }
    },
    '修改订单': () => {
      if (status === '制作中') {
        return {
          reply: `非常抱歉，您的订单 ${order_id} 正在制作中，可能无法直接修改。阿喜帮您联系门店看看是否可以调整，请稍等片刻。如果是加料或调整甜度等小改动，门店伙伴可以在出杯前帮您处理。`,
          ticket: '联系门店确认修改', compensate: false, amount: 0,
        }
      }
      if (status === '配送中') {
        return {
          reply: `您好，您的订单 ${order_id} 已经在配送途中了，配送地址暂时无法修改。如果是饮品规格需要调整，阿喜可以备注给骑手。请问您具体想修改什么内容？`,
          ticket: '', compensate: false, amount: 0,
        }
      }
      if (status === '已完成') {
        return {
          reply: `您好，您的订单 ${order_id} 已经完成了，无法再进行修改。如果对饮品不满意，阿喜可以为您安排重做一杯或者给您代金券补偿，您看怎么处理比较好？`,
          ticket: '', compensate: true, amount: 5,
        }
      }
      return {
        reply: `好的，您的订单 ${order_id} 当前状态为「${status}」，阿喜可以帮您修改。请问您具体需要修改什么内容？（如规格、甜度、冰量、配料等）`,
        ticket: '', compensate: false, amount: 0,
      }
    },
    '配送延迟': () => {
      if (status === '配送中') {
        return {
          reply: `非常抱歉让您久等了！您的订单 ${order_id} 目前正在配送中，骑手小哥正在赶来的路上。配送高峰期可能稍有延迟，请您再耐心等待几分钟。如果等待超过30分钟，阿喜为您申请一张5元代金券作为补偿。感谢您的理解！`,
          ticket: '', compensate: false, amount: 0,
        }
      }
      if (status === '制作中') {
        return {
          reply: `非常抱歉！您的订单 ${order_id} 还在制作中，尚未安排骑手取餐。门店正在加紧制作，预计制作完成后会立即安排配送。给您带来不便非常抱歉！`,
          ticket: '', compensate: false, amount: 0,
        }
      }
      return {
        reply: `非常抱歉！您的订单 ${order_id} 当前状态为「${status}」，阿喜正在为您核实配送情况。如果骑手长时间未取餐或配送异常，阿喜会为您安排重新配送或退款处理。`,
        ticket: '配送异常核实', compensate: true, amount: 5,
      }
    },
    '包装破损': () => {
      return {
        reply: `非常抱歉给您带来不好的体验！包装破损/撒漏实在不应该。为了方便阿喜帮您处理，麻烦您拍一张破损/撒漏的照片发过来。阿喜可以为您安排以下方案：\n1. 全额退款，原路退回\n2. 重新制作一杯并优先配送，同时改进打包方式\n您看哪种方式更方便？`,
        ticket: '包装破损待核实', compensate: true, amount: 10,
      }
    },
  }

  const handler = responses[scene] || responses['其他']
  return handler()
}

/**
 * 执行客服订单处理工作流
 * @param {{ userInput: string, conversation: string, orderId: string }} input
 * @returns {Object} 工作流执行结果
 */
export function executeOrderWorkflow(input) {
  const { userInput = '', conversation = '', orderId = '' } = input
  const trace = []
  const timestamp = () => new Date().toISOString()

  // Node A: 开始
  trace.push({ node_id: 'A', node_name: '开始', type: 'input', status: 'completed', timestamp: timestamp() })

  // Node B: 查询订单信息
  const orderInfo = queryOrderInfo(orderId)
  trace.push({
    node_id: 'B', node_name: '查询订单信息', type: 'database', status: 'completed',
    timestamp: timestamp(), output_summary: `status: ${orderInfo.status}, number: ${orderInfo.number}`,
  })

  // Node C: 意图识别
  const scene = recognizeIntent(userInput, conversation)
  trace.push({
    node_id: 'C', node_name: '意图识别', type: 'llm', model: '豆包·1.5·Pro·32k',
    status: 'completed', timestamp: timestamp(), output_summary: `scene: ${scene}`,
  })

  // Node D: 判断意图
  const matchedScene = ORDER_INTENT_SCENES.find(s => s.name === scene) || ORDER_INTENT_SCENES[ORDER_INTENT_SCENES.length - 1]
  trace.push({
    node_id: 'D', node_name: '判断意图', type: 'condition', status: 'completed',
    timestamp: timestamp(), branch_taken: matchedScene.name,
  })

  // Node E: 分支处理
  const branchResult = handleBranch(scene, orderInfo, userInput, conversation)
  const branchNodeId = { '不满足制作时效/未优先': 'E1', '没叫号': 'E2', '叫号没完成': 'E3', '超预计时间': 'E4', '其他': 'E5', '退款退单': 'E6', '修改订单': 'E7', '配送延迟': 'E8', '包装破损': 'E9' }
  trace.push({
    node_id: branchNodeId[scene] || 'E5', node_name: matchedScene.name, type: 'llm',
    model: '豆包·1.5·Pro·32k', status: 'completed', timestamp: timestamp(),
    output_summary: `reply: ${branchResult.reply.slice(0, 40)}...`,
  })

  // Mark other branches as skipped
  for (const s of ORDER_INTENT_SCENES) {
    if (s.name !== scene && s.id !== 'other') {
      trace.push({
        node_id: branchNodeId[s.name], node_name: s.name, type: 'llm',
        model: '豆包·1.5·Pro·32k', status: 'skipped', timestamp: timestamp(),
      })
    }
  }

  // Node F: 聚合内容
  const output = branchResult.reply
  trace.push({
    node_id: 'F', node_name: '聚合内容', type: 'aggregator', status: 'completed',
    timestamp: timestamp(), output_summary: `output length: ${output.length}`,
  })

  // Node G: 结束
  trace.push({
    node_id: 'G', node_name: '结束', type: 'output', status: 'completed', timestamp: timestamp(),
  })

  return {
    output,
    scene,
    order_id: orderInfo.order_id,
    order_status: orderInfo.status,
    queue_number: orderInfo.number,
    compensate: branchResult.compensate,
    compensate_amount: branchResult.amount,
    ticket: branchResult.ticket,
    trace,
    workflow_type: 'order_processing',
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 25 — Agent 感知层 (Perception Layer)
// ───────────────────────────────────────────────────────────────────────────
// 理论基础: 空间智能 "感知-决策-行动" 闭环 (课件 §1.1)
//   "空间智能本质是运行在数字空间的软件系统，通过感知环境、决策规划、
//    执行任务形成'感知-决策-行动'闭环。"
//
// 设计原则:
//   感知层负责将多通道原始信号 (文本/情绪/订单/图片) 融合为统一的
//   环境状态表征 (State Representation)，供决策层推理使用。
//   对应强化学习中 "智能体在环境中获取某个状态" (课件 §6.1)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 情绪强度量化 — 基于多维度信号融合
 * @param {string} text - 用户输入文本
 * @param {Object} emotionState - detectEmotion 输出
 * @returns {Object} 量化情绪评估
 */
function _quantifyEmotionIntensity(text, emotionState) {
  const signals = []

  // 信号1: 感叹号密度 (每10字)
  const exclCount = (text.match(/！|!/g) || []).length
  const exclDensity = text.length > 0 ? exclCount / (text.length / 10) : 0
  signals.push({ name: 'exclamation_density', value: Math.min(exclDensity, 1), weight: 0.2 })

  // 信号2: 负面情绪关键词命中
  const negativeKws = ['投诉', '曝光', '315', '工商', '举报', '律师', '差评', '恶心', '想吐', '拉肚子', '食物中毒', '过敏', '进医院', '赔偿']
  const hitCount = negativeKws.filter(kw => text.includes(kw)).length
  signals.push({ name: 'negative_keyword_hits', value: Math.min(hitCount / 3, 1), weight: 0.3 })

  // 信号3: 文本长度 (长段愤怒文字 ≥30字含感叹号)
  const longAngryText = text.length >= 30 && exclCount >= 1
  signals.push({ name: 'long_angry_text', value: longAngryText ? 0.8 : 0, weight: 0.15 })

  // 信号4: 重复字符/词语 (表达强烈情绪)
  const repeatPattern = /(.)\1{2,}/g
  const repeatCount = (text.match(repeatPattern) || []).length
  signals.push({ name: 'repetition', value: Math.min(repeatCount / 2, 1), weight: 0.1 })

  // 信号5: 既有情绪检测结果
  const urgentScore = emotionState?.is_urgent ? 1 : (emotionState?.emotion_level === 'elevated' ? 0.6 : 0)
  signals.push({ name: 'emotion_detection', value: urgentScore, weight: 0.25 })

  // 加权融合
  const intensity = signals.reduce((sum, s) => sum + s.value * s.weight, 0)
  const normalizedIntensity = Math.round(intensity * 100) / 100

  let grade = 'calm'
  if (normalizedIntensity >= 0.7) grade = 'furious'
  else if (normalizedIntensity >= 0.5) grade = 'angry'
  else if (normalizedIntensity >= 0.3) grade = 'upset'
  else if (normalizedIntensity >= 0.1) grade = 'concerned'

  return {
    intensity: normalizedIntensity,
    grade,
    signals: signals.map(s => ({ name: s.name, value: s.value })),
    escalation_needed: normalizedIntensity >= 0.7,
  }
}

/**
 * 意图概率分布 — 9路意图分类的显式概率表征
 * @param {string} text - 用户输入
 * @param {Object} classification - 贝叶斯分类结果
 * @param {Object} session - 会话上下文
 * @returns {Object} 意图概率分布
 */
function _computeIntentDistribution(text, classification, session) {
  const intents = {
    food_safety_foreign_object: 0,
    food_safety_body_discomfort: 0,
    food_safety_internal_material: 0,
    food_safety_bad_taste: 0,
    food_safety_packaging: 0,
    order_issue: 0,
    general_complaint: 0,
    consultation: 0,
    other: 0,
  }

  // 基于贝叶斯分类结果分配基础概率
  if (classification?.is_food_safety) {
    const ct = classification.consult_type || ''
    if (ct.includes('外源性异物')) intents.food_safety_foreign_object = 0.7
    else if (ct.includes('内源性异物')) intents.food_safety_internal_material = 0.7
    else if (ct.includes('身体不适')) intents.food_safety_body_discomfort = 0.7
    else if (ct.includes('口感')) intents.food_safety_bad_taste = 0.7
    else if (ct.includes('包装')) intents.food_safety_packaging = 0.7
    else intents.food_safety_foreign_object = 0.4
  } else {
    intents.other = 0.3
  }

  // 关键词信号增强
  const intentSignals = {
    food_safety_foreign_object: ['头发', '虫子', '异物', '塑料', '铁丝', '异物', '苍蝇', '蟑螂', '指甲', '金属', '玻璃', '刀片', '线头', '烟头', '创可贴', '钢丝球'],
    food_safety_body_discomfort: ['拉肚子', '不舒服', '过敏', '恶心', '呕吐', '肚子疼', '身体不适', '医院', '腹泻', '发烧', '头晕', '食物中毒', '腹痛'],
    food_safety_internal_material: ['果肉', '茶叶', '沉淀', '原料', '残渣', '纤维', '籽', '果核', '果籽', '核', '葡萄籽', '颗粒物', '沉淀物', '果肉块', '果粒', '茶渣', '果皮'],
    food_safety_bad_taste: ['味道怪', '口感不对', '难喝', '变味', '酸了', '过期', '品控', '品质不行', '质量差', '异味', '馊味', '酸臭', '怪味'],
    food_safety_packaging: ['撒了', '漏了', '包装破', '杯子裂', '封口', '漏杯', '撒出来', '包装问题', '封口不严'],
    order_issue: ['订单', '催单', '退款', '配送', '没收到', '送错', '少送'],
    general_complaint: ['投诉', '差评', '不满意', '态度差', '曝光', '品控不行', '质量差'],
    consultation: ['请问', '想问', '咨询', '怎么', '如何', '能不能'],
  }

  for (const [intent, keywords] of Object.entries(intentSignals)) {
    const hits = keywords.filter(kw => text.includes(kw)).length
    if (hits > 0) {
      intents[intent] = Math.min(intents[intent] + hits * 0.15, 1)
    }
  }

  // 归一化为概率分布
  const total = Object.values(intents).reduce((s, v) => s + v, 0) || 1
  const distribution = {}
  for (const [k, v] of Object.entries(intents)) {
    distribution[k] = Math.round((v / total) * 1000) / 1000
  }

  // 排序返回 top intents
  const ranked = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .map(([intent, probability]) => ({ intent, probability }))

  return {
    distribution,
    top_intent: ranked[0],
    top_3: ranked.slice(0, 3),
    confidence: ranked[0].probability,
    ambiguous: ranked[0].probability < 0.4,
  }
}

/**
 * 信息完整度评估 — 基于当前决策所需信息缺口
 * @param {Object} session - 会话状态
 * @param {Object} classification - 分类结果
 * @returns {Object} 信息完整度
 */
function _assessInformationCompleteness(session, classification) {
  const required = []
  const available = []

  // 基础信息
  const fields = [
    { key: 'order_id', label: '订单号/手机号', check: () => !!(session.orderId || session.phone) },
    { key: 'store', label: '门店', check: () => !!session.storeName },
    { key: 'product', label: '产品', check: () => !!session.drinkName },
    { key: 'image', label: '照片证据', check: () => !!session.imageValid },
    { key: 'contact', label: '联系方式', check: () => !!session.contact },
    { key: 'health_status', label: '健康状况', check: () => !!session.healthStatus },
  ]

  for (const f of fields) {
    if (f.check()) {
      available.push({ key: f.key, label: f.label })
    } else {
      required.push({ key: f.key, label: f.label })
    }
  }

  // 食安问题必须有照片
  const isFoodSafety = classification?.is_food_safety
  const isBodyDiscomfort = classification?.consult_type?.includes('身体不适')

  const completeness = available.length / fields.length
  const score = Math.round(completeness * 100) / 100

  let sufficiency = 'sufficient'
  if (isFoodSafety && !session.imageValid) sufficiency = 'image_required'
  else if (isBodyDiscomfort && !session.contact) sufficiency = 'contact_required'
  else if (score < 0.3) sufficiency = 'insufficient'
  else if (score < 0.6) sufficiency = 'partial'

  return {
    score,
    sufficiency,
    available_fields: available,
    missing_fields: required,
    blocking_gaps: required.filter(f =>
      (isFoodSafety && f.key === 'image') ||
      (isBodyDiscomfort && f.key === 'contact') ||
      f.key === 'order_id'
    ),
  }
}

/**
 * Agent 感知层 — 多通道信号融合
 * 将原始输入转化为结构化环境状态表征
 *
 * @param {string} userText - 用户输入
 * @param {Object} session - 会话上下文
 * @param {Object} aiqcResult - AIQC_V2 工作流结果 (可选, 复用已有分析)
 * @returns {Object} 感知状态 (Perception State)
 */
export function perceiveEnvironment(userText, session = {}, aiqcResult = null) {
  const classification = aiqcResult?.classification || classifyFoodSafety(userText)
  const emotion = aiqcResult?.emotion || detectEmotion(userText)

  // 通道1: 情绪强度量化
  const emotionQuantified = _quantifyEmotionIntensity(userText, emotion)

  // 通道2: 意图概率分布
  const intentDistribution = _computeIntentDistribution(userText, classification, session)

  // 通道3: 信息完整度
  const infoCompleteness = _assessInformationCompleteness(session, classification)

  // 通道4: 风险信号扫描
  const riskSignals = {
    high_risk_object: HIGH_RISK_FOREIGN_OBJECTS.some(kw => userText.includes(kw)),
    body_discomfort: /身体不适|拉肚子|过敏|呕吐|恶心|医院/.test(userText),
    escalation_threat: /投诉|曝光|315|工商|举报|律师/.test(userText),
    red_line_trigger: REDLINE_CATEGORIES.some(cat =>
      cat.keywords.some(kw => userText.includes(kw))
    ),
    repeat_complaint: (session.turnIndex || 0) >= 3,
  }
  const riskScore = Object.values(riskSignals).filter(Boolean).length

  // 通道5: 会话动态 (多轮状态)
  const turnIndex = session.turnIndex || 0
  const sessionDynamics = {
    turn_index: turnIndex,
    is_first_turn: turnIndex === 0,
    is_multi_turn: turnIndex >= 2,
    is_stalled: turnIndex >= 4 && infoCompleteness.score < 0.5,
    time_context: new Date().getHours() >= 21 ? 'after_hours' : 'business_hours',
  }

  // 融合: 综合环境状态
  const overallUrgency = Math.max(
    emotionQuantified.intensity,
    riskScore / 5,
    riskSignals.body_discomfort ? 0.9 : 0,
    riskSignals.escalation_threat ? 0.8 : 0,
  )

  return {
    // 分通道感知结果
    emotion: emotionQuantified,
    intent: intentDistribution,
    info_completeness: infoCompleteness,
    risk_signals: riskSignals,
    risk_score: riskScore,
    session_dynamics: sessionDynamics,

    // 融合状态
    overall_urgency: Math.round(overallUrgency * 100) / 100,
    urgency_tier: overallUrgency >= 0.7 ? 'critical'
      : overallUrgency >= 0.4 ? 'high'
      : overallUrgency >= 0.2 ? 'moderate'
      : 'normal',

    // 原始引用
    _raw_classification: classification,
    _raw_emotion: emotion,

    // 感知时间戳
    perceived_at: new Date().toISOString(),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 26 — Agent 记忆模块 (Memory Module)
// ───────────────────────────────────────────────────────────────────────────
// 理论基础: 智能体记忆系统 (课件 §7.3.1)
//   "智能体需要依赖特定的记忆机制，实现对世界知识、社会认知、
//    历史交互的记忆。外置记忆用于存放自己的身份信息与过去经历
//    的状态信息，使智能体可以作为一个独立的个体存在。"
//
// 三类记忆:
//   1. 世界知识记忆 (World Knowledge) — 隐式: 贝叶斯分类器/规则库/SOP
//   2. 情景记忆 (Episodic Memory)   — 多轮对话上下文 + 历史决策链
//   3. 身份记忆 (Identity Memory)    — 阿喜角色设定 + 行为准则
// ═══════════════════════════════════════════════════════════════════════════

/** Agent 身份记忆 — 阿喜食安专家角色设定 */
export const AGENT_IDENTITY = Object.freeze({
  name: '阿喜',
  full_title: '喜茶食品安全智能助手',
  architecture: '基于扣子 AIQC_V2 工作流',
  workflow_chain: '深度思考解构对话 → 工单操作判定 → 食安分类质检 → 红线行为检测',

  // 行为准则 (从课件"角色扮演"理论衍生, §7.3.2)
  behavioral_principles: [
    '先共情后处理: 情绪优先于业务逻辑',
    '信息充分性: 决策前确保关键信息完整',
    '风险敏感性: 身体不适/高危异物自动升级',
    '权限边界: 不超权承诺，不主动退款',
    '闭环追踪: 每轮决策有据可查',
  ],

  // 沟通风格
  communication_style: {
    tone: '温暖专业',
    pronoun: '阿喜 (第一人称)',
    customer_address: '您 (敬语)',
    forbidden: ['亲', '亲亲', '!', '你 (非敬语)', '命令语气'],
  },
})

/**
 * Agent 情景记忆 — 多轮对话上下文管理
 * 对应课件"社会属性的记忆: 过去的社会交互经历"
 */
export class EpisodicMemory {
  constructor(sessionId) {
    this.sessionId = sessionId || `sess-${Date.now()}`
    this.episodes = []
    this.decisionChain = []
    this.perceptionHistory = []
    this._createdAt = new Date().toISOString()
  }

  /**
   * 记录一次感知-决策-执行回合
   * @param {Object} episode - { turn, perception, decision, action, feedback }
   */
  recordEpisode(episode) {
    this.episodes.push({
      turn: this.episodes.length + 1,
      timestamp: new Date().toISOString(),
      ...episode,
    })
  }

  /**
   * 记录决策链 (用于反思与自我修正)
   */
  recordDecision(decision) {
    this.decisionChain.push({
      turn: this.decisionChain.length + 1,
      timestamp: new Date().toISOString(),
      ...decision,
    })
  }

  /**
   * 获取最近 N 回合摘要
   */
  getRecentEpisodes(n = 3) {
    return this.episodes.slice(-n).map(ep => ({
      turn: ep.turn,
      intent: ep.perception?.intent?.top_intent?.intent,
      emotion: ep.perception?.emotion?.grade,
      action: ep.action?.tool_selected,
      outcome: ep.feedback?.outcome,
    }))
  }

  /**
   * 获取记忆摘要 (供决策层作为上下文)
   */
  getSummary() {
    if (this.episodes.length === 0) {
      return { turns: 0, status: 'new_session', patterns: [] }
    }

    const emotions = this.episodes.map(ep => ep.perception?.emotion?.grade).filter(Boolean)
    const intents = this.episodes.map(ep => ep.perception?.intent?.top_intent?.intent).filter(Boolean)
    const actions = this.episodes.map(ep => ep.action?.tool_selected).filter(Boolean)

    // 情绪趋势
    const emotionTrend = emotions.length >= 2
      ? (emotions[emotions.length - 1] === 'calm' && emotions[0] !== 'calm' ? 'improving'
        : emotions[emotions.length - 1] !== 'calm' && emotions[0] === 'calm' ? 'escalating'
        : 'stable')
      : 'insufficient_data'

    // 意图漂移检测
    const uniqueIntents = [...new Set(intents)]
    const intentDrift = uniqueIntents.length > 2

    return {
      turns: this.episodes.length,
      status: 'active_session',
      emotion_history: emotions,
      emotion_trend: emotionTrend,
      intent_history: intents,
      intent_drift: intentDrift,
      actions_taken: actions,
      patterns: this._detectPatterns(),
    }
  }

  /** 检测重复模式 (如顾客反复追问同一问题) */
  _detectPatterns() {
    const patterns = []
    const intents = this.episodes.map(ep => ep.perception?.intent?.top_intent?.intent).filter(Boolean)

    if (intents.length >= 3) {
      const lastThree = intents.slice(-3)
      if (lastThree.every(i => i === lastThree[0])) {
        patterns.push({ type: 'repeated_intent', intent: lastThree[0], count: 3, signal: 'customer_unsatisfied' })
      }
    }

    const emotions = this.episodes.map(ep => ep.perception?.emotion?.intensity || 0)
    if (emotions.length >= 2 && emotions.every((v, i) => i === 0 || v >= emotions[i - 1])) {
      patterns.push({ type: 'escalating_emotion', signal: 'urgency_increasing' })
    }

    return patterns
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 27 — Agent 决策层 (Decision Layer)
// ───────────────────────────────────────────────────────────────────────────
// 理论基础: 推理与规划 (课件 §7.1 + §7.3.1 思考模块)
//
//   思维链 (Chain-of-Thought, CoT):
//     "明确告知模型先输出中间的推理步骤，再根据生成的步骤得出答案，
//      可以显著提升推理表现。" (课件 §7.1.1)
//
//   由少至多提示 (Least-to-Most Prompting):
//     "将复杂问题分解为多个较为简单的子问题，然后逐一解决。" (课件 §7.1.2)
//
//   反思与学习 (Reflection):
//     "智能体需要具备自我反思能力，能够根据外界的反馈进行反思，
//      纠正历史错误与完善行动决策。" (课件 §7.3.1)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * CoT 推理链构建 — 显式记录每步推理过程
 * 对应课件 §7.1.1 "思维链提示"
 *
 * @param {Object} perception - 感知层输出
 * @param {Object} memory - 情景记忆摘要
 * @returns {Object} 推理链 + 决策结论
 */
function _buildChainOfThought(perception, memory) {
  const chain = []
  let stepIndex = 0

  // Step 1: 环境状态解读
  chain.push({
    step: ++stepIndex,
    phase: 'understanding',
    title: '环境状态解读',
    reasoning: _reasonEnvironmentState(perception),
    output: {
      urgency: perception.urgency_tier,
      primary_intent: perception.intent.top_intent,
      emotion_state: perception.emotion.grade,
    },
  })

  // Step 2: 风险评估
  chain.push({
    step: ++stepIndex,
    phase: 'risk_assessment',
    title: '风险评估',
    reasoning: _reasonRiskAssessment(perception),
    output: {
      risk_level: perception.risk_score >= 3 ? 'high' : perception.risk_score >= 1 ? 'medium' : 'low',
      risk_factors: Object.entries(perception.risk_signals)
        .filter(([, v]) => v)
        .map(([k]) => k),
      red_line_probability: perception.risk_signals.red_line_trigger ? 'elevated' : 'low',
    },
  })

  // Step 3: 信息充分性判断
  chain.push({
    step: ++stepIndex,
    phase: 'sufficiency_check',
    title: '信息充分性判断',
    reasoning: _reasonInfoSufficiency(perception),
    output: {
      sufficiency: perception.info_completeness.sufficiency,
      can_proceed: perception.info_completeness.blocking_gaps.length === 0,
      blocking_gaps: perception.info_completeness.blocking_gaps,
    },
  })

  // Step 4: 历史经验参照 (记忆模块)
  if (memory && memory.turns > 0) {
    chain.push({
      step: ++stepIndex,
      phase: 'memory_reference',
      title: '历史经验参照',
      reasoning: _reasonMemoryReference(memory, perception),
      output: {
        emotion_trend: memory.emotion_trend,
        intent_drift: memory.intent_drift,
        patterns: memory.patterns,
        should_adjust_strategy: memory.emotion_trend === 'escalating' || memory.intent_drift,
      },
    })
  }

  // Step 5: 策略推导
  chain.push({
    step: ++stepIndex,
    phase: 'strategy_derivation',
    title: '策略推导',
    reasoning: _reasonStrategy(chain, perception),
    output: _deriveStrategyFromChain(chain, perception),
  })

  return {
    chain,
    total_steps: chain.length,
    conclusion: chain[chain.length - 1].output,
    reasoning_trace: chain.map(s => `[${s.step}.${s.phase}] ${s.title}: ${s.reasoning}`).join(' → '),
  }
}

/* ─── CoT 推理辅助函数 ─── */

function _reasonEnvironmentState(perception) {
  const urgency = perception.urgency_tier
  const emotion = perception.emotion.grade
  const intent = perception.intent.top_intent.intent

  if (urgency === 'critical') {
    return `紧急状态: 顾客情绪${emotion}，意图为${intent}，需要立即响应安抚`
  }
  if (urgency === 'high') {
    return `高优先状态: 检测到${emotion}情绪，${intent}意图明确，需快速处理`
  }
  return `常规状态: 顾客情绪${emotion}，${intent}意图，按标准流程处理`
}

function _reasonRiskAssessment(perception) {
  const risks = Object.entries(perception.risk_signals).filter(([, v]) => v).map(([k]) => k)
  if (risks.length === 0) return '未检测到显著风险信号'
  if (risks.includes('body_discomfort')) return '检测到身体不适信号，需启动健康安全优先流程'
  if (risks.includes('escalation_threat')) return '检测到投诉升级威胁，需优先安抚并快速解决'
  return `检测到 ${risks.length} 项风险信号: ${risks.join(', ')}，需加强关注`
}

function _reasonInfoSufficiency(perception) {
  const ic = perception.info_completeness
  if (ic.sufficiency === 'sufficient') return '信息充分，可直接进入决策阶段'
  if (ic.blocking_gaps.length > 0) {
    const gaps = ic.blocking_gaps.map(g => g.label).join('、')
    return `关键信息缺失 (${gaps})，需先引导顾客补充再进入决策`
  }
  return `信息部分完整 (${Math.round(ic.score * 100)}%)，可基于已有信息做初步判断`
}

function _reasonMemoryReference(memory, perception) {
  if (!memory || memory.turns === 0) return '首次对话，无历史经验可参照'

  const parts = []
  if (memory.emotion_trend === 'escalating') {
    parts.push('情绪持续升级，前几轮安抚效果不佳，需调整策略')
  }
  if (memory.emotion_trend === 'improving') {
    parts.push('情绪趋于缓和，当前策略有效，继续保持')
  }
  if (memory.intent_drift) {
    parts.push('意图多次漂移，可能问题未解决或有多个诉求')
  }
  if (memory.patterns?.some(p => p.type === 'repeated_intent')) {
    parts.push('顾客反复表达同一意图，说明之前的回应未满足需求')
  }
  return parts.length > 0 ? parts.join('；') : '历史交互正常，按标准流程处理'
}

function _reasonStrategy(chain, perception) {
  const steps = Object.fromEntries(chain.map(s => [s.phase, s.output]))

  if (steps.understanding?.urgency === 'critical' || perception.risk_signals.body_discomfort) {
    return '紧急路径: 先安抚情绪 → 收集关键信息 → 升级人工处理'
  }
  if (!steps.sufficiency_check?.can_proceed) {
    return '信息收集路径: 引导补充缺失信息 → 信息充分后进入决策'
  }
  if (steps.risk_assessment?.risk_level === 'high') {
    return '高风险路径: 快速分类 → 匹配高阶补偿方案 → 升级通知'
  }
  return '标准路径: 分类处理 → 匹配方案 → 生成回复 → 质检审核'
}

function _deriveStrategyFromChain(chain, perception) {
  const steps = Object.fromEntries(chain.map(s => [s.phase, s.output]))
  const isFoodSafety = perception._raw_classification?.is_food_safety

  // 路由决策
  let route = 'standard'
  if (steps.understanding?.urgency === 'critical') route = 'emotion_first'
  else if (!steps.sufficiency_check?.can_proceed) route = 'info_collection'
  else if (perception.risk_signals.body_discomfort) route = 'body_discomfort'
  else if (perception.risk_signals.high_risk_object) route = 'high_risk'
  else if (!isFoodSafety) route = 'non_food_safety'

  // 优先级队列
  const priorities = []
  if (perception.emotion.intensity >= 0.5) priorities.push('empathy_first')
  if (steps.sufficiency_check?.blocking_gaps?.length > 0) priorities.push('collect_info')
  if (isFoodSafety) priorities.push('classify_and_resolve')
  if (steps.risk_assessment?.risk_level === 'high') priorities.push('escalate')
  priorities.push('generate_reply')

  return {
    route,
    priorities,
    estimated_complexity: chain.length >= 5 ? 'high' : chain.length >= 3 ? 'medium' : 'low',
    needs_escalation: perception.risk_signals.escalation_threat || perception.risk_signals.body_discomfort,
    reflection_needed: steps.memory_reference?.should_adjust_strategy || false,
  }
}

/**
 * Least-to-Most 任务分解 — 将复杂问题拆解为子任务序列
 * 对应课件 §7.1.2 "由少至多提示"
 *
 * @param {Object} perception - 感知层输出
 * @param {Object} cotResult - CoT 推理链结果
 * @returns {Object} 子任务分解序列
 */
function _decomposeTaskLeastToMost(perception, cotResult) {
  const strategy = cotResult.conclusion
  const subtasks = []

  // 子任务1: 情绪处理 (如果需要)
  if (perception.emotion.intensity >= 0.3) {
    subtasks.push({
      id: 'ST1',
      name: '情绪安抚',
      priority: 1,
      depends_on: [],
      tool_hint: 'empathy_response',
      description: `顾客情绪为 ${perception.emotion.grade} (强度 ${perception.emotion.intensity})，需先安抚`,
    })
  }

  // 子任务2: 信息收集 (如果有缺口)
  const gaps = perception.info_completeness.blocking_gaps
  if (gaps.length > 0) {
    subtasks.push({
      id: 'ST2',
      name: '信息收集',
      priority: 2,
      depends_on: ['ST1'],
      tool_hint: 'info_collection',
      description: `需收集: ${gaps.map(g => g.label).join('、')}`,
    })
  }

  // 子任务3: 食安分类与方案匹配
  if (perception._raw_classification?.is_food_safety) {
    subtasks.push({
      id: 'ST3',
      name: '分类与方案',
      priority: 3,
      depends_on: gaps.length > 0 ? ['ST2'] : ['ST1'],
      tool_hint: 'compensation_matrix',
      description: `${perception._raw_classification.consult_type} → 匹配补偿方案`,
    })
  }

  // 子任务4: 升级处理 (如果需要)
  if (strategy.needs_escalation) {
    subtasks.push({
      id: 'ST4',
      name: '升级处理',
      priority: 4,
      depends_on: ['ST3'],
      tool_hint: 'escalation_system',
      description: `触发升级: ${perception.risk_signals.body_discomfort ? '身体不适' : '投诉威胁'}`,
    })
  }

  // 子任务5: 回复生成
  subtasks.push({
    id: `ST${subtasks.length + 1}`,
    name: '回复生成',
    priority: subtasks.length + 1,
    depends_on: subtasks.map(s => s.id),
    tool_hint: 'reply_generation',
    description: '基于以上子任务结果生成最终回复',
  })

  return {
    subtasks,
    total_subtasks: subtasks.length,
    critical_path: subtasks.map(s => s.id).join(' → '),
    parallelizable: subtasks.filter(s => s.depends_on.length === 0).map(s => s.id),
  }
}

/**
 * 反思机制 — 基于执行反馈自我修正
 * 对应课件 §7.3.1 "反思与学习能力"
 *
 * @param {Object} decision - 原始决策
 * @param {Object} executionResult - 执行结果
 * @param {Object} memory - 情景记忆
 * @returns {Object} 反思结果 + 修正建议
 */
function _reflectOnDecision(decision, executionResult, memory) {
  const reflections = []
  let shouldRevise = false

  // 反思1: 策略一致性检查
  if (executionResult?.solution && decision.route === 'standard') {
    if (executionResult.solution.level === 'L4' || executionResult.solution.level === 'L5') {
      reflections.push({
        check: 'strategy_consistency',
        finding: '标准路径产生了高阶补偿方案 (L4/L5)，可能应走高风险路径',
        severity: 'warning',
      })
      shouldRevise = true
    }
  }

  // 反思2: 情绪适配检查
  if (executionResult?.emotion && decision.priorities?.[0] !== 'empathy_first') {
    if (executionResult.emotion.is_urgent) {
      reflections.push({
        check: 'emotion_alignment',
        finding: '紧急情绪状态但决策未将安抚置于首位',
        severity: 'critical',
      })
      shouldRevise = true
    }
  }

  // 反思3: 历史模式对照
  if (memory?.patterns?.some(p => p.signal === 'customer_unsatisfied')) {
    reflections.push({
      check: 'history_pattern',
      finding: '顾客重复表达同一意图，之前的回复可能未解决核心问题',
      severity: 'warning',
    })
    shouldRevise = true
  }

  // 反思4: 红线风险复核
  if (executionResult?.redline_audit?.rewrite_required) {
    reflections.push({
      check: 'redline_compliance',
      finding: `回复触发 ${executionResult.redline_audit.violation_count} 条红线违规，需要重写`,
      severity: 'critical',
    })
    shouldRevise = true
  }

  // 反思5: 业务规则冲突
  if (executionResult?.rule_results?.some(r => !r.pass && r.reason)) {
    const failures = executionResult.rule_results.filter(r => !r.pass)
    reflections.push({
      check: 'rule_compliance',
      finding: `${failures.length} 条业务规则未通过: ${failures.map(f => f.reason).join('; ')}`,
      severity: 'warning',
    })
  }

  return {
    reflections,
    should_revise: shouldRevise,
    revision_count: reflections.filter(r => r.severity === 'critical').length,
    confidence: shouldRevise ? 'low' : 'high',
    revised_strategy: shouldRevise ? _generateRevisedStrategy(decision, reflections) : null,
    reflected_at: new Date().toISOString(),
  }
}

function _generateRevisedStrategy(originalDecision, reflections) {
  const revised = { ...originalDecision, _revised: true }

  for (const r of reflections) {
    if (r.check === 'emotion_alignment' && r.severity === 'critical') {
      revised.route = 'emotion_first'
      revised.priorities = ['empathy_first', ...(revised.priorities || []).filter(p => p !== 'empathy_first')]
    }
    if (r.check === 'strategy_consistency') {
      revised.route = 'high_risk'
      revised.needs_escalation = true
    }
    if (r.check === 'redline_compliance') {
      revised.reply_requires_rewrite = true
    }
  }

  return revised
}

/**
 * Agent 决策层 — 完整决策流程
 *
 * @param {Object} perception - 感知层输出
 * @param {EpisodicMemory} episodicMemory - 情景记忆
 * @returns {Object} 决策结果
 */
export function makeDecision(perception, episodicMemory = null) {
  // 1. 获取记忆摘要
  const memorySummary = episodicMemory ? episodicMemory.getSummary() : null

  // 2. CoT 推理链
  const cot = _buildChainOfThought(perception, memorySummary)

  // 3. Least-to-Most 任务分解
  const taskDecomposition = _decomposeTaskLeastToMost(perception, cot)

  // 4. 反思机制 (基于历史决策)
  const lastDecision = episodicMemory?.decisionChain?.slice(-1)?.[0]
  const reflection = lastDecision
    ? _reflectOnDecision(lastDecision, null, memorySummary)
    : { reflections: [], should_revise: false, confidence: 'high' }

  return {
    // 推理链
    chain_of_thought: cot,

    // 任务分解
    task_decomposition: taskDecomposition,

    // 最终策略
    strategy: cot.conclusion,

    // 反思
    reflection,

    // 决策元数据
    decision_id: `dec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    decided_at: new Date().toISOString(),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 28 — Agent 执行层 (Action Layer)
// ───────────────────────────────────────────────────────────────────────────
// 理论基础: 工具调用模块 (课件 §7.3.1)
//   "工具调用模块进一步提升了智能体的能力：可以缓解智能体的记忆
//    负担，提高专业能力，还能增强可解释性与鲁棒性。"
//
// 工具注册表模式:
//   每个工具 (Tool) 封装一个原子能力，Agent 根据决策层的策略
//   选择并调用合适的工具，执行后返回结果信号供闭环反馈。
// ═══════════════════════════════════════════════════════════════════════════

/** 工具注册表 */
export const AGENT_TOOL_REGISTRY = Object.freeze([
  {
    id: 'food_safety_classifier',
    name: '贝叶斯食安分类器',
    description: '23标签闭集贝叶斯分类 + 非食安检测',
    category: 'perception',
    fn: 'classifyFoodSafety',
    available: true,
  },
  {
    id: 'emotion_detector',
    name: '情绪检测器',
    description: '多级情绪识别 (normal/elevated/urgent)',
    category: 'perception',
    fn: 'detectEmotion',
    available: true,
  },
  {
    id: 'compensation_matrix',
    name: '5级补偿方案矩阵',
    description: 'L1-L5 分级补偿方案生成',
    category: 'decision',
    fn: 'generateSolution',
    available: true,
  },
  {
    id: 'redline_auditor',
    name: '红线行为审计',
    description: '4维度质检 + 6类红线检测',
    category: 'quality',
    fn: 'auditRedlines',
    available: true,
  },
  {
    id: 'ticket_manager',
    name: '工单管理器',
    description: '工单创建/升级/钉钉通知',
    category: 'execution',
    fn: 'manageTickets',
    available: true,
  },
  {
    id: 'reply_generator',
    name: '阿喜人设回复生成器',
    description: '8种路由模板 + 阿喜人设',
    category: 'execution',
    fn: 'generateReply',
    available: true,
  },
  {
    id: 'info_gap_detector',
    name: '信息缺口检测器',
    description: '订单/图片/联系方式等缺口检测',
    category: 'perception',
    fn: 'checkInfoGap',
    available: true,
  },
  {
    id: 'image_tracker',
    name: '图片状态追踪器',
    description: '图片提供/引导/验证状态管理',
    category: 'perception',
    fn: 'trackImageStatus',
    available: true,
  },
  {
    id: 'rule_validator',
    name: '12条公共业务规则验证器',
    description: '退款/代金券/权限等规则校验',
    category: 'quality',
    fn: 'PUBLIC_RULES',
    available: true,
  },
  {
    id: 'order_workflow',
    name: '订单处理工作流',
    description: '催单/叫号/配送等订单场景处理',
    category: 'execution',
    fn: 'executeOrderWorkflow',
    available: true,
  },
  {
    id: 'aiqc_v2_pipeline',
    name: 'AIQC_V2 完整质检管线',
    description: '6节点多模型质检 (对话解构→工单→分类→红线→结案)',
    category: 'pipeline',
    fn: 'executeAIQCWorkflow',
    available: true,
  },
])

/**
 * 工具选择器 — 根据策略选择最优工具组合
 * 对应课件 "通过零样本或少样本提示来学习如何选择及调用工具"
 *
 * @param {Object} strategy - 决策层输出的策略
 * @param {Object} perception - 感知层输出
 * @returns {Object} 工具调用计划
 */
function _selectTools(strategy, perception) {
  const plan = []

  // 始终执行: AIQC_V2 管线
  plan.push({
    tool_id: 'aiqc_v2_pipeline',
    tool: AGENT_TOOL_REGISTRY.find(t => t.id === 'aiqc_v2_pipeline'),
    order: 1,
    reason: '全链路质检为必选步骤',
    mandatory: true,
  })

  // 条件执行: 根据路由策略选择额外工具
  if (strategy.route === 'emotion_first' || perception.emotion.intensity >= 0.5) {
    plan.push({
      tool_id: 'reply_generator',
      tool: AGENT_TOOL_REGISTRY.find(t => t.id === 'reply_generator'),
      order: 2,
      reason: '高情绪强度需优先生成安抚回复',
      params: { route: 'emotion_first' },
    })
  }

  if (strategy.needs_escalation) {
    plan.push({
      tool_id: 'ticket_manager',
      tool: AGENT_TOOL_REGISTRY.find(t => t.id === 'ticket_manager'),
      order: 3,
      reason: '策略标记需要升级处理',
      params: { escalation: true },
    })
  }

  // 质量保障: 红线审计
  plan.push({
    tool_id: 'redline_auditor',
    tool: AGENT_TOOL_REGISTRY.find(t => t.id === 'redline_auditor'),
    order: plan.length + 1,
    reason: '所有回复需通过红线审计',
    mandatory: true,
  })

  return {
    plan,
    total_tools: plan.length,
    mandatory_count: plan.filter(p => p.mandatory).length,
    estimated_latency: `${plan.length * 50}ms`,
  }
}

/**
 * 执行工具调用计划
 * @param {Object} toolPlan - 工具调用计划
 * @param {Object} context - 执行上下文
 * @returns {Object} 执行结果
 */
function _executeToolPlan(toolPlan, context) {
  const results = []
  const { userText, session, perception, decision } = context

  for (const item of toolPlan.plan) {
    let result = null

    try {
      switch (item.tool_id) {
        case 'aiqc_v2_pipeline':
          result = executeAIQCWorkflow({
            CONTENT_INPUT: session.mergedText || userText,
            CONVERSATION_ID: session.sessionId || `sess-${Date.now()}`,
            Order: session.orderId || '',
            Store: session.storeName || '',
            product: session.drinkName || '',
            image_urls: session.imageUrls || [],
            session,
          })
          break

        case 'reply_generator':
          result = { reply: generateReply({
            route: item.params?.route || decision?.strategy?.route || 'standard',
            classification: perception?._raw_classification,
            emotionState: perception?._raw_emotion,
            session,
          })}
          break

        case 'ticket_manager':
          result = manageTickets(
            perception?._raw_classification || {},
            context.solution || null,
            session,
          )
          break

        case 'redline_auditor':
          result = auditRedlines(
            context.reply || '',
            perception?._raw_classification,
            perception?._raw_emotion,
          )
          break

        default:
          result = { status: 'skipped', reason: `未映射工具: ${item.tool_id}` }
      }
    } catch (err) {
      result = { status: 'error', error: err.message }
    }

    results.push({
      tool_id: item.tool_id,
      tool_name: item.tool?.name,
      order: item.order,
      result,
      executed_at: new Date().toISOString(),
    })
  }

  return {
    results,
    total_executed: results.length,
    success_count: results.filter(r => r.result?.status !== 'error').length,
    error_count: results.filter(r => r.result?.status === 'error').length,
  }
}

/**
 * Agent 执行层 — 选择并执行工具
 *
 * @param {Object} decision - 决策层输出
 * @param {Object} perception - 感知层输出
 * @param {string} userText - 用户输入
 * @param {Object} session - 会话上下文
 * @returns {Object} 执行结果
 */
export function executeAction(decision, perception, userText, session = {}) {
  // 1. 工具选择
  const toolPlan = _selectTools(decision.strategy, perception)

  // 2. 预执行 AIQC_V2 (获取完整分析结果)
  const aiqcResult = executeAIQCWorkflow({
    CONTENT_INPUT: session.mergedText || userText,
    CONVERSATION_ID: session.sessionId || `sess-${Date.now()}`,
    Order: session.orderId || '',
    Store: session.storeName || '',
    product: session.drinkName || '',
    image_urls: session.imageUrls || [],
    session,
  })

  // 3. 生成回复
  const route = decision.strategy.route === 'info_collection'
    ? 'ask_order_and_image'
    : decision.strategy.route === 'non_food_safety'
    ? 'non_food_safety_transfer'
    : decision.strategy.route === 'high_risk'
    ? 'high_risk_foreign_object'
    : decision.strategy.route === 'body_discomfort'
    ? 'body_discomfort'
    : decision.strategy.route === 'emotion_first'
    ? 'emotion_first'
    : _determineRoute(aiqcResult)

  const reply = generateReply({
    route,
    classification: aiqcResult.classification,
    orderContext: aiqcResult.solution ? { amount: aiqcResult.solution.refund } : null,
    emotionState: aiqcResult.emotion,
    solution: aiqcResult.solution,
    turnIndex: session.turnIndex || 0,
    session,
  })

  // 4. 红线审计
  const redlineAudit = auditRedlines(reply, aiqcResult.classification, aiqcResult.emotion)

  // 5. 组装执行结果
  return {
    // 工具调用计划
    tool_plan: toolPlan,

    // 核心输出
    reply,
    route,
    redline_audit: redlineAudit,

    // AIQC_V2 完整结果
    aiqc_result: aiqcResult,

    // 执行元数据
    tool_selected: route,
    execution_id: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    executed_at: new Date().toISOString(),

    // 反馈信号 (供闭环使用)
    feedback: {
      outcome: redlineAudit.rewrite_required ? 'needs_revision' : 'success',
      quality_score: redlineAudit.rewrite_required ? 'low' : 'acceptable',
      violations: redlineAudit.violations || [],
      solution_generated: !!aiqcResult.solution,
      escalation_triggered: aiqcResult.risk_flag || false,
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 29 — Agent 闭环引擎 (Closed-Loop Engine)
// ───────────────────────────────────────────────────────────────────────────
// 理论基础: "感知→决策→行动→再感知" 实时闭环 (课件 §1.1)
//   "具身智能强调在'感知→决策→行动→再感知'的实时闭环中持续进化。"
//
// 强化学习框架 (课件 §6.1):
//   "智能体在环境中获取某个状态后，会根据该状态输出一个动作。
//    动作会在环境中执行，环境会根据智能体采取的动作给出反馈(奖励)。"
//
// 闭环自适应:
//   执行结果 → 反思 → 策略修正 → 重新执行 (最多 MAX_REVISIONS 次)
// ═══════════════════════════════════════════════════════════════════════════

const MAX_REVISIONS = 2

/**
 * 执行完整 "感知→决策→执行→反思" 闭环
 *
 * 这是 Agent 理论框架的核心入口，将感知层、决策层、执行层
 * 串联为完整闭环，并通过反思机制实现自适应修正。
 *
 * @param {string} userText - 用户输入文本
 * @param {Object} session - 会话上下文
 * @param {Object} options - 可选配置
 * @param {boolean} options.enableClosedLoop - 启用闭环 (默认 true)
 * @param {boolean} options.enableReflection - 启用反思 (默认 true)
 * @param {boolean} options.enableCoT - 启用思维链 (默认 true)
 * @param {boolean} options.enableMemory - 启用情景记忆 (默认 true)
 * @returns {Object} 闭环执行结果
 */
export function executeAgentClosedLoop(userText, session = {}, options = {}) {
  const {
    enableClosedLoop = true,
    enableReflection = true,
    enableCoT = true,
    enableMemory = true,
    enableSelfPolish = true,
    enableDebate = true,
    enableAlignment = true,
  } = options

  const closedLoopTrace = []
  const timestamp = () => new Date().toISOString()

  // ══════════ Phase 0: Self-Polish 输入精炼 (§7.1.1) ══════════
  let polishedInput = null
  if (enableSelfPolish) {
    polishedInput = selfPolishInput(userText, session)
    closedLoopTrace.push({
      phase: 'self_polish',
      title: '输入精炼 (Self-Polish)',
      timestamp: timestamp(),
      summary: `清晰度: ${polishedInput.clarity_score} | 精炼项: [${polishedInput.refinements_applied.join(', ')}] | 隐含意图: ${polishedInput.refined_signals.filter(s => s.channel === 'implicit_intent').length > 0 ? '已提取' : '无'}`,
    })
  }

  // ══════════ Phase 1: 感知 (Perception) ══════════
  const perception = perceiveEnvironment(userText, session)
  closedLoopTrace.push({
    phase: 'perception',
    title: '环境感知',
    timestamp: timestamp(),
    summary: `紧急度: ${perception.urgency_tier} | 情绪: ${perception.emotion.grade} (${perception.emotion.intensity}) | 意图: ${perception.intent.top_intent.intent} (${Math.round(perception.intent.confidence * 100)}%)`,
  })

  // ══════════ Phase 2: 记忆加载 (Memory) ══════════
  let episodicMemory = null
  let workingMemory = null
  if (enableMemory) {
    episodicMemory = session._episodicMemory || new EpisodicMemory(session.sessionId)
    closedLoopTrace.push({
      phase: 'memory',
      title: '记忆加载',
      timestamp: timestamp(),
      summary: `情景记忆: ${episodicMemory.episodes.length} 回合 | 决策链: ${episodicMemory.decisionChain.length} 步`,
    })

    // Phase 2.5: 工作记忆缓冲区 — 注意力优先排序 (§7.2.1 + §7.5 KV Cache)
    workingMemory = buildWorkingMemory(episodicMemory, perception)
    if (workingMemory.buffer.length > 0) {
      closedLoopTrace.push({
        phase: 'working_memory',
        title: '工作记忆构建',
        timestamp: timestamp(),
        summary: workingMemory.context_summary,
      })
    }
  }

  // ══════════ Phase 3: 决策 (Decision) ══════════
  const decision = enableCoT
    ? makeDecision(perception, episodicMemory)
    : { strategy: { route: 'standard', priorities: ['generate_reply'] }, chain_of_thought: null }

  closedLoopTrace.push({
    phase: 'decision',
    title: '推理决策',
    timestamp: timestamp(),
    summary: `路由: ${decision.strategy.route} | 优先队列: [${(decision.strategy.priorities || []).join(', ')}] | CoT步骤: ${decision.chain_of_thought?.total_steps || 0}`,
  })

  // ══════════ Phase 3.5: 多视角自我辩论 (§7.3.2 Tit-for-Tat) ══════════
  // 仅在高风险决策时触发辩论 (避免常规场景的额外开销)
  let debateResult = null
  const isHighStakes = perception.risk_signals.body_discomfort
    || perception.risk_signals.high_risk_object
    || perception.emotion.intensity >= 0.7
    || perception.risk_signals.escalation_threat
    || (session.turnIndex || 0) >= 4

  if (enableDebate && isHighStakes) {
    debateResult = runMultiPerspectiveDebate(decision, perception)
    closedLoopTrace.push({
      phase: 'debate',
      title: '多视角辩论 (Tit-for-Tat)',
      timestamp: timestamp(),
      summary: debateResult.debate_summary,
    })

    // 辩论建议修正策略
    if (debateResult.should_revise && debateResult.recommendation) {
      closedLoopTrace.push({
        phase: 'debate_revision',
        title: '辩论修正建议',
        timestamp: timestamp(),
        summary: debateResult.recommendation.reason,
      })
    }
  }

  // ══════════ Phase 4: 执行 (Action) ══════════
  let actionResult = executeAction(decision, perception, userText, session)
  closedLoopTrace.push({
    phase: 'action',
    title: '工具执行',
    timestamp: timestamp(),
    summary: `工具: ${actionResult.tool_selected} | 结果: ${actionResult.feedback.outcome} | 红线违规: ${actionResult.redline_audit?.violation_count || 0}`,
  })

  // ══════════ Phase 5: 反思与修正 (Reflection + Revision) ══════════
  let revisionCount = 0
  let reflectionResult = null

  if (enableClosedLoop && enableReflection) {
    reflectionResult = _reflectOnDecision(decision.strategy, actionResult, episodicMemory?.getSummary())

    while (reflectionResult.should_revise && revisionCount < MAX_REVISIONS) {
      revisionCount++

      closedLoopTrace.push({
        phase: 'reflection',
        title: `反思修正 #${revisionCount}`,
        timestamp: timestamp(),
        summary: `发现 ${reflectionResult.reflections.length} 项问题 | 严重: ${reflectionResult.revision_count} | 修正策略: ${reflectionResult.revised_strategy?.route || 'same'}`,
      })

      // 使用修正后的策略重新执行
      if (reflectionResult.revised_strategy) {
        const revisedDecision = {
          ...decision,
          strategy: reflectionResult.revised_strategy,
        }
        actionResult = executeAction(revisedDecision, perception, userText, session)

        closedLoopTrace.push({
          phase: 're_action',
          title: `修正执行 #${revisionCount}`,
          timestamp: timestamp(),
          summary: `新路由: ${actionResult.route} | 结果: ${actionResult.feedback.outcome}`,
        })
      }

      // 再次反思
      reflectionResult = _reflectOnDecision(
        reflectionResult.revised_strategy || decision.strategy,
        actionResult,
        episodicMemory?.getSummary(),
      )

      if (!reflectionResult.should_revise) break
    }
  }

  // ══════════ Phase 5.5: 3H 对齐 + 幻觉检测 (§6.1/6.2) ══════════
  let alignmentResult = null
  let hallucinationResult = null
  if (enableAlignment) {
    alignmentResult = check3HAlignment(actionResult.reply, perception)
    hallucinationResult = detectHallucinationRisk(actionResult.reply, perception, decision, session)

    closedLoopTrace.push({
      phase: 'alignment',
      title: '3H 对齐 + 幻觉检测',
      timestamp: timestamp(),
      summary: `3H: ${alignmentResult.overall_score} (${alignmentResult.all_passed ? '通过' : `${alignmentResult.violations.length} 项违规`}) | 幻觉: ${hallucinationResult.risk_level} (${hallucinationResult.risk_count} 风险) | 奖励: 正确+${hallucinationResult.reward_signals.correct}/ abstain+${hallucinationResult.reward_signals.abstain}/ 错误${hallucinationResult.reward_signals.incorrect}`,
    })
  }

  // ══════════ Phase 6: 记忆写入 (Memory Update) ══════════
  if (enableMemory && episodicMemory) {
    episodicMemory.recordEpisode({
      perception: {
        emotion: perception.emotion,
        intent: perception.intent,
        urgency: perception.urgency_tier,
      },
      decision: {
        route: decision.strategy.route,
        priorities: decision.strategy.priorities,
        cot_steps: decision.chain_of_thought?.total_steps || 0,
      },
      action: {
        tool_selected: actionResult.tool_selected,
        reply_length: actionResult.reply?.length || 0,
      },
      feedback: actionResult.feedback,
      reflection: reflectionResult,
      debate: debateResult ? { consensus: debateResult.consensus, issues: debateResult.total_issues } : null,
      alignment: alignmentResult ? { score: alignmentResult.overall_score, passed: alignmentResult.all_passed } : null,
      hallucination: hallucinationResult ? { risk: hallucinationResult.risk_level, count: hallucinationResult.risk_count } : null,
      revisions: revisionCount,
    })

    episodicMemory.recordDecision({
      strategy: decision.strategy,
      outcome: actionResult.feedback.outcome,
      revisions: revisionCount,
    })
  }

  // ══════════ Phase 7: ReAct 追踪 + 增强奖励 + GAE + Hacking 检测 ══════════
  const reactTrace = generateReActTrace(perception, decision, actionResult, workingMemory)

  const rewardResult = computeEnhancedReward(actionResult, perception, alignmentResult, hallucinationResult)
  const gaeCredits = computeGAECreditAssignment(closedLoopTrace, rewardResult)
  const hackingResult = detectRewardHacking(actionResult.reply, episodicMemory)

  closedLoopTrace.push({
    phase: 'reward_gae',
    title: '奖励评估 + GAE 信用分配',
    timestamp: timestamp(),
    summary: `总奖励: ${rewardResult.total_reward} (${rewardResult.reward_tier}) | 最优步骤: ${gaeCredits.best_step?.phase || '-'} | Hacking: ${hackingResult.hacking_risk}`,
  })

  // ══════════ 输出汇总 ══════════
  return {
    // 核心输出 (向后兼容)
    reply: actionResult.reply,
    route: actionResult.route,
    redline_audit: actionResult.redline_audit,

    // AIQC_V2 完整结果 (向后兼容)
    ...actionResult.aiqc_result,

    // 闭环理论框架输出 (V2 深度增强版)
    agent_framework: {
      // Self-Polish 输入精炼
      self_polish: polishedInput ? {
        clarity_score: polishedInput.clarity_score,
        refinements: polishedInput.refinements_applied,
        implicit_intents: polishedInput.refined_signals.filter(s => s.channel === 'implicit_intent'),
        entities: polishedInput.refined_signals.find(s => s.channel === 'entity_extraction')?.entities || {},
      } : null,

      // 感知层
      perception: {
        urgency_tier: perception.urgency_tier,
        emotion_grade: perception.emotion.grade,
        emotion_intensity: perception.emotion.intensity,
        top_intent: perception.intent.top_intent,
        intent_confidence: perception.intent.confidence,
        intent_ambiguous: perception.intent.ambiguous,
        info_sufficiency: perception.info_completeness.sufficiency,
        risk_score: perception.risk_score,
      },

      // 记忆模块 (含工作记忆)
      memory: episodicMemory ? {
        session_turns: episodicMemory.episodes.length,
        decision_chain_length: episodicMemory.decisionChain.length,
        memory_summary: episodicMemory.getSummary(),
        working_memory: workingMemory ? {
          buffer_size: workingMemory.buffer.length,
          cache_hits: workingMemory.cache_hits,
          dominant_pattern: workingMemory.dominant_pattern,
          emotion_trajectory: workingMemory.emotion_trajectory,
        } : null,
      } : null,

      // 决策层 (含辩论)
      decision: {
        strategy_route: decision.strategy.route,
        strategy_priorities: decision.strategy.priorities,
        cot_trace: decision.chain_of_thought?.reasoning_trace || null,
        cot_steps: decision.chain_of_thought?.total_steps || 0,
        task_decomposition: decision.task_decomposition?.critical_path || null,
        // 多视角辩论结果
        debate: debateResult ? {
          consensus: debateResult.consensus,
          total_issues: debateResult.total_issues,
          contradictions: debateResult.contradictions,
          recommendation: debateResult.recommendation,
          should_revise: debateResult.should_revise,
        } : null,
      },

      // 执行层 (含 3H + 幻觉)
      action: {
        tool_selected: actionResult.tool_selected,
        tool_plan_size: actionResult.tool_plan?.total_tools || 0,
        execution_outcome: actionResult.feedback.outcome,
        // 3H 对齐验证
        alignment: alignmentResult ? {
          overall_score: alignmentResult.overall_score,
          all_passed: alignmentResult.all_passed,
          helpfulness: alignmentResult.dimensions.helpfulness?.score,
          honesty: alignmentResult.dimensions.honesty?.score,
          harmlessness: alignmentResult.dimensions.harmlessness?.score,
          violations: alignmentResult.violations,
          tension: alignmentResult.balance_analysis.tension,
        } : null,
        // 幻觉检测
        hallucination: hallucinationResult ? {
          risk_level: hallucinationResult.risk_level,
          risk_count: hallucinationResult.risk_count,
          risks: hallucinationResult.risks,
          reward_signals: hallucinationResult.reward_signals,
          recommendation: hallucinationResult.recommendation,
        } : null,
      },

      // ReAct 推理-行动交织追踪
      react_trace: reactTrace ? {
        total_steps: reactTrace.total_steps,
        thought_count: reactTrace.thought_count,
        action_count: reactTrace.action_count,
        observation_count: reactTrace.observation_count,
        trace: reactTrace.trace,
      } : null,

      // 增强奖励信号 + GAE 信用分配
      reward: {
        signals: rewardResult.signals,
        total_reward: rewardResult.total_reward,
        normalized_reward: rewardResult.normalized_reward,
        reward_tier: rewardResult.reward_tier,
      },
      gae: gaeCredits ? {
        baseline: gaeCredits.baseline,
        best_step: gaeCredits.best_step,
        worst_step: gaeCredits.worst_step,
        credits: gaeCredits.credits,
      } : null,

      // Reward Hacking 检测
      hacking_defense: hackingResult ? {
        hacking_risk: hackingResult.hacking_risk,
        is_hacking: hackingResult.is_hacking,
        indicators: hackingResult.indicators,
        kl_penalty_suggestion: hackingResult.kl_penalty_suggestion,
      } : null,

      // 闭环
      closed_loop: {
        enabled: enableClosedLoop,
        revisions: revisionCount,
        max_revisions: MAX_REVISIONS,
        final_confidence: reflectionResult?.confidence || 'high',
        reflection_issues: reflectionResult?.reflections?.length || 0,
        debate_consensus: debateResult?.consensus ?? null,
        debate_triggered: !!debateResult,
      },

      // 闭环追踪
      trace: closedLoopTrace,
    },

    // 情景记忆引用 (供下一轮使用)
    _episodicMemory: episodicMemory,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 30 — Agent 闭环入口 (Backward-Compatible Entry)
// ───────────────────────────────────────────────────────────────────────────
// 在现有 processMessage 基础上提供闭环增强版本
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 闭环增强的消息处理入口
 * 兼容 processMessage 接口，内部使用 "感知→决策→执行→反思" 闭环
 *
 * @param {string} userText — 用户输入文本
 * @param {Object} session  — 会话上下文
 * @param {Object} options  — 闭环配置 (可选)
 * @returns {Object} 完整处理结果
 */
export function processMessageWithAgent(userText, session = {}, options = {}) {
  return executeAgentClosedLoop(userText, session, options)
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 31 — Agent 理论框架元数据导出
// ───────────────────────────────────────────────────────────────────────────

/** Agent 理论框架版本与能力描述 */
export const AGENT_FRAMEWORK = Object.freeze({
  name: '阿喜食安 Agent — 感知-决策-执行闭环架构 (深度理论增强版)',
  version: '2.0',
  theory_basis: '具身大模型理论 (空间智能范式) + RLHF + 多智能体辩论 + ReAct',
  reference: '高亚斌《具身大模型理论》课件 §1.1, §6.1-6.5, §7.1-7.5',

  architecture: {
    perception: {
      name: '感知层 (Perception Layer)',
      theory: '多通道信号融合 → 环境状态表征 + Self-Polish 输入精炼',
      reference: '课件 §1.1 "感知环境" + §7.1.1 "Self-Polish: 优化问题质量"',
      capabilities: ['情绪强度量化', '意图概率分布', '信息完整度评估', '风险信号扫描', '会话动态追踪', '输入精炼优化'],
    },
    memory: {
      name: '记忆模块 (Memory Module)',
      theory: '外置记忆系统 (短期/情景/身份/工作记忆) + 注意力优先排序',
      reference: '课件 §7.3.1 "记忆模块" + §7.2.1 "LangChain 记忆: 读取与写入"',
      capabilities: ['情景记忆', '身份记忆', '决策链记忆', '模式检测', '工作记忆缓冲区', '注意力优先排序'],
    },
    decision: {
      name: '决策层 (Decision Layer)',
      theory: 'CoT + ReAct 交织追踪 + Least-to-Most + 多视角自我辩论 + 反思修正',
      reference: '课件 §7.1 "CoT/Auto-CoT/Self-Polish" + §7.3.2 "Tit-for-Tat 辩论" + §6.3.2 "GAE"',
      capabilities: ['思维链推理', 'ReAct 推理-行动交织', '任务分解', '多视角辩论', 'GAE 信用分配', '反思修正', '历史经验参照'],
    },
    action: {
      name: '执行层 (Action Layer)',
      theory: '工具注册表 + 策略驱动选择 + 3H 对齐守卫 + 幻觉检测',
      reference: '课件 §7.3.1 "工具调用模块" + §6.1 "3H: Helpfulness/Honesty/Harmlessness"',
      capabilities: ['工具注册与发现', '策略驱动选择', '3H 对齐验证', '幻觉风险检测', '反馈信号生成'],
    },
    closed_loop: {
      name: '闭环引擎 (Closed-Loop Engine)',
      theory: '感知→决策→行动→再感知 + 非对称奖励信号 + 奖励黑客防御',
      reference: '课件 §1.1 "闭环" + §6.1 "RL 奖励设计" + §6.5 "Reward Hacking 防御"',
      capabilities: ['多轮迭代修正', '非对称奖励评估', '奖励黑客检测', '策略自适应', '闭环审计日志'],
    },
  },

  integration: {
    aiqc_v2_role: '执行层核心工具 — 6节点质检管线作为执行层的主要执行手段',
    backward_compat: 'processMessage 保持旧接口不变; processMessageWithAgent 提供闭环增强',
    data_flow: 'Self-Polish(输入精炼) → 感知层(多通道) → 工作记忆 → ReAct推理 → 辩论(高风险) → 执行(3H守卫) → 奖励评估 → 反思修正 → 记忆写入',
  },

  theory_enhancements_v2: [
    'ReAct 推理-行动交织追踪 (§7.2.1)',
    '多视角自我辩论 Tit-for-Tat (§7.3.2)',
    '非对称奖励信号 correct+10/abstain+3/incorrect-20 (§6.1)',
    '3H 对齐框架 Helpfulness/Honesty/Harmlessness (§6.1/6.2)',
    '幻觉检测与预防 3-class (§6.1)',
    'Self-Polish 输入优化 (§7.1.1)',
    'Reward Hacking 防御 (§6.5)',
    'GAE 广义优势估计信用分配 (§6.3.2)',
  ],
})

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 32 — Self-Polish 输入精炼 + 工作记忆缓冲区
// ───────────────────────────────────────────────────────────────────────────
// 理论基础:
//
//   Self-Polish (课件 §7.1.1):
//     "从问题角度考虑优化思维链提示，通过将复杂的、模糊的、低质量的
//      问题优化为模型更易理解的、高质量的问题，进一步提升性能。"
//     → 在 Agent 中: 对用户输入进行预处理精炼，提取关键信号并规范化
//
//   LangChain 记忆模块 (课件 §7.2.1):
//     "记忆系统需要支持两个基本操作：读取和写入。在接收到初始用户输入，
//      但执行核心逻辑之前，链将从记忆系统中读取内容并增强用户输入。"
//     → 工作记忆缓冲区: 从历史记忆中提取相关上下文，增强当前输入
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Self-Polish 输入精炼 — 优化模糊/低质量输入为结构化高质量表征
 * 对应课件 §7.1.1 "Self-Polish: 将复杂模糊问题优化为高质量问题"
 *
 * @param {string} userText - 原始用户输入
 * @param {Object} session - 会话上下文
 * @returns {Object} 精炼后的结构化输入表征
 */
export function selfPolishInput(userText, session = {}) {
  const polished = {
    original: userText,
    refined_signals: [],
    clarity_score: 0,
    refinements_applied: [],
  }

  // 精炼1: 隐含意图提取 — "言外之意" (课件 §7.3.1 "理解对方的言外之意")
  const implicitIntents = []
  if (/怎么.*还|为什么.*没|到底.*什么时候/.test(userText)) {
    implicitIntents.push({ type: 'impatience', hidden_intent: '催促/不满，需要优先响应情绪' })
  }
  if (/上次.*也|每次.*都|总是/.test(userText)) {
    implicitIntents.push({ type: 'recurring_issue', hidden_intent: '重复问题，说明之前解决方案无效' })
  }
  if (/你们.*是不是|难道.*不|凭什么/.test(userText)) {
    implicitIntents.push({ type: 'distrust', hidden_intent: '信任危机，需要先建立信任再处理' })
  }
  if (implicitIntents.length > 0) {
    polished.refined_signals.push({ channel: 'implicit_intent', data: implicitIntents })
    polished.refinements_applied.push('implicit_intent_extraction')
  }

  // 精炼2: 情绪-语义分离 — 分离纯情绪表达与实质诉求
  const pureEmotionFragments = []
  const substantiveFragments = []
  const sentences = userText.split(/[。！？\n]/).filter(s => s.trim())
  for (const s of sentences) {
    const trimmed = s.trim()
    if (!trimmed) continue
    const isEmotionOnly = /^(太|真|好|好|气|烦|恶心|无语|过分|垃圾|坑|骗|坑人).{0,6}[！!]*$/.test(trimmed)
      || /^(什么鬼|搞什么|什么意思|有没有搞错)/.test(trimmed)
    if (isEmotionOnly) {
      pureEmotionFragments.push(trimmed)
    } else {
      substantiveFragments.push(trimmed)
    }
  }
  if (pureEmotionFragments.length > 0) {
    polished.refined_signals.push({
      channel: 'emotion_semantic_separation',
      emotion_fragments: pureEmotionFragments,
      substantive_fragments: substantiveFragments,
    })
    polished.refinements_applied.push('emotion_semantic_separation')
  }

  // 精炼3: 时间序列信号提取 — 事件时间线重建
  const timeMarkers = []
  if (/昨天|前天|上周|之前|刚才|今天/.test(userText)) {
    const match = userText.match(/(昨天|前天|上周|之前|刚才|今天)[^，。！？]*[，。！？]?/g)
    if (match) timeMarkers.push(...match.map(m => m.trim()))
  }
  if (timeMarkers.length > 0) {
    polished.refined_signals.push({ channel: 'temporal_signals', markers: timeMarkers })
    polished.refinements_applied.push('temporal_extraction')
  }

  // 精炼4: 实体抽取 — 结构化关键业务实体
  const entities = {}
  const orderMatch = userText.match(/订单[号码]?[\s:：]?(\d+)/)
  if (orderMatch) entities.order_id = orderMatch[1]
  const phoneMatch = userText.match(/1[3-9]\d{9}/)
  if (phoneMatch) entities.phone = phoneMatch[0]
  const storeMatch = userText.match(/([\u4e00-\u9fa5]{2,8}(店|门店|分店|支行))/)
  if (storeMatch) entities.store = storeMatch[1]
  const productMatch = userText.match(/([\u4e00-\u9fa5]{2,6}(茶|杯|奶|果|冰|酪|汁|冻|圆))/)
  if (productMatch) entities.product = productMatch[1]
  if (Object.keys(entities).length > 0) {
    polished.refined_signals.push({ channel: 'entity_extraction', entities })
    polished.refinements_applied.push('entity_extraction')
  }

  // 精炼5: 诉求明确度评分
  const hasExplicitDemand = /要求|希望|想要|能不能|请|帮我|退|赔|换/.test(userText)
  const hasSpecificProblem = substantiveFragments.length >= 1 || /有|发现|看到|吃了|喝了/.test(userText)
  polished.clarity_score = Math.round(
    ((hasExplicitDemand ? 0.4 : 0) + (hasSpecificProblem ? 0.3 : 0) +
     (Object.keys(entities).length > 0 ? 0.2 : 0) +
     (timeMarkers.length > 0 ? 0.1 : 0)) * 100
  ) / 100

  if (polished.clarity_score < 0.3) {
    polished.refinements_applied.push('low_clarity_flag')
  }

  polished.refined_at = new Date().toISOString()
  return polished
}

/**
 * 工作记忆缓冲区 — 基于注意力优先排序的上下文增强
 * 对应课件 §7.2.1 "LangChain 记忆: 在核心逻辑执行之前从记忆读取内容增强输入"
 *
 * 设计原则:
 *   - 注意力权重: 最近事件 > 情绪变化事件 > 异常事件 > 常规事件
 *   - 对应课件 §7.5 "KV Cache: 保存关键计算结果避免重新计算"
 *
 * @param {EpisodicMemory} episodicMemory - 情景记忆实例
 * @param {Object} perception - 当前感知状态
 * @returns {Object} 工作记忆上下文
 */
export function buildWorkingMemory(episodicMemory, perception) {
  if (!episodicMemory || episodicMemory.episodes.length === 0) {
    return { buffer: [], attention_weights: [], context_summary: '无历史记忆', cache_hits: 0 }
  }

  const episodes = episodicMemory.episodes
  const buffer = []
  const attentionWeights = []

  // 注意力权重计算 — 越近权重越高 (指数衰减, 类似课件 §6.3.2 折扣因子 γ)
  const GAMMA = 0.85 // 折扣因子
  const totalEpisodes = episodes.length

  for (let i = 0; i < totalEpisodes; i++) {
    const ep = episodes[i]
    const recency = i / totalEpisodes // 0=最旧, 1=最新
    const baseWeight = Math.pow(GAMMA, totalEpisodes - i - 1)

    // 情绪变化事件获得额外注意力
    const emotionShift = i > 0 && episodes[i - 1]?.perception?.emotion?.grade !== ep.perception?.emotion?.grade
    const emotionBonus = emotionShift ? 0.2 : 0

    // 异常事件 (修正/红线违规) 获得更高注意力
    const anomalyBonus = (ep.feedback?.outcome === 'needs_revision' || ep.revisions > 0) ? 0.15 : 0

    const finalWeight = Math.min(baseWeight + emotionBonus + anomalyBonus, 1)

    attentionWeights.push({
      turn: ep.turn,
      weight: Math.round(finalWeight * 1000) / 1000,
      reason: emotionShift ? 'emotion_shift' : anomalyBonus > 0 ? 'anomaly' : 'recency',
    })

    buffer.push({
      turn: ep.turn,
      intent: ep.perception?.intent?.top_intent?.intent,
      emotion: ep.perception?.emotion?.grade,
      route: ep.decision?.route,
      outcome: ep.feedback?.outcome,
      attention_weight: finalWeight,
    })
  }

  // 排序: 按注意力权重降序
  buffer.sort((a, b) => b.attention_weight - a.attention_weight)

  // 缓存命中检测 — 当前输入是否在历史中有类似模式
  const currentIntent = perception?.intent?.top_intent?.intent
  const currentEmotion = perception?.emotion?.grade
  const cacheHits = buffer.filter(b =>
    b.intent === currentIntent && b.emotion === currentEmotion
  ).length

  return {
    buffer: buffer.slice(0, 5), // 最多保留5条高注意力记忆
    attention_weights: attentionWeights,
    context_summary: `工作记忆: ${totalEpisodes} 回合, 高注意力 ${buffer.filter(b => b.attention_weight >= 0.7).length} 条, 缓存命中 ${cacheHits}`,
    cache_hits: cacheHits,
    dominant_pattern: buffer[0]?.route || 'none',
    emotion_trajectory: episodes.map(ep => ep.perception?.emotion?.grade).filter(Boolean),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 33 — ReAct 推理-行动交织追踪
// ───────────────────────────────────────────────────────────────────────────
// 理论基础: ReAct Agent (课件 §7.2.1 LangChain 智能体)
//
//   "智能体的核心思想是使用大语言模型来选择要执行的一系列动作。
//    在智能体中，需要将大语言模型用作推理引擎，以确定要采取哪些
//    动作，以及以何种顺序采取这些动作。"
//
//   ReAct (Reasoning + Acting) 模式:
//     Thought  — 推理: 当前状态分析, 应该做什么
//     Action   — 行动: 选择并执行工具
//     Observation — 观察: 行动结果, 新信息
//     反复交织直至得出 Final Answer
//
//   区别于纯 CoT: CoT 是"先推理后执行"的串行模式,
//   ReAct 是"推理-行动-观察"的交织模式, 每步行动都
//   有对应的推理依据和观察反馈。
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 生成 ReAct 推理-行动交织追踪
 * 将 CoT 推理链 + 工具执行 + 观察结果交织为完整追踪链
 *
 * @param {Object} perception - 感知层输出
 * @param {Object} decision - 决策层输出
 * @param {Object} actionResult - 执行层输出
 * @param {Object} workingMemory - 工作记忆
 * @returns {Object} ReAct 追踪链
 */
export function generateReActTrace(perception, decision, actionResult, workingMemory = null) {
  const trace = []
  let step = 0

  // ─── Thought 1: 初始感知推理 ───
  trace.push({
    step: ++step,
    type: 'thought',
    content: `感知环境: 紧急度=${perception.urgency_tier}, 情绪=${perception.emotion.grade}(${perception.emotion.intensity}), 主意图=${perception.intent.top_intent.intent}(${Math.round(perception.intent.confidence * 100)}%), 风险=${perception.risk_score}/5`,
    basis: 'perception_layer',
  })

  // ─── Observation 1: 工作记忆上下文 ───
  if (workingMemory && workingMemory.buffer.length > 0) {
    trace.push({
      step: ++step,
      type: 'observation',
      content: `工作记忆: ${workingMemory.context_summary}, 主导模式=${workingMemory.dominant_pattern}, 缓存命中=${workingMemory.cache_hits}`,
      basis: 'working_memory',
    })
  }

  // ─── Thought 2: CoT 推理决策 ───
  if (decision.chain_of_thought) {
    for (const cotStep of decision.chain_of_thought.chain) {
      trace.push({
        step: ++step,
        type: 'thought',
        content: `[${cotStep.phase}] ${cotStep.reasoning}`,
        basis: `cot_step_${cotStep.step}`,
        output: cotStep.output,
      })
    }
  }

  // ─── Thought 3: 任务分解策略 ───
  if (decision.task_decomposition) {
    trace.push({
      step: ++step,
      type: 'thought',
      content: `任务分解: ${decision.task_decomposition.total_subtasks} 子任务, 关键路径: ${decision.task_decomposition.critical_path}`,
      basis: 'least_to_most',
    })
  }

  // ─── Action 1: 工具执行 ───
  if (actionResult.tool_plan) {
    for (const item of actionResult.tool_plan.plan) {
      trace.push({
        step: ++step,
        type: 'action',
        content: `调用工具: ${item.tool_id} (${item.tool?.name || ''})`,
        reason: item.reason,
        order: item.order,
      })
    }
  }

  // ─── Observation 2: 执行结果 ───
  trace.push({
    step: ++step,
    type: 'observation',
    content: `执行结果: 路由=${actionResult.route}, 结果=${actionResult.feedback.outcome}, 红线违规=${actionResult.redline_audit?.violation_count || 0}`,
    basis: 'action_result',
    data: {
      route: actionResult.route,
      outcome: actionResult.feedback.outcome,
      quality: actionResult.feedback.quality_score,
      violations: actionResult.redline_audit?.violations || [],
    },
  })

  // ─── Thought 4: 结果评估与修正 ───
  if (actionResult.feedback.outcome === 'needs_revision') {
    trace.push({
      step: ++step,
      type: 'thought',
      content: `结果不理想，需要修正: ${actionResult.redline_audit?.violation_count || 0} 条红线违规`,
      basis: 'revision_needed',
    })
  }

  // ─── Final Answer ───
  trace.push({
    step: ++step,
    type: 'final_answer',
    content: `最终响应: 路由=${actionResult.route}, 质量=${actionResult.feedback.quality_score}, 回复长度=${actionResult.reply?.length || 0}字`,
    basis: 'conclusion',
  })

  return {
    trace,
    total_steps: trace.length,
    thought_count: trace.filter(t => t.type === 'thought').length,
    action_count: trace.filter(t => t.type === 'action').length,
    observation_count: trace.filter(t => t.type === 'observation').length,
    trace_summary: trace
      .map(t => `${t.type === 'thought' ? '[T]' : t.type === 'action' ? '[A]' : t.type === 'observation' ? '[O]' : '[R]'} [${t.step}] ${t.type}`)
      .join(' → '),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 34 — 多视角自我辩论 (Multi-Perspective Self-Debate)
// ───────────────────────────────────────────────────────────────────────────
// 理论基础: 多智能体辩论 (课件 §7.3.2)
//
//   "当多个智能体以'针锋相对(Tit-for-Tat)'的状态表达自己的观点时，
//    单个智能体可以从其他智能体处获得充分的外部反馈，以此纠正自己
//    的扭曲思维；当检测到自己的观点与其他智能体的观点出现矛盾时，
//    智能体会仔细检查每个步骤的推理和假设，进一步改进自己的解决方案。"
//
//   "多个智能体面对同一个问题时可能会产生不同的观点，每个智能体通过
//    彼此之间的反馈与自身知识的结合，不断更新自己的答案，能够有效
//    减少幻觉或虚假信息的产生。" (课件 §7.3.2 质量优势)
//
//   实现方式: 单一 Agent 模拟 3 个不同视角的辩论者:
//     - 客服视角 (Empathy Agent) — 关注顾客满意度与情绪安抚
//     - 合规视角 (Compliance Agent) — 关注规则遵守与权限边界
//     - 效率视角 (Efficiency Agent) — 关注问题快速解决与资源最优
// ═══════════════════════════════════════════════════════════════════════════

/** 辩论视角定义 */
const DEBATE_PERSPECTIVES = Object.freeze([
  {
    id: 'empathy',
    name: '客服共情视角',
    priority: '顾客满意度与情绪安抚',
    bias: '倾向于提供更高补偿方案以安抚情绪',
    check: (decision, perception) => {
      const issues = []
      if (perception.emotion.intensity >= 0.5 && decision.strategy.route === 'standard') {
        issues.push('高情绪强度但采用标准路径，安抚可能不足')
      }
      if (decision.strategy.priorities?.[0] !== 'empathy_first' && perception.emotion.intensity >= 0.3) {
        issues.push('情绪信号存在但安抚未置于首位优先级')
      }
      if (perception.intent.ambiguous) {
        issues.push('意图模糊时直接决策可能导致答非所问，建议先确认')
      }
      return issues
    },
  },
  {
    id: 'compliance',
    name: '合规风控视角',
    priority: '规则遵守与权限边界',
    bias: '倾向于保守方案，防止越权承诺',
    check: (decision, perception) => {
      const issues = []
      if (decision.strategy.route === 'emotion_first' && !perception.risk_signals.escalation_threat) {
        issues.push('无升级威胁即走紧急路径，可能导致过度承诺')
      }
      if (decision.strategy.needs_escalation && !perception.risk_signals.body_discomfort && !perception.risk_signals.escalation_threat) {
        issues.push('无明确风险信号却标记升级，可能越权')
      }
      if (decision.strategy.route === 'high_risk' && perception.risk_score < 2) {
        issues.push('风险评分偏低却走高风险路径，可能误判')
      }
      return issues
    },
  },
  {
    id: 'efficiency',
    name: '效率优化视角',
    priority: '问题快速解决与资源最优',
    bias: '倾向于最少步骤解决问题',
    check: (decision, perception) => {
      const issues = []
      const subtaskCount = decision.task_decomposition?.total_subtasks || 0
      if (subtaskCount >= 4 && perception.urgency_tier === 'normal') {
        issues.push('常规紧急度却分解为4+子任务，处理链路过长')
      }
      if (perception.info_completeness.sufficiency === 'sufficient' && decision.strategy.route === 'info_collection') {
        issues.push('信息已充分但仍在收集路径，浪费一轮对话')
      }
      if (decision.strategy.route === 'standard' && perception._raw_classification?.is_food_safety) {
        issues.push('食安问题走标准路径可能遗漏分类细节')
      }
      return issues
    },
  },
])

/**
 * 多视角自我辩论 — Tit-for-Tat 交叉验证
 * 对应课件 §7.3.2 "针锋相对辩论减少幻觉"
 *
 * 触发条件: 高风险决策 (身体不适/高危异物/情绪激烈/多轮僵局)
 *
 * @param {Object} decision - 决策层输出
 * @param {Object} perception - 感知层输出
 * @returns {Object} 辩论结果 + 共识/分歧分析
 */
export function runMultiPerspectiveDebate(decision, perception) {
  const debateRounds = []
  const allIssues = []
  let consensus = true

  // 每个视角独立审视决策
  for (const perspective of DEBATE_PERSPECTIVES) {
    const issues = perspective.check(decision, perception)
    debateRounds.push({
      perspective_id: perspective.id,
      perspective_name: perspective.name,
      priority: perspective.priority,
      bias: perspective.bias,
      issues_found: issues,
      approval: issues.length === 0,
    })
    allIssues.push(...issues.map(i => ({ perspective: perspective.id, issue: i })))
  }

  // Tit-for-Tat 交叉验证 — 检查视角间矛盾
  const contradictions = []
  const approvals = debateRounds.filter(r => r.approval).length
  const rejections = debateRounds.filter(r => !r.approval).length

  if (approvals >= 1 && rejections >= 1) {
    consensus = false
    const approvers = debateRounds.filter(r => r.approval).map(r => r.perspective_name)
    const rejectors = debateRounds.filter(r => !r.approval).map(r => r.perspective_name)
    contradictions.push({
      type: 'approval_disagreement',
      approvers,
      rejectors,
      resolution: '保守决策优先 — 存在分歧时采用更审慎的方案',
    })
  }

  // 生成辩论共识建议
  let recommendation = null
  if (!consensus && allIssues.length > 0) {
    // 综合各视角建议
    const criticalIssues = allIssues.filter(i =>
      i.issue.includes('过度承诺') || i.issue.includes('越权') || i.issue.includes('安抚可能不足')
    )
    if (criticalIssues.length > 0) {
      recommendation = {
        action: 'revise_strategy',
        reason: `辩论发现 ${criticalIssues.length} 个关键分歧: ${criticalIssues.map(i => i.issue).join('; ')}`,
        suggestion: '在安抚与合规之间寻找平衡点，确保既不越权也不冷落顾客',
      }
    }
  }

  return {
    debate_rounds: debateRounds,
    total_issues: allIssues.length,
    consensus,
    contradictions,
    recommendation,
    debate_summary: consensus
      ? `三视角一致通过 (${approvals}/3 赞成)`
      : `辩论存在分歧: ${approvals} 赞成 vs ${rejections} 反对, ${allIssues.length} 个待解决问题`,
    should_revise: !consensus && allIssues.length >= 2,
    debated_at: new Date().toISOString(),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 35 — 3H 对齐守卫 + 幻觉检测与预防
// ─────────────────════──────────────────────────────────────────────────
// 理论基础:
//
//   3H 对齐框架 (课件 §6.1/6.2):
//     "大语言模型应该满足的3H原则: Helpfulness (有用性)、Honesty (诚实性)、
//      Harmlessness (无害性)。有用性意味着模型应当遵循指令；无害性意味着
//      模型不应生成有害输出。有用性和无害性往往是对立的。"
//
//   幻觉预防 (课件 §6.1):
//     奖励设计: correct=+10, abstain=+3, incorrect=-20
//     "宁可坦诚不知道(+3)，也不要胡编乱造(-20)"
//     三类幻觉: 事实性幻觉 / 逻辑性幻觉 / 忠实性幻觉
// ═══════════════════════════════════════════════════════════════════════════

/** 3H 对齐评估维度 */
const ALIGNMENT_DIMENSIONS = Object.freeze({
  helpfulness: {
    name: 'Helpfulness (有用性)',
    description: '回复是否有效解决顾客问题',
    checks: [
      {
        id: 'addresses_concern',
        test: (reply, perception) => {
          const topIntent = perception.intent.top_intent.intent
          const replyLower = (reply || '').toLowerCase()
          // 回复是否包含与主意图相关的关键词
          const intentKeywords = {
            food_safety_foreign_object: ['异物', '分类', '方案', '处理', '照片'],
            food_safety_body_discomfort: ['身体', '就医', '健康', '跟进', '联系'],
            order_issue: ['订单', '配送', '退款', '催单', '处理'],
            general_complaint: ['反馈', '改进', '抱歉', '解决', '处理'],
            consultation: ['介绍', '说明', '了解', '可以', '提供'],
          }
          const kws = intentKeywords[topIntent] || ['处理', '帮助', '解决']
          const hitCount = kws.filter(kw => replyLower.includes(kw)).length
          return hitCount >= 1
        },
      },
      {
        id: 'provides_next_step',
        test: (reply) => {
          return /请|建议|可以|帮您|为您|我们|接下来|然后|步骤/.test(reply || '')
        },
      },
    ],
  },
  honesty: {
    name: 'Honesty (诚实性)',
    description: '回复是否诚实，不做不切实际的承诺',
    checks: [
      {
        id: 'no_over_promise',
        test: (reply) => {
          const overPromises = ['一定退', '保证退', '马上退', '立刻退款', '全额赔', '双倍赔', '十倍赔', '马上到', '10分钟']
          return !overPromises.some(p => (reply || '').includes(p))
        },
      },
      {
        id: 'no_authority_exceed',
        test: (reply) => {
          const authorityExceeds = ['直接给您退', '我帮您退款', '给您免单', '赔偿您', '补偿您']
          return !authorityExceeds.some(p => (reply || '').includes(p))
        },
      },
      {
        id: 'acknowledges_uncertainty',
        test: (reply, perception) => {
          // 信息不完整时应表达不确定性
          if (perception.info_completeness.sufficiency === 'insufficient') {
            return /需要|确认|了解|核实|查看/.test(reply || '')
          }
          return true
        },
      },
    ],
  },
  harmlessness: {
    name: 'Harmlessness (无害性)',
    description: '回复是否无害，不激化矛盾',
    checks: [
      {
        id: 'no_blame_customer',
        test: (reply) => {
          const blamePhrases = ['您的错', '您自己', '怪您', '您没', '您不配合', '您不提供']
          return !blamePhrases.some(p => (reply || '').includes(p))
        },
      },
      {
        id: 'no_dismissal',
        test: (reply) => {
          const dismissals = ['没有这回事', '不可能', '您多想了', '正常现象', '没问题']
          return !dismissals.some(p => (reply || '').includes(p))
        },
      },
      {
        id: 'no_pii_leak',
        test: (reply) => {
          // 不泄露其他客户/员工个人信息
          const piiPatterns = [/\d{11}/, /身份证/, /家庭住址/]
          return !piiPatterns.some(p => p.test(reply || ''))
        },
      },
    ],
  },
})

/**
 * 3H 对齐验证 — Helpfulness / Honesty / Harmlessness 三维检查
 * 对应课件 §6.1/6.2 "3H 原则: 有用性与无害性往往是对立的"
 *
 * @param {string} reply - 生成的回复
 * @param {Object} perception - 感知状态
 * @returns {Object} 3H 对齐评估结果
 */
export function check3HAlignment(reply, perception) {
  const results = {}
  let totalScore = 0
  let totalChecks = 0
  const violations = []

  for (const [dimension, config] of Object.entries(ALIGNMENT_DIMENSIONS)) {
    let dimScore = 0
    const dimChecks = config.checks.length

    for (const check of config.checks) {
      const passed = check.test(reply, perception)
      if (passed) dimScore++
      else {
        violations.push({
          dimension: config.name,
          check_id: check.id,
          description: `${config.name} 检查未通过: ${check.id}`,
        })
      }
    }

    results[dimension] = {
      name: config.name,
      score: dimScore / dimChecks,
      passed: dimScore === dimChecks,
      checks_total: dimChecks,
      checks_passed: dimScore,
    }
    totalScore += dimScore
    totalChecks += dimChecks
  }

  return {
    dimensions: results,
    overall_score: Math.round((totalScore / totalChecks) * 100) / 100,
    all_passed: totalScore === totalChecks,
    violations,
    // 3H 平衡分析 (课件 §6.2 "有用性和无害性往往是对立的")
    balance_analysis: {
      helpfulness_score: results.helpfulness?.score || 0,
      harmlessness_score: results.harmlessness?.score || 0,
      tension: Math.abs((results.helpfulness?.score || 0) - (results.harmlessness?.score || 0)) > 0.5,
    },
    checked_at: new Date().toISOString(),
  }
}

/**
 * 幻觉风险检测 — 三类幻觉分类与预防
 * 对应课件 §6.1 "RL 奖励: correct=+10, abstain=+3, incorrect=-20"
 *
 * 三类幻觉:
 *   1. 事实性幻觉 (Factual) — 编造不存在的规则/补偿方案
 *   2. 逻辑性幻觉 (Logical) — 推理链存在逻辑跳跃
 *   3. 忠实性幻觉 (Faithfulness) — 回复与输入信息不一致
 *
 * @param {string} reply - 生成的回复
 * @param {Object} perception - 感知状态
 * @param {Object} decision - 决策状态
 * @param {Object} session - 会话上下文
 * @returns {Object} 幻觉风险评估
 */
export function detectHallucinationRisk(reply, perception, decision, session = {}) {
  const risks = []
  const replyText = reply || ''

  // 类型1: 事实性幻觉 — 编造不存在的补偿金额/方案
  const fabricatedAmount = replyText.match(/(\d{3,})元/)
  if (fabricatedAmount) {
    const amount = parseInt(fabricatedAmount[1])
    // 检查金额是否在合理补偿范围内 (L1-L5: 5-300元)
    if (amount > 500 || (amount < 5 && amount !== 0)) {
      risks.push({
        type: 'factual_hallucination',
        severity: 'high',
        detail: `回复中出现异常金额 ${amount}元，可能超出补偿矩阵范围 (L1-L5: 5-300元)`,
        reward_signal: -20, // incorrect
      })
    }
  }

  // 类型2: 逻辑性幻觉 — 推理跳跃
  if (decision?.strategy?.route === 'standard' && replyText.includes('升级') && replyText.includes('紧急')) {
    risks.push({
      type: 'logical_hallucination',
      severity: 'medium',
      detail: '标准路径决策但回复中包含"升级"和"紧急"字样，推理与行动不一致',
      reward_signal: -10,
    })
  }

  // 类型3: 忠实性幻觉 — 回复提及用户未提供的信息
  const mentionsOrder = /订单号?\s*\d+/.test(replyText)
  const sessionHasOrder = !!(session.orderId)
  if (mentionsOrder && !sessionHasOrder) {
    risks.push({
      type: 'faithfulness_hallucination',
      severity: 'medium',
      detail: '回复中引用了订单号但会话中未提供订单信息',
      reward_signal: -15,
    })
  }

  // 检测"坦诚不知道"的正面信号 (abstain=+3)
  const honestAbstain = /需要进一步确认|目前无法确定|稍后为您核实|帮您查询/.test(replyText)

  // 幻觉风险总分
  const totalRiskScore = risks.reduce((sum, r) => sum + Math.abs(r.reward_signal), 0)
  const normalizedRisk = Math.min(totalRiskScore / 50, 1)

  return {
    risks,
    risk_count: risks.length,
    risk_score: Math.round(normalizedRisk * 100) / 100,
    risk_level: normalizedRisk >= 0.6 ? 'high' : normalizedRisk >= 0.3 ? 'medium' : 'low',
    honest_abstain_detected: honestAbstain,
    // RL 奖励信号 (课件 §6.1)
    reward_signals: {
      correct: risks.length === 0 ? 10 : 0,
      abstain: honestAbstain ? 3 : 0,
      incorrect: risks.reduce((sum, r) => sum + (r.reward_signal < 0 ? r.reward_signal : 0), 0),
    },
    recommendation: risks.length >= 2
      ? '幻觉风险较高，建议回复添加更多确认性语言并移除未经验证的信息'
      : risks.length === 1
      ? '检测到轻微幻觉风险，建议审慎检查相关表述'
      : '未检测到显著幻觉风险',
    detected_at: new Date().toISOString(),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 36 — 增强奖励信号系统 + GAE 信用分配 + Reward Hacking 防御
// ─────────────────════════════════════════════════════════════════════──
// 理论基础:
//
//   RL 奖励设计 (课件 §6.1):
//     "通过强化学习解决幻觉问题: correct=+10, abstain=+3, incorrect=-20
//      宁可坦诚不知道(+3)，也不要胡编乱造(-20)"
//
//   GAE 广义优势估计 (课件 §6.3.2):
//     "Q(s,a)−V(s) 可以理解为采取特定动作a相比于一个随机动作的优势。
//      优势越大，说明采取动作a要比其他可能的动作更好。"
//     → 为闭环中每个决策步骤分配信用分数
//
//   Reward Hacking 防御 (课件 §6.5):
//     "PPO训练中常出现Reward Hacking现象，模型在短时间内迅速提高
//      回复奖励，但其输出可能毫无意义或重复某些内容。"
//     → 检测回复是否陷入重复/无意义模式
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 增强奖励信号系统 — 非对称奖励评估
 * 对应课件 §6.1 "correct=+10, abstain=+3, incorrect=-20"
 *
 * @param {Object} actionResult - 执行结果
 * @param {Object} perception - 感知状态
 * @param {Object} alignmentResult - 3H 对齐结果
 * @param {Object} hallucinationResult - 幻觉检测结果
 * @returns {Object} 综合奖励信号
 */
export function computeEnhancedReward(actionResult, perception, alignmentResult = null, hallucinationResult = null) {
  const signals = {}

  // ─── 基础奖励: 执行结果 ───
  const outcome = actionResult.feedback?.outcome
  signals.execution = outcome === 'success' ? 10 : outcome === 'needs_revision' ? -5 : 0

  // ─── 红线奖励: 通过/违反 ───
  const redlineViolations = actionResult.redline_audit?.violation_count || 0
  signals.redline = redlineViolations === 0 ? 5 : -10 * redlineViolations

  // ─── 情绪适配奖励 ───
  const emotionGrade = perception.emotion.grade
  const route = actionResult.route
  const emotionAligned =
    (emotionGrade === 'furious' && route === 'emotion_first') ||
    (emotionGrade === 'calm' && route === 'standard') ||
    (perception.risk_signals.body_discomfort && route === 'body_discomfort')
  signals.emotion_alignment = emotionAligned ? 5 : -3

  // ─── 3H 对齐奖励 ───
  if (alignmentResult) {
    signals.alignment = alignmentResult.all_passed ? 8 : -5 * (alignmentResult.violations?.length || 1)
  } else {
    signals.alignment = 0
  }

  // ─── 幻觉奖励 (课件 §6.1: 非对称设计) ───
  if (hallucinationResult) {
    signals.hallucination = hallucinationResult.reward_signals?.correct || 0
    signals.hallucination += hallucinationResult.reward_signals?.abstain || 0
    signals.hallucination += hallucinationResult.reward_signals?.incorrect || 0
  } else {
    signals.hallucination = 0
  }

  // ─── 信息效率奖励 (避免不必要的信息收集轮次) ───
  if (perception.info_completeness.sufficiency === 'sufficient' && route !== 'info_collection') {
    signals.info_efficiency = 3
  } else if (perception.info_completeness.sufficiency === 'sufficient' && route === 'info_collection') {
    signals.info_efficiency = -5 // 信息充分却仍在收集
  } else {
    signals.info_efficiency = 0
  }

  // ─── 综合奖励 ───
  const totalReward = Object.values(signals).reduce((sum, v) => sum + v, 0)
  const maxPossible = 10 + 5 + 5 + 8 + 10 + 3 // 41
  const minPossible = 0 + (-10) + (-3) + (-5) + (-20) + (-5) // -43
  const normalizedReward = (totalReward - minPossible) / (maxPossible - minPossible)

  return {
    signals,
    total_reward: totalReward,
    normalized_reward: Math.round(normalizedReward * 100) / 100,
    reward_tier: normalizedReward >= 0.7 ? 'excellent'
      : normalizedReward >= 0.5 ? 'good'
      : normalizedReward >= 0.3 ? 'acceptable'
      : 'poor',
    // 非对称性体现
    asymmetry_note: 'correct=+10, abstain=+3, incorrect=-20: 错误惩罚是正确奖励的2倍',
    computed_at: new Date().toISOString(),
  }
}

/**
 * GAE 信用分配 — 为闭环中每个步骤分配优势值
 * 对应课件 §6.3.2 "广义优势估计: Q(s,a)−V(s) 衡量特定动作的优势"
 *
 * @param {Array} closedLoopTrace - 闭环追踪数组
 * @param {Object} rewardResult - 奖励信号结果
 * @returns {Object} 信用分配结果
 */
export function computeGAECreditAssignment(closedLoopTrace, rewardResult) {
  if (!closedLoopTrace || closedLoopTrace.length === 0) {
    return { credits: [], baseline: 0, advantages: [] }
  }

  const totalSteps = closedLoopTrace.length
  const totalReward = rewardResult.total_reward
  const baseline = totalReward / totalSteps // V(s) 基线

  // 为每个阶段分配信用
  const PHASE_WEIGHTS = {
    perception: 0.15,   // 感知是基础
    memory: 0.10,       // 记忆提供上下文
    decision: 0.30,     // 决策是核心
    action: 0.25,       // 执行产生结果
    reflection: 0.15,   // 反思改进质量
    re_action: 0.05,    // 修正执行
  }

  const credits = closedLoopTrace.map((step, idx) => {
    const phaseWeight = PHASE_WEIGHTS[step.phase] || 0.1
    const stepReward = totalReward * phaseWeight
    const advantage = stepReward - baseline // A(s,a) = Q(s,a) - V(s)

    return {
      step: idx + 1,
      phase: step.phase,
      title: step.title,
      // Q(s,a) — 动作价值
      action_value: Math.round(stepReward * 100) / 100,
      // V(s) — 状态价值 (基线)
      state_value: Math.round(baseline * 100) / 100,
      // A(s,a) — 优势函数
      advantage: Math.round(advantage * 100) / 100,
      // 优势方向
      advantage_direction: advantage > 0 ? 'positive' : advantage < 0 ? 'negative' : 'neutral',
    }
  })

  // 找到最优/最差步骤
  const sorted = [...credits].sort((a, b) => b.advantage - a.advantage)
  const bestStep = sorted[0]
  const worstStep = sorted[sorted.length - 1]

  return {
    credits,
    baseline: Math.round(baseline * 100) / 100,
    total_reward: totalReward,
    best_step: bestStep ? { phase: bestStep.phase, title: bestStep.title, advantage: bestStep.advantage } : null,
    worst_step: worstStep ? { phase: worstStep.phase, title: worstStep.title, advantage: worstStep.advantage } : null,
    // GAE 折扣因子 (课件 §6.3.2)
    gamma: 0.95,
    lambda: 0.95,
    computed_at: new Date().toISOString(),
  }
}

/**
 * Reward Hacking 检测 — 防止输出陷入重复/无意义模式
 * 对应课件 §6.5 "Reward Hacking: 输出可能毫无意义或重复某些内容"
 *
 * @param {string} reply - 生成的回复
 * @param {EpisodicMemory} episodicMemory - 情景记忆
 * @returns {Object} Hacking 检测结果
 */
export function detectRewardHacking(reply, episodicMemory = null) {
  const replyText = reply || ''
  const indicators = []

  // 检测1: 内部重复 — 回复内部出现重复片段
  const sentences = replyText.split(/[。！？\n]/).filter(s => s.trim().length > 3)
  const uniqueSentences = new Set(sentences.map(s => s.trim()))
  const repetitionRatio = sentences.length > 0
    ? 1 - (uniqueSentences.size / sentences.length)
    : 0
  if (repetitionRatio > 0.3 && sentences.length >= 3) {
    indicators.push({
      type: 'internal_repetition',
      severity: repetitionRatio > 0.5 ? 'high' : 'medium',
      detail: `回复内部重复率 ${Math.round(repetitionRatio * 100)}% (${uniqueSentences.size}/${sentences.length} 唯一句)`,
    })
  }

  // 检测2: 跨轮重复 — 与历史回复过于相似
  if (episodicMemory && episodicMemory.episodes.length >= 2) {
    const recentReplies = episodicMemory.episodes.slice(-2)
    for (const ep of recentReplies) {
      if (ep.action?.reply_length && Math.abs(ep.action.reply_length - replyText.length) < 10) {
        indicators.push({
          type: 'cross_turn_repetition',
          severity: 'medium',
          detail: `回复长度与第 ${ep.turn} 轮高度相似 (${ep.action.reply_length} vs ${replyText.length} 字)，可能陷入重复模式`,
        })
      }
    }
  }

  // 检测3: 空洞回复 — 回复很长但实质内容少
  const fillerPatterns = ['非常感谢您的反馈', '我们非常重视', '我们会尽快处理', '请您耐心等待']
  const fillerHits = fillerPatterns.filter(p => replyText.includes(p)).length
  if (fillerHits >= 3) {
    indicators.push({
      type: 'empty_filler',
      severity: 'medium',
      detail: `回复包含 ${fillerHits} 个套话/空话模式，可能缺乏实质解决方案`,
    })
  }

  // 检测4: 过度礼貌 — 过多客套话掩盖了实质内容
  const politePatterns = ['非常抱歉', '深表歉意', '十分抱歉', '万分抱歉', '再次向您道歉']
  const politeHits = politePatterns.filter(p => replyText.includes(p)).length
  if (politeHits >= 3) {
    indicators.push({
      type: 'excessive_politeness',
      severity: 'low',
      detail: `回复包含 ${politeHits} 个道歉表述，可能用客套话替代实质解决方案`,
    })
  }

  const isHacking = indicators.filter(i => i.severity === 'high').length >= 1
    || indicators.filter(i => i.severity === 'medium').length >= 2

  return {
    indicators,
    indicator_count: indicators.length,
    is_hacking: isHacking,
    hacking_risk: isHacking ? 'high' : indicators.length >= 2 ? 'medium' : indicators.length >= 1 ? 'low' : 'none',
    recommendation: isHacking
      ? '检测到 Reward Hacking 模式，建议增加 KL 惩罚力度以确保回复多样性 (课件 §6.5)'
      : indicators.length > 0
      ? '轻微重复信号，建议关注后续轮次是否持续'
      : '未检测到 Reward Hacking 模式',
    // KL 惩罚建议 (课件 §6.5 "增强 KL 惩罚力度确保回复多样性")
    kl_penalty_suggestion: isHacking ? 0.5 : indicators.length >= 2 ? 0.2 : 0,
    detected_at: new Date().toISOString(),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 37 — LLM 集成层 (LLM Integration Layer)
// ───────────────────────────────────────────────────────────────────────────
// 理论基础:
//
//   ICL 语境学习 (课件 §5.1):
//     "大语言模型具有语境学习能力，能够根据输入中的示例推断任务模式。"
//
//   CAMEL 角色扮演 (课件 §7.3.2):
//     "角色扮演能激发内部独特的领域知识，产生比没有指定角色时更好的答案。"
//
//   LangChain 智能体 (课件 §7.2.1):
//     "智能体的核心思想是使用大语言模型来选择要执行的一系列动作。
//      将大语言模型用作推理引擎，以确定要采取哪些动作。"
//
//   本模块将 prompt-builder + icl-retriever + llm-client 三者整合，
//   提供 LLM 增强的回复生成能力。当 API 未配置时，自动降级到模板回复。
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 12 — LLM Function Calling Loop (ReAct 架构)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 执行 LLM Function Calling 循环 (ReAct 架构)
 * LLM 生成工具调用 → 执行工具 → 结果回传 → LLM 生成最终回复
 *
 * @param {Object} llmClient - LLM 客户端模块
 * @param {Object} mcpIntegration - MCP 集成模块
 * @param {Array} messages - 初始消息列表
 * @param {Array} tools - OpenAI function calling 格式的工具定义
 * @param {Object} llmOptions - LLM 调用选项
 * @param {Array} conversationHistory - 对话历史（用于结果回传）
 * @param {string} userText - 用户原始输入
 * @returns {Promise<Object>} { reply, source, usage, tool_calls_made }
 */
async function _executeToolCallingLoop(llmClient, mcpIntegration, messages, tools, llmOptions, conversationHistory, userText) {
  const MAX_TOOL_ROUNDS = 5
  const allToolCalls = []

  // 本地工具名称集合 — 这些工具不经过 MCP，在客户端直接执行
  const LOCAL_TOOL_NAMES = new Set(['web_search', 'recall_memory', 'add_memory', 'analyze_image'])
  let _webSearch, _memosClient, _visionService, _skillsRegistry

  async function _executeLocalTool(toolName, toolArgs) {
    // 懒加载本地服务模块
    if (!_webSearch) {
      try {
        _webSearch = await import('./web-search-service.js')
        _memosClient = await import('./memos-client.js')
        _visionService = await import('./vision-service.js')
        _skillsRegistry = await import('./skills-registry.js')
      } catch (err) {
        return `本地服务加载失败: ${err.message}`
      }
    }

    switch (toolName) {
      case 'web_search': {
        if (!_webSearch.isWebSearchAvailable()) {
          return '联网搜索服务未配置，请设置 Tavily API Key。阿喜目前无法联网查询，但可以基于已有知识回答您的问题。'
        }
        return _webSearch.executeWebSearchToolCall({ name: toolName, arguments: toolArgs })
      }
      case 'recall_memory': {
        if (!_memosClient.isMemoryAvailable()) {
          return '长期记忆服务未配置。阿喜暂时无法回忆历史信息，但当前对话内容阿喜都记得。'
        }
        return _memosClient.executeMemoryToolCall({ name: toolName, arguments: toolArgs })
      }
      case 'add_memory': {
        if (!_memosClient.isMemoryAvailable()) {
          return '长期记忆服务未配置，无法保存。'
        }
        return _memosClient.executeMemoryToolCall({ name: toolName, arguments: toolArgs })
      }
      case 'analyze_image': {
        if (!_visionService.isVisionEnabled()) {
          return '视觉分析服务未配置。阿喜暂时无法分析图片，请用户用文字描述图片内容。'
        }
        const imageData = toolArgs.imageData
        const mediaType = toolArgs.mediaType || 'image/jpeg'
        const analysisType = toolArgs.analysisType || 'general'
        const prompt = _visionService.HEYTEA_VISION_PROMPTS[analysisType] || _visionService.HEYTEA_VISION_PROMPTS.general
        _visionService.configureVision({ prompt })
        // 直接使用 describeImage 传入 base64 数据（describeImage 已 export）
        return _visionService.describeImage(imageData, mediaType, null, 1)
          .catch(err => `图片分析失败: ${err.message}`)
      }
      default:
        return `未知本地工具: ${toolName}`
    }
  }

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const result = await llmClient.chatCompletion(messages, {
      ...llmOptions,
      tools,
      toolChoice: 'auto',
    })

    // LLM 返回了工具调用
    if (result.tool_calls && result.tool_calls.length > 0) {
      // 把 assistant 的 tool_calls 消息加入上下文
      messages.push({
        role: 'assistant',
        content: result.content || null,
        tool_calls: result.tool_calls,
      })

      // 逐个执行工具调用，把结果加入上下文
      for (const toolCall of result.tool_calls) {
        const toolName = toolCall.function?.name || toolCall.name
        let toolArgs = {}
        try {
          toolArgs = JSON.parse(toolCall.function?.arguments || '{}')
        } catch {
          toolArgs = {}
        }

        let toolResultText = ''
        try {
          if (LOCAL_TOOL_NAMES.has(toolName)) {
            // 本地工具：直接在客户端执行
            toolResultText = await _executeLocalTool(toolName, toolArgs)
          } else {
            // MCP 工具：通过 MCP 协议执行
            const toolResult = await mcpIntegration.executeMCPTool(toolName, toolArgs)
            toolResultText = mcpIntegration.formatToolResult(toolName, toolResult) || JSON.stringify(toolResult)
          }
        } catch (err) {
          // 给 LLM 提供可操作的错误信息，而不是笼统的"失败"
          toolResultText = `工具 ${toolName} 调用失败：${err.message}。请向用户说明当前操作暂时无法完成，并给出替代建议（如换个关键词、手动选择门店等），不要说"答不上来"。`
        }

        allToolCalls.push({ tool: toolName, args: toolArgs, result: toolResultText })

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResultText,
        })
      }

      // 继续下一轮循环，让 LLM 看到工具结果后生成回复
      continue
    }

    // LLM 没有调用工具，直接返回文本 → 这是最终回复
    const reply = (result.content || '').trim()

    // 自动修正禁用词
    let cleanedReply = reply
    if (/亲亲|亲(?!爱的|情)|宝贝/.test(cleanedReply)) {
      cleanedReply = cleanedReply.replace(/亲亲/g, '您').replace(/亲(?!爱的|情)/g, '').replace(/宝贝/g, '您')
    }

    return {
      reply: cleanedReply || '抱歉，阿喜暂时无法处理这个请求，请稍后再试。',
      source: 'llm_with_tools',
      model: result.model,
      usage: result.usage,
      tool_calls_made: allToolCalls,
      reasoning_content: result.reasoning_content || null,
    }
  }

  // 达到最大轮次，强制生成文本回复（不带 tools）
  const fallbackMessages = messages.filter(m => m.role !== 'tool' || m.content)
  const finalResult = await llmClient.chatCompletion(fallbackMessages, {
    ...llmOptions,
    // 不再传 tools，强制 LLM 输出文本
  })

  return {
    reply: (finalResult.content || '抱歉，处理时间较长，请稍后再试。').trim(),
    source: 'llm_with_tools_max_rounds',
    model: finalResult.model,
    usage: finalResult.usage,
    tool_calls_made: allToolCalls,
  }
}

/**
 * LLM 增强的回复生成
 * 当 LLM API 已配置时使用真实 LLM 生成回复，否则降级到模板
 *
 * 这是 ICL + CAMEL + Agent 理论的完整落地入口。
 *
 * @param {Object} params - 生成参数
 * @param {string} params.userText - 用户输入
 * @param {Object} params.session - 会话上下文
 * @param {Object} params.perception - 感知层输出
 * @param {Object} params.decision - 决策层输出
 * @param {Object} params.actionResult - 执行层输出
 * @param {Array} params.conversationHistory - 对话历史
 * @param {string} params.intent - 意图路由: 'ordering' | 'general_knowledge' | null
 * @param {Array} params.tools - MCP 工具定义 (OpenAI function calling)
 * @returns {Promise<Object>} { reply, source, usage, prompt_tokens }
 */
export async function generateLLMEnhancedReply(params) {
  const {
    userText,
    session = {},
    perception = null,
    decision = null,
    actionResult = null,
    conversationHistory = [],
    memoryContext = '',  // 对话记忆上下文
    intent = null,       // 意图路由: 'ordering' | 'general_knowledge' | null(食安默认)
    tools = null,        // MCP/Skill 工具定义 (OpenAI function calling 格式)
  } = params

  // 动态导入 (避免循环依赖 + 按需加载)
  let llmClient, promptBuilder, mcpIntegration
  try {
    llmClient = await import('./llm-client.js')
    promptBuilder = await import('./prompt-builder.js')
    mcpIntegration = await import('./mcp-prompt-integration.js')
  } catch (err) {
    return {
      reply: null,
      source: 'import_error',
      error: err.message,
    }
  }

  // 检查 API 是否已配置
  if (!llmClient.isLLMConfigured()) {
    return {
      reply: null,
      source: 'not_configured',
      hint: '请在设置中配置 LLM API 以启用智能回复生成',
    }
  }

  try {
    // ── 根据意图构建不同的系统提示 ──
    let systemPrompt, messages

    if (intent === 'ordering') {
      // 点单意图: 能力感知型 Agent — 使用带能力边界声明的点单提示词 + MCP工具定义
      const orderingSection = mcpIntegration.getOrderingPromptSection()
      const memoryHint = memoryContext ? `\n\n## 对话记忆\n${memoryContext}` : ''
      systemPrompt = `你是阿喜，喜茶智能客服助手，专注于帮用户完成自助点单。

${orderingSection}${memoryHint}

## 沟通规范
- 自称"阿喜"，称呼顾客"您"
- 语气轻松活泼，符合喜茶年轻品牌调性
- 如果用户问非点单问题，也可以友好回答
- 严禁使用任何emoji表情图案，回复中只能使用纯文字。如果需要图标或图形，只能使用SVG
- 遇到工具不支持的功能时，坦诚说明限制并给出替代方案，绝不说"答不上来"`

      messages = promptBuilder.buildMessages(systemPrompt, conversationHistory, userText)

      // 如果有工具定义，注入 tools 进入 ReAct 循环
      if (tools && tools.length > 0) {
        return _executeToolCallingLoop(llmClient, mcpIntegration, messages, tools, {
          temperature: 0.3, maxTokens: 2048,
        }, conversationHistory, userText)
      }
      // 无工具可用时仍用点单提示词做对话式回复（不降级到食安流程）
    } else if (intent === 'general_knowledge') {
      // 通用知识意图: 轻量提示词，不走食安流程
      const memoryHint = memoryContext ? `\n对话记忆：${memoryContext}` : ''
      systemPrompt = `你是阿喜，喜茶智能客服助手。${memoryHint}
- 自称"阿喜"，称呼顾客"您"
- 对于喜茶业务以外的问题，友好、简洁地回答即可
- 如果问题涉及喜茶产品、门店、活动，可以热情推荐
- 语气亲切自然，不要太正式
- 严禁使用任何emoji表情图案，回复中只能使用纯文字
- 如果用户的问题你不确定答案，可以调用 web_search 工具搜索互联网获取信息
- 当用户分享偏好或重要信息时，调用 add_memory 工具记住这些信息`

      messages = promptBuilder.buildMessages(systemPrompt, conversationHistory, userText)

      // 通用知识意图也支持工具调用（web_search, memory 等）
      if (tools && tools.length > 0) {
        return _executeToolCallingLoop(llmClient, mcpIntegration, messages, tools, {
          temperature: 0.3, maxTokens: 2048,
        }, conversationHistory, userText)
      }
    } else {
      // 默认: 食安客服流程 (原有逻辑)
      systemPrompt = promptBuilder.buildSystemPrompt(perception, session, {
        includeICL: true,
        maxICLExamples: 3,
        includeCompensation: true,
        includeWorkflow: true,
        memoryContext,
      })
      messages = promptBuilder.buildMessages(systemPrompt, conversationHistory, userText)
    }

    // 3. 调用 LLM API
    const result = await llmClient.chatCompletion(messages, {
      temperature: 0.3,
      maxTokens: 1536,
    })

    // 4. 后处理: 检查回复质量
    const reply = result.content.trim()
    const reasoning = result.reasoning_content || null

    // 基本质量检查 (Reward Hacking 防御)
    const isTooShort = reply.length < 10
    const isRepetitive = _checkSimpleRepetition(reply)
    const hasForbiddenWords = /亲|亲亲|宝贝/.test(reply)

    if (isTooShort || isRepetitive) {
      return {
        reply: null,
        source: 'quality_rejected',
        reason: isTooShort ? '回复过短' : '检测到重复模式',
        raw_reply: reply,
        usage: result.usage,
      }
    }

    // 自动修正禁用词
    let cleanedReply = reply
    if (hasForbiddenWords) {
      cleanedReply = reply.replace(/亲亲/g, '您').replace(/亲(?!爱的|情)/g, '').replace(/宝贝/g, '您')
    }

    // 自动清除 emoji（严禁 emoji 策略的最后防线）
    cleanedReply = cleanedReply.replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu,
      ''
    ).replace(/\s{2,}/g, ' ').trim()

    return {
      reply: cleanedReply,
      source: 'llm',
      model: result.model,
      usage: result.usage,
      reasoning_content: reasoning,
      system_prompt_length: systemPrompt.length,
      message_count: messages.length,
    }
  } catch (err) {
    return {
      reply: null,
      source: 'api_error',
      error: err.message,
      error_code: err.code || 'UNKNOWN',
    }
  }
}

/**
 * LLM 增强的食安分类
 * 使用 LLM 替代/增强规则贝叶斯分类
 *
 * @param {string} userText - 用户输入
 * @param {Object} session - 会话上下文
 * @returns {Promise<Object>} 分类结果
 */
export async function classifyFoodSafetyWithLLM(userText, session = {}) {
  let llmClient, promptBuilder
  try {
    llmClient = await import('./llm-client.js')
    promptBuilder = await import('./prompt-builder.js')
  } catch {
    return null
  }

  if (!llmClient.isLLMConfigured()) return null

  try {
    const messages = promptBuilder.buildClassificationPrompt(userText, session)
    const result = await llmClient.chatCompletion(messages, {
      temperature: 0.0,
      maxTokens: 512,
    })

    // 解析 JSON 响应
    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    return {
      is_food_safety: parsed.is_food_safety || false,
      consult_type: parsed.consult_type || '',
      risk_level: parsed.risk_level || 'low',
      emotion: parsed.emotion || 'calm',
      key_entities: parsed.key_entities || {},
      summary: parsed.summary || '',
      _source: 'llm',
      _usage: result.usage,
    }
  } catch (err) {
    return {
      _source: 'llm_error',
      _error: err.message,
    }
  }
}

/** 简单重复检测 (Reward Hacking 防御) */
function _checkSimpleRepetition(text) {
  if (!text || text.length < 20) return false
  // 检查是否有 4+ 字的片段重复 3 次以上
  for (let len = 4; len <= 8; len++) {
    for (let i = 0; i < text.length - len; i++) {
      const fragment = text.slice(i, i + len)
      const occurrences = (text.match(new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      if (occurrences >= 3) return true
    }
  }
  return false
}
