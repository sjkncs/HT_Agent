/**
 * 对话历史持久化存储 — Conversation Store
 *
 * 双层存储架构：
 *   1. IndexedDB（浏览器 SQL）— 结构化存储对话元数据 + 完整消息历史
 *   2. MemOS 向量知识库 — 语义索引，支持跨会话相似对话检索
 *
 * 数据流：
 *   ChatInterface 对话结束 → saveConversation() → IndexedDB 写入 + MemOS 向量化
 *   Sidebar 加载 → getConversations() → IndexedDB 查询 → 按时间分组展示
 *   Sidebar 搜索 → searchConversations() → IndexedDB 全文 + MemOS 语义匹配
 */

const DB_NAME = 'heytea_conversations'
const DB_VERSION = 1
const STORE_NAME = 'conversations'

let _db = null

// ── IndexedDB 初始化 ──

function openDB() {
  if (_db) return Promise.resolve(_db)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        // 索引：支持按时间、分类、风险等级、会话状态查询
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('label', 'label', { unique: false })
        store.createIndex('riskLevel', 'riskLevel', { unique: false })
        store.createIndex('session_state', 'session_state', { unique: false })
        store.createIndex('intent', 'intent', { unique: false })
      }
    }

    request.onsuccess = (event) => {
      _db = event.target.result
      // 连接失效时自动重置缓存，避免后续操作抛出 InvalidStateError
      _db.onclose = () => { _db = null }
      _db.onversionchange = () => {
        _db.close()
        _db = null
      }
      resolve(_db)
    }

    request.onerror = (event) => {
      console.warn('[ConversationStore] IndexedDB 打开失败:', event.target.error)
      reject(event.target.error)
    }
  })
}

// ── CRUD 操作 ──

/**
 * 保存或更新一条对话
 * @param {Object} conversation - 对话对象
 * @param {string} conversation.id - 会话ID
 * @param {string} conversation.title - 对话标题（自动从首条用户消息提取）
 * @param {string} conversation.lastMessage - 最后一条消息摘要
 * @param {Date|number} conversation.timestamp - 创建/更新时间
 * @param {string} [conversation.label] - 分类标签（如"外源性异物/毛发"）
 * @param {string} [conversation.riskLevel] - 风险等级（high/medium/low）
 * @param {string} [conversation.session_state] - 会话状态
 * @param {string} [conversation.intent] - 检测到的意图
 * @param {string} [conversation.handler] - 处理人（AI/人工）
 * @param {number} [conversation.turn_count] - 对话轮数
 * @param {Object} [conversation.classification] - 分类结果
 * @param {Array} [conversation.messages] - 完整消息列表
 */
export async function saveConversation(conversation) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)

      // 确保 timestamp 是数字（Date.now()）
      const record = {
        ...conversation,
        timestamp: conversation.timestamp instanceof Date
          ? conversation.timestamp.getTime()
          : conversation.timestamp || Date.now(),
        updatedAt: Date.now(),
      }

      const request = store.put(record)
      request.onsuccess = () => resolve(record)
      request.onerror = (e) => {
        console.warn('[ConversationStore] 保存失败:', e.target.error)
        reject(e.target.error)
      }
    })
  } catch (err) {
    console.warn('[ConversationStore] 保存异常:', err.message)
  }
}

/**
 * 获取所有对话，按时间倒序
 * @param {Object} [options]
 * @param {string} [options.label] - 按分类过滤
 * @param {string} [options.riskLevel] - 按风险等级过滤
 * @param {number} [options.limit] - 最大返回数
 * @returns {Promise<Array>} 对话列表
 */
export async function getConversations(options = {}) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const index = store.index('timestamp')
      const request = index.openCursor(null, 'prev') // 倒序

      const results = []
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (!cursor) {
          resolve(results)
          return
        }

        const conv = cursor.value
        // 应用过滤器
        if (options.label && conv.label !== options.label) {
          cursor.continue()
          return
        }
        if (options.riskLevel && conv.riskLevel !== options.riskLevel) {
          cursor.continue()
          return
        }

        results.push(conv)
        if (options.limit && results.length >= options.limit) {
          resolve(results)
          return
        }
        cursor.continue()
      }
      request.onerror = (e) => {
        console.warn('[ConversationStore] 查询失败:', e.target.error)
        resolve([]) // 降级：返回空列表而非抛错
      }
    })
  } catch {
    return []
  }
}

/**
 * 获取单条对话详情（含完整消息历史）
 * @param {string} id - 会话ID
 * @returns {Promise<Object|null>}
 */
export async function getConversation(id) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

/**
 * 删除一条对话
 * @param {string} id - 会话ID
 */
export async function deleteConversation(id) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.delete(id)
      request.onsuccess = () => resolve(true)
      request.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

/**
 * 全文搜索对话（IndexedDB 遍历 + 多字段匹配）
 * @param {string} query - 搜索关键词
 * @param {number} [limit=20] - 最大返回数
 * @returns {Promise<Array>}
 */
export async function searchConversations(query, limit = 20) {
  if (!query) return getConversations({ limit })

  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.openCursor()
      const q = query.toLowerCase()
      const results = []

      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (!cursor) {
          // 按时间倒序排列
          results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          resolve(results.slice(0, limit))
          return
        }

        const conv = cursor.value
        // 多字段全文搜索
        const searchable = [
          conv.title, conv.lastMessage, conv.label,
          conv.handler, conv.intent,
          conv.classification?.consult_type,
        ].filter(Boolean).join(' ').toLowerCase()

        // 深度搜索：消息内容
        const messageMatch = conv.messages?.some(m =>
          m.content?.toLowerCase().includes(q)
        )

        if (searchable.includes(q) || messageMatch) {
          results.push(conv)
        }

        cursor.continue()
      }
      request.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

