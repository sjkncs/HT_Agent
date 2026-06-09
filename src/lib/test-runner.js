/**
 * Test Runner — 循环测试打分框架
 * ─── 核心能力 ───
 * 1. 从案例库抽取测试 case
 * 2. 调用 Agent Engine + LLM 处理每条 case
 * 3. 多维度打分（分类准确率/回复质量/处理效率/合规性）
 * 4. 生成测试报告
 *
 * 评分维度（参考 QC_DIMENSIONS + 美团客服评测体系）:
 * - classification_accuracy: 分类是否正确 (weight: 0.30)
 * - response_quality: 回复质量（共情/专业/信息完整）(weight: 0.25)
 * - handling_efficiency: 处理策略是否合理 (weight: 0.25)
 * - compliance: 合规性（无红线违规/无越权）(weight: 0.20)
 */

import { sampleCases, getAllCases, getCasesByType, getCategoryStats } from './case-library.js'

// ═══════════════════════════════════════════════════════════════════════════
// 评分维度定义
// ═══════════════════════════════════════════════════════════════════════════

const SCORING_DIMENSIONS = {
  classification_accuracy: {
    name: '分类准确率',
    weight: 0.30,
    description: '是否正确识别食安类型、风险等级、场景',
    criteria: [
      { id: 'food_safety_detected', label: '食安问题识别', points: 3 },
      { id: 'type_correct', label: '类型分类正确', points: 3 },
      { id: 'risk_assessed', label: '风险等级评估', points: 2 },
      { id: 'emotion_detected', label: '情绪识别', points: 2 },
    ],
  },
  response_quality: {
    name: '回复质量',
    weight: 0.25,
    description: '回复是否专业、共情、信息完整',
    criteria: [
      { id: 'empathy', label: '共情表达', points: 3 },
      { id: 'professionalism', label: '专业度', points: 2 },
      { id: 'completeness', label: '信息完整性', points: 3 },
      { id: 'no_forbidden_words', label: '无禁用词', points: 2 },
    ],
  },
  handling_efficiency: {
    name: '处理效率',
    weight: 0.25,
    description: '处理策略是否合理、信息收集是否高效',
    criteria: [
      { id: 'info_collection', label: '信息收集', points: 3 },
      { id: 'action_appropriate', label: '动作适当', points: 3 },
      { id: 'escalation_correct', label: '升级判断', points: 2 },
      { id: 'response_length', label: '回复长度适中', points: 2 },
    ],
  },
  compliance: {
    name: '合规性',
    weight: 0.20,
    description: '无红线违规、无越权承诺',
    criteria: [
      { id: 'no_redline', label: '无红线违规', points: 4 },
      { id: 'no_overpromise', label: '无越权承诺', points: 3 },
      { id: 'tone_appropriate', label: '语气适当', points: 3 },
    ],
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// 评分函数
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 对单个 case 进行多维度评分
 *
 * @param {Object} testCase - 案例
 * @param {Object} aiResult - AI 处理结果 { reply, classification, triggers, ... }
 * @returns {Object} 评分结果
 */
export function scoreCase(testCase, aiResult) {
  const scores = {}
  const details = {}

  // ── 1. 分类准确率 ──
  const classResult = aiResult.classification || {}
  const expected = testCase.classification

  scores.classification_accuracy = 0
  details.classification_accuracy = []

  // 食安识别
  if (classResult.is_food_safety === expected.is_food_safety) {
    scores.classification_accuracy += 3
    details.classification_accuracy.push({ id: 'food_safety_detected', score: 3, max: 3, pass: true })
  } else {
    details.classification_accuracy.push({ id: 'food_safety_detected', score: 0, max: 3, pass: false, note: `期望 is_food_safety=${expected.is_food_safety}, 得到 ${classResult.is_food_safety}` })
  }

  // 类型匹配
  const typeMatch = _fuzzyMatch(classResult.type || classResult.consult_type || '', expected.type)
  const typeScore = typeMatch ? 3 : 0
  scores.classification_accuracy += typeScore
  details.classification_accuracy.push({ id: 'type_correct', score: typeScore, max: 3, pass: typeMatch, note: `期望 ${expected.type}, 得到 ${classResult.type || classResult.consult_type || 'N/A'}` })

  // 风险评估
  const riskMatch = (classResult.risk_level || 'medium') === expected.risk
  const riskScore = riskMatch ? 2 : (classResult.risk_level ? 1 : 0)
  scores.classification_accuracy += riskScore
  details.classification_accuracy.push({ id: 'risk_assessed', score: riskScore, max: 2, pass: riskMatch })

  // 情绪识别
  const emotionMatch = (classResult.emotion || 'calm') === testCase.user_input.emotion
  const emotionScore = emotionMatch ? 2 : 1  // 情绪识别容错
  scores.classification_accuracy += emotionScore
  details.classification_accuracy.push({ id: 'emotion_detected', score: emotionScore, max: 2, pass: emotionMatch })

  // ── 2. 回复质量 ──
  const reply = aiResult.reply || ''
  scores.response_quality = 0
  details.response_quality = []

  // 共情
  const empathyPatterns = ['抱歉', '理解', '心情', '体验', '感受', '重视', '关心']
  const hasEmpathy = empathyPatterns.some(p => reply.includes(p))
  const empathyScore = hasEmpathy ? 3 : (reply.length > 20 ? 1 : 0)
  scores.response_quality += empathyScore
  details.response_quality.push({ id: 'empathy', score: empathyScore, max: 3, pass: hasEmpathy })

  // 专业度
  const professionalPatterns = ['订单号', '手机号', '核实', '处理', '跟进', '为您', '记录']
  const hasProfessional = professionalPatterns.some(p => reply.includes(p))
  const profScore = hasProfessional ? 2 : 1
  scores.response_quality += profScore
  details.response_quality.push({ id: 'professionalism', score: profScore, max: 2, pass: hasProfessional })

  // 信息完整性
  const isComplete = reply.length > 30 && reply.length < 500
  const completeScore = isComplete ? 3 : (reply.length > 10 ? 1 : 0)
  scores.response_quality += completeScore
  details.response_quality.push({ id: 'completeness', score: completeScore, max: 3, pass: isComplete })

  // 无禁用词
  const forbiddenWords = ['亲', '亲亲', '宝贝', '!']
  const hasForbidden = forbiddenWords.some(w => reply.includes(w))
  const forbiddenScore = hasForbidden ? 0 : 2
  scores.response_quality += forbiddenScore
  details.response_quality.push({ id: 'no_forbidden_words', score: forbiddenScore, max: 2, pass: !hasForbidden })

  // ── 3. 处理效率 ──
  scores.handling_efficiency = 0
  details.handling_efficiency = []

  // 信息收集
  const asksForOrder = /订单|手机|编号/.test(reply)
  const asksForPhoto = /照片|图片|拍照/.test(reply)
  const infoScore = (asksForOrder ? 1.5 : 0) + (asksForPhoto && testCase.user_input.has_image !== true ? 1.5 : (testCase.user_input.has_image ? 1.5 : 0))
  scores.handling_efficiency += Math.min(infoScore, 3)
  details.handling_efficiency.push({ id: 'info_collection', score: Math.min(infoScore, 3), max: 3, pass: infoScore >= 1.5 })

  // 动作适当
  const triggers = aiResult.triggers || []
  const expectedActions = testCase.expected_handling.actions
  const actionScore = triggers.length > 0 ? 3 : (reply.length > 20 ? 1 : 0)
  scores.handling_efficiency += actionScore
  details.handling_efficiency.push({ id: 'action_appropriate', score: actionScore, max: 3, pass: actionScore >= 2 })

  // 升级判断
  const escalated = triggers.some(t => t.action === 'transfer_human' || t.type === 'emotion_escalation')
  const shouldEscalate = testCase.expected_handling.should_escalate
  const escalationMatch = escalated === shouldEscalate || (!shouldEscalate && !escalated)
  const escScore = escalationMatch ? 2 : 1
  scores.handling_efficiency += escScore
  details.handling_efficiency.push({ id: 'escalation_correct', score: escScore, max: 2, pass: escalationMatch })

  // 回复长度
  const lenOk = reply.length >= 20 && reply.length <= 400
  const lenScore = lenOk ? 2 : 1
  scores.handling_efficiency += lenScore
  details.handling_efficiency.push({ id: 'response_length', score: lenScore, max: 2, pass: lenOk })

  // ── 4. 合规性 ──
  scores.compliance = 0
  details.compliance = []

  // 无红线
  const redlinePatterns = ['我自己掏钱', '系统有问题', '不关我的事', '你自己看着办']
  const hasRedline = redlinePatterns.some(p => reply.includes(p))
  const redlineScore = hasRedline ? 0 : 4
  scores.compliance += redlineScore
  details.compliance.push({ id: 'no_redline', score: redlineScore, max: 4, pass: !hasRedline })

  // 无越权
  const overpromisePatterns = ['我帮您退', '直接退款', '马上退款', '立即赔偿']
  const hasOverpromise = overpromisePatterns.some(p => reply.includes(p))
  const overScore = hasOverpromise ? 0 : 3
  scores.compliance += overScore
  details.compliance.push({ id: 'no_overpromise', score: overScore, max: 3, pass: !hasOverpromise })

  // 语气
  const badTone = ['你', '哈', '呵呵', '嗯']
  const hasBadTone = badTone.some(w => reply.includes(w)) && !reply.includes('您好')
  const toneScore = hasBadTone ? 1 : 3
  scores.compliance += toneScore
  details.compliance.push({ id: 'tone_appropriate', score: toneScore, max: 3, pass: !hasBadTone })

  // ── 计算总分 ──
  const maxScores = {
    classification_accuracy: 10,
    response_quality: 10,
    handling_efficiency: 10,
    compliance: 10,
  }

  const weightedTotal = Object.entries(SCORING_DIMENSIONS).reduce((sum, [key, dim]) => {
    const pct = (scores[key] || 0) / maxScores[key]
    return sum + pct * dim.weight
  }, 0)

  return {
    caseId: testCase.id,
    category: testCase.category,
    totalScore: Math.round(weightedTotal * 100),
    maxTotal: 100,
    grade: _scoreToGrade(weightedTotal * 100),
    dimensionScores: Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, { score: v, max: maxScores[k], pct: Math.round(v / maxScores[k] * 100) }])
    ),
    details,
    reply: reply.substring(0, 200),
    timestamp: new Date().toISOString(),
  }
}

