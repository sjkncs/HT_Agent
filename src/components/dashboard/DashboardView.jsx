import { useState } from 'react'
import {
  TrendingUp, TrendingDown, AlertTriangle, Clock, MessageSquare,
  ShieldCheck, Eye, ChevronRight, Zap, Target, Activity,
  BarChart3, GitBranch, Database, Layers, Brain, RotateCcw
} from 'lucide-react'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { Button } from '@/components/ui/button.jsx'
import { cn } from '../../lib/utils.js'
import {
  DASHBOARD_METRICS,
  CATEGORY_DISTRIBUTION,
  TREND_DATA,
  LIVE_CONVERSATIONS,
  TICKET_QUEUE,
  ESCALATION_RULES,
  MOCK_SESSIONS,
  QC_DIMENSIONS_DISPLAY as QC_DIMENSIONS,
  COZE_WORKFLOW_NODES,
} from '../../lib/mock-data.js'
import {
  ORDER_WORKFLOW_NODES,
  ORDER_INTENT_SCENES,
  AGENT_FRAMEWORK,
  AGENT_IDENTITY,
  AGENT_TOOL_REGISTRY,
} from '../../lib/agent-engine.js'

/* ─── Cursor palette chart fills ─── */
const CHART_HIGH   = '#cf2d56'
const CHART_MEDIUM = '#c08532'
const CHART_LOW    = '#1f8a65'
const CHART_BLUE   = '#4b7bec'
const CHART_PURPLE = '#c0a8dd'

