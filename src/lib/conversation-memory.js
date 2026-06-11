/**
 * 对话记忆管理器 — Conversation Memory Manager
 * 
 * 解决多轮对话中的上下文丢失问题：
 *   1. 关键事实提取 — 从对话中自动提取订单号、门店、产品、电话等关键信息
 *   2. 历史摘要 — 当对话超过阈值时，将早期消息压缩为结构化摘要
 *   3. 记忆注入 — 将摘要和事实注入 LLM 的系统提示词
 *   4. 跨会话持久化 — 支持记忆在刷新/重连后恢复
 * 
 * 理论基础:
 *   LangChain Memory (课件 §7.2.1):
 *     "记忆系统需要支持两个基本操作：读取和写入。在接收到初始用户输入，
 *      但执行核心逻辑之前，链将从记忆系统中读取内容并增强用户输入。"
 *   
 *   ConversationSummaryMemory:
 *     将长对话压缩为摘要，避免 token 过载同时保留关键上下文
 *   
 *   ConversationEntityMemory:
 *     追踪对话中提到的实体（人名、订单号、门店等），跨轮次持久化
 */

// ─── 配置 ───
const CONFIG = {
  MAX_DIRECT_HISTORY: 20,        // 直接传给LLM的消息对数（20对=40条，现代LLM上下文足够承载）
  SUMMARY_THRESHOLD: 6,          // 超过6条消息即触发摘要（3轮对话后开始压缩早期内容）
  SUMMARY_KEEP_RECENT: 6,        // 摘要时保留最近6条消息不压缩（与 MAX_DIRECT_HISTORY 解耦）
  MAX_FACTS: 30,                 // 最多追踪的事实数（扩展以覆盖更多对话细节）
  FACT_DECAY_TURNS: 50,          // 事实经过多少轮后降权（延长衰减以保留更多上下文）
  COMPRESS_MAX_CHARS: 250,       // 单条消息压缩后最大字符数（从100提升，保留更多语义）
  SUMMARY_MAX_CHARS: 2500,       // 摘要注入 system prompt 时的最大字符数
  STORAGE_KEY: 'heytea_conv_memory',
}

// ─── 事实提取正则 ───
const FACT_PATTERNS = {
  orderId: [
    /订单号[：:\s]*(\d{10,})/i,
    /单号[：:\s]*(\d{10,})/i,
    /订单[：:\s]*(\d{10,})/i,
  ],
  phone: [
    /(?:手机|电话|号码|联系方式)[：:\s]*(1[3-9]\d{9})/i,
    /(1[3-9]\d{9})/,
  ],
  storeName: [
    /(?:门店|店名|哪家店|在)[：:\s]*(.{2,20}?(?:店|门店|广场|中心|mall))/i,
    /(?:喜茶|heytea)[·\s]*(.{2,15}?(?:店|$))/i,
  ],
  product: [
    /(?:点了?|买了?|喝了?|要)[：:\s]*((?:一杯|一份|一)?[\u4e00-\u9fa5]{2,8}(?:葡萄|莓莓|芒芒|桃桃|红柚|柠檬茶|绿茶|春茶|冰茶|甘露|拿铁|美式))/i,
    /((?:多肉|芝芝|满杯|百香)[\u4e00-\u9fa5]{1,4})/i,
  ],
  cupCount: [
    /(\d+)\s*(?:杯|份|个)/,
    /(?:买了|点了|喝了)\s*(\d+)/,
  ],
  timeReference: [
    /(?:今天|昨天|前天|上周|刚才|中午|下午|早上|晚上)/i,
    /(\d{1,2}[：:点]\d{0,2})/,
    /(\d{1,2}月\d{1,2}[日号])/i,
  ],
  complaint: [
    /(?:异物|头发|虫|蟑螂|苍蝇|金属|塑料|玻璃)/i,
    /(?:拉肚子|呕吐|不舒服|过敏|肚子疼|恶心|头晕)/i,
    /(?:变质|过期|发霉|变酸|异味|变味)/i,
    /(?:退款|赔偿|补偿|退钱|赔钱)/i,
    /(?:投诉|举报|曝光|工商|消协|12315)/i,
  ],
  emotionSignal: [
    /(?:太离谱|太过分|气死|无语|恶心|失望|再也不敢|不会再来)/i,
    /(?:谢谢|感谢|辛苦了|太好了|很满意|不错)/i,
  ],
  healthStatus: [
    /(?:已经|好多了|还没好|加重|去了医院|正在吃药|好一点了|没有好转)/i,
  ],
}

