import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  Send, Image, Copy, RotateCcw, ThumbsUp, ThumbsDown,
  Shield, Package, Sparkles, ChevronRight, ChevronDown, Square,
  Clock, Zap, CheckCircle2, XCircle, AlertCircle, AlertTriangle,
  ArrowRight, GitBranch, Eye, Ticket, MoreHorizontal,
  Mic, MicOff, Paperclip, Phone, MessageCircle, X, Minimize2, Grip,
  Upload, HelpCircle, FileText,
  BarChart3, Users, ClipboardList, Activity, Settings, Search, TrendingUp, Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { cn } from '../../lib/utils.js'
import {
  MOCK_CONVERSATIONS,
  QUICK_PROMPTS,
  generateStreamingResponse,
} from '../../lib/mock-data.js'
import { generateBrandGreeting, BRAND } from '../../lib/brand-config.js'
import { processMessage, processMessageWithAgent, executeOrderWorkflow, generateLLMEnhancedReply } from '../../lib/agent-engine.js'
import { runFullSafetyCheck } from '../../lib/content-safety.js'
import { getLLMConfig, getModelDisplayName } from '../../lib/llm-client.js'

/* ─── Typing Indicator ─── */
function TypingDots() {
  return (
    <div className="typing-indicator py-1">
      <div className="dot animate-typing-dot" />
      <div className="dot animate-typing-dot-delayed" />
      <div className="dot animate-typing-dot-delayed-2" />
    </div>
  )
}