/**
 * 获取对话统计信息
 * @returns {Promise<Object>} { total, byLabel, byRisk, byState }
 */
export async function getConversationStats() {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.openCursor()
      let total = 0
      const byLabel = {}
      const byRisk = { high: 0, medium: 0, low: 0 }
      const byState = {}

      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (!cursor) {
          resolve({ total, byLabel, byRisk, byState })
          return
        }
        const conv = cursor.value
        total++
        const label = conv.label || '未分类'
        byLabel[label] = (byLabel[label] || 0) + 1
        if (conv.riskLevel && byRisk[conv.riskLevel] !== undefined) {
          byRisk[conv.riskLevel]++
        }
        const state = conv.session_state || 'active'
        byState[state] = (byState[state] || 0) + 1
        cursor.continue()
      }
      request.onerror = () => resolve({ total: 0, byLabel: {}, byRisk: {}, byState: {} })
    })
  } catch {
    return { total: 0, byLabel: {}, byRisk: {}, byState: {} }
  }
}

// ── MemOS 向量同步 ──

/**
 * 将对话同步到 MemOS 向量知识库
 * 提取对话摘要和关键信息，存入 MemOS 供未来语义检索
 * @param {Object} conversation - 对话对象
 */
export async function syncToMemOS(conversation) {
  try {
    const { addMemory, isMemoryAvailable } = await import('./memos-client.js')
    if (!isMemoryAvailable()) return

    // 提取对话中的用户消息和助手回复（取最近几条，避免截断导致语义丢失）
    const userMessages = (conversation.messages || [])
      .filter(m => m.role === 'user')
      .slice(-5) // 只取最后5条用户消息
      .map(m => m.content?.slice(0, 100)) // 每条最多100字
      .join(' | ')

    const assistantMessages = (conversation.messages || [])
      .filter(m => m.role === 'assistant')
      .slice(-3) // 只取最后3条助手回复
      .map(m => m.content?.slice(0, 150)) // 每条最多150字
      .join(' | ')

    if (!userMessages) return

    await addMemory({
      userMessage: userMessages,
      assistantMessage: assistantMessages,
      conversationId: conversation.id,
      tags: [
        'heytea-conversation',
        conversation.intent || 'unknown',
        conversation.label || 'unclassified',
      ].filter(Boolean),
    })
  } catch (err) {
    console.warn('[ConversationStore] MemOS 同步失败:', err.message)
  }
}

/**
 * 保存对话并同步到 MemOS（便捷方法）
 * @param {Object} conversation
 */
export async function saveAndSync(conversation) {
  const record = await saveConversation(conversation)
  if (!record) {
    console.warn('[ConversationStore] saveConversation 返回空，跳过 MemOS 同步')
    return record
  }
  // MemOS 同步不阻塞主流程
  syncToMemOS(conversation).catch(() => {})
  return record
}

// ── 从 ChatInterface 消息构建对话记录 ──

let _msgCounter = 0
function _genMsgId() {
  _msgCounter++
  return `msg-${Date.now()}-${_msgCounter}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * 从 ChatInterface 的消息列表构建可存储的对话记录
 * @param {string} sessionId - 会话ID
 * @param {Array} messages - ChatInterface 消息列表
 * @param {Object} [metadata] - 额外元数据
 * @returns {Object} 对话记录
 */
export function buildConversationRecord(sessionId, messages, metadata = {}) {
  const userMessages = messages.filter(m => m.role === 'user')
  const assistantMessages = messages.filter(m => m.role === 'assistant')
  const firstUserMsg = userMessages[0]?.content || ''
  const lastMsg = messages[messages.length - 1]

  // 自动生成标题：取首条用户消息的前30个字符
  const title = metadata.title
    || firstUserMsg.slice(0, 30) + (firstUserMsg.length > 30 ? '...' : '')
    || '新对话'

  // 最后一条消息摘要
  const lastMessage = lastMsg?.content
    ? lastMsg.content.slice(0, 60) + (lastMsg.content.length > 60 ? '...' : '')
    : ''

  // 从最后一条 assistant 消息中提取 intent/subScenario（如果 metadata 未提供）
  const lastAssistant = [...assistantMessages].reverse()[0]
  const intent = metadata.intent || lastAssistant?.intent || ''
  const subScenario = metadata.subScenario || lastAssistant?.subScenario || ''

  return {
    id: sessionId,
    title,
    lastMessage,
    timestamp: metadata.timestamp || Date.now(),
    label: metadata.label || metadata.classification?.consult_type || '',
    riskLevel: metadata.riskLevel || metadata.classification?.risk_level || 'low',
    session_state: metadata.session_state || 'active',
    intent,
    subScenario,
    handler: metadata.handler || 'AI',
    turn_count: userMessages.length,
    classification: metadata.classification || null,
    sla_status: metadata.sla_status || 'normal',
    messages: messages.map(m => ({
      id: m.id || _genMsgId(),
      role: m.role,
      content: m.content,
      timestamp: m.timestamp || new Date().toISOString(),
    })),
  }
}
