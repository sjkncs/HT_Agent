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
  QUICK_PROMPTS,
  generateStreamingResponse,
} from '../../lib/mock-data.js'
import { generateBrandGreeting, BRAND } from '../../lib/brand-config.js'
import { processMessage, processMessageWithAgent, executeOrderWorkflow, generateLLMEnhancedReply } from '../../lib/agent-engine.js'
import { runFullSafetyCheck } from '../../lib/content-safety.js'
import { getLLMConfig, getModelDisplayName } from '../../lib/llm-client.js'
import TestRunnerPanel from '../test/TestRunnerPanel.jsx'
import OrderingPanel from '../order/OrderingPanel.jsx'
import { getWorkbenchConversations, getCategoryStats, getMetadata } from '../../lib/case-library.js'
import { detectOrderIntent, getToolDefinitionsForLLM } from '../../lib/mcp-prompt-integration.js'
import { getOrCreateMemory, processAndUpdateMemory } from '../../lib/conversation-memory.js'
import MarkdownRenderer from './MarkdownRenderer.jsx'
import { configureVision, isVisionEnabled, processImagesInMessages, analyzeImage } from '../../lib/vision-service.js'
import { configureSearch, isWebSearchAvailable } from '../../lib/web-search-service.js'
import { configureMemory, isMemoryAvailable, addMemory, searchMemory, formatSearchResult } from '../../lib/memos-client.js'
import { saveAndSync, buildConversationRecord, getConversation } from '../../lib/conversation-store.js'
import * as apiClient from '../../lib/api-client.js'

/* ─── Typing Indicator ─── */
function TypingDots() {
  return (
    <div className="typing-indicator py-1" data-qoder-id="qel-typing-indicator-c5497b09" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-typing-indicator-c5497b09&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;TypingDots&quot;,&quot;elementRole&quot;:&quot;typing-indicator&quot;,&quot;loc&quot;:{&quot;line&quot;:29,&quot;column&quot;:5}}">
      <div className="dot animate-typing-dot"  data-qoder-id="qel-dot-9545a3ba" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-dot-9545a3ba&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;TypingDots&quot;,&quot;elementRole&quot;:&quot;dot&quot;,&quot;loc&quot;:{&quot;line&quot;:30,&quot;column&quot;:7}}"/>
      <div className="dot animate-typing-dot-delayed"  data-qoder-id="qel-dot-9645a54d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-dot-9645a54d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;TypingDots&quot;,&quot;elementRole&quot;:&quot;dot&quot;,&quot;loc&quot;:{&quot;line&quot;:31,&quot;column&quot;:7}}"/>
      <div className="dot animate-typing-dot-delayed-2"  data-qoder-id="qel-dot-8f459a48" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-dot-8f459a48&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;TypingDots&quot;,&quot;elementRole&quot;:&quot;dot&quot;,&quot;loc&quot;:{&quot;line&quot;:32,&quot;column&quot;:7}}"/>
    </div>
  )
}

