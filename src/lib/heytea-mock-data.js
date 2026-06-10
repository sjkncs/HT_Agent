/**
 * 喜茶点单 Mock 数据
 * 
 * 提供离线开发/演示所需的模拟门店、商品、订单数据。
 * 通过 registerMockHandler 注入 mcp-client.js 的 Mock 路由。
 */

import { registerMockHandler } from './mcp-client.js'

// ─── 门店数据 ───
const STORES = [
  {
    storeId: 10086,
    storeName: '喜茶·深圳万象天地店',
    address: '深圳市南山区深南大道9668号万象天地LG层',
    storeTags: ['堂食', '外卖'],
    longitude: 113.94512,
    latitude: 22.52891,
    workTimeStart: '10:00',
    workTimeEnd: '22:00',
    businessStatus: 1,
    distance: 0.23,
    storeNo: 'SZ-0086',
    phone: '0755-88886666',
  },
  {
    storeId: 10087,
    storeName: '喜茶·深圳海岸城店',
    address: '深圳市南山区文心四路与海德二道交汇处海岸城购物中心B1层',
    storeTags: ['堂食', '外卖'],
    longitude: 113.93856,
    latitude: 22.51723,
    workTimeStart: '10:00',
    workTimeEnd: '22:30',
    businessStatus: 1,
    distance: 1.05,
    storeNo: 'SZ-0087',
    phone: '0755-88887777',
  },
  {
    storeId: 10088,
    storeName: '喜茶·深圳来福士广场店',
    address: '深圳市南山区南海大道2163号来福士广场L1层',
    storeTags: ['堂食', '外卖', '新店'],
    longitude: 113.92987,
    latitude: 22.51045,
    workTimeStart: '09:30',
    workTimeEnd: '22:00',
    businessStatus: 1,
    distance: 1.82,
    storeNo: 'SZ-0088',
    phone: '0755-88889999',
  },
  {
    storeId: 10089,
    storeName: '喜茶·深圳益田假日广场店',
    address: '深圳市南山区深南大道9028号益田假日广场B2层',
    storeTags: ['堂食'],
    longitude: 113.97012,
    latitude: 22.53456,
    workTimeStart: '10:00',
    workTimeEnd: '21:30',
    businessStatus: 3,
    distance: 3.21,
    storeNo: 'SZ-0089',
    phone: '0755-88880000',
  },
  {
    storeId: 10090,
    storeName: '喜茶·深圳科技园店',
    address: '深圳市南山区科技中一路与科技路交汇处',
    storeTags: ['外卖'],
    longitude: 113.93200,
    latitude: 22.54100,
    workTimeStart: '08:00',
    workTimeEnd: '20:00',
    businessStatus: 2,
    distance: 2.45,
    storeNo: 'SZ-0090',
    phone: '0755-88881111',
  },
  {
    storeId: 10091,
    storeName: '喜茶·深圳福田COCO Park店',
    address: '深圳市福田区福华一路COCO Park购物中心L1层',
    storeTags: ['堂食', '外卖'],
    longitude: 114.05912,
    latitude: 22.53891,
    workTimeStart: '10:00',
    workTimeEnd: '22:30',
    businessStatus: 1,
    distance: 5.68,
    storeNo: 'SZ-0091',
    phone: '0755-88882222',
  },
  {
    storeId: 10092,
    storeName: '喜茶·深圳罗湖万象城店',
    address: '深圳市罗湖区宝安南路1881号华润万象城L1层',
    storeTags: ['堂食', '外卖', '旗舰店'],
    longitude: 114.10234,
    latitude: 22.54567,
    workTimeStart: '09:00',
    workTimeEnd: '23:00',
    businessStatus: 1,
    distance: 8.42,
    storeNo: 'SZ-0092',
    phone: '0755-88883333',
  },
  {
    storeId: 10093,
    storeName: '喜茶·深圳深业上城店',
    address: '深圳市福田区皇岗路5001号深业上城L2层',
    storeTags: ['堂食', '外卖'],
    longitude: 114.05123,
    latitude: 22.55678,
    workTimeStart: '10:00',
    workTimeEnd: '22:00',
    businessStatus: 1,
    distance: 4.35,
    storeNo: 'SZ-0093',
    phone: '0755-88884444',
  },
  {
    storeId: 10094,
    storeName: '喜茶·深圳前海壹方城店',
    address: '深圳市宝安区新安街道前海壹方城B1层',
    storeTags: ['堂食', '外卖', '新店'],
    longitude: 113.88234,
    latitude: 22.53901,
    workTimeStart: '09:30',
    workTimeEnd: '22:00',
    businessStatus: 1,
    distance: 6.17,
    storeNo: 'SZ-0094',
    phone: '0755-88885555',
  },
  {
    storeId: 10095,
    storeName: '喜茶·深圳龙华壹方天地店',
    address: '深圳市龙华区人民路壹方天地购物中心L1层',
    storeTags: ['堂食', '外卖'],
    longitude: 114.03456,
    latitude: 22.64321,
    workTimeStart: '10:00',
    workTimeEnd: '22:00',
    businessStatus: 3,
    distance: 12.8,
    storeNo: 'SZ-0095',
    phone: '0755-88886600',
  },
]

