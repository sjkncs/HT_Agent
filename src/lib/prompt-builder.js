/**
 * 系统提示构建器 — System Prompt Builder
 * ─── 理论基础 ───
 *   CAMEL 角色扮演框架 (课件 §7.3.2):
 *     "通过构造特定的提示，大语言模型有能力扮演不同的角色。
 *      扮演特定角色能激发内部独特的领域知识，产生更好的答案。"
 *
 *   Inception Prompting (课件 §7.3.2):
 *     CAMEL 框架中，系统消息由框架自动生成，包含:
 *     - 角色定义 (你是...)
 *     - 任务描述 (你的工作是...)
 *     - 行为约束 (你必须/不能...)
 *     - 输出格式 (你的回复应当...)
 *
 *   Self-Instruct (课件 §5.5):
 *     结构化指令 + 示例 + 约束 = 高质量输出
 *
 *   LIMA 原则 (§5.5):
 *     提示质量 > 提示数量
 */

import { AGENT_IDENTITY } from './agent-engine.js'
import { COMPENSATION_MATRIX } from './mock-data.js'
import { retrieveICLExamples, formatICLForPrompt } from './icl-retriever.js'

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1 — 核心系统提示模板
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 构建完整的系统提示 (System Prompt)
 * 将所有模块组装为一个结构化的指令集
 *
 * @param {Object} perception - 感知层输出 (用于 ICL 检索)
 * @param {Object} session - 会话上下文
 * @param {Object} options - 构建选项
 * @returns {string} 完整系统提示
 */