/* ─── Bayesian Bar — inline probability visualization ─── */
function BayesianBar({ prob, riskLevel, ...qoderProps }) {
  const pct = Math.round(prob * 100)
  const fillClass = riskLevel === 'high' ? 'bayesian-bar__fill--high'
    : riskLevel === 'medium' ? 'bayesian-bar__fill--medium'
    : 'bayesian-bar__fill--low'
  return (
    <div className={["bayesian-bar w-full", qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className={`bayesian-bar__fill ${fillClass}`} style={{ width: `${pct}%` }}  data-qoder-id="qel-div-15cbcb3e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-15cbcb3e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;BayesianBar&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:45,&quot;column&quot;:7}}"/>
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
    <div className="decision-card" data-component="decision-card" data-qoder-id="qel-decision-card-8a5c7bae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-decision-card-8a5c7bae&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;decision-card&quot;,&quot;loc&quot;:{&quot;line&quot;:70,&quot;column&quot;:5}}">
      <div
        className="decision-card__header cursor-pointer"
        onClick={() => setExpanded(!expanded)}
       data-qoder-id="qel-decision-card__header-f0491400" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-decision-card__header-f0491400&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;decision-card__header&quot;,&quot;loc&quot;:{&quot;line&quot;:71,&quot;column&quot;:7}}">
        <GitBranch className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-3-080d1694" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-080d1694&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:75,&quot;column&quot;:9}}"/>
        <span className="decision-card__label" data-qoder-id="qel-decision-card__label-be8b7aef" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-decision-card__label-be8b7aef&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;decision-card__label&quot;,&quot;loc&quot;:{&quot;line&quot;:76,&quot;column&quot;:9}}">
          {frame.top_label ? frame.top_label.split('/').pop() : '分析中'}
        </span>
        {frame.risk_level && (
          <span className={cn(
            'emotion-indicator',
            frame.risk_level === 'high' ? 'emotion-indicator--urgent' :
            frame.risk_level === 'medium' ? 'emotion-indicator--elevated' :
            'emotion-indicator--normal'
          )} data-qoder-id="qel-span-627b6a3b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-627b6a3b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:80,&quot;column&quot;:11}}">
            {riskLabels[frame.risk_level]}
          </span>
        )}
        <span className="decision-card__confidence" data-qoder-id="qel-decision-card__confidence-f259c2bf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-decision-card__confidence-f259c2bf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;decision-card__confidence&quot;,&quot;loc&quot;:{&quot;line&quot;:89,&quot;column&quot;:9}}">
          {Math.round((frame.top_label_confidence || 0) * 100)}%
        </span>
        {expanded ? (
          <ChevronDown className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-5b42e82c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5b42e82c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:93,&quot;column&quot;:11}}"/>
        ) : (
          <ChevronRight className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-a5f3de1f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-a5f3de1f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:95,&quot;column&quot;:11}}"/>
        )}
      </div>

      {expanded && (
        <div className="animate-fade-in" data-qoder-id="qel-animate-fade-in-1002c5da" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animate-fade-in-1002c5da&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;animate-fade-in&quot;,&quot;loc&quot;:{&quot;line&quot;:100,&quot;column&quot;:9}}">
          {/* Confidence bar */}
          <BayesianBar prob={frame.top_label_confidence || 0} riskLevel={frame.risk_level}  data-qoder-id="qel-bayesianbar-543cacce" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-bayesianbar-543cacce&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;bayesianbar&quot;,&quot;loc&quot;:{&quot;line&quot;:102,&quot;column&quot;:11}}"/>

          {/* Route */}
          {frame.route && (
            <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-2-88d5837a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-88d5837a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:106,&quot;column&quot;:13}}">
              <ArrowRight className="h-3 w-3"  data-qoder-id="qel-h-3-5b242745" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5b242745&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:107,&quot;column&quot;:15}}"/>
              <span data-qoder-id="qel-span-5a7b5da3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-5a7b5da3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:108,&quot;column&quot;:15}}">路由: {actionLabels[frame.route] || frame.route}</span>
            </div>
          )}

          {/* Solution level */}
          {frame.solution_level && (
            <div className="mt-1.5 flex items-center gap-1.5" data-qoder-id="qel-mt-1-5-2b70012d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-5-2b70012d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;mt-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:114,&quot;column&quot;:13}}">
              <span className={`comp-level comp-level--${frame.solution_level}`} data-qoder-id="qel-span-d282d650" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-d282d650&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:115,&quot;column&quot;:15}}">
                {frame.solution_level.replace('L', '')}
              </span>
              <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-152fc272" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-152fc272&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:118,&quot;column&quot;:15}}">
                补偿等级
              </span>
            </div>
          )}

          {/* Missing info */}
          {frame.missing_info && (
            <div className="mt-1.5 flex flex-wrap gap-1" data-qoder-id="qel-mt-1-5-286ffc74" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-5-286ffc74&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;mt-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:126,&quot;column&quot;:13}}">
              {frame.missing_info.order_missing && (
                <span className="human-review-tag" data-qoder-id="qel-human-review-tag-9909c650" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-human-review-tag-9909c650&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;human-review-tag&quot;,&quot;loc&quot;:{&quot;line&quot;:128,&quot;column&quot;:17}}">缺订单号</span>
              )}
              {frame.missing_info.image_missing && (
                <span className="human-review-tag" data-qoder-id="qel-human-review-tag-9a09c7e3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-human-review-tag-9a09c7e3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;human-review-tag&quot;,&quot;loc&quot;:{&quot;line&quot;:131,&quot;column&quot;:17}}">缺图片</span>
              )}
              {frame.missing_info.contact_missing && (
                <span className="human-review-tag" data-qoder-id="qel-human-review-tag-9b09c976" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-human-review-tag-9b09c976&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;human-review-tag&quot;,&quot;loc&quot;:{&quot;line&quot;:134,&quot;column&quot;:17}}">缺联系方式</span>
              )}
            </div>
          )}

          {/* Need human review */}
          {frame.need_human_review && (
            <div className="mt-1.5 flex items-center gap-1.5" data-qoder-id="qel-mt-1-5-246ff628" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-5-246ff628&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;mt-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:141,&quot;column&quot;:13}}">
              <Eye className="h-3 w-3" style={{ color: 'var(--cursor-gold)' }}  data-qoder-id="qel-h-3-069b8be0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-069b8be0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:142,&quot;column&quot;:15}}"/>
              <span className="text-xs font-medium" style={{ color: 'var(--cursor-gold)' }} data-qoder-id="qel-text-xs-1c2fcd77" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-1c2fcd77&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;DecisionCard&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:143,&quot;column&quot;:15}}">
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
    <div className="decision-card mt-2" data-component="aiqc-result-card" data-qoder-id="qel-aiqc-result-card-ae79f4cd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-aiqc-result-card-ae79f4cd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;aiqc-result-card&quot;,&quot;loc&quot;:{&quot;line&quot;:172,&quot;column&quot;:5}}">
      <div className="decision-card__header cursor-pointer" onClick={() => setExpanded(!expanded)} data-qoder-id="qel-decision-card__header-9e0112df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-decision-card__header-9e0112df&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;decision-card__header&quot;,&quot;loc&quot;:{&quot;line&quot;:173,&quot;column&quot;:7}}">
        <Shield className="h-3 w-3 flex-shrink-0" style={{ color: allPass ? 'var(--cursor-success)' : 'var(--cursor-error)' }}  data-qoder-id="qel-h-3-d5fd8644" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-d5fd8644&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:174,&quot;column&quot;:9}}"/>
        <span className="decision-card__label" data-qoder-id="qel-decision-card__label-e05b594b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-decision-card__label-e05b594b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;decision-card__label&quot;,&quot;loc&quot;:{&quot;line&quot;:175,&quot;column&quot;:9}}">质检分析结果</span>
        <span className={cn(
          'redline-badge ml-1',
          allPass ? 'redline-badge--pass' : 'redline-badge--fail'
        )} data-qoder-id="qel-span-75c0e5e9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-75c0e5e9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:176,&quot;column&quot;:9}}">
          {allPass ? '全项达标' : '存在不达标'}
        </span>
        <span className="ml-auto" data-qoder-id="qel-ml-auto-3b9f0a33" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-auto-3b9f0a33&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;ml-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:182,&quot;column&quot;:9}}">
          {expanded ? <ChevronDown className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-72766196" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-72766196&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:183,&quot;column&quot;:23}}"/> : <ChevronRight className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-b6b46f81" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-b6b46f81&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:183,&quot;column&quot;:106}}"/>}
        </span>
      </div>

      {expanded && (
        <div className="animate-fade-in mt-2 space-y-2" data-qoder-id="qel-animate-fade-in-bad980b8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animate-fade-in-bad980b8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;animate-fade-in&quot;,&quot;loc&quot;:{&quot;line&quot;:188,&quot;column&quot;:9}}">
          {/* 4 QC Dimensions */}
          <div className="text-xs font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-1538bef6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-1538bef6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:190,&quot;column&quot;:11}}">食安服务四维质检</div>
          <div className="grid grid-cols-2 gap-1.5" data-qoder-id="qel-grid-5c39ab81" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-5c39ab81&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:191,&quot;column&quot;:11}}">
            {dimensions.map((dim, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs rounded-md px-2 py-1" style={{
                background: dim.pass ? 'hsl(159 40% 94%)' : 'hsl(345 60% 96%)',
                color: dim.pass ? 'var(--cursor-success)' : 'var(--cursor-error)',
              }} data-qoder-id="qel-flex-b2f92e1b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b2f92e1b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:193,&quot;column&quot;:15}}">
                {dim.pass ? <CheckCircle2 className="h-3 w-3"  data-qoder-id="qel-h-3-5aa82522" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5aa82522&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:197,&quot;column&quot;:29}}"/> : <XCircle className="h-3 w-3"  data-qoder-id="qel-h-3-e19c46bf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-e19c46bf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:197,&quot;column&quot;:68}}"/>}
                {dim.name}：{dim.pass ? '达标' : '不达标'}
              </div>
            ))}
          </div>

          {/* Ticket Operation QC (工单操作专家) */}
          <div className="flex items-center gap-2 text-xs" data-qoder-id="qel-flex-b5f932d4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b5f932d4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:204,&quot;column&quot;:11}}">
            <span style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-span-04b97841" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-04b97841&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:205,&quot;column&quot;:13}}">工单操作：</span>
            <span className={cn(
              'quality-score',
              aiqc_v2.sqm1 === '达标' ? 'quality-score--high' : 'quality-score--low'
            )} data-qoder-id="qel-span-01b97388" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-01b97388&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:206,&quot;column&quot;:13}}">
              {aiqc_v2.sqm1 === '达标' ? <CheckCircle2 className="h-3 w-3"  data-qoder-id="qel-h-3-57a82069" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-57a82069&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:210,&quot;column&quot;:40}}"/> : <XCircle className="h-3 w-3"  data-qoder-id="qel-h-3-ea9c54ea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-ea9c54ea&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:210,&quot;column&quot;:79}}"/>}
              {aiqc_v2.sqm1}
            </span>
            {aiqc_v2.sqm2 && (
              <span className="text-xs" style={{ color: 'var(--cursor-error)' }} data-qoder-id="qel-text-xs-101b08a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-101b08a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:214,&quot;column&quot;:15}}">{aiqc_v2.sqm2}</span>
            )}
          </div>

          {/* Classification QC (对话分类质检专家) */}
          <div className="flex items-center gap-2 text-xs" data-qoder-id="qel-flex-b7fb7491" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b7fb7491&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:219,&quot;column&quot;:11}}">
            <span style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-span-6cbc5a90" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-6cbc5a90&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:220,&quot;column&quot;:13}}">食安分类：</span>
            <span className={cn(
              'quality-score',
              aiqc_v2.qc1 === '达标' ? 'quality-score--high' : 'quality-score--low'
            )} data-qoder-id="qel-span-6fbc5f49" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-6fbc5f49&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:221,&quot;column&quot;:13}}">
              {aiqc_v2.qc1 === '达标' ? <CheckCircle2 className="h-3 w-3"  data-qoder-id="qel-h-3-5baa654c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5baa654c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:225,&quot;column&quot;:39}}"/> : <XCircle className="h-3 w-3"  data-qoder-id="qel-h-3-ec9e96a7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-ec9e96a7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:225,&quot;column&quot;:78}}"/>}
              {aiqc_v2.qc1}
            </span>
            {aiqc_v2.qc2 && (
              <span className="text-xs" style={{ color: 'var(--cursor-error)' }} data-qoder-id="qel-text-xs-1018ca09" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-1018ca09&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:229,&quot;column&quot;:15}}">{aiqc_v2.qc2}</span>
            )}
          </div>

          {/* Red Line Detection */}
          <div className="flex items-center gap-2 text-xs" data-qoder-id="qel-flex-b9fb77b7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b9fb77b7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:234,&quot;column&quot;:11}}">
            <span style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-span-72bc6402" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-72bc6402&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:235,&quot;column&quot;:13}}">红线检测：</span>
            <span className={cn(
              'redline-badge',
              !aiqc_v2.is_violate ? 'redline-badge--pass' : 'redline-badge--fail'
            )} data-qoder-id="qel-span-75bc68bb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-75bc68bb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:236,&quot;column&quot;:13}}">
              {!aiqc_v2.is_violate ? <><CheckCircle2 className="h-3 w-3"  data-qoder-id="qel-h-3-65aa750a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-65aa750a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:240,&quot;column&quot;:40}}"/> 合规</> : <><XCircle className="h-3 w-3"  data-qoder-id="qel-h-3-5696eec0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5696eec0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:240,&quot;column&quot;:87}}"/> 违规</>}
            </span>
          </div>

          {/* Order Info (sq3) */}
          {aiqc_v2.sq3 && (
            <div className="text-xs rounded-md px-2 py-1.5" style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-91403def" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-91403def&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:246,&quot;column&quot;:13}}">
              <div className="font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-font-medium-8345da8a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-8345da8a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:247,&quot;column&quot;:15}}">订单信息</div>
              {aiqc_v2.sq3.split('；').map((item, i) => (
                <span key={i} className="inline-block mr-2" data-qoder-id="qel-inline-block-a3825772" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-inline-block-a3825772&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;inline-block&quot;,&quot;loc&quot;:{&quot;line&quot;:249,&quot;column&quot;:17}}">{item}</span>
              ))}
            </div>
          )}

          {/* Service improvement suggestions (sq2 from 对话解构+服务分析) */}
          {aiqc_v2.sq2 && (
            <div className="text-xs rounded-md px-2 py-1.5" style={{ background: 'hsl(33 80% 94%)', color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-8c403610" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-8c403610&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:256,&quot;column&quot;:13}}">
              <div className="font-medium mb-1" style={{ color: 'var(--cursor-gold)' }} data-qoder-id="qel-font-medium-7e45d2ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-7e45d2ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AIQCResultCard&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:257,&quot;column&quot;:15}}">食安服务改进建议</div>
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
    <div className="decision-card mt-2" data-component="order-processing-card" data-qoder-id="qel-order-processing-card-e94dd34e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-order-processing-card-e94dd34e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;order-processing-card&quot;,&quot;loc&quot;:{&quot;line&quot;:273,&quot;column&quot;:5}}">
      <div className="decision-card__header cursor-pointer" onClick={() => setExpanded(!expanded)} data-qoder-id="qel-decision-card__header-af6283f2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-decision-card__header-af6283f2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;decision-card__header&quot;,&quot;loc&quot;:{&quot;line&quot;:274,&quot;column&quot;:7}}">
        <Package className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--cursor-info)' }}  data-qoder-id="qel-h-3-f1573006" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-f1573006&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:275,&quot;column&quot;:9}}"/>
        <span className="decision-card__label" data-qoder-id="qel-decision-card__label-83471d26" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-decision-card__label-83471d26&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;decision-card__label&quot;,&quot;loc&quot;:{&quot;line&quot;:276,&quot;column&quot;:9}}">订单处理工作流</span>
        <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded font-mono" style={{
          background: 'var(--cursor-surface-300)', color: 'var(--cursor-orange)',
        }} data-qoder-id="qel-ml-1-94a036ae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-1-94a036ae&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;ml-1&quot;,&quot;loc&quot;:{&quot;line&quot;:277,&quot;column&quot;:9}}">
          {orderResult.scene}
        </span>
        <span className="ml-auto" data-qoder-id="qel-ml-auto-a87a29fd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-auto-a87a29fd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;ml-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:282,&quot;column&quot;:9}}">
          {expanded ? <ChevronDown className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-ad6644c0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-ad6644c0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:283,&quot;column&quot;:23}}"/> : <ChevronRight className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-8949ba73" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-8949ba73&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:283,&quot;column&quot;:106}}"/>}
        </span>
      </div>

      {expanded && (
        <div className="animate-fade-in mt-2 space-y-2" data-qoder-id="qel-animate-fade-in-a17f4bd2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animate-fade-in-a17f4bd2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;animate-fade-in&quot;,&quot;loc&quot;:{&quot;line&quot;:288,&quot;column&quot;:9}}">
          {/* Order info */}
          <div className="flex items-center gap-2 text-xs flex-wrap" data-qoder-id="qel-flex-d6b74c4a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-d6b74c4a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:290,&quot;column&quot;:11}}">
            <span className="px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-ink)' }} data-qoder-id="qel-px-1-5-1e924ded" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-1e924ded&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:291,&quot;column&quot;:13}}">
              {orderResult.order_id}
            </span>
            <span className="px-1.5 py-0.5 rounded" style={{
              background: orderResult.order_status === '已完成' ? 'hsl(159 40% 94%)' : 'hsl(33 80% 94%)',
              color: orderResult.order_status === '已完成' ? 'var(--cursor-success)' : 'var(--cursor-gold)',
            }} data-qoder-id="qel-px-1-5-1d924c5a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-1d924c5a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:294,&quot;column&quot;:13}}">
              {orderResult.order_status}
            </span>
            {orderResult.queue_number >= 0 && (
              <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-4402ec92" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-4402ec92&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:301,&quot;column&quot;:15}}">
                前方 {orderResult.queue_number} 单
              </span>
            )}
          </div>

          {/* Compensation info */}
          {orderResult.compensate && (
            <div className="flex items-center gap-1.5 text-xs rounded-md px-2 py-1" style={{
              background: 'hsl(33 80% 94%)', color: 'var(--cursor-gold)',
            }} data-qoder-id="qel-flex-cab73966" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-cab73966&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:309,&quot;column&quot;:13}}">
              <Zap className="h-3 w-3"  data-qoder-id="qel-h-3-ec42a2a9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-ec42a2a9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:312,&quot;column&quot;:15}}"/>
              补偿方案: {orderResult.compensate_amount}元代金券
            </div>
          )}

          {/* Ticket info */}
          {orderResult.ticket && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-flex-c2b07109" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c2b07109&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:319,&quot;column&quot;:13}}">
              <Ticket className="h-3 w-3"  data-qoder-id="qel-h-3-6b16201a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-6b16201a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:320,&quot;column&quot;:15}}"/>
              {orderResult.ticket}
            </div>
          )}

          {/* Workflow trace */}
          {orderResult.trace && (
            <div className="text-[10px] space-y-0.5" data-qoder-id="qel-text-10px-219644c9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-219644c9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:327,&quot;column&quot;:13}}">
              {orderResult.trace.filter(n => n.status !== 'skipped').map((node) => (
                <div key={node.node_id} className="flex items-center gap-1.5" data-qoder-id="qel-flex-c5b075c2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c5b075c2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:329,&quot;column&quot;:17}}">
                  <div className={`h-1.5 w-1.5 rounded-full ${node.status === 'completed' ? '' : 'opacity-40'}`}
                    style={{ background: node.status === 'completed' ? 'var(--cursor-success)' : 'var(--cursor-border-55)' }}  data-qoder-id="qel-div-31574817" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-31574817&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:330,&quot;column&quot;:19}}"/>
                  <span style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-span-f1887686" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-f1887686&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:332,&quot;column&quot;:19}}">{node.node_id}.</span>
                  <span style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-span-f2887819" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-f2887819&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:333,&quot;column&quot;:19}}">{node.node_name}</span>
                  {node.model && (
                    <span className="font-mono px-1 rounded" style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-border-55)' }} data-qoder-id="qel-font-mono-abfc64a9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-mono-abfc64a9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderProcessingCard&quot;,&quot;elementRole&quot;:&quot;font-mono&quot;,&quot;loc&quot;:{&quot;line&quot;:335,&quot;column&quot;:21}}">
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
    <div className="mt-2 max-w-lg" data-component="workflow-trace" data-qoder-id="qel-workflow-trace-c240c368" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-workflow-trace-c240c368&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowTracePanel&quot;,&quot;elementRole&quot;:&quot;workflow-trace&quot;,&quot;loc&quot;:{&quot;line&quot;:358,&quot;column&quot;:5}}">
      <button
        className="flex items-center gap-2 text-xs font-medium transition-colors"
        style={{ color: 'var(--cursor-orange)' }}
        onClick={() => setExpanded(!expanded)}
       data-qoder-id="qel-flex-98c17355" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-98c17355&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowTracePanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:359,&quot;column&quot;:7}}">
        <Zap className="h-3 w-3"  data-qoder-id="qel-h-3-31ea4b06" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-31ea4b06&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowTracePanel&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:364,&quot;column&quot;:9}}"/>
        AIQC_V2 工作流 ({completedCount}完成{skippedCount > 0 ? `, ${skippedCount}跳过` : ''})
        {expanded ? <ChevronDown className="h-3 w-3"  data-qoder-id="qel-h-3-8d9d4863" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-8d9d4863&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowTracePanel&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:366,&quot;column&quot;:21}}"/> : <ChevronRight className="h-3 w-3"  data-qoder-id="qel-h-3-949d35e2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-949d35e2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowTracePanel&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:366,&quot;column&quot;:59}}"/>}
      </button>

      {expanded && (
        <div className="workflow-trace mt-2 animate-fade-in" data-qoder-id="qel-workflow-trace-513dd2ee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-workflow-trace-513dd2ee&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowTracePanel&quot;,&quot;elementRole&quot;:&quot;workflow-trace&quot;,&quot;loc&quot;:{&quot;line&quot;:370,&quot;column&quot;:9}}">
          {trace.map((node) => (
            <div key={node.node_id} className="workflow-trace__node" data-qoder-id="qel-workflow-trace__node-f0f81a53" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-workflow-trace__node-f0f81a53&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowTracePanel&quot;,&quot;elementRole&quot;:&quot;workflow-trace__node&quot;,&quot;loc&quot;:{&quot;line&quot;:372,&quot;column&quot;:13}}">
              <div className={`workflow-trace__node-dot workflow-trace__node-dot--${node.status}`}  data-qoder-id="qel-div-73f9f282" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-73f9f282&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowTracePanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:373,&quot;column&quot;:15}}"/>
              <span className="workflow-trace__node-name" data-qoder-id="qel-workflow-trace__node-name-9c9d9d68" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-workflow-trace__node-name-9c9d9d68&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowTracePanel&quot;,&quot;elementRole&quot;:&quot;workflow-trace__node-name&quot;,&quot;loc&quot;:{&quot;line&quot;:374,&quot;column&quot;:15}}">
                {node.node_id}. {node.node_name}
              </span>
              {node.model && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{
                  background: 'var(--cursor-surface-300)',
                  color: 'var(--cursor-border-55)',
                }} data-qoder-id="qel-text-10px-aa647b3f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-aa647b3f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowTracePanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:378,&quot;column&quot;:17}}">
                  {node.model}
                </span>
              )}
              <span className="workflow-trace__node-status" style={{
                color: node.status === 'completed' ? 'var(--cursor-success)'
                  : node.status === 'skipped' ? 'var(--cursor-border-55)'
                  : 'var(--cursor-orange)'
              }} data-qoder-id="qel-workflow-trace__node-status-d15a68ed" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-workflow-trace__node-status-d15a68ed&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowTracePanel&quot;,&quot;elementRole&quot;:&quot;workflow-trace__node-status&quot;,&quot;loc&quot;:{&quot;line&quot;:385,&quot;column&quot;:15}}">
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
    <div className="mt-1.5 max-w-lg" data-qoder-id="qel-mt-1-5-794a68f9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-5-794a68f9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RedlineAuditBadge&quot;,&quot;elementRole&quot;:&quot;mt-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:406,&quot;column&quot;:5}}">
      <button
        className="flex items-center gap-1.5"
        onClick={() => setExpanded(!expanded)}
       data-qoder-id="qel-flex-d3a77f59" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-d3a77f59&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RedlineAuditBadge&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:407,&quot;column&quot;:7}}">
        {audit.pass ? (
          <span className="redline-badge redline-badge--pass" data-qoder-id="qel-redline-badge-ab9e0da4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-redline-badge-ab9e0da4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RedlineAuditBadge&quot;,&quot;elementRole&quot;:&quot;redline-badge&quot;,&quot;loc&quot;:{&quot;line&quot;:412,&quot;column&quot;:11}}">
            <CheckCircle2 className="h-3 w-3"  data-qoder-id="qel-h-3-25ba3eb2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-25ba3eb2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RedlineAuditBadge&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:413,&quot;column&quot;:13}}"/> 红线审核通过
          </span>
        ) : (
          <span className="redline-badge redline-badge--fail" data-qoder-id="qel-redline-badge-a99e0a7e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-redline-badge-a99e0a7e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RedlineAuditBadge&quot;,&quot;elementRole&quot;:&quot;redline-badge&quot;,&quot;loc&quot;:{&quot;line&quot;:416,&quot;column&quot;:11}}">
            <XCircle className="h-3 w-3"  data-qoder-id="qel-h-3-3beae7b2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-3beae7b2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RedlineAuditBadge&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:417,&quot;column&quot;:13}}"/> {audit.violation_count}项红线违规
          </span>
        )}
      </button>

      {expanded && !audit.pass && (
        <div className="mt-1.5 rounded-lg border p-2 text-xs animate-fade-in" style={{
          background: 'hsl(345 60% 96%)',
          borderColor: 'rgba(207, 45, 86, 0.2)',
          color: 'var(--cursor-ink)',
        }} data-qoder-id="qel-mt-1-5-7b4a6c1f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-5-7b4a6c1f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RedlineAuditBadge&quot;,&quot;elementRole&quot;:&quot;mt-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:423,&quot;column&quot;:9}}">
          {(audit.risk_items || []).map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 py-0.5" data-qoder-id="qel-flex-76fe1872" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-76fe1872&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RedlineAuditBadge&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:429,&quot;column&quot;:13}}">
              <AlertCircle className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--cursor-error)' }}  data-qoder-id="qel-h-3-d8bf53bb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-d8bf53bb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RedlineAuditBadge&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:430,&quot;column&quot;:15}}"/>
              <span data-qoder-id="qel-span-f8f23f4e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-f8f23f4e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RedlineAuditBadge&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:431,&quot;column&quot;:15}}">规则{item.rule}: {item.desc}</span>
              <span className="ml-auto font-mono" style={{ color: 'var(--cursor-error)' }} data-qoder-id="qel-ml-auto-2a8d8dc7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-auto-2a8d8dc7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RedlineAuditBadge&quot;,&quot;elementRole&quot;:&quot;ml-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:432,&quot;column&quot;:15}}">"{item.term}"</span>
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
    <div className="mt-3 max-w-[760px]" data-qoder-id="qel-mt-3-4493d774" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-3-4493d774&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;mt-3&quot;,&quot;loc&quot;:{&quot;line&quot;:488,&quot;column&quot;:5}}">
      {/* ─── Header: 一行摘要 ─── */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left"
        style={{
          borderColor: expanded ? 'var(--cursor-border-10)' : 'var(--cursor-border-10)',
          background: expanded ? 'var(--cursor-surface-300)' : 'var(--cursor-surface-300)',
        }}
        onClick={() => setExpanded(!expanded)}
       data-qoder-id="qel-w-full-3c90abaa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-3c90abaa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:490,&quot;column&quot;:7}}">
        {/* 思考图标 */}
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="flex-shrink-0" data-qoder-id="qel-flex-shrink-0-0d2fbab4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-0d2fbab4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:499,&quot;column&quot;:9}}">
          <path d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z" stroke="#f54e00" strokeWidth="1.5" fill="none"  data-qoder-id="qel-path-6059a1ff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-6059a1ff&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:500,&quot;column&quot;:11}}"/>
          <circle cx="7" cy="9" r="1.2" fill="#f54e00"  data-qoder-id="qel-circle-4e653846" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-4e653846&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:501,&quot;column&quot;:11}}"/>
          <circle cx="13" cy="9" r="1.2" fill="#f54e00"  data-qoder-id="qel-circle-4d6536b3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-4d6536b3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:502,&quot;column&quot;:11}}"/>
          <path d="M7 13c0.8 1.2 2 1.8 3 1.8s2.2-0.6 3-1.8" stroke="#f54e00" strokeWidth="1.2" fill="none" strokeLinecap="round"  data-qoder-id="qel-path-6159a392" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-6159a392&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:503,&quot;column&quot;:11}}"/>
        </svg>

        <span className="text-[12px] font-semibold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-12px-3d1d682a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-12px-3d1d682a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-12px&quot;,&quot;loc&quot;:{&quot;line&quot;:506,&quot;column&quot;:9}}">思考过程</span>

        {/* 摘要标签 */}
        <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end" data-qoder-id="qel-flex-2001cede" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-2001cede&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:509,&quot;column&quot;:9}}">
          {perception?.top_intent && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: '#2980b912', color: '#2980b9' }} data-qoder-id="qel-px-1-5-1be4b3c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-1be4b3c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:511,&quot;column&quot;:13}}">
              {perception.top_intent.intent}
            </span>
          )}
          {perception?.urgency_tier && perception.urgency_tier !== 'normal' && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{
              background: (urgencyColors[perception.urgency_tier] || '#999') + '15',
              color: urgencyColors[perception.urgency_tier] || '#999',
            }} data-qoder-id="qel-px-1-5-1ce4b559" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-1ce4b559&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:516,&quot;column&quot;:13}}">
              {perception.urgency_tier === 'critical' ? '紧急' : perception.urgency_tier === 'high' ? '较高' : perception.urgency_tier}
            </span>
          )}
          {llm_model && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: '#e67e2212', color: '#e67e22' }} data-qoder-id="qel-px-1-5-19e4b0a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-19e4b0a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:524,&quot;column&quot;:13}}">
              {getModelDisplayName(llm_model)}
            </span>
          )}
          {reward && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{
              background: (rewardTierColors[reward.reward_tier] || '#999') + '15',
              color: rewardTierColors[reward.reward_tier] || '#999',
            }} data-qoder-id="qel-px-1-5-1ae4b233" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-1ae4b233&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:529,&quot;column&quot;:13}}">
              {reward.reward_tier}
            </span>
          )}
          {safety && !safety.safe && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: '#e74c3c15', color: '#e74c3c' }} data-qoder-id="qel-px-1-5-1fe4ba12" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-1fe4ba12&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:537,&quot;column&quot;:13}}">
              安全拦截
            </span>
          )}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} data-qoder-id="qel-flex-shrink-0-fb31dcf5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-fb31dcf5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:541,&quot;column&quot;:11}}">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="var(--cursor-border-55)" strokeWidth="1.2" strokeLinecap="round"  data-qoder-id="qel-path-f05235ea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-f05235ea&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:542,&quot;column&quot;:13}}"/>
          </svg>
        </div>
      </button>

      {/* ─── 展开面板 ─── */}
      {expanded && (
        <div className="mt-1 rounded-lg border overflow-hidden" style={{
          background: 'var(--cursor-bg)',
          borderColor: 'var(--cursor-border-10)',
        }} data-qoder-id="qel-mt-1-60c7df5b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-60c7df5b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:549,&quot;column&quot;:9}}">
          {/* Tab 导航 */}
          <div className="flex border-b" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-flex-2704187a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-2704187a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:554,&quot;column&quot;:11}}">
            {[
              { id: 'reasoning', label: '推理过程', svg: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" data-qoder-id="qel-svg-cdbb69b5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-cdbb69b5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:556,&quot;column&quot;:54}}"><path d="M8 1a7 7 0 100 14A7 7 0 008 1z" stroke="currentColor" strokeWidth="1.3" data-qoder-id="qel-path-f0547481" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-f0547481&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:556,&quot;column&quot;:114}}"/><path d="M5.5 7.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5c0 1-0.6 1.8-1.4 2.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" data-qoder-id="qel-path-ef5472ee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-ef5472ee&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:556,&quot;column&quot;:196}}"/><circle cx="8" cy="11.5" r="0.7" fill="currentColor" data-qoder-id="qel-circle-6169d35d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-6169d35d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:556,&quot;column&quot;:336}}"/></svg> },
              { id: 'prediction', label: '下一步预测', svg: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" data-qoder-id="qel-svg-3bbe5576" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-3bbe5576&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:557,&quot;column&quot;:56}}"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" data-qoder-id="qel-circle-5b69c9eb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-5b69c9eb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:557,&quot;column&quot;:116}}"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" data-qoder-id="qel-circle-5a69c858" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-5a69c858&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:557,&quot;column&quot;:185}}"/><circle cx="8" cy="8" r="0.8" fill="currentColor" data-qoder-id="qel-circle-5d69cd11" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-5d69cd11&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:557,&quot;column&quot;:256}}"/><line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1" data-qoder-id="qel-line-3189abf2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-3189abf2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:557,&quot;column&quot;:307}}"/><line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1" data-qoder-id="qel-line-3489b0ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-3489b0ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:557,&quot;column&quot;:380}}"/></svg> },
              { id: 'context', label: '上下文', svg: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" data-qoder-id="qel-svg-41be5ee8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-41be5ee8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:558,&quot;column&quot;:51}}"><rect x="3" y="1.5" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" data-qoder-id="qel-rect-117dc9f4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-117dc9f4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:558,&quot;column&quot;:111}}"/><line x1="5.5" y1="4.5" x2="10.5" y2="4.5" stroke="currentColor" strokeWidth="1" opacity="0.7" data-qoder-id="qel-line-b38cb72f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-b38cb72f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:558,&quot;column&quot;:204}}"/><line x1="5.5" y1="7" x2="9.5" y2="7" stroke="currentColor" strokeWidth="1" opacity="0.5" data-qoder-id="qel-line-b48cb8c2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-b48cb8c2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:558,&quot;column&quot;:300}}"/><line x1="5.5" y1="9.5" x2="8.5" y2="9.5" stroke="currentColor" strokeWidth="1" opacity="0.3" data-qoder-id="qel-line-b58cba55" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-b58cba55&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:558,&quot;column&quot;:391}}"/></svg> },
              { id: 'quality', label: '质量评估', svg: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" data-qoder-id="qel-svg-3cc095a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-3cc095a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:559,&quot;column&quot;:52}}"><path d="M4 8.5l2.5 2.5L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-path-f361452d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-f361452d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:559,&quot;column&quot;:112}}"/><path d="M8 1a7 7 0 100 14A7 7 0 008 1z" stroke="currentColor" strokeWidth="1.3" data-qoder-id="qel-path-f0614074" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-f0614074&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:559,&quot;column&quot;:228}}"/></svg> },
            ].map(tab => (
              <button
                key={tab.id}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors relative"
                style={{
                  color: activeTab === tab.id ? 'var(--cursor-orange)' : 'var(--cursor-border-55)',
                  background: activeTab === tab.id ? 'var(--cursor-bg)' : 'transparent',
                }}
                onClick={() => setActiveTab(tab.id)}
               data-qoder-id="qel-flex-17cb6bae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-17cb6bae&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:561,&quot;column&quot;:15}}">
                <span style={{ display: 'flex', alignItems: 'center' }} data-qoder-id="qel-span-5dce871c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-5dce871c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:570,&quot;column&quot;:17}}">{tab.svg}</span>
                <span data-qoder-id="qel-span-5ece88af" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-5ece88af&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:571,&quot;column&quot;:17}}">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5" style={{ background: 'var(--cursor-orange)' }}  data-qoder-id="qel-absolute-8c52eb2b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-8c52eb2b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:573,&quot;column&quot;:19}}"/>
                )}
              </button>
            ))}
          </div>

          {/* Tab 内容 */}
          <div className="p-3 space-y-3" style={{ fontSize: '12px' }} data-qoder-id="qel-p-3-df866111" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-3-df866111&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;p-3&quot;,&quot;loc&quot;:{&quot;line&quot;:580,&quot;column&quot;:11}}">

            {/* ═══ 推理过程 Tab ═══ */}
            {activeTab === 'reasoning' && (
              <>
                {/* Phase Timeline */}
                <div className="space-y-1.5" data-qoder-id="qel-space-y-1-5-a8f2548c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-5-a8f2548c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;space-y-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:586,&quot;column&quot;:17}}">
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-2a1f651c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-2a1f651c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:587,&quot;column&quot;:19}}">
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
                      <div key={i} className="flex items-start gap-2.5" data-qoder-id="qel-flex-ad0ba731" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-ad0ba731&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:599,&quot;column&quot;:23}}">
                        <div className="flex flex-col items-center pt-1" data-qoder-id="qel-flex-ac0ba59e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-ac0ba59e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:600,&quot;column&quot;:25}}">
                          <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }}  data-qoder-id="qel-h-2-0f587d43" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-0f587d43&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:601,&quot;column&quot;:27}}"/>
                          {i < phases.length - 1 && <div className="w-px h-4" style={{ background: 'var(--cursor-border-10)' }}  data-qoder-id="qel-w-px-53d8e4e3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-px-53d8e4e3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;w-px&quot;,&quot;loc&quot;:{&quot;line&quot;:602,&quot;column&quot;:53}}"/>}
                        </div>
                        <div className="min-w-0 pb-0.5" data-qoder-id="qel-min-w-0-76460837" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-min-w-0-76460837&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;min-w-0&quot;,&quot;loc&quot;:{&quot;line&quot;:604,&quot;column&quot;:25}}">
                          <span className="font-medium text-[12px]" style={{ color }} data-qoder-id="qel-font-medium-dce22333" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-dce22333&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:605,&quot;column&quot;:27}}">{phase.title}</span>
                          <span className="ml-2 text-[11px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-ml-2-ac5c9a90" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-2-ac5c9a90&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;ml-2&quot;,&quot;loc&quot;:{&quot;line&quot;:606,&quot;column&quot;:27}}">{phase.summary}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* LLM Reasoning Chain */}
                {llm_reasoning && (
                  <div className="rounded-md border p-2.5" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-rounded-md-7fa1e793" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-md-7fa1e793&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;rounded-md&quot;,&quot;loc&quot;:{&quot;line&quot;:615,&quot;column&quot;:19}}">
                    <div className="flex items-center gap-2 mb-1.5" data-qoder-id="qel-flex-950dc000" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-950dc000&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:616,&quot;column&quot;:21}}">
                      <span className="text-[11px] font-semibold" style={{ color: '#e67e22' }} data-qoder-id="qel-text-11px-c629c509" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-c629c509&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:617,&quot;column&quot;:23}}">{getModelDisplayName(llm_model)} 思维链</span>
                      {llm_usage?.reasoning_tokens > 0 && (
                        <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-fd97f653" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-fd97f653&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:619,&quot;column&quot;:25}}">
                          {llm_usage.reasoning_tokens} tokens
                        </span>
                      )}
                    </div>
                    <div className="font-mono leading-relaxed max-h-32 overflow-y-auto text-[11px]" style={{
                      color: 'var(--cursor-ink)',
                      opacity: 0.8,
                      whiteSpace: 'pre-wrap',
                    }} data-qoder-id="qel-font-mono-ac5ef64d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-mono-ac5ef64d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;font-mono&quot;,&quot;loc&quot;:{&quot;line&quot;:624,&quot;column&quot;:21}}">{llm_reasoning.slice(0, 800)}{llm_reasoning.length > 800 ? '\n...' : ''}</div>
                  </div>
                )}

                {/* Agent CoT Trace */}
                {decision?.cot_trace && (
                  <div className="rounded-md border p-2.5" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-rounded-md-84a1ef72" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-md-84a1ef72&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;rounded-md&quot;,&quot;loc&quot;:{&quot;line&quot;:634,&quot;column&quot;:19}}">
                    <div className="text-[11px] font-semibold mb-1.5" style={{ color: '#2980b9' }} data-qoder-id="qel-text-11px-ccd5ecd0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-ccd5ecd0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:635,&quot;column&quot;:21}}">Agent 推理链</div>
                    <div className="font-mono leading-relaxed text-[11px]" style={{ color: 'var(--cursor-ink)', opacity: 0.75, whiteSpace: 'pre-wrap' }} data-qoder-id="qel-font-mono-9f5ee1d6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-mono-9f5ee1d6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;font-mono&quot;,&quot;loc&quot;:{&quot;line&quot;:636,&quot;column&quot;:21}}">
                      {decision.cot_trace}
                    </div>
                  </div>
                )}

                {/* ReAct Trace */}
                {react_trace && react_trace.total_steps > 0 && (
                  <div className="rounded-md border p-2.5" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-rounded-md-87a1f42b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-md-87a1f42b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;rounded-md&quot;,&quot;loc&quot;:{&quot;line&quot;:644,&quot;column&quot;:19}}">
                    <div className="text-[11px] font-semibold mb-1.5" style={{ color: '#16a085' }} data-qoder-id="qel-text-11px-4dd2e64c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-4dd2e64c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:645,&quot;column&quot;:21}}">
                      ReAct 追踪
                      <span className="ml-2 font-normal text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-ml-2-b15ee106" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-2-b15ee106&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;ml-2&quot;,&quot;loc&quot;:{&quot;line&quot;:647,&quot;column&quot;:23}}">
                        {react_trace.thought_count}推理 · {react_trace.action_count}行动 · {react_trace.observation_count}观察
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1" data-qoder-id="qel-flex-1f10d7d5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1f10d7d5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:651,&quot;column&quot;:21}}">
                      {react_trace.trace?.slice(0, 10).map((t, i) => {
                        const tc = { thought: '#2980b9', action: '#27ae60', observation: '#8e44ad', final_answer: '#f54e00' }
                        const tl = { thought: 'T', action: 'A', observation: 'O', final_answer: 'R' }
                        const tlFull = { thought: '推理', action: '行动', observation: '观察', final_answer: '结论' }
                        return (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[10px] inline-flex items-center gap-0.5" style={{
                            background: (tc[t.type] || '#999') + '10',
                            color: tc[t.type] || '#999',
                            border: `1px solid ${(tc[t.type] || '#999')}20`,
                          }} data-qoder-id="qel-px-1-5-aadd461e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-aadd461e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:657,&quot;column&quot;:27}}">
                            <span className="font-bold text-[9px]" data-qoder-id="qel-font-bold-276284fe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-bold-276284fe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;font-bold&quot;,&quot;loc&quot;:{&quot;line&quot;:662,&quot;column&quot;:29}}">{tl[t.type] || '?'}</span>
                            {t.type === 'final_answer' ? '结论' : `[${t.step}] ${tlFull[t.type] || t.type}`}
                          </span>
                        )
                      })}
                      {react_trace.trace?.length > 10 && (
                        <span className="px-1 text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-px-1-8f06fa4e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-8f06fa4e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-1&quot;,&quot;loc&quot;:{&quot;line&quot;:668,&quot;column&quot;:25}}">+{react_trace.trace.length - 10}</span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ═══ 下一步预测 Tab ═══ */}
            {activeTab === 'prediction' && (
              <>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-3723f6c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-3723f6c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:679,&quot;column&quot;:17}}">
                  预测与建议行动
                </div>
                <div className="space-y-2" data-qoder-id="qel-space-y-2-0592700e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-2-0592700e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;space-y-2&quot;,&quot;loc&quot;:{&quot;line&quot;:682,&quot;column&quot;:17}}">
                  {nextActions.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-md border p-2.5" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-flex-2510e147" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-2510e147&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:684,&quot;column&quot;:21}}">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white" style={{
                        background: item.priority === '紧急' ? '#e74c3c' : item.priority === '高' ? '#e67e22' : item.priority === '推荐' ? '#2980b9' : '#999',
                      }} data-qoder-id="qel-w-6-56274f21" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-6-56274f21&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;w-6&quot;,&quot;loc&quot;:{&quot;line&quot;:685,&quot;column&quot;:23}}">
                        {i + 1}
                      </div>
                      <div className="min-w-0" data-qoder-id="qel-min-w-0-004d9d3a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-min-w-0-004d9d3a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;min-w-0&quot;,&quot;loc&quot;:{&quot;line&quot;:690,&quot;column&quot;:23}}">
                        <div className="text-[12px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-12px-03a14c79" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-12px-03a14c79&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-12px&quot;,&quot;loc&quot;:{&quot;line&quot;:691,&quot;column&quot;:25}}">{item.action}</div>
                        {item.followUp && (
                          <div className="text-[11px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-59bd32e1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-59bd32e1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:693,&quot;column&quot;:27}}">
                            预测: {item.followUp}
                          </div>
                        )}
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px]" style={{
                          background: (item.priority === '紧急' ? '#e74c3c' : item.priority === '高' ? '#e67e22' : '#2980b9') + '12',
                          color: item.priority === '紧急' ? '#e74c3c' : item.priority === '高' ? '#e67e22' : '#2980b9',
                        }} data-qoder-id="qel-inline-block-901c7708" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-inline-block-901c7708&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;inline-block&quot;,&quot;loc&quot;:{&quot;line&quot;:697,&quot;column&quot;:25}}">{item.priority}</span>
                      </div>
                    </div>
                  ))}
                  {nextActions.length === 0 && (
                    <div className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-5bbd3607" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-5bbd3607&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:705,&quot;column&quot;:21}}">暂无预测数据</div>
                  )}
                </div>

                {/* 感知层详情 */}
                {perception && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-mt-3-b47d2e75" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-3-b47d2e75&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;mt-3&quot;,&quot;loc&quot;:{&quot;line&quot;:711,&quot;column&quot;:19}}">
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-24ff0992" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-24ff0992&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:712,&quot;column&quot;:21}}">
                      感知层分析
                    </div>
                    <div className="grid grid-cols-2 gap-2" data-qoder-id="qel-grid-67fda16e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-67fda16e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:715,&quot;column&quot;:21}}">
                      <MetricCard label="紧急度" value={perception.urgency_tier || 'normal'} color={urgencyColors[perception.urgency_tier] || '#999'}  data-qoder-id="qel-metriccard-f478c5d8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metriccard-f478c5d8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;metriccard&quot;,&quot;loc&quot;:{&quot;line&quot;:716,&quot;column&quot;:23}}"/>
                      <MetricCard label="情绪" value={`${perception.emotion_grade || 'calm'} (${Math.round((perception.emotion_intensity || 0) * 100)}%)`} color={emotionColors[perception.emotion_grade] || '#999'}  data-qoder-id="qel-metriccard-f578c76b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metriccard-f578c76b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;metriccard&quot;,&quot;loc&quot;:{&quot;line&quot;:717,&quot;column&quot;:23}}"/>
                      <MetricCard label="意图置信度" value={`${Math.round((perception.intent_confidence || 0) * 100)}%`} color="#2980b9"  data-qoder-id="qel-metriccard-727bcac9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metriccard-727bcac9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;metriccard&quot;,&quot;loc&quot;:{&quot;line&quot;:718,&quot;column&quot;:23}}"/>
                      <MetricCard label="风险分" value={perception.risk_score !== undefined ? Math.round(perception.risk_score * 100) + '%' : '-'} color={perception.risk_score > 0.7 ? '#e74c3c' : '#27ae60'}  data-qoder-id="qel-metriccard-717bc936" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metriccard-717bc936&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;metriccard&quot;,&quot;loc&quot;:{&quot;line&quot;:719,&quot;column&quot;:23}}"/>
                      <MetricCard label="信息充分度" value={`${Math.round((perception.info_sufficiency || 0) * 100)}%`} color={perception.info_sufficiency > 0.7 ? '#27ae60' : '#f39c12'}  data-qoder-id="qel-metriccard-707bc7a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metriccard-707bc7a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;metriccard&quot;,&quot;loc&quot;:{&quot;line&quot;:720,&quot;column&quot;:23}}"/>
                      <MetricCard label="是否歧义" value={perception.intent_ambiguous ? '是' : '否'} color={perception.intent_ambiguous ? '#f39c12' : '#27ae60'}  data-qoder-id="qel-metriccard-6f7bc610" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metriccard-6f7bc610&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;metriccard&quot;,&quot;loc&quot;:{&quot;line&quot;:721,&quot;column&quot;:23}}"/>
                    </div>
                  </div>
                )}

                {/* 决策层详情 */}
                {decision && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-mt-3-b17f6853" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-3-b17f6853&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;mt-3&quot;,&quot;loc&quot;:{&quot;line&quot;:728,&quot;column&quot;:19}}">
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-28014ce2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-28014ce2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:729,&quot;column&quot;:21}}">
                      决策层
                    </div>
                    <div className="flex flex-wrap gap-2" data-qoder-id="qel-flex-2b1567e7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-2b1567e7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:732,&quot;column&quot;:21}}">
                      <span className="px-2 py-1 rounded-md text-[11px]" style={{ background: '#8e44ad10', color: '#8e44ad', border: '1px solid #8e44ad20' }} data-qoder-id="qel-px-2-4f1e60c7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-2-4f1e60c7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-2&quot;,&quot;loc&quot;:{&quot;line&quot;:733,&quot;column&quot;:23}}">
                        策略: {decision.strategy_route}
                      </span>
                      <span className="px-2 py-1 rounded-md text-[11px]" style={{ background: '#2980b910', color: '#2980b9', border: '1px solid #2980b920' }} data-qoder-id="qel-px-2-441e4f76" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-2-441e4f76&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-2&quot;,&quot;loc&quot;:{&quot;line&quot;:736,&quot;column&quot;:23}}">
                        CoT {decision.cot_steps}步
                      </span>
                      {decision.debate && (
                        <span className="px-2 py-1 rounded-md text-[11px]" style={{
                          background: decision.debate.consensus ? '#27ae6010' : '#f39c1210',
                          color: decision.debate.consensus ? '#27ae60' : '#f39c12',
                          border: `1px solid ${decision.debate.consensus ? '#27ae6020' : '#f39c1220'}`,
                        }} data-qoder-id="qel-px-2-451e5109" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-2-451e5109&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-2&quot;,&quot;loc&quot;:{&quot;line&quot;:740,&quot;column&quot;:25}}">
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
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-ebc6bae9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-ebc6bae9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:757,&quot;column&quot;:17}}">
                  上下文召回与工作记忆
                </div>
                <div className="space-y-2" data-qoder-id="qel-space-y-2-ba353436" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-2-ba353436&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;space-y-2&quot;,&quot;loc&quot;:{&quot;line&quot;:760,&quot;column&quot;:17}}">
                  {contextItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-flex-6e02ad4b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-6e02ad4b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:762,&quot;column&quot;:21}}">
                      <div className="flex items-center gap-2" data-qoder-id="qel-flex-6d02abb8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-6d02abb8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:763,&quot;column&quot;:23}}">
                        <div className="w-1.5 h-1.5 rounded-full" style={{
                          background: item.type === 'session' ? '#2980b9' : item.type === 'memory' ? '#8e44ad' : item.type === 'cache' ? '#27ae60' : item.type === 'chain' ? '#e67e22' : '#f39c12',
                        }}  data-qoder-id="qel-w-1-5-655d0b17" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-1-5-655d0b17&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;w-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:764,&quot;column&quot;:25}}"/>
                        <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-eba0d894" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-eba0d894&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:767,&quot;column&quot;:25}}">{item.label}</span>
                      </div>
                      <span className="text-[12px] font-semibold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-12px-9bb6da8c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-12px-9bb6da8c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-12px&quot;,&quot;loc&quot;:{&quot;line&quot;:769,&quot;column&quot;:23}}">{item.value}</span>
                    </div>
                  ))}
                  {contextItems.length === 0 && (
                    <div className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-c9680927" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-c9680927&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:773,&quot;column&quot;:21}}">首条消息，暂无历史上下文</div>
                  )}
                </div>

                {/* Self-Polish 精炼结果 */}
                {self_polish && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-mt-3-48f96deb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-3-48f96deb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;mt-3&quot;,&quot;loc&quot;:{&quot;line&quot;:779,&quot;column&quot;:19}}">
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-f2c6c5ee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-f2c6c5ee&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:780,&quot;column&quot;:21}}">
                      输入精炼 (Self-Polish)
                    </div>
                    <div className="flex items-center gap-3 flex-wrap" data-qoder-id="qel-flex-6a006868" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-6a006868&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:783,&quot;column&quot;:21}}">
                      <span className="px-2 py-1 rounded-md text-[11px]" style={{ background: '#9b59b610', color: '#9b59b6', border: '1px solid #9b59b620' }} data-qoder-id="qel-px-2-a6e3b1f0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-2-a6e3b1f0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-2&quot;,&quot;loc&quot;:{&quot;line&quot;:784,&quot;column&quot;:23}}">
                        清晰度: {Math.round((self_polish.clarity_score || 0) * 100)}%
                      </span>
                      {(self_polish.refinements || []).length > 0 && (
                        <span className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-e09e88ac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-e09e88ac&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:788,&quot;column&quot;:25}}">
                          {(self_polish.refinements || []).length}项精炼已应用
                        </span>
                      )}
                      {self_polish.entities && Object.keys(self_polish.entities).some(k => self_polish.entities[k]) && (
                        <span className="px-2 py-1 rounded-md text-[11px]" style={{ background: '#2980b910', color: '#2980b9', border: '1px solid #2980b920' }} data-qoder-id="qel-px-2-a8e3b516" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-2-a8e3b516&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-2&quot;,&quot;loc&quot;:{&quot;line&quot;:793,&quot;column&quot;:25}}">
                          实体: {Object.entries(self_polish.entities).filter(([,v]) => v).map(([k]) => k).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 执行层 */}
                {action && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-mt-3-56f7455e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-3-56f7455e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;mt-3&quot;,&quot;loc&quot;:{&quot;line&quot;:803,&quot;column&quot;:19}}">
                    <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-eac47abf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-eac47abf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:804,&quot;column&quot;:21}}">
                      执行层
                    </div>
                    <div className="flex flex-wrap gap-2" data-qoder-id="qel-flex-700071da" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-700071da&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:807,&quot;column&quot;:21}}">
                      <span className="px-2 py-1 rounded-md text-[11px]" style={{
                        background: (outcomeColors[action.execution_outcome] || '#999') + '10',
                        color: outcomeColors[action.execution_outcome] || '#999',
                        border: `1px solid ${(outcomeColors[action.execution_outcome] || '#999')}20`,
                      }} data-qoder-id="qel-px-2-ace3bb62" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-2-ace3bb62&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-2&quot;,&quot;loc&quot;:{&quot;line&quot;:808,&quot;column&quot;:23}}">
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
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-edc47f78" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-edc47f78&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:824,&quot;column&quot;:17}}">
                  质量评估与安全审核
                </div>

                {/* 3H Alignment */}
                {action?.alignment && (
                  <div className="rounded-md border p-2.5" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-rounded-md-2717892d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-md-2717892d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;rounded-md&quot;,&quot;loc&quot;:{&quot;line&quot;:830,&quot;column&quot;:19}}">
                    <div className="flex items-center gap-2 mb-2" data-qoder-id="qel-flex-dc07d7a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-dc07d7a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:831,&quot;column&quot;:21}}">
                      <span className="text-[12px] font-semibold" style={{ color: '#3498db' }} data-qoder-id="qel-text-12px-aeb27b47" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-12px-aeb27b47&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-12px&quot;,&quot;loc&quot;:{&quot;line&quot;:832,&quot;column&quot;:23}}">3H 对齐检查</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px]" style={{
                        background: action.alignment.all_passed ? '#27ae6015' : '#e74c3c15',
                        color: action.alignment.all_passed ? '#27ae60' : '#e74c3c',
                      }} data-qoder-id="qel-px-1-5-7ae7eb8d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-7ae7eb8d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:833,&quot;column&quot;:23}}">{action.alignment.all_passed ? '全部通过' : `${action.alignment.violations?.length || 0}项违规`}</span>
                    </div>
                    <div className="flex gap-3" data-qoder-id="qel-flex-dd07d936" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-dd07d936&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:838,&quot;column&quot;:21}}">
                      {[
                        { label: 'Helpful', value: action.alignment.helpfulness, color: '#27ae60' },
                        { label: 'Honest', value: action.alignment.honesty, color: '#2980b9' },
                        { label: 'Harmless', value: action.alignment.harmlessness, color: '#8e44ad' },
                      ].map(dim => (
                        <div key={dim.label} className="flex-1" data-qoder-id="qel-flex-1-af482d65" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-af482d65&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:844,&quot;column&quot;:25}}">
                          <div className="text-[10px] mb-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-7acc1934" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-7acc1934&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:845,&quot;column&quot;:27}}">{dim.label}</div>
                          <div className="h-1.5 rounded-full" style={{ background: 'var(--cursor-border-10)' }} data-qoder-id="qel-h-1-5-153b4e0a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-1-5-153b4e0a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;h-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:846,&quot;column&quot;:27}}">
                            <div className="h-full rounded-full transition-all" style={{
                              width: `${Math.round((dim.value || 0) * 100)}%`,
                              background: dim.color,
                            }}  data-qoder-id="qel-h-full-f82d1f6b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-full-f82d1f6b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;h-full&quot;,&quot;loc&quot;:{&quot;line&quot;:847,&quot;column&quot;:29}}"/>
                          </div>
                          <div className="text-[10px] mt-0.5 text-right" style={{ color: dim.color }} data-qoder-id="qel-text-10px-6fcc07e3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-6fcc07e3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:852,&quot;column&quot;:27}}">
                            {Math.round((dim.value || 0) * 100)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 幻觉检测 */}
                {action?.hallucination && (
                  <div className="rounded-md border p-2.5" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-rounded-md-9f14747e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-md-9f14747e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;rounded-md&quot;,&quot;loc&quot;:{&quot;line&quot;:863,&quot;column&quot;:19}}">
                    <div className="flex items-center gap-2" data-qoder-id="qel-flex-7604f87a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-7604f87a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:864,&quot;column&quot;:21}}">
                      <span className="text-[12px] font-semibold" style={{ color: '#8e44ad' }} data-qoder-id="qel-text-12px-b2b4c02a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-12px-b2b4c02a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-12px&quot;,&quot;loc&quot;:{&quot;line&quot;:865,&quot;column&quot;:23}}">幻觉检测</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px]" style={{
                        background: action.hallucination.risk_level === 'high' ? '#e74c3c15' : action.hallucination.risk_level === 'medium' ? '#f39c1215' : '#27ae6015',
                        color: action.hallucination.risk_level === 'high' ? '#e74c3c' : action.hallucination.risk_level === 'medium' ? '#f39c12' : '#27ae60',
                      }} data-qoder-id="qel-px-1-5-70e59d38" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-70e59d38&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:866,&quot;column&quot;:23}}">{action.hallucination.risk_level} ({action.hallucination.risk_count}风险)</span>
                      {action.hallucination.reward_signals && (
                        <span className="text-[10px] ml-auto" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-33dd0c36" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-33dd0c36&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:871,&quot;column&quot;:25}}">
                          RL: 正确+{action.hallucination.reward_signals.correct || 0} / 保留+{action.hallucination.reward_signals.abstain || 0} / 错误{action.hallucination.reward_signals.incorrect || 0}
                        </span>
                      )}                    </div>
                  </div>
                )}

                {/* 内容安全 */}
                {safety && (
                  <div className="rounded-md border p-2.5" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-rounded-md-961227bc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-md-961227bc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;rounded-md&quot;,&quot;loc&quot;:{&quot;line&quot;:880,&quot;column&quot;:19}}">
                    <div className="flex items-center gap-2 flex-wrap" data-qoder-id="qel-flex-7304f3c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-7304f3c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:881,&quot;column&quot;:21}}">
                      <span className="text-[12px] font-semibold" style={{ color: safety.safe ? '#27ae60' : '#e74c3c' }} data-qoder-id="qel-text-12px-adb4b84b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-12px-adb4b84b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-12px&quot;,&quot;loc&quot;:{&quot;line&quot;:882,&quot;column&quot;:23}}">内容安全</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px]" style={{
                        background: safety.safe ? '#27ae6015' : '#e74c3c15',
                        color: safety.safe ? '#27ae60' : '#e74c3c',
                      }} data-qoder-id="qel-px-1-5-75e5a517" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-75e5a517&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:883,&quot;column&quot;:23}}">{safety.safe ? '通过' : '拦截'}</span>
                      {safety.local && (
                        <>
                          <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-3add173b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-3add173b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:889,&quot;column&quot;:27}}">
                            分数 {Math.round((safety.local.score || 0) * 100)}%
                          </span>
                          {(safety.local.violations || []).length > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: '#e74c3c12', color: '#e74c3c' }} data-qoder-id="qel-px-1-5-6be59559" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-6be59559&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:893,&quot;column&quot;:29}}">
                              {safety.local.violations.length}红线
                            </span>
                          )}
                          {(safety.local.warnings || []).length > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: '#f39c1212', color: '#f39c12' }} data-qoder-id="qel-px-1-5-74d8d791" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-74d8d791&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:898,&quot;column&quot;:29}}">
                              {safety.local.warnings.length}警告
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Reward + GAE */}
                <div className="flex flex-wrap gap-2" data-qoder-id="qel-flex-e70c6622" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-e70c6622&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:909,&quot;column&quot;:17}}">
                  {reward && (
                    <div className="rounded-md border px-3 py-2" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-rounded-md-9e237d75" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-md-9e237d75&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;rounded-md&quot;,&quot;loc&quot;:{&quot;line&quot;:911,&quot;column&quot;:21}}">
                      <div className="text-[10px] mb-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-80d09fd4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-80d09fd4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:912,&quot;column&quot;:23}}">奖励信号</div>
                      <div className="text-[13px] font-semibold" style={{ color: rewardTierColors[reward.reward_tier] || '#999' }} data-qoder-id="qel-text-13px-fe767cc8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-13px-fe767cc8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-13px&quot;,&quot;loc&quot;:{&quot;line&quot;:913,&quot;column&quot;:23}}">
                        {reward.total_reward}分
                        <span className="text-[10px] font-normal ml-1" data-qoder-id="qel-text-10px-35df4df3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-35df4df3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:915,&quot;column&quot;:25}}">({reward.reward_tier})</span>
                      </div>
                    </div>
                  )}
                  {gae?.best_step && (
                    <div className="rounded-md border px-3 py-2" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-rounded-md-9a237729" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-md-9a237729&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;rounded-md&quot;,&quot;loc&quot;:{&quot;line&quot;:920,&quot;column&quot;:21}}">
                      <div className="text-[10px] mb-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-7cd09988" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-7cd09988&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:921,&quot;column&quot;:23}}">GAE 信用分配</div>
                      <div className="text-[12px]" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-12px-a4282c2f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-12px-a4282c2f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-12px&quot;,&quot;loc&quot;:{&quot;line&quot;:922,&quot;column&quot;:23}}">
                        最优: <span className="font-medium" style={{ color: '#16a085' }} data-qoder-id="qel-font-medium-971e844b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-971e844b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:923,&quot;column&quot;:29}}">{gae.best_step.phase}</span>
                        {gae.worst_step && <> · 最弱: <span style={{ color: '#f39c12' }} data-qoder-id="qel-span-9ccf4dec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-9ccf4dec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:924,&quot;column&quot;:53}}">{gae.worst_step.phase}</span></>}
                      </div>
                    </div>
                  )}
                  {hacking_defense && hacking_defense.hacking_risk !== 'none' && (
                    <div className="rounded-md border px-3 py-2" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-rounded-md-972133d9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-md-972133d9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;rounded-md&quot;,&quot;loc&quot;:{&quot;line&quot;:929,&quot;column&quot;:21}}">
                      <div className="text-[10px] mb-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-7fce5faa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-7fce5faa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:930,&quot;column&quot;:23}}">Hacking 防御</div>
                      <div className="text-[12px] font-medium" style={{ color: hacking_defense.hacking_risk === 'high' ? '#e74c3c' : '#f39c12' }} data-qoder-id="qel-text-12px-252525ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-12px-252525ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;AgentClosedLoopTrace&quot;,&quot;elementRole&quot;:&quot;text-12px&quot;,&quot;loc&quot;:{&quot;line&quot;:931,&quot;column&quot;:23}}">
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
function MetricCard({ label, value, color, ...qoderProps }) {
  return (
    <div className={["rounded-md border px-2.5 py-1.5", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-bg)' }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-bd481089" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-bd481089&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:950,&quot;column&quot;:7}}">{label}</div>
      <div className="text-[12px] font-semibold" style={{ color: color || 'var(--cursor-ink)' }} data-qoder-id="qel-text-12px-8e5bbd7a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-12px-8e5bbd7a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;text-12px&quot;,&quot;loc&quot;:{&quot;line&quot;:951,&quot;column&quot;:7}}">{value}</div>
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
    )} data-qoder-id="qel-span-814de8e9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-814de8e9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;EmotionBadge&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:961,&quot;column&quot;:5}}">
      <AlertTriangle className="h-3 w-3"  data-qoder-id="qel-h-3-dac5a756" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-dac5a756&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;EmotionBadge&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:965,&quot;column&quot;:7}}"/>
      {labels[emotion.emotion_level] || '情绪异常'}
      {emotion.hit_keywords?.length > 0 && (
        <span className="opacity-70" data-qoder-id="qel-opacity-70-ae55312c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-opacity-70-ae55312c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;EmotionBadge&quot;,&quot;elementRole&quot;:&quot;opacity-70&quot;,&quot;loc&quot;:{&quot;line&quot;:968,&quot;column&quot;:9}}">({emotion.hit_keywords.slice(0, 2).join(', ')})</span>
      )}
    </span>
  )
}

