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
function StatsBar() {
  const stats = [
    { label: '一级分类', value: INTENT_TAXONOMY_STATS.totalCategories, color: '#f54e00' },
    { label: '二级子分类', value: INTENT_TAXONOMY_STATS.totalSubcategories, color: '#3498db' },
    { label: '现有5路场景', value: INTENT_TAXONOMY_STATS.existingScenesCovered, color: '#27ae60' },
    { label: '食安标签映射', value: INTENT_TAXONOMY_STATS.foodSafetyLabelsMapped, color: '#e74c3c' },
    { label: '预测新场景', value: INTENT_TAXONOMY_STATS.predictedScenes, color: '#9b59b6' },
  ]
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b flex-wrap" style={{ borderColor: 'var(--cursor-border-10)' }}>
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--cursor-surface-300)' }}>
          <span className="text-lg font-bold" style={{ color: s.color }}>{s.value}</span>
          <span className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Subcategory Detail Card ───
function SubcategoryCard({ sub, catId }) {
  const risk = RISK_COLORS[sub.riskLevel] || RISK_COLORS.low
  return (
    <div className="rounded-lg p-3 mb-2 border" style={{ background: 'var(--cursor-surface-200)', borderColor: 'var(--cursor-border-10)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--cursor-surface-500)', color: 'var(--cursor-ink)' }}>{sub.id}</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--cursor-ink)' }}>{sub.name}</span>
          {sub.originalScene && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(39,174,96,0.12)', color: '#27ae60' }}>
              <CheckCircle2 className="h-3 w-3" /> 现有场景
            </span>
          )}
          {sub.mappedCount && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c' }}>
              映射 {sub.mappedCount} 个食安标签
            </span>
          )}
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: risk.bg, color: risk.text, border: `1px solid ${risk.border}` }}>
          风险 {sub.riskLevel}
        </span>
      </div>

      {/* Keywords */}
      {sub.keywords && (
        <div className="flex items-start gap-1.5 mb-2 flex-wrap">
          <Tag className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }} />
          {sub.keywords.slice(0, 8).map((kw, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--cursor-surface-400)', color: 'var(--cursor-border-55)' }}>{kw}</span>
          ))}
          {sub.keywords.length > 8 && <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>+{sub.keywords.length - 8}</span>}
        </div>
      )}

      {/* Handling Flow */}
      <div className="text-[11px] mb-2 flex items-start gap-1.5" style={{ color: 'var(--cursor-border-55)' }}>
        <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <span>{sub.handlingFlow}</span>
      </div>

      {/* Compensation & Escalation */}
      <div className="flex gap-3 flex-wrap">
        <div className="text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(52,152,219,0.08)', color: '#2980b9' }}>
          补偿: {sub.compensationRule}
        </div>
        <div className="text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(155,89,182,0.08)', color: '#8e44ad' }}>
          升级: {sub.escalationRule}
        </div>
      </div>

      {/* Related Food Safety Labels */}
      {sub.foodSafetyLabels && sub.foodSafetyLabels.length > 0 && (
        <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--cursor-border-10)' }}>
          <div className="flex items-center gap-1 mb-1">
            <ShieldAlert className="h-3 w-3" style={{ color: '#e74c3c' }} />
            <span className="text-[10px] font-medium" style={{ color: '#e74c3c' }}>关联食安标签:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {sub.foodSafetyLabels.map((label, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(231,76,60,0.08)', color: '#c0392b', border: '1px solid rgba(231,76,60,0.2)' }}>
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
function PredictedCard({ scene }) {
  const risk = RISK_COLORS[scene.priority] || RISK_COLORS.medium
  return (
    <div className="rounded-lg p-2.5 border" style={{ background: 'var(--cursor-surface-200)', borderColor: 'var(--cursor-border-10)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" style={{ color: '#9b59b6' }} />
          <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }}>{scene.name}</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: risk.bg, color: risk.text }}>
          {scene.priority}
        </span>
      </div>
      <p className="text-[10px] mb-1.5" style={{ color: 'var(--cursor-border-55)' }}>{scene.description}</p>
      <div className="flex flex-wrap gap-1">
        {scene.triggerKeywords.slice(0, 5).map((kw, i) => (
          <span key={i} className="text-[9px] px-1 py-0.5 rounded" style={{ background: 'rgba(155,89,182,0.08)', color: '#8e44ad' }}>{kw}</span>
        ))}
      </div>
    </div>
  )
}

// ─── Category Card ───
function CategoryCard({ category }) {
  const [expanded, setExpanded] = useState(category.id === 'C')
  const IconComp = ICON_MAP[category.icon] || Layers
  const subcats = category.subcategories || []
  const predicted = category.predictedScenes || []

  return (
    <div className="rounded-xl border mb-3 overflow-hidden" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-100)' }}>
      {/* Category Header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:opacity-90"
        style={{ background: expanded ? 'var(--cursor-surface-300)' : 'var(--cursor-surface-200)' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0" style={{ background: category.color + '18', color: category.color }}>
          <IconComp className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold" style={{ color: category.color }}>{category.id}</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--cursor-ink)' }}>{category.name}</span>
            <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>{category.nameEn}</span>
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }}>{category.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--cursor-surface-400)', color: 'var(--cursor-border-55)' }}>
            {subcats.length} 子分类
          </span>
          {predicted.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(155,89,182,0.1)', color: '#8e44ad' }}>
              +{predicted.length} 预测
            </span>
          )}
          {expanded ? <ChevronDown className="h-4 w-4" style={{ color: 'var(--cursor-border-55)' }} /> : <ChevronRight className="h-4 w-4" style={{ color: 'var(--cursor-border-55)' }} />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--cursor-border-10)' }}>
          {/* Existing Scenes Badge */}
          {category.existingScenes.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-medium" style={{ color: 'var(--cursor-border-55)' }}>覆盖现有场景:</span>
              {category.existingScenes.map((s, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(39,174,96,0.1)', color: '#27ae60' }}>
                  <CheckCircle2 className="h-3 w-3" />{s}
                </span>
              ))}
            </div>
          )}

          {/* Food Safety Mapping */}
          {category.foodSafetyMapping.length > 0 && (
            <div className="flex items-start gap-2 mb-3">
              <span className="text-[10px] font-medium mt-0.5" style={{ color: '#e74c3c' }}>食安映射:</span>
              <div className="flex flex-wrap gap-1">
                {category.foodSafetyMapping.map((s, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(231,76,60,0.08)', color: '#c0392b' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Subcategories */}
          {subcats.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Layers className="h-3 w-3" style={{ color: 'var(--cursor-border-55)' }} />
                <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }}>子分类详情</span>
              </div>
              {subcats.map((sub, i) => (
                <SubcategoryCard key={i} sub={sub} catId={category.id} />
              ))}
            </div>
          )}

          {/* Predicted Scenes */}
          {predicted.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3 w-3" style={{ color: '#9b59b6' }} />
                <span className="text-[11px] font-medium" style={{ color: '#8e44ad' }}>预测未来场景</span>
                <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>(基于真实会话数据分析)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {predicted.map((scene, i) => (
                  <PredictedCard key={i} scene={scene} />
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
function MappingDiagram() {
  return (
    <div className="rounded-xl border p-4 mb-4" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-100)' }}>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--cursor-ink)' }}>
        <MapPin className="h-4 w-4" style={{ color: '#f54e00' }} />
        场景归类映射图
      </h3>
      <div className="grid grid-cols-7 gap-2">
        {UNIFIED_INTENT_TAXONOMY.map((cat) => {
          const IconComp = ICON_MAP[cat.icon] || Layers
          const totalScenes = (cat.subcategories?.length || 0) + (cat.predictedScenes?.length || 0)
          const existingCount = cat.existingScenes.length
          const fsCount = cat.foodSafetyMapping.length
          return (
            <div key={cat.id} className="text-center rounded-lg p-2 border" style={{ borderColor: cat.color + '40', background: cat.color + '08' }}>
              <div className="flex justify-center mb-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: cat.color + '20', color: cat.color }}>
                  <IconComp className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-[10px] font-bold mb-0.5" style={{ color: cat.color }}>{cat.id}.{cat.name}</div>
              <div className="space-y-0.5">
                {existingCount > 0 && (
                  <div className="text-[9px] px-1 rounded" style={{ background: 'rgba(39,174,96,0.1)', color: '#27ae60' }}>
                    现有 {existingCount}
                  </div>
                )}
                {fsCount > 0 && (
                  <div className="text-[9px] px-1 rounded" style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c' }}>
                    食安 {fsCount}
                  </div>
                )}
                <div className="text-[9px] px-1 rounded" style={{ background: 'var(--cursor-surface-400)', color: 'var(--cursor-border-55)' }}>
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
export default function IntentTaxonomyPanel() {
  const [viewMode, setViewMode] = useState('taxonomy') // taxonomy | mapping

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--cursor-canvas)' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--cursor-border-10)', background: 'var(--cursor-surface-400)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--cursor-ink)' }}>
              统一意图分类体系
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }}>
              覆盖订单处理5路场景 + 食安23标签 + 预测未来场景 · 7大类16子分类
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="text-[10px] px-2.5 py-1 rounded-md transition-colors"
              style={{
                background: viewMode === 'taxonomy' ? 'var(--cursor-orange)' : 'var(--cursor-surface-300)',
                color: viewMode === 'taxonomy' ? '#fff' : 'var(--cursor-border-55)',
              }}
              onClick={() => setViewMode('taxonomy')}
            >
              分类详情
            </button>
            <button
              className="text-[10px] px-2.5 py-1 rounded-md transition-colors"
              style={{
                background: viewMode === 'mapping' ? 'var(--cursor-orange)' : 'var(--cursor-surface-300)',
                color: viewMode === 'mapping' ? '#fff' : 'var(--cursor-border-55)',
              }}
              onClick={() => setViewMode('mapping')}
            >
              映射总览
            </button>
          </div>
        </div>
      </div>

      <StatsBar />

      <div className="p-4">
        {viewMode === 'mapping' && <MappingDiagram />}

        {/* Category Cards */}
        {UNIFIED_INTENT_TAXONOMY.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </div>
  )
}
