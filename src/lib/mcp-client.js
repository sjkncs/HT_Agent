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
  ]
}