/* ─── Session Timer ─── */
function SessionTimer({ seconds, ...qoderProps }) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const isWarning = seconds > 300
  const isCritical = seconds > 600
  return (
    <span className={[(cn(
      'session-timer',
      isCritical ? 'session-timer--critical' : isWarning ? 'session-timer--warning' : ''
    )), qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <Clock className="h-3 w-3"  data-qoder-id="qel-h-3-d5502977" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-d5502977&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SessionTimer&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:985,&quot;column&quot;:7}}"/>
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
    }} data-component="session-header" data-qoder-id="qel-session-header-b9063216" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-session-header-b9063216&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SessionHeaderBar&quot;,&quot;elementRole&quot;:&quot;session-header&quot;,&quot;loc&quot;:{&quot;line&quot;:1000,&quot;column&quot;:5}}">
      <span className={cn('session-badge', `session-badge--${conversation.session_state || 'active'}`)} data-qoder-id="qel-span-a27208b0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-a27208b0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SessionHeaderBar&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1004,&quot;column&quot;:7}}">
        {stateLabels[conversation.session_state] || '对话中'}
      </span>
      {conversation.handler && (
        <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-76962700" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-76962700&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SessionHeaderBar&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:1008,&quot;column&quot;:9}}">
          {conversation.handler === 'AI' ? '阿喜AI' : conversation.handler} 处理中
        </span>
      )}
      {conversation.classification && (
        <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-77962893" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-77962893&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SessionHeaderBar&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:1013,&quot;column&quot;:9}}">
          {conversation.classification.consult_type?.split('/').pop()}
        </span>
      )}
      <span className="ml-auto" data-qoder-id="qel-ml-auto-a9bf20ce" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-auto-a9bf20ce&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SessionHeaderBar&quot;,&quot;elementRole&quot;:&quot;ml-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:1017,&quot;column&quot;:7}}">
        <SessionTimer seconds={conversation.turn_count ? conversation.turn_count * 45 : 0}  data-qoder-id="qel-sessiontimer-abb90dda" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sessiontimer-abb90dda&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SessionHeaderBar&quot;,&quot;elementRole&quot;:&quot;sessiontimer&quot;,&quot;loc&quot;:{&quot;line&quot;:1018,&quot;column&quot;:9}}"/>
      </span>
      {conversation.classification?.need_human_review && (
        <span className="human-review-tag" data-qoder-id="qel-human-review-tag-4e9feb00" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-human-review-tag-4e9feb00&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SessionHeaderBar&quot;,&quot;elementRole&quot;:&quot;human-review-tag&quot;,&quot;loc&quot;:{&quot;line&quot;:1021,&quot;column&quot;:9}}">
          <Eye className="h-3 w-3"  data-qoder-id="qel-h-3-4c11355f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-4c11355f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SessionHeaderBar&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:1022,&quot;column&quot;:11}}"/> 人工复核
        </span>
      )}
    </div>
  )
}

/* ─── Ordering Quick Replies — Step-by-step Selection Card ─── */

// Step definitions for the ordering flow
const ORDER_STEPS = {
  sugar: {
    title: '糖度',
    type: '单选',
    question: '请选择糖度：',
    options: [
      { id: 'full_sugar', label: '全糖', desc: '标准甜度' },
      { id: 'seven_sugar', label: '七分糖', desc: '微甜，大多数人喜欢' },
      { id: 'five_sugar', label: '五分糖', desc: '适中甜度' },
      { id: 'three_sugar', label: '三分糖', desc: '清淡微甜' },
      { id: 'no_sugar', label: '无糖', desc: '不另外加糖' },
    ],
    recommended: 'seven_sugar',
    sendText: (v) => v === 'full_sugar' ? '全糖' : v === 'seven_sugar' ? '七分糖' : v === 'five_sugar' ? '五分糖' : v === 'three_sugar' ? '三分糖' : '无糖',
  },
  topping: {
    title: '加料',
    type: '多选',
    question: '选择加料（可多选）：',
    options: [
      { id: 'cheese', label: '芝士', desc: '+¥3' },
      { id: 'coconut', label: '椰果', desc: '+¥2' },
      { id: 'pearl', label: '珍珠', desc: '+¥2' },
      { id: 'taro_ball', label: '芋圆', desc: '+¥3' },
      { id: 'red_barley', label: '红薏', desc: '+¥2' },
      { id: 'aloe', label: '芦荟', desc: '+¥2' },
    ],
    recommended: null,
    sendText: (selectedIds) => {
      const map = { cheese: '芝士', coconut: '椰果', pearl: '珍珠', taro_ball: '芋圆', red_barley: '红薏', aloe: '芦荟' }
      const names = (Array.isArray(selectedIds) ? selectedIds : [selectedIds]).map(id => map[id] || id)
      return names.length > 0 ? `加料：${names.join('、')}` : '不加料'
    },
  },
  cup_size: {
    title: '杯型',
    type: '单选',
    question: '请选择杯型：',
    options: [
      { id: 'medium', label: '中杯', desc: '标准杯' },
      { id: 'large', label: '大杯', desc: '+¥3' },
    ],
    recommended: 'medium',
    sendText: (v) => v === 'medium' ? '中杯' : '大杯',
  },
  confirm_order: {
    title: '确认订单',
    type: '单选',
    question: '确认以上订单信息，是否提交？',
    options: [
      { id: 'confirm', label: '确认下单', desc: '提交订单并开始制作' },
      { id: 'cancel', label: '取消', desc: '取消本次订单' },
    ],
    sendText: (v) => v === 'confirm' ? '确认下单' : '取消订单',
  },
  payment: {
    title: '支付状态',
    type: '单选',
    question: '请确认支付结果：',
    options: [
      { id: 'paid', label: '已支付', desc: '支付成功完成' },
      { id: 'failed', label: '支付失败', desc: '遇到问题，需要重试' },
    ],
    sendText: (v) => v === 'paid' ? '已支付' : '支付失败',
  },
  pickup: {
    title: '取餐方式',
    type: '单选',
    question: '请选择您希望的取餐方式：',
    options: [
      { id: 'self_pickup', label: '到店自提', desc: '到店取餐，无需等待配送' },
      { id: 'delivery', label: '外卖配送', desc: '骑手配送至指定地址' },
    ],
    sendText: (v) => v === 'self_pickup' ? '到店自提' : '外卖配送',
  },
  store: {
    title: '门店选择',
    type: '单选',
    question: '',
    options: [],
    sendText: (v) => v,
  },
}

function detectStepType(text) {
  if (/糖度|甜度|几分糖|全糖|七分糖|五分糖|三分糖|无糖/.test(text) && /选择|请/.test(text)) return 'sugar'
  if (/加料| topping|可选|芝士|椰果|珍珠|芋圆|红薏|芦荟/.test(text) && /多选|选择|加料/.test(text)) return 'topping'
  if (/杯型|杯种|中杯|大杯/.test(text) && /选择|请/.test(text)) return 'cup_size'
  if (/确认.*订单|确认.*下单|是否.*确认|确认下单/.test(text)) return 'confirm_order'
  if (/支付完成|已支付|付款|扫码支付/.test(text) && !/告诉阿喜/.test(text.slice(-30))) return 'payment'
  if (/自提|配送|取餐方式|到店/.test(text) && /选择|请问|需要/.test(text)) return 'pickup'
  const hasStoreList = /(?:以下|推荐|附近|这些).*?(?:门店|店铺|店)/s.test(text)
  const hasNumberedItems = /^\s*\d+[.、)\s]\s*.{2,30}$/m.test(text)
  if (hasStoreList && hasNumberedItems) return 'store'
  return null
}

function parseStoreOptions(text) {
  const matches = text.match(/^\s*(\d+)[.、)\s]\s*(.{2,30})$/gm)
  if (!matches) return []
  return matches.slice(0, 6).map(m => {
    const parsed = m.match(/^\s*(\d+)[.、)\s]\s*(.{2,30})$/)
    return parsed ? { id: parsed[1], label: parsed[2].trim().slice(0, 20), desc: `回复 ${parsed[1]} 选择此门店` } : null
  }).filter(Boolean)
}

function SelectionCard({ stepConfig, dynamicOptions, onSend, totalSteps, currentStep, ...qoderProps }) {
  const isMulti = stepConfig.type === '多选'
  const [selected, setSelected] = useState(isMulti ? [] : null)
  const [collapsed, setCollapsed] = useState(false)

  const options = stepConfig.title === '门店选择' ? (dynamicOptions || []) : stepConfig.options
  const question = stepConfig.title === '门店选择'
    ? '请选择您想下单的门店：'
    : stepConfig.question

  function toggleSelect(optId) {
    if (isMulti) {
      setSelected(prev => prev.includes(optId) ? prev.filter(id => id !== optId) : [...prev, optId])
    } else {
      setSelected(optId)
    }
  }

  function handleContinue() {
    if (onSend) {
      if (isMulti) {
        const sendVal = stepConfig.sendText(selected)
        onSend(sendVal)
      } else if (selected) {
        const sendVal = stepConfig.sendText(selected)
        onSend(sendVal)
      }
    }
  }

  function handleRecommend() {
    if (stepConfig.recommended) {
      setSelected(isMulti ? [stepConfig.recommended] : stepConfig.recommended)
    } else if (options.length > 0) {
      setSelected(isMulti ? [options[0].id] : options[0].id)
    }
  }

  function handleSkip() {
    if (onSend) onSend(isMulti ? '不加料' : '跳过')
  }

  const hasSelection = isMulti ? selected.length > 0 : !!selected

  return (
    <div style={{
      marginTop: 10, borderRadius: 12,
      border: '1px solid var(--cursor-border-10, #e5e5e5)',
      background: 'var(--cursor-surface-100, #fafaf9)',
      overflow: 'hidden', maxWidth: 420,
    }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'var(--cursor-surface-300, #f5f5f4)',
        borderBottom: '1px solid var(--cursor-border-10, #e5e5e5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cursor-ink, #1a1a1a)' }}>
            {stepConfig.title}
          </span>
          <span style={{
            fontSize: 10, padding: '1px 7px', borderRadius: 4,
            background: isMulti ? '#10b981' : 'var(--cursor-orange, #f54e00)', color: '#fff', fontWeight: 600,
          }}>
            {stepConfig.type}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {totalSteps > 1 && (
            <span style={{ fontSize: 11, color: 'var(--cursor-border-55, #94a3b8)', fontWeight: 500 }}>
              {currentStep} / {totalSteps}
            </span>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            color: 'var(--cursor-border-55, #94a3b8)', fontSize: 11, fontWeight: 500,
          }}>
            {collapsed ? '展开' : '折叠'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Question */}
          <div style={{ padding: '10px 14px 4px', fontSize: 13, color: 'var(--cursor-ink, #1a1a1a)', fontWeight: 500 }}>
            {question}
          </div>

          {/* Options — pill grid for compact display */}
          <div style={{ padding: '6px 14px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {options.map((opt) => {
              const isSelected = isMulti ? selected.includes(opt.id) : selected === opt.id
              return (
                <div
                  key={opt.id}
                  onClick={() => toggleSelect(opt.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px',
                    borderRadius: 20,
                    border: isSelected ? '1.5px solid var(--cursor-orange, #f54e00)' : '1px solid var(--cursor-border-10, #e5e5e5)',
                    background: isSelected ? 'rgba(245, 78, 0, 0.06)' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontSize: 13, fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? 'var(--cursor-orange, #f54e00)' : 'var(--cursor-ink, #1a1a1a)',
                  }}
                >
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cursor-orange, #f54e00)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                  <span>{opt.label}</span>
                  {opt.desc && (
                    <span style={{ fontSize: 11, color: isSelected ? 'var(--cursor-orange, #f54e00)' : 'var(--cursor-border-55, #94a3b8)', fontWeight: 500 }}>
                      {opt.desc}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Bottom bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 14px',
            borderTop: '1px solid var(--cursor-border-10, #e5e5e5)',
            background: 'var(--cursor-surface-300, #f5f5f4)',
          }}>
            <button onClick={handleRecommend} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--cursor-orange, #f54e00)', fontSize: 12, fontWeight: 500, padding: '4px 0',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              推荐
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={handleSkip} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--cursor-border-55, #94a3b8)', fontSize: 12, fontWeight: 500, padding: '6px 12px',
              }}>
                跳过
              </button>
              <button
                onClick={handleContinue}
                disabled={!hasSelection}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '6px 16px', borderRadius: 6, border: 'none',
                  background: hasSelection ? 'var(--cursor-orange, #f54e00)' : 'var(--cursor-border-10, #e5e5e5)',
                  color: hasSelection ? '#fff' : 'var(--cursor-border-55, #94a3b8)',
                  fontSize: 12, fontWeight: 600,
                  cursor: hasSelection ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                }}
              >
                继续
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function OrderingQuickReplies({ text, onSend, isStreaming }) {
  if (isStreaming || !text || !onSend) return null

  const stepType = detectStepType(text)
  if (!stepType) return null

  const stepConfig = ORDER_STEPS[stepType]
  if (!stepConfig) return null

  // Parse dynamic options for store selection
  const dynamicOptions = stepType === 'store' ? parseStoreOptions(text) : null
  if (stepType === 'store' && (!dynamicOptions || dynamicOptions.length < 2)) return null

  // Calculate total steps
  const stepSequence = []
  if (/糖度|甜度|几分糖/.test(text) || stepType === 'sugar') stepSequence.push('sugar')
  if (/冰量|冰度/.test(text) || stepType === 'ice') stepSequence.push('ice')
  if (/确认.*订单/.test(text) || stepType === 'confirm_order') stepSequence.push('confirm_order')
  const totalSteps = Math.max(stepSequence.length, 1)
  const currentStep = stepSequence.indexOf(stepType) + 1 || 1

  return (
    <SelectionCard
      stepConfig={stepConfig}
      dynamicOptions={dynamicOptions}
      onSend={onSend}
      totalSteps={totalSteps}
      currentStep={currentStep}
     data-qoder-id="qel-selectioncard-0dce20fb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-selectioncard-0dce20fb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;OrderingQuickReplies&quot;,&quot;elementRole&quot;:&quot;selectioncard&quot;,&quot;loc&quot;:{&quot;line&quot;:1338,&quot;column&quot;:5}}"/>
  )
}

/* ─── Rich Card Renderer ─── */
function RichCardRenderer({ toolCalls }) {
  if (!toolCalls || !Array.isArray(toolCalls) || toolCalls.length === 0) return null

  const cards = []

  for (const tc of toolCalls) {
    try {
      // 商品搜索结果卡片
      if (tc.tool === 'searchProduct' && tc.result) {
        const products = []
        const lines = tc.result.split('\n')
        for (const line of lines) {
          const m = line.match(/(\d+)\.\s*(.+?)[\s—-]+[¥￥]?(\d+(?:\.\d+)?)/)
          if (m) products.push({ name: m[2].trim(), price: m[3] })
        }
        if (products.length > 0) {
          cards.push({ type: 'products', data: products.slice(0, 6) })
        }
      }

      // 订单创建卡片
      if (tc.tool === 'createOrder' && tc.result) {
        const orderIdMatch = tc.result.match(/订单号[：:]\s*(\S+)/)
        const priceMatch = tc.result.match(/[¥￥](\d+(?:\.\d+)?)/)
        const storeMatch = tc.result.match(/门店[：:]\s*(.+)/)
        cards.push({
          type: 'order',
          data: {
            orderId: orderIdMatch?.[1] || '',
            price: priceMatch?.[1] || '',
            store: storeMatch?.[1]?.trim() || '',
          },
        })
      }
    } catch { /* skip malformed */ }
  }

  if (cards.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }} data-qoder-id="qel-div-7d2fb72f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7d2fb72f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RichCardRenderer&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1160,&quot;column&quot;:5}}">
      {cards.map((card, i) => {
        if (card.type === 'products') {
          return (
            <div key={i} style={{
              border: '1px solid var(--cursor-border-10)',
              borderRadius: '10px',
              overflow: 'hidden',
              background: 'var(--cursor-surface-200)',
            }} data-qoder-id="qel-div-7c2fb59c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7c2fb59c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RichCardRenderer&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1164,&quot;column&quot;:13}}">
              <div style={{
                padding: '8px 12px',
                background: 'var(--cursor-surface-300)',
                borderBottom: '1px solid var(--cursor-border-10)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--cursor-ink)',
              }} data-qoder-id="qel-div-7b2fb409" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7b2fb409&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RichCardRenderer&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1170,&quot;column&quot;:15}}">推荐商品</div>
              {card.data.map((p, j) => (
                <div key={j} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderBottom: j < card.data.length - 1 ? '1px solid var(--cursor-border-10)' : 'none',
                  fontSize: '13px',
                }} data-qoder-id="qel-div-7a2fb276" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7a2fb276&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RichCardRenderer&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1179,&quot;column&quot;:17}}">
                  <span style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-span-7ce248ff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-7ce248ff&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RichCardRenderer&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1187,&quot;column&quot;:19}}">{p.name}</span>
                  <span style={{ color: 'var(--cursor-orange)', fontWeight: 600, fontSize: '13px' }} data-qoder-id="qel-span-7be2476c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-7be2476c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RichCardRenderer&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1188,&quot;column&quot;:19}}">¥{p.price}</span>
                </div>
              ))}
            </div>
          )
        }

        if (card.type === 'order') {
          return (
            <div key={i} style={{
              border: '1px solid var(--cursor-border-10)',
              borderRadius: '10px',
              overflow: 'hidden',
              background: 'var(--cursor-surface-200)',
            }} data-qoder-id="qel-div-872fc6ed" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-872fc6ed&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RichCardRenderer&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1197,&quot;column&quot;:13}}">
              <div style={{
                padding: '8px 12px',
                background: 'hsl(159 40% 94%)',
                borderBottom: '1px solid var(--cursor-border-10)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--cursor-success)',
              }} data-qoder-id="qel-div-862fc55a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-862fc55a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RichCardRenderer&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1203,&quot;column&quot;:15}}">订单已创建</div>
              <div style={{ padding: '10px 12px', fontSize: '13px', lineHeight: '1.8', color: 'var(--cursor-ink)' }} data-qoder-id="qel-div-7d13e0b2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7d13e0b2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RichCardRenderer&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1211,&quot;column&quot;:15}}">
                {card.data.store && <div data-qoder-id="qel-div-7e13e245" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7e13e245&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RichCardRenderer&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1212,&quot;column&quot;:37}}">门店：<strong data-qoder-id="qel-strong-94c2b4e2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strong-94c2b4e2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RichCardRenderer&quot;,&quot;elementRole&quot;:&quot;strong&quot;,&quot;loc&quot;:{&quot;line&quot;:1212,&quot;column&quot;:45}}">{card.data.store}</strong></div>}
                {card.data.orderId && <div data-qoder-id="qel-div-7c13df1f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7c13df1f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RichCardRenderer&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1213,&quot;column&quot;:39}}">订单号：{card.data.orderId}</div>}
                {card.data.price && <div data-qoder-id="qel-div-7913da66" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7913da66&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RichCardRenderer&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1214,&quot;column&quot;:37}}">需支付：<span style={{ color: 'var(--cursor-orange)', fontWeight: 600 }} data-qoder-id="qel-span-8e02b76d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-8e02b76d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;RichCardRenderer&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1214,&quot;column&quot;:46}}">¥{card.data.price}</span></div>}
              </div>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

/* ─── Sub-scenario label & color mapping ─── */
const SUB_SCENARIO_LABELS = {
  body_discomfort: '身体不适', spoilage: '变质/过期',
  foreign_object_external: '外源性异物', foreign_object_internal: '内源性异物',
  taste_issue: '口味异常', general_food_safety: '食安问题',
  service_complaint: '服务投诉', delivery_issue: '配送问题',
  product_quality: '产品品质', efficiency: '效率问题',
  packaging: '包装问题', hygiene: '卫生问题',
  recommendation: '产品推荐', place_order: '下单点单',
  store_info: '门店信息', browse_menu: '浏览菜单',
}
const SUB_SCENARIO_COLORS = {
  body_discomfort: '#cf2d56', spoilage: '#cf2d56',
  foreign_object_external: '#e05520', foreign_object_internal: '#e05520',
  taste_issue: '#c08532', general_food_safety: '#c08532',
  service_complaint: '#7c3aed', delivery_issue: '#2563eb',
  product_quality: '#c08532', efficiency: '#6b7280',
  packaging: '#6b7280', hygiene: '#059669',
  recommendation: '#1f8a65', place_order: '#1f8a65',
  store_info: '#1f8a65', browse_menu: '#1f8a65',
}

