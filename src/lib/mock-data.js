/**
 * 食安客服 Agent Mock 数据 — AIQC_V2 扣子(Coze)工作流版本
 * 数据来源：食安话术标准案例库、补偿标准速查表、升级判定标准、AIQC_V2 工作流架构
 *
 * 工作流节点: 开始 → 对话解构+服务分析 → 工单操作专家 → 对话分类质检专家
 *            → 红线行为检测 → 红线报警器 → 结案
 */
import { processMessage } from './agent-engine.js'

// ═══════════════════════════════════════════════════════
// 当季热门饮品 (来自开场白抽取统计 Top10)
// ═══════════════════════════════════════════════════════
export const HOT_DRINK_NAMES = [
  { name: '清爽芭乐提', count: 40 },
  { name: '纯绿妍茶后', count: 35 },
  { name: '芝芝绿妍茶后', count: 35 },
  { name: '拿铁', count: 34 },
  { name: '多肉芒芒', count: 33 },
  { name: '绿妍轻柠茶', count: 30 },
  { name: '爆芋泥蛋糕', count: 29 },
  { name: '英红糯糥', count: 27 },
  { name: '烤黑糖波波牛乳茶', count: 26 },
  { name: '苦巧云顶', count: 25 },
]

// ═══════════════════════════════════════════════════════
// 23 标签闭集 + 非食安 (含贝叶斯先验概率和历史案例数)
// ═══════════════════════════════════════════════════════
export const FOOD_SAFETY_LABELS = [
  { label: '食安问题/外源性异物/毛发', level_1: '食安问题', level_2: '外源性异物', level_3: '毛发', prior: 0.12, cases: 172, risk: 'medium' },
  { label: '食安问题/外源性异物/虫类', level_1: '食安问题', level_2: '外源性异物', level_3: '虫类', prior: 0.10, cases: 204, risk: 'medium' },
  { label: '食安问题/外源性异物/苍蝇或蟑螂', level_1: '食安问题', level_2: '外源性异物', level_3: '苍蝇或蟑螂', prior: 0.04, cases: 78, risk: 'high' },
  { label: '食安问题/外源性异物/塑料', level_1: '食安问题', level_2: '外源性异物', level_3: '塑料', prior: 0.06, cases: 95, risk: 'medium' },
  { label: '食安问题/外源性异物/纸类', level_1: '食安问题', level_2: '外源性异物', level_3: '纸类', prior: 0.03, cases: 48, risk: 'medium' },
  { label: '食安问题/外源性异物/金属', level_1: '食安问题', level_2: '外源性异物', level_3: '金属', prior: 0.02, cases: 32, risk: 'high' },
  { label: '食安问题/外源性异物/杯盖或小白塞', level_1: '食安问题', level_2: '外源性异物', level_3: '杯盖或小白塞', prior: 0.03, cases: 45, risk: 'medium' },
  { label: '食安问题/外源性异物/不明物', level_1: '食安问题', level_2: '外源性异物', level_3: '不明物', prior: 0.08, cases: 391, risk: 'medium' },
  { label: '食安问题/内源性异物/果核', level_1: '食安问题', level_2: '内源性异物', level_3: '果核', prior: 0.06, cases: 125, risk: 'low' },
  { label: '食安问题/内源性异物/果皮', level_1: '食安问题', level_2: '内源性异物', level_3: '果皮', prior: 0.03, cases: 56, risk: 'low' },
  { label: '食安问题/内源性异物/茶渣', level_1: '食安问题', level_2: '内源性异物', level_3: '茶渣', prior: 0.05, cases: 98, risk: 'low' },
  { label: '食安问题/内源性异物/水果纤维', level_1: '食安问题', level_2: '内源性异物', level_3: '水果纤维', prior: 0.02, cases: 38, risk: 'low' },
  { label: '食安问题/内源性异物/果蔬杂质或其它原料', level_1: '食安问题', level_2: '内源性异物', level_3: '果蔬杂质或其它原料', prior: 0.02, cases: 42, risk: 'low' },
  { label: '食安问题/身体不适/腹泻', level_1: '食安问题', level_2: '身体不适', level_3: '腹泻', prior: 0.05, cases: 87, risk: 'high' },
  { label: '食安问题/身体不适/呕吐', level_1: '食安问题', level_2: '身体不适', level_3: '呕吐', prior: 0.03, cases: 52, risk: 'high' },
  { label: '食安问题/身体不适/过敏', level_1: '食安问题', level_2: '身体不适', level_3: '过敏', prior: 0.02, cases: 35, risk: 'high' },
  { label: '食安问题/身体不适/其它不适', level_1: '食安问题', level_2: '身体不适', level_3: '其它不适', prior: 0.02, cases: 41, risk: 'high' },
  { label: '食安问题/原料变质', level_1: '食安问题', level_2: '原料变质', level_3: '', prior: 0.04, cases: 68, risk: 'high' },
  { label: '食安问题/原料未熟', level_1: '食安问题', level_2: '原料未熟', level_3: '', prior: 0.01, cases: 22, risk: 'medium' },
  { label: '食安问题/饮品异味', level_1: '食安问题', level_2: '饮品异味', level_3: '', prior: 0.05, cases: 95, risk: 'medium' },
  { label: '食安问题/产品有效期', level_1: '食安问题', level_2: '产品有效期', level_3: '', prior: 0.02, cases: 38, risk: 'high' },
  { label: '食安问题/OEM/OEM过期', level_1: '食安问题', level_2: 'OEM', level_3: 'OEM过期', prior: 0.01, cases: 18, risk: 'high' },
  { label: '食安问题/OEM/OEM变质', level_1: '食安问题', level_2: 'OEM', level_3: 'OEM变质', prior: 0.02, cases: 32, risk: 'high' },
  { label: '非食安问题', level_1: '非食安问题', level_2: '', level_3: '', prior: 0.10, cases: 312, risk: 'low' },
]

// ═══════════════════════════════════════════════════════
// 5 级补偿矩阵 (来自食安补偿标准速查表)
// ═══════════════════════════════════════════════════════
export const COMPENSATION_MATRIX = {
  L1: { name: '轻微', categories: ['内源性异物'], max_voucher: 20, action: '1:1 重做或 ≤20 元代金券', approval: '客服权限', refund: false, store_callback: false, realNote: '与 generateSolution 对齐：voucher_max=20' },
  L2: { name: '一般', categories: ['外源性异物(非高危)'], max_voucher: 30, action: '退款 + ≤30 元代金券 + 门店 12h 联系', approval: '主管审批', refund: true, store_callback: true, callback_hours: 12, realNote: '与 generateSolution 对齐：voucher_max=30, callback=12h' },
  L3: { name: '严重', categories: ['原料变质', '饮品异味', 'OEM变质', '产品有效期'], max_voucher: 50, action: '退款 + 50 元代金券 + 门店 4h 致电 + 紧急排查', approval: '主管审批', refund: true, store_callback: true, callback_hours: 4, realNote: '与 generateSolution 对齐：voucher_max=50, callback=4h' },
  L4: { name: '紧急', categories: ['身体不适'], max_voucher: null, action: '建议就医 + 地区负责人 1h 跟进 + 专人协调', approval: '区域经理审批', refund: true, store_callback: true, callback_hours: 1, medical_note: '不主动承诺医疗费', realNote: '与 generateSolution 对齐：无固定 voucher，callback=1h' },
  L5: { name: '危机', categories: ['恶性食安', '高危异物'], max_voucher: null, action: '立即升级客诉 + 强钉门店及区域负责人', approval: '总部审批', refund: true, escalation: 'Level3', no_online_commitment: true, realNote: '与 generateSolution 对齐' },
  approval_authority: {
    under_50: '客服权限',
    under_200: '主管审批',
    under_500: '区域经理审批',
    over_500: '总部审批',
  },
}

// ═══════════════════════════════════════════════════════
// 3 级升级规则 (来自食安紧急升级判定标准)
// ═══════════════════════════════════════════════════════
export const ESCALATION_RULES = {
  Level1: {
    name: '门店负责人级',
    responder: '门店负责人',
    sla_hours: 24,
    triggers: ['一般投诉', '外源性异物', '内源性异物', '品质问题'],
    actions: ['反馈门店负责人', '负责人核实后24h内联系'],
    realNote: '真实数据中最常见的升级路径，绝大多数客诉走此流程',
  },
  Level2: {
    name: '专员/区域级',
    responder: '专员+门店负责人',
    sla_hours: 24,
    triggers: ['身体不适', '苍蝇蟑螂', '金属异物', '用户强烈投诉', '不满意门店方案'],
    actions: ['升级专员/更高负责人', '创建工单', '专人24h内联系沟通'],
    realNote: '真实数据中"区域经理"角色较少出现，主要是升级专员或更高负责人',
  },
  Level3: {
    name: '总部级',
    responder: '总部品质+法务',
    sla_hours: 24,
    triggers: ['住院', '多人不适>=3人', '疑似批量问题', '监管部门介入', '12315投诉'],
    actions: ['创建升级客诉', '全链路排查'],
    realNote: '极端情况，真实数据中极少出现',
  },
}

// ═══════════════════════════════════════════════════════
// AIQC_V2 四维度质检体系 (来自扣子工作流对话解构节点)
// ═══════════════════════════════════════════════════════
export const QC_DIMENSIONS_DISPLAY = {
  understanding: {
    name: '理解能力',
    standard: '准确理解顾客意图、正确回应顾客、答其所问',
    redlines: ['答非所问', '张冠李戴'],
    passLabel: '达标',
    failLabel: '不达标',
  },
  expression: {
    name: '表达能力',
    standard: '礼貌专业、不用网络用语、不使用"！"、正面表达、表达有温度',
    redlines: ['不礼貌', '复读机', '违禁词', '致命错字', '负面表达', '表达不清', '表达过简', '回复不正面'],
    passLabel: '达标',
    failLabel: '不达标',
  },
  comfort: {
    name: '安抚技巧',
    standard: '顾客反馈问题时，2回合内必须先表达歉意/共情',
    redlines: ['情绪视盲1', '情绪视盲2'],
    passLabel: '达标',
    failLabel: '不达标',
  },
  proactiveness: {
    name: '服务积极性',
    standard: '主动了解问题、不推诿、有温度',
    redlines: ['模糊投诉未追问', '越权承诺退款', '主动退款', '生日祝福缺失'],
    passLabel: '达标',
    failLabel: '不达标',
  },
}

// ═══════════════════════════════════════════════════════
// 七鱼质检评分维度 (兼容旧版 — 引用 QC_DIMENSIONS)
// ═══════════════════════════════════════════════════════
export const QUALITY_METRICS = {
  dimensions: [
    { key: 'understanding', name: '理解能力', weight: 0.25, deductions: ['答非所问', '张冠李戴'] },
    { key: 'expression', name: '表达能力', weight: 0.25, deductions: ['不礼貌', '复读机', '违禁词', '致命错字', '负面表达', '表达不清', '表达过简', '回复不正面'] },
    { key: 'comfort', name: '安抚技巧', weight: 0.25, deductions: ['情绪视盲1', '情绪视盲2'] },
    { key: 'proactiveness', name: '服务积极性', weight: 0.25, deductions: ['模糊投诉未追问', '越权承诺退款', '主动退款', '生日祝福缺失'] },
  ],
  qcDimensions: QC_DIMENSIONS_DISPLAY,
}

// ═══════════════════════════════════════════════════════
// AIQC_V2 六大红线类别 (来自扣子工作流红线行为检测节点)
// ═══════════════════════════════════════════════════════
export const REDLINE_CATEGORIES = [
  {
    id: 1,
    name: '服务态度红线',
    definition: '客服对顾客使用侮辱性、轻蔑性语言',
    examples: ['你懂不懂规矩？', '这点小事也要投诉？'],
  },
  {
    id: 2,
    name: '敏感信息红线',
    definition: '泄露内部沟通信息或其他顾客信息',
    examples: ['你对顾客说的......', '我都没说了你还想偷听？'],
  },
  {
    id: 3,
    name: '内部流程红线',
    definition: '暴露公司内部流程、系统或工具信息',
    examples: ['我们很谨慎得定得够导出'],
  },
  {
    id: 4,
    name: '个人信息红线',
    definition: '泄露客服员工私人联系方式或身份信息',
    examples: ['客服员工私人联系方式或公开的身份信息'],
  },
  {
    id: 5,
    name: '客服违规红线',
    definition: '讨论非业务范围内的敏感社会话题',
    examples: ['请不要讨论非业务范围内的敏感社会话题'],
  },
  {
    id: 6,
    name: '其它违规红线',
    definition: '政治评论、群体对立等不当言论',
    examples: ['政治/时事评论', '性别/群体对立'],
  },
]

// ═══════════════════════════════════════════════════════
// AIQC_V2 公共豁免规则 (12 条)
// ═══════════════════════════════════════════════════════
export const PUBLIC_RULES = [
  { id: 1, name: '退款状态规则', description: '订单已退款/退款中时的处理规则' },
  { id: 2, name: '已完成订单退款规则', description: '已完成订单顾客要求退款的处理' },
  { id: 3, name: '未收到订单处理规则', description: '未收到订单优先催单核实' },
  { id: 4, name: '沉默不等于拒绝规则', description: '顾客未明确拒绝视为接受方案' },
  { id: 5, name: '概念区分规则', description: '代金券/换购券/现金券不等于退款' },
  { id: 6, name: '免运费券豁免规则', description: '额外赠送免运费券不违规' },
  { id: 7, name: '顾客主动表达诉求豁免', description: '顾客拒绝后主动说出诉求，客服无需再询问' },
  { id: 8, name: '顾客拒绝后通用处理流程', description: '诉求<=3张30元可同意，>3张需反馈负责人' },
  { id: 9, name: '免运费券豁免补充', description: '与规则6一致' },
  { id: 10, name: '模糊放过原则', description: '模糊场景优先按达标处理' },
  { id: 11, name: '边界时间规则', description: '21:00视为21点后，第7天视为7天内' },
  { id: 12, name: '代金券金额精度', description: '只校验金额范围，具体金额无需判断' },
]

// ═══════════════════════════════════════════════════════
// Coze AIQC_V2 工作流输入字段 (Start 节点 19 个 String 字段)
// ═══════════════════════════════════════════════════════
export const COZE_INPUT_FIELDS = [
  { name: 'CONTENT_INPUT', type: 'String', description: '对话内容输入（完整对话文本）' },
  { name: 'CONVERSATION_ID', type: 'String', description: '会话唯一标识' },
  { name: 'AGENT_NAME', type: 'String', description: '客服坐席名称' },
  { name: 'CUSTOMER_NAME', type: 'String', description: '顾客姓名' },
  { name: 'CUSTOMER_TP', type: 'String', description: '顾客类型标识' },
  { name: 'CUSTOMER_PHONE', type: 'String', description: '顾客联系电话' },
  { name: 'TK_INPUT', type: 'String', description: '工单输入内容' },
  { name: 'TK_ID', type: 'String', description: '工单编号' },
  { name: 'TK_TP', type: 'String', description: '工单类型' },
  { name: 'CategoryLabel', type: 'String', description: '分类标签（23标签闭集）' },
  { name: 'Order', type: 'String', description: '订单信息' },
  { name: 'Store', type: 'String', description: '门店名称' },
  { name: 'product', type: 'String', description: '产品名称' },
  { name: 'START_TIME', type: 'String', description: '对话开始时间' },
  { name: 'SM', type: 'String', description: '服务管理标识' },
  { name: 'SOP', type: 'String', description: '标准操作流程版本' },
  { name: 'HAS_NOT_TOPPED', type: 'String', description: '是否未终止标记' },
  { name: 'OT', type: 'String', description: '订单时间' },
  { name: 'CSAT', type: 'String', description: '顾客满意度评分' },
]