// ─── 属性模板 ───
const SUGAR_ATTR = {
  attributeId: 1,
  attributeName: '糖度',
  multiSelect: false,
  productSubAttrs: [
    { attributeId: 101, attributeName: '全糖', selected: null, price: 0, canSelected: 1 },
    { attributeId: 102, attributeName: '七分糖', selected: null, price: 0, canSelected: 1 },
    { attributeId: 103, attributeName: '五分糖', selected: null, price: 0, canSelected: 1 },
    { attributeId: 104, attributeName: '三分糖', selected: null, price: 0, canSelected: 1 },
    { attributeId: 105, attributeName: '无糖', selected: null, price: 0, canSelected: 1 },
  ],
}

const ICE_ATTR = {
  attributeId: 2,
  attributeName: '冰量',
  multiSelect: false,
  productSubAttrs: [
    { attributeId: 201, attributeName: '正常冰', selected: null, price: 0, canSelected: 1 },
    { attributeId: 202, attributeName: '少冰', selected: null, price: 0, canSelected: 1 },
    { attributeId: 203, attributeName: '去冰', selected: null, price: 0, canSelected: 1 },
    { attributeId: 204, attributeName: '温', selected: null, price: 0, canSelected: 1 },
    { attributeId: 205, attributeName: '热', selected: null, price: 0, canSelected: 1 },
  ],
}

const TOPPING_ATTR = {
  attributeId: 3,
  attributeName: '加料',
  multiSelect: true,
  productSubAttrs: [
    { attributeId: 301, attributeName: '芝士', selected: null, price: 3, canSelected: 1 },
    { attributeId: 302, attributeName: '椰果', selected: null, price: 2, canSelected: 1 },
    { attributeId: 303, attributeName: '珍珠', selected: null, price: 2, canSelected: 1 },
    { attributeId: 304, attributeName: '芋圆', selected: null, price: 3, canSelected: 1 },
    { attributeId: 305, attributeName: '红豆', selected: null, price: 2, canSelected: 1 },
    { attributeId: 306, attributeName: '芦荟', selected: null, price: 2, canSelected: 1 },
  ],
}

const CUP_ATTR = {
  attributeId: 4,
  attributeName: '杯型',
  multiSelect: false,
  productSubAttrs: [
    { attributeId: 401, attributeName: '中杯', selected: null, price: 0, canSelected: 1 },
    { attributeId: 402, attributeName: '大杯', selected: null, price: 3, canSelected: 1 },
  ],
}

// 热饮版冰量属性（只有热/温选项）
const HOT_ICE_ATTR = {
  ...ICE_ATTR,
  productSubAttrs: [
    { attributeId: 204, attributeName: '温', selected: null, price: 0, canSelected: 1 },
    { attributeId: 205, attributeName: '热', selected: null, price: 0, canSelected: 1 },
  ],
}