/* ─── Message Bubble ─── */
function MessageBubble({ message, isStreaming, onSend, ...qoderProps }) {
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
      <div className={["flex w-full justify-center animate-fade-in", qoderProps?.className].filter(Boolean).join(" ")} data-component="system-message" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
        <div className="system-message" data-qoder-id="qel-system-message-fa7a34e8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-system-message-fa7a34e8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;system-message&quot;,&quot;loc&quot;:{&quot;line&quot;:1045,&quot;column&quot;:9}}">
          {message.content}
        </div>
      </div>
    )
  }

  // MarkdownRenderer replaces the old renderContent for rich text rendering

  return (
    <div
      className={cn(
        'group flex w-full animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
      data-component="message-bubble"
     data-qoder-id="qel-message-bubble-a1bb5c90" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-message-bubble-a1bb5c90&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;message-bubble&quot;,&quot;loc&quot;:{&quot;line&quot;:1077,&quot;column&quot;:5}}">
      <div className={cn('max-w-[85%] flex flex-col', isUser ? 'items-end' : 'items-start')} data-qoder-id="qel-div-280c4532" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-280c4532&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1084,&quot;column&quot;:7}}">
        <div className={cn(isUser ? 'bubble-user' : 'bubble-ai', 'text-sm leading-relaxed')} data-qoder-id="qel-div-270c439f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-270c439f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1085,&quot;column&quot;:9}}">
          {isUser ? (
            <div style={{ whiteSpace: 'pre-wrap' }} data-qoder-id="qel-div-382ef0a4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-382ef0a4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1262,&quot;column&quot;:13}}">{message.content}</div>
          ) : isStreaming ? (
            <>
              <MarkdownRenderer content={message.content}  data-qoder-id="qel-markdownrenderer-019fda05" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-markdownrenderer-019fda05&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;markdownrenderer&quot;,&quot;loc&quot;:{&quot;line&quot;:1265,&quot;column&quot;:15}}"/>
              <span
                className="ml-0.5 inline-block h-4 w-0.5 animate-pulse-soft"
                style={{ background: 'var(--cursor-orange)' }}
               data-qoder-id="qel-ml-0-5-a2ba8dbe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-0-5-a2ba8dbe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;ml-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1089,&quot;column&quot;:15}}"/>
            </>
          ) : (
            <div data-qoder-id="qel-div-352eebeb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-352eebeb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1272,&quot;column&quot;:13}}">
              <MarkdownRenderer content={message.content}  data-qoder-id="qel-markdownrenderer-fa9fcf00" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-markdownrenderer-fa9fcf00&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;markdownrenderer&quot;,&quot;loc&quot;:{&quot;line&quot;:1273,&quot;column&quot;:15}}"/>
            </div>
          )}
        </div>

        {/* Emotion badge from decision frame */}
        {!isUser && message.decisionFrame?.emotion && (
          <div className="mt-1.5" data-qoder-id="qel-mt-1-5-813e3caa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-5-813e3caa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;mt-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1103,&quot;column&quot;:11}}">
            <EmotionBadge emotion={{ emotion_level: message.decisionFrame.emotion, is_urgent: message.decisionFrame.emotion === 'urgent' }}  data-qoder-id="qel-emotionbadge-4bee836a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-emotionbadge-4bee836a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;emotionbadge&quot;,&quot;loc&quot;:{&quot;line&quot;:1104,&quot;column&quot;:13}}"/>
          </div>
        )}

        {/* Sub-scenario badge from backend classification */}
        {!isUser && message.subScenario && SUB_SCENARIO_LABELS[message.subScenario] && (
          <div className="mt-1.5 flex items-center gap-1.5" data-qoder-id="qel-mt-1-5-f6255cf3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-5-f6255cf3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;mt-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1310,&quot;column&quot;:11}}">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium" style={{
              background: (SUB_SCENARIO_COLORS[message.subScenario] || '#6b7280') + '18',
              color: SUB_SCENARIO_COLORS[message.subScenario] || '#6b7280',
              border: `1px solid ${(SUB_SCENARIO_COLORS[message.subScenario] || '#6b7280')}30`,
            }} data-qoder-id="qel-inline-flex-6eae7673" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-inline-flex-6eae7673&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;inline-flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1311,&quot;column&quot;:13}}">
              {SUB_SCENARIO_LABELS[message.subScenario]}
            </span>
            {message.intent && (
              <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px]" style={{
                background: 'var(--cursor-surface-300)',
                color: 'var(--cursor-border-55)',
              }} data-qoder-id="qel-inline-flex-8d54dd2e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-inline-flex-8d54dd2e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;inline-flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1319,&quot;column&quot;:15}}">
                {message.intent === 'food_safety' ? '食安' : message.intent === 'ordering' ? '点单' : '通用'}
              </span>
            )}
          </div>
        )}

        {/* Decision Card from decision frame */}
        {!isUser && message.decisionFrame && (
          <DecisionCard frame={message.decisionFrame}  data-qoder-id="qel-decisioncard-cc8082ad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-decisioncard-cc8082ad&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;decisioncard&quot;,&quot;loc&quot;:{&quot;line&quot;:1110,&quot;column&quot;:11}}"/>
        )}

        {/* AIQC_V2 Result Card */}
        {!isUser && message.aiqc_v2 && (
          <AIQCResultCard aiqc_v2={message.aiqc_v2}  data-qoder-id="qel-aiqcresultcard-6d5f4792" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-aiqcresultcard-6d5f4792&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;aiqcresultcard&quot;,&quot;loc&quot;:{&quot;line&quot;:1115,&quot;column&quot;:11}}"/>
        )}

        {/* Order Processing Workflow Card */}
        {!isUser && message.orderResult && (
          <OrderProcessingCard orderResult={message.orderResult}  data-qoder-id="qel-orderprocessingcard-2396ac4f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-orderprocessingcard-2396ac4f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;orderprocessingcard&quot;,&quot;loc&quot;:{&quot;line&quot;:1120,&quot;column&quot;:11}}"/>
        )}

        {/* Rich Cards from tool call results */}
        {!isUser && message.toolCallsMade && (
          <RichCardRenderer toolCalls={message.toolCallsMade}  data-qoder-id="qel-richcardrenderer-09a2fbd4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-richcardrenderer-09a2fbd4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;richcardrenderer&quot;,&quot;loc&quot;:{&quot;line&quot;:1302,&quot;column&quot;:11}}"/>
        )}

        {/* Ordering Quick Reply Buttons */}
        {!isUser && (
          <OrderingQuickReplies text={message.content} onSend={onSend} isStreaming={isStreaming}  data-qoder-id="qel-orderingquickreplies-7992ac75" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-orderingquickreplies-7992ac75&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;orderingquickreplies&quot;,&quot;loc&quot;:{&quot;line&quot;:1307,&quot;column&quot;:11}}"/>
        )}

        {/* Actions */}
        {!isUser && !isStreaming && (
          <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100" data-qoder-id="qel-mt-1-5-f4231b36" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-5-f4231b36&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;mt-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1125,&quot;column&quot;:11}}">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} title="复制" data-qoder-id="qel-h-7-fed6e5f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-7-fed6e5f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;h-7&quot;,&quot;loc&quot;:{&quot;line&quot;:1126,&quot;column&quot;:13}}">
              <Copy className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-3b8b88eb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-3b8b88eb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1127,&quot;column&quot;:15}}"/>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="重新生成" disabled data-qoder-id="qel-h-7-fcd6e2cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-7-fcd6e2cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;h-7&quot;,&quot;loc&quot;:{&quot;line&quot;:1129,&quot;column&quot;:13}}">
              <RotateCcw className="h-3.5 w-3.5 opacity-40"  data-qoder-id="qel-h-3-5-136ad5ae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-136ad5ae&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1130,&quot;column&quot;:15}}"/>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="有帮助" disabled data-qoder-id="qel-h-7-02d6ec41" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-7-02d6ec41&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;h-7&quot;,&quot;loc&quot;:{&quot;line&quot;:1132,&quot;column&quot;:13}}">
              <ThumbsUp className="h-3.5 w-3.5 opacity-40"  data-qoder-id="qel-h-3-5-f3aa19cd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-f3aa19cd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1133,&quot;column&quot;:15}}"/>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="需改进" disabled data-qoder-id="qel-h-7-fed9248c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-7-fed9248c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;h-7&quot;,&quot;loc&quot;:{&quot;line&quot;:1135,&quot;column&quot;:13}}">
              <ThumbsDown className="h-3.5 w-3.5 opacity-40"  data-qoder-id="qel-h-3-5-573cf15e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-573cf15e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;MessageBubble&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1136,&quot;column&quot;:15}}"/>
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
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" data-qoder-id="qel-h-10-76a21644" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-10-76a21644&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgForeignObject&quot;,&quot;elementRole&quot;:&quot;h-10&quot;,&quot;loc&quot;:{&quot;line&quot;:1148,&quot;column&quot;:5}}">
      {/* Cup body */}
      <path d="M20 18h24l-3 32H23L20 18z" fill="#fef3ec" stroke="#f54e00" strokeWidth="1.5" strokeLinejoin="round" data-qoder-id="qel-path-7856a36b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-7856a36b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgForeignObject&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1150,&quot;column&quot;:7}}"/>
      {/* Cup lid */}
      <rect x="18" y="14" width="28" height="5" rx="2" fill="#f54e00" opacity="0.15" stroke="#f54e00" strokeWidth="1.2" data-qoder-id="qel-rect-4c9382ce" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-4c9382ce&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgForeignObject&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:1152,&quot;column&quot;:7}}"/>
      {/* Straw */}
      <line x1="36" y1="8" x2="34" y2="22" stroke="#f54e00" strokeWidth="1.5" strokeLinecap="round" data-qoder-id="qel-line-c55a221f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-c55a221f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgForeignObject&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1154,&quot;column&quot;:7}}"/>
      {/* Foreign objects inside */}
      <circle cx="29" cy="32" r="2" fill="#f54e00" opacity="0.6" data-qoder-id="qel-circle-43ca5130" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-43ca5130&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgForeignObject&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1156,&quot;column&quot;:7}}"/>
      <circle cx="34" cy="38" r="1.5" fill="#26251e" opacity="0.35" data-qoder-id="qel-circle-52ca68cd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-52ca68cd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgForeignObject&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1157,&quot;column&quot;:7}}"/>
      <path d="M26 40c1-1 3 0 4 1" stroke="#f54e00" strokeWidth="1" strokeLinecap="round" opacity="0.5" data-qoder-id="qel-path-73569b8c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-73569b8c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgForeignObject&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1158,&quot;column&quot;:7}}"/>
      {/* Magnifying glass */}
      <circle cx="44" cy="36" r="7" stroke="#26251e" strokeWidth="1.5" fill="white" fillOpacity="0.7" data-qoder-id="qel-circle-b34bd96f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-b34bd96f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgForeignObject&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1160,&quot;column&quot;:7}}"/>
      <line x1="49" y1="41" x2="54" y2="47" stroke="#26251e" strokeWidth="2.5" strokeLinecap="round" data-qoder-id="qel-line-ab037390" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-ab037390&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgForeignObject&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1161,&quot;column&quot;:7}}"/>
      {/* Particles in lens */}
      <circle cx="42" cy="34" r="1" fill="#f54e00" data-qoder-id="qel-circle-b54bdc95" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-b54bdc95&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgForeignObject&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1163,&quot;column&quot;:7}}"/>
      <circle cx="46" cy="37" r="0.8" fill="#26251e" opacity="0.5" data-qoder-id="qel-circle-b44bdb02" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-b44bdb02&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgForeignObject&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1164,&quot;column&quot;:7}}"/>
      <circle cx="43" cy="38" r="0.6" fill="#f54e00" opacity="0.4" data-qoder-id="qel-circle-af4bd323" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-af4bd323&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgForeignObject&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1165,&quot;column&quot;:7}}"/>
    </svg>
  )
}

function SvgBadTaste() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" data-qoder-id="qel-h-10-ded0f471" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-10-ded0f471&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBadTaste&quot;,&quot;elementRole&quot;:&quot;h-10&quot;,&quot;loc&quot;:{&quot;line&quot;:1172,&quot;column&quot;:5}}">
      {/* Cup */}
      <path d="M22 20h20l-2.5 28H24.5L22 20z" fill="#fef3ec" stroke="#e67e22" strokeWidth="1.5" strokeLinejoin="round" data-qoder-id="qel-path-ed9308e4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-ed9308e4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBadTaste&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1174,&quot;column&quot;:7}}"/>
      <rect x="20" y="16" width="24" height="5" rx="2" fill="#e67e22" opacity="0.15" stroke="#e67e22" strokeWidth="1.2" data-qoder-id="qel-rect-f435f675" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-f435f675&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBadTaste&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:1175,&quot;column&quot;:7}}"/>
      {/* Wavy smell lines rising */}
      <path d="M28 12c0-2 2-3 2-5" stroke="#e67e22" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" data-qoder-id="qel-path-e392f926" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-e392f926&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBadTaste&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1177,&quot;column&quot;:7}}"/>
      <path d="M32 11c0-2 2-3 2-5" stroke="#e67e22" strokeWidth="1.3" strokeLinecap="round" opacity="0.45" data-qoder-id="qel-path-e492fab9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-e492fab9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBadTaste&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1178,&quot;column&quot;:7}}"/>
      <path d="M36 12c0-2 2-3 2-5" stroke="#e67e22" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" data-qoder-id="qel-path-71961747" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-71961747&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBadTaste&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1179,&quot;column&quot;:7}}"/>
      {/* Warning triangle */}
      <path d="M44 28l8 14H36l8-14z" fill="#fff7ed" stroke="#e67e22" strokeWidth="1.5" strokeLinejoin="round" data-qoder-id="qel-path-709615b4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-709615b4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBadTaste&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1181,&quot;column&quot;:7}}"/>
      <line x1="44" y1="33" x2="44" y2="37" stroke="#e67e22" strokeWidth="1.8" strokeLinecap="round" data-qoder-id="qel-line-a68f8f63" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-a68f8f63&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBadTaste&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1182,&quot;column&quot;:7}}"/>
      <circle cx="44" cy="39.5" r="1" fill="#e67e22" data-qoder-id="qel-circle-d706a944" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-d706a944&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBadTaste&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1183,&quot;column&quot;:7}}"/>
      {/* X mark on cup */}
      <line x1="29" y1="30" x2="35" y2="36" stroke="#e67e22" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" data-qoder-id="qel-line-ac8f98d5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-ac8f98d5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBadTaste&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1185,&quot;column&quot;:7}}"/>
      <line x1="35" y1="30" x2="29" y2="36" stroke="#e67e22" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" data-qoder-id="qel-line-ab8f9742" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-ab8f9742&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBadTaste&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1186,&quot;column&quot;:7}}"/>
    </svg>
  )
}

function SvgBodyDiscomfort() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" data-qoder-id="qel-h-10-f0ed6783" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-10-f0ed6783&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBodyDiscomfort&quot;,&quot;elementRole&quot;:&quot;h-10&quot;,&quot;loc&quot;:{&quot;line&quot;:1193,&quot;column&quot;:5}}">
      {/* Person silhouette */}
      <circle cx="28" cy="14" r="6" fill="#fef3ec" stroke="#d35400" strokeWidth="1.5" data-qoder-id="qel-circle-05f9823e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-05f9823e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBodyDiscomfort&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1195,&quot;column&quot;:7}}"/>
      <path d="M28 20c-8 0-12 6-12 14v4h24v-4c0-8-4-14-12-14z" fill="#fef3ec" stroke="#d35400" strokeWidth="1.5" strokeLinejoin="round" data-qoder-id="qel-path-b1cac7c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-b1cac7c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBodyDiscomfort&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1196,&quot;column&quot;:7}}"/>
      {/* Pain indicator — stomach area */}
      <circle cx="28" cy="30" r="4" fill="#f54e00" opacity="0.15" stroke="#f54e00" strokeWidth="1" data-qoder-id="qel-circle-fff978cc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-fff978cc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBodyDiscomfort&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1198,&quot;column&quot;:7}}"/>
      <path d="M26 29l1.5 1.5L30 28" stroke="#f54e00" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" data-qoder-id="qel-path-afcd0332" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-afcd0332&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBodyDiscomfort&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1199,&quot;column&quot;:7}}"/>
      {/* Heartbeat line */}
      <path d="M40 24h4l2-5 3 10 2-5h5" stroke="#d35400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-path-b0cd04c5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-b0cd04c5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBodyDiscomfort&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1201,&quot;column&quot;:7}}"/>
      {/* Medical cross */}
      <rect x="44" y="34" width="12" height="12" rx="3" fill="#fef3ec" stroke="#d35400" strokeWidth="1.2" data-qoder-id="qel-rect-a16154f6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a16154f6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBodyDiscomfort&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:1203,&quot;column&quot;:7}}"/>
      <line x1="50" y1="37" x2="50" y2="43" stroke="#d35400" strokeWidth="1.5" strokeLinecap="round" data-qoder-id="qel-line-65fb91b1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-65fb91b1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBodyDiscomfort&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1204,&quot;column&quot;:7}}"/>
      <line x1="47" y1="40" x2="53" y2="40" stroke="#d35400" strokeWidth="1.5" strokeLinecap="round" data-qoder-id="qel-line-66fb9344" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-66fb9344&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBodyDiscomfort&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1205,&quot;column&quot;:7}}"/>
      {/* Small sweat drop */}
      <path d="M35 12c0.5 1 1.5 2 1.5 3a1.5 1.5 0 01-3 0c0-1 1-2 1.5-3z" fill="#2980b9" opacity="0.5" data-qoder-id="qel-path-acccfe79" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-acccfe79&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgBodyDiscomfort&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1207,&quot;column&quot;:7}}"/>
    </svg>
  )
}

function SvgPackageIssue() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" data-qoder-id="qel-h-10-c0993c4d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-10-c0993c4d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgPackageIssue&quot;,&quot;elementRole&quot;:&quot;h-10&quot;,&quot;loc&quot;:{&quot;line&quot;:1214,&quot;column&quot;:5}}">
      {/* Box — 3D isometric */}
      <path d="M32 12L50 22v20L32 52 14 42V22L32 12z" fill="#fef3ec" stroke="#c0392b" strokeWidth="1.5" strokeLinejoin="round" data-qoder-id="qel-path-3bd0e12c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-3bd0e12c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgPackageIssue&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1216,&quot;column&quot;:7}}"/>
      <path d="M32 12L50 22 32 32 14 22 32 12z" fill="#c0392b" opacity="0.08" data-qoder-id="qel-path-42d0ec31" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-42d0ec31&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgPackageIssue&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1217,&quot;column&quot;:7}}"/>
      <line x1="32" y1="32" x2="32" y2="52" stroke="#c0392b" strokeWidth="1.2" data-qoder-id="qel-line-8deb7fa4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-8deb7fa4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgPackageIssue&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1218,&quot;column&quot;:7}}"/>
      {/* Tape on top */}
      <path d="M28 17l4-2.5 4 2.5" stroke="#c0392b" strokeWidth="1" strokeLinecap="round" opacity="0.5" data-qoder-id="qel-path-34ce9790" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-34ce9790&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgPackageIssue&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1220,&quot;column&quot;:7}}"/>
      {/* Crack / damage mark */}
      <path d="M38 34l3 2-1 4-4 1" stroke="#c0392b" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" data-qoder-id="qel-path-35ce9923" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-35ce9923&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgPackageIssue&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1222,&quot;column&quot;:7}}"/>
      <line x1="37" y1="37" x2="40" y2="35" stroke="#c0392b" strokeWidth="1" strokeLinecap="round" opacity="0.4" data-qoder-id="qel-line-7ee92970" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-7ee92970&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgPackageIssue&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1223,&quot;column&quot;:7}}"/>
      {/* Warning badge */}
      <circle cx="48" cy="14" r="7" fill="#fff7ed" stroke="#c0392b" strokeWidth="1.2" data-qoder-id="qel-circle-e1937517" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-e1937517&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgPackageIssue&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1225,&quot;column&quot;:7}}"/>
      <line x1="48" y1="10" x2="48" y2="14.5" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="round" data-qoder-id="qel-line-84e932e2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-84e932e2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgPackageIssue&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1226,&quot;column&quot;:7}}"/>
      <circle cx="48" cy="17" r="0.9" fill="#c0392b" data-qoder-id="qel-circle-df9371f1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-df9371f1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgPackageIssue&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1227,&quot;column&quot;:7}}"/>
      {/* Barcode lines */}
      <g opacity="0.3" data-qoder-id="qel-g-af70ef30" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-g-af70ef30&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgPackageIssue&quot;,&quot;elementRole&quot;:&quot;g&quot;,&quot;loc&quot;:{&quot;line&quot;:1229,&quot;column&quot;:7}}">
        <line x1="20" y1="36" x2="20" y2="42" stroke="#26251e" strokeWidth="0.8" data-qoder-id="qel-line-83e9314f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-83e9314f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgPackageIssue&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1230,&quot;column&quot;:9}}"/>
        <line x1="22" y1="36" x2="22" y2="42" stroke="#26251e" strokeWidth="1.2" data-qoder-id="qel-line-88e9392e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-88e9392e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgPackageIssue&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1231,&quot;column&quot;:9}}"/>
        <line x1="24.5" y1="36" x2="24.5" y2="42" stroke="#26251e" strokeWidth="0.6" data-qoder-id="qel-line-89e93ac1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-89e93ac1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgPackageIssue&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1232,&quot;column&quot;:9}}"/>
        <line x1="26" y1="36" x2="26" y2="42" stroke="#26251e" strokeWidth="1" data-qoder-id="qel-line-02dd2d49" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-02dd2d49&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgPackageIssue&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1233,&quot;column&quot;:9}}"/>
        <line x1="28" y1="36" x2="28" y2="42" stroke="#26251e" strokeWidth="0.8" data-qoder-id="qel-line-01dd2bb6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-01dd2bb6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgPackageIssue&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1234,&quot;column&quot;:9}}"/>
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
    <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" data-qoder-id="qel-h-5-68b6cb00" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-5-68b6cb00&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipInspection&quot;,&quot;elementRole&quot;:&quot;h-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1251,&quot;column&quot;:5}}">
      {/* Shield with checkmark — food safety inspection */}
      <path d="M14 3L5 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L14 3z" fill="#f54e00" fillOpacity="0.1" stroke="#f54e00" strokeWidth="1.2" strokeLinejoin="round" data-qoder-id="qel-path-85147571" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-85147571&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipInspection&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1253,&quot;column&quot;:7}}"/>
      <path d="M10.5 14l2.5 2.5L18 11" stroke="#f54e00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-path-86147704" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-86147704&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipInspection&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1254,&quot;column&quot;:7}}"/>
      {/* Small scan dots */}
      <circle cx="7" cy="20" r="0.8" fill="#f54e00" opacity="0.4" data-qoder-id="qel-circle-7ee7adbd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-7ee7adbd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipInspection&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1256,&quot;column&quot;:7}}"/>
      <circle cx="21" cy="20" r="0.8" fill="#f54e00" opacity="0.4" data-qoder-id="qel-circle-7be7a904" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-7be7a904&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipInspection&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1257,&quot;column&quot;:7}}"/>
    </svg>
  )
}

function SvgChipOrder() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" data-qoder-id="qel-h-5-9eba3513" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-5-9eba3513&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipOrder&quot;,&quot;elementRole&quot;:&quot;h-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1264,&quot;column&quot;:5}}">
      {/* Document */}
      <rect x="5" y="3" width="14" height="19" rx="2" fill="#2980b9" fillOpacity="0.08" stroke="#2980b9" strokeWidth="1.1" data-qoder-id="qel-rect-d554df8e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-d554df8e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipOrder&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:1266,&quot;column&quot;:7}}"/>
      <line x1="8" y1="8" x2="16" y2="8" stroke="#2980b9" strokeWidth="0.8" opacity="0.5" data-qoder-id="qel-line-13b38e59" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-13b38e59&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipOrder&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1267,&quot;column&quot;:7}}"/>
      <line x1="8" y1="11" x2="14" y2="11" stroke="#2980b9" strokeWidth="0.8" opacity="0.5" data-qoder-id="qel-line-20b5e167" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-20b5e167&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipOrder&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1268,&quot;column&quot;:7}}"/>
      <line x1="8" y1="14" x2="15" y2="14" stroke="#2980b9" strokeWidth="0.8" opacity="0.5" data-qoder-id="qel-line-1fb5dfd4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-1fb5dfd4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipOrder&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1269,&quot;column&quot;:7}}"/>
      {/* Branching arrows — 9-way intent */}
      <path d="M20 10l4 2-4 2" stroke="#2980b9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-path-9ed56d37" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-9ed56d37&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipOrder&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1271,&quot;column&quot;:7}}"/>
      <path d="M20 16l4 2-4 2" stroke="#2980b9" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" data-qoder-id="qel-path-9dd56ba4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-9dd56ba4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipOrder&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1272,&quot;column&quot;:7}}"/>
      <circle cx="24" cy="12" r="1.2" fill="#2980b9" opacity="0.3" data-qoder-id="qel-circle-e170d3ef" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-e170d3ef&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipOrder&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1273,&quot;column&quot;:7}}"/>
      <circle cx="24" cy="18" r="1.2" fill="#2980b9" opacity="0.2" data-qoder-id="qel-circle-e070d25c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-e070d25c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipOrder&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1274,&quot;column&quot;:7}}"/>
    </svg>
  )
}

function SvgChipKnowledge() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" data-qoder-id="qel-h-5-129f0a41" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-5-129f0a41&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipKnowledge&quot;,&quot;elementRole&quot;:&quot;h-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1281,&quot;column&quot;:5}}">
      {/* Open book */}
      <path d="M14 7C12 5 8 4 4 5v16c4-1 8 0 10 2" fill="#27ae60" fillOpacity="0.06" stroke="#27ae60" strokeWidth="1.1" strokeLinejoin="round" data-qoder-id="qel-path-136b904c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-136b904c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipKnowledge&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1283,&quot;column&quot;:7}}"/>
      <path d="M14 7c2-2 6-3 10-2v16c-4-1-8 0-10 2" fill="#27ae60" fillOpacity="0.06" stroke="#27ae60" strokeWidth="1.1" strokeLinejoin="round" data-qoder-id="qel-path-1a6b9b51" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-1a6b9b51&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipKnowledge&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1284,&quot;column&quot;:7}}"/>
      <line x1="14" y1="7" x2="14" y2="23" stroke="#27ae60" strokeWidth="0.8" opacity="0.4" data-qoder-id="qel-line-87fb6b78" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-87fb6b78&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipKnowledge&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1285,&quot;column&quot;:7}}"/>
      {/* Magnifying glass overlay */}
      <circle cx="20" cy="8" r="4" fill="white" fillOpacity="0.7" stroke="#27ae60" strokeWidth="1" data-qoder-id="qel-circle-9e62b004" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-9e62b004&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipKnowledge&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1287,&quot;column&quot;:7}}"/>
      <line x1="23" y1="11" x2="25" y2="13.5" stroke="#27ae60" strokeWidth="1.3" strokeLinecap="round" data-qoder-id="qel-line-0ff3f2cb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-0ff3f2cb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipKnowledge&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1288,&quot;column&quot;:7}}"/>
    </svg>
  )
}

function SvgChipStrategy() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" data-qoder-id="qel-h-5-1069e095" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-5-1069e095&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipStrategy&quot;,&quot;elementRole&quot;:&quot;h-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1295,&quot;column&quot;:5}}">
      {/* Lightbulb */}
      <path d="M14 3a7 7 0 00-4 12.7V18h8v-2.3A7 7 0 0014 3z" fill="#8e44ad" fillOpacity="0.08" stroke="#8e44ad" strokeWidth="1.1" strokeLinejoin="round" data-qoder-id="qel-path-9c53b7c8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-9c53b7c8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipStrategy&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1297,&quot;column&quot;:7}}"/>
      <line x1="11" y1="20" x2="17" y2="20" stroke="#8e44ad" strokeWidth="1" strokeLinecap="round" data-qoder-id="qel-line-46091593" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-46091593&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipStrategy&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1298,&quot;column&quot;:7}}"/>
      <line x1="12" y1="22" x2="16" y2="22" stroke="#8e44ad" strokeWidth="1" strokeLinecap="round" data-qoder-id="qel-line-45091400" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-45091400&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipStrategy&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1299,&quot;column&quot;:7}}"/>
      {/* Sparkle dots — AI recommendation */}
      <circle cx="5" cy="6" r="1" fill="#8e44ad" opacity="0.3" data-qoder-id="qel-circle-5374dc1d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-5374dc1d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipStrategy&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1301,&quot;column&quot;:7}}"/>
      <path d="M4 10l1.5-0.5L5 8" stroke="#8e44ad" strokeWidth="0.7" opacity="0.3" data-qoder-id="qel-path-a053be14" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-a053be14&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipStrategy&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1302,&quot;column&quot;:7}}"/>
      <circle cx="23" cy="5" r="0.8" fill="#8e44ad" opacity="0.25" data-qoder-id="qel-circle-4574c613" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-4574c613&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipStrategy&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1303,&quot;column&quot;:7}}"/>
      <path d="M22.5 8l1-0.5-0.5-1.5" stroke="#8e44ad" strokeWidth="0.7" opacity="0.25" data-qoder-id="qel-path-9653ae56" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-9653ae56&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipStrategy&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1304,&quot;column&quot;:7}}"/>
      {/* Filament glow */}
      <path d="M12 11c0.8-1.5 3.2-1.5 4 0" stroke="#8e44ad" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" data-qoder-id="qel-path-99517478" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-99517478&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipStrategy&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1306,&quot;column&quot;:7}}"/>
    </svg>
  )
}

