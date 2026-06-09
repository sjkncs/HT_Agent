import { useState } from 'react'
import {
  Clock, Bell, ShieldAlert, RefreshCw, Star, Heart, Truck,
  ChevronDown, ChevronRight, Tag, MapPin,
  Layers, Zap, ArrowRight, Sparkles, CheckCircle2
} from 'lucide-react'
import { UNIFIED_INTENT_TAXONOMY, INTENT_TAXONOMY_STATS } from '../../lib/mock-data.js'

const ICON_MAP = { Clock, Bell, ShieldAlert, RefreshCw, Star, Heart, Truck }

const RISK_COLORS = {
  low: { bg: 'rgba(46,204,113,0.12)', text: '#27ae60', border: 'rgba(46,204,113,0.3)' },
  medium: { bg: 'rgba(243,156,18,0.12)', text: '#e67e22', border: 'rgba(243,156,18,0.3)' },
  'medium~high': { bg: 'rgba(231,76,60,0.12)', text: '#e74c3c', border: 'rgba(231,76,60,0.3)' },
  high: { bg: 'rgba(231,76,60,0.15)', text: '#c0392b', border: 'rgba(231,76,60,0.4)' },
  critical: { bg: 'rgba(192,57,43,0.2)', text: '#922b21', border: 'rgba(192,57,43,0.5)' },
}

// ─── Overview Stats Bar ───
function StatsBar(qoderProps) {
  const stats = [
    { label: '一级分类', value: INTENT_TAXONOMY_STATS.totalCategories, color: '#f54e00' },
    { label: '二级子分类', value: INTENT_TAXONOMY_STATS.totalSubcategories, color: '#3498db' },
    { label: '现有5路场景', value: INTENT_TAXONOMY_STATS.existingScenesCovered, color: '#27ae60' },
    { label: '食安标签映射', value: INTENT_TAXONOMY_STATS.foodSafetyLabelsMapped, color: '#e74c3c' },
    { label: '预测新场景', value: INTENT_TAXONOMY_STATS.predictedScenes, color: '#9b59b6' },
  ]
  return (
    <div className={["flex items-center gap-3 px-4 py-3 border-b flex-wrap", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ borderColor: 'var(--cursor-border-10)' }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-flex-c3e9fd3a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-c3e9fd3a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;StatsBar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:31,&quot;column&quot;:9}}">
          <span className="text-lg font-bold" style={{ color: s.color }} data-qoder-id="qel-text-lg-e17339d4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-lg-e17339d4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;StatsBar&quot;,&quot;elementRole&quot;:&quot;text-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:32,&quot;column&quot;:11}}">{s.value}</span>
          <span className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-88bc92a6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-88bc92a6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;StatsBar&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:33,&quot;column&quot;:11}}">{s.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Subcategory Detail Card ───
