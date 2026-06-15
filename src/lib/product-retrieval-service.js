// ─── Product Knowledge Retrieval Service ───
// Hybrid retrieval: structured catalog (exact) + BM25 knowledge docs (semantic)
// Used by agent-engine.js to inject product context into LLM prompts

import catalog from '../data/product-knowledge-catalog.json' with { type: 'json' }
import knowledgeDocs from '../data/product-knowledge-docs.json' with { type: 'json' }

// ─── Stop words (Chinese + English) ───
const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
  '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着',
  '没有', '看', '好', '自己', '这', '他', '她', '它', '们', '那', '什么',
  '怎么', '请问', '能', '吗', '呢', '吧', '啊', '哦', '嗯',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
  'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'just', 'because', 'but', 'and', 'or', 'if', 'while', 'about', 'up',
])

// ─── Tokenize ───
function tokenize(text) {
  if (!text) return []
  // Chinese: character bigrams + single chars; English: lowercase words
  const tokens = []
  const cleaned = text.toLowerCase().replace(/[^\u4e00-\u9fffa-zA-Z0-9]/g, ' ')
  const words = cleaned.split(/\s+/).filter(w => w.length > 0 && !STOP_WORDS.has(w))

  for (const word of words) {
    if (/[\u4e00-\u9fff]/.test(word)) {
      // Chinese: add single chars and bigrams
      for (let i = 0; i < word.length; i++) {
        if (!STOP_WORDS.has(word[i])) tokens.push(word[i])
        if (i < word.length - 1) tokens.push(word[i] + word[i + 1])
      }
    } else if (word.length > 1) {
      tokens.push(word)
    }
  }
  return tokens
}

// ─── BM25 Scoring ───
const BM25_K1 = 1.5
const BM25_B = 0.75

function bm25Score(queryTokens, docText, docTags = []) {
  const docTokens = tokenize(docText + ' ' + docTags.join(' '))
  if (docTokens.length === 0) return 0

  const avgDocLen = docTokens.length
  const docFreq = {}
  for (const t of docTokens) {
    docFreq[t] = (docFreq[t] || 0) + 1
  }

  let score = 0
  for (const qt of queryTokens) {
    const tf = docFreq[qt] || 0
    if (tf === 0) continue
    const numerator = tf * (BM25_K1 + 1)
    const denominator = tf + BM25_K1 * (1 - BM25_B + BM25_B * (docTokens.length / avgDocLen))
    score += numerator / denominator
  }

  // Boost for tag matches
  for (const qt of queryTokens) {
    if (docTags.some(tag => tag.toLowerCase().includes(qt) || qt.includes(tag.toLowerCase()))) {
      score += 2.0
    }
  }

  return score
}

// ─── Product Name Matching ───
const PRODUCT_NAMES = Object.keys(catalog.products)

function matchProductName(text) {
  if (!text) return null
  const normalized = text.toLowerCase()

  // Exact match first
  for (const name of PRODUCT_NAMES) {
    if (normalized.includes(name.toLowerCase())) return name
  }

  // Fuzzy: partial match (at least 2 chars)
  for (const name of PRODUCT_NAMES) {
    if (name.length >= 2 && normalized.includes(name.substring(0, Math.min(name.length, 4)))) {
      return name
    }
  }

  return null
}

// ─── Query Type Detection ───
function detectQueryType(message) {
  const productName = matchProductName(message)

  // Exact query: mentions a specific product + asks about specific attributes
  if (productName && /价格|多少钱|过敏原|过敏|配料|成分|定制|选项|杯型|甜度|冰量|加料|做法|热量|卡路里|营养/.test(message)) {
    return { type: 'exact', productName }
  }

  // Semantic query: recommendations, comparisons, general questions
  if (/推荐|有什么|哪款|适合|哪个好|区别|有什么不一样|故事|原料来源|不含|无咖|低卡|健康/.test(message)) {
    return { type: 'semantic', productName }
  }

  // Hybrid: mentions product name but open-ended question
  if (productName) {
    return { type: 'hybrid', productName }
  }

  // Check if it's product-related at all
  if (/菜单|饮品|喝|茶|咖啡|果茶|波波|抹茶|奶盖|新品|热销|限定/.test(message)) {
    return { type: 'semantic', productName: null }
  }

  return null
}

// ─── Structured Query (Layer 1) ───
function queryProductCatalog(productName) {
  const product = catalog.products[productName]
  if (!product) return null

  return {
    name: productName,
    ...product,
  }
}

