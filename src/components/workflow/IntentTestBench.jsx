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
function TraceNode({ node, isActive, ...qoderProps }) {
  const color = NODE_TYPE_COLORS[node.type] || '#666'
  const Icon = NODE_TYPE_ICONS[node.type] || Play
  const isSkipped = node.status === 'skipped'

  return (
    <div
      className={["flex items-center gap-2 px-3 py-2 rounded-lg border transition-all", qoderProps?.className].filter(Boolean).join(" ")}
      style={{ ...({
        borderColor: isSkipped ? 'var(--cursor-border-10)' : isActive ? color + '80' : color + '40',
        background: isSkipped ? 'var(--cursor-surface-200)' : isActive ? color + '10' : 'var(--cursor-surface-200)',
        opacity: isSkipped ? 0.45 : 1,
      }), ...(qoderProps?.style) }}
     data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div
        className="flex h-6 w-6 items-center justify-center rounded-md flex-shrink-0"
        style={{ background: isSkipped ? 'var(--cursor-surface-400)' : color + '18', color: isSkipped ? 'var(--cursor-border-55)' : color }}
       data-qoder-id="qel-flex-86bf4caa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-86bf4caa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;TraceNode&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:81,&quot;column&quot;:7}}">
        {isSkipped ? <XCircle className="h-3 w-3"  data-qoder-id="qel-h-3-7aed51df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-7aed51df&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;TraceNode&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:85,&quot;column&quot;:22}}"/> : <Icon className="h-3 w-3"  data-qoder-id="qel-h-3-06d272cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-06d272cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;TraceNode&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:85,&quot;column&quot;:56}}"/>}
      </div>
      <div className="min-w-0" data-qoder-id="qel-min-w-0-854b160f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-min-w-0-854b160f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;TraceNode&quot;,&quot;elementRole&quot;:&quot;min-w-0&quot;,&quot;loc&quot;:{&quot;line&quot;:87,&quot;column&quot;:7}}">
        <div className="flex items-center gap-1.5" data-qoder-id="qel-flex-82bf465e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-82bf465e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;TraceNode&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:88,&quot;column&quot;:9}}">
          <span className="text-[10px] font-mono font-bold" style={{ color: isSkipped ? 'var(--cursor-border-55)' : color }} data-qoder-id="qel-text-10px-43666418" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-43666418&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;TraceNode&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:89,&quot;column&quot;:11}}">{node.node_id}</span>
          <span className="text-[11px] font-medium truncate" style={{ color: isSkipped ? 'var(--cursor-border-55)' : 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-2f9f0e9a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-2f9f0e9a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;TraceNode&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:90,&quot;column&quot;:11}}">{node.node_name}</span>
        </div>
        {node.output_summary && (
          <p className="text-[10px] truncate max-w-[220px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-ea009ba6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-ea009ba6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;TraceNode&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:93,&quot;column&quot;:11}}">{node.output_summary}</p>
        )}
        {node.branch_taken && (
          <p className="text-[10px] font-medium" style={{ color }} data-qoder-id="qel-text-10px-05088e0a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-05088e0a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;TraceNode&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:96,&quot;column&quot;:11}}">
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
function OrderSelector({ value, onChange, ...qoderProps }) {
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
    <div className={["relative", qoderProps?.className].filter(Boolean).join(" ")} ref={ref} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <button
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left w-full"
        style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}
        onClick={() => setOpen(!open)}
       data-qoder-id="qel-flex-02a43ff4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-02a43ff4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;OrderSelector&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:144,&quot;column&quot;:7}}">
        <Database className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#2980b9' }}  data-qoder-id="qel-h-3-5-8259c247" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-8259c247&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;OrderSelector&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:149,&quot;column&quot;:9}}"/>
        <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-179216db" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-179216db&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;OrderSelector&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:150,&quot;column&quot;:9}}">
          {selected ? (
            <div data-qoder-id="qel-div-e586c3b0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-e586c3b0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;OrderSelector&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:152,&quot;column&quot;:13}}">
              <span className="text-[11px] font-mono" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-453df5b5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-453df5b5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;OrderSelector&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:153,&quot;column&quot;:15}}">{selected.order_id}</span>
              <span className="text-[10px] ml-2" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-915f2913" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-915f2913&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;OrderSelector&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:154,&quot;column&quot;:15}}">
                {selected.product} · {selected.store}
              </span>
            </div>
          ) : (
            <span className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-473df8db" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-473df8db&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;OrderSelector&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:159,&quot;column&quot;:13}}">选择测试订单...</span>
          )}
        </div>
        <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-5-ef8582eb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-ef8582eb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;OrderSelector&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:162,&quot;column&quot;:9}}"/>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-50 max-h-[240px] overflow-y-auto"
          style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}
         data-qoder-id="qel-absolute-d1ed7a2c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-d1ed7a2c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;OrderSelector&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:166,&quot;column&quot;:9}}">
          {ORDER_MOCK_DB.map(order => (
            <button
              key={order.order_id}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:opacity-80 transition-opacity"
              style={{ background: order.order_id === value ? 'var(--cursor-surface-500)' : 'transparent' }}
              onClick={() => { onChange(order.order_id); setOpen(false) }}
             data-qoder-id="qel-w-full-f1b09fa0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-f1b09fa0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;OrderSelector&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:171,&quot;column&quot;:13}}">
              <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-8b8a7eb2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-8b8a7eb2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;OrderSelector&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:177,&quot;column&quot;:15}}">
                <div className="flex items-center gap-2" data-qoder-id="qel-flex-f51aea4f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-f51aea4f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;OrderSelector&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:178,&quot;column&quot;:17}}">
                  <span className="text-[10px] font-mono" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-10px-945cef35" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-945cef35&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;OrderSelector&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:179,&quot;column&quot;:19}}">{order.order_id}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{
                    background: order.status === '制作中' ? 'rgba(243,156,18,0.12)' :
                                order.status === '待取餐' ? 'rgba(52,152,219,0.12)' :
                                order.status === '配送中' ? 'rgba(46,204,113,0.12)' :
                                'rgba(149,165,166,0.12)',
                    color: order.status === '制作中' ? '#e67e22' :
                           order.status === '待取餐' ? '#2980b9' :
                           order.status === '配送中' ? '#27ae60' : '#7f8c8d',
                  }} data-qoder-id="qel-text-9px-7cec1ce4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-7cec1ce4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;OrderSelector&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:180,&quot;column&quot;:19}}">
                    {order.status}
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-925cec0f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-925cec0f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;OrderSelector&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:192,&quot;column&quot;:17}}">
                  {order.product} · {order.store} · {order.time}
                </span>
              </div>
              {order.number > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(243,156,18,0.1)', color: '#e67e22' }} data-qoder-id="qel-text-9px-7eec200a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-7eec200a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;OrderSelector&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:197,&quot;column&quot;:17}}">
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
function ResultPanel({ result, matchedKeywords, ...qoderProps }) {
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
    <div className={["space-y-3", qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Intent Result Header */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-100)' }} data-qoder-id="qel-rounded-xl-3185cd28" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-xl-3185cd28&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;rounded-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:229,&quot;column&quot;:7}}">
        <div className="px-4 py-3 flex items-center gap-3" style={{ background: catColor.bg }} data-qoder-id="qel-px-4-49184d45" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-49184d45&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:230,&quot;column&quot;:9}}">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: catColor.text + '20', color: catColor.text }} data-qoder-id="qel-flex-277ade44" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-277ade44&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:231,&quot;column&quot;:11}}">
            <BranchIcon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }}  data-qoder-id="qel-h-4-5-4dd5bad9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-5-4dd5bad9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;h-4-5&quot;,&quot;loc&quot;:{&quot;line&quot;:232,&quot;column&quot;:13}}"/>
          </div>
          <div className="flex-1" data-qoder-id="qel-flex-1-5791aa10" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-5791aa10&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:234,&quot;column&quot;:11}}">
            <div className="flex items-center gap-2" data-qoder-id="qel-flex-247ad98b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-247ad98b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:235,&quot;column&quot;:13}}">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: catColor.text + '20', color: catColor.text }} data-qoder-id="qel-text-10px-89d5e7e3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-89d5e7e3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:236,&quot;column&quot;:15}}">
                {scene?.taxonomyCategory}{scene?.taxonomySubcategory}
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-0372723d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-0372723d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:239,&quot;column&quot;:15}}">{result.scene}</span>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-97375b5c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-97375b5c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:241,&quot;column&quot;:13}}">{scene?.description}</p>
          </div>
          <div className="flex items-center gap-1" data-qoder-id="qel-flex-207ad33f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-207ad33f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:243,&quot;column&quot;:11}}">
            <CheckCircle2 className="h-4 w-4" style={{ color: '#27ae60' }}  data-qoder-id="qel-h-4-add5b7cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-add5b7cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:244,&quot;column&quot;:13}}"/>
            <span className="text-[10px] font-medium" style={{ color: '#27ae60' }} data-qoder-id="qel-text-10px-06d2db13" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-06d2db13&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:245,&quot;column&quot;:13}}">匹配成功</span>
          </div>
        </div>

        {/* Matched Keywords */}
        {matchedKeywords.length > 0 && (
          <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-px-4-d810df9d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-d810df9d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:251,&quot;column&quot;:11}}">
            <div className="flex items-center gap-1.5 mb-1.5" data-qoder-id="qel-flex-20698a1e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-20698a1e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:252,&quot;column&quot;:13}}">
              <Tag className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-1135b99b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-1135b99b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:253,&quot;column&quot;:15}}"/>
              <span className="text-[10px] font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-0ad2e15f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-0ad2e15f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:254,&quot;column&quot;:15}}">命中关键词:</span>
            </div>
            <div className="flex flex-wrap gap-1.5" data-qoder-id="qel-flex-23698ed7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-23698ed7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:256,&quot;column&quot;:13}}">
              {matchedKeywords.map((m, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{
                  background: (CATEGORY_COLORS[m.cat]?.text || '#666') + '18',
                  color: CATEGORY_COLORS[m.cat]?.text || '#666',
                  border: `1px solid ${(CATEGORY_COLORS[m.cat]?.text || '#666')}30`,
                }} data-qoder-id="qel-text-10px-0cd2e485" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-0cd2e485&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:258,&quot;column&quot;:17}}">
                  "{m.kw}" → {m.scene}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Info + Compensation */}
      <div className="grid grid-cols-2 gap-2" data-qoder-id="qel-grid-6716f684" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-6716f684&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:272,&quot;column&quot;:7}}">
        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-200)' }} data-qoder-id="qel-rounded-lg-919ff2f2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-919ff2f2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:273,&quot;column&quot;:9}}">
          <div className="flex items-center gap-1.5 mb-2" data-qoder-id="qel-flex-17697bf3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-17697bf3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:274,&quot;column&quot;:11}}">
            <Database className="h-3.5 w-3.5" style={{ color: '#2980b9' }}  data-qoder-id="qel-h-3-5-e65313ea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-e65313ea&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:275,&quot;column&quot;:13}}"/>
            <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-c85fcd48" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-c85fcd48&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:276,&quot;column&quot;:13}}">订单信息</span>
          </div>
          <div className="space-y-1 text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-space-y-1-00d83612" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-00d83612&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;space-y-1&quot;,&quot;loc&quot;:{&quot;line&quot;:278,&quot;column&quot;:11}}">
            <div className="flex justify-between" data-qoder-id="qel-flex-216bca48" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-216bca48&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:279,&quot;column&quot;:13}}">
              <span data-qoder-id="qel-span-3ce07e3f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-3ce07e3f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:280,&quot;column&quot;:15}}">订单号</span>
              <span className="font-mono" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-font-mono-141e45c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-mono-141e45c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;font-mono&quot;,&quot;loc&quot;:{&quot;line&quot;:281,&quot;column&quot;:15}}">{result.order_id}</span>
            </div>
            <div className="flex justify-between" data-qoder-id="qel-flex-266bd227" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-266bd227&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:283,&quot;column&quot;:13}}">
              <span data-qoder-id="qel-span-3de07fd2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-3de07fd2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:284,&quot;column&quot;:15}}">状态</span>
              <span className="px-1.5 py-0.5 rounded" style={{
                background: result.order_status === '制作中' ? 'rgba(243,156,18,0.12)' :
                            result.order_status === '配送中' ? 'rgba(46,204,113,0.12)' :
                            'rgba(149,165,166,0.12)',
                color: result.order_status === '制作中' ? '#e67e22' :
                       result.order_status === '配送中' ? '#27ae60' : '#7f8c8d',
              }} data-qoder-id="qel-px-1-5-cbcb529b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-cbcb529b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:285,&quot;column&quot;:15}}">{result.order_status}</span>
            </div>
            {result.queue_number >= 0 && (
              <div className="flex justify-between" data-qoder-id="qel-flex-1b6bc0d6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1b6bc0d6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:294,&quot;column&quot;:15}}">
                <span data-qoder-id="qel-span-c6d908b8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c6d908b8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:295,&quot;column&quot;:17}}">前方排队</span>
                <span style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-span-c7d90a4b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c7d90a4b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:296,&quot;column&quot;:17}}">{result.queue_number} 单</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border p-3" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-200)' }} data-qoder-id="qel-rounded-lg-8f9b729e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-8f9b729e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:302,&quot;column&quot;:9}}">
          <div className="flex items-center gap-1.5 mb-2" data-qoder-id="qel-flex-296e1577" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-296e1577&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:303,&quot;column&quot;:11}}">
            {result.compensate ? <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#e67e22' }}  data-qoder-id="qel-h-3-5-6a8c47b4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-6a8c47b4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:304,&quot;column&quot;:34}}"/> : <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#27ae60' }}  data-qoder-id="qel-h-3-5-225745bb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-225745bb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:304,&quot;column&quot;:107}}"/>}
            <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-3d5836b2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-3d5836b2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:305,&quot;column&quot;:13}}">补偿决策</span>
          </div>
          <div className="space-y-1 text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-space-y-1-8ddfcfce" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-8ddfcfce&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;space-y-1&quot;,&quot;loc&quot;:{&quot;line&quot;:307,&quot;column&quot;:11}}">
            <div className="flex justify-between" data-qoder-id="qel-flex-226e0a72" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-226e0a72&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:308,&quot;column&quot;:13}}">
              <span data-qoder-id="qel-span-bfd8fdb3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-bfd8fdb3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:309,&quot;column&quot;:15}}">是否补偿</span>
              <span style={{ color: result.compensate ? '#e67e22' : '#27ae60' }} data-qoder-id="qel-span-ccdb50c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-ccdb50c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:310,&quot;column&quot;:15}}">{result.compensate ? '是' : '否'}</span>
            </div>
            {result.compensate && (
              <div className="flex justify-between" data-qoder-id="qel-flex-8f70f4a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-8f70f4a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:313,&quot;column&quot;:15}}">
                <span data-qoder-id="qel-span-cadb4d9b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-cadb4d9b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:314,&quot;column&quot;:17}}">补偿金额</span>
                <span className="font-bold" style={{ color: '#e67e22' }} data-qoder-id="qel-font-bold-95609f29" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-bold-95609f29&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;font-bold&quot;,&quot;loc&quot;:{&quot;line&quot;:315,&quot;column&quot;:17}}">¥{result.compensate_amount}</span>
              </div>
            )}
            {result.ticket && (
              <div className="flex justify-between" data-qoder-id="qel-flex-9470fc7f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-9470fc7f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:319,&quot;column&quot;:15}}">
                <span data-qoder-id="qel-span-cfdb557a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-cfdb557a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:320,&quot;column&quot;:17}}">工单</span>
                <span style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-span-cedb53e7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-cedb53e7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:321,&quot;column&quot;:17}}">{result.ticket}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generated Response */}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-200)' }} data-qoder-id="qel-rounded-lg-949db914" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-949db914&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:329,&quot;column&quot;:7}}">
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-flex-987102cb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-987102cb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:330,&quot;column&quot;:9}}">
          <div className="flex items-center gap-1.5" data-qoder-id="qel-flex-97710138" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-97710138&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:331,&quot;column&quot;:11}}">
            <MessageCircle className="h-3.5 w-3.5" style={{ color: '#f54e00' }}  data-qoder-id="qel-h-3-5-77ec5805" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-77ec5805&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:332,&quot;column&quot;:13}}"/>
            <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-4c7ae091" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-4c7ae091&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:333,&quot;column&quot;:13}}">生成回复</span>
          </div>
          <button
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors"
            style={{ background: copied ? 'rgba(39,174,96,0.12)' : 'var(--cursor-surface-400)', color: copied ? '#27ae60' : 'var(--cursor-border-55)' }}
            onClick={copyReply}
           data-qoder-id="qel-flex-474ad8bd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-474ad8bd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:335,&quot;column&quot;:11}}">
            {copied ? <CheckCircle2 className="h-3 w-3"  data-qoder-id="qel-h-3-56391e59" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-56391e59&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:340,&quot;column&quot;:23}}"/> : <Copy className="h-3 w-3"  data-qoder-id="qel-h-3-1efd5d15" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-1efd5d15&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:340,&quot;column&quot;:62}}"/>}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <div className="px-3 py-2.5" data-qoder-id="qel-px-3-b4a074c2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-b4a074c2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:344,&quot;column&quot;:9}}">
          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--cursor-ink)', whiteSpace: 'pre-wrap' }} data-qoder-id="qel-text-12px-204c0f0f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-12px-204c0f0f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;text-12px&quot;,&quot;loc&quot;:{&quot;line&quot;:345,&quot;column&quot;:11}}">{result.output}</p>
        </div>
      </div>

      {/* Execution Trace */}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-200)' }} data-qoder-id="qel-rounded-lg-04961a9f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-04961a9f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:350,&quot;column&quot;:7}}">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-flex-9e5fc31c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-9e5fc31c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:351,&quot;column&quot;:9}}">
          <Zap className="h-3.5 w-3.5" style={{ color: '#f54e00' }}  data-qoder-id="qel-h-3-5-937f0dee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-937f0dee&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:352,&quot;column&quot;:11}}"/>
          <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-d17df087" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-d17df087&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:353,&quot;column&quot;:11}}">执行链路追踪</span>
          <span className="text-[10px] ml-auto" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-89c6dd59" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-89c6dd59&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:354,&quot;column&quot;:11}}">
            {activeNodes.length} 完成 · {skippedNodes.length} 跳过
          </span>
        </div>
        <div className="px-3 py-3" data-qoder-id="qel-px-3-2d9d61a6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-2d9d61a6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:358,&quot;column&quot;:9}}">
          {/* Active trace flow */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3" data-qoder-id="qel-flex-a9621304" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a9621304&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:360,&quot;column&quot;:11}}">
            {activeNodes.map((node, i) => (
              <div key={i} className="flex items-center gap-1.5" data-qoder-id="qel-flex-a8621171" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a8621171&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:362,&quot;column&quot;:15}}">
                <TraceNode node={node} isActive={true}  data-qoder-id="qel-tracenode-a75640e4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tracenode-a75640e4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;tracenode&quot;,&quot;loc&quot;:{&quot;line&quot;:363,&quot;column&quot;:17}}"/>
                {i < activeNodes.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-5-871e50f8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-871e50f8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:365,&quot;column&quot;:19}}"/>
                )}
              </div>
            ))}
          </div>

          {/* Skipped branches (collapsed) */}
          {skippedNodes.length > 0 && (
            <div data-qoder-id="qel-div-47cd3f32" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-47cd3f32&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:373,&quot;column&quot;:13}}">
              <div className="flex items-center gap-1.5 mb-1.5" data-qoder-id="qel-flex-a4620b25" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a4620b25&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:374,&quot;column&quot;:15}}">
                <XCircle className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-66fcc30c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-66fcc30c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:375,&quot;column&quot;:17}}"/>
                <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-3df22cba" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-3df22cba&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:376,&quot;column&quot;:17}}">
                  跳过分支 ({skippedNodes.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1" data-qoder-id="qel-flex-c102a89c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c102a89c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:380,&quot;column&quot;:15}}">
                {skippedNodes.map((node, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full line-through" style={{
                    background: 'var(--cursor-surface-400)',
                    color: 'var(--cursor-border-55)',
                  }} data-qoder-id="qel-text-9px-635979f2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-635979f2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;ResultPanel&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:382,&quot;column&quot;:19}}">
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
export default function IntentTestBench(qoderProps) {
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
    <div className={["h-full overflow-y-auto", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ background: 'var(--cursor-canvas)' }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)' }} data-qoder-id="qel-px-4-ddf701e6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-ddf701e6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:462,&quot;column&quot;:7}}">
        <div className="flex items-center justify-between" data-qoder-id="qel-flex-1ffa52e7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1ffa52e7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:463,&quot;column&quot;:9}}">
          <div data-qoder-id="qel-div-32af7b26" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-32af7b26&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:464,&quot;column&quot;:11}}">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-cd1aa0bb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-cd1aa0bb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:465,&quot;column&quot;:13}}">
              <Zap className="h-4 w-4" style={{ color: '#f54e00' }}  data-qoder-id="qel-h-4-3435497e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-3435497e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:466,&quot;column&quot;:15}}"/>
              意图路由测试台
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-b548229f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-b548229f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:469,&quot;column&quot;:13}}">
              实时测试 9 路意图分支 · 关键词匹配 + 优先级路由 · 执行链路追踪
            </p>
          </div>
          <div className="flex items-center gap-2" data-qoder-id="qel-flex-20fc9311" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-20fc9311&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:473,&quot;column&quot;:11}}">
            {history.length > 0 && (
              <button
                className="text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors"
                style={{ background: showHistory ? 'var(--cursor-surface-500)' : 'var(--cursor-surface-300)', color: showHistory ? 'var(--cursor-ink)' : 'var(--cursor-border-55)' }}
                onClick={() => setShowHistory(!showHistory)}
               data-qoder-id="qel-text-10px-40bf534b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-40bf534b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:475,&quot;column&quot;:15}}">
                <Clock className="h-3 w-3"  data-qoder-id="qel-h-3-0a1f6a39" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-0a1f6a39&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:480,&quot;column&quot;:17}}"/>
                历史 ({history.length})
              </button>
            )}
            <button
              className="text-[10px] px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
              style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-border-55)' }}
              onClick={reset}
             data-qoder-id="qel-text-10px-42bf5671" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-42bf5671&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:484,&quot;column&quot;:13}}">
              <RotateCcw className="h-3 w-3"  data-qoder-id="qel-h-3-d2b0e907" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-d2b0e907&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:489,&quot;column&quot;:15}}"/>
              重置
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4" data-qoder-id="qel-p-4-17033ecc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-4-17033ecc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;p-4&quot;,&quot;loc&quot;:{&quot;line&quot;:496,&quot;column&quot;:7}}">
        {/* Quick Test Buttons */}
        <div data-qoder-id="qel-div-b4b28663" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-b4b28663&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:498,&quot;column&quot;:9}}">
          <div className="flex items-center gap-1.5 mb-2" data-qoder-id="qel-flex-21fc94a4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-21fc94a4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:499,&quot;column&quot;:11}}">
            <Star className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-e39e6897" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-e39e6897&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:500,&quot;column&quot;:13}}"/>
            <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-930bf06c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-930bf06c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:501,&quot;column&quot;:13}}">快捷测试</span>
          </div>
          <div className="flex flex-wrap gap-1.5" data-qoder-id="qel-flex-a6ffa49a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a6ffa49a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:503,&quot;column&quot;:11}}">
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
                 data-qoder-id="qel-text-10px-b0c6bf60" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-b0c6bf60&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:507,&quot;column&quot;:17}}">
                  {qt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Scenario Presets */}
        <div data-qoder-id="qel-div-beb4d4b8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-beb4d4b8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:525,&quot;column&quot;:9}}">
          <div className="flex items-center gap-1.5 mb-2" data-qoder-id="qel-flex-a5ffa307" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a5ffa307&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:526,&quot;column&quot;:11}}">
            <Layers className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-9fa9b366" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-9fa9b366&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:527,&quot;column&quot;:13}}"/>
            <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-07045843" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-07045843&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:528,&quot;column&quot;:13}}">预置场景（含对话上下文）</span>
          </div>
          <div className="flex flex-wrap gap-1.5" data-qoder-id="qel-flex-a0ff9b28" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a0ff9b28&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:530,&quot;column&quot;:11}}">
            {ORDER_WORKFLOW_SCENARIOS.map((sc, i) => (
              <button
                key={sc.id}
                className="text-[10px] px-2 py-1 rounded-lg transition-colors flex items-center gap-1.5 border"
                style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-200)', color: 'var(--cursor-ink)' }}
                onClick={() => loadScenario(sc)}
               data-qoder-id="qel-text-10px-b6c6c8d2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-b6c6c8d2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:532,&quot;column&quot;:15}}">
                <span className="px-1 py-0 rounded text-[9px] font-mono" style={{ background: 'var(--cursor-surface-400)' }} data-qoder-id="qel-px-1-1cde21d0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-1cde21d0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;px-1&quot;,&quot;loc&quot;:{&quot;line&quot;:538,&quot;column&quot;:17}}">#{i + 1}</span>
                {sc.scene}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-100)' }} data-qoder-id="qel-rounded-xl-0e1f576a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-xl-0e1f576a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;rounded-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:546,&quot;column&quot;:9}}">
          <div className="p-3 space-y-2.5" data-qoder-id="qel-p-3-f934d700" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-3-f934d700&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;p-3&quot;,&quot;loc&quot;:{&quot;line&quot;:547,&quot;column&quot;:11}}">
            {/* Order Selector */}
            <OrderSelector value={orderId} onChange={setOrderId}  data-qoder-id="qel-orderselector-1526cd28" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-orderselector-1526cd28&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;orderselector&quot;,&quot;loc&quot;:{&quot;line&quot;:549,&quot;column&quot;:13}}"/>

            {/* User Input */}
            <div data-qoder-id="qel-div-c8b7230d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c8b7230d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:552,&quot;column&quot;:13}}">
              <label className="text-[10px] font-medium mb-1 block" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-6f07ecbb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-6f07ecbb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:553,&quot;column&quot;:15}}">顾客消息</label>
              <div className="flex gap-2" data-qoder-id="qel-flex-9101c08f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-9101c08f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:554,&quot;column&quot;:15}}">
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
                 data-qoder-id="qel-flex-1-1f56fbc3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-1f56fbc3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:555,&quot;column&quot;:17}}"/>
                <button
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-medium text-white transition-opacity"
                  style={{ background: '#f54e00', opacity: userInput.trim() && !isRunning ? 1 : 0.5 }}
                  onClick={runTest}
                  disabled={!userInput.trim() || isRunning}
                 data-qoder-id="qel-flex-5f518fd2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-5f518fd2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:570,&quot;column&quot;:17}}">
                  {isRunning ? (
                    <Clock className="h-3.5 w-3.5 animate-spin"  data-qoder-id="qel-h-3-5-188e5efe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-188e5efe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:577,&quot;column&quot;:21}}"/>
                  ) : (
                    <Play className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-8ed95485" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-8ed95485&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:579,&quot;column&quot;:21}}"/>
                  )}
                  执行
                </button>
              </div>
            </div>

            {/* Conversation Context (optional) */}
            <div data-qoder-id="qel-div-bdb711bc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-bdb711bc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:587,&quot;column&quot;:13}}">
              <label className="text-[10px] font-medium mb-1 block" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-71fb2581" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-71fb2581&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:588,&quot;column&quot;:15}}">对话上下文（可选）</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border text-[11px] outline-none resize-none"
                style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-200)', color: 'var(--cursor-ink)' }}
                rows={2}
                placeholder="粘贴历史对话上下文，如：&#10;顾客: 你好&#10;客服: 您好，请问有什么可以帮您？&#10;顾客: 我的订单..."
                value={conversation}
                onChange={(e) => setConversation(e.target.value)}
               data-qoder-id="qel-w-full-5c5c5204" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-5c5c5204&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:589,&quot;column&quot;:15}}"/>
            </div>
          </div>
        </div>

        {/* Live Keyword Preview */}
        {userInput.trim() && (
          <div className="rounded-lg border p-3" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-200)' }} data-qoder-id="qel-rounded-lg-e779b2b4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-e779b2b4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:603,&quot;column&quot;:11}}">
            <div className="flex items-center gap-1.5 mb-2" data-qoder-id="qel-flex-96040705" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-96040705&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:604,&quot;column&quot;:13}}">
              <Tag className="h-3 w-3" style={{ color: '#f54e00' }}  data-qoder-id="qel-h-3-75c8851c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-75c8851c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:605,&quot;column&quot;:15}}"/>
              <span className="text-[10px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-10px-bdce4836" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-bdce4836&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:606,&quot;column&quot;:15}}">实时关键词检测</span>
            </div>
            <div className="flex flex-wrap gap-1.5" data-qoder-id="qel-flex-9103ff26" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-9103ff26&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:608,&quot;column&quot;:13}}">
              {(() => {
                const matches = highlightKeywords(userInput + ' ' + conversation, ORDER_INTENT_SCENES)
                if (matches.length === 0) {
                  return <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-bbce4510" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-bbce4510&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:612,&quot;column&quot;:26}}">未检测到触发关键词，将路由至"其他"</span>
                }
                return matches.map((m, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{
                    background: (CATEGORY_COLORS[m.cat]?.text || '#666') + '18',
                    color: CATEGORY_COLORS[m.cat]?.text || '#666',
                    border: `1px solid ${(CATEGORY_COLORS[m.cat]?.text || '#666')}30`,
                  }} data-qoder-id="qel-text-10px-cace5cad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-cace5cad&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:615,&quot;column&quot;:19}}">
                    "{m.kw}" → {CATEGORY_COLORS[m.cat]?.label}/{m.scene}
                  </span>
                ))
              })()}
            </div>
          </div>
        )}

        {/* Results */}
        {result && <ResultPanel result={result} matchedKeywords={matchedKeywords}  data-qoder-id="qel-resultpanel-5b44e87f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-resultpanel-5b44e87f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;resultpanel&quot;,&quot;loc&quot;:{&quot;line&quot;:629,&quot;column&quot;:20}}"/>}

        {/* History */}
        {showHistory && history.length > 0 && (
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-200)' }} data-qoder-id="qel-rounded-lg-cf7bcb83" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-cf7bcb83&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:633,&quot;column&quot;:11}}">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-flex-18071242" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-18071242&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:634,&quot;column&quot;:13}}">
              <Clock className="h-3.5 w-3.5" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-5-9580193b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-9580193b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:635,&quot;column&quot;:15}}"/>
              <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-05021686" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-05021686&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:636,&quot;column&quot;:15}}">测试历史</span>
            </div>
            <div className="max-h-[200px] overflow-y-auto" data-qoder-id="qel-max-h-200px-ad80c64e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-max-h-200px-ad80c64e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;max-h-200px&quot;,&quot;loc&quot;:{&quot;line&quot;:638,&quot;column&quot;:13}}">
              {history.map((h, i) => (
                <button
                  key={h.id}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:opacity-80 transition-opacity border-b last:border-b-0"
                  style={{ borderColor: 'var(--cursor-border-10)' }}
                  onClick={() => { setUserInput(h.input); setOrderId(h.orderId) }}
                 data-qoder-id="qel-w-full-80c99f27" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-80c99f27&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:640,&quot;column&quot;:17}}">
                  <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-3acb3b66" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-3acb3b66&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:646,&quot;column&quot;:19}}">{h.timestamp}</span>
                  <span className="text-[10px] flex-1 truncate" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-10px-3bcb3cf9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-3bcb3cf9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:647,&quot;column&quot;:19}}">{h.input}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{
                    background: 'var(--cursor-surface-400)',
                    color: 'var(--cursor-ink)',
                  }} data-qoder-id="qel-text-9px-67d95260" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-67d95260&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:648,&quot;column&quot;:19}}">
                    {h.scene}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Intent Coverage Map */}
        <div className="rounded-xl border p-4" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-100)' }} data-qoder-id="qel-rounded-xl-8e17d225" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-xl-8e17d225&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;rounded-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:661,&quot;column&quot;:9}}">
          <h3 className="text-[11px] font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-9c33d351" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-9c33d351&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:662,&quot;column&quot;:11}}">
            <GitBranch className="h-3.5 w-3.5" style={{ color: '#f54e00' }}  data-qoder-id="qel-h-3-5-7b77663b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-7b77663b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:663,&quot;column&quot;:13}}"/>
            9 路意图分支覆盖图
          </h3>
          <div className="grid grid-cols-3 gap-2" data-qoder-id="qel-grid-7e9eb0ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-7e9eb0ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:666,&quot;column&quot;:11}}">
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
                 data-qoder-id="qel-flex-f45db354" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-f45db354&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:672,&quot;column&quot;:17}}">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0" style={{
                    background: catColor.text + '15',
                    color: catColor.text,
                  }} data-qoder-id="qel-flex-2309622a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-2309622a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:686,&quot;column&quot;:19}}">
                    <BranchIcon className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-04474520" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-04474520&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:690,&quot;column&quot;:21}}"/>
                  </div>
                  <div className="min-w-0 flex-1" data-qoder-id="qel-min-w-0-58f67ab6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-min-w-0-58f67ab6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;min-w-0&quot;,&quot;loc&quot;:{&quot;line&quot;:692,&quot;column&quot;:19}}">
                    <div className="flex items-center gap-1" data-qoder-id="qel-flex-22096097" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-22096097&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:693,&quot;column&quot;:21}}">
                      <span className="text-[9px] font-mono" style={{ color: catColor.text }} data-qoder-id="qel-text-9px-e9e0dacb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-e9e0dacb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:694,&quot;column&quot;:23}}">{scene.taxonomyCategory}{scene.taxonomySubcategory}</span>
                      {tested && <CheckCircle2 className="h-3 w-3" style={{ color: '#27ae60' }}  data-qoder-id="qel-h-3-af6ba951" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-af6ba951&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:695,&quot;column&quot;:34}}"/>}
                    </div>
                    <p className="text-[10px] font-medium truncate" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-10px-caf4d200" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-caf4d200&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:697,&quot;column&quot;:21}}">{scene.name}</p>
                    <p className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-f63b33fb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-f63b33fb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTestBench.jsx&quot;,&quot;componentName&quot;:&quot;IntentTestBench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:698,&quot;column&quot;:21}}">P{scene.priority} · {scene.triggerKeywords.length} 关键词</p>
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
