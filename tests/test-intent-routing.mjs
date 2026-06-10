/**
 * 意图路由测试脚本
 * 
 * 测试 handleSend 的三层意图检测：
 * 1. detectOrderIntent (ordering)
 * 2. foodSafetySignals (null → 食安流程)
 * 3. 其他 → general_knowledge
 * 
 * 覆盖：吃、穿、住、行、通用知识、边界case、食安对照
 */

// ── 复制 detectOrderIntent 逻辑 ──
const ORDER_INTENT_PATTERNS = [
  { pattern: /(?:想|要|来|点|买|订)(?:一杯|一份|一个|两杯|两|个杯)/i, type: 'order', subType: 'create' },
  { pattern: /(?:帮我|给我|帮忙).*(?:点|买|订|来)(?:一杯|一份|一个|两杯)/i, type: 'order', subType: 'create' },
  { pattern: /(?:帮我|给我|帮忙|我想).*(?:点单|下单|点奶茶|点一杯|点喝的)/i, type: 'order', subType: 'create' },
  { pattern: /(?:点单|下单|来一杯|点一杯|帮我点)/i, type: 'order', subType: 'create' },
  // 浏览意图 — 需要饮品/喜茶上下文（防止"路线推荐""餐厅推荐"误匹配）
  { pattern: /(?:有什么|看看|菜单|什么好喝).*(?:喝|饮品|奶茶|茶)/i, type: 'order', subType: 'browse' },
  { pattern: /(?:有什么好喝|有什么喝的|看看菜单|推荐.*喝|喝.*推荐)/i, type: 'order', subType: 'browse' },
  { pattern: /(?:新品|限定|当季|季节).*(?:推荐|喝|饮品|上市|有什么)/i, type: 'order', subType: 'browse_new' },
  { pattern: /(?:附近|哪里).*(?:门店|喜茶|喝茶|奶茶)/i, type: 'order', subType: 'store' },
  { pattern: /(?:门店|喜茶).*(?:附近|哪里|地址|位置)/i, type: 'order', subType: 'store' },
  { pattern: /(?:查|看|我的).*(?:订单|单号|取餐)/i, type: 'query_order' },
  { pattern: /(?:订单号|取餐码).*(\d{4,})/i, type: 'query_order', subType: 'by_id' },
  { pattern: /(?:做好了吗|到哪了|等多久|排队)/i, type: 'query_order', subType: 'status' },
  { pattern: /(?:取消|退单|不要了|退款).*(?:订单|单)/i, type: 'cancel_order' },
  { pattern: /(?:取消|退).*(\d{4,})/i, type: 'cancel_order' },
  { pattern: /(?:少糖|无糖|三分糖|五分糖|七分糖|全糖)/i, type: 'customize', subType: 'sugar' },
  { pattern: /(?:少冰|去冰|正常冰)|(?:^|[,，、\s])(?:热|温)(?:$|[的了吗吧啊\s,，、])/i, type: 'customize', subType: 'ice' },
  { pattern: /(?:加|多).*(?:珍珠|椰果|芝士|芋圆|红豆|芦荟)/i, type: 'customize', subType: 'topping' },
  { pattern: /(?:大杯|中杯|杯型)/i, type: 'customize', subType: 'cup' },
]
const productKeywords = ['多肉葡萄', '多肉芒果', '芝芝莓莓', '芝芝芒芒', '芝芝桃桃', '满杯红柚', '百香芒芒', '柠檬茶', '茉莉绿茶', '四季春', '杨梅冰茶', '生椰芒芒']

function detectOrderIntent(message) {
  if (!message) return null
  for (const { pattern, type, subType } of ORDER_INTENT_PATTERNS) {
    if (pattern.test(message)) return { type, subType }
  }
  for (const kw of productKeywords) {
    if (message.includes(kw)) return { type: 'order', subType: 'specific_product', productName: kw }
  }
  return null
}