// ─── Semantic Search (Layer 2) ───
function searchKnowledge(query, { topK = 5, types = null, categories = null } = {}) {
  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) return []

  const scored = knowledgeDocs.documents
    .filter(doc => !types || types.includes(doc.type))
    .filter(doc => !categories || categories.includes(doc.category))
    .map(doc => ({
      ...doc,
      score: bm25Score(queryTokens, doc.text, doc.metadata?.tags || []),
    }))
    .filter(doc => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return scored
}

// ─── Format Product Context for LLM ───
function formatProductContext(result) {
  if (!result) return ''

  const parts = []

  if (result.structured) {
    const p = result.structured
    parts.push(`【产品详情：${p.name}】`)
    if (p.description?.long) parts.push(`描述：${p.description.long}`)
    else if (p.description?.short) parts.push(`描述：${p.description.short}`)
    parts.push(`价格：¥${p.pricing?.base || '?'}`)

    if (p.ingredients?.main?.length) {
      parts.push(`主要原料：${p.ingredients.main.join('、')}`)
    }
    if (p.ingredients?.layers?.length) {
      parts.push(`层次：${p.ingredients.layers.map(l => l.name).join(' + ')}`)
    }
    if (p.allergens?.length) {
      parts.push(`⚠ 过敏原：${p.allergens.join('、')}`)
    }
    if (p.nutrition) {
      const nParts = []
      if (p.nutrition.calories) nParts.push(`热量${p.nutrition.calories}`)
      if (p.nutrition.caffeine) nParts.push(`咖啡因${p.nutrition.caffeine}`)
      if (p.nutrition.sugar) nParts.push(`糖${p.nutrition.sugar}`)
      if (nParts.length) parts.push(`营养：${nParts.join('，')}`)
    }
    if (p.tips) parts.push(`贴士：${p.tips}`)

    // Customization options
    if (p.customization) {
      for (const [key, opts] of Object.entries(p.customization)) {
        if (opts?.length) {
          const label = { sweetener: '甜度', ice: '冰量', topping: '加料', prepMethod: '做法', ecoStraw: '绿色喜茶' }[key] || key
          const optStr = opts.map(o => o.name + (o.price > 0 ? `+¥${o.price}` : '') + (o.recommended ? '(推荐)' : '')).join('、')
          parts.push(`${label}：${optStr}`)
        }
      }
    }

    if (p.relatedProducts?.length) {
      parts.push(`相关推荐：${p.relatedProducts.join('、')}`)
    }

    // FAQs
    if (p.faq?.length) {
      parts.push(`\n常见问答：`)
      for (const faq of p.faq.slice(0, 3)) {
        parts.push(`Q: ${faq.q}\nA: ${faq.a}`)
      }
    }
  }

  if (result.knowledge?.length) {
    parts.push(`\n【相关知识】`)
    for (const doc of result.knowledge.slice(0, 3)) {
      parts.push(`- ${doc.text}`)
    }
  }

  return parts.join('\n')
}

// ─── Main Retrieval Function ───
function retrieve(userMessage) {
  const queryInfo = detectQueryType(userMessage)
  if (!queryInfo) return null

  const result = {}

  if (queryInfo.type === 'exact' || queryInfo.type === 'hybrid') {
    if (queryInfo.productName) {
      result.structured = queryProductCatalog(queryInfo.productName)
    }
  }

  if (queryInfo.type === 'semantic' || queryInfo.type === 'hybrid') {
    result.knowledge = searchKnowledge(userMessage, { topK: 3 })

    // For semantic queries without a specific product, also search catalog by category/tags
    if (!queryInfo.productName && result.knowledge?.length) {
      const mentionedProducts = result.knowledge
        .filter(d => d.product)
        .map(d => d.product)
      if (mentionedProducts.length > 0) {
        const firstProduct = mentionedProducts[0]
        result.structured = queryProductCatalog(firstProduct)
      }
    }
  }

  if (!result.structured && !result.knowledge?.length) return null

  result.queryType = queryInfo.type
  result.formatted = formatProductContext(result)
  return result
}

// ─── Public API ───
export const ProductRetrievalService = {
  retrieve,
  queryProductCatalog,
  searchKnowledge,
  formatProductContext,
  detectQueryType,
  matchProductName,
  getCatalogStats: () => ({
    totalProducts: catalog.meta?.totalProducts || Object.keys(catalog.products).length,
    categories: catalog.meta?.categories || [],
    detailedProducts: Object.values(catalog.products).filter(p => p.dataCompleteness === 'detailed').length,
    knowledgeDocuments: knowledgeDocs.meta?.totalDocuments || knowledgeDocs.documents.length,
  }),
}

export default ProductRetrievalService
