import { useState } from 'react'
import {
  Clock, Users, ArrowRightLeft, Ticket, Bell,
  CheckCircle2, AlertTriangle, Phone, MessageSquare,
  Zap, Eye, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { cn } from '../../lib/utils.js'
import { MOCK_SESSIONS, QUALITY_METRICS, ESCALATION_RULES } from '../../lib/mock-data.js'

/* ─── Session state config ─── */
const STATE_CONFIG = {
  new: { label: '新会话', icon: Bell, color: 'var(--cursor-gold)' },
  queue: { label: '排队中', icon: Clock, color: 'var(--cursor-gold)' },
  active: { label: '对话中', icon: MessageSquare, color: 'var(--cursor-success)' },
  handoff: { label: '已转人工', icon: ArrowRightLeft, color: '#4b7bec' },
  resolved: { label: '已解决', icon: CheckCircle2, color: 'var(--cursor-border-55)' },
  closed: { label: '已关闭', icon: CheckCircle2, color: 'var(--cursor-border-55)' },
}

const STATE_LABELS = {
  active: 'session-badge--active',
  queue: 'session-badge--queue',
  handoff: 'session-badge--handoff',
  resolved: 'session-badge--resolved',
  closed: 'session-badge--closed',
  new: 'session-badge--queue',
}

/* ─── SLA Countdown ─── */
function SLACountdown({ seconds, slaHours }) {
  const slaSeconds = (slaHours || 4) * 3600
  const remaining = Math.max(0, slaSeconds - seconds)
  const hours = Math.floor(remaining / 3600)
  const mins = Math.floor((remaining % 3600) / 60)

  const pct = remaining / slaSeconds
  const status = pct < 0.2 ? 'critical' : pct < 0.5 ? 'warning' : 'normal'

  return (
    <span className={cn('sla-countdown', `sla-countdown--${status}`)}>
      <Clock className="h-3 w-3" />
      {hours}h{mins}m
    </span>
  )
}

/* ─── Quality Score Display ─── */
function QualityScoreBar({ dimension, score }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 truncate" style={{ color: 'var(--cursor-border-55)' }}>{dimension}</span>
      <div className="bayesian-bar flex-1">
        <div
          className={cn('bayesian-bar__fill', score >= 80 ? 'bayesian-bar__fill--low' : score >= 60 ? 'bayesian-bar__fill--medium' : 'bayesian-bar__fill--high')}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn(
        'quality-score',
        score >= 80 ? 'quality-score--high' : score >= 60 ? 'quality-score--medium' : 'quality-score--low'
      )}>{score}</span>
    </div>
  )
}

