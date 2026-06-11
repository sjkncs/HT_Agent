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
  reorderFromHistory,
} from './mcp-client.js'

// ─── 点单意图检测 ───

const ORDER_INTENT_PATTERNS = [
  // 点单意图 — 需要明确的点单信号 (动词+量词 或 点单短语)
  { pattern: /(?:想|要|来|点|买|订)(?:一杯|一份|一个|两杯|两|个杯)/i, type: 'order', subType: 'create' },
  { pattern: /(?:帮我|给我|帮忙).*(?:点|买|订|来)(?:一杯|一份|一个|两杯)/i, type: 'order', subType: 'create' },
  { pattern: /(?:帮我|给我|帮忙|我想).*(?:点单|下单|点奶茶|点一杯|点喝的)/i, type: 'order', subType: 'create' },
  { pattern: /(?:点单|下单|来一杯|点一杯|帮我点)/i, type: 'order', subType: 'create' },
  // 浏览意图 — 需要饮品/喜茶上下文（防止"路线推荐""餐厅推荐"误匹配）
  { pattern: /(?:有什么|看看|菜单|什么好喝).*(?:喝|饮品|奶茶|茶)/i, type: 'order', subType: 'browse' },
  { pattern: /(?:有什么好喝|有什么喝的|看看菜单|推荐.*喝|喝.*推荐)/i, type: 'order', subType: 'browse' },
  { pattern: /(?:新品|限定|当季|季节).*(?:推荐|喝|饮品|上市|有什么)/i, type: 'order', subType: 'browse_new' },
  // 门店意图 — 双信号 (位置词 + 门店/喜茶上下文)
  { pattern: /(?:附近|哪里).*(?:门店|喜茶|喝茶|奶茶)/i, type: 'order', subType: 'store' },
  { pattern: /(?:门店|喜茶).*(?:附近|哪里|地址|位置)/i, type: 'order', subType: 'store' },
  // 查单意图
  { pattern: /(?:查|看|我的).*(?:订单|单号|取餐)/i, type: 'query_order' },
  { pattern: /(?:订单号|取餐码).*(\d{4,})/i, type: 'query_order', subType: 'by_id' },
  { pattern: /(?:做好了吗|到哪了|等多久|排队)/i, type: 'query_order', subType: 'status' },
  // 取消意图
  { pattern: /(?:取消|退单|不要了|退款).*(?:订单|单)/i, type: 'cancel_order' },
  { pattern: /(?:取消|退).*(\d{4,})/i, type: 'cancel_order' },
  // 定制意图
  { pattern: /(?:少糖|无糖|三分糖|五分糖|七分糖|全糖)/i, type: 'customize', subType: 'sugar' },
  { pattern: /(?:少冰|去冰|正常冰)|(?:^|[,，、\s])(?:热|温)(?:$|[的了吗吧啊\s,，、])/i, type: 'customize', subType: 'ice' },
  { pattern: /(?:加|多).*(?:珍珠|椰果|芝士|芋圆|红豆|芦荟)/i, type: 'customize', subType: 'topping' },
  { pattern: /(?:大杯|中杯|杯型)/i, type: 'customize', subType: 'cup' },
  // P1-6: 复购意图
  { pattern: /(?:再来一杯|再来一单|老样子|上次那个|上次点的|之前点的|复购|再点一)/i, type: 'order', subType: 'reorder' },
  { pattern: /(?:历史订单|以前点的|之前买的)/i, type: 'order', subType: 'reorder' },
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
    reorderFromHistory: () => reorderFromHistory(args),
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
    case 'reorderFromHistory':
      return formatReorderFromHistory(result.data)
    default:
      return JSON.stringify(result.data)
  }
}

