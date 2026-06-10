/**
 * 喜茶 AI 工作流执行引擎 — 轻量级 DAG 执行引擎
 * 对标 Coze(扣子) 工作流执行架构
 * 
 * 功能:
 * - DAG 拓扑排序 + 依赖解析
 * - 节点执行器注册机制（每种节点类型一个 executor）
 * - 变量插值引擎: 解析 {{nodeId.field}} 引用
 * - 条件分支求值器 (if/else)
 * - LLM 节点调用（复用 llm-client.js）
 * - 插件节点调用（复用 mcp-prompt-integration.js）
 * - 代码节点沙箱执行 (new Function)
 * - HTTP 请求节点 (fetch wrapper)
 * - 执行日志记录
 * - 错误处理与超时机制
 */

// Import from existing modules
import { simpleChat as callLLM, getLLMConfig } from './llm-client.js'
import { executeMCPTool as callMCPToolPublic } from './mcp-prompt-integration.js'

// ─── Execution State ───
let _executionState = {
  running: false,
  currentWorkflow: null,
  currentNode: null,
  context: {},       // { nodeId: { output_field: value } }
  variables: {},     // global workflow variables
  logs: [],          // [{ nodeId, status, input, output, duration, error }]
  startTime: null,
  cancelled: false,
}

// ─── Node Executor Registry ───
const _executors = {}

export function registerExecutor(nodeType, executor) {
  _executors[nodeType] = executor
}

// ─── Variable Interpolation ───
// Replaces {{nodeId.field}} with values from context
export function interpolateVariables(template, context) {
  if (typeof template !== 'string') return template
  return template.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, nodeId, field) => {
    const nodeOutput = context[nodeId]
    if (nodeOutput && nodeOutput[field] !== undefined) {
      return nodeOutput[field]
    }
    // Also check variables
    if (context._variables && context._variables[`${nodeId}.${field}`] !== undefined) {
      return context._variables[`${nodeId}.${field}`]
    }
    return match // keep unresolved
  })
}

// Deep interpolate for objects/arrays
function deepInterpolate(obj, context) {
  if (typeof obj === 'string') return interpolateVariables(obj, context)
  if (Array.isArray(obj)) return obj.map(item => deepInterpolate(item, context))
  if (obj && typeof obj === 'object') {
    const result = {}
    for (const [k, v] of Object.entries(obj)) {
      result[k] = deepInterpolate(v, context)
    }
    return result
  }
  return obj
}

// ─── Topological Sort ───
export function topologicalSort(nodes, edges) {
  const nodeIds = new Set(nodes.map(n => n.id))
  const inDegree = {}
  const adjacency = {}
  
  nodes.forEach(n => { inDegree[n.id] = 0; adjacency[n.id] = [] })
  edges.forEach(e => {
    if (nodeIds.has(e.from) && nodeIds.has(e.to)) {
      adjacency[e.from].push(e.to)
      inDegree[e.to] = (inDegree[e.to] || 0) + 1
    }
  })
  
  const queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id)
  const sorted = []
  
  while (queue.length > 0) {
    const id = queue.shift()
    sorted.push(id)
    for (const neighbor of (adjacency[id] || [])) {
      inDegree[neighbor]--
      if (inDegree[neighbor] === 0) queue.push(neighbor)
    }
  }
  
  if (sorted.length !== nodes.length) {
    console.warn('工作流可能存在循环依赖，已处理', nodes.length - sorted.length, '个不可达节点')
  }
  
  return sorted.map(id => nodes.find(n => n.id === id)).filter(Boolean)
}

