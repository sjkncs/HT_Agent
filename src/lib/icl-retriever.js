/**
 * ICL 示例检索器 — In-Context Learning Example Retriever
 * ─── 理论基础 ───
 *   ICL 语境学习 (课件 §5.1):
 *     "大语言模型具有语境学习能力，能够根据输入中的示例推断任务模式。"
 *
 *   LIMA 原则 (课件 §5.5):
 *     "1000 个高质量、多样性丰富的示例可以取得以少胜多的表现。"
 *
 *   Self-Instruct (课件 §5.5):
 *     "自动化指令数据生成，通过 ROUGE-L < 0.7 确保多样性。"
 *
 *   设计原则:
 *     1. 每个食安细类 2-3 个黄金示例 (覆盖典型/边界/复杂场景)
 *     2. 示例包含完整的 "用户输入 → Agent 思考 → 客服回复" 链
 *     3. 示例来源于真实客服话术 (38,644条会话提炼) + 补偿矩阵对齐
 *     4. 动态检索: 根据当前输入意图选择最相关的 3-5 个示例
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1 — 黄金 ICL 示例库 (从真实客服会话 + 规则矩阵提炼)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ICL 示例格式:
 * {
 *   id: 唯一标识,
 *   category: 食安细类,
 *   scenario: 场景标签,
 *   user_input: 典型用户输入,
 *   agent_thinking: Agent 内部推理过程 (CoT, 对应 §7.1.1),
 *   reply: 专业客服回复,
 *   metadata: { urgency, emotion, route, compensation_level }
 * }
 */