/* ─── Session Card ─── */
function SessionCard({ session, selected, onSelect }) {
  const config = STATE_CONFIG[session.session_state] || STATE_CONFIG.active
  const StateIcon = config.icon

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-lg p-2.5 cursor-pointer transition-colors',
        selected ? 'bg-[var(--cursor-surface-500)]' : ''
      )}
      style={{ border: '1px solid var(--cursor-border-10)' }}
      onClick={() => onSelect(session)}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = 'var(--cursor-surface-300)' }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = '' }}
      data-component="session-card"
    >
      {/* Risk dot */}
      <div className="mt-1.5 flex-shrink-0">
        <div
          className="h-2 w-2 rounded-full"
          style={{
            background: session.risk_level === 'high' ? 'var(--cursor-error)'
              : session.risk_level === 'medium' ? 'var(--cursor-gold)'
              : session.risk_level === 'low' ? 'var(--cursor-success)'
              : 'var(--cursor-surface-500)',
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-center gap-2">
          <span className={cn('session-badge', STATE_LABELS[session.session_state] || '')}>
            <StateIcon className="h-2.5 w-2.5" />
            {config.label}
          </span>
          {session.priority === 'high' && (
            <span className="emotion-indicator emotion-indicator--urgent">
              <AlertTriangle className="h-2.5 w-2.5" />
              紧急
            </span>
          )}
        </div>

        {/* Classification */}
        {session.classification && (
          <p className="mt-1 truncate text-xs font-medium" style={{ color: 'var(--cursor-ink)' }}>
            {session.classification.split('/').pop()}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-1 flex items-center gap-2 text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
          <span className="flex items-center gap-0.5">
            <MessageSquare className="h-2.5 w-2.5" />
            {session.turn_count}轮
          </span>
          {session.handler && (
            <span>{session.handler === 'AI' ? '阿喜AI' : session.handler}</span>
          )}
          {session.queue_position > 0 && (
            <span>队列#{session.queue_position}</span>
          )}
          <span className="ml-auto">
            {session.duration_seconds > 0 && (
              <SLACountdown seconds={session.duration_seconds} slaHours={session.risk_level === 'high' ? 1 : 4} />
            )}
          </span>
        </div>

        {/* Ticket pills */}
        {session.ticket_ids?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {session.ticket_ids.map(tid => (
              <span key={tid} className={cn(
                'ticket-type',
                tid.includes('esc') ? 'ticket-type--escalation' :
                tid.includes('ding') ? 'ticket-type--dingtalk_alert' :
                'ticket-type--store_ticket'
              )}>
                {tid.includes('esc') ? '升级' : tid.includes('ding') ? '强钉' : '工单'}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Session Detail Panel ─── */
function SessionDetail({ session }) {
  if (!session) {
    return (
      <div className="flex h-full items-center justify-center text-center p-6">
        <p className="text-sm" style={{ color: 'var(--cursor-border-55)' }}>
          选择一个会话查看详情
        </p>
      </div>
    )
  }

  const config = STATE_CONFIG[session.session_state] || STATE_CONFIG.active

  // Simulated quality scores
  const qualityScores = [
    { dim: '理解', score: session.risk_level === 'high' ? 72 : 88 },
    { dim: '表达', score: session.risk_level === 'high' ? 78 : 91 },
    { dim: '安抚', score: session.risk_level === 'high' ? 65 : 85 },
    { dim: '流程', score: session.turn_count > 5 ? 70 : 92 },
    { dim: '系统', score: 86 },
  ]

  return (
    <div className="animate-fade-in" data-component="session-detail">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: 'var(--cursor-surface-500)' }}
        >
          <Shield className="h-5 w-5" style={{ color: 'var(--cursor-orange)' }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold cursor-title" style={{ color: 'var(--cursor-ink)' }}>
            {session.sessionId}
          </h3>
          <div className="mt-0.5 flex items-center gap-2">
            <span className={cn('session-badge', STATE_LABELS[session.session_state] || '')}>
              {config.label}
            </span>
            {session.channel && (
              <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
                {session.channel === 'hotline' ? '热线' : '在线'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Classification */}
      {session.classification && (
        <div className="mb-4 rounded-lg p-3" style={{
          border: '1px solid var(--cursor-border-10)',
          background: 'var(--cursor-surface-300)',
        }}>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
            食安分类
          </h4>
          <p className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
            {session.classification}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {session.risk_level && (
              <span className={cn(
                'emotion-indicator',
                session.risk_level === 'high' ? 'emotion-indicator--urgent' :
                session.risk_level === 'medium' ? 'emotion-indicator--elevated' :
                'emotion-indicator--normal'
              )}>
                {session.risk_level === 'high' ? '高风险' : session.risk_level === 'medium' ? '中风险' : '低风险'}
              </span>
            )}
            {session.sla_status === 'warning' && (
              <span className="sla-countdown sla-countdown--warning">
                <AlertTriangle className="h-3 w-3" /> SLA预警
              </span>
            )}
          </div>
        </div>
      )}

      {/* Session lifecycle */}
      <div className="mb-4 rounded-lg p-3" style={{
        border: '1px solid var(--cursor-border-10)',
        background: 'var(--cursor-surface-300)',
      }}>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
          会话生命周期
        </h4>
        <div className="flex items-center gap-1">
          {['new', 'queue', 'active', 'handoff', 'resolved', 'closed'].map((state, i) => {
            const isCurrent = session.session_state === state
            const isPast = ['new', 'queue', 'active', 'handoff', 'resolved', 'closed'].indexOf(session.session_state) >= i
            return (
              <div key={state} className="flex items-center gap-1">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-bold"
                  style={{
                    background: isCurrent ? 'var(--cursor-orange)' : isPast ? 'var(--cursor-success)' : 'var(--cursor-surface-500)',
                    color: isCurrent || isPast ? '#fff' : 'var(--cursor-border-55)',
                  }}
                >
                  {i + 1}
                </div>
                {i < 5 && (
                  <div className="h-px w-3" style={{
                    background: isPast ? 'var(--cursor-success)' : 'var(--cursor-border-10)',
                  }} />
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
          <span>处理人: {session.agent_name || '待分配'}</span>
          <span>对话轮次: {session.turn_count}</span>
          <span>时长: {Math.floor(session.duration_seconds / 60)}:{(session.duration_seconds % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>

      {/* Quality scores */}
      <div className="mb-4 rounded-lg p-3" style={{
        border: '1px solid var(--cursor-border-10)',
        background: 'var(--cursor-surface-300)',
      }}>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
          质检评分 (5维度)
        </h4>
        <div className="space-y-2">
          {qualityScores.map(qs => (
            <QualityScoreBar key={qs.dim} dimension={qs.dim} score={qs.score} />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1">
          <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }}>综合:</span>
          <span className={cn(
            'quality-score',
            qualityScores.reduce((a, q) => a + q.score, 0) / qualityScores.length >= 80
              ? 'quality-score--high'
              : 'quality-score--medium'
          )}>
            {Math.round(qualityScores.reduce((a, q) => a + q.score, 0) / qualityScores.length)}分
          </span>
        </div>
      </div>

      {/* Tickets */}
      {session.ticket_ids?.length > 0 && (
        <div className="rounded-lg p-3" style={{
          border: '1px solid var(--cursor-border-10)',
          background: 'var(--cursor-surface-300)',
        }}>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
            关联工单
          </h4>
          <div className="space-y-1.5">
            {session.ticket_ids.map(tid => (
              <div key={tid} className="flex items-center gap-2 rounded-lg p-2 text-xs" style={{
                background: 'var(--cursor-surface-100)',
                border: '1px solid var(--cursor-border-10)',
              }}>
                <Ticket className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--cursor-orange)' }} />
                <span className="flex-1" style={{ color: 'var(--cursor-ink)' }}>{tid}</span>
                <span className={cn(
                  'ticket-type',
                  tid.includes('esc') ? 'ticket-type--escalation' :
                  tid.includes('ding') ? 'ticket-type--dingtalk_alert' :
                  'ticket-type--store_ticket'
                )}>
                  {tid.includes('esc') ? '升级客诉' : tid.includes('ding') ? '钉钉强提醒' : '门店工单'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escalation info */}
      {session.risk_level === 'high' && (
        <div className="mt-4 handoff-record">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-3 w-3" style={{ color: 'var(--cursor-error)' }} />
            <span className="font-medium">升级规则</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--cursor-border-55)' }}>
            {session.classification?.includes('身体不适')
              ? '身体不适 ≥ Level2: 通知区域经理+店长，1h内响应'
              : session.classification?.includes('金属')
              ? '高危异物 Level2: 强钉区域经理，1h内响应'
              : '高风险会话: 主管级审批，4h内响应'}
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── Main QiyuSessionPanel ─── */
export default function QiyuSessionPanel() {
  const [selectedSession, setSelectedSession] = useState(null)
  const [filterState, setFilterState] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')

  const sessions = MOCK_SESSIONS

  const filteredSessions = sessions.filter(s => {
    if (filterState !== 'all' && s.session_state !== filterState) return false
    if (filterRisk !== 'all' && s.risk_level !== filterRisk) return false
    return true
  })

  // Stats
  const activeCount = sessions.filter(s => s.session_state === 'active').length
  const queueCount = sessions.filter(s => s.session_state === 'queue').length
  const handoffCount = sessions.filter(s => s.session_state === 'handoff').length
  const highRiskCount = sessions.filter(s => s.risk_level === 'high').length

  return (
    <div className="flex h-full" data-component="qiyu-session-panel">
      {/* Left: Session list */}
      <div
        className="flex w-80 flex-col"
        style={{
          borderRight: '1px solid var(--cursor-border-10)',
          background: 'var(--cursor-surface-400)',
        }}
      >
        {/* Header */}
        <div className="p-3" style={{ borderBottom: '1px solid var(--cursor-border-10)' }}>
          <h2 className="text-sm font-semibold cursor-display" style={{ color: 'var(--cursor-ink)' }}>
            七鱼会话管理
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--cursor-border-55)' }}>
            AI↔人工协同 · 6态生命周期
          </p>

          {/* Quick stats */}
          <div className="mt-2 grid grid-cols-4 gap-1">
            <div className="rounded-lg p-1.5 text-center" style={{ background: 'var(--cursor-surface-300)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--cursor-success)' }}>{activeCount}</p>
              <p className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>对话中</p>
            </div>
            <div className="rounded-lg p-1.5 text-center" style={{ background: 'var(--cursor-surface-300)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--cursor-gold)' }}>{queueCount}</p>
              <p className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>排队</p>
            </div>
            <div className="rounded-lg p-1.5 text-center" style={{ background: 'var(--cursor-surface-300)' }}>
              <p className="text-sm font-semibold" style={{ color: '#4b7bec' }}>{handoffCount}</p>
              <p className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>转人工</p>
            </div>
            <div className="rounded-lg p-1.5 text-center" style={{ background: 'var(--cursor-surface-300)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--cursor-error)' }}>{highRiskCount}</p>
              <p className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>高风险</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 p-3" style={{ borderBottom: '1px solid var(--cursor-border-10)' }}>
          {[
            { key: 'all', label: '全部' },
            { key: 'active', label: '对话中' },
            { key: 'queue', label: '排队' },
            { key: 'handoff', label: '转人工' },
          ].map(f => (
            <Button
              key={f.key}
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => setFilterState(f.key)}
              style={{
                background: filterState === f.key ? 'var(--cursor-surface-500)' : 'var(--cursor-surface-300)',
                color: filterState === f.key ? 'var(--cursor-orange)' : 'var(--cursor-border-55)',
              }}
            >
              {f.label}
            </Button>
          ))}
          <div className="w-full" />
          {['all', 'high', 'medium', 'low'].map(r => (
            <Button
              key={`risk-${r}`}
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => setFilterRisk(r)}
              style={{
                background: filterRisk === r ? 'var(--cursor-surface-500)' : 'var(--cursor-surface-300)',
                color: filterRisk === r ? (r === 'high' ? 'var(--cursor-error)' : r === 'medium' ? 'var(--cursor-gold)' : r === 'low' ? 'var(--cursor-success)' : 'var(--cursor-orange)') : 'var(--cursor-border-55)',
              }}
            >
              {r === 'all' ? '全风险' : r === 'high' ? '高' : r === 'medium' ? '中' : '低'}
            </Button>
          ))}
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2">
          {filteredSessions.map(session => (
            <SessionCard
              key={session.sessionId}
              session={session}
              selected={selectedSession?.sessionId === session.sessionId}
              onSelect={setSelectedSession}
            />
          ))}
          {filteredSessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-3 h-8 w-8" style={{ color: 'var(--cursor-border-20)' }} />
              <p className="text-sm" style={{ color: 'var(--cursor-border-55)' }}>
                没有匹配的会话
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Session detail */}
      <div className="flex flex-1 flex-col overflow-y-auto scrollbar-thin p-4">
        <SessionDetail session={selectedSession} />
      </div>
    </div>
  )
}