function SubcategoryCard({ sub, catId, ...qoderProps }) {
  const risk = RISK_COLORS[sub.riskLevel] || RISK_COLORS.low
  return (
    <div className={["rounded-lg p-3 mb-2 border", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ background: 'var(--cursor-surface-200)', borderColor: 'var(--cursor-border-10)' }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2" data-qoder-id="qel-flex-b3e42e06" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b3e42e06&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:46,&quot;column&quot;:7}}">
        <div className="flex items-center gap-2" data-qoder-id="qel-flex-b4e42f99" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b4e42f99&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:47,&quot;column&quot;:9}}">
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--cursor-surface-500)', color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-10px-b00ebced" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-b00ebced&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:48,&quot;column&quot;:11}}">{sub.id}</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-afc19cb3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-afc19cb3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:49,&quot;column&quot;:11}}">{sub.name}</span>
          {sub.originalScene && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(39,174,96,0.12)', color: '#27ae60' }} data-qoder-id="qel-text-10px-ee1d66f6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-ee1d66f6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:51,&quot;column&quot;:13}}">
              <CheckCircle2 className="h-3 w-3"  data-qoder-id="qel-h-3-689c55a6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-689c55a6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:52,&quot;column&quot;:15}}"/> 现有场景
            </span>
          )}
          {sub.mappedCount && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c' }} data-qoder-id="qel-text-10px-ec1d63d0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-ec1d63d0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:56,&quot;column&quot;:13}}">
              映射 {sub.mappedCount} 个食安标签
            </span>
          )}
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: risk.bg, color: risk.text, border: `1px solid ${risk.border}` }} data-qoder-id="qel-text-10px-ed1d6563" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-ed1d6563&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:61,&quot;column&quot;:9}}">
          风险 {sub.riskLevel}
        </span>
      </div>

      {/* Keywords */}
      {sub.keywords && (
        <div className="flex items-start gap-1.5 mb-2 flex-wrap" data-qoder-id="qel-flex-743b90d1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-743b90d1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:68,&quot;column&quot;:9}}">
          <Tag className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-e03d9ca4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-e03d9ca4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:69,&quot;column&quot;:11}}"/>
          {sub.keywords.slice(0, 8).map((kw, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--cursor-surface-400)', color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-f01d6a1c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-f01d6a1c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:71,&quot;column&quot;:13}}">{kw}</span>
          ))}
          {sub.keywords.length > 8 && <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-f11d6baf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-f11d6baf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:73,&quot;column&quot;:39}}">+{sub.keywords.length - 8}</span>}
        </div>
      )}

      {/* Handling Flow */}
      <div className="text-[11px] mb-2 flex items-start gap-1.5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-686c8f46" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-686c8f46&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:78,&quot;column&quot;:7}}">
        <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0"  data-qoder-id="qel-h-3-b6c7d7cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-b6c7d7cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:79,&quot;column&quot;:9}}"/>
        <span data-qoder-id="qel-span-8849e994" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-8849e994&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:80,&quot;column&quot;:9}}">{sub.handlingFlow}</span>
      </div>

      {/* Compensation & Escalation */}
      <div className="flex gap-3 flex-wrap" data-qoder-id="qel-flex-df3e77d9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-df3e77d9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:84,&quot;column&quot;:7}}">
        <div className="text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(52,152,219,0.08)', color: '#2980b9' }} data-qoder-id="qel-text-10px-503bfc3a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-503bfc3a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:85,&quot;column&quot;:9}}">
          补偿: {sub.compensationRule}
        </div>
        <div className="text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(155,89,182,0.08)', color: '#8e44ad' }} data-qoder-id="qel-text-10px-513bfdcd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-513bfdcd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:88,&quot;column&quot;:9}}">
          升级: {sub.escalationRule}
        </div>
      </div>

      {/* Related Food Safety Labels */}
      {sub.foodSafetyLabels && sub.foodSafetyLabels.length > 0 && (
        <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-mt-2-a87874c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-a87874c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:95,&quot;column&quot;:9}}">
          <div className="flex items-center gap-1 mb-1" data-qoder-id="qel-flex-e33e7e25" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-e33e7e25&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:96,&quot;column&quot;:11}}">
            <ShieldAlert className="h-3 w-3" style={{ color: '#e74c3c' }}  data-qoder-id="qel-h-3-c61e0f79" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-c61e0f79&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:97,&quot;column&quot;:13}}"/>
            <span className="text-[10px] font-medium" style={{ color: '#e74c3c' }} data-qoder-id="qel-text-10px-811a7cc8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-811a7cc8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:98,&quot;column&quot;:13}}">关联食安标签:</span>
          </div>
          <div className="flex flex-wrap gap-1" data-qoder-id="qel-flex-e63e82de" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-e63e82de&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:100,&quot;column&quot;:11}}">
            {sub.foodSafetyLabels.map((label, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(231,76,60,0.08)', color: '#c0392b', border: '1px solid rgba(231,76,60,0.2)' }} data-qoder-id="qel-text-10px-7f1a79a2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-7f1a79a2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;SubcategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:102,&quot;column&quot;:15}}">
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Predicted Scene Card ───
function PredictedCard({ scene, ...qoderProps }) {
  const risk = RISK_COLORS[scene.priority] || RISK_COLORS.medium
  return (
    <div className={["rounded-lg p-2.5 border", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ background: 'var(--cursor-surface-200)', borderColor: 'var(--cursor-border-10)' }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="flex items-center justify-between mb-1.5" data-qoder-id="qel-flex-82835b9a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-82835b9a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;PredictedCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:118,&quot;column&quot;:7}}">
        <div className="flex items-center gap-1.5" data-qoder-id="qel-flex-81835a07" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-81835a07&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;PredictedCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:119,&quot;column&quot;:9}}">
          <Sparkles className="h-3 w-3" style={{ color: '#9b59b6' }}  data-qoder-id="qel-h-3-775b5f73" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-775b5f73&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;PredictedCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:120,&quot;column&quot;:11}}"/>
          <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-a746249f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-a746249f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;PredictedCard&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:121,&quot;column&quot;:11}}">{scene.name}</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: risk.bg, color: risk.text }} data-qoder-id="qel-text-9px-1f008b4f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-1f008b4f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;PredictedCard&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:123,&quot;column&quot;:9}}">
          {scene.priority}
        </span>
      </div>
      <p className="text-[10px] mb-1.5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-0983d068" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-0983d068&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;PredictedCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:127,&quot;column&quot;:7}}">{scene.description}</p>
      <div className="flex flex-wrap gap-1" data-qoder-id="qel-flex-7c835228" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-7c835228&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;PredictedCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:128,&quot;column&quot;:7}}">
        {scene.triggerKeywords.slice(0, 5).map((kw, i) => (
          <span key={i} className="text-[9px] px-1 py-0.5 rounded" style={{ background: 'rgba(155,89,182,0.08)', color: '#8e44ad' }} data-qoder-id="qel-text-9px-22009008" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-22009008&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;PredictedCard&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:130,&quot;column&quot;:11}}">{kw}</span>
        ))}
      </div>
    </div>
  )
}

