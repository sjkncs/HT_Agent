/**
 * LLM API 端到端测试 — 模拟浏览器端的实际请求
 * 
 * 测试:
 * 1. 通用知识问题 (general_knowledge intent)
 * 2. 点单问题 (ordering intent)
 * 3. 食安问题 (food_safety intent)
 * 4. 日常吃穿住行问题
 * 
 * 运行: node tests/test-llm-e2e.mjs
 */

const BASE_URL = 'https://integrate.api.nvidia.com/v1'
const API_KEY = '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'
const MODEL = 'moonshotai/kimi-k2.6'

async function chatCompletion(messages) {
  const body = {
    model: MODEL,
    messages,
    temperature: 0.3,
    max_tokens: 1024,
    top_p: 0.95,
    frequency_penalty: 0.1,
    presence_penalty: 0.05,
    stream: false,
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API error ${response.status}: ${errorText.slice(0, 300)}`)
  }

  const data = await response.json()
  return {
    content: data.choices?.[0]?.message?.content || '',
    model: data.model,
    usage: data.usage,
  }
}

// ── 模拟 generateLLMEnhancedReply 中不同意图的系统提示 ──

function buildGeneralKnowledgePrompt(userText, memoryHint = '') {
  const systemPrompt = `你是阿喜，喜茶智能客服助手。${memoryHint}
- 自称"阿喜"，称呼顾客"您"
- 对于喜茶业务以外的问题，友好、简洁地回答即可
- 如果问题涉及喜茶产品、门店、活动，可以热情推荐
- 语气亲切自然，不要太正式`
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userText },
  ]
}

function buildOrderingPrompt(userText) {
  const systemPrompt = `你是阿喜，喜茶智能客服助手。你可以帮助用户完成自助点单。

## 沟通规范
- 自称"阿喜"，称呼顾客"您"
- 语气轻松活泼，符合喜茶年轻品牌调性
- 推荐商品时简要描述口味特点
- 下单前一定要让用户确认商品和价格
- 如果用户问非点单问题，也可以友好回答`
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userText },
  ]
}

// ═══════════════════════════════════════
// 测试用例
// ═══════════════════════════════════════

const testCases = [
  // 日常吃穿住行
  { question: '今天中午吃什么好', intent: 'general_knowledge' },
  { question: '红烧肉怎么做才好吃', intent: 'general_knowledge' },
  { question: '夏天穿什么衣服凉快', intent: 'general_knowledge' },
  { question: '租房要注意什么', intent: 'general_knowledge' },
  { question: '从北京到上海坐高铁要多久', intent: 'general_knowledge' },
  // 通用知识
  { question: '你好', intent: 'general_knowledge' },
  { question: '中国有多少个省份', intent: 'general_knowledge' },
  { question: '最近有什么好看的电影推荐', intent: 'general_knowledge' },
  // 点单场景
  { question: '有什么好喝的推荐', intent: 'ordering' },
  { question: '帮我推荐一款夏天喝的饮品', intent: 'ordering' },
  // 边界case
  { question: '中国地理位置最南的城市是哪个', intent: 'general_knowledge' },
  { question: '想了解一下人工智能', intent: 'general_knowledge' },
]

// ═══════════════════════════════════════
// 运行测试
// ═══════════════════════════════════════

console.log(`\n${'═'.repeat(70)}`)
console.log(` LLM API 端到端测试 — 模型: ${MODEL}`)
console.log(`${'═'.repeat(70)}\n`)

let pass = 0
let fail = 0
const results = []

for (const tc of testCases) {
  const promptFn = tc.intent === 'ordering' ? buildOrderingPrompt : buildGeneralKnowledgePrompt
  const messages = promptFn(tc.question)
  
  const startTime = Date.now()
  try {
    const result = await chatCompletion(messages)
    const elapsed = Date.now() - startTime
    const reply = result.content.trim()
    
    // 质量检查
    const isTooShort = reply.length < 10
    const hasForbidden = /亲亲|宝贝/.test(reply)
    const isQualityOk = !isTooShort && !hasForbidden
    
    if (isQualityOk) {
      pass++
      console.log(`✅ [${tc.intent.padEnd(18)}] "${tc.question}"`)
      console.log(`   回复: ${reply.slice(0, 120)}${reply.length > 120 ? '...' : ''}`)
      console.log(`   耗时: ${elapsed}ms | tokens: ${result.usage?.total_tokens || '?'}`)
    } else {
      fail++
      console.log(`❌ [${tc.intent.padEnd(18)}] "${tc.question}" — 质量问题`)
      console.log(`   回复: ${reply.slice(0, 120)}`)
      if (isTooShort) console.log('   原因: 回复过短 (<10字)')
      if (hasForbidden) console.log('   原因: 包含禁用词 (亲亲/宝贝)')
    }
    results.push({ question: tc.question, reply, elapsed, ok: isQualityOk })
  } catch (err) {
    fail++
    const elapsed = Date.now() - startTime
    console.log(`❌ [${tc.intent.padEnd(18)}] "${tc.question}" — API错误`)
    console.log(`   错误: ${err.message.slice(0, 200)}`)
    console.log(`   耗时: ${elapsed}ms`)
    results.push({ question: tc.question, reply: null, elapsed, ok: false, error: err.message })
  }
  console.log()
}

console.log(`${'═'.repeat(70)}`)
console.log(`总计: ${testCases.length} | 通过: ${pass} | 失败: ${fail}`)
console.log(`平均耗时: ${Math.round(results.filter(r => r.reply).reduce((s, r) => s + r.elapsed, 0) / Math.max(pass, 1))}ms`)
console.log(`${'═'.repeat(70)}`)

process.exit(fail > 0 ? 1 : 0)
