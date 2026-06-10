/**
 * MCP-AI 对话集成模块
 * 
 * 让 AI 客服（阿喜）能理解点单意图并调用 MCP 工具完成自助点单。
 * 集成到 prompt-builder 和 agent-engine 的工作流中。
 */

import { getMCPToolDefinitions } from './mcp-client.js'
import {
  queryStoreList, searchProduct, customizeProduct,
  queryProductDetail, previewOrder, createOrder,
  queryOrderDetail, cancelOrder,
  queryCouponList, queryOrderHistory, queryPaymentStatus,
} from './mcp-client.js'

// ─── 点单意图检测 ───

const ORDER_INTENT_PATTERNS = [
  // 点单意图
  { pattern: /(?:想|要|来|点|买|订)(?:一杯|一份|一|两|个|杯)?/i, type: 'order', subType: 'create' },
  { pattern: /(?:推荐|什么好喝|有什么|菜单|看看)/i, type: 'order', subType: 'browse' },
  { pattern: /(?:新品|限定|当季|季节)/i, type: 'order', subType: 'browse_new' },
  { pattern: /(?:附近|门店|哪里|地址|位置)/i, type: 'order', subType: 'store' },
  // 查单意图
  { pattern: /(?:查|看|我的).*(?:订单|单号|取餐)/i, type: 'query_order' },
  { pattern: /(?:订单号|取餐码).*(\d{4,})/i, type: 'query_order', subType: 'by_id' },
  { pattern: /(?:做好了吗|到哪了|等多久|排队)/i, type: 'query_order', subType: 'status' },
  // 取消意图
  { pattern: /(?:取消|退单|不要了|退款).*(?:订单|单)/i, type: 'cancel_order' },
  { pattern: /(?:取消|退).*(\d{4,})/i, type: 'cancel_order' },
  // 定制意图
  { pattern: /(?:少糖|无糖|三分糖|五分糖|七分糖|全糖)/i, type: 'customize', subType: 'sugar' },
  { pattern: /(?:少冰|去冰|正常冰|热|温)/i, type: 'customize', subType: 'ice' },
  { pattern: /(?:加|多).*(?:珍珠|椰果|芝士|芋圆|红豆|芦荟)/i, type: 'customize', subType: 'topping' },
  { pattern: /(?:大杯|中杯|杯型)/i, type: 'customize', subType: 'cup' },
]

/**
 * 检测用户消息中的点单相关意图
 * @param {string} message - 用户消息文本
 * @returns {Object|null} 意图检测结果 { type, subType, confidence }
 */
export function detectOrderIntent(message) {
  if (!message || typeof message !== 'string') return null

  for (const { pattern, type, subType } of ORDER_INTENT_PATTERNS) {
    if (pattern.test(message)) {
      return { type, subType: subType || null, confidence: 0.85 }
    }
  }

  // 商品名直接匹配（高置信度）
  const productKeywords = [
    '多肉葡萄', '多肉芒果', '芝芝莓莓', '芝芝芒芒', '芝芝桃桃',
    '满杯红柚', '百香芒芒', '柠檬茶', '茉莉绿茶', '四季春',
    '杨梅冰茶', '生椰芒芒',
  ]
  for (const kw of productKeywords) {
    if (message.includes(kw)) {
      return { type: 'order', subType: 'specific_product', productName: kw, confidence: 0.95 }
    }
  }

  return null
}

// ─── 点单工具调用路由 ───

/**
 * 执行 MCP 工具调用
 * @param {string} toolName - 工具名称
 * @param {Object} args - 工具参数
 * @returns {Promise<Object>} 工具调用结果
 */
export async function executeMCPTool(toolName, args) {
  const handlers = {
    queryStoreList: () => queryStoreList(args),
    searchProduct: () => searchProduct(args),
    customizeProduct: () => customizeProduct(args),
    queryProductDetail: () => queryProductDetail(args),
    previewOrder: () => previewOrder(args),
    createOrder: () => createOrder(args),
    queryOrderDetail: () => queryOrderDetail(args),
    cancelOrder: () => cancelOrder(args),
    queryCouponList: () => queryCouponList(args),
    queryOrderHistory: () => queryOrderHistory(args),
    queryPaymentStatus: () => queryPaymentStatus(args),
  }

  const handler = handlers[toolName]
  if (!handler) throw new Error(`未知 MCP 工具: ${toolName}`)
  return handler()
}

