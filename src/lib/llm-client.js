/**
 * LLM API 客户端 — OpenAI 兼容接口 (V2: NVIDIA 生态集成)
 * ─── 设计原则 ───
 *   1. 统一兼容 OpenAI / Qwen (DashScope) / DeepSeek / NVIDIA / vLLM 等 API
 *   2. 支持流式 (SSE) 和非流式两种模式
 *   3. 内置重试、超时、降级逻辑
 *   4. Token 用量追踪 (对应课件 §7.5 推理优化)
 *   5. NVIDIA Reasoning Model 支持 (enable_thinking + reasoning_budget + reasoning_content)
 *
 * 课件理论映射:
 *   - ICL (In-Context Learning, §5.1): 通过 system prompt 中的 few-shot 示例引导模型
 *   - LIMA 原则 (§5.5): 少量高质量示例 > 大量低质量示例
 *   - Self-Instruct (§5.5): 自动生成高质量 ICL 示例
 *   - ReAct (§7.2.1): NVIDIA reasoning_content 提供显式思维链 trace
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1 — API 配置管理
// ═══════════════════════════════════════════════════════════════════════════

/** 默认 API 配置 (可在运行时覆盖) */
const DEFAULT_CONFIG = Object.freeze({
  // API 端点 (OpenAI 兼容)
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',

  // 请求参数
  temperature: 0.3,       // 低温度 = 更确定性 (客服场景偏好稳定)
  maxTokens: 2048,        // 回复最大 token
  topP: 0.9,
  frequencyPenalty: 0.1,  // 轻微惩罚重复 (对应 Reward Hacking 防御 §6.5)
  presencePenalty: 0.05,

  // 网络参数
  timeout: 30000,         // 30s 超时
  maxRetries: 2,          // 最多重试 2 次
  retryDelay: 1000,       // 重试间隔 1s

  // 流式
  stream: false,

  // 备用配置 (主 API 失败时降级)
  fallback: null,         // { baseUrl, apiKey, model }

  // NVIDIA Reasoning Model 专属
  enableThinking: false,       // 启用 reasoning chain (nemotron-3-ultra)
  reasoningBudget: 8192,       // reasoning token 预算 (max 16384)
  extraBody: null,             // 额外请求体参数 (如 chat_template_kwargs)

  // 内容安全护栏 (独立 API key)
  contentSafetyKey: '',        // nemotron-3.5-content-safety API key
  contentSafetyEnabled: false, // 是否启用内容安全检查
})

/** 当前活跃配置 (运行时可变) */
let _activeConfig = { ...DEFAULT_CONFIG }

/**
 * 设置 LLM API 配置
 * @param {Object} config - 部分或完整配置
 */
export function setLLMConfig(config) {
  _activeConfig = { ..._activeConfig, ...config }
  // 持久化到 localStorage (如果有)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('llm_config', JSON.stringify(_activeConfig))
    }
  } catch { /* 静默 */ }
}

/**
 * 获取当前 LLM 配置
 * @returns {Object} 当前配置
 */
export function getLLMConfig() {
  return { ..._activeConfig }
}

/**
 * 从 localStorage 恢复配置
 */
export function restoreLLMConfig() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('llm_config')
      if (saved) {
        _activeConfig = { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
      }
    }
  } catch { /* 静默 */ }
}

/**
 * 检测 API 是否已配置
 */
