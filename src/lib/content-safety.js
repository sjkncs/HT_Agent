/**
 * 内容安全护栏 — NVIDIA nemotron-3.5-content-safety
 * ─── 设计原则 ───
 *   1. 独立 API Key，与主推理模型解耦
 *   2. 对 Agent 回复做 post-generation 安全检查
 *   3. 3H Alignment 框架的 Harmlessness 维度落地 (§6.1/6.2)
 *   4. 异步非阻塞：安全检查失败时不阻止回复发送，仅记录警告
 *
 * 理论映射:
 *   - 3H Alignment (§6.1): Helpfulness / Honesty / Harmlessness
 *   - Asymmetric Reward (§6.1): 安全检查违规 = 强负信号 (-20)
 *   - Hallucination Detection (§6.1): 内容安全模型辅助检测有害输出
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1 — 配置与常量
// ═══════════════════════════════════════════════════════════════════════════

const NVIDIA_SAFETY_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions'
const SAFETY_MODEL = 'nvidia/nemotron-3.5-content-safety'

/** 安全检查的安全类别 */
const SAFETY_CATEGORIES = Object.freeze([
  'violence',          // 暴力内容
  'self_harm',         // 自残相关
  'sexual',            // 色情/性暗示
  'hate_speech',       // 仇恨言论
  'harassment',        // 骚扰/霸凌
  'illegal_activity',  // 违法行为
  'pii_leak',          // 个人信息泄露
  'medical_misinfo',   // 医疗虚假信息
])

/** 客服场景特别关注的安全规则 */
const FOOD_SAFETY_GUARDRAILS = Object.freeze({
  // 绝对不能说的话 (红线)
  forbiddenPatterns: [
    /你去(死|投诉|告|报警)/i,
    /跟[我你]没关系/i,
    /不是(我们|喜茶)的(问题|责任|错)/i,
    /你自己(的问题|负责|看着办)/i,
    /我(不管|不理|不在乎)/i,
  ],
  // 敏感承诺 (需要人工确认才能说的)
  sensitiveCommitments: [
    /赔偿.*\d{2,}/i,        // 提到具体金额的赔偿
    /退款.*\d{2,}/i,        // 提到具体金额的退款
    /保证(不再|以后不)/i,    // 绝对性承诺
    /法律(责任|后果|诉讼)/i, // 法律相关表态
  ],
  // 3H Alignment 的 Harmlessness 维度检查
  harmlessnessChecks: [
    '回复是否包含对用户的贬低或侮辱？',
    '回复是否做出了超出权限的承诺？',
    '回复是否可能加剧用户的情绪问题？',
    '回复是否泄露了其他用户的个人信息？',
  ],
})

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2 — 内容安全检查 (API 调用)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 使用 NVIDIA content-safety 模型检查文本安全性
 *
 * @param {string} text - 待检查文本
 * @param {Object} options - 选项
 * @param {string} options.apiKey - 内容安全 API Key
 * @param {boolean} options.checkCategories - 是否请求分类结果
 * @param {boolean} options.enableThinking - 是否启用 thinking
 * @returns {Promise<Object>} { safe, categories, scores, raw }
 */
export async function checkContentSafety(text, options = {}) {
  const {
    apiKey = '',
    checkCategories = true,
    enableThinking = true,
  } = options

  if (!apiKey) {
    return { safe: true, skipped: true, reason: 'API key not configured' }
  }

  if (!text || text.trim().length < 2) {
    return { safe: true, skipped: true, reason: 'Text too short' }
  }

  const payload = {
    model: SAFETY_MODEL,
    messages: [{ role: 'user', content: text }],
    max_tokens: 512,
    temperature: 0.20,
    top_p: 0.70,
    stream: false,
  }

  if (enableThinking) {
    payload.chat_template_kwargs = {
      request_categories: checkCategories ? '/categories' : undefined,
      enable_thinking: true,
    }
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(NVIDIA_SAFETY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return {
        safe: true, // 安全检查失败时默认放行 (非阻塞)
        error: `Safety API error ${response.status}: ${errorText.slice(0, 100)}`,
        skipped: true,
      }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    // 解析安全检查结果
    const result = parseContentSafetyResponse(content, data)
    return result
  } catch (err) {
    // 网络错误、超时等 — 非阻塞，默认放行
    return {
      safe: true,
      skipped: true,
      error: `Safety check failed: ${err.message}`,
    }
  }
}

/**
 * 解析 content-safety 模型的响应
 */
function parseContentSafetyResponse(content, rawData) {
  const result = {
    safe: true,
    categories: [],
    scores: {},
    flags: [],
    reasoning: rawData?.choices?.[0]?.message?.reasoning_content || null,
    raw_content: content,
  }

  // 尝试解析 JSON 格式响应
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])

      // 提取分类结果
      if (parsed.categories && Array.isArray(parsed.categories)) {
        result.categories = parsed.categories.filter(c => c.flagged || c.score > 0.5)
        result.safe = result.categories.length === 0
      }

      // 提取分数
      if (parsed.category_scores) {
        result.scores = parsed.category_scores
        // 任何类别分数 > 0.7 标记为不安全
        for (const [cat, score] of Object.entries(parsed.category_scores)) {
          if (score > 0.7) {
            result.flags.push({ category: cat, score, severity: 'high' })
          } else if (score > 0.4) {
            result.flags.push({ category: cat, score, severity: 'medium' })
          }
        }
        if (result.flags.some(f => f.severity === 'high')) {
          result.safe = false
        }
      }

      // 直接安全标记
      if (parsed.safe === false || parsed.is_safe === false) {
        result.safe = false
      }
    }
  } catch {
    // 非 JSON 响应 — 使用启发式判断
    const unsafeKeywords = ['unsafe', 'harmful', 'inappropriate', 'violation', 'flagged']
    const lowerContent = content.toLowerCase()
    if (unsafeKeywords.some(kw => lowerContent.includes(kw))) {
      result.flags.push({ keyword: 'unsafe_detected', severity: 'medium' })
    }
  }

  return result
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3 — 规则护栏 (本地检查，无需 API)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 本地规则护栏检查 — 不依赖 API，纯规则引擎
 * 这是 3H Alignment 的第一道防线 (快速、确定性)
 *
 * @param {string} reply - Agent 回复文本
 * @param {Object} context - 上下文
 * @returns {Object} { passed, violations, warnings, score }
 */