// ─── Category Card ───
function CategoryCard({ category, ...qoderProps }) {
  const [expanded, setExpanded] = useState(category.id === 'C')
  const IconComp = ICON_MAP[category.icon] || Layers
  const subcats = category.subcategories || []
  const predicted = category.predictedScenes || []

  return (
    <div className={["rounded-xl border mb-3 overflow-hidden", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-100)' }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Category Header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:opacity-90"
        style={{ background: expanded ? 'var(--cursor-surface-300)' : 'var(--cursor-surface-200)' }}
        onClick={() => setExpanded(!expanded)}
       data-qoder-id="qel-w-full-f8ff1cd3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-f8ff1cd3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:147,&quot;column&quot;:7}}">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0" style={{ background: category.color + '18', color: category.color }} data-qoder-id="qel-flex-09951f05" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-09951f05&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:152,&quot;column&quot;:9}}">
          <IconComp className="h-4 w-4"  data-qoder-id="qel-h-4-c6ebb14f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-c6ebb14f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:153,&quot;column&quot;:11}}"/>
        </div>
        <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-fcef8931" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-fcef8931&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:155,&quot;column&quot;:9}}">
          <div className="flex items-center gap-2" data-qoder-id="qel-flex-04951726" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-04951726&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:156,&quot;column&quot;:11}}">
            <span className="text-xs font-mono font-bold" style={{ color: category.color }} data-qoder-id="qel-text-xs-fda91102" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-fda91102&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:157,&quot;column&quot;:13}}">{category.id}</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-d4ee7a38" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-d4ee7a38&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:158,&quot;column&quot;:13}}">{category.name}</span>
            <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-a65f3f90" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-a65f3f90&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:159,&quot;column&quot;:13}}">{category.nameEn}</span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-0cda12b4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-0cda12b4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:161,&quot;column&quot;:11}}">{category.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0" data-qoder-id="qel-flex-11952b9d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-11952b9d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:163,&quot;column&quot;:9}}">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--cursor-surface-400)', color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-275c390c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-275c390c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:164,&quot;column&quot;:11}}">
            {subcats.length} 子分类
          </span>
          {predicted.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(155,89,182,0.1)', color: '#8e44ad' }} data-qoder-id="qel-text-10px-285c3a9f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-285c3a9f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:168,&quot;column&quot;:13}}">
              +{predicted.length} 预测
            </span>
          )}
          {expanded ? <ChevronDown className="h-4 w-4" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-4-ebfed669" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-ebfed669&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:172,&quot;column&quot;:23}}"/> : <ChevronRight className="h-4 w-4" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-4-6996a9c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-6996a9c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:172,&quot;column&quot;:106}}"/>}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-px-4-94706bbd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-94706bbd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:178,&quot;column&quot;:9}}">
          {/* Existing Scenes Badge */}
          {category.existingScenes.length > 0 && (
            <div className="flex items-center gap-2 mb-3" data-qoder-id="qel-flex-919833b4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-919833b4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:181,&quot;column&quot;:13}}">
              <span className="text-[10px] font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-255c35e6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-255c35e6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:182,&quot;column&quot;:15}}">覆盖现有场景:</span>
              {category.existingScenes.map((s, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(39,174,96,0.1)', color: '#27ae60' }} data-qoder-id="qel-text-10px-265c3779" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-265c3779&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:184,&quot;column&quot;:17}}">
                  <CheckCircle2 className="h-3 w-3"  data-qoder-id="qel-h-3-fd2ec6bf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-fd2ec6bf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:185,&quot;column&quot;:19}}"/>{s}
                </span>
              ))}
            </div>
          )}

          {/* Food Safety Mapping */}
          {category.foodSafetyMapping.length > 0 && (
            <div className="flex items-start gap-2 mb-3" data-qoder-id="qel-flex-859820d0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-859820d0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:193,&quot;column&quot;:13}}">
              <span className="text-[10px] font-medium mt-0.5" style={{ color: '#e74c3c' }} data-qoder-id="qel-text-10px-b963daa7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-b963daa7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:194,&quot;column&quot;:15}}">食安映射:</span>
              <div className="flex flex-wrap gap-1" data-qoder-id="qel-flex-fd908ef3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-fd908ef3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:195,&quot;column&quot;:15}}">
                {category.foodSafetyMapping.map((s, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(231,76,60,0.08)', color: '#c0392b' }} data-qoder-id="qel-text-10px-bb63ddcd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-bb63ddcd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:197,&quot;column&quot;:19}}">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Subcategories */}
          {subcats.length > 0 && (
            <div className="mb-3" data-qoder-id="qel-mb-3-a6024675" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-3-a6024675&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;mb-3&quot;,&quot;loc&quot;:{&quot;line&quot;:205,&quot;column&quot;:13}}">
              <div className="flex items-center gap-1.5 mb-2" data-qoder-id="qel-flex-009093ac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-009093ac&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:206,&quot;column&quot;:15}}">
                <Layers className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-eb988e33" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-eb988e33&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:207,&quot;column&quot;:17}}"/>
                <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-001a54f4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-001a54f4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:208,&quot;column&quot;:17}}">子分类详情</span>
              </div>
              {subcats.map((sub, i) => (
                <SubcategoryCard key={i} sub={sub} catId={category.id}  data-qoder-id="qel-subcategorycard-4ff9234b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-subcategorycard-4ff9234b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;subcategorycard&quot;,&quot;loc&quot;:{&quot;line&quot;:211,&quot;column&quot;:17}}"/>
              ))}
            </div>
          )}

          {/* Predicted Scenes */}
          {predicted.length > 0 && (
            <div data-qoder-id="qel-div-5670f9a6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5670f9a6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:218,&quot;column&quot;:13}}">
              <div className="flex items-center gap-1.5 mb-2" data-qoder-id="qel-flex-05909b8b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-05909b8b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:219,&quot;column&quot;:15}}">
                <Sparkles className="h-3 w-3" style={{ color: '#9b59b6' }}  data-qoder-id="qel-h-3-5c1f77e2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5c1f77e2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:220,&quot;column&quot;:17}}"/>
                <span className="text-[11px] font-medium" style={{ color: '#8e44ad' }} data-qoder-id="qel-text-11px-031c9844" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-031c9844&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:221,&quot;column&quot;:17}}">预测未来场景</span>
                <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-b1618f78" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-b1618f78&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:222,&quot;column&quot;:17}}">(基于真实会话数据分析)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2" data-qoder-id="qel-grid-1ea1e7e5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-1ea1e7e5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:224,&quot;column&quot;:15}}">
                {predicted.map((scene, i) => (
                  <PredictedCard key={i} scene={scene}  data-qoder-id="qel-predictedcard-39172503" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-predictedcard-39172503&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;CategoryCard&quot;,&quot;elementRole&quot;:&quot;predictedcard&quot;,&quot;loc&quot;:{&quot;line&quot;:226,&quot;column&quot;:19}}"/>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Mapping Diagram ───
function MappingDiagram(qoderProps) {
  return (
    <div className={["rounded-xl border p-4 mb-4", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-100)' }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-901aad3d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-901aad3d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;MappingDiagram&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:241,&quot;column&quot;:7}}">
        <MapPin className="h-4 w-4" style={{ color: '#f54e00' }}  data-qoder-id="qel-h-4-0628024b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-0628024b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;MappingDiagram&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:242,&quot;column&quot;:9}}"/>
        场景归类映射图
      </h3>
      <div className="grid grid-cols-7 gap-2" data-qoder-id="qel-grid-ba0322ad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-ba0322ad&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;MappingDiagram&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:245,&quot;column&quot;:7}}">
        {UNIFIED_INTENT_TAXONOMY.map((cat) => {
          const IconComp = ICON_MAP[cat.icon] || Layers
          const totalScenes = (cat.subcategories?.length || 0) + (cat.predictedScenes?.length || 0)
          const existingCount = cat.existingScenes.length
          const fsCount = cat.foodSafetyMapping.length
          return (
            <div key={cat.id} className="text-center rounded-lg p-2 border" style={{ borderColor: cat.color + '40', background: cat.color + '08' }} data-qoder-id="qel-text-center-96dd979f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-center-96dd979f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;MappingDiagram&quot;,&quot;elementRole&quot;:&quot;text-center&quot;,&quot;loc&quot;:{&quot;line&quot;:252,&quot;column&quot;:13}}">
              <div className="flex justify-center mb-1.5" data-qoder-id="qel-flex-71d165e3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-71d165e3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;MappingDiagram&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:253,&quot;column&quot;:15}}">
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: cat.color + '20', color: cat.color }} data-qoder-id="qel-flex-70d16450" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-70d16450&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;MappingDiagram&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:254,&quot;column&quot;:17}}">
                  <IconComp className="h-3.5 w-3.5"  data-qoder-id="qel-h-3-5-ce48b993" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-ce48b993&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;MappingDiagram&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:255,&quot;column&quot;:19}}"/>
                </div>
              </div>
              <div className="text-[10px] font-bold mb-0.5" style={{ color: cat.color }} data-qoder-id="qel-text-10px-b15608f6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-b15608f6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;MappingDiagram&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:258,&quot;column&quot;:15}}">{cat.id}.{cat.name}</div>
              <div className="space-y-0.5" data-qoder-id="qel-space-y-0-5-ac24164f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-0-5-ac24164f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;MappingDiagram&quot;,&quot;elementRole&quot;:&quot;space-y-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:259,&quot;column&quot;:15}}">
                {existingCount > 0 && (
                  <div className="text-[9px] px-1 rounded" style={{ background: 'rgba(39,174,96,0.1)', color: '#27ae60' }} data-qoder-id="qel-text-9px-d839111a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-d839111a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;MappingDiagram&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:261,&quot;column&quot;:19}}">
                    现有 {existingCount}
                  </div>
                )}
                {fsCount > 0 && (
                  <div className="text-[9px] px-1 rounded" style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c' }} data-qoder-id="qel-text-9px-d7390f87" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-d7390f87&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;MappingDiagram&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:266,&quot;column&quot;:19}}">
                    食安 {fsCount}
                  </div>
                )}
                <div className="text-[9px] px-1 rounded" style={{ background: 'var(--cursor-surface-400)', color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-d6390df4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-d6390df4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;MappingDiagram&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:270,&quot;column&quot;:17}}">
                  共 {totalScenes} 场景
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Panel ───
export default function IntentTaxonomyPanel(qoderProps) {
  const [viewMode, setViewMode] = useState('taxonomy') // taxonomy | mapping

  return (
    <div className={["h-full overflow-y-auto", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ background: 'var(--cursor-canvas)' }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)' }} data-qoder-id="qel-px-4-7d5576d8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-7d5576d8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;IntentTaxonomyPanel&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:289,&quot;column&quot;:7}}">
        <div className="flex items-center justify-between" data-qoder-id="qel-flex-6a231454" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-6a231454&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;IntentTaxonomyPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:290,&quot;column&quot;:9}}">
          <div data-qoder-id="qel-div-cdbb6e23" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-cdbb6e23&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;IntentTaxonomyPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:291,&quot;column&quot;:11}}">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-62d3a914" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-62d3a914&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;IntentTaxonomyPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:292,&quot;column&quot;:13}}">
              统一意图分类体系
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-345ed961" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-345ed961&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;IntentTaxonomyPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:295,&quot;column&quot;:13}}">
              覆盖订单处理5路场景 + 食安23标签 + 预测未来场景 · 7大类16子分类
            </p>
          </div>
          <div className="flex items-center gap-1" data-qoder-id="qel-flex-66230e08" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-66230e08&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;IntentTaxonomyPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:299,&quot;column&quot;:11}}">
            <button
              className="text-[10px] px-2.5 py-1 rounded-md transition-colors"
              style={{
                background: viewMode === 'taxonomy' ? 'var(--cursor-orange)' : 'var(--cursor-surface-300)',
                color: viewMode === 'taxonomy' ? '#fff' : 'var(--cursor-border-55)',
              }}
              onClick={() => setViewMode('taxonomy')}
             data-qoder-id="qel-text-10px-19d3f328" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-19d3f328&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;IntentTaxonomyPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:300,&quot;column&quot;:13}}">
              分类详情
            </button>
            <button
              className="text-[10px] px-2.5 py-1 rounded-md transition-colors"
              style={{
                background: viewMode === 'mapping' ? 'var(--cursor-orange)' : 'var(--cursor-surface-300)',
                color: viewMode === 'mapping' ? '#fff' : 'var(--cursor-border-55)',
              }}
              onClick={() => setViewMode('mapping')}
             data-qoder-id="qel-text-10px-1cd3f7e1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-1cd3f7e1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;IntentTaxonomyPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:310,&quot;column&quot;:13}}">
              映射总览
            </button>
          </div>
        </div>
      </div>

      <StatsBar  data-qoder-id="qel-statsbar-1aea11b1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-statsbar-1aea11b1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;IntentTaxonomyPanel&quot;,&quot;elementRole&quot;:&quot;statsbar&quot;,&quot;loc&quot;:{&quot;line&quot;:324,&quot;column&quot;:7}}"/>

      <div className="p-4" data-qoder-id="qel-p-4-204537c2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-4-204537c2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;IntentTaxonomyPanel&quot;,&quot;elementRole&quot;:&quot;p-4&quot;,&quot;loc&quot;:{&quot;line&quot;:326,&quot;column&quot;:7}}">
        {viewMode === 'mapping' && <MappingDiagram  data-qoder-id="qel-mappingdiagram-05bd858d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mappingdiagram-05bd858d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;IntentTaxonomyPanel&quot;,&quot;elementRole&quot;:&quot;mappingdiagram&quot;,&quot;loc&quot;:{&quot;line&quot;:327,&quot;column&quot;:36}}"/>}

        {/* Category Cards */}
        {UNIFIED_INTENT_TAXONOMY.map((cat) => (
          <CategoryCard key={cat.id} category={cat}  data-qoder-id="qel-categorycard-137bba4c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-categorycard-137bba4c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/IntentTaxonomyPanel.jsx&quot;,&quot;componentName&quot;:&quot;IntentTaxonomyPanel&quot;,&quot;elementRole&quot;:&quot;categorycard&quot;,&quot;loc&quot;:{&quot;line&quot;:331,&quot;column&quot;:11}}"/>
        ))}
      </div>
    </div>
  )
}