// ─── 事实提取器 ───

/**
 * 从单条消息中提取关键事实
 * @param {string} text - 消息内容
 * @param {string} role - 'user' | 'assistant'
 * @param {number} turnIndex - 当前轮次
 * @returns {Array<Object>} 提取到的事实 [{type, value, turn, role}]
 */
export function extractFacts(text, role, turnIndex) {
  if (!text) return []
  const facts = []

  for (const [factType, patterns] of Object.entries(FACT_PATTERNS)) {
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const value = match[1] || match[0]
        // 避免重复
        facts.push({
          type: factType,
          value: value.trim(),
          turn: turnIndex,
          role,
          timestamp: Date.now(),
        })
        break // 每种类型只取第一个匹配
      }
    }
  }

  return facts
}

// ─── 记忆管理器 ───

/**
 * 创建对话记忆管理器
 * @param {string} sessionId - 会话ID
 * @returns {Object} 记忆管理器实例
 */
export function createConversationMemory(sessionId) {
  let memory = {
    sessionId,
    facts: [],            // 提取的关键事实
    summary: null,        // 早期对话摘要
    summarizedUpTo: 0,    // 摘要覆盖到的消息索引
    emotionTrajectory: [], // 情绪轨迹
    topicShifts: [],       // 话题切换记录
    turnCount: 0,         // 总轮次
    lastActive: Date.now(),
  }

  // 尝试从存储恢复
  const stored = _loadMemory(sessionId)
  if (stored) {
    memory = { ...memory, ...stored }
  }

  return {
    /**
     * 处理新消息 — 提取事实并更新记忆
     */
    processMessage(text, role, turnIndex) {
      if (role === 'user') {
        memory.turnCount++
      }

      // 提取事实
      const newFacts = extractFacts(text, role, turnIndex)
      for (const fact of newFacts) {
        // 去重：同类型事实只保留最新的
        const existingIdx = memory.facts.findIndex(f => f.type === fact.type && f.value === fact.value)
        if (existingIdx >= 0) {
          memory.facts[existingIdx] = fact
        } else {
          memory.facts.push(fact)
        }
      }

      // 限制事实数量
      if (memory.facts.length > CONFIG.MAX_FACTS) {
        // 保留最新的，淘汰最旧的
        memory.facts = memory.facts.slice(-CONFIG.MAX_FACTS)
      }

      // 情绪轨迹
      const emotionSignals = text.match(/(?:太离谱|太过分|气死|谢谢|感谢|满意|失望)/gi)
      if (emotionSignals && role === 'user') {
        memory.emotionTrajectory.push({
          turn: turnIndex,
          signals: emotionSignals,
        })
      }

      memory.lastActive = Date.now()
      _saveMemory(memory)
    },

    /**
     * 生成历史摘要 — 将早期对话压缩为结构化摘要
     * 与 MAX_DIRECT_HISTORY 解耦：摘要覆盖旧消息，直接历史窗口独立控制
     * @param {Array} messages - 完整消息列表 [{role, content}]
     */
    generateSummary(messages) {
      if (messages.length <= CONFIG.SUMMARY_THRESHOLD) return

      // 摘要范围：从上次摘要位置到「最近 N 条消息」之前
      // 使用 SUMMARY_KEEP_RECENT（小窗口）而非 MAX_DIRECT_HISTORY * 2（大窗口）
      const recentStart = Math.max(0, messages.length - CONFIG.SUMMARY_KEEP_RECENT)
      const toSummarize = messages.slice(memory.summarizedUpTo, recentStart)
      if (toSummarize.length < 2) return

      const summaryParts = []
      let currentTopic = null

      for (let i = 0; i < toSummarize.length; i++) {
        const msg = toSummarize[i]
        if (msg.role === 'user') {
          // 提取用户意图关键词
          const intentKeywords = _extractIntentKeywords(msg.content)
          if (intentKeywords.length > 0) {
            const topic = intentKeywords[0]
            if (topic !== currentTopic) {
              currentTopic = topic
              memory.topicShifts.push({ turn: i + memory.summarizedUpTo, topic })
            }
          }
          // 压缩用户消息
          const compressed = _compressMessage(msg.content, 'user')
          if (compressed) summaryParts.push(`[用户] ${compressed}`)
        } else if (msg.role === 'assistant') {
          const compressed = _compressMessage(msg.content, 'assistant')
          if (compressed) summaryParts.push(`[阿喜] ${compressed}`)
        }
      }

      // 合并为新摘要
      const newSummary = summaryParts.join('\n')
      if (memory.summary) {
        memory.summary = `[早期对话]\n${memory.summary}\n\n[后续对话]\n${newSummary}`
        // 摘要膨胀保护：超过上限时只保留最新部分
        if (memory.summary.length > CONFIG.SUMMARY_MAX_CHARS * 2) {
          memory.summary = memory.summary.slice(-CONFIG.SUMMARY_MAX_CHARS)
        }
      } else {
        memory.summary = newSummary
      }

      memory.summarizedUpTo = recentStart
      _saveMemory(memory)
    },

    /**
     * 构建记忆上下文 — 生成注入 system prompt 的记忆摘要
     * @returns {string} 格式化的记忆文本
     */
    buildMemoryContext() {
      const parts = []

      // 1. 关键事实
      const activeFacts = _getActiveFacts(memory)
      if (activeFacts.length > 0) {
        parts.push('## 对话中已获取的关键信息')
        for (const fact of activeFacts) {
          const label = FACT_LABELS[fact.type] || fact.type
          parts.push(`- ${label}：${fact.value}`)
        }
      }

      // 2. 对话摘要
      if (memory.summary) {
        parts.push('')
        parts.push('## 此前对话摘要')
        // 截断过长的摘要（使用配置的上限）
        const truncated = memory.summary.length > CONFIG.SUMMARY_MAX_CHARS 
          ? memory.summary.slice(0, CONFIG.SUMMARY_MAX_CHARS) + '...(更早的对话已省略)'
          : memory.summary
        parts.push(truncated)
      }

      // 3. 对话进度
      if (memory.turnCount > 2) {
        parts.push('')
        parts.push(`## 对话进度`)
        parts.push(`- 当前是第 ${memory.turnCount} 轮对话`)
        if (memory.topicShifts.length > 0) {
          const topics = memory.topicShifts.map(t => t.topic).slice(-3)
          parts.push(`- 涉及话题：${topics.join('、')}`)
        }
      }

      return parts.length > 0 ? parts.join('\n') : ''
    },

    /**
     * 获取应传给LLM的对话历史（含摘要增强）
     * @param {Array} allMessages - 完整消息列表
     * @returns {Array} 处理后的消息列表
     */
    getEnhancedHistory(allMessages) {
      // 触发摘要生成
      this.generateSummary(allMessages)

      // 取最近的 N 条消息
      const recentMessages = allMessages.slice(-CONFIG.MAX_DIRECT_HISTORY * 2)

      // 如果有摘要，将摘要作为第一条"system"级别上下文
      if (memory.summary) {
        const summaryText = memory.summary.length > CONFIG.SUMMARY_MAX_CHARS
          ? memory.summary.slice(0, CONFIG.SUMMARY_MAX_CHARS) + '...'
          : memory.summary
        const summaryMsg = {
          role: 'system',
          content: `[此前对话摘要 — 请参考但不要直接复述]\n${summaryText}`,
        }
        return [summaryMsg, ...recentMessages]
      }

      return recentMessages
    },

    /**
     * 获取原始记忆数据
     */
    getMemory() {
      return { ...memory }
    },

    /**
     * 清除记忆
     */
    clear() {
      memory = {
        sessionId,
        facts: [],
        summary: null,
        summarizedUpTo: 0,
        emotionTrajectory: [],
        topicShifts: [],
        turnCount: 0,
        lastActive: Date.now(),
      }
      _clearMemory(sessionId)
    },
  }
}