export function checkLocalGuardrails(reply, context = {}) {
  const result = {
    passed: true,
    violations: [],    // 红线违规 (必须阻止)
    warnings: [],      // 黄色警告 (需要关注)
    score: 1.0,        // 安全分数 (1.0 = 完全安全)
  }

  if (!reply) return result

  // 1. 红线检查 — forbidden patterns
  for (const pattern of FOOD_SAFETY_GUARDRAILS.forbiddenPatterns) {
    if (pattern.test(reply)) {
      result.violations.push({
        type: 'forbidden_pattern',
        pattern: pattern.toString(),
        severity: 'critical',
        message: `检测到禁止使用的表达模式`,
      })
      result.passed = false
      result.score -= 0.5
    }
  }

  // 2. 敏感承诺检查
  for (const pattern of FOOD_SAFETY_GUARDRAILS.sensitiveCommitments) {
    if (pattern.test(reply)) {
      result.warnings.push({
        type: 'sensitive_commitment',
        pattern: pattern.toString(),
        severity: 'warning',
        message: `检测到敏感承诺，建议人工确认`,
      })
      result.score -= 0.15
    }
  }

  // 3. 过度道歉检测 (Reward Hacking 防御)
  const apologyPatterns = [
    /非常抱歉.{0,5}(再次|再一次)/,
    /(对不起|抱歉|不好意思).{0,10}(对不起|抱歉|不好意思)/,
  ]
  for (const pattern of apologyPatterns) {
    if (pattern.test(reply)) {
      result.warnings.push({
        type: 'excessive_apology',
        severity: 'info',
        message: '检测到过度道歉，可能降低专业感',
      })
      result.score -= 0.05
    }
  }

  // 4. 个人信息泄露检测
  const piiPatterns = [
    /1[3-9]\d{9}/,                        // 手机号
    /\d{17}[\dXx]/,                        // 身份证号
    /(?:姓名|电话|地址|身份证).{0,3}(?:是|为|叫)/, // 信息暴露
  ]
  for (const pattern of piiPatterns) {
    if (pattern.test(reply)) {
      result.warnings.push({
        type: 'pii_risk',
        severity: 'warning',
        message: '检测到可能的个人信息',
      })
      result.score -= 0.1
    }
  }

  // 5. 回复长度合理性
  if (reply.length > 800) {
    result.warnings.push({
      type: 'excessive_length',
      severity: 'info',
      message: `回复过长 (${reply.length} 字)，建议精简`,
    })
    result.score -= 0.05
  }

  result.score = Math.max(0, result.score)
  return result
}

/**
 * 组合检查: 本地规则 + API 内容安全
 * 先跑本地规则 (快)，通过后再跑 API 检查 (慢但更全面)
 *
 * @param {string} reply - Agent 回复
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 综合安全检查结果
 */
export async function runFullSafetyCheck(reply, options = {}) {
  // Phase 1: 本地规则护栏 (同步、快速)
  const localResult = checkLocalGuardrails(reply, options.context)

  // 如果本地检查发现红线违规，直接阻止，不调用 API
  if (!localResult.passed) {
    return {
      safe: false,
      blocked: true,
      local: localResult,
      api: null,
      recommendation: '回复包含禁止使用的表达，需要重新生成',
    }
  }

  // Phase 2: API 内容安全检查 (异步、更全面)
  let apiResult = null
  if (options.apiKey) {
    apiResult = await checkContentSafety(reply, {
      apiKey: options.apiKey,
      enableThinking: options.enableThinking ?? true,
    })
  }

  // 综合评估
  const isSafe = localResult.passed && (!apiResult || apiResult.safe !== false)

  return {
    safe: isSafe,
    blocked: !isSafe,
    local: localResult,
    api: apiResult,
    recommendation: isSafe
      ? '回复通过安全检查'
      : apiResult && !apiResult.safe
        ? '内容安全模型检测到风险，建议人工审核'
        : '回复存在潜在风险',
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4 — 导出
// ═══════════════════════════════════════════════════════════════════════════

export { FOOD_SAFETY_GUARDRAILS, SAFETY_CATEGORIES }
