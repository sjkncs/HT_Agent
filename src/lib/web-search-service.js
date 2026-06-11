/**
 * Web 搜索服务 (Web Search Service)
 * 移植自 deepseek-vision/app/web_search.py + Proma/web-search-tool.ts
 *
 * 支持 Tavily 和 Brave 两个搜索引擎。
 * 作为 Agent 工具使用，让阿喜可以实时搜索互联网信息。
 *
 * 应用场景：查询产品信息、竞品对比、门店信息、营养知识等
 */

// ── 配置 ──
const SEARCH_CONFIG = {
  provider: 'tavily',   // 'tavily' | 'brave'
  apiKey: '',           // 搜索引擎 API Key
  maxResults: 5,        // 单次搜索最大结果数
  maxUses: 3,           // 单次对话最大搜索次数
  searchDepth: 'basic', // Tavily: 'basic' | 'advanced'
  timeout: 30000,       // 超时(ms)
}

/**
 * 更新搜索服务配置
 */
export function configureSearch(config) {
  Object.assign(SEARCH_CONFIG, config)
}

/**
 * 检查搜索服务是否可用
 */
export function isWebSearchAvailable() {
  return !!SEARCH_CONFIG.apiKey
}

// ── Tavily 搜索 ──
async function searchTavily(query, maxResults, allowedDomains, blockedDomains) {
  const payload = {
    api_key: SEARCH_CONFIG.apiKey,
    query,
    max_results: maxResults || SEARCH_CONFIG.maxResults,
    search_depth: SEARCH_CONFIG.searchDepth,
    include_answer: true,
  }

  if (allowedDomains?.length) {
    payload.include_domains = allowedDomains
  }
  if (blockedDomains?.length) {
    payload.exclude_domains = blockedDomains
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SEARCH_CONFIG.timeout)

  try {
    const response = await fetch('/api/tavily/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!response.ok) {
      throw new Error(`Tavily HTTP ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    return {
      answer: data.answer || null,
      results: (data.results || []).map(r => ({
        title: r.title || '',
        url: r.url || '',
        content: (r.content || '').slice(0, 300),
        score: r.score || 0,
      })),
    }
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

// ── Brave 搜索 ──
async function searchBrave(query, maxResults, allowedDomains) {
  let searchQuery = query
  if (allowedDomains?.length) {
    const siteFilter = allowedDomains.map(d => `site:${d}`).join(' OR ')
    searchQuery = `(${siteFilter}) ${query}`
  }

  const params = new URLSearchParams({
    q: searchQuery,
    count: String(maxResults || SEARCH_CONFIG.maxResults),
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SEARCH_CONFIG.timeout)

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?${params}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': SEARCH_CONFIG.apiKey,
        },
        signal: controller.signal,
      }
    )
    clearTimeout(timer)

    if (!response.ok) {
      throw new Error(`Brave HTTP ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    const webResults = data?.web?.results || []
    return {
      answer: null,
      results: webResults.slice(0, maxResults || SEARCH_CONFIG.maxResults).map(r => ({
        title: r.title || '',
        url: r.url || '',
        content: (r.description || '').slice(0, 300),
        score: 0,
      })),
    }
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

// ── 统一搜索接口 ──

/**
 * 执行搜索
 * @param {string} query - 搜索关键词
 * @param {Object} options - 可选配置
 * @returns {Promise<{answer: string|null, results: Array}>}
 */
export async function executeSearch(query, options = {}) {
  if (!SEARCH_CONFIG.apiKey) {
    throw new Error('搜索服务未配置 API Key')
  }

  const { maxResults, allowedDomains, blockedDomains } = options

  if (SEARCH_CONFIG.provider === 'brave') {
    return searchBrave(query, maxResults, allowedDomains)
  }
  return searchTavily(query, maxResults, allowedDomains, blockedDomains)
}

/**
 * 格式化搜索结果为 LLM 可读文本
 */
export function formatSearchResults(data) {
  const parts = []

  if (data.answer) {
    parts.push(`概要: ${data.answer}`)
    parts.push('')
  }

  if (data.results?.length > 0) {
    parts.push('搜索结果:')
    for (let i = 0; i < data.results.length; i++) {
      const r = data.results[i]
      parts.push(`[${i + 1}] ${r.title}`)
      parts.push(`    URL: ${r.url}`)
      parts.push(`    ${r.content}`)
      parts.push('')
    }
  } else {
    parts.push('未找到相关结果。')
  }

  return parts.join('\n')
}

// ── Agent 工具定义（OpenAI function calling 格式） ──

export const WEB_SEARCH_TOOL_DEFINITION = {
  type: 'function',
  function: {
    name: 'web_search',
    description: '搜索互联网获取实时信息。当用户询问你不确定或可能过时的信息时使用，如时事新闻、最新数据、产品价格、门店信息等。返回搜索结果包含标题、URL和内容摘要。',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索查询关键词，使用简洁明确的中文或英文关键词',
        },
      },
      required: ['query'],
    },
  },
}

/**
 * 执行搜索工具调用（供 Agent 引擎使用）
 * @param {Object} toolCall - 工具调用参数
 * @returns {Promise<string>} 格式化后的搜索结果
 */
export async function executeWebSearchToolCall(toolCall) {
  const args = typeof toolCall.arguments === 'string'
    ? JSON.parse(toolCall.arguments)
    : toolCall.arguments

  const query = args?.query
  if (!query) {
    return '搜索参数缺失: 需要提供 query 参数'
  }

  try {
    const data = await executeSearch(query)
    return formatSearchResults(data)
  } catch (err) {
    console.error('[WebSearch] 搜索失败:', err.message)
    return `搜索失败: ${err.message}`
  }
}

// ── Web Fetch 工具（简单版本） ──

export const WEB_FETCH_TOOL_DEFINITION = {
  type: 'function',
  function: {
    name: 'web_fetch',
    description: '获取指定URL的网页内容。用于查看某个网页的详细信息。',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: '要获取的网页 URL',
        },
      },
      required: ['url'],
    },
  },
}

/**
 * 获取网页内容（通过 Vite 代理避免 CORS）
 */
export async function executeWebFetchToolCall(toolCall) {
  const args = typeof toolCall.arguments === 'string'
    ? JSON.parse(toolCall.arguments)
    : toolCall.arguments

  const url = args?.url
  if (!url) return '参数缺失: 需要提供 url 参数'

  try {
    // 通过 Vite 代理请求外部网页
    const proxyUrl = `/api/web-fetch?url=${encodeURIComponent(url)}`
    const response = await fetch(proxyUrl)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const text = await response.text()
    // 简单提取正文（去掉 script/style 标签）
    const cleaned = text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000)
    return cleaned || '(页面无文本内容)'
  } catch (err) {
    return `网页获取失败: ${err.message}`
  }
}