// ═══════════════════════════════════════════════════════
// Coze AIQC_V2 工作流节点定义
// ═══════════════════════════════════════════════════════
export const COZE_WORKFLOW_NODES = [
  {
    id: 'start',
    name: '开始',
    type: 'input',
    model: null,
    fields: [
      'CONTENT_INPUT', 'CONVERSATION_ID', 'AGENT_NAME', 'CUSTOMER_NAME',
      'CUSTOMER_TP', 'CUSTOMER_PHONE', 'TK_INPUT', 'TK_ID', 'TK_TP',
      'CategoryLabel', 'Order', 'Store', 'product', 'START_TIME',
      'SM', 'SOP', 'HAS_NOT_TOPPED', 'OT', 'CSAT',
    ],
  },
  {
    id: 'food_safety_classifier',
    name: '食安分类器',
    type: 'llm',
    model: '豆包·1.5·Pro·32k',
    inputs: ['CONTENT_INPUT', 'image_urls', 'order_context'],
    outputs: ['is_food_safety', 'label', 'risk_level', 'need_human_review', 'confidence', 'image_status', 'missing_info', 'evidence', 'next_action_hint'],
    description: '食安问题闭集分类器，24标签闭集，输出结构化JSON',
    config: {
      skill: null,
      visionInput: '{{image_urls}}',
      timeout: 60,
      retryCount: 1,
      outputFormat: 'JSON',
      systemPrompt: '你是喜茶售后食安问题分类器。你只负责分类和结构化输出，不生成客服回复，不承诺处理方案。你必须只从固定标签闭集中选择标签，不得自造标签。你只输出JSON。',
      userPromptTemplate: '请根据以下信息完成食安问题闭集分类。\n当前用户消息：{{user_text}}\n多轮上下文：{{merged_text}}\n图片URL：{{image_urls}}\n图片识别结果：{{image_info}}\n订单信息：{{order_context}}',
      labelSet: [
        '食安问题/外源性异物/毛发', '食安问题/外源性异物/虫类', '食安问题/外源性异物/苍蝇或蟑螂',
        '食安问题/外源性异物/塑料', '食安问题/外源性异物/纸类', '食安问题/外源性异物/金属',
        '食安问题/外源性异物/杯盖或小白塞', '食安问题/外源性异物/不明物',
        '食安问题/内源性异物/果核', '食安问题/内源性异物/果皮', '食安问题/内源性异物/茶渣',
        '食安问题/内源性异物/水果纤维', '食安问题/内源性异物/果蔬杂质或其它原料',
        '食安问题/身体不适/腹泻', '食安问题/身体不适/呕吐', '食安问题/身体不适/过敏', '食安问题/身体不适/其它不适',
        '食安问题/原料变质', '食安问题/原料未熟', '食安问题/饮品异味', '食安问题/产品有效期',
        '食安问题/OEM/OEM过期', '食安问题/OEM/OEM变质',
        '非食安问题',
      ],
      outputSchema: {
        is_food_safety: 'Boolean',
        label: 'String (闭集标签)',
        risk_level: 'high|medium|low',
        need_human_review: 'Boolean',
        confidence: 'Number (0-1)',
        image_status: '已提供|未提供未引导|引导未提供|已提供但无效|无图片需求',
        missing_info: { order_missing: 'Boolean', image_missing: 'Boolean', contact_missing: 'Boolean', health_status_missing: 'Boolean', store_missing: 'Boolean' },
        evidence: 'Array<String>',
        next_action_hint: 'ask_order_and_image|ask_health_status_and_contact|query_order|create_ticket|escalate_human|generate_reply|transfer_non_food_safety',
      },
      classificationRules: [
        '身体不适优先级最高：腹泻/呕吐/过敏/恶心/腹痛等 → 身体不适 + risk_level=high',
        '高危异物：金属/刀片/玻璃/活虫/苍蝇/蟑螂 → risk_level=high + need_human_review=true',
        '外源性异物：不应出现在饮品中的外来物（毛发/虫/塑料/纸片/金属/杯盖碎片/小白塞/不明黑点）',
        '内源性异物：原料本身可能带来的物质（果核/果皮/茶渣/水果纤维/果蔬杂质）',
        'OEM产品：包装食品/瓶装/袋装/糕点/蛋糕/茶包等非现制饮品',
        '原料变质：现制饮品原料发霉/腐烂/明显坏了',
        '饮品异味：现制饮品酸臭/怪味/味道不对但未明确发霉',
        'need_human_review=true 条件：身体不适/高危异物/变质/过期/图片缺失/投诉曝光/置信度<0.70',
      ],
      errorFallback: {
        is_food_safety: true, label: '食安问题/外源性异物/不明物', risk_level: 'medium',
        need_human_review: true, confidence: 0.0, image_status: '未提供未引导',
        evidence: ['分类节点异常，需人工复核'], next_action_hint: 'escalate_human',
      },
    },
  },
  {
    id: 'dialogue_deconstruct',
    name: '对话解构+服务分析',
    type: 'llm',
    model: '豆包·1.8·深度思考',
    inputs: ['CONTENT_INPUT', 'CONVERSATION_ID', 'AGENT_NAME', 'CUSTOMER_NAME', 'CategoryLabel', 'Order', 'Store', 'product', 'START_TIME', 'SM', 'SOP', 'HAS_NOT_TOPPED', 'OT', 'CSAT'],
    outputs: ['to_block5_scene', 'to_block6_issue', 'process_trace', 'cont_js', 'sq3', 'sq1', 'sq2', 'Dc_check'],
    description: '深度分析对话内容，拆解服务过程，输出4维度质检(sq1)、问题摘要(sq2/sq3)、过程追溯(process_trace)等',
  },
  {
    id: 'biz_process',
    name: '工单操作专家',
    type: 'llm',
    model: '豆包·1.5·Lite·32k',
    inputs: ['CONTENT_INPUT', 'to_block5_scene', 'SOP', 'OT'],
    outputs: ['sqm1', 'sqm2'],
    description: '基于食安SOP标准评判客服工单操作合规性，输出工单合规判定(sqm1)及补充说明(sqm2)',
  },
  {
    id: 'classify_qc',
    name: '5.2对话分类质检专家',
    type: 'llm',
    model: '豆包·1.6·极致速度',
    inputs: ['CONTENT_INPUT', 'to_block6_issue', 'CategoryLabel'],
    outputs: ['qc1', 'qc2'],
    description: '对对话进行分类质检，输出分类结果(qc1)及分类补充(qc2)',
  },
  {
    id: 'redline_detect',
    name: '红线行为检测（风险控制）',
    type: 'llm',
    model: '豆包·1.5·Lite·32k',
    inputs: ['CONTENT_INPUT', 'to_block5_scene', 'to_block6_issue'],
    outputs: ['is_violate', 'violation_type', 'violation_behavior', 'violation_quote'],
    description: '检测6类红线违规行为，输出是否违规(is_violate)及违规详情',
  },
  {
    id: 'redline_alert',
    name: '红线报警器',
    type: 'condition',
    model: null,
    condition: 'is_violate == false',
    branches: { normal: '正常放行', alert: '红线告警' },
    description: '条件分支：无违规正常放行，有违规触发告警',
  },
  {
    id: 'conclusion',
    name: '结案',
    type: 'output',
    model: null,
    outputs: ['sq1', 'qc1', 'sqm1', 'is_violate', 'sq3', 'sq2', 'qc2', 'sqm2', 'cont_js', 'reasoning_content'],
    description: '汇总所有节点输出，生成最终结案报告',
  },
]

// ═══════════════════════════════════════════════════════
// 工单模板
// ═══════════════════════════════════════════════════════
export const TICKET_TEMPLATES = {
  store_ticket: {
    name: '门店工单',
    sla_hours: 12,
    required_fields: ['session_id', 'classification', 'risk_level', 'order_id', 'drink_name', 'cup_count', 'store_name', 'user_phone', 'description', 'image_urls'],
    status_flow: ['待处理', '门店确认', '处理中', '已解决', '关闭'],
  },
  qiyu_ticket: {
    name: '七鱼工单',
    sla_hours: 24,
    required_fields: ['title', 'classification', 'priority', 'channel', 'agent_id', 'processing_records'],
    priorities: ['P0', 'P1', 'P2', 'P3'],
    status_flow: ['待处理', '处理中', '已解决', '关闭'],
  },
  escalation: {
    name: '升级客诉',
    required_fields: ['title', 'level', 'reason', 'responsible_person', 'response_sla', 'status'],
    levels: ['Level1', 'Level2', 'Level3'],
    status_flow: ['待响应', '处理中', '已解决', '关闭'],
  },
  dingtalk_alert: {
    name: '钉钉强提醒',
    required_fields: ['trigger_time', 'notify_target', 'message_summary', 'read_status'],
  },
}