export function isLLMConfigured() {
  return !!(_activeConfig.apiKey && _activeConfig.baseUrl)
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2 — OpenAI 兼容客户端
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 发送 Chat Completion 请求 (非流式)
 *
 * @param {Array<Object>} messages - 消息列表 [{role, content}]
 * @param {Object} overrides - 可选参数覆盖
 * @returns {Promise<Object>} { content, usage, model, finish_reason }
 */
export async function chatCompletion(messages, overrides = {}) {
  const config = { ..._activeConfig, ...overrides }

  if (!config.apiKey) {
    throw new LLMError('API key not configured', 'CONFIG_ERROR')
  }

  const body = {
    model: config.model,
    messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    top_p: config.topP,
    frequency_penalty: config.frequencyPenalty,
    presence_penalty: config.presencePenalty,
    stream: false,
  }

  // NVIDIA Reasoning Model: enable_thinking + reasoning_budget (top-level body)
  if (config.enableThinking) {
    body.chat_template_kwargs = { enable_thinking: true }
    body.reasoning_budget = config.reasoningBudget || 8192
  }

  // 合并用户自定义额外参数 (顶层展开)
  if (config.extraBody && typeof config.extraBody === 'object') {
    Object.assign(body, config.extraBody)
  }

  // 移除 undefined/null 值
  Object.keys(body).forEach(k => {
    if (body[k] === undefined || body[k] === null) delete body[k]
  })

  let lastError = null
  const endpoints = [
    { baseUrl: config.baseUrl, apiKey: config.apiKey },
    ...(config.fallback ? [{ baseUrl: config.fallback.baseUrl, apiKey: config.fallback.apiKey }] : []),
  ]

  for (const endpoint of endpoints) {
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const response = await _fetchWithTimeout(
          `${endpoint.baseUrl}/chat/completions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${endpoint.apiKey}`,
            },
            body: JSON.stringify(body),
          },
          config.timeout,
        )

        if (!response.ok) {
          const errorText = await response.text().catch(() => '')
          throw new LLMError(
            `API error ${response.status}: ${errorText.slice(0, 200)}`,
            'API_ERROR',
            response.status,
          )
        }

        const data = await response.json()
        const choice = data.choices?.[0]

        return {
          content: choice?.message?.content || '',
          reasoning_content: choice?.message?.reasoning_content || null,
          role: choice?.message?.role || 'assistant',
          finish_reason: choice?.finish_reason || 'unknown',
          usage: {
            prompt_tokens: data.usage?.prompt_tokens || 0,
            completion_tokens: data.usage?.completion_tokens || 0,
            reasoning_tokens: data.usage?.reasoning_tokens || 0,
            total_tokens: data.usage?.total_tokens || 0,
          },
          model: data.model || config.model,
          raw: data,
        }
      } catch (err) {
        lastError = err
        if (err instanceof LLMError && err.statusCode === 401) {
          // 认证失败不重试，直接跳到下一个端点
          break
        }
        if (attempt < config.maxRetries) {
          await _sleep(config.retryDelay * (attempt + 1))
        }
      }
    }
  }

  throw lastError || new LLMError('All endpoints failed', 'ALL_FAILED')
}

/**
 * 发送流式 Chat Completion 请求
 * 返回一个异步迭代器，逐块产出文本
 *
 * @param {Array<Object>} messages - 消息列表
 * @param {Object} overrides - 可选参数覆盖
 * @returns {AsyncGenerator<string>} 文本块生成器
 */