// ── 复制 handleSend 的食安信号检测 ──
const foodSafetySignals = [
  '异物', '头发', '塑料', '金属', '玻璃', '虫', '苍蝇', '蟑螂', '纸片', '线头',
  '果核', '籽', '茶渣', '果皮', '果肉', '沉淀', '纤维', '颗粒物',
  '拉肚子', '腹泻', '呕吐', '过敏', '恶心', '头晕', '发烧', '不舒服', '肚子',
  '变质', '发霉', '过期', '馊', '酸了', '异味', '怪味', '品控', '品质', '质量',
  '退款', '赔偿', '补偿', '优惠券', '投诉', '曝光', '差评',
  '包装破', '漏杯', '撒了', '封口',
  '食安', '食品安全', '卫生', '不干净',
]

function detectIntent(text) {
  const orderIntent = detectOrderIntent(text)
  if (orderIntent) return 'ordering'
  const lowerText = text.toLowerCase()
  const hasFoodSafety = foodSafetySignals.some(kw => lowerText.includes(kw))
  if (!hasFoodSafety && text.length >= 2) return 'general_knowledge'
  return 'food_safety' // null in real code = default food safety path
}

// ═══════════════════════════════════════
// 测试用例
// ═══════════════════════════════════════
const testCases = [
  // ── 吃 (非喜茶日常美食) ──
  { input: '今天中午吃什么好', expect: 'general_knowledge', category: '吃' },
  { input: '红烧肉怎么做才好吃', expect: 'general_knowledge', category: '吃' },
  { input: '附近有什么好吃的餐厅推荐', expect: 'general_knowledge', category: '吃' },
  { input: '火锅底料怎么调', expect: 'general_knowledge', category: '吃' },
  { input: '早餐吃面包好还是粥好', expect: 'general_knowledge', category: '吃' },
  { input: '西红柿炒鸡蛋先放哪个', expect: 'general_knowledge', category: '吃' },
  { input: '川菜和粤菜哪个更健康', expect: 'general_knowledge', category: '吃' },
  { input: '减肥期间吃什么好', expect: 'general_knowledge', category: '吃' },

  // ── 穿 ──
  { input: '夏天穿什么衣服凉快', expect: 'general_knowledge', category: '穿' },
  { input: '怎么搭配衣服好看', expect: 'general_knowledge', category: '穿' },
  { input: '优衣库和ZARA哪个性价比高', expect: 'general_knowledge', category: '穿' },
  { input: '面试穿什么合适', expect: 'general_knowledge', category: '穿' },
  { input: '运动鞋和帆布鞋哪个舒服', expect: 'general_knowledge', category: '穿' },

  // ── 住 ──
  { input: '租房要注意什么', expect: 'general_knowledge', category: '住' },
  { input: '小户型怎么装修显大', expect: 'general_knowledge', category: '住' },
  { input: '空调不制冷怎么办', expect: 'general_knowledge', category: '住' },
  { input: '搬家需要准备什么东西', expect: 'general_knowledge', category: '住' },
  { input: '下水道堵了怎么疏通', expect: 'general_knowledge', category: '住' },
  { input: '热水器怎么选', expect: 'general_knowledge', category: '住' },

  // ── 行 ──
  { input: '从北京到上海坐高铁要多久', expect: 'general_knowledge', category: '行' },
  { input: '地铁怎么换乘', expect: 'general_knowledge', category: '行' },
  { input: '驾照科目一怎么准备', expect: 'general_knowledge', category: '行' },
  { input: '滴滴打车怎么预约', expect: 'general_knowledge', category: '行' },
  { input: '自驾游去云南有什么路线推荐', expect: 'general_knowledge', category: '行' },
  { input: '中国地理位置最南的城市是哪个', expect: 'general_knowledge', category: '行' },

  // ── 通用知识 ──
  { input: '中国有多少个省份', expect: 'general_knowledge', category: '通用' },
  { input: '地球到月球有多远', expect: 'general_knowledge', category: '通用' },
  { input: '最近有什么好看的电影', expect: 'general_knowledge', category: '通用' },
  { input: '天气预报明天会下雨吗', expect: 'general_knowledge', category: '通用' },
  { input: '帮我写一篇作文', expect: 'general_knowledge', category: '通用' },
  { input: '数学题怎么做', expect: 'general_knowledge', category: '通用' },
  { input: '英语单词怎么背效率高', expect: 'general_knowledge', category: '通用' },
  { input: '你好', expect: 'general_knowledge', category: '通用' },
  { input: '今天天气怎么样', expect: 'general_knowledge', category: '通用' },
  { input: '周末去哪里玩比较好', expect: 'general_knowledge', category: '通用' },

  // ── 边界case（之前出过bug的） ──
  { input: '我想问中国地理', expect: 'general_knowledge', category: '边界' },
  { input: '翻译一下这句话', expect: 'general_knowledge', category: '边界' },
  { input: '想了解一下人工智能', expect: 'general_knowledge', category: '边界' },
  { input: '要怎样才能学好编程', expect: 'general_knowledge', category: '边界' },
  { input: '来一首诗', expect: 'general_knowledge', category: '边界' },
  { input: '点外卖用哪个app好', expect: 'general_knowledge', category: '边界' },

  // ── 食安对照（必须走食安通道） ──
  { input: '饮品里有异物', expect: 'food_safety', category: '食安' },
  { input: '喝了你们的茶拉肚子了', expect: 'food_safety', category: '食安' },
  { input: '饮品品控不行，那么大的葡萄籽', expect: 'food_safety', category: '食安' },
  { input: '杯子里有苍蝇', expect: 'food_safety', category: '食安' },
  { input: '奶茶变质了有异味', expect: 'food_safety', category: '食安' },
  { input: '包装破了撒了一杯', expect: 'food_safety', category: '食安' },
  { input: '要求退款', expect: 'food_safety', category: '食安' },
  { input: '你们卫生太差了', expect: 'food_safety', category: '食安' },
  { input: '喝完头晕不舒服', expect: 'food_safety', category: '食安' },

  // ── 点单对照（必须走ordering） ──
  { input: '帮我点一杯多肉葡萄', expect: 'ordering', category: '点单' },
  { input: '来一杯柠檬茶', expect: 'ordering', category: '点单' },
  { input: '推荐一下有什么好喝的', expect: 'ordering', category: '点单' },
  { input: '帮我点单', expect: 'ordering', category: '点单' },
  { input: '附近有什么喜茶门店', expect: 'ordering', category: '点单' },
  { input: '多肉葡萄', expect: 'ordering', category: '点单' },

  // ── 回归测试（修复不能破坏正常功能） ──
  { input: '去冰', expect: 'ordering', category: '回归' },
  { input: '少冰', expect: 'ordering', category: '回归' },
  { input: '正常冰', expect: 'ordering', category: '回归' },
  { input: '热', expect: 'ordering', category: '回归' },
  { input: '温的', expect: 'ordering', category: '回归' },
  { input: '有什么好喝的推荐', expect: 'ordering', category: '回归' },
  { input: '推荐喝什么', expect: 'ordering', category: '回归' },
  { input: '有什么好喝的', expect: 'ordering', category: '回归' },
  { input: '看看菜单', expect: 'ordering', category: '回归' },
]

// ═══════════════════════════════════════
// 运行测试
// ═══════════════════════════════════════
let pass = 0
let fail = 0
const failures = []

for (const tc of testCases) {
  const result = detectIntent(tc.input)
  const ok = result === tc.expect
  if (ok) {
    pass++
  } else {
    fail++
    failures.push(tc)
  }
  const icon = ok ? '✅' : '❌'
  const tag = `[${tc.category}]`
  console.log(`${icon} ${tag.padEnd(6)} "${tc.input}" → ${result} (期望: ${tc.expect})`)
}

console.log('\n' + '═'.repeat(60))
console.log(`总计: ${testCases.length} | 通过: ${pass} | 失败: ${fail}`)
console.log('═'.repeat(60))

if (failures.length > 0) {
  console.log('\n❌ 失败用例汇总:')
  for (const f of failures) {
    console.log(`  [${f.category}] "${f.input}" → 实际: ${detectIntent(f.input)}, 期望: ${f.expect}`)
  }
}

process.exit(fail > 0 ? 1 : 0)