// ═══════════════════════════════════════════════════════
// 食安分类树 (知识库三层结构)
// ═══════════════════════════════════════════════════════
export const FOOD_SAFETY_CATEGORIES = [
  {
    id: 'cat-exogenous', name: '外源性异物', icon: 'bug', count: 693,
    children: [
      { id: 'cat-exo-hair', name: '毛发', count: 172, riskLevel: 'medium', description: '头发、体毛等人体毛发混入饮品。实际应对：收集订单号+图片→安抚致歉→提供退款/代金券(10-25元)/重做多方案→反馈门店负责人24h内联系。', label: '食安问题/外源性异物/毛发', keywords: ['毛发', '头发', '发丝'], compensation: 'L2', escalation: 'Level1',
        realPatterns: { solutions: ['退款请求', '代金券(10-25元)', '联系门店', '重做方案'], voucherRange: '10-25元', callbackCommitment: '24h内', avgTurns: 16, realConversations: 172, chain: ['开场白', '接入确认', '信息收集(订单号+手机号+图片)', '安抚共情', '多方案提供(退款/代金券/重做)', '反馈门店负责人24h联系'] } },
      { id: 'cat-exo-insect', name: '虫类', count: 204, riskLevel: 'medium', description: '蚊子、蚂蚁、小飞虫等出现在饮品中。实际应对：收集图片→排查门店卫生→退款+代金券(10-25元)→反馈门店负责人24h联系。', label: '食安问题/外源性异物/虫类', keywords: ['虫', '飞虫', '小虫'], compensation: 'L2', escalation: 'Level1',
        realPatterns: { solutions: ['退款请求', '代金券(10-25元)', '联系门店', '重做方案'], voucherRange: '10-25元', callbackCommitment: '24h内', avgTurns: 16, realConversations: 204, chain: ['开场白', '接入确认', '信息收集(订单号+图片)', '安抚共情', '方案提供', '反馈门店排查卫生'] } },
      { id: 'cat-exo-fly', name: '苍蝇或蟑螂', count: 100, riskLevel: 'high', description: '苍蝇、蟑螂等严重卫生问题。实际应对：高度重视→收集订单+图片→退款+代金券(15-25元)+重做→反馈门店负责人溯源排查+自查制作过程→24h内联系。', label: '食安问题/外源性异物/苍蝇或蟑螂', keywords: ['苍蝇', '蟑螂'], compensation: 'L5', escalation: 'Level2',
        realPatterns: { solutions: ['退款请求', '代金券(15-25元)', '联系门店', '重做方案', '创建工单'], voucherRange: '15-25元', callbackCommitment: '24h内', avgTurns: 15.7, realConversations: 100, chain: ['开场白', '信息收集(订单号+图片)', '安抚共情(高度重视)', '退款确认/反馈门店溯源', '代金券补偿+重做', '门店负责人24h核实'] } },
      { id: 'cat-exo-plastic', name: '塑料', count: 250, riskLevel: 'medium', description: '塑料碎片、包装残片。实际应对：收集订单号+异物+标签同框图片→安抚→退款诉求记录+代金券(20-25元)→反馈门店负责人溯源排查→专人联系。', label: '食安问题/外源性异物/塑料', keywords: ['塑料', '包装膜', '吸管碎片'], compensation: 'L2', escalation: 'Level1',
        realPatterns: { solutions: ['退款请求', '代金券(20-25元)', '联系门店', '时效承诺'], voucherRange: '20-25元', callbackCommitment: '24h内', avgTurns: 15.5, realConversations: 250, chain: ['开场白', '信息收集(订单号+异物标签同框图)', '安抚共情+溯源排查', '退款诉求记录', '代金券(20-25元)', '门店负责人24h联系'] } },
      { id: 'cat-exo-paper', name: '纸类', count: 48, riskLevel: 'medium', description: '纸屑、标签残片。实际应对：收集图片→退款+代金券(10-20元)→反馈门店检查包材管理→24h内联系。', label: '食安问题/外源性异物/纸类', keywords: ['纸', '标签', '纸屑'], compensation: 'L2', escalation: 'Level1',
        realPatterns: { solutions: ['退款请求', '代金券(10-20元)', '联系门店'], voucherRange: '10-20元', callbackCommitment: '24h内', avgTurns: 16, realConversations: 48, chain: ['开场白', '信息收集', '安抚共情', '方案提供(退款/代金券)', '反馈门店'] } },
      { id: 'cat-exo-metal', name: '金属', count: 39, riskLevel: 'high', description: '金属碎片、铁丝、钉子等危险异物。实际应对：首要关注是否受伤→收集图片→反馈门店负责人处理→退款诉求记录→专人联系排查→24h内回复。', label: '食安问题/外源性异物/金属', keywords: ['金属', '铁丝', '刀片', '玻璃'], compensation: 'L5', escalation: 'Level2',
        realPatterns: { solutions: ['联系门店', '退款请求'], voucherRange: '视伤情定', callbackCommitment: '24h内', avgTurns: 15.2, realConversations: 39, chain: ['开场白', '安抚共情(关注伤情)', '信息收集(图片+订单)', '反馈门店负责人排查', '退款记录/专人联系'] } },
      { id: 'cat-exo-cap', name: '杯盖或小白塞', count: 69, riskLevel: 'medium', description: '杯盖碎片、封口塞等包装部件。实际应对：收集订单号+图片→解释可能原因(如制作时忙中出错)→退款记录+代金券(10-20元)→反馈门店→24h内联系。', label: '食安问题/外源性异物/杯盖或小白塞', keywords: ['杯盖', '小白塞', '封口塞'], compensation: 'L2', escalation: 'Level1',
        realPatterns: { solutions: ['退款请求', '代金券(10-20元)', '联系门店', '时效承诺'], voucherRange: '10-20元', callbackCommitment: '24h内', avgTurns: 17.7, realConversations: 69, chain: ['开场白', '信息收集(订单号+杯盖图片)', '安抚共情+解释原因', '退款记录+代金券', '反馈门店负责人'] } },
      { id: 'cat-exo-unknown', name: '不明物', count: 391, riskLevel: 'medium', description: '无法确定来源的异物。实际应对：收集图片→人工复核确认分类→按确认后分类走对应流程→如无法判断则升级门店负责人核实。', label: '食安问题/外源性异物/不明物', keywords: ['异物', '黑点', '不明物'], compensation: 'L2', escalation: 'Level1',
        realPatterns: { solutions: ['退款请求', '代金券(10-25元)', '联系门店', '创建工单'], voucherRange: '10-25元', callbackCommitment: '24h内', avgTurns: 16, realConversations: 391, chain: ['开场白', '信息收集(图片+订单)', '人工复核分类', '按分类走对应方案', '升级门店负责人'] } },
    ]
  },
  {
    id: 'cat-endogenous', name: '内源性异物', icon: 'leaf', count: 359,
    children: [
      { id: 'cat-endo-seed', name: '果核', count: 694, riskLevel: 'low', description: '水果原料天然果核残留（如车厘子果核）。实际应对：解释鲜果原料特性→提供重做/代金券(20-30元)多方案选择→顾客不接受可升级退款+创建工单→门店负责人24h联系。真实会话中此场景量最大(694条)。', label: '食安问题/内源性异物/果核', keywords: ['果核', '籽', '核'], compensation: 'L1', escalation: null,
        realPatterns: { solutions: ['补偿方案(20-30元)', '时效承诺', '创建工单', '重做方案', '联系门店', '退款请求'], voucherRange: '20-30元', callbackCommitment: '24h内', avgTurns: 15.8, realConversations: 694, chain: ['开场白', '信息收集(订单号+手机号+异物图片)', '安抚共情+解释鲜果特性', '多方案(重做/代金券20-30元)', '不满意→升级创建工单/退款', '门店负责人24h核实'] } },
      { id: 'cat-endo-peel', name: '果皮', count: 56, riskLevel: 'low', description: '水果果皮残留（如葡萄皮、柠檬皮）。实际应对：解释天然原料特性→提供重做或小额代金券(10-15元)→一般不需要升级。', label: '食安问题/内源性异物/果皮', keywords: ['果皮', '葡萄皮', '柠檬皮'], compensation: 'L1', escalation: null,
        realPatterns: { solutions: ['重做方案', '代金券(10-15元)'], voucherRange: '10-15元', callbackCommitment: '无', avgTurns: 14, realConversations: 56, chain: ['开场白', '信息收集', '解释天然原料', '重做/代金券'] } },
      { id: 'cat-endo-tea', name: '茶渣', count: 33, riskLevel: 'low', description: '茶叶碎渣通过过滤网残留，天然原料特性。实际应对：解释茶渣属正常现象→重做/代金券(10-20元)→不满意可退款→反馈门店优化过滤。真实数据中信息收集占比最高。', label: '食安问题/内源性异物/茶渣', keywords: ['茶渣', '茶叶', '茶梗'], compensation: 'L1', escalation: null,
        realPatterns: { solutions: ['补偿方案(10-20元)', '退款请求', '时效承诺', '重做方案', '联系门店'], voucherRange: '10-20元', callbackCommitment: '24h内', avgTurns: 24.5, realConversations: 33, chain: ['开场白', '信息收集(订单号+图片)', '解释茶渣天然特性', '重做/代金券(10-20元)', '不满意→退款+反馈门店'] } },
      { id: 'cat-endo-fiber', name: '水果纤维', count: 38, riskLevel: 'low', description: '水果果肉纤维，天然原料特征。实际应对：解释为正常果肉纤维→重做或小额补偿→一般不升级。', label: '食安问题/内源性异物/水果纤维', keywords: ['水果纤维', '果肉丝'], compensation: 'L1', escalation: null,
        realPatterns: { solutions: ['重做方案', '代金券(10-15元)'], voucherRange: '10-15元', callbackCommitment: '无', avgTurns: 14, realConversations: 38, chain: ['开场白', '信息收集', '解释果肉纤维', '重做/代金券'] } },
      { id: 'cat-endo-other', name: '果蔬杂质或其它原料', count: 42, riskLevel: 'low', description: '原料碎屑、果蔬杂质等。实际应对：解释原料特性→重做或解释→不满意提供代金券。', label: '食安问题/内源性异物/果蔬杂质或其它原料', keywords: ['原料碎屑', '果蔬杂质'], compensation: 'L1', escalation: null,
        realPatterns: { solutions: ['重做方案', '代金券(10-15元)'], voucherRange: '10-15元', callbackCommitment: '无', avgTurns: 14, realConversations: 42, chain: ['开场白', '信息收集', '解释原料特性', '重做/代金券'] } },
    ]
  },
  {
    id: 'cat-body', name: '身体不适', icon: 'heart-pulse', count: 215,
    children: [
      { id: 'cat-body-diarrhea', name: '腹泻', count: 87, riskLevel: 'high', description: '饮用后出现腹泻。实际应对：高度重视→建议就医→收集诊断图片+联系方式→反馈门店负责人排查→24h内专人联系→不主动承诺医疗费但可给代金券(20-25元)。', label: '食安问题/身体不适/腹泻', keywords: ['拉肚子', '腹泻', '水样便'], compensation: 'L4', escalation: 'Level2',
        realPatterns: { solutions: ['联系门店(建议就医)', '代金券(20-25元)', '创建工单', '时效承诺'], voucherRange: '20-25元', callbackCommitment: '24h内', avgTurns: 20, realConversations: 87, chain: ['开场白', '安抚共情(高度重视)', '建议就医+收集诊断图', '信息收集(手机号)', '反馈门店负责人排查', '24h专人联系'] } },
      { id: 'cat-body-vomit', name: '呕吐', count: 122, riskLevel: 'high', description: '饮用后出现呕吐。实际应对：高度重视→建议就医(如有诊断图请提供)→反馈门店负责人排查→代金券(20-25元)→24h内门店负责人联系→可升级创建工单。', label: '食安问题/身体不适/呕吐', keywords: ['呕吐', '吐了'], compensation: 'L4', escalation: 'Level2',
        realPatterns: { solutions: ['补偿方案(20-25元)', '退款请求', '联系门店(建议就医)', '创建工单', '时效承诺', '重做方案'], voucherRange: '20-25元', callbackCommitment: '24h内', avgTurns: 21.0, realConversations: 122, chain: ['开场白', '安抚共情(高度重视)', '建议就医+诊断图', '反馈门店排查', '代金券(20-25元)', '创建工单/24h专人联系'] } },
      { id: 'cat-body-allergy', name: '过敏', count: 60, riskLevel: 'high', description: '出现过敏症状。实际应对：关心身体状况→收集过敏原信息+诊断图片→代金券(20-25元)+退款→升级上级负责人核实→24h内联系。平均对话轮次最高(23.8轮)。', label: '食安问题/身体不适/过敏', keywords: ['过敏', '起疹', '喉咙痒'], compensation: 'L4', escalation: 'Level2',
        realPatterns: { solutions: ['创建工单', '联系门店', '时效承诺', '补偿方案(20-25元)', '退款请求'], voucherRange: '20-25元', callbackCommitment: '24h内', avgTurns: 23.8, realConversations: 60, chain: ['开场白', '安抚共情(关心身体)', '收集过敏原+诊断图', '代金券(20-25元)+退款', '升级上级负责人', '24h专人联系'] } },
      { id: 'cat-body-other', name: '其它不适', count: 41, riskLevel: 'high', description: '恶心、腹痛、头晕等未明确类型的不适。实际应对：关心身体→建议就医→收集信息→反馈门店负责人→24h内专人联系→不主动承诺医疗。', label: '食安问题/身体不适/其它不适', keywords: ['恶心', '腹痛', '头晕'], compensation: 'L4', escalation: 'Level2',
        realPatterns: { solutions: ['联系门店(建议就医)', '代金券(20-25元)', '创建工单'], voucherRange: '20-25元', callbackCommitment: '24h内', avgTurns: 20, realConversations: 41, chain: ['开场白', '安抚共情', '建议就医', '反馈门店负责人', '24h专人联系'] } },
    ]
  },
  {
    id: 'cat-quality', name: '品质问题', icon: 'alert-triangle', count: 223,
    children: [
      { id: 'cat-q-spoilage', name: '原料变质', count: 254, riskLevel: 'high', description: '饮品原料发霉、变酸、产品变质等。实际应对：高度重视→收集图片+订单号→退款+代金券(10-25元)+重做→反馈门店负责人核查批次→创建工单→24h内联系。涵盖发霉/变酸/一般变质多个子场景。', label: '食安问题/原料变质', keywords: ['发霉', '腐烂', '变质', '变酸', '发酸'], compensation: 'L3', escalation: 'Level2',
        realPatterns: { solutions: ['退款请求', '创建工单', '时效承诺', '补偿方案(10-25元)', '联系门店', '重做方案'], voucherRange: '10-25元', callbackCommitment: '24h内', avgTurns: 19.4, realConversations: 254, chain: ['开场白', '接入确认', '信息收集(手机号+饮品标签图)', '安抚共情+承诺反馈负责人', '退款+代金券(10-25元)+重做', '投诉记录+门店培训', '24h内处理'] } },
      { id: 'cat-q-uncooked', name: '原料未熟', count: 22, riskLevel: 'medium', description: '原料夹生、没熟。实际应对：致歉→收集图片→退款+代金券(10-20元)→反馈门店→24h内联系。', label: '食安问题/原料未熟', keywords: ['夹生', '没熟', '硬'], compensation: 'L3', escalation: 'Level1',
        realPatterns: { solutions: ['退款请求', '代金券(10-20元)', '联系门店'], voucherRange: '10-20元', callbackCommitment: '24h内', avgTurns: 16, realConversations: 22, chain: ['开场白', '信息收集', '安抚致歉', '退款+代金券', '反馈门店'] } },
      { id: 'cat-q-odor', name: '饮品异味', count: 95, riskLevel: 'medium', description: '饮品酸臭、馊味、怪味。实际应对：收集图片+订单号→退款+代金券(10-25元)→反馈门店排查制作情况→24h内联系。如时间过长难以核实则建议当天联系。', label: '食安问题/饮品异味', keywords: ['酸臭', '馊味', '异味', '怪味'], compensation: 'L3', escalation: 'Level1',
        realPatterns: { solutions: ['退款请求', '代金券(10-25元)', '联系门店', '重做方案'], voucherRange: '10-25元', callbackCommitment: '24h内', avgTurns: 17, realConversations: 95, chain: ['开场白', '信息收集(订单号+图片)', '安抚共情', '退款+代金券', '反馈门店排查制作'] } },
      { id: 'cat-q-expiry', name: '产品有效期', count: 116, riskLevel: 'high', description: '保质期咨询或日期不清。实际应对：收集产品有效期图片+订单号→解释原料差异→重做+代金券(20元)+退款→反馈门店培训优化→24h内联系。', label: '食安问题/产品有效期', keywords: ['保质期', '生产日期', '有效期'], compensation: 'L3', escalation: 'Level1',
        realPatterns: { solutions: ['联系门店', '补偿方案(20元)', '退款请求', '重做方案', '时效承诺', '创建工单'], voucherRange: '10-20元', callbackCommitment: '24h内', avgTurns: 18.0, realConversations: 116, chain: ['开场白', '信息收集(有效期图片+订单号)', '安抚+解释原料差异', '重做/代金券(20元)/退款', '反馈门店培训', '24h内联系'] } },
    ]
  },
  {
    id: 'cat-oem', name: 'OEM产品', icon: 'clock', count: 213,
    children: [
      { id: 'cat-oem-expired', name: 'OEM过期', count: 35, riskLevel: 'high', description: '包装食品超过保质期。实际应对：收集有效期图片→退款+代金券(10-20元)→反馈门店核查库存→升级负责人→24h内联系。', label: '食安问题/OEM/OEM过期', keywords: ['过期', '保质期'], compensation: 'L3', escalation: 'Level2',
        realPatterns: { solutions: ['重做方案', '创建工单', '补偿方案(10-20元)', '时效承诺', '退款请求'], voucherRange: '10-20元', callbackCommitment: '24h内', avgTurns: 20.0, realConversations: 35, chain: ['开场白', '信息收集(有效期+订单)', '安抚共情', '退款+代金券', '升级负责人核查', '24h联系'] } },
      { id: 'cat-oem-spoiled', name: 'OEM变质', count: 294, riskLevel: 'high', description: '保质期内发霉、涨袋、变质。实际应对：解释解冻机制(48h内食用)→补送+代金券(10-20元)+退款→反馈门店负责人→24h内联系。真实数据含OEM补充/OEM变质多个子场景。', label: '食安问题/OEM/OEM变质', keywords: ['发霉', '涨袋', '发酸', '腐坏', '解冻'], compensation: 'L3', escalation: 'Level2',
        realPatterns: { solutions: ['时效承诺', '补偿方案(10-20元)', '创建工单', '退款请求', '联系门店', '重做方案'], voucherRange: '10-20元', callbackCommitment: '24h内', avgTurns: 16.7, realConversations: 294, chain: ['开场白', '接入确认', '信息收集(订单号+手机号+图片)', '安抚+解释解冻机制', '补送/代金券(10-20元)/退款', '反馈门店负责人'] } },
    ]
  },
  {
    id: 'cat-non-fs', name: '非食安问题', icon: 'cup-soda', count: 312,
    children: [
      { id: 'cat-nfs-refund', name: '退款/配送', count: 85, riskLevel: 'low', description: '退款、配送延迟等非食安问题。实际应对：确认订单→解释退款需门店审核(24h内)→转对应专员处理。', label: '非食安问题', keywords: ['退款', '配送'], compensation: null, escalation: null,
        realPatterns: { solutions: ['退款记录(门店审核24h)', '转对应专员'], voucherRange: '无', callbackCommitment: '24h内', avgTurns: 12, realConversations: 85, chain: ['开场白', '确认订单', '解释退款流程', '转专员/门店处理'] } },
      { id: 'cat-nfs-member', name: '会员/优惠券', count: 72, riskLevel: 'low', description: '会员等级、优惠券使用等问题。实际应对：确认会员手机号→查询权益→解释规则→协助使用。', label: '非食安问题', keywords: ['会员', '优惠券'], compensation: null, escalation: null,
        realPatterns: { solutions: ['查询权益', '解释规则'], voucherRange: '无', callbackCommitment: '无', avgTurns: 10, realConversations: 72, chain: ['开场白', '确认会员手机号', '查询权益', '解释/协助'] } },
      { id: 'cat-nfs-taste', name: '口感偏好', count: 68, riskLevel: 'low', description: '口感偏甜偏淡、冰量、少料等口味偏好。实际应对：解释原料差异和手工制作特点→不满意重做服务→或代金券(10-15元)换购。', label: '非食安问题', keywords: ['太甜', '太淡', '冰多', '少料'], compensation: null, escalation: null,
        realPatterns: { solutions: ['重做方案', '代金券(10-15元)', '解释原料差异'], voucherRange: '10-15元', callbackCommitment: '无', avgTurns: 12, realConversations: 68, chain: ['开场白', '安抚+解释原料差异', '重做/代金券换购'] } },
      { id: 'cat-nfs-activity', name: '活动咨询', count: 87, riskLevel: 'low', description: '买一送一、升杯、团餐等活动咨询。实际应对：查询活动规则→解释适用范围→协助参与。', label: '非食安问题', keywords: ['买一送一', '升杯', '活动'], compensation: null, escalation: null,
        realPatterns: { solutions: ['查询规则', '解释适用范围'], voucherRange: '无', callbackCommitment: '无', avgTurns: 10, realConversations: 87, chain: ['开场白', '查询活动', '解释规则', '协助参与'] } },
    ]
  },
]

