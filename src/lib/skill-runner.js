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

// ─── Food Safety Plugin Handlers (from PRD: coze_food_safety_plugins_config.md) ───

/**
 * query_compensation — 补偿方案查询插件
 * 根据食安标签、风险等级、订单核验状态等生成补偿建议，不实际执行退款/发券
 */
async function queryCompensation(params = {}) {
  const p = params || {}
  const label = String(p.food_safety_label || '')
  const riskLevel = String(p.risk_level || 'medium')
  const orderVerified = Boolean(p.order_verified)
  const amount = String(p.amount || '')
  const imageStatus = String(p.image_status || '')
  const needHumanReview = Boolean(p.need_human_review)
  const solutionOffered = Boolean(p.solution_offered)
  const turnIndex = Number.isFinite(Number(p.turn_index)) ? Number(p.turn_index) : 0

  const raw = { case_id: p.case_id || '', label, risk_level: riskLevel, order_verified: orderVerified, order_id: p.order_id || '', store_name: p.store_name || '', product_name: p.product_name || '', amount, image_status: imageStatus, turn_index: turnIndex }

  if (!orderVerified) {
    return { success: true, compensation_allowed: false, compensation_source: 'rule_fallback', solution_type: 'not_ready', refund_amount: '', coupon_amount: '', coupon_valid_days: '', store_callback_required: false, store_callback_sla_hours: 0, human_followup_required: false, solution_summary: '订单尚未核验，暂不查询补偿方案。', customer_reply_hint: '阿喜先帮您核实订单信息，再为您申请合适的补偿方案。', next_action_hint: 'ask_order_or_phone', risk_note: '', error_code: '', error_message: '', raw_compensation_result: JSON.stringify(raw) }
  }

  if (solutionOffered) {
    return { success: true, compensation_allowed: false, compensation_source: 'rule_fallback', solution_type: 'already_offered', refund_amount: '', coupon_amount: '', coupon_valid_days: '', store_callback_required: false, store_callback_sla_hours: 0, human_followup_required: false, solution_summary: '已给过方案，避免重复承诺。', customer_reply_hint: '阿喜会继续跟进刚才的处理方案。', next_action_hint: 'continue_followup', risk_note: '', error_code: '', error_message: '', raw_compensation_result: JSON.stringify(raw) }
  }

  if (label.includes('身体不适')) {
    return { success: true, compensation_allowed: false, compensation_source: 'rule_fallback', solution_type: 'human_followup', refund_amount: '', coupon_amount: '', coupon_valid_days: '', store_callback_required: true, store_callback_sla_hours: 1, human_followup_required: true, solution_summary: '身体不适场景不在线上主动给出具体补偿方案，需通知地区负责人跟进。', customer_reply_hint: '对于您描述的情况阿喜非常重视，请问您目前有没有好转一些？如果仍感到不舒服，建议您及时就医。辛苦您提供一下方便联系的手机号，阿喜马上通知地区负责人跟进。', next_action_hint: 'human_followup', risk_note: '身体不适禁止线上主动承诺医疗费、报销或具体补偿金额。', error_code: '', error_message: '', raw_compensation_result: JSON.stringify(raw) }
  }

  let solutionType = 'manual_review'
  let refundAmount = amount || '按订单实付金额'
  let couponAmount = ''
  let callbackRequired = true
  let callbackSlaHours = 4
  let humanFollowupRequired = needHumanReview || riskLevel === 'high'
  let riskNote = ''

  if (['金属', '玻璃', '刀片', '苍蝇或蟑螂'].some(x => label.includes(x))) {
    solutionType = 'refund_coupon_escalate'; couponAmount = '30'; callbackSlaHours = 1; humanFollowupRequired = true
    riskNote = '高风险异物，需建单并由门店或负责人复核后执行。'
  } else if (['毛发', '虫类', '塑料', '纸类', '不明物'].some(x => label.includes(x))) {
    solutionType = 'refund_coupon_callback'; couponAmount = '30'
    riskNote = '一般外源性异物，建议全额退款、代金券、门店回访。'
  } else if (['果核', '茶渣', '水果纤维', '果皮', '果蔬杂质', '籽'].some(x => label.includes(x))) {
    solutionType = 'remake_or_coupon'; refundAmount = ''; couponAmount = '20'
    riskNote = '内源性异物或天然原料残留，优先重做或小额代金券。'
  } else if (['原料变质', 'OEM变质'].some(x => label.includes(x))) {
    solutionType = 'refund_coupon_emergency_check'; couponAmount = '50'; callbackSlaHours = 1; humanFollowupRequired = true
    riskNote = '变质类问题需紧急排查批次并建单。'
  } else if (['产品有效期', 'OEM过期'].some(x => label.includes(x))) {
    solutionType = 'refund_coupon_expiry_check'; couponAmount = '50'; callbackSlaHours = 1; humanFollowupRequired = true
    riskNote = '效期类问题需核验商品批次、包装和购买时间。'
  } else if (label.includes('饮品异味')) {
    solutionType = 'refund_or_remake'
    riskNote = '饮品异味建议重做或全额退款。'
  } else if (label.includes('原料未熟')) {
    solutionType = 'refund_coupon_callback'; couponAmount = '30'; humanFollowupRequired = true
    riskNote = '原料未熟需门店排查制作或备料问题。'
  } else {
    solutionType = 'manual_review'; humanFollowupRequired = true
    riskNote = '标签边界不明确，建议人工复核后给方案。'
  }

  if (imageStatus && !['已提供', '无图片需求', '用户明确无图'].includes(imageStatus)) {
    humanFollowupRequired = true; riskNote += ' 当前图片证据不足，需谨慎处理。'
  }

  const solutionSummary = `建议方案：${solutionType}；退款金额：${refundAmount || '不默认退款'}；代金券：${couponAmount || '不默认发券'}；门店回访：${callbackRequired ? '需要' : '不需要'}；人工复核：${humanFollowupRequired ? '需要' : '不需要'}。`
  let replyHint = '为了弥补这次不好的体验，阿喜会先为您核实订单和问题情况，并按规则为您申请合适的补偿方案。'
  if (couponAmount) {
    replyHint = `为了弥补这次不好的体验，阿喜可为您申请全额退款${refundAmount}，并申请${couponAmount}元代金券，门店伙伴会在${callbackSlaHours}小时内跟进。`
  }
  if (humanFollowupRequired) replyHint += ' 该情况阿喜也会同步给负责人复核，确保处理稳妥。'

  return { success: true, compensation_allowed: true, compensation_source: 'rule_fallback', solution_type: solutionType, refund_amount: refundAmount, coupon_amount: couponAmount, coupon_valid_days: '30', store_callback_required: callbackRequired, store_callback_sla_hours: callbackSlaHours, human_followup_required: humanFollowupRequired, solution_summary: solutionSummary, customer_reply_hint: replyHint, next_action_hint: 'generate_solution_reply', risk_note: riskNote, error_code: '', error_message: '', raw_compensation_result: JSON.stringify(raw) }
}

