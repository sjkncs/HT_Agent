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
    { attributeId: 305, attributeName: '红薏', selected: null, price: 2, canSelected: 1 },
    { attributeId: 306, attributeName: '芦荟', selected: null, price: 2, canSelected: 1 },
    { attributeId: 307, attributeName: '奇亚籽冻', selected: null, price: 2, canSelected: 1 },
    { attributeId: 308, attributeName: '红柚果粒', selected: null, price: 2, canSelected: 1 },
    { attributeId: 309, attributeName: '0脂肪波波', selected: null, price: 2, canSelected: 1 },
    { attributeId: 310, attributeName: '白柚果粒', selected: null, price: 2, canSelected: 1 },
    { attributeId: 311, attributeName: '苦味云顶', selected: null, price: 6, canSelected: 1 },
    { attributeId: 312, attributeName: '苦巧云顶', selected: null, price: 6, canSelected: 1 },
    { attributeId: 313, attributeName: '首创芝芝云顶', selected: null, price: 5, canSelected: 1 },
    { attributeId: 314, attributeName: '轻芝云顶', selected: null, price: 3, canSelected: 1 },
    { attributeId: 315, attributeName: '慢熬黑糖波波', selected: null, price: 1, canSelected: 1 },
    { attributeId: 316, attributeName: '椰香糯米饭', selected: null, price: 3, canSelected: 1 },
    { attributeId: 317, attributeName: '西米', selected: null, price: 1, canSelected: 1 },
    { attributeId: 318, attributeName: '弹弹冻', selected: null, price: 1, canSelected: 1 },
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

// 芒椰糯米饭 — 专属甜度（真冰糖/0卡糖/低GI）
const SWEETENER_MANGO_ATTR = {
  attributeId: 10,
  attributeName: '甜度',
  multiSelect: false,
  productSubAttrs: [
    { attributeId: 1001, attributeName: '纯料真冰糖', selected: null, price: 0, canSelected: 1 },
    { attributeId: 1002, attributeName: '真0卡糖(免费)', selected: null, price: 0, canSelected: 1 },
    { attributeId: 1003, attributeName: '低GI [L-阿拉伯糖]', selected: null, price: 2, canSelected: 1 },
  ],
}

// 芒椰糯米饭 — 冰沙冰量
const ICE_SMOOTHIE_ATTR = {
  attributeId: 11,
  attributeName: '冰量',
  multiSelect: false,
  productSubAttrs: [
    { attributeId: 1101, attributeName: '推荐', selected: null, price: 0, canSelected: 1 },
    { attributeId: 1102, attributeName: '少冰', selected: null, price: 0, canSelected: 1 },
    { attributeId: 1103, attributeName: '少少冰', selected: null, price: 0, canSelected: 1 },
  ],
}

// 热饮 — 专属甜度（少甜推荐系列）
const HOT_SWEETNESS_ATTR = {
  attributeId: 12,
  attributeName: '甜度',
  multiSelect: false,
  productSubAttrs: [
    { attributeId: 1201, attributeName: '少甜(推荐)', selected: null, price: 0, canSelected: 1 },
    { attributeId: 1202, attributeName: '少少甜', selected: null, price: 0, canSelected: 1 },
    { attributeId: 1203, attributeName: '少少少甜', selected: null, price: 0, canSelected: 1 },
    { attributeId: 1204, attributeName: '不另外加糖(不推荐)', selected: null, price: 0, canSelected: 1 },
  ],
}

// 芒椰糯米饭 — 芒果加料
const MANGO_TOPPING_ATTR = {
  attributeId: 13,
  attributeName: '加料',
  multiSelect: true,
  productSubAttrs: [
    { attributeId: 1301, attributeName: '加倍芒果果肉', selected: null, price: 2, canSelected: 1 },
  ],
}

// 芒椰糯米饭 — 做法（粽叶）
const PREP_METHOD_ATTR = {
  attributeId: 14,
  attributeName: '做法',
  multiSelect: false,
  productSubAttrs: [
    { attributeId: 1401, attributeName: '标准(含粽叶)', selected: null, price: 0, canSelected: 1 },
    { attributeId: 1402, attributeName: '去粽叶', selected: null, price: 0, canSelected: 1 },
  ],
}