// ═══════════════════════════════════════════════════════
// 七鱼平台会话队列 (含 AIQC_V2 工作流输入与输出)
// ═══════════════════════════════════════════════════════
export const MOCK_SESSIONS = [
  {
    sessionId: 'sess-001',
    session_state: 'active',
    queue_position: 0,
    estimated_wait_seconds: 0,
    channel: 'online',
    agent_name: '阿喜AI',
    priority: 'normal',
    risk_level: 'medium',
    classification: '食安问题/外源性异物/毛发',
    handler: 'AI',
    turn_count: 4,
    duration_seconds: 180,
    sla_status: 'normal',
    ticket_ids: ['tk-store-001'],
    cozeInputs: {
      CONTENT_INPUT: '顾客：你好，我刚买的多肉芒芒里面有一根头发，怎么处理？\n客服：饮品中出现毛发实在太不应该了，给您带来不好的体验真的非常抱歉。阿喜全力帮您解决，也会安排门店排查原因。非常抱歉给您带来不好的体验，为了更好地帮您处理，麻烦您提供下单手机号或订单编号，以及饮品+标签同框照片，阿喜马上为您核实。\n顾客：手机号13812345678，图片发你\n客服：感谢您提供的信息，阿喜正在为您核实订单。为了弥补这次的不好体验，阿喜为您申请了以下补偿方案：1.全额退款28元，原路退回；2.额外30元代金券到您的账户；3.店长会在12小时内致电致歉。您看这样可以吗？',
      CONVERSATION_ID: 'sess-001',
      AGENT_NAME: '阿喜AI',
      CUSTOMER_NAME: '张**',
      CUSTOMER_TP: '普通顾客',
      CUSTOMER_PHONE: '13812345678',
      TK_INPUT: '',
      TK_ID: 'tk-store-001',
      TK_TP: '门店工单',
      CategoryLabel: '食安问题/外源性异物/毛发',
      Order: 'H12573320260608001',
      Store: '南山科技园店',
      product: '多肉芒芒',
      START_TIME: '2026-06-08 10:25:00',
      SM: 'normal',
      SOP: 'v2.1',
      HAS_NOT_TOPPED: 'false',
      OT: '2026-06-08 10:20:00',
      CSAT: '',
    },
    workflowResult: {
      sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
      sq2: '',
      sq3: '订单号：H12573320260608001；订单状态：已收到；订单日期：当天；对话时间：21点前；门店：南山科技园店；产品名称：多肉芒芒',
      qc1: '达标',
      qc2: '',
      sqm1: '达标',
      sqm2: '',
      is_violate: false,
      violation_type: '',
      violation_behavior: '',
      violation_quote: '',
      cont_js: '顾客反馈饮品中发现毛发，客服第一时间表达歉意并安抚，索要订单信息和图片后核实，给出L2补偿方案（全额退款+30元代金券+门店12h联系），流程合规。',
      reasoning_content: '客服在首轮即表达歉意和共情，准确理解顾客"异物"诉求，未答非所问。表达礼貌专业，无违禁词。安抚及时，在2回合内完成。方案符合L2标准，未越权承诺。',
    },
  },
  {
    sessionId: 'sess-002',
    session_state: 'active',
    queue_position: 0,
    estimated_wait_seconds: 0,
    channel: 'online',
    agent_name: '阿喜AI',
    priority: 'high',
    risk_level: 'high',
    classification: '食安问题/身体不适/腹泻',
    handler: 'AI',
    turn_count: 3,
    duration_seconds: 240,
    sla_status: 'warning',
    ticket_ids: ['tk-esc-001', 'tk-ding-001'],
    cozeInputs: {
      CONTENT_INPUT: '顾客：昨天喝了你们的奶茶之后一直拉肚子，到现在还没好\n客服：对于您描述的情况阿喜非常重视，请问您目前有没有好转一些？如果仍感到不舒服，阿喜建议您及时就医。辛苦您提供一下方便的联系方式，阿喜马上通知地区负责人跟进，如果您需要陪同就医，也请您及时告知阿喜。\n顾客：好了一些但还是不舒服，手机号13987654321',
      CONVERSATION_ID: 'sess-002',
      AGENT_NAME: '阿喜AI',
      CUSTOMER_NAME: '李**',
      CUSTOMER_TP: '普通顾客',
      CUSTOMER_PHONE: '13987654321',
      TK_INPUT: '',
      TK_ID: 'tk-esc-001',
      TK_TP: '升级客诉',
      CategoryLabel: '食安问题/身体不适/腹泻',
      Order: 'H12573320260607015',
      Store: '福田中心城店',
      product: '芝芝绿妍茶后',
      START_TIME: '2026-06-08 09:10:00',
      SM: 'high',
      SOP: 'v2.1',
      HAS_NOT_TOPPED: 'false',
      OT: '2026-06-07 15:30:00',
      CSAT: '',
    },
    workflowResult: {
      sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
      sq2: '身体不适场景，需关注就医建议和地区负责人跟进',
      sq3: '订单号：H12573320260607015；订单状态：已完成；订单日期：前一天；对话时间：21点前；门店：福田中心城店；产品名称：芝芝绿妍茶后',
      qc1: '达标',
      qc2: '',
      sqm1: '达标',
      sqm2: '',
      is_violate: false,
      violation_type: '',
      violation_behavior: '',
      violation_quote: '',
      cont_js: '顾客反馈饮用后腹泻，客服首轮即表达重视并建议就医，索要联系方式通知地区负责人，触发Level2升级。流程合规，未承诺医疗费用。',
      reasoning_content: '客服准确识别身体不适场景，首轮表达重视和共情，建议就医但不主动承诺医疗费。索要联系方式以便地区负责人跟进，符合SOP流程。未出现越权承诺或红线行为。',
    },
  },
  {
    sessionId: 'sess-003',
    session_state: 'queue',
    queue_position: 2,
    estimated_wait_seconds: 45,
    channel: 'online',
    agent_name: null,
    priority: 'normal',
    risk_level: null,
    classification: null,
    handler: null,
    turn_count: 0,
    duration_seconds: 0,
    sla_status: 'normal',
    ticket_ids: [],
    cozeInputs: null,
    workflowResult: null,
  },
  {
    sessionId: 'sess-004',
    session_state: 'handoff',
    queue_position: 0,
    estimated_wait_seconds: 0,
    channel: 'hotline',
    agent_name: '李婷(人工)',
    priority: 'high',
    risk_level: 'high',
    classification: '食安问题/外源性异物/金属',
    handler: '人工',
    turn_count: 7,
    duration_seconds: 420,
    sla_status: 'normal',
    ticket_ids: ['tk-esc-002', 'tk-qiyu-001'],
    cozeInputs: {
      CONTENT_INPUT: '顾客：天啊！我喝奶茶的时候嘴里被一个金属片划到了！\n客服：饮品中出现金属这绝对不应该发生，阿喜非常抱歉。请问您有没有受伤或身体不舒服？我们会立即安排门店排查，同时全力帮您处理。\n顾客：嘴唇被划了一道口子，有点出血！太离谱了我要投诉！\n客服：实在非常抱歉，还请您消消气。阿喜完全理解您的心情，会马上为您跟进。',
      CONVERSATION_ID: 'sess-004',
      AGENT_NAME: '李婷',
      CUSTOMER_NAME: '陈**',
      CUSTOMER_TP: 'VIP顾客',
      CUSTOMER_PHONE: '13555556666',
      TK_INPUT: '',
      TK_ID: 'tk-esc-002',
      TK_TP: '升级客诉',
      CategoryLabel: '食安问题/外源性异物/金属',
      Order: 'H12573320260607022',
      Store: '宝安海雅缤纷城',
      product: '纯绿妍茶后',
      START_TIME: '2026-06-07 14:15:00',
      SM: 'high',
      SOP: 'v2.1',
      HAS_NOT_TOPPED: 'false',
      OT: '2026-06-07 14:00:00',
      CSAT: '',
    },
    workflowResult: {
      sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
      sq2: '高危异物+身体受伤+情绪激动，已触发Level3升级',
      sq3: '订单号：H12573320260607022；订单状态：已收到；订单日期：当天；对话时间：21点前；门店：宝安海雅缤纷城；产品名称：纯绿妍茶后',
      qc1: '达标',
      qc2: '',
      sqm1: '达标',
      sqm2: '',
      is_violate: false,
      violation_type: '',
      violation_behavior: '',
      violation_quote: '',
      cont_js: '顾客反馈金属异物划伤嘴唇，客服首轮即表达歉意并询问伤情。顾客情绪激动后客服先安抚再处理。触发Level3升级转人工，流程合规。',
      reasoning_content: '客服准确识别高危异物场景，首轮关注伤情。顾客情绪激动时优先安抚（情绪视盲检测通过），未出现争论或推诿。及时升级至Level3转人工处理，符合SOP。',
    },
  },
  {
    sessionId: 'sess-005',
    session_state: 'active',
    queue_position: 0,
    estimated_wait_seconds: 0,
    channel: 'online',
    agent_name: '阿喜AI',
    priority: 'normal',
    risk_level: 'low',
    classification: '食安问题/内源性异物/果核',
    handler: 'AI',
    turn_count: 5,
    duration_seconds: 150,
    sla_status: 'normal',
    ticket_ids: [],
    cozeInputs: {
      CONTENT_INPUT: '顾客：多肉芒芒里面有一个芒果核，正常吗？\n客服：给您带来不好的体验很抱歉。多肉芒芒使用的是新鲜芒果，偶尔可能会有少量果核残留，但我们应该做得更好，阿喜来帮您处理。\n客服：为了弥补这次的不好体验，阿喜可以为您安排重做一杯，或者给您一张20元代金券，您看哪种方式更方便？\n顾客：重做一杯吧\n客服：好的，阿喜已为您安排重做一杯多肉芒芒，门店伙伴会尽快制作。感谢您的理解和包容，还有其他可以帮您的吗？',
      CONVERSATION_ID: 'sess-005',
      AGENT_NAME: '阿喜AI',
      CUSTOMER_NAME: '赵**',
      CUSTOMER_TP: '普通顾客',
      CUSTOMER_PHONE: '13700001111',
      TK_INPUT: '',
      TK_ID: '',
      TK_TP: '',
      CategoryLabel: '食安问题/内源性异物/果核',
      Order: 'H12573320260607030',
      Store: '罗湖万象城店',
      product: '多肉芒芒',
      START_TIME: '2026-06-07 15:55:00',
      SM: 'normal',
      SOP: 'v2.1',
      HAS_NOT_TOPPED: 'false',
      OT: '2026-06-07 15:40:00',
      CSAT: '5',
    },
    workflowResult: {
      sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
      sq2: '',
      sq3: '订单号：H12573320260607030；订单状态：已收到；订单日期：当天；对话时间：21点前；门店：罗湖万象城店；产品名称：多肉芒芒',
      qc1: '达标',
      qc2: '',
      sqm1: '达标',
      sqm2: '',
      is_violate: false,
      violation_type: '',
      violation_behavior: '',
      violation_quote: '',
      cont_js: '顾客反馈果核问题（内源性异物），客服表达歉意后解释原料特性，提供L1方案（重做或20元代金券），顾客选择重做。流程合规，处理得当。',
      reasoning_content: '客服正确识别为内源性异物，解释合理（新鲜芒果可能有果核残留），先表达歉意再解释，未推诿。L1方案符合标准，顾客满意度5分。',
    },
  },
  {
    sessionId: 'sess-006',
    session_state: 'resolved',
    queue_position: 0,
    estimated_wait_seconds: 0,
    channel: 'online',
    agent_name: '阿喜AI',
    priority: 'normal',
    risk_level: 'medium',
    classification: '食安问题/饮品异味',
    handler: 'AI',
    turn_count: 6,
    duration_seconds: 300,
    sla_status: 'normal',
    ticket_ids: ['tk-store-002'],
    cozeInputs: {
      CONTENT_INPUT: '顾客：今天买的绿妍轻柠茶喝起来有一股酸臭味，跟之前喝的完全不一样\n客服：非常抱歉给您带来不好的体验。饮品出现异味阿喜非常重视，为了更好地帮您处理，麻烦您提供下单手机号或订单编号，阿喜马上为您核实。\n顾客：手机号13699998888\n客服：感谢您提供的信息。为了弥补这次的不好体验，阿喜为您申请了以下补偿方案：1.全额退款25元，原路退回；2.额外50元代金券到您的账户；3.店长会在4小时内致电致歉，并紧急排查该批次原料。您看这样可以吗？\n顾客：可以\n客服：感谢您的理解，退款和优惠券会按方案时效处理，门店伙伴也会继续跟进。我们一定认真排查整改，还有其他可以帮您的吗？',
      CONVERSATION_ID: 'sess-006',
      AGENT_NAME: '阿喜AI',
      CUSTOMER_NAME: '周**',
      CUSTOMER_TP: '普通顾客',
      CUSTOMER_PHONE: '13699998888',
      TK_INPUT: '',
      TK_ID: 'tk-store-002',
      TK_TP: '门店工单',
      CategoryLabel: '食安问题/饮品异味',
      Order: 'H12573320260606018',
      Store: '海岸城店',
      product: '绿妍轻柠茶',
      START_TIME: '2026-06-06 16:00:00',
      SM: 'normal',
      SOP: 'v2.1',
      HAS_NOT_TOPPED: 'false',
      OT: '2026-06-06 15:45:00',
      CSAT: '4',
    },
    workflowResult: {
      sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
      sq2: '',
      sq3: '订单号：H12573320260606018；订单状态：已收到；订单日期：当天；对话时间：21点前；门店：海岸城店；产品名称：绿妍轻柠茶',
      qc1: '达标',
      qc2: '',
      sqm1: '达标',
      sqm2: '',
      is_violate: false,
      violation_type: '',
      violation_behavior: '',
      violation_quote: '',
      cont_js: '顾客反馈饮品异味，客服首轮表达歉意并索要订单信息，核实后给出L3方案（全额退款+50元代金券+4h致电+紧急排查），顾客接受。流程合规。',
      reasoning_content: '客服准确识别异味场景，首轮安抚到位，索要信息后按L3标准出方案。表达专业有温度，无违禁词或红线行为。顾客接受方案，CSAT 4分。',
    },
  },
  {
    sessionId: 'sess-007',
    session_state: 'active',
    queue_position: 0,
    estimated_wait_seconds: 0,
    channel: 'online',
    agent_name: '阿喜AI',
    priority: 'high',
    risk_level: 'high',
    classification: '食安问题/OEM/OEM变质',
    handler: 'AI',
    turn_count: 4,
    duration_seconds: 200,
    sla_status: 'warning',
    ticket_ids: ['tk-esc-003'],
    cozeInputs: {
      CONTENT_INPUT: '顾客：昨天买的爆芋泥蛋糕，还没过期呢，打开发现已经发霉发酸了\n客服：非常抱歉给您带来不好的体验。蛋糕出现发霉发酸的情况阿喜非常重视，为了更好地帮您处理，麻烦您提供下单手机号或订单编号，以及蛋糕+包装标签同框照片，阿喜马上为您核实。\n顾客：手机号13611112222，图片在这里\n客服：感谢您提供的信息和照片。阿喜已为您创建紧急工单，会安排门店紧急排查该批次产品。为了弥补这次的不好体验，阿喜为您申请了以下补偿方案：1.全额退款35元，原路退回；2.额外50元代金券到您的账户；3.店长会在4小时内致电致歉。您看这样可以吗？',
      CONVERSATION_ID: 'sess-007',
      AGENT_NAME: '阿喜AI',
      CUSTOMER_NAME: '吴**',
      CUSTOMER_TP: '普通顾客',
      CUSTOMER_PHONE: '13611112222',
      TK_INPUT: '',
      TK_ID: 'tk-esc-003',
      TK_TP: '升级客诉',
      CategoryLabel: '食安问题/OEM/OEM变质',
      Order: 'H12573320260605042',
      Store: '万象城店',
      product: '爆芋泥蛋糕',
      START_TIME: '2026-06-06 11:25:00',
      SM: 'high',
      SOP: 'v2.1',
      HAS_NOT_TOPPED: 'false',
      OT: '2026-06-05 18:30:00',
      CSAT: '',
    },
    workflowResult: {
      sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
      sq2: 'OEM产品变质，需紧急排查批次库存',
      sq3: '订单号：H12573320260605042；订单状态：已完成；订单日期：前一天；对话时间：21点前；门店：万象城店；产品名称：爆芋泥蛋糕',
      qc1: '达标',
      qc2: '',
      sqm1: '达标',
      sqm2: '',
      is_violate: false,
      violation_type: '',
      violation_behavior: '',
      violation_quote: '',
      cont_js: '顾客反馈OEM产品（蛋糕）发霉发酸，客服首轮表达歉意并索要订单信息和图片，核实后给出L3方案+紧急排查批次通知。流程合规。',
      reasoning_content: '客服正确识别OEM变质场景，索要信息和图片后按L3标准出方案，并触发紧急批次排查。表达专业，安抚及时，未出现红线行为。',
    },
  },
  {
    sessionId: 'sess-008',
    session_state: 'closed',
    queue_position: 0,
    estimated_wait_seconds: 0,
    channel: 'online',
    agent_name: '阿喜AI',
    priority: 'low',
    risk_level: 'low',
    classification: '非食安问题',
    handler: 'AI',
    turn_count: 3,
    duration_seconds: 90,
    sla_status: 'normal',
    ticket_ids: [],
    cozeInputs: {
      CONTENT_INPUT: '顾客：请问你们最近有买一送一的活动吗？\n客服：您好，感谢您对喜茶的关注。目前部分门店有限时升杯活动，具体活动信息您可以在小程序首页查看。如果有其他问题，阿喜随时为您服务。\n顾客：好的谢谢',
      CONVERSATION_ID: 'sess-008',
      AGENT_NAME: '阿喜AI',
      CUSTOMER_NAME: '孙**',
      CUSTOMER_TP: '普通顾客',
      CUSTOMER_PHONE: '',
      TK_INPUT: '',
      TK_ID: '',
      TK_TP: '',
      CategoryLabel: '非食安问题',
      Order: '',
      Store: '',
      product: '',
      START_TIME: '2026-06-08 08:30:00',
      SM: 'normal',
      SOP: 'v2.1',
      HAS_NOT_TOPPED: 'false',
      OT: '',
      CSAT: '5',
    },
    workflowResult: {
      sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
      sq2: '',
      sq3: '非食安场景，无订单信息',
      qc1: '达标',
      qc2: '非食安问题-活动咨询',
      sqm1: '达标',
      sqm2: '',
      is_violate: false,
      violation_type: '',
      violation_behavior: '',
      violation_quote: '',
      cont_js: '顾客咨询活动信息，客服准确引导至小程序查看，表达礼貌专业。非食安场景，流程合规。',
      reasoning_content: '客服准确理解顾客咨询意图（活动咨询），引导至正确渠道。表达礼貌有温度，无违禁词。非食安场景无需安抚和补偿方案。',
    },
  },
]