/* ─── Metric Card ─── */
function MetricCard({ title, value, delta, deltaLabel, icon: Icon, trend, highlight, ...qoderProps }) {
  const isPositive = trend === 'up'
  const isNegative = trend === 'down'

  return (
    <div className={["metric-card", qoderProps?.className].filter(Boolean).join(" ")} data-component="metric-card" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="flex items-start justify-between" data-qoder-id="qel-flex-bc3b7d65" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-bc3b7d65&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:43,&quot;column&quot;:7}}">
        <div data-qoder-id="qel-div-0a555846" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-0a555846&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:44,&quot;column&quot;:9}}">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-1272c394" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-1272c394&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:45,&quot;column&quot;:11}}">
            {title}
          </p>
          <p
            className="mt-1 text-2xl font-semibold tracking-tight cursor-display"
            style={{ color: highlight ? 'var(--cursor-orange)' : 'var(--cursor-ink)' }}
           data-qoder-id="qel-mt-1-4488ed2d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-4488ed2d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:48,&quot;column&quot;:11}}">
            {value}
          </p>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: 'var(--cursor-surface-500)' }}
         data-qoder-id="qel-flex-b83b7719" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b83b7719&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:55,&quot;column&quot;:9}}">
          <Icon style={{ width: 18, height: 18, color: 'var(--cursor-orange)' }}  data-qoder-id="qel-icon-5f94918c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-icon-5f94918c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;icon&quot;,&quot;loc&quot;:{&quot;line&quot;:59,&quot;column&quot;:11}}"/>
        </div>
      </div>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-1.5" data-qoder-id="qel-mt-3-17e83d85" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-3-17e83d85&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;mt-3&quot;,&quot;loc&quot;:{&quot;line&quot;:63,&quot;column&quot;:9}}">
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5" style={{ color: CHART_LOW }}  data-qoder-id="qel-h-3-5-d85ac478" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-d85ac478&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:65,&quot;column&quot;:13}}"/>
          ) : (
            <TrendingDown className="h-3.5 w-3.5" style={{ color: CHART_HIGH }}  data-qoder-id="qel-h-3-5-44c7062b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-44c7062b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:67,&quot;column&quot;:13}}"/>
          )}
          <span className="text-xs font-medium" style={{ color: isPositive ? CHART_LOW : CHART_HIGH }} data-qoder-id="qel-text-xs-16c9c7f0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-16c9c7f0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:69,&quot;column&quot;:11}}">
            {typeof delta === 'string' ? delta : `${delta > 0 ? '+' : ''}${delta}`}
          </span>
          {deltaLabel && (
            <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-19c9cca9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-19c9cca9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:73,&quot;column&quot;:13}}">
              {deltaLabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Risk Badge ─── */
function RiskBadge({ level, ...qoderProps }) {
  const classes = { high: 'badge-risk-high', medium: 'badge-risk-medium', low: 'badge-risk-low' }
  const labels = { high: '高', medium: '中', low: '低' }
  return <span className={[(classes[level]), qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>{labels[level]}</span>
}

/* ─── Recharts tooltip style ─── */
const tooltipStyle = {
  background: 'var(--cursor-surface-400)',
  border: '1px solid var(--cursor-border-10)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--cursor-ink)',
}

/* ─── Bayesian confidence distribution data ─── */
const CONFIDENCE_HIST = [
  { range: '0-20%', count: 3, color: CHART_HIGH },
  { range: '20-40%', count: 8, color: CHART_HIGH },
  { range: '40-60%', count: 15, color: CHART_MEDIUM },
  { range: '60-70%', count: 22, color: CHART_MEDIUM },
  { range: '70-80%', count: 35, color: CHART_LOW },
  { range: '80-90%', count: 28, color: CHART_LOW },
  { range: '90-100%', count: 16, color: CHART_LOW },
]

/* ─── Escalation timeline data ─── */
const ESCALATION_TIMELINE = [
  { time: '08:15', event: 'Level2 升级 — 腹泻-中心城店', level: 'Level2', status: '处理中' },
  { time: '09:30', event: 'Level1 创建 — 毛发-科技园店', level: 'Level1', status: '已解决' },
  { time: '10:05', event: '钉钉强提醒 — OEM变质-万象城店', level: 'dingtalk', status: '已读' },
  { time: '10:25', event: '门店工单 — 苍蝇-科技园店', level: 'store', status: '待处理' },
  { time: '11:00', event: 'Level2 升级 — 金属-海雅店', level: 'Level2', status: '处理中' },
]

/* ─── Dashboard View ─── */
export default function DashboardView(qoderProps) {
  const [timeRange, setTimeRange] = useState('today')
  const [activeTab, setActiveTab] = useState('overview')
  const metrics = DASHBOARD_METRICS

  const tabs = [
    { key: 'overview', label: '总览', icon: BarChart3 },
    { key: 'operations', label: '运营', icon: Activity },
    { key: 'escalation', label: '升级', icon: Zap },
    { key: 'agent', label: 'Agent', icon: Brain },
  ]

  return (
    <div className={["h-full overflow-y-auto scrollbar-thin", qoderProps?.className].filter(Boolean).join(" ")} data-component="dashboard" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="mx-auto max-w-7xl px-6 py-6" data-qoder-id="qel-mx-auto-c4f25260" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mx-auto-c4f25260&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mx-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:134,&quot;column&quot;:7}}">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between" data-qoder-id="qel-mb-6-e0ac81f2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-6-e0ac81f2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mb-6&quot;,&quot;loc&quot;:{&quot;line&quot;:136,&quot;column&quot;:9}}">
          <div data-qoder-id="qel-div-96880e12" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-96880e12&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:137,&quot;column&quot;:11}}">
            <h2 className="text-xl font-semibold tracking-tight cursor-display" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xl-fef9156f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xl-fef9156f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:138,&quot;column&quot;:13}}">
              食安运营指挥中心
            </h2>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-0-5-41384696" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-41384696&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:141,&quot;column&quot;:13}}">
              Agent 实时运营数据 · 食安智能质检 · 七鱼协同监控
            </p>
          </div>
          <div className="flex items-center gap-3" data-qoder-id="qel-flex-320eec56" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-320eec56&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:145,&quot;column&quot;:11}}">
            {/* Tab switcher */}
            <div className="flex gap-1 rounded-lg p-1" style={{
              border: '1px solid var(--cursor-border-10)',
              background: 'var(--cursor-surface-400)',
            }} data-qoder-id="qel-flex-330eede9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-330eede9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:147,&quot;column&quot;:13}}">
              {tabs.map(tab => {
                const TabIcon = tab.icon
                return (
                  <Button
                    key={tab.key}
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab(tab.key)}
                    className="gap-1.5"
                    style={activeTab === tab.key ? {
                      background: 'var(--cursor-surface-500)',
                      color: 'var(--cursor-orange)',
                    } : {}}
                   data-qoder-id="qel-gap-1-5-af9143be" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-gap-1-5-af9143be&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;gap-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:154,&quot;column&quot;:19}}">
                    <TabIcon className="h-3 w-3"  data-qoder-id="qel-h-3-17b0b40b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-17b0b40b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:165,&quot;column&quot;:21}}"/>
                    {tab.label}
                  </Button>
                )
              })}
            </div>
            {/* Time range */}
            <div className="flex gap-1 rounded-lg p-1" style={{
              border: '1px solid var(--cursor-border-10)',
              background: 'var(--cursor-surface-400)',
            }} data-qoder-id="qel-flex-360ef2a2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-360ef2a2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:172,&quot;column&quot;:13}}">
              {['today', 'week', 'month'].map((range) => (
                <Button
                  key={range}
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  style={timeRange === range ? {
                    background: 'var(--cursor-surface-500)',
                    color: 'var(--cursor-orange)',
                  } : {}}
                 data-qoder-id="qel-button-b587c7bb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-b587c7bb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:177,&quot;column&quot;:17}}">
                  {range === 'today' ? '今日' : range === 'week' ? '本周' : '本月'}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ Overview Tab: KPI + Charts + Trend ═══ */}
        {activeTab === 'overview' && (<>
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" data-component="metrics-grid" data-qoder-id="qel-metrics-grid-ac324ac1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metrics-grid-ac324ac1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;metrics-grid&quot;,&quot;loc&quot;:{&quot;line&quot;:196,&quot;column&quot;:9}}">
          {/* Time range indicator badge */}
          <div className="col-span-full flex items-center gap-2 mb-1" data-qoder-id="qel-col-span-full-b3a430ff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-col-span-full-b3a430ff&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;col-span-full&quot;,&quot;loc&quot;:{&quot;line&quot;:198,&quot;column&quot;:11}}">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{
              background: 'var(--cursor-surface-500)',
              color: 'var(--cursor-orange)',
            }} data-qoder-id="qel-text-10px-43fc3325" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-43fc3325&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:199,&quot;column&quot;:13}}">
              {timeRange === 'today' ? '今日' : timeRange === 'week' ? '本周' : '本月'}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-42fc3192" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-42fc3192&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:205,&quot;column&quot;:13}}">数据范围</span>
          </div>
          <MetricCard
            title="今日对话"
            value={metrics.todayConversations}
            delta={metrics.todayConversationsDelta}
            deltaLabel="较昨日"
            icon={MessageSquare}
            trend="up"
           data-qoder-id="qel-metriccard-c7b4c635" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metriccard-c7b4c635&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;metriccard&quot;,&quot;loc&quot;:{&quot;line&quot;:207,&quot;column&quot;:11}}"/>
          <MetricCard
            title="高风险告警"
            value={metrics.highRiskAlerts}
            delta={metrics.highRiskAlertsDelta}
            deltaLabel="较昨日"
            icon={AlertTriangle}
            trend="down"
            highlight
           data-qoder-id="qel-metriccard-c6b4c4a2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metriccard-c6b4c4a2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;metriccard&quot;,&quot;loc&quot;:{&quot;line&quot;:215,&quot;column&quot;:11}}"/>
          <MetricCard
            title="AI自动处理"
            value={metrics.aiAutoRate}
            icon={Zap}
            trend="up"
           data-qoder-id="qel-metriccard-c5b4c30f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metriccard-c5b4c30f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;metriccard&quot;,&quot;loc&quot;:{&quot;line&quot;:224,&quot;column&quot;:11}}"/>
          <MetricCard
            title="人工复核率"
            value={metrics.humanReviewRate}
            icon={Eye}
            trend="down"
           data-qoder-id="qel-metriccard-c4b4c17c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metriccard-c4b4c17c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;metriccard&quot;,&quot;loc&quot;:{&quot;line&quot;:230,&quot;column&quot;:11}}"/>
          <MetricCard
            title="SLA达标"
            value={metrics.slaComplianceRate}
            icon={Target}
            trend="up"
           data-qoder-id="qel-metriccard-c3b4bfe9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metriccard-c3b4bfe9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;metriccard&quot;,&quot;loc&quot;:{&quot;line&quot;:236,&quot;column&quot;:11}}"/>
          <MetricCard
            title="食安质检均分"
            value={metrics.avgQualityScore}
            icon={ShieldCheck}
            trend="up"
           data-qoder-id="qel-metriccard-c2b4be56" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metriccard-c2b4be56&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;metriccard&quot;,&quot;loc&quot;:{&quot;line&quot;:242,&quot;column&quot;:11}}"/>
          <MetricCard
            title="工单操作达标率"
            value={metrics.bizProcessPassRate}
            icon={Target}
            trend="up"
           data-qoder-id="qel-metriccard-c1b4bcc3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metriccard-c1b4bcc3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;metriccard&quot;,&quot;loc&quot;:{&quot;line&quot;:248,&quot;column&quot;:11}}"/>
          <MetricCard
            title="食安分类准确率"
            value={metrics.classifyAccuracy}
            icon={Target}
            trend="up"
           data-qoder-id="qel-metriccard-c0b4bb30" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metriccard-c0b4bb30&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;metriccard&quot;,&quot;loc&quot;:{&quot;line&quot;:254,&quot;column&quot;:11}}"/>
        </div>

        {/* ═══ Charts Row ═══ */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2" data-component="charts-row" data-qoder-id="qel-charts-row-5b912432" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-charts-row-5b912432&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;charts-row&quot;,&quot;loc&quot;:{&quot;line&quot;:263,&quot;column&quot;:9}}">
          {/* Category Distribution */}
          <div className="metric-card" data-qoder-id="qel-metric-card-1a3619bc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metric-card-1a3619bc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;metric-card&quot;,&quot;loc&quot;:{&quot;line&quot;:265,&quot;column&quot;:11}}">
            <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-mb-4-7ed52d7d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-7ed52d7d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:266,&quot;column&quot;:13}}">
              食安分类分布
            </h3>
            <div className="flex items-center gap-6" data-qoder-id="qel-flex-2effdd13" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-2effdd13&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:269,&quot;column&quot;:13}}">
              <div className="h-48 w-48 flex-shrink-0" data-qoder-id="qel-h-48-91da2a9a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-48-91da2a9a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-48&quot;,&quot;loc&quot;:{&quot;line&quot;:270,&quot;column&quot;:15}}">
                <ResponsiveContainer width="100%" height="100%" data-qoder-id="qel-responsivecontainer-41be52cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-responsivecontainer-41be52cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;responsivecontainer&quot;,&quot;loc&quot;:{&quot;line&quot;:271,&quot;column&quot;:17}}">
                  <PieChart data-qoder-id="qel-piechart-50525a6e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-piechart-50525a6e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;piechart&quot;,&quot;loc&quot;:{&quot;line&quot;:272,&quot;column&quot;:19}}">
                    <Pie
                      data={CATEGORY_DISTRIBUTION}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                     data-qoder-id="qel-pie-28e7cd25" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pie-28e7cd25&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;pie&quot;,&quot;loc&quot;:{&quot;line&quot;:273,&quot;column&quot;:21}}">
                      {CATEGORY_DISTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color}  data-qoder-id="qel-cell-3941ea20" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cell-3941ea20&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;cell&quot;,&quot;loc&quot;:{&quot;line&quot;:283,&quot;column&quot;:25}}"/>
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle}  data-qoder-id="qel-tooltip-ad0a7227" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tooltip-ad0a7227&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;tooltip&quot;,&quot;loc&quot;:{&quot;line&quot;:286,&quot;column&quot;:21}}"/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2" data-qoder-id="qel-flex-1-a4417076" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-a4417076&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:290,&quot;column&quot;:15}}">
                {CATEGORY_DISTRIBUTION.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2" data-qoder-id="qel-flex-36ffe9ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-36ffe9ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:292,&quot;column&quot;:19}}">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: cat.color }}  data-qoder-id="qel-h-2-5-ebd5942d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-ebd5942d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:293,&quot;column&quot;:21}}"/>
                    <span className="flex-1 text-xs" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-flex-1-f97be94f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-f97be94f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:294,&quot;column&quot;:21}}">
                      {cat.name}
                    </span>
                    <span className="text-xs font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-de1b7f84" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-de1b7f84&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:297,&quot;column&quot;:21}}">
                      {cat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bayesian Confidence Histogram */}
          <div className="metric-card" data-qoder-id="qel-metric-card-1c271258" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metric-card-1c271258&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;metric-card&quot;,&quot;loc&quot;:{&quot;line&quot;:307,&quot;column&quot;:11}}">
            <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-mb-4-74d2df28" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-74d2df28&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:308,&quot;column&quot;:13}}">
              贝叶斯置信度分布
            </h3>
            <div className="h-48" data-qoder-id="qel-h-48-90dc679e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-48-90dc679e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-48&quot;,&quot;loc&quot;:{&quot;line&quot;:311,&quot;column&quot;:13}}">
              <ResponsiveContainer width="100%" height="100%" data-qoder-id="qel-responsivecontainer-4ec0a5dd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-responsivecontainer-4ec0a5dd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;responsivecontainer&quot;,&quot;loc&quot;:{&quot;line&quot;:312,&quot;column&quot;:15}}">
                <BarChart data={CONFIDENCE_HIST} barCategoryGap="15%" data-qoder-id="qel-barchart-3dd968f4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-barchart-3dd968f4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;barchart&quot;,&quot;loc&quot;:{&quot;line&quot;:313,&quot;column&quot;:17}}">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cursor-border-10)"  data-qoder-id="qel-cartesiangrid-52a61987" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cartesiangrid-52a61987&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;cartesiangrid&quot;,&quot;loc&quot;:{&quot;line&quot;:314,&quot;column&quot;:19}}"/>
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 10, fill: 'var(--cursor-border-55)' }}
                    axisLine={{ stroke: 'var(--cursor-border-10)' }}
                    tickLine={false}
                   data-qoder-id="qel-xaxis-01b76830" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-xaxis-01b76830&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;xaxis&quot;,&quot;loc&quot;:{&quot;line&quot;:315,&quot;column&quot;:19}}"/>
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--cursor-border-55)' }}
                    axisLine={false}
                    tickLine={false}
                   data-qoder-id="qel-yaxis-e7ed05e8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-yaxis-e7ed05e8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;yaxis&quot;,&quot;loc&quot;:{&quot;line&quot;:321,&quot;column&quot;:19}}"/>
                  <Tooltip contentStyle={tooltipStyle}  data-qoder-id="qel-tooltip-9f05deef" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tooltip-9f05deef&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;tooltip&quot;,&quot;loc&quot;:{&quot;line&quot;:326,&quot;column&quot;:19}}"/>
                  <Bar dataKey="count" name="会话数" radius={[4, 4, 0, 0]} data-qoder-id="qel-bar-5ce3ddbe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-bar-5ce3ddbe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;bar&quot;,&quot;loc&quot;:{&quot;line&quot;:327,&quot;column&quot;:19}}">
                    {CONFIDENCE_HIST.map((entry, index) => (
                      <Cell key={`conf-${index}`} fill={entry.color}  data-qoder-id="qel-cell-b63c9eb9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cell-b63c9eb9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;cell&quot;,&quot;loc&quot;:{&quot;line&quot;:329,&quot;column&quot;:23}}"/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center gap-4 text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-2-5dbac1e5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-5dbac1e5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:335,&quot;column&quot;:13}}">
              <span className="flex items-center gap-1" data-qoder-id="qel-flex-791b3e12" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-791b3e12&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:336,&quot;column&quot;:15}}"><div className="h-2 w-2 rounded-full" style={{ background: CHART_HIGH }}  data-qoder-id="qel-h-2-de8055ea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-de8055ea&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:336,&quot;column&quot;:57}}"/> 低置信(&lt;60%)</span>
              <span className="flex items-center gap-1" data-qoder-id="qel-flex-771b3aec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-771b3aec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:337,&quot;column&quot;:15}}"><div className="h-2 w-2 rounded-full" style={{ background: CHART_MEDIUM }}  data-qoder-id="qel-h-2-d0803fe0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-d0803fe0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:337,&quot;column&quot;:57}}"/> 中等(60-80%)</span>
              <span className="flex items-center gap-1" data-qoder-id="qel-flex-7d1b445e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-7d1b445e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:338,&quot;column&quot;:15}}"><div className="h-2 w-2 rounded-full" style={{ background: CHART_LOW }}  data-qoder-id="qel-h-2-de829481" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-de829481&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:338,&quot;column&quot;:57}}"/> 高置信(&gt;80%)</span>
            </div>
          </div>
        </div>

        </>)}

        {/* ═══ AIQC Quality Metrics Row (always visible) ═══ */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2" data-component="aiqc-metrics-row" data-qoder-id="qel-aiqc-metrics-row-92d255c8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-aiqc-metrics-row-92d255c8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;aiqc-metrics-row&quot;,&quot;loc&quot;:{&quot;line&quot;:346,&quot;column&quot;:9}}">
          {/* QC 四维度达标率 */}
          <div className="metric-card" data-qoder-id="qel-metric-card-8d2c4169" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metric-card-8d2c4169&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;metric-card&quot;,&quot;loc&quot;:{&quot;line&quot;:348,&quot;column&quot;:11}}">
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-f9070471" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-f9070471&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:349,&quot;column&quot;:13}}">
              食安服务四维度达标率
            </h3>
            <div className="space-y-3" data-qoder-id="qel-space-y-3-8310f488" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-3-8310f488&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;space-y-3&quot;,&quot;loc&quot;:{&quot;line&quot;:352,&quot;column&quot;:13}}">
              {Object.entries(DASHBOARD_METRICS.qcPassRate || {}).filter(([k]) => k !== 'overall').map(([key, rateStr]) => {
                const dim = QC_DIMENSIONS?.[key]
                const rate = parseFloat(rateStr)
                const color = rate >= 95 ? 'var(--cursor-success)' : rate >= 90 ? 'var(--cursor-gold)' : 'var(--cursor-error)'
                return (
                  <div key={key} data-qoder-id="qel-div-988c8e66" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-988c8e66&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:358,&quot;column&quot;:19}}">
                    <div className="flex items-center justify-between mb-1" data-qoder-id="qel-flex-c607868d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c607868d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:359,&quot;column&quot;:21}}">
                      <span className="text-xs" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-5b16341d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-5b16341d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:360,&quot;column&quot;:23}}">{dim?.name || key}</span>
                      <span className="text-xs font-mono font-medium" style={{ color }} data-qoder-id="qel-text-xs-4c161c80" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-4c161c80&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:361,&quot;column&quot;:23}}">{rateStr}</span>
                    </div>
                    <div className="bayesian-bar" data-qoder-id="qel-bayesian-bar-bb8d281d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-bayesian-bar-bb8d281d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;bayesian-bar&quot;,&quot;loc&quot;:{&quot;line&quot;:363,&quot;column&quot;:21}}">
                      <div className="bayesian-bar__fill" style={{ width: `${rate}%`, background: color }}  data-qoder-id="qel-bayesian-bar__fill-f5354490" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-bayesian-bar__fill-f5354490&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;bayesian-bar__fill&quot;,&quot;loc&quot;:{&quot;line&quot;:364,&quot;column&quot;:23}}"/>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-3-33ab1af1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-3-33ab1af1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-3&quot;,&quot;loc&quot;:{&quot;line&quot;:370,&quot;column&quot;:13}}">
              <span data-qoder-id="qel-span-d05663b8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-d05663b8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:371,&quot;column&quot;:15}}">综合达标率</span>
              <span className="font-mono font-medium" style={{ color: 'var(--cursor-orange)' }} data-qoder-id="qel-font-mono-953f30fa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-mono-953f30fa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;font-mono&quot;,&quot;loc&quot;:{&quot;line&quot;:372,&quot;column&quot;:15}}">
                {DASHBOARD_METRICS.qcPassRate?.overall || '0%'}
              </span>
            </div>
          </div>

          {/* 红线违规统计 */}
          <div className="metric-card" data-qoder-id="qel-metric-card-9d1b1178" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metric-card-9d1b1178&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;metric-card&quot;,&quot;loc&quot;:{&quot;line&quot;:379,&quot;column&quot;:11}}">
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-eb04afd0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-eb04afd0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:380,&quot;column&quot;:13}}">
              食安红线行为检测
            </h3>
            <div className="flex items-baseline gap-2" data-qoder-id="qel-flex-341dfa06" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-341dfa06&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:383,&quot;column&quot;:13}}">
              <span className="text-2xl font-semibold" style={{ color: DASHBOARD_METRICS.redlineViolationCount > 0 ? 'var(--cursor-error)' : 'var(--cursor-success)' }} data-qoder-id="qel-text-2xl-2836783b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-2xl-2836783b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-2xl&quot;,&quot;loc&quot;:{&quot;line&quot;:384,&quot;column&quot;:15}}">
                {DASHBOARD_METRICS.redlineViolationCount}
              </span>
              <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-5613eda7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-5613eda7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:387,&quot;column&quot;:15}}">
                次违规 ({DASHBOARD_METRICS.redlineViolationRate})
              </span>
            </div>
            <div className="mt-2 text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-2-64dd5f2c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-64dd5f2c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:391,&quot;column&quot;:13}}">
              食安6类红线: 服务态度 / 敏感信息 / 内部流程 / 个人信息 / 客服违规 / 其它
            </div>
          </div>
        </div>

        {/* ═══ Operations Tab: Workflows + Live + Tickets ═══ */}
        {activeTab === 'operations' && (<>
        <div className="mb-6 metric-card" data-component="workflow-architecture" data-qoder-id="qel-workflow-architecture-58020fa7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-workflow-architecture-58020fa7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;workflow-architecture&quot;,&quot;loc&quot;:{&quot;line&quot;:399,&quot;column&quot;:9}}">
          <div className="flex items-center justify-between mb-1" data-qoder-id="qel-flex-3b2043a2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-3b2043a2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:400,&quot;column&quot;:11}}">
            <h3 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-6801a300" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-6801a300&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:401,&quot;column&quot;:13}}">
              食安专家智能质检工作流
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{
              background: 'var(--cursor-surface-500)',
              color: 'var(--cursor-border-55)',
            }} data-qoder-id="qel-text-10px-c112be3b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-c112be3b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:404,&quot;column&quot;:13}}">
              7 nodes · 3 models · 10 outputs
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-3e8fd746" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-3e8fd746&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:411,&quot;column&quot;:11}}">
            对话解构 → 工单操作判定 → 食安分类质检 → 红线行为检测，全链路自动质检
          </p>
          <div className="flex items-stretch gap-1 overflow-x-auto pb-2" data-qoder-id="qel-flex-37203d56" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-37203d56&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:414,&quot;column&quot;:11}}">
            {COZE_WORKFLOW_NODES.map((node, i) => {
              const typeColors = {
                input: 'var(--cursor-info)',
                llm: 'var(--cursor-orange)',
                condition: 'var(--cursor-gold)',
                output: 'var(--cursor-success)',
              }
              const borderColor = typeColors[node.type] || 'var(--cursor-border-55)'
              return (
                <div key={node.id} className="flex items-stretch gap-1 flex-shrink-0" data-qoder-id="qel-flex-36203bc3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-36203bc3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:424,&quot;column&quot;:17}}">
                  <div
                    className="rounded-lg p-3 min-w-[140px] max-w-[180px] flex flex-col"
                    style={{
                      border: `1.5px solid ${borderColor}`,
                      background: 'var(--cursor-surface-300)',
                    }}
                   data-qoder-id="qel-rounded-lg-03327e2e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-03327e2e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:425,&quot;column&quot;:19}}">
                    <div className="flex items-center gap-1.5 mb-1" data-qoder-id="qel-flex-442051cd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-442051cd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:432,&quot;column&quot;:21}}">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: borderColor }}  data-qoder-id="qel-h-2-d97e0f74" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-d97e0f74&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:433,&quot;column&quot;:23}}"/>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-09605662" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-09605662&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:434,&quot;column&quot;:23}}">
                        N{i + 1}
                      </span>
                    </div>
                    <span className="text-xs font-medium leading-tight" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-a19a1a0d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-a19a1a0d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:438,&quot;column&quot;:21}}">
                      {node.name}
                    </span>
                    {node.model && (
                      <span className="mt-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded self-start" style={{
                        background: 'var(--cursor-surface-500)',
                        color: borderColor,
                      }} data-qoder-id="qel-mt-1-5-f8ddd3e6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-5-f8ddd3e6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:442,&quot;column&quot;:23}}">
                        {node.model}
                      </span>
                    )}
                    {node.type === 'condition' && node.condition && (
                      <span className="mt-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded self-start" style={{
                        background: 'var(--cursor-surface-500)',
                        color: 'var(--cursor-gold)',
                      }} data-qoder-id="qel-mt-1-5-f9ddd579" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-5-f9ddd579&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:450,&quot;column&quot;:23}}">
                        {node.condition}
                      </span>
                    )}
                    {node.outputs && (
                      <div className="mt-1.5 flex flex-wrap gap-0.5" data-qoder-id="qel-mt-1-5-52319f81" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-5-52319f81&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:458,&quot;column&quot;:23}}">
                        {node.outputs.slice(0, 4).map(out => (
                          <span key={out} className="text-[8px] font-mono px-1 py-0.5 rounded" style={{
                            background: 'var(--cursor-surface-400)',
                            color: 'var(--cursor-border-55)',
                          }} data-qoder-id="qel-text-8px-2fc8e710" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-8px-2fc8e710&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-8px&quot;,&quot;loc&quot;:{&quot;line&quot;:460,&quot;column&quot;:27}}">
                            {out}
                          </span>
                        ))}
                        {node.outputs.length > 4 && (
                          <span className="text-[8px] px-1 py-0.5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-8px-32c8ebc9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-8px-32c8ebc9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-8px&quot;,&quot;loc&quot;:{&quot;line&quot;:468,&quot;column&quot;:27}}">
                            +{node.outputs.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {i < COZE_WORKFLOW_NODES.length - 1 && (
                    <div className="flex items-center flex-shrink-0" data-qoder-id="qel-flex-5235d46e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-5235d46e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:476,&quot;column&quot;:21}}">
                      <div className="w-4 h-px" style={{ background: 'var(--cursor-border-10)' }}  data-qoder-id="qel-w-4-08339de2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-08339de2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:477,&quot;column&quot;:23}}"/>
                      <div className="h-0 w-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px]" style={{ borderLeftColor: 'var(--cursor-border-10)' }}  data-qoder-id="qel-h-0-fe9ea19c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-0-fe9ea19c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-0&quot;,&quot;loc&quot;:{&quot;line&quot;:478,&quot;column&quot;:23}}"/>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-3-33077454" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-3-33077454&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-3&quot;,&quot;loc&quot;:{&quot;line&quot;:485,&quot;column&quot;:11}}">
            <span className="flex items-center gap-1" data-qoder-id="qel-flex-f4c05a98" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-f4c05a98&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:486,&quot;column&quot;:13}}"><div className="h-2 w-2 rounded-full" style={{ background: 'var(--cursor-info)' }}  data-qoder-id="qel-h-2-0e451c42" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-0e451c42&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:486,&quot;column&quot;:55}}"/> 输入</span>
            <span className="flex items-center gap-1" data-qoder-id="qel-flex-f6c05dbe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-f6c05dbe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:487,&quot;column&quot;:13}}"><div className="h-2 w-2 rounded-full" style={{ background: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-2-084512d0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-084512d0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:487,&quot;column&quot;:55}}"/> LLM推理</span>
            <span className="flex items-center gap-1" data-qoder-id="qel-flex-f8c060e4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-f8c060e4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:488,&quot;column&quot;:13}}"><div className="h-2 w-2 rounded-full" style={{ background: 'var(--cursor-gold)' }}  data-qoder-id="qel-h-2-0a4515f6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-0a4515f6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:488,&quot;column&quot;:55}}"/> 条件分支</span>
            <span className="flex items-center gap-1" data-qoder-id="qel-flex-fac0640a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-fac0640a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:489,&quot;column&quot;:13}}"><div className="h-2 w-2 rounded-full" style={{ background: 'var(--cursor-success)' }}  data-qoder-id="qel-h-2-144525b4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-144525b4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:489,&quot;column&quot;:55}}"/> 输出</span>
          </div>
        </div>

        {/* ═══ Order Processing Workflow Architecture ═══ */}
        <div className="mb-6 metric-card" data-component="order-workflow-architecture" data-qoder-id="qel-order-workflow-architecture-eddaedd6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-order-workflow-architecture-eddaedd6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;order-workflow-architecture&quot;,&quot;loc&quot;:{&quot;line&quot;:494,&quot;column&quot;:9}}">
          <div className="flex items-center justify-between mb-1" data-qoder-id="qel-flex-49314915" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-49314915&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:495,&quot;column&quot;:11}}">
            <h3 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-e3b7031b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-e3b7031b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:496,&quot;column&quot;:13}}">
              客服订单处理工作流
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{
              background: 'var(--cursor-surface-500)',
              color: 'var(--cursor-border-55)',
            }} data-qoder-id="qel-text-10px-ff5bc976" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-ff5bc976&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:499,&quot;column&quot;:13}}">
              11 nodes · 5 branches · 豆包 Pro
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-585b4325" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-585b4325&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:506,&quot;column&quot;:11}}">
            开始 → 查询订单 → 意图识别 → 5路意图分支（催单/叫号/超时/其他）→ 聚合 → 结束
          </p>

          {/* Workflow nodes visualization */}
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-6" data-qoder-id="qel-grid-6696405a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-6696405a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:511,&quot;column&quot;:11}}">
            {ORDER_WORKFLOW_NODES.filter(n => !['handle_unmet_deadline','handle_no_call','handle_call_incomplete','handle_over_time','handle_other'].includes(n.id)).map((node) => {
              const typeColors = {
                input: 'var(--cursor-info)',
                database: 'var(--cursor-gold)',
                llm: 'var(--cursor-orange)',
                condition: 'var(--cursor-gold)',
                aggregator: 'var(--cursor-edit)',
                output: 'var(--cursor-success)',
              }
              const borderColor = typeColors[node.type] || 'var(--cursor-border-55)'
              return (
                <div
                  key={node.id}
                  className="rounded-lg p-2.5 flex flex-col"
                  style={{
                    border: `1.5px solid ${borderColor}`,
                    background: 'var(--cursor-surface-300)',
                  }}
                 data-qoder-id="qel-rounded-lg-a8a29830" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-a8a29830&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:523,&quot;column&quot;:17}}">
                  <div className="flex items-center gap-1.5 mb-1" data-qoder-id="qel-flex-43313fa3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-43313fa3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:531,&quot;column&quot;:19}}">
                    {node.type === 'database' ? <Database className="h-3 w-3" style={{ color: borderColor }}  data-qoder-id="qel-h-3-7376e173" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-7376e173&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:532,&quot;column&quot;:49}}"/> :
                     node.type === 'condition' ? <GitBranch className="h-3 w-3" style={{ color: borderColor }}  data-qoder-id="qel-h-3-1ffd35f3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-1ffd35f3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:533,&quot;column&quot;:50}}"/> :
                     node.type === 'aggregator' ? <Layers className="h-3 w-3" style={{ color: borderColor }}  data-qoder-id="qel-h-3-30596d1a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-30596d1a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:534,&quot;column&quot;:51}}"/> :
                     <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: borderColor }}  data-qoder-id="qel-h-2-1849a92e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-1849a92e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:535,&quot;column&quot;:22}}"/>}
                    <span className="text-[10px] font-mono" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-025e0cc6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-025e0cc6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:536,&quot;column&quot;:21}}">{node.id}</span>
                  </div>
                  <span className="text-[11px] font-medium leading-tight" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-23fa45a8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-23fa45a8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:538,&quot;column&quot;:19}}">{node.name}</span>
                  {node.model && (
                    <span className="mt-1 text-[9px] font-mono px-1 py-0.5 rounded self-start" style={{
                      background: 'var(--cursor-surface-500)', color: borderColor,
                    }} data-qoder-id="qel-mt-1-9f56ea4c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-9f56ea4c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:540,&quot;column&quot;:21}}">{node.model}</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* 5 Branch details */}
          <div className="mt-3 rounded-lg p-2.5" style={{ border: '1px solid var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-mt-3-a30ca1d2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-3-a30ca1d2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-3&quot;,&quot;loc&quot;:{&quot;line&quot;:550,&quot;column&quot;:11}}">
            <h4 className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-535d55d6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-535d55d6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:551,&quot;column&quot;:13}}">
              5 路意图分支（豆包·1.5·Pro·32k）
            </h4>
            <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-5" data-qoder-id="qel-grid-66987ef1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-66987ef1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:554,&quot;column&quot;:13}}">
              {(ORDER_INTENT_SCENES || []).map((scene, i) => (
                <div key={scene.id} className="rounded-md px-2 py-1.5 text-[10px]" style={{
                  background: 'var(--cursor-surface-400)',
                  border: '1px solid var(--cursor-border-10)',
                }} data-qoder-id="qel-rounded-md-47bfafeb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-md-47bfafeb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;rounded-md&quot;,&quot;loc&quot;:{&quot;line&quot;:556,&quot;column&quot;:17}}">
                  <div className="flex items-center gap-1 mb-0.5" data-qoder-id="qel-flex-cb2e4424" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-cb2e4424&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:560,&quot;column&quot;:19}}">
                    <span className="font-mono font-medium" style={{ color: 'var(--cursor-orange)' }} data-qoder-id="qel-font-mono-e1f7632e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-mono-e1f7632e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;font-mono&quot;,&quot;loc&quot;:{&quot;line&quot;:561,&quot;column&quot;:21}}">P{i + 1}</span>
                    <span className="font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-font-medium-8f2717fa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-8f2717fa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:562,&quot;column&quot;:21}}">{scene.name}</span>
                  </div>
                  <span style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-span-7aaad1a6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-7aaad1a6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:564,&quot;column&quot;:19}}">{scene.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        </>)}

        {/* ═══ Trend Chart (overview tab) ═══ */}
        {activeTab === 'overview' && (
        <div className="mb-6 metric-card" data-qoder-id="qel-mb-6-878be9da" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-6-878be9da&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mb-6&quot;,&quot;loc&quot;:{&quot;line&quot;:575,&quot;column&quot;:9}}">
          <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-mb-4-576e6ffd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-576e6ffd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:576,&quot;column&quot;:11}}">
            对话趋势（近5日）— AI处理 / 人工复核 / 升级
          </h3>
          <div className="h-48" data-qoder-id="qel-h-48-ef727ec3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-48-ef727ec3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-48&quot;,&quot;loc&quot;:{&quot;line&quot;:579,&quot;column&quot;:11}}">
            <ResponsiveContainer width="100%" height="100%" data-qoder-id="qel-responsivecontainer-89b4f2e2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-responsivecontainer-89b4f2e2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;responsivecontainer&quot;,&quot;loc&quot;:{&quot;line&quot;:580,&quot;column&quot;:13}}">
              <LineChart data={TREND_DATA} data-qoder-id="qel-linechart-99821457" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-linechart-99821457&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;linechart&quot;,&quot;loc&quot;:{&quot;line&quot;:581,&quot;column&quot;:15}}">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cursor-border-10)"  data-qoder-id="qel-cartesiangrid-96e73ac0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cartesiangrid-96e73ac0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;cartesiangrid&quot;,&quot;loc&quot;:{&quot;line&quot;:582,&quot;column&quot;:17}}"/>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--cursor-border-55)' }}
                  axisLine={{ stroke: 'var(--cursor-border-10)' }}
                  tickLine={false}
                 data-qoder-id="qel-xaxis-f5110d71" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-xaxis-f5110d71&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;xaxis&quot;,&quot;loc&quot;:{&quot;line&quot;:583,&quot;column&quot;:17}}"/>
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--cursor-border-55)' }}
                  axisLine={false}
                  tickLine={false}
                 data-qoder-id="qel-yaxis-e964efe6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-yaxis-e964efe6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;yaxis&quot;,&quot;loc&quot;:{&quot;line&quot;:589,&quot;column&quot;:17}}"/>
                <Tooltip contentStyle={tooltipStyle}  data-qoder-id="qel-tooltip-416e97f4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tooltip-416e97f4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;tooltip&quot;,&quot;loc&quot;:{&quot;line&quot;:594,&quot;column&quot;:17}}"/>
                <Legend wrapperStyle={{ fontSize: '11px' }}  data-qoder-id="qel-legend-11064075" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-legend-11064075&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;legend&quot;,&quot;loc&quot;:{&quot;line&quot;:595,&quot;column&quot;:17}}"/>
                <Line type="monotone" dataKey="ai_resolved" stroke={CHART_LOW} strokeWidth={2} dot={{ r: 3 }} name="AI自动处理"  data-qoder-id="qel-line-7a45af12" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-7a45af12&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:596,&quot;column&quot;:17}}"/>
                <Line type="monotone" dataKey="human_review" stroke={CHART_MEDIUM} strokeWidth={2} dot={{ r: 3 }} name="人工复核"  data-qoder-id="qel-line-7b45b0a5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-7b45b0a5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:597,&quot;column&quot;:17}}"/>
                <Line type="monotone" dataKey="escalated" stroke={CHART_HIGH} strokeWidth={2} dot={{ r: 3 }} name="升级处理"  data-qoder-id="qel-line-7445a5a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-7445a5a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:598,&quot;column&quot;:17}}"/>
                <Line type="monotone" dataKey="qc_failures" stroke={CHART_PURPLE} strokeWidth={1.5} dot={{ r: 2 }} name="食安质检不达标" strokeDasharray="4 2"  data-qoder-id="qel-line-7545a733" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-7545a733&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:599,&quot;column&quot;:17}}"/>
                <Line type="monotone" dataKey="redline_alerts" stroke="#e05252" strokeWidth={1.5} dot={{ r: 2 }} name="红线告警" strokeDasharray="4 2"  data-qoder-id="qel-line-7645a8c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-7645a8c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:600,&quot;column&quot;:17}}"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        )}

        {/* ═══ Bottom Section: Live + Tickets (operations tab) ═══ */}
        {activeTab === 'operations' && (
        <div className="grid gap-4 lg:grid-cols-2" data-component="bottom-section-operations" data-qoder-id="qel-bottom-section-operations-5be5d460" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-bottom-section-operations-5be5d460&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;bottom-section-operations&quot;,&quot;loc&quot;:{&quot;line&quot;:610,&quot;column&quot;:9}}">
          {/* Live Conversations */}
          <div className="metric-card" data-qoder-id="qel-metric-card-7205614a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metric-card-7205614a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;metric-card&quot;,&quot;loc&quot;:{&quot;line&quot;:612,&quot;column&quot;:11}}">
            <div className="mb-4 flex items-center justify-between" data-qoder-id="qel-mb-4-4ba19580" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-4ba19580&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:613,&quot;column&quot;:13}}">
              <h3 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-5ac0b8cc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-5ac0b8cc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:614,&quot;column&quot;:15}}">
                实时对话
              </h3>
              <div className="flex items-center gap-1.5" data-qoder-id="qel-flex-5026c6be" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-5026c6be&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:617,&quot;column&quot;:15}}">
                <div className="h-2 w-2 animate-pulse-soft rounded-full" style={{ background: CHART_LOW }}  data-qoder-id="qel-h-2-88420ab9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-88420ab9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:618,&quot;column&quot;:17}}"/>
                <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-0f9f4465" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-0f9f4465&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:619,&quot;column&quot;:17}}">
                  {LIVE_CONVERSATIONS.length} 个进行中
                </span>
              </div>
            </div>
            <div className="space-y-2" data-qoder-id="qel-space-y-2-e73628fb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-2-e73628fb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;space-y-2&quot;,&quot;loc&quot;:{&quot;line&quot;:624,&quot;column&quot;:13}}">
              {LIVE_CONVERSATIONS.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors"
                  style={{ border: '1px solid var(--cursor-border-10)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cursor-surface-300)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                 data-qoder-id="qel-flex-5426cd0a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-5426cd0a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:626,&quot;column&quot;:17}}">
                  <RiskBadge level={conv.risk}  data-qoder-id="qel-riskbadge-b6a769e5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-riskbadge-b6a769e5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;riskbadge&quot;,&quot;loc&quot;:{&quot;line&quot;:633,&quot;column&quot;:19}}"/>
                  <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-8d233696" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-8d233696&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:634,&quot;column&quot;:19}}">
                    <div className="flex items-center gap-2" data-qoder-id="qel-flex-4926bbb9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-4926bbb9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:635,&quot;column&quot;:21}}">
                      <span className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-3e310f2a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-3e310f2a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:636,&quot;column&quot;:23}}">
                        {conv.user}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-12a187b5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-12a187b5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:639,&quot;column&quot;:23}}">
                        {conv.store}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2" data-qoder-id="qel-mt-0-5-8931314e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-8931314e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:643,&quot;column&quot;:21}}">
                      <p className="truncate text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-truncate-19f15b16" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-truncate-19f15b16&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;truncate&quot;,&quot;loc&quot;:{&quot;line&quot;:644,&quot;column&quot;:23}}">
                        {conv.label} · {conv.messages}条
                      </p>
                      {conv.currentNode && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{
                          background: 'var(--cursor-surface-300)',
                          color: 'var(--cursor-orange)',
                        }} data-qoder-id="qel-text-10px-9867f344" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-9867f344&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:648,&quot;column&quot;:25}}">
                          {conv.currentNode}
                        </span>
                      )}
                      {conv.modelUsed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                          background: 'var(--cursor-surface-300)',
                          color: 'var(--cursor-border-55)',
                        }} data-qoder-id="qel-text-10px-9767f1b1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-9767f1b1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:656,&quot;column&quot;:25}}">
                          {conv.modelUsed}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="监听对话" disabled data-qoder-id="qel-h-8-a4937808" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-8-a4937808&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-8&quot;,&quot;loc&quot;:{&quot;line&quot;:665,&quot;column&quot;:19}}">
                    <Eye className="h-4 w-4 opacity-40"  data-qoder-id="qel-h-4-e09d7274" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-e09d7274&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:666,&quot;column&quot;:21}}"/>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Queue */}
          <div className="metric-card" data-qoder-id="qel-metric-card-6500cfa5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metric-card-6500cfa5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;metric-card&quot;,&quot;loc&quot;:{&quot;line&quot;:674,&quot;column&quot;:11}}">
            <div className="mb-4 flex items-center justify-between" data-qoder-id="qel-mb-4-509d2031" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-509d2031&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:675,&quot;column&quot;:13}}">
              <h3 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-e7c3d55a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-e7c3d55a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:676,&quot;column&quot;:15}}">
                工单队列
              </h3>
              <Button variant="ghost" size="sm" className="gap-1" disabled data-qoder-id="qel-gap-1-2da638a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-gap-1-2da638a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;gap-1&quot;,&quot;loc&quot;:{&quot;line&quot;:679,&quot;column&quot;:15}}">
                查看全部
                <ChevronRight className="h-3 w-3 opacity-40"  data-qoder-id="qel-h-3-ffdd78b5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-ffdd78b5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:681,&quot;column&quot;:17}}"/>
              </Button>
            </div>
            <div className="space-y-2" data-qoder-id="qel-space-y-2-d5137a63" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-2-d5137a63&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;space-y-2&quot;,&quot;loc&quot;:{&quot;line&quot;:684,&quot;column&quot;:13}}">
              {TICKET_QUEUE.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors"
                  style={{ border: '1px solid var(--cursor-border-10)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cursor-surface-300)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                 data-qoder-id="qel-flex-462239d2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-462239d2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:686,&quot;column&quot;:17}}">
                  <RiskBadge level={ticket.priority}  data-qoder-id="qel-riskbadge-c8987bb1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-riskbadge-c8987bb1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;riskbadge&quot;,&quot;loc&quot;:{&quot;line&quot;:693,&quot;column&quot;:19}}"/>
                  <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-1f28999a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-1f28999a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:694,&quot;column&quot;:19}}">
                    <span className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-c118457d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-c118457d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:695,&quot;column&quot;:21}}">
                      {ticket.title}
                    </span>
                    <div className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-0-5-fb2995ff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-fb2995ff&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:698,&quot;column&quot;:21}}">
                      <span className={cn(
                        'ticket-type',
                        ticket.type === 'escalation' ? 'ticket-type--escalation' :
                        ticket.type === 'customer_complaint' ? 'ticket-type--customer_complaint' :
                        'ticket-type--store_ticket'
                      )} data-qoder-id="qel-span-8bc9017d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-8bc9017d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:699,&quot;column&quot;:23}}">
                        {ticket.type === 'escalation' ? '升级' : ticket.type === 'customer_complaint' ? '客诉' : '工单'}
                      </span>
                      <span data-qoder-id="qel-span-8ac8ffea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-8ac8ffea&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:707,&quot;column&quot;:23}}">{ticket.assignee}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1" data-qoder-id="qel-flex-3f1ff036" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-3f1ff036&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:710,&quot;column&quot;:19}}">
                    <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-7e76d4e0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-7e76d4e0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:711,&quot;column&quot;:21}}">
                      {ticket.created}
                    </span>
                    {ticket.sla !== '-' && (
                      <span className={cn(
                        'sla-countdown',
                        ticket.priority === 'high' ? 'sla-countdown--warning' : 'sla-countdown--normal'
                      )} data-qoder-id="qel-span-7fc6b002" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-7fc6b002&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:715,&quot;column&quot;:23}}">
                        <Clock className="h-2.5 w-2.5"  data-qoder-id="qel-h-2-5-824a26fa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-824a26fa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:719,&quot;column&quot;:25}}"/>
                        {ticket.sla}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* ═══ Escalation Tab ═══ */}
        {activeTab === 'escalation' && (<>
        <div className="grid gap-4 lg:grid-cols-1" data-component="bottom-section-escalation" data-qoder-id="qel-bottom-section-escalation-8fafe96a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-bottom-section-escalation-8fafe96a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;bottom-section-escalation&quot;,&quot;loc&quot;:{&quot;line&quot;:733,&quot;column&quot;:9}}">
          {/* Escalation Timeline */}
          <div className="metric-card" data-qoder-id="qel-metric-card-77237e3d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metric-card-77237e3d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;metric-card&quot;,&quot;loc&quot;:{&quot;line&quot;:735,&quot;column&quot;:11}}">
            <div className="mb-4 flex items-center justify-between" data-qoder-id="qel-mb-4-5abfc231" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-5abfc231&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:736,&quot;column&quot;:13}}">
              <h3 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-69ab0a1a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-69ab0a1a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:737,&quot;column&quot;:15}}">
                升级时间线
              </h3>
              <div className="flex items-center gap-2" data-qoder-id="qel-flex-471ffcce" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-471ffcce&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:740,&quot;column&quot;:15}}">
                <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-8676e178" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-8676e178&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:741,&quot;column&quot;:17}}">
                  今日 {ESCALATION_TIMELINE.length} 条
                </span>
              </div>
            </div>
            <div className="space-y-3" data-qoder-id="qel-space-y-3-c6b7292b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-3-c6b7292b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;space-y-3&quot;,&quot;loc&quot;:{&quot;line&quot;:746,&quot;column&quot;:13}}">
              {ESCALATION_TIMELINE.map((item, i) => (
                <div key={i} className="flex gap-3" data-qoder-id="qel-flex-347e2625" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-347e2625&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:748,&quot;column&quot;:17}}">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center" data-qoder-id="qel-flex-317e216c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-317e216c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:750,&quot;column&quot;:19}}">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0 mt-0.5"
                      style={{
                        background: item.level === 'Level2' ? CHART_HIGH
                          : item.level === 'Level1' ? CHART_MEDIUM
                          : item.level === 'dingtalk' ? CHART_BLUE
                          : CHART_LOW,
                      }}
                     data-qoder-id="qel-h-3-1f167e72" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-1f167e72&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:751,&quot;column&quot;:21}}"/>
                    {i < ESCALATION_TIMELINE.length - 1 && (
                      <div className="w-px flex-1 mt-1" style={{ background: 'var(--cursor-border-10)' }}  data-qoder-id="qel-w-px-168846bd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-px-168846bd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;w-px&quot;,&quot;loc&quot;:{&quot;line&quot;:761,&quot;column&quot;:23}}"/>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-3" data-qoder-id="qel-flex-1-d4601877" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-d4601877&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:764,&quot;column&quot;:19}}">
                    <div className="flex items-center gap-2" data-qoder-id="qel-flex-2d7e1b20" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-2d7e1b20&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:765,&quot;column&quot;:21}}">
                      <span className="text-[10px] font-mono" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-2818063e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-2818063e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:766,&quot;column&quot;:23}}">
                        {item.time}
                      </span>
                      <span className={cn(
                        'ticket-type',
                        item.level === 'Level2' ? 'ticket-type--escalation' :
                        item.level === 'dingtalk' ? 'ticket-type--dingtalk_alert' :
                        'ticket-type--store_ticket'
                      )} data-qoder-id="qel-span-bf0146b4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-bf0146b4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:769,&quot;column&quot;:23}}">
                        {item.level === 'Level2' ? '升级' : item.level === 'Level1' ? '工单' : item.level === 'dingtalk' ? '强钉' : '门店'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-mt-0-5-3f451289" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-3f451289&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:778,&quot;column&quot;:21}}">
                      {item.event}
                    </p>
                    <span className="text-[10px]" style={{
                      color: item.status === '已解决' || item.status === '已读' ? 'var(--cursor-success)' : 'var(--cursor-gold)',
                    }} data-qoder-id="qel-text-10px-2515c2ee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-2515c2ee&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:781,&quot;column&quot;:21}}">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Escalation rules summary */}
            <div className="mt-4 rounded-lg p-3" style={{
              border: '1px solid var(--cursor-border-10)',
              background: 'var(--cursor-surface-300)',
            }} data-qoder-id="qel-mt-4-3c66c50b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-4-3c66c50b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-4&quot;,&quot;loc&quot;:{&quot;line&quot;:792,&quot;column&quot;:13}}">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mb-2-d6494d37" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-2-d6494d37&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mb-2&quot;,&quot;loc&quot;:{&quot;line&quot;:796,&quot;column&quot;:15}}">
                3级升级规则
              </h4>
              {Object.entries(ESCALATION_RULES).map(([key, rule]) => (
                <div key={key} className="flex items-center gap-2 py-1 text-[10px]" data-qoder-id="qel-flex-3a806e2e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-3a806e2e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:800,&quot;column&quot;:17}}">
                  <span className={cn(
                    'ticket-type',
                    key === 'Level3' ? 'ticket-type--escalation' :
                    key === 'Level2' ? 'ticket-type--customer_complaint' :
                    'ticket-type--store_ticket'
                  )} data-qoder-id="qel-span-b9037bd9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b9037bd9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:801,&quot;column&quot;:19}}">
                    {key}
                  </span>
                  <span style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-span-b8037a46" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b8037a46&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:809,&quot;column&quot;:19}}">{rule.name}</span>
                  <span className="ml-auto font-mono" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-ml-auto-629c38c4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-auto-629c38c4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;ml-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:810,&quot;column&quot;:19}}">
                    SLA: {rule.sla_hours}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ 七鱼 Session Monitor ═══ */}
        <div className="mt-6 metric-card" data-qoder-id="qel-mt-6-53f36903" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-6-53f36903&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-6&quot;,&quot;loc&quot;:{&quot;line&quot;:820,&quot;column&quot;:9}}">
          <div className="mb-4 flex items-center justify-between" data-qoder-id="qel-mb-4-6a0fa3aa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-6a0fa3aa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:821,&quot;column&quot;:11}}">
            <h3 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-71e4bd11" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-71e4bd11&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:822,&quot;column&quot;:13}}">
              七鱼平台会话监控
            </h3>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-flex-a778cb00" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a778cb00&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:825,&quot;column&quot;:13}}">
              <span className="flex items-center gap-1" data-qoder-id="qel-flex-04713712" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-04713712&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:826,&quot;column&quot;:15}}">
                <div className="h-2 w-2 rounded-full" style={{ background: CHART_LOW }}  data-qoder-id="qel-h-2-bf48b970" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-bf48b970&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:827,&quot;column&quot;:17}}"/>
                {MOCK_SESSIONS.filter(s => s.session_state === 'active').length} 对话中
              </span>
              <span className="flex items-center gap-1" data-qoder-id="qel-flex-027133ec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-027133ec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:830,&quot;column&quot;:15}}">
                <div className="h-2 w-2 rounded-full" style={{ background: CHART_MEDIUM }}  data-qoder-id="qel-h-2-c548c2e2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-c548c2e2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:831,&quot;column&quot;:17}}"/>
                {MOCK_SESSIONS.filter(s => s.session_state === 'queue').length} 排队
              </span>
              <span className="flex items-center gap-1" data-qoder-id="qel-flex-007130c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-007130c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:834,&quot;column&quot;:15}}">
                <div className="h-2 w-2 rounded-full" style={{ background: CHART_BLUE }}  data-qoder-id="qel-h-2-c348bfbc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-c348bfbc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:835,&quot;column&quot;:17}}"/>
                {MOCK_SESSIONS.filter(s => s.session_state === 'handoff').length} 转人工
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" data-qoder-id="qel-grid-1c4a4f36" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-1c4a4f36&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:840,&quot;column&quot;:11}}">
            {MOCK_SESSIONS.slice(0, 8).map(session => (
              <div
                key={session.sessionId}
                className="rounded-lg p-2.5 transition-colors"
                style={{ border: '1px solid var(--cursor-border-10)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cursor-surface-300)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
               data-qoder-id="qel-rounded-lg-e8ee7996" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-e8ee7996&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:842,&quot;column&quot;:15}}">
                <div className="flex items-center gap-2 mb-1" data-qoder-id="qel-flex-b078d92b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b078d92b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:849,&quot;column&quot;:17}}">
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: session.risk_level === 'high' ? CHART_HIGH
                        : session.risk_level === 'medium' ? CHART_MEDIUM
                        : session.risk_level === 'low' ? CHART_LOW
                        : 'var(--cursor-border-55)',
                    }}
                   data-qoder-id="qel-h-1-5-74457140" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-1-5-74457140&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:850,&quot;column&quot;:19}}"/>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-10px-1a11346f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-1a11346f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:859,&quot;column&quot;:19}}">
                    {session.sessionId}
                  </span>
                  <span className={cn(
                    'ml-auto session-badge',
                    session.session_state === 'active' ? 'session-badge--active' :
                    session.session_state === 'queue' ? 'session-badge--queue' :
                    session.session_state === 'handoff' ? 'session-badge--handoff' :
                    'session-badge--resolved'
                  )} data-qoder-id="qel-span-cb08155d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-cb08155d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:862,&quot;column&quot;:19}}">
                    {session.session_state === 'active' ? '对话' :
                     session.session_state === 'queue' ? '排队' :
                     session.session_state === 'handoff' ? '转人工' :
                     session.session_state === 'resolved' ? '已解决' : '关闭'}
                  </span>
                </div>
                {session.classification && (
                  <p className="truncate text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-truncate-9797ca38" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-truncate-9797ca38&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;truncate&quot;,&quot;loc&quot;:{&quot;line&quot;:876,&quot;column&quot;:19}}">
                    {session.classification.split('/').pop()}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-1 text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-1-88d2aeed" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-88d2aeed&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:880,&quot;column&quot;:17}}">
                  <span data-qoder-id="qel-span-c4080a58" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c4080a58&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:881,&quot;column&quot;:19}}">{session.handler === 'AI' ? '阿喜AI' : session.handler || '待分配'}</span>
                  {session.turn_count > 0 && <span data-qoder-id="qel-span-c7080f11" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c7080f11&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:882,&quot;column&quot;:46}}">·{session.turn_count}轮</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        </>)}

        {/* ─── Agent 感知-决策-执行 闭环架构 ─── */}
        {activeTab === 'agent' && (<>
          {/* 架构概览 */}
          <div className="mb-5 rounded-xl p-4" style={{
            border: '1px solid var(--cursor-border-10)',
            background: 'var(--cursor-surface-300)',
          }} data-qoder-id="qel-mb-5-42857fba" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-5-42857fba&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mb-5&quot;,&quot;loc&quot;:{&quot;line&quot;:893,&quot;column&quot;:11}}">
            <div className="flex items-center gap-3 mb-3" data-qoder-id="qel-flex-357be921" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-357be921&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:897,&quot;column&quot;:13}}">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(245,78,0,0.08)' }} data-qoder-id="qel-flex-347be78e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-347be78e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:898,&quot;column&quot;:15}}">
                <Brain className="h-5 w-5" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-5-6daa2602" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-5-6daa2602&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-5&quot;,&quot;loc&quot;:{&quot;line&quot;:899,&quot;column&quot;:17}}"/>
              </div>
              <div data-qoder-id="qel-div-5877df2f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5877df2f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:901,&quot;column&quot;:15}}">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-f8dd42d1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-f8dd42d1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:902,&quot;column&quot;:17}}">{AGENT_FRAMEWORK.name}</h3>
                <p className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-8bb708d5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-8bb708d5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:903,&quot;column&quot;:17}}">
                  {AGENT_FRAMEWORK.theory_basis} · {AGENT_FRAMEWORK.reference}
                </p>
              </div>
              <span className="ml-auto rounded-md px-2 py-0.5 text-[10px] font-medium" style={{
                background: 'rgba(245,78,0,0.08)',
                color: 'var(--cursor-orange)',
              }} data-qoder-id="qel-ml-auto-d2949a4f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-auto-d2949a4f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;ml-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:907,&quot;column&quot;:15}}">v{AGENT_FRAMEWORK.version}</span>
            </div>

            {/* 闭环架构可视化 */}
            <div className="flex items-center justify-center gap-0 py-3" data-qoder-id="qel-flex-b087e3b5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b087e3b5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:914,&quot;column&quot;:13}}">
              {Object.entries(AGENT_FRAMEWORK.architecture).map(([key, module], i) => {
                const colors = {
                  perception: { bg: '#f54e00', svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" data-qoder-id="qel-svg-c0a0c382" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-c0a0c382&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:917,&quot;column&quot;:53}}"><ellipse cx="9" cy="9" rx="7" ry="4" stroke="#f54e00" strokeWidth="1.5" data-qoder-id="qel-ellipse-50daa785" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ellipse-50daa785&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;ellipse&quot;,&quot;loc&quot;:{&quot;line&quot;:917,&quot;column&quot;:113}}"/><circle cx="9" cy="9" r="2" fill="#f54e00" data-qoder-id="qel-circle-58a4e680" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-58a4e680&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:917,&quot;column&quot;:186}}"/></svg> },
                  memory: { bg: '#8e44ad', svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" data-qoder-id="qel-svg-c3a0c83b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-c3a0c83b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:918,&quot;column&quot;:49}}"><rect x="3" y="2" width="12" height="14" rx="2" stroke="#8e44ad" strokeWidth="1.5" data-qoder-id="qel-rect-601f92a9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-601f92a9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:918,&quot;column&quot;:109}}"/><line x1="6" y1="5.5" x2="12" y2="5.5" stroke="#8e44ad" strokeWidth="1" opacity="0.6" data-qoder-id="qel-line-80f6730a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-80f6730a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:918,&quot;column&quot;:193}}"/><line x1="6" y1="8.5" x2="10" y2="8.5" stroke="#8e44ad" strokeWidth="1" opacity="0.4" data-qoder-id="qel-line-7ff67177" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-7ff67177&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:918,&quot;column&quot;:280}}"/><line x1="6" y1="11.5" x2="11" y2="11.5" stroke="#8e44ad" strokeWidth="1" opacity="0.3" data-qoder-id="qel-line-7ef66fe4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-7ef66fe4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:918,&quot;column&quot;:367}}"/></svg> },
                  decision: { bg: '#2980b9', svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" data-qoder-id="qel-svg-c4a30865" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-c4a30865&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:919,&quot;column&quot;:51}}"><circle cx="9" cy="9" r="6" stroke="#2980b9" strokeWidth="1.5" data-qoder-id="qel-circle-e9a8095a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-e9a8095a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:919,&quot;column&quot;:111}}"/><path d="M6 9l2 2 4-4" stroke="#2980b9" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-path-27031a35" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-27031a35&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:919,&quot;column&quot;:175}}"/></svg> },
                  action: { bg: '#27ae60', svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" data-qoder-id="qel-svg-c1a303ac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-c1a303ac&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:920,&quot;column&quot;:49}}"><path d="M5 4l8 5-8 5V4z" fill="#27ae60" opacity="0.2" stroke="#27ae60" strokeWidth="1.5" strokeLinejoin="round" data-qoder-id="qel-path-29031d5b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-29031d5b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:920,&quot;column&quot;:109}}"/></svg> },
                  closed_loop: { bg: '#e67e22', svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" data-qoder-id="qel-svg-c7a30d1e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-c7a30d1e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:921,&quot;column&quot;:54}}"><path d="M13 6a5 5 0 11-7.5 4" stroke="#e67e22" strokeWidth="1.5" strokeLinecap="round" data-qoder-id="qel-path-aefba188" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-aefba188&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:921,&quot;column&quot;:114}}"/><path d="M5 12a5 5 0 117.5-4" stroke="#e67e22" strokeWidth="1.5" strokeLinecap="round" data-qoder-id="qel-path-affba31b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-affba31b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:921,&quot;column&quot;:203}}"/><path d="M13 4v2h-2" stroke="#e67e22" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-path-b0fba4ae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-b0fba4ae&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:921,&quot;column&quot;:291}}"/><path d="M5 14v-2h2" stroke="#e67e22" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-path-b1fba641" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-b1fba641&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:921,&quot;column&quot;:393}}"/></svg> },
                }
                const c = colors[key] || { bg: '#999', svg: <svg width="18" height="18" viewBox="0 0 18 18" data-qoder-id="qel-svg-c2a543d6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-c2a543d6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:923,&quot;column&quot;:61}}"><circle cx="9" cy="9" r="3" fill="#999" data-qoder-id="qel-circle-e9aa47f1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-e9aa47f1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:923,&quot;column&quot;:109}}"/></svg> }
                return (
                  <div key={key} className="flex items-center" data-qoder-id="qel-flex-3d82b17e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-3d82b17e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:925,&quot;column&quot;:19}}">
                    <div className="flex flex-col items-center text-center" style={{ minWidth: 100 }} data-qoder-id="qel-flex-3e82b311" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-3e82b311&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:926,&quot;column&quot;:21}}">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{
                        background: c.bg + '15',
                        border: `2px solid ${c.bg}40`,
                      }} data-qoder-id="qel-flex-3782a80c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-3782a80c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:927,&quot;column&quot;:23}}">{c.svg}</div>
                      <span className="mt-1.5 text-[11px] font-medium" style={{ color: c.bg }} data-qoder-id="qel-mt-1-5-4ef0080c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-5-4ef0080c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:931,&quot;column&quot;:23}}">{module.name.split(' (')[0]}</span>
                      <span className="text-[9px] max-w-[90px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-b058233a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-b058233a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:932,&quot;column&quot;:23}}">
                        {module.capabilities.length}项能力
                      </span>
                    </div>
                    {i < Object.keys(AGENT_FRAMEWORK.architecture).length - 1 && (
                      <svg width="24" height="12" className="mx-1 flex-shrink-0" data-qoder-id="qel-mx-1-571a32d5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mx-1-571a32d5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mx-1&quot;,&quot;loc&quot;:{&quot;line&quot;:937,&quot;column&quot;:23}}">
                        <path d="M2 6 L18 6" stroke={c.bg} strokeWidth="1.5" fill="none"  data-qoder-id="qel-path-b2fde66b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-b2fde66b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:938,&quot;column&quot;:25}}"/>
                        <path d="M15 2 L20 6 L15 10" stroke={c.bg} strokeWidth="1.5" fill="none"  data-qoder-id="qel-path-b1fde4d8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-b1fde4d8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:939,&quot;column&quot;:25}}"/>
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 闭环回路箭头 */}
            <div className="flex justify-center" data-qoder-id="qel-flex-c185bfe1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c185bfe1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:948,&quot;column&quot;:13}}">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px]" style={{
                background: 'rgba(230,126,34,0.08)',
                color: '#e67e22',
                border: '1px dashed rgba(230,126,34,0.3)',
              }} data-qoder-id="qel-flex-c085be4e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c085be4e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:949,&quot;column&quot;:15}}">
                <RotateCcw className="h-3 w-3"  data-qoder-id="qel-h-3-a967d017" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-a967d017&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:954,&quot;column&quot;:17}}"/>
                感知→决策→执行→再感知 实时闭环 (持续进化)
              </div>
            </div>
          </div>

          {/* 各模块详情 */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3" data-qoder-id="qel-grid-1c3d8343" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-1c3d8343&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:961,&quot;column&quot;:11}}">
            {Object.entries(AGENT_FRAMEWORK.architecture).map(([key, module]) => {
              const colors = {
                perception: '#f54e00', memory: '#8e44ad', decision: '#2980b9',
                action: '#27ae60', closed_loop: '#e67e22',
              }
              const color = colors[key] || '#999'
              return (
                <div key={key} className="rounded-lg p-3" style={{
                  border: `1px solid ${color}25`,
                  background: `${color}04`,
                }} data-qoder-id="qel-rounded-lg-66e6f12b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-66e6f12b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:969,&quot;column&quot;:17}}">
                  <div className="flex items-center gap-2 mb-2" data-qoder-id="qel-flex-bc85b802" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-bc85b802&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:973,&quot;column&quot;:19}}">
                    <div className="h-2 w-2 rounded-full" style={{ background: color }}  data-qoder-id="qel-h-2-c557cd6c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-c557cd6c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:974,&quot;column&quot;:21}}"/>
                    <span className="text-xs font-semibold" style={{ color }} data-qoder-id="qel-text-xs-311651a4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-311651a4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:975,&quot;column&quot;:21}}">{module.name.split(' (')[0]}</span>
                  </div>
                  <p className="text-[10px] mb-2" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-834433f9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-834433f9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:977,&quot;column&quot;:19}}">{module.theory}</p>
                  <div className="flex flex-wrap gap-1" data-qoder-id="qel-flex-4291c3e7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-4291c3e7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:978,&quot;column&quot;:19}}">
                    {module.capabilities.map((cap, i) => (
                      <span key={i} className="rounded px-1.5 py-0.5 text-[9px]" style={{
                        background: `${color}10`,
                        color: color,
                        border: `1px solid ${color}20`,
                      }} data-qoder-id="qel-rounded-be2be5ad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-be2be5ad&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;rounded&quot;,&quot;loc&quot;:{&quot;line&quot;:980,&quot;column&quot;:23}}">{cap}</span>
                    ))}
                  </div>
                  <p className="mt-2 text-[9px] italic" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-2-4d791229" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-4d791229&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:987,&quot;column&quot;:19}}">
                    📖 {module.reference}
                  </p>
                </div>
              )
            })}
          </div>

          {/* 工具注册表 */}
          <div className="mt-4 rounded-xl p-4" style={{
            border: '1px solid var(--cursor-border-10)',
            background: 'var(--cursor-surface-300)',
          }} data-qoder-id="qel-mt-4-33556dbf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-4-33556dbf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-4&quot;,&quot;loc&quot;:{&quot;line&quot;:996,&quot;column&quot;:11}}">
            <h3 className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-becb425b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-becb425b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:1000,&quot;column&quot;:13}}">
              <Layers className="h-3.5 w-3.5" style={{ color: '#8e44ad' }}  data-qoder-id="qel-h-3-5-13359364" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-13359364&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1001,&quot;column&quot;:15}}"/>
              工具注册表 ({AGENT_TOOL_REGISTRY.length} 个工具)
            </h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4" data-qoder-id="qel-grid-aa58a64a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-aa58a64a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:1004,&quot;column&quot;:13}}">
              {AGENT_TOOL_REGISTRY.map(tool => {
                const catColors = {
                  perception: '#f54e00', decision: '#2980b9',
                  execution: '#27ae60', quality: '#e67e22', pipeline: '#8e44ad',
                }
                const color = catColors[tool.category] || '#999'
                return (
                  <div key={tool.id} className="flex items-start gap-2 rounded-md p-2 text-[10px]" style={{
                    border: `1px solid ${color}20`,
                    background: `${color}04`,
                  }} data-qoder-id="qel-flex-a994a4a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a994a4a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1012,&quot;column&quot;:19}}">
                    <div className="h-1.5 w-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: color }}  data-qoder-id="qel-h-1-5-115e6d4d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-1-5-115e6d4d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1016,&quot;column&quot;:21}}"/>
                    <div data-qoder-id="qel-div-535c00d3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-535c00d3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1017,&quot;column&quot;:21}}">
                      <div className="font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-font-medium-8f38ac10" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-8f38ac10&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:1018,&quot;column&quot;:23}}">{tool.name}</div>
                      <div style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-div-595c0a45" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-595c0a45&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1019,&quot;column&quot;:23}}">{tool.description}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 身份记忆 */}
          <div className="mt-4 rounded-xl p-4" style={{
            border: '1px solid var(--cursor-border-10)',
            background: 'var(--cursor-surface-300)',
          }} data-qoder-id="qel-mt-4-30532a6f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-4-30532a6f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-4&quot;,&quot;loc&quot;:{&quot;line&quot;:1028,&quot;column&quot;:11}}">
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-2fce32d5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-2fce32d5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:1032,&quot;column&quot;:13}}">
              <Database className="h-3.5 w-3.5" style={{ color: '#2980b9' }}  data-qoder-id="qel-h-3-5-217438cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-217438cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1033,&quot;column&quot;:15}}"/>
              身份记忆 — {AGENT_IDENTITY.full_title}
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2" data-qoder-id="qel-grid-a5565fd4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-a5565fd4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:1036,&quot;column&quot;:13}}">
              <div data-qoder-id="qel-div-5c5c0efe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5c5c0efe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1037,&quot;column&quot;:15}}">
                <span className="text-[10px] font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-ac80a4cc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-ac80a4cc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:1038,&quot;column&quot;:17}}">行为准则</span>
                <div className="mt-1 space-y-1" data-qoder-id="qel-mt-1-e86c22e2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-e86c22e2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:1039,&quot;column&quot;:17}}">
                  {AGENT_IDENTITY.behavioral_principles.map((p, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[10px]" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-flex-b0158797" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b0158797&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1041,&quot;column&quot;:21}}">
                      <span className="mt-0.5 h-1 w-1 rounded-full flex-shrink-0" style={{ background: '#2980b9' }}  data-qoder-id="qel-mt-0-5-07fbd1ec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-07fbd1ec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1042,&quot;column&quot;:23}}"/>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              <div data-qoder-id="qel-div-4205606f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4205606f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1048,&quot;column&quot;:15}}">
                <span className="text-[10px] font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-a980a013" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-a980a013&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:1049,&quot;column&quot;:17}}">沟通风格</span>
                <div className="mt-1 flex flex-wrap gap-1.5" data-qoder-id="qel-mt-1-e36c1b03" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-e36c1b03&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:1050,&quot;column&quot;:17}}">
                  <span className="rounded px-2 py-0.5 text-[10px]" style={{ background: '#27ae6015', color: '#27ae60' }} data-qoder-id="qel-rounded-cd92c347" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-cd92c347&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;rounded&quot;,&quot;loc&quot;:{&quot;line&quot;:1051,&quot;column&quot;:19}}">
                    语调: {AGENT_IDENTITY.communication_style.tone}
                  </span>
                  <span className="rounded px-2 py-0.5 text-[10px]" style={{ background: '#2980b915', color: '#2980b9' }} data-qoder-id="qel-rounded-c292b1f6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-c292b1f6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;rounded&quot;,&quot;loc&quot;:{&quot;line&quot;:1054,&quot;column&quot;:19}}">
                    第一人称: {AGENT_IDENTITY.communication_style.pronoun}
                  </span>
                  <span className="rounded px-2 py-0.5 text-[10px]" style={{ background: '#8e44ad15', color: '#8e44ad' }} data-qoder-id="qel-rounded-c392b389" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-c392b389&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;rounded&quot;,&quot;loc&quot;:{&quot;line&quot;:1057,&quot;column&quot;:19}}">
                    称呼: {AGENT_IDENTITY.communication_style.customer_address}
                  </span>
                </div>
                <div className="mt-2" data-qoder-id="qel-mt-2-acfb7ed5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-acfb7ed5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:1061,&quot;column&quot;:17}}">
                  <span className="text-[10px] font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-3183b4c2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-3183b4c2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:1062,&quot;column&quot;:19}}">禁用词</span>
                  <div className="mt-0.5 flex flex-wrap gap-1" data-qoder-id="qel-mt-0-5-2dd3a89b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-2dd3a89b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1063,&quot;column&quot;:19}}">
                    {AGENT_IDENTITY.communication_style.forbidden.map((f, i) => (
                      <span key={i} className="rounded px-1.5 py-0.5 text-[9px]" style={{
                        background: 'rgba(207,45,86,0.08)',
                        color: '#cf2d56',
                      }} data-qoder-id="qel-rounded-d195082a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-d195082a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/dashboard/DashboardView.jsx&quot;,&quot;componentName&quot;:&quot;DashboardView&quot;,&quot;elementRole&quot;:&quot;rounded&quot;,&quot;loc&quot;:{&quot;line&quot;:1065,&quot;column&quot;:23}}">✕ {f}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>)}
      </div>
    </div>
  )
}