// ─── Condition Evaluator ───
function evaluateCondition(conditionStr, context) {
  if (!conditionStr) return true
  
  // Simple condition parser: "field == value", "field != value", "field > value"
  const match = conditionStr.match(/(\w+(?:\.\w+)?)\s*(==|!=|>|<|>=|<=|contains|is_empty|is_not_empty)\s*(.*)/)
  if (!match) return true
  
  const [, ref, op, rawValue] = match
  const value = interpolateVariables(`{{${ref}}}`, context)
  
  switch (op.trim()) {
    case '==': return String(value) === String(rawValue).trim().replace(/['"]/g, '')
    case '!=': return String(value) !== String(rawValue).trim().replace(/['"]/g, '')
    case '>': return Number(value) > Number(rawValue)
    case '<': return Number(value) < Number(rawValue)
    case '>=': return Number(value) >= Number(rawValue)
    case '<=': return Number(value) <= Number(rawValue)
    case 'contains': return String(value).includes(rawValue.trim())
    case 'is_empty': return !value || value === ''
    case 'is_not_empty': return !!value && value !== ''
    default: return true
  }
}

// ─── Default Node Executors ───

// Trigger node - passes through input
registerExecutor('trigger', async (node, context, options) => {
  return { 
    triggered: true, 
    input: context._input || {},
    triggerType: node.config?.triggerType || 'message',
    channel: node.config?.channel || ['web'],
  }
})

// LLM node - calls language model
registerExecutor('llm', async (node, context, options) => {
  const config = node.config || {}
  const systemPrompt = deepInterpolate(config.system_prompt || '', context)
  const userPrompt = deepInterpolate(context._input?.message || context._input?.user_input || '请处理', context)
  
  try {
    const llmConfig = getLLMConfig()
    // Use callLLM (simpleChat) if available and configured
    if (typeof callLLM === 'function' && llmConfig?.apiKey) {
      const response = await callLLM(systemPrompt, userPrompt, {
        model: config.model || llmConfig.model,
        temperature: config.temperature || 0.7,
        max_tokens: config.max_tokens || 800,
      })
      return { reply: response, model: config.model, tokens_used: 0 }
    }
    
    // Mock LLM response
    return {
      reply: `[Mock LLM 回复] 节点 "${node.label}" 使用模型 ${config.model || 'qwen-max'} 处理了输入。系统提示: ${systemPrompt.substring(0, 50)}...`,
      model: config.model || 'qwen-max',
      temperature: config.temperature || 0.7,
      tokens_used: Math.floor(100 + Math.random() * 500),
    }
  } catch (err) {
    return { reply: `[LLM 错误] ${err.message}`, error: true }
  }
})

// Classifier node - classifies input
registerExecutor('classifier', async (node, context, options) => {
  const categories = node.config?.categories || ['其他']
  const input = context._input?.message || ''
  
  // Simple keyword-based mock classification
  const categoryMap = {
    // 外源性异物
    '异物': '外源性异物', '毛发': '外源性异物', '头发': '外源性异物', '塑料': '外源性异物',
    '金属': '外源性异物', '铁丝': '外源性异物', '玻璃': '外源性异物', '刀片': '外源性异物',
    '苍蝇': '外源性异物', '蟑螂': '外源性异物', '虫子': '外源性异物', '纸片': '外源性异物',
    '线头': '外源性异物', '烟头': '外源性异物', '钢丝球': '外源性异物', '订书钉': '外源性异物',
    // 内源性异物
    '籽': '内源性异物', '果核': '内源性异物', '果籽': '内源性异物', '葡萄籽': '内源性异物',
    '茶渣': '内源性异物', '茶叶': '内源性异物', '果肉': '内源性异物', '果皮': '内源性异物',
    '颗粒物': '内源性异物', '沉淀': '内源性异物', '纤维': '内源性异物',
    // 变质/效期
    '变质': '原料变质', '发霉': '原料变质', '腐烂': '原料变质', '过期': '产品有效期',
    '保质期': '产品有效期', '有效期': '产品有效期', '涨袋': 'OEM变质',
    // 身体不适
    '肚子': '身体不适', '腹泻': '身体不适', '过敏': '身体不适', '拉肚子': '身体不适',
    '呕吐': '身体不适', '恶心': '身体不适', '发烧': '身体不适', '头晕': '身体不适',
    // 异味/口感
    '味道': '饮品异味', '异味': '饮品异味', '怪味': '饮品异味', '馊味': '饮品异味',
    '酸臭': '饮品异味', '变味': '饮品异味',
    // 包装
    '包装': '包装问题', '漏杯': '包装问题', '撒了': '包装问题', '封口': '包装问题',
    // 温度
    '温度': '温度异常', '不热': '温度异常', '不冷': '温度异常',
    // 品质投诉
    '品控': '食安待确认', '品质': '食安待确认', '卫生': '食安待确认',
  }
  
  let result = '其他/未分类'
  let confidence = 0.5
  
  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (input.includes(keyword) && categories.includes(category)) {
      result = category
      confidence = 0.7 + Math.random() * 0.25
      break
    }
  }
  
  return {
    result,
    confidence: Math.round(confidence * 100) / 100,
    model: node.config?.model || 'qwen2.5-vl-finetuned',
    all_scores: Object.fromEntries(categories.map(c => [c, c === result ? confidence : Math.random() * 0.3])),
  }
})

// Condition node - routes based on conditions
registerExecutor('condition', async (node, context, options) => {
  const branches = node.config?.branches || []
  
  for (const branch of branches) {
    const condition = branch.condition || ''
    const interpolated = interpolateVariables(condition, context)
    if (evaluateCondition(interpolated, context)) {
      return { matched_branch: branch.target || branch.condition, branch_label: branch.branch || 'matched' }
    }
  }
  
  // Also handle simple condition format
  if (node.config?.condition) {
    const cond = interpolateVariables(node.config.condition, context)
    const result = evaluateCondition(cond, context)
    return { matched_branch: result ? node.config.branches?.yes : node.config.branches?.no, result }
  }
  
  // Default: assign risk level based on classifier output
  const classifyResult = context['n-classify']?.result || ''
  let risk_level = 'low'
  if (['身体不适', '原料变质', 'OEM变质', 'OEM过期'].includes(classifyResult)) risk_level = 'high'
  else if (['外源性异物', '饮品异味', '包装问题', '食安待确认'].includes(classifyResult)) risk_level = 'medium'
  else if (['内源性异物', '产品有效期', '原料未熟'].includes(classifyResult)) risk_level = 'medium'
  
  return { matched_branch: risk_level, risk_level }
})

// Plugin node - calls external plugin/MCP tool
registerExecutor('plugin', async (node, context, options) => {
  const pluginName = node.config?.plugin || ''
  const params = deepInterpolate(node.config?.params || {}, context)
  
  // Map plugin names to MCP/Skill tool names
  const pluginToMCP = {
    'query_compensation': 'query_compensation',   // → Skill tool (food safety)
    'query_history': 'query_history',             // → Skill tool (food safety)
    'store_query': 'store_query',                 // → Skill tool (food safety)
    'query_order': 'queryOrderDetail',             // → MCP tool
    'queryStoreList': 'queryStoreList',            // → MCP tool
    'queryOrderDetail': 'queryOrderDetail',        // → MCP tool
    'createOrder': 'createOrder',                  // → MCP tool
    'searchProduct': 'searchProduct',              // → MCP tool
  }
  
  const mcpTool = pluginToMCP[pluginName]
  
  if (mcpTool && options?.executeMCPTool) {
    try {
      const result = await options.executeMCPTool(mcpTool, params)
      return { success: true, plugin: pluginName, result }
    } catch (err) {
      return { success: false, plugin: pluginName, error: err.message }
    }
  }
  
  // Fallback: try calling the imported MCP tool directly
  if (mcpTool && typeof callMCPToolPublic === 'function') {
    try {
      const result = await callMCPToolPublic(mcpTool, params)
      return { success: true, plugin: pluginName, result }
    } catch (err) {
      return { success: false, plugin: pluginName, error: err.message }
    }
  }
  
  // Mock plugin response
  return {
    success: true,
    plugin: pluginName,
    params_received: params,
    mock_response: {
      compensation_allowed: true,
      solution_type: 'refund_and_coupon',
      refund_amount: 19,
      store_callback_required: true,
    },
  }
})

// Script node - generates response from template
registerExecutor('script', async (node, context, options) => {
  const templateId = node.config?.template_id || ''
  const variables = node.config?.variables || []
  
  // Build template context
  const templateVars = {}
  for (const v of variables) {
    templateVars[v] = deepInterpolate(`{{${v}}}`, context) || `[${v}]`
  }
  
  // Simple template rendering
  let output = `根据模板 ${templateId} 生成的回复。\n\n`
  output += `分类: ${context['n-classify']?.result || '未知'}\n`
  output += `风险等级: ${context['n-risk']?.risk_level || context['n-risk']?.matched_branch || '未评估'}\n`
  
  return { output, template_id: templateId, variables: templateVars }
})

// Action node - executes an action (create ticket, send notification)
registerExecutor('action', async (node, context, options) => {
  const action = node.config?.action || 'create_ticket'
  const params = deepInterpolate(node.config || {}, context)
  
  return {
    action,
    executed: true,
    ticket_id: `TK-${Date.now().toString(36).toUpperCase()}`,
    priority: params.priority || 'medium',
    assignee: params.assignee || 'default_group',
    created_at: new Date().toISOString(),
  }
})

// Knowledge node - RAG retrieval
registerExecutor('knowledge', async (node, context, options) => {
  const query = context._input?.message || ''
  const topK = node.config?.topK || 3
  
  return {
    query,
    index: node.config?.index || 'food_safety_kb_v2',
    results: [
      { score: 0.92, chunk: '食安标准操作流程：发现异物时应立即拍照记录，保留样品...' },
      { score: 0.85, chunk: '补偿方案指南：低风险问题可重做或退款，中风险可退款+代金券...' },
      { score: 0.78, chunk: '升级流程：身体不适类投诉需在1小时内升级至区域负责人...' },
    ].slice(0, topK),
    total_retrieved: topK,
  }
})

// Human node - escalation to human agent
registerExecutor('human', async (node, context, options) => {
  return {
    escalated: true,
    group: node.config?.escalation_group || 'default',
    sla_hours: node.config?.sla_hours || 4,
    notify_channels: node.config?.notify_channels || ['dingtalk'],
    ticket_created: true,
    estimated_wait: `${Math.floor(5 + Math.random() * 25)}分钟`,
  }
})

// Delay node - waits for specified time
registerExecutor('delay', async (node, context, options) => {
  const seconds = node.config?.seconds || 1
  // In mock mode, just simulate the delay briefly
  if (options?.skipDelay) {
    return { delayed: true, seconds, simulated: true }
  }
  await new Promise(r => setTimeout(r, Math.min(seconds * 100, 2000))) // cap at 2s for UX
  return { delayed: true, seconds }
})

// ─── Coze-Compatible Node Executors ───

// Code node - sandboxed JavaScript execution
registerExecutor('code', async (node, context, options) => {
  const code = node.config?.code || 'return { result: "no code" }'
  const language = node.config?.language || 'javascript'
  
  try {
    // Create sandboxed function with context as parameter
    const sandboxedFn = new Function('context', 'input', 'variables', `
      "use strict";
      ${code}
    `)
    
    const input = deepInterpolate(node.config?.inputs || {}, context)
    const result = await sandboxedFn(context, input, context._variables || {})
    
    return { success: true, result: result || {}, language }
  } catch (err) {
    return { success: false, error: err.message, language }
  }
})

// Variable node - assigns values to variables
registerExecutor('variable', async (node, context, options) => {
  const assignments = node.config?.assignments || []
  const result = {}
  
  for (const assignment of assignments) {
    const name = assignment.name || assignment.variable
    const rawValue = assignment.value
    const value = typeof rawValue === 'string' ? interpolateVariables(rawValue, context) : rawValue
    
    result[name] = value
    if (!context._variables) context._variables = {}
    context._variables[name] = value
  }
  
  return { assigned: result }
})

// HTTP Request node - generic HTTP call
registerExecutor('http_request', async (node, context, options) => {
  const config = node.config || {}
  const url = interpolateVariables(config.url || '', context)
  const method = config.method || 'GET'
  const headers = deepInterpolate(config.headers || {}, context)
  const body = deepInterpolate(config.body || {}, context)
  
  // In mock mode, return simulated response
  if (options?.mockMode) {
    return {
      status: 200,
      statusText: 'OK',
      url,
      method,
      response: { mock: true, message: `Mock ${method} response from ${url}` },
      latency: Math.floor(50 + Math.random() * 150),
    }
  }
  
  try {
    const resp = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
    })
    const data = await resp.json()
    return { status: resp.status, statusText: resp.statusText, url, method, response: data }
  } catch (err) {
    return { status: 0, error: err.message, url, method }
  }
})

// End node - terminates workflow with output
registerExecutor('end', async (node, context, options) => {
  const outputFields = node.config?.outputs || []
  const output = {}
  
  for (const field of outputFields) {
    const fieldDef = typeof field === 'string' ? { name: field, source: `{{${field}}}` } : field
    output[fieldDef.name] = interpolateVariables(fieldDef.source || `{{${fieldDef.name}}}`, context)
  }
  
  return { completed: true, output }
})

// Question node - asks user a question (in mock mode, auto-answers)
registerExecutor('question', async (node, context, options) => {
  const question = interpolateVariables(node.config?.question || '请输入信息', context)
  
  // In mock/auto mode, provide a simulated answer
  if (options?.autoAnswer) {
    return { question, answer: options.autoAnswer, auto_answered: true }
  }
  
  return { question, awaiting_input: true, question_type: node.config?.type || 'text' }
})

// Loop node - iterates over array (simplified)
registerExecutor('loop', async (node, context, options) => {
  const arrayRef = node.config?.array || '[]'
  const items = deepInterpolate(arrayRef, context)
  let parsedItems
  
  if (typeof items === 'string') {
    try {
      parsedItems = JSON.parse(items || '[]')
    } catch {
      parsedItems = []
    }
  } else if (Array.isArray(items)) {
    parsedItems = items
  } else {
    parsedItems = []
  }
  
  const results = []
  for (let i = 0; i < parsedItems.length; i++) {
    results.push({
      index: i,
      item: parsedItems[i],
      status: 'processed',
    })
  }
  
  return { total: parsedItems.length, results, completed: true }
})

// ─── Main Execution Functions ───

function addLog(nodeId, status, data) {
  _executionState.logs.push({
    nodeId,
    status,
    timestamp: Date.now(),
    ...data,
  })
}

export function getExecutionState() {
  return { ..._executionState }
}

export function resetExecutionState() {
  _executionState = {
    running: false,
    currentWorkflow: null,
    currentNode: null,
    context: {},
    variables: {},
    logs: [],
    startTime: null,
    cancelled: false,
  }
}

/**
 * Execute a single node in isolation
 * @param {Object} node - { id, type, label, config }
 * @param {Object} context - execution context with prior node outputs
 * @param {Object} options - execution options
 * @returns {Object} node execution result
 */
export async function executeNode(node, context = {}, options = {}) {
  const executor = _executors[node.type]
  if (!executor) {
    throw new Error(`未注册的节点类型: ${node.type}`)
  }
  
  const startTime = Date.now()
  try {
    const result = await executor(node, context, options)
    const duration = Date.now() - startTime
    return { success: true, output: result, duration: `${duration}ms` }
  } catch (err) {
    const duration = Date.now() - startTime
    return { success: false, error: err.message, duration: `${duration}ms` }
  }
}

/**
 * Execute a complete workflow
 * @param {Object} workflow - { id, name, nodes, edges }
 * @param {Object} input - { message, user_input, ... }
 * @param {Object} options - { mockMode, skipDelay, autoAnswer, executeMCPTool, onNodeStart, onNodeComplete, onNodeError }
 * @returns {Object} execution result
 */
export async function executeWorkflow(workflow, input = {}, options = {}) {
  if (!workflow?.nodes?.length) {
    return { success: false, error: '工作流没有节点' }
  }
  
  resetExecutionState()
  _executionState.running = true
  _executionState.currentWorkflow = workflow.id
  _executionState.startTime = Date.now()
  _executionState.context = { _input: input, _variables: {} }
  
  const sortedNodes = topologicalSort(workflow.nodes, workflow.edges || [])
  
  try {
    for (const node of sortedNodes) {
      if (_executionState.cancelled) {
        addLog(node.id, 'cancelled', { message: '执行被取消' })
        break
      }
      
      _executionState.currentNode = node.id
      
      // Check if this node should be skipped (condition branch filtering)
      // Simple approach: if a previous condition node routed away, skip non-matching branches
      const incomingEdges = (workflow.edges || []).filter(e => e.to === node.id)
      let shouldSkip = false
      
      if (incomingEdges.length > 0) {
        // Check if any source node was a condition that didn't route here
        for (const edge of incomingEdges) {
          const sourceNode = workflow.nodes.find(n => n.id === edge.from)
          const sourceOutput = _executionState.context[edge.from]
          
          if (sourceNode?.type === 'condition' && sourceOutput?.matched_branch) {
            // If condition has branch labels and this edge doesn't match
            if (edge.branch && edge.branch !== sourceOutput.matched_branch) {
              shouldSkip = true
              break
            }
          }
        }
      }
      
      if (shouldSkip) {
        addLog(node.id, 'skipped', { message: '条件分支未路由到此节点' })
        _executionState.context[node.id] = { _skipped: true }
        continue
      }
      
      const executor = _executors[node.type]
      if (!executor) {
        addLog(node.id, 'error', { error: `未注册的节点类型: ${node.type}` })
        _executionState.context[node.id] = { error: `未注册的节点类型: ${node.type}` }
        if (options.onNodeError) options.onNodeError(node, new Error(`未注册的节点类型: ${node.type}`))
        continue
      }
      
      const startTime = Date.now()
      if (options.onNodeStart) options.onNodeStart(node)
      addLog(node.id, 'running', { label: node.label })
      
      try {
        const result = await executor(node, _executionState.context, options)
        const duration = Date.now() - startTime
        
        _executionState.context[node.id] = result
        addLog(node.id, 'success', { output: result, duration: `${duration}ms` })
        
        if (options.onNodeComplete) options.onNodeComplete(node, result)
      } catch (err) {
        const duration = Date.now() - startTime
        addLog(node.id, 'error', { error: err.message, duration: `${duration}ms` })
        _executionState.context[node.id] = { error: err.message }
        
        if (options.onNodeError) options.onNodeError(node, err)
      }
    }
    
    _executionState.running = false
    const totalDuration = Date.now() - _executionState.startTime
    
    return {
      success: true,
      workflow: workflow.id,
      duration: `${totalDuration}ms`,
      nodes_executed: _executionState.logs.filter(l => l.status === 'success').length,
      nodes_skipped: _executionState.logs.filter(l => l.status === 'skipped').length,
      nodes_errored: _executionState.logs.filter(l => l.status === 'error').length,
      logs: [..._executionState.logs],
      context: { ..._executionState.context },
    }
  } catch (err) {
    _executionState.running = false
    return { success: false, error: err.message, logs: [..._executionState.logs] }
  }
}

/**
 * Cancel a running workflow
 */
export function cancelWorkflow() {
  _executionState.cancelled = true
}

/**
 * Create a reusable workflow engine instance
 * @param {Object} workflow - { id, name, nodes, edges }
 * @returns {Object} engine instance with execute, cancel, getState, reset methods
 */
export function createWorkflowEngine(workflow) {
  return {
    workflow,
    execute: (input, options) => executeWorkflow(workflow, input, options),
    cancel: cancelWorkflow,
    getState: getExecutionState,
    reset: resetExecutionState,
  }
}
