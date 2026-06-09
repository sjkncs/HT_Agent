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
function SLACountdown({ seconds, slaHours, ...qoderProps }) {
  const slaSeconds = (slaHours || 4) * 3600
  const remaining = Math.max(0, slaSeconds - seconds)
  const hours = Math.floor(remaining / 3600)
  const mins = Math.floor((remaining % 3600) / 60)

  const pct = remaining / slaSeconds
  const status = pct < 0.2 ? 'critical' : pct < 0.5 ? 'warning' : 'normal'

  return (
    <span className={[(cn('sla-countdown', `sla-countdown--${status}`)), qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <Clock className="h-3 w-3"  data-qoder-id="qel-h-3-75f4a0dd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-75f4a0dd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SLACountdown&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:42,&quot;column&quot;:7}}"/>
      {hours}h{mins}m
    </span>
  )
}

/* ─── Quality Score Display ─── */
function QualityScoreBar({ dimension, score, ...qoderProps }) {
  return (
    <div className={["flex items-center gap-2 text-xs", qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <span className="w-16 truncate" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-w-16-51f06d79" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-16-51f06d79&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QualityScoreBar&quot;,&quot;elementRole&quot;:&quot;w-16&quot;,&quot;loc&quot;:{&quot;line&quot;:52,&quot;column&quot;:7}}">{dimension}</span>
      <div className="bayesian-bar flex-1" data-qoder-id="qel-bayesian-bar-ea8f244c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-bayesian-bar-ea8f244c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QualityScoreBar&quot;,&quot;elementRole&quot;:&quot;bayesian-bar&quot;,&quot;loc&quot;:{&quot;line&quot;:53,&quot;column&quot;:7}}">
        <div
          className={cn('bayesian-bar__fill', score >= 80 ? 'bayesian-bar__fill--low' : score >= 60 ? 'bayesian-bar__fill--medium' : 'bayesian-bar__fill--high')}
          style={{ width: `${score}%` }}
         data-qoder-id="qel-div-24633ee0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-24633ee0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QualityScoreBar&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:54,&quot;column&quot;:9}}"/>
      </div>
      <span className={cn(
        'quality-score',
        score >= 80 ? 'quality-score--high' : score >= 60 ? 'quality-score--medium' : 'quality-score--low'
      )} data-qoder-id="qel-span-50dc981f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-50dc981f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QualityScoreBar&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:59,&quot;column&quot;:7}}">{score}</span>
    </div>
  )
}

/* ─── Session Card ─── */
function SessionCard({ session, selected, onSelect, ...qoderProps }) {
  const config = STATE_CONFIG[session.session_state] || STATE_CONFIG.active
  const StateIcon = config.icon

  return (
    <div
      className={[(cn(
        'flex items-start gap-2.5 rounded-lg p-2.5 cursor-pointer transition-colors',
        selected ? 'bg-[var(--cursor-surface-500)]' : ''
      )), qoderProps?.className].filter(Boolean).join(" ")}
      style={{ ...({ border: '1px solid var(--cursor-border-10)' }), ...(qoderProps?.style) }}
      onClick={() => onSelect(session)}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = 'var(--cursor-surface-300)' }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = '' }}
      data-component="session-card"
     data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Risk dot */}
      <div className="mt-1.5 flex-shrink-0" data-qoder-id="qel-mt-1-5-768506ad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-5-768506ad&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;mt-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:85,&quot;column&quot;:7}}">
        <div
          className="h-2 w-2 rounded-full"
          style={{
            background: session.risk_level === 'high' ? 'var(--cursor-error)'
              : session.risk_level === 'medium' ? 'var(--cursor-gold)'
              : session.risk_level === 'low' ? 'var(--cursor-success)'
              : 'var(--cursor-surface-500)',
          }}
         data-qoder-id="qel-h-2-4d13c407" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-4d13c407&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:86,&quot;column&quot;:9}}"/>
      </div>

      <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-6cd32b10" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-6cd32b10&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:97,&quot;column&quot;:7}}">
        {/* Header row */}
        <div className="flex items-center gap-2" data-qoder-id="qel-flex-ddf86c17" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-ddf86c17&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:99,&quot;column&quot;:9}}">
          <span className={cn('session-badge', STATE_LABELS[session.session_state] || '')} data-qoder-id="qel-span-8954ba02" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-8954ba02&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:100,&quot;column&quot;:11}}">
            <StateIcon className="h-2.5 w-2.5"  data-qoder-id="qel-h-2-5-d903edf0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-d903edf0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:101,&quot;column&quot;:13}}"/>
            {config.label}
          </span>
          {session.priority === 'high' && (
            <span className="emotion-indicator emotion-indicator--urgent" data-qoder-id="qel-emotion-indicator-510dc057" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-emotion-indicator-510dc057&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;emotion-indicator&quot;,&quot;loc&quot;:{&quot;line&quot;:105,&quot;column&quot;:13}}">
              <AlertTriangle className="h-2.5 w-2.5"  data-qoder-id="qel-h-2-5-2242acb8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-2242acb8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:106,&quot;column&quot;:15}}"/>
              紧急
            </span>
          )}
        </div>

        {/* Classification */}
        {session.classification && (
          <p className="mt-1 truncate text-xs font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-mt-1-efc8efaf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-efc8efaf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:114,&quot;column&quot;:11}}">
            {session.classification.split('/').pop()}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-1 flex items-center gap-2 text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-1-db5eb65d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-db5eb65d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:120,&quot;column&quot;:9}}">
          <span className="flex items-center gap-0.5" data-qoder-id="qel-flex-2c605d21" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-2c605d21&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:121,&quot;column&quot;:11}}">
            <MessageSquare className="h-2.5 w-2.5"  data-qoder-id="qel-h-2-5-9d210d53" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-9d210d53&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:122,&quot;column&quot;:13}}"/>
            {session.turn_count}轮
          </span>
          {session.handler && (
            <span data-qoder-id="qel-span-174d4ac7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-174d4ac7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:126,&quot;column&quot;:13}}">{session.handler === 'AI' ? '阿喜AI' : session.handler}</span>
          )}
          {session.queue_position > 0 && (
            <span data-qoder-id="qel-span-184d4c5a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-184d4c5a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:129,&quot;column&quot;:13}}">队列#{session.queue_position}</span>
          )}
          <span className="ml-auto" data-qoder-id="qel-ml-auto-e37a3a04" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-auto-e37a3a04&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;ml-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:131,&quot;column&quot;:11}}">
            {session.duration_seconds > 0 && (
              <SLACountdown seconds={session.duration_seconds} slaHours={session.risk_level === 'high' ? 1 : 4}  data-qoder-id="qel-slacountdown-8dbf5b56" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-slacountdown-8dbf5b56&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;slacountdown&quot;,&quot;loc&quot;:{&quot;line&quot;:133,&quot;column&quot;:15}}"/>
            )}
          </span>
        </div>

        {/* Ticket pills */}
        {session.ticket_ids?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1" data-qoder-id="qel-mt-1-5e61c32d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-5e61c32d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:140,&quot;column&quot;:11}}">
            {session.ticket_ids.map(tid => (
              <span key={tid} className={cn(
                'ticket-type',
                tid.includes('esc') ? 'ticket-type--escalation' :
                tid.includes('ding') ? 'ticket-type--dingtalk_alert' :
                'ticket-type--store_ticket'
              )} data-qoder-id="qel-span-144d460e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-144d460e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:142,&quot;column&quot;:15}}">
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
function SessionDetail({ session, ...qoderProps }) {
  if (!session) {
    return (
      <div className={["flex h-full items-center justify-center text-center p-6", qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
        <p className="text-sm" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-sm-e987d313" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-e987d313&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:163,&quot;column&quot;:9}}">
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
    <div className="animate-fade-in" data-component="session-detail" data-qoder-id="qel-session-detail-da7987d9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-session-detail-da7987d9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;session-detail&quot;,&quot;loc&quot;:{&quot;line&quot;:182,&quot;column&quot;:5}}">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3" data-qoder-id="qel-mb-4-7ae7e673" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-7ae7e673&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:184,&quot;column&quot;:7}}">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: 'var(--cursor-surface-500)' }}
         data-qoder-id="qel-flex-2ce1e903" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-2ce1e903&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:185,&quot;column&quot;:9}}">
          <Shield className="h-5 w-5" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-5-fe20b2bd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-5-fe20b2bd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;h-5&quot;,&quot;loc&quot;:{&quot;line&quot;:189,&quot;column&quot;:11}}"/>
        </div>
        <div data-qoder-id="qel-div-7848b3d9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7848b3d9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:191,&quot;column&quot;:9}}">
          <h3 className="text-sm font-semibold cursor-title" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-0684b913" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-0684b913&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:192,&quot;column&quot;:11}}">
            {session.sessionId}
          </h3>
          <div className="mt-0.5 flex items-center gap-2" data-qoder-id="qel-mt-0-5-c962ae2c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-c962ae2c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:195,&quot;column&quot;:11}}">
            <span className={cn('session-badge', STATE_LABELS[session.session_state] || '')} data-qoder-id="qel-span-2dc05346" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-2dc05346&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:196,&quot;column&quot;:13}}">
              {config.label}
            </span>
            {session.channel && (
              <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-efd9387e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-efd9387e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:200,&quot;column&quot;:15}}">
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
        }} data-qoder-id="qel-mb-4-82e7f30b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-82e7f30b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:210,&quot;column&quot;:9}}">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mb-2-8bb50a0f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-2-8bb50a0f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;mb-2&quot;,&quot;loc&quot;:{&quot;line&quot;:214,&quot;column&quot;:11}}">
            食安分类
          </h4>
          <p className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-7d8d393d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-7d8d393d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:217,&quot;column&quot;:11}}">
            {session.classification}
          </p>
          <div className="mt-2 flex items-center gap-2" data-qoder-id="qel-mt-2-c3bdbb3b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-c3bdbb3b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:220,&quot;column&quot;:11}}">
            {session.risk_level && (
              <span className={cn(
                'emotion-indicator',
                session.risk_level === 'high' ? 'emotion-indicator--urgent' :
                session.risk_level === 'medium' ? 'emotion-indicator--elevated' :
                'emotion-indicator--normal'
              )} data-qoder-id="qel-span-2bbe1189" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-2bbe1189&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:222,&quot;column&quot;:15}}">
                {session.risk_level === 'high' ? '高风险' : session.risk_level === 'medium' ? '中风险' : '低风险'}
              </span>
            )}
            {session.sla_status === 'warning' && (
              <span className="sla-countdown sla-countdown--warning" data-qoder-id="qel-sla-countdown-2b43257c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sla-countdown-2b43257c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;sla-countdown&quot;,&quot;loc&quot;:{&quot;line&quot;:232,&quot;column&quot;:15}}">
                <AlertTriangle className="h-3 w-3"  data-qoder-id="qel-h-3-6954511d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-6954511d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:233,&quot;column&quot;:17}}"/> SLA预警
              </span>
            )}
          </div>
        </div>
      )}

      {/* Session lifecycle */}
      <div className="mb-4 rounded-lg p-3" style={{
        border: '1px solid var(--cursor-border-10)',
        background: 'var(--cursor-surface-300)',
      }} data-qoder-id="qel-mb-4-7dea29c3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-7dea29c3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:241,&quot;column&quot;:7}}">
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mb-2-92b2d67d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-2-92b2d67d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;mb-2&quot;,&quot;loc&quot;:{&quot;line&quot;:245,&quot;column&quot;:9}}">
          会话生命周期
        </h4>
        <div className="flex items-center gap-1" data-qoder-id="qel-flex-32f33b96" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-32f33b96&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:248,&quot;column&quot;:9}}">
          {['new', 'queue', 'active', 'handoff', 'resolved', 'closed'].map((state, i) => {
            const isCurrent = session.session_state === state
            const isPast = ['new', 'queue', 'active', 'handoff', 'resolved', 'closed'].indexOf(session.session_state) >= i
            return (
              <div key={state} className="flex items-center gap-1" data-qoder-id="qel-flex-3df34ce7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-3df34ce7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:253,&quot;column&quot;:15}}">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-bold"
                  style={{
                    background: isCurrent ? 'var(--cursor-orange)' : isPast ? 'var(--cursor-success)' : 'var(--cursor-surface-500)',
                    color: isCurrent || isPast ? '#fff' : 'var(--cursor-border-55)',
                  }}
                 data-qoder-id="qel-flex-3cf34b54" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-3cf34b54&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:254,&quot;column&quot;:17}}">
                  {i + 1}
                </div>
                {i < 5 && (
                  <div className="h-px w-3" style={{
                    background: isPast ? 'var(--cursor-success)' : 'var(--cursor-border-10)',
                  }}  data-qoder-id="qel-h-px-cd742732" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-px-cd742732&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;h-px&quot;,&quot;loc&quot;:{&quot;line&quot;:264,&quot;column&quot;:19}}"/>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-2-c7c0001e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-c7c0001e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:272,&quot;column&quot;:9}}">
          <span data-qoder-id="qel-span-c1bb2c14" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c1bb2c14&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:273,&quot;column&quot;:11}}">处理人: {session.agent_name || '待分配'}</span>
          <span data-qoder-id="qel-span-c2bb2da7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c2bb2da7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:274,&quot;column&quot;:11}}">对话轮次: {session.turn_count}</span>
          <span data-qoder-id="qel-span-bfbb28ee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-bfbb28ee&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:275,&quot;column&quot;:11}}">时长: {Math.floor(session.duration_seconds / 60)}:{(session.duration_seconds % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>

      {/* Quality scores */}
      <div className="mb-4 rounded-lg p-3" style={{
        border: '1px solid var(--cursor-border-10)',
        background: 'var(--cursor-surface-300)',
      }} data-qoder-id="qel-mb-4-81ec6ea6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-81ec6ea6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:280,&quot;column&quot;:7}}">
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mb-2-80b07b90" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-2-80b07b90&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;mb-2&quot;,&quot;loc&quot;:{&quot;line&quot;:284,&quot;column&quot;:9}}">
          质检评分 (5维度)
        </h4>
        <div className="space-y-2" data-qoder-id="qel-space-y-2-7ba5758b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-2-7ba5758b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;space-y-2&quot;,&quot;loc&quot;:{&quot;line&quot;:287,&quot;column&quot;:9}}">
          {qualityScores.map(qs => (
            <QualityScoreBar key={qs.dim} dimension={qs.dim} score={qs.score}  data-qoder-id="qel-qualityscorebar-28186836" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-qualityscorebar-28186836&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;qualityscorebar&quot;,&quot;loc&quot;:{&quot;line&quot;:289,&quot;column&quot;:13}}"/>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1" data-qoder-id="qel-mt-2-bfbff386" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-bfbff386&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:292,&quot;column&quot;:9}}">
          <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-a128252a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-a128252a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:293,&quot;column&quot;:11}}">综合:</span>
          <span className={cn(
            'quality-score',
            qualityScores.reduce((a, q) => a + q.score, 0) / qualityScores.length >= 80
              ? 'quality-score--high'
              : 'quality-score--medium'
          )} data-qoder-id="qel-span-bcb8e59e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-bcb8e59e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:294,&quot;column&quot;:11}}">
            {Math.round(qualityScores.reduce((a, q) => a + q.score, 0) / qualityScores.length)}分
          </span>
        </div>
      </div>

      {/* Tickets */}
      {session.ticket_ids?.length > 0 && (
        <div className="rounded-lg p-3" style={{
          border: '1px solid var(--cursor-border-10)',
          background: 'var(--cursor-surface-300)',
        }} data-qoder-id="qel-rounded-lg-eaf43df5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-eaf43df5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:307,&quot;column&quot;:9}}">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mb-2-fdad6ec0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-2-fdad6ec0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;mb-2&quot;,&quot;loc&quot;:{&quot;line&quot;:311,&quot;column&quot;:11}}">
            关联工单
          </h4>
          <div className="space-y-1.5" data-qoder-id="qel-space-y-1-5-ce33b2d4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-5-ce33b2d4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;space-y-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:314,&quot;column&quot;:11}}">
            {session.ticket_ids.map(tid => (
              <div key={tid} className="flex items-center gap-2 rounded-lg p-2 text-xs" style={{
                background: 'var(--cursor-surface-100)',
                border: '1px solid var(--cursor-border-10)',
              }} data-qoder-id="qel-flex-c4ee113e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c4ee113e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:316,&quot;column&quot;:15}}">
                <Ticket className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-3-07549835" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-07549835&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:320,&quot;column&quot;:17}}"/>
                <span className="flex-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-flex-1-6ac3efcf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-6ac3efcf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:321,&quot;column&quot;:17}}">{tid}</span>
                <span className={cn(
                  'ticket-type',
                  tid.includes('esc') ? 'ticket-type--escalation' :
                  tid.includes('ding') ? 'ticket-type--dingtalk_alert' :
                  'ticket-type--store_ticket'
                )} data-qoder-id="qel-span-b5b8da99" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b5b8da99&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:322,&quot;column&quot;:17}}">
                  {tid.includes('esc') ? '升级客诉' : tid.includes('ding') ? '钉钉强提醒' : '门店工单'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escalation info */}
      {session.risk_level === 'high' && (
        <div className="mt-4 handoff-record" data-qoder-id="qel-mt-4-be4ad8bf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-4-be4ad8bf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;mt-4&quot;,&quot;loc&quot;:{&quot;line&quot;:338,&quot;column&quot;:9}}">
          <div className="flex items-center gap-2 mb-1" data-qoder-id="qel-flex-c3ebd114" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c3ebd114&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:339,&quot;column&quot;:11}}">
            <Zap className="h-3 w-3" style={{ color: 'var(--cursor-error)' }}  data-qoder-id="qel-h-3-7cab961a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-7cab961a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:340,&quot;column&quot;:13}}"/>
            <span className="font-medium" data-qoder-id="qel-font-medium-fbbddb41" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-fbbddb41&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:341,&quot;column&quot;:13}}">升级规则</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-5cb38ad8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-5cb38ad8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;SessionDetail&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:343,&quot;column&quot;:11}}">
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
export default function QiyuSessionPanel(qoderProps) {
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
    <div className={["flex h-full", qoderProps?.className].filter(Boolean).join(" ")} data-component="qiyu-session-panel" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Left: Session list */}
      <div
        className="flex w-80 flex-col"
        style={{
          borderRight: '1px solid var(--cursor-border-10)',
          background: 'var(--cursor-surface-400)',
        }}
       data-qoder-id="qel-flex-e9a3d2cc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-e9a3d2cc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:379,&quot;column&quot;:7}}">
        {/* Header */}
        <div className="p-3" style={{ borderBottom: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-p-3-a134457a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-3-a134457a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;p-3&quot;,&quot;loc&quot;:{&quot;line&quot;:387,&quot;column&quot;:9}}">
          <h2 className="text-sm font-semibold cursor-display" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-afaf4cd0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-afaf4cd0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:388,&quot;column&quot;:11}}">
            七鱼会话管理
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-0-5-32e5c8c7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-32e5c8c7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:391,&quot;column&quot;:11}}">
            AI↔人工协同 · 6态生命周期
          </p>

          {/* Quick stats */}
          <div className="mt-2 grid grid-cols-4 gap-1" data-qoder-id="qel-mt-2-32857ec3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-32857ec3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:396,&quot;column&quot;:11}}">
            <div className="rounded-lg p-1.5 text-center" style={{ background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-rounded-lg-b9b03246" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-b9b03246&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:397,&quot;column&quot;:13}}">
              <p className="text-sm font-semibold" style={{ color: 'var(--cursor-success)' }} data-qoder-id="qel-text-sm-8e8e61cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-8e8e61cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:398,&quot;column&quot;:15}}">{activeCount}</p>
              <p className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-00b685a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-00b685a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:399,&quot;column&quot;:15}}">对话中</p>
            </div>
            <div className="rounded-lg p-1.5 text-center" style={{ background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-rounded-lg-b8b030b3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-b8b030b3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:401,&quot;column&quot;:13}}">
              <p className="text-sm font-semibold" style={{ color: 'var(--cursor-gold)' }} data-qoder-id="qel-text-sm-898e59f0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-898e59f0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:402,&quot;column&quot;:15}}">{queueCount}</p>
              <p className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-05b68d82" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-05b68d82&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:403,&quot;column&quot;:15}}">排队</p>
            </div>
            <div className="rounded-lg p-1.5 text-center" style={{ background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-rounded-lg-bbb0356c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-bbb0356c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:405,&quot;column&quot;:13}}">
              <p className="text-sm font-semibold" style={{ color: '#4b7bec' }} data-qoder-id="qel-text-sm-8c8e5ea9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-8c8e5ea9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:406,&quot;column&quot;:15}}">{handoffCount}</p>
              <p className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-0ab69561" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-0ab69561&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:407,&quot;column&quot;:15}}">转人工</p>
            </div>
            <div className="rounded-lg p-1.5 text-center" style={{ background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-rounded-lg-c2b04071" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-c2b04071&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:409,&quot;column&quot;:13}}">
              <p className="text-sm font-semibold" style={{ color: 'var(--cursor-error)' }} data-qoder-id="qel-text-sm-9390a845" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-9390a845&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:410,&quot;column&quot;:15}}">{highRiskCount}</p>
              <p className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-7db378d3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-7db378d3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:411,&quot;column&quot;:15}}">高风险</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 p-3" style={{ borderBottom: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-flex-0094ec77" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-0094ec77&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:417,&quot;column&quot;:9}}">
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
             data-qoder-id="qel-rounded-full-f7b27169" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-full-f7b27169&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;rounded-full&quot;,&quot;loc&quot;:{&quot;line&quot;:424,&quot;column&quot;:13}}">
              {f.label}
            </Button>
          ))}
          <div className="w-full"  data-qoder-id="qel-w-full-0157eebf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-0157eebf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:438,&quot;column&quot;:11}}"/>
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
             data-qoder-id="qel-rounded-full-f9b2748f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-full-f9b2748f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;rounded-full&quot;,&quot;loc&quot;:{&quot;line&quot;:440,&quot;column&quot;:13}}">
              {r === 'all' ? '全风险' : r === 'high' ? '高' : r === 'medium' ? '中' : '低'}
            </Button>
          ))}
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2" data-qoder-id="qel-flex-1-fffe1db5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-fffe1db5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:457,&quot;column&quot;:9}}">
          {filteredSessions.map(session => (
            <SessionCard
              key={session.sessionId}
              session={session}
              selected={selectedSession?.sessionId === session.sessionId}
              onSelect={setSelectedSession}
             data-qoder-id="qel-sessioncard-f39b77d6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sessioncard-f39b77d6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;sessioncard&quot;,&quot;loc&quot;:{&quot;line&quot;:459,&quot;column&quot;:13}}"/>
          ))}
          {filteredSessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center" data-qoder-id="qel-flex-fa94e305" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-fa94e305&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:467,&quot;column&quot;:13}}">
              <Users className="mb-3 h-8 w-8" style={{ color: 'var(--cursor-border-20)' }}  data-qoder-id="qel-mb-3-faa39abd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-3-faa39abd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;mb-3&quot;,&quot;loc&quot;:{&quot;line&quot;:468,&quot;column&quot;:15}}"/>
              <p className="text-sm" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-sm-eb2198f7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-eb2198f7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:469,&quot;column&quot;:15}}">
                没有匹配的会话
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Session detail */}
      <div className="flex flex-1 flex-col overflow-y-auto scrollbar-thin p-4" data-qoder-id="qel-flex-14494dfc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-14494dfc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:478,&quot;column&quot;:7}}">
        <SessionDetail session={selectedSession}  data-qoder-id="qel-sessiondetail-bb842577" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sessiondetail-bb842577&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/QiyuSessionPanel.jsx&quot;,&quot;componentName&quot;:&quot;QiyuSessionPanel&quot;,&quot;elementRole&quot;:&quot;sessiondetail&quot;,&quot;loc&quot;:{&quot;line&quot;:479,&quot;column&quot;:9}}"/>
      </div>
    </div>
  )
}