/**
 * query_history — 历史投诉查询插件
 * 查询顾客历史投诉和食安记录，判断是否重复投诉/高风险顾客
 * 未接入真实 API 时返回 HISTORY_API_NOT_CONFIGURED
 */
async function queryHistory(params = {}) {
  const p = params || {}
  const customerId = String(p.customer_id || '')
  const phone = String(p.phone || '')
  const orderId = String(p.order_id || '')
  const label = String(p.food_safety_label || '')
  const storeName = String(p.store_name || '')
  const lookbackDays = Number.isFinite(Number(p.lookback_days)) ? Number(p.lookback_days) : 30
  const hasQueryKey = Boolean(customerId || phone || orderId)

  const raw = { case_id: p.case_id || '', customer_id: customerId, phone, order_id: orderId, label, store_name: storeName, lookback_days: lookbackDays }

  if (!hasQueryKey) {
    return { success: false, history_found: false, repeat_customer: false, complaint_count: 0, food_safety_count: 0, same_store_count: 0, high_risk_history: false, last_complaint_time: '', last_ticket_id: '', risk_flags: 'missing_query_key', history_summary: '缺少手机号、顾客ID或订单号，无法查询历史记录。', next_action_hint: 'continue_without_history', error_code: 'MISSING_HISTORY_QUERY_KEY', error_message: 'phone/customer_id/order_id 至少需要一个。', raw_history_result: JSON.stringify(raw) }
  }

  return { success: false, history_found: false, repeat_customer: false, complaint_count: 0, food_safety_count: 0, same_store_count: 0, high_risk_history: false, last_complaint_time: '', last_ticket_id: '', risk_flags: 'history_api_not_configured', history_summary: '历史记录查询接口尚未接入真实业务系统，当前不伪造历史投诉结果。', next_action_hint: 'manual_history_check', error_code: 'HISTORY_API_NOT_CONFIGURED', error_message: 'query_history 插件未接入真实历史投诉 API。', raw_history_result: JSON.stringify(raw) }
}