function buildAttrs(isHotDrink = false) {
  return [
    { ...SUGAR_ATTR, productSubAttrs: SUGAR_ATTR.productSubAttrs.map(a => ({ ...a })) },
    { ...(isHotDrink ? HOT_ICE_ATTR : ICE_ATTR), productSubAttrs: (isHotDrink ? HOT_ICE_ATTR : ICE_ATTR).productSubAttrs.map(a => ({ ...a })) },
    { ...TOPPING_ATTR, productSubAttrs: TOPPING_ATTR.productSubAttrs.map(a => ({ ...a })) },
    { ...CUP_ATTR, productSubAttrs: CUP_ATTR.productSubAttrs.map(a => ({ ...a })) },
  ]
}

// ─── 商品数据 ───
const PRODUCTS = [
  // 多肉系列
  {
    productId: 2001, productName: '多肉葡萄', skuCode: 'HT-2001',
    pictureUrl: '', category: '多肉系列',
    description: '手剥巨峰葡萄搭配清新茉莉绿茶底，果肉满满，清爽酸甜',
    ingredients: ['巨峰葡萄', '茉莉绿茶', '糖浆', '冰块'],
    allergens: [],
    nutritionInfo: { calories: '约260kcal', sugar: '约32g', caffeine: '约35mg' },
    productAttrs: buildAttrs(), tags: ['热销', '经典'], initialPrice: 29, estimatePrice: 29,
  },
  {
    productId: 2002, productName: '多肉芒果', skuCode: 'HT-2002',
    pictureUrl: '', category: '多肉系列',
    description: '大块芒果果肉搭配清新茶底，热带风情满满',
    ingredients: ['芒果', '茉莉绿茶', '糖浆', '冰块'],
    allergens: ['芒果'],
    nutritionInfo: { calories: '约280kcal', sugar: '约36g', caffeine: '约30mg' },
    productAttrs: buildAttrs(), tags: ['热销'], initialPrice: 28, estimatePrice: 28,
  },
  {
    productId: 2003, productName: '多肉桃李', skuCode: 'HT-2003',
    pictureUrl: '', category: '多肉系列',
    description: '新鲜桃李搭配清爽茶底，夏日限定果茶',
    ingredients: ['桃李', '四季春茶', '糖浆', '冰块'],
    allergens: [],
    nutritionInfo: { calories: '约230kcal', sugar: '约28g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: ['季节限定'], initialPrice: 26, estimatePrice: 26,
  },
  // 芝芝系列
  {
    productId: 3001, productName: '芝芝莓莓', skuCode: 'HT-3001',
    pictureUrl: '', category: '芝芝系列',
    description: '新鲜草莓搭配浓郁芝士奶盖，酸甜与奶香的完美碰撞',
    ingredients: ['草莓', '芝士奶盖', '茉莉绿茶', '糖浆', '冰块'],
    allergens: ['乳制品'],
    nutritionInfo: { calories: '约380kcal', sugar: '约35g', caffeine: '约30mg' },
    productAttrs: buildAttrs(), tags: ['热销', '经典'], initialPrice: 32, estimatePrice: 32,
  },
  {
    productId: 3002, productName: '芝芝芒芒', skuCode: 'HT-3002',
    pictureUrl: '', category: '芝芝系列',
    description: '大块芒果搭配浓郁芝士奶盖，热带风味',
    ingredients: ['芒果', '芝士奶盖', '茉莉绿茶', '糖浆', '冰块'],
    allergens: ['芒果', '乳制品'],
    nutritionInfo: { calories: '约400kcal', sugar: '约38g', caffeine: '约30mg' },
    productAttrs: buildAttrs(), tags: ['热销'], initialPrice: 33, estimatePrice: 33,
  },
  {
    productId: 3003, productName: '芝芝桃桃', skuCode: 'HT-3003',
    pictureUrl: '', category: '芝芝系列',
    description: '鲜桃果肉搭配芝士奶盖与清爽茶底，夏日必备',
    ingredients: ['水蜜桃', '芝士奶盖', '四季春茶', '糖浆', '冰块'],
    allergens: ['乳制品'],
    nutritionInfo: { calories: '约350kcal', sugar: '约33g', caffeine: '约35mg' },
    productAttrs: buildAttrs(), tags: ['季节限定', '热销'], initialPrice: 32, estimatePrice: 32,
  },
  // 果茶系列
  {
    productId: 4001, productName: '满杯红柚', skuCode: 'HT-4001',
    pictureUrl: '', category: '果茶系列',
    description: '整颗红柚鲜榨搭配清新绿茶，微苦回甘',
    ingredients: ['红柚', '茉莉绿茶', '糖浆', '冰块'],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约25g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 4002, productName: '百香芒芒', skuCode: 'HT-4002',
    pictureUrl: '', category: '果茶系列',
    description: '百香果与芒果的热带组合，酸甜可口',
    ingredients: ['百香果', '芒果', '茉莉绿茶', '糖浆', '冰块'],
    allergens: ['芒果'],
    nutritionInfo: { calories: '约250kcal', sugar: '约30g', caffeine: '约35mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 26, estimatePrice: 26,
  },
  {
    productId: 4003, productName: '柠檬茶', skuCode: 'HT-4003',
    pictureUrl: '', category: '果茶系列',
    description: '手打新鲜柠檬搭配清新红茶底，经典港式风味',
    ingredients: ['新鲜柠檬', '红茶', '糖浆', '冰块'],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约22g', caffeine: '约50mg' },
    productAttrs: buildAttrs(), tags: ['经典'], initialPrice: 18, estimatePrice: 18,
  },
  // 纯茶系列
  {
    productId: 5001, productName: '茉莉绿茶', skuCode: 'HT-5001',
    pictureUrl: '', category: '纯茶系列',
    description: '优质茉莉花与绿茶的完美结合，花香悠长',
    ingredients: ['茉莉绿茶'],
    allergens: [],
    nutritionInfo: { calories: '约5kcal', sugar: '约0g', caffeine: '约45mg' },
    productAttrs: buildAttrs(true), tags: [], initialPrice: 12, estimatePrice: 12,
  },
  {
    productId: 5002, productName: '四季春茶', skuCode: 'HT-5002',
    pictureUrl: '', category: '纯茶系列',
    description: '台湾四季春乌龙茶，清香回甘',
    ingredients: ['四季春乌龙茶'],
    allergens: [],
    nutritionInfo: { calories: '约5kcal', sugar: '约0g', caffeine: '约55mg' },
    productAttrs: buildAttrs(true), tags: [], initialPrice: 13, estimatePrice: 13,
  },
  {
    productId: 5003, productName: '铁观音', skuCode: 'HT-5003',
    pictureUrl: '', category: '纯茶系列',
    description: '安溪铁观音，浓郁兰花香',
    ingredients: ['铁观音茶叶'],
    allergens: [],
    nutritionInfo: { calories: '约3kcal', sugar: '约0g', caffeine: '约60mg' },
    productAttrs: buildAttrs(true), tags: [], initialPrice: 15, estimatePrice: 15,
  },
  // 季节限定
  {
    productId: 6001, productName: '杨梅冰茶', skuCode: 'HT-6001',
    pictureUrl: '', category: '季节限定',
    description: '新鲜杨梅搭配冰爽茶底，夏日消暑首选',
    ingredients: ['杨梅', '茉莉绿茶', '糖浆', '冰块'],
    allergens: [],
    nutritionInfo: { calories: '约220kcal', sugar: '约28g', caffeine: '约30mg' },
    productAttrs: buildAttrs(), tags: ['新品', '季节限定'], initialPrice: 28, estimatePrice: 28,
  },
  {
    productId: 6002, productName: '生椰芒芒甘露', skuCode: 'HT-6002',
    pictureUrl: '', category: '季节限定',
    description: '生椰乳搭配芒果与西米，清甜不腻',
    ingredients: ['生椰乳', '芒果', '西米', '糖浆'],
    allergens: ['芒果', '椰子'],
    nutritionInfo: { calories: '约320kcal', sugar: '约34g', caffeine: '约0mg' },
    productAttrs: buildAttrs(), tags: ['新品', '季节限定'], initialPrice: 30, estimatePrice: 30,
  },
  // 小食
  {
    productId: 7001, productName: '蛋糕卷（原味）', skuCode: 'HT-7001',
    pictureUrl: '', category: '小食',
    description: '松软蛋糕卷搭配新鲜奶油',
    ingredients: ['鸡蛋', '面粉', '奶油', '糖'],
    allergens: ['鸡蛋', '小麦', '乳制品'],
    nutritionInfo: { calories: '约280kcal', sugar: '约18g', caffeine: '约0mg' },
    productAttrs: [], tags: [], initialPrice: 15, estimatePrice: 15,
  },
  {
    productId: 7002, productName: '芋泥麻薯', skuCode: 'HT-7002',
    pictureUrl: '', category: '小食',
    description: '绵密芋泥搭配软糯麻薯',
    ingredients: ['芋头', '糯米粉', '糖', '椰浆'],
    allergens: ['椰子'],
    nutritionInfo: { calories: '约240kcal', sugar: '约15g', caffeine: '约0mg' },
    productAttrs: [], tags: ['热销'], initialPrice: 18, estimatePrice: 18,
  },
]

// ─── 订单数据 ───
let _nextOrderId = 9000000000000000000
const ORDERS = new Map()

function generateOrderId() {
  return String(_nextOrderId++)
}

// 预置几个示例订单
const _now = Date.now()
ORDERS.set('8829301847562910001', {
  orderId: '8829301847562910001',
  orderStatus: 40,
  orderStatusName: '待取餐',
  aboutTime: _now + 5 * 60 * 1000,
  takeMealTime: '',
  takeMealCodeInfo: { code: 'A086', shelfNo: '3号架', takeOrderId: 'htRmJK3AAo=' },
  storeInfo: { storeId: 10086, storeName: '喜茶·深圳万象天地店', address: '深圳市南山区深南大道9668号' },
  productInfoList: [
    { productId: 2001, skuCode: 'HT-2001-003', name: '多肉葡萄', amount: 1, additionDesc: '五分糖/正常冰', brevityPicUrl: '', initPrice: 29, estimatePrice: 29, estimateTotalPrice: 29 },
  ],
  orderPayAmount: 29,
  pickupType: 'self_pickup',
  dispatchInfo: { dispatcherName: '', dispatcherMobile: '', dispatchAboutTime: '', destinationDistance: 0 },
  orderCommodityList: [{ commodityId: 2001, commodityCode: 'HT-2001', commodityName: '多肉葡萄', payableMoney: 29, payMoney: 29 }],
  orderType: 'self_pickup',
  remark: '',
})

ORDERS.set('8829301847562910002', {
  orderId: '8829301847562910002',
  orderStatus: 80,
  orderStatusName: '已完成',
  aboutTime: _now - 3600000,
  takeMealTime: '14:32',
  takeMealCodeInfo: { code: 'A052', shelfNo: '1号架', takeOrderId: 'htXnP7BBq=' },
  storeInfo: { storeId: 10087, storeName: '喜茶·深圳海岸城店', address: '深圳市南山区文心四路' },
  productInfoList: [
    { productId: 3001, skuCode: 'HT-3001-002', name: '芝芝莓莓', amount: 2, additionDesc: '七分糖/少冰', brevityPicUrl: '', initPrice: 32, estimatePrice: 32, estimateTotalPrice: 64 },
  ],
  orderPayAmount: 64,
  pickupType: 'self_pickup',
  dispatchInfo: { dispatcherName: '', dispatcherMobile: '', dispatchAboutTime: '', destinationDistance: 0 },
  orderCommodityList: [{ commodityId: 3001, commodityCode: 'HT-3001', commodityName: '芝芝莓莓', payableMoney: 64, payMoney: 64 }],
  orderType: 'self_pickup',
  remark: '',
})

ORDERS.set('8829301847562910003', {
  orderId: '8829301847562910003',
  orderStatus: 30,
  orderStatusName: '制作中',
  aboutTime: _now + 15 * 60 * 1000,
  takeMealTime: '',
  takeMealCodeInfo: { code: '生成中', shelfNo: '', takeOrderId: 'htKlM2CCr=' },
  storeInfo: { storeId: 10086, storeName: '喜茶·深圳万象天地店', address: '深圳市南山区深南大道9668号' },
  productInfoList: [
    { productId: 6001, skuCode: 'HT-6001-001', name: '杨梅冰茶', amount: 1, additionDesc: '三分糖/正常冰', brevityPicUrl: '', initPrice: 28, estimatePrice: 28, estimateTotalPrice: 28 },
    { productId: 7002, skuCode: 'HT-7002', name: '芋泥麻薯', amount: 1, additionDesc: '', brevityPicUrl: '', initPrice: 18, estimatePrice: 18, estimateTotalPrice: 18 },
  ],
  orderPayAmount: 46,
  pickupType: 'self_pickup',
  dispatchInfo: { dispatcherName: '', dispatcherMobile: '', dispatchAboutTime: '', destinationDistance: 0 },
  orderCommodityList: [
    { commodityId: 6001, commodityCode: 'HT-6001', commodityName: '杨梅冰茶', payableMoney: 28, payMoney: 28 },
    { commodityId: 7002, commodityCode: 'HT-7002', commodityName: '芋泥麻薯', payableMoney: 18, payMoney: 18 },
  ],
  orderType: 'self_pickup',
  remark: '少放冰',
})

// ─── Mock Handler ───
function mockHandler(toolName, args) {
  switch (toolName) {
    case 'queryStoreList':
      return handleQueryStoreList(args)
    case 'searchProduct':
      return handleSearchProduct(args)
    case 'customizeProduct':
      return handleCustomizeProduct(args)
    case 'queryProductDetail':
      return handleQueryProductDetail(args)
    case 'previewOrder':
      return handlePreviewOrder(args)
    case 'createOrder':
      return handleCreateOrder(args)
    case 'queryOrderDetail':
      return handleQueryOrderDetail(args)
    case 'cancelOrder':
      return handleCancelOrder(args)
    case 'queryCouponList':
      return {
        data: [
          { couponId: 'CP001', name: '新人专享 8 折券', discount: 0.8, minOrder: 20, maxDiscount: 10, validUntil: '2026-07-01', applicableStores: '全部门店' },
          { couponId: 'CP002', name: '满 30 减 5', discount: 5, type: 'fixed', minOrder: 30, validUntil: '2026-06-30', applicableStores: '深圳区域门店' },
          { couponId: 'CP003', name: '多肉系列第二杯半价', discount: 0.5, type: 'bogo', minOrder: 2, validUntil: '2026-06-15', applicableStores: '全部门店', category: '多肉系列' },
        ],
        success: true,
      }
    case 'queryOrderHistory':
      return {
        data: {
          total: 3,
          page: args.page || 1,
          pageSize: args.pageSize || 10,
          orders: [
            { orderId: '8829301847562910001', orderStatus: 80, orderStatusName: '已完成', storeName: '喜茶·深圳万象天地店', totalAmount: 29, orderTime: '2026-06-08 14:30', itemCount: 1, productNames: ['多肉葡萄'] },
            { orderId: '8829301847562910002', orderStatus: 80, orderStatusName: '已完成', storeName: '喜茶·深圳海岸城店', totalAmount: 62, orderTime: '2026-06-05 11:20', itemCount: 2, productNames: ['芝芝莓莓', '多肉芒果'] },
            { orderId: '8829301847562910003', orderStatus: 100, orderStatusName: '已取消', storeName: '喜茶·深圳万象天地店', totalAmount: 32, orderTime: '2026-06-01 16:45', itemCount: 1, productNames: ['满杯红柚'] },
          ],
        },
        success: true,
      }
    case 'queryPaymentStatus':
      return {
        data: {
          orderId: args.orderId,
          paymentStatus: 'paid',
          paymentMethod: '微信支付',
          paidAmount: 29,
          paidAt: Date.now() - 600000,
          refundStatus: null,
        },
        success: true,
      }
    default:
      throw new Error(`Unknown MCP tool: ${toolName}`)
  }
}

function ok(data) {
  return { code: 0, msg: 'success', data, success: true }
}

function handleQueryStoreList({ storeName, longitude, latitude }) {
  let results = [...STORES]
  if (storeName) {
    results = results.filter(s => s.storeName.includes(storeName))
  }
  results.sort((a, b) => a.distance - b.distance)
  return ok(results)
}

function handleSearchProduct({ storeId, query }) {
  const q = (query || '').toLowerCase()
  let results = PRODUCTS

  // 智能匹配：品类、名称、标签、描述
  if (q) {
    results = PRODUCTS.filter(p => {
      if (p.productName.toLowerCase().includes(q)) return true
      if (p.category.includes(q)) return true
      if (p.description.includes(q)) return true
      if (p.tags.some(t => t.includes(q))) return true
      // 泛化搜索词
      if ((q.includes('果茶') || q.includes('水果')) && ['果茶系列', '多肉系列'].includes(p.category)) return true
      if ((q.includes('奶盖') || q.includes('芝士')) && p.category === '芝芝系列') return true
      if (q.includes('纯茶') && p.category === '纯茶系列') return true
      if ((q.includes('新品') || q.includes('限定')) && p.tags.some(t => t === '新品' || t === '季节限定')) return true
      if (q.includes('小食') || q.includes('蛋糕') || q.includes('点心')) return p.category === '小食'
      if (q.includes('推荐') || q.includes('热销') || q.includes('热门')) return p.tags.includes('热销')
      return false
    })
  }

  // 深拷贝避免修改原始数据
  return ok(results.map(p => ({
    ...p,
    productAttrs: p.productAttrs.map(a => ({
      ...a,
      productSubAttrs: a.productSubAttrs.map(sa => ({ ...sa })),
    })),
  })))
}

function handleCustomizeProduct({ storeId, productId, skuCode, attrOperationParam, amount }) {
  const product = PRODUCTS.find(p => p.productId === productId)
  if (!product) throw new Error(`商品 ${productId} 不存在`)

  // 深拷贝
  const result = JSON.parse(JSON.stringify(product))

  // 应用属性切换
  if (attrOperationParam) {
    const { attributeId: groupId, subAttr } = attrOperationParam
    const attrGroup = result.productAttrs.find(a => a.attributeId === groupId)
    if (attrGroup) {
      const isMulti = attrGroup.multiSelect
      for (const sa of attrGroup.productSubAttrs) {
        if (isMulti) {
          // 多选：只修改目标属性
          if (sa.attributeId === subAttr.attributeId) {
            sa.selected = subAttr.operation === 3
          }
        } else {
          // 单选：取消其他，选中目标
          sa.selected = sa.attributeId === subAttr.attributeId
        }
      }
    }
  }

  // 计算价格
  let extraPrice = 0
  for (const attr of result.productAttrs) {
    for (const sa of attr.productSubAttrs) {
      if (sa.selected) extraPrice += sa.price
    }
  }
  result.estimatePrice = result.initialPrice + extraPrice
  result.skuCode = `${product.skuCode}-${String(amount || 1).padStart(3, '0')}`
  result.amount = amount || 1

  return ok(result)
}

function handleQueryProductDetail({ storeId, productId }) {
  const product = PRODUCTS.find(p => p.productId === productId)
  if (!product) throw new Error(`商品 ${productId} 不存在`)
  return ok(JSON.parse(JSON.stringify(product)))
}

function handlePreviewOrder({ storeId, productList, pickupType }) {
  const store = STORES.find(s => s.storeId === storeId)
  if (!store) throw new Error(`门店 ${storeId} 不存在`)

  let totalInit = 0
  let totalEstimate = 0
  const productInfoList = []

  for (const item of productList) {
    const product = PRODUCTS.find(p => p.productId === item.productId)
    if (!product) continue
    const initTotal = product.initialPrice * item.amount
    const estTotal = product.estimatePrice * item.amount
    totalInit += initTotal
    totalEstimate += estTotal
    productInfoList.push({
      productId: product.productId,
      skuCode: item.skuCode || product.skuCode,
      name: product.productName,
      amount: item.amount,
      additionDesc: '',
      brevityPicUrl: product.pictureUrl || '',
      initPrice: product.initialPrice,
      estimatePrice: product.estimatePrice,
      estimateTotalPrice: estTotal,
    })
  }

  const deliveryFee = pickupType === 'delivery' ? 5 : 0
  const waitMinutes = pickupType === 'delivery' ? 30 : 12

  return ok({
    aboutTime: Date.now() + waitMinutes * 60 * 1000,
    estimatedWaitMinutes: waitMinutes,
    discountPrice: totalEstimate + deliveryFee,
    totalInitialPrice: totalInit,
    privilegeMoney: totalInit - totalEstimate,
    deliveryFee,
    pickupType: pickupType || 'self_pickup',
    storeInfo: { storeId: store.storeId, storeName: store.storeName, address: store.address },
    productInfoList,
    couponCodeList: [],
  })
}

function handleCreateOrder({ storeId, productList, longitude, latitude, couponCodeList, pickupType, remark }) {
  const store = STORES.find(s => s.storeId === storeId)
  if (!store) throw new Error(`门店 ${storeId} 不存在`)

  const orderId = generateOrderId()
  const preview = handlePreviewOrder({ storeId, productList, pickupType })

  const order = {
    orderId,
    orderStatus: 10,
    orderStatusName: '待付款',
    aboutTime: preview.data.aboutTime,
    takeMealTime: '',
    takeMealCodeInfo: { code: '生成中', shelfNo: '', takeOrderId: `ht${orderId.slice(-8)}` },
    storeInfo: preview.data.storeInfo,
    productInfoList: preview.data.productInfoList,
    orderPayAmount: preview.data.discountPrice,
    pickupType: pickupType || 'self_pickup',
    dispatchInfo: { dispatcherName: '', dispatcherMobile: '', dispatchAboutTime: '', destinationDistance: 0 },
    orderCommodityList: productList.map(p => ({
      commodityId: p.productId,
      commodityCode: PRODUCTS.find(x => x.productId === p.productId)?.skuCode || '',
      commodityName: PRODUCTS.find(x => x.productId === p.productId)?.productName || '',
      payableMoney: (PRODUCTS.find(x => x.productId === p.productId)?.estimatePrice || 0) * p.amount,
      payMoney: (PRODUCTS.find(x => x.productId === p.productId)?.estimatePrice || 0) * p.amount,
    })),
    orderType: pickupType || 'self_pickup',
    remark: remark || '',
  }

  ORDERS.set(orderId, order)

  return ok({
    orderId: Number(orderId),
    orderIdStr: orderId,
    payOrderUrl: `weixin://wxpay/bizpayurl?pr=heytea_mock_${orderId}`,
    payOrderQrCodeUrl: `https://pay.heytea.com/qrcode?token=mock_${orderId}`,
    discountPrice: preview.data.discountPrice,
    needPay: true,
    tradeNo: null,
    description: null,
  })
}

function handleQueryOrderDetail({ orderId }) {
  const order = ORDERS.get(orderId)
  if (!order) throw new Error(`订单 ${orderId} 不存在`)
  return ok(JSON.parse(JSON.stringify(order)))
}

function handleCancelOrder({ orderId, cancelReason }) {
  const order = ORDERS.get(orderId)
  if (!order) throw new Error(`订单 ${orderId} 不存在`)

  const needReview = order.orderStatus >= 30 // 制作中及以上需审核
  if (needReview) {
    return ok({
      success: false,
      refundAmount: 0,
      needReview: true,
      message: '订单正在制作中，取消需门店审核，预计15分钟内反馈',
    })
  }

  order.orderStatus = 100
  order.orderStatusName = '已取消'

  return ok({
    success: true,
    refundAmount: order.orderPayAmount,
    needReview: false,
    message: '订单已取消，退款将在1-3个工作日内原路返回',
  })
}

// ─── 初始化：注册 Mock Handler ───
registerMockHandler(mockHandler)

// ─── 导出数据供 UI 直接使用 ───
export { STORES, PRODUCTS, ORDERS }
export function getAllStores() { return [...STORES] }
export function getAllProducts() { return PRODUCTS.map(p => ({ ...p })) }
export function getProductCategories() {
  const cats = new Set(PRODUCTS.map(p => p.category))
  return [...cats]
}
export function getOrderById(id) {
  const o = ORDERS.get(id)
  return o ? { ...o } : null
}
export function getAllOrders() {
  return [...ORDERS.values()].map(o => ({ ...o }))
}