// 绿色喜茶 — 环保吸管
const ECO_STRAW_ATTR = {
  attributeId: 15,
  attributeName: '绿色喜茶',
  multiSelect: false,
  productSubAttrs: [
    { attributeId: 1501, attributeName: '可降解吸管', selected: null, price: 0, canSelected: 1 },
    { attributeId: 1502, attributeName: '不使用吸管', selected: null, price: 0, canSelected: 1 },
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

// 芒椰糯米饭 — 5维产品专属定制
function buildMangoAttrs() {
  const clone = (attr) => ({ ...attr, productSubAttrs: attr.productSubAttrs.map(a => ({ ...a })) })
  return [
    clone(SWEETENER_MANGO_ATTR),
    clone(ICE_SMOOTHIE_ATTR),
    clone(MANGO_TOPPING_ATTR),
    clone(PREP_METHOD_ATTR),
    clone(ECO_STRAW_ATTR),
  ]
}

// 热饮推荐系列 — 热饮甜度 + 热饮冰量
function buildHotDrinkAttrs() {
  const clone = (attr) => ({ ...attr, productSubAttrs: attr.productSubAttrs.map(a => ({ ...a })) })
  return [
    clone(HOT_SWEETNESS_ATTR),
    clone(HOT_ICE_ATTR),
  ]
}

// ─── 商品数据 ───
// ─── 产品数据（来源：饮品名称.docx 官方菜单）───
const PRODUCTS = [
  {
    productId: 2001, productName: '多肉葡萄', skuCode: 'HT-2001',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '葡萄搭配清新茶底',
    ingredients: ["葡萄"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约29g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: ["首创"], initialPrice: 29, estimatePrice: 29,
  },
  {
    productId: 2002, productName: '清爽芭乐提(红芭乐)', skuCode: 'HT-2002',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '芭乐搭配清新茶底',
    ingredients: ["芭乐"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2003, productName: '清爽芭乐提', skuCode: 'HT-2003',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '芭乐搭配清新茶底',
    ingredients: ["芭乐"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2004, productName: '清爽芭乐葡(红芭乐)', skuCode: 'HT-2004',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '芭乐搭配清新茶底',
    ingredients: ["芭乐"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2005, productName: '清爽芭乐葡', skuCode: 'HT-2005',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '芭乐搭配清新茶底',
    ingredients: ["芭乐"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2006, productName: '芒芒甘露', skuCode: 'HT-2006',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '芒果搭配茶底与特色小料',
    ingredients: ["芒果"],
    allergens: ["芒果"],
    nutritionInfo: { calories: '约260kcal', sugar: '约31g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: ["首创"], initialPrice: 31, estimatePrice: 31,
  },
  {
    productId: 2007, productName: '超多肉芒芒甘露', skuCode: 'HT-2007',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '芒果搭配茶底与特色小料',
    ingredients: ["芒果"],
    allergens: ["芒果"],
    nutritionInfo: { calories: '约260kcal', sugar: '约29g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 29, estimatePrice: 29,
  },
  {
    productId: 2008, productName: '多肉芒芒', skuCode: 'HT-2008',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '芒果搭配清新茶底',
    ingredients: ["芒果"],
    allergens: ["芒果"],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2009, productName: '椰椰芒芒', skuCode: 'HT-2009',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '芒果+椰子搭配清新茶底',
    ingredients: ["芒果", "椰子"],
    allergens: ["芒果", "椰子"],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2010, productName: '多肉桃李', skuCode: 'HT-2010',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '桃李搭配清新茶底',
    ingredients: ["桃李"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约29g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: ["首创"], initialPrice: 29, estimatePrice: 29,
  },
  {
    productId: 2011, productName: '爆汁杨梅', skuCode: 'HT-2011',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '杨梅搭配清新茶底',
    ingredients: ["杨梅"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2012, productName: '轻芝杨梅', skuCode: 'HT-2012',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '杨梅搭配浓郁芝士奶盖',
    ingredients: ["杨梅"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约320kcal', sugar: '约29g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 29, estimatePrice: 29,
  },
  {
    productId: 2013, productName: '满杯红柚', skuCode: 'HT-2013',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '红柚搭配清新茶底',
    ingredients: ["红柚"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约29g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: ["首创"], initialPrice: 29, estimatePrice: 29,
  },
  {
    productId: 2014, productName: '多肉青提', skuCode: 'HT-2014',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '青提搭配清新茶底',
    ingredients: ["青提"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2015, productName: '喜柿多多', skuCode: 'HT-2015',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '柿子搭配清新茶底',
    ingredients: ["柿子"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2016, productName: '网纹瓜瓜冰浆', skuCode: 'HT-2016',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '哈密瓜搭配清新茶底',
    ingredients: ["哈密瓜"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2017, productName: '奇香黄皮桃', skuCode: 'HT-2017',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '黄皮桃搭配清新茶底',
    ingredients: ["黄皮桃"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2018, productName: '木姜子滇木瓜', skuCode: 'HT-2018',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '木瓜搭配清新茶底',
    ingredients: ["木瓜"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2019, productName: '奇兰苹果杏', skuCode: 'HT-2019',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '苹果杏搭配清新茶底',
    ingredients: ["苹果杏"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2020, productName: '奇兰苹果杏特调', skuCode: 'HT-2020',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '苹果杏搭配清新茶底',
    ingredients: ["苹果杏"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2021, productName: '奇兰粉芭乐', skuCode: 'HT-2021',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '芭乐搭配清新茶底',
    ingredients: ["芭乐"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2022, productName: '奇兰红颜莓莓', skuCode: 'HT-2022',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '草莓搭配清新茶底',
    ingredients: ["草莓"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2023, productName: '奇兰芭乐莲雾', skuCode: 'HT-2023',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '芭乐+莲雾搭配清新茶底',
    ingredients: ["芭乐", "莲雾"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2024, productName: '雪毫茉王芭乐', skuCode: 'HT-2024',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '芭乐搭配清新茶底',
    ingredients: ["芭乐"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2025, productName: '南姜甘草芭乐瓶', skuCode: 'HT-2025',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '芭乐搭配清新茶底',
    ingredients: ["芭乐"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2026, productName: '青提柠打茶', skuCode: 'HT-2026',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '青提搭配清新茶底',
    ingredients: ["青提"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2027, productName: '椰山龙眼冰', skuCode: 'HT-2027',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '龙眼搭配清新茶底',
    ingredients: ["龙眼"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约27g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2028, productName: '芒椰糯米饭', skuCode: 'HT-2028',
    pictureUrl: '', category: '灵感茶点',
    description: '端午限定回归·每日现切当季云南鲜芒，现蒸椰香泰国籼糯米，搭配现打芒果冰沙，0咖啡因',
    ingredients: ["芒果", "椰子", "糯米"],
    allergens: ["芒果", "椰子", "乳制品"],
    nutritionInfo: { calories: '约260kcal', sugar: '约28g', caffeine: '0mg' },
    productAttrs: buildMangoAttrs(), tags: ["回归", "0咖啡因", "不含茶", "热销"], initialPrice: 29, estimatePrice: 29,
  },
  {
    productId: 2029, productName: '酷黑莓桑', skuCode: 'HT-2029',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '桑葚搭配清新茶底',
    ingredients: ["桑葚"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约29g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: ["首创"], initialPrice: 29, estimatePrice: 29,
  },
  {
    productId: 2030, productName: '轻芝多肉葡萄', skuCode: 'HT-2030',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '葡萄搭配浓郁芝士奶盖',
    ingredients: ["葡萄"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约320kcal', sugar: '约31g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: ["首创"], initialPrice: 31, estimatePrice: 31,
  },
  {
    productId: 2031, productName: '芝芝多肉葡萄', skuCode: 'HT-2031',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '葡萄搭配浓郁芝士奶盖',
    ingredients: ["葡萄"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约320kcal', sugar: '约31g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: ["首创"], initialPrice: 31, estimatePrice: 31,
  },
  {
    productId: 2032, productName: '芝芝抹茶', skuCode: 'HT-2032',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '五配方·首创芝芝云顶+源牧3.8牛乳+纯粹真冰糖+抹茶茶汤+混合厚乳',
    ingredients: ["首创芝芝云顶", "源牧3.8牛乳", "纯粹真冰糖", "抹茶茶汤", "混合厚乳"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约240kcal', sugar: '约31g', caffeine: '约35mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 31, estimatePrice: 31,
  },
  {
    productId: 2033, productName: '芝芝绿妍茶后', skuCode: 'HT-2033',
    pictureUrl: '', category: '茶特调/茗茶',
    description: '绿茶搭配浓郁芝士奶盖',
    ingredients: ["绿茶"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约220kcal', sugar: '约33g', caffeine: '约0mg' },
    productAttrs: buildAttrs(), tags: ["首创"], initialPrice: 33, estimatePrice: 33,
  },
  {
    productId: 2034, productName: '芝士咸酪藏茶', skuCode: 'HT-2034',
    pictureUrl: '', category: '茶特调/茗茶',
    description: '藏茶搭配浓郁芝士奶盖',
    ingredients: ["藏茶"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约220kcal', sugar: '约31g', caffeine: '约0mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 31, estimatePrice: 31,
  },
  {
    productId: 2035, productName: '烤黑糖波波牛乳茶', skuCode: 'HT-2035',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '六配方·源牧3.8牛乳+嫣红茶汤+黑糖波波+首创芝芝云顶+混合厚乳+熬制黑糖液',
    ingredients: ["源牧3.8牛乳", "嫣红茶汤", "黑糖波波", "首创芝芝云顶", "混合厚乳", "熬制黑糖液"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约300kcal', sugar: '约25g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 2036, productName: '烤黑糖波波牛乳', skuCode: 'HT-2036',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '首创·四配方·首创芝芝云顶+熬制黑糖液+冷藏真牛乳+黑糖波波',
    ingredients: ["首创芝芝云顶", "熬制黑糖液", "冷藏真牛乳", "黑糖波波"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约260kcal', sugar: '约27g', caffeine: '约0mg' },
    productAttrs: buildAttrs(), tags: ["首创"], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2037, productName: '黑糖波波牛乳茶', skuCode: 'HT-2037',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典牛乳茶',
    ingredients: ["黑糖波波"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约25g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 2038, productName: '黑糖波波真牛乳', skuCode: 'HT-2038',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典牛乳茶',
    ingredients: ["黑糖波波"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约25g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 2039, productName: '水牛乳双拼波波', skuCode: 'HT-2039',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典牛乳茶',
    ingredients: ["波波"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约25g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 2040, productName: '水牛乳双拼抹茶', skuCode: 'HT-2040',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典牛乳茶',
    ingredients: ["抹茶"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约25g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 2041, productName: '嫣红牛乳茶', skuCode: 'HT-2041',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '四配方·源牧3.8牛乳+纯粹真冰糖+嫣红茶汤+混合厚乳，经典嫣红牛乳茶，茶香馥郁，奶香浓郁',
    ingredients: ["源牧3.8牛乳", "纯粹真冰糖", "嫣红茶汤", "混合厚乳"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约255kcal', sugar: '约22g', caffeine: '约40mg', protein: '9.5g', transFat: '0g', carbs: '22g', fat: '14.5g', teaPolyphenols: '250mg' },
    productAttrs: buildAttrs(), tags: ["含乳制品", "含茶", "四配方"], initialPrice: 22, estimatePrice: 22,
  },
  {
    productId: 2042, productName: '碎银子牛乳茶', skuCode: 'HT-2042',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '四配方·首创芝芝云顶+源牧3.8牛乳+纯粹真冰糖+碎银子普洱茶汤，原叶普洱拼配云南糯米香叶，醇与糯',
    ingredients: ["首创芝芝云顶", "源牧3.8牛乳", "纯粹真冰糖", "碎银子普洱茶汤"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约255kcal', sugar: '约25g', caffeine: '116.5mg', protein: '6.7g', transFat: '0g', carbs: '18.5g', fat: '17g' },
    productAttrs: buildAttrs(), tags: ["含乳制品", "含茶", "四配方"], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 2043, productName: '芋圆牛乳茶', skuCode: 'HT-2043',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典牛乳茶',
    ingredients: ["芋圆"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约25g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 2044, productName: '雪域·牦牛乳恰安莫', skuCode: 'HT-2044',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典牛乳茶',
    ingredients: ["牦牛乳"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约100kcal', sugar: '约22g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 22, estimatePrice: 22,
  },
  {
    productId: 2045, productName: '爆芋泥波波牛乳茶', skuCode: 'HT-2045',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典牛乳茶',
    ingredients: ["芋泥", "波波"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约25g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 2046, productName: '爆芋泥波波牛乳', skuCode: 'HT-2046',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典牛乳茶',
    ingredients: ["芋泥", "波波"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约25g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 2047, productName: '布蕾奶茶波波冰', skuCode: 'HT-2047',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典牛乳茶',
    ingredients: ["布蕾", "波波"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约25g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 2048, productName: '酱香白脱碎银子', skuCode: 'HT-2048',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典牛乳茶',
    ingredients: ["碎银子"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约25g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 2049, productName: '牛肝菌碎银子特调', skuCode: 'HT-2049',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典牛乳茶',
    ingredients: ["碎银子"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约25g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 2050, productName: '去火*纤体瓶', skuCode: 'HT-2050',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '去火搭配清新茶底',
    ingredients: ["去火"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约26g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: ["首创"], initialPrice: 26, estimatePrice: 26,
  },
  {
    productId: 2051, productName: '羽衣纤体瓶', skuCode: 'HT-2051',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '首创·六配方·奇亚籽+青提汁+纯粹真冰糖+绿妍茶汤+鲜榨果蔬汁+100%柠檬汁',
    ingredients: ["奇亚籽", "青提汁", "纯粹真冰糖", "绿妍茶汤", "鲜榨果蔬汁", "100%柠檬汁"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约26g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: ["首创"], initialPrice: 26, estimatePrice: 26,
  },
  {
    productId: 2052, productName: '去油纤体瓶', skuCode: 'HT-2052',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '去油搭配清新茶底',
    ingredients: ["去油"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约24g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 24, estimatePrice: 24,
  },
  {
    productId: 2053, productName: '马黛活力纤体冰', skuCode: 'HT-2053',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '马黛搭配清新茶底',
    ingredients: ["马黛"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约26g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: ["首创"], initialPrice: 26, estimatePrice: 26,
  },
  {
    productId: 2054, productName: '能量纤体瓶', skuCode: 'HT-2054',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '能量搭配清新茶底',
    ingredients: ["能量"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约24g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 24, estimatePrice: 24,
  },
  {
    productId: 2055, productName: '苦瓜纤体轻柠茶', skuCode: 'HT-2055',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '苦瓜搭配清新茶底',
    ingredients: ["苦瓜"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约24g', caffeine: '约25mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 24, estimatePrice: 24,
  },
  {
    productId: 2056, productName: '减脂小奶茉', skuCode: 'HT-2056',
    pictureUrl: '', category: '咖啡/经典/小料',
    description: '经典轻饮',
    ingredients: ["茉莉"],
    allergens: [],
    nutritionInfo: { calories: '约100kcal', sugar: '约16g', caffeine: '约0mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 16, estimatePrice: 16,
  },
  {
    productId: 2057, productName: '三倍厚抹', skuCode: 'HT-2057',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '七配方·苦抹云顶+源牧3.8牛乳+定制轻乳+纯粹真冰糖+抹茶茶汤+手打浓抹糯糯+定制抹茶冻',
    ingredients: ["苦抹云顶", "源牧3.8牛乳", "定制轻乳", "纯粹真冰糖", "抹茶茶汤", "手打浓抹糯糯", "定制抹茶冻"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约260kcal', sugar: '约22g', caffeine: '约35mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 22, estimatePrice: 22,
  },
  {
    productId: 2058, productName: '咸酪厚抹', skuCode: 'HT-2058',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '五配方·首创芝芝云顶+源牧3.8牛乳+纯粹真冰糖+抹茶茶汤+混合厚乳，浓抹分层搭配青芝士风味奶底',
    ingredients: ["首创芝芝云顶", "源牧3.8牛乳", "纯粹真冰糖", "抹茶茶汤", "混合厚乳"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约355kcal', sugar: '约24g', caffeine: '约35mg', protein: '10.6g', transFat: '0g', carbs: '32.5g', fat: '20.5g', teaPolyphenols: '1235mg' },
    productAttrs: buildAttrs(), tags: ["含乳制品", "含茶", "五配方"], initialPrice: 24, estimatePrice: 24,
  },
  {
    productId: 2059, productName: '抹茶波波冰', skuCode: 'HT-2059',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典抹茶',
    ingredients: ["抹茶", "波波"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约24g', caffeine: '约35mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 24, estimatePrice: 24,
  },
  {
    productId: 2060, productName: '烤布蕾抹茶冰', skuCode: 'HT-2060',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典抹茶',
    ingredients: ["抹茶", "布蕾"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约24g', caffeine: '约35mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 24, estimatePrice: 24,
  },
  {
    productId: 2061, productName: '茶坊苦抹·浓', skuCode: 'HT-2061',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典抹茶',
    ingredients: ["抹茶"],
    allergens: [],
    nutritionInfo: { calories: '约100kcal', sugar: '约22g', caffeine: '约35mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 22, estimatePrice: 22,
  },
  {
    productId: 2062, productName: '茶坊苦抹·清', skuCode: 'HT-2062',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典抹茶',
    ingredients: ["抹茶"],
    allergens: [],
    nutritionInfo: { calories: '约100kcal', sugar: '约22g', caffeine: '约35mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 22, estimatePrice: 22,
  },
  {
    productId: 2063, productName: '开心厚抹', skuCode: 'HT-2063',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典抹茶',
    ingredients: ["抹茶"],
    allergens: [],
    nutritionInfo: { calories: '约100kcal', sugar: '约22g', caffeine: '约35mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 22, estimatePrice: 22,
  },
  {
    productId: 2064, productName: '抹云小奶茉', skuCode: 'HT-2064',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典抹茶',
    ingredients: ["抹茶", "茉莉"],
    allergens: [],
    nutritionInfo: { calories: '约100kcal', sugar: '约22g', caffeine: '约35mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 22, estimatePrice: 22,
  },
  {
    productId: 2065, productName: '小奶茉(超大杯)', skuCode: 'HT-2065',
    pictureUrl: '', category: '咖啡/经典/小料',
    description: '经典茶饮',
    ingredients: ["茉莉"],
    allergens: [],
    nutritionInfo: { calories: '约100kcal', sugar: '约19g', caffeine: '约50mg' },
    productAttrs: buildAttrs(), tags: ["超大杯"], initialPrice: 19, estimatePrice: 19,
  },
  {
    productId: 2066, productName: '小奶茉', skuCode: 'HT-2066',
    pictureUrl: '', category: '咖啡/经典/小料',
    description: '经典茶饮',
    ingredients: ["茉莉"],
    allergens: [],
    nutritionInfo: { calories: '约100kcal', sugar: '约16g', caffeine: '约50mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 16, estimatePrice: 16,
  },
  {
    productId: 2067, productName: '开心小奶茉', skuCode: 'HT-2067',
    pictureUrl: '', category: '咖啡/经典/小料',
    description: '经典茶饮',
    ingredients: ["茉莉"],
    allergens: [],
    nutritionInfo: { calories: '约100kcal', sugar: '约16g', caffeine: '约50mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 16, estimatePrice: 16,
  },
  {
    productId: 2068, productName: '纯绿妍茶后', skuCode: 'HT-2068',
    pictureUrl: '', category: '茶特调/茗茶',
    description: '经典纯茶',
    ingredients: ["绿茶"],
    allergens: [],
    nutritionInfo: { calories: '约100kcal', sugar: '约12g', caffeine: '约50mg' },
    productAttrs: buildAttrs(true), tags: [], initialPrice: 12, estimatePrice: 12,
  },
  {
    productId: 2069, productName: '绿妍轻柠茶(超大杯)', skuCode: 'HT-2069',
    pictureUrl: '', category: '咖啡/经典/小料',
    description: '绿茶+柠檬搭配清新茶底',
    ingredients: ["绿茶", "柠檬"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约21g', caffeine: '约50mg' },
    productAttrs: buildAttrs(), tags: ["超大杯"], initialPrice: 21, estimatePrice: 21,
  },
  {
    productId: 2070, productName: '鸭喜香轻柠茶(超大杯)', skuCode: 'HT-2070',
    pictureUrl: '', category: '咖啡/经典/小料',
    description: '鸭屎香+柠檬搭配清新茶底',
    ingredients: ["鸭屎香", "柠檬"],
    allergens: [],
    nutritionInfo: { calories: '约200kcal', sugar: '约21g', caffeine: '约50mg' },
    productAttrs: buildAttrs(), tags: ["超大杯"], initialPrice: 21, estimatePrice: 21,
  },
  {
    productId: 2071, productName: '碎银子糯糯', skuCode: 'HT-2071',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典糯糯',
    ingredients: ["碎银子", "糯米"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约27g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2072, productName: '咸酪碎银子', skuCode: 'HT-2072',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典糯糯',
    ingredients: ["碎银子"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约27g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2073, productName: '碎银子黑糖波波', skuCode: 'HT-2073',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典糯糯',
    ingredients: ["碎银子", "波波"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约27g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2074, productName: '英红·芝士糯糯', skuCode: 'HT-2074',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '英红+糯米搭配浓郁芝士奶盖',
    ingredients: ["英红", "糯米"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约280kcal', sugar: '约29g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 29, estimatePrice: 29,
  },
  {
    productId: 2075, productName: '龙井·芝士糯糯', skuCode: 'HT-2075',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '龙井+糯米搭配浓郁芝士奶盖',
    ingredients: ["龙井", "糯米"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约280kcal', sugar: '约29g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 29, estimatePrice: 29,
  },
  {
    productId: 2076, productName: '英红糯糯', skuCode: 'HT-2076',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典糯糯',
    ingredients: ["英红", "糯米"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约27g', caffeine: '约40mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 27, estimatePrice: 27,
  },
  {
    productId: 2077, productName: '苦巧·咸酪碎银子', skuCode: 'HT-2077',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '七配方·苦巧云朵云顶+浓醇可可液+可可酱+混合咸酪厚乳+碎银子普洱茶汤+源牧3.8牛乳+纯粹真冰糖',
    ingredients: ["苦巧云朵云顶", "浓醇可可液", "可可酱", "混合咸酪厚乳", "碎银子普洱茶汤", "源牧3.8牛乳", "纯粹真冰糖"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约280kcal', sugar: '约28g', caffeine: '约30mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 28, estimatePrice: 28,
  },
  {
    productId: 2078, productName: '苦巧·咸酪(不含茶)', skuCode: 'HT-2078',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '六配方·苦巧云顶+可可酱+混合咸酪厚乳+浓醇可可液+源牧3.8牛乳+纯粹真冰糖',
    ingredients: ["苦巧云顶", "可可酱", "混合咸酪厚乳", "浓醇可可液", "源牧3.8牛乳", "纯粹真冰糖"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约260kcal', sugar: '约26g', caffeine: '约0mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 26, estimatePrice: 26,
  },
  {
    productId: 2079, productName: '苦巧·咸酪', skuCode: 'HT-2079',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典巧克力',
    ingredients: ["巧克力"],
    allergens: [],
    nutritionInfo: { calories: '约100kcal', sugar: '约26g', caffeine: '约0mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 26, estimatePrice: 26,
  },
  {
    productId: 2080, productName: '提拉米苏·浓巧', skuCode: 'HT-2080',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典巧克力',
    ingredients: ["提拉米苏", "巧克力"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约28g', caffeine: '约0mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 28, estimatePrice: 28,
  },
  {
    productId: 2081, productName: '提拉米苏·英红', skuCode: 'HT-2081',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典巧克力',
    ingredients: ["提拉米苏", "英红"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约28g', caffeine: '约0mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 28, estimatePrice: 28,
  },
  {
    productId: 2082, productName: '空气马斯卡彭·英红', skuCode: 'HT-2082',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '经典巧克力',
    ingredients: ["马斯卡彭"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约28g', caffeine: '约0mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 28, estimatePrice: 28,
  },
  {
    productId: 2083, productName: '烤布蕾油切乌龙冰', skuCode: 'HT-2083',
    pictureUrl: '', category: '茶特调/茗茶',
    description: '经典冰饮',
    ingredients: ["布蕾", "乌龙"],
    allergens: [],
    nutritionInfo: { calories: '约160kcal', sugar: '约28g', caffeine: '约0mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 28, estimatePrice: 28,
  },
  {
    productId: 2084, productName: '咸酪泰奶冰', skuCode: 'HT-2084',
    pictureUrl: '', category: '茶特调/茗茶',
    description: '泰奶搭配浓郁芝士奶盖',
    ingredients: ["泰奶"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约220kcal', sugar: '约28g', caffeine: '约0mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 28, estimatePrice: 28,
  },
  {
    productId: 2085, productName: '流心奶黄波波冰', skuCode: 'HT-2085',
    pictureUrl: '', category: '茶特调/茗茶',
    description: '经典冰饮',
    ingredients: ["奶黄", "波波"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约160kcal', sugar: '约28g', caffeine: '约0mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 28, estimatePrice: 28,
  },
  {
    productId: 2086, productName: '牦牛乳酥油茶', skuCode: 'HT-2086',
    pictureUrl: '', category: '茶特调/茗茶',
    description: '经典特调',
    ingredients: ["牦牛乳", "酥油"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约100kcal', sugar: '约28g', caffeine: '约0mg' },
    productAttrs: buildAttrs(), tags: [], initialPrice: 28, estimatePrice: 28,
  },
  // ─── 热饮推荐系列（来源：喜茶小程序热饮专区）───
  {
    productId: 2087, productName: '热三倍厚抹', skuCode: 'HT-2087',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '音抹云顶+千目抹茶+手打浓抹榛糖+3.8牛乳，浓郁三重奏',
    ingredients: ["抹茶", "牛乳"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约280kcal', sugar: '约22g', caffeine: '红灯' },
    productAttrs: buildHotDrinkAttrs(), tags: ["热销", "含乳制品", "含茶"], initialPrice: 19, estimatePrice: 19,
  },
  {
    productId: 2088, productName: '热小奶茉', skuCode: 'HT-2088',
    pictureUrl: '', category: '咖啡/经典/小料',
    description: '无香精绿妍茶汤+源牧3.8牛乳，馥郁白茉香',
    ingredients: ["茉莉", "牛乳"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约180kcal', sugar: '约15g', caffeine: '黄灯' },
    productAttrs: buildHotDrinkAttrs(), tags: ["热销", "含乳制品", "含茶"], initialPrice: 13, estimatePrice: 13,
  },
  {
    productId: 2089, productName: '热芝芝抹茶', skuCode: 'HT-2089',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '千目抹茶+无奶精芝芝云顶，喜茶经典复刻，口感细腻，抹茶醇厚',
    ingredients: ["抹茶"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约260kcal', sugar: '约18g', caffeine: '黄灯' },
    productAttrs: buildHotDrinkAttrs(), tags: ["热销", "含乳制品", "含茶"], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 2090, productName: '热烤黑糖波波牛乳', skuCode: 'HT-2090',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '冷萃真牛乳+慢熬黑糖波波，2012年青创，口感浓郁香甜',
    ingredients: ["牛乳", "黑糖", "波波"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约300kcal', sugar: '约25g', caffeine: '0mg' },
    productAttrs: buildHotDrinkAttrs(), tags: ["首创", "热销", "含乳制品", "不含茶"], initialPrice: 19, estimatePrice: 19,
  },
  {
    productId: 2091, productName: '热苦巧·咸酪碎银子', skuCode: 'HT-2091',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '98%高浓度真可可+碎银子茶汤+特调咸奶，源于喜茶茶坊',
    ingredients: ["可可", "碎银子"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约250kcal', sugar: '约20g', caffeine: '灯' },
    productAttrs: buildHotDrinkAttrs(), tags: ["热销", "含乳制品", "含茶"], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 2092, productName: '热苦巧·咸酪(不含茶)', skuCode: 'HT-2092',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '98%高浓度真可可+特调咸奶，源于喜茶茶坊',
    ingredients: ["可可"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约240kcal', sugar: '约18g', caffeine: '灯' },
    productAttrs: buildHotDrinkAttrs(), tags: ["热销", "含乳制品"], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 2093, productName: '热咸醋碎银子', skuCode: 'HT-2093',
    pictureUrl: '', category: '茶特调/茗茶',
    description: '咸醋芝士+糖香碎银子茶汤，一杯「咸口」的碎银子，喝前请摇匀',
    ingredients: ["碎银子"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约200kcal', sugar: '约16g', caffeine: '约30mg' },
    productAttrs: buildHotDrinkAttrs(), tags: ["热销", "含乳制品", "含茶"], initialPrice: 22, estimatePrice: 22,
  },
  {
    productId: 2094, productName: '热烤黑糖波波牛乳茶', skuCode: 'HT-2094',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '六配方·源牧3.8牛乳+嫣红茶汤+黑糖波波+首创芝芝云顶+混合厚乳+熬制黑糖液，配方同烤黑糖波波牛乳茶，热饮版口感浓郁',
    ingredients: ["源牧3.8牛乳", "嫣红茶汤", "黑糖波波", "首创芝芝云顶", "混合厚乳", "熬制黑糖液"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约410kcal', sugar: '约50.5g', caffeine: '约40mg', protein: '8.5g', fat: '19g', transFat: '0g', teaPolyphenols: '237mg' },
    productAttrs: buildHotDrinkAttrs(), tags: ["热销", "含乳制品", "含茶", "六配方"], initialPrice: 19, estimatePrice: 19,
  },
  // ─── 灵感茶点·盒装系列 ───
  {
    productId: 2095, productName: '茉莉绿妍蝴蝶酥（盒装）', skuCode: 'HT-2095',
    pictureUrl: '', category: '灵感茶点',
    description: '喜茶定制茉莉绿妍，每斤超4500+朵茉莉花窨制；花香茶韵融入层层酥皮，夹杂碧根果碎；清香酥脆，整盒带走',
    ingredients: ["茉莉绿妍茶", "酥皮", "碧根果碎"],
    allergens: ["坚果", "麸质", "乳制品"],
    nutritionInfo: { calories: '约120kcal/片', sugar: '约8g/片', caffeine: '微量' },
    productAttrs: [], tags: ["0香精", "0防腐剂", "0氢化植物油"], initialPrice: 38, estimatePrice: 38,
  },
  {
    productId: 2096, productName: '千目厚抹茶酥（盒装）', skuCode: 'HT-2096',
    pictureUrl: '', category: '灵感茶点',
    description: '三倍厚抹灵感入酥，千目抹茶纯黄油打底慢烤，配腰果香，盒装10片',
    ingredients: ["千目抹茶", "黄油", "腰果"],
    allergens: ["坚果", "麸质", "乳制品"],
    nutritionInfo: { calories: '约130kcal/片', sugar: '约10g/片', caffeine: '微量' },
    productAttrs: [], tags: [], initialPrice: 38, estimatePrice: 38,
  },
  {
    productId: 2097, productName: '金凤茶酥（盒装）', skuCode: 'HT-2097',
    pictureUrl: '', category: '灵感茶点',
    description: '金凤茶王灵感焙烤成酥，盒装10片',
    ingredients: ["金凤茶王", "酥皮"],
    allergens: ["麸质", "乳制品"],
    nutritionInfo: { calories: '约110kcal/片', sugar: '约8g/片', caffeine: '微量' },
    productAttrs: [], tags: [], initialPrice: 38, estimatePrice: 38,
  },
  {
    productId: 2098, productName: '茉莉绿妍凤梨酥（盒装）', skuCode: 'HT-2098',
    pictureUrl: '', category: '灵感茶点',
    description: '徐闻菠萝制馅，0冬瓜蓉，茉莉绿妍酥皮，盒装4颗',
    ingredients: ["徐闻菠萝（凤梨）", "茉莉绿妍茶", "酥皮"],
    allergens: ["麸质", "乳制品"],
    nutritionInfo: { calories: '约150kcal/颗', sugar: '约12g/颗', caffeine: '微量' },
    productAttrs: [], tags: ["0冬瓜蓉"], initialPrice: 38, estimatePrice: 38,
  },
  {
    productId: 2099, productName: '金凤茶酥', skuCode: 'HT-2099',
    pictureUrl: '', category: '灵感茶点',
    description: '金凤乌龙茶风味桃酥，10g/枚',
    ingredients: ["金凤乌龙茶", "桃酥"],
    allergens: ["麸质", "乳制品"],
    nutritionInfo: { calories: '约55kcal/枚', sugar: '约4g/枚', caffeine: '微量' },
    productAttrs: [], tags: [], initialPrice: 5, estimatePrice: 5,
  },
  {
    productId: 2100, productName: '茉莉绿妍蝴蝶酥', skuCode: 'HT-2100',
    pictureUrl: '', category: '灵感茶点',
    description: '茉莉绿妍层层酥皮+碧根果碎，10g/枚',
    ingredients: ["茉莉绿妍茶", "酥皮", "碧根果碎"],
    allergens: ["坚果", "麸质", "乳制品"],
    nutritionInfo: { calories: '约60kcal/枚', sugar: '约4g/枚', caffeine: '微量' },
    productAttrs: [], tags: ["0香精", "0防腐剂", "0氢化植物油"], initialPrice: 5, estimatePrice: 5,
  },
  {
    productId: 2101, productName: '茉莉绿妍凤梨酥', skuCode: 'HT-2101',
    pictureUrl: '', category: '灵感茶点',
    description: '徐闻菠萝制馅，0冬瓜蓉，茉莉绿妍酥皮，38g/枚',
    ingredients: ["徐闻菠萝（凤梨）", "茉莉绿妍茶", "酥皮"],
    allergens: ["麸质", "乳制品"],
    nutritionInfo: { calories: '约150kcal/枚', sugar: '约12g/枚', caffeine: '微量' },
    productAttrs: [], tags: ["0冬瓜蓉"], initialPrice: 10, estimatePrice: 10,
  },
  // ─── 咖啡/经典 ───
  {
    productId: 2102, productName: '拿铁', skuCode: 'HT-2102',
    pictureUrl: '', category: '咖啡/经典/小料',
    description: '二配方·浓缩咖啡+源牧3.8牛乳，哥伦比亚与印尼豆中深烘焙，醇厚咖啡香搭配丝滑牛乳',
    ingredients: ["浓缩咖啡", "源牧3.8牛乳"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约180kcal', sugar: '约12g', caffeine: '约75mg' },
    productAttrs: buildAttrs(), tags: ["含乳制品", "含咖啡因"], initialPrice: 18, estimatePrice: 18,
  },
  {
    productId: 2103, productName: '美式', skuCode: 'HT-2103',
    pictureUrl: '', category: '咖啡/经典/小料',
    description: '二配方·浓缩咖啡+冰水，哥伦比亚与印尼豆中深烘焙，纯正咖啡风味',
    ingredients: ["浓缩咖啡", "冰水"],
    allergens: [],
    nutritionInfo: { calories: '约10kcal', sugar: '约0g', caffeine: '约75mg' },
    productAttrs: buildAttrs(), tags: ["含咖啡因"], initialPrice: 15, estimatePrice: 15,
  },
  // ─── 植物茶/鲜果茶 ───
  {
    productId: 2104, productName: '芝芝多肉杨梅（首创）', skuCode: 'HT-2104',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '五配方·首创芝芝云顶+杨梅汁+纯粹真冰糖+绿妍茶汤（冰沙）+现制杨梅果肉，真果自带香甜',
    ingredients: ["首创芝芝云顶", "杨梅汁", "纯粹真冰糖", "绿妍茶汤", "现制杨梅果肉"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约280kcal', sugar: '约32g', caffeine: '约15mg' },
    productAttrs: buildAttrs(), tags: ["首创", "真果", "含乳制品"], initialPrice: 28, estimatePrice: 28,
  },
  {
    productId: 2105, productName: '芝芝芒芒（首创）', skuCode: 'HT-2105',
    pictureUrl: '', category: '植物茶/鲜果茶',
    description: '五配方·首创芝芝云顶+100%芒果原浆+纯粹真冰糖+绿妍茶汤（冰沙）+现制芒果果肉，广西小台农芒果',
    ingredients: ["首创芝芝云顶", "100%芒果原浆", "纯粹真冰糖", "绿妍茶汤", "现制芒果果肉"],
    allergens: ["乳制品", "芒果"],
    nutritionInfo: { calories: '约300kcal', sugar: '约34g', caffeine: '约15mg' },
    productAttrs: buildAttrs(), tags: ["首创", "含乳制品", "含芒果"], initialPrice: 28, estimatePrice: 28,
  },
  // ─── 小料（可单独购买）───
  {
    productId: 2106, productName: '慢熬黑糖波波', skuCode: 'HT-2106',
    pictureUrl: '', category: '咖啡/经典/小料',
    description: '每日65分钟慢熬，黑糖液融入波波中，香甜浓郁，口感软糯Q弹，不同于普通珍珠',
    ingredients: ["黑糖波波"],
    allergens: [],
    nutritionInfo: { calories: '约100kcal', sugar: '约18g', caffeine: '0mg' },
    productAttrs: buildAttrs(), tags: ["小料", "可分装"], initialPrice: 1, estimatePrice: 1,
  },
  {
    productId: 2107, productName: '椰香糯米饭', skuCode: 'HT-2107',
    pictureUrl: '', category: '咖啡/经典/小料',
    description: '每日现蒸，自然米香。选用泰国进口一级籼糯米，加入椰乳手工搅拌均匀，米白鲜亮，糯香浓厚',
    ingredients: ["泰国进口籼糯米", "椰乳"],
    allergens: ["椰子"],
    nutritionInfo: { calories: '约120kcal', sugar: '约6g', caffeine: '0mg' },
    productAttrs: buildAttrs(), tags: ["小料", "可分装", "含椰子"], initialPrice: 3, estimatePrice: 3,
  },
  {
    productId: 2108, productName: '西米', skuCode: 'HT-2108',
    pictureUrl: '', category: '咖啡/经典/小料',
    description: '每日新鲜煮制，经30分钟焖煮再用冷水降温，软弹爽口',
    ingredients: ["西米"],
    allergens: [],
    nutritionInfo: { calories: '约80kcal', sugar: '约5g', caffeine: '0mg' },
    productAttrs: buildAttrs(), tags: ["小料", "可分装"], initialPrice: 1, estimatePrice: 1,
  },
  {
    productId: 2109, productName: '弹弹冻', skuCode: 'HT-2109',
    pictureUrl: '', category: '咖啡/经典/小料',
    description: '喜茶定制弹弹冻，QQ弹弹，带点小甜。贴士：弹弹冻无法添加在热饮里，比较适合添加在水果类饮品中',
    ingredients: ["弹弹冻"],
    allergens: [],
    nutritionInfo: { calories: '约60kcal', sugar: '约8g', caffeine: '0mg' },
    productAttrs: buildAttrs(), tags: ["小料", "可分装", "仅限冷饮"], initialPrice: 1, estimatePrice: 1,
  },
  // ─── 热饮系列 ───
  {
    productId: 2110, productName: '热嫣红牛乳茶', skuCode: 'HT-2110',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '四配方·源牧3.8牛乳+纯粹真冰糖+嫣红茶汤+混合厚乳，配方同嫣红牛乳茶，热饮版茶香更浓郁',
    ingredients: ["源牧3.8牛乳", "纯粹真冰糖", "嫣红茶汤", "混合厚乳"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约255kcal', sugar: '约22g', caffeine: '约40mg', protein: '9.5g', transFat: '0g', carbs: '22g', fat: '14.5g', teaPolyphenols: '250mg' },
    productAttrs: buildHotDrinkAttrs(), tags: ["热销", "含乳制品", "含茶", "四配方"], initialPrice: 15, estimatePrice: 15,
  },
  {
    productId: 2111, productName: '热碎银子牛乳茶', skuCode: 'HT-2111',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '四配方·首创芝芝云顶+源牧3.8牛乳+纯粹真冰糖+碎银子普洱茶汤，配方同碎银子牛乳茶，热饮版口感更醇厚',
    ingredients: ["首创芝芝云顶", "源牧3.8牛乳", "纯粹真冰糖", "碎银子普洱茶汤"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约255kcal', sugar: '约25g', caffeine: '116.5mg', protein: '6.7g', transFat: '0g', carbs: '18.5g', fat: '17g' },
    productAttrs: buildHotDrinkAttrs(), tags: ["热销", "含乳制品", "含茶", "四配方"], initialPrice: 25, estimatePrice: 25,
  },
  {
    productId: 2112, productName: '热咸酪厚抹', skuCode: 'HT-2112',
    pictureUrl: '', category: '苦巧/抹茶/波波茶',
    description: '五配方·首创芝芝云顶+源牧3.8牛乳+纯粹真冰糖+抹茶茶汤+混合厚乳，配方同咸酪厚抹，热饮版抹茶风味更浓',
    ingredients: ["首创芝芝云顶", "源牧3.8牛乳", "纯粹真冰糖", "抹茶茶汤", "混合厚乳"],
    allergens: ["乳制品"],
    nutritionInfo: { calories: '约355kcal', sugar: '约24g', caffeine: '约35mg', protein: '10.6g', transFat: '0g', carbs: '32.5g', fat: '20.5g', teaPolyphenols: '1235mg' },
    productAttrs: buildHotDrinkAttrs(), tags: ["热销", "含乳制品", "含茶", "五配方"], initialPrice: 24, estimatePrice: 24,
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
    { productId: 2031, skuCode: 'HT-2031-002', name: '芝芝多肉葡萄', amount: 2, additionDesc: '七分糖/少冰', brevityPicUrl: '', initPrice: 33, estimatePrice: 33, estimateTotalPrice: 66 },
  ],
  orderPayAmount: 66,
  pickupType: 'self_pickup',
  dispatchInfo: { dispatcherName: '', dispatcherMobile: '', dispatchAboutTime: '', destinationDistance: 0 },
  orderCommodityList: [{ commodityId: 2031, commodityCode: 'HT-2031', commodityName: '芝芝多肉葡萄', payableMoney: 66, payMoney: 66 }],
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
    { productId: 2011, skuCode: 'HT-2011-001', name: '爆汁杨梅', amount: 1, additionDesc: '三分糖/正常冰', brevityPicUrl: '', initPrice: 27, estimatePrice: 27, estimateTotalPrice: 27 },
    { productId: 2035, skuCode: 'HT-2035', name: '烤黑糖波波牛乳茶', amount: 1, additionDesc: '', brevityPicUrl: '', initPrice: 25, estimatePrice: 25, estimateTotalPrice: 25 },
  ],
  orderPayAmount: 52,
  pickupType: 'self_pickup',
  dispatchInfo: { dispatcherName: '', dispatcherMobile: '', dispatchAboutTime: '', destinationDistance: 0 },
  orderCommodityList: [
    { commodityId: 2011, commodityCode: 'HT-2011', commodityName: '爆汁杨梅', payableMoney: 27, payMoney: 27 },
    { commodityId: 2035, commodityCode: 'HT-2035', commodityName: '烤黑糖波波牛乳茶', payableMoney: 25, payMoney: 25 },
  ],
  orderType: 'self_pickup',
  remark: '少放冰',
})

// ─── 售罄替代品推荐 ───
function recommendSimilar(productId) {
  const soldOutProduct = PRODUCTS.find(p => p.productId === productId)
  if (!soldOutProduct) return null
  const similar = PRODUCTS.filter(p => p.category === soldOutProduct.category && !p.soldOut && p.productId !== productId)
  return similar.slice(0, 2).map(p => ({ productId: p.productId, productName: p.productName, estimatePrice: p.estimatePrice }))
}

// ─── 支付状态模拟（轮询用） ───
const _paymentState = new Map() // orderId -> { status, createdAt, pollCount }

function _initPaymentPolling(orderId) {
  _paymentState.set(String(orderId), { status: 'pending', createdAt: Date.now(), pollCount: 0 })
}

function _getPaymentStatus(orderId) {
  const state = _paymentState.get(String(orderId))
  if (!state) return { paymentStatus: 'paid', paidAmount: 29, paymentMethod: '微信支付', paidAt: Date.now() - 600000 }
  state.pollCount++
  // 模拟：第3次轮询后变为已支付（约6-9秒后）
  if (state.pollCount >= 3) {
    state.status = 'paid'
  }
  return {
    orderId: String(orderId),
    paymentStatus: state.status,
    paymentMethod: state.status === 'paid' ? '微信支付' : null,
    paidAmount: state.status === 'paid' ? 29 : null,
    paidAt: state.status === 'paid' ? Date.now() : null,
    refundStatus: null,
    pollCount: state.pollCount,
  }
}

// ─── 门店打烊时间检查 ───
function _isClosingSoon(store) {
  if (store.businessStatus === 3) return true // 已经标记为即将打烊
  if (store.businessStatus === 2) return false // 休息中
  // 动态检查：距打烊不到30分钟
  try {
    const now = new Date()
    const [h, m] = store.workTimeEnd.split(':').map(Number)
    const closing = new Date(now)
    closing.setHours(h, m, 0, 0)
    const diffMin = (closing - now) / 60000
    return diffMin > 0 && diffMin <= 30
  } catch { return false }
}

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
          { couponId: 'CP003', name: '多肉系列第二杯半价', discount: 0.5, type: 'bogo', minOrder: 2, validUntil: '2026-06-15', applicableStores: '全部门店', category: '植物茶/鲜果茶' },
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
            { orderId: '8829301847562910002', orderStatus: 80, orderStatusName: '已完成', storeName: '喜茶·深圳海岸城店', totalAmount: 62, orderTime: '2026-06-05 11:20', itemCount: 2, productNames: ['芝芝多肉葡萄', '多肉芒果'] },
            { orderId: '8829301847562910003', orderStatus: 100, orderStatusName: '已取消', storeName: '喜茶·深圳万象天地店', totalAmount: 32, orderTime: '2026-06-01 16:45', itemCount: 1, productNames: ['满杯红柚'] },
          ],
        },
        success: true,
      }
    case 'queryPaymentStatus':
      return {
        data: _getPaymentStatus(args.orderId),
        success: true,
      }
    case 'reorderFromHistory':
      return handleReorderFromHistory(args)
    default:
      throw new Error(`Unknown MCP tool: ${toolName}`)
  }
}

function ok(data) {
  return { code: 0, msg: 'success', data, success: true }
}

function handleQueryStoreList({ address, storeName, longitude, latitude }) {
  let results = [...STORES]

  // 地址关键词匹配（优先）
  if (address) {
    const keywords = _extractAddressKeywords(address)
    if (keywords.length > 0) {
      const scored = results.map(s => {
        let score = 0
        const text = (s.address || '') + (s.storeName || '')
        for (const kw of keywords) {
          if (text.includes(kw)) score += 1
        }
        return { ...s, _score: score }
      })
      scored.sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score
        return a.distance - b.distance
      })
      // 取有匹配的门店，如无匹配则取全部（兜底）
      const matched = scored.filter(s => s._score > 0)
      results = (matched.length > 0 ? matched : scored).slice(0, 5)
      results = results.map(({ _score, ...rest }) => rest)
    }
  }

  // 门店名称筛选
  if (storeName) {
    results = results.filter(s => s.storeName.includes(storeName))
  }

  // 无地址无店名时按距离排序
  if (!address && !storeName) {
    results.sort((a, b) => a.distance - b.distance)
  }

  return ok(results.map(s => ({
    ...s,
    // P1-5: 附加打烊预警信息
    closingSoon: _isClosingSoon(s),
    closingTime: s.workTimeEnd,
  })))
}

/**
 * 从地址文本提取关键词
 */
function _extractAddressKeywords(address) {
  const noise = /[市区省县镇街道号栋座楼层室路大道大街交叉口交汇处]/g
  const cleaned = address.replace(noise, ' ').replace(/\s+/g, ' ').trim()
  const keywords = []
  const parts = cleaned.split(/\s+/).filter(p => p.length >= 2)
  for (const part of parts) {
    keywords.push(part)
    if (part.length > 3) keywords.push(part.slice(0, 3))
  }
  return [...new Set(keywords)]
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
      // 泛化搜索词 → 新5大分类
      if ((q.includes('果茶') || q.includes('水果') || q.includes('鲜果')) && p.category.includes('鲜果茶')) return true
      if ((q.includes('奶盖') || q.includes('芝士') || q.includes('特调') || q.includes('纯茶') || q.includes('茗茶')) && p.category.includes('茶特调')) return true
      if ((q.includes('波波') || q.includes('抹茶') || q.includes('巧克力') || q.includes('牛乳') || q.includes('苦巧')) && p.category.includes('苦巧')) return true
      if ((q.includes('新品') || q.includes('限定')) && p.tags.some(t => t === '新品' || t === '季节限定')) return true
      if (q.includes('小食') || q.includes('蛋糕') || q.includes('点心') || q.includes('茶点')) return p.category.includes('灵感茶点')
      if (q.includes('推荐') || q.includes('热销') || q.includes('热门')) return p.tags.includes('热销')
      return false
    })
  }

  // 深拷贝避免修改原始数据，附加可售状态
  return ok(results.map(p => ({
    ...p,
    available: !p.soldOut,
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

  // P1-5: 门店打烊检查
  const closingSoon = _isClosingSoon(store)
  const storeClosed = store.businessStatus === 2

  let totalInit = 0
  let totalEstimate = 0
  const productInfoList = []
  const soldOutItems = [] // P1-3: 售罄商品收集

  for (const item of productList) {
    const product = PRODUCTS.find(p => p.productId === item.productId)
    if (!product) continue
    // P1-3: 售罄检查
    if (product.soldOut) {
      const alternatives = recommendSimilar(product.productId)
      soldOutItems.push({ productId: product.productId, name: product.productName, alternatives })
      continue // 售罄商品不加入订单
    }
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
  // P1-4: 动态制作时长 — 基础8分钟 + 每杯2分钟，上限25分钟
  const cupCount = productInfoList.reduce((sum, p) => sum + p.amount, 0)
  const baseWait = pickupType === 'delivery' ? 30 : 8
  const waitMinutes = Math.min(baseWait + cupCount * 2, 25)

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
    // P1-3/P1-4/P1-5: 新增字段
    soldOutItems: soldOutItems.length > 0 ? soldOutItems : undefined,
    closingSoon: closingSoon || undefined,
    storeClosed: storeClosed || undefined,
    storeClosingTime: store.workTimeEnd,
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
  _initPaymentPolling(orderId) // P2-1: 初始化支付轮询状态

  return ok({
    orderId: Number(orderId),
    orderIdStr: orderId,
    storeInfo: preview.data.storeInfo,
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

// P1-6: 历史订单快速复购
function handleReorderFromHistory({ orderId, storeId }) {
  const order = ORDERS.get(orderId)
  if (!order) throw new Error(`历史订单 ${orderId} 不存在`)

  // 提取商品列表
  const productList = (order.orderCommodityList || []).map(item => {
    const product = PRODUCTS.find(p => p.productId === item.commodityId)
    return {
      productId: item.commodityId,
      productName: item.commodityName,
      amount: Math.max(1, Math.round(item.payableMoney / (product?.initialPrice || 1))),
      available: product ? !product.soldOut : false,
      currentPrice: product?.estimatePrice || item.payMoney,
    }
  })

  // 检查门店是否仍然营业
  const targetStoreId = storeId || order.storeInfo?.storeId
  const store = STORES.find(s => s.storeId === targetStoreId)
  const storeAvailable = store && store.businessStatus !== 2
  const closingSoon = store ? _isClosingSoon(store) : false

  // 检查售罄商品
  const unavailableItems = productList.filter(p => !p.available)
  const availableItems = productList.filter(p => p.available)

  return ok({
    originalOrderId: orderId,
    storeInfo: store ? { storeId: store.storeId, storeName: store.storeName, address: store.address } : order.storeInfo,
    storeAvailable,
    closingSoon,
    productList: availableItems,
    unavailableItems: unavailableItems.length > 0 ? unavailableItems.map(item => ({
      ...item,
      alternatives: recommendSimilar(item.productId),
    })) : undefined,
    estimatedTotal: availableItems.reduce((sum, p) => sum + p.currentPrice * p.amount, 0),
    canReorder: availableItems.length > 0 && storeAvailable,
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