function formatStoreList(stores) {
  if (!stores?.length) return '抱歉，暂未找到附近的喜茶门店。请尝试换个地址或告诉阿喜您所在的城市和区域。'
  const top5 = stores.slice(0, 5)
  let text = `为您找到 ${stores.length} 家门店：\n\n`
  for (let i = 0; i < top5.length; i++) {
    const s = top5[i]
    const status = s.businessStatus === 1 ? '营业中' : s.businessStatus === 3 ? '即将打烊' : '休息中'
    text += `${i + 1}. ${s.storeName}`
    if (s.distance) text += `（${s.distance}km）`
    text += `\n   地址：${s.address}\n`
    text += `   时间：${s.workTimeStart}-${s.workTimeEnd}，${status}\n`
    text += `   支持：${s.storeTags?.join('/') || '堂食'}\n`
    // P1-5: 打烊预警
    if (s.closingSoon) text += `   ⚠️ 门店将于 ${s.closingTime || s.workTimeEnd} 打烊，请尽快下单\n`
    if (s.businessStatus === 2) text += `   ❌ 门店已休息，建议选择其他门店\n`
    text += '\n'
  }
  // P1-2: 门店切换提示
  text += '请回复门店序号选择，或告诉我您想去哪家。确认后阿喜帮您查商品。\n如需更换门店，随时告诉阿喜即可。'
  return text
}

function formatProductList(products) {
  if (!products?.length) return '抱歉，未找到匹配的商品，换个关键词试试？'
  let text = `为您推荐以下饮品：\n\n`
  const shown = products.slice(0, 5)
  for (let i = 0; i < shown.length; i++) {
    const p = shown[i]
    const tags = p.tags?.length ? ` [${p.tags.join('/')}]` : ''
    // P1-3: 售罄标记
    if (p.soldOut || p.available === false) {
      text += `${i + 1}. ~~${p.productName}~~${tags} ❌ 暂时售罄\n`
      text += `   ${p.description || p.category}\n\n`
    } else {
      text += `${i + 1}. ${p.productName}${tags}\n`
      text += `   ${p.description || p.category}\n`
      text += `   ¥${p.initialPrice}起\n\n`
    }
  }
  if (products.length > 5) text += `还有 ${products.length - 5} 款商品可选。`
  text += '\n回复序号选择，阿喜帮您定制糖度和冰量。'
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
  let text = `${product.productName} — ¥${product.initialPrice}\n`
  text += `${product.description || ''}\n\n`
  if (product.ingredients?.length) text += `原料：${product.ingredients.join('、')}\n`
  if (product.allergens?.length) text += `过敏原：${product.allergens.join('、')}\n`
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
  let text = '订单预览：\n\n'
  text += `门店：${preview.storeInfo?.storeName}\n`
  // P1-5: 门店打烊预警
  if (preview.closingSoon) {
    text += `⚠️ 注意：该门店将于 ${preview.storeClosingTime} 打烊，请尽快完成下单和支付！\n\n`
  }
  if (preview.storeClosed) {
    text += `❌ 该门店已休息，无法下单。请更换其他营业中的门店。\n`
    return text
  }
  for (const item of preview.productInfoList || []) {
    text += `  ${item.name} x${item.amount}`
    if (item.additionDesc) text += ` (${item.additionDesc})`
    text += ` — ¥${item.estimateTotalPrice?.toFixed(2)}\n`
  }
  // P1-3: 售罄商品提示
  if (preview.soldOutItems?.length) {
    text += '\n⚠️ 以下商品暂时售罄：\n'
    for (const item of preview.soldOutItems) {
      text += `  ${item.name} — 暂不可点\n`
      if (item.alternatives?.length) {
        text += `  同系列推荐：${item.alternatives.map(a => `${a.productName}(¥${a.estimatePrice})`).join('、')}\n`
      }
    }
  }
  text += `\n`
  if (preview.privilegeMoney > 0) text += `优惠：-¥${preview.privilegeMoney.toFixed(2)}\n`
  if (preview.deliveryFee > 0) text += `配送费：¥${preview.deliveryFee.toFixed(2)}\n`
  text += `实付金额：¥${preview.discountPrice?.toFixed(2)}\n`
  // P1-4: 动态制作时长
  if (preview.estimatedWaitMinutes) {
    text += `预计${preview.estimatedWaitMinutes}分钟后可取餐`
    if (preview.estimatedWaitMinutes >= 20) text += `（当前订单较多，请耐心等待）`
    text += '\n'
  }
  text += '\n请确认订单信息。确认后阿喜将获取最终价格；如果应付不高于上述金额且商品明细一致，就直接创建订单。如果价格有变化会先告知您。'
  return text
}

