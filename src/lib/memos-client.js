/**
 * MemOS Cloud 记忆客户端
 * 移植自 Proma/apps/electron/src/main/lib/memos-client.ts
 *
 * 提供跨会话的长期记忆能力：
 * - searchMemory: 搜索用户的历史记忆（事实+偏好）
 * - addMemory: 存储对话内容供未来检索
 *
 * 应用场景：记住用户的口味偏好、常去的门店、历史投诉记录等
 */

const DEFAULT_BASE_URL = 'https://memos.memtensor.cn/api/openmem/v1'
const TIMEOUT_MS = 8000
const RETRIES = 1

// ── 配置 ──
let memoryConfig = {
  enabled: false,
  apiKey: '',
  userId: 'heytea-user',
  baseUrl: DEFAULT_BASE_URL,
}

/**
 * 更新记忆服务配置
 */
export function configureMemory(config) {
  Object.assign(memoryConfig, config)
}

/**
 * 检查记忆服务是否可用
 */
export function isMemoryAvailable() {
  return !!(memoryConfig.enabled && memoryConfig.apiKey)
}

// ── 内部工具 ──

async function callApi(path, body) {
  if (!memoryConfig.apiKey) throw new Error('MEMOS_API_KEY 未设置')

  const baseUrl = (memoryConfig.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '')
  let lastError

  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

      const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${memoryConfig.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timer)

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
      return await res.json()
    } catch (err) {
      lastError = err
      if (attempt < RETRIES) {
        await new Promise(r => setTimeout(r, 100 * (attempt + 1)))
      }
    }
  }

  throw lastError
}

// ── 公开 API ──

/**
 * 搜索记忆
 * @param {string} query - 搜索查询
 * @param {number} limit - 最大结果数
 * @returns {Promise<{facts: Array, preferences: Array}>}
 */
export async function searchMemory(query, limit = 6) {
  if (!isMemoryAvailable()) {
    return { facts: [], preferences: [] }
  }

  try {
    const result = await callApi('/search/memory', {
      user_id: memoryConfig.userId,
      query,
      source: 'heytea-agent',
      memory_limit_number: limit,
      include_preference: true,
      preference_limit_number: limit,
    })

    const data = result?.data
    if (!data) return { facts: [], preferences: [] }

    const memories = data.memory_detail_list || []
    const prefs = data.preference_detail_list || []

    return {
      facts: memories
        .map(item => ({
          id: String(item.id || ''),
          text: String(item.memory_value || item.memory_key || ''),
          createTime: item.create_time ? String(item.create_time) : undefined,
          confidence: typeof item.confidence === 'number' ? item.confidence : undefined,
        }))
        .filter(f => f.text),
      preferences: prefs
        .map(item => ({
          id: String(item.id || ''),
          text: String(item.preference || ''),
          type: item.preference_type ? String(item.preference_type) : undefined,
        }))
        .filter(p => p.text),
    }
  } catch (err) {
    console.warn('[Memory] 搜索失败:', err.message)
    return { facts: [], preferences: [] }
  }
}

/**
 * 存储对话记忆
 * @param {Object} params
 * @param {string} params.userMessage - 用户消息
 * @param {string} params.assistantMessage - 助手回复
 * @param {string} params.conversationId - 会话ID
 * @param {string[]} params.tags - 标签
 */
export async function addMemory({ userMessage, assistantMessage, conversationId, tags }) {
  if (!isMemoryAvailable()) return

  const messages = [{ role: 'user', content: userMessage }]
  if (assistantMessage) {
    messages.push({ role: 'assistant', content: assistantMessage })
  }

  try {
    await callApi('/add/message', {
      user_id: memoryConfig.userId,
      conversation_id: conversationId || `heytea-${Date.now()}`,
      messages,
      source: 'heytea-agent',
      tags: tags || ['heytea'],
      async_mode: true,
      info: { source: 'heytea-builtin' },
    })
  } catch (err) {
    console.warn('[Memory] 存储失败:', err.message)
  }
}

/**
 * 格式化搜索结果为文本
 */
export function formatSearchResult(result) {
  const lines = []

  if (result.facts.length > 0) {
    lines.push('相关记忆:')
    for (const item of result.facts) {
      const time = item.createTime
        ? new Date(item.createTime).toLocaleDateString('zh-CN')
        : ''
      lines.push(time ? `  - [${time}] ${item.text}` : `  - ${item.text}`)
    }
  }

  if (result.preferences.length > 0) {
    lines.push('\n用户偏好:')
    for (const item of result.preferences) {
      lines.push(item.type ? `  - (${item.type}) ${item.text}` : `  - ${item.text}`)
    }
  }

  return lines.length > 0 ? lines.join('\n') : '暂无相关记忆。'
}

// ── Agent 工具定义（OpenAI function calling 格式） ──

export const MEMORY_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'recall_memory',
      description: '搜索用户的历史记忆和偏好。当用户提到"之前"、"上次"、"我以前点过"等回溯性表述，或需要了解用户偏好时调用。',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索查询，如"用户喜欢的饮品"、"上次投诉内容"',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_memory',
      description: '将当前对话内容存入长期记忆。当用户分享了偏好、做了重要决定、或解决了问题时调用。',
      parameters: {
        type: 'object',
        properties: {
          userMessage: {
            type: 'string',
            description: '用户的消息内容',
          },
          assistantMessage: {
            type: 'string',
            description: '助手的回复内容',
          },
        },
        required: ['userMessage'],
      },
    },
  },
]

/**
 * 执行记忆工具调用
 */
export async function executeMemoryToolCall(toolCall) {
  const args = typeof toolCall.arguments === 'string'
    ? JSON.parse(toolCall.arguments)
    : toolCall.arguments

  if (toolCall.function?.name === 'recall_memory' || toolCall.name === 'recall_memory') {
    const query = args?.query || ''
    const result = await searchMemory(query)
    return formatSearchResult(result)
  }

  if (toolCall.function?.name === 'add_memory' || toolCall.name === 'add_memory') {
    await addMemory({
      userMessage: args?.userMessage || '',
      assistantMessage: args?.assistantMessage || '',
    })
    return '记忆已保存。'
  }

  return `未知记忆工具: ${toolCall.function?.name || toolCall.name}`
}