// ═══════════════════════════════════════════════════════
// 对话列表 (Sidebar 展示 — 含 AIQC_V2 workflowResult)
// ═══════════════════════════════════════════════════════
export const MOCK_CONVERSATIONS = [
  {
    id: 'conv-001', title: '饮品中发现头发', lastMessage: '阿喜全力帮您解决，也会安排门店排查原因',
    timestamp: new Date('2026-06-08T10:30:00'), label: '外源性异物/毛发', riskLevel: 'medium',
    session_state: 'active', handler: 'AI', turn_count: 4, sla_status: 'normal',
    classification: { consult_type: '食安问题/外源性异物/毛发', confidence: 0.91, risk_level: 'medium', need_human_review: false },
    messages: [
      { id: 'm-001-1', role: 'user', content: '你好，我刚买的多肉芒芒里面有一根头发，怎么处理？', timestamp: '2026-06-08T10:25:00' },
      {
        id: 'm-001-2', role: 'assistant', content: '饮品中出现毛发实在太不应该了，给您带来不好的体验真的非常抱歉。阿喜全力帮您解决，也会安排门店排查原因。', timestamp: '2026-06-08T10:25:30',
        workflowResult: {
          sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
          sq2: '',
          sq3: '订单号：H12573320260608001；门店：南山科技园店；产品：多肉芒芒',
          qc1: '达标', qc2: '', sqm1: '达标', sqm2: '',
          is_violate: false,
          cont_js: '首轮安抚+识别外源性异物',
          reasoning_content: '客服首轮即表达歉意和共情，准确理解异物诉求。',
        },
      },
      {
        id: 'm-001-3', role: 'assistant', content: '非常抱歉给您带来不好的体验，为了更好地帮您处理，麻烦您提供下单手机号或订单编号，以及饮品+标签同框照片，阿喜马上为您核实。', timestamp: '2026-06-08T10:26:00',
        workflowResult: {
          sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
          sq2: '', sq3: '', qc1: '达标', qc2: '', sqm1: '达标', sqm2: '',
          is_violate: false,
          cont_js: '三合一索要订单和图片',
          reasoning_content: '按SOP索要核实所需信息，表达礼貌。',
        },
      },
      { id: 'm-001-4', role: 'user', content: '手机号13812345678，图片发你', timestamp: '2026-06-08T10:28:00' },
      {
        id: 'm-001-5', role: 'assistant', content: '感谢您提供的信息，阿喜正在为您核实订单。为了弥补这次的不好体验，阿喜为您申请了以下补偿方案：\n1. 全额退款28元，原路退回\n2. 额外30元代金券到您的账户\n3. 店长会在12小时内致电致歉\n您看这样可以吗？', timestamp: '2026-06-08T10:29:00',
        workflowResult: {
          sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
          sq2: '', sq3: '订单号：H12573320260608001；订单状态：已收到；订单日期：当天；门店：南山科技园店；产品：多肉芒芒；金额：28元',
          qc1: '达标', qc2: '', sqm1: '达标', sqm2: '',
          is_violate: false,
          cont_js: '核实后给出L2方案',
          reasoning_content: 'L2补偿方案合规：全额退款+30元代金券+门店12h联系。',
        },
      },
    ]
  },
  {
    id: 'conv-002', title: '喝完一直拉肚子', lastMessage: '请问您目前有没有好转一些？建议及时就医',
    timestamp: new Date('2026-06-08T09:15:00'), label: '身体不适/腹泻', riskLevel: 'high',
    session_state: 'active', handler: 'AI', turn_count: 3, sla_status: 'warning',
    classification: { consult_type: '食安问题/身体不适/腹泻', confidence: 0.88, risk_level: 'high', need_human_review: true },
    messages: [
      { id: 'm-002-1', role: 'user', content: '昨天喝了你们的奶茶之后一直拉肚子，到现在还没好', timestamp: '2026-06-08T09:10:00' },
      {
        id: 'm-002-2', role: 'assistant', content: '对于您描述的情况阿喜非常重视，请问您目前有没有好转一些？如果仍感到不舒服，阿喜建议您及时就医。辛苦您提供一下方便的联系方式，阿喜马上通知地区负责人跟进，如果您需要陪同就医，也请您及时告知阿喜。', timestamp: '2026-06-08T09:11:00',
        workflowResult: {
          sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
          sq2: '身体不适场景，需关注就医建议和地区负责人跟进',
          sq3: '订单号：H12573320260607015；门店：福田中心城店；产品：芝芝绿妍茶后',
          qc1: '达标', qc2: '', sqm1: '达标', sqm2: '',
          is_violate: false,
          cont_js: '身体不适首轮：重视+就医建议+索要联系方式',
          reasoning_content: '准确识别身体不适场景，首轮表达重视和共情，建议就医但不承诺医疗费。',
        },
      },
      { id: 'm-002-3', role: 'system', content: '[系统] 已触发 Level2 升级通知，区域经理张明将在1小时内跟进', timestamp: '2026-06-08T09:12:00' },
      { id: 'm-002-4', role: 'user', content: '好了一些但还是不舒服，手机号13987654321', timestamp: '2026-06-08T09:14:00' },
    ]
  },
  {
    id: 'conv-003', title: '杯子里有金属片', lastMessage: '已升级客诉，总部品质部30分钟内响应',
    timestamp: new Date('2026-06-07T14:20:00'), label: '外源性异物/金属', riskLevel: 'high',
    session_state: 'handoff', handler: '人工', turn_count: 7, sla_status: 'normal',
    classification: { consult_type: '食安问题/外源性异物/金属', confidence: 0.95, risk_level: 'high', need_human_review: true },
    messages: [
      { id: 'm-003-1', role: 'user', content: '天啊！我喝奶茶的时候嘴里被一个金属片划到了！', timestamp: '2026-06-07T14:15:00' },
      {
        id: 'm-003-2', role: 'assistant', content: '饮品中出现金属这绝对不应该发生，阿喜非常抱歉。请问您有没有受伤或身体不舒服？我们会立即安排门店排查，同时全力帮您处理。', timestamp: '2026-06-07T14:15:30',
        workflowResult: {
          sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
          sq2: '高危异物场景，需确认伤情',
          sq3: '订单号：H12573320260607022；门店：宝安海雅缤纷城；产品：纯绿妍茶后',
          qc1: '达标', qc2: '', sqm1: '达标', sqm2: '',
          is_violate: false,
          cont_js: '高危异物首轮：歉意+询问伤情+排查承诺',
          reasoning_content: '准确识别高危异物，首轮关注伤情，表达歉意和重视。',
        },
      },
      { id: 'm-003-3', role: 'system', content: '[系统] 高风险会话，已触发 Level2 升级 + 钉钉强提醒区域经理', timestamp: '2026-06-07T14:16:00' },
      { id: 'm-003-4', role: 'user', content: '嘴唇被划了一道口子，有点出血！太离谱了我要投诉！', timestamp: '2026-06-07T14:17:00' },
      {
        id: 'm-003-5', role: 'assistant', content: '实在非常抱歉，还请您消消气。阿喜完全理解您的心情，会马上为您跟进。', timestamp: '2026-06-07T14:17:30',
        workflowResult: {
          sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
          sq2: '顾客情绪激动+受伤，优先安抚',
          sq3: '', qc1: '达标', qc2: '', sqm1: '达标', sqm2: '',
          is_violate: false,
          cont_js: '情绪急救安抚',
          reasoning_content: '顾客情绪激动时优先安抚，30字内简短回应，符合情绪急救规范。',
        },
      },
      { id: 'm-003-6', role: 'system', content: '[系统] 情绪激动+高危异物，已升级为 Level3 客诉，转接人工坐席', timestamp: '2026-06-07T14:18:00' },
    ]
  },
  {
    id: 'conv-004', title: '茶饮里有果核', lastMessage: '阿喜来帮您处理，可以为您安排重做',
    timestamp: new Date('2026-06-07T16:00:00'), label: '内源性异物/果核', riskLevel: 'low',
    session_state: 'resolved', handler: 'AI', turn_count: 5, sla_status: 'normal',
    classification: { consult_type: '食安问题/内源性异物/果核', confidence: 0.87, risk_level: 'low', need_human_review: false },
    messages: [
      { id: 'm-004-1', role: 'user', content: '多肉芒芒里面有一个芒果核，正常吗？', timestamp: '2026-06-07T15:55:00' },
      {
        id: 'm-004-2', role: 'assistant', content: '给您带来不好的体验很抱歉。多肉芒芒使用的是新鲜芒果，偶尔可能会有少量果核残留，但我们应该做得更好，阿喜来帮您处理。', timestamp: '2026-06-07T15:55:30',
        workflowResult: {
          sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
          sq2: '', sq3: '门店：罗湖万象城店；产品：多肉芒芒',
          qc1: '达标', qc2: '', sqm1: '达标', sqm2: '',
          is_violate: false,
          cont_js: '内源性异物：歉意+解释+主动处理',
          reasoning_content: '正确识别内源性异物，解释合理，先歉意再解释。',
        },
      },
      {
        id: 'm-004-3', role: 'assistant', content: '为了弥补这次的不好体验，阿喜可以为您安排重做一杯，或者给您一张20元代金券，您看哪种方式更方便？', timestamp: '2026-06-07T15:56:00',
        workflowResult: {
          sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
          sq2: '', sq3: '', qc1: '达标', qc2: '', sqm1: '达标', sqm2: '',
          is_violate: false,
          cont_js: 'L1方案：重做或20元代金券',
          reasoning_content: 'L1补偿方案合规，提供两种选择让顾客决定。',
        },
      },
      { id: 'm-004-4', role: 'user', content: '重做一杯吧', timestamp: '2026-06-07T15:58:00' },
      {
        id: 'm-004-5', role: 'assistant', content: '好的，阿喜已为您安排重做一杯多肉芒芒，门店伙伴会尽快制作。感谢您的理解和包容，还有其他可以帮您的吗？', timestamp: '2026-06-07T15:58:30',
        workflowResult: {
          sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
          sq2: '', sq3: '', qc1: '达标', qc2: '', sqm1: '达标', sqm2: '',
          is_violate: false,
          cont_js: '确认方案+收尾',
          reasoning_content: '确认顾客选择，友好收尾。',
        },
      },
    ]
  },
  {
    id: 'conv-005', title: '蛋糕打开已经发霉', lastMessage: '非常重视，已紧急排查批次',
    timestamp: new Date('2026-06-06T11:30:00'), label: 'OEM/OEM变质', riskLevel: 'high',
    session_state: 'active', handler: 'AI', turn_count: 4, sla_status: 'normal',
    classification: { consult_type: '食安问题/OEM/OEM变质', confidence: 0.83, risk_level: 'high', need_human_review: true },
    messages: [
      { id: 'm-005-1', role: 'user', content: '昨天买的爆芋泥蛋糕，还没过期呢，打开发现已经发霉发酸了', timestamp: '2026-06-06T11:25:00' },
      {
        id: 'm-005-2', role: 'assistant', content: '非常抱歉给您带来不好的体验。蛋糕出现发霉发酸的情况阿喜非常重视，为了更好地帮您处理，麻烦您提供下单手机号或订单编号，以及蛋糕+包装标签同框照片，阿喜马上为您核实。', timestamp: '2026-06-06T11:26:00',
        workflowResult: {
          sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
          sq2: 'OEM产品变质，需索要订单和图片',
          sq3: '门店：万象城店；产品：爆芋泥蛋糕',
          qc1: '达标', qc2: '', sqm1: '达标', sqm2: '',
          is_violate: false,
          cont_js: 'OEM变质首轮：歉意+索要信息',
          reasoning_content: '正确识别OEM变质场景，首轮安抚并索要核实信息。',
        },
      },
      { id: 'm-005-3', role: 'user', content: '手机号13611112222，图片在这里', timestamp: '2026-06-06T11:28:00' },
      { id: 'm-005-4', role: 'system', content: '[系统] 已创建门店工单+紧急排查批次通知', timestamp: '2026-06-06T11:29:00' },
    ]
  },
  {
    id: 'conv-006', title: '太离谱了要曝光', lastMessage: '阿喜完全理解您的心情',
    timestamp: new Date('2026-06-08T08:45:00'), label: '情绪激动', riskLevel: 'high',
    session_state: 'active', handler: 'AI', turn_count: 2, sla_status: 'normal',
    classification: { consult_type: '食安问题/外源性异物/苍蝇或蟑螂', confidence: 0.76, risk_level: 'high', need_human_review: true },
    messages: [
      { id: 'm-006-1', role: 'user', content: '太离谱了！！奶茶里面有只苍蝇！！我要曝光你们！！', timestamp: '2026-06-08T08:40:00' },
      {
        id: 'm-006-2', role: 'assistant', content: '实在非常抱歉，还请您消消气。阿喜完全理解您的心情，会马上为您跟进。', timestamp: '2026-06-08T08:41:00',
        workflowResult: {
          sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
          sq2: '情绪激动+高危异物（苍蝇），优先安抚',
          sq3: '',
          qc1: '达标', qc2: '', sqm1: '达标', sqm2: '',
          is_violate: false,
          cont_js: '情绪急救安抚，30字内',
          reasoning_content: '顾客情绪极度激动，优先安抚。回复30字内，符合情绪急救规范。安抚技巧通过（无情绪视盲）。',
        },
      },
    ]
  },
]