function formatCreateOrder(order) {
  if (!order) return '创建订单失败。'
  let text = `订单创建成功！\n\n`
  text += `订单号：${order.orderIdStr}\n`
  text += `门店：${order.storeInfo?.storeName || ''}\n`
  text += `需支付：¥${order.discountPrice?.toFixed(2)}\n`
  if (order.payOrderUrl || order.payOrderQrCodeUrl) {
    text += `\n请扫码支付：${order.payOrderQrCodeUrl || order.payOrderUrl}\n`
  }
  // P2-1: 支付轮询提示
  text += '\n支付完成后告诉阿喜"已支付"，阿喜会自动帮您查询支付状态和取餐码。\n'
  text += '（阿喜会轮询确认支付结果，您无需手动截图或提供支付凭证）'
  return text
}

function formatOrderDetail(order) {
  if (!order) return '未找到该订单。'
  const STATUS_MAP = { 10: '待支付', 20: '已支付', 30: '制作中', 40: '待取餐', 50: '配送中', 80: '已完成', 100: '已取消' }
  let text = `订单状态：${order.orderStatusName || STATUS_MAP[order.orderStatus] || '未知'}\n\n`
  text += `订单号：${order.orderId}\n`
  text += `门店：${order.storeInfo?.storeName}\n\n`

  if (order.productInfoList?.length) {
    for (const item of order.productInfoList) {
      text += `  ${item.name} x${item.amount}`
      if (item.additionDesc) text += ` (${item.additionDesc})`
      text += '\n'
    }
  }

  text += `\n实付：¥${order.orderPayAmount?.toFixed(2)}\n`

  if (order.takeMealCodeInfo?.code && order.takeMealCodeInfo.code !== '生成中') {
    text += `\n取餐码：${order.takeMealCodeInfo.code}`
    if (order.takeMealCodeInfo.shelfNo) text += ` (${order.takeMealCodeInfo.shelfNo})`
    text += '\n'
  }

  if (order.orderStatus === 30) text += '\n饮品正在制作中，请稍候...'
  if (order.orderStatus === 40) text += '\n饮品已做好，请到取餐处取餐！'
  if (order.remark) text += `\n备注：${order.remark}\n`

  return text
}

function formatCancelOrder(result) {
  if (!result) return '取消订单失败。'
  if (result.needReview) {
    return `${result.message}\n\n订单正在制作中，取消需要门店审核。您可以稍等片刻，或联系门店客服。`
  }
  if (result.success) {
    return `订单已取消。\n退款金额 ¥${result.refundAmount?.toFixed(2)} 将在1-3个工作日内原路返回。`
  }
  return '取消失败，请稍后重试或联系客服。'
}

function formatCouponList(coupons) {
  if (!coupons?.length) return '暂无可用优惠券。'
  let text = `您有 ${coupons.length} 张优惠券：\n\n`
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
  let text = `最近 ${data.orders.length} 笔订单（共 ${data.total} 笔）：\n\n`
  for (const o of data.orders) {
    text += `${o.orderTime} · ${o.storeName}\n`
    text += `   ${o.productNames.join('、')} · ¥${o.totalAmount} · ${o.orderStatusName}\n\n`
  }
  text += '想再点哪一款？阿喜可以帮您快速下单。'
  return text
}

function formatPaymentStatus(data) {
  if (!data) return '支付状态查询失败。'
  const statusMap = { paid: '已支付', pending: '待支付', refunded: '已退款', failed: '支付失败' }
  const statusText = statusMap[data.paymentStatus] || data.paymentStatus
  let text = `支付状态：${statusText}\n`
  if (data.paidAmount) text += `   支付金额：¥${data.paidAmount}\n`
  if (data.paymentMethod) text += `   支付方式：${data.paymentMethod}\n`
  if (data.paidAt) text += `   支付时间：${new Date(data.paidAt).toLocaleString('zh-CN')}\n`
  if (data.refundStatus) text += `   退款状态：${data.refundStatus}\n`
  // P2-1: 轮询中提示
  if (data.paymentStatus === 'pending' && data.pollCount) {
    text += `\n正在等待支付确认（已查询${data.pollCount}次），请稍候...\n`
    text += '如果长时间未确认，请检查支付是否成功或重新扫码支付。'
  }
  if (data.paymentStatus === 'paid') {
    text += '\n支付成功！阿喜马上为您查询取餐码。'
  }
  return text
}