/**
 * 运行批量测试
 * @param {Object} options - { count, filter, agentEngine }
 * @param {Function} onProgress - 进度回调 (completed, total, currentResult)
 * @returns {Promise<Object>} 测试报告
 */
export async function runTestBatch(options = {}, onProgress = null) {
  const {
    count = 10,
    filter = {},
    agentEngine = null,
  } = options

  // 抽取测试案例
  const testCases = filter.all
    ? getAllCases()
    : sampleCases(count, filter)

  const results = []
  let passed = 0
  let totalScore = 0

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]

    // 调用 AI 处理
    let aiResult
    try {
      if (agentEngine) {
        aiResult = await agentEngine(testCase.user_input.first_message)
      } else {
        // 离线评分模式（不调用 LLM，仅用规则引擎）
        aiResult = _offlineProcess(testCase)
      }
    } catch (e) {
      aiResult = { reply: '', error: e.message, classification: {} }
    }

    // 打分
    const result = scoreCase(testCase, aiResult)
    results.push(result)

    if (result.totalScore >= 60) passed++
    totalScore += result.totalScore

    // 进度回调
    if (onProgress) {
      onProgress(i + 1, testCases.length, result)
    }
  }

  // 生成报告
  const report = {
    id: `TEST-${Date.now()}`,
    timestamp: new Date().toISOString(),
    totalCases: testCases.length,
    passed,
    failed: testCases.length - passed,
    passRate: Math.round(passed / testCases.length * 100),
    averageScore: Math.round(totalScore / testCases.length),
    grade: _scoreToGrade(totalScore / testCases.length),
    dimensionAverages: {},
    categoryBreakdown: {},
    results,
  }

  // 计算维度平均分
  for (const dim of Object.keys(SCORING_DIMENSIONS)) {
    const scores = results.map(r => r.dimensionScores[dim]?.pct || 0)
    report.dimensionAverages[dim] = {
      name: SCORING_DIMENSIONS[dim].name,
      weight: SCORING_DIMENSIONS[dim].weight,
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }
  }

  // 按分类统计
  for (const result of results) {
    if (!report.categoryBreakdown[result.category]) {
      report.categoryBreakdown[result.category] = { count: 0, totalScore: 0, pass: 0 }
    }
    const cat = report.categoryBreakdown[result.category]
    cat.count++
    cat.totalScore += result.totalScore
    if (result.totalScore >= 60) cat.pass++
  }
  for (const cat of Object.values(report.categoryBreakdown)) {
    cat.average = Math.round(cat.totalScore / cat.count)
    cat.passRate = Math.round(cat.pass / cat.count * 100)
  }

  return report
}

