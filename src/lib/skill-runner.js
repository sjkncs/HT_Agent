/**
 * 喜茶 Skill/CLI 工具调用运行时
 * 
 * 功能:
 * - 解析 SKILL.md 中的工具定义
 * - 提供 CLI 风格的工具调用接口
 * - 支持 curl 命令生成和结果解析
 * - 与 mcp-client.js 桥接
 */

import {
  queryStoreList, searchProduct, customizeProduct, queryProductDetail,
  previewOrder, createOrder, queryOrderDetail, cancelOrder,
  queryCouponList, queryOrderHistory, queryPaymentStatus,
  getMCPToolDefinitions, exportCurlCommand, getMCPConfig
} from './mcp-client.js'

// ─── Skill Tool Registry ───
const SKILL_TOOLS = {
  queryStoreList: {
    handler: queryStoreList,
    category: 'store',
    description: '查询附近喜茶门店列表',
    params: { longitude: 'number', latitude: 'number', storeName: 'string?' },
    required: ['longitude', 'latitude'],
  },
  searchProduct: {
    handler: searchProduct,
    category: 'store',
    description: '搜索喜茶商品',
    params: { storeId: 'number', query: 'string' },
    required: ['storeId', 'query'],
  },
  customizeProduct: {
    handler: customizeProduct,
    category: 'store',
    description: '切换商品属性（糖度/冰量/加料/杯型）',
    params: { storeId: 'number', productId: 'number', skuCode: 'string', attrOperationParam: 'object', amount: 'number?' },
    required: ['storeId', 'productId', 'skuCode', 'attrOperationParam'],
  },
  queryProductDetail: {
    handler: queryProductDetail,
    category: 'store',
    description: '查询商品详情（属性/价格/过敏原）',
    params: { storeId: 'number', productId: 'number' },
    required: ['storeId', 'productId'],
  },
  previewOrder: {
    handler: previewOrder,
    category: 'order',
    description: '预览订单（价格/明细/取餐时间）',
    params: { storeId: 'number', productList: 'array', pickupType: 'string?' },
    required: ['storeId', 'productList'],
  },
  createOrder: {
    handler: createOrder,
    category: 'order',
    description: '创建订单并生成支付链接',
    params: { storeId: 'number', productList: 'array', longitude: 'number', latitude: 'number', couponCodeList: 'array?', pickupType: 'string?', remark: 'string?' },
    required: ['storeId', 'productList', 'longitude', 'latitude'],
  },
  queryOrderDetail: {
    handler: queryOrderDetail,
    category: 'order',
    description: '查询订单详情和实时状态',
    params: { orderId: 'string' },
    required: ['orderId'],
  },
  cancelOrder: {
    handler: cancelOrder,
    category: 'order',
    description: '取消订单（制作前免费，制作中需审核）',
    params: { orderId: 'string', cancelReason: 'string?' },
    required: ['orderId'],
  },
  queryCouponList: {
    handler: queryCouponList,
    category: 'coupon',
    description: '查询用户可用优惠券',
    params: { storeId: 'number?' },
    required: [],
  },
  queryOrderHistory: {
    handler: queryOrderHistory,
    category: 'order',
    description: '查询历史订单（分页）',
    params: { page: 'number?', pageSize: 'number?', status: 'number?' },
    required: [],
  },
  queryPaymentStatus: {
    handler: queryPaymentStatus,
    category: 'order',
    description: '查询支付状态',
    params: { orderId: 'string' },
    required: ['orderId'],
  },
}

// ─── Parameter Validation ───
function validateParamType(value, type) {
  const baseType = type.replace('?', '')
  if (value === undefined || value === null || value === '') {
    return !type.endsWith('?') ? `参数不能为空` : null
  }
  switch (baseType) {
    case 'number': return typeof value === 'number' ? null : `期望 number 类型，得到 ${typeof value}`
    case 'string': return typeof value === 'string' ? null : `期望 string 类型，得到 ${typeof value}`
    case 'array': return Array.isArray(value) ? null : `期望 array 类型`
    case 'object': return typeof value === 'object' && !Array.isArray(value) ? null : `期望 object 类型`
    case 'boolean': return typeof value === 'boolean' ? null : `期望 boolean 类型`
    default: return null
  }
}

export function validateToolArgs(toolName, args = {}) {
  const tool = SKILL_TOOLS[toolName]
  if (!tool) return { valid: false, errors: [`未知工具: ${toolName}`] }
  
  const errors = []
  
  // Check required params
  for (const req of tool.required) {
    if (args[req] === undefined || args[req] === null || args[req] === '') {
      errors.push(`缺少必填参数: ${req}`)
    }
  }
  
  // Type check provided params
  for (const [param, type] of Object.entries(tool.params)) {
    if (args[param] !== undefined) {
      const err = validateParamType(args[param], type)
      if (err) errors.push(`${param}: ${err}`)
    }
  }
  
  return { valid: errors.length === 0, errors }
}

// ─── Tool Execution ───

/**
 * Execute a Skill tool by name
 * @param {string} toolName - Tool name
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} { success, data, error, duration }
 */