/* ─── Bayesian Bar — inline probability visualization ─── */
function BayesianBar({ prob, riskLevel }) {
  const pct = Math.round(prob * 100)
  const fillClass = riskLevel === 'high' ? 'bayesian-bar__fill--high'
    : riskLevel === 'medium' ? 'bayesian-bar__fill--medium'
    : 'bayesian-bar__fill--low'
  return (
    <div className="bayesian-bar w-full">
      <div className={`bayesian-bar__fill ${fillClass}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ─── Decision Card — shows Bayesian classification result ─── */
function DecisionCard({ frame, collapsed = true }) {
  const [expanded, setExpanded] = useState(!collapsed)
  if (!frame) return null

  const riskLabels = { high: '高风险', medium: '中风险', low: '低风险' }
  const actionLabels = {
    emotion_first: '情绪急救',
    ask_order_and_image: '信息收集',
    body_discomfort: '身体不适跟进',
    high_risk_foreign_object: '高危异物处理',
    normal_foreign_object: '异物处理',
    internal_material: '内源性异物',
    solution_offer: '方案提供',
    non_food_safety_transfer: '转非食安',
    closing_confirm: '确认收尾',
    generate_reply: '生成回复',
  }

  return (
    <div className="decision-card" data-component="decision-card">
      <div
        className="decision-card__header cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <GitBranch className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--cursor-orange)' }} />
        <span className="decision-card__label">
          {frame.top_label ? frame.top_label.split('/').pop() : '分析中'}
        </span>
        {frame.risk_level && (
          <span className={cn(
            'emotion-indicator',
            frame.risk_level === 'high' ? 'emotion-indicator--urgent' :
            frame.risk_level === 'medium' ? 'emotion-indicator--elevated' :
            'emotion-indicator--normal'
          )}>
            {riskLabels[frame.risk_level]}
          </span>
        )}
        <span className="decision-card__confidence">
          {Math.round((frame.top_label_confidence || 0) * 100)}%
        </span>
        {expanded ? (
          <ChevronDown className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }} />
        ) : (
          <ChevronRight className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }} />
        )}
      </div>

      {expanded && (
        <div className="animate-fade-in">
          {/* Confidence bar */}
          <BayesianBar prob={frame.top_label_confidence || 0} riskLevel={frame.risk_level} />

          {/* Route */}
          {frame.route && (
            <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: 'var(--cursor-border-55)' }}>
              <ArrowRight className="h-3 w-3" />
              <span>路由: {actionLabels[frame.route] || frame.route}</span>
            </div>
          )}

          {/* Solution level */}
          {frame.solution_level && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={`comp-level comp-level--${frame.solution_level}`}>
                {frame.solution_level.replace('L', '')}
              </span>
              <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }}>
                补偿等级
              </span>
            </div>
          )}

          {/* Missing info */}
          {frame.missing_info && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {frame.missing_info.order_missing && (
                <span className="human-review-tag">缺订单号</span>
              )}
              {frame.missing_info.image_missing && (
                <span className="human-review-tag">缺图片</span>
              )}
              {frame.missing_info.contact_missing && (
                <span className="human-review-tag">缺联系方式</span>
              )}
            </div>
          )}

          {/* Need human review */}
          {frame.need_human_review && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Eye className="h-3 w-3" style={{ color: 'var(--cursor-gold)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--cursor-gold)' }}>
                需人工复核
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── AIQC_V2 Result Card — shows multi-dimension QC results ─── */
function AIQCResultCard({ aiqc_v2 }) {
  const [expanded, setExpanded] = useState(false)
  if (!aiqc_v2) return null

  // Parse sq1 into dimensions
  const parseDimensions = (sq1) => {
    if (!sq1) return []
    return sq1.split('\n').map(line => {
      const [name, result] = line.split('：')
      return { name: name?.trim(), pass: result?.trim() === '达标' }
    }).filter(d => d.name)
  }

  const dimensions = parseDimensions(aiqc_v2.sq1)
  const allPass = dimensions.every(d => d.pass) && aiqc_v2.qc1 === '达标' && aiqc_v2.sqm1 === '达标' && !aiqc_v2.is_violate

  return (
    <div className="decision-card mt-2" data-component="aiqc-result-card">
      <div className="decision-card__header cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <Shield className="h-3 w-3 flex-shrink-0" style={{ color: allPass ? 'var(--cursor-success)' : 'var(--cursor-error)' }} />
        <span className="decision-card__label">质检分析结果</span>
        <span className={cn(
          'redline-badge ml-1',
          allPass ? 'redline-badge--pass' : 'redline-badge--fail'
        )}>
          {allPass ? '全项达标' : '存在不达标'}
        </span>
        <span className="ml-auto">
          {expanded ? <ChevronDown className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }} /> : <ChevronRight className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }} />}
        </span>
      </div>

      {expanded && (
        <div className="animate-fade-in mt-2 space-y-2">
          {/* 4 QC Dimensions */}
          <div className="text-xs font-medium" style={{ color: 'var(--cursor-border-55)' }}>食安服务四维质检</div>
          <div className="grid grid-cols-2 gap-1.5">
            {dimensions.map((dim, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs rounded-md px-2 py-1" style={{
                background: dim.pass ? 'hsl(159 40% 94%)' : 'hsl(345 60% 96%)',
                color: dim.pass ? 'var(--cursor-success)' : 'var(--cursor-error)',
              }}>
                {dim.pass ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {dim.name}：{dim.pass ? '达标' : '不达标'}
              </div>
            ))}
          </div>

          {/* Ticket Operation QC (工单操作专家) */}
          <div className="flex items-center gap-2 text-xs">
            <span style={{ color: 'var(--cursor-border-55)' }}>工单操作：</span>
            <span className={cn(
              'quality-score',
              aiqc_v2.sqm1 === '达标' ? 'quality-score--high' : 'quality-score--low'
            )}>
              {aiqc_v2.sqm1 === '达标' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {aiqc_v2.sqm1}
            </span>
            {aiqc_v2.sqm2 && (
              <span className="text-xs" style={{ color: 'var(--cursor-error)' }}>{aiqc_v2.sqm2}</span>
            )}
          </div>

          {/* Classification QC (对话分类质检专家) */}
          <div className="flex items-center gap-2 text-xs">
            <span style={{ color: 'var(--cursor-border-55)' }}>食安分类：</span>
            <span className={cn(
              'quality-score',
              aiqc_v2.qc1 === '达标' ? 'quality-score--high' : 'quality-score--low'
            )}>
              {aiqc_v2.qc1 === '达标' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {aiqc_v2.qc1}
            </span>
            {aiqc_v2.qc2 && (
              <span className="text-xs" style={{ color: 'var(--cursor-error)' }}>{aiqc_v2.qc2}</span>
            )}
          </div>

          {/* Red Line Detection */}
          <div className="flex items-center gap-2 text-xs">
            <span style={{ color: 'var(--cursor-border-55)' }}>红线检测：</span>
            <span className={cn(
              'redline-badge',
              !aiqc_v2.is_violate ? 'redline-badge--pass' : 'redline-badge--fail'
            )}>
              {!aiqc_v2.is_violate ? <><CheckCircle2 className="h-3 w-3" /> 合规</> : <><XCircle className="h-3 w-3" /> 违规</>}
            </span>
          </div>

          {/* Order Info (sq3) */}
          {aiqc_v2.sq3 && (
            <div className="text-xs rounded-md px-2 py-1.5" style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-border-55)' }}>
              <div className="font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>订单信息</div>
              {aiqc_v2.sq3.split('；').map((item, i) => (
                <span key={i} className="inline-block mr-2">{item}</span>
              ))}
            </div>
          )}

          {/* Service improvement suggestions (sq2 from 对话解构+服务分析) */}
          {aiqc_v2.sq2 && (
            <div className="text-xs rounded-md px-2 py-1.5" style={{ background: 'hsl(33 80% 94%)', color: 'var(--cursor-ink)' }}>
              <div className="font-medium mb-1" style={{ color: 'var(--cursor-gold)' }}>食安服务改进建议</div>
              {aiqc_v2.sq2}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Order Processing Result Card — shows order workflow results ─── */
function OrderProcessingCard({ orderResult }) {
  const [expanded, setExpanded] = useState(false)
  if (!orderResult) return null

  return (
    <div className="decision-card mt-2" data-component="order-processing-card">
      <div className="decision-card__header cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <Package className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--cursor-info)' }} />
        <span className="decision-card__label">订单处理工作流</span>
        <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded font-mono" style={{
          background: 'var(--cursor-surface-300)', color: 'var(--cursor-orange)',
        }}>
          {orderResult.scene}
        </span>
        <span className="ml-auto">
          {expanded ? <ChevronDown className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }} /> : <ChevronRight className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }} />}
        </span>
      </div>

      {expanded && (
        <div className="animate-fade-in mt-2 space-y-2">
          {/* Order info */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-ink)' }}>
              {orderResult.order_id}
            </span>
            <span className="px-1.5 py-0.5 rounded" style={{
              background: orderResult.order_status === '已完成' ? 'hsl(159 40% 94%)' : 'hsl(33 80% 94%)',
              color: orderResult.order_status === '已完成' ? 'var(--cursor-success)' : 'var(--cursor-gold)',
            }}>
              {orderResult.order_status}
            </span>
            {orderResult.queue_number >= 0 && (
              <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }}>
                前方 {orderResult.queue_number} 单
              </span>
            )}
          </div>

          {/* Compensation info */}
          {orderResult.compensate && (
            <div className="flex items-center gap-1.5 text-xs rounded-md px-2 py-1" style={{
              background: 'hsl(33 80% 94%)', color: 'var(--cursor-gold)',
            }}>
              <Zap className="h-3 w-3" />
              补偿方案: {orderResult.compensate_amount}元代金券
            </div>
          )}

          {/* Ticket info */}
          {orderResult.ticket && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--cursor-border-55)' }}>
              <Ticket className="h-3 w-3" />
              {orderResult.ticket}
            </div>
          )}

          {/* Workflow trace */}
          {orderResult.trace && (
            <div className="text-[10px] space-y-0.5">
              {orderResult.trace.filter(n => n.status !== 'skipped').map((node) => (
                <div key={node.node_id} className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${node.status === 'completed' ? '' : 'opacity-40'}`}
                    style={{ background: node.status === 'completed' ? 'var(--cursor-success)' : 'var(--cursor-border-55)' }} />
                  <span style={{ color: 'var(--cursor-border-55)' }}>{node.node_id}.</span>
                  <span style={{ color: 'var(--cursor-ink)' }}>{node.node_name}</span>
                  {node.model && (
                    <span className="font-mono px-1 rounded" style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-border-55)' }}>
                      {node.model}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Workflow Trace Panel — AIQC_V2 multi-model pipeline visualization ─── */
function WorkflowTracePanel({ trace }) {
  const [expanded, setExpanded] = useState(false)
  if (!trace || trace.length === 0) return null

  const completedCount = trace.filter(n => n.status === 'completed').length
  const skippedCount = trace.filter(n => n.status === 'skipped').length

  return (
    <div className="mt-2 max-w-lg" data-component="workflow-trace">
      <button
        className="flex items-center gap-2 text-xs font-medium transition-colors"
        style={{ color: 'var(--cursor-orange)' }}
        onClick={() => setExpanded(!expanded)}
      >
        <Zap className="h-3 w-3" />
        AIQC_V2 工作流 ({completedCount}完成{skippedCount > 0 ? `, ${skippedCount}跳过` : ''})
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="workflow-trace mt-2 animate-fade-in">
          {trace.map((node) => (
            <div key={node.node_id} className="workflow-trace__node">
              <div className={`workflow-trace__node-dot workflow-trace__node-dot--${node.status}`} />
              <span className="workflow-trace__node-name">
                {node.node_id}. {node.node_name}
              </span>
              {node.model && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{
                  background: 'var(--cursor-surface-300)',
                  color: 'var(--cursor-border-55)',
                }}>
                  {node.model}
                </span>
              )}
              <span className="workflow-trace__node-status" style={{
                color: node.status === 'completed' ? 'var(--cursor-success)'
                  : node.status === 'skipped' ? 'var(--cursor-border-55)'
                  : 'var(--cursor-orange)'
              }}>
                {node.status === 'completed' ? '完成' : node.status === 'skipped' ? '跳过' : '运行中'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Red-line Audit Badge ─── */
function RedlineAuditBadge({ audit }) {
  const [expanded, setExpanded] = useState(false)
  if (!audit) return null

  return (
    <div className="mt-1.5 max-w-lg">
      <button
        className="flex items-center gap-1.5"
        onClick={() => setExpanded(!expanded)}
      >
        {audit.pass ? (
          <span className="redline-badge redline-badge--pass">
            <CheckCircle2 className="h-3 w-3" /> 红线审核通过
          </span>
        ) : (
          <span className="redline-badge redline-badge--fail">
            <XCircle className="h-3 w-3" /> {audit.violation_count}项红线违规
          </span>
        )}
      </button>

      {expanded && !audit.pass && (
        <div className="mt-1.5 rounded-lg border p-2 text-xs animate-fade-in" style={{
          background: 'hsl(345 60% 96%)',
          borderColor: 'rgba(207, 45, 86, 0.2)',
          color: 'var(--cursor-ink)',
        }}>
          {(audit.risk_items || []).map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 py-0.5">
              <AlertCircle className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--cursor-error)' }} />
              <span>规则{item.rule}: {item.desc}</span>
              <span className="ml-auto font-mono" style={{ color: 'var(--cursor-error)' }}>"{item.term}"</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Agent 感知-决策-执行 闭环追踪面板 ─── */
function AgentClosedLoopTrace({ framework }) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('reasoning')
  if (!framework) return null

  const {
    perception, decision, action, closed_loop, trace, self_polish,
    reward, gae, hacking_defense, react_trace,
    llm_reasoning, llm_model, llm_usage, safety, memory,
  } = framework
  const phases = trace || []

  // ─── 颜色映射 ───
  const urgencyColors = { critical: '#e74c3c', high: '#e67e22', moderate: '#f39c12', normal: '#27ae60' }
  const emotionColors = { furious: '#e74c3c', angry: '#e67e22', upset: '#f39c12', concerned: '#3498db', calm: '#27ae60' }
  const outcomeColors = { success: '#27ae60', needs_revision: '#f39c12', error: '#e74c3c' }
  const rewardTierColors = { excellent: '#27ae60', good: '#2ecc71', acceptable: '#f39c12', poor: '#e74c3c' }

  // ─── 下一步预测数据 (从 decision + perception 推导) ───
  const nextActions = []
  if (perception?.top_intent) {
    const intent = perception.top_intent.intent
    const intentActionMap = {
      foreign_object: { action: '收集订单信息和照片', followUp: '用户可能提供照片或描述异物细节', priority: '高' },
      body_discomfort: { action: '确认症状严重程度', followUp: '用户可能描述症状或就医情况', priority: '紧急' },
      bad_taste: { action: '了解口味异常详情', followUp: '用户可能提供批次号或购买时间', priority: '中' },
      packaging_issue: { action: '确认包装损坏情况', followUp: '用户可能上传照片', priority: '中' },
      order_issue: { action: '核实订单状态', followUp: '用户可能提供订单号', priority: '中' },
      general_complaint: { action: '倾听并记录投诉内容', followUp: '用户可能提供更多细节', priority: '中' },
      consultation: { action: '提供产品信息', followUp: '用户可能追问其他产品', priority: '低' },
    }
    if (intentActionMap[intent]) nextActions.push(intentActionMap[intent])
  }
  if (decision?.strategy_route) {
    nextActions.push({ action: `执行策略: ${decision.strategy_route}`, priority: '推荐' })
  }

  // ─── 上下文召回数据 ───
  const contextItems = []
  if (memory?.session_turns) contextItems.push({ label: '对话轮次', value: memory.session_turns, type: 'session' })
  if (memory?.working_memory?.buffer_size) contextItems.push({ label: '工作记忆', value: `${memory.working_memory.buffer_size}项`, type: 'memory' })
  if (memory?.working_memory?.cache_hits > 0) contextItems.push({ label: '缓存命中', value: memory.working_memory.cache_hits, type: 'cache' })
  if (memory?.decision_chain_length) contextItems.push({ label: '决策链', value: memory.decision_chain_length, type: 'chain' })
  if (perception?.info_sufficiency !== undefined) contextItems.push({ label: '信息充分度', value: `${Math.round(perception.info_sufficiency * 100)}%`, type: 'info' })

  return (
    <div className="mt-3 max-w-[760px]">
      {/* ─── Header: 一行摘要 ─── */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left"
        style={{
          borderColor: expanded ? 'var(--cursor-border-10)' : 'var(--cursor-border-10)',
          background: expanded ? 'var(--cursor-surface-300)' : 'var(--cursor-surface-300)',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* 思考图标 */}
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
          <path d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z" stroke="#f54e00" strokeWidth="1.5" fill="none" />
          <circle cx="7" cy="9" r="1.2" fill="#f54e00" />
          <circle cx="13" cy="9" r="1.2" fill="#f54e00" />
          <path d="M7 13c0.8 1.2 2 1.8 3 1.8s2.2-0.6 3-1.8" stroke="#f54e00" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>

        <span className="text-[12px] font-semibold" style={{ color: 'var(--cursor-ink)' }}>思考过程</span>

        {/* 摘要标签 */}
        <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
          {perception?.top_intent && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: '#2980b912', color: '#2980b9' }}>
              {perception.top_intent.intent}
            </span>
          )}
          {perception?.urgency_tier && perception.urgency_tier !== 'normal' && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{
              background: (urgencyColors[perception.urgency_tier] || '#999') + '15',
              color: urgencyColors[perception.urgency_tier] || '#999',
            }}>
              {perception.urgency_tier === 'critical' ? '紧急' : perception.urgency_tier === 'high' ? '较高' : perception.urgency_tier}
            </span>
          )}
          {llm_model && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: '#e67e2212', color: '#e67e22' }}>
              {getModelDisplayName(llm_model)}
            </span>
          )}
          {reward && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{
              background: (rewardTierColors[reward.reward_tier] || '#999') + '15',
              color: rewardTierColors[reward.reward_tier] || '#999',
            }}>
              {reward.reward_tier}
            </span>
          )}
          {safety && !safety.safe && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: '#e74c3c15', color: '#e74c3c' }}>
              安全拦截
            </span>
          )}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <path d="M3 4.5L6 7.5L9 4.5" stroke="var(--cursor-border-55)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
      </button>

      {/* ─── 展开面板 ─── */}
      {expanded && (
        <div className="mt-1 rounded-lg border overflow-hidden" style={{
          background: 'var(--cursor-bg)',
          borderColor: 'var(--cursor-border-10)',
        }}>
          {/* Tab 导航 */}
          <div className="flex border-b" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
            {[
              { id: 'reasoning', label: '推理过程', svg: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1a7 7 0 100 14A7 7 0 008 1z" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 7.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5c0 1-0.6 1.8-1.4 2.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="11.5" r="0.7" fill="currentColor"/></svg> },
              { id: 'prediction', label: '下一步预测', svg: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="0.8" fill="currentColor"/><line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1"/><line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1"/></svg> },
              { id: 'context', label: '上下文', svg: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="3" y="1.5" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><line x1="5.5" y1="4.5" x2="10.5" y2="4.5" stroke="currentColor" strokeWidth="1" opacity="0.7"/><line x1="5.5" y1="7" x2="9.5" y2="7" stroke="currentColor" strokeWidth="1" opacity="0.5"/><line x1="5.5" y1="9.5" x2="8.5" y2="9.5" stroke="currentColor" strokeWidth="1" opacity="0.3"/></svg> },
              { id: 'quality', label: '质量评估', svg: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 8.5l2.5 2.5L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 1a7 7 0 100 14A7 7 0 008 1z" stroke="currentColor" strokeWidth="1.3"/></svg> },
            ].map(tab => (
              <button
                key={tab.id}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors relative"
                style={{
                  color: activeTab === tab.id ? 'var(--cursor-orange)' : 'var(--cursor-border-55)',
                  background: activeTab === tab.id ? 'var(--cursor-bg)' : 'transparent',
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>{tab.svg}</span>
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5" style={{ background: 'var(--cursor-orange)' }} />
                )}
              </button>
            ))}
          </div>

          {/* Tab 内容 */}
          <div className="p-3 space-y-3" style={{ fontSize: '12px' }}>

            {/* ═══ 推理过程 Tab ═══ */}
            {activeTab === 'reasoning' && (
              <>
                {/* Phase Timeline */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }}>
                    认知闭环流程
                  </div>
                  {phases.map((phase, i) => {
                    const phaseColors = {
                      self_polish: '#9b59b6', perception: '#f54e00', memory: '#8e44ad',
                      working_memory: '#2c3e50', decision: '#2980b9', debate: '#e74c3c',
                      debate_revision: '#c0392b', action: '#27ae60', reflection: '#e67e22',
                      re_action: '#16a085', alignment: '#3498db', reward_gae: '#f39c12',
                    }
                    const color = phaseColors[phase.phase] || '#999'
                    return (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="flex flex-col items-center pt-1">
                          <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
                          {i < phases.length - 1 && <div className="w-px h-4" style={{ background: 'var(--cursor-border-10)' }} />}
                        </div>
                        <div className="min-w-0 pb-0.5">
                          <span className="font-medium text-[12px]" style={{ color }}>{phase.title}</span>
                          <span className="ml-2 text-[11px]" style={{ color: 'var(--cursor-border-55)' }}>{phase.summary}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* LLM Reasoning Chain */}
                {llm_reasoning && (
                  <div className="rounded-md border p-2.5" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-semibold" style={{ color: '#e67e22' }}>{getModelDisplayName(llm_model)} 思维链</span>
                      {llm_usage?.reasoning_tokens > 0 && (
                        <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
                          {llm_usage.reasoning_tokens} tokens
                        </span>
                      )}
                    </div>
                    <div className="font-mono leading-relaxed max-h-32 overflow-y-auto text-[11px]" style={{
                      color: 'var(--cursor-ink)',
                      opacity: 0.8,
                      whiteSpace: 'pre-wrap',
                    }}>{llm_reasoning.slice(0, 800)}{llm_reasoning.length > 800 ? '\n...' : ''}</div>
                  </div>
                )}

                {/* Agent CoT Trace */}
                {decision?.cot_trace && (
                  <div className="rounded-md border p-2.5" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
                    <div className="text-[11px] font-semibold mb-1.5" style={{ color: '#2980b9' }}>Agent 推理链</div>
                    <div className="font-mono leading-relaxed text-[11px]" style={{ color: 'var(--cursor-ink)', opacity: 0.75, whiteSpace: 'pre-wrap' }}>
                      {decision.cot_trace}
                    </div>
                  </div>
                )}

                {/* ReAct Trace */}
                {react_trace && react_trace.total_steps > 0 && (
                  <div className="rounded-md border p-2.5" style={{ borderColor: 'var(--cursor-border-10)' }}>
                    <div className="text-[11px] font-semibold mb-1.5" style={{ color: '#16a085' }}>
                      ReAct 追踪
                      <span className="ml-2 font-normal text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
                        {react_trace.thought_count}推理 · {react_trace.action_count}行动 · {react_trace.observation_count}观察
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {react_trace.trace?.slice(0, 10).map((t, i) => {
                        const tc = { thought: '#2980b9', action: '#27ae60', observation: '#8e44ad', final_answer: '#f54e00' }
                        const tl = { thought: 'T', action: 'A', observation: 'O', final_answer: 'R' }
                        const tlFull = { thought: '推理', action: '行动', observation: '观察', final_answer: '结论' }
                        return (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[10px] inline-flex items-center gap-0.5" style={{
                            background: (tc[t.type] || '#999') + '10',
                            color: tc[t.type] || '#999',
                            border: `1px solid ${(tc[t.type] || '#999')}20`,
                          }}>
                            <span className="font-bold text-[9px]">{tl[t.type] || '?'}</span>
                            {t.type === 'final_answer' ? '结论' : `[${t.step}] ${tlFull[t.type] || t.type}`}
                          </span>
                        )
                      })}
                      {react_trace.trace?.length > 10 && (
                        <span className="px-1 text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>+{react_trace.trace.length - 10}</span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ═══ 下一步预测 Tab ═══ */}
            {activeTab === 'prediction' && (
              <>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }}>
                  预测与建议行动
                </div>
                <div className="space-y-2">
                  {nextActions.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-md border p-2.5" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white" style={{
                        background: item.priority === '紧急' ? '#e74c3c' : item.priority === '高' ? '#e67e22' : item.priority === '推荐' ? '#2980b9' : '#999',
                      }}>
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-medium" style={{ color: 'var(--cursor-ink)' }}>{item.action}</div>
                        {item.followUp && (
                          <div className="text-[11px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }}>
                            预测: {item.followUp}
                          </div>
                        )}
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px]" style={{
                          background: (item.priority === '紧急' ? '#e74c3c' : item.priority === '高' ? '#e67e22' : '#2980b9') + '12',
                          color: item.priority === '紧急' ? '#e74c3c' : item.priority === '高' ? '#e67e22' : '#2980b9',
                        }}>{item.priority}</span>
                      </div>
                    </div>
                  ))}
                  {nextActions.length === 0 && (
                    <div className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }}>暂无预测数据</div>
                  )}
                </div>

                {/* 感知层详情 */}
                {perception && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--cursor-border-10)' }}>
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }}>
                      感知层分析
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <MetricCard label="紧急度" value={perception.urgency_tier || 'normal'} color={urgencyColors[perception.urgency_tier] || '#999'} />
                      <MetricCard label="情绪" value={`${perception.emotion_grade || 'calm'} (${Math.round((perception.emotion_intensity || 0) * 100)}%)`} color={emotionColors[perception.emotion_grade] || '#999'} />
                      <MetricCard label="意图置信度" value={`${Math.round((perception.intent_confidence || 0) * 100)}%`} color="#2980b9" />
                      <MetricCard label="风险分" value={perception.risk_score !== undefined ? Math.round(perception.risk_score * 100) + '%' : '-'} color={perception.risk_score > 0.7 ? '#e74c3c' : '#27ae60'} />
                      <MetricCard label="信息充分度" value={`${Math.round((perception.info_sufficiency || 0) * 100)}%`} color={perception.info_sufficiency > 0.7 ? '#27ae60' : '#f39c12'} />
                      <MetricCard label="是否歧义" value={perception.intent_ambiguous ? '是' : '否'} color={perception.intent_ambiguous ? '#f39c12' : '#27ae60'} />
                    </div>
                  </div>
                )}

                {/* 决策层详情 */}
                {decision && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--cursor-border-10)' }}>
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }}>
                      决策层
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-md text-[11px]" style={{ background: '#8e44ad10', color: '#8e44ad', border: '1px solid #8e44ad20' }}>
                        策略: {decision.strategy_route}
                      </span>
                      <span className="px-2 py-1 rounded-md text-[11px]" style={{ background: '#2980b910', color: '#2980b9', border: '1px solid #2980b920' }}>
                        CoT {decision.cot_steps}步
                      </span>
                      {decision.debate && (
                        <span className="px-2 py-1 rounded-md text-[11px]" style={{
                          background: decision.debate.consensus ? '#27ae6010' : '#f39c1210',
                          color: decision.debate.consensus ? '#27ae60' : '#f39c12',
                          border: `1px solid ${decision.debate.consensus ? '#27ae6020' : '#f39c1220'}`,
                        }}>
                          辩论: {decision.debate.consensus ? '一致' : `${decision.debate.total_issues}项分歧`}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ═══ 上下文 Tab ═══ */}
            {activeTab === 'context' && (
              <>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }}>
                  上下文召回与工作记忆
                </div>
                <div className="space-y-2">
                  {contextItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{
                          background: item.type === 'session' ? '#2980b9' : item.type === 'memory' ? '#8e44ad' : item.type === 'cache' ? '#27ae60' : item.type === 'chain' ? '#e67e22' : '#f39c12',
                        }} />
                        <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }}>{item.label}</span>
                      </div>
                      <span className="text-[12px] font-semibold" style={{ color: 'var(--cursor-ink)' }}>{item.value}</span>
                    </div>
                  ))}
                  {contextItems.length === 0 && (
                    <div className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }}>首条消息，暂无历史上下文</div>
                  )}
                </div>

                {/* Self-Polish 精炼结果 */}
                {self_polish && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--cursor-border-10)' }}>
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }}>
                      输入精炼 (Self-Polish)
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-2 py-1 rounded-md text-[11px]" style={{ background: '#9b59b610', color: '#9b59b6', border: '1px solid #9b59b620' }}>
                        清晰度: {Math.round((self_polish.clarity_score || 0) * 100)}%
                      </span>
                      {(self_polish.refinements || []).length > 0 && (
                        <span className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }}>
                          {(self_polish.refinements || []).length}项精炼已应用
                        </span>
                      )}
                      {self_polish.entities && Object.keys(self_polish.entities).some(k => self_polish.entities[k]) && (
                        <span className="px-2 py-1 rounded-md text-[11px]" style={{ background: '#2980b910', color: '#2980b9', border: '1px solid #2980b920' }}>
                          实体: {Object.entries(self_polish.entities).filter(([,v]) => v).map(([k]) => k).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 执行层 */}
                {action && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--cursor-border-10)' }}>
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }}>
                      执行层
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-md text-[11px]" style={{
                        background: (outcomeColors[action.execution_outcome] || '#999') + '10',
                        color: outcomeColors[action.execution_outcome] || '#999',
                        border: `1px solid ${(outcomeColors[action.execution_outcome] || '#999')}20`,
                      }}>
                        {action.tool_selected} · {action.execution_outcome}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ═══ 质量评估 Tab ═══ */}
            {activeTab === 'quality' && (
              <>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }}>
                  质量评估与安全审核
                </div>

                {/* 3H Alignment */}
                {action?.alignment && (
                  <div className="rounded-md border p-2.5" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[12px] font-semibold" style={{ color: '#3498db' }}>3H 对齐检查</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px]" style={{
                        background: action.alignment.all_passed ? '#27ae6015' : '#e74c3c15',
                        color: action.alignment.all_passed ? '#27ae60' : '#e74c3c',
                      }}>{action.alignment.all_passed ? '全部通过' : `${action.alignment.violations?.length || 0}项违规`}</span>
                    </div>
                    <div className="flex gap-3">
                      {[
                        { label: 'Helpful', value: action.alignment.helpfulness, color: '#27ae60' },
                        { label: 'Honest', value: action.alignment.honesty, color: '#2980b9' },
                        { label: 'Harmless', value: action.alignment.harmlessness, color: '#8e44ad' },
                      ].map(dim => (
                        <div key={dim.label} className="flex-1">
                          <div className="text-[10px] mb-1" style={{ color: 'var(--cursor-border-55)' }}>{dim.label}</div>
                          <div className="h-1.5 rounded-full" style={{ background: 'var(--cursor-border-10)' }}>
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${Math.round((dim.value || 0) * 100)}%`,
                              background: dim.color,
                            }} />
                          </div>
                          <div className="text-[10px] mt-0.5 text-right" style={{ color: dim.color }}>
                            {Math.round((dim.value || 0) * 100)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 幻觉检测 */}
                {action?.hallucination && (
                  <div className="rounded-md border p-2.5" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold" style={{ color: '#8e44ad' }}>幻觉检测</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px]" style={{
                        background: action.hallucination.risk_level === 'high' ? '#e74c3c15' : action.hallucination.risk_level === 'medium' ? '#f39c1215' : '#27ae6015',
                        color: action.hallucination.risk_level === 'high' ? '#e74c3c' : action.hallucination.risk_level === 'medium' ? '#f39c12' : '#27ae60',
                      }}>{action.hallucination.risk_level} ({action.hallucination.risk_count}风险)</span>
                      {action.hallucination.reward_signals && (
                        <span className="text-[10px] ml-auto" style={{ color: 'var(--cursor-border-55)' }}>
                          RL: 正确+{action.hallucination.reward_signals.correct || 0} / 保留+{action.hallucination.reward_signals.abstain || 0} / 错误{action.hallucination.reward_signals.incorrect || 0}
                        </span>
                      )}                    </div>
                  </div>
                )}

                {/* 内容安全 */}
                {safety && (
                  <div className="rounded-md border p-2.5" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] font-semibold" style={{ color: safety.safe ? '#27ae60' : '#e74c3c' }}>内容安全</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px]" style={{
                        background: safety.safe ? '#27ae6015' : '#e74c3c15',
                        color: safety.safe ? '#27ae60' : '#e74c3c',
                      }}>{safety.safe ? '通过' : '拦截'}</span>
                      {safety.local && (
                        <>
                          <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
                            分数 {Math.round((safety.local.score || 0) * 100)}%
                          </span>
                          {(safety.local.violations || []).length > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: '#e74c3c12', color: '#e74c3c' }}>
                              {safety.local.violations.length}红线
                            </span>
                          )}
                          {(safety.local.warnings || []).length > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: '#f39c1212', color: '#f39c12' }}>
                              {safety.local.warnings.length}警告
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Reward + GAE */}
                <div className="flex flex-wrap gap-2">
                  {reward && (
                    <div className="rounded-md border px-3 py-2" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
                      <div className="text-[10px] mb-1" style={{ color: 'var(--cursor-border-55)' }}>奖励信号</div>
                      <div className="text-[13px] font-semibold" style={{ color: rewardTierColors[reward.reward_tier] || '#999' }}>
                        {reward.total_reward}分
                        <span className="text-[10px] font-normal ml-1">({reward.reward_tier})</span>
                      </div>
                    </div>
                  )}
                  {gae?.best_step && (
                    <div className="rounded-md border px-3 py-2" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
                      <div className="text-[10px] mb-1" style={{ color: 'var(--cursor-border-55)' }}>GAE 信用分配</div>
                      <div className="text-[12px]" style={{ color: 'var(--cursor-ink)' }}>
                        最优: <span className="font-medium" style={{ color: '#16a085' }}>{gae.best_step.phase}</span>
                        {gae.worst_step && <> · 最弱: <span style={{ color: '#f39c12' }}>{gae.worst_step.phase}</span></>}
                      </div>
                    </div>
                  )}
                  {hacking_defense && hacking_defense.hacking_risk !== 'none' && (
                    <div className="rounded-md border px-3 py-2" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
                      <div className="text-[10px] mb-1" style={{ color: 'var(--cursor-border-55)' }}>Hacking 防御</div>
                      <div className="text-[12px] font-medium" style={{ color: hacking_defense.hacking_risk === 'high' ? '#e74c3c' : '#f39c12' }}>
                        {hacking_defense.hacking_risk}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* 指标卡片子组件 */
function MetricCard({ label, value, color }) {
  return (
    <div className="rounded-md border px-2.5 py-1.5" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-bg)' }}>
      <div className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>{label}</div>
      <div className="text-[12px] font-semibold" style={{ color: color || 'var(--cursor-ink)' }}>{value}</div>
    </div>
  )
}

/* ─── Emotion Indicator ─── */
function EmotionBadge({ emotion }) {
  if (!emotion || emotion.emotion_level === 'normal') return null
  const labels = { elevated: '情绪激动', urgent: '情绪紧急' }
  return (
    <span className={cn(
      'emotion-indicator',
      emotion.is_urgent ? 'emotion-indicator--urgent' : 'emotion-indicator--elevated'
    )}>
      <AlertTriangle className="h-3 w-3" />
      {labels[emotion.emotion_level] || '情绪异常'}
      {emotion.hit_keywords?.length > 0 && (
        <span className="opacity-70">({emotion.hit_keywords.slice(0, 2).join(', ')})</span>
      )}
    </span>
  )
}

/* ─── Session Timer ─── */
function SessionTimer({ seconds }) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const isWarning = seconds > 300
  const isCritical = seconds > 600
  return (
    <span className={cn(
      'session-timer',
      isCritical ? 'session-timer--critical' : isWarning ? 'session-timer--warning' : ''
    )}>
      <Clock className="h-3 w-3" />
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  )
}

/* ─── Session Header Bar — shows 七鱼 session state above chat ─── */
function SessionHeaderBar({ conversation }) {
  if (!conversation) return null
  const stateLabels = {
    active: '对话中', queue: '排队中', handoff: '已转人工',
    resolved: '已解决', closed: '已关闭', new: '新会话',
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2" style={{
      borderBottom: '1px solid var(--cursor-border-10)',
      background: 'var(--cursor-surface-300)',
    }} data-component="session-header">
      <span className={cn('session-badge', `session-badge--${conversation.session_state || 'active'}`)}>
        {stateLabels[conversation.session_state] || '对话中'}
      </span>
      {conversation.handler && (
        <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }}>
          {conversation.handler === 'AI' ? '阿喜AI' : conversation.handler} 处理中
        </span>
      )}
      {conversation.classification && (
        <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }}>
          {conversation.classification.consult_type?.split('/').pop()}
        </span>
      )}
      <span className="ml-auto">
        <SessionTimer seconds={conversation.turn_count ? conversation.turn_count * 45 : 0} />
      </span>
      {conversation.classification?.need_human_review && (
        <span className="human-review-tag">
          <Eye className="h-3 w-3" /> 人工复核
        </span>
      )}
    </div>
  )
}

/* ─── Message Bubble ─── */
function MessageBubble({ message, isStreaming }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // System message
  if (isSystem) {
    return (
      <div className="flex w-full justify-center animate-fade-in" data-component="system-message">
        <div className="system-message">
          {message.content}
        </div>
      </div>
    )
  }

  // Simple HTML escape to prevent XSS before applying markdown-like transforms
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      let rendered = esc(line)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^- (.*)$/g, '<span class="flex gap-2"><span style="color: var(--cursor-orange)" class="mt-0.5">•</span><span>$1</span></span>')
        .replace(/^(\d+)\. (.*)$/g, '<span class="flex gap-2"><span style="color: var(--cursor-orange)" class="font-medium">$1.</span><span>$2</span></span>')

      if (line.trim() === '') {
        return <div key={i} className="h-2" />
      }

      return (
        <div
          key={i}
          className={cn('leading-relaxed', i > 0 && 'mt-1')}
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      )
    })
  }

  return (
    <div
      className={cn(
        'group flex w-full animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
      data-component="message-bubble"
    >
      <div className={cn('max-w-[85%]', isUser ? 'items-end' : 'items-start')}>
        <div className={isUser ? 'bubble-user' : 'bubble-ai'}>
          {isStreaming ? (
            <>
              {renderContent(message.content)}
              <span
                className="ml-0.5 inline-block h-4 w-0.5 animate-pulse-soft"
                style={{ background: 'var(--cursor-orange)' }}
              />
            </>
          ) : (
            <div className="text-sm leading-relaxed">
              {renderContent(message.content)}
            </div>
          )}
        </div>

        {/* Emotion badge from decision frame */}
        {!isUser && message.decisionFrame?.emotion && (
          <div className="mt-1.5">
            <EmotionBadge emotion={{ emotion_level: message.decisionFrame.emotion, is_urgent: message.decisionFrame.emotion === 'urgent' }} />
          </div>
        )}

        {/* Decision Card from decision frame */}
        {!isUser && message.decisionFrame && (
          <DecisionCard frame={message.decisionFrame} />
        )}

        {/* AIQC_V2 Result Card */}
        {!isUser && message.aiqc_v2 && (
          <AIQCResultCard aiqc_v2={message.aiqc_v2} />
        )}

        {/* Order Processing Workflow Card */}
        {!isUser && message.orderResult && (
          <OrderProcessingCard orderResult={message.orderResult} />
        )}

        {/* Actions */}
        {!isUser && !isStreaming && (
          <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} title="复制">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="重新生成" disabled>
              <RotateCcw className="h-3.5 w-3.5 opacity-40" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="有帮助" disabled>
              <ThumbsUp className="h-3.5 w-3.5 opacity-40" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="需改进" disabled>
              <ThumbsDown className="h-3.5 w-3.5 opacity-40" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── SVG Illustrations for Quick Prompt Cards ─── */
function SvgForeignObject() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
      {/* Cup body */}
      <path d="M20 18h24l-3 32H23L20 18z" fill="#fef3ec" stroke="#f54e00" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* Cup lid */}
      <rect x="18" y="14" width="28" height="5" rx="2" fill="#f54e00" opacity="0.15" stroke="#f54e00" strokeWidth="1.2"/>
      {/* Straw */}
      <line x1="36" y1="8" x2="34" y2="22" stroke="#f54e00" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Foreign objects inside */}
      <circle cx="29" cy="32" r="2" fill="#f54e00" opacity="0.6"/>
      <circle cx="34" cy="38" r="1.5" fill="#26251e" opacity="0.35"/>
      <path d="M26 40c1-1 3 0 4 1" stroke="#f54e00" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      {/* Magnifying glass */}
      <circle cx="44" cy="36" r="7" stroke="#26251e" strokeWidth="1.5" fill="white" fillOpacity="0.7"/>
      <line x1="49" y1="41" x2="54" y2="47" stroke="#26251e" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Particles in lens */}
      <circle cx="42" cy="34" r="1" fill="#f54e00"/>
      <circle cx="46" cy="37" r="0.8" fill="#26251e" opacity="0.5"/>
      <circle cx="43" cy="38" r="0.6" fill="#f54e00" opacity="0.4"/>
    </svg>
  )
}

function SvgBadTaste() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
      {/* Cup */}
      <path d="M22 20h20l-2.5 28H24.5L22 20z" fill="#fef3ec" stroke="#e67e22" strokeWidth="1.5" strokeLinejoin="round"/>
      <rect x="20" y="16" width="24" height="5" rx="2" fill="#e67e22" opacity="0.15" stroke="#e67e22" strokeWidth="1.2"/>
      {/* Wavy smell lines rising */}
      <path d="M28 12c0-2 2-3 2-5" stroke="#e67e22" strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
      <path d="M32 11c0-2 2-3 2-5" stroke="#e67e22" strokeWidth="1.3" strokeLinecap="round" opacity="0.45"/>
      <path d="M36 12c0-2 2-3 2-5" stroke="#e67e22" strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
      {/* Warning triangle */}
      <path d="M44 28l8 14H36l8-14z" fill="#fff7ed" stroke="#e67e22" strokeWidth="1.5" strokeLinejoin="round"/>
      <line x1="44" y1="33" x2="44" y2="37" stroke="#e67e22" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="44" cy="39.5" r="1" fill="#e67e22"/>
      {/* X mark on cup */}
      <line x1="29" y1="30" x2="35" y2="36" stroke="#e67e22" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <line x1="35" y1="30" x2="29" y2="36" stroke="#e67e22" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    </svg>
  )
}

function SvgBodyDiscomfort() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
      {/* Person silhouette */}
      <circle cx="28" cy="14" r="6" fill="#fef3ec" stroke="#d35400" strokeWidth="1.5"/>
      <path d="M28 20c-8 0-12 6-12 14v4h24v-4c0-8-4-14-12-14z" fill="#fef3ec" stroke="#d35400" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* Pain indicator — stomach area */}
      <circle cx="28" cy="30" r="4" fill="#f54e00" opacity="0.15" stroke="#f54e00" strokeWidth="1"/>
      <path d="M26 29l1.5 1.5L30 28" stroke="#f54e00" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
      {/* Heartbeat line */}
      <path d="M40 24h4l2-5 3 10 2-5h5" stroke="#d35400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Medical cross */}
      <rect x="44" y="34" width="12" height="12" rx="3" fill="#fef3ec" stroke="#d35400" strokeWidth="1.2"/>
      <line x1="50" y1="37" x2="50" y2="43" stroke="#d35400" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="47" y1="40" x2="53" y2="40" stroke="#d35400" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Small sweat drop */}
      <path d="M35 12c0.5 1 1.5 2 1.5 3a1.5 1.5 0 01-3 0c0-1 1-2 1.5-3z" fill="#2980b9" opacity="0.5"/>
    </svg>
  )
}

function SvgPackageIssue() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
      {/* Box — 3D isometric */}
      <path d="M32 12L50 22v20L32 52 14 42V22L32 12z" fill="#fef3ec" stroke="#c0392b" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M32 12L50 22 32 32 14 22 32 12z" fill="#c0392b" opacity="0.08"/>
      <line x1="32" y1="32" x2="32" y2="52" stroke="#c0392b" strokeWidth="1.2"/>
      {/* Tape on top */}
      <path d="M28 17l4-2.5 4 2.5" stroke="#c0392b" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      {/* Crack / damage mark */}
      <path d="M38 34l3 2-1 4-4 1" stroke="#c0392b" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      <line x1="37" y1="37" x2="40" y2="35" stroke="#c0392b" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      {/* Warning badge */}
      <circle cx="48" cy="14" r="7" fill="#fff7ed" stroke="#c0392b" strokeWidth="1.2"/>
      <line x1="48" y1="10" x2="48" y2="14.5" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="48" cy="17" r="0.9" fill="#c0392b"/>
      {/* Barcode lines */}
      <g opacity="0.3">
        <line x1="20" y1="36" x2="20" y2="42" stroke="#26251e" strokeWidth="0.8"/>
        <line x1="22" y1="36" x2="22" y2="42" stroke="#26251e" strokeWidth="1.2"/>
        <line x1="24.5" y1="36" x2="24.5" y2="42" stroke="#26251e" strokeWidth="0.6"/>
        <line x1="26" y1="36" x2="26" y2="42" stroke="#26251e" strokeWidth="1"/>
        <line x1="28" y1="36" x2="28" y2="42" stroke="#26251e" strokeWidth="0.8"/>
      </g>
    </svg>
  )
}

/* ─── Quick Prompt SVG Map ─── */
const svgMap = {
  'bug': SvgForeignObject,
  'alert-triangle': SvgBadTaste,
  'heart-pulse': SvgBodyDiscomfort,
  'package': SvgPackageIssue,
}

/* ─── Compact SVG Chips — small scene illustrations for action chips ─── */
function SvgChipInspection() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5">
      {/* Shield with checkmark — food safety inspection */}
      <path d="M14 3L5 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L14 3z" fill="#f54e00" fillOpacity="0.1" stroke="#f54e00" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M10.5 14l2.5 2.5L18 11" stroke="#f54e00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Small scan dots */}
      <circle cx="7" cy="20" r="0.8" fill="#f54e00" opacity="0.4"/>
      <circle cx="21" cy="20" r="0.8" fill="#f54e00" opacity="0.4"/>
    </svg>
  )
}

function SvgChipOrder() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5">
      {/* Document */}
      <rect x="5" y="3" width="14" height="19" rx="2" fill="#2980b9" fillOpacity="0.08" stroke="#2980b9" strokeWidth="1.1"/>
      <line x1="8" y1="8" x2="16" y2="8" stroke="#2980b9" strokeWidth="0.8" opacity="0.5"/>
      <line x1="8" y1="11" x2="14" y2="11" stroke="#2980b9" strokeWidth="0.8" opacity="0.5"/>
      <line x1="8" y1="14" x2="15" y2="14" stroke="#2980b9" strokeWidth="0.8" opacity="0.5"/>
      {/* Branching arrows — 9-way intent */}
      <path d="M20 10l4 2-4 2" stroke="#2980b9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 16l4 2-4 2" stroke="#2980b9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
      <circle cx="24" cy="12" r="1.2" fill="#2980b9" opacity="0.3"/>
      <circle cx="24" cy="18" r="1.2" fill="#2980b9" opacity="0.2"/>
    </svg>
  )
}

function SvgChipKnowledge() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5">
      {/* Open book */}
      <path d="M14 7C12 5 8 4 4 5v16c4-1 8 0 10 2" fill="#27ae60" fillOpacity="0.06" stroke="#27ae60" strokeWidth="1.1" strokeLinejoin="round"/>
      <path d="M14 7c2-2 6-3 10-2v16c-4-1-8 0-10 2" fill="#27ae60" fillOpacity="0.06" stroke="#27ae60" strokeWidth="1.1" strokeLinejoin="round"/>
      <line x1="14" y1="7" x2="14" y2="23" stroke="#27ae60" strokeWidth="0.8" opacity="0.4"/>
      {/* Magnifying glass overlay */}
      <circle cx="20" cy="8" r="4" fill="white" fillOpacity="0.7" stroke="#27ae60" strokeWidth="1"/>
      <line x1="23" y1="11" x2="25" y2="13.5" stroke="#27ae60" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function SvgChipStrategy() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5">
      {/* Lightbulb */}
      <path d="M14 3a7 7 0 00-4 12.7V18h8v-2.3A7 7 0 0014 3z" fill="#8e44ad" fillOpacity="0.08" stroke="#8e44ad" strokeWidth="1.1" strokeLinejoin="round"/>
      <line x1="11" y1="20" x2="17" y2="20" stroke="#8e44ad" strokeWidth="1" strokeLinecap="round"/>
      <line x1="12" y1="22" x2="16" y2="22" stroke="#8e44ad" strokeWidth="1" strokeLinecap="round"/>
      {/* Sparkle dots — AI recommendation */}
      <circle cx="5" cy="6" r="1" fill="#8e44ad" opacity="0.3"/>
      <path d="M4 10l1.5-0.5L5 8" stroke="#8e44ad" strokeWidth="0.7" opacity="0.3"/>
      <circle cx="23" cy="5" r="0.8" fill="#8e44ad" opacity="0.25"/>
      <path d="M22.5 8l1-0.5-0.5-1.5" stroke="#8e44ad" strokeWidth="0.7" opacity="0.25"/>
      {/* Filament glow */}
      <path d="M12 11c0.8-1.5 3.2-1.5 4 0" stroke="#8e44ad" strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}

function SvgChipTest() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5">
      {/* Terminal window */}
      <rect x="3" y="5" width="22" height="16" rx="2.5" fill="#e67e22" fillOpacity="0.06" stroke="#e67e22" strokeWidth="1.1"/>
      <circle cx="6.5" cy="8" r="0.8" fill="#e67e22" opacity="0.4"/>
      <circle cx="9" cy="8" r="0.8" fill="#e67e22" opacity="0.3"/>
      <circle cx="11.5" cy="8" r="0.8" fill="#e67e22" opacity="0.2"/>
      {/* Route nodes — intent routing test */}
      <circle cx="9" cy="14" r="2" fill="#e67e22" fillOpacity="0.15" stroke="#e67e22" strokeWidth="0.8"/>
      <circle cx="19" cy="12" r="1.5" fill="#e67e22" fillOpacity="0.15" stroke="#e67e22" strokeWidth="0.8"/>
      <circle cx="19" cy="17" r="1.5" fill="#e67e22" fillOpacity="0.15" stroke="#e67e22" strokeWidth="0.8"/>
      <line x1="11" y1="13.5" x2="17.5" y2="12" stroke="#e67e22" strokeWidth="0.8"/>
      <line x1="11" y1="14.5" x2="17.5" y2="17" stroke="#e67e22" strokeWidth="0.8"/>
      {/* Lightning — real-time */}
      <path d="M23 2l-2 4h2.5l-2 4" stroke="#e67e22" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function WelcomeScreen({ onSend }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4" data-component="welcome-screen">
      {/* Greeting cluster — compact, pushed up */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex items-center gap-2.5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'var(--cursor-orange)' }}
          >
            <Shield className="h-5 w-5 text-white" />
          </div>
          <h2
            className="text-xl font-semibold tracking-tight cursor-display"
            style={{ color: 'var(--cursor-ink)' }}
          >
            欢迎来到喜茶
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed" style={{ color: 'var(--cursor-border-55)' }}>
          食品安全智能服务系统 — 多模型智能质检 · 感知-决策-执行全链路闭环 · 实时风险识别与守护
        </p>
      </div>

      {/* Quick Prompt Cards — 2x2 grid with SVG illustrations */}
      <div className="grid w-full max-w-xl grid-cols-2 gap-2.5 mb-6">
        {QUICK_PROMPTS.map((prompt) => {
          const SvgCard = svgMap[prompt.icon]
          return (
            <button
              key={prompt.text}
              onClick={() => onSend(prompt.text)}
              className="group flex items-start gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-sm"
              style={{
                borderColor: 'var(--cursor-border-10)',
                background: 'var(--cursor-surface-300)',
              }}
              data-component="quick-prompt-card"
            >
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'var(--cursor-orange-bg, rgba(245,78,0,0.06))' }}
              >
                {SvgCard ? <SvgCard /> : <Sparkles className="h-5 w-5" style={{ color: 'var(--cursor-orange)' }} />}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <span className="block text-sm font-medium leading-tight" style={{ color: 'var(--cursor-ink)' }}>
                  {prompt.text}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug" style={{ color: 'var(--cursor-border-55)' }}>
                  {prompt.description}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Quick Action Chips — SVG illustration chips above input ─── */
const QUICK_ACTIONS = [
  { Svg: SvgChipInspection, label: '食安检测', color: '#f54e00', desc: 'AIQC 多模型质检' },
  { Svg: SvgChipOrder, label: '订单处理', color: '#2980b9', desc: '9路意图分支' },
  { Svg: SvgChipKnowledge, label: '知识检索', color: '#27ae60', desc: '策略知识库' },
  { Svg: SvgChipStrategy, label: '策略推荐', color: '#8e44ad', desc: 'SOP 匹配' },
  { Svg: SvgChipTest, label: '意图测试', color: '#e67e22', desc: '实时路由测试' },
]

/* ─── Chat Input Bar ─── */
function ChatInputBar({ onSend, isStreaming, onStop }) {
  const [input, setInput] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const [mediaError, setMediaError] = useState('')
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const handleSubmit = () => {
    const text = input.trim()
    if (!text || isStreaming) return
    let finalText = text
    if (attachedFile) {
      finalText = `[已上传文件: ${attachedFile.name}]\n${text}`
      setAttachedFile(null)
    }
    onSend(finalText)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  /* ── File upload handler ── */
  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachedFile(file)
    setInput(prev => prev ? prev : `[${type === 'image' ? '图片' : '文件'}: ${file.name}] `)
    e.target.value = '' // reset so same file can be re-selected
  }

  /* ── Voice recording handler (Web MediaRecorder API) ── */
  const toggleVoiceRecord = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      return
    }
    try {
      setMediaError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const duration = Math.round(blob.size / 16000) // rough estimate
        setInput(prev => prev ? prev + `\n[语音消息 (${duration}s)]` : `[语音消息 (${duration}s)] 请帮我处理这个问题`)
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      setMediaError('无法访问麦克风，请检查浏览器权限设置')
      setTimeout(() => setMediaError(''), 3000)
    }
  }

  /* ── Paste handler for images ── */
  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          setAttachedFile(file)
          setInput(prev => prev ? prev : `[已粘贴图片: ${file.name || '剪贴板图片'}] `)
        }
        break
      }
    }
  }

  return (
    <div
      className="px-4 py-3"
      style={{
        borderTop: '1px solid var(--cursor-border-10)',
        background: 'var(--cursor-surface-400)',
      }}
      data-component="chat-input-bar"
    >
      <div className="mx-auto max-w-[820px]">
        {/* Quick Action Chips — SVG Illustration Chips */}
        <div className="relative flex items-center gap-1.5 mb-2 flex-wrap">
          {QUICK_ACTIONS.map((action, i) => {
            const { Svg } = action
            return (
              <button
                key={i}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] transition-all hover:shadow-sm"
                style={{
                  borderColor: action.color + '25',
                  background: action.color + '06',
                  color: action.color,
                }}
                onClick={() => onSend(`请使用${action.label}模式帮我处理`)}
                title={action.desc}
                data-component="quick-action-chip"
              >
                <Svg />
                {action.label}
              </button>
            )
          })}
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--cursor-border-10)', color: 'var(--cursor-border-55)' }}
            onClick={() => setShowMore(!showMore)}
          >
            <MoreHorizontal className="h-3 w-3" />
            更多
          </button>
          {showMore && (
            <div className="absolute z-50 top-full left-0 mt-1 rounded-lg border shadow-lg p-2 min-w-[160px]" style={{ background: 'var(--cursor-surface-300)', borderColor: 'var(--cursor-border-10)' }}>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] w-full text-left hover:opacity-80" style={{ color: 'var(--cursor-ink)' }} onClick={() => { imageInputRef.current?.click(); setShowMore(false) }}>
                <Image className="h-3.5 w-3.5" style={{ color: '#2980b9' }} /> 上传图片
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] w-full text-left hover:opacity-80" style={{ color: 'var(--cursor-ink)' }} onClick={() => { fileInputRef.current?.click(); setShowMore(false) }}>
                <FileText className="h-3.5 w-3.5" style={{ color: '#e67e22' }} /> 上传文件
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] w-full text-left hover:opacity-80" style={{ color: 'var(--cursor-ink)' }} onClick={() => { onSend('请帮我生成质检报告'); setShowMore(false) }}>
                <Ticket className="h-3.5 w-3.5" style={{ color: '#8e44ad' }} /> 质检报告
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] w-full text-left hover:opacity-80" style={{ color: 'var(--cursor-ink)' }} onClick={() => { onSend('请帮我转接人工客服'); setShowMore(false) }}>
                <Phone className="h-3.5 w-3.5" style={{ color: '#27ae60' }} /> 转人工客服
              </button>
            </div>
          )}
        </div>

        {/* Attached file indicator */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-1.5 px-2 py-1 rounded-md text-[11px] animate-fade-in" style={{
            background: 'var(--cursor-surface-300)',
            color: 'var(--cursor-ink)',
            border: '1px solid var(--cursor-border-10)',
          }}>
            <Upload className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--cursor-orange)' }} />
            <span className="truncate">{attachedFile.name}</span>
            <span style={{ color: 'var(--cursor-border-55)' }}>({(attachedFile.size / 1024).toFixed(1)}KB)</span>
            <button className="ml-auto flex-shrink-0" onClick={() => { setAttachedFile(null); setInput(prev => prev.replace(/\[(已上传文件|图片|文件):.*?\]\s*/, '')) }}>
              <X className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }} />
            </button>
          </div>
        )}

        {/* Voice recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 mb-1.5 px-2 py-1 rounded-md text-[11px] animate-fade-in" style={{
            background: 'hsl(345 60% 96%)',
            color: 'var(--cursor-error)',
            border: '1px solid rgba(207,45,86,0.15)',
          }}>
            <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--cursor-error)' }} />
            正在录音... 点击麦克风按钮停止
          </div>
        )}

        {/* Media error */}
        {mediaError && (
          <div className="flex items-center gap-2 mb-1.5 px-2 py-1 rounded-md text-[11px] animate-fade-in" style={{
            background: 'hsl(33 80% 94%)',
            color: 'var(--cursor-gold)',
          }}>
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {mediaError}
          </div>
        )}

        <div className="chat-input-bar">
          {/* File upload (hidden input) */}
          <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv" onChange={(e) => handleFileSelect(e, 'file')} />
          <input ref={imageInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'image')} />

          {/* Attach file button */}
          <Button variant="ghost" size="icon" className="flex-shrink-0" title="上传文件" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Upload image button */}
          <Button variant="ghost" size="icon" className="flex-shrink-0" title="上传图片" onClick={() => imageInputRef.current?.click()}>
            <Image className="h-4 w-4" />
          </Button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="描述您遇到的食品安全问题..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm"
            style={{
              color: 'var(--cursor-ink)',
              maxHeight: '120px',
            }}
          />

          {/* Voice record button */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            title={isRecording ? '停止录音' : '语音输入'}
            onClick={toggleVoiceRecord}
            style={isRecording ? { color: 'var(--cursor-error)' } : {}}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          {isStreaming ? (
            <Button
              variant="destructive"
              size="icon"
              onClick={onStop}
              className="flex-shrink-0"
              title="停止生成"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!input.trim()}
              size="icon"
              className={cn(
                'flex-shrink-0',
                !input.trim() && 'opacity-50 cursor-not-allowed'
              )}
              title="发送"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        {/* Status indicators */}
        <div className="flex items-center gap-3 mt-1.5 text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
          <span className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3" stroke="#27ae60" strokeWidth="1.2"/><path d="M3.5 5l1 1 2-2" stroke="#27ae60" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
            SSE 流式
          </span>
          <span className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="1" y="2" width="8" height="6" rx="1" stroke="#2980b9" strokeWidth="1.1"/><line x1="3" y1="4" x2="7" y2="4" stroke="#2980b9" strokeWidth="0.8" opacity="0.6"/><line x1="3" y1="6" x2="6" y2="6" stroke="#2980b9" strokeWidth="0.8" opacity="0.4"/></svg>
            RAG 增强
          </span>
          <span className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1L2 3v3c0 2.2 1.3 4.2 3 4.8 1.7-0.6 3-2.6 3-4.8V3L5 1z" stroke="#8e44ad" strokeWidth="1.1" strokeLinejoin="round"/></svg>
            智能质检
          </span>
          <span className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3.5" stroke="#e67e22" strokeWidth="1.1"/><path d="M5 3v2l1.5 1" stroke="#e67e22" strokeWidth="0.9" strokeLinecap="round"/></svg>
            实时推理
          </span>
        </div>
        {/* 专业免责声明 */}
        <p className="mt-2 text-center text-[10px] leading-relaxed" style={{ color: 'var(--cursor-border-55)', opacity: 0.75 }}>
          {BRAND.disclaimer}
        </p>
      </div>
    </div>
  )
}

/* ─── Floating Service Widget — 可拖拽智能客服悬浮窗 ─── */
function FloatingServiceWidget({ onSend, role = 'consumer' }) {
  const [expanded, setExpanded] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const dragRef = useRef(null)
  const offsetRef = useRef({ x: 0, y: 0 })

  // Initialize position (bottom-right)
  useEffect(() => {
    if (pos.x === 0 && pos.y === 0) {
      setPos({ x: window.innerWidth - 76, y: window.innerHeight - 88 })
    }
  }, [])

  // Mouse drag
  const handleMouseDown = (e) => {
    if (e.target.closest('button[data-action]') || e.target.closest('[data-nodrag]')) return
    e.preventDefault()
    setDragging(true)
    offsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - 64, e.clientX - offsetRef.current.x)),
        y: Math.max(8, Math.min(window.innerHeight - 64, e.clientY - offsetRef.current.y)),
      })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging])

  // Touch drag
  const handleTouchStart = (e) => {
    if (e.target.closest('button[data-action]') || e.target.closest('[data-nodrag]')) return
    const t = e.touches[0]
    setDragging(true)
    offsetRef.current = { x: t.clientX - pos.x, y: t.clientY - pos.y }
  }

  useEffect(() => {
    if (!dragging) return
    const onTouchMove = (e) => {
      const t = e.touches[0]
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - 64, t.clientX - offsetRef.current.x)),
        y: Math.max(8, Math.min(window.innerHeight - 64, t.clientY - offsetRef.current.y)),
      })
    }
    const onTouchEnd = () => setDragging(false)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    return () => { window.removeEventListener('touchmove', onTouchMove); window.removeEventListener('touchend', onTouchEnd) }
  }, [dragging])

  /* ── Role-aware action groups ── */
  const isStaff = role === 'staff'

  const actionGroups = isStaff ? [
    {
      id: 'workflow',
      label: '工作流',
      color: '#e67e22',
      items: [
        { label: '当前工单', action: '请显示当前待处理的工单列表' },
        { label: '质检结果', action: '请显示最新的质检分析结果' },
        { label: '待升级工单', action: '请显示需要升级处理的工单' },
      ],
    },
    {
      id: 'customer',
      label: '客户管理',
      color: '#2980b9',
      items: [
        { label: '客户信息', action: '请显示当前客户的详细信息' },
        { label: '订单详情', action: '请查询当前订单的详细信息' },
        { label: '历史工单', action: '请显示该客户的历史工单记录' },
      ],
    },
    {
      id: 'safety',
      label: '食安数据',
      color: '#27ae60',
      items: [
        { label: '红线预警', action: '请显示当前的红线行为预警信息' },
        { label: '分类统计', action: '请显示今天的食安分类统计数据' },
        { label: '质检报告', action: '请帮我生成食品安全质检报告' },
      ],
    },
  ] : [
    {
      id: 'complaint',
      label: '投诉服务',
      color: '#e67e22',
      items: [
        { label: '查看投诉进度', action: '请帮我查看投诉处理进度' },
        { label: '催促进度', action: '请帮我催促投诉处理进度' },
        { label: '补偿方案', action: '请告诉我可以获得的补偿方案' },
      ],
    },
    {
      id: 'contact',
      label: '联系门店',
      color: '#2980b9',
      items: [
        { label: '转人工客服', action: '请帮我转接人工客服' },
        { label: '致电门店', action: '请帮我联系下单门店' },
        { label: '催单', action: '我的订单还没好，请帮我催单' },
      ],
    },
    {
      id: 'product',
      label: '产品信息',
      color: '#27ae60',
      items: [
        { label: '成分查询', action: '请帮我查询饮品成分和过敏原信息' },
        { label: '质检报告', action: '请帮我生成食品安全质检报告' },
      ],
    },
  ]

  const tagActions = isStaff ? [
    { label: '待处理', color: '#e67e22', action: '请显示待处理工单' },
    { label: '红线预警', color: '#e74c3c', action: '请显示红线预警工单' },
    { label: '升级工单', color: '#8e44ad', action: '请显示需要升级的工单' },
    { label: '今日统计', color: '#2980b9', action: '请显示今日食安统计数据' },
    { label: '质检报告', color: '#27ae60', action: '请生成今日质检报告' },
  ] : [
    { label: '投诉进度', color: '#e67e22', action: '请帮我查看投诉处理进度' },
    { label: '退款', color: '#e74c3c', action: '请帮我申请退款' },
    { label: '异物反馈', color: '#8e44ad', action: '我的饮品中发现异物' },
    { label: '口味问题', color: '#f39c12', action: '我的饮品口味和预期不一样' },
    { label: '转人工', color: '#2980b9', action: '请帮我转接人工客服' },
  ]

  const panelW = 280
  const panelX = expanded
    ? Math.max(8, Math.min(pos.x - panelW + 60, window.innerWidth - panelW - 8))
    : pos.x
  const panelY = expanded
    ? Math.max(8, Math.min(pos.y - 420, window.innerHeight - 440))
    : pos.y

  return (
    <div
      ref={dragRef}
      className="fixed z-[9999] select-none"
      style={{
        left: panelX,
        top: panelY,
        transition: dragging ? 'none' : 'left 0.35s cubic-bezier(0.4,0,0.2,1), top 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}
      data-component="floating-service-widget"
    >
      {expanded ? (
        /* ════════ Expanded Panel ════════ */
        <div
          className="rounded-2xl border overflow-hidden animate-slide-up"
          style={{
            width: panelW,
            background: 'var(--cursor-bg)',
            borderColor: 'var(--cursor-border-10)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06)',
          }}
        >
          {/* ── Header: 品牌区 + 拖拽条 ── */}
          <div
            className="relative cursor-grab active:cursor-grabbing"
            style={{
              background: isStaff
                ? 'linear-gradient(135deg, #3a3a3a 0%, #1a1a1a 100%)'
                : 'linear-gradient(135deg, #f54e00 0%, #d43800 100%)',
              padding: '14px 16px 16px',
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Grip indicator */}
            <div className="flex justify-center mb-2">
              <div className="w-8 h-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }} />
            </div>

            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                }}>
                  <Shield className="h-5 w-5 text-white" />
                </div>
                {/* Online dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{
                  background: '#27ae60',
                  borderColor: isStaff ? '#1a1a1a' : '#d43800',
                }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-white leading-tight">
                  {isStaff ? '客服工作台' : '阿喜智能助手'}
                </div>
                <div className="text-[10px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {isStaff ? '食安智能服务中心' : 'AI 食安服务 · 全程可追踪'}
                </div>
              </div>

              {/* Close */}
              <button
                data-action="true"
                className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.15)' }}
                onClick={() => setExpanded(false)}
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>

            {/* Greeting bubble */}
            <div className="mt-3 rounded-xl px-3 py-2.5 text-[11px] leading-relaxed" style={{
              background: 'rgba(255,255,255,0.13)',
              color: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(4px)',
            }}>
              {isStaff
                ? '您好，欢迎使用客服工作台。以下是您的工作快捷操作，也可以直接输入指令。'
                : '您好，欢迎来到喜茶！请问有什么可以帮到您？您可以选择以下服务或直接描述您的问题。'}
            </div>

            {/* Staff: compact KPI bar */}
            {isStaff && (
              <div className="flex gap-1.5 mt-2.5">
                {[
                  { label: '待处理', value: '3', dot: '#ffa726' },
                  { label: '红线', value: '1', dot: '#ef5350' },
                  { label: '今日质检', value: '12', dot: '#66bb6a' },
                ].map((kpi, i) => (
                  <div key={i} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5" style={{
                    background: 'rgba(255,255,255,0.1)',
                  }}>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: kpi.dot }} />
                    <span className="text-[10px] font-bold text-white">{kpi.value}</span>
                    <span className="text-[8px] text-white" style={{ opacity: 0.7 }}>{kpi.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Body: 分类快捷操作 ── */}
          <div className="px-3 pt-3 pb-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center justify-between" style={{ color: 'var(--cursor-border-55)' }}>
              <span>快捷服务</span>
              {isStaff && (
                <span className="text-[9px] font-normal px-1.5 py-0.5 rounded-full" style={{
                  background: '#3a3a3a15',
                  color: '#3a3a3a',
                }}>工作模式</span>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 mb-2.5">
              {actionGroups.map((group) => (
                <button
                  key={group.id}
                  data-action="true"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                  style={{
                    background: activeCategory === group.id ? group.color + '15' : 'var(--cursor-surface-300)',
                    color: activeCategory === group.id ? group.color : 'var(--cursor-border-55)',
                    border: `1px solid ${activeCategory === group.id ? group.color + '30' : 'transparent'}`,
                  }}
                  onClick={() => setActiveCategory(activeCategory === group.id ? null : group.id)}
                >
                  {group.label}
                  <ChevronDown className="h-2.5 w-2.5" style={{
                    transform: activeCategory === group.id ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }} />
                </button>
              ))}
            </div>

            {/* Action items — show selected category or all */}
            <div className="space-y-1 max-h-[200px] overflow-y-auto scrollbar-thin">
              {(activeCategory ? actionGroups.filter(g => g.id === activeCategory) : actionGroups).map((group) => (
                <div key={group.id}>
                  {!activeCategory && (
                    <div className="flex items-center gap-1.5 py-1.5" style={{ color: group.color + 'cc' }}>
                      <div className="h-px flex-1" style={{ background: group.color + '15' }} />
                      <span className="text-[9px] font-semibold uppercase tracking-wider">{group.label}</span>
                      <div className="h-px flex-1" style={{ background: group.color + '15' }} />
                    </div>
                  )}
                  {group.items.map((item, j) => (
                    <button
                      key={j}
                      data-action="true"
                      className="flex items-center gap-2.5 w-full px-2.5 py-[7px] rounded-lg text-left text-[11px] font-medium transition-all group/item"
                      style={{ color: 'var(--cursor-ink)' }}
                      onClick={() => { onSend(item.action); setExpanded(false) }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = group.color + '0d' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-white transition-all" style={{
                        background: group.color,
                        boxShadow: `0 2px 6px ${group.color}30`,
                      }}>
                        {j + 1}
                      </div>
                      <span className="flex-1 truncate">{item.label}</span>
                      <ArrowRight className="h-3 w-3 flex-shrink-0 opacity-0 group-hover/item:opacity-50 transition-all group-hover/item:translate-x-0.5" style={{ color: group.color }} />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* ── Tag chips ── */}
          <div className="px-3 py-2.5" style={{ borderTop: '1px solid var(--cursor-border-10)' }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }}>
                {isStaff ? '常用指令' : '热门问题'}
              </span>
              {isStaff && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#27ae60' }} />
                  <span className="text-[8px]" style={{ color: '#27ae60' }}>系统在线</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tagActions.map((tag, i) => (
                <button
                  key={i}
                  data-action="true"
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all hover:shadow-sm hover:-translate-y-px"
                  style={{
                    background: tag.color + '0a',
                    color: tag.color,
                    border: `1px solid ${tag.color}20`,
                  }}
                  onClick={() => { onSend(tag.action); setExpanded(false) }}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-3 py-2.5" style={{ background: 'var(--cursor-surface-300)', borderTop: '1px solid var(--cursor-border-10)' }}>
            {isStaff && (
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3 w-3" style={{ color: '#3a3a3a' }} />
                  <span className="text-[9px] font-medium" style={{ color: 'var(--cursor-ink)' }}>智能引擎运行中</span>
                </div>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold" style={{
                  background: '#27ae6018',
                  color: '#27ae60',
                }}>v2.1.0</span>
              </div>
            )}
            <button
              data-action="true"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-[11px] font-semibold transition-all hover:shadow-md hover:-translate-y-px"
              style={{
                background: isStaff
                  ? 'linear-gradient(135deg, #3a3a3a, #1a1a1a)'
                  : 'linear-gradient(135deg, #f54e00, #d43800)',
                color: 'white',
                boxShadow: isStaff
                  ? '0 2px 8px rgba(26,115,232,0.25)'
                  : '0 2px 8px rgba(245,78,0,0.25)',
              }}
              onClick={() => {
                onSend(isStaff ? '生成本时段质检报告' : '请帮我转接人工客服')
                setExpanded(false)
              }}
            >
              {isStaff ? <FileText className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
              {isStaff ? '生成质检报告' : '联系人工客服'}
            </button>
            <div className="text-center text-[9px] mt-1.5" style={{ color: 'var(--cursor-border-55)', opacity: 0.6 }}>
              {isStaff ? '质检数据仅供参考' : '阿喜回复仅供参考 · 重要事项请联系人工客服'}
            </div>
          </div>
        </div>
      ) : (
        /* ════════ Collapsed FAB ════════ */
        <div
          className="cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <button
            className="relative flex items-center justify-center rounded-full transition-all"
            style={{
              width: 56,
              height: 56,
              background: isStaff
                ? 'linear-gradient(135deg, #1a73e8, #0d47a1)'
                : 'linear-gradient(135deg, #f54e00, #d43800)',
              boxShadow: isStaff
                ? '0 4px 20px rgba(26,115,232,0.4), 0 2px 6px rgba(0,0,0,0.08)'
                : '0 4px 20px rgba(245,78,0,0.4), 0 2px 6px rgba(0,0,0,0.08)',
            }}
            onClick={() => { if (!dragging) setExpanded(true) }}
            title={isStaff ? '客服工作台' : '阿喜智能助手'}
          >
            <Shield className="h-6 w-6 text-white" />
            {/* Notification dot */}
            <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full" style={{
              background: '#27ae60',
              boxShadow: '0 0 0 2px white',
            }} />
            {/* Outer pulse */}
            <span className="absolute inset-0 rounded-full animate-ping" style={{
              background: isStaff ? '#3a3a3a' : '#f54e00',
              opacity: 0.15,
              animationDuration: '2.5s',
            }} />
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Consumer Workbench — 消费者端专属工作台 ─── */
function ConsumerWorkbench({ messages, onSend }) {
  const [activePanel, setActivePanel] = useState('history')
  const [activeFilter, setActiveFilter] = useState('all')

  // ── 真实会话数据（基于实际客服场景） ──
  const conversations = [
    { id: 1, title: '喝完一直拉肚子', desc: '请问目前有没有好转一些？建议及时就医', category: 'body', status: 'active', agent: '阿喜AI', rounds: 3, time: '3秒', urgent: true },
    { id: 2, title: '太离谱了要曝光', desc: '阿喜完全理解您的心情，马上为您升级处理', category: 'emotion', status: 'active', agent: '阿喜AI', rounds: 2, time: '2秒', urgent: true },
    { id: 3, title: '杯子里有金属片', desc: '已升级客诉，总部品质部30分钟内联系您', category: 'external', status: 'active', agent: '人工', rounds: 7, time: '7秒', urgent: true, escalated: true },
    { id: 4, title: '茶饮里有果核', desc: '阿喜来帮您处理，可以为您安排重做一杯', category: 'internal', status: 'resolved', agent: '阿喜AI', rounds: 5, time: '5秒' },
    { id: 5, title: '蛋糕打开已经发霉', desc: '非常重视，已紧急排查同批次产品', category: 'spoilage', status: 'active', agent: '阿喜AI', rounds: 4, time: '4秒', urgent: true },
    { id: 6, title: '饮品中有头发', desc: '非常抱歉，已为您安排退款和重做', category: 'external', status: 'resolved', agent: '阿喜AI', rounds: 4, time: '6秒' },
    { id: 7, title: '奶茶味道跟之前不一样', desc: '了解到您的反馈，可能是制作偏差，为您重做', category: 'taste', status: 'resolved', agent: '阿喜AI', rounds: 3, time: '4秒' },
    { id: 8, title: '想问下哪些饮品含花生', desc: '为您查询到以下饮品含有花生成分...', category: 'non_safety', status: 'resolved', agent: '阿喜AI', rounds: 2, time: '2秒' },
  ]

  // ── 食安分类体系 ──
  const categories = [
    { id: 'all', label: '全部' },
    { id: 'external', label: '外源性异物', color: '#e74c3c' },
    { id: 'internal', label: '内源性异物', color: '#e67e22' },
    { id: 'body', label: '身体不适', color: '#c0392b' },
    { id: 'taste', label: '饮品异味', color: '#f39c12' },
    { id: 'spoilage', label: '原料变质', color: '#8e44ad' },
    { id: 'non_safety', label: '非食安', color: '#7f8c8d' },
    { id: 'emotion', label: '情绪升级', color: '#d35400' },
  ]

  const filteredConversations = activeFilter === 'all'
    ? conversations
    : conversations.filter(c => c.category === activeFilter)

  // Derive complaint status from current conversation
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant')
  const hasComplaint = messages.some(m => m.role === 'user')
  const complaintStage = !hasComplaint ? 'waiting'
    : lastAssistantMsg?.decisionFrame?.route === 'closing_confirm' ? 'resolved'
    : lastAssistantMsg?.aiqc_v2 ? 'processing'
    : 'received'

  const stageLabels = { waiting: '等待反馈', received: '已接收', processing: '处理中', resolved: '已解决' }
  const stageColors = { waiting: '#8e8e8e', received: '#2980b9', processing: '#e67e22', resolved: '#27ae60' }

  const panelItems = [
    { id: 'history', label: '会话记录', icon: <MessageCircle className="h-3.5 w-3.5" /> },
    { id: 'complaint', label: '投诉进度', icon: <Clock className="h-3.5 w-3.5" /> },
    { id: 'faq', label: '常见问题', icon: <HelpCircle className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="w-[300px] flex-shrink-0 border-l overflow-y-auto hidden lg:flex lg:flex-col scrollbar-thin" style={{
      borderColor: 'var(--cursor-border-10)',
      background: 'var(--cursor-bg)',
    }} data-component="consumer-workbench">
      {/* ── Header ── */}
      <div className="px-4 py-3.5" style={{
        background: 'linear-gradient(135deg, var(--cursor-surface-400) 0%, var(--cursor-surface-300) 100%)',
        borderBottom: '1px solid var(--cursor-border-10)',
      }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #f54e00, #d43800)',
            boxShadow: '0 2px 8px rgba(245,78,0,0.25)',
          }}>
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold" style={{ color: 'var(--cursor-ink)' }}>服务记录</div>
            <div className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>食安分类 · 智能追踪</div>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex px-2 pt-2 gap-1" style={{ borderBottom: '1px solid var(--cursor-border-10)' }}>
        {panelItems.map(item => (
          <button
            key={item.id}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-medium transition-all relative rounded-t-lg"
            style={{
              color: activePanel === item.id ? 'var(--cursor-orange)' : 'var(--cursor-border-55)',
              background: activePanel === item.id ? 'var(--cursor-surface-300)' : 'transparent',
            }}
            onClick={() => setActivePanel(item.id)}
          >
            <span style={{ display: 'flex', opacity: activePanel === item.id ? 1 : 0.5 }}>{item.icon}</span>
            {item.label}
            {activePanel === item.id && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ background: 'var(--cursor-orange)' }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Panel Content ── */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin">

        {/* ═══ 会话记录 Panel ═══ */}
        {activePanel === 'history' && (
          <>
            {/* ── 食安分类过滤器 ── */}
            <div className="flex flex-wrap gap-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className="px-2 py-1 rounded-lg text-[9px] font-medium transition-all"
                  style={{
                    background: activeFilter === cat.id ? (cat.color || '#f54e00') + '15' : 'var(--cursor-surface-300)',
                    color: activeFilter === cat.id ? (cat.color || '#f54e00') : 'var(--cursor-border-55)',
                    border: `1px solid ${activeFilter === cat.id ? (cat.color || '#f54e00') + '30' : 'transparent'}`,
                  }}
                  onClick={() => setActiveFilter(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* ── 时间范围 ── */}
            <div className="flex items-center gap-1.5 px-1">
              <Clock className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }} />
              <span className="text-[9px] font-medium" style={{ color: 'var(--cursor-border-55)' }}>最近 7 天</span>
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{
                background: 'var(--cursor-surface-300)',
                color: 'var(--cursor-border-55)',
              }}>
                {filteredConversations.length} 条记录
              </span>
            </div>

            {/* ── 会话列表 ── */}
            <div className="space-y-1.5">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className="rounded-xl border px-3 py-2.5 transition-all hover:shadow-sm cursor-pointer group"
                  style={{ borderColor: conv.urgent ? '#e74c3c25' : 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cursor-surface-400)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--cursor-surface-300)' }}
                  onClick={() => onSend && onSend(conv.title)}
                >
                  <div className="flex items-start gap-2">
                    {/* Status dot */}
                    <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{
                      background: conv.status === 'active' ? '#e74c3c' : '#27ae60',
                    }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold truncate" style={{ color: 'var(--cursor-ink)' }}>{conv.title}</div>
                      <div className="text-[9px] mt-0.5 truncate" style={{ color: 'var(--cursor-border-55)' }}>{conv.desc}</div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[8px] px-1 py-0.5 rounded font-medium" style={{
                          background: 'var(--cursor-surface-400)',
                          color: 'var(--cursor-border-55)',
                        }}>
                          {conv.agent}
                        </span>
                        <span className="text-[8px]" style={{ color: 'var(--cursor-border-55)', opacity: 0.7 }}>
                          {conv.rounds}轮 · {conv.time}
                        </span>
                        {conv.escalated && (
                          <span className="text-[8px] px-1 py-0.5 rounded font-semibold" style={{
                            background: '#e74c3c15',
                            color: '#e74c3c',
                          }}>已转人工</span>
                        )}
                        {conv.urgent && !conv.escalated && (
                          <span className="text-[8px] px-1 py-0.5 rounded font-semibold" style={{
                            background: '#e67e2215',
                            color: '#e67e22',
                          }}>紧急</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── 底部统计 ── */}
            <div className="text-center text-[9px] pt-1" style={{ color: 'var(--cursor-border-55)' }}>
              8 条历史对话
            </div>
          </>
        )}

        {/* ═══ 投诉进度 Panel ═══ */}
        {activePanel === 'complaint' && (
          <>
            {/* ── Status Header Card ── */}
            <div className="rounded-xl border overflow-hidden" style={{
              borderColor: 'var(--cursor-border-10)',
              background: 'var(--cursor-surface-300)',
            }}>
              <div className="px-3.5 py-3 flex items-center justify-between" style={{
                background: `linear-gradient(135deg, ${stageColors[complaintStage]}12, ${stageColors[complaintStage]}06)`,
                borderBottom: '1px solid var(--cursor-border-10)',
              }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
                    background: stageColors[complaintStage] + '20',
                  }}>
                    {complaintStage === 'resolved' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" style={{ color: stageColors[complaintStage] }} />
                    ) : complaintStage === 'processing' ? (
                      <Zap className="h-3.5 w-3.5" style={{ color: stageColors[complaintStage] }} />
                    ) : (
                      <Clock className="h-3.5 w-3.5" style={{ color: stageColors[complaintStage] }} />
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold" style={{ color: 'var(--cursor-ink)' }}>服务进度</div>
                    <div className="text-[10px]" style={{ color: stageColors[complaintStage] }}>
                      {stageLabels[complaintStage]}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{
                  background: stageColors[complaintStage] + '18',
                  color: stageColors[complaintStage],
                }}>
                  {complaintStage === 'waiting' ? 'WAITING' : complaintStage === 'received' ? 'RECEIVED' : complaintStage === 'processing' ? 'IN PROGRESS' : 'RESOLVED'}
                </span>
              </div>

              {/* Progress Steps */}
              <div className="px-3.5 py-3 space-y-0">
                {[
                  { step: '提交反馈', desc: '您的问题已提交', done: hasComplaint },
                  { step: '智能分析', desc: '多模型智能质检', done: complaintStage === 'processing' || complaintStage === 'resolved' },
                  { step: '方案生成', desc: '补偿方案与处理建议', done: complaintStage === 'resolved' },
                  { step: '处理完成', desc: '问题已解决', done: complaintStage === 'resolved' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center pt-0.5">
                      <div className="h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all" style={{
                        background: item.done ? 'var(--cursor-orange)' : 'var(--cursor-border-10)',
                        boxShadow: item.done ? '0 2px 6px rgba(245,78,0,0.25)' : 'none',
                      }}>
                        {item.done ? (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M2 4l1.5 1.5L6 2.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--cursor-border-20)' }} />
                        )}
                      </div>
                      {i < 3 && <div className="w-px h-5 my-0.5" style={{
                        background: item.done ? 'var(--cursor-orange)' : 'var(--cursor-border-10)',
                        opacity: 0.35,
                      }} />}
                    </div>
                    <div className="pb-3">
                      <div className="text-[11px] font-medium leading-tight" style={{ color: item.done ? 'var(--cursor-ink)' : 'var(--cursor-border-55)' }}>
                        {item.step}
                      </div>
                      <div className="text-[9px] mt-0.5" style={{ color: 'var(--cursor-border-55)', opacity: 0.7 }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--cursor-border-55)' }}>
                快捷操作
              </div>
              {[
                { label: '转接人工客服', desc: '情绪激动或复杂问题直接转人工', color: '#e67e22', icon: <Phone className="h-3 w-3" /> },
                { label: '查看补偿方案', desc: '代金券 / 退款 / 重做', color: '#27ae60', icon: <Ticket className="h-3 w-3" /> },
                { label: '上传食安图片', desc: '拍照上传异物/问题产品', color: '#2980b9', icon: <Image className="h-3 w-3" /> },
              ].map((item, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all hover:shadow-sm group"
                  style={{
                    borderColor: item.color + '18',
                    background: item.color + '05',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = item.color + '0d' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = item.color + '05' }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                    background: item.color + '15',
                    color: item.color,
                  }}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }}>{item.label}</div>
                    <div className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>{item.desc}</div>
                  </div>
                  <ArrowRight className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: item.color }} />
                </button>
              ))}
            </div>
          </>
        )}

        {/* ═══ 常见问题 Panel ═══ */}
        {activePanel === 'faq' && (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--cursor-border-55)' }}>常见问题</div>
            <div className="space-y-1.5">
              {[
                { q: '饮品中发现异物怎么办？', a: '请保留异物并拍照，我们会第一时间为您处理。外源性异物（头发、塑料等）和内源性异物（果核等）处理方案不同，均可提供退款或重做。', color: '#e74c3c' },
                { q: '如何申请退款？', a: '提供订单号或手机号，我会为您查询退款方案。退款由门店核实后处理，预计24小时内完成。', color: '#e67e22' },
                { q: '什么情况下会转人工？', a: '以下情况会自动转人工：情绪激动/要求曝光、涉及人身伤害、金额赔偿争议、红线触发、或您主动要求转人工。', color: '#c0392b' },
                { q: '食安投诉处理流程？', a: '提交反馈 → 智能分类（内源/外源/非食安）→ 生成处理方案 → 门店负责人核实 → 12小时内联系您。', color: '#2980b9' },
                { q: '如何联系人工客服？', a: '您可以直接说"转人工"或点击快捷操作中的"转接人工客服"按钮。', color: '#27ae60' },
              ].map((item, i) => (
                <details key={i} className="rounded-xl border overflow-hidden group" style={{ borderColor: 'var(--cursor-border-10)' }}>
                  <summary className="px-3 py-2.5 text-[11px] font-medium cursor-pointer flex items-center gap-2.5 list-none" style={{ color: 'var(--cursor-ink)', background: 'var(--cursor-surface-300)' }}>
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <span className="flex-1">{item.q}</span>
                    <ChevronRight className="h-3 w-3 flex-shrink-0 transition-transform group-open:rotate-90" style={{ color: 'var(--cursor-border-55)' }} />
                  </summary>
                  <div className="px-3 py-2.5 text-[10px] leading-relaxed" style={{
                    color: 'var(--cursor-border-55)',
                    borderTop: '1px solid var(--cursor-border-10)',
                    background: 'var(--cursor-bg)',
                  }}>
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{
            background: 'rgba(245,78,0,0.1)',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L2 3.5v3c0 2.8 1.7 5.3 4 6 2.3-0.7 4-3.2 4-6v-3L6 1z" stroke="var(--cursor-orange)" strokeWidth="1.1" strokeLinejoin="round"/>
              <path d="M4.5 6l1 1L7.5 5" stroke="var(--cursor-orange)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-medium" style={{ color: 'var(--cursor-ink)' }}>喜茶食安保障体系</div>
            <div className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>全程质检守护</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Staff Workbench — 客服工作台专属右侧面板 ─── */
function StaffWorkbench({ messages }) {
  const [activePanel, setActivePanel] = useState('orders')
  const [expandedAlert, setExpandedAlert] = useState(null)

  // Simulated staff metrics
  const metrics = {
    pendingOrders: 3,
    todayInspections: 12,
    resolvedRate: 94.7,
    redLineAlerts: 1,
    avgResponseTime: '2m 18s',
    escalationQueue: 2,
  }

  const panelItems = [
    { id: 'orders', label: '质检工单', icon: <ClipboardList className="h-3.5 w-3.5" /> },
    { id: 'analytics', label: '数据看板', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: 'monitor', label: '食安监控', icon: <Activity className="h-3.5 w-3.5" /> },
  ]

  // Real work orders based on actual customer service scenarios
  const workOrders = [
    { id: 'WO-20260609-001', type: '异物投诉（外源性）', store: '深圳万象城店', severity: 'high', status: 'pending', time: '10:23', detail: '顾客反馈杯中发现头发，已拍照留存' },
    { id: 'WO-20260609-002', type: '身体不适', store: '广州天河城店', severity: 'high', status: 'processing', time: '09:45', detail: '顾客饮用后腹泻，建议就医并保留凭证' },
    { id: 'WO-20260609-003', type: '原料变质（红线）', store: '上海南京路店', severity: 'high', status: 'escalated', time: '08:30', detail: '蛋糕打开已发霉，紧急排查同批次产品' },
    { id: 'WO-20260608-015', type: '内源性异物', store: '北京三里屯店', severity: 'medium', status: 'resolved', time: '昨日', detail: '茶饮中发现果核，已安排重做+优惠券补偿' },
    { id: 'WO-20260608-014', type: '口味异常', store: '成都春熙路店', severity: 'low', status: 'resolved', time: '昨日', detail: '饮品味道与预期不符，制作偏差已纠正' },
    { id: 'WO-20260609-004', type: '情绪升级（转人工）', store: '杭州西湖银泰店', severity: 'high', status: 'escalated', time: '11:05', detail: '顾客情绪激动要求曝光，已转人工处理' },
  ]

  const severityConfig = {
    high: { label: '高', color: '#e74c3c', bg: '#e74c3c' },
    medium: { label: '中', color: '#e67e22', bg: '#e67e22' },
    low: { label: '低', color: '#27ae60', bg: '#27ae60' },
  }

  const statusConfig = {
    pending: { label: '待处理', color: '#e67e22' },
    processing: { label: '处理中', color: '#2980b9' },
    escalated: { label: '已升级', color: '#e74c3c' },
    resolved: { label: '已完成', color: '#8e8e8e' },
    transfer: { label: '转人工', color: '#c0392b' },
  }

  // Red-line alerts
  const redLineAlerts = [
    { id: 1, type: '温度红线', store: '上海南京路店', detail: '冷藏柜温度 12.3°C，超过红线 8°C', time: '08:30', level: 'critical' },
  ]

  return (
    <div className="w-[300px] flex-shrink-0 border-l overflow-y-auto hidden lg:flex lg:flex-col scrollbar-thin" style={{
      borderColor: 'var(--cursor-border-10)',
      background: 'var(--cursor-bg)',
    }} data-component="staff-workbench">
      {/* ── Header ── */}
      <div className="px-4 py-4" style={{
        background: 'linear-gradient(135deg, #3a3a3a 0%, #1a1a1a 100%)',
      }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
          }}>
            <Layers className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-white">客服工作台</div>
            <div className="text-[10px] text-white" style={{ opacity: 0.75 }}>食安智能质检服务</div>
          </div>
          <button className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:bg-white/10">
            <Settings className="h-3.5 w-3.5 text-white" style={{ opacity: 0.7 }} />
          </button>
        </div>

        {/* ── Quick Stats Bar ── */}
        <div className="flex gap-1.5 mt-3">
          {[
            { label: '待处理', value: metrics.pendingOrders, color: '#ffa726' },
            { label: '今日质检', value: metrics.todayInspections, color: '#66bb6a' },
            { label: '红线预警', value: metrics.redLineAlerts, color: '#ef5350' },
            { label: '解决率', value: metrics.resolvedRate + '%', color: '#78909c' },
          ].map((stat, i) => (
            <div key={i} className="flex-1 rounded-lg px-2 py-1.5 text-center" style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(4px)',
            }}>
              <div className="text-[12px] font-bold text-white">{stat.value}</div>
              <div className="text-[8px] text-white" style={{ opacity: 0.65 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex px-2 pt-2 gap-1" style={{ borderBottom: '1px solid var(--cursor-border-10)' }}>
        {panelItems.map(item => (
          <button
            key={item.id}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-medium transition-all relative rounded-t-lg"
            style={{
              color: activePanel === item.id ? '#3a3a3a' : 'var(--cursor-border-55)',
              background: activePanel === item.id ? 'var(--cursor-surface-300)' : 'transparent',
            }}
            onClick={() => setActivePanel(item.id)}
          >
            <span style={{ display: 'flex', opacity: activePanel === item.id ? 1 : 0.5 }}>{item.icon}</span>
            {item.label}
            {activePanel === item.id && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ background: '#3a3a3a' }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Panel Content ── */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin">

        {/* ═══ 质检工单 Panel ═══ */}
        {activePanel === 'orders' && (
          <>
            {/* Search */}
            <div className="flex items-center gap-2 rounded-lg border px-2.5 py-2" style={{
              borderColor: 'var(--cursor-border-10)',
              background: 'var(--cursor-surface-300)',
            }}>
              <Search className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }} />
              <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>搜索工单号 / 门店 / 类型...</span>
            </div>

            {/* Work Orders */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--cursor-border-55)' }}>
                近期工单
              </div>
              {workOrders.map((order, i) => (
                <div
                  key={order.id}
                  className="rounded-xl border overflow-hidden transition-all hover:shadow-sm cursor-pointer group"
                  style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cursor-surface-400)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--cursor-surface-300)' }}
                >
                  <div className="px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{
                          background: severityConfig[order.severity].bg + '18',
                          color: severityConfig[order.severity].color,
                        }}>
                          {severityConfig[order.severity].label}
                        </span>
                        <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }}>{order.type}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-full text-[8px] font-semibold" style={{
                        background: statusConfig[order.status].color + '15',
                        color: statusConfig[order.status].color,
                      }}>
                        {statusConfig[order.status].label}
                      </span>
                    </div>
                    <div className="text-[9px] mb-1 truncate" style={{ color: 'var(--cursor-border-55)' }}>{order.detail}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>{order.store}</span>
                      <span className="text-[9px]" style={{ color: 'var(--cursor-border-55)', opacity: 0.7 }}>{order.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--cursor-border-55)' }}>
                快捷指令
              </div>
              {[
                { label: '生成质检报告', desc: '汇总今日全部质检结果', color: '#3a3a3a', icon: <FileText className="h-3 w-3" /> },
                { label: '查看升级工单', desc: `${metrics.escalationQueue} 个待处理升级`, color: '#e74c3c', icon: <TrendingUp className="h-3 w-3" /> },
                { label: '导出统计数据', desc: 'CSV / Excel 格式导出', color: '#27ae60', icon: <BarChart3 className="h-3 w-3" /> },
              ].map((item, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all hover:shadow-sm group"
                  style={{
                    borderColor: item.color + '18',
                    background: item.color + '05',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = item.color + '0d' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = item.color + '05' }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                    background: item.color + '15',
                    color: item.color,
                  }}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }}>{item.label}</div>
                    <div className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>{item.desc}</div>
                  </div>
                  <ArrowRight className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: item.color }} />
                </button>
              ))}
            </div>
          </>
        )}

        {/* ═══ 数据看板 Panel ═══ */}
        {activePanel === 'analytics' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '今日接待', value: '47', trend: '+12%', color: '#3a3a3a', icon: <Users className="h-3.5 w-3.5" /> },
                { label: '平均响应', value: metrics.avgResponseTime, trend: '-8%', color: '#27ae60', icon: <Clock className="h-3.5 w-3.5" /> },
                { label: '质检完成', value: metrics.todayInspections, trend: '+5', color: '#e67e22', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
                { label: '解决率', value: metrics.resolvedRate + '%', trend: '+2.1%', color: '#8e44ad', icon: <TrendingUp className="h-3.5 w-3.5" /> },
              ].map((kpi, i) => (
                <div key={i} className="rounded-xl border p-3" style={{
                  borderColor: 'var(--cursor-border-10)',
                  background: 'var(--cursor-surface-300)',
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{
                      background: kpi.color + '15',
                      color: kpi.color,
                    }}>
                      {kpi.icon}
                    </div>
                    <span className="text-[8px] font-semibold px-1 py-0.5 rounded" style={{
                      background: kpi.trend.startsWith('+') || kpi.trend.startsWith('-8') ? '#27ae6015' : '#e74c3c15',
                      color: kpi.trend.startsWith('+') || kpi.trend.startsWith('-8') ? '#27ae60' : '#e74c3c',
                    }}>
                      {kpi.trend}
                    </span>
                  </div>
                  <div className="text-[14px] font-bold" style={{ color: 'var(--cursor-ink)' }}>{kpi.value}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Category Distribution */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)' }}>
              <div className="px-3 py-2.5 text-[10px] font-semibold" style={{
                background: 'var(--cursor-surface-300)',
                color: 'var(--cursor-ink)',
                borderBottom: '1px solid var(--cursor-border-10)',
              }}>
                投诉类型分布
              </div>
              <div className="p-3 space-y-2.5">
                {[
                  { label: '异物投诉', pct: 32, color: '#e74c3c' },
                  { label: '口味异常', pct: 25, color: '#e67e22' },
                  { label: '温度超标', pct: 18, color: '#f39c12' },
                  { label: '包装问题', pct: 15, color: '#2980b9' },
                  { label: '其他咨询', pct: 10, color: '#8e8e8e' },
                ].map((cat, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px]" style={{ color: 'var(--cursor-ink)' }}>{cat.label}</span>
                      <span className="text-[10px] font-semibold" style={{ color: cat.color }}>{cat.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--cursor-border-10)' }}>
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${cat.pct}%`,
                        background: cat.color,
                        opacity: 0.8,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly Volume */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)' }}>
              <div className="px-3 py-2.5 text-[10px] font-semibold" style={{
                background: 'var(--cursor-surface-300)',
                color: 'var(--cursor-ink)',
                borderBottom: '1px solid var(--cursor-border-10)',
              }}>
                今日接待趋势
              </div>
              <div className="p-3">
                <div className="flex items-end gap-1 h-16">
                  {[2, 5, 8, 12, 9, 15, 18, 14, 10, 7, 4, 3].map((v, i) => (
                    <div key={i} className="flex-1 rounded-t transition-all" style={{
                      height: `${(v / 18) * 100}%`,
                      background: i === 6 ? '#3a3a3a' : '#3a3a3a30',
                      minWidth: 4,
                    }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[8px]" style={{ color: 'var(--cursor-border-55)' }}>8:00</span>
                  <span className="text-[8px]" style={{ color: 'var(--cursor-border-55)' }}>14:00</span>
                  <span className="text-[8px]" style={{ color: 'var(--cursor-border-55)' }}>20:00</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══ 食安监控 Panel ═══ */}
        {activePanel === 'monitor' && (
          <>
            {/* Red-line Alerts */}
            {redLineAlerts.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-1">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#e74c3c' }} />
                  <span className="text-[10px] font-semibold" style={{ color: '#e74c3c' }}>红线预警</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{
                    background: '#e74c3c18',
                    color: '#e74c3c',
                  }}>
                    {redLineAlerts.length}
                  </span>
                </div>
                {redLineAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="rounded-xl border overflow-hidden"
                    style={{ borderColor: '#e74c3c30', background: '#e74c3c05' }}
                  >
                    <div className="px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3" style={{ color: '#e74c3c' }} />
                          <span className="text-[11px] font-semibold" style={{ color: '#e74c3c' }}>{alert.type}</span>
                        </div>
                        <span className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>{alert.time}</span>
                      </div>
                      <div className="text-[10px] mb-0.5" style={{ color: 'var(--cursor-ink)' }}>{alert.store}</div>
                      <div className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>{alert.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Store Health Overview */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--cursor-border-55)' }}>
                门店健康度
              </div>
              {[
                { store: '深圳万象城店', score: 96, status: '良好', color: '#27ae60' },
                { store: '广州天河城店', score: 91, status: '良好', color: '#27ae60' },
                { store: '北京三里屯店', score: 88, status: '正常', color: '#2980b9' },
                { store: '上海南京路店', score: 72, status: '预警', color: '#e67e22' },
                { store: '成都春熙路店', score: 95, status: '良好', color: '#27ae60' },
              ].map((store, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all hover:shadow-sm cursor-pointer group"
                  style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cursor-surface-400)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--cursor-surface-300)' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                    background: store.color + '15',
                  }}>
                    <span className="text-[11px] font-bold" style={{ color: store.color }}>{store.score}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate" style={{ color: 'var(--cursor-ink)' }}>{store.store}</div>
                    <div className="text-[9px]" style={{ color: store.color }}>{store.status}</div>
                  </div>
                  <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--cursor-border-10)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${store.score}%`,
                      background: store.color,
                      opacity: 0.7,
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Temperature Monitoring */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)' }}>
              <div className="px-3 py-2.5 text-[10px] font-semibold" style={{
                background: 'var(--cursor-surface-300)',
                color: 'var(--cursor-ink)',
                borderBottom: '1px solid var(--cursor-border-10)',
              }}>
                冷链温度监控
              </div>
              <div className="p-3 space-y-2">
                {[
                  { label: '冷藏柜 A', temp: '4.2°C', status: '正常', color: '#27ae60' },
                  { label: '冷藏柜 B', temp: '5.1°C', status: '正常', color: '#27ae60' },
                  { label: '冷冻柜', temp: '-18.3°C', status: '正常', color: '#27ae60' },
                  { label: '展示冷柜', temp: '6.8°C', status: '偏高', color: '#e67e22' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                      <span className="text-[10px]" style={{ color: 'var(--cursor-ink)' }}>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold" style={{ color: item.color }}>{item.temp}</span>
                      <span className="text-[8px] px-1 py-0.5 rounded" style={{
                        background: item.color + '15',
                        color: item.color,
                      }}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inspection Summary */}
            <div className="rounded-xl p-3 text-[10px] leading-relaxed" style={{
              background: 'var(--cursor-surface-300)',
              color: 'var(--cursor-border-55)',
              border: '1px solid var(--cursor-border-10)',
            }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3 w-3" style={{ color: '#3a3a3a' }} />
                <span className="font-semibold" style={{ color: 'var(--cursor-ink)' }}>智能巡检</span>
              </div>
              今日已自动完成 {metrics.todayInspections} 项质检，{metrics.redLineAlerts} 项红线预警待处理。系统建议优先处理上海南京路店温度超标工单。
            </div>
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{
            background: 'rgba(58,58,58,0.1)',
          }}>
            <Shield className="h-3 w-3" style={{ color: '#3a3a3a' }} />
          </div>
          <div>
            <div className="text-[10px] font-medium" style={{ color: 'var(--cursor-ink)' }}>智能质检工作台</div>
            <div className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }}>感知-决策-执行 全链路闭环</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Chat Interface ─── */
export default function ChatInterface({ role = 'consumer' }) {
  const { id } = useParams()
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentConversation, setCurrentConversation] = useState(null)
  const [workflowTrace, setWorkflowTrace] = useState(null)
  const messagesEndRef = useRef(null)
  const streamAbortRef = useRef(null)
  const isSendingRef = useRef(false) // concurrent-send guard
  const _episodicMemoryRef = useRef(null) // Agent 情景记忆持久引用

  // Load conversation if navigating to a specific one
  useEffect(() => {
    if (id) {
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === id)
      if (conv && conv.messages.length > 0) {
        setMessages(conv.messages)
        setCurrentConversation(conv)
      }
    } else {
      setMessages([])
      setCurrentConversation(null)
      setWorkflowTrace(null)
    }
  }, [id])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Brand opening greeting — 使用 strategy-kb.js 中真实开场白模板
  // 模板来源: OPENING_SCRIPTS (从 38,644 条真实客服对话提取, 标准开场白 count: 48032)
  // 格式: [主题]，浓厚甜润，[产品]为您服务，请问有什么可以为您效劳？
  useEffect(() => {
    if (!id && messages.length === 0) {
      const greetingId = 'm-greeting-' + Date.now()
      const greetingText = generateBrandGreeting()
      const brandGreeting = {
        id: greetingId,
        role: 'assistant',
        content: greetingText,
        timestamp: new Date().toISOString(),
        llmSource: 'brand_greeting',
      }
      setMessages([brandGreeting])
    }
  }, [id])

  // Streaming response with Agent Engine integration
  const simulateStream = useCallback(async (responseText, engineResult, llmSource = 'template') => {
    setIsStreaming(true)
    streamAbortRef.current = false

    const aiMessage = {
      id: 'm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      llmSource,
      decisionFrame: engineResult?.decision_frame ? {
        top_label: engineResult.decision_frame.top_label,
        top_label_confidence: engineResult.decision_frame.top_label_confidence,
        risk_level: engineResult.decision_frame.risk_level,
        route: engineResult.decision_frame.next_action,
        need_human_review: engineResult.decision_frame.need_human_review,
        solution_level: engineResult.solution?.level,
        emotion: engineResult.emotion?.is_urgent ? 'urgent' : engineResult.emotion?.emotion_level,
        missing_info: engineResult.classification?.missing_info,
      } : null,
      aiqc_v2: engineResult?.aiqc_v2 || null,
      orderResult: engineResult?.orderResult || null,
      agentFramework: engineResult?.agent_framework || null,
    }

    setMessages((prev) => [...prev, aiMessage])

    // Store workflow trace
    if (engineResult?.trace) {
      setWorkflowTrace(engineResult.trace)
    }

    const chars = responseText.split('')
    let accumulated = ''

    for (let i = 0; i < chars.length; i++) {
      if (streamAbortRef.current) break
      accumulated += chars[i]
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessage.id ? { ...m, content: accumulated } : m
        )
      )
      await new Promise((resolve) => setTimeout(resolve, 18 + Math.random() * 12))
    }

    // Add red-line audit after streaming complete
    if (engineResult?.redline_audit) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessage.id
            ? { ...m, redlineAudit: engineResult.redline_audit }
            : m
        )
      )
    }

    setIsStreaming(false)
  }, [])

  // ── 业务触发条件检测 ──
  // 根据用户输入文本检测各类触发条件，传递给 LLM 作为上下文
  const detectBusinessTriggers = useCallback((text) => {
    const triggers = []
    const lower = text.toLowerCase()

    // 1. 情绪升级检测 → 转人工
    const emotionPatterns = ['曝光', '投诉你们', '315', '消协', '工商', '律师', '法院', '起诉', '太离谱', '垃圾', '恶心', '举报', '差评', '维权', '要说法', '赔钱', '赔我']
    const isEmotional = emotionPatterns.some(p => lower.includes(p))
    if (isEmotional) {
      triggers.push({ type: 'emotion_escalation', action: 'transfer_human', reason: '检测到情绪激动关键词，建议转人工客服' })
    }

    // 2. 主动要求转人工
    const humanTransferPatterns = ['转人工', '人工客服', '真人', '找客服', '不要机器人', '找领导', '找经理']
    const wantsHuman = humanTransferPatterns.some(p => lower.includes(p))
    if (wantsHuman) {
      triggers.push({ type: 'human_transfer', action: 'transfer_human', reason: '用户主动要求转接人工客服' })
    }

    // 3. 食安类型分类 — 外源性异物
    const externalPatterns = ['头发', '塑料', '金属', '玻璃', '虫子', '苍蝇', '蟑螂', '纸片', '线头', '创可贴', '烟头']
    const isExternalForeign = externalPatterns.some(p => lower.includes(p))
    if (isExternalForeign) {
      triggers.push({ type: 'food_safety', subtype: 'external_foreign', action: 'compensate_and_report', reason: '外源性异物（头发/塑料/金属等非食品本身物质），需拍照留存、退款+优惠券补偿' })
    }

    // 4. 食安类型分类 — 内源性异物
    const internalPatterns = ['果核', '茶叶梗', '果肉块', '冰块碎', '珍珠没化', '椰果', '西米']
    const isInternalForeign = internalPatterns.some(p => lower.includes(p))
    if (isInternalForeign) {
      triggers.push({ type: 'food_safety', subtype: 'internal_foreign', action: 'remake_or_coupon', reason: '内源性异物（食品原料本身物质如未过滤的果核等），安排重做或优惠券补偿' })
    }

    // 5. 身体不适
    const bodyPatterns = ['拉肚子', '肚子疼', '恶心', '呕吐', '过敏', '发烧', '头晕', '食物中毒', '不舒服', '腹泻', '就医', '医院']
    const isBodyDiscomfort = bodyPatterns.some(p => lower.includes(p))
    if (isBodyDiscomfort) {
      triggers.push({ type: 'food_safety', subtype: 'body_discomfort', action: 'escalate_and_care', reason: '身体不适投诉，优先级最高，建议就医并保留凭证，升级至门店负责人处理' })
    }

    // 6. 赔偿/优惠券 → 提醒退款
    const compensationPatterns = ['赔偿', '补偿', '优惠券', '代金券', '退款', '退钱', '免单', '重做']
    const mentionsCompensation = compensationPatterns.some(p => lower.includes(p))
    if (mentionsCompensation) {
      triggers.push({ type: 'compensation', action: 'refund_reminder', reason: '涉及赔偿/优惠券，提醒：退款由门店核实后24小时内处理，建议同时提供重做方案' })
    }

    // 7. 订单号识别
    const orderMatch = text.match(/(?:订单号?|#)\s*(\d{10,20})/i)
    if (orderMatch) {
      triggers.push({ type: 'order_detected', orderId: orderMatch[1], action: 'fetch_order_detail', reason: `检测到订单号 ${orderMatch[1]}，需查询订单明细` })
    }

    // 8. 图片上传意图
    const imagePatterns = ['拍照', '图片', '照片', '上传', '发图', '附图', '有图']
    const hasImageIntent = imagePatterns.some(p => lower.includes(p))
    if (hasImageIntent) {
      triggers.push({ type: 'image_upload', action: 'enable_image_input', reason: '用户意图上传图片/照片，需引导食安图片上传流程' })
    }

    // 9. 非食安问题
    const nonSafetyPatterns = ['推荐', '新品', '菜单', '营业时间', '地址', '加盟', '活动', '会员', '积分', '优惠券怎么领']
    const isNonSafety = nonSafetyPatterns.some(p => lower.includes(p)) && !isExternalForeign && !isInternalForeign && !isBodyDiscomfort
    if (isNonSafety) {
      triggers.push({ type: 'non_safety', action: 'general_reply', reason: '非食安类咨询（产品推荐/门店信息等），走通用对话流程' })
    }

    // 10. 原料变质/发霉
    const spoilagePatterns = ['发霉', '变质', '过期', '馊了', '酸了', '异味', '颜色不对', '有毛']
    const isSpoilage = spoilagePatterns.some(p => lower.includes(p))
    if (isSpoilage) {
      triggers.push({ type: 'food_safety', subtype: 'spoilage', action: 'batch_check_and_escalate', reason: '原料变质/过期，紧急排查同批次产品，升级至品质部门' })
    }

    // 11. 情绪等级评估
    let emotionLevel = 'calm'
    if (triggers.some(t => t.type === 'emotion_escalation')) emotionLevel = 'angry'
    else if (triggers.some(t => t.type === 'human_transfer')) emotionLevel = 'frustrated'
    else if (isBodyDiscomfort) emotionLevel = 'distressed'

    return { triggers, emotionLevel, shouldEscalate: isEmotional || wantsHuman || isBodyDiscomfort }
  }, [])

  const handleSend = async (text) => {
    // Concurrent-send guard: prevent overlapping sends
    if (isSendingRef.current) return
    isSendingRef.current = true

    try {
    const userMessage = {
      id: 'm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Snapshot current messages for this send cycle
    const currentMessages = messages

    // ── Step 1: Agent Engine 轻量运行 — 仅提取感知上下文 (不做回复生成) ──
    let engineResult = null
    try {
      engineResult = processMessageWithAgent(text, {
        sessionId: currentConversation?.id || `sess-${Date.now()}`,
        turnIndex: currentMessages.filter(m => m.role === 'user').length,
        _episodicMemory: _episodicMemoryRef.current,
      })
      if (engineResult._episodicMemory) {
        _episodicMemoryRef.current = engineResult._episodicMemory
      }
    } catch (e) {
      console.warn('Agent engine error:', e)
    }

    // ── Step 1.5: 业务触发条件检测 ──
    const triggers = detectBusinessTriggers(text)

    // ── Step 2: LLM 优先 — 作为主回复路径 ──
    let finalReply = null
    let llmSource = 'template'
    let templateReply = null  // 延迟生成，仅作为兜底

    try {
      const llmResult = await generateLLMEnhancedReply({
        userText: text,
        session: {
          sessionId: currentConversation?.id || `sess-${Date.now()}`,
          turnIndex: currentMessages.filter(m => m.role === 'user').length,
        },
        perception: engineResult?.agent_framework?.perception ? {
          ...engineResult.agent_framework.perception,
          _raw_classification: engineResult?.classification || null,
          _triggers: triggers,  // 传递触发条件给 LLM prompt
        } : null,
        decision: engineResult?.agent_framework?.decision || null,
        conversationHistory: currentMessages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-6).map(m => ({
          role: m.role,
          content: m.content,
        })),
      })

      if (llmResult.reply) {
        finalReply = llmResult.reply
        llmSource = llmResult.source
        // 将 LLM 推理链附加到 agent_framework 供 trace 展示
        if (engineResult?.agent_framework) {
          if (llmResult.reasoning_content) {
            engineResult.agent_framework.llm_reasoning = llmResult.reasoning_content
          }
          engineResult.agent_framework.llm_model = llmResult.model
          engineResult.agent_framework.llm_usage = llmResult.usage
        }
      }
    } catch (e) {
      console.warn('LLM reply generation failed:', e)
    }

    // ── Step 3: LLM 未产出 → 降级到规则引擎 / 模板回复 ──
    if (!finalReply) {
      templateReply = engineResult?.reply || generateStreamingResponse(text)
      finalReply = templateReply
      llmSource = 'template'
    }

    // ── Step 4: 内容安全护栏 (仅对 LLM 生成内容检查) ──
    let safetyResult = null
    try {
      const llmConfig = getLLMConfig()
      if (llmConfig.contentSafetyEnabled && llmSource !== 'template') {
        safetyResult = await runFullSafetyCheck(finalReply, {
          apiKey: llmConfig.contentSafetyKey || '',
          context: { perception: engineResult?.agent_framework?.perception },
        })
        if (safetyResult.blocked) {
          console.warn('Content safety blocked reply, falling back to template:', safetyResult.recommendation)
          // 安全拦截时才降级到模板
          if (!templateReply) {
            templateReply = engineResult?.reply || generateStreamingResponse(text)
          }
          finalReply = templateReply
          llmSource = 'template_safety_fallback'
        }
      }
    } catch (e) {
      console.warn('Content safety check failed (non-blocking):', e)
    }

    // ── Step 5: 订单工作流 — 仅在检测到明确订单意图时执行 ──
    try {
      const orderResult = executeOrderWorkflow({
        userInput: text,
        conversation: currentConversation?.id || '',
        orderId: '',
      })
      if (orderResult && orderResult.scene !== '其他') {
        engineResult = { ...(engineResult || {}), orderResult }
      }
    } catch (e) {
      console.warn('Order workflow error:', e)
    }

    // 将安全检查结果附加到 agent_framework
    if (safetyResult && engineResult?.agent_framework) {
      engineResult.agent_framework.safety = safetyResult
    }

    setTimeout(() => simulateStream(finalReply, engineResult, llmSource), 600)

    } finally {
      isSendingRef.current = false
    }
  }

  const handleStop = () => {
    streamAbortRef.current = true
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex h-full" data-component="chat-interface">
      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Session header */}
        {currentConversation && (
          <SessionHeaderBar conversation={currentConversation} />
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
          {hasMessages ? (
            <div className="mx-auto max-w-[820px] px-4 py-6">
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === 'assistant'}
                  />
                ))}
              </div>

              {/* Workflow trace — hidden (internal detail, not shown to users) */}

              {/* Red-line audit — hidden (internal detail) */}

              {/* Agent trace — hidden (internal detail) */}

              <div ref={messagesEndRef} />
            </div>
          ) : (
            <WelcomeScreen onSend={handleSend} />
          )}
        </div>

        {/* Input bar */}
        <ChatInputBar
          onSend={handleSend}
          isStreaming={isStreaming}
          onStop={handleStop}
        />
      </div>

      {/* Consumer Workbench — 消费者端专属右侧面板 */}
      {role === 'consumer' && (
        <ConsumerWorkbench messages={messages} onSend={handleSend} />
      )}

      {/* Staff Workbench — 客服工作台专属右侧面板 */}
      {role === 'staff' && (
        <StaffWorkbench messages={messages} />
      )}

      {/* Floating Service Widget — 可拖拽智能客服悬浮窗 */}
      <FloatingServiceWidget onSend={handleSend} role={role} />
    </div>
  )
}