// ─── 事实标签映射 ───
const FACT_LABELS = {
  orderId: '订单号',
  phone: '联系电话',
  storeName: '门店',
  product: '涉及产品',
  cupCount: '杯数',
  timeReference: '时间',
  complaint: '投诉类型',
  emotionSignal: '情绪信号',
  healthStatus: '健康状况',
}

// ─── 工具函数 ───

function _extractIntentKeywords(text) {
  const keywords = []
  const intents = {
    '食安异物': /异物|头发|虫|蟑螂|苍蝇|金属|塑料|玻璃/,
    '身体不适': /拉肚子|呕吐|不舒服|过敏|肚子疼|恶心|头晕|身体/,
    '退款补偿': /退款|赔偿|补偿|退钱|赔钱|退款/,
    '订单查询': /查.*订单|订单.*状态|取餐码|到哪了|做好了吗/,
    '产品质量': /变质|过期|发霉|变酸|异味|变味|味道不对/,
    '门店服务': /门店|店员|态度|服务|排队|等待/,
    '产品咨询': /推荐|新品|有什么|菜单|成分|热量/,
    '自助点单': /点一杯|想买|帮我点|来一杯|下单/,
  }
  for (const [intent, pattern] of Object.entries(intents)) {
    if (pattern.test(text)) keywords.push(intent)
  }
  return keywords
}

