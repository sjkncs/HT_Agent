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
function MetricCard({ title, value, delta, deltaLabel, icon: Icon, trend, highlight }) {
  const isPositive = trend === 'up'
  const isNegative = trend === 'down'

  return (
    <div className="metric-card" data-component="metric-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
            {title}
          </p>
          <p
            className="mt-1 text-2xl font-semibold tracking-tight cursor-display"
            style={{ color: highlight ? 'var(--cursor-orange)' : 'var(--cursor-ink)' }}
          >
            {value}
          </p>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: 'var(--cursor-surface-500)' }}
        >
          <Icon style={{ width: 18, height: 18, color: 'var(--cursor-orange)' }} />
        </div>
      </div>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5" style={{ color: CHART_LOW }} />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" style={{ color: CHART_HIGH }} />
          )}
          <span className="text-xs font-medium" style={{ color: isPositive ? CHART_LOW : CHART_HIGH }}>
            {typeof delta === 'string' ? delta : `${delta > 0 ? '+' : ''}${delta}`}
          </span>
          {deltaLabel && (
            <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }}>
              {deltaLabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Risk Badge ─── */
function RiskBadge({ level }) {
  const classes = { high: 'badge-risk-high', medium: 'badge-risk-medium', low: 'badge-risk-low' }
  const labels = { high: '高', medium: '中', low: '低' }
  return <span className={classes[level]}>{labels[level]}</span>
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
export default function DashboardView() {
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
    <div className="h-full overflow-y-auto scrollbar-thin" data-component="dashboard">
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight cursor-display" style={{ color: 'var(--cursor-ink)' }}>
              食安运营指挥中心
            </h2>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--cursor-border-55)' }}>
              Agent 实时运营数据 · 食安 AIQC_V2 质检 · 七鱼协同监控
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Tab switcher */}
            <div className="flex gap-1 rounded-lg p-1" style={{
              border: '1px solid var(--cursor-border-10)',
              background: 'var(--cursor-surface-400)',
            }}>
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
                  >
                    <TabIcon className="h-3 w-3" />
                    {tab.label}
                  </Button>
                )
              })}
            </div>
            {/* Time range */}
            <div className="flex gap-1 rounded-lg p-1" style={{
              border: '1px solid var(--cursor-border-10)',
              background: 'var(--cursor-surface-400)',
            }}>
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
                >
                  {range === 'today' ? '今日' : range === 'week' ? '本周' : '本月'}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ Overview Tab: KPI + Charts + Trend ═══ */}
        {activeTab === 'overview' && (<>
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-8" data-component="metrics-grid">
          {/* Time range indicator badge */}
          <div className="col-span-full flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{
              background: 'var(--cursor-surface-500)',
              color: 'var(--cursor-orange)',
            }}>
              {timeRange === 'today' ? '今日' : timeRange === 'week' ? '本周' : '本月'}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>数据范围</span>
          </div>
          <MetricCard
            title="今日对话"
            value={metrics.todayConversations}
            delta={metrics.todayConversationsDelta}
            deltaLabel="较昨日"
            icon={MessageSquare}
            trend="up"
          />
          <MetricCard
            title="高风险告警"
            value={metrics.highRiskAlerts}
            delta={metrics.highRiskAlertsDelta}
            deltaLabel="较昨日"
            icon={AlertTriangle}
            trend="down"
            highlight
          />
          <MetricCard
            title="AI自动处理"
            value={metrics.aiAutoRate}
            icon={Zap}
            trend="up"
          />
          <MetricCard
            title="人工复核率"
            value={metrics.humanReviewRate}
            icon={Eye}
            trend="down"
          />
          <MetricCard
            title="SLA达标"
            value={metrics.slaComplianceRate}
            icon={Target}
            trend="up"
          />
          <MetricCard
            title="食安质检均分"
            value={metrics.avgQualityScore}
            icon={ShieldCheck}
            trend="up"
          />
          <MetricCard
            title="工单操作达标率"
            value={metrics.bizProcessPassRate}
            icon={Target}
            trend="up"
          />
          <MetricCard
            title="食安分类准确率"
            value={metrics.classifyAccuracy}
            icon={Target}
            trend="up"
          />
        </div>

        {/* ═══ Charts Row ═══ */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2" data-component="charts-row">
          {/* Category Distribution */}
          <div className="metric-card">
            <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
              食安分类分布
            </h3>
            <div className="flex items-center gap-6">
              <div className="h-48 w-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={CATEGORY_DISTRIBUTION}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {CATEGORY_DISTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {CATEGORY_DISTRIBUTION.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: cat.color }} />
                    <span className="flex-1 text-xs" style={{ color: 'var(--cursor-ink)' }}>
                      {cat.name}
                    </span>
                    <span className="text-xs font-medium" style={{ color: 'var(--cursor-border-55)' }}>
                      {cat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bayesian Confidence Histogram */}
          <div className="metric-card">
            <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
              贝叶斯置信度分布
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CONFIDENCE_HIST} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--cursor-border-10)" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 10, fill: 'var(--cursor-border-55)' }}
                    axisLine={{ stroke: 'var(--cursor-border-10)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--cursor-border-55)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="会话数" radius={[4, 4, 0, 0]}>
                    {CONFIDENCE_HIST.map((entry, index) => (
                      <Cell key={`conf-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center gap-4 text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
              <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full" style={{ background: CHART_HIGH }} /> 低置信(&lt;60%)</span>
              <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full" style={{ background: CHART_MEDIUM }} /> 中等(60-80%)</span>
              <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full" style={{ background: CHART_LOW }} /> 高置信(&gt;80%)</span>
            </div>
          </div>
        </div>

        </>)}

        {/* ═══ AIQC Quality Metrics Row (always visible) ═══ */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2" data-component="aiqc-metrics-row">
          {/* QC 四维度达标率 */}
          <div className="metric-card">
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--cursor-ink)' }}>
              食安服务四维度达标率
            </h3>
            <div className="space-y-3">
              {Object.entries(DASHBOARD_METRICS.qcPassRate || {}).filter(([k]) => k !== 'overall').map(([key, rateStr]) => {
                const dim = QC_DIMENSIONS?.[key]
                const rate = parseFloat(rateStr)
                const color = rate >= 95 ? 'var(--cursor-success)' : rate >= 90 ? 'var(--cursor-gold)' : 'var(--cursor-error)'
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{ color: 'var(--cursor-ink)' }}>{dim?.name || key}</span>
                      <span className="text-xs font-mono font-medium" style={{ color }}>{rateStr}</span>
                    </div>
                    <div className="bayesian-bar">
                      <div className="bayesian-bar__fill" style={{ width: `${rate}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs" style={{ color: 'var(--cursor-border-55)' }}>
              <span>综合达标率</span>
              <span className="font-mono font-medium" style={{ color: 'var(--cursor-orange)' }}>
                {DASHBOARD_METRICS.qcPassRate?.overall || '0%'}
              </span>
            </div>
          </div>

          {/* 红线违规统计 */}
          <div className="metric-card">
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--cursor-ink)' }}>
              食安红线行为检测
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold" style={{ color: DASHBOARD_METRICS.redlineViolationCount > 0 ? 'var(--cursor-error)' : 'var(--cursor-success)' }}>
                {DASHBOARD_METRICS.redlineViolationCount}
              </span>
              <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }}>
                次违规 ({DASHBOARD_METRICS.redlineViolationRate})
              </span>
            </div>
            <div className="mt-2 text-xs" style={{ color: 'var(--cursor-border-55)' }}>
              食安6类红线: 服务态度 / 敏感信息 / 内部流程 / 个人信息 / 客服违规 / 其它
            </div>
          </div>
        </div>

        {/* ═══ Operations Tab: Workflows + Live + Tickets ═══ */}
        {activeTab === 'operations' && (<>
        <div className="mb-6 metric-card" data-component="workflow-architecture">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
              食安专家 AIQC_V2 质检工作流
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{
              background: 'var(--cursor-surface-500)',
              color: 'var(--cursor-border-55)',
            }}>
              7 nodes · 3 models · 10 outputs
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--cursor-border-55)' }}>
            对话解构 → 工单操作判定 → 食安分类质检 → 红线行为检测，全链路自动质检
          </p>
          <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
            {COZE_WORKFLOW_NODES.map((node, i) => {
              const typeColors = {
                input: 'var(--cursor-info)',
                llm: 'var(--cursor-orange)',
                condition: 'var(--cursor-gold)',
                output: 'var(--cursor-success)',
              }
              const borderColor = typeColors[node.type] || 'var(--cursor-border-55)'
              return (
                <div key={node.id} className="flex items-stretch gap-1 flex-shrink-0">
                  <div
                    className="rounded-lg p-3 min-w-[140px] max-w-[180px] flex flex-col"
                    style={{
                      border: `1.5px solid ${borderColor}`,
                      background: 'var(--cursor-surface-300)',
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: borderColor }} />
                      <span className="text-[10px] font-mono" style={{ color: 'var(--cursor-border-55)' }}>
                        N{i + 1}
                      </span>
                    </div>
                    <span className="text-xs font-medium leading-tight" style={{ color: 'var(--cursor-ink)' }}>
                      {node.name}
                    </span>
                    {node.model && (
                      <span className="mt-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded self-start" style={{
                        background: 'var(--cursor-surface-500)',
                        color: borderColor,
                      }}>
                        {node.model}
                      </span>
                    )}
                    {node.type === 'condition' && node.condition && (
                      <span className="mt-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded self-start" style={{
                        background: 'var(--cursor-surface-500)',
                        color: 'var(--cursor-gold)',
                      }}>
                        {node.condition}
                      </span>
                    )}
                    {node.outputs && (
                      <div className="mt-1.5 flex flex-wrap gap-0.5">
                        {node.outputs.slice(0, 4).map(out => (
                          <span key={out} className="text-[8px] font-mono px-1 py-0.5 rounded" style={{
                            background: 'var(--cursor-surface-400)',
                            color: 'var(--cursor-border-55)',
                          }}>
                            {out}
                          </span>
                        ))}
                        {node.outputs.length > 4 && (
                          <span className="text-[8px] px-1 py-0.5" style={{ color: 'var(--cursor-border-55)' }}>
                            +{node.outputs.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {i < COZE_WORKFLOW_NODES.length - 1 && (
                    <div className="flex items-center flex-shrink-0">
                      <div className="w-4 h-px" style={{ background: 'var(--cursor-border-10)' }} />
                      <div className="h-0 w-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px]" style={{ borderLeftColor: 'var(--cursor-border-10)' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full" style={{ background: 'var(--cursor-info)' }} /> 输入</span>
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full" style={{ background: 'var(--cursor-orange)' }} /> LLM推理</span>
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full" style={{ background: 'var(--cursor-gold)' }} /> 条件分支</span>
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full" style={{ background: 'var(--cursor-success)' }} /> 输出</span>
          </div>
        </div>

        {/* ═══ Order Processing Workflow Architecture ═══ */}
        <div className="mb-6 metric-card" data-component="order-workflow-architecture">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
              客服订单处理工作流
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{
              background: 'var(--cursor-surface-500)',
              color: 'var(--cursor-border-55)',
            }}>
              11 nodes · 5 branches · 豆包 Pro
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--cursor-border-55)' }}>
            开始 → 查询订单 → 意图识别 → 5路意图分支（催单/叫号/超时/其他）→ 聚合 → 结束
          </p>

          {/* Workflow nodes visualization */}
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
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
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {node.type === 'database' ? <Database className="h-3 w-3" style={{ color: borderColor }} /> :
                     node.type === 'condition' ? <GitBranch className="h-3 w-3" style={{ color: borderColor }} /> :
                     node.type === 'aggregator' ? <Layers className="h-3 w-3" style={{ color: borderColor }} /> :
                     <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: borderColor }} />}
                    <span className="text-[10px] font-mono" style={{ color: 'var(--cursor-border-55)' }}>{node.id}</span>
                  </div>
                  <span className="text-[11px] font-medium leading-tight" style={{ color: 'var(--cursor-ink)' }}>{node.name}</span>
                  {node.model && (
                    <span className="mt-1 text-[9px] font-mono px-1 py-0.5 rounded self-start" style={{
                      background: 'var(--cursor-surface-500)', color: borderColor,
                    }}>{node.model}</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* 5 Branch details */}
          <div className="mt-3 rounded-lg p-2.5" style={{ border: '1px solid var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
            <h4 className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }}>
              5 路意图分支（豆包·1.5·Pro·32k）
            </h4>
            <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-5">
              {(ORDER_INTENT_SCENES || []).map((scene, i) => (
                <div key={scene.id} className="rounded-md px-2 py-1.5 text-[10px]" style={{
                  background: 'var(--cursor-surface-400)',
                  border: '1px solid var(--cursor-border-10)',
                }}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="font-mono font-medium" style={{ color: 'var(--cursor-orange)' }}>P{i + 1}</span>
                    <span className="font-medium" style={{ color: 'var(--cursor-ink)' }}>{scene.name}</span>
                  </div>
                  <span style={{ color: 'var(--cursor-border-55)' }}>{scene.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        </>)}

        {/* ═══ Trend Chart (overview tab) ═══ */}
        {activeTab === 'overview' && (
        <div className="mb-6 metric-card">
          <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
            对话趋势（近5日）— AI处理 / 人工复核 / 升级
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cursor-border-10)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--cursor-border-55)' }}
                  axisLine={{ stroke: 'var(--cursor-border-10)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--cursor-border-55)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="ai_resolved" stroke={CHART_LOW} strokeWidth={2} dot={{ r: 3 }} name="AI自动处理" />
                <Line type="monotone" dataKey="human_review" stroke={CHART_MEDIUM} strokeWidth={2} dot={{ r: 3 }} name="人工复核" />
                <Line type="monotone" dataKey="escalated" stroke={CHART_HIGH} strokeWidth={2} dot={{ r: 3 }} name="升级处理" />
                <Line type="monotone" dataKey="qc_failures" stroke={CHART_PURPLE} strokeWidth={1.5} dot={{ r: 2 }} name="食安质检不达标" strokeDasharray="4 2" />
                <Line type="monotone" dataKey="redline_alerts" stroke="#e05252" strokeWidth={1.5} dot={{ r: 2 }} name="红线告警" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        )}

        {/* ═══ Bottom Section: Live + Tickets (operations tab) ═══ */}
        {activeTab === 'operations' && (
        <div className="grid gap-4 lg:grid-cols-2" data-component="bottom-section-operations">
          {/* Live Conversations */}
          <div className="metric-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
                实时对话
              </h3>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 animate-pulse-soft rounded-full" style={{ background: CHART_LOW }} />
                <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }}>
                  {LIVE_CONVERSATIONS.length} 个进行中
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {LIVE_CONVERSATIONS.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors"
                  style={{ border: '1px solid var(--cursor-border-10)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cursor-surface-300)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <RiskBadge level={conv.risk} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
                        {conv.user}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }}>
                        {conv.store}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="truncate text-xs" style={{ color: 'var(--cursor-border-55)' }}>
                        {conv.label} · {conv.messages}条
                      </p>
                      {conv.currentNode && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{
                          background: 'var(--cursor-surface-300)',
                          color: 'var(--cursor-orange)',
                        }}>
                          {conv.currentNode}
                        </span>
                      )}
                      {conv.modelUsed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                          background: 'var(--cursor-surface-300)',
                          color: 'var(--cursor-border-55)',
                        }}>
                          {conv.modelUsed}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="监听对话" disabled>
                    <Eye className="h-4 w-4 opacity-40" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Queue */}
          <div className="metric-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
                工单队列
              </h3>
              <Button variant="ghost" size="sm" className="gap-1" disabled>
                查看全部
                <ChevronRight className="h-3 w-3 opacity-40" />
              </Button>
            </div>
            <div className="space-y-2">
              {TICKET_QUEUE.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors"
                  style={{ border: '1px solid var(--cursor-border-10)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cursor-surface-300)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <RiskBadge level={ticket.priority} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
                      {ticket.title}
                    </span>
                    <div className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: 'var(--cursor-border-55)' }}>
                      <span className={cn(
                        'ticket-type',
                        ticket.type === 'escalation' ? 'ticket-type--escalation' :
                        ticket.type === 'customer_complaint' ? 'ticket-type--customer_complaint' :
                        'ticket-type--store_ticket'
                      )}>
                        {ticket.type === 'escalation' ? '升级' : ticket.type === 'customer_complaint' ? '客诉' : '工单'}
                      </span>
                      <span>{ticket.assignee}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
                      {ticket.created}
                    </span>
                    {ticket.sla !== '-' && (
                      <span className={cn(
                        'sla-countdown',
                        ticket.priority === 'high' ? 'sla-countdown--warning' : 'sla-countdown--normal'
                      )}>
                        <Clock className="h-2.5 w-2.5" />
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
        <div className="grid gap-4 lg:grid-cols-1" data-component="bottom-section-escalation">
          {/* Escalation Timeline */}
          <div className="metric-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
                升级时间线
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
                  今日 {ESCALATION_TIMELINE.length} 条
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {ESCALATION_TIMELINE.map((item, i) => (
                <div key={i} className="flex gap-3">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0 mt-0.5"
                      style={{
                        background: item.level === 'Level2' ? CHART_HIGH
                          : item.level === 'Level1' ? CHART_MEDIUM
                          : item.level === 'dingtalk' ? CHART_BLUE
                          : CHART_LOW,
                      }}
                    />
                    {i < ESCALATION_TIMELINE.length - 1 && (
                      <div className="w-px flex-1 mt-1" style={{ background: 'var(--cursor-border-10)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono" style={{ color: 'var(--cursor-border-55)' }}>
                        {item.time}
                      </span>
                      <span className={cn(
                        'ticket-type',
                        item.level === 'Level2' ? 'ticket-type--escalation' :
                        item.level === 'dingtalk' ? 'ticket-type--dingtalk_alert' :
                        'ticket-type--store_ticket'
                      )}>
                        {item.level === 'Level2' ? '升级' : item.level === 'Level1' ? '工单' : item.level === 'dingtalk' ? '强钉' : '门店'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--cursor-ink)' }}>
                      {item.event}
                    </p>
                    <span className="text-[10px]" style={{
                      color: item.status === '已解决' || item.status === '已读' ? 'var(--cursor-success)' : 'var(--cursor-gold)',
                    }}>
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
            }}>
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
                3级升级规则
              </h4>
              {Object.entries(ESCALATION_RULES).map(([key, rule]) => (
                <div key={key} className="flex items-center gap-2 py-1 text-[10px]">
                  <span className={cn(
                    'ticket-type',
                    key === 'Level3' ? 'ticket-type--escalation' :
                    key === 'Level2' ? 'ticket-type--customer_complaint' :
                    'ticket-type--store_ticket'
                  )}>
                    {key}
                  </span>
                  <span style={{ color: 'var(--cursor-ink)' }}>{rule.name}</span>
                  <span className="ml-auto font-mono" style={{ color: 'var(--cursor-border-55)' }}>
                    SLA: {rule.sla_hours}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ 七鱼 Session Monitor ═══ */}
        <div className="mt-6 metric-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
              七鱼平台会话监控
            </h3>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--cursor-border-55)' }}>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full" style={{ background: CHART_LOW }} />
                {MOCK_SESSIONS.filter(s => s.session_state === 'active').length} 对话中
              </span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full" style={{ background: CHART_MEDIUM }} />
                {MOCK_SESSIONS.filter(s => s.session_state === 'queue').length} 排队
              </span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full" style={{ background: CHART_BLUE }} />
                {MOCK_SESSIONS.filter(s => s.session_state === 'handoff').length} 转人工
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {MOCK_SESSIONS.slice(0, 8).map(session => (
              <div
                key={session.sessionId}
                className="rounded-lg p-2.5 transition-colors"
                style={{ border: '1px solid var(--cursor-border-10)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cursor-surface-300)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: session.risk_level === 'high' ? CHART_HIGH
                        : session.risk_level === 'medium' ? CHART_MEDIUM
                        : session.risk_level === 'low' ? CHART_LOW
                        : 'var(--cursor-border-55)',
                    }}
                  />
                  <span className="text-[10px] font-mono" style={{ color: 'var(--cursor-ink)' }}>
                    {session.sessionId}
                  </span>
                  <span className={cn(
                    'ml-auto session-badge',
                    session.session_state === 'active' ? 'session-badge--active' :
                    session.session_state === 'queue' ? 'session-badge--queue' :
                    session.session_state === 'handoff' ? 'session-badge--handoff' :
                    'session-badge--resolved'
                  )}>
                    {session.session_state === 'active' ? '对话' :
                     session.session_state === 'queue' ? '排队' :
                     session.session_state === 'handoff' ? '转人工' :
                     session.session_state === 'resolved' ? '已解决' : '关闭'}
                  </span>
                </div>
                {session.classification && (
                  <p className="truncate text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
                    {session.classification.split('/').pop()}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-1 text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>
                  <span>{session.handler === 'AI' ? '阿喜AI' : session.handler || '待分配'}</span>
                  {session.turn_count > 0 && <span>·{session.turn_count}轮</span>}
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
          }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(245,78,0,0.08)' }}>
                <Brain className="h-5 w-5" style={{ color: 'var(--cursor-orange)' }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--cursor-ink)' }}>{AGENT_FRAMEWORK.name}</h3>
                <p className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }}>
                  {AGENT_FRAMEWORK.theory_basis} · {AGENT_FRAMEWORK.reference}
                </p>
              </div>
              <span className="ml-auto rounded-md px-2 py-0.5 text-[10px] font-medium" style={{
                background: 'rgba(245,78,0,0.08)',
                color: 'var(--cursor-orange)',
              }}>v{AGENT_FRAMEWORK.version}</span>
            </div>

            {/* 闭环架构可视化 */}
            <div className="flex items-center justify-center gap-0 py-3">
              {Object.entries(AGENT_FRAMEWORK.architecture).map(([key, module], i) => {
                const colors = {
                  perception: { bg: '#f54e00', svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><ellipse cx="9" cy="9" rx="7" ry="4" stroke="#f54e00" strokeWidth="1.5"/><circle cx="9" cy="9" r="2" fill="#f54e00"/></svg> },
                  memory: { bg: '#8e44ad', svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="2" width="12" height="14" rx="2" stroke="#8e44ad" strokeWidth="1.5"/><line x1="6" y1="5.5" x2="12" y2="5.5" stroke="#8e44ad" strokeWidth="1" opacity="0.6"/><line x1="6" y1="8.5" x2="10" y2="8.5" stroke="#8e44ad" strokeWidth="1" opacity="0.4"/><line x1="6" y1="11.5" x2="11" y2="11.5" stroke="#8e44ad" strokeWidth="1" opacity="0.3"/></svg> },
                  decision: { bg: '#2980b9', svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="#2980b9" strokeWidth="1.5"/><path d="M6 9l2 2 4-4" stroke="#2980b9" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                  action: { bg: '#27ae60', svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 4l8 5-8 5V4z" fill="#27ae60" opacity="0.2" stroke="#27ae60" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
                  closed_loop: { bg: '#e67e22', svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13 6a5 5 0 11-7.5 4" stroke="#e67e22" strokeWidth="1.5" strokeLinecap="round"/><path d="M5 12a5 5 0 117.5-4" stroke="#e67e22" strokeWidth="1.5" strokeLinecap="round"/><path d="M13 4v2h-2" stroke="#e67e22" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 14v-2h2" stroke="#e67e22" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                }
                const c = colors[key] || { bg: '#999', svg: <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="3" fill="#999"/></svg> }
                return (
                  <div key={key} className="flex items-center">
                    <div className="flex flex-col items-center text-center" style={{ minWidth: 100 }}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{
                        background: c.bg + '15',
                        border: `2px solid ${c.bg}40`,
                      }}>{c.svg}</div>
                      <span className="mt-1.5 text-[11px] font-medium" style={{ color: c.bg }}>{module.name.split(' (')[0]}</span>
                      <span className="text-[9px] max-w-[90px]" style={{ color: 'var(--cursor-border-55)' }}>
                        {module.capabilities.length}项能力
                      </span>
                    </div>
                    {i < Object.keys(AGENT_FRAMEWORK.architecture).length - 1 && (
                      <svg width="24" height="12" className="mx-1 flex-shrink-0">
                        <path d="M2 6 L18 6" stroke={c.bg} strokeWidth="1.5" fill="none" />
                        <path d="M15 2 L20 6 L15 10" stroke={c.bg} strokeWidth="1.5" fill="none" />
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 闭环回路箭头 */}
            <div className="flex justify-center">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px]" style={{
                background: 'rgba(230,126,34,0.08)',
                color: '#e67e22',
                border: '1px dashed rgba(230,126,34,0.3)',
              }}>
                <RotateCcw className="h-3 w-3" />
                感知→决策→执行→再感知 实时闭环 (持续进化)
              </div>
            </div>
          </div>

          {/* 各模块详情 */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
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
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                    <span className="text-xs font-semibold" style={{ color }}>{module.name.split(' (')[0]}</span>
                  </div>
                  <p className="text-[10px] mb-2" style={{ color: 'var(--cursor-border-55)' }}>{module.theory}</p>
                  <div className="flex flex-wrap gap-1">
                    {module.capabilities.map((cap, i) => (
                      <span key={i} className="rounded px-1.5 py-0.5 text-[9px]" style={{
                        background: `${color}10`,
                        color: color,
                        border: `1px solid ${color}20`,
                      }}>{cap}</span>
                    ))}
                  </div>
                  <p className="mt-2 text-[9px] italic" style={{ color: 'var(--cursor-border-55)' }}>
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
          }}>
            <h3 className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }}>
              <Layers className="h-3.5 w-3.5" style={{ color: '#8e44ad' }} />
              工具注册表 ({AGENT_TOOL_REGISTRY.length} 个工具)
            </h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
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
                  }}>
                    <div className="h-1.5 w-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: color }} />
                    <div>
                      <div className="font-medium" style={{ color: 'var(--cursor-ink)' }}>{tool.name}</div>
                      <div style={{ color: 'var(--cursor-border-55)' }}>{tool.description}</div>
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
          }}>
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }}>
              <Database className="h-3.5 w-3.5" style={{ color: '#2980b9' }} />
              身份记忆 — {AGENT_IDENTITY.full_title}
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <span className="text-[10px] font-medium" style={{ color: 'var(--cursor-border-55)' }}>行为准则</span>
                <div className="mt-1 space-y-1">
                  {AGENT_IDENTITY.behavioral_principles.map((p, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[10px]" style={{ color: 'var(--cursor-ink)' }}>
                      <span className="mt-0.5 h-1 w-1 rounded-full flex-shrink-0" style={{ background: '#2980b9' }} />
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-medium" style={{ color: 'var(--cursor-border-55)' }}>沟通风格</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className="rounded px-2 py-0.5 text-[10px]" style={{ background: '#27ae6015', color: '#27ae60' }}>
                    语调: {AGENT_IDENTITY.communication_style.tone}
                  </span>
                  <span className="rounded px-2 py-0.5 text-[10px]" style={{ background: '#2980b915', color: '#2980b9' }}>
                    第一人称: {AGENT_IDENTITY.communication_style.pronoun}
                  </span>
                  <span className="rounded px-2 py-0.5 text-[10px]" style={{ background: '#8e44ad15', color: '#8e44ad' }}>
                    称呼: {AGENT_IDENTITY.communication_style.customer_address}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-[10px] font-medium" style={{ color: 'var(--cursor-border-55)' }}>禁用词</span>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {AGENT_IDENTITY.communication_style.forbidden.map((f, i) => (
                      <span key={i} className="rounded px-1.5 py-0.5 text-[9px]" style={{
                        background: 'rgba(207,45,86,0.08)',
                        color: '#cf2d56',
                      }}>✕ {f}</span>
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