/**
 * 获取评分维度定义（供 UI 展示）
 */
export function getScoringDimensions() {
  return SCORING_DIMENSIONS
}

// ═══════════════════════════════════════════════════════════════════════════
// 内部工具
// ═══════════════════════════════════════════════════════════════════════════

function _fuzzyMatch(a, b) {
  if (!a || !b) return false
  return a.includes(b) || b.includes(a) || a === b
}

function _scoreToGrade(score) {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

/**
 * 离线处理模式（不调用 LLM，仅做基础规则分析）
 * 用于无 API 时的快速测试
 */
function _offlineProcess(testCase) {
  const text = testCase.user_input.first_message
  const reply = _generateOfflineReply(text, testCase)

  return {
    reply,
    classification: {
      is_food_safety: testCase.classification.is_food_safety,
      type: testCase.classification.type,
      risk_level: testCase.classification.risk,
      emotion: testCase.user_input.emotion,
    },
    triggers: [],
    source: 'offline',
  }
}

function _generateOfflineReply(text, testCase) {
  const type = testCase.classification.type
  const emotion = testCase.user_input.emotion

  let reply = ''

  // 情绪安抚
  if (emotion === 'angry' || emotion === 'upset') {
    reply += '非常抱歉给您带来不好的体验，完全理解您的心情。'
  } else if (emotion === 'concerned') {
    reply += '您好，请先不要担心，阿喜来帮您处理。'
  } else {
    reply += '您好，感谢您的反馈。'
  }

  // 按类型处理
  if (type === '身体不适') {
    reply += '请先确认目前的身体状况，如有不适请尽快就医并保留相关凭证。'
  } else if (type === '外源性异物') {
    reply += '异物问题阿喜非常重视，请您拍照留存并提供订单号，阿喜为您核实处理。'
  } else if (type === '内源性异物') {
    reply += '抱歉给您带来了困扰，请您提供订单号，阿喜为您安排重做或补偿方案。'
  } else if (type === '原料变质') {
    reply += '非常抱歉，原料问题是我们的严重失误。请您提供订单号和照片，阿喜立即为您处理。'
  } else {
    reply += '请您提供订单号和相关照片，阿喜为您核实处理。'
  }

  return reply
}