// P1-6: 历史订单复购格式化
function formatReorderFromHistory(data) {
  if (!data) return '未找到该历史订单。'
  let text = `复购准备：\n\n`
  text += `门店：${data.storeInfo?.storeName || '原门店'}\n`
  if (!data.storeAvailable) {
    text += `⚠️ 该门店已休息，建议更换门店后重新下单。\n`
    return text
  }
  if (data.closingSoon) {
    text += `⚠️ 门店即将打烊，请尽快下单！\n`
  }
  if (data.productList?.length) {
    text += `\n商品清单：\n`
    for (const p of data.productList) {
      text += `  ${p.productName} x${p.amount} — ¥${(p.currentPrice * p.amount).toFixed(2)}\n`
    }
    text += `\n预估总价：¥${data.estimatedTotal?.toFixed(2)}\n`
  }
  if (data.unavailableItems?.length) {
    text += `\n⚠️ 以下商品已售罄：\n`
    for (const item of data.unavailableItems) {
      text += `  ${item.productName}`
      if (item.alternatives?.length) {
        text += ` → 推荐替换：${item.alternatives.map(a => a.productName).join('、')}`
      }
      text += '\n'
    }
  }
  if (data.canReorder) {
    text += '\n要直接下单吗？阿喜会帮您走一遍确认流程。'
  } else {
    text += '\n暂无法复购，请选择其他门店或重新选购商品。'
  }
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
## 能力边界声明（点单前必须了解）

### 门店搜索
- 用户给出文字地址（如"深圳前海鸿荣源中心"），阿喜直接用 queryStoreList(address=地址) 搜索附近门店，不需要用户提供经纬度坐标
- 如果找不到匹配门店，告知用户并建议换个地址或直接说门店名
- 门店确认后才查商品；换门店时必须重新调 searchProduct 查新门店的商品，不沿用上一家店的库存和价格

### 商品查询
- 使用 searchProduct(storeId, query) 按关键词搜索喜茶商品，返回名称、描述、价格
- 不要编造不在商品列表中的饮品名或价格
- 搜索商品时看到的价格只是预估，最终价格以订单预览为准

### 定制选项
- 使用 customizeProduct 切换糖度、冰量、加料、杯型
- 糖度：全糖/七分糖/五分糖/三分糖/无糖
- 冰量：正常冰/少冰/去冰/温/热
- 加料：芝士(+3)/椰果(+2)/珍珠(+2)/芋圆(+3)/红豆(+2)/芦荟(+2)
- 杯型：中杯/大杯(+3)

### 订单流程与约束
- 下单前必须用 previewOrder 预览订单，展示最终价格、优惠和完整商品明细
- 用户确认后才用 createOrder 创建订单
- **价格拦截规则**：预览后对比——如果最终应付价高于商品搜索时的预估价，或者商品规格发生了变化，必须停下来告知用户具体差异，让用户重新确认后才能创建订单。绝不在价格变高时静默下单
- createOrder 后返回支付信息，支付完成后用户告知阿喜即可查询取餐码
- 未支付前不主动查取餐码

### 当前不支持的功能（重要）
当前 createOrder 工具的参数结构为：
\`\`\`
createOrder({
  storeId,        // 门店ID
  productList,    // 商品列表
  longitude,      // 门店经度
  latitude,       // 门店纬度
  couponCodeList, // 优惠券编码
  pickupType,     // 取餐方式：目前仅支持 "self_pickup"
  remark          // 订单备注
})
\`\`\`
请注意以下字段**不存在**于 createOrder 参数中：
- 没有 deliveryAddress（配送地址）
- 没有 contactName（收货人姓名）
- 没有 contactPhone（收货人手机号）
- 没有 deliveryTime（配送时间）

因此：
- **不支持外卖配送**：无法填写收货地址、联系人、手机号
- **不支持第三方渠道**：拼好饭、美团、饿了么等第三方平台不在当前工具能力范围内
- **只支持自提下单**：pickupType 只能传 "self_pickup"

**渠道预警规则**：当用户的请求涉及上述不支持的功能时（如要求外卖配送、指定第三方平台下单），阿喜应该在**第一轮回复中就主动说明限制**，不要等走到下单步骤才报错。格式参考：
"当前喜茶点单工具只支持自提下单，暂不支持外卖配送（工具没有配送地址和联系人字段）。如果你接受改成自提，我可以继续帮你选择最近的门店。"

**部分失败处理规则**：当用户请求中同时包含能做和不能做的部分时（如"帮我点杯奶茶送到宿舍"），先正常处理能做的部分（搜门店、查商品），再说明不能做的部分（配送），最后给出替代方案（自提）。绝不因为一个不支持的功能就拒绝整个请求。

## 点单工作流（严格按步骤执行）

第1步-确认门店：用户说地址或位置 → 调用 queryStoreList(address=地址) → 展示门店列表（带序号、地址、营业时间、状态）→ 用户选择
  - 如果门店标记为"即将打烊"，主动提醒用户尽快下单
  - 如果门店已休息（休息中），不推荐该门店，引导用户选其他店
  - 如果用户请求涉及不支持的功能（配送/第三方），在展示门店时主动预警
  - **门店切换**：用户随时可以更换门店，说"换一家""还是去XX店"时重新从第1步开始，新门店必须重新查商品
第2步-搜索商品：门店确定后 → 调用 searchProduct(storeId, query) → 展示商品列表（带序号和预估价）
  - 换门店时必须重新调用 searchProduct，不沿用上次的商品数据
  - **售罄处理**：如果看到商品标记为"售罄"，主动告知用户并推荐同系列可点商品，不引导用户选择已售罄商品
第3步-定制确认：用户选商品后 → 主动问糖度冰量 → 调用 customizeProduct 设置属性
第4步-优惠券检查+订单预览：
  - **先调用 queryCouponList** 检查用户有无可用优惠券，如有则告知用户并询问是否使用
  - 调用 previewOrder（传入用户选择的 couponCodeList）→ 展示完整订单明细和最终价格 → 对比预估价：
  - 价格不变 → 请用户确认
  - 价格变高或规格变了 → 告知用户差异，重新确认
  - **打烊预警**：如果预览返回 closingSoon=true，提醒用户门店即将打烊
  - **售罄拦截**：如果预览返回 soldOutItems，告知用户哪些商品被移出并推荐替代品
第5步-创建订单：**必须等用户明确确认**（如"确认""好的""下单吧"）后才能调用 createOrder
  - **自动下单防护**：绝不在用户未明确说"确认"或同意的情况下自动创建订单
  - 如果应付不高于预估价且明细一致，直接创建
  - 如果价格有变化，等用户二次确认后再创建
第6步-支付确认+取餐码：
  - 用户说"已支付"/"支付好了"/"付了"后 → **先调用 queryPaymentStatus** 确认支付结果
  - 如果返回 pending（待支付），告知用户正在确认中，请稍后再告诉阿喜
  - 如果返回 paid（已支付）→ 调用 queryOrderDetail → 返回取餐码和订单状态
  - 如果返回 failed（支付失败）→ 告知用户支付未成功，建议重新扫码支付
第7步-复购（可选入口）：
  - 用户说"再来一杯""上次那个""老样子"时 → 调用 queryOrderHistory 查看历史订单
  - 展示历史订单列表 → 用户选择 → 调用 reorderFromHistory 检查可用性
  - 如有售罄商品，告知用户并推荐替代品 → 确认后走正常点单流程

## 点单对话风格
- 语气轻松活泼，符合喜茶年轻品牌调性
- 推荐商品时简要描述口味特点
- 询问定制时给出口味建议（如"五分糖搭配少冰口感更佳"）
- 下单前一定要让用户确认商品和价格
- 遇到工具不支持的功能时，坦诚说明限制并给出替代方案，绝不说"答不上来"
- 解释限制时可以引用工具参数来论证（如"createOrder 没有配送地址字段，所以只能自提"）
- **售罄时**：不要让用户选不到的商品，直接推荐同系列替代品（如"多肉桃李暂时售罄，多肉葡萄也很受欢迎要试试吗？"）
- **打烊时**：提醒用户门店即将打烊，建议尽快完成下单和支付
- **复购时**：快速展示历史订单，一键复购，如有售罄商品主动推荐替换

## 可识别的饮品关键词
多肉葡萄、多肉芒果、芝芝莓莓、芝芝芒芒、芝芝桃桃、满杯红柚、百香芒芒、柠檬茶、茉莉绿茶、四季春茶、铁观音、杨梅冰茶、生椰芒芒甘露等
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