export const QUICK_PROMPTS = [
  { icon: 'bug', text: '饮品里有异物', description: '头发、虫子、塑料、金属等' },
  { icon: 'alert-triangle', text: '饮品味道不对', description: '异味、变质、过期' },
  { icon: 'heart-pulse', text: '喝了身体不舒服', description: '腹泻、过敏、呕吐' },
  { icon: 'package', text: '包装食品问题', description: '蛋糕、瓶装、OEM产品' },
  { icon: 'coffee', text: '推荐一下新品', description: '当季热门饮品推荐' },
  { icon: 'map-pin', text: '附近门店查询', description: '门店地址、营业时间' },
  { icon: 'ticket', text: '会员积分/优惠券', description: '会员权益、优惠券使用' },
  { icon: 'shopping-bag', text: '查一下我的订单', description: '订单状态、催单、退款' },
]

// ═══════════════════════════════════════════════════════
// 看板指标 (含 AIQC_V2 质检指标)
// ═══════════════════════════════════════════════════════
export const DASHBOARD_METRICS = {
  todayConversations: 127,
  todayConversationsDelta: 12,
  highRiskAlerts: 3,
  highRiskAlertsDelta: -2,
  avgResponseTime: '2分18秒',
  avgResponseTimeDelta: -15,
  resolutionRate: '94.2%',
  resolutionRateDelta: 1.8,
  // Agent 运营指标
  aiAutoRate: '78.5%',
  humanReviewRate: '18.3%',
  slaComplianceRate: '96.1%',
  avgQualityScore: 87.5,
  avgResolutionMinutes: 8.5,
  // AIQC_V2 质检指标
  qcPassRate: {
    understanding: '96.8%',
    expression: '94.2%',
    comfort: '91.5%',
    proactiveness: '93.1%',
    overall: '92.4%',
  },
  bizProcessPassRate: '95.7%',
  classifyAccuracy: '91.3%',
  redlineViolationCount: 2,
  redlineViolationRate: '1.6%',
}

export const CATEGORY_DISTRIBUTION = [
  { name: '外源性异物', value: 693, color: '#cf2d56' },
  { name: '内源性异物', value: 359, color: '#9fc9a2' },
  { name: '饮品异味', value: 95, color: '#c08532' },
  { name: '身体不适', value: 215, color: '#9fbbe0' },
  { name: '原料/OEM问题', value: 223, color: '#c0a8dd' },
  { name: '非食安问题', value: 312, color: '#dfa88f' },
]

export const TREND_DATA = [
  { date: '06-04', total: 98, ai_resolved: 72, human_review: 18, escalated: 8, redline_alerts: 1, qc_failures: 4, biz_violations: 2 },
  { date: '06-05', total: 112, ai_resolved: 85, human_review: 20, escalated: 7, redline_alerts: 0, qc_failures: 6, biz_violations: 3 },
  { date: '06-06', total: 105, ai_resolved: 80, human_review: 17, escalated: 8, redline_alerts: 1, qc_failures: 5, biz_violations: 1 },
  { date: '06-07', total: 134, ai_resolved: 104, human_review: 22, escalated: 8, redline_alerts: 0, qc_failures: 7, biz_violations: 2 },
  { date: '06-08', total: 127, ai_resolved: 99, human_review: 21, escalated: 7, redline_alerts: 2, qc_failures: 3, biz_violations: 1 },
]

export const LIVE_CONVERSATIONS = [
  {
    id: 'lc-001', user: '张**', store: '南山科技园店', label: '外源性异物/毛发', risk: 'medium',
    duration: '3分钟', messages: 4, classification: '食安问题/外源性异物/毛发',
    currentNode: '结案', modelUsed: '豆包·1.6·极致速度', session_state: 'active',
  },
  {
    id: 'lc-002', user: '李**', store: '福田中心城店', label: '身体不适/腹泻', risk: 'high',
    duration: '5分钟', messages: 4, classification: '食安问题/身体不适/腹泻',
    currentNode: '红线行为检测', modelUsed: '豆包·1.5·Lite·32k', session_state: 'active',
  },
  {
    id: 'lc-003', user: '王**', store: '宝安海雅缤纷城', label: '饮品异味', risk: 'medium',
    duration: '2分钟', messages: 3, classification: '食安问题/饮品异味',
    currentNode: '对话解构+服务分析', modelUsed: '豆包·1.8·深度思考', session_state: 'active',
  },
  {
    id: 'lc-004', user: '陈**', store: '罗湖万象城店', label: '内源性异物/果核', risk: 'low',
    duration: '1分钟', messages: 5, classification: '食安问题/内源性异物/果核',
    currentNode: '结案', modelUsed: null, session_state: 'resolved',
  },
]

export const TICKET_QUEUE = [
  { id: 'tk-001', title: '苍蝇异物-科技园店', priority: 'high', assignee: '待分配', created: '10:25', sla: '1h', type: 'store_ticket', status: '待处理' },
  { id: 'tk-002', title: '腹泻-中心城店', priority: 'high', assignee: '区域经理张明', created: '09:15', sla: '1h', type: 'escalation', status: '处理中' },
  { id: 'tk-003', title: '金属异物-海雅店', priority: 'high', assignee: '总部品质部', created: '昨天', sla: '30min', type: 'customer_complaint', status: '处理中' },
  { id: 'tk-004', title: 'OEM变质-万象城店', priority: 'medium', assignee: '刘主管', created: '昨天', sla: '4h', type: 'store_ticket', status: '门店确认' },
  { id: 'tk-005', title: '果核-海岸城店', priority: 'low', assignee: '已处理', created: '前天', sla: '-', type: 'store_ticket', status: '已解决' },
]

// ═══════════════════════════════════════════════════════
// AIQC_V2 工作流执行历史 (Workflow Execution Trace)
// ═══════════════════════════════════════════════════════
export const WORKFLOW_EXECUTION_HISTORY = [
  {
    sessionId: 'sess-001',
    executedAt: '2026-06-08T10:30:00',
    totalDuration_ms: 5320,
    status: 'completed',
    nodes: [
      { id: 'start', name: '开始', type: 'input', status: 'completed', duration_ms: 5 },
      {
        id: 'dialogue_deconstruct', name: '对话解构+服务分析', type: 'llm', model: '豆包·1.8·深度思考', status: 'completed', duration_ms: 3200,
        outputs: {
          to_block5_scene: '外源性异物-毛发-标准场景',
          to_block6_issue: '顾客反馈饮品中发现毛发',
          process_trace: '首轮安抚→索要信息→核实→出方案',
          cont_js: '顾客反馈饮品中发现毛发，客服第一时间表达歉意并安抚，索要订单信息和图片后核实，给出L2补偿方案（全额退款+30元代金券+门店12h联系），流程合规。',
          sq3: '订单号：H12573320260608001；订单状态：已收到；订单日期：当天；对话时间：21点前；门店：南山科技园店；产品名称：多肉芒芒',
          sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
          sq2: '',
          Dc_check: '通过',
        },
      },
      {
        id: 'biz_process', name: '工单操作专家', type: 'llm', model: '豆包·1.5·Lite·32k', status: 'completed', duration_ms: 800,
        outputs: {
          sqm1: '达标',
          sqm2: '',
        },
      },
      {
        id: 'classify_qc', name: '5.2对话分类质检专家', type: 'llm', model: '豆包·1.6·极致速度', status: 'completed', duration_ms: 600,
        outputs: {
          qc1: '达标',
          qc2: '',
        },
      },
      {
        id: 'redline_detect', name: '红线行为检测（风险控制）', type: 'llm', model: '豆包·1.5·Lite·32k', status: 'completed', duration_ms: 700,
        outputs: {
          is_violate: false,
          violation_type: '',
          violation_behavior: '',
          violation_quote: '',
        },
      },
      { id: 'redline_alert', name: '红线报警器', type: 'condition', status: 'completed', branch: '正常放行' },
      {
        id: 'conclusion', name: '结案', type: 'output', status: 'completed', duration_ms: 15,
        outputs: ['sq1', 'qc1', 'sqm1', 'is_violate', 'sq3', 'sq2', 'qc2', 'sqm2', 'cont_js', 'reasoning_content'],
      },
    ],
  },
  {
    sessionId: 'sess-002',
    executedAt: '2026-06-08T09:15:00',
    totalDuration_ms: 5810,
    status: 'completed',
    nodes: [
      { id: 'start', name: '开始', type: 'input', status: 'completed', duration_ms: 4 },
      {
        id: 'dialogue_deconstruct', name: '对话解构+服务分析', type: 'llm', model: '豆包·1.8·深度思考', status: 'completed', duration_ms: 3500,
        outputs: {
          to_block5_scene: '身体不适-腹泻-紧急场景',
          to_block6_issue: '顾客反馈饮用后腹泻未愈',
          process_trace: '首轮重视+就医建议→索要联系方式→触发Level2升级',
          cont_js: '顾客反馈饮用后腹泻，客服首轮即表达重视并建议就医，索要联系方式通知地区负责人，触发Level2升级。流程合规，未承诺医疗费用。',
          sq3: '订单号：H12573320260607015；订单状态：已完成；订单日期：前一天；对话时间：21点前；门店：福田中心城店；产品名称：芝芝绿妍茶后',
          sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
          sq2: '身体不适场景，需关注就医建议和地区负责人跟进',
          Dc_check: '通过',
        },
      },
      {
        id: 'biz_process', name: '工单操作专家', type: 'llm', model: '豆包·1.5·Lite·32k', status: 'completed', duration_ms: 850,
        outputs: {
          sqm1: '达标',
          sqm2: '',
        },
      },
      {
        id: 'classify_qc', name: '5.2对话分类质检专家', type: 'llm', model: '豆包·1.6·极致速度', status: 'completed', duration_ms: 580,
        outputs: {
          qc1: '达标',
          qc2: '',
        },
      },
      {
        id: 'redline_detect', name: '红线行为检测（风险控制）', type: 'llm', model: '豆包·1.5·Lite·32k', status: 'completed', duration_ms: 860,
        outputs: {
          is_violate: false,
          violation_type: '',
          violation_behavior: '',
          violation_quote: '',
        },
      },
      { id: 'redline_alert', name: '红线报警器', type: 'condition', status: 'completed', branch: '正常放行' },
      {
        id: 'conclusion', name: '结案', type: 'output', status: 'completed', duration_ms: 16,
        outputs: ['sq1', 'qc1', 'sqm1', 'is_violate', 'sq3', 'sq2', 'qc2', 'sqm2', 'cont_js', 'reasoning_content'],
      },
    ],
  },
  {
    sessionId: 'sess-004',
    executedAt: '2026-06-07T14:20:00',
    totalDuration_ms: 6150,
    status: 'completed',
    nodes: [
      { id: 'start', name: '开始', type: 'input', status: 'completed', duration_ms: 5 },
      {
        id: 'dialogue_deconstruct', name: '对话解构+服务分析', type: 'llm', model: '豆包·1.8·深度思考', status: 'completed', duration_ms: 3800,
        outputs: {
          to_block5_scene: '高危异物-金属-紧急升级场景',
          to_block6_issue: '顾客反馈金属片划伤嘴唇，情绪激动要求投诉',
          process_trace: '首轮歉意+伤情询问→顾客激动→安抚→Level3升级→转人工',
          cont_js: '顾客反馈金属异物划伤嘴唇，客服首轮即表达歉意并询问伤情。顾客情绪激动后客服先安抚再处理。触发Level3升级转人工，流程合规。',
          sq3: '订单号：H12573320260607022；订单状态：已收到；订单日期：当天；对话时间：21点前；门店：宝安海雅缤纷城；产品名称：纯绿妍茶后',
          sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
          sq2: '高危异物+身体受伤+情绪激动，已触发Level3升级',
          Dc_check: '通过',
        },
      },
      {
        id: 'biz_process', name: '工单操作专家', type: 'llm', model: '豆包·1.5·Lite·32k', status: 'completed', duration_ms: 900,
        outputs: {
          sqm1: '达标',
          sqm2: '',
        },
      },
      {
        id: 'classify_qc', name: '5.2对话分类质检专家', type: 'llm', model: '豆包·1.6·极致速度', status: 'completed', duration_ms: 620,
        outputs: {
          qc1: '达标',
          qc2: '',
        },
      },
      {
        id: 'redline_detect', name: '红线行为检测（风险控制）', type: 'llm', model: '豆包·1.5·Lite·32k', status: 'completed', duration_ms: 810,
        outputs: {
          is_violate: false,
          violation_type: '',
          violation_behavior: '',
          violation_quote: '',
        },
      },
      { id: 'redline_alert', name: '红线报警器', type: 'condition', status: 'completed', branch: '正常放行' },
      {
        id: 'conclusion', name: '结案', type: 'output', status: 'completed', duration_ms: 15,
        outputs: ['sq1', 'qc1', 'sqm1', 'is_violate', 'sq3', 'sq2', 'qc2', 'sqm2', 'cont_js', 'reasoning_content'],
      },
    ],
  },
  {
    sessionId: 'sess-007',
    executedAt: '2026-06-06T11:30:00',
    totalDuration_ms: 5480,
    status: 'completed',
    nodes: [
      { id: 'start', name: '开始', type: 'input', status: 'completed', duration_ms: 4 },
      {
        id: 'dialogue_deconstruct', name: '对话解构+服务分析', type: 'llm', model: '豆包·1.8·深度思考', status: 'completed', duration_ms: 3100,
        outputs: {
          to_block5_scene: 'OEM变质-蛋糕发霉-紧急排查场景',
          to_block6_issue: '顾客反馈OEM产品（蛋糕）保质期内发霉发酸',
          process_trace: '首轮歉意→索要订单和图片→核实→L3方案+紧急排查',
          cont_js: '顾客反馈OEM产品（蛋糕）发霉发酸，客服首轮表达歉意并索要订单信息和图片，核实后给出L3方案+紧急排查批次通知。流程合规。',
          sq3: '订单号：H12573320260605042；订单状态：已完成；订单日期：前一天；对话时间：21点前；门店：万象城店；产品名称：爆芋泥蛋糕',
          sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
          sq2: 'OEM产品变质，需紧急排查批次库存',
          Dc_check: '通过',
        },
      },
      {
        id: 'biz_process', name: '工单操作专家', type: 'llm', model: '豆包·1.5·Lite·32k', status: 'completed', duration_ms: 820,
        outputs: {
          sqm1: '达标',
          sqm2: '',
        },
      },
      {
        id: 'classify_qc', name: '5.2对话分类质检专家', type: 'llm', model: '豆包·1.6·极致速度', status: 'completed', duration_ms: 650,
        outputs: {
          qc1: '达标',
          qc2: '',
        },
      },
      {
        id: 'redline_detect', name: '红线行为检测（风险控制）', type: 'llm', model: '豆包·1.5·Lite·32k', status: 'completed', duration_ms: 890,
        outputs: {
          is_violate: false,
          violation_type: '',
          violation_behavior: '',
          violation_quote: '',
        },
      },
      { id: 'redline_alert', name: '红线报警器', type: 'condition', status: 'completed', branch: '正常放行' },
      {
        id: 'conclusion', name: '结案', type: 'output', status: 'completed', duration_ms: 16,
        outputs: ['sq1', 'qc1', 'sqm1', 'is_violate', 'sq3', 'sq2', 'qc2', 'sqm2', 'cont_js', 'reasoning_content'],
      },
    ],
  },
  {
    sessionId: 'sess-008',
    executedAt: '2026-06-08T08:32:00',
    totalDuration_ms: 4200,
    status: 'completed',
    nodes: [
      { id: 'start', name: '开始', type: 'input', status: 'completed', duration_ms: 3 },
      {
        id: 'dialogue_deconstruct', name: '对话解构+服务分析', type: 'llm', model: '豆包·1.8·深度思考', status: 'completed', duration_ms: 2500,
        outputs: {
          to_block5_scene: '非食安-活动咨询-简单引导场景',
          to_block6_issue: '顾客咨询买一送一活动信息',
          process_trace: '引导至小程序查看→礼貌收尾',
          cont_js: '顾客咨询活动信息，客服准确引导至小程序查看，表达礼貌专业。非食安场景，流程合规。',
          sq3: '非食安场景，无订单信息',
          sq1: '理解能力：达标\n表达能力：达标\n服务积极性：达标\n安抚技巧：达标',
          sq2: '',
          Dc_check: '通过',
        },
      },
      {
        id: 'biz_process', name: '工单操作专家', type: 'llm', model: '豆包·1.5·Lite·32k', status: 'completed', duration_ms: 650,
        outputs: {
          sqm1: '达标',
          sqm2: '',
        },
      },
      {
        id: 'classify_qc', name: '5.2对话分类质检专家', type: 'llm', model: '豆包·1.6·极致速度', status: 'completed', duration_ms: 480,
        outputs: {
          qc1: '达标',
          qc2: '非食安问题-活动咨询',
        },
      },
      {
        id: 'redline_detect', name: '红线行为检测（风险控制）', type: 'llm', model: '豆包·1.5·Lite·32k', status: 'completed', duration_ms: 560,
        outputs: {
          is_violate: false,
          violation_type: '',
          violation_behavior: '',
          violation_quote: '',
        },
      },
      { id: 'redline_alert', name: '红线报警器', type: 'condition', status: 'completed', branch: '正常放行' },
      {
        id: 'conclusion', name: '结案', type: 'output', status: 'completed', duration_ms: 7,
        outputs: ['sq1', 'qc1', 'sqm1', 'is_violate', 'sq3', 'sq2', 'qc2', 'sqm2', 'cont_js', 'reasoning_content'],
      },
    ],
  },
]