export async function executeSkillTool(toolName, args = {}) {
  const tool = SKILL_TOOLS[toolName]
  if (!tool) {
    return { success: false, error: `未知工具: ${toolName}`, availableTools: listAvailableTools().map(t => t.name) }
  }
  
  // Validate arguments
  const validation = validateToolArgs(toolName, args)
  if (!validation.valid) {
    return { success: false, error: '参数校验失败', validationErrors: validation.errors }
  }
  
  const start = Date.now()
  try {
    const result = await tool.handler(args)
    return {
      success: true,
      tool: toolName,
      category: tool.category,
      data: result,
      duration: Date.now() - start,
    }
  } catch (err) {
    return {
      success: false,
      tool: toolName,
      error: err.message,
      duration: Date.now() - start,
    }
  }
}

// ─── CLI-style Command Parser ───

/**
 * Parse a CLI-style command string
 * @param {string} command - e.g. "queryStoreList --longitude 113.9 --latitude 22.5 --storeName 深圳"
 * @returns {Object} { toolName, args, valid }
 */
export function parseCLICommand(command) {
  if (!command || typeof command !== 'string') {
    return { toolName: null, args: {}, valid: false, error: '命令为空' }
  }
  
  const trimmed = command.trim()
  const parts = trimmed.split(/\s+/)
  const toolName = parts[0]
  const args = {}
  
  // Parse --key value pairs
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].startsWith('--')) {
      const key = parts[i].slice(2)
      const value = parts[i + 1] && !parts[i + 1].startsWith('--') ? parts[++i] : true
      // Try to parse numbers and JSON
      if (typeof value === 'string') {
        if (!isNaN(Number(value)) && value !== '') args[key] = Number(value)
        else if (value.startsWith('{') || value.startsWith('[')) {
          try { args[key] = JSON.parse(value) } catch { args[key] = value }
        } else {
          args[key] = value
        }
      } else {
        args[key] = value
      }
    }
  }
  
  const validation = validateToolArgs(toolName, args)
  return { toolName, args, valid: validation.valid, errors: validation.errors }
}

/**
 * Execute a CLI-style command string
 */
export async function executeCLICommand(command) {
  const parsed = parseCLICommand(command)
  if (!parsed.valid) {
    return { success: false, error: '命令解析失败', ...parsed }
  }
  return executeSkillTool(parsed.toolName, parsed.args)
}

// ─── Tool Discovery ───

/**
 * List all available Skill tools
 * @returns {Array} tool metadata
 */
export function listAvailableTools() {
  return Object.entries(SKILL_TOOLS).map(([name, tool]) => ({
    name,
    description: tool.description,
    category: tool.category,
    params: tool.params,
    required: tool.required,
  }))
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category) {
  return listAvailableTools().filter(t => t.category === category)
}

/**
 * Get tool categories
 */
export function getToolCategories() {
  return [...new Set(Object.values(SKILL_TOOLS).map(t => t.category))]
}

// ─── Curl Command Generation ───

/**
 * Generate a curl debug command for a tool
 */
export function generateCurlCommand(toolName, args = {}) {
  return exportCurlCommand(toolName, args)
}

// ─── LLM Tool Definitions Export ───

/**
 * Get OpenAI-compatible tool definitions for LLM function calling
 * This is the same as getMCPToolDefinitions() but wrapped for Skill context
 */
export function getSkillToolDefinitions() {
  return getMCPToolDefinitions()
}

/**
 * Get tool definitions in a simplified format for prompt injection
 */
export function getSimplifiedToolList() {
  return listAvailableTools().map(t => ({
    name: t.name,
    description: t.description,
    params: Object.entries(t.params).map(([k, v]) => `${k}: ${v}${t.required.includes(k) ? ' (必填)' : ' (选填)'}`).join(', '),
  }))
}

// ─── Batch Execution ───

/**
 * Execute multiple tools in sequence (for workflow-like operations)
 * @param {Array} steps - [{ tool: string, args: Object }, ...]
 * @returns {Promise<Object>} execution results
 */
export async function executeToolChain(steps) {
  const results = []
  const context = {}
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    // Interpolate context references in args
    const interpolatedArgs = {}
    for (const [k, v] of Object.entries(step.args || {})) {
      if (typeof v === 'string' && v.startsWith('$')) {
        const refKey = v.slice(1)
        interpolatedArgs[k] = context[refKey] ?? v
      } else {
        interpolatedArgs[k] = v
      }
    }
    
    const result = await executeSkillTool(step.tool, interpolatedArgs)
    results.push({ step: i + 1, ...result })
    
    // Store result in context for next step
    if (result.success) {
      context[`step${i + 1}`] = result.data
    }
  }
  
  return {
    success: results.every(r => r.success),
    steps: results,
    totalDuration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
  }
}

// ─── MCP Connection Status ───

/**
 * Get current MCP connection and skill status
 */
export function getSkillStatus() {
  const config = getMCPConfig()
  return {
    mcpConfigured: !!config.serverUrl,
    mockMode: config.useMock,
    tokenPresent: !!config.token,
    availableTools: Object.keys(SKILL_TOOLS).length,
    categories: getToolCategories(),
  }
}