function SvgChipTest() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" data-qoder-id="qel-h-5-e51bb5c8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-5-e51bb5c8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipTest&quot;,&quot;elementRole&quot;:&quot;h-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1313,&quot;column&quot;:5}}">
      {/* Terminal window */}
      <rect x="3" y="5" width="22" height="16" rx="2.5" fill="#e67e22" fillOpacity="0.06" stroke="#e67e22" strokeWidth="1.1" data-qoder-id="qel-rect-f620e351" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-f620e351&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipTest&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:1315,&quot;column&quot;:7}}"/>
      <circle cx="6.5" cy="8" r="0.8" fill="#e67e22" opacity="0.4" data-qoder-id="qel-circle-2279f6ca" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-2279f6ca&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipTest&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1316,&quot;column&quot;:7}}"/>
      <circle cx="9" cy="8" r="0.8" fill="#e67e22" opacity="0.3" data-qoder-id="qel-circle-1d79eeeb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-1d79eeeb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipTest&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1317,&quot;column&quot;:7}}"/>
      <circle cx="11.5" cy="8" r="0.8" fill="#e67e22" opacity="0.2" data-qoder-id="qel-circle-1c79ed58" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-1c79ed58&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipTest&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1318,&quot;column&quot;:7}}"/>
      {/* Route nodes — intent routing test */}
      <circle cx="9" cy="14" r="2" fill="#e67e22" fillOpacity="0.15" stroke="#e67e22" strokeWidth="0.8" data-qoder-id="qel-circle-1f79f211" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-1f79f211&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipTest&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1320,&quot;column&quot;:7}}"/>
      <circle cx="19" cy="12" r="1.5" fill="#e67e22" fillOpacity="0.15" stroke="#e67e22" strokeWidth="0.8" data-qoder-id="qel-circle-1e79f07e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-1e79f07e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipTest&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1321,&quot;column&quot;:7}}"/>
      <circle cx="19" cy="17" r="1.5" fill="#e67e22" fillOpacity="0.15" stroke="#e67e22" strokeWidth="0.8" data-qoder-id="qel-circle-1979e89f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-1979e89f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipTest&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1322,&quot;column&quot;:7}}"/>
      <line x1="11" y1="13.5" x2="17.5" y2="12" stroke="#e67e22" strokeWidth="0.8" data-qoder-id="qel-line-96b5e050" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-96b5e050&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipTest&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1323,&quot;column&quot;:7}}"/>
      <line x1="11" y1="14.5" x2="17.5" y2="17" stroke="#e67e22" strokeWidth="0.8" data-qoder-id="qel-line-95cba50c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-95cba50c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipTest&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1324,&quot;column&quot;:7}}"/>
      {/* Lightning — real-time */}
      <path d="M23 2l-2 4h2.5l-2 4" stroke="#e67e22" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-path-a670b81d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-a670b81d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;SvgChipTest&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1326,&quot;column&quot;:7}}"/>
    </svg>
  )
}

// ═══ TriggerActionCard — 触发条件后续动作卡片 ═══
function TriggerActionCard({ message, onSend }) {
  const { triggerActions, triggersSummary, emotionLevel, shouldEscalate } = message
  if (!triggerActions || triggerActions.length === 0) return null

  const handleAction = (action) => {
    switch (action.action) {
      case 'transfer':
        onSend('请帮我转接人工客服')
        break
      case 'upload_image':
        onSend('我要上传食安相关的照片')
        break
      case 'compensation':
        onSend('请问可以给我什么补偿方案？')
        break
      case 'medical':
        onSend('我需要就医指引和帮助')
        break
      case 'batch_check':
        onSend('请排查同批次产品是否有相同问题')
        break
      default:
        break
    }
  }

  return (
    <div data-component="trigger-action-card" style={{
      maxWidth: '420px',
      marginLeft: '48px',
      marginTop: '4px',
      animation: 'fadeIn 0.3s ease-out',
    }} data-qoder-id="qel-trigger-action-card-105fee3f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-trigger-action-card-105fee3f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;TriggerActionCard&quot;,&quot;elementRole&quot;:&quot;trigger-action-card&quot;,&quot;loc&quot;:{&quot;line&quot;:1359,&quot;column&quot;:5}}">
      {shouldEscalate && (
        <div style={{
          background: emotionLevel === 'angry' ? '#fff5f5' : '#fffff0',
          border: `1px solid ${emotionLevel === 'angry' ? '#feb2b2' : '#fefcbf'}`,
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '8px',
          fontSize: '12px',
          color: emotionLevel === 'angry' ? '#c53030' : '#744210',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }} data-qoder-id="qel-div-1e10e245" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1e10e245&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;TriggerActionCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1366,&quot;column&quot;:9}}">
          <span data-qoder-id="qel-span-da5268ac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-da5268ac&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;TriggerActionCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1378,&quot;column&quot;:11}}">{emotionLevel === 'angry' ? '⚠️' : 'ℹ️'}</span>
          <span data-qoder-id="qel-span-db526a3f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-db526a3f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;TriggerActionCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1379,&quot;column&quot;:11}}">{shouldEscalate ? '已触发升级处理，建议转接人工客服或门店负责人' : '检测到特殊场景，提供快捷操作'}</span>
        </div>
      )}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
      }} data-qoder-id="qel-div-1910da66" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1910da66&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;TriggerActionCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1382,&quot;column&quot;:7}}">
        {triggerActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleAction(action)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '20px',
              border: `1px solid ${action.color}30`,
              background: `${action.color}08`,
              color: action.color,
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${action.color}15`
              e.currentTarget.style.borderColor = `${action.color}50`
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${action.color}08`
              e.currentTarget.style.borderColor = `${action.color}30`
              e.currentTarget.style.transform = 'translateY(0)'
            }}
           data-qoder-id="qel-button-a20ac951" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-a20ac951&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;TriggerActionCard&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1388,&quot;column&quot;:11}}">
            <span data-qoder-id="qel-span-de526ef8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-de526ef8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;TriggerActionCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1417,&quot;column&quot;:13}}">{action.icon}</span>
            <span data-qoder-id="qel-span-df52708b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-df52708b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;TriggerActionCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1418,&quot;column&quot;:13}}">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function WelcomeScreen({ onSend, ...qoderProps }) {
  return (
    <div className={["flex flex-col items-center justify-center flex-1 px-4", qoderProps?.className].filter(Boolean).join(" ")} data-component="welcome-screen" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Greeting cluster — compact, pushed up */}
      <div className="mb-6 flex flex-col items-center text-center" data-qoder-id="qel-mb-6-fa13c135" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-6-fa13c135&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WelcomeScreen&quot;,&quot;elementRole&quot;:&quot;mb-6&quot;,&quot;loc&quot;:{&quot;line&quot;:1430,&quot;column&quot;:7}}">
        <div className="mb-3 flex items-center gap-2.5" data-qoder-id="qel-mb-3-08f0942f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-3-08f0942f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WelcomeScreen&quot;,&quot;elementRole&quot;:&quot;mb-3&quot;,&quot;loc&quot;:{&quot;line&quot;:1431,&quot;column&quot;:9}}">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'var(--cursor-orange)' }}
           data-qoder-id="qel-flex-4d0bba50" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-4d0bba50&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WelcomeScreen&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1432,&quot;column&quot;:11}}">
            <Shield className="h-5 w-5 text-white"  data-qoder-id="qel-h-5-c7d89440" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-5-c7d89440&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WelcomeScreen&quot;,&quot;elementRole&quot;:&quot;h-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1436,&quot;column&quot;:13}}"/>
          </div>
          <h2
            className="text-xl font-semibold tracking-tight cursor-display"
            style={{ color: 'var(--cursor-ink)' }}
           data-qoder-id="qel-text-xl-317c9d08" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xl-317c9d08&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WelcomeScreen&quot;,&quot;elementRole&quot;:&quot;text-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:1438,&quot;column&quot;:11}}">
            欢迎来到喜茶
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-max-w-md-d868ccc9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-max-w-md-d868ccc9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WelcomeScreen&quot;,&quot;elementRole&quot;:&quot;max-w-md&quot;,&quot;loc&quot;:{&quot;line&quot;:1445,&quot;column&quot;:9}}">
          喜茶智能客服 — 食安咨询 · 订单处理 · 产品推荐 · 门店查询，阿喜随时为您服务
        </p>
      </div>

      {/* Quick Prompt Cards — 2x2 grid with SVG illustrations */}
      <div className="grid w-full max-w-xl grid-cols-2 gap-2.5 mb-6" data-qoder-id="qel-grid-2e8dc11b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-2e8dc11b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WelcomeScreen&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:1451,&quot;column&quot;:7}}">
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
             data-qoder-id="qel-quick-prompt-card-7cb977be" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-quick-prompt-card-7cb977be&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WelcomeScreen&quot;,&quot;elementRole&quot;:&quot;quick-prompt-card&quot;,&quot;loc&quot;:{&quot;line&quot;:1455,&quot;column&quot;:13}}">
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'var(--cursor-orange-bg, rgba(245,78,0,0.06))' }}
               data-qoder-id="qel-flex-570bca0e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-570bca0e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WelcomeScreen&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1465,&quot;column&quot;:15}}">
                {SvgCard ? <SvgCard  data-qoder-id="qel-svgcard-ef5fc081" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svgcard-ef5fc081&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WelcomeScreen&quot;,&quot;elementRole&quot;:&quot;svgcard&quot;,&quot;loc&quot;:{&quot;line&quot;:1469,&quot;column&quot;:28}}"/> : <Sparkles className="h-5 w-5" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-5-b07f6c61" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-5-b07f6c61&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WelcomeScreen&quot;,&quot;elementRole&quot;:&quot;h-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1469,&quot;column&quot;:42}}"/>}
              </div>
              <div className="min-w-0 flex-1 pt-0.5" data-qoder-id="qel-min-w-0-b953612d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-min-w-0-b953612d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WelcomeScreen&quot;,&quot;elementRole&quot;:&quot;min-w-0&quot;,&quot;loc&quot;:{&quot;line&quot;:1471,&quot;column&quot;:15}}">
                <span className="block text-sm font-medium leading-tight" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-1ebcd3a7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-1ebcd3a7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WelcomeScreen&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:1472,&quot;column&quot;:17}}">
                  {prompt.text}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-0-5-e96c555f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-e96c555f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;WelcomeScreen&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1475,&quot;column&quot;:17}}">
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
  { Svg: SvgChipInspection, label: '食安检测', color: '#f54e00', desc: '食品安全问题分类与处理', prompt: '我的饮品里发现了异物，请帮我处理' },
  { Svg: SvgChipOrder, label: '订单处理', color: '#2980b9', desc: '查单、催单、退款', prompt: '帮我查一下最近的订单状态' },
  { Svg: SvgChipKnowledge, label: '知识检索', color: '#27ae60', desc: '产品信息与政策查询', prompt: '请问喜茶有哪些新品推荐？' },
  { Svg: SvgChipStrategy, label: '策略推荐', color: '#8e44ad', desc: '智能方案匹配', prompt: '我想了解一下你们的补偿政策' },
  { Svg: SvgChipTest, label: '意图测试', color: '#e67e22', desc: 'AI意图识别测试', prompt: '帮我转接人工客服' },
]

/* ─── Chat Input Bar ─── */
function ChatInputBar({ onSend, isStreaming, onStop, ...qoderProps }) {
  const [input, setInput] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const [attachedImage, setAttachedImage] = useState(null) // { file, base64, preview, analysis }
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
    if (attachedImage) {
      // 构建图片备注：包含文件名、视觉分析结果、后端存储URL
      const parts = [`[用户上传图片: ${attachedImage.file.name}]`]
      if (attachedImage.analysis) {
        parts.push(`[图片分析结果: ${attachedImage.analysis}]`)
      }
      if (attachedImage.backendUrl) {
        parts.push(`[图片证据URL: ${attachedImage.backendUrl}]`)
      }
      finalText = parts.join('\n') + '\n' + finalText
      URL.revokeObjectURL(attachedImage.preview)
      setAttachedImage(null)
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
  const handleFileSelect = async (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset so same file can be re-selected

    if (type === 'image') {
      // 图片上传：预览 + 视觉分析 + 后端存储（食安证据留存）
      const preview = URL.createObjectURL(file)
      setAttachedImage({ file, preview, analysis: '分析中...', backendUrl: null })
      setInput(prev => prev ? prev : `请帮我看看这张图片 `)

      // 1) 视觉分析（客户端 AI 识别图片内容）
      try {
        const { analyzeImage } = await import('../../lib/vision-service.js')
        const description = await analyzeImage(file)
        setAttachedImage(prev => prev ? { ...prev, analysis: description } : null)
      } catch (err) {
        console.warn('[ImageUpload] 视觉分析失败:', err.message)
        setAttachedImage(prev => prev ? { ...prev, analysis: null } : null)
        setMediaError(`图片分析失败: ${err.message}（图片仍将随消息发送）`)
      }

      // 2) 后端上传（食安证据存储，便于后续人工复核）
      try {
        if (apiClient.isAuthenticated()) {
          const uploadResult = await apiClient.uploadImage(file)
          setAttachedImage(prev => prev ? { ...prev, backendUrl: uploadResult.url } : null)
          console.log('[ImageUpload] 后端上传成功:', uploadResult.url)
        }
      } catch (err) {
        console.warn('[ImageUpload] 后端上传失败:', err.message)
        // 非关键错误，图片仍可随文本发送
      }
    } else {
      setAttachedFile(file)
      setInput(prev => prev ? prev : `[文件: ${file.name}] `)
    }
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
      className={["px-4 py-2", qoderProps?.className].filter(Boolean).join(" ")}
      style={{ ...({
        borderTop: '1px solid var(--cursor-border-10)',
        background: 'var(--cursor-surface-200)',
      }), ...(qoderProps?.style) }}
      data-component="chat-input-bar"
     data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="mx-auto max-w-[820px]" data-qoder-id="qel-mx-auto-1353ed22" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mx-auto-1353ed22&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;mx-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:1607,&quot;column&quot;:7}}">
        {/* Quick Action Chips — compact, centered */}
        <div className="flex items-center justify-center gap-1.5 mb-1.5 flex-wrap" data-qoder-id="qel-flex-4ada3e97" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-4ada3e97&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1609,&quot;column&quot;:9}}">
          {QUICK_ACTIONS.map((action, i) => {
            const { Svg } = action
            return (
              <button
                key={i}
                className="flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] transition-all hover:shadow-sm whitespace-nowrap"
                style={{
                  borderColor: action.color + '25',
                  background: action.color + '06',
                  color: action.color,
                }}
                onClick={() => onSend(action.prompt)}
                title={action.desc}
                data-component="quick-action-chip"
               data-qoder-id="qel-quick-action-chip-9cb91dd5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-quick-action-chip-9cb91dd5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;quick-action-chip&quot;,&quot;loc&quot;:{&quot;line&quot;:1613,&quot;column&quot;:15}}">
                <Svg  data-qoder-id="qel-svg-5d742623" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-5d742623&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:1625,&quot;column&quot;:17}}"/>
                {action.label}
              </button>
            )
          })}
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--cursor-border-10)', color: 'var(--cursor-border-55)' }}
            onClick={() => setShowMore(!showMore)}
           data-qoder-id="qel-flex-65b38852" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-65b38852&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1630,&quot;column&quot;:11}}">
            <MoreHorizontal className="h-3 w-3"  data-qoder-id="qel-h-3-4b1de3b3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-4b1de3b3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:1635,&quot;column&quot;:13}}"/>
            更多
          </button>
          {showMore && (
            <div className="absolute z-50 top-full left-0 mt-1 rounded-lg border shadow-lg p-2 min-w-[160px]" style={{ background: 'var(--cursor-surface-300)', borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-absolute-150721e3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-150721e3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:1639,&quot;column&quot;:13}}">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] w-full text-left hover:opacity-80" style={{ color: 'var(--cursor-ink)' }} onClick={() => { imageInputRef.current?.click(); setShowMore(false) }} data-qoder-id="qel-flex-64b386bf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-64b386bf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1640,&quot;column&quot;:15}}">
                <Image className="h-3.5 w-3.5" style={{ color: '#2980b9' }}  data-qoder-id="qel-h-3-5-0d8d8376" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-0d8d8376&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1641,&quot;column&quot;:17}}"/> 上传图片
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] w-full text-left hover:opacity-80" style={{ color: 'var(--cursor-ink)' }} onClick={() => { fileInputRef.current?.click(); setShowMore(false) }} data-qoder-id="qel-flex-62b38399" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-62b38399&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1643,&quot;column&quot;:15}}">
                <FileText className="h-3.5 w-3.5" style={{ color: '#e67e22' }}  data-qoder-id="qel-h-3-5-e3f6dd68" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-e3f6dd68&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1644,&quot;column&quot;:17}}"/> 上传文件
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] w-full text-left hover:opacity-80" style={{ color: 'var(--cursor-ink)' }} onClick={() => { onSend('请帮我生成质检报告'); setShowMore(false) }} data-qoder-id="qel-flex-60b38073" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-60b38073&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1646,&quot;column&quot;:15}}">
                <Ticket className="h-3.5 w-3.5" style={{ color: '#8e44ad' }}  data-qoder-id="qel-h-3-5-b2e78d07" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-b2e78d07&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1647,&quot;column&quot;:17}}"/> 质检报告
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] w-full text-left hover:opacity-80" style={{ color: 'var(--cursor-ink)' }} onClick={() => { onSend('请帮我转接人工客服'); setShowMore(false) }} data-qoder-id="qel-flex-6eb3967d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-6eb3967d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1649,&quot;column&quot;:15}}">
                <Phone className="h-3.5 w-3.5" style={{ color: '#27ae60' }}  data-qoder-id="qel-h-3-5-c1405af4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-c1405af4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1650,&quot;column&quot;:17}}"/> 转人工客服
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
          }} data-qoder-id="qel-flex-bcd4e1df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-bcd4e1df&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1658,&quot;column&quot;:11}}">
            <Upload className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-3-c1ab72c5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-c1ab72c5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:1663,&quot;column&quot;:13}}"/>
            <span className="truncate" data-qoder-id="qel-truncate-a0866ec9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-truncate-a0866ec9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;truncate&quot;,&quot;loc&quot;:{&quot;line&quot;:1664,&quot;column&quot;:13}}">{attachedFile.name}</span>
            <span style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-span-8a39a016" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-8a39a016&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:1665,&quot;column&quot;:13}}">({(attachedFile.size / 1024).toFixed(1)}KB)</span>
            <button className="ml-auto flex-shrink-0" onClick={() => { setAttachedFile(null); setInput(prev => prev.replace(/\[(已上传文件|图片|文件):.*?\]\s*/, '')) }} data-qoder-id="qel-ml-auto-33f1f5ee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-auto-33f1f5ee&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;ml-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:1666,&quot;column&quot;:13}}">
              <X className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-cc0748c4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-cc0748c4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:1667,&quot;column&quot;:15}}"/>
            </button>
          </div>
        )}

        {/* Attached image preview with vision analysis status */}
        {attachedImage && (
          <div className="flex items-center gap-2 mb-1.5 px-2 py-1.5 rounded-md text-[11px] animate-fade-in" style={{
            background: 'var(--cursor-surface-300)',
            color: 'var(--cursor-ink)',
            border: '1px solid var(--cursor-border-10)',
          }} data-qoder-id="qel-flex-c9d07928" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c9d07928&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1887,&quot;column&quot;:11}}">
            <img src={attachedImage.preview} alt={attachedImage.file.name} style={{
              width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e5e5e5',
            }}  data-qoder-id="qel-img-9c781cd5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-img-9c781cd5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;img&quot;,&quot;loc&quot;:{&quot;line&quot;:1892,&quot;column&quot;:13}}"/>
            <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-2ee0f36c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-2ee0f36c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:1895,&quot;column&quot;:13}}">
              <div className="truncate" style={{ fontSize: '11px' }} data-qoder-id="qel-truncate-3df61dc4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-truncate-3df61dc4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;truncate&quot;,&quot;loc&quot;:{&quot;line&quot;:1896,&quot;column&quot;:15}}">{attachedImage.file.name}</div>
              <div style={{ fontSize: '10px', color: attachedImage.analysis === '分析中...' ? 'var(--cursor-orange)' : '#27ae60' }} data-qoder-id="qel-div-0cbae011" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-0cbae011&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:1897,&quot;column&quot;:15}}">
                {attachedImage.analysis === '分析中...' ? '🔍 AI 视觉分析中...' : '✓ 已分析'}
                {attachedImage.backendUrl ? ' · ☁️ 已存档' : ''}
              </div>
            </div>
            <button className="flex-shrink-0" onClick={() => {
              URL.revokeObjectURL(attachedImage.preview)
              setAttachedImage(null)
              setInput(prev => prev.replace(/请帮我看看这张图片\s*/, ''))
            }} data-qoder-id="qel-flex-shrink-0-55b70be8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-55b70be8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:1901,&quot;column&quot;:13}}">
              <X className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-c9fa79ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-c9fa79ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:1906,&quot;column&quot;:15}}"/>
            </button>
          </div>
        )}

        {/* Voice recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 mb-1.5 px-2 py-1 rounded-md text-[11px] animate-fade-in" style={{
            background: 'hsl(345 60% 96%)',
            color: 'var(--cursor-error)',
            border: '1px solid rgba(207,45,86,0.15)',
          }} data-qoder-id="qel-flex-bad4deb9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-bad4deb9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1674,&quot;column&quot;:11}}">
            <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--cursor-error)' }}  data-qoder-id="qel-h-2-dd1864dd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-dd1864dd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:1679,&quot;column&quot;:13}}"/>
            正在录音... 点击麦克风按钮停止
          </div>
        )}

        {/* Media error */}
        {mediaError && (
          <div className="flex items-center gap-2 mb-1.5 px-2 py-1 rounded-md text-[11px] animate-fade-in" style={{
            background: 'hsl(33 80% 94%)',
            color: 'var(--cursor-gold)',
          }} data-qoder-id="qel-flex-c4d4ee77" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c4d4ee77&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1686,&quot;column&quot;:11}}">
            <AlertCircle className="h-3 w-3 flex-shrink-0"  data-qoder-id="qel-h-3-404e0c6d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-404e0c6d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:1690,&quot;column&quot;:13}}"/>
            {mediaError}
          </div>
        )}

        <div className="chat-input-bar" data-qoder-id="qel-chat-input-bar-25a92b16" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-chat-input-bar-25a92b16&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;chat-input-bar&quot;,&quot;loc&quot;:{&quot;line&quot;:1695,&quot;column&quot;:9}}">
          {/* File upload (hidden input) */}
          <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv" onChange={(e) => handleFileSelect(e, 'file')}  data-qoder-id="qel-hidden-71bae601" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-hidden-71bae601&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;hidden&quot;,&quot;loc&quot;:{&quot;line&quot;:1697,&quot;column&quot;:11}}"/>
          <input ref={imageInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, 'image')}  data-qoder-id="qel-hidden-70bae46e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-hidden-70bae46e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;hidden&quot;,&quot;loc&quot;:{&quot;line&quot;:1698,&quot;column&quot;:11}}"/>

          {/* Attach file button */}
          <Button variant="ghost" size="icon" className="flex-shrink-0" title="上传文件" onClick={() => fileInputRef.current?.click()} data-qoder-id="qel-flex-shrink-0-98ab8aa1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-98ab8aa1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:1701,&quot;column&quot;:11}}">
            <Paperclip className="h-4 w-4"  data-qoder-id="qel-h-4-a3f11f55" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-a3f11f55&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:1702,&quot;column&quot;:13}}"/>
          </Button>

          {/* Upload image button */}
          <Button variant="ghost" size="icon" className="flex-shrink-0" title="上传图片" onClick={() => imageInputRef.current?.click()} data-qoder-id="qel-flex-shrink-0-96ab877b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-96ab877b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:1706,&quot;column&quot;:11}}">
            <Image className="h-4 w-4"  data-qoder-id="qel-h-4-bceb2b4e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-bceb2b4e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:1707,&quot;column&quot;:13}}"/>
          </Button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="请输入您的问题，阿喜随时为您服务..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm"
            style={{
              color: 'var(--cursor-ink)',
              maxHeight: '120px',
            }}
           data-qoder-id="qel-flex-1-f0f2c74c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-f0f2c74c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:1710,&quot;column&quot;:11}}"/>

          {/* Voice record button */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            title={isRecording ? '停止录音' : '语音输入'}
            onClick={toggleVoiceRecord}
            style={isRecording ? { color: 'var(--cursor-error)' } : {}}
           data-qoder-id="qel-flex-shrink-0-93ab82c2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-93ab82c2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:1726,&quot;column&quot;:11}}">
            {isRecording ? <MicOff className="h-4 w-4"  data-qoder-id="qel-h-4-fe6eeeb5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-fe6eeeb5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:1734,&quot;column&quot;:28}}"/> : <Mic className="h-4 w-4"  data-qoder-id="qel-h-4-4e2523a9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-4e2523a9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:1734,&quot;column&quot;:61}}"/>}
          </Button>

          {isStreaming ? (
            <Button
              variant="destructive"
              size="icon"
              onClick={onStop}
              className="flex-shrink-0"
              title="停止生成"
             data-qoder-id="qel-flex-shrink-0-08a3ec2c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-08a3ec2c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:1738,&quot;column&quot;:13}}">
              <Square className="h-4 w-4"  data-qoder-id="qel-h-4-614164f7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-614164f7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:1745,&quot;column&quot;:15}}"/>
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
             data-qoder-id="qel-button-0119cf18" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-0119cf18&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:1748,&quot;column&quot;:13}}">
              <Send className="h-4 w-4"  data-qoder-id="qel-h-4-a8b3093c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-a8b3093c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:1758,&quot;column&quot;:15}}"/>
            </Button>
          )}
        </div>
        {/* Status indicators */}
        <div className="flex items-center gap-3 mt-1.5 text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-flex-c9d07928" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c9d07928&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1763,&quot;column&quot;:9}}">
          <span className="flex items-center gap-1" data-qoder-id="qel-flex-3ba4d4aa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-3ba4d4aa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1764,&quot;column&quot;:11}}">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" data-qoder-id="qel-svg-e5e11624" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-e5e11624&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:1765,&quot;column&quot;:13}}"><circle cx="5" cy="5" r="3" stroke="#27ae60" strokeWidth="1.2" data-qoder-id="qel-circle-ab3b220f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-ab3b220f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1765,&quot;column&quot;:73}}"/><path d="M3.5 5l1 1 2-2" stroke="#27ae60" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-path-ff1ba1db" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-ff1ba1db&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1765,&quot;column&quot;:137}}"/></svg>
            SSE 流式
          </span>
          <span className="flex items-center gap-1" data-qoder-id="qel-flex-31a28655" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-31a28655&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1768,&quot;column&quot;:11}}">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" data-qoder-id="qel-svg-61e417ef" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-61e417ef&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:1769,&quot;column&quot;:13}}"><rect x="1" y="2" width="8" height="6" rx="1" stroke="#2980b9" strokeWidth="1.1" data-qoder-id="qel-rect-85e6ff4c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-85e6ff4c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:1769,&quot;column&quot;:73}}"/><line x1="3" y1="4" x2="7" y2="4" stroke="#2980b9" strokeWidth="0.8" opacity="0.6" data-qoder-id="qel-line-cefd4bc5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-cefd4bc5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1769,&quot;column&quot;:155}}"/><line x1="3" y1="6" x2="6" y2="6" stroke="#2980b9" strokeWidth="0.8" opacity="0.4" data-qoder-id="qel-line-cdfd4a32" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-line-cdfd4a32&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;line&quot;,&quot;loc&quot;:{&quot;line&quot;:1769,&quot;column&quot;:239}}"/></svg>
            RAG 增强
          </span>
          <span className="flex items-center gap-1" data-qoder-id="qel-flex-2aa27b50" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-2aa27b50&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1772,&quot;column&quot;:11}}">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" data-qoder-id="qel-svg-5ce41010" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-5ce41010&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:1773,&quot;column&quot;:13}}"><path d="M5 1L2 3v3c0 2.2 1.3 4.2 3 4.8 1.7-0.6 3-2.6 3-4.8V3L5 1z" stroke="#8e44ad" strokeWidth="1.1" strokeLinejoin="round" data-qoder-id="qel-path-f71b9543" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-f71b9543&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1773,&quot;column&quot;:73}}"/></svg>
            智能质检
          </span>
          <span className="flex items-center gap-1" data-qoder-id="qel-flex-39a292ed" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-39a292ed&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1776,&quot;column&quot;:11}}">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" data-qoder-id="qel-svg-69e6631e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-69e6631e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:1777,&quot;column&quot;:13}}"><circle cx="5" cy="5" r="3.5" stroke="#e67e22" strokeWidth="1.1" data-qoder-id="qel-circle-1f4055d9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-1f4055d9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:1777,&quot;column&quot;:73}}"/><path d="M5 3v2l1.5 1" stroke="#e67e22" strokeWidth="0.9" strokeLinecap="round" data-qoder-id="qel-path-6f140366" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-6f140366&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:1777,&quot;column&quot;:139}}"/></svg>
            实时推理
          </span>
        </div>
        {/* 专业免责声明 */}
        <p className="mt-2 text-center text-[10px] leading-relaxed" style={{ color: 'var(--cursor-border-55)', opacity: 0.75 }} data-qoder-id="qel-mt-2-ce9f616d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-ce9f616d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInputBar&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:1782,&quot;column&quot;:9}}">
          {BRAND.disclaimer}
        </p>
      </div>
    </div>
  )
}