// ─── 工具结果格式化（转为自然语言） ───

/**
 * 将 MCP 工具调用结果格式化为 AI 可理解的自然语言
 * @param {string} toolName - 工具名称
 * @param {Object} result - MCP 工具响应
 * @returns {string} 自然语言描述
 */
export function formatToolResult(toolName, result) {
  if (!result?.data) return '查询失败，请稍后重试。'

  switch (toolName) {
    case 'queryStoreList':
      return formatStoreList(result.data)
    case 'searchProduct':
      return formatProductList(result.data)
    case 'customizeProduct':
      return formatCustomization(result.data)
    case 'queryProductDetail':
      return formatProductDetail(result.data)
    case 'previewOrder':
      return formatOrderPreview(result.data)
    case 'createOrder':
      return formatCreateOrder(result.data)
    case 'queryOrderDetail':
      return formatOrderDetail(result.data)
    case 'cancelOrder':
      return formatCancelOrder(result.data)
    case 'queryCouponList':
      return formatCouponList(result.data)
    case 'queryOrderHistory':
      return formatOrderHistory(result.data)
    case 'queryPaymentStatus':
      return formatPaymentStatus(result.data)
    default:
      return JSON.stringify(result.data)
  }
}

function formatStoreList(stores) {
  if (!stores?.length) return '抱歉，暂未找到附近的喜茶门店。'
  const top3 = stores.slice(0, 3)
  let text = `为您找到 ${stores.length} 家附近门店：\n\n`
  for (const s of top3) {
    const status = s.businessStatus === 1 ? '营业中' : s.businessStatus === 3 ? '即将打烊' : '休息中'
    text += `📍 ${s.storeName}（${s.distance}km）\n`
    text += `   地址：${s.address}\n`
    text += `   时间：${s.workTimeStart}-${s.workTimeEnd} · ${status}\n`
    text += `   标签：${s.storeTags?.join('/') || '堂食'}\n\n`
  }
  text += '请问您想去哪家门店？我可以帮您点单。'
  return text
}

function formatProductList(products) {
  if (!products?.length) return '抱歉，未找到匹配的商品，换个关键词试试？'
  let text = `为您推荐以下饮品：\n\n`
  const shown = products.slice(0, 5)
  for (const p of shown) {
    const tags = p.tags?.length ? ` [${p.tags.join('/')}]` : ''
    text += `🧋 ${p.productName}${tags}\n`
    text += `   ${p.description || p.category}\n`
    text += `   ¥${p.initialPrice}起\n\n`
  }
  if (products.length > 5) text += `还有 ${products.length - 5} 款商品可选。`
  text += '\n想喝哪一款？我可以帮您定制糖度和冰量。'
  return text
}

function formatCustomization(product) {
  if (!product) return '定制失败，请重试。'
  const selectedAttrs = []
  for (const a of product.productAttrs || []) {
    const selected = a.productSubAttrs?.filter(sa => sa.selected).map(sa => sa.attributeName)
    if (selected?.length) selectedAttrs.push(`${a.attributeName}: ${selected.join('+')}`)
  }
  let text = `已为您定制 ${product.productName}：\n`
  if (selectedAttrs.length) text += `  ${selectedAttrs.join(' · ')}\n`
  text += `  价格：¥${product.estimatePrice}\n`
  text += '\n确认加入购物车吗？'
  return text
}

function formatProductDetail(product) {
  if (!product) return '未找到该商品信息。'
  let text = `🧋 ${product.productName} — ¥${product.initialPrice}\n`
  text += `${product.description || ''}\n\n`
  if (product.ingredients?.length) text += `原料：${product.ingredients.join('、')}\n`
  if (product.allergens?.length) text += `⚠️ 过敏原：${product.allergens.join('、')}\n`
  if (product.nutritionInfo) {
    const n = product.nutritionInfo
    text += `热量：${n.calories} · 含糖：${n.sugar}`
    if (n.caffeine) text += ` · 咖啡因：${n.caffeine}`
    text += '\n'
  }
  text += '\n可选糖度：全糖/七分/五分/三分/无糖\n可选冰量：正常冰/少冰/去冰/温/热\n可加料：芝士/椰果/珍珠/芋圆/红豆/芦荟'
  return text
}

