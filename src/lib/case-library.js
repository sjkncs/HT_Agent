/**
 * Case Library — 真实食安案例库
 * ─── 来源 ───
 * 从 70 个 Excel 文件（38,644 条会话）中提取的结构化测试案例
 * 每条案例包含: 用户输入、期望分类、参考回复、处理策略
 */

import caseData from '../data/case-library.json'

// ═══════════════════════════════════════════════════════════════════════════
// 核心 API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 获取所有案例
 * @returns {Array} 案例数组
 */
export function getAllCases() {
  return caseData.cases || []
}

/**
 * 获取案例库元数据
 */
export function getMetadata() {
  return caseData.metadata || {}
}

/**
 * 按分类获取案例
 * @param {string} category - 分类名 (如 "异物-塑料", "呕吐")
 * @returns {Array} 匹配的案例
 */
export function getCasesByCategory(category) {
  return getAllCases().filter(c => c.category === category)
}

/**
 * 按食安类型获取案例
 * @param {string} type - 类型 (如 "外源性异物", "内源性异物", "身体不适", "原料变质")
 * @returns {Array}
 */
export function getCasesByType(type) {
  return getAllCases().filter(c => c.classification.type === type)
}

/**
 * 按场景获取案例
 * @param {string} scenario - 场景 (foreign_object, body_discomfort, spoilage, oem_issue, packaging)
 * @returns {Array}
 */
export function getCasesByScenario(scenario) {
  return getAllCases().filter(c => c.classification.scenario === scenario)
}

/**
 * 按风险等级获取案例
 * @param {string} risk - high / medium / low
 * @returns {Array}
 */
export function getCasesByRisk(risk) {
  return getAllCases().filter(c => c.classification.risk === risk)
}

/**
 * 获取用于 ICL 检索的 golden cases
 * 每个食安类型选取 2-3 个最具代表性的案例
 * @returns {Array} 精选案例
 */
export function getGoldenCases() {
  const cases = getAllCases()
  const byType = {}

  for (const c of cases) {
    const key = c.classification.type
    if (!byType[key]) byType[key] = []
    byType[key].push(c)
  }

  const golden = []
  for (const [type, typeCases] of Object.entries(byType)) {
    // 选一个有图片+订单的、一个纯文字的、一个情绪激动的
    const withImage = typeCases.find(c => c.user_input.has_image && c.user_input.has_order)
    const withoutImage = typeCases.find(c => !c.user_input.has_image)
    const emotional = typeCases.find(c => c.user_input.emotion === 'angry' || c.user_input.emotion === 'upset')

    const selected = new Set()
    if (withImage) selected.add(withImage)
    if (withoutImage) selected.add(withoutImage)
    if (emotional) selected.add(emotional)

    // 如果不够 2 个，从剩余里补
    if (selected.size < 2) {
      for (const c of typeCases) {
        selected.add(c)
        if (selected.size >= 2) break
      }
    }

    golden.push(...selected)
  }

  return golden
}

/**
 * 随机抽取 N 个案例用于测试
 * @param {number} n - 数量
 * @param {Object} filter - 可选过滤条件 { type, risk, scenario, category }
 * @returns {Array}
 */
export function sampleCases(n = 10, filter = {}) {
  let pool = getAllCases()

  if (filter.type) pool = pool.filter(c => c.classification.type === filter.type)
  if (filter.risk) pool = pool.filter(c => c.classification.risk === filter.risk)
  if (filter.scenario) pool = pool.filter(c => c.classification.scenario === filter.scenario)
  if (filter.category) pool = pool.filter(c => c.category === filter.category)

  // Fisher-Yates shuffle
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled.slice(0, n)
}

/**
 * 获取所有分类列表及案例数量
 * @returns {Array<{category: string, count: number, type: string}>}
 */
export function getCategoryStats() {
  const stats = {}
  for (const c of getAllCases()) {
    if (!stats[c.category]) {
      stats[c.category] = { category: c.category, count: 0, type: c.classification.type }
    }
    stats[c.category].count++
  }
  return Object.values(stats).sort((a, b) => b.count - a.count)
}

/**
 * 获取用于工作台展示的真实会话记录
 * 返回格式化的会话数据，可直接用于 ConsumerWorkbench
 * @param {number} limit - 返回数量
 * @returns {Array}
 */
export function getWorkbenchConversations(limit = 10) {
  const cases = getAllCases()
    .filter(c => c.user_input.first_message.length > 10)
    .slice(0, limit)

  return cases.map((c, i) => ({
    id: c.id,
    time: `${String(8 + i).padStart(2, '0')}:${String(15 + i * 7).padStart(2, '0')}`,
    customer: `茶茶_${String(1000 + i)}`,
    firstMessage: c.user_input.first_message,
    category: c.classification.type,
    subCategory: c.classification.label,
    emotion: c.user_input.emotion,
    risk: c.classification.risk,
    hasImage: c.user_input.has_image,
    hasOrder: c.user_input.has_order,
    status: c.classification.risk === 'high' ? 'pending' : (c.classification.risk === 'medium' ? 'processing' : 'resolved'),
    store: c.order_info?.store || ['深圳万象城店', '广州天河城店', '上海南京路店', '北京三里屯店', '成都春熙路店'][i % 5],
    orderInfo: c.order_info,
    referenceReplies: c.reference_replies,
  }))
}
