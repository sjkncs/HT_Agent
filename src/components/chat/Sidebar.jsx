import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus, Search, MessageSquare, Clock, AlertTriangle, Users,
  Bug, Leaf, HeartPulse, AlertCircle, Package, CupSoda, Flame
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { cn } from '../../lib/utils.js'
import { MOCK_CONVERSATIONS, MOCK_SESSIONS } from '../../lib/mock-data.js'

function groupByTime(conversations) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today - 86400000)
  const weekAgo = new Date(today - 7 * 86400000)

  const groups = { today: [], yesterday: [], week: [], older: [] }

  conversations.forEach((conv) => {
    const d = new Date(conv.timestamp)
    if (d >= today) groups.today.push(conv)
    else if (d >= yesterday) groups.yesterday.push(conv)
    else if (d >= weekAgo) groups.week.push(conv)
    else groups.older.push(conv)
  })

  return groups
}

const GROUP_LABELS = {
  today: '今天',
  yesterday: '昨天',
  week: '最近 7 天',
  older: '更早',
}

// 风险等级筛选
const RISK_FILTERS = [
  { key: '', label: '全部风险', dotColor: 'var(--cursor-border-55)' },
  { key: 'high', label: '高风险', dotColor: '#cf2d56' },
  { key: 'medium', label: '中风险', dotColor: '#c08532' },
  { key: 'low', label: '低风险', dotColor: '#1f8a65' },
]

// 会话分类筛选（含图标 + 层级匹配）
const CATEGORY_ICON_MAP = {
  '外源性异物': Bug, '内源性异物': Leaf, '身体不适': HeartPulse,
  '品质问题': AlertCircle, 'OEM产品': Package, '非食安问题': CupSoda,
  '情绪激动': Flame,
}
const CATEGORY_FILTERS = [
  { key: '', label: '全部' },
  { key: '外源性异物', label: '外源性异物' },
  { key: '内源性异物', label: '内源性异物' },
  { key: '身体不适', label: '身体不适' },
  { key: '品质问题', label: '品质问题', matchLabels: ['饮品异味', '原料变质', '原料未熟', '产品有效期'] },
  { key: 'OEM产品', label: 'OEM产品', matchLabels: ['OEM'] },
  { key: '非食安问题', label: '非食安' },
  { key: '情绪激动', label: '情绪激动' },
]

// 智能标签匹配：支持层级路径 + 分类字段 + 自定义匹配集
function matchConversation(conv, categoryKey, riskKey) {
  if (riskKey && conv.riskLevel !== riskKey) return false
  if (!categoryKey) return true
  const cat = CATEGORY_FILTERS.find(c => c.key === categoryKey)
  if (!cat) return true
  const label = conv.label || ''
  const classification = conv.classification?.consult_type || ''
  const matchSet = [categoryKey, ...(cat.matchLabels || [])]
  return matchSet.some(m =>
    label.startsWith(m) || label.includes('/' + m) ||
    label.includes(m) || classification.includes(m)
  )
}

const RISK_DOT_STYLE = {
  high: { background: '#cf2d56' },
  medium: { background: '#c08532' },
  low: { background: '#1f8a65' },
}

const SESSION_STATE_DOT = {
  active: { background: '#1f8a65' },
  queue: { background: '#c08532' },
  handoff: { background: '#4b7bec' },
  resolved: { background: 'var(--cursor-border-55)' },
  closed: { background: 'var(--cursor-border-55)', opacity: 0.5 },
}

