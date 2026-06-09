import { useState, useMemo } from 'react'
import {
  Search, ChevronRight, ChevronDown, BookOpen, Shield,
  AlertTriangle, Bug, Leaf, HeartPulse, Clock, CupSoda,
  FileText, FlaskConical, ArrowRightLeft, GitBranch, Zap,
  MessageSquare, BarChart3, Layers, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { cn } from '../../lib/utils.js'
import {
  FOOD_SAFETY_CATEGORIES,
  COMPENSATION_MATRIX,
} from '../../lib/mock-data.js'
import { classifyFoodSafety } from '../../lib/agent-engine.js'
import {
  STRATEGY_META, OPENING_SCRIPTS, QUEUE_SCRIPTS, ACKNOWLEDGMENT_SCRIPTS,
  INFO_COLLECTION_SCRIPTS, EMPATHY_SCRIPTS, SOLUTION_SCRIPTS,
  CLOSING_SCRIPTS, ESCALATION_SCRIPTS, CATEGORY_STRATEGY_STATS,
  STRATEGY_CHAINS, GLOBAL_STRATEGY_FREQ, STRATEGY_COLORS,
} from '../../lib/strategy-kb.js'

const categoryIcons = {
  'bug': Bug,
  'leaf': Leaf,
  'heart-pulse': HeartPulse,
  'alert-triangle': AlertTriangle,
  'clock': Clock,
  'cup-soda': CupSoda,
}

const riskBadgeClass = { high: 'badge-risk-high', medium: 'badge-risk-medium', low: 'badge-risk-low' }
const riskLabel = { high: '高风险', medium: '中风险', low: '低风险' }

/* ─── Tree Node ─── */
function TreeNode({ category, selectedId, onSelect, level = 0 }) {
  const [expanded, setExpanded] = useState(level === 0)
  const hasChildren = category.children && category.children.length > 0
  const Icon = categoryIcons[category.icon] || BookOpen

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => {
          if (hasChildren) setExpanded(!expanded)
          onSelect(category)
        }}
        className={cn(
          'tree-node w-full justify-start',
          selectedId === category.id && 'selected'
        )}
        style={{ paddingLeft: `${level * 16 + 10}px` }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }} />
            : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }} />
        ) : (
          <span className="w-3.5" />
        )}
        <Icon className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--cursor-orange)' }} />
        <span className="flex-1 truncate text-left">{category.name}</span>
        <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }}>{category.count}</span>
        {category.riskLevel && (
          <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{
            background: category.riskLevel === 'high' ? 'var(--cursor-error)' :
              category.riskLevel === 'medium' ? 'var(--cursor-gold)' : 'var(--cursor-success)',
          }} />
        )}
      </Button>

      {expanded && hasChildren && (
        <div>
          {category.children.map((child) => (
            <TreeNode
              key={child.id}
              category={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Boundary Pairs Panel ─── */
const KNOWN_BOUNDARY_PAIRS_DISPLAY = [
  { pair: ['OEM变质', '原料变质'], risk: '混淆OEM与自制产品' },
  { pair: ['OEM变质', '饮品异味'], risk: '变质与异味的界限' },
  { pair: ['产品有效期', 'OEM过期'], risk: '日期标签模糊' },
  { pair: ['虫类', '苍蝇或蟑螂'], risk: '昆虫分类边界' },
  { pair: ['不明物', '杯盖或小白塞'], risk: '包装部件误判' },
  { pair: ['不明物', '果蔬杂质'], risk: '异物来源判断' },
  { pair: ['果皮', '果蔬杂质'], risk: '天然原料边界' },
  { pair: ['水果纤维', '果蔬杂质'], risk: '纤维与杂质' },
  { pair: ['腹泻', '其它不适'], risk: '症状描述模糊' },
  { pair: ['呕吐', '其它不适'], risk: '症状描述模糊' },
]

function BoundaryPairsPanel() {
  return (
    <div className="rounded-lg p-4" style={{
      border: '1px solid var(--cursor-border-10)',
      background: 'var(--cursor-surface-100)',
    }} data-component="boundary-pairs">
      <div className="mb-3 flex items-center gap-2">
        <ArrowRightLeft className="h-4 w-4" style={{ color: 'var(--cursor-orange)' }} />
        <h4 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
          已知边界混淆对 (10组)
        </h4>
      </div>
      <p className="mb-3 text-xs" style={{ color: 'var(--cursor-border-55)' }}>
        这些分类对在实际案例中容易混淆，贝叶斯分类器会检测边界风险并触发人工复核。
      </p>
      <div className="space-y-1.5">
        {KNOWN_BOUNDARY_PAIRS_DISPLAY.map((bp, i) => (
          <div key={i} className="boundary-pair">
            <span className="text-xs font-medium" style={{ color: 'var(--cursor-ink)' }}>
              {bp.pair[0]}
            </span>
            <ArrowRightLeft className="h-3 w-3 boundary-pair__arrow" />
            <span className="text-xs font-medium" style={{ color: 'var(--cursor-ink)' }}>
              {bp.pair[1]}
            </span>
            <span className="ml-auto text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
              {bp.risk}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Entry Detail Panel ─── */
function EntryDetail({ entry }) {
  if (!entry) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center" data-component="entry-detail-empty">
        <FlaskConical className="mb-3 h-10 w-10" style={{ color: 'var(--cursor-border-20)' }} />
        <p className="text-sm" style={{ color: 'var(--cursor-border-55)' }}>
          选择一个分类查看详细信息
        </p>
      </div>
    )
  }

  const riskLevel = entry.riskLevel || 'medium'

  return (
    <div className="animate-fade-in" data-component="entry-detail">
      <div className="mb-4 flex items-start gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: 'var(--cursor-surface-500)' }}
        >
          <Shield className="h-5 w-5" style={{ color: 'var(--cursor-orange)' }} />
        </div>
        <div>
          <h3 className="text-base font-semibold cursor-display" style={{ color: 'var(--cursor-ink)' }}>
            {entry.name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span className={riskBadgeClass[riskLevel]}>
              {riskLabel[riskLevel]}
            </span>
            {entry.count !== undefined && (
              <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }}>
                历史 {entry.count} 例
              </span>
            )}
          </div>
        </div>
      </div>

      {entry.description && (
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
            分类描述
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--cursor-ink)' }}>
            {entry.description}
          </p>
        </div>
      )}

      {/* Keywords */}
      {entry.keywords && entry.keywords.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
            关键词 (贝叶斯似然)
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {entry.keywords.map(kw => (
              <span key={kw} className="tag-pill text-xs">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {/* Real Patterns - Solutions & Compensation (from 38,644 conversations) */}
      {entry.realPatterns && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg p-3" style={{
            border: '1px solid var(--cursor-border-10)',
            background: 'var(--cursor-surface-300)',
          }}>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
              真实方案类型
            </h4>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {entry.realPatterns.solutions.map((s, i) => (
                <span key={i} className="rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{
                  background: 'var(--cursor-surface-500)',
                  color: 'var(--cursor-orange)',
                }}>{s}</span>
              ))}
            </div>
            <p className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
              代金券区间: {entry.realPatterns.voucherRange}
            </p>
          </div>
          <div className="rounded-lg p-3" style={{
            border: '1px solid var(--cursor-border-10)',
            background: 'var(--cursor-surface-300)',
          }}>
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
              回访时效 & 统计
            </h4>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3 w-3" style={{ color: 'var(--cursor-orange)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--cursor-ink)' }}>
                {entry.realPatterns.callbackCommitment}
              </span>
            </div>
            <div className="space-y-0.5 text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
              <p>平均轮次: {entry.realPatterns.avgTurns} 轮</p>
              <p>真实会话: {entry.realPatterns.realConversations} 条</p>
            </div>
          </div>
        </div>
      )}

      {/* Fallback: old compensation/escalation when no realPatterns */}
      {!entry.realPatterns && (entry.compensation || entry.escalation) && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          {entry.compensation && (
            <div className="rounded-lg p-3" style={{
              border: '1px solid var(--cursor-border-10)',
              background: 'var(--cursor-surface-300)',
            }}>
              <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
                补偿等级
              </h4>
              <div className="flex items-center gap-2">
                <span className={`comp-level comp-level--${entry.compensation}`}>
                  {entry.compensation.replace('L', '')}
                </span>
                <span className="text-xs" style={{ color: 'var(--cursor-ink)' }}>
                  {COMPENSATION_MATRIX[entry.compensation]?.action || '按流程处理'}
                </span>
              </div>
              {COMPENSATION_MATRIX[entry.compensation] && (
                <p className="mt-1 text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
                  审批: {COMPENSATION_MATRIX[entry.compensation].approval}
                </p>
              )}
            </div>
          )}
          {entry.escalation && (
            <div className="rounded-lg p-3" style={{
              border: '1px solid var(--cursor-border-10)',
              background: 'var(--cursor-surface-300)',
            }}>
              <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
                升级规则
              </h4>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'ticket-type',
                  entry.escalation === 'Level2' ? 'ticket-type--escalation' : 'ticket-type--store_ticket'
                )}>
                  {entry.escalation}
                </span>
                <span className="text-xs" style={{ color: 'var(--cursor-ink)' }}>
                  {entry.escalation === 'Level2' ? '专员+门店负责人' : entry.escalation === 'Level3' ? '总部品质+法务' : '门店负责人'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Label info */}
      {entry.label && (
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
            完整标签路径
          </h4>
          <div className="rounded-lg p-2 font-mono text-xs" style={{
            background: 'var(--cursor-surface-300)',
            border: '1px solid var(--cursor-border-10)',
            color: 'var(--cursor-ink)',
          }}>
            {entry.label}
          </div>
        </div>
      )}

      {/* Real Strategy Chain (from 38,644 real conversations) */}
      {entry.realPatterns?.chain && (
        <div
          className="rounded-lg p-3"
          style={{
            border: '1px solid var(--cursor-border-10)',
            background: 'var(--cursor-surface-300)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
              真实应对策略链
            </h4>
            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{ background: 'var(--cursor-orange)', color: 'white' }}>
              真实提取
            </span>
          </div>
          <p className="text-[10px] mb-3" style={{ color: 'var(--cursor-border-55)' }}>
            基于 {entry.realPatterns.realConversations} 条真实客服会话提取，反映实际应对流程
          </p>
          <div className="space-y-2 text-xs" style={{ color: 'var(--cursor-ink)' }}>
            {entry.realPatterns.chain.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ background: 'var(--cursor-orange)' }}>{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback: generic flow when no realPatterns */}
      {!entry.realPatterns?.chain && (
        <div
          className="rounded-lg p-3"
          style={{
            border: '1px solid var(--cursor-border-10)',
            background: 'var(--cursor-surface-300)',
          }}
        >
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
            处理流程
          </h4>
          <div className="space-y-2 text-xs" style={{ color: 'var(--cursor-ink)' }}>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ background: 'var(--cursor-orange)' }}>1</span>
              <span>AI 贝叶斯分类器识别食安问题类型</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ background: 'var(--cursor-orange)' }}>2</span>
              <span>核实订单信息和图片证据 (三合一)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ background: 'var(--cursor-orange)' }}>3</span>
              <span>
                {riskLevel === 'high' ? '创建工单并升级通知负责人' : riskLevel === 'medium' ? '生成补偿方案并通知门店' : '安排重做或小额补偿'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ background: 'var(--cursor-orange)' }}>4</span>
              <span>红线审核 → 阿喜人设回复 → 跟进记录</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── RAG Test Panel with Bayesian ─── */
function RAGTestPanel() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [bayesianResult, setBayesianResult] = useState(null)

  const handleSearch = () => {
    if (!query.trim()) return
    setIsSearching(true)

    // Run Bayesian classifier on the query
    try {
      const classification = classifyFoodSafety(query)
      setBayesianResult(classification)
    } catch (e) {
      console.warn('Classifier error:', e)
    }

    // Simulate RAG retrieval
    setTimeout(() => {
      setResults([
        {
          id: 'doc-001',
          title: '外源性异物处理规范',
          score: 0.94,
          snippet: '外源性异物指从外部环境或操作流程中混入的非食品成分物质，包括但不限于毛发、虫类、金属碎片、塑料残片等。处理时需先确认异物类型，评估风险等级，然后按相应流程生成补偿方案...',
        },
        {
          id: 'doc-002',
          title: '食安风险等级评估标准',
          score: 0.87,
          snippet: '高风险：金属、玻璃、苍蝇蟑螂、身体不适、原料变质、OEM变质/过期——需建单并通知区域负责人。中风险：毛发、虫类、塑料、纸类、饮品异味——全额退款+代金券+门店回访...',
        },
      ])
      setIsSearching(false)
    }, 600)
  }

  return (
    <div
      className="rounded-lg p-4"
      style={{
        border: '1px solid var(--cursor-border-10)',
        background: 'var(--cursor-surface-100)',
      }}
      data-component="rag-test-panel"
    >
      <div className="mb-3 flex items-center gap-2">
        <FlaskConical className="h-4 w-4" style={{ color: 'var(--cursor-orange)' }} />
        <h4 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
          RAG 检索 + 贝叶斯分类测试
        </h4>
      </div>
      <div className="mb-3 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="输入用户描述，测试分类+检索效果..."
          className="flex-1 rounded-lg px-3 py-2 text-sm"
          style={{
            border: '1px solid var(--cursor-border-10)',
            background: 'var(--cursor-surface-400)',
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
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? '分析中...' : '分析'}
        </Button>
      </div>

      {/* Bayesian result */}
      {bayesianResult && (
        <div className="mb-3 rounded-lg p-3" style={{
          border: '1px solid var(--cursor-border-10)',
          background: 'var(--cursor-surface-300)',
        }}>
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="h-3.5 w-3.5" style={{ color: 'var(--cursor-orange)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--cursor-ink)' }}>
              贝叶斯分类结果
            </span>
            <span className={cn(
              'ml-auto emotion-indicator',
              bayesianResult.risk_level === 'high' ? 'emotion-indicator--urgent' :
              bayesianResult.risk_level === 'medium' ? 'emotion-indicator--elevated' :
              'emotion-indicator--normal'
            )}>
              {riskLabel[bayesianResult.risk_level] || '低风险'}
            </span>
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: 'var(--cursor-ink)' }}>
                {bayesianResult.consult_type?.split('/').pop() || '分析中'}
              </span>
              <span className="font-mono" style={{ color: 'var(--cursor-orange)' }}>
                {Math.round(bayesianResult.confidence * 100)}%
              </span>
            </div>
            <div className="bayesian-bar">
              <div
                className={cn('bayesian-bar__fill',
                  bayesianResult.risk_level === 'high' ? 'bayesian-bar__fill--high' :
                  bayesianResult.risk_level === 'medium' ? 'bayesian-bar__fill--medium' :
                  'bayesian-bar__fill--low'
                )}
                style={{ width: `${bayesianResult.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Top 5 posteriors */}
          {bayesianResult.posteriors && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
                Top 5 后验概率
              </p>
              {bayesianResult.posteriors.map((p, i) => (
                <div key={i} className="posterior-item">
                  <span className="posterior-item__label">
                    {p.label.split('/').pop()}
                  </span>
                  <span className="posterior-item__prob">
                    {(p.prob * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Evidence */}
          {bayesianResult.evidence && bayesianResult.evidence.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
                证据链
              </p>
              {bayesianResult.evidence.map((ev, i) => (
                <p key={i} className="text-[10px]" style={{ color: 'var(--cursor-ink)' }}>
                  {ev}
                </p>
              ))}
            </div>
          )}

          {/* Flags */}
          <div className="mt-2 flex flex-wrap gap-1">
            {bayesianResult.need_human_review && (
              <span className="human-review-tag">
                <Eye className="h-2.5 w-2.5" /> 需人工复核
              </span>
            )}
            {bayesianResult.boundary_risk && (
              <span className="boundary-pair" style={{ padding: '2px 6px' }}>
                <ArrowRightLeft className="h-2.5 w-2.5" /> 边界风险
              </span>
            )}
            {bayesianResult.is_food_safety === false && (
              <span className="tag-pill text-[10px]">非食安问题</span>
            )}
          </div>
        </div>
      )}

      {/* RAG results */}
      {results && (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: 'var(--cursor-border-55)' }}>
            检索到 {results.length} 个相关文档
          </p>
          {results.map((doc) => (
            <div
              key={doc.id}
              className="rounded-lg p-3"
              style={{
                border: '1px solid var(--cursor-border-10)',
                background: 'var(--cursor-surface-400)',
              }}
            >
              <div className="mb-1 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" style={{ color: 'var(--cursor-orange)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
                  {doc.title}
                </span>
                <span
                  className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: 'var(--cursor-surface-500)', color: 'var(--cursor-orange)' }}
                >
                  相关度 {Math.round(doc.score * 100)}%
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-border-55)' }}>
                {doc.snippet}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Script Library (powered by real extracted data) ─── */
const SCRIPT_LIBRARY = [
  { name: '标准开场白', script: OPENING_SCRIPTS[0].template, trigger: '首轮对话', count: OPENING_SCRIPTS[0].count },
  { name: '排队提示', script: QUEUE_SCRIPTS[0], trigger: '高峰期排队', count: 7981 },
  { name: '人工确认接入', script: ACKNOWLEDGMENT_SCRIPTS[0], trigger: '机器人转人工', count: 10539 },
  { name: '三合一信息收集', script: '非常抱歉给您带来不好的体验，请您提供下单手机号码或订单编号、以及收到的饮品及标签图片，阿喜查看记录一下', trigger: '信息缺口', count: 28923 },
  { name: '安抚共情', script: EMPATHY_SCRIPTS[0], trigger: '用户情绪激动', count: 38887 },
  { name: '方案提供-代金券', script: '阿喜为您特殊申请一张25元无门槛代金券（30天有效，24小时内发放到账），诚邀您再次体验', trigger: 'L2-L4补偿', count: 16115 },
  { name: '升级转接', script: ESCALATION_SCRIPTS[0], trigger: '用户要求投诉', count: 903 },
  { name: '确认收尾', script: CLOSING_SCRIPTS[0], trigger: '方案确认', count: 134 },
]

function ScriptLibrary() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg p-4" style={{
      border: '1px solid var(--cursor-border-10)',
      background: 'var(--cursor-surface-100)',
    }} data-component="script-library">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-4 w-4" style={{ color: 'var(--cursor-orange)' }} />
        <h4 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
          阿喜话术库 (8模板 · 真实提取)
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '收起' : '展开'}
        </Button>
      </div>

      {expanded && (
        <div className="space-y-2 animate-fade-in">
          {SCRIPT_LIBRARY.map((s, i) => (
            <div key={i} className="rounded-lg p-2.5" style={{
              border: '1px solid var(--cursor-border-10)',
              background: 'var(--cursor-surface-400)',
            }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--cursor-ink)' }}>{s.name}</span>
                <span className="tag-pill text-[9px] ml-auto">{s.trigger}</span>
                {s.count && (
                  <span className="text-[9px] font-mono" style={{ color: 'var(--cursor-border-55)' }}>
                    {s.count.toLocaleString()}次
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--cursor-border-55)' }}>
                {s.script}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Strategy Section Card ─── */
function StrategySection({ title, icon: Icon, children, defaultOpen = false, badge }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg" style={{ border: '1px solid var(--cursor-border-10)', background: 'var(--cursor-surface-100)' }}>
      <button
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <Icon className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--cursor-orange)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>{title}</span>
        {badge && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: 'var(--cursor-surface-500)', color: 'var(--cursor-orange)' }}>
            {badge}
          </span>
        )}
        {open ? <ChevronDown className="h-3.5 w-3.5 ml-auto" style={{ color: 'var(--cursor-border-55)' }} />
          : <ChevronRight className="h-3.5 w-3.5 ml-auto" style={{ color: 'var(--cursor-border-55)' }} />}
      </button>
      {open && <div className="px-4 pb-4 animate-fade-in">{children}</div>}
    </div>
  )
}

/* ─── Strategy Chain Visualizer ─── */
function StrategyChainView({ chain }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chain.map((step, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{
            background: STRATEGY_COLORS[step.strategy]?.bg || 'var(--cursor-surface-300)',
            border: `1px solid ${STRATEGY_COLORS[step.strategy]?.fg || 'var(--cursor-border-10)'}20`,
          }}>
            <span className="text-[10px] font-medium" style={{ color: STRATEGY_COLORS[step.strategy]?.fg || 'var(--cursor-ink)' }}>
              {step.step}
            </span>
          </div>
          {i < chain.length - 1 && (
            <ChevronRight className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--cursor-border-20)' }} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── Strategy Knowledge Base Panel ─── */
function StrategyPanel() {
  const [selectedCategory, setSelectedCategory] = useState('异物-果核')
  const [selectedChainCat, setSelectedChainCat] = useState('异物-果核')
  const solutionCategories = Object.keys(SOLUTION_SCRIPTS)
  const chainCategories = Object.keys(STRATEGY_CHAINS)

  const totalStrategies = Object.values(GLOBAL_STRATEGY_FREQ).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-4" data-component="strategy-panel">
      {/* Overview Stats */}
      <div className="rounded-lg p-4" style={{ border: '1px solid var(--cursor-border-10)', background: 'var(--cursor-surface-100)' }}>
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" style={{ color: 'var(--cursor-orange)' }} />
          <h4 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }}>
            提取概览
          </h4>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-3">
          {[
            { label: '处理文件', value: STRATEGY_META.totalFiles, unit: '个' },
            { label: '真实对话', value: STRATEGY_META.totalConversations.toLocaleString(), unit: '条' },
            { label: '客诉分类', value: STRATEGY_META.totalCategories, unit: '类' },
            { label: '提取策略', value: totalStrategies.toLocaleString(), unit: '条' },
          ].map((stat, i) => (
            <div key={i} className="rounded-lg p-2.5 text-center" style={{ background: 'var(--cursor-surface-300)', border: '1px solid var(--cursor-border-10)' }}>
              <div className="text-lg font-bold" style={{ color: 'var(--cursor-orange)' }}>
                {stat.value}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
                {stat.label} ({stat.unit})
              </div>
            </div>
          ))}
        </div>
        {/* Strategy frequency bar */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
            全局策略频次分布
          </p>
          {Object.entries(GLOBAL_STRATEGY_FREQ).sort((a, b) => b[1] - a[1]).map(([key, count]) => {
            const pct = (count / totalStrategies * 100).toFixed(1)
            const color = STRATEGY_COLORS[key]
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="w-16 text-[10px] font-medium truncate" style={{ color: color?.fg || 'var(--cursor-ink)' }}>
                  {color?.label || key}
                </span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--cursor-surface-300)' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${(count / GLOBAL_STRATEGY_FREQ.opening) * 100}%`,
                    background: color?.fg || 'var(--cursor-orange)',
                    opacity: 0.7,
                  }} />
                </div>
                <span className="w-16 text-right text-[10px] font-mono" style={{ color: 'var(--cursor-border-55)' }}>
                  {count.toLocaleString()} ({pct}%)
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Opening Scripts */}
      <StrategySection title="开场白模板" icon={MessageSquare} badge={`${OPENING_SCRIPTS.length} 个模板`} defaultOpen>
        <div className="space-y-2">
          {OPENING_SCRIPTS.map((s, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg p-2.5" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }}>
              <span className="flex-shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: STRATEGY_COLORS.opening.fg }}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-ink)' }}>{s.template}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="tag-pill text-[9px]">{s.type}</span>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--cursor-border-55)' }}>
                    使用 {s.count.toLocaleString()} 次
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </StrategySection>

      {/* Queue + Acknowledgment */}
      <StrategySection title="排队管理 & 接入确认" icon={Clock} badge={`${QUEUE_SCRIPTS.length + ACKNOWLEDGMENT_SCRIPTS.length} 条`}>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--cursor-border-55)' }}>
              排队管理 ({QUEUE_SCRIPTS.length})
            </p>
            {QUEUE_SCRIPTS.map((s, i) => (
              <div key={i} className="rounded-lg p-2 mb-1" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }}>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-ink)' }}>{s}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--cursor-border-55)' }}>
              接入确认 ({ACKNOWLEDGMENT_SCRIPTS.length})
            </p>
            {ACKNOWLEDGMENT_SCRIPTS.map((s, i) => (
              <div key={i} className="rounded-lg p-2 mb-1" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }}>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-ink)' }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      </StrategySection>

      {/* Info Collection */}
      <StrategySection title="信息收集话术" icon={Search} badge="5 类">
        <div className="space-y-3">
          {INFO_COLLECTION_SCRIPTS.map((group, i) => (
            <div key={i}>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: STRATEGY_COLORS.info_collection.fg }}>
                {group.type} ({group.examples.length})
              </p>
              {group.examples.map((ex, j) => (
                <div key={j} className="rounded-lg p-2 mb-1" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }}>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-ink)' }}>{ex}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </StrategySection>

      {/* Empathy Scripts */}
      <StrategySection title="安抚共情话术" icon={HeartPulse} badge={`${EMPATHY_SCRIPTS.length} 条`}>
        <div className="space-y-1.5">
          {EMPATHY_SCRIPTS.map((s, i) => (
            <div key={i} className="rounded-lg p-2.5" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }}>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-ink)' }}>{s}</p>
            </div>
          ))}
        </div>
      </StrategySection>

      {/* Solution Scripts by Category */}
      <StrategySection title="解决方案话术（按分类）" icon={Zap} badge={`${solutionCategories.length} 个分类`} defaultOpen>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {solutionCategories.map(cat => (
            <button
              key={cat}
              className="rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors"
              style={selectedCategory === cat ? {
                background: 'var(--cursor-orange)',
                color: 'white',
              } : {
                background: 'var(--cursor-surface-300)',
                color: 'var(--cursor-ink)',
                border: '1px solid var(--cursor-border-10)',
              }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        {SOLUTION_SCRIPTS[selectedCategory] && (
          <div className="space-y-3">
            {Object.entries(SOLUTION_SCRIPTS[selectedCategory]).map(([type, scripts]) => (
              <div key={type}>
                <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--cursor-orange)' }}>
                  {type} ({scripts.length})
                </p>
                {scripts.map((s, i) => (
                  <div key={i} className="rounded-lg p-2 mb-1" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }}>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-ink)' }}>{s}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </StrategySection>

      {/* Strategy Chains */}
      <StrategySection title="应对策略链（可视化流程）" icon={Layers} badge={`${chainCategories.length} 个分类`} defaultOpen>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {chainCategories.map(cat => (
            <button
              key={cat}
              className="rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors"
              style={selectedChainCat === cat ? {
                background: 'var(--cursor-orange)',
                color: 'white',
              } : {
                background: 'var(--cursor-surface-300)',
                color: 'var(--cursor-ink)',
                border: '1px solid var(--cursor-border-10)',
              }}
              onClick={() => setSelectedChainCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        {STRATEGY_CHAINS[selectedChainCat] && (
          <div className="space-y-3">
            <StrategyChainView chain={STRATEGY_CHAINS[selectedChainCat]} />
            {/* Detailed steps */}
            <div className="space-y-1.5">
              {STRATEGY_CHAINS[selectedChainCat].map((step, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg p-2" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }}>
                  <span className="flex-shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: STRATEGY_COLORS[step.strategy]?.fg || 'var(--cursor-orange)' }}>
                    {i + 1}
                  </span>
                  <div>
                    <span className="text-[10px] font-medium" style={{ color: STRATEGY_COLORS[step.strategy]?.fg || 'var(--cursor-ink)' }}>
                      {step.step}
                    </span>
                    <span className="text-xs ml-1" style={{ color: 'var(--cursor-ink)' }}>
                      {step.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </StrategySection>

      {/* Closing + Escalation */}
      <StrategySection title="收尾 & 升级转接" icon={GitBranch} badge={`${CLOSING_SCRIPTS.length + ESCALATION_SCRIPTS.length} 条`}>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: STRATEGY_COLORS.closing.fg }}>
              收尾话术 ({CLOSING_SCRIPTS.length})
            </p>
            {CLOSING_SCRIPTS.map((s, i) => (
              <div key={i} className="rounded-lg p-2 mb-1" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }}>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-ink)' }}>{s}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: STRATEGY_COLORS.escalation.fg }}>
              升级转接 ({ESCALATION_SCRIPTS.length})
            </p>
            {ESCALATION_SCRIPTS.map((s, i) => (
              <div key={i} className="rounded-lg p-2 mb-1" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }}>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-ink)' }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      </StrategySection>

      {/* Category Stats Table */}
      <StrategySection title="各分类策略统计" icon={BarChart3} badge="22 类">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cursor-border-10)' }}>
                <th className="text-left py-2 pr-3 font-medium" style={{ color: 'var(--cursor-border-55)' }}>分类</th>
                <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--cursor-border-55)' }}>会话数</th>
                <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--cursor-border-55)' }}>策略数</th>
                <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--cursor-border-55)' }}>平均轮次</th>
                <th className="text-left py-2 pl-3 font-medium" style={{ color: 'var(--cursor-border-55)' }}>主要策略</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(CATEGORY_STRATEGY_STATS)
                .sort((a, b) => b[1].conversations - a[1].conversations)
                .map(([cat, stats]) => (
                <tr key={cat} style={{ borderBottom: '1px solid var(--cursor-border-10)' }}>
                  <td className="py-1.5 pr-3 font-medium" style={{ color: 'var(--cursor-ink)' }}>{cat}</td>
                  <td className="py-1.5 px-2 text-right font-mono" style={{ color: 'var(--cursor-ink)' }}>{stats.conversations.toLocaleString()}</td>
                  <td className="py-1.5 px-2 text-right font-mono" style={{ color: 'var(--cursor-orange)' }}>{stats.strategies.toLocaleString()}</td>
                  <td className="py-1.5 px-2 text-right font-mono" style={{ color: 'var(--cursor-ink)' }}>{stats.avg_turns}</td>
                  <td className="py-1.5 pl-3">
                    <div className="flex flex-wrap gap-1">
                      {stats.top.slice(0, 3).map(t => (
                        <span key={t} className="rounded-full px-1.5 py-0.5 text-[9px]" style={{
                          background: STRATEGY_COLORS[t]?.bg || 'var(--cursor-surface-300)',
                          color: STRATEGY_COLORS[t]?.fg || 'var(--cursor-ink)',
                        }}>
                          {STRATEGY_COLORS[t]?.label || t}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StrategySection>
    </div>
  )
}

/* ─── Knowledge Base Main ─── */
export default function KnowledgeBase() {
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [rightTab, setRightTab] = useState('detail') // detail | boundary | script

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return FOOD_SAFETY_CATEGORIES
    const q = searchQuery.toLowerCase()
    return FOOD_SAFETY_CATEGORIES.map((cat) => ({
      ...cat,
      children: cat.children.filter(
        (child) =>
          child.name.toLowerCase().includes(q) ||
          (child.description && child.description.toLowerCase().includes(q))
      ),
    })).filter((cat) => cat.name.toLowerCase().includes(q) || cat.children.length > 0)
  }, [searchQuery])

  return (
    <div className="flex h-full" data-component="knowledge-base">
      {/* Left: Category Tree */}
      <div
        className="flex w-72 flex-col lg:w-80"
        style={{
          borderRight: '1px solid var(--cursor-border-10)',
          background: 'var(--cursor-surface-400)',
        }}
      >
        <div className="p-3" style={{ borderBottom: '1px solid var(--cursor-border-10)' }}>
          <h2 className="mb-2 text-sm font-semibold cursor-display" style={{ color: 'var(--cursor-ink)' }}>
            食安知识库
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--cursor-border-55)' }} />
            <input
              type="text"
              placeholder="搜索分类或描述..."
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

        <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
          {filteredCategories.map((cat) => (
            <TreeNode
              key={cat.id}
              category={cat}
              selectedId={selectedEntry?.id}
              onSelect={(entry) => {
                setSelectedEntry(entry)
                setRightTab('detail')
              }}
            />
          ))}
        </div>

        <div className="p-3" style={{ borderTop: '1px solid var(--cursor-border-10)' }}>
          <p className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }}>
            {FOOD_SAFETY_CATEGORIES.length} 大类 / {FOOD_SAFETY_CATEGORIES.reduce((a, c) => a + c.children.length, 0)} 子分类 · 23标签闭集
          </p>
        </div>
      </div>

      {/* Right: Detail + Panels */}
      <div className="flex flex-1 flex-col overflow-y-auto scrollbar-thin">
        {/* Tab bar */}
        <div className="flex gap-1 px-6 pt-4 pb-2" style={{ borderBottom: '1px solid var(--cursor-border-10)' }}>
          {[
            { key: 'detail', label: '分类详情', icon: Shield },
            { key: 'strategy', label: '应对策略', icon: Layers },
            { key: 'boundary', label: '边界混淆对', icon: ArrowRightLeft },
            { key: 'script', label: '话术库', icon: BookOpen },
          ].map(tab => {
            const TabIcon = tab.icon
            return (
              <Button
                key={tab.key}
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => setRightTab(tab.key)}
                style={rightTab === tab.key ? {
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

        <div className="flex-1 p-6">
          {rightTab === 'detail' && (
            <div className="space-y-6">
              <EntryDetail entry={selectedEntry} />
              <RAGTestPanel />
            </div>
          )}
          {rightTab === 'strategy' && <StrategyPanel />}
          {rightTab === 'boundary' && <BoundaryPairsPanel />}
          {rightTab === 'script' && <ScriptLibrary />}
        </div>
      </div>
    </div>
  )
}