/* ─── Floating Service Widget — 可拖拽智能客服悬浮窗 ─── */
function FloatingServiceWidget({ onSend, role = 'consumer', ...qoderProps }) {
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
      className={["fixed z-[9999] select-none", qoderProps?.className].filter(Boolean).join(" ")}
      style={{ ...({
        left: panelX,
        top: panelY,
        transition: dragging ? 'none' : 'left 0.35s cubic-bezier(0.4,0,0.2,1), top 0.35s cubic-bezier(0.4,0,0.2,1)',
      }), ...(qoderProps?.style) }}
      data-component="floating-service-widget"
     data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
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
         data-qoder-id="qel-rounded-2xl-d60fb2d4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-2xl-d60fb2d4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;rounded-2xl&quot;,&quot;loc&quot;:{&quot;line&quot;:1952,&quot;column&quot;:9}}">
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
           data-qoder-id="qel-relative-22438209" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-relative-22438209&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;relative&quot;,&quot;loc&quot;:{&quot;line&quot;:1962,&quot;column&quot;:11}}">
            {/* Grip indicator */}
            <div className="flex justify-center mb-2" data-qoder-id="qel-flex-a43a1985" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a43a1985&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1974,&quot;column&quot;:13}}">
              <div className="w-8 h-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }}  data-qoder-id="qel-w-8-2782c139" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-8-2782c139&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;w-8&quot;,&quot;loc&quot;:{&quot;line&quot;:1975,&quot;column&quot;:15}}"/>
            </div>

            <div className="flex items-center gap-3" data-qoder-id="qel-flex-a63a1cab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a63a1cab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1978,&quot;column&quot;:13}}">
              {/* Avatar */}
              <div className="relative flex-shrink-0" data-qoder-id="qel-relative-9e4073a6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-relative-9e4073a6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;relative&quot;,&quot;loc&quot;:{&quot;line&quot;:1980,&quot;column&quot;:15}}">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                }} data-qoder-id="qel-w-10-5e9e2e38" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-10-5e9e2e38&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;w-10&quot;,&quot;loc&quot;:{&quot;line&quot;:1981,&quot;column&quot;:17}}">
                  <Shield className="h-5 w-5 text-white"  data-qoder-id="qel-h-5-345a3152" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-5-345a3152&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;h-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1985,&quot;column&quot;:19}}"/>
                </div>
                {/* Online dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{
                  background: '#27ae60',
                  borderColor: isStaff ? '#1a1a1a' : '#d43800',
                }}  data-qoder-id="qel-absolute-1e9e22ea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-1e9e22ea&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:1988,&quot;column&quot;:17}}"/>
              </div>

              <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-25a7f7fb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-25a7f7fb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:1994,&quot;column&quot;:15}}">
                <div className="text-[13px] font-semibold text-white leading-tight" data-qoder-id="qel-text-13px-324d02c9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-13px-324d02c9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;text-13px&quot;,&quot;loc&quot;:{&quot;line&quot;:1995,&quot;column&quot;:17}}">
                  {isStaff ? '客服工作台' : '阿喜智能助手'}
                </div>
                <div className="text-[10px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.75)' }} data-qoder-id="qel-text-10px-0e6bee85" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-0e6bee85&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:1998,&quot;column&quot;:17}}">
                  {isStaff ? '食安智能服务中心' : 'AI 食安服务 · 全程可追踪'}
                </div>
              </div>

              {/* Close */}
              <button
                data-action="true"
                className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.15)' }}
                onClick={() => setExpanded(false)}
               data-qoder-id="qel-flex-shrink-0-b0151c84" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-b0151c84&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:2004,&quot;column&quot;:15}}">
                <X className="h-3 w-3 text-white"  data-qoder-id="qel-h-3-ed3c8c53" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-ed3c8c53&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2010,&quot;column&quot;:17}}"/>
              </button>
            </div>

            {/* Greeting bubble */}
            <div className="mt-3 rounded-xl px-3 py-2.5 text-[11px] leading-relaxed" style={{
              background: 'rgba(255,255,255,0.13)',
              color: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(4px)',
            }} data-qoder-id="qel-mt-3-fbc21a90" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-3-fbc21a90&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;mt-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2015,&quot;column&quot;:13}}">
              {isStaff
                ? '您好，欢迎使用客服工作台。以下是您的工作快捷操作，也可以直接输入指令。'
                : '您好，欢迎来到喜茶！请问有什么可以帮到您？您可以选择以下服务或直接描述您的问题。'}
            </div>

            {/* Staff: compact KPI bar */}
            {isStaff && (
              <div className="flex gap-1.5 mt-2.5" data-qoder-id="qel-flex-b15cc03e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b15cc03e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2027,&quot;column&quot;:15}}">
                {[
                  { label: '待处理', value: '3', dot: '#ffa726' },
                  { label: '红线', value: '1', dot: '#ef5350' },
                  { label: '今日质检', value: '12', dot: '#66bb6a' },
                ].map((kpi, i) => (
                  <div key={i} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5" style={{
                    background: 'rgba(255,255,255,0.1)',
                  }} data-qoder-id="qel-flex-1-90823c93" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-90823c93&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2033,&quot;column&quot;:19}}">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: kpi.dot }}  data-qoder-id="qel-w-1-5-f9c9f84c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-1-5-f9c9f84c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;w-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2036,&quot;column&quot;:21}}"/>
                    <span className="text-[10px] font-bold text-white" data-qoder-id="qel-text-10px-db8771ca" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-db8771ca&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:2037,&quot;column&quot;:21}}">{kpi.value}</span>
                    <span className="text-[8px] text-white" style={{ opacity: 0.7 }} data-qoder-id="qel-text-8px-290b0676" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-8px-290b0676&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;text-8px&quot;,&quot;loc&quot;:{&quot;line&quot;:2038,&quot;column&quot;:21}}">{kpi.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Body: 分类快捷操作 ── */}
          <div className="px-3 pt-3 pb-1" data-qoder-id="qel-px-3-a26b2826" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-a26b2826&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2046,&quot;column&quot;:11}}">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center justify-between" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-1c5abb6e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-1c5abb6e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:2047,&quot;column&quot;:13}}">
              <span data-qoder-id="qel-span-e94614e5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e94614e5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:2048,&quot;column&quot;:15}}">快捷服务</span>
              {isStaff && (
                <span className="text-[9px] font-normal px-1.5 py-0.5 rounded-full" style={{
                  background: '#3a3a3a15',
                  color: '#3a3a3a',
                }} data-qoder-id="qel-text-9px-8bae60bd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-8bae60bd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2050,&quot;column&quot;:17}}">工作模式</span>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 mb-2.5" data-qoder-id="qel-flex-aa5cb539" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-aa5cb539&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2058,&quot;column&quot;:13}}">
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
                 data-qoder-id="qel-flex-51f5ef22" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-51f5ef22&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2060,&quot;column&quot;:17}}">
                  {group.label}
                  <ChevronDown className="h-2.5 w-2.5" style={{
                    transform: activeCategory === group.id ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}  data-qoder-id="qel-h-2-5-b8c7abc8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-b8c7abc8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2072,&quot;column&quot;:19}}"/>
                </button>
              ))}
            </div>

            {/* Action items — show selected category or all */}
            <div className="space-y-1 max-h-[200px] overflow-y-auto scrollbar-thin" data-qoder-id="qel-space-y-1-325b506a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-325b506a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;space-y-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2081,&quot;column&quot;:13}}">
              {(activeCategory ? actionGroups.filter(g => g.id === activeCategory) : actionGroups).map((group) => (
                <div key={group.id} data-qoder-id="qel-div-1477d43c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1477d43c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:2083,&quot;column&quot;:17}}">
                  {!activeCategory && (
                    <div className="flex items-center gap-1.5 py-1.5" style={{ color: group.color + 'cc' }} data-qoder-id="qel-flex-335fcb7b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-335fcb7b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2085,&quot;column&quot;:21}}">
                      <div className="h-px flex-1" style={{ background: group.color + '15' }}  data-qoder-id="qel-h-px-cdfc2ed4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-px-cdfc2ed4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;h-px&quot;,&quot;loc&quot;:{&quot;line&quot;:2086,&quot;column&quot;:23}}"/>
                      <span className="text-[9px] font-semibold uppercase tracking-wider" data-qoder-id="qel-text-9px-7bac08f6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-7bac08f6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2087,&quot;column&quot;:23}}">{group.label}</span>
                      <div className="h-px flex-1" style={{ background: group.color + '15' }}  data-qoder-id="qel-h-px-cffc31fa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-px-cffc31fa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;h-px&quot;,&quot;loc&quot;:{&quot;line&quot;:2088,&quot;column&quot;:23}}"/>
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
                     data-qoder-id="qel-flex-59f5fbba" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-59f5fbba&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2092,&quot;column&quot;:21}}">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-white transition-all" style={{
                        background: group.color,
                        boxShadow: `0 2px 6px ${group.color}30`,
                      }} data-qoder-id="qel-w-5-a82bdfb6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-5-a82bdfb6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;w-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2101,&quot;column&quot;:23}}">
                        {j + 1}
                      </div>
                      <span className="flex-1 truncate" data-qoder-id="qel-flex-1-4bbde132" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-4bbde132&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2107,&quot;column&quot;:23}}">{item.label}</span>
                      <ArrowRight className="h-3 w-3 flex-shrink-0 opacity-0 group-hover/item:opacity-50 transition-all group-hover/item:translate-x-0.5" style={{ color: group.color }}  data-qoder-id="qel-h-3-0a54898d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-0a54898d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2108,&quot;column&quot;:23}}"/>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* ── Tag chips ── */}
          <div className="px-3 py-2.5" style={{ borderTop: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-px-3-36c0582c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-36c0582c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2117,&quot;column&quot;:11}}">
            <div className="flex items-center justify-between mb-1.5" data-qoder-id="qel-flex-1ce080c8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1ce080c8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2118,&quot;column&quot;:13}}">
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-9102afa6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-9102afa6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2119,&quot;column&quot;:15}}">
                {isStaff ? '常用指令' : '热门问题'}
              </span>
              {isStaff && (
                <div className="flex items-center gap-1" data-qoder-id="qel-flex-22e08a3a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-22e08a3a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2123,&quot;column&quot;:17}}">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#27ae60' }}  data-qoder-id="qel-w-1-5-e4759033" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-1-5-e4759033&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;w-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2124,&quot;column&quot;:19}}"/>
                  <span className="text-[8px]" style={{ color: '#27ae60' }} data-qoder-id="qel-text-8px-94b5d670" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-8px-94b5d670&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;text-8px&quot;,&quot;loc&quot;:{&quot;line&quot;:2125,&quot;column&quot;:19}}">系统在线</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5" data-qoder-id="qel-flex-17e078e9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-17e078e9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2129,&quot;column&quot;:13}}">
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
                 data-qoder-id="qel-px-2-5-019afc05" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-2-5-019afc05&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;px-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2131,&quot;column&quot;:17}}">
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="px-3 py-2.5" style={{ background: 'var(--cursor-surface-300)', borderTop: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-px-3-3ec2a35b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-3ec2a35b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2149,&quot;column&quot;:11}}">
            {isStaff && (
              <div className="flex items-center justify-between mb-2 px-1" data-qoder-id="qel-flex-1ade3f0b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1ade3f0b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2151,&quot;column&quot;:15}}">
                <div className="flex items-center gap-1.5" data-qoder-id="qel-flex-1bde409e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1bde409e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2152,&quot;column&quot;:17}}">
                  <Activity className="h-3 w-3" style={{ color: '#3a3a3a' }}  data-qoder-id="qel-h-3-0c316dea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-0c316dea&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2153,&quot;column&quot;:19}}"/>
                  <span className="text-[9px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-9px-1f05cdc7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-1f05cdc7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2154,&quot;column&quot;:19}}">智能引擎运行中</span>
                </div>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold" style={{
                  background: '#27ae6018',
                  color: '#27ae60',
                }} data-qoder-id="qel-text-8px-92b394b3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-8px-92b394b3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;text-8px&quot;,&quot;loc&quot;:{&quot;line&quot;:2156,&quot;column&quot;:17}}">v2.1.0</span>
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
             data-qoder-id="qel-flex-71778697" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-71778697&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2162,&quot;column&quot;:13}}">
              {isStaff ? <FileText className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-7cedc3fc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-7cedc3fc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2179,&quot;column&quot;:26}}"/> : <Phone className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-64c1b638" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-64c1b638&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2179,&quot;column&quot;:65}}"/>}
              {isStaff ? '生成质检报告' : '联系人工客服'}
            </button>
            <div className="text-center text-[9px] mt-1.5" style={{ color: 'var(--cursor-border-55)', opacity: 0.6 }} data-qoder-id="qel-text-center-14f274d1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-center-14f274d1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;text-center&quot;,&quot;loc&quot;:{&quot;line&quot;:2182,&quot;column&quot;:13}}">
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
         data-qoder-id="qel-cursor-grab-aac3cbe1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cursor-grab-aac3cbe1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;cursor-grab&quot;,&quot;loc&quot;:{&quot;line&quot;:2189,&quot;column&quot;:9}}">
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
           data-qoder-id="qel-relative-e13e3882" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-relative-e13e3882&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;relative&quot;,&quot;loc&quot;:{&quot;line&quot;:2194,&quot;column&quot;:11}}">
            <Shield className="h-6 w-6 text-white"  data-qoder-id="qel-h-6-d6760221" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-6-d6760221&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;h-6&quot;,&quot;loc&quot;:{&quot;line&quot;:2209,&quot;column&quot;:13}}"/>
            {/* Notification dot */}
            <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full" style={{
              background: '#27ae60',
              boxShadow: '0 0 0 2px white',
            }}  data-qoder-id="qel-absolute-045c04d8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-045c04d8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:2211,&quot;column&quot;:13}}"/>
            {/* Outer pulse */}
            <span className="absolute inset-0 rounded-full animate-ping" style={{
              background: isStaff ? '#3a3a3a' : '#f54e00',
              opacity: 0.15,
              animationDuration: '2.5s',
            }}  data-qoder-id="qel-absolute-a5f4bd7c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-a5f4bd7c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;FloatingServiceWidget&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:2216,&quot;column&quot;:13}}"/>
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Consumer Workbench — 消费者端专属工作台 ─── */
function ConsumerWorkbench({ messages, onSend, ...qoderProps }) {
  const [activePanel, setActivePanel] = useState('history')
  const [activeFilter, setActiveFilter] = useState('all')

  // ── 真实会话数据（从 70 个 Excel/38,644 条会话中提取）──
  const realCases = getWorkbenchConversations(10)
  const conversations = realCases.map((c, i) => ({
    id: i + 1,
    title: c.firstMessage.substring(0, 15),
    desc: c.referenceReplies?.[0]?.substring(0, 30) || `${c.category}投诉处理中`,
    category: c.category === '外源性异物' ? 'external'
      : c.category === '内源性异物' ? 'internal'
      : c.category === '身体不适' ? 'body'
      : c.category === '原料变质' ? 'spoilage'
      : c.category === '饮品异味' ? 'taste'
      : c.emotion === 'angry' ? 'emotion'
      : 'non_safety',
    status: c.risk === 'high' ? 'active' : 'resolved',
    agent: c.risk === 'high' ? '阿喜AI' : '阿喜AI',
    rounds: c.referenceReplies?.length || 3,
    time: c.time,
    urgent: c.risk === 'high',
    escalated: c.shouldEscalate || c.risk === 'high',
    store: c.store,
    sourceId: c.id,
  }))

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
    { id: 'history', label: '会话记录', icon: <MessageCircle className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-50715cab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-50715cab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2284,&quot;column&quot;:43}}"/> },
    { id: 'complaint', label: '投诉进度', icon: <Clock className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-5094ff53" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-5094ff53&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2285,&quot;column&quot;:45}}"/> },
    { id: 'faq', label: '常见问题', icon: <HelpCircle className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-f4fe547d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-f4fe547d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2286,&quot;column&quot;:39}}"/> },
  ]

  return (
    <div className={["w-[300px] flex-shrink-0 border-l overflow-y-auto hidden lg:flex lg:flex-col scrollbar-thin", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({
      borderColor: 'var(--cursor-border-10)',
      background: 'var(--cursor-bg)',
    }), ...(qoderProps?.style) }} data-component="consumer-workbench" data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* ── Header ── */}
      <div className="px-4 py-3.5" style={{
        background: 'linear-gradient(135deg, var(--cursor-surface-400) 0%, var(--cursor-surface-300) 100%)',
        borderBottom: '1px solid var(--cursor-border-10)',
      }} data-qoder-id="qel-px-4-e7385ede" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-e7385ede&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:2295,&quot;column&quot;:7}}">
        <div className="flex items-center gap-2.5" data-qoder-id="qel-flex-8a9fa112" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-8a9fa112&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2299,&quot;column&quot;:9}}">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #f54e00, #d43800)',
            boxShadow: '0 2px 8px rgba(245,78,0,0.25)',
          }} data-qoder-id="qel-w-8-58f62b3c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-8-58f62b3c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;w-8&quot;,&quot;loc&quot;:{&quot;line&quot;:2300,&quot;column&quot;:11}}">
            <Shield className="h-4 w-4 text-white"  data-qoder-id="qel-h-4-34fd15be" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-34fd15be&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:2304,&quot;column&quot;:13}}"/>
          </div>
          <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-140dad69" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-140dad69&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2306,&quot;column&quot;:11}}">
            <div className="text-[13px] font-semibold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-13px-ec70eb7d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-13px-ec70eb7d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-13px&quot;,&quot;loc&quot;:{&quot;line&quot;:2307,&quot;column&quot;:13}}">服务记录</div>
            <div className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-3cb0d5bb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-3cb0d5bb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:2308,&quot;column&quot;:13}}">食安分类 · 智能追踪</div>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex px-2 pt-2 gap-1" style={{ borderBottom: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-flex-849f97a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-849f97a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2314,&quot;column&quot;:7}}">
        {panelItems.map(item => (
          <button
            key={item.id}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-medium transition-all relative rounded-t-lg"
            style={{
              color: activePanel === item.id ? 'var(--cursor-orange)' : 'var(--cursor-border-55)',
              background: activePanel === item.id ? 'var(--cursor-surface-300)' : 'transparent',
            }}
            onClick={() => setActivePanel(item.id)}
           data-qoder-id="qel-flex-1-c80ff210" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-c80ff210&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2316,&quot;column&quot;:11}}">
            <span style={{ display: 'flex', opacity: activePanel === item.id ? 1 : 0.5 }} data-qoder-id="qel-span-a9d9b2b8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-a9d9b2b8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:2325,&quot;column&quot;:13}}">{item.icon}</span>
            {item.label}
            {activePanel === item.id && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ background: 'var(--cursor-orange)' }}  data-qoder-id="qel-absolute-d7c00f7b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-d7c00f7b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:2328,&quot;column&quot;:15}}"/>
            )}
          </button>
        ))}
      </div>

      {/* ── Panel Content ── */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin" data-qoder-id="qel-flex-1-1b1f018f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-1b1f018f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2335,&quot;column&quot;:7}}">

        {/* ═══ 会话记录 Panel ═══ */}
        {activePanel === 'history' && (
          <>
            {/* ── 食安分类过滤器 ── */}
            <div className="flex flex-wrap gap-1" data-qoder-id="qel-flex-1ba7411a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1ba7411a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2341,&quot;column&quot;:13}}">
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
                 data-qoder-id="qel-px-2-9f1edac2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-2-9f1edac2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;px-2&quot;,&quot;loc&quot;:{&quot;line&quot;:2343,&quot;column&quot;:17}}">
                  {cat.label}
                </button>
              ))}
            </div>

            {/* ── 时间范围 ── */}
            <div className="flex items-center gap-1.5 px-1" data-qoder-id="qel-flex-19a73df4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-19a73df4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2359,&quot;column&quot;:13}}">
              <Clock className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-bcb0dea1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-bcb0dea1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2360,&quot;column&quot;:15}}"/>
              <span className="text-[9px] font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-2cd6878d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-2cd6878d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2361,&quot;column&quot;:15}}">最近 7 天</span>
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{
                background: 'var(--cursor-surface-300)',
                color: 'var(--cursor-border-55)',
              }} data-qoder-id="qel-ml-auto-9a00a3d6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-auto-9a00a3d6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;ml-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:2362,&quot;column&quot;:15}}">
                {filteredConversations.length} 条记录
              </span>
            </div>

            {/* ── 会话列表 ── */}
            <div className="space-y-1.5" data-qoder-id="qel-space-y-1-5-e022e995" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-5-e022e995&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;space-y-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2371,&quot;column&quot;:13}}">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className="rounded-xl border px-3 py-2.5 transition-all hover:shadow-sm cursor-pointer group"
                  style={{ borderColor: conv.urgent ? '#e74c3c25' : 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cursor-surface-400)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--cursor-surface-300)' }}
                  onClick={() => onSend && onSend(conv.title)}
                 data-qoder-id="qel-rounded-xl-bb3d511e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-xl-bb3d511e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;rounded-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:2373,&quot;column&quot;:17}}">
                  <div className="flex items-start gap-2" data-qoder-id="qel-flex-13a73482" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-13a73482&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2381,&quot;column&quot;:19}}">
                    {/* Status dot */}
                    <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{
                      background: conv.status === 'active' ? '#e74c3c' : '#27ae60',
                    }}  data-qoder-id="qel-w-2-ec60b8ff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-2-ec60b8ff&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;w-2&quot;,&quot;loc&quot;:{&quot;line&quot;:2383,&quot;column&quot;:21}}"/>
                    <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-161cbb19" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-161cbb19&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2386,&quot;column&quot;:21}}">
                      <div className="text-[11px] font-semibold truncate" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-ce444633" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-ce444633&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:2387,&quot;column&quot;:23}}">{conv.title}</div>
                      <div className="text-[9px] mt-0.5 truncate" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-bc4e40df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-bc4e40df&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2388,&quot;column&quot;:23}}">{conv.desc}</div>
                      <div className="flex items-center gap-1.5 mt-1.5" data-qoder-id="qel-flex-92a42ad8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-92a42ad8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2389,&quot;column&quot;:23}}">
                        <span className="text-[8px] px-1 py-0.5 rounded font-medium" style={{
                          background: 'var(--cursor-surface-400)',
                          color: 'var(--cursor-border-55)',
                        }} data-qoder-id="qel-text-8px-d6e3dd5f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-8px-d6e3dd5f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-8px&quot;,&quot;loc&quot;:{&quot;line&quot;:2390,&quot;column&quot;:25}}">
                          {conv.agent}
                        </span>
                        <span className="text-[8px]" style={{ color: 'var(--cursor-border-55)', opacity: 0.7 }} data-qoder-id="qel-text-8px-d7e3def2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-8px-d7e3def2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-8px&quot;,&quot;loc&quot;:{&quot;line&quot;:2396,&quot;column&quot;:25}}">
                          {conv.rounds}轮 · {conv.time}
                        </span>
                        {conv.escalated && (
                          <span className="text-[8px] px-1 py-0.5 rounded font-semibold" style={{
                            background: '#e74c3c15',
                            color: '#e74c3c',
                          }} data-qoder-id="qel-text-8px-d8e3e085" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-8px-d8e3e085&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-8px&quot;,&quot;loc&quot;:{&quot;line&quot;:2400,&quot;column&quot;:27}}">已转人工</span>
                        )}
                        {conv.urgent && !conv.escalated && (
                          <span className="text-[8px] px-1 py-0.5 rounded font-semibold" style={{
                            background: '#e67e2215',
                            color: '#e67e22',
                          }} data-qoder-id="qel-text-8px-d9e3e218" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-8px-d9e3e218&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-8px&quot;,&quot;loc&quot;:{&quot;line&quot;:2406,&quot;column&quot;:27}}">紧急</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── 底部统计 ── */}
            <div className="text-center text-[9px] pt-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-center-4bbbb7c5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-center-4bbbb7c5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-center&quot;,&quot;loc&quot;:{&quot;line&quot;:2419,&quot;column&quot;:13}}">
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
            }} data-qoder-id="qel-rounded-xl-47381d54" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-xl-47381d54&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;rounded-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:2429,&quot;column&quot;:13}}">
              <div className="px-3.5 py-3 flex items-center justify-between" style={{
                background: `linear-gradient(135deg, ${stageColors[complaintStage]}12, ${stageColors[complaintStage]}06)`,
                borderBottom: '1px solid var(--cursor-border-10)',
              }} data-qoder-id="qel-px-3-5-c10cf3ed" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-5-c10cf3ed&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;px-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2433,&quot;column&quot;:15}}">
                <div className="flex items-center gap-2.5" data-qoder-id="qel-flex-0aaba385" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-0aaba385&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2437,&quot;column&quot;:17}}">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
                    background: stageColors[complaintStage] + '20',
                  }} data-qoder-id="qel-w-7-8274c3aa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-7-8274c3aa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;w-7&quot;,&quot;loc&quot;:{&quot;line&quot;:2438,&quot;column&quot;:19}}">
                    {complaintStage === 'resolved' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" style={{ color: stageColors[complaintStage] }}  data-qoder-id="qel-h-3-5-483c8d31" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-483c8d31&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2442,&quot;column&quot;:23}}"/>
                    ) : complaintStage === 'processing' ? (
                      <Zap className="h-3.5 w-3.5" style={{ color: stageColors[complaintStage] }}  data-qoder-id="qel-h-3-5-1f143f07" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-1f143f07&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2444,&quot;column&quot;:23}}"/>
                    ) : (
                      <Clock className="h-3.5 w-3.5" style={{ color: stageColors[complaintStage] }}  data-qoder-id="qel-h-3-5-e08b54a7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-e08b54a7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2446,&quot;column&quot;:23}}"/>
                    )}
                  </div>
                  <div data-qoder-id="qel-div-8b424a74" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8b424a74&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:2449,&quot;column&quot;:19}}">
                    <div className="text-[11px] font-semibold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-de469dfa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-de469dfa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:2450,&quot;column&quot;:21}}">服务进度</div>
                    <div className="text-[10px]" style={{ color: stageColors[complaintStage] }} data-qoder-id="qel-text-10px-b4a943de" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-b4a943de&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:2451,&quot;column&quot;:21}}">
                      {stageLabels[complaintStage]}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{
                  background: stageColors[complaintStage] + '18',
                  color: stageColors[complaintStage],
                }} data-qoder-id="qel-px-2-49847b83" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-2-49847b83&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;px-2&quot;,&quot;loc&quot;:{&quot;line&quot;:2456,&quot;column&quot;:17}}">
                  {complaintStage === 'waiting' ? 'WAITING' : complaintStage === 'received' ? 'RECEIVED' : complaintStage === 'processing' ? 'IN PROGRESS' : 'RESOLVED'}
                </span>
              </div>

              {/* Progress Steps */}
              <div className="px-3.5 py-3 space-y-0" data-qoder-id="qel-px-3-5-a50f0670" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-5-a50f0670&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;px-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2465,&quot;column&quot;:15}}">
                {[
                  { step: '提交反馈', desc: '您的问题已提交', done: hasComplaint },
                  { step: '智能分析', desc: '多模型智能质检', done: complaintStage === 'processing' || complaintStage === 'resolved' },
                  { step: '方案生成', desc: '补偿方案与处理建议', done: complaintStage === 'resolved' },
                  { step: '处理完成', desc: '问题已解决', done: complaintStage === 'resolved' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3" data-qoder-id="qel-flex-00a95530" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-00a95530&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2472,&quot;column&quot;:19}}">
                    <div className="flex flex-col items-center pt-0.5" data-qoder-id="qel-flex-01a956c3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-01a956c3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2473,&quot;column&quot;:21}}">
                      <div className="h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all" style={{
                        background: item.done ? 'var(--cursor-orange)' : 'var(--cursor-border-10)',
                        boxShadow: item.done ? '0 2px 6px rgba(245,78,0,0.25)' : 'none',
                      }} data-qoder-id="qel-h-4-44c1cbbe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-44c1cbbe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:2474,&quot;column&quot;:23}}">
                        {item.done ? (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" data-qoder-id="qel-svg-296918a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-296918a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:2479,&quot;column&quot;:27}}">
                            <path d="M2 4l1.5 1.5L6 2.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-path-9dcc15f4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-9dcc15f4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:2480,&quot;column&quot;:29}}"/>
                          </svg>
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--cursor-border-20)' }}  data-qoder-id="qel-h-1-5-90d885b6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-1-5-90d885b6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;h-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2483,&quot;column&quot;:27}}"/>
                        )}
                      </div>
                      {i < 3 && <div className="w-px h-5 my-0.5" style={{
                        background: item.done ? 'var(--cursor-orange)' : 'var(--cursor-border-10)',
                        opacity: 0.35,
                      }}  data-qoder-id="qel-w-px-6372ae35" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-px-6372ae35&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;w-px&quot;,&quot;loc&quot;:{&quot;line&quot;:2486,&quot;column&quot;:33}}"/>}
                    </div>
                    <div className="pb-3" data-qoder-id="qel-pb-3-eda8ca14" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pb-3-eda8ca14&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;pb-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2491,&quot;column&quot;:21}}">
                      <div className="text-[11px] font-medium leading-tight" style={{ color: item.done ? 'var(--cursor-ink)' : 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-525f597c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-525f597c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:2492,&quot;column&quot;:23}}">
                        {item.step}
                      </div>
                      <div className="text-[9px] mt-0.5" style={{ color: 'var(--cursor-border-55)', opacity: 0.7 }} data-qoder-id="qel-text-9px-ca6eaa94" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-ca6eaa94&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2495,&quot;column&quot;:23}}">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="space-y-1.5" data-qoder-id="qel-space-y-1-5-634039e2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-5-634039e2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;space-y-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2505,&quot;column&quot;:13}}">
              <div className="text-[10px] font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-c2cbec2a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-c2cbec2a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:2506,&quot;column&quot;:15}}">
                快捷操作
              </div>
              {[
                { label: '转接人工客服', desc: '情绪激动或复杂问题直接转人工', color: '#e67e22', icon: <Phone className="h-3 w-3"  data-qoder-id="qel-h-3-6bb76267" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-6bb76267&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2510,&quot;column&quot;:84}}"/> },
                { label: '查看补偿方案', desc: '代金券 / 退款 / 重做', color: '#27ae60', icon: <Ticket className="h-3 w-3"  data-qoder-id="qel-h-3-518df714" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-518df714&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2511,&quot;column&quot;:83}}"/> },
                { label: '上传食安图片', desc: '拍照上传异物/问题产品', color: '#2980b9', icon: <Image className="h-3 w-3"  data-qoder-id="qel-h-3-5e77aa6c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5e77aa6c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2512,&quot;column&quot;:81}}"/> },
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
                 data-qoder-id="qel-w-full-89071c97" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-89071c97&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:2514,&quot;column&quot;:17}}">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                    background: item.color + '15',
                    color: item.color,
                  }} data-qoder-id="qel-w-7-75521cf1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-7-75521cf1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;w-7&quot;,&quot;loc&quot;:{&quot;line&quot;:2524,&quot;column&quot;:19}}">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-9a28c3d8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-9a28c3d8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2530,&quot;column&quot;:19}}">
                    <div className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-5861a185" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-5861a185&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:2531,&quot;column&quot;:21}}">{item.label}</div>
                    <div className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-c66c65b1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-c66c65b1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2532,&quot;column&quot;:21}}">{item.desc}</div>
                  </div>
                  <ArrowRight className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: item.color }}  data-qoder-id="qel-h-3-b5c5d7f9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-b5c5d7f9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2534,&quot;column&quot;:19}}"/>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ═══ 常见问题 Panel ═══ */}
        {activePanel === 'faq' && (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-bac9a0fb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-bac9a0fb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:2544,&quot;column&quot;:13}}">常见问题</div>
            <div className="space-y-1.5" data-qoder-id="qel-space-y-1-5-63427879" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-5-63427879&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;space-y-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2545,&quot;column&quot;:13}}">
              {[
                { q: '饮品中发现异物怎么办？', a: '请保留异物并拍照，我们会第一时间为您处理。外源性异物（头发、塑料等）和内源性异物（果核等）处理方案不同，均可提供退款或重做。', color: '#e74c3c' },
                { q: '如何申请退款？', a: '提供订单号或手机号，我会为您查询退款方案。退款由门店核实后处理，预计24小时内完成。', color: '#e67e22' },
                { q: '什么情况下会转人工？', a: '以下情况会自动转人工：情绪激动/要求曝光、涉及人身伤害、金额赔偿争议、红线触发、或您主动要求转人工。', color: '#c0392b' },
                { q: '食安投诉处理流程？', a: '提交反馈 → 智能分类（内源/外源/非食安）→ 生成处理方案 → 门店负责人核实 → 12小时内联系您。', color: '#2980b9' },
                { q: '如何联系人工客服？', a: '您可以直接说"转人工"或点击快捷操作中的"转接人工客服"按钮。', color: '#27ae60' },
              ].map((item, i) => (
                <details key={i} className="rounded-xl border overflow-hidden group" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-rounded-xl-17b31127" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-xl-17b31127&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;rounded-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:2553,&quot;column&quot;:17}}">
                  <summary className="px-3 py-2.5 text-[11px] font-medium cursor-pointer flex items-center gap-2.5 list-none" style={{ color: 'var(--cursor-ink)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-px-3-9fbf14b4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-9fbf14b4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2554,&quot;column&quot;:19}}">
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: item.color }}  data-qoder-id="qel-w-1-3b72f067" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-1-3b72f067&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;w-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2555,&quot;column&quot;:21}}"/>
                    <span className="flex-1" data-qoder-id="qel-flex-1-ea128e23" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-ea128e23&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2556,&quot;column&quot;:21}}">{item.q}</span>
                    <ChevronRight className="h-3 w-3 flex-shrink-0 transition-transform group-open:rotate-90" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-ba356ec2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-ba356ec2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2557,&quot;column&quot;:21}}"/>
                  </summary>
                  <div className="px-3 py-2.5 text-[10px] leading-relaxed" style={{
                    color: 'var(--cursor-border-55)',
                    borderTop: '1px solid var(--cursor-border-10)',
                    background: 'var(--cursor-bg)',
                  }} data-qoder-id="qel-px-3-348e2ecf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-348e2ecf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2559,&quot;column&quot;:19}}">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-px-4-cd121749" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-cd121749&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:2574,&quot;column&quot;:7}}">
        <div className="flex items-center gap-2" data-qoder-id="qel-flex-c9e9424e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c9e9424e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2575,&quot;column&quot;:9}}">
          <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{
            background: 'rgba(245,78,0,0.1)',
          }} data-qoder-id="qel-w-5-ce30e3fb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-5-ce30e3fb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;w-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2576,&quot;column&quot;:11}}">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" data-qoder-id="qel-svg-28fd784a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-28fd784a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:2579,&quot;column&quot;:13}}">
              <path d="M6 1L2 3.5v3c0 2.8 1.7 5.3 4 6 2.3-0.7 4-3.2 4-6v-3L6 1z" stroke="var(--cursor-orange)" strokeWidth="1.1" strokeLinejoin="round" data-qoder-id="qel-path-46f951bf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-46f951bf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:2580,&quot;column&quot;:15}}"/>
              <path d="M4.5 6l1 1L7.5 5" stroke="var(--cursor-orange)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-path-47f95352" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-47f95352&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:2581,&quot;column&quot;:15}}"/>
            </svg>
          </div>
          <div data-qoder-id="qel-div-e798d3c3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-e798d3c3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:2584,&quot;column&quot;:11}}">
            <div className="text-[10px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-10px-298cd7c2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-298cd7c2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:2585,&quot;column&quot;:13}}">喜茶食安保障体系</div>
            <div className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-32f26665" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-32f26665&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ConsumerWorkbench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2586,&quot;column&quot;:13}}">全程质检守护</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Staff Workbench — 客服工作台专属右侧面板 ─── */
