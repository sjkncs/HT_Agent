import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Plus, Search, MessageSquare, Clock, AlertTriangle, Users
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
  const [viewMode, setViewMode] = useState('conversations') // conversations | sessions

  // Reset to conversations view when role switches to consumer
  useEffect(() => {
    if (role === 'consumer') {
      setViewMode('conversations')
    }
  }, [role])

  const groups = groupByTime(MOCK_CONVERSATIONS)

  // Filter conversations
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
    if (filterLabel) {
      items = items.filter((c) => c.label.includes(filterLabel))
    }
    acc[key] = items
    return acc
  }, {})

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

  const filterOptions = ['', '外源性异物', '内源性异物', '身体不适', '饮品异味', '原料变质']

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
        />
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
      >
        {/* New chat button */}
        <div className="px-3 pt-2 pb-1">
          <Button
            onClick={handleNew}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            新对话
          </Button>
        </div>

        {/* View mode toggle — only show sessions tab for staff */}
        <div className="mx-3 mb-2 flex gap-1 rounded-lg p-0.5" style={{
          border: '1px solid var(--cursor-border-10)',
          background: 'var(--cursor-surface-300)',
        }}>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => setViewMode('conversations')}
            style={{
              background: viewMode === 'conversations' ? 'var(--cursor-surface-500)' : 'transparent',
              color: viewMode === 'conversations' ? 'var(--cursor-ink)' : 'var(--cursor-border-55)',
            }}
          >
            <MessageSquare className="h-3 w-3" />
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
            >
              <Users className="h-3 w-3" />
              七鱼会话
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--cursor-border-55)' }} />
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
            />
          </div>
        </div>

        {/* Filters */}
        {viewMode === 'conversations' ? (
          <div className="flex flex-wrap gap-1.5 px-3 pb-3" data-component="sidebar-filters">
            {filterOptions.map((label) => (
              <Button
                key={label || 'all'}
                variant="ghost"
                size="sm"
                onClick={() => setFilterLabel(label)}
                className="rounded-full"
                style={{
                  background: filterLabel === label
                    ? 'var(--cursor-surface-500)'
                    : 'var(--cursor-surface-300)',
                  color: filterLabel === label
                    ? 'var(--cursor-orange)'
                    : 'var(--cursor-border-55)',
                }}
              >
                {label || '全部'}
              </Button>
            ))}
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
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-4">
          {viewMode === 'conversations' ? (
            <>
              {!hasAnyResults && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="mb-3 h-8 w-8" style={{ color: 'var(--cursor-border-20)' }} />
                  <p className="text-sm" style={{ color: 'var(--cursor-border-55)' }}>
                    {searchQuery ? '没有找到匹配的对话' : '暂无历史对话'}
                  </p>
                </div>
              )}

              {Object.entries(filtered).map(([group, convs]) => {
                if (convs.length === 0) return null
                return (
                  <div key={group} className="mb-4">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Clock className="h-3 w-3" style={{ color: 'var(--cursor-border-55)', opacity: 0.6 }} />
                      <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
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
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full flex-shrink-0"
                                style={RISK_DOT_STYLE[conv.riskLevel]}
                              />
                              <span className="truncate text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
                                {conv.title}
                              </span>
                              {/* Session state indicator */}
                              {conv.session_state && (
                                <div
                                  className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                                  style={SESSION_STATE_DOT[conv.session_state] || {}}
                                />
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-xs pl-4" style={{ color: 'var(--cursor-border-55)' }}>
                              {conv.lastMessage}
                            </p>
                            {/* Extra meta info */}
                            {conv.handler && (
                              <div className="mt-0.5 flex items-center gap-2 pl-4">
                                <span className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>
                                  {conv.handler === 'AI' ? '阿喜AI' : conv.handler}
                                </span>
                                {conv.turn_count && (
                                  <span className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>
                                    {conv.turn_count}轮
                                  </span>
                                )}
                                {conv.sla_status === 'warning' && (
                                  <AlertTriangle className="h-2.5 w-2.5" style={{ color: 'var(--cursor-gold)' }} />
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
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="mb-3 h-8 w-8" style={{ color: 'var(--cursor-border-20)' }} />
                  <p className="text-sm" style={{ color: 'var(--cursor-border-55)' }}>
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
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={SESSION_STATE_DOT[session.session_state] || {}}
                      />
                      <span className="truncate text-xs font-medium" style={{ color: 'var(--cursor-ink)' }}>
                        {session.sessionId}
                      </span>
                      {session.risk_level === 'high' && (
                        <AlertTriangle className="h-2.5 w-2.5 flex-shrink-0" style={{ color: 'var(--cursor-error)' }} />
                      )}
                    </div>
                    {session.classification && (
                      <p className="mt-0.5 truncate text-[10px] pl-4" style={{ color: 'var(--cursor-border-55)' }}>
                        {session.classification.split('/').pop()}
                      </p>
                    )}
                    <div className="mt-0.5 flex items-center gap-2 pl-4">
                      <span className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>
                        {session.handler === 'AI' ? '阿喜AI' : session.handler || '待分配'}
                      </span>
                      {session.turn_count > 0 && (
                        <span className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>
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
        <div className="p-3" style={{ borderTop: '1px solid var(--cursor-border-10)' }}>
          <p className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
            {viewMode === 'conversations'
              ? `${MOCK_CONVERSATIONS.length} 条历史对话`
              : `${MOCK_SESSIONS.length} 个七鱼会话 · ${activeSessions} 进行中`}
          </p>
        </div>
      </aside>
    </>
  )
}