// ═══════════════════════════════════════════════════════
// Agent 引擎驱动的流式回复生成
// ═══════════════════════════════════════════════════════
export function generateStreamingResponse(query, session = {}) {
  try {
    const result = processMessage(query, session)
    if (result.reply) return result.reply
  } catch (e) {
    console.warn('Agent engine fallback:', e)
  }

  // 兜底回复
  const combined = query.toLowerCase()
  if (combined.includes('异物') || combined.includes('头发') || combined.includes('虫')) {
    return '饮品中出现异物实在太不应该了，给您带来不好的体验真的非常抱歉。阿喜全力帮您解决，也会安排门店排查原因。非常抱歉给您带来不好的体验，为了更好地帮您处理，麻烦您提供下单手机号或订单编号，以及饮品+标签同框照片，阿喜马上为您核实。'
  }
  if (combined.includes('不舒服') || combined.includes('拉肚子') || combined.includes('过敏') || combined.includes('呕吐')) {
    return '对于您描述的情况阿喜非常重视，请问您目前有没有好转一些？如果仍感到不舒服，阿喜建议您及时就医。辛苦您提供一下方便的联系方式，阿喜马上通知地区负责人跟进。'
  }
  if (combined.includes('变质') || combined.includes('过期') || combined.includes('发霉') || combined.includes('坏了')) {
    return '非常抱歉给您带来不好的体验。根据您的描述阿喜非常重视，为了更好地帮您处理，麻烦您提供下单手机号或订单编号，以及产品+包装标签同框照片，阿喜马上为您核实。'
  }
  return '阿喜已收到您的信息，正在为您核实处理，请稍等。'
}

// ═══════════════════════════════════════════════════════
// 客服订单处理工作流 Mock 数据
// ═══════════════════════════════════════════════════════

export const ORDER_MOCK_DB = [
  { order_id: 'ORD-20260608-001', status: '制作中', number: 3, product: '多肉芒芒', store: '南山科技园店', time: '14:05' },
  { order_id: 'ORD-20260608-002', status: '待取餐', number: 0, product: '芝芝莓莓', store: '福田中心城店', time: '13:50' },
  { order_id: 'ORD-20260608-003', status: '配送中', number: 0, product: '清爽芭乐提', store: '宝安海雅缤纷城', time: '13:30' },
  { order_id: 'ORD-20260608-004', status: '已完成', number: 0, product: '烤黑糖波波牛乳茶', store: '万象城店', time: '12:20' },
  { order_id: 'ORD-20260608-005', status: '制作中', number: 8, product: '纯绿妍茶后', store: '海岸城店', time: '14:15' },
  { order_id: 'ORD-20260608-006', status: '制作中', number: 2, product: '芝芝绿妍茶后', store: '深业上城店', time: '14:20' },
  { order_id: 'ORD-20260608-007', status: '配送中', number: 0, product: '拿铁+爆芋泥蛋糕', store: '龙华壹方城店', time: '13:45' },
  { order_id: 'ORD-20260608-008', status: '已完成', number: 0, product: '多肉葡萄x2', store: '前海壹方城店', time: '12:50' },
]

export const ORDER_WORKFLOW_SCENARIOS = [
  {
    id: 'scenario-1',
    scene: '不满足制作时效/未优先',
    userInput: '我的订单怎么还没好？等了快半小时了，能不能快点？',
    conversation: '顾客: 你好，我15分钟前下的单\n客服: 您好，请问您的订单号是？\n顾客: ORD-20260608-001',
    orderId: 'ORD-20260608-001',
    expectedReply: '非常抱歉让您久等了！您的订单 ORD-20260608-001 目前正在制作中，前方还有 3 单。我们已经为您加急处理，预计 5-8 分钟内可以完成。给您带来不便，真的非常抱歉！',
    compensate: false,
  },
  {
    id: 'scenario-2',
    scene: '没叫号',
    userInput: '我都到门店了怎么不叫号啊？',
    conversation: '顾客: 我到了，订单号ORD-20260608-002\n客服: 好的，请稍等',
    orderId: 'ORD-20260608-002',
    expectedReply: '您好！您的订单 ORD-20260608-002 已经准备好了，您可以直接到柜台报订单号取餐哦。如果前台暂时无人，请稍等片刻，马上会有伙伴为您服务。',
    compensate: false,
  },
  {
    id: 'scenario-3',
    scene: '叫号没完成',
    userInput: '叫号叫了半天了，饮品还没做好？',
    conversation: '顾客: 叫号了但是没拿到\n客服: 请问订单号是？\n顾客: ORD-20260608-005',
    orderId: 'ORD-20260608-005',
    expectedReply: '非常抱歉！您的订单 ORD-20260608-005 叫号后仍在制作中，当前前方还有 8 单。门店伙伴正在加紧制作，预计 3-5 分钟内完成。如等待超过15分钟，我们会为您优先制作。',
    compensate: true,
  },
  {
    id: 'scenario-4',
    scene: '超预计时间',
    userInput: '说好的30分钟送到，都超时了！',
    conversation: '顾客: 外卖什么时候到\n客服: 正在为您查询',
    orderId: 'ORD-20260608-003',
    expectedReply: '非常抱歉让您久等了！您的订单 ORD-20260608-003 目前正在配送中，骑手正在赶来的路上。因配送高峰期可能稍有延迟，请您再耐心等待几分钟。感谢您的理解！',
    compensate: false,
  },
  {
    id: 'scenario-5',
    scene: '其他',
    userInput: '我要转人工客服',
    conversation: '顾客: 你好\n客服: 您好，请问有什么可以帮您？',
    orderId: 'ORD-20260608-004',
    expectedReply: '阿喜已收到您的信息，正在为您处理中。如果您需要人工客服，请回复"转人工"。',
    compensate: false,
  },
  {
    id: 'scenario-6',
    scene: '退款退单',
    userInput: '我不想要了，帮我退款吧',
    conversation: '顾客: 你好，刚下的单不想要了\n客服: 请问您的订单号是？\n顾客: ORD-20260608-006',
    orderId: 'ORD-20260608-006',
    expectedReply: '非常抱歉！您的订单 ORD-20260608-006 目前还在制作中，阿喜可以帮您取消并安排全额退款，退款将原路退回，预计1-3个工作日到账。不过在退款之前，阿喜也可以为您安排重做一杯或者给您一张代金券，您看哪种方式更方便？',
    compensate: false,
  },
  {
    id: 'scenario-7',
    scene: '修改订单',
    userInput: '帮我改一下，去冰少糖',
    conversation: '顾客: 我刚才点的芝芝绿妍茶后能不能改一下\n客服: 好的，请问您想修改什么？\n顾客: 去冰少糖，谢谢',
    orderId: 'ORD-20260608-006',
    expectedReply: '非常抱歉，您的订单 ORD-20260608-006 正在制作中，可能无法直接修改。阿喜帮您联系门店看看是否可以调整，请稍等片刻。如果是加料或调整甜度等小改动，门店伙伴可以在出杯前帮您处理。',
    compensate: false,
  },
  {
    id: 'scenario-8',
    scene: '配送延迟',
    userInput: '外卖什么时候到啊？骑手在哪？',
    conversation: '顾客: 我的外卖还没到\n客服: 正在为您查询配送状态',
    orderId: 'ORD-20260608-007',
    expectedReply: '非常抱歉让您久等了！您的订单 ORD-20260608-007 目前正在配送中，骑手小哥正在赶来的路上。配送高峰期可能稍有延迟，请您再耐心等待几分钟。如果等待超过30分钟，阿喜为您申请一张5元代金券作为补偿。感谢您的理解！',
    compensate: false,
  },
  {
    id: 'scenario-9',
    scene: '包装破损',
    userInput: '外卖到了但是洒了一半，包装都破了',
    conversation: '顾客: 收到的外卖包装烂了\n客服: 非常抱歉，请问方便拍张照片吗？\n顾客: 图片发你了，你看洒了好多',
    orderId: 'ORD-20260608-008',
    expectedReply: '非常抱歉给您带来不好的体验！包装破损/撒漏实在不应该。为了方便阿喜帮您处理，麻烦您拍一张破损/撒漏的照片发过来。阿喜可以为您安排以下方案：\n1. 全额退款，原路退回\n2. 重新制作一杯并优先配送，同时改进打包方式\n您看哪种方式更方便？',
    compensate: true,
  },
]