function StaffWorkbench({ messages, ...qoderProps }) {
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
    { id: 'orders', label: '质检工单', icon: <ClipboardList className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-1ab1f043" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-1ab1f043&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2610,&quot;column&quot;:42}}"/> },
    { id: 'analytics', label: '数据看板', icon: <BarChart3 className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-ca4354ce" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-ca4354ce&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2611,&quot;column&quot;:45}}"/> },
    { id: 'monitor', label: '食安监控', icon: <Activity className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-e14d5e6a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-e14d5e6a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2612,&quot;column&quot;:43}}"/> },
  ]

  // Real work orders derived from actual customer service data (70 Excel files)
  const realCases = getWorkbenchConversations(8)
  const workOrders = realCases.map((c, i) => ({
    id: `WO-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(i+1).padStart(3,'0')}`,
    type: c.category === '外源性异物' ? `异物投诉（${c.subCategory}）`
      : c.category === '内源性异物' ? `内源性异物（${c.subCategory}）`
      : c.category === '身体不适' ? '身体不适'
      : c.category === '原料变质' ? '原料变质'
      : c.emotion === 'angry' ? '情绪升级（转人工）'
      : `${c.category}投诉`,
    store: c.store,
    severity: c.risk,
    status: c.status === 'pending' ? 'pending' : c.status === 'processing' ? 'processing' : 'resolved',
    time: c.time,
    detail: c.firstMessage.substring(0, 40),
    sourceCaseId: c.id,
  }))

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
    <div className={["w-[300px] flex-shrink-0 border-l overflow-y-auto hidden lg:flex lg:flex-col scrollbar-thin", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({
      borderColor: 'var(--cursor-border-10)',
      background: 'var(--cursor-bg)',
    }), ...(qoderProps?.style) }} data-component="staff-workbench" data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* ── Header ── */}
      <div className="px-4 py-4" style={{
        background: 'linear-gradient(135deg, #3a3a3a 0%, #1a1a1a 100%)',
      }} data-qoder-id="qel-px-4-a224dc0f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-a224dc0f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:2658,&quot;column&quot;:7}}">
        <div className="flex items-center gap-2.5" data-qoder-id="qel-flex-4e17eebe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-4e17eebe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2661,&quot;column&quot;:9}}">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
          }} data-qoder-id="qel-w-8-3d12855a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-8-3d12855a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;w-8&quot;,&quot;loc&quot;:{&quot;line&quot;:2662,&quot;column&quot;:11}}">
            <Layers className="h-4 w-4 text-white"  data-qoder-id="qel-h-4-9d907d09" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-9d907d09&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:2666,&quot;column&quot;:13}}"/>
          </div>
          <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-474cb11b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-474cb11b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2668,&quot;column&quot;:11}}">
            <div className="text-[13px] font-semibold text-white" data-qoder-id="qel-text-13px-c9cb327d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-13px-c9cb327d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-13px&quot;,&quot;loc&quot;:{&quot;line&quot;:2669,&quot;column&quot;:13}}">客服工作台</div>
            <div className="text-[10px] text-white" style={{ opacity: 0.75 }} data-qoder-id="qel-text-10px-7781e214" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-7781e214&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:2670,&quot;column&quot;:13}}">食安智能质检服务</div>
          </div>
          <button className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:bg-white/10" data-qoder-id="qel-w-6-c28bef49" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-6-c28bef49&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;w-6&quot;,&quot;loc&quot;:{&quot;line&quot;:2672,&quot;column&quot;:11}}">
            <Settings className="h-3.5 w-3.5 text-white" style={{ opacity: 0.7 }}  data-qoder-id="qel-h-3-5-04a389f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-04a389f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2673,&quot;column&quot;:13}}"/>
          </button>
        </div>

        {/* ── Quick Stats Bar ── */}
        <div className="flex gap-1.5 mt-3" data-qoder-id="qel-flex-b81ad433" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b81ad433&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2678,&quot;column&quot;:9}}">
          {[
            { label: '待处理', value: metrics.pendingOrders, color: '#ffa726' },
            { label: '今日质检', value: metrics.todayInspections, color: '#66bb6a' },
            { label: '红线预警', value: metrics.redLineAlerts, color: '#ef5350' },
            { label: '解决率', value: metrics.resolvedRate + '%', color: '#78909c' },
          ].map((stat, i) => (
            <div key={i} className="flex-1 rounded-lg px-2 py-1.5 text-center" style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(4px)',
            }} data-qoder-id="qel-flex-1-d1453b94" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-d1453b94&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2685,&quot;column&quot;:13}}">
              <div className="text-[12px] font-bold text-white" data-qoder-id="qel-text-12px-13aa58a1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-12px-13aa58a1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-12px&quot;,&quot;loc&quot;:{&quot;line&quot;:2689,&quot;column&quot;:15}}">{stat.value}</div>
              <div className="text-[8px] text-white" style={{ opacity: 0.65 }} data-qoder-id="qel-text-8px-94b43aad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-8px-94b43aad&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-8px&quot;,&quot;loc&quot;:{&quot;line&quot;:2690,&quot;column&quot;:15}}">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex px-2 pt-2 gap-1" style={{ borderBottom: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-flex-bc1ada7f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-bc1ada7f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2697,&quot;column&quot;:7}}">
        {panelItems.map(item => (
          <button
            key={item.id}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-medium transition-all relative rounded-t-lg"
            style={{
              color: activePanel === item.id ? '#3a3a3a' : 'var(--cursor-border-55)',
              background: activePanel === item.id ? 'var(--cursor-surface-300)' : 'transparent',
            }}
            onClick={() => setActivePanel(item.id)}
           data-qoder-id="qel-flex-1-7424306d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-7424306d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2699,&quot;column&quot;:11}}">
            <span style={{ display: 'flex', opacity: activePanel === item.id ? 1 : 0.5 }} data-qoder-id="qel-span-35d8f14b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-35d8f14b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:2708,&quot;column&quot;:13}}">{item.icon}</span>
            {item.label}
            {activePanel === item.id && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ background: '#3a3a3a' }}  data-qoder-id="qel-absolute-f8569649" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-f8569649&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:2711,&quot;column&quot;:15}}"/>
            )}
          </button>
        ))}
      </div>

      {/* ── Panel Content ── */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin" data-qoder-id="qel-flex-1-d2477bbe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-d2477bbe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2718,&quot;column&quot;:7}}">

        {/* ═══ 质检工单 Panel ═══ */}
        {activePanel === 'orders' && (
          <>
            {/* Search */}
            <div className="flex items-center gap-2 rounded-lg border px-2.5 py-2" style={{
              borderColor: 'var(--cursor-border-10)',
              background: 'var(--cursor-surface-300)',
            }} data-qoder-id="qel-flex-c11d20f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c11d20f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2724,&quot;column&quot;:13}}">
              <Search className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-c95b6de8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-c95b6de8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2728,&quot;column&quot;:15}}"/>
              <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-79decd56" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-79decd56&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:2729,&quot;column&quot;:15}}">搜索工单号 / 门店 / 类型...</span>
            </div>

            {/* Work Orders */}
            <div className="space-y-1.5" data-qoder-id="qel-space-y-1-5-641d1109" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-5-641d1109&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;space-y-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2733,&quot;column&quot;:13}}">
              <div className="text-[10px] font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-778420ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-778420ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:2734,&quot;column&quot;:15}}">
                近期工单
              </div>
              {workOrders.map((order, i) => (
                <div
                  key={order.id}
                  className="rounded-xl border overflow-hidden transition-all hover:shadow-sm cursor-pointer group"
                  style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cursor-surface-400)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--cursor-surface-300)' }}
                 data-qoder-id="qel-rounded-xl-7632b525" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-xl-7632b525&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;rounded-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:2738,&quot;column&quot;:17}}">
                  <div className="px-3 py-2.5" data-qoder-id="qel-px-3-51719398" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-51719398&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2745,&quot;column&quot;:19}}">
                    <div className="flex items-center justify-between mb-1.5" data-qoder-id="qel-flex-c61d28d4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c61d28d4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2746,&quot;column&quot;:21}}">
                      <div className="flex items-center gap-2" data-qoder-id="qel-flex-b50bc4f0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b50bc4f0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2747,&quot;column&quot;:23}}">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{
                          background: severityConfig[order.severity].bg + '18',
                          color: severityConfig[order.severity].color,
                        }} data-qoder-id="qel-px-1-5-8c479819" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-8c479819&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2748,&quot;column&quot;:25}}">
                          {severityConfig[order.severity].label}
                        </span>
                        <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-d9b14f34" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-d9b14f34&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:2754,&quot;column&quot;:25}}">{order.type}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-full text-[8px] font-semibold" style={{
                        background: statusConfig[order.status].color + '15',
                        color: statusConfig[order.status].color,
                      }} data-qoder-id="qel-px-1-5-8a4794f3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-5-8a4794f3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;px-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2756,&quot;column&quot;:23}}">
                        {statusConfig[order.status].label}
                      </span>
                    </div>
                    <div className="text-[9px] mb-1 truncate" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-6146639e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-6146639e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2763,&quot;column&quot;:21}}">{order.detail}</div>
                    <div className="flex items-center justify-between" data-qoder-id="qel-flex-ba0bcccf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-ba0bcccf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2764,&quot;column&quot;:21}}">
                      <span className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-0cc77191" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-0cc77191&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2765,&quot;column&quot;:23}}">{order.store}</span>
                      <span className="text-[9px]" style={{ color: 'var(--cursor-border-55)', opacity: 0.7 }} data-qoder-id="qel-text-9px-0bc76ffe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-0bc76ffe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2766,&quot;column&quot;:23}}">{order.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="space-y-1.5" data-qoder-id="qel-space-y-1-5-7123e145" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-5-7123e145&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;space-y-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2774,&quot;column&quot;:13}}">
              <div className="text-[10px] font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-747d602d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-747d602d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:2775,&quot;column&quot;:15}}">
                快捷指令
              </div>
              {[
                { label: '生成质检报告', desc: '汇总今日全部质检结果', color: '#3a3a3a', icon: <FileText className="h-3 w-3"  data-qoder-id="qel-h-3-7914266a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-7914266a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2779,&quot;column&quot;:80}}"/> },
                { label: '查看升级工单', desc: `${metrics.escalationQueue} 个待处理升级`, color: '#e74c3c', icon: <TrendingUp className="h-3 w-3"  data-qoder-id="qel-h-3-4c8a04cc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-4c8a04cc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2780,&quot;column&quot;:103}}"/> },
                { label: '导出统计数据', desc: 'CSV / Excel 格式导出', color: '#27ae60', icon: <BarChart3 className="h-3 w-3"  data-qoder-id="qel-h-3-6d256391" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-6d256391&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2781,&quot;column&quot;:86}}"/> },
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
                 data-qoder-id="qel-w-full-20ca0c0f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-20ca0c0f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:2783,&quot;column&quot;:17}}">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                    background: item.color + '15',
                    color: item.color,
                  }} data-qoder-id="qel-w-7-4d37b155" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-7-4d37b155&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;w-7&quot;,&quot;loc&quot;:{&quot;line&quot;:2793,&quot;column&quot;:19}}">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-d2568648" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-d2568648&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2799,&quot;column&quot;:19}}">
                    <div className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-17ff1216" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-17ff1216&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:2800,&quot;column&quot;:21}}">{item.label}</div>
                    <div className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-50488772" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-50488772&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2801,&quot;column&quot;:21}}">{item.desc}</div>
                  </div>
                  <ArrowRight className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: item.color }}  data-qoder-id="qel-h-3-1bbe74d6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-1bbe74d6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2803,&quot;column&quot;:19}}"/>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ═══ 数据看板 Panel ═══ */}
        {activePanel === 'analytics' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-2" data-qoder-id="qel-grid-a7e088f1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-a7e088f1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:2814,&quot;column&quot;:13}}">
              {[
                { label: '今日接待', value: '47', trend: '+12%', color: '#3a3a3a', icon: <Users className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-d659aa76" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-d659aa76&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2816,&quot;column&quot;:86}}"/> },
                { label: '平均响应', value: metrics.avgResponseTime, trend: '-8%', color: '#27ae60', icon: <Clock className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-36861253" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-36861253&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2817,&quot;column&quot;:104}}"/> },
                { label: '质检完成', value: metrics.todayInspections, trend: '+5', color: '#e67e22', icon: <CheckCircle2 className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-d1b95072" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-d1b95072&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2818,&quot;column&quot;:104}}"/> },
                { label: '解决率', value: metrics.resolvedRate + '%', trend: '+2.1%', color: '#8e44ad', icon: <TrendingUp className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-b08be57f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-b08be57f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2819,&quot;column&quot;:108}}"/> },
              ].map((kpi, i) => (
                <div key={i} className="rounded-xl border p-3" style={{
                  borderColor: 'var(--cursor-border-10)',
                  background: 'var(--cursor-surface-300)',
                }} data-qoder-id="qel-rounded-xl-093ed581" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-xl-093ed581&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;rounded-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:2821,&quot;column&quot;:17}}">
                  <div className="flex items-center justify-between mb-2" data-qoder-id="qel-flex-3e1119c9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-3e1119c9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2825,&quot;column&quot;:19}}">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{
                      background: kpi.color + '15',
                      color: kpi.color,
                    }} data-qoder-id="qel-w-6-75c4156f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-6-75c4156f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;w-6&quot;,&quot;loc&quot;:{&quot;line&quot;:2826,&quot;column&quot;:21}}">
                      {kpi.icon}
                    </div>
                    <span className="text-[8px] font-semibold px-1 py-0.5 rounded" style={{
                      background: kpi.trend.startsWith('+') || kpi.trend.startsWith('-8') ? '#27ae6015' : '#e74c3c15',
                      color: kpi.trend.startsWith('+') || kpi.trend.startsWith('-8') ? '#27ae60' : '#e74c3c',
                    }} data-qoder-id="qel-text-8px-e0c20eef" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-8px-e0c20eef&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-8px&quot;,&quot;loc&quot;:{&quot;line&quot;:2832,&quot;column&quot;:21}}">
                      {kpi.trend}
                    </span>
                  </div>
                  <div className="text-[14px] font-bold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-14px-328651ec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-14px-328651ec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-14px&quot;,&quot;loc&quot;:{&quot;line&quot;:2839,&quot;column&quot;:19}}">{kpi.value}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-d2410553" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-d2410553&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2840,&quot;column&quot;:19}}">{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Category Distribution */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-rounded-xl-073c93c4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-xl-073c93c4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;rounded-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:2846,&quot;column&quot;:13}}">
              <div className="px-3 py-2.5 text-[10px] font-semibold" style={{
                background: 'var(--cursor-surface-300)',
                color: 'var(--cursor-ink)',
                borderBottom: '1px solid var(--cursor-border-10)',
              }} data-qoder-id="qel-px-3-e27b7237" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-e27b7237&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2847,&quot;column&quot;:15}}">
                投诉类型分布
              </div>
              <div className="p-3 space-y-2.5" data-qoder-id="qel-p-3-e6dcf034" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-3-e6dcf034&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;p-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2854,&quot;column&quot;:15}}">
                {[
                  { label: '异物投诉', pct: 32, color: '#e74c3c' },
                  { label: '口味异常', pct: 25, color: '#e67e22' },
                  { label: '温度超标', pct: 18, color: '#f39c12' },
                  { label: '包装问题', pct: 15, color: '#2980b9' },
                  { label: '其他咨询', pct: 10, color: '#8e8e8e' },
                ].map((cat, i) => (
                  <div key={i} data-qoder-id="qel-div-c4574688" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-c4574688&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:2862,&quot;column&quot;:19}}">
                    <div className="flex items-center justify-between mb-1" data-qoder-id="qel-flex-4b136cd7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-4b136cd7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2863,&quot;column&quot;:21}}">
                      <span className="text-[10px]" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-10px-fae892c5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-fae892c5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:2864,&quot;column&quot;:23}}">{cat.label}</span>
                      <span className="text-[10px] font-semibold" style={{ color: cat.color }} data-qoder-id="qel-text-10px-f7e88e0c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-f7e88e0c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:2865,&quot;column&quot;:23}}">{cat.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--cursor-border-10)' }} data-qoder-id="qel-h-1-5-c672181b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-1-5-c672181b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2867,&quot;column&quot;:21}}">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${cat.pct}%`,
                        background: cat.color,
                        opacity: 0.8,
                      }}  data-qoder-id="qel-h-full-f98e872a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-full-f98e872a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-full&quot;,&quot;loc&quot;:{&quot;line&quot;:2868,&quot;column&quot;:23}}"/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly Volume */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-rounded-xl-003c88bf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-xl-003c88bf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;rounded-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:2880,&quot;column&quot;:13}}">
              <div className="px-3 py-2.5 text-[10px] font-semibold" style={{
                background: 'var(--cursor-surface-300)',
                color: 'var(--cursor-ink)',
                borderBottom: '1px solid var(--cursor-border-10)',
              }} data-qoder-id="qel-px-3-4b8d60a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-4b8d60a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2881,&quot;column&quot;:15}}">
                今日接待趋势
              </div>
              <div className="p-3" data-qoder-id="qel-p-3-e9d028fa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-3-e9d028fa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;p-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2888,&quot;column&quot;:15}}">
                <div className="flex items-end gap-1 h-16" data-qoder-id="qel-flex-bf29e9c2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-bf29e9c2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2889,&quot;column&quot;:17}}">
                  {[2, 5, 8, 12, 9, 15, 18, 14, 10, 7, 4, 3].map((v, i) => (
                    <div key={i} className="flex-1 rounded-t transition-all" style={{
                      height: `${(v / 18) * 100}%`,
                      background: i === 6 ? '#3a3a3a' : '#3a3a3a30',
                      minWidth: 4,
                    }}  data-qoder-id="qel-flex-1-c83622df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-c83622df&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2891,&quot;column&quot;:21}}"/>
                  ))}
                </div>
                <div className="flex justify-between mt-1.5" data-qoder-id="qel-flex-b929e050" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b929e050&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2898,&quot;column&quot;:17}}">
                  <span className="text-[8px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-8px-eec6a227" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-8px-eec6a227&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-8px&quot;,&quot;loc&quot;:{&quot;line&quot;:2899,&quot;column&quot;:19}}">8:00</span>
                  <span className="text-[8px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-8px-efc6a3ba" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-8px-efc6a3ba&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-8px&quot;,&quot;loc&quot;:{&quot;line&quot;:2900,&quot;column&quot;:19}}">14:00</span>
                  <span className="text-[8px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-8px-f0c6a54d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-8px-f0c6a54d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-8px&quot;,&quot;loc&quot;:{&quot;line&quot;:2901,&quot;column&quot;:19}}">20:00</span>
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
              <div className="space-y-1.5" data-qoder-id="qel-space-y-1-5-692e6209" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-5-692e6209&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;space-y-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2913,&quot;column&quot;:15}}">
                <div className="flex items-center gap-1.5 px-1" data-qoder-id="qel-flex-c629f4c7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c629f4c7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2914,&quot;column&quot;:17}}">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#e74c3c' }}  data-qoder-id="qel-w-1-5-c41ec5d9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-1-5-c41ec5d9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;w-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2915,&quot;column&quot;:19}}"/>
                  <span className="text-[10px] font-semibold" style={{ color: '#e74c3c' }} data-qoder-id="qel-text-10px-82ede60b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-82ede60b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:2916,&quot;column&quot;:19}}">红线预警</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{
                    background: '#e74c3c18',
                    color: '#e74c3c',
                  }} data-qoder-id="qel-text-9px-7ea7d15c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-7ea7d15c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2917,&quot;column&quot;:19}}">
                    {redLineAlerts.length}
                  </span>
                </div>
                {redLineAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="rounded-xl border overflow-hidden"
                    style={{ borderColor: '#e74c3c30', background: '#e74c3c05' }}
                   data-qoder-id="qel-rounded-xl-0a4ba307" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-xl-0a4ba307&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;rounded-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:2925,&quot;column&quot;:19}}">
                    <div className="px-3 py-2.5" data-qoder-id="qel-px-3-e18a7b2e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-e18a7b2e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2930,&quot;column&quot;:21}}">
                      <div className="flex items-center justify-between mb-1" data-qoder-id="qel-flex-be2c26c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-be2c26c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2931,&quot;column&quot;:23}}">
                        <div className="flex items-center gap-2" data-qoder-id="qel-flex-bd2c2533" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-bd2c2533&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2932,&quot;column&quot;:25}}">
                          <AlertTriangle className="h-3 w-3" style={{ color: '#e74c3c' }}  data-qoder-id="qel-h-3-b7f982c0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-b7f982c0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2933,&quot;column&quot;:27}}"/>
                          <span className="text-[11px] font-semibold" style={{ color: '#e74c3c' }} data-qoder-id="qel-text-11px-51a9bd57" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-51a9bd57&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:2934,&quot;column&quot;:27}}">{alert.type}</span>
                        </div>
                        <span className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-89a7e2ad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-89a7e2ad&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2936,&quot;column&quot;:25}}">{alert.time}</span>
                      </div>
                      <div className="text-[10px] mb-0.5" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-10px-621e6f71" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-621e6f71&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:2938,&quot;column&quot;:23}}">{alert.store}</div>
                      <div className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-ba986b06" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-ba986b06&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2939,&quot;column&quot;:23}}">{alert.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Store Health Overview */}
            <div className="space-y-1.5" data-qoder-id="qel-space-y-1-5-7f954aa8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-5-7f954aa8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;space-y-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:2947,&quot;column&quot;:13}}">
              <div className="text-[10px] font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-5f1e6ab8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-5f1e6ab8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:2948,&quot;column&quot;:15}}">
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
                 data-qoder-id="qel-flex-a7acdc13" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a7acdc13&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:2958,&quot;column&quot;:17}}">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                    background: store.color + '15',
                  }} data-qoder-id="qel-w-8-c37d65a5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-8-c37d65a5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;w-8&quot;,&quot;loc&quot;:{&quot;line&quot;:2965,&quot;column&quot;:19}}">
                    <span className="text-[11px] font-bold" style={{ color: store.color }} data-qoder-id="qel-text-11px-3403582f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-3403582f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:2968,&quot;column&quot;:21}}">{store.score}</span>
                  </div>
                  <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-b0e1b7a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-b0e1b7a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:2970,&quot;column&quot;:19}}">
                    <div className="text-[11px] font-medium truncate" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-31604c6e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-31604c6e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:2971,&quot;column&quot;:21}}">{store.store}</div>
                    <div className="text-[9px]" style={{ color: store.color }} data-qoder-id="qel-text-9px-c298779e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-c298779e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:2972,&quot;column&quot;:21}}">{store.status}</div>
                  </div>
                  <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--cursor-border-10)' }} data-qoder-id="qel-w-12-7d2bc82a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-12-7d2bc82a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;w-12&quot;,&quot;loc&quot;:{&quot;line&quot;:2974,&quot;column&quot;:19}}">
                    <div className="h-full rounded-full" style={{
                      width: `${store.score}%`,
                      background: store.color,
                      opacity: 0.7,
                    }}  data-qoder-id="qel-h-full-0a00fc78" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-full-0a00fc78&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-full&quot;,&quot;loc&quot;:{&quot;line&quot;:2975,&quot;column&quot;:21}}"/>
                  </div>
                </div>
              ))}
            </div>

            {/* Temperature Monitoring */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-rounded-xl-8567f5f3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-xl-8567f5f3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;rounded-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:2986,&quot;column&quot;:13}}">
              <div className="px-3 py-2.5 text-[10px] font-semibold" style={{
                background: 'var(--cursor-surface-300)',
                color: 'var(--cursor-ink)',
                borderBottom: '1px solid var(--cursor-border-10)',
              }} data-qoder-id="qel-px-3-5fe405c0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-5fe405c0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2987,&quot;column&quot;:15}}">
                冷链温度监控
              </div>
              <div className="p-3 space-y-2" data-qoder-id="qel-p-3-e512163f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-3-e512163f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;p-3&quot;,&quot;loc&quot;:{&quot;line&quot;:2994,&quot;column&quot;:15}}">
                {[
                  { label: '冷藏柜 A', temp: '4.2°C', status: '正常', color: '#27ae60' },
                  { label: '冷藏柜 B', temp: '5.1°C', status: '正常', color: '#27ae60' },
                  { label: '冷冻柜', temp: '-18.3°C', status: '正常', color: '#27ae60' },
                  { label: '展示冷柜', temp: '6.8°C', status: '偏高', color: '#e67e22' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between" data-qoder-id="qel-flex-aaaaa235" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-aaaaa235&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:3001,&quot;column&quot;:19}}">
                    <div className="flex items-center gap-2" data-qoder-id="qel-flex-a7aa9d7c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a7aa9d7c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:3002,&quot;column&quot;:21}}">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }}  data-qoder-id="qel-w-1-5-4302697b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-1-5-4302697b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;w-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:3003,&quot;column&quot;:23}}"/>
                      <span className="text-[10px]" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-10px-97967b9f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-97967b9f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:3004,&quot;column&quot;:23}}">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2" data-qoder-id="qel-flex-aeaaa881" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-aeaaa881&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:3006,&quot;column&quot;:21}}">
                      <span className="text-[10px] font-semibold" style={{ color: item.color }} data-qoder-id="qel-text-10px-8d8fb01c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-8d8fb01c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:3007,&quot;column&quot;:23}}">{item.temp}</span>
                      <span className="text-[8px] px-1 py-0.5 rounded" style={{
                        background: item.color + '15',
                        color: item.color,
                      }} data-qoder-id="qel-text-8px-cb450466" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-8px-cb450466&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-8px&quot;,&quot;loc&quot;:{&quot;line&quot;:3008,&quot;column&quot;:23}}">{item.status}</span>
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
            }} data-qoder-id="qel-rounded-xl-8b6a3dfc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-xl-8b6a3dfc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;rounded-xl&quot;,&quot;loc&quot;:{&quot;line&quot;:3019,&quot;column&quot;:13}}">
              <div className="flex items-center gap-1.5 mb-1" data-qoder-id="qel-flex-bca87ff4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-bca87ff4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:3024,&quot;column&quot;:15}}">
                <Sparkles className="h-3 w-3" style={{ color: '#3a3a3a' }}  data-qoder-id="qel-h-3-372f5404" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-372f5404&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:3025,&quot;column&quot;:17}}"/>
                <span className="font-semibold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-font-semibold-d327aa7d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-semibold-d327aa7d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;font-semibold&quot;,&quot;loc&quot;:{&quot;line&quot;:3026,&quot;column&quot;:17}}">智能巡检</span>
              </div>
              今日已自动完成 {metrics.todayInspections} 项质检，{metrics.redLineAlerts} 项红线预警待处理。系统建议优先处理上海南京路店温度超标工单。
            </div>
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--cursor-border-10)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-px-4-20be80d1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-20be80d1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:3035,&quot;column&quot;:7}}">
        <div className="flex items-center gap-2" data-qoder-id="qel-flex-b8a879a8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b8a879a8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:3036,&quot;column&quot;:9}}">
          <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{
            background: 'rgba(58,58,58,0.1)',
          }} data-qoder-id="qel-w-5-337bdce7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-5-337bdce7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;w-5&quot;,&quot;loc&quot;:{&quot;line&quot;:3037,&quot;column&quot;:11}}">
            <Shield className="h-3 w-3" style={{ color: '#3a3a3a' }}  data-qoder-id="qel-h-3-8584519d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-8584519d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:3040,&quot;column&quot;:13}}"/>
          </div>
          <div data-qoder-id="qel-div-aaebdc02" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-aaebdc02&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:3042,&quot;column&quot;:11}}">
            <div className="text-[10px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-10px-6920b90d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-6920b90d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:3043,&quot;column&quot;:13}}">智能质检工作台</div>
            <div className="text-[9px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-bf9ab17c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-bf9ab17c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;StaffWorkbench&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:3044,&quot;column&quot;:13}}">感知-决策-执行 全链路闭环</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Chat Interface ─── */