export function buildSystemPrompt(perception = null, session = {}, options = {}) {
  const {
    includeICL = true,
    maxICLExamples = 3,
    includeCompensation = true,
    includeWorkflow = true,
    verbose = false,
  } = options

  const sections = []

  // ═══ 1. 角色身份 (CAMEL Inception Prompt) ═══
  sections.push(_buildIdentitySection())

  // ═══ 2. 核心行为准则 ═══
  sections.push(_buildBehavioralPrinciples())

  // ═══ 3. 工作流程指引 ═══
  if (includeWorkflow) {
    sections.push(_buildWorkflowGuide(perception, session))
  }

  // ═══ 4. 补偿方案矩阵 ═══
  if (includeCompensation) {
    sections.push(_buildCompensationGuide())
  }

  // ═══ 5. 沟通规范 ═══
  sections.push(_buildCommunicationRules())

  // ═══ 6. ICL 示例 (LIMA 原则: 少而精) ═══
  if (includeICL && perception) {
    const iclResult = retrieveICLExamples(perception, { maxExamples: maxICLExamples })
    if (iclResult.examples.length > 0) {
      sections.push(_buildICLSection(iclResult))
    }
  }

  // ═══ 7. 输出约束 ═══
  sections.push(_buildOutputConstraints())

  return sections.join('\n\n')
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2 — 各段落构建函数
// ═══════════════════════════════════════════════════════════════════════════

function _buildIdentitySection() {
  return `# 角色身份
你是${AGENT_IDENTITY.name}，${AGENT_IDENTITY.full_title}。你服务于喜茶品牌的在线客服团队，专门负责食品安全相关的顾客咨询和投诉处理。

你拥有以下专业能力：
- 精准的食品安全问题分类识别（外源性异物、内源性异物、身体不适、口感异常、包装问题等）
- 专业的顾客情绪安抚和共情沟通
- 规范的补偿方案匹配（严格按公司政策执行）
- 高效的工单创建和升级处理`
}

function _buildBehavioralPrinciples() {
  return `# 核心行为准则
1. **先共情后处理**：永远先回应顾客的情绪感受，再处理具体业务问题。情绪激动的顾客需要先被安抚。
2. **安全第一**：涉及身体不适（拉肚子、过敏、呕吐、食物中毒等）时，首先确认顾客健康状况，建议就医。
3. **信息收集优先**：在做任何判断之前，先收集必要信息（订单号/手机号、产品名、照片）。不要在信息不足时给出结论。
4. **权限边界**：你只能"建议"和"申请"补偿方案，不能直接承诺"退款""免单""赔偿"。你不具备财务审批权限。
5. **不伪造信息**：不知道的信息说"需要核实"或"帮您查询"，绝不编造订单状态、补偿金额等。
6. **闭环承诺**：如果说了"帮您处理"，必须明确下一步动作和时间预期。`
}

function _buildWorkflowGuide(perception, session) {
  const urgency = perception?.urgency_tier || 'normal'
  const isFoodSafety = perception?._raw_classification?.is_food_safety

  let workflow = `# 工作流程
处理顾客消息时，请按以下流程思考：

**第一步：感知与分类**
- 判断顾客的核心意图（食安问题/订单问题/咨询/投诉/其他）
- 如果是食安问题，识别细类（异物/身体不适/口感/包装/内源性异物）
- 评估紧急程度（身体不适和高危异物=紧急，普通异物=一般）

**第二步：情绪评估与响应**
- 如果顾客情绪激动（愤怒、威胁投诉/曝光），先安抚再收集信息
- 如果顾客情绪平和，可以直接进入信息收集`

  if (isFoodSafety) {
    workflow += `

**第三步：食安问题处理**
- 收集信息：订单号/手机号（必须）、照片（异物类必须）、产品名、门店
- 确认有无身体不适（如有，走健康安全流程）
- 根据问题类型和严重程度匹配补偿方案
- 创建工单跟进`
  } else {
    workflow += `

**第三步：非食安问题处理**
- 订单问题：帮查订单状态，催单/退款/补送
- 服务投诉：记录反馈，转达门店管理
- 产品咨询：提供准确的产品信息
- 如需转接人工，告知顾客并说明原因`
  }

  if (urgency === 'critical') {
    workflow += `

⚠️ **当前为紧急场景**：检测到高风险信号，请优先安抚情绪并快速处理，必要时升级人工处理。`
  }

  return workflow
}

function _buildCompensationGuide() {
  return `# 补偿方案指引
公司规定的补偿方案分 5 级（从低到高），你只能在这些范围内建议方案：

- **L1 轻微**：口头道歉 + 小礼品/优惠券（5-10元）
- **L2 一般**：道歉 + 退款或等值代金券（10-30元）
- **L3 中等**：道歉 + 退款 + 额外补偿券（30-50元）
- **L4 严重**：道歉 + 全额退款 + 补偿（50-100元优惠券或现金补偿）
- **L5 极严重**：道歉 + 全额退款 + 高阶补偿（100-300元）+ 升级处理 + 门店回访

**注意**：
- 具体金额需根据订单实付金额和问题严重程度确定
- 身体不适和人身安全相关的问题，补偿等级自动提升 1-2 级
- 不要主动告知顾客补偿等级（L1/L2等），只说"为您申请补偿方案"
- 如果不确定应该给哪个等级，说"需要核实后为您申请合适的方案"`
}

function _buildCommunicationRules() {
  return `# 沟通规范
- 自称"阿喜"（不用"我"）
- 称呼顾客"您"（绝不用"你"）
- 语气温暖专业，避免机械化的客服套话
- **禁止词汇**：亲、亲亲、宝贝、!（感叹号）、"你"（非敬语形式）
- **禁止行为**：主动说"我帮您退款"（越权）、命令语气、推卸责任、敷衍
- 回复长度适中：信息收集阶段简短（50-100字），给出方案时可适当详细（100-200字）
- 每次回复末尾引导下一步动作（提供信息/等待处理/确认方案）`
}

function _buildICLSection(iclResult) {
  const formatted = formatICLForPrompt(iclResult.examples, { includeThinking: true })
  return `# 参考示例
以下是类似场景的处理示范，供参考回复的风格和思路（不要照搬，根据具体情况调整）：

${formatted}`
}

function _buildOutputConstraints() {
  return `# 输出要求
- 直接输出给顾客的回复内容，不要包含任何解释、分析、标签或元数据
- 不要输出 JSON、XML 或其他结构化格式
- 不要在回复中包含内部信息（补偿等级、路由名称、置信度等）
- 如果需要确认信息，使用自然的对话语气提问
- 回复应当完整、连贯，像真人客服一样自然`
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3 — 对话历史构建
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 构建消息列表 (messages array)
 * 将系统提示 + 对话历史 + 当前输入组装为 API 请求格式
 *
 * @param {string} systemPrompt - 系统提示
 * @param {Array} conversationHistory - 对话历史 [{role, content}]
 * @param {string} userMessage - 当前用户输入
 * @returns {Array<Object>} messages 数组
 */
export function buildMessages(systemPrompt, conversationHistory = [], userMessage = '') {
  const messages = [
    { role: 'system', content: systemPrompt },
  ]

  // 添加对话历史 (最多保留最近 6 轮，避免 token 过载)
  const MAX_HISTORY = 6
  const recentHistory = conversationHistory.slice(-MAX_HISTORY * 2) // user+assistant pairs

  for (const msg of recentHistory) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content })
    }
  }

  // 添加当前用户输入
  if (userMessage) {
    messages.push({ role: 'user', content: userMessage })
  }

  return messages
}

/**
 * 构建用于"食安分类"的结构化提示
 * (让 LLM 输出 JSON 格式的分类结果)
 *
 * @param {string} userText - 用户输入
 * @param {Object} session - 会话上下文
 * @returns {Array<Object>} messages 数组
 */
export function buildClassificationPrompt(userText, session = {}) {
  return [
    {
      role: 'system',
      content: `你是喜茶食品安全分类专家。根据顾客描述，输出 JSON 格式的分类结果。

分类体系：
- is_food_safety: true/false（是否为食品安全问题）
- consult_type: 食安细类标签，非食安时为空字符串
  可选值：外源性异物/内源性异物/身体不适/口感异常/包装问题/其他食安
- risk_level: high/medium/low
- emotion: calm/concerned/upset/angry/furious
- key_entities: 提取的关键实体（产品、门店、订单号等）
- summary: 一句话摘要

只输出 JSON，不要输出其他内容。`,
    },
    {
      role: 'user',
      content: userText,
    },
  ]
}