function _compressMessage(text, role) {
  if (!text) return ''
  // 压缩策略：去除多余空白，保留核心信息
  const cleaned = text
    .replace(/\n{2,}/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim()

  // 截断过长消息（使用配置的上限，保留更多语义）
  if (cleaned.length > CONFIG.COMPRESS_MAX_CHARS) {
    return cleaned.slice(0, CONFIG.COMPRESS_MAX_CHARS) + '...'
  }
  return cleaned
}

function _getActiveFacts(memory) {
  const now = Date.now()
  return memory.facts.filter(fact => {
    // 投诉类型和情绪信号永远保留
    if (['complaint', 'emotionSignal'].includes(fact.type)) return true
    // 其他事实在一定轮次内有效
    const turnsSince = memory.turnCount - fact.turn
    return turnsSince < CONFIG.FACT_DECAY_TURNS
  }).sort((a, b) => {
    // 按类型优先级排序
    const priority = { orderId: 1, phone: 2, storeName: 3, product: 4, complaint: 5, healthStatus: 6, cupCount: 7, timeReference: 8, emotionSignal: 9 }
    return (priority[a.type] || 99) - (priority[b.type] || 99)
  })
}

// ─── 存储层（基于内存 + 可选 localStorage）───
const _memoryStore = new Map()

function _saveMemory(memory) {
  _memoryStore.set(memory.sessionId, { ...memory })
  // 尝试持久化到 localStorage（浏览器环境）
  try {
    if (typeof localStorage !== 'undefined') {
      const data = JSON.stringify({
        ...memory,
        facts: memory.facts.slice(-10), // 只持久化最近10条事实
        summary: memory.summary?.slice(0, 1000) || null, // 限制摘要大小
      })
      localStorage.setItem(`${CONFIG.STORAGE_KEY}_${memory.sessionId}`, data)
    }
  } catch (e) {
    // 静默失败
  }
}

function _loadMemory(sessionId) {
  // 先检查内存
  if (_memoryStore.has(sessionId)) {
    return _memoryStore.get(sessionId)
  }
  // 尝试从 localStorage 恢复
  try {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(`${CONFIG.STORAGE_KEY}_${sessionId}`)
      if (data) {
        const parsed = JSON.parse(data)
        _memoryStore.set(sessionId, parsed)
        return parsed
      }
    }
  } catch (e) {
    // 静默失败
  }
  return null
}

function _clearMemory(sessionId) {
  _memoryStore.delete(sessionId)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`${CONFIG.STORAGE_KEY}_${sessionId}`)
    }
  } catch (e) {}
}

// ─── 全局记忆管理器注册表 ───
const _managerRegistry = new Map()

/**
 * 获取或创建会话的记忆管理器
 * @param {string} sessionId 
 * @returns {Object} ConversationMemory 实例
 */
export function getOrCreateMemory(sessionId) {
  if (!_managerRegistry.has(sessionId)) {
    _managerRegistry.set(sessionId, createConversationMemory(sessionId))
  }
  return _managerRegistry.get(sessionId)
}

/**
 * 批量提取并更新记忆（便捷方法）
 * @param {string} sessionId 
 * @param {Array} messages - [{role, content}]
 * @returns {string} 记忆上下文文本
 */
export function processAndUpdateMemory(sessionId, messages) {
  const mem = getOrCreateMemory(sessionId)
  
  // 处理最近的消息
  const lastMsg = messages[messages.length - 1]
  if (lastMsg) {
    mem.processMessage(lastMsg.content, lastMsg.role, messages.filter(m => m.role === lastMsg.role).length)
  }

  // 生成摘要
  mem.generateSummary(messages)

  // 返回记忆上下文
  return mem.buildMemoryContext()
}