function formatOrderPreview(preview) {
  if (!preview) return '订单预览失败。'
  let text = '📋 订单预览：\n\n'
  text += `📍 ${preview.storeInfo?.storeName}\n`
  for (const item of preview.productInfoList || []) {
    text += `  ${item.name} x${item.amount}`
    if (item.additionDesc) text += ` (${item.additionDesc})`
    text += ` — ¥${item.estimateTotalPrice?.toFixed(2)}\n`
  }
  text += `\n`
  if (preview.privilegeMoney > 0) text += `优惠：-¥${preview.privilegeMoney.toFixed(2)}\n`
  if (preview.deliveryFee > 0) text += `配送费：¥${preview.deliveryFee.toFixed(2)}\n`
  text += `💰 实付金额：¥${preview.discountPrice?.toFixed(2)}\n`
  if (preview.estimatedWaitMinutes) text += `⏱ 预计${preview.estimatedWaitMinutes}分钟后可取餐\n`
  text += '\n确认下单吗？'
  return text
}

function formatCreateOrder(order) {
  if (!order) return '创建订单失败。'
  let text = `✅ 订单创建成功！\n\n`
  text += `订单号：${order.orderIdStr}\n`
  text += `💰 需支付：¥${order.discountPrice?.toFixed(2)}\n\n`
  text += '请在喜茶小程序或门店完成支付。支付后可在订单追踪中查看取餐码。'
  return text
}

function formatOrderDetail(order) {
  if (!order) return '未找到该订单。'
  const STATUS_EMOJI = { 10: '💳', 20: '✅', 30: '🧑‍🍳', 40: '📦', 50: '🛵', 80: '🎉', 100: '❌' }
  let text = `${STATUS_EMOJI[order.orderStatus] || '📋'} 订单状态：${order.orderStatusName}\n\n`
  text += `订单号：${order.orderId}\n`
  text += `📍 ${order.storeInfo?.storeName}\n\n`

  if (order.productInfoList?.length) {
    for (const item of order.productInfoList) {
      text += `  ${item.name} x${item.amount}`
      if (item.additionDesc) text += ` (${item.additionDesc})`
      text += '\n'
    }
  }

  text += `\n💰 实付：¥${order.orderPayAmount?.toFixed(2)}\n`

  if (order.takeMealCodeInfo?.code && order.takeMealCodeInfo.code !== '生成中') {
    text += `\n🔢 取餐码：${order.takeMealCodeInfo.code}`
    if (order.takeMealCodeInfo.shelfNo) text += ` (${order.takeMealCodeInfo.shelfNo})`
    text += '\n'
  }

  if (order.orderStatus === 30) text += '\n饮品正在制作中，请稍候...'
  if (order.orderStatus === 40) text += '\n饮品已做好，请到取餐处取餐！'
  if (order.remark) text += `\n📝 备注：${order.remark}\n`

  return text
}

function formatCancelOrder(result) {
  if (!result) return '取消订单失败。'
  if (result.needReview) {
    return `⚠️ ${result.message}\n\n订单正在制作中，取消需要门店审核。您可以稍等片刻，或联系门店客服。`
  }
  if (result.success) {
    return `✅ 订单已取消。\n退款金额 ¥${result.refundAmount?.toFixed(2)} 将在1-3个工作日内原路返回。`
  }
  return '取消失败，请稍后重试或联系客服。'
}

function formatCouponList(coupons) {
  if (!coupons?.length) return '暂无可用优惠券。'
  let text = `🎫 您有 ${coupons.length} 张优惠券：\n\n`
  for (const c of coupons) {
    text += `  ${c.name}\n`
    if (c.type === 'bogo') text += `     适用：${c.category || '全部'} · 限${c.minOrder}件起\n`
    else if (c.type === 'fixed') text += `     满${c.minOrder}元减${c.discount}元 · ${c.applicableStores || '全部门店'}\n`
    else text += `     ${Math.round(c.discount * 100)}折 · 最高减${c.maxDiscount || '不限'}元\n`
    text += `     有效期至：${c.validUntil}\n\n`
  }
  text += '下单时会自动匹配最优优惠券。'
  return text
}

