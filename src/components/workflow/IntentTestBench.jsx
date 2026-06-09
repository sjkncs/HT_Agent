import { useState, useRef, useEffect } from 'react'
import {
  Play, Zap, Database, Brain, GitBranch, GitFork, MessageCircle,
  ArrowRight, CheckCircle2, XCircle, Clock, Copy, RotateCcw,
  AlertTriangle, ChevronDown, Tag, ShieldAlert,
  Truck, Star, RefreshCw, Bell, Layers, Send, Package
} from 'lucide-react'
import {
  ORDER_INTENT_SCENES,
  executeOrderWorkflow,
} from '../../lib/agent-engine.js'
import { ORDER_MOCK_DB, ORDER_WORKFLOW_SCENARIOS } from '../../lib/mock-data.js'

/* ─── Color Maps ─── */
const CATEGORY_COLORS = {
  A: { bg: 'rgba(243,156,18,0.1)', text: '#e67e22', label: '时效' },
  B: { bg: 'rgba(52,152,219,0.1)', text: '#2980b9', label: '取餐' },
  C: { bg: 'rgba(231,76,60,0.1)', text: '#e74c3c', label: '食安' },
  D: { bg: 'rgba(155,89,182,0.1)', text: '#8e44ad', label: '订单变更' },
  E: { bg: 'rgba(241,196,15,0.1)', text: '#f39c12', label: '产品质量' },
  F: { bg: 'rgba(231,76,60,0.1)', text: '#c0392b', label: '服务体验' },
  G: { bg: 'rgba(46,204,113,0.1)', text: '#27ae60', label: '配送' },
}

const BRANCH_ICONS = {
  '不满足制作时效/未优先': Clock,
  '没叫号': Bell,
  '叫号没完成': Bell,
  '超预计时间': Clock,
  '退款退单': RefreshCw,
  '修改订单': Package,
  '配送延迟': Truck,
  '包装破损': ShieldAlert,
  '其他': Layers,
}

const NODE_TYPE_COLORS = {
  input: '#27ae60',
  database: '#2980b9',
  llm: '#8e44ad',
  condition: '#e67e22',
  aggregator: '#f39c12',
  output: '#e74c3c',
}

const NODE_TYPE_ICONS = {
  input: Play,
  database: Database,
  llm: Brain,
  condition: GitBranch,
  aggregator: GitFork,
  output: Send,
}

/* ─── Quick Scenario Presets ─── */
const QUICK_TESTS = [
  { label: '催单', text: '我的奶茶怎么还没做好？等了太久了！', orderId: 'ORD-20260608-001', cat: 'A' },
  { label: '没叫号', text: '我都到门店了，怎么还不叫我的号？', orderId: 'ORD-20260608-002', cat: 'B' },
  { label: '退款', text: '我不想要了，能退款吗？', orderId: 'ORD-20260608-006', cat: 'D' },
  { label: '改订单', text: '帮我去冰少糖，改一下', orderId: 'ORD-20260608-006', cat: 'D' },
  { label: '配送慢', text: '外卖超时了，骑手到底在哪？', orderId: 'ORD-20260608-003', cat: 'G' },
  { label: '撒漏', text: '收到外卖洒了一半，包装都破了', orderId: 'ORD-20260608-007', cat: 'G' },
  { label: '转人工', text: '我要投诉，给我转人工客服', orderId: 'ORD-20260608-004', cat: 'F' },
]

/* ─── Trace Node Chip ─── */
function TraceNode({ node, isActive }) {
  const color = NODE_TYPE_COLORS[node.type] || '#666'
  const Icon = NODE_TYPE_ICONS[node.type] || Play
  const isSkipped = node.status === 'skipped'

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all"
      style={{
        borderColor: isSkipped ? 'var(--cursor-border-10)' : isActive ? color + '80' : color + '40',
        background: isSkipped ? 'var(--cursor-surface-200)' : isActive ? color + '10' : 'var(--cursor-surface-200)',
        opacity: isSkipped ? 0.45 : 1,
      }}
    >
      <div
        className="flex h-6 w-6 items-center justify-center rounded-md flex-shrink-0"
        style={{ background: isSkipped ? 'var(--cursor-surface-400)' : color + '18', color: isSkipped ? 'var(--cursor-border-55)' : color }}
      >
        {isSkipped ? <XCircle className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold" style={{ color: isSkipped ? 'var(--cursor-border-55)' : color }}>{node.node_id}</span>
          <span className="text-[11px] font-medium truncate" style={{ color: isSkipped ? 'var(--cursor-border-55)' : 'var(--cursor-ink)' }}>{node.node_name}</span>
        </div>
        {node.output_summary && (
          <p className="text-[10px] truncate max-w-[220px]" style={{ color: 'var(--cursor-border-55)' }}>{node.output_summary}</p>
        )}
        {node.branch_taken && (
          <p className="text-[10px] font-medium" style={{ color }}>
            → {node.branch_taken}
          </p>
        )}
      </div>
    </div>
  )
}

