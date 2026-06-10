/**
 * 喜茶 MCP 客户端 — Streamable HTTP 协议封装
 * 
 * 基于 Model Context Protocol (MCP) 的 Streamable HTTP 传输协议，
 * 对标瑞幸咖啡 MCP 服务模式，适配喜茶茶饮点单业务。
 * 
 * 协议: JSON-RPC 2.0 over HTTP POST
 * 认证: Bearer Token (Authorization header)
 */

// ─── 默认配置 ───
const DEFAULT_CONFIG = {
  serverUrl: 'https://mcp.heytea.com/api/v1/mcp',
  token: '',
  timeout: 15000,
  retries: 2,
  useMock: true, // 喜茶暂无公开 MCP Server，默认使用 Mock
}

let _config = { ...DEFAULT_CONFIG }

/**
 * 配置 MCP 客户端
 * @param {Object} config - { serverUrl, token, timeout, retries, useMock }
 */
export function configureMCP(config) {
  _config = { ..._config, ...config }
}

/**
 * 获取当前配置
 */
export function getMCPConfig() {
  return { ..._config }
}

// ─── JSON-RPC 2.0 基础请求 ───
let _requestId = 0

function buildJsonRpcRequest(method, params) {
  _requestId++
  return {
    jsonrpc: '2.0',
    id: _requestId,
    method,
    params: params || {},
  }
}

/**
 * 发送 MCP 工具调用请求
 * @param {string} toolName - MCP 工具名称
 * @param {Object} args - 工具参数
 * @returns {Promise<Object>} 响应数据
 */