export default function Sidebar({ open, onClose, role = 'staff' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLabel, setFilterLabel] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [viewMode, setViewMode] = useState('conversations') // conversations | sessions

  // Reset to conversations view when role switches to consumer
  useEffect(() => {
    if (role === 'consumer') {
      setViewMode('conversations')
    }
  }, [role])

  const groups = groupByTime(MOCK_CONVERSATIONS)

  // Filter conversations with smart category + risk matching
  const filtered = Object.entries(groups).reduce((acc, [key, convs]) => {
    let items = convs
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q)
      )
    }
    if (filterLabel || riskFilter) {
      items = items.filter((c) => matchConversation(c, filterLabel, riskFilter))
    }
    acc[key] = items
    return acc
  }, {})

  // Dynamic counts per filter dimension
  const categoryCounts = CATEGORY_FILTERS.map(cat => ({
    ...cat,
    count: MOCK_CONVERSATIONS.filter(c => matchConversation(c, cat.key, riskFilter)).length,
  }))
  const riskCounts = RISK_FILTERS.map(r => ({
    ...r,
    count: MOCK_CONVERSATIONS.filter(c => matchConversation(c, filterLabel, r.key)).length,
  }))

  // Filter sessions for 七鱼 view
  const filteredSessions = MOCK_SESSIONS.filter(s => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return s.sessionId.toLowerCase().includes(q) ||
        (s.classification && s.classification.toLowerCase().includes(q))
    }
    return true
  })

  const hasAnyResults = Object.values(filtered).some((arr) => arr.length > 0)

  const handleSelect = (id) => {
    navigate(`/chat/${id}`)
    if (window.innerWidth < 1024) onClose?.()
  }

  const handleNew = () => {
    navigate('/')
    if (window.innerWidth < 1024) onClose?.()
  }

  // Stats for 七鱼 sessions
  const activeSessions = MOCK_SESSIONS.filter(s => s.session_state === 'active').length
  const queueSessions = MOCK_SESSIONS.filter(s => s.session_state === 'queue').length
  const highRiskSessions = MOCK_SESSIONS.filter(s => s.risk_level === 'high').length

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
         data-qoder-id="qel-fixed-07af3d26" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-fixed-07af3d26&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;fixed&quot;,&quot;loc&quot;:{&quot;line&quot;:117,&quot;column&quot;:9}}"/>
      )}

      <aside
        className={cn(
          'z-40 flex flex-col transition-transform duration-300',
          'lg:relative lg:translate-x-0 lg:z-auto lg:h-full lg:top-auto lg:bottom-auto',
          open
            ? 'fixed inset-y-14 left-0 w-[280px] translate-x-0 shadow-lg lg:shadow-none'
            : 'fixed -translate-x-full lg:w-[280px] lg:translate-x-0'
        )}
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--cursor-surface-400)',
          borderRight: '1px solid var(--cursor-border-10)',
        }}
        data-component="sidebar"
       data-qoder-id="qel-sidebar-9f67231e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sidebar-9f67231e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;sidebar&quot;,&quot;loc&quot;:{&quot;line&quot;:123,&quot;column&quot;:7}}">
        {/* New chat button */}
        <div className="px-3 pt-2 pb-1" data-qoder-id="qel-px-3-f1b848e0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-f1b848e0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:139,&quot;column&quot;:9}}">
          <Button
            onClick={handleNew}
            className="w-full gap-2"
           data-qoder-id="qel-w-full-a2df3eb1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-a2df3eb1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:140,&quot;column&quot;:11}}">
            <Plus className="h-4 w-4"  data-qoder-id="qel-h-4-86eaaf56" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-86eaaf56&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:144,&quot;column&quot;:13}}"/>
            新对话
          </Button>
        </div>

        {/* View mode toggle — only show sessions tab for staff */}
        <div className="mx-3 mb-2 flex gap-1 rounded-lg p-0.5" style={{
          border: '1px solid var(--cursor-border-10)',
          background: 'var(--cursor-surface-300)',
        }} data-qoder-id="qel-mx-3-4ec44fd6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mx-3-4ec44fd6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;mx-3&quot;,&quot;loc&quot;:{&quot;line&quot;:150,&quot;column&quot;:9}}">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => setViewMode('conversations')}
            style={{
              background: viewMode === 'conversations' ? 'var(--cursor-surface-500)' : 'transparent',
              color: viewMode === 'conversations' ? 'var(--cursor-ink)' : 'var(--cursor-border-55)',
            }}
           data-qoder-id="qel-flex-1-739e0780" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-739e0780&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:154,&quot;column&quot;:11}}">
            <MessageSquare className="h-3 w-3"  data-qoder-id="qel-h-3-758af708" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-758af708&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:164,&quot;column&quot;:13}}"/>
            对话
          </Button>
          {role === 'staff' && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => setViewMode('sessions')}
              style={{
                background: viewMode === 'sessions' ? 'var(--cursor-surface-500)' : 'transparent',
                color: viewMode === 'sessions' ? 'var(--cursor-ink)' : 'var(--cursor-border-55)',
              }}
             data-qoder-id="qel-flex-1-819e1d8a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-819e1d8a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:168,&quot;column&quot;:13}}">
              <Users className="h-3 w-3"  data-qoder-id="qel-h-3-fc0bb549" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-fc0bb549&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:178,&quot;column&quot;:15}}"/>
              七鱼会话
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="px-3 pb-2" data-qoder-id="qel-px-3-e21ffa95" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-e21ffa95&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:185,&quot;column&quot;:9}}">
          <div className="relative" data-qoder-id="qel-relative-7a9ca8f8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-relative-7a9ca8f8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;relative&quot;,&quot;loc&quot;:{&quot;line&quot;:186,&quot;column&quot;:11}}">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-absolute-70658723" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-70658723&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:187,&quot;column&quot;:13}}"/>
            <input
              type="text"
              placeholder={viewMode === 'sessions' ? '搜索会话...' : '搜索对话...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg py-2 pl-9 pr-3 text-sm"
              style={{
                border: '1px solid var(--cursor-border-10)',
                background: 'var(--cursor-cream)',
                color: 'var(--cursor-ink)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--cursor-orange)'
                e.target.style.boxShadow = '0 0 0 2px rgba(245, 78, 0, 0.12)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--cursor-border-10)'
                e.target.style.boxShadow = 'none'
              }}
             data-qoder-id="qel-w-full-90eefb22" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-90eefb22&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:188,&quot;column&quot;:13}}"/>
          </div>
        </div>

        {/* Filters */}
        {viewMode === 'conversations' ? (
          <div className="px-3 pb-3 space-y-2" data-component="sidebar-filters">
            {/* 风险等级筛选 */}
            <div className="flex flex-wrap gap-1" data-component="risk-filters">
              {riskCounts.map((r) => (
                <button
                  key={r.key || 'all-risk'}
                  onClick={() => setRiskFilter(r.key)}
                  className="flex items-center gap-1 rounded-full text-[10px] transition-all"
                  style={{
                    padding: '2px 7px',
                    background: riskFilter === r.key ? 'var(--cursor-surface-500)' : 'var(--cursor-surface-300)',
                    color: riskFilter === r.key ? 'var(--cursor-ink)' : 'var(--cursor-border-55)',
                    border: `1px solid ${riskFilter === r.key ? r.dotColor : 'transparent'}`,
                  }}
                >
                  <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: r.dotColor }} />
                  {r.label}
                  <span style={{ opacity: 0.6, fontSize: '9px' }}>{r.count}</span>
                </button>
              ))}
            </div>
            {/* 会话分类筛选 */}
            <div className="flex flex-wrap gap-1" data-component="category-filters">
              {categoryCounts.map((cat) => {
                const IconComp = CATEGORY_ICON_MAP[cat.key]
                const isActive = filterLabel === cat.key
                return (
                  <button
                    key={cat.key || 'all-cat'}
                    onClick={() => setFilterLabel(cat.key)}
                    className="flex items-center gap-1 rounded-full text-[10px] transition-all"
                    style={{
                      padding: '2px 7px',
                      background: isActive ? 'var(--cursor-surface-500)' : 'var(--cursor-surface-300)',
                      color: isActive ? 'var(--cursor-orange)' : 'var(--cursor-border-55)',
                    }}
                  >
                    {IconComp && <IconComp className="h-2.5 w-2.5" />}
                    {cat.label}
                    <span style={{ opacity: 0.6, fontSize: '9px' }}>{cat.count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* 七鱼 session quick stats */
          <div className="flex items-center gap-2 px-3 pb-3">
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--cursor-success)' }}>
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: '#1f8a65' }} />
              {activeSessions} 对话中
            </span>
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--cursor-gold)' }}>
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: '#c08532' }} />
              {queueSessions} 排队
            </span>
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--cursor-error)' }}>
              <AlertTriangle className="h-2.5 w-2.5" />
              {highRiskSessions} 高风险
            </span>
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-4" data-qoder-id="qel-flex-1-0478ec3a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-0478ec3a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:254,&quot;column&quot;:9}}">
          {viewMode === 'conversations' ? (
            <>
              {!hasAnyResults && (
                <div className="flex flex-col items-center justify-center py-12 text-center" data-qoder-id="qel-flex-fb9b106b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-fb9b106b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:258,&quot;column&quot;:17}}">
                  <MessageSquare className="mb-3 h-8 w-8" style={{ color: 'var(--cursor-border-20)' }}  data-qoder-id="qel-mb-3-0b108bad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-3-0b108bad&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;mb-3&quot;,&quot;loc&quot;:{&quot;line&quot;:259,&quot;column&quot;:19}}"/>
                  <p className="text-sm" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-sm-885a1849" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-885a1849&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:260,&quot;column&quot;:19}}">
                    {searchQuery ? '没有找到匹配的对话' : '暂无历史对话'}
                  </p>
                </div>
              )}

              {Object.entries(filtered).map(([group, convs]) => {
                if (convs.length === 0) return null
                return (
                  <div key={group} className="mb-4" data-qoder-id="qel-mb-4-0ed0780f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-0ed0780f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:269,&quot;column&quot;:19}}">
                    <div className="flex items-center gap-2 px-2 py-1.5" data-qoder-id="qel-flex-f79b0a1f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-f79b0a1f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:270,&quot;column&quot;:21}}">
                      <Clock className="h-3 w-3" style={{ color: 'var(--cursor-border-55)', opacity: 0.6 }}  data-qoder-id="qel-h-3-dcdad25d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-dcdad25d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:271,&quot;column&quot;:23}}"/>
                      <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-753e9a40" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-753e9a40&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:272,&quot;column&quot;:23}}">
                        {GROUP_LABELS[group]}
                      </span>
                    </div>
                    {convs.map((conv) => {
                      const isActive = location.pathname === `/chat/${conv.id}`
                      return (
                        <Button
                          variant="ghost"
                          key={conv.id}
                          onClick={() => handleSelect(conv.id)}
                          className={cn(
                            'sidebar-item w-full text-left mb-0.5 justify-start h-auto',
                            isActive && 'active'
                          )}
                         data-qoder-id="qel-button-d874706d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-d874706d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:279,&quot;column&quot;:25}}">
                          <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-077b2f8a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-077b2f8a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:288,&quot;column&quot;:27}}">
                            <div className="flex items-center gap-2" data-qoder-id="qel-flex-809e2061" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-809e2061&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:289,&quot;column&quot;:29}}">
                              <div
                                className="h-2 w-2 rounded-full flex-shrink-0"
                                style={RISK_DOT_STYLE[conv.riskLevel]}
                               data-qoder-id="qel-h-2-57d945c8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-57d945c8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:290,&quot;column&quot;:31}}"/>
                              <span className="truncate text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-truncate-bce9a1d7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-truncate-bce9a1d7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;truncate&quot;,&quot;loc&quot;:{&quot;line&quot;:294,&quot;column&quot;:31}}">
                                {conv.title}
                              </span>
                              {/* Session state indicator */}
                              {conv.session_state && (
                                <div
                                  className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                                  style={SESSION_STATE_DOT[conv.session_state] || {}}
                                 data-qoder-id="qel-h-1-5-45219827" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-1-5-45219827&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;h-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:299,&quot;column&quot;:33}}"/>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-xs pl-4" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-0-5-19536e29" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-19536e29&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:305,&quot;column&quot;:29}}">
                              {conv.lastMessage}
                            </p>
                            {/* Extra meta info */}
                            {conv.handler && (
                              <div className="mt-0.5 flex items-center gap-2 pl-4" data-qoder-id="qel-mt-0-5-b2a04225" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-b2a04225&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:310,&quot;column&quot;:31}}">
                                <span className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-dbdbd8cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-dbdbd8cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:311,&quot;column&quot;:33}}">
                                  {conv.handler === 'AI' ? '阿喜AI' : conv.handler}
                                </span>
                                {conv.label && (
                                  <span className="rounded text-[8px] px-1 py-px" style={{
                                    background: 'var(--cursor-surface-300)',
                                    color: 'var(--cursor-border-55)',
                                  }}>
                                    {conv.label.split('/').pop()}
                                  </span>
                                )}
                                {conv.turn_count && (
                                  <span className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-dadbd73c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-dadbd73c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:315,&quot;column&quot;:35}}">
                                    {conv.turn_count}轮
                                  </span>
                                )}
                                {conv.sla_status === 'warning' && (
                                  <AlertTriangle className="h-2.5 w-2.5" style={{ color: 'var(--cursor-gold)' }}  data-qoder-id="qel-h-2-5-310e70e3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-310e70e3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:320,&quot;column&quot;:35}}"/>
                                )}
                              </div>
                            )}
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                )
              })}
            </>
          ) : (
            /* 七鱼 sessions list */
            <>
              {filteredSessions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center" data-qoder-id="qel-flex-f196837f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-f196837f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:336,&quot;column&quot;:17}}">
                  <Users className="mb-3 h-8 w-8" style={{ color: 'var(--cursor-border-20)' }}  data-qoder-id="qel-mb-3-26923f01" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-3-26923f01&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;mb-3&quot;,&quot;loc&quot;:{&quot;line&quot;:337,&quot;column&quot;:19}}"/>
                  <p className="text-sm" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-sm-1a54edf1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-1a54edf1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:338,&quot;column&quot;:19}}">
                    没有匹配的会话
                  </p>
                </div>
              )}
              {filteredSessions.map((session) => (
                <Button
                  variant="ghost"
                  key={session.sessionId}
                  onClick={() => navigate('/qiyu')}
                  className="sidebar-item w-full text-left mb-0.5 justify-start h-auto"
                 data-qoder-id="qel-sidebar-item-9e6a677a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sidebar-item-9e6a677a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;sidebar-item&quot;,&quot;loc&quot;:{&quot;line&quot;:344,&quot;column&quot;:17}}">
                  <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-0369e01d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-0369e01d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:350,&quot;column&quot;:19}}">
                    <div className="flex items-center gap-2" data-qoder-id="qel-flex-fa9691aa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-fa9691aa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:351,&quot;column&quot;:21}}">
                      <div
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={SESSION_STATE_DOT[session.session_state] || {}}
                       data-qoder-id="qel-h-2-4bc7e9c3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-4bc7e9c3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:352,&quot;column&quot;:23}}"/>
                      <span className="truncate text-xs font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-truncate-bef8af87" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-truncate-bef8af87&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;truncate&quot;,&quot;loc&quot;:{&quot;line&quot;:356,&quot;column&quot;:23}}">
                        {session.sessionId}
                      </span>
                      {session.risk_level === 'high' && (
                        <AlertTriangle className="h-2.5 w-2.5 flex-shrink-0" style={{ color: 'var(--cursor-error)' }}  data-qoder-id="qel-h-2-5-ae0b6413" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-ae0b6413&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:360,&quot;column&quot;:25}}"/>
                      )}
                    </div>
                    {session.classification && (
                      <p className="mt-0.5 truncate text-[10px] pl-4" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-0-5-27628ebd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-27628ebd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:364,&quot;column&quot;:23}}">
                        {session.classification.split('/').pop()}
                      </p>
                    )}
                    <div className="mt-0.5 flex items-center gap-2 pl-4" data-qoder-id="qel-mt-0-5-28a57915" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-28a57915&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:368,&quot;column&quot;:21}}">
                      <span className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-d9d99712" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-d9d99712&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:369,&quot;column&quot;:23}}">
                        {session.handler === 'AI' ? '阿喜AI' : session.handler || '待分配'}
                      </span>
                      {session.turn_count > 0 && (
                        <span className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-dad998a5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-dad998a5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:373,&quot;column&quot;:25}}">
                          {session.turn_count}轮
                        </span>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3" style={{ borderTop: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-p-3-9156063a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-3-9156063a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;p-3&quot;,&quot;loc&quot;:{&quot;line&quot;:386,&quot;column&quot;:9}}">
          <p className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-1145be79" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-1145be79&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/Sidebar.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:387,&quot;column&quot;:11}}">
            {viewMode === 'conversations'
              ? `${MOCK_CONVERSATIONS.length} 条历史对话`
              : `${MOCK_SESSIONS.length} 个七鱼会话 · ${activeSessions} 进行中`}
          </p>
        </div>
      </aside>
    </>
  )
}