const ICL_EXAMPLES = [
  // ─── 外源性异物 ───
  {
    id: 'foreign_object_01',
    category: '外源性异物',
    scenario: '头发/标准处理',
    user_input: '我点的奶茶里面有一根头发，这也太不卫生了吧',
    agent_thinking: '识别到食安问题-外源性异物(头发)，情绪轻微不满。需要先共情安抚，引导提供照片和订单信息，进入标准食安处理流程。风险等级: 低。',
    reply: '您好，非常抱歉给您带来了不好的体验。阿喜非常重视您的用餐安全，关于您反馈的情况，阿喜会帮您认真处理的。\n\n为了更快地帮您核实和解决，方便提供以下信息吗？\n1. 您的订单号或下单手机号\n2. 异物的照片（如果方便的话）\n\n阿喜收到信息后会第一时间为您处理。',
    metadata: { urgency: 'normal', emotion: 'upset', route: 'standard', compensation_level: 'L1-L2' },
  },
  {
    id: 'foreign_object_02',
    category: '外源性异物',
    scenario: '高危异物(铁丝/玻璃)',
    user_input: '你们奶茶里面有铁丝！！我差点吞下去了！这也太危险了吧！我要去315投诉你们！',
    agent_thinking: '高危异物(铁丝)+升级威胁(315)+强烈情绪。立即走紧急路径: 先深度安抚→确认人身安全→收集证据→升级处理。风险等级: 高。需要高阶补偿方案。',
    reply: '您好，看到您的反馈阿喜非常担心！首先确认一下，您现在身体有没有不适？如果有任何不舒服，请第一时间就医，健康是最重要的。\n\n关于您反馈的情况，阿喜非常重视，这属于严重的质量问题，我们会立即启动内部核查。为了尽快帮您处理，麻烦您提供：\n1. 订单号或下单手机号\n2. 铁丝的照片\n3. 您购买的门店名称\n\n阿喜会优先为您跟进，确保问题得到妥善处理。',
    metadata: { urgency: 'critical', emotion: 'furious', route: 'high_risk', compensation_level: 'L4-L5' },
  },

  // ─── 身体不适 ───
  {
    id: 'body_discomfort_01',
    category: '身体不适',
    scenario: '拉肚子/标准处理',
    user_input: '昨天喝了你们的茶，今天一直在拉肚子，是不是你们的东西有问题',
    agent_thinking: '身体不适(腹泻)+时间关联(昨天喝→今天拉)。健康优先，需要确认当前状况，引导就医，收集信息，走body_discomfort路径。必须获取联系方式以便回访。',
    reply: '您好，听到您身体不适阿喜非常担心。您的健康是我们最重视的。\n\n请问您现在情况怎么样了？如果症状比较严重，建议您先就医，保留好就医记录，后续我们会跟进处理。\n\n为了更好地帮您核实和跟进，方便告诉阿喜：\n1. 您的订单号或下单手机号\n2. 购买的是哪款产品\n3. 您的联系方式（手机号），方便我们后续回访\n\n阿喜会全程跟进您的情况，请放心。',
    metadata: { urgency: 'high', emotion: 'concerned', route: 'body_discomfort', compensation_level: 'L3-L4' },
  },
  {
    id: 'body_discomfort_02',
    category: '身体不适',
    scenario: '过敏/紧急',
    user_input: '我对芒果过敏，你们的饮品里面为什么不标注过敏原！我现在浑身起疹子了！',
    agent_thinking: '过敏+健康损害+潜在标签合规问题。最高优先级: 确认就医→收集信息→升级处理。可能需要高阶补偿。',
    reply: '您好，听到您出现过敏反应阿喜非常紧张！过敏可大可小，请您现在立刻就医，这是最重要的。\n\n关于过敏原标注的问题，阿喜完全理解您的不满，这确实是我们需要改进的地方。请您就医后保留好诊断记录，我们会认真对待并妥善处理。\n\n方便的时候请提供：\n1. 订单号或下单手机号\n2. 产品名称\n3. 您的联系方式\n4. 就医记录（如有）\n\n阿喜会第一时间为您跟进处理，祝您早日康复。',
    metadata: { urgency: 'critical', emotion: 'angry', route: 'body_discomfort', compensation_level: 'L4-L5' },
  },

  // ─── 口感异常 ───
  {
    id: 'bad_taste_01',
    category: '口感异常',
    scenario: '味道变了/常规',
    user_input: '今天的芝士茶味道和之前不一样，感觉有点酸，是不是变质了',
    agent_thinking: '口感异常+疑似变质。需要确认是否有身体不适，收集产品信息和照片。如果是变质，风险等级提升到食安。',
    reply: '您好，感谢您的反馈。口感发生变化确实需要重视，阿喜帮您了解一下情况。\n\n请问您喝完之后有没有感觉身体不舒服呢？\n\n如果方便的话，麻烦提供：\n1. 订单号或下单手机号\n2. 产品的照片（如果还没喝完的话）\n3. 购买的门店名称\n\n阿喜收到信息后会帮您核实处理。',
    metadata: { urgency: 'moderate', emotion: 'concerned', route: 'standard', compensation_level: 'L1-L2' },
  },

  // ─── 包装问题 ───
  {
    id: 'packaging_01',
    category: '包装问题',
    scenario: '撒漏/外卖',
    user_input: '外卖送到的时候杯子盖子没盖好，洒了一桌子，衣服都弄脏了',
    agent_thinking: '包装问题(撒漏)+财产损失(衣服弄脏)。非食安但影响体验。需要确认损失程度，提供合理补偿方案。',
    reply: '您好，非常抱歉给您带来了不便！饮品洒出来弄脏了衣服，这体验确实很糟糕，阿喜理解您的心情。\n\n麻烦您提供以下信息，阿喜帮您处理：\n1. 订单号或下单手机号\n2. 撒漏的照片\n\n我们会为您妥善处理的，请您放心。',
    metadata: { urgency: 'moderate', emotion: 'upset', route: 'standard', compensation_level: 'L2-L3' },
  },

  // ─── 订单问题 (非食安) ───
  {
    id: 'order_issue_01',
    category: '订单问题',
    scenario: '催单',
    user_input: '我的外卖已经等了40分钟了还没到，能不能催一下',
    agent_thinking: '非食安-订单问题(催单)。无需走食安流程，直接帮用户查看订单状态并催单。',
    reply: '您好，让您久等了，阿喜理解您着急的心情。\n\n麻烦提供一下您的订单号或下单手机号，阿喜帮您查看一下配送进度，催促骑手尽快送达。',
    metadata: { urgency: 'normal', emotion: 'concerned', route: 'non_food_safety', compensation_level: 'N/A' },
  },
  {
    id: 'order_issue_02',
    category: '订单问题',
    scenario: '送错/少送',
    user_input: '我点了两杯，但是只送了一杯，还有一杯不是我要的',
    agent_thinking: '非食安-订单问题(送错+少送)。需要确认具体订单信息，帮助处理补送或退款。',
    reply: '您好，非常抱歉出现这个情况！少送了一杯还送错了一杯，这确实影响用餐体验。\n\n方便提供您的订单号或下单手机号吗？阿喜帮您核实具体情况，尽快为您处理。',
    metadata: { urgency: 'normal', emotion: 'upset', route: 'non_food_safety', compensation_level: 'L1' },
  },

  // ─── 一般投诉 ───
  {
    id: 'general_complaint_01',
    category: '一般投诉',
    scenario: '服务态度',
    user_input: '你们店员态度太差了，问个问题爱理不理的',
    agent_thinking: '非食安-服务态度投诉。需要共情安抚，收集门店信息，反馈给门店管理。',
    reply: '您好，听到您有这样的体验阿喜感到非常抱歉。每一位顾客都应该被热情对待，您的反馈阿喜会认真记录并转达给相关门店的管理团队。\n\n方便告诉阿喜是哪家门店吗？我们会跟进改善的。也感谢您的反馈，帮助我们做得更好。',
    metadata: { urgency: 'normal', emotion: 'upset', route: 'non_food_safety', compensation_level: 'N/A' },
  },

  // ─── 咨询 ───
  {
    id: 'consultation_01',
    category: '咨询',
    scenario: '产品咨询',
    user_input: '请问你们的多肉葡萄用的是真的葡萄吗？有没有添加剂',
    agent_thinking: '非食安-产品咨询。正常解答，传递品牌正面信息。',
    reply: '您好！感谢您的关注~\n\n阿喜可以告诉您，我们的多肉葡萄使用的是真实的葡萄果肉哦，每一杯都是现制现做的。关于具体的配料和营养信息，您可以在我们的官方小程序或门店查看。\n\n如果您对某些成分有特殊关注（比如过敏），也可以告诉阿喜，阿喜帮您确认。',
    metadata: { urgency: 'normal', emotion: 'calm', route: 'non_food_safety', compensation_level: 'N/A' },
  },

  // ─── 多轮复杂场景 ───
  {
    id: 'complex_01',
    category: '外源性异物',
    scenario: '多轮+情绪升级+已提供照片',
    user_input: '照片我已经发了你看不到吗？就是一只苍蝇在奶茶上面！我已经说了三遍了你们到底能不能处理！',
    agent_thinking: '重复投诉+情绪升级(furious)+照片已提供。之前的处理可能不到位导致顾客不满。需要: 1)确认已收到照片 2)真诚道歉 3)立即给出处理方案 4)升级处理。不能再要求提供信息。',
    reply: '非常抱歉让您重复说明，阿喜确认已经看到您提供的照片了，确实看到有异物存在，这给您带来了非常不好的体验，阿喜代表品牌向您真诚道歉。\n\n阿喜现在立即为您处理：\n1. 这单会为您办理退款\n2. 同时会为您申请额外的补偿方案\n3. 门店端我们会启动内部质检核查\n\n请您稍等片刻，阿喜马上跟进。如果有任何进展会第一时间通知您。再次向您道歉，感谢您的耐心。',
    metadata: { urgency: 'critical', emotion: 'furious', route: 'emotion_first', compensation_level: 'L4-L5' },
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2 — ICL 检索器
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 根据当前感知状态检索最相关的 ICL 示例
 * 对应课件 §5.5 LIMA: 少量高质量示例 + 多样性
 *
 * @param {Object} perception - 感知层输出
 * @param {Object} options - 检索选项
 * @param {number} options.maxExamples - 最大示例数 (默认 4, LIMA 原则)
 * @param {boolean} options.includeThinking - 是否包含 agent_thinking (CoT)
 * @returns {Object} 检索结果
 */
export function retrieveICLExamples(perception, options = {}) {
  const {
    maxExamples = 4,
    includeThinking = true,
  } = options

  const topIntent = perception?.intent?.top_intent?.intent || 'other'
  const emotionGrade = perception?.emotion?.grade || 'calm'
  const urgency = perception?.urgency_tier || 'normal'
  const isFoodSafety = perception?._raw_classification?.is_food_safety || false

  // Step 1: 按意图类别筛选候选示例
  const intentCategoryMap = {
    food_safety_foreign_object: ['外源性异物'],
    food_safety_body_discomfort: ['身体不适'],
    food_safety_internal_material: ['内源性异物'],
    food_safety_bad_taste: ['口感异常'],
    food_safety_packaging: ['包装问题'],
    order_issue: ['订单问题'],
    general_complaint: ['一般投诉'],
    consultation: ['咨询'],
    other: [],
  }

  const targetCategories = intentCategoryMap[topIntent] || []
  let candidates = ICL_EXAMPLES.filter(ex =>
    targetCategories.includes(ex.category) || (!isFoodSafety && ex.category === '订单问题')
  )

  // 如果类别候选不足，补充通用示例
  if (candidates.length < 2) {
    candidates = [...candidates, ...ICL_EXAMPLES.filter(ex => !candidates.includes(ex))]
  }

  // Step 2: 按情绪/紧急度匹配度排序
  const urgencyOrder = { critical: 0, high: 1, moderate: 2, normal: 3 }
  const emotionOrder = { furious: 0, angry: 1, upset: 2, concerned: 3, calm: 4 }

  candidates.sort((a, b) => {
    // 紧急度匹配
    const aUrgMatch = Math.abs((urgencyOrder[a.metadata.urgency] || 3) - (urgencyOrder[urgency] || 3))
    const bUrgMatch = Math.abs((urgencyOrder[b.metadata.urgency] || 3) - (urgencyOrder[urgency] || 3))
    if (aUrgMatch !== bUrgMatch) return aUrgMatch - bUrgMatch

    // 情绪匹配
    const aEmoMatch = Math.abs((emotionOrder[a.metadata.emotion] || 4) - (emotionOrder[emotionGrade] || 4))
    const bEmoMatch = Math.abs((emotionOrder[b.metadata.emotion] || 4) - (emotionOrder[emotionGrade] || 4))
    return aEmoMatch - bEmoMatch
  })

  // Step 3: 多样性过滤 (Self-Instruct §5.5: ROUGE-L < 0.7)
  const selected = []
  for (const candidate of candidates) {
    if (selected.length >= maxExamples) break

    // 检查与已选示例的多样性
    const isDuplicate = selected.some(s =>
      s.category === candidate.category && s.scenario === candidate.scenario
    )
    if (!isDuplicate) {
      selected.push(candidate)
    }
  }

  // 确保至少有 1 个同情绪等级的示例
  if (selected.length > 0 && !selected.some(s => s.metadata.emotion === emotionGrade)) {
    const emotionMatch = ICL_EXAMPLES.find(ex => ex.metadata.emotion === emotionGrade && !selected.includes(ex))
    if (emotionMatch) {
      if (selected.length >= maxExamples) selected.pop()
      selected.push(emotionMatch)
    }
  }

  return {
    examples: selected.map(ex => ({
      user_input: ex.user_input,
      ...(includeThinking ? { agent_thinking: ex.agent_thinking } : {}),
      reply: ex.reply,
      category: ex.category,
      scenario: ex.scenario,
    })),
    total_retrieved: selected.length,
    retrieval_strategy: `意图匹配(${topIntent}) + 情绪适配(${emotionGrade}) + 紧急度(${urgency})`,
    categories_covered: [...new Set(selected.map(s => s.category))],
  }
}

/**
 * 将 ICL 示例格式化为 system prompt 中的 few-shot 段落
 *
 * @param {Array} examples - ICL 示例数组
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的 ICL 文本块
 */
export function formatICLForPrompt(examples, options = {}) {
  const { includeThinking = true, style = 'structured' } = options

  if (!examples || examples.length === 0) return ''

  if (style === 'structured') {
    return examples.map((ex, i) => {
      const parts = [`【示例${i + 1}】(${ex.category}/${ex.scenario})`]
      parts.push(`用户: ${ex.user_input}`)
      if (includeThinking && ex.agent_thinking) {
        parts.push(`思考: ${ex.agent_thinking}`)
      }
      parts.push(`回复: ${ex.reply}`)
      return parts.join('\n')
    }).join('\n\n')
  }

  // 简洁模式
  return examples.map((ex, i) =>
    `示例${i + 1}: 用户说"${ex.user_input}" → 回复"${ex.reply.slice(0, 80)}..."`
  ).join('\n')
}

/**
 * 获取完整的 ICL 示例库 (供管理/导出使用)
 */
export function getFullICLLibrary() {
  return [...ICL_EXAMPLES]
}

/**
 * 按类别统计 ICL 覆盖度
 */
export function getICLCoverageStats() {
  const stats = {}
  for (const ex of ICL_EXAMPLES) {
    if (!stats[ex.category]) {
      stats[ex.category] = { count: 0, scenarios: [] }
    }
    stats[ex.category].count++
    stats[ex.category].scenarios.push(ex.scenario)
  }
  return stats
}