/**
 * store_query — 门店信息查询插件
 * 查询门店信息、区域信息和回访处理建议，用于食安工单升级和门店核查
 * 未接入真实 API 时返回 STORE_API_NOT_CONFIGURED
 */
async function storeQuery(params = {}) {
  const p = params || {}
  const storeId = String(p.store_id || '')
  const storeName = String(p.store_name || '')
  const orderId = String(p.order_id || '')
  const city = String(p.city || '')
  const label = String(p.food_safety_label || '')
  const riskLevel = String(p.risk_level || 'medium')
  const needCallback = Boolean(p.need_callback)
  const slaHours = Number.isFinite(Number(p.sla_hours)) ? Number(p.sla_hours) : (riskLevel === 'high' || label.includes('身体不适') || label.includes('变质') || label.includes('过期') ? 1 : 4)
  const hasQueryKey = Boolean(storeId || storeName || orderId)

  const raw = { case_id: p.case_id || '', store_id: storeId, store_name: storeName, order_id: orderId, city, label, risk_level: riskLevel, need_callback: needCallback, sla_hours: slaHours }

  if (!hasQueryKey) {
    return { success: false, store_found: false, store_id: '', store_name: '', city, district: '', handler_group: '', callback_required: needCallback, callback_sla_hours: slaHours, store_summary: '缺少门店ID、门店名称或订单号，无法查询门店信息。', handler_hint: '请先通过订单核验获取门店信息。', next_action_hint: 'query_order_first', error_code: 'MISSING_STORE_QUERY_KEY', error_message: 'store_id/store_name/order_id 至少需要一个。', raw_store_result: JSON.stringify(raw) }
  }

  return { success: false, store_found: false, store_id: storeId, store_name: storeName, city, district: '', handler_group: '', callback_required: needCallback || riskLevel === 'high', callback_sla_hours: slaHours, store_summary: '门店查询接口尚未接入真实业务系统，当前不伪造门店负责人或门店联系方式。', handler_hint: '请人工或通过正式门店系统查询门店负责人，并按 SLA 跟进。', next_action_hint: 'manual_store_check', error_code: 'STORE_API_NOT_CONFIGURED', error_message: 'store_query 插件未接入真实门店 API。', raw_store_result: JSON.stringify(raw) }
}

// ─── Skill Tool Registry ───
const SKILL_TOOLS = {
  // ── 食安客服插件 (PRD) ──
  query_compensation: {
    handler: queryCompensation,
    category: 'food_safety',
    description: '根据食安标签、风险等级、订单核验状态，查询或生成可建议的补偿方案（不实际执行退款/发券）',
    params: { food_safety_label: 'string', risk_level: 'string', order_verified: 'boolean', order_id: 'string?', phone: 'string?', store_name: 'string?', product_name: 'string?', amount: 'string?', image_status: 'string?', need_human_review: 'boolean?', ticket_id: 'string?', turn_index: 'number?', solution_offered: 'boolean?', case_id: 'string?', channel: 'string?', qiyu_label: 'string?' },
    required: ['food_safety_label', 'risk_level', 'order_verified'],
  },
  query_history: {
    handler: queryHistory,
    category: 'food_safety',
    description: '查询顾客历史投诉和历史食安记录，判断是否重复投诉、高风险顾客',
    params: { phone: 'string?', customer_id: 'string?', order_id: 'string?', food_safety_label: 'string?', store_name: 'string?', lookback_days: 'number?', case_id: 'string?', channel: 'string?', qiyu_label: 'string?' },
    required: [],
  },
  store_query: {
    handler: storeQuery,
    category: 'food_safety',
    description: '查询门店信息、区域信息和回访处理建议，用于食安工单升级和门店核查',
    params: { risk_level: 'string', store_id: 'string?', store_name: 'string?', order_id: 'string?', city: 'string?', food_safety_label: 'string?', need_callback: 'boolean?', sla_hours: 'number?', case_id: 'string?', channel: 'string?' },
    required: ['risk_level'],
  },
  // ── 点单/门店 MCP 工具 ──
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