/* ─── Keyword Highlight ─── */
function highlightKeywords(text, scenes) {
  if (!text) return text
  const allKeywords = []
  for (const s of scenes) {
    if (s.id === 'other') continue
    for (const kw of s.triggerKeywords) {
      allKeywords.push({ kw, scene: s.name, cat: s.taxonomyCategory })
    }
  }
  allKeywords.sort((a, b) => b.kw.length - a.kw.length)

  let result = text
  const matched = []
  for (const { kw, scene, cat } of allKeywords) {
    if (result.toLowerCase().includes(kw) && !matched.find(m => m.kw === kw)) {
      matched.push({ kw, scene, cat })
    }
  }
  return matched
}

/* ─── Order Selector Dropdown ─── */
function OrderSelector({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = ORDER_MOCK_DB.find(o => o.order_id === value)

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const handleEsc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleEsc) }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left w-full"
        style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}
        onClick={() => setOpen(!open)}
      >
        <Database className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#2980b9' }} />
        <div className="flex-1 min-w-0">
          {selected ? (
            <div>
              <span className="text-[11px] font-mono" style={{ color: 'var(--cursor-ink)' }}>{selected.order_id}</span>
              <span className="text-[10px] ml-2" style={{ color: 'var(--cursor-border-55)' }}>
                {selected.product} · {selected.store}
              </span>
            </div>
          ) : (
            <span className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }}>选择测试订单...</span>
          )}
        </div>
        <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--cursor-border-55)' }} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-50 max-h-[240px] overflow-y-auto"
          style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}
        >
          {ORDER_MOCK_DB.map(order => (
            <button
              key={order.order_id}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:opacity-80 transition-opacity"
              style={{ background: order.order_id === value ? 'var(--cursor-surface-500)' : 'transparent' }}
              onClick={() => { onChange(order.order_id); setOpen(false) }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono" style={{ color: 'var(--cursor-ink)' }}>{order.order_id}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{
                    background: order.status === '制作中' ? 'rgba(243,156,18,0.12)' :
                                order.status === '待取餐' ? 'rgba(52,152,219,0.12)' :
                                order.status === '配送中' ? 'rgba(46,204,113,0.12)' :
                                'rgba(149,165,166,0.12)',
                    color: order.status === '制作中' ? '#e67e22' :
                           order.status === '待取餐' ? '#2980b9' :
                           order.status === '配送中' ? '#27ae60' : '#7f8c8d',
                  }}>
                    {order.status}
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
                  {order.product} · {order.store} · {order.time}
                </span>
              </div>
              {order.number > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(243,156,18,0.1)', color: '#e67e22' }}>
                  前方{order.number}单
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Result Card ─── */
function ResultPanel({ result, matchedKeywords }) {
  const [copied, setCopied] = useState(false)
  const scene = ORDER_INTENT_SCENES.find(s => s.name === result.scene)
  const catColor = CATEGORY_COLORS[scene?.taxonomyCategory] || CATEGORY_COLORS.F
  const BranchIcon = BRANCH_ICONS[result.scene] || Layers

  const copyReply = () => {
    navigator.clipboard.writeText(result.output).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Build trace flow visualization
  const activeNodes = result.trace.filter(n => n.status === 'completed')
  const skippedNodes = result.trace.filter(n => n.status === 'skipped')

  return (
    <div className="space-y-3">
      {/* Intent Result Header */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-100)' }}>
        <div className="px-4 py-3 flex items-center gap-3" style={{ background: catColor.bg }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: catColor.text + '20', color: catColor.text }}>
            <BranchIcon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: catColor.text + '20', color: catColor.text }}>
                {scene?.taxonomyCategory}{scene?.taxonomySubcategory}
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--cursor-ink)' }}>{result.scene}</span>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }}>{scene?.description}</p>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" style={{ color: '#27ae60' }} />
            <span className="text-[10px] font-medium" style={{ color: '#27ae60' }}>匹配成功</span>
          </div>
        </div>

        {/* Matched Keywords */}
        {matchedKeywords.length > 0 && (
          <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--cursor-border-10)' }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Tag className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }} />
              <span className="text-[10px] font-medium" style={{ color: 'var(--cursor-border-55)' }}>命中关键词:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {matchedKeywords.map((m, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{
                  background: (CATEGORY_COLORS[m.cat]?.text || '#666') + '18',
                  color: CATEGORY_COLORS[m.cat]?.text || '#666',
                  border: `1px solid ${(CATEGORY_COLORS[m.cat]?.text || '#666')}30`,
                }}>
                  "{m.kw}" → {m.scene}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Info + Compensation */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-200)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Database className="h-3.5 w-3.5" style={{ color: '#2980b9' }} />
            <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }}>订单信息</span>
          </div>
          <div className="space-y-1 text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
            <div className="flex justify-between">
              <span>订单号</span>
              <span className="font-mono" style={{ color: 'var(--cursor-ink)' }}>{result.order_id}</span>
            </div>
            <div className="flex justify-between">
              <span>状态</span>
              <span className="px-1.5 py-0.5 rounded" style={{
                background: result.order_status === '制作中' ? 'rgba(243,156,18,0.12)' :
                            result.order_status === '配送中' ? 'rgba(46,204,113,0.12)' :
                            'rgba(149,165,166,0.12)',
                color: result.order_status === '制作中' ? '#e67e22' :
                       result.order_status === '配送中' ? '#27ae60' : '#7f8c8d',
              }}>{result.order_status}</span>
            </div>
            {result.queue_number >= 0 && (
              <div className="flex justify-between">
                <span>前方排队</span>
                <span style={{ color: 'var(--cursor-ink)' }}>{result.queue_number} 单</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-200)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            {result.compensate ? <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#e67e22' }} /> : <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#27ae60' }} />}
            <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }}>补偿决策</span>
          </div>
          <div className="space-y-1 text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
            <div className="flex justify-between">
              <span>是否补偿</span>
              <span style={{ color: result.compensate ? '#e67e22' : '#27ae60' }}>{result.compensate ? '是' : '否'}</span>
            </div>
            {result.compensate && (
              <div className="flex justify-between">
                <span>补偿金额</span>
                <span className="font-bold" style={{ color: '#e67e22' }}>¥{result.compensate_amount}</span>
              </div>
            )}
            {result.ticket && (
              <div className="flex justify-between">
                <span>工单</span>
                <span style={{ color: 'var(--cursor-ink)' }}>{result.ticket}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generated Response */}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-200)' }}>
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" style={{ color: '#f54e00' }} />
            <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }}>生成回复</span>
          </div>
          <button
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors"
            style={{ background: copied ? 'rgba(39,174,96,0.12)' : 'var(--cursor-surface-400)', color: copied ? '#27ae60' : 'var(--cursor-border-55)' }}
            onClick={copyReply}
          >
            {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--cursor-ink)', whiteSpace: 'pre-wrap' }}>{result.output}</p>
        </div>
      </div>

      {/* Execution Trace */}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-200)' }}>
        <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
          <Zap className="h-3.5 w-3.5" style={{ color: '#f54e00' }} />
          <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }}>执行链路追踪</span>
          <span className="text-[10px] ml-auto" style={{ color: 'var(--cursor-border-55)' }}>
            {activeNodes.length} 完成 · {skippedNodes.length} 跳过
          </span>
        </div>
        <div className="px-3 py-3">
          {/* Active trace flow */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {activeNodes.map((node, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <TraceNode node={node} isActive={true} />
                {i < activeNodes.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }} />
                )}
              </div>
            ))}
          </div>

          {/* Skipped branches (collapsed) */}
          {skippedNodes.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <XCircle className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }} />
                <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
                  跳过分支 ({skippedNodes.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {skippedNodes.map((node, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full line-through" style={{
                    background: 'var(--cursor-surface-400)',
                    color: 'var(--cursor-border-55)',
                  }}>
                    {node.node_id}.{node.node_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */
export default function IntentTestBench() {
  const [userInput, setUserInput] = useState('')
  const [orderId, setOrderId] = useState('ORD-20260608-001')
  const [conversation, setConversation] = useState('')
  const [result, setResult] = useState(null)
  const [matchedKeywords, setMatchedKeywords] = useState([])
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const inputRef = useRef(null)

  const runTest = () => {
    if (!userInput.trim()) return
    setIsRunning(true)

    // Simulate slight delay for UX
    setTimeout(() => {
      const res = executeOrderWorkflow({
        userInput: userInput.trim(),
        conversation: conversation || `顾客: ${userInput.trim()}`,
        orderId,
      })

      const keywords = highlightKeywords(userInput + ' ' + (conversation || ''), ORDER_INTENT_SCENES)

      setResult(res)
      setMatchedKeywords(keywords)
      setHistory(prev => [{
        id: Date.now(),
        input: userInput,
        orderId,
        scene: res.scene,
        timestamp: new Date().toLocaleTimeString(),
      }, ...prev].slice(0, 20))
      setIsRunning(false)
    }, 300)
  }

  const loadQuickTest = (qt) => {
    setUserInput(qt.text)
    setOrderId(qt.orderId)
    setConversation('')
    inputRef.current?.focus()
  }

  const loadScenario = (scenario) => {
    setUserInput(scenario.userInput)
    setOrderId(scenario.orderId)
    setConversation(scenario.conversation)
    inputRef.current?.focus()
  }

  const reset = () => {
    setUserInput('')
    setConversation('')
    setResult(null)
    setMatchedKeywords([])
    inputRef.current?.focus()
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--cursor-canvas)' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }}>
              <Zap className="h-4 w-4" style={{ color: '#f54e00' }} />
              意图路由测试台
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }}>
              实时测试 9 路意图分支 · 关键词匹配 + 优先级路由 · 执行链路追踪
            </p>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                className="text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors"
                style={{ background: showHistory ? 'var(--cursor-surface-500)' : 'var(--cursor-surface-300)', color: showHistory ? 'var(--cursor-ink)' : 'var(--cursor-border-55)' }}
                onClick={() => setShowHistory(!showHistory)}
              >
                <Clock className="h-3 w-3" />
                历史 ({history.length})
              </button>
            )}
            <button
              className="text-[10px] px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
              style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-border-55)' }}
              onClick={reset}
            >
              <RotateCcw className="h-3 w-3" />
              重置
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Test Buttons */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }} />
            <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-border-55)' }}>快捷测试</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TESTS.map((qt, i) => {
              const catColor = CATEGORY_COLORS[qt.cat]
              return (
                <button
                  key={i}
                  className="text-[10px] px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 border"
                  style={{
                    borderColor: (catColor?.text || '#666') + '30',
                    background: (catColor?.text || '#666') + '08',
                    color: catColor?.text || '#666',
                  }}
                  onClick={() => loadQuickTest(qt)}
                >
                  {qt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Scenario Presets */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Layers className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }} />
            <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-border-55)' }}>预置场景（含对话上下文）</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ORDER_WORKFLOW_SCENARIOS.map((sc, i) => (
              <button
                key={sc.id}
                className="text-[10px] px-2 py-1 rounded-lg transition-colors flex items-center gap-1.5 border"
                style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-200)', color: 'var(--cursor-ink)' }}
                onClick={() => loadScenario(sc)}
              >
                <span className="px-1 py-0 rounded text-[9px] font-mono" style={{ background: 'var(--cursor-surface-400)' }}>#{i + 1}</span>
                {sc.scene}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-100)' }}>
          <div className="p-3 space-y-2.5">
            {/* Order Selector */}
            <OrderSelector value={orderId} onChange={setOrderId} />

            {/* User Input */}
            <div>
              <label className="text-[10px] font-medium mb-1 block" style={{ color: 'var(--cursor-border-55)' }}>顾客消息</label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 px-3 py-2 rounded-lg border text-[12px] outline-none focus:ring-2"
                  style={{
                    borderColor: 'var(--cursor-border-10)',
                    background: 'var(--cursor-surface-200)',
                    color: 'var(--cursor-ink)',
                    ringColor: '#f54e00',
                  }}
                  placeholder="输入顾客消息，如：我的奶茶怎么还没做好？"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runTest()}
                />
                <button
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-medium text-white transition-opacity"
                  style={{ background: '#f54e00', opacity: userInput.trim() && !isRunning ? 1 : 0.5 }}
                  onClick={runTest}
                  disabled={!userInput.trim() || isRunning}
                >
                  {isRunning ? (
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  执行
                </button>
              </div>
            </div>

            {/* Conversation Context (optional) */}
            <div>
              <label className="text-[10px] font-medium mb-1 block" style={{ color: 'var(--cursor-border-55)' }}>对话上下文（可选）</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border text-[11px] outline-none resize-none"
                style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-200)', color: 'var(--cursor-ink)' }}
                rows={2}
                placeholder="粘贴历史对话上下文，如：&#10;顾客: 你好&#10;客服: 您好，请问有什么可以帮您？&#10;顾客: 我的订单..."
                value={conversation}
                onChange={(e) => setConversation(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Live Keyword Preview */}
        {userInput.trim() && (
          <div className="rounded-lg border p-3" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-200)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="h-3 w-3" style={{ color: '#f54e00' }} />
              <span className="text-[10px] font-medium" style={{ color: 'var(--cursor-ink)' }}>实时关键词检测</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(() => {
                const matches = highlightKeywords(userInput + ' ' + conversation, ORDER_INTENT_SCENES)
                if (matches.length === 0) {
                  return <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>未检测到触发关键词，将路由至"其他"</span>
                }
                return matches.map((m, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{
                    background: (CATEGORY_COLORS[m.cat]?.text || '#666') + '18',
                    color: CATEGORY_COLORS[m.cat]?.text || '#666',
                    border: `1px solid ${(CATEGORY_COLORS[m.cat]?.text || '#666')}30`,
                  }}>
                    "{m.kw}" → {CATEGORY_COLORS[m.cat]?.label}/{m.scene}
                  </span>
                ))
              })()}
            </div>
          </div>
        )}

        {/* Results */}
        {result && <ResultPanel result={result} matchedKeywords={matchedKeywords} />}

        {/* History */}
        {showHistory && history.length > 0 && (
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-200)' }}>
            <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
              <Clock className="h-3.5 w-3.5" style={{ color: 'var(--cursor-border-55)' }} />
              <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }}>测试历史</span>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {history.map((h, i) => (
                <button
                  key={h.id}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:opacity-80 transition-opacity border-b last:border-b-0"
                  style={{ borderColor: 'var(--cursor-border-10)' }}
                  onClick={() => { setUserInput(h.input); setOrderId(h.orderId) }}
                >
                  <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }}>{h.timestamp}</span>
                  <span className="text-[10px] flex-1 truncate" style={{ color: 'var(--cursor-ink)' }}>{h.input}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{
                    background: 'var(--cursor-surface-400)',
                    color: 'var(--cursor-ink)',
                  }}>
                    {h.scene}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Intent Coverage Map */}
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-100)' }}>
          <h3 className="text-[11px] font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }}>
            <GitBranch className="h-3.5 w-3.5" style={{ color: '#f54e00' }} />
            9 路意图分支覆盖图
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {ORDER_INTENT_SCENES.map((scene) => {
              const catColor = CATEGORY_COLORS[scene.taxonomyCategory] || CATEGORY_COLORS.F
              const BranchIcon = BRANCH_ICONS[scene.name] || Layers
              const tested = history.some(h => h.scene === scene.name)
              return (
                <button
                  key={scene.id}
                  className="flex items-center gap-2 p-2 rounded-lg border text-left transition-all hover:opacity-90"
                  style={{
                    borderColor: tested ? catColor.text + '60' : 'var(--cursor-border-10)',
                    background: tested ? catColor.text + '08' : 'var(--cursor-surface-200)',
                  }}
                  onClick={() => {
                    const kw = scene.triggerKeywords[0]
                    if (kw) {
                      setUserInput(`测试: ${kw}`)
                    }
                  }}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0" style={{
                    background: catColor.text + '15',
                    color: catColor.text,
                  }}>
                    <BranchIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono" style={{ color: catColor.text }}>{scene.taxonomyCategory}{scene.taxonomySubcategory}</span>
                      {tested && <CheckCircle2 className="h-3 w-3" style={{ color: '#27ae60' }} />}
                    </div>
                    <p className="text-[10px] font-medium truncate" style={{ color: 'var(--cursor-ink)' }}>{scene.name}</p>
                    <p className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>P{scene.priority} · {scene.triggerKeywords.length} 关键词</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