function formatOrderHistory(data) {
  if (!data?.orders?.length) return '暂无历史订单记录。'
  let text = `📋 最近 ${data.orders.length} 笔订单（共 ${data.total} 笔）：\n\n`
  for (const o of data.orders) {
    const emoji = o.orderStatus === 80 ? '✅' : o.orderStatus === 100 ? '❌' : '📋'
    text += `${emoji} ${o.orderTime} · ${o.storeName}\n`
    text += `   ${o.productNames.join('、')} · ¥${o.totalAmount} · ${o.orderStatusName}\n\n`
  }
  text += '想再点哪一款？我可以帮您快速下单。'
  return text
}

function formatPaymentStatus(data) {
  if (!data) return '支付状态查询失败。'
  const statusMap = { paid: '已支付', pending: '待支付', refunded: '已退款', failed: '支付失败' }
  const statusText = statusMap[data.paymentStatus] || data.paymentStatus
  let text = `💳 支付状态：${statusText}\n`
  if (data.paidAmount) text += `   支付金额：¥${data.paidAmount}\n`
  if (data.paymentMethod) text += `   支付方式：${data.paymentMethod}\n`
  if (data.paidAt) text += `   支付时间：${new Date(data.paidAt).toLocaleString('zh-CN')}\n`
  if (data.refundStatus) text += `   退款状态：${data.refundStatus}\n`
  return text
}

// ─── 对话中的富文本卡片生成 ───

/**
 * 生成点单相关的富文本卡片 HTML（用于聊天流中嵌入展示）
 * @param {string} type - 'product' | 'order' | 'store'
 * @param {Object} data - 对应数据
 * @returns {Object} 卡片数据 { type, data, renderHint }
 */
export function createRichCard(type, data) {
  return { type, data, renderHint: 'order_card' }
}

/**
 * 生成商品推荐卡片数据
 */
export function createProductCards(products) {
  return (products || []).slice(0, 3).map(p => createRichCard('product', {
    name: p.productName,
    price: p.initialPrice,
    description: p.description || p.category,
    tags: p.tags,
    productId: p.productId,
  }))
}

/**
 * 生成订单状态卡片数据
 */
export function createOrderCard(order) {
  return createRichCard('order', {
    orderId: order.orderId,
    status: order.orderStatusName,
    store: order.storeInfo?.storeName,
    total: order.orderPayAmount,
    pickupCode: order.takeMealCodeInfo?.code,
  })
}

// ─── 系统提示词注入 ───

/**
 * 获取点单相关的系统提示词片段
 * 注入 prompt-builder 增强 AI 的点单理解能力
 */
export function getOrderingPromptSection() {
  return `
## 自助点单能力
你（阿喜）可以通过 MCP 工具帮助用户完成自助点单。当用户表达点单意图时，你应该：

1. **门店选择**：如果用户没有指定门店，使用 queryStoreList 工具查找附近门店并推荐
2. **商品推荐**：使用 searchProduct 工具搜索匹配的商品，推荐时展示名称、描述和价格
3. **定制确认**：主动询问用户的糖度、冰量、加料偏好，使用 customizeProduct 工具设置
4. **订单预览**：下单前使用 previewOrder 展示订单明细让用户确认
5. **创建订单**：确认后使用 createOrder 创建订单
6. **订单追踪**：用户查单时使用 queryOrderDetail 返回状态和取餐码

### 点单对话风格
- 语气轻松活泼，符合喜茶年轻品牌调性
- 推荐商品时简要描述口味特点
- 询问定制时给出口味建议（如"五分糖搭配少冰口感更佳哦"）
- 下单前一定要让用户确认商品和价格

### 可识别的饮品关键词
多肉葡萄、多肉芒果、芝芝莓莓、芝芝芒芒、芝芝桃桃、满杯红柚、百香芒芒、柠檬茶、茉莉绿茶、四季春茶、铁观音、杨梅冰茶、生椰芒芒甘露等

### 定制选项速查
- 糖度：全糖 / 七分糖 / 五分糖 / 三分糖 / 无糖
- 冰量：正常冰 / 少冰 / 去冰 / 温 / 热
- 加料：芝士(+3) / 椰果(+2) / 珍珠(+2) / 芋圆(+3) / 红豆(+2) / 芦荟(+2)
- 杯型：中杯 / 大杯(+3)
`
}

// ─── MCP 工具定义导出（供 LLM function calling 使用） ───

/**
 * 获取 MCP 工具的 OpenAI function calling 格式定义
 * 可直接注入 LLM API 请求的 tools 参数
 */
export function getToolDefinitionsForLLM() {
  return getMCPToolDefinitions()
}