async function callMCPTool(toolName, args) {
  // 如果使用 Mock 模式，走本地 Mock 数据
  if (_config.useMock) {
    return callMockTool(toolName, args)
  }

  const body = buildJsonRpcRequest('tools/call', {
    name: toolName,
    arguments: args,
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), _config.timeout)

  let lastError = null
  for (let attempt = 0; attempt <= _config.retries; attempt++) {
    try {
      const resp = await fetch(_config.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          ...( _config.token ? { 'Authorization': `Bearer ${_config.token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!resp.ok) {
        throw new Error(`MCP HTTP ${resp.status}: ${resp.statusText}`)
      }

      const contentType = resp.headers.get('content-type') || ''

      // 处理 SSE 流式响应
      if (contentType.includes('text/event-stream')) {
        return await parseSSEResponse(resp)
      }

      // 处理普通 JSON 响应
      const json = await resp.json()
      if (json.error) {
        throw new Error(`MCP Error ${json.error.code}: ${json.error.message}`)
      }
      return json.result
    } catch (err) {
      lastError = err
      if (err.name === 'AbortError') break
      if (attempt < _config.retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }

  clearTimeout(timeoutId)
  throw lastError || new Error('MCP call failed')
}

/**
 * 解析 SSE 流式响应
 */
async function parseSSEResponse(resp) {
  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let result = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          if (parsed.result) result = parsed.result
          if (parsed.error) throw new Error(`MCP SSE Error: ${parsed.error.message}`)
        } catch (e) {
          if (e.message.startsWith('MCP SSE Error')) throw e
        }
      }
    }
  }

  return result
}

// ─── 8 个 MCP 工具函数 ───

/**
 * 1. 查询门店列表
 * @param {Object} params - { longitude: number, latitude: number, storeName?: string }
 */
export async function queryStoreList({ longitude, latitude, storeName }) {
  return callMCPTool('queryStoreList', { longitude, latitude, storeName: storeName || '' })
}

/**
 * 2. 搜索商品
 * @param {Object} params - { storeId: number, query: string }
 */
export async function searchProduct({ storeId, query }) {
  return callMCPTool('searchProduct', { storeId, query })
}

/**
 * 3. 商品属性定制切换
 * @param {Object} params - { storeId, productId, skuCode, attrOperationParam, amount }
 */
export async function customizeProduct({ storeId, productId, skuCode, attrOperationParam, amount }) {
  return callMCPTool('customizeProduct', { storeId, productId, skuCode, attrOperationParam, amount: amount || 1 })
}

/**
 * 4. 查询商品详情
 * @param {Object} params - { storeId: number, productId: number }
 */
export async function queryProductDetail({ storeId, productId }) {
  return callMCPTool('queryProductDetail', { storeId, productId })
}

/**
 * 5. 订单预览
 * @param {Object} params - { storeId, productList: [{amount, productId, skuCode}], pickupType? }
 */
export async function previewOrder({ storeId, productList, pickupType }) {
  return callMCPTool('previewOrder', { storeId, productList, pickupType: pickupType || 'self_pickup' })
}

/**
 * 6. 创建订单
 * @param {Object} params - { storeId, productList, longitude, latitude, couponCodeList?, pickupType?, remark? }
 */
export async function createOrder({ storeId, productList, longitude, latitude, couponCodeList, pickupType, remark }) {
  return callMCPTool('createOrder', {
    storeId, productList, longitude, latitude,
    couponCodeList: couponCodeList || [],
    pickupType: pickupType || 'self_pickup',
    remark: remark || '',
  })
}

/**
 * 7. 查询订单详情
 * @param {Object} params - { orderId: string }
 */
export async function queryOrderDetail({ orderId }) {
  return callMCPTool('queryOrderDetail', { orderId })
}

/**
 * 8. 取消订单
 * @param {Object} params - { orderId: string, cancelReason?: string }
 */
export async function cancelOrder({ orderId, cancelReason }) {
  return callMCPTool('cancelOrder', { orderId, cancelReason: cancelReason || '' })
}

/**
 * 9. 查询优惠券列表
 * @param {Object} params - { storeId?: number }
 */
export async function queryCouponList({ storeId } = {}) {
  return callMCPTool('queryCouponList', { storeId: storeId || null })
}

/**
 * 10. 查询订单历史
 * @param {Object} params - { page?: number, pageSize?: number, status?: number }
 */
export async function queryOrderHistory({ page, pageSize, status } = {}) {
  return callMCPTool('queryOrderHistory', { page: page || 1, pageSize: pageSize || 10, status: status || null })
}

/**
 * 11. 查询支付状态
 * @param {Object} params - { orderId: string }
 */
export async function queryPaymentStatus({ orderId }) {
  return callMCPTool('queryPaymentStatus', { orderId })
}

// ─── Mock 工具调用路由 ───
let _mockHandler = null

/**
 * 注册 Mock 处理器（由 heytea-mock-data.js 注入）
 */
export function registerMockHandler(handler) {
  _mockHandler = handler
}

async function callMockTool(toolName, args) {
  if (!_mockHandler) {
    throw new Error(`MCP Mock 模式启用但未注册 mockHandler。请调用 registerMockHandler()。`)
  }
  // 模拟网络延迟
  await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
  return _mockHandler(toolName, args)
}

// ─── MCP 工具列表查询（用于 AI 对话集成） ───

/**
 * 获取所有 MCP 工具定义（JSON Schema 格式）
 * 用于注入 AI system prompt 的 tools 定义
 */
export function getMCPToolDefinitions() {
  return [
    {
      type: 'function',
      function: {
        name: 'queryStoreList',
        description: '查询附近喜茶门店列表，支持按名称搜索和按距离排序',
        parameters: {
          type: 'object',
          properties: {
            longitude: { type: 'number', description: '用户经度' },
            latitude: { type: 'number', description: '用户纬度' },
            storeName: { type: 'string', description: '门店名称关键词（选填）' },
          },
          required: ['longitude', 'latitude'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'searchProduct',
        description: '根据用户查询文本搜索喜茶商品，返回匹配的商品列表含价格和属性',
        parameters: {
          type: 'object',
          properties: {
            storeId: { type: 'integer', description: '门店ID' },
            query: { type: 'string', description: '用户搜索文本，如"多肉葡萄""芝芝莓莓"' },
          },
          required: ['storeId', 'query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'customizeProduct',
        description: '切换喜茶商品属性（糖度、冰量、加料、杯型），返回更新后的商品详情和价格',
        parameters: {
          type: 'object',
          properties: {
            storeId: { type: 'integer', description: '门店ID' },
            productId: { type: 'integer', description: '商品ID' },
            skuCode: { type: 'string', description: '商品SKU编码' },
            attrOperationParam: {
              type: 'object',
              description: '属性切换参数',
              properties: {
                attributeId: { type: 'integer', description: '属性组ID（糖度=1,冰量=2,加料=3,杯型=4）' },
                subAttr: {
                  type: 'object',
                  properties: {
                    attributeId: { type: 'integer', description: '属性值ID' },
                    operation: { type: 'integer', description: '操作类型，选中传3，取消传1' },
                  },
                },
              },
            },
            amount: { type: 'integer', description: '商品数量' },
          },
          required: ['storeId', 'productId', 'skuCode', 'attrOperationParam'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'queryProductDetail',
        description: '查询喜茶商品详情，包含属性选项、价格、原料、过敏原信息',
        parameters: {
          type: 'object',
          properties: {
            storeId: { type: 'integer', description: '门店ID' },
            productId: { type: 'integer', description: '商品ID' },
          },
          required: ['storeId', 'productId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'previewOrder',
        description: '预览喜茶订单，显示商品明细、价格、优惠券、预计取餐时间',
        parameters: {
          type: 'object',
          properties: {
            storeId: { type: 'integer', description: '门店ID' },
            productList: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  amount: { type: 'integer' },
                  productId: { type: 'integer' },
                  skuCode: { type: 'string' },
                },
              },
              description: '商品列表',
            },
            pickupType: { type: 'string', enum: ['self_pickup', 'delivery'], description: '取餐方式' },
          },
          required: ['storeId', 'productList'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'createOrder',
        description: '创建喜茶订单，返回支付链接和二维码',
        parameters: {
          type: 'object',
          properties: {
            storeId: { type: 'integer', description: '门店ID' },
            productList: { type: 'array', description: '商品列表（同previewOrder）' },
            longitude: { type: 'number', description: '用户经度' },
            latitude: { type: 'number', description: '用户纬度' },
            couponCodeList: { type: 'array', items: { type: 'string' }, description: '优惠券编码列表' },
            pickupType: { type: 'string', enum: ['self_pickup', 'delivery'], description: '取餐方式' },
            remark: { type: 'string', description: '订单备注' },
          },
          required: ['storeId', 'productList', 'longitude', 'latitude'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'queryOrderDetail',
        description: '查询喜茶订单详情，包含订单状态、取餐码、商品明细、门店信息',
        parameters: {
          type: 'object',
          properties: {
            orderId: { type: 'string', description: '订单ID' },
          },
          required: ['orderId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'cancelOrder',
        description: '取消喜茶订单，制作前可免费取消，制作中需审核',
        parameters: {
          type: 'object',
          properties: {
            orderId: { type: 'string', description: '订单ID' },
            cancelReason: { type: 'string', description: '取消原因' },
          },
          required: ['orderId'],
        },
      },
    },
    // ─── 新增工具定义（对标瑞幸扩展） ───
    {
      type: 'function',
      function: {
        name: 'queryCouponList',
        description: '查询用户可用的优惠券列表，支持按门店筛选',
        parameters: {
          type: 'object',
          properties: {
            storeId: { type: 'integer', description: '门店ID（可选，筛选门店专属券）' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'queryOrderHistory',
        description: '查询用户历史订单，支持分页和状态筛选',
        parameters: {
          type: 'object',
          properties: {
            page: { type: 'integer', description: '页码，默认1' },
            pageSize: { type: 'integer', description: '每页数量，默认10' },
            status: { type: 'integer', description: '订单状态筛选（可选）' },
          },
          required: [],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'queryPaymentStatus',
        description: '查询订单支付状态，用于下单后轮询支付结果',
        parameters: {
          type: 'object',
          properties: {
            orderId: { type: 'string', description: '订单ID' },
          },
          required: ['orderId'],
        },
      },
    },
    // ─── 食安客服插件 (PRD) ───
    {
      type: 'function',
      function: {
        name: 'query_compensation',
        description: '根据食安标签、订单核验、风险等级、图片状态和当前轮次，查询或生成可建议的补偿方案。该工具只返回内部处理建议，不实际执行退款、发券或赔付。',
        parameters: {
          type: 'object',
          properties: {
            food_safety_label: { type: 'string', description: '食安细类标签（如 食安问题/内源性异物/果核）' },
            risk_level: { type: 'string', enum: ['high', 'medium', 'low'], description: '风险等级' },
            order_verified: { type: 'boolean', description: '订单是否已核验' },
            order_id: { type: 'string', description: '订单号' },
            phone: { type: 'string', description: '下单手机号' },
            store_name: { type: 'string', description: '门店名称' },
            product_name: { type: 'string', description: '商品名称' },
            amount: { type: 'string', description: '订单实付金额' },
            image_status: { type: 'string', description: '图片状态：已提供/未提供未引导/引导未提供/已提供但无效/无图片需求' },
            need_human_review: { type: 'boolean', description: '是否需要人工复核' },
            turn_index: { type: 'integer', description: '当前轮次' },
            solution_offered: { type: 'boolean', description: '是否已给过方案' },
            case_id: { type: 'string', description: '案件ID' },
          },
          required: ['food_safety_label', 'risk_level', 'order_verified'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'query_history',
        description: '查询顾客历史投诉和历史食安记录，用于判断是否为重复投诉、高风险顾客、同店重复问题或需要升级人工复核。',
        parameters: {
          type: 'object',
          properties: {
            phone: { type: 'string', description: '手机号' },
            customer_id: { type: 'string', description: '顾客ID' },
            order_id: { type: 'string', description: '订单号' },
            food_safety_label: { type: 'string', description: '食安标签' },
            store_name: { type: 'string', description: '门店' },
            lookback_days: { type: 'integer', description: '回看天数，默认30' },
            case_id: { type: 'string', description: '案件ID' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'store_query',
        description: '查询订单或门店对应的门店信息、区域信息和回访处理建议，用于食安工单升级、门店核查和回访分支。该工具不认定责任。',
        parameters: {
          type: 'object',
          properties: {
            risk_level: { type: 'string', enum: ['high', 'medium', 'low'], description: '风险等级' },
            store_id: { type: 'string', description: '门店ID' },
            store_name: { type: 'string', description: '门店名称' },
            order_id: { type: 'string', description: '订单号' },
            city: { type: 'string', description: '城市' },
            food_safety_label: { type: 'string', description: '食安标签' },
            need_callback: { type: 'boolean', description: '是否需要回访' },
            sla_hours: { type: 'integer', description: 'SLA小时' },
            case_id: { type: 'string', description: '案件ID' },
          },
          required: ['risk_level'],
        },
      },
    },
  ]
}

// ─── MCP 服务端工具发现（tools/list） ───

/**
 * 从 MCP 服务端获取可用工具列表（JSON-RPC tools/list）
 * 对标瑞幸 MCP 的服务端工具发现机制
 * @returns {Promise<Object[]>} 服务端工具定义列表
 */
export async function listServerTools() {
  if (_config.useMock) {
    // Mock 模式：返回本地定义
    return getMCPToolDefinitions().map(t => ({
      name: t.function.name,
      description: t.function.description,
      inputSchema: t.function.parameters,
    }))
  }

  const body = buildJsonRpcRequest('tools/list', {})
  try {
    const resp = await fetch(_config.serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        ...(_config.token ? { 'Authorization': `Bearer ${_config.token}` } : {}),
      },
      body: JSON.stringify(body),
    })
    const json = await resp.json()
    if (json.error) throw new Error(`MCP Error: ${json.error.message}`)
    return json.result?.tools || []
  } catch (err) {
    throw new Error(`获取服务端工具列表失败: ${err.message}`)
  }
}

// ─── 连接健康检查 ───

let _connectionState = {
  status: 'disconnected', // 'connected' | 'disconnected' | 'degraded' | 'checking'
  lastCheck: null,
  latency: null,
  error: null,
  toolCount: 0,
}

/**
 * MCP 连接健康检查
 * 发送 tools/list 探测服务端可用性
 * @returns {Promise<Object>} 连接状态
 */
export async function healthCheck() {
  _connectionState.status = 'checking'

  const start = Date.now()
  try {
    const tools = await listServerTools()
    const latency = Date.now() - start

    _connectionState = {
      status: latency > 5000 ? 'degraded' : 'connected',
      lastCheck: Date.now(),
      latency,
      error: null,
      toolCount: tools.length,
    }
  } catch (err) {
    _connectionState = {
      ..._connectionState,
      status: 'disconnected',
      lastCheck: Date.now(),
      latency: null,
      error: err.message,
    }
  }

  return { ..._connectionState }
}

/**
 * 获取当前连接状态（不触发新检查）
 */
export function getConnectionStatus() {
  return { ..._connectionState }
}

// ─── MCP 配置导出 ───

/**
 * 导出标准 MCP Server 配置（用于 Claude Desktop / Cursor / Qoder 等客户端）
 * 对标瑞幸 mcpServers JSON 配置格式
 * @returns {Object} mcpServers 配置对象
 */
export function getMCPConfigExport() {
  return {
    mcpServers: {
      'heytea-order': {
        type: 'streamableHttp',
        url: _config.serverUrl,
        headers: {
          'Authorization': `Bearer \${HEYTEA_MCP_TOKEN}`,
        },
      },
    },
  }
}

/**
 * 导出 curl 测试命令（用于调试和文档）
 * @param {string} toolName - 工具名
 * @param {Object} args - 参数
 * @returns {string} curl 命令
 */
export function exportCurlCommand(toolName, args) {
  const body = JSON.stringify(buildJsonRpcRequest('tools/call', { name: toolName, arguments: args }))
  return `curl -s -N "${_config.serverUrl}" \\
  -H "Authorization: Bearer \${HEYTEA_MCP_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '${body}'`
}

// ─── 初始化：自动注册 Mock Handler ───

/**
 * 初始化 MCP 客户端
 * - 自动从 heytea-mock-data.js 注册 mock handler
 * - 确保应用启动后所有 11 个工具可调用
 * @param {Object} config - 可选配置覆盖
 */
export async function initMCPClient(config = {}) {
  // 应用配置覆盖
  if (Object.keys(config).length > 0) {
    configureMCP(config)
  }

  // 仅在 mock 模式下注册 handler
  if (_config.useMock && !_mockHandler) {
    try {
      // heytea-mock-data.js 在模块级别自动调用 registerMockHandler()
      // 动态导入即可触发注册
      await import('./heytea-mock-data.js')
      if (_mockHandler) {
        console.log('[MCP] Mock handler 已自动注册')
      } else {
        console.warn('[MCP] heytea-mock-data.js 导入完成但 handler 未注册')
      }
    } catch (err) {
      console.warn('[MCP] Mock handler 注册失败:', err.message)
    }
  }

  return {
    mockMode: _config.useMock,
    serverUrl: _config.serverUrl,
    toolsRegistered: getMCPToolDefinitions().length,
    handlerReady: !!_mockHandler,
  }
}