export default function ChatInterface({ role = 'consumer', ...qoderProps }) {
  const { id } = useParams()
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentConversation, setCurrentConversation] = useState(null)
  const [workflowTrace, setWorkflowTrace] = useState(null)
  const messagesEndRef = useRef(null)
  const streamAbortRef = useRef(null)
  const isSendingRef = useRef(false) // concurrent-send guard
  const _episodicMemoryRef = useRef(null) // Agent 情景记忆持久引用
  const backendConvIdRef = useRef(null) // Backend conversation ID for API continuity
  const [showTestRunner, setShowTestRunner] = useState(false)
  const [showOrderPanel, setShowOrderPanel] = useState(false)

  // ── Backend auto-login ──
  useEffect(() => {
    apiClient.autoLogin().then(user => {
      if (user) console.log('[ApiClient] Auto-login success:', user.username)
      else console.warn('[ApiClient] Auto-login failed, will use client-side LLM')
    })
  }, [])

  // Load conversation if navigating to a specific one
  useEffect(() => {
    if (id) {
      // 从 IndexedDB 加载真实对话历史
      getConversation(id).then(conv => {
        if (conv && conv.messages && conv.messages.length > 0) {
          setMessages(conv.messages)
          setCurrentConversation(conv)
        }
      }).catch(err => {
        console.warn('[ChatInterface] 加载对话失败:', err)
      })
    } else {
      setMessages([])
      setCurrentConversation(null)
      setWorkflowTrace(null)
      backendConvIdRef.current = null
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
  const simulateStream = useCallback(async (responseText, engineResult, llmSource = 'template', triggersData = null, backendMeta = null) => {
    setIsStreaming(true)
    streamAbortRef.current = false

    const aiMessage = {
      id: 'm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      llmSource,
      intent: backendMeta?.intent || null,
      subScenario: backendMeta?.subScenario || null,
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
      toolCallsMade: engineResult?.tool_calls_made || null,
      triggersData: triggersData || null,
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

    // ── 触发条件后续动作卡片 ──
    // 根据触发条件在回复后显示快捷操作按钮
    if (triggersData && triggersData.triggers && triggersData.triggers.length > 0) {
      const actions = []
      const triggerTypes = triggersData.triggers.map(t => t.type)
      const triggerSubtypes = triggersData.triggers.map(t => t.subtype).filter(Boolean)

      if (triggersData.shouldEscalate || triggerTypes.includes('emotion_escalation') || triggerTypes.includes('human_transfer')) {
        actions.push({ id: 'transfer_human', label: '转接人工客服', icon: '👤', color: '#e53e3e', action: 'transfer' })
      }
      if (triggerTypes.includes('food_safety') && (triggerSubtypes.includes('external_foreign') || triggerSubtypes.includes('body_discomfort') || triggerSubtypes.includes('spoilage'))) {
        actions.push({ id: 'upload_photo', label: '上传食安图片', icon: '📸', color: '#dd6b20', action: 'upload_image' })
      }
      if (triggerTypes.includes('compensation') || triggerSubtypes.includes('external_foreign') || triggerSubtypes.includes('body_discomfort')) {
        actions.push({ id: 'view_compensation', label: '查看补偿方案', icon: '💰', color: '#38a169', action: 'compensation' })
      }
      if (triggerTypes.includes('food_safety') && triggerSubtypes.includes('body_discomfort')) {
        actions.push({ id: 'medical_guide', label: '就医指引', icon: '🏥', color: '#e53e3e', action: 'medical' })
      }
      if (triggerSubtypes.includes('spoilage')) {
        actions.push({ id: 'batch_check', label: '同批次排查', icon: '🔍', color: '#805ad5', action: 'batch_check' })
      }

      if (actions.length > 0) {
        // 在回复完成后添加一个系统动作卡片消息
        const actionCard = {
          id: 'm-' + Date.now() + '-actions',
          role: 'system_action',
          content: '',
          timestamp: new Date().toISOString(),
          triggerActions: actions,
          triggersSummary: triggersData.triggers.map(t => t.reason).join('；'),
          emotionLevel: triggersData.emotionLevel,
          shouldEscalate: triggersData.shouldEscalate,
        }
        // 延迟添加，让回复先完整显示
        setTimeout(() => {
          setMessages((prev) => [...prev, actionCard])
        }, 300)
      }
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
    const externalPatterns = ['头发', '塑料', '金属', '玻璃', '虫子', '苍蝇', '蟑螂', '纸片', '线头', '创可贴', '烟头', '铁丝', '钢丝球', '刀片', '订书钉', '透明硬片', '吸管碎片', '包装膜']
    const isExternalForeign = externalPatterns.some(p => lower.includes(p))
    if (isExternalForeign) {
      triggers.push({ type: 'food_safety', subtype: 'external_foreign', action: 'compensate_and_report', reason: '外源性异物（头发/塑料/金属等非食品本身物质），需拍照留存、退款+优惠券补偿' })
    }

    // 4. 食安类型分类 — 内源性异物
    const internalPatterns = ['果核', '茶叶梗', '果肉块', '冰块碎', '珍珠没化', '椰果', '西米', '籽', '葡萄籽', '果籽', '核', '颗粒物', '沉淀物', '果肉残留', '果粒', '茶渣', '果皮', '水果纤维']
    const isInternalForeign = internalPatterns.some(p => lower.includes(p))
    if (isInternalForeign) {
      triggers.push({ type: 'food_safety', subtype: 'internal_foreign', action: 'remake_or_coupon', reason: '内源性异物（食品原料本身物质如未过滤的果核/籽等），安排重做或优惠券补偿' })
    }

    // 4.5 品质/品控投诉 → 也走食安分类（在没有明确食安关键词时仍可触发）
    const qualityPatterns = ['品控', '品质', '质量差', '质量不行', '卫生', '不干净', '品控不行']
    const isQualityComplaint = qualityPatterns.some(p => lower.includes(p))
    if (isQualityComplaint && !isExternalForeign && !isInternalForeign) {
      triggers.push({ type: 'food_safety', subtype: 'quality_complaint', action: 'info_collection_and_escalate', reason: '品质/品控投诉，可能涉及食安问题，需进一步收集具体信息后分类' })
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

    // 9. 非食安问题（排除已检测到的食安类型和品质投诉）
    const nonSafetyPatterns = ['推荐', '新品', '菜单', '营业时间', '地址', '加盟', '活动', '会员', '积分', '优惠券怎么领']
    const isNonSafety = nonSafetyPatterns.some(p => lower.includes(p)) && !isExternalForeign && !isInternalForeign && !isBodyDiscomfort && !isQualityComplaint
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

    // ── Backend API 优先路径 ──
    // 如果后端可用，通过后端获取 AI 回复（后端处理意图检测 + LLM 调用）
    if (apiClient.isAuthenticated()) {
      try {
        // 从文本中提取图片证据URL，通过 context 传递给后端
        const imageUrlMatches = text.match(/\[图片证据URL:\s*(.*?)\]/g)
        const imageUrls = imageUrlMatches
          ? imageUrlMatches.map(m => m.replace(/\[图片证据URL:\s*/, '').replace(/\]/, ''))
          : null
        const context = imageUrls ? { imageUrls } : null
        const backendResult = await apiClient.sendChat(text, backendConvIdRef.current, context)
        if (backendResult && backendResult.content) {
          backendConvIdRef.current = backendResult.conversationId
          const backendMeta = {
            intent: backendResult.intent || backendResult.metadata?.intent || null,
            subScenario: backendResult.metadata?.subScenario || null,
          }
          setTimeout(() => simulateStream(backendResult.content, null, 'backend', null, backendMeta), 600)
          // 异步持久化到 IndexedDB
          try {
            const convRecord = buildConversationRecord(
              currentConversation?.id || backendResult.conversationId,
              [...currentMessages, userMessage, {
                id: 'm-' + Date.now(),
                role: 'assistant',
                content: backendResult.content,
                timestamp: backendResult.createdAt,
                llmSource: 'backend',
                intent: backendMeta.intent,
                subScenario: backendMeta.subScenario,
              }],
              { sessionId: backendResult.conversationId, intent: backendMeta.intent, subScenario: backendMeta.subScenario }
            )
            saveAndSync(convRecord).then(() => {
              window.dispatchEvent(new Event('conversation-updated'))
            }).catch(() => {})
          } catch {}
          return
        }
      } catch (e) {
        console.warn('[Backend] Chat API failed, falling back to client-side LLM:', e.message)
      }
    }

    // Snapshot current messages for this send cycle
    const currentMessages = messages

    // ── 快速意图检测 ──
    const orderIntent = detectOrderIntent(text)
    let detectedIntent = null // null = 食安流程 (默认)
    let _hasFoodSignal = false

    if (orderIntent) {
      detectedIntent = 'ordering'
    } else {
      // 食安信号检测
      const foodSafetySignals = [
        '异物', '头发', '塑料', '金属', '玻璃', '虫', '苍蝇', '蟑螂', '纸片', '线头',
        '果核', '籽', '茶渣', '果皮', '果肉', '沉淀', '纤维', '颗粒物',
        '拉肚子', '腹泻', '呕吐', '过敏', '恶心', '头晕', '发烧', '不舒服', '肚子',
        '变质', '发霉', '过期', '馊', '酸了', '异味', '怪味', '品控', '品质', '质量',
        '退款', '赔偿', '补偿', '优惠券', '投诉', '曝光', '差评',
        '包装破', '漏杯', '撒了', '封口',
        '食安', '食品安全', '卫生', '不干净',
      ]
      const lowerText = text.toLowerCase()
      _hasFoodSignal = foodSafetySignals.some(kw => lowerText.includes(kw))
      const hasFoodSafetySignal = _hasFoodSignal
      if (!hasFoodSafetySignal && text.length >= 2) {
        detectedIntent = 'general_knowledge'
      }
    }

    // ── 意图继承：多轮点单对话中，后续消息自动继承 ordering 意图 ──
    // 解决"阿喜问位置→用户回答地址"但地址文本没有点单关键词导致路由到 general_knowledge 的问题
    // 注意：有食安信号时不继承（留给食安通道），其他 null/general_knowledge 可继承
    if (detectedIntent !== 'ordering' && !_hasFoodSignal) {
      const chatHistory = [...currentMessages].filter(m => m.role === 'user' || m.role === 'assistant')
      const lastAssistant = [...chatHistory].reverse().find(m => m.role === 'assistant')
      if (lastAssistant) {
        const aContent = lastAssistant.content || ''
        const isOrderingContext = /门店|位置|城市|地址|哪.*店|选.*店|哪家|自提|配送|点单|糖度|冰量|少冰|去冰|几分糖|确认.*订单|确认.*商品|回复.*序号|回复.*确认/i.test(aContent)
        const isFollowupReply = /^(确认|好的|就这个|换一家|不要了|已支付|还没支付|支付了|对|是|不是|不了|可以|行|ok|好|嗯|\d{1,2})$/i.test(text.trim())
        if (isOrderingContext || isFollowupReply) {
          detectedIntent = 'ordering'
        }
      }
    }

    let finalReply = null
    let llmSource = 'template'
    let engineResult = null
    let triggers = null

    // ── 对话记忆处理 ──
    const sessionId = currentConversation?.id || `sess-${Date.now()}`
    const allChatMessages = [...currentMessages, userMessage].filter(m => m.role === 'user' || m.role === 'assistant')
    let memoryContext = processAndUpdateMemory(sessionId, allChatMessages.map(m => ({ role: m.role, content: m.content })))
    const memoryManager = getOrCreateMemory(sessionId)
    const enhancedHistory = memoryManager.getEnhancedHistory(allChatMessages.map(m => ({ role: m.role, content: m.content })))

    // ── MemOS 跨会话记忆主动检索 ──
    // 每轮对话开始时，从 MemOS 搜索与当前消息相关的历史记忆
    // 特别是新会话或对话初期（本地记忆为空时）效果最显著
    if (isMemoryAvailable()) {
      try {
        const memosResult = await Promise.race([
          searchMemory(text, 5),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
        ])
        const memosText = formatSearchResult(memosResult)
        if (memosText && memosText !== '暂无相关记忆。') {
          const separator = memoryContext ? '\n\n' : ''
          memoryContext = `${memoryContext}${separator}## 跨会话长期记忆 (MemOS)\n${memosText}`
        }
      } catch {
        // MemOS 搜索超时或失败，静默降级
      }
    }

    // ══════════════════════════════════════════════════════════
    // 非食安通道：纯 LLM API 调用（点单 / 通用知识）
    // ══════════════════════════════════════════════════════════
    if (detectedIntent === 'general_knowledge' || detectedIntent === 'ordering') {
      let intentTools = null
      try {
        // 点单意图：完整 MCP 工具 + 扩展工具（搜索/记忆/视觉/技能）
        // 通用知识意图：只提供扩展工具（搜索/记忆），让阿喜能联网回答和记住用户
        const allTools = getToolDefinitionsForLLM()
        if (detectedIntent === 'ordering') {
          intentTools = allTools
        } else {
          // 通用知识：只注入搜索和记忆工具（不含点单工具）
          intentTools = allTools.filter(t =>
            ['web_search', 'recall_memory', 'add_memory'].includes(t.function?.name)
          )
          if (intentTools.length === 0) intentTools = null
        }
      } catch { intentTools = null }

      try {
        const llmResult = await generateLLMEnhancedReply({
          userText: text,
          session: { sessionId, turnIndex: currentMessages.filter(m => m.role === 'user').length },
          conversationHistory: enhancedHistory,
          memoryContext,
          intent: detectedIntent,
          tools: intentTools,
        })
        if (llmResult.reply) {
          finalReply = llmResult.reply
          llmSource = llmResult.source
        }
      } catch (e) {
        console.warn('LLM direct call failed:', e)
      }

      // 非食安兜底：绝不用食安模板
      if (!finalReply) {
        finalReply = detectedIntent === 'ordering'
          ? '阿喜很乐意帮您点单，您可以告诉阿喜想喝什么，或者点击右下角点单按钮打开点单面板。'
          : '抱歉，这个问题阿喜暂时答不上来。关于喜茶饮品、门店或点单的问题，阿喜一定尽力帮您。'
        llmSource = 'fallback'
      }
    }

    // ══════════════════════════════════════════════════════════
    // 食安通道：LLM + 规则约束（分类器/补偿矩阵/工作流 共同约束 LLM）
    // ══════════════════════════════════════════════════════════
    if (!finalReply) {
      // Step 1: Agent Engine — 规则引擎提取感知上下文
      try {
        engineResult = processMessageWithAgent(text, {
          sessionId,
          turnIndex: currentMessages.filter(m => m.role === 'user').length,
          _episodicMemory: _episodicMemoryRef.current,
        })
        if (engineResult._episodicMemory) {
          _episodicMemoryRef.current = engineResult._episodicMemory
        }
      } catch (e) {
        console.warn('Agent engine error:', e)
      }

      // Step 1.5: 业务触发条件检测
      triggers = detectBusinessTriggers(text)

      // Step 2: LLM 生成回复（系统提示包含规则约束）
      try {
        const llmResult = await generateLLMEnhancedReply({
          userText: text,
          session: { sessionId, turnIndex: currentMessages.filter(m => m.role === 'user').length },
          perception: engineResult?.agent_framework?.perception ? {
            ...engineResult.agent_framework.perception,
            _raw_classification: engineResult?.classification || null,
            _triggers: triggers,
          } : null,
          decision: engineResult?.agent_framework?.decision || null,
          conversationHistory: enhancedHistory,
          memoryContext,
        })
        if (llmResult.reply) {
          finalReply = llmResult.reply
          llmSource = llmResult.source
          if (engineResult?.agent_framework) {
            if (llmResult.reasoning_content) engineResult.agent_framework.llm_reasoning = llmResult.reasoning_content
            engineResult.agent_framework.llm_model = llmResult.model
            engineResult.agent_framework.llm_usage = llmResult.usage
          }
        }
      } catch (e) {
        console.warn('LLM food safety reply failed:', e)
      }

      // 食安兜底：使用规则引擎的模板回复
      if (!finalReply) {
        finalReply = engineResult?.reply || generateStreamingResponse(text)
        llmSource = 'template'
      }

      // Step 5: 订单工作流
      try {
        const orderResult = executeOrderWorkflow({ userInput: text, conversation: sessionId, orderId: '' })
        if (orderResult && orderResult.scene !== '其他') {
          engineResult = { ...(engineResult || {}), orderResult }
        }
      } catch (e) { console.warn('Order workflow error:', e) }
    }

    // Step 4: 内容安全检查
    let safetyResult = null
    try {
      safetyResult = runFullSafetyCheck(text)
    } catch (e) {
      console.warn('Safety check error:', e)
    }

    // 将安全检查结果附加到 agent_framework
    if (safetyResult && engineResult?.agent_framework) {
      engineResult.agent_framework.safety = safetyResult
    }

    // 最终防线: 清除回复中的 emoji（严禁 emoji 策略）
    if (finalReply && typeof finalReply === 'string') {
      finalReply = finalReply.replace(
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu,
        ''
      ).replace(/\s{2,}/g, ' ').trim()
    }

    setTimeout(() => simulateStream(finalReply, engineResult, llmSource, triggers), 600)

    // ── MemOS 跨会话记忆自动存储 ──
    // 每轮对话结束后异步存储到 MemOS，不阻塞 UI
    if (isMemoryAvailable() && finalReply && finalReply.length > 10) {
      addMemory({
        userMessage: text,
        assistantMessage: finalReply,
        conversationId: sessionId,
        tags: ['heytea', detectedIntent || 'general'],
      }).catch(err => console.warn('[MemOS] 自动存储失败:', err.message))
    }

    // ── IndexedDB 对话历史持久化存储 ──
    // 将完整对话（含新消息）保存到 IndexedDB，同步到 MemOS 向量知识库
    try {
      const allMessages = [...currentMessages, userMessage, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: finalReply || '',
        timestamp: new Date().toISOString(),
      }].filter(m => m.role === 'user' || m.role === 'assistant')

      const record = buildConversationRecord(sessionId, allMessages, {
        timestamp: currentMessages.length === 0 ? Date.now() : undefined,
        intent: detectedIntent,
        classification: engineResult?.classification || null,
        label: engineResult?.classification?.consult_type || '',
        riskLevel: engineResult?.classification?.risk_level || 'low',
        handler: 'AI',
      })

      saveAndSync(record).then(() => {
        // 通知 Sidebar 刷新对话列表
        window.dispatchEvent(new Event('conversation-updated'))
      }).catch(err => console.warn('[IndexedDB] 对话保存失败:', err.message))
    } catch (err) {
      console.warn('[IndexedDB] 构建对话记录失败:', err.message)
    }

    } finally {
      isSendingRef.current = false
    }
  }

  const handleStop = () => {
    streamAbortRef.current = true
  }

  const hasMessages = messages.length > 0

  return (
    <div className={["flex h-full", qoderProps?.className].filter(Boolean).join(" ")} data-component="chat-interface" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col min-w-0" data-qoder-id="qel-flex-1-271acee2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-271acee2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:3432,&quot;column&quot;:7}}">
        {/* Session header */}
        {currentConversation && (
          <SessionHeaderBar conversation={currentConversation}  data-qoder-id="qel-sessionheaderbar-e4a481e5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sessionheaderbar-e4a481e5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;sessionheaderbar&quot;,&quot;loc&quot;:{&quot;line&quot;:3435,&quot;column&quot;:11}}"/>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col" data-qoder-id="qel-flex-1-251acbbc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-251acbbc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:3439,&quot;column&quot;:9}}">
          {hasMessages ? (
            <div className="mx-auto max-w-[820px] px-4 py-6" data-qoder-id="qel-mx-auto-2bc498af" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mx-auto-2bc498af&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;mx-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:3441,&quot;column&quot;:13}}">
              <div className="space-y-4" data-qoder-id="qel-space-y-4-48f4a26c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-4-48f4a26c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;space-y-4&quot;,&quot;loc&quot;:{&quot;line&quot;:3442,&quot;column&quot;:15}}">
                {messages.map((msg, idx) => (
                  msg.role === 'system_action' ? (
                    <TriggerActionCard key={msg.id} message={msg} onSend={handleSend}  data-qoder-id="qel-triggeractioncard-e6cca929" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-triggeractioncard-e6cca929&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;triggeractioncard&quot;,&quot;loc&quot;:{&quot;line&quot;:3445,&quot;column&quot;:21}}"/>
                  ) : (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      onSend={handleSend}
                      isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === 'assistant'}
                     data-qoder-id="qel-messagebubble-563556b1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-messagebubble-563556b1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;messagebubble&quot;,&quot;loc&quot;:{&quot;line&quot;:3447,&quot;column&quot;:21}}"/>
                  )
                ))}
              </div>

              {/* Workflow trace — hidden (internal detail, not shown to users) */}

              {/* Red-line audit — hidden (internal detail) */}

              {/* Agent trace — hidden (internal detail) */}

              <div ref={messagesEndRef}  data-qoder-id="qel-div-3bfa6882" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-3bfa6882&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:3462,&quot;column&quot;:15}}"/>
            </div>
          ) : (
            <WelcomeScreen onSend={handleSend}  data-qoder-id="qel-welcomescreen-6e497b03" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-welcomescreen-6e497b03&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;welcomescreen&quot;,&quot;loc&quot;:{&quot;line&quot;:3465,&quot;column&quot;:13}}"/>
          )}
        </div>

        {/* Input bar */}
        <ChatInputBar
          onSend={handleSend}
          isStreaming={isStreaming}
          onStop={handleStop}
         data-qoder-id="qel-chatinputbar-509bec12" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-chatinputbar-509bec12&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;chatinputbar&quot;,&quot;loc&quot;:{&quot;line&quot;:3470,&quot;column&quot;:9}}"/>
      </div>

      {/* Consumer Workbench — 消费者端专属右侧面板 */}
      {role === 'consumer' && (
        <ConsumerWorkbench messages={messages} onSend={handleSend}  data-qoder-id="qel-consumerworkbench-87ba3c15" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-consumerworkbench-87ba3c15&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;consumerworkbench&quot;,&quot;loc&quot;:{&quot;line&quot;:3479,&quot;column&quot;:9}}"/>
      )}

      {/* Staff Workbench — 客服工作台专属右侧面板 */}
      {role === 'staff' && (
        <StaffWorkbench messages={messages}  data-qoder-id="qel-staffworkbench-d8910a70" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-staffworkbench-d8910a70&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;staffworkbench&quot;,&quot;loc&quot;:{&quot;line&quot;:3484,&quot;column&quot;:9}}"/>
      )}

      {/* Floating Service Widget — 可拖拽智能客服悬浮窗 */}
      <FloatingServiceWidget onSend={handleSend} role={role}  data-qoder-id="qel-floatingservicewidget-3e7c73d7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-floatingservicewidget-3e7c73d7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;floatingservicewidget&quot;,&quot;loc&quot;:{&quot;line&quot;:3488,&quot;column&quot;:7}}"/>

      {/* Test Runner Toggle — 循环测试入口 */}
      <button
        onClick={() => setShowTestRunner(prev => !prev)}
        title="循环测试打分"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 900,
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: 'none',
          background: showTestRunner ? '#1a1a2e' : 'white',
          color: showTestRunner ? 'white' : '#4a5568',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
        }}
       data-qoder-id="qel-button-4872d784" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-4872d784&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:3491,&quot;column&quot;:7}}">
        🧪
      </button>

      {/* Ordering Panel Toggle — 自助点单入口 */}
      <button
        onClick={() => setShowOrderPanel(prev => !prev)}
        title="自助点单"
        style={{
          position: 'fixed',
          bottom: '72px',
          right: '20px',
          zIndex: 900,
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: 'none',
          background: showOrderPanel ? '#555' : 'white',
          color: showOrderPanel ? 'white' : '#333',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
        }} data-qoder-id="qel-button-3f72c959" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-3f72c959&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:3526,&quot;column&quot;:7}}">
        🧋
      </button>

      {/* Ordering Panel — 自助点单面板 */}
      {showOrderPanel && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '420px',
          height: '100vh',
          zIndex: 1000,
          boxShadow: '-4px 0 20px rgba(0,0,0,0.12)',
          background: '#fff',
          animation: 'slideIn 0.3s ease-out',
        }} data-qoder-id="qel-div-43fa751a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-43fa751a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:3552,&quot;column&quot;:9}}">
          <OrderingPanel
            onClose={() => setShowOrderPanel(false)}
            onOrderCreated={(order) => {
              // 在聊天中插入订单确认消息
              const orderMsg = {
                id: Date.now(),
                role: 'assistant',
                content: `✅ 订单创建成功！\n\n订单号：${order.orderId}\n门店：${order.storeInfo?.storeName || '喜茶门店'}\n金额：¥${order.orderPayAmount?.toFixed(2) || '0.00'}\n${order.takeMealCodeInfo?.code ? `取餐码：${order.takeMealCodeInfo.code}` : '支付完成后可查看取餐码'}`,
                timestamp: new Date(),
              }
              setMessages(prev => [...prev, orderMsg])
            }}
            embedded={false}
           data-qoder-id="qel-orderingpanel-f2f7c714" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-orderingpanel-f2f7c714&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;orderingpanel&quot;,&quot;loc&quot;:{&quot;line&quot;:3563,&quot;column&quot;:11}}"/>
        </div>
      )}

      {/* Test Runner Panel — 循环测试打分面板 */}
      {showTestRunner && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '380px',
          height: '100vh',
          zIndex: 1000,
          boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
          background: '#fafafa',
          animation: 'slideIn 0.3s ease-out',
        }} data-qoder-id="qel-div-44fa76ad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-44fa76ad&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:3518,&quot;column&quot;:9}}">
          <button
            onClick={() => setShowTestRunner(false)}
            style={{
              position: 'absolute', top: '12px', right: '12px', zIndex: 10,
              width: '28px', height: '28px', borderRadius: '50%',
              border: 'none', background: 'rgba(255,255,255,0.8)',
              color: '#4a5568', cursor: 'pointer', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
           data-qoder-id="qel-button-3e72c7c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-3e72c7c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:3529,&quot;column&quot;:11}}">
            ✕
          </button>
          <TestRunnerPanel  data-qoder-id="qel-testrunnerpanel-6cd2eff8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-testrunnerpanel-6cd2eff8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/ChatInterface.jsx&quot;,&quot;componentName&quot;:&quot;ChatInterface&quot;,&quot;elementRole&quot;:&quot;testrunnerpanel&quot;,&quot;loc&quot;:{&quot;line&quot;:3541,&quot;column&quot;:11}}"/>
        </div>
      )}
    </div>
  )
}