// ═══════════════════════════════════════════════════════
// 统一意图分类体系 (7大类 · 覆盖订单处理5路+食安23类+预测场景)
// ═══════════════════════════════════════════════════════
export const UNIFIED_INTENT_TAXONOMY = [
  {
    id: 'A', name: '时效类', nameEn: 'Time & Urgency',
    description: '与等待时间、制作速度、配送时效相关的客诉',
    icon: 'Clock', color: '#e67e22',
    existingScenes: ['不满足制作时效/未优先', '超预计时间'],
    foodSafetyMapping: [],
    predictedScenes: [
      { id: 'A-p1', name: '预约时间冲突', triggerKeywords: ['预约', '约的时间', '提前', '改时间'], description: '顾客预约的取餐时间与实际不符', priority: 'medium', source: 'predicted' },
      { id: 'A-p2', name: '高峰期批量延迟', triggerKeywords: ['排队', '前面好多人', '太多人', '爆单'], description: '高峰期门店批量出杯延迟', priority: 'medium', source: 'predicted' },
    ],
    subcategories: [
      {
        id: 'A1', name: '催单催制',
        originalScene: '不满足制作时效/未优先',
        keywords: ['怎么还没好', '太慢了', '多久', '还要等', '制作', '优先', '等了很久', '加急', '催单'],
        description: '顾客反馈订单制作时间过长、未被优先处理',
        handlingFlow: '查订单状态→安抚+告知前方排队数→加急承诺→超时30min可补5元代金券',
        riskLevel: 'low',
        compensationRule: '等待超30分钟可给5元代金券',
        escalationRule: '无升级，客服直接处理',
        relatedFoodSafety: [],
      },
      {
        id: 'A2', name: '超预计时间',
        originalScene: '超预计时间',
        keywords: ['超时', '超预计', '预计时间', '比说的久', '说好', '超过了', '外卖还没到'],
        description: '订单超过预计送达/完成时间',
        handlingFlow: '查订单状态→骑手位置/制作进度→致歉+加急→超时24h未补偿可给10元代金券',
        riskLevel: 'low',
        compensationRule: '超时超24h且未补偿过可给10元代金券',
        escalationRule: '无升级，客服直接处理',
        relatedFoodSafety: [],
      },
    ],
  },
  {
    id: 'B', name: '取餐类', nameEn: 'Pickup & Call',
    description: '与门店叫号、取餐流程、取餐结果相关的客诉',
    icon: 'Bell', color: '#3498db',
    existingScenes: ['没叫号', '叫号没完成'],
    foodSafetyMapping: [],
    predictedScenes: [
      { id: 'B-p1', name: '取餐缺漏', triggerKeywords: ['少了', '漏了', '没给', '缺', '不全', '少一杯', '少料'], description: '取餐后发现有缺漏商品或配料', priority: 'medium', source: 'predicted' },
      { id: 'B-p2', name: '取错产品', triggerKeywords: ['拿错了', '不是我点的', '搞混了', '做错', '对不上'], description: '取到的产品与订单不符', priority: 'medium', source: 'predicted' },
      { id: 'B-p3', name: '自取/外卖渠道错配', triggerKeywords: ['外卖变自取', '自取变外卖', '渠道错了', '配送方式'], description: '订单取餐方式与顾客预期不符', priority: 'low', source: 'predicted' },
    ],
    subcategories: [
      {
        id: 'B1', name: '没叫号',
        originalScene: '没叫号',
        keywords: ['没叫号', '没有叫', '不叫号', '怎么没叫', '忘记叫号', '漏叫', '没人理'],
        description: '顾客到门店后没有被叫号取餐',
        handlingFlow: '确认到店→查订单状态→若待取餐通知前台→若前方无人建议直接柜台取',
        riskLevel: 'low',
        compensationRule: '一般无补偿',
        escalationRule: '订单异常时转人工',
        relatedFoodSafety: [],
      },
      {
        id: 'B2', name: '叫号没完成',
        originalScene: '叫号没完成',
        keywords: ['叫号没完成', '叫了没做', '叫号了但是', '叫了号没取', '叫号没取餐'],
        description: '叫号后饮品未完成制作或顾客未取到',
        handlingFlow: '确认叫号时间→查制作状态→若排队>5告知出杯压力→超15min承诺优先制作',
        riskLevel: 'low',
        compensationRule: '等待超15分钟可承诺优先制作',
        escalationRule: '无升级，客服直接处理',
        relatedFoodSafety: [],
      },
    ],
  },
  {
    id: 'C', name: '食安类', nameEn: 'Food Safety',
    description: '与食品安全、异物、身体不适、原料品质相关的客诉（已映射全部23个食安子分类）',
    icon: 'ShieldAlert', color: '#e74c3c',
    existingScenes: [],
    foodSafetyMapping: ['外源性异物(8类)', '内源性异物(5类)', '身体不适(4类)', '原料变质', '原料未熟', '饮品异味', '产品有效期', 'OEM过期', 'OEM变质'],
    predictedScenes: [
      { id: 'C-p1', name: '交叉过敏原', triggerKeywords: ['过敏原', '花生', '乳糖', '麸质', '成分表', '过敏提示'], description: '产品未标注过敏原导致顾客过敏', priority: 'high', source: 'predicted' },
      { id: 'C-p2', name: '包装食品安全', triggerKeywords: ['密封', '胀包', '漏气', '包装膨胀', '真空失效'], description: '包装食品/饮品密封失效导致变质风险', priority: 'high', source: 'predicted' },
      { id: 'C-p3', name: '冷链断链', triggerKeywords: ['化了', '不冰', '常温的', '没冷藏', '化了又冻'], description: '冷链产品运输/存储温度异常', priority: 'high', source: 'predicted' },
      { id: 'C-p4', name: '饮品颜色/性状异常', triggerKeywords: ['颜色不对', '分层', '结块', '沉淀', '浑浊'], description: '饮品出现非预期的颜色或物理性状变化', priority: 'medium', source: 'predicted' },
      { id: 'C-p5', name: '多人不适(群体)', triggerKeywords: ['一起喝的', '同事也', '朋友也', '几个人都', '都拉肚子'], description: '多人饮用同批次产品后出现不适', priority: 'critical', source: 'predicted' },
    ],
    subcategories: [
      {
        id: 'C1', name: '外源性异物',
        foodSafetyLabels: ['毛发', '虫类', '苍蝇或蟑螂', '塑料', '纸类', '金属', '杯盖或小白塞', '不明物'],
        keywords: ['头发', '虫子', '苍蝇', '蟑螂', '塑料片', '纸屑', '金属', '杯盖碎片', '不明物体'],
        description: '非食材本身的外来异物混入饮品',
        handlingFlow: '收集订单号+图片→安抚致歉→多方案(退款/代金券10-25元/重做)→反馈门店负责人24h联系',
        riskLevel: 'medium~high',
        compensationRule: 'L2: 退款+代金券10-25元+重做，门店回访24h',
        escalationRule: 'Level1门店负责人级，金属/苍蝇蟑螂升级为Level2',
        relatedFoodSafety: ['cat-exo-hair', 'cat-exo-insect', 'cat-exo-coachroach', 'cat-exo-plastic', 'cat-exo-paper', 'cat-exo-metal', 'cat-exo-lid', 'cat-exo-unknown'],
        mappedCount: 8,
      },
      {
        id: 'C2', name: '内源性异物',
        foodSafetyLabels: ['果核', '果皮', '茶渣', '水果纤维', '果蔬杂质或其它原料'],
        keywords: ['果核', '果皮', '茶渣', '纤维', '果肉残渣', '原料残留'],
        description: '食材本身的天然成分残留（通常低风险）',
        handlingFlow: '安抚+解释天然原料特性→提供重做或代金券10-30元→友好收尾',
        riskLevel: 'low',
        compensationRule: 'L1: 重做或代金券10-30元',
        escalationRule: '一般无需升级',
        relatedFoodSafety: ['cat-endo-pit', 'cat-endo-peel', 'cat-endo-tea', 'cat-endo-fiber', 'cat-endo-vegfruit'],
        mappedCount: 5,
      },
      {
        id: 'C3', name: '身体不适',
        foodSafetyLabels: ['腹泻', '呕吐', '过敏', '其它不适'],
        keywords: ['拉肚子', '不舒服', '肚子疼', '呕吐', '过敏', '起疹子', '恶心'],
        description: '顾客饮用后出现身体不适症状',
        handlingFlow: '表达重视+询问好转情况→建议就医→索要联系方式→通知地区负责人跟进（不主动承诺医疗费）',
        riskLevel: 'high',
        compensationRule: 'L4: 建议就医+代金券20-25元+门店负责人24h联系，不承诺医疗费',
        escalationRule: 'Level2专员/区域级，多人不适≥3人升级Level3',
        relatedFoodSafety: ['cat-body-diarrhea', 'cat-body-vomit', 'cat-body-allergy', 'cat-body-other'],
        mappedCount: 4,
      },
      {
        id: 'C4', name: '原料品质问题',
        foodSafetyLabels: ['原料变质', '原料未熟', '饮品异味', '产品有效期'],
        keywords: ['变质', '发霉', '酸臭', '没熟', '异味', '怪味', '过期', '有效期'],
        description: '原料变质、未熟、饮品异味或产品超有效期',
        handlingFlow: '安抚致歉→收集订单号+图片→退款+代金券10-25元+重做→反馈门店排查批次',
        riskLevel: 'medium~high',
        compensationRule: 'L3: 退款+代金券10-25元+重做+门店排查24h',
        escalationRule: 'Level1门店负责人级，批量问题升级Level2',
        relatedFoodSafety: ['cat-raw-spoil', 'cat-raw-uncooked', 'cat-odor', 'cat-expiry'],
        mappedCount: 4,
      },
      {
        id: 'C5', name: 'OEM产品问题',
        foodSafetyLabels: ['OEM过期', 'OEM变质'],
        keywords: ['蛋糕', '饼干', '包装食品', 'OEM', '过期', '发霉'],
        description: '第三方代工包装食品（蛋糕、烘焙等）过期或变质',
        handlingFlow: '安抚致歉→收集订单号+包装标签照片→退款+代金券10-25元→紧急排查批次+建单',
        riskLevel: 'high',
        compensationRule: 'L3: 退款+代金券10-25元+门店紧急排查',
        escalationRule: 'Level1门店负责人级，批量过期升级Level2',
        relatedFoodSafety: ['cat-oem-expired', 'cat-oem-spoiled'],
        mappedCount: 2,
      },
    ],
  },
  {
    id: 'D', name: '订单变更类', nameEn: 'Order Changes',
    description: '与修改订单、退款退单、取消订单相关的客诉',
    icon: 'RefreshCw', color: '#9b59b6',
    existingScenes: [],
    foodSafetyMapping: [],
    predictedScenes: [
      { id: 'D-p1', name: '退款退单', triggerKeywords: ['退款', '退单', '不想要了', '取消订单', '退钱'], description: '顾客要求退款或取消订单', priority: 'medium', source: 'predicted' },
      { id: 'D-p2', name: '修改订单内容', triggerKeywords: ['改一下', '换', '加料', '去冰', '少糖', '修改订单', '改地址'], description: '顾客要求修改订单商品规格或配送地址', priority: 'low', source: 'predicted' },
      { id: 'D-p3', name: '重复扣款', triggerKeywords: ['扣了两次', '多扣', '重复扣款', '金额不对'], description: '订单支付金额异常或重复扣款', priority: 'high', source: 'predicted' },
    ],
    subcategories: [
      {
        id: 'D1', name: '退款退单',
        originalScene: null,
        keywords: ['退款', '退单', '不想要了', '退钱', '取消'],
        description: '顾客要求退款或取消已有订单',
        handlingFlow: '确认退款原因→查订单状态(制作中/已完成)→按退款规则处理→确认退款方式',
        riskLevel: 'low',
        compensationRule: '按订单实付金额退款，代金券视情况补发',
        escalationRule: '大额退款(>200元)需主管审批',
        relatedFoodSafety: [],
      },
      {
        id: 'D2', name: '修改订单',
        originalScene: null,
        keywords: ['改一下', '换一个', '加料', '去冰', '少糖', '改地址'],
        description: '顾客要求修改订单商品规格、数量或配送信息',
        handlingFlow: '确认修改内容→查是否已制作→可改则修改→不可改则协商',
        riskLevel: 'low',
        compensationRule: '一般无补偿',
        escalationRule: '无升级',
        relatedFoodSafety: [],
      },
    ],
  },
  {
    id: 'E', name: '产品质量类', nameEn: 'Product Quality',
    description: '非食安层面的口感、外观、温度、规格等体验类问题',
    icon: 'Star', color: '#f39c12',
    existingScenes: [],
    foodSafetyMapping: [],
    predictedScenes: [
      { id: 'E-p1', name: '口感不符预期', triggerKeywords: ['太甜', '太淡', '不好喝', '没味道', '跟以前不一样', '难喝'], description: '饮品口感与顾客预期或历史体验不一致', priority: 'medium', source: 'predicted' },
      { id: 'E-p2', name: '外观/规格不符', triggerKeywords: ['冰太多', '料太少', '颜色不对', '大小不一样', '分量少', '不满杯'], description: '饮品的冰量、配料量、杯型等与标准不符', priority: 'medium', source: 'predicted' },
      { id: 'E-p3', name: '温度不符', triggerKeywords: ['不够热', '冰化了', '温的', '不是冰的', '太烫'], description: '饮品温度与顾客要求不符', priority: 'low', source: 'predicted' },
    ],
    subcategories: [
      {
        id: 'E1', name: '口感不符',
        keywords: ['太甜', '太淡', '不好喝', '没味道', '跟以前不一样'],
        description: '饮品口感、甜度、茶味等与标准或预期不符',
        handlingFlow: '了解具体问题→安抚致歉→提供重做或更换→反馈门店排查制作标准',
        riskLevel: 'low',
        compensationRule: '重做或小额代金券5-10元',
        escalationRule: '一般无升级',
        relatedFoodSafety: [],
      },
      {
        id: 'E2', name: '外观规格不符',
        keywords: ['冰太多', '料太少', '不满杯', '分量少', '大小不对'],
        description: '饮品冰量、配料量、杯型规格不一致',
        handlingFlow: '了解具体问题→安抚→提供重做(按标准)→反馈门店',
        riskLevel: 'low',
        compensationRule: '重做为主',
        escalationRule: '无升级',
        relatedFoodSafety: [],
      },
    ],
  },
  {
    id: 'F', name: '服务体验类', nameEn: 'Service Experience',
    description: '与服务态度、门店体验、投诉升级、活动优惠相关的客诉',
    icon: 'Heart', color: '#1abc9c',
    existingScenes: ['其他'],
    foodSafetyMapping: [],
    predictedScenes: [
      { id: 'F-p1', name: '服务态度投诉', triggerKeywords: ['态度差', '凶', '不理人', '甩脸色', '不耐烦'], description: '门店工作人员服务态度不佳', priority: 'medium', source: 'predicted' },
      { id: 'F-p2', name: '会员/积分问题', triggerKeywords: ['积分', '会员', '喜卡', '等级', '权益', '生日券'], description: '会员积分、等级权益、生日特权等问题', priority: 'low', source: 'predicted' },
      { id: 'F-p3', name: '活动优惠异常', triggerKeywords: ['优惠券', '买一送一', '活动', '折扣', '满减', '用不了'], description: '优惠活动规则不清或优惠无法使用', priority: 'medium', source: 'predicted' },
      { id: 'F-p4', name: '发票问题', triggerKeywords: ['发票', '开票', '电子发票', '报销'], description: '顾客需要开具发票或发票信息有误', priority: 'low', source: 'predicted' },
    ],
    subcategories: [
      {
        id: 'F1', name: '转人工/投诉',
        originalScene: '其他',
        keywords: ['转人工', '投诉', '人工客服', '真人', '不满意', '曝光'],
        description: '顾客要求转接人工客服或表达投诉意愿',
        handlingFlow: '先安抚→了解投诉原因→尝试解决→若坚持则转人工/创建投诉工单',
        riskLevel: 'medium~high',
        compensationRule: '视具体投诉内容而定',
        escalationRule: '投诉场景直接升级',
        relatedFoodSafety: [],
      },
    ],
  },
  {
    id: 'G', name: '配送类', nameEn: 'Delivery',
    description: '与外卖配送过程、骑手、包装完整性相关的客诉',
    icon: 'Truck', color: '#2ecc71',
    existingScenes: [],
    foodSafetyMapping: [],
    predictedScenes: [
      { id: 'G-p1', name: '配送延迟', triggerKeywords: ['骑手', '还没送到', '配送太慢', '路上多久'], description: '外卖配送时间超出预期', priority: 'medium', source: 'predicted' },
      { id: 'G-p2', name: '配送异常', triggerKeywords: ['没送到', '放错地方', '骑手不接电话', '取消配送'], description: '配送过程中出现异常情况', priority: 'medium', source: 'predicted' },
      { id: 'G-p3', name: '包装破损/撒漏', triggerKeywords: ['洒了', '漏了', '包装破了', '撒了一半', '杯子歪了'], description: '外卖送达后包装破损或饮品撒漏', priority: 'medium', source: 'predicted' },
    ],
    subcategories: [
      {
        id: 'G1', name: '配送延迟/异常',
        keywords: ['骑手', '配送', '还没送到', '路上', '没送到'],
        description: '外卖配送延迟或出现异常情况',
        handlingFlow: '查配送状态→联系骑手→告知顾客预计时间→超时致歉',
        riskLevel: 'low~medium',
        compensationRule: '超时严重可给5-10元代金券',
        escalationRule: '骑手失联时转人工',
        relatedFoodSafety: [],
      },
      {
        id: 'G2', name: '包装破损/撒漏',
        keywords: ['洒了', '漏了', '包装破了', '撒了'],
        description: '外卖送达后包装破损或饮品撒漏',
        handlingFlow: '收集照片→安抚→退款或重做→反馈门店改进包装',
        riskLevel: 'low',
        compensationRule: '退款或重做',
        escalationRule: '无升级',
        relatedFoodSafety: [],
      },
    ],
  },
]

// 意图分类统计摘要
export const INTENT_TAXONOMY_STATS = {
  totalCategories: 7,
  totalSubcategories: 16,
  existingScenesCovered: 5,
  foodSafetyLabelsMapped: 23,
  predictedScenes: 19,
  totalCoverage: 7 + 5 + 23 + 19, // 大类 + 现有 + 食安标签 + 预测
}