export async function* chatCompletionStream(messages, overrides = {}) {
  const config = { ..._activeConfig, ...overrides }

  if (!config.apiKey) {
    throw new LLMError('API key not configured', 'CONFIG_ERROR')
  }

  const body = {
    model: config.model,
    messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    top_p: config.topP,
    frequency_penalty: config.frequencyPenalty,
    presence_penalty: config.presencePenalty,
    stream: true,
  }

  // NVIDIA Reasoning Model: enable_thinking + reasoning_budget (top-level body)
  if (config.enableThinking) {
    body.chat_template_kwargs = { enable_thinking: true }
    body.reasoning_budget = config.reasoningBudget || 8192
  }

  // 合并用户自定义额外参数 (顶层展开)
  if (config.extraBody && typeof config.extraBody === 'object') {
    Object.assign(body, config.extraBody)
  }

  Object.keys(body).forEach(k => {
    if (body[k] === undefined || body[k] === null) delete body[k]
  })

  const response = await _fetchWithTimeout(
    `${config.baseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    },
    config.timeout,
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new LLMError(`API error ${response.status}: ${errorText.slice(0, 200)}`, 'API_ERROR', response.status)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()

      if (data === '[DONE]') return

      try {
        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta
        // NVIDIA reasoning chain (思维链 trace)
        const reasoning = delta?.reasoning_content
        if (reasoning) yield { type: 'reasoning', content: reasoning }
        // 正常回复内容
        if (delta?.content) yield { type: 'content', content: delta.content }
      } catch {
        // 跳过非 JSON 行
      }
    }
  }
}

/**
 * 简单的单轮对话快捷方法
 * @param {string} systemPrompt - 系统提示
 * @param {string} userMessage - 用户消息
 * @param {Object} overrides - 可选参数
 * @returns {Promise<string>} 回复文本
 */
export async function simpleChat(systemPrompt, userMessage, overrides = {}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]
  const result = await chatCompletion(messages, overrides)
  return result.content
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3 — 工具函数
// ═══════════════════════════════════════════════════════════════════════════

class LLMError extends Error {
  constructor(message, code, statusCode) {
    super(message)
    this.name = 'LLMError'
    this.code = code || 'UNKNOWN'
    this.statusCode = statusCode
  }
}

function _fetchWithTimeout(url, options, timeout) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer))
}

function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 估算 token 数量 (粗略: 1 token ≈ 1.5 个中文字 or 4 个英文字符)
 * 对应课件 §7.5 推理优化 — 了解输入规模
 */
export function estimateTokens(text) {
  if (!text) return 0
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const otherChars = text.length - chineseChars
  return Math.ceil(chineseChars / 1.5 + otherChars / 4)
}

/**
 * Heytea 品牌模型名映射
 * 底层使用第三方 API，UI 统一显示 Heytea 品牌名称
 */
export const HEYTEA_BRAND = Object.freeze({
  'nvidia/nemotron-3-super-120b-a12b': 'Heytea-V1-Pro',
  'nvidia/nemotron-3-ultra-550b-a55b': 'Heytea-V1-Thinking-High',
  'moonshotai/kimi-k2.6': 'Heytea-V1-Flash',
  'minimaxai/minimax-m2.7': 'Heytea-V1-Lite',
  // 未来微调模型
  'heytea/food-safety-sft': 'Heytea-V1-Finetune',
})

/** 获取模型的品牌显示名 */
export function getModelDisplayName(modelId) {
  if (!modelId) return 'Heytea-V1'
  return HEYTEA_BRAND[modelId] || modelId.split('/').pop()
}

/**
 * 预设 API 端点快捷配置
 * Heytea 品牌化：底层 NVIDIA 生态，UI 显示 Heytea 系列
 */
export const API_PRESETS = Object.freeze({
  nvidia: {
    name: 'Heytea 阿喜模型',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    models: [
      'nvidia/nemotron-3-super-120b-a12b',   // Heytea-V1-Pro
      'nvidia/nemotron-3-ultra-550b-a55b',    // Heytea-V1-Thinking-High
      'moonshotai/kimi-k2.6',                 // Heytea-V1-Flash
      'minimaxai/minimax-m2.7',               // Heytea-V1-Lite
    ],
    enableThinking: true,
    // 模型元数据 (thinking 支持 / 推荐场景) — label 使用品牌名
    modelMeta: {
      'nvidia/nemotron-3-super-120b-a12b': { thinking: true, label: 'Heytea-V1-Pro (Agent推理 · 1M上下文)', maxTokens: 16384 },
      'nvidia/nemotron-3-ultra-550b-a55b': { thinking: true, label: 'Heytea-V1-Thinking-High (深度推理旗舰)', maxTokens: 16384 },
      'moonshotai/kimi-k2.6': { thinking: false, label: 'Heytea-V1-Flash (快速响应)', maxTokens: 16384 },
      'minimaxai/minimax-m2.7': { thinking: false, label: 'Heytea-V1-Lite (轻量对话)', maxTokens: 8192 },
    },
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  dashscope: {
    name: '通义千问 (DashScope)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-plus', 'qwen-turbo', 'qwen-max', 'qwen-vl-plus'],
  },
  zhipu: {
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4-plus', 'glm-4', 'glm-4-flash'],
  },
  moonshot: {
    name: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
  custom: {
    name: '自定义 (AutoDL / vLLM / Ollama)',
    baseUrl: '',
    models: [],
  },
})
