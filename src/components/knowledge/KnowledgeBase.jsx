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
function TreeNode({ category, selectedId, onSelect, level = 0, ...qoderProps }) {
  const [expanded, setExpanded] = useState(level === 0)
  const hasChildren = category.children && category.children.length > 0
  const Icon = categoryIcons[category.icon] || BookOpen

  return (
    <div style={qoderProps?.style} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
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
       data-qoder-id="qel-button-07f7f13f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-07f7f13f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;TreeNode&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:42,&quot;column&quot;:7}}">
        {hasChildren ? (
          expanded ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-5-c4e03295" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-c4e03295&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;TreeNode&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:55,&quot;column&quot;:22}}"/>
            : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-5-76f8313a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-76f8313a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;TreeNode&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:56,&quot;column&quot;:15}}"/>
        ) : (
          <span className="w-3.5"  data-qoder-id="qel-w-3-5-bc68b913" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-3-5-bc68b913&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;TreeNode&quot;,&quot;elementRole&quot;:&quot;w-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:58,&quot;column&quot;:11}}"/>
        )}
        <Icon className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-4-6b0a6f7d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-6b0a6f7d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;TreeNode&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:60,&quot;column&quot;:9}}"/>
        <span className="flex-1 truncate text-left" data-qoder-id="qel-flex-1-ac91fd59" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-ac91fd59&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;TreeNode&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:61,&quot;column&quot;:9}}">{category.name}</span>
        <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-82a4d610" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-82a4d610&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;TreeNode&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:62,&quot;column&quot;:9}}">{category.count}</span>
        {category.riskLevel && (
          <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{
            background: category.riskLevel === 'high' ? 'var(--cursor-error)' :
              category.riskLevel === 'medium' ? 'var(--cursor-gold)' : 'var(--cursor-success)',
          }}  data-qoder-id="qel-h-1-5-71579d21" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-1-5-71579d21&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;TreeNode&quot;,&quot;elementRole&quot;:&quot;h-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:64,&quot;column&quot;:11}}"/>
        )}
      </Button>

      {expanded && hasChildren && (
        <div data-qoder-id="qel-div-4b8604ce" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4b8604ce&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;TreeNode&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:72,&quot;column&quot;:9}}">
          {category.children.map((child) => (
            <TreeNode
              key={child.id}
              category={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
             data-qoder-id="qel-treenode-c2b7beb1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-treenode-c2b7beb1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;TreeNode&quot;,&quot;elementRole&quot;:&quot;treenode&quot;,&quot;loc&quot;:{&quot;line&quot;:74,&quot;column&quot;:13}}"/>
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

function BoundaryPairsPanel(qoderProps) {
  return (
    <div className={["rounded-lg p-4", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({
      border: '1px solid var(--cursor-border-10)',
      background: 'var(--cursor-surface-100)',
    }), ...(qoderProps?.style) }} data-component="boundary-pairs" data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="mb-3 flex items-center gap-2" data-qoder-id="qel-mb-3-e32be600" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-3-e32be600&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;BoundaryPairsPanel&quot;,&quot;elementRole&quot;:&quot;mb-3&quot;,&quot;loc&quot;:{&quot;line&quot;:108,&quot;column&quot;:7}}">
        <ArrowRightLeft className="h-4 w-4" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-4-9793bc64" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-9793bc64&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;BoundaryPairsPanel&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:109,&quot;column&quot;:9}}"/>
        <h4 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-429d9c1a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-429d9c1a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;BoundaryPairsPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:110,&quot;column&quot;:9}}">
          已知边界混淆对 (10组)
        </h4>
      </div>
      <p className="mb-3 text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mb-3-8f560ea8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-3-8f560ea8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;BoundaryPairsPanel&quot;,&quot;elementRole&quot;:&quot;mb-3&quot;,&quot;loc&quot;:{&quot;line&quot;:114,&quot;column&quot;:7}}">
        这些分类对在实际案例中容易混淆，贝叶斯分类器会检测边界风险并触发人工复核。
      </p>
      <div className="space-y-1.5" data-qoder-id="qel-space-y-1-5-d9f5d43b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-5-d9f5d43b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;BoundaryPairsPanel&quot;,&quot;elementRole&quot;:&quot;space-y-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:117,&quot;column&quot;:7}}">
        {KNOWN_BOUNDARY_PAIRS_DISPLAY.map((bp, i) => (
          <div key={i} className="boundary-pair" data-qoder-id="qel-boundary-pair-1265a4c9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-boundary-pair-1265a4c9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;BoundaryPairsPanel&quot;,&quot;elementRole&quot;:&quot;boundary-pair&quot;,&quot;loc&quot;:{&quot;line&quot;:119,&quot;column&quot;:11}}">
            <span className="text-xs font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-1da586a5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-1da586a5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;BoundaryPairsPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:120,&quot;column&quot;:13}}">
              {bp.pair[0]}
            </span>
            <ArrowRightLeft className="h-3 w-3 boundary-pair__arrow"  data-qoder-id="qel-h-3-9af8bbec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-9af8bbec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;BoundaryPairsPanel&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:123,&quot;column&quot;:13}}"/>
            <span className="text-xs font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-1da3480e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-1da3480e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;BoundaryPairsPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:124,&quot;column&quot;:13}}">
              {bp.pair[1]}
            </span>
            <span className="ml-auto text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-ml-auto-bd43edf3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-auto-bd43edf3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;BoundaryPairsPanel&quot;,&quot;elementRole&quot;:&quot;ml-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:127,&quot;column&quot;:13}}">
              {bp.risk}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Entry Detail Panel ─── */
function EntryDetail({ entry, ...qoderProps }) {
  if (!entry) {
    return (
      <div className={["flex h-full flex-col items-center justify-center text-center", qoderProps?.className].filter(Boolean).join(" ")} data-component="entry-detail-empty" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
        <FlaskConical className="mb-3 h-10 w-10" style={{ color: 'var(--cursor-border-20)' }}  data-qoder-id="qel-mb-3-c05d390d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-3-c05d390d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mb-3&quot;,&quot;loc&quot;:{&quot;line&quot;:142,&quot;column&quot;:9}}"/>
        <p className="text-sm" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-sm-5da7f561" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-5da7f561&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:143,&quot;column&quot;:9}}">
          选择一个分类查看详细信息
        </p>
      </div>
    )
  }

  const riskLevel = entry.riskLevel || 'medium'

  return (
    <div className="animate-fade-in" data-component="entry-detail" data-qoder-id="qel-entry-detail-f91ee94b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-entry-detail-f91ee94b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;entry-detail&quot;,&quot;loc&quot;:{&quot;line&quot;:153,&quot;column&quot;:5}}">
      <div className="mb-4 flex items-start gap-3" data-qoder-id="qel-mb-4-104f0fe8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-104f0fe8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:154,&quot;column&quot;:7}}">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: 'var(--cursor-surface-500)' }}
         data-qoder-id="qel-flex-b4ee6012" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b4ee6012&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:155,&quot;column&quot;:9}}">
          <Shield className="h-5 w-5" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-5-0924f4f6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-5-0924f4f6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;h-5&quot;,&quot;loc&quot;:{&quot;line&quot;:159,&quot;column&quot;:11}}"/>
        </div>
        <div data-qoder-id="qel-div-4f411285" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4f411285&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:161,&quot;column&quot;:9}}">
          <h3 className="text-base font-semibold cursor-display" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-base-d3364384" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-base-d3364384&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;text-base&quot;,&quot;loc&quot;:{&quot;line&quot;:162,&quot;column&quot;:11}}">
            {entry.name}
          </h3>
          <div className="mt-1 flex items-center gap-2" data-qoder-id="qel-mt-1-159cea11" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-159cea11&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:165,&quot;column&quot;:11}}">
            <span className={riskBadgeClass[riskLevel]} data-qoder-id="qel-span-cfdd45a8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-cfdd45a8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:166,&quot;column&quot;:13}}">
              {riskLabel[riskLevel]}
            </span>
            {entry.count !== undefined && (
              <span className="text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-5746e6bc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-5746e6bc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:170,&quot;column&quot;:15}}">
                历史 {entry.count} 例
              </span>
            )}
          </div>
        </div>
      </div>

      {entry.description && (
        <div className="mb-4" data-qoder-id="qel-mb-4-8e4c04ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-8e4c04ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:179,&quot;column&quot;:9}}">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mb-2-c7b5dce7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-2-c7b5dce7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mb-2&quot;,&quot;loc&quot;:{&quot;line&quot;:180,&quot;column&quot;:11}}">
            分类描述
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-4baa17a2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-4baa17a2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:183,&quot;column&quot;:11}}">
            {entry.description}
          </p>
        </div>
      )}

      {/* Keywords */}
      {entry.keywords && entry.keywords.length > 0 && (
        <div className="mb-4" data-qoder-id="qel-mb-4-894bfccc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-894bfccc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:191,&quot;column&quot;:9}}">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mb-2-bcb5cb96" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-2-bcb5cb96&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mb-2&quot;,&quot;loc&quot;:{&quot;line&quot;:192,&quot;column&quot;:11}}">
            关键词 (贝叶斯似然)
          </h4>
          <div className="flex flex-wrap gap-1.5" data-qoder-id="qel-flex-28f393dc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-28f393dc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:195,&quot;column&quot;:11}}">
            {entry.keywords.map(kw => (
              <span key={kw} className="tag-pill text-xs" data-qoder-id="qel-tag-pill-f41bead1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tag-pill-f41bead1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;tag-pill&quot;,&quot;loc&quot;:{&quot;line&quot;:197,&quot;column&quot;:15}}">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {/* Real Patterns - Solutions & Compensation (from 38,644 conversations) */}
      {entry.realPatterns && (
        <div className="mb-4 grid grid-cols-2 gap-3" data-qoder-id="qel-mb-4-8d49c481" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-8d49c481&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:205,&quot;column&quot;:9}}">
          <div className="rounded-lg p-3" style={{
            border: '1px solid var(--cursor-border-10)',
            background: 'var(--cursor-surface-300)',
          }} data-qoder-id="qel-rounded-lg-78d4d28b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-78d4d28b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:206,&quot;column&quot;:11}}">
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mb-1-5-7e30f0af" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-1-5-7e30f0af&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mb-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:210,&quot;column&quot;:13}}">
              真实方案类型
            </h4>
            <div className="flex flex-wrap gap-1 mb-1.5" data-qoder-id="qel-flex-25f38f23" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-25f38f23&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:213,&quot;column&quot;:13}}">
              {entry.realPatterns.solutions.map((s, i) => (
                <span key={i} className="rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{
                  background: 'var(--cursor-surface-500)',
                  color: 'var(--cursor-orange)',
                }} data-qoder-id="qel-rounded-full-e1533c67" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-full-e1533c67&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;rounded-full&quot;,&quot;loc&quot;:{&quot;line&quot;:215,&quot;column&quot;:17}}">{s}</span>
              ))}
            </div>
            <p className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-3d99566a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-3d99566a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:221,&quot;column&quot;:13}}">
              代金券区间: {entry.realPatterns.voucherRange}
            </p>
          </div>
          <div className="rounded-lg p-3" style={{
            border: '1px solid var(--cursor-border-10)',
            background: 'var(--cursor-surface-300)',
          }} data-qoder-id="qel-rounded-lg-71d4c786" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-71d4c786&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:225,&quot;column&quot;:11}}">
            <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mb-1-5-8130f568" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-1-5-8130f568&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mb-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:229,&quot;column&quot;:13}}">
              回访时效 & 统计
            </h4>
            <div className="flex items-center gap-2 mb-1" data-qoder-id="qel-flex-2ef5dbe5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-2ef5dbe5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:232,&quot;column&quot;:13}}">
              <Clock className="h-3 w-3" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-3-f2f45cfa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-f2f45cfa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:233,&quot;column&quot;:15}}"/>
              <span className="text-xs font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-5555ee20" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-5555ee20&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:234,&quot;column&quot;:15}}">
                {entry.realPatterns.callbackCommitment}
              </span>
            </div>
            <div className="space-y-0.5 text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-space-y-0-5-02f02ec6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-0-5-02f02ec6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;space-y-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:238,&quot;column&quot;:13}}">
              <p data-qoder-id="qel-p-4fe1250b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-4fe1250b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:239,&quot;column&quot;:15}}">平均轮次: {entry.realPatterns.avgTurns} 轮</p>
              <p data-qoder-id="qel-p-4ee12378" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-4ee12378&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:240,&quot;column&quot;:15}}">真实会话: {entry.realPatterns.realConversations} 条</p>
            </div>
          </div>
        </div>
      )}

      {/* Fallback: old compensation/escalation when no realPatterns */}
      {!entry.realPatterns && (entry.compensation || entry.escalation) && (
        <div className="mb-4 grid grid-cols-2 gap-3" data-qoder-id="qel-mb-4-7f476fe0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-7f476fe0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:248,&quot;column&quot;:9}}">
          {entry.compensation && (
            <div className="rounded-lg p-3" style={{
              border: '1px solid var(--cursor-border-10)',
              background: 'var(--cursor-surface-300)',
            }} data-qoder-id="qel-rounded-lg-7cd7176e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-7cd7176e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:250,&quot;column&quot;:13}}">
              <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mb-1-5-0c2dfea2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-1-5-0c2dfea2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mb-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:254,&quot;column&quot;:15}}">
                补偿等级
              </h4>
              <div className="flex items-center gap-2" data-qoder-id="qel-flex-35f5e6ea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-35f5e6ea&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:257,&quot;column&quot;:15}}">
                <span className={`comp-level comp-level--${entry.compensation}`} data-qoder-id="qel-span-44e4b99c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-44e4b99c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:258,&quot;column&quot;:17}}">
                  {entry.compensation.replace('L', '')}
                </span>
                <span className="text-xs" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-f053108a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-f053108a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:261,&quot;column&quot;:17}}">
                  {COMPENSATION_MATRIX[entry.compensation]?.action || '按流程处理'}
                </span>
              </div>
              {COMPENSATION_MATRIX[entry.compensation] && (
                <p className="mt-1 text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-1-6a5ceb3f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-6a5ceb3f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:266,&quot;column&quot;:17}}">
                  审批: {COMPENSATION_MATRIX[entry.compensation].approval}
                </p>
              )}
            </div>
          )}
          {entry.escalation && (
            <div className="rounded-lg p-3" style={{
              border: '1px solid var(--cursor-border-10)',
              background: 'var(--cursor-surface-300)',
            }} data-qoder-id="qel-rounded-lg-f0cf7f45" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-f0cf7f45&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:273,&quot;column&quot;:13}}">
              <h4 className="mb-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mb-1-5-122bc97d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-1-5-122bc97d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mb-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:277,&quot;column&quot;:15}}">
                升级规则
              </h4>
              <div className="flex items-center gap-2" data-qoder-id="qel-flex-39f82bcd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-39f82bcd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:280,&quot;column&quot;:15}}">
                <span className={cn(
                  'ticket-type',
                  entry.escalation === 'Level2' ? 'ticket-type--escalation' : 'ticket-type--store_ticket'
                )} data-qoder-id="qel-span-42e4b676" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-42e4b676&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:281,&quot;column&quot;:17}}">
                  {entry.escalation}
                </span>
                <span className="text-xs" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-ea530718" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-ea530718&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:287,&quot;column&quot;:17}}">
                  {entry.escalation === 'Level2' ? '专员+门店负责人' : entry.escalation === 'Level3' ? '总部品质+法务' : '门店负责人'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Label info */}
      {entry.label && (
        <div className="mb-4" data-qoder-id="qel-mb-4-87453de1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-87453de1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:298,&quot;column&quot;:9}}">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mb-2-40bd5727" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-2-40bd5727&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mb-2&quot;,&quot;loc&quot;:{&quot;line&quot;:299,&quot;column&quot;:11}}">
            完整标签路径
          </h4>
          <div className="rounded-lg p-2 font-mono text-xs" style={{
            background: 'var(--cursor-surface-300)',
            border: '1px solid var(--cursor-border-10)',
            color: 'var(--cursor-ink)',
          }} data-qoder-id="qel-rounded-lg-73d28c15" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-73d28c15&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:302,&quot;column&quot;:11}}">
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
         data-qoder-id="qel-rounded-lg-72d28a82" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-72d28a82&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:314,&quot;column&quot;:9}}">
          <div className="flex items-center gap-2 mb-2" data-qoder-id="qel-flex-3cfa6f1d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-3cfa6f1d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:321,&quot;column&quot;:11}}">
            <h4 className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-7fbd6039" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-7fbd6039&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:322,&quot;column&quot;:13}}">
              真实应对策略链
            </h4>
            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{ background: 'var(--cursor-orange)', color: 'white' }} data-qoder-id="qel-rounded-full-e1557afe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-full-e1557afe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;rounded-full&quot;,&quot;loc&quot;:{&quot;line&quot;:325,&quot;column&quot;:13}}">
              真实提取
            </span>
          </div>
          <p className="text-[10px] mb-3" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-ab91b4cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-ab91b4cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:329,&quot;column&quot;:11}}">
            基于 {entry.realPatterns.realConversations} 条真实客服会话提取，反映实际应对流程
          </p>
          <div className="space-y-2 text-xs" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-space-y-2-580f18a7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-2-580f18a7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;space-y-2&quot;,&quot;loc&quot;:{&quot;line&quot;:332,&quot;column&quot;:11}}">
            {entry.realPatterns.chain.map((step, i) => (
              <div key={i} className="flex items-start gap-2" data-qoder-id="qel-flex-37fa673e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-37fa673e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:334,&quot;column&quot;:15}}">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ background: 'var(--cursor-orange)' }} data-qoder-id="qel-mt-0-5-28d0e287" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-28d0e287&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:335,&quot;column&quot;:17}}">{i + 1}</span>
                <span data-qoder-id="qel-span-51e70caa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-51e70caa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:336,&quot;column&quot;:17}}">{step}</span>
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
         data-qoder-id="qel-rounded-lg-71b6b272" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-71b6b272&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:345,&quot;column&quot;:9}}">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mb-2-bca48275" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-2-bca48275&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mb-2&quot;,&quot;loc&quot;:{&quot;line&quot;:352,&quot;column&quot;:11}}">
            处理流程
          </h4>
          <div className="space-y-2 text-xs" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-space-y-2-c20770c0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-2-c20770c0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;space-y-2&quot;,&quot;loc&quot;:{&quot;line&quot;:355,&quot;column&quot;:11}}">
            <div className="flex items-start gap-2" data-qoder-id="qel-flex-23d576e9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-23d576e9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:356,&quot;column&quot;:13}}">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ background: 'var(--cursor-orange)' }} data-qoder-id="qel-mt-0-5-2ad32444" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-2ad32444&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:357,&quot;column&quot;:15}}">1</span>
              <span data-qoder-id="qel-span-c5cbecc9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c5cbecc9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:358,&quot;column&quot;:15}}">AI 贝叶斯分类器识别食安问题类型</span>
            </div>
            <div className="flex items-start gap-2" data-qoder-id="qel-flex-26d57ba2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-26d57ba2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:360,&quot;column&quot;:13}}">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ background: 'var(--cursor-orange)' }} data-qoder-id="qel-mt-0-5-2dd328fd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-2dd328fd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:361,&quot;column&quot;:15}}">2</span>
              <span data-qoder-id="qel-span-d0cbfe1a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-d0cbfe1a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:362,&quot;column&quot;:15}}">核实订单信息和图片证据 (三合一)</span>
            </div>
            <div className="flex items-start gap-2" data-qoder-id="qel-flex-29d5805b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-29d5805b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:364,&quot;column&quot;:13}}">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ background: 'var(--cursor-orange)' }} data-qoder-id="qel-mt-0-5-2cd56601" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-2cd56601&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:365,&quot;column&quot;:15}}">3</span>
              <span data-qoder-id="qel-span-cdce37f8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-cdce37f8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:366,&quot;column&quot;:15}}">
                {riskLevel === 'high' ? '创建工单并升级通知负责人' : riskLevel === 'medium' ? '生成补偿方案并通知门店' : '安排重做或小额补偿'}
              </span>
            </div>
            <div className="flex items-start gap-2" data-qoder-id="qel-flex-24d7b713" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-24d7b713&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:370,&quot;column&quot;:13}}">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white" style={{ background: 'var(--cursor-orange)' }} data-qoder-id="qel-mt-0-5-29d56148" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-29d56148&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:371,&quot;column&quot;:15}}">4</span>
              <span data-qoder-id="qel-span-d2ce3fd7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-d2ce3fd7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;EntryDetail&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:372,&quot;column&quot;:15}}">红线审核 → 阿喜人设回复 → 跟进记录</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── RAG Test Panel with Bayesian ─── */
function RAGTestPanel(qoderProps) {
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
      className={["rounded-lg p-4", qoderProps?.className].filter(Boolean).join(" ")}
      style={{ ...({
        border: '1px solid var(--cursor-border-10)',
        background: 'var(--cursor-surface-100)',
      }), ...(qoderProps?.style) }}
      data-component="rag-test-panel"
     data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="mb-3 flex items-center gap-2" data-qoder-id="qel-mb-3-266dbbdc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-3-266dbbdc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;mb-3&quot;,&quot;loc&quot;:{&quot;line&quot;:429,&quot;column&quot;:7}}">
        <FlaskConical className="h-4 w-4" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-4-c1775852" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-c1775852&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:430,&quot;column&quot;:9}}"/>
        <h4 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-7ad9ce36" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-7ad9ce36&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:431,&quot;column&quot;:9}}">
          RAG 检索 + 贝叶斯分类测试
        </h4>
      </div>
      <div className="mb-3 flex gap-2" data-qoder-id="qel-mb-3-2d6dc6e1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-3-2d6dc6e1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;mb-3&quot;,&quot;loc&quot;:{&quot;line&quot;:435,&quot;column&quot;:7}}">
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
         data-qoder-id="qel-flex-1-db4d7e5d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-db4d7e5d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:436,&quot;column&quot;:9}}"/>
        <Button onClick={handleSearch} disabled={isSearching} data-qoder-id="qel-button-1e393929" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-1e393929&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:458,&quot;column&quot;:9}}">
          {isSearching ? '分析中...' : '分析'}
        </Button>
      </div>

      {/* Bayesian result */}
      {bayesianResult && (
        <div className="mb-3 rounded-lg p-3" style={{
          border: '1px solid var(--cursor-border-10)',
          background: 'var(--cursor-surface-300)',
        }} data-qoder-id="qel-mb-3-53a029c4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-3-53a029c4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;mb-3&quot;,&quot;loc&quot;:{&quot;line&quot;:465,&quot;column&quot;:9}}">
          <div className="flex items-center gap-2 mb-2" data-qoder-id="qel-flex-a90ae9bb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a90ae9bb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:469,&quot;column&quot;:11}}">
            <GitBranch className="h-3.5 w-3.5" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-3-5-7dcc2294" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-7dcc2294&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:470,&quot;column&quot;:13}}"/>
            <span className="text-xs font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-0e0c8818" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-0e0c8818&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:471,&quot;column&quot;:13}}">
              贝叶斯分类结果
            </span>
            <span className={cn(
              'ml-auto emotion-indicator',
              bayesianResult.risk_level === 'high' ? 'emotion-indicator--urgent' :
              bayesianResult.risk_level === 'medium' ? 'emotion-indicator--elevated' :
              'emotion-indicator--normal'
            )} data-qoder-id="qel-span-4193d2f0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-4193d2f0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:474,&quot;column&quot;:13}}">
              {riskLabel[bayesianResult.risk_level] || '低风险'}
            </span>
          </div>

          <div className="mb-2" data-qoder-id="qel-mb-2-6f3ab300" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-2-6f3ab300&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;mb-2&quot;,&quot;loc&quot;:{&quot;line&quot;:484,&quot;column&quot;:11}}">
            <div className="flex items-center justify-between text-xs mb-1" data-qoder-id="qel-flex-a20adeb6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a20adeb6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:485,&quot;column&quot;:13}}">
              <span style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-span-5093ea8d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-5093ea8d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:486,&quot;column&quot;:15}}">
                {bayesianResult.consult_type?.split('/').pop() || '分析中'}
              </span>
              <span className="font-mono" style={{ color: 'var(--cursor-orange)' }} data-qoder-id="qel-font-mono-9d895e76" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-mono-9d895e76&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;font-mono&quot;,&quot;loc&quot;:{&quot;line&quot;:489,&quot;column&quot;:15}}">
                {Math.round(bayesianResult.confidence * 100)}%
              </span>
            </div>
            <div className="bayesian-bar" data-qoder-id="qel-bayesian-bar-944f93bf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-bayesian-bar-944f93bf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;bayesian-bar&quot;,&quot;loc&quot;:{&quot;line&quot;:493,&quot;column&quot;:13}}">
              <div
                className={cn('bayesian-bar__fill',
                  bayesianResult.risk_level === 'high' ? 'bayesian-bar__fill--high' :
                  bayesianResult.risk_level === 'medium' ? 'bayesian-bar__fill--medium' :
                  'bayesian-bar__fill--low'
                )}
                style={{ width: `${bayesianResult.confidence * 100}%` }}
               data-qoder-id="qel-div-680f66ed" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-680f66ed&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:494,&quot;column&quot;:15}}"/>
            </div>
          </div>

          {/* Top 5 posteriors */}
          {bayesianResult.posteriors && (
            <div className="space-y-1" data-qoder-id="qel-space-y-1-1cf56a33" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-1cf56a33&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;space-y-1&quot;,&quot;loc&quot;:{&quot;line&quot;:507,&quot;column&quot;:13}}">
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-cb5801fc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-cb5801fc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:508,&quot;column&quot;:15}}">
                Top 5 后验概率
              </p>
              {bayesianResult.posteriors.map((p, i) => (
                <div key={i} className="posterior-item" data-qoder-id="qel-posterior-item-d10f4404" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-posterior-item-d10f4404&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;posterior-item&quot;,&quot;loc&quot;:{&quot;line&quot;:512,&quot;column&quot;:17}}">
                  <span className="posterior-item__label" data-qoder-id="qel-posterior-item__label-4ceabdde" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-posterior-item__label-4ceabdde&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;posterior-item__label&quot;,&quot;loc&quot;:{&quot;line&quot;:513,&quot;column&quot;:19}}">
                    {p.label.split('/').pop()}
                  </span>
                  <span className="posterior-item__prob" data-qoder-id="qel-posterior-item__prob-fbf167e0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-posterior-item__prob-fbf167e0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;posterior-item__prob&quot;,&quot;loc&quot;:{&quot;line&quot;:516,&quot;column&quot;:19}}">
                    {(p.prob * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Evidence */}
          {bayesianResult.evidence && bayesianResult.evidence.length > 0 && (
            <div className="mt-2" data-qoder-id="qel-mt-2-1469b816" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-1469b816&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:526,&quot;column&quot;:13}}">
              <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-d05809db" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-d05809db&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:527,&quot;column&quot;:15}}">
                证据链
              </p>
              {bayesianResult.evidence.map((ev, i) => (
                <p key={i} className="text-[10px]" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-10px-595f9d4b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-595f9d4b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:531,&quot;column&quot;:17}}">
                  {ev}
                </p>
              ))}
            </div>
          )}

          {/* Flags */}
          <div className="mt-2 flex flex-wrap gap-1" data-qoder-id="qel-mt-2-15677b12" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-15677b12&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:539,&quot;column&quot;:11}}">
            {bayesianResult.need_human_review && (
              <span className="human-review-tag" data-qoder-id="qel-human-review-tag-67b8a713" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-human-review-tag-67b8a713&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;human-review-tag&quot;,&quot;loc&quot;:{&quot;line&quot;:541,&quot;column&quot;:15}}">
                <Eye className="h-2.5 w-2.5"  data-qoder-id="qel-h-2-5-b2dd6fe5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-b2dd6fe5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:542,&quot;column&quot;:17}}"/> 需人工复核
              </span>
            )}
            {bayesianResult.boundary_risk && (
              <span className="boundary-pair" style={{ padding: '2px 6px' }} data-qoder-id="qel-boundary-pair-81bc59a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-boundary-pair-81bc59a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;boundary-pair&quot;,&quot;loc&quot;:{&quot;line&quot;:546,&quot;column&quot;:15}}">
                <ArrowRightLeft className="h-2.5 w-2.5"  data-qoder-id="qel-h-2-5-8e39d3f4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-8e39d3f4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:547,&quot;column&quot;:17}}"/> 边界风险
              </span>
            )}
            {bayesianResult.is_food_safety === false && (
              <span className="tag-pill text-[10px]" data-qoder-id="qel-tag-pill-d9ff7e76" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tag-pill-d9ff7e76&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;tag-pill&quot;,&quot;loc&quot;:{&quot;line&quot;:551,&quot;column&quot;:15}}">非食安问题</span>
            )}
          </div>
        </div>
      )}

      {/* RAG results */}
      {results && (
        <div className="space-y-2" data-qoder-id="qel-space-y-2-0b249d25" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-2-0b249d25&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;space-y-2&quot;,&quot;loc&quot;:{&quot;line&quot;:559,&quot;column&quot;:9}}">
          <p className="text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-7d149367" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-7d149367&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:560,&quot;column&quot;:11}}">
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
             data-qoder-id="qel-rounded-lg-21029465" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-21029465&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:564,&quot;column&quot;:13}}">
              <div className="mb-1 flex items-center gap-2" data-qoder-id="qel-mb-1-6e7fbccf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-1-6e7fbccf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;mb-1&quot;,&quot;loc&quot;:{&quot;line&quot;:572,&quot;column&quot;:15}}">
                <FileText className="h-3.5 w-3.5" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-3-5-4dd83453" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-4dd83453&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:573,&quot;column&quot;:17}}"/>
                <span className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-f866845b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-f866845b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:574,&quot;column&quot;:17}}">
                  {doc.title}
                </span>
                <span
                  className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: 'var(--cursor-surface-500)', color: 'var(--cursor-orange)' }}
                 data-qoder-id="qel-ml-auto-dfeb858d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-auto-dfeb858d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;ml-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:577,&quot;column&quot;:17}}">
                  相关度 {Math.round(doc.score * 100)}%
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-73124512" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-73124512&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;RAGTestPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:584,&quot;column&quot;:15}}">
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

function ScriptLibrary(qoderProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={["rounded-lg p-4", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({
      border: '1px solid var(--cursor-border-10)',
      background: 'var(--cursor-surface-100)',
    }), ...(qoderProps?.style) }} data-component="script-library" data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="flex items-center gap-2 mb-3" data-qoder-id="qel-flex-2b8ea7c7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-2b8ea7c7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;ScriptLibrary&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:615,&quot;column&quot;:7}}">
        <BookOpen className="h-4 w-4" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-4-98f31116" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-98f31116&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;ScriptLibrary&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:616,&quot;column&quot;:9}}"/>
        <h4 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-3165c9c5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-3165c9c5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;ScriptLibrary&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:617,&quot;column&quot;:9}}">
          阿喜话术库 (8模板 · 真实提取)
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => setExpanded(!expanded)}
         data-qoder-id="qel-ml-auto-af235f8f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-auto-af235f8f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;ScriptLibrary&quot;,&quot;elementRole&quot;:&quot;ml-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:620,&quot;column&quot;:9}}">
          {expanded ? '收起' : '展开'}
        </Button>
      </div>

      {expanded && (
        <div className="space-y-2 animate-fade-in" data-qoder-id="qel-space-y-2-566fd682" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-2-566fd682&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;ScriptLibrary&quot;,&quot;elementRole&quot;:&quot;space-y-2&quot;,&quot;loc&quot;:{&quot;line&quot;:631,&quot;column&quot;:9}}">
          {SCRIPT_LIBRARY.map((s, i) => (
            <div key={i} className="rounded-lg p-2.5" style={{
              border: '1px solid var(--cursor-border-10)',
              background: 'var(--cursor-surface-400)',
            }} data-qoder-id="qel-rounded-lg-06687ee3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-06687ee3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;ScriptLibrary&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:633,&quot;column&quot;:13}}">
              <div className="flex items-center gap-2 mb-1" data-qoder-id="qel-flex-a59aa0c8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a59aa0c8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;ScriptLibrary&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:637,&quot;column&quot;:15}}">
                <span className="text-xs font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-222508da" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-222508da&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;ScriptLibrary&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:638,&quot;column&quot;:17}}">{s.name}</span>
                <span className="tag-pill text-[9px] ml-auto" data-qoder-id="qel-tag-pill-e233dbfa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tag-pill-e233dbfa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;ScriptLibrary&quot;,&quot;elementRole&quot;:&quot;tag-pill&quot;,&quot;loc&quot;:{&quot;line&quot;:639,&quot;column&quot;:17}}">{s.trigger}</span>
                {s.count && (
                  <span className="text-[9px] font-mono" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-9px-8e4feb08" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-8e4feb08&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;ScriptLibrary&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:641,&quot;column&quot;:19}}">
                    {s.count.toLocaleString()}次
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-dcd0d1cc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-dcd0d1cc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;ScriptLibrary&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:646,&quot;column&quot;:15}}">
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
function StrategySection({ title, icon: Icon, children, defaultOpen = false, badge, ...qoderProps }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={["rounded-lg", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ border: '1px solid var(--cursor-border-10)', background: 'var(--cursor-surface-100)' }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <button
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
       data-qoder-id="qel-flex-a37f2a23" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-a37f2a23&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategySection&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:662,&quot;column&quot;:7}}">
        <Icon className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-4-c399c675" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-c399c675&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategySection&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:666,&quot;column&quot;:9}}"/>
        <span className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-22bd5211" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-22bd5211&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategySection&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:667,&quot;column&quot;:9}}">{title}</span>
        {badge && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: 'var(--cursor-surface-500)', color: 'var(--cursor-orange)' }} data-qoder-id="qel-rounded-full-1e7406ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-full-1e7406ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategySection&quot;,&quot;elementRole&quot;:&quot;rounded-full&quot;,&quot;loc&quot;:{&quot;line&quot;:669,&quot;column&quot;:11}}">
            {badge}
          </span>
        )}
        {open ? <ChevronDown className="h-3.5 w-3.5 ml-auto" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-5-837e131a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-837e131a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategySection&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:673,&quot;column&quot;:17}}"/>
          : <ChevronRight className="h-3.5 w-3.5 ml-auto" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-5-1f5bf6cb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-1f5bf6cb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategySection&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:674,&quot;column&quot;:13}}"/>}
      </button>
      {open && <div className="px-4 pb-4 animate-fade-in" data-qoder-id="qel-px-4-98e9e97f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-98e9e97f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategySection&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:676,&quot;column&quot;:16}}">{children}</div>}
    </div>
  )
}

/* ─── Strategy Chain Visualizer ─── */
function StrategyChainView({ chain, ...qoderProps }) {
  return (
    <div className={["flex flex-wrap items-center gap-1.5", qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {chain.map((step, i) => (
        <div key={i} className="flex items-center gap-1.5" data-qoder-id="qel-flex-20fe6cea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-20fe6cea&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyChainView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:686,&quot;column&quot;:9}}">
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{
            background: STRATEGY_COLORS[step.strategy]?.bg || 'var(--cursor-surface-300)',
            border: `1px solid ${STRATEGY_COLORS[step.strategy]?.fg || 'var(--cursor-border-10)'}20`,
          }} data-qoder-id="qel-flex-21fe6e7d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-21fe6e7d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyChainView&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:687,&quot;column&quot;:11}}">
            <span className="text-[10px] font-medium" style={{ color: STRATEGY_COLORS[step.strategy]?.fg || 'var(--cursor-ink)' }} data-qoder-id="qel-text-10px-115e7b55" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-115e7b55&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyChainView&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:691,&quot;column&quot;:13}}">
              {step.step}
            </span>
          </div>
          {i < chain.length - 1 && (
            <ChevronRight className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--cursor-border-20)' }}  data-qoder-id="qel-h-3-3663eff2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-3663eff2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyChainView&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:696,&quot;column&quot;:13}}"/>
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── Strategy Knowledge Base Panel ─── */
function StrategyPanel(qoderProps) {
  const [selectedCategory, setSelectedCategory] = useState('异物-果核')
  const [selectedChainCat, setSelectedChainCat] = useState('异物-果核')
  const solutionCategories = Object.keys(SOLUTION_SCRIPTS)
  const chainCategories = Object.keys(STRATEGY_CHAINS)

  const totalStrategies = Object.values(GLOBAL_STRATEGY_FREQ).reduce((a, b) => a + b, 0)

  return (
    <div className={["space-y-4", qoderProps?.className].filter(Boolean).join(" ")} data-component="strategy-panel" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Overview Stats */}
      <div className="rounded-lg p-4" style={{ border: '1px solid var(--cursor-border-10)', background: 'var(--cursor-surface-100)' }} data-qoder-id="qel-rounded-lg-81161abc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-81161abc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:716,&quot;column&quot;:7}}">
        <div className="mb-3 flex items-center gap-2" data-qoder-id="qel-mb-3-9d59853f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-3-9d59853f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;mb-3&quot;,&quot;loc&quot;:{&quot;line&quot;:717,&quot;column&quot;:9}}">
          <BarChart3 className="h-4 w-4" style={{ color: 'var(--cursor-orange)' }}  data-qoder-id="qel-h-4-b64abcdb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-b64abcdb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:718,&quot;column&quot;:11}}"/>
          <h4 className="text-sm font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-7ead92e1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-7ead92e1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:719,&quot;column&quot;:11}}">
            提取概览
          </h4>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-3" data-qoder-id="qel-grid-7ae825a5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-7ae825a5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:723,&quot;column&quot;:9}}">
          {[
            { label: '处理文件', value: STRATEGY_META.totalFiles, unit: '个' },
            { label: '真实对话', value: STRATEGY_META.totalConversations.toLocaleString(), unit: '条' },
            { label: '客诉分类', value: STRATEGY_META.totalCategories, unit: '类' },
            { label: '提取策略', value: totalStrategies.toLocaleString(), unit: '条' },
          ].map((stat, i) => (
            <div key={i} className="rounded-lg p-2.5 text-center" style={{ background: 'var(--cursor-surface-300)', border: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-rounded-lg-80161929" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-80161929&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:730,&quot;column&quot;:13}}">
              <div className="text-lg font-bold" style={{ color: 'var(--cursor-orange)' }} data-qoder-id="qel-text-lg-f9097bd2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-lg-f9097bd2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:731,&quot;column&quot;:15}}">
                {stat.value}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-536f1007" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-536f1007&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:734,&quot;column&quot;:15}}">
                {stat.label} ({stat.unit})
              </div>
            </div>
          ))}
        </div>
        {/* Strategy frequency bar */}
        <div className="space-y-1.5" data-qoder-id="qel-space-y-1-5-59cc5e2b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-5-59cc5e2b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;space-y-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:741,&quot;column&quot;:9}}">
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-3870cf4d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-3870cf4d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:742,&quot;column&quot;:11}}">
            全局策略频次分布
          </p>
          {Object.entries(GLOBAL_STRATEGY_FREQ).sort((a, b) => b[1] - a[1]).map(([key, count]) => {
            const pct = (count / totalStrategies * 100).toFixed(1)
            const color = STRATEGY_COLORS[key]
            return (
              <div key={key} className="flex items-center gap-2" data-qoder-id="qel-flex-656f7e6f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-656f7e6f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:749,&quot;column&quot;:15}}">
                <span className="w-16 text-[10px] font-medium truncate" style={{ color: color?.fg || 'var(--cursor-ink)' }} data-qoder-id="qel-w-16-bd91271f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-16-bd91271f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;w-16&quot;,&quot;loc&quot;:{&quot;line&quot;:750,&quot;column&quot;:17}}">
                  {color?.label || key}
                </span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-flex-1-8216071f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-8216071f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:753,&quot;column&quot;:17}}">
                  <div className="h-full rounded-full" style={{
                    width: `${(count / GLOBAL_STRATEGY_FREQ.opening) * 100}%`,
                    background: color?.fg || 'var(--cursor-orange)',
                    opacity: 0.7,
                  }}  data-qoder-id="qel-h-full-8ab4c5b9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-full-8ab4c5b9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;h-full&quot;,&quot;loc&quot;:{&quot;line&quot;:754,&quot;column&quot;:19}}"/>
                </div>
                <span className="w-16 text-right text-[10px] font-mono" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-w-16-ba912266" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-16-ba912266&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;w-16&quot;,&quot;loc&quot;:{&quot;line&quot;:760,&quot;column&quot;:17}}">
                  {count.toLocaleString()} ({pct}%)
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Opening Scripts */}
      <StrategySection title="开场白模板" icon={MessageSquare} badge={`${OPENING_SCRIPTS.length} 个模板`} defaultOpen data-qoder-id="qel-strategysection-c8d9cb4c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strategysection-c8d9cb4c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;strategysection&quot;,&quot;loc&quot;:{&quot;line&quot;:770,&quot;column&quot;:7}}">
        <div className="space-y-2" data-qoder-id="qel-space-y-2-03532ddb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-2-03532ddb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;space-y-2&quot;,&quot;loc&quot;:{&quot;line&quot;:771,&quot;column&quot;:9}}">
          {OPENING_SCRIPTS.map((s, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg p-2.5" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-flex-6c6f8974" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-6c6f8974&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:773,&quot;column&quot;:13}}">
              <span className="flex-shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: STRATEGY_COLORS.opening.fg }} data-qoder-id="qel-flex-shrink-0-6296e827" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-6296e827&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:774,&quot;column&quot;:15}}">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-8531e255" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-8531e255&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:777,&quot;column&quot;:15}}">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-98a71d75" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-98a71d75&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:778,&quot;column&quot;:17}}">{s.template}</p>
                <div className="mt-1 flex items-center gap-2" data-qoder-id="qel-mt-1-744d97a9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-744d97a9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:779,&quot;column&quot;:17}}">
                  <span className="tag-pill text-[9px]" data-qoder-id="qel-tag-pill-bf3fbc88" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tag-pill-bf3fbc88&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;tag-pill&quot;,&quot;loc&quot;:{&quot;line&quot;:780,&quot;column&quot;:19}}">{s.type}</span>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-7b9ebc22" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-7b9ebc22&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:781,&quot;column&quot;:19}}">
                    使用 {s.count.toLocaleString()} 次
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </StrategySection>

      {/* Queue + Acknowledgment */}
      <StrategySection title="排队管理 & 接入确认" icon={Clock} badge={`${QUEUE_SCRIPTS.length + ACKNOWLEDGMENT_SCRIPTS.length} 条`} data-qoder-id="qel-strategysection-5be16e7a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strategysection-5be16e7a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;strategysection&quot;,&quot;loc&quot;:{&quot;line&quot;:792,&quot;column&quot;:7}}">
        <div className="space-y-3" data-qoder-id="qel-space-y-3-5051fa80" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-3-5051fa80&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;space-y-3&quot;,&quot;loc&quot;:{&quot;line&quot;:793,&quot;column&quot;:9}}">
          <div data-qoder-id="qel-div-a6235788" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a6235788&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:794,&quot;column&quot;:11}}">
            <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-2e7d8b82" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-2e7d8b82&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:795,&quot;column&quot;:13}}">
              排队管理 ({QUEUE_SCRIPTS.length})
            </p>
            {QUEUE_SCRIPTS.map((s, i) => (
              <div key={i} className="rounded-lg p-2 mb-1" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-rounded-lg-051b67b6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-051b67b6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:799,&quot;column&quot;:15}}">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-9da963eb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-9da963eb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:800,&quot;column&quot;:17}}">{s}</p>
              </div>
            ))}
          </div>
          <div data-qoder-id="qel-div-a8211c17" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a8211c17&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:804,&quot;column&quot;:11}}">
            <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-1e7fb0e9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-1e7fb0e9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:805,&quot;column&quot;:13}}">
              接入确认 ({ACKNOWLEDGMENT_SCRIPTS.length})
            </p>
            {ACKNOWLEDGMENT_SCRIPTS.map((s, i) => (
              <div key={i} className="rounded-lg p-2 mb-1" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-rounded-lg-8b186911" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-8b186911&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:809,&quot;column&quot;:15}}">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-a1a96a37" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-a1a96a37&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:810,&quot;column&quot;:17}}">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </StrategySection>

      {/* Info Collection */}
      <StrategySection title="信息收集话术" icon={Search} badge="5 类" data-qoder-id="qel-strategysection-57df2997" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strategysection-57df2997&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;strategysection&quot;,&quot;loc&quot;:{&quot;line&quot;:818,&quot;column&quot;:7}}">
        <div className="space-y-3" data-qoder-id="qel-space-y-3-e2551eed" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-3-e2551eed&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;space-y-3&quot;,&quot;loc&quot;:{&quot;line&quot;:819,&quot;column&quot;:9}}">
          {INFO_COLLECTION_SCRIPTS.map((group, i) => (
            <div key={i} data-qoder-id="qel-div-a62118f1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a62118f1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:821,&quot;column&quot;:13}}">
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: STRATEGY_COLORS.info_collection.fg }} data-qoder-id="qel-text-10px-247fba5b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-247fba5b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:822,&quot;column&quot;:15}}">
                {group.type} ({group.examples.length})
              </p>
              {group.examples.map((ex, j) => (
                <div key={j} className="rounded-lg p-2 mb-1" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-rounded-lg-81185953" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-81185953&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:826,&quot;column&quot;:17}}">
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-2923569f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-2923569f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:827,&quot;column&quot;:19}}">{ex}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </StrategySection>

      {/* Empathy Scripts */}
      <StrategySection title="安抚共情话术" icon={HeartPulse} badge={`${EMPATHY_SCRIPTS.length} 条`} data-qoder-id="qel-strategysection-8d19b08b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strategysection-8d19b08b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;strategysection&quot;,&quot;loc&quot;:{&quot;line&quot;:836,&quot;column&quot;:7}}">
        <div className="space-y-1.5" data-qoder-id="qel-space-y-1-5-f8443031" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-5-f8443031&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;space-y-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:837,&quot;column&quot;:9}}">
          {EMPATHY_SCRIPTS.map((s, i) => (
            <div key={i} className="rounded-lg p-2.5" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-rounded-lg-c452f651" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-c452f651&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:839,&quot;column&quot;:13}}">
              <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-25235053" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-25235053&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:840,&quot;column&quot;:15}}">{s}</p>
            </div>
          ))}
        </div>
      </StrategySection>

      {/* Solution Scripts by Category */}
      <StrategySection title="解决方案话术（按分类）" icon={Zap} badge={`${solutionCategories.length} 个分类`} defaultOpen data-qoder-id="qel-strategysection-9119b6d7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strategysection-9119b6d7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;strategysection&quot;,&quot;loc&quot;:{&quot;line&quot;:847,&quot;column&quot;:7}}">
        <div className="mb-3 flex flex-wrap gap-1.5" data-qoder-id="qel-mb-3-93eb9824" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-3-93eb9824&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;mb-3&quot;,&quot;loc&quot;:{&quot;line&quot;:848,&quot;column&quot;:9}}">
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
             data-qoder-id="qel-rounded-full-25100468" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-full-25100468&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;rounded-full&quot;,&quot;loc&quot;:{&quot;line&quot;:850,&quot;column&quot;:13}}">
              {cat}
            </button>
          ))}
        </div>
        {SOLUTION_SCRIPTS[selectedCategory] && (
          <div className="space-y-3" data-qoder-id="qel-space-y-3-6e91e047" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-3-6e91e047&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;space-y-3&quot;,&quot;loc&quot;:{&quot;line&quot;:868,&quot;column&quot;:11}}">
            {Object.entries(SOLUTION_SCRIPTS[selectedCategory]).map(([type, scripts]) => (
              <div key={type} data-qoder-id="qel-div-5933c3cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5933c3cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:870,&quot;column&quot;:15}}">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--cursor-orange)' }} data-qoder-id="qel-text-10px-c0e165be" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-c0e165be&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:871,&quot;column&quot;:17}}">
                  {type} ({scripts.length})
                </p>
                {scripts.map((s, i) => (
                  <div key={i} className="rounded-lg p-2 mb-1" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-rounded-lg-4656018e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-4656018e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:875,&quot;column&quot;:19}}">
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-21210b70" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-21210b70&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:876,&quot;column&quot;:21}}">{s}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </StrategySection>

      {/* Strategy Chains */}
      <StrategySection title="应对策略链（可视化流程）" icon={Layers} badge={`${chainCategories.length} 个分类`} defaultOpen data-qoder-id="qel-strategysection-8f1bf248" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strategysection-8f1bf248&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;strategysection&quot;,&quot;loc&quot;:{&quot;line&quot;:886,&quot;column&quot;:7}}">
        <div className="mb-3 flex flex-wrap gap-1.5" data-qoder-id="qel-mb-3-13eea03b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-3-13eea03b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;mb-3&quot;,&quot;loc&quot;:{&quot;line&quot;:887,&quot;column&quot;:9}}">
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
             data-qoder-id="qel-rounded-full-a30cf92b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-full-a30cf92b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;rounded-full&quot;,&quot;loc&quot;:{&quot;line&quot;:889,&quot;column&quot;:13}}">
              {cat}
            </button>
          ))}
        </div>
        {STRATEGY_CHAINS[selectedChainCat] && (
          <div className="space-y-3" data-qoder-id="qel-space-y-3-e28ec54c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-3-e28ec54c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;space-y-3&quot;,&quot;loc&quot;:{&quot;line&quot;:907,&quot;column&quot;:11}}">
            <StrategyChainView chain={STRATEGY_CHAINS[selectedChainCat]}  data-qoder-id="qel-strategychainview-c56c2c7c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strategychainview-c56c2c7c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;strategychainview&quot;,&quot;loc&quot;:{&quot;line&quot;:908,&quot;column&quot;:13}}"/>
            {/* Detailed steps */}
            <div className="space-y-1.5" data-qoder-id="qel-space-y-1-5-f841f19a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-5-f841f19a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;space-y-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:910,&quot;column&quot;:13}}">
              {STRATEGY_CHAINS[selectedChainCat].map((step, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg p-2" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-flex-da06d4dc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-da06d4dc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:912,&quot;column&quot;:17}}">
                  <span className="flex-shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: STRATEGY_COLORS[step.strategy]?.fg || 'var(--cursor-orange)' }} data-qoder-id="qel-flex-shrink-0-4763d30c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-4763d30c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:913,&quot;column&quot;:19}}">
                    {i + 1}
                  </span>
                  <div data-qoder-id="qel-div-cd38f799" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-cd38f799&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:916,&quot;column&quot;:19}}">
                    <span className="text-[10px] font-medium" style={{ color: STRATEGY_COLORS[step.strategy]?.fg || 'var(--cursor-ink)' }} data-qoder-id="qel-text-10px-1b168fbb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-1b168fbb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:917,&quot;column&quot;:21}}">
                      {step.step}
                    </span>
                    <span className="text-xs ml-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-2ff50810" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-2ff50810&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:920,&quot;column&quot;:21}}">
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
      <StrategySection title="收尾 & 升级转接" icon={GitBranch} badge={`${CLOSING_SCRIPTS.length + ESCALATION_SCRIPTS.length} 条`} data-qoder-id="qel-strategysection-941e38be" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strategysection-941e38be&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;strategysection&quot;,&quot;loc&quot;:{&quot;line&quot;:932,&quot;column&quot;:7}}">
        <div className="space-y-3" data-qoder-id="qel-space-y-3-f58ca49e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-3-f58ca49e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;space-y-3&quot;,&quot;loc&quot;:{&quot;line&quot;:933,&quot;column&quot;:9}}">
          <div data-qoder-id="qel-div-ce38f92c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ce38f92c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:934,&quot;column&quot;:11}}">
            <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: STRATEGY_COLORS.closing.fg }} data-qoder-id="qel-text-10px-b3df12b0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-b3df12b0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:935,&quot;column&quot;:13}}">
              收尾话术 ({CLOSING_SCRIPTS.length})
            </p>
            {CLOSING_SCRIPTS.map((s, i) => (
              <div key={i} className="rounded-lg p-2 mb-1" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-rounded-lg-45583e92" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-45583e92&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:939,&quot;column&quot;:15}}">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-341eeac2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-341eeac2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:940,&quot;column&quot;:17}}">{s}</p>
              </div>
            ))}
          </div>
          <div data-qoder-id="qel-div-d23b3e0f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d23b3e0f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:944,&quot;column&quot;:11}}">
            <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: STRATEGY_COLORS.escalation.fg }} data-qoder-id="qel-text-10px-b5dcd73f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-b5dcd73f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:945,&quot;column&quot;:13}}">
              升级转接 ({ESCALATION_SCRIPTS.length})
            </p>
            {ESCALATION_SCRIPTS.map((s, i) => (
              <div key={i} className="rounded-lg p-2 mb-1" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-rounded-lg-355a63f9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-355a63f9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:949,&quot;column&quot;:15}}">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-ba1bec1d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-ba1bec1d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:950,&quot;column&quot;:17}}">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </StrategySection>

      {/* Category Stats Table */}
      <StrategySection title="各分类策略统计" icon={BarChart3} badge="22 类" data-qoder-id="qel-strategysection-0221247f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strategysection-0221247f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;strategysection&quot;,&quot;loc&quot;:{&quot;line&quot;:958,&quot;column&quot;:7}}">
        <div className="overflow-x-auto" data-qoder-id="qel-overflow-x-auto-82f17182" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-overflow-x-auto-82f17182&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;overflow-x-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:959,&quot;column&quot;:9}}">
          <table className="w-full text-xs" data-qoder-id="qel-w-full-7bf475c4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-7bf475c4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:960,&quot;column&quot;:11}}">
            <thead data-qoder-id="qel-thead-74609686" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-thead-74609686&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;thead&quot;,&quot;loc&quot;:{&quot;line&quot;:961,&quot;column&quot;:13}}">
              <tr style={{ borderBottom: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-tr-3664554f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tr-3664554f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;tr&quot;,&quot;loc&quot;:{&quot;line&quot;:962,&quot;column&quot;:15}}">
                <th className="text-left py-2 pr-3 font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-left-73b91b87" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-left-73b91b87&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-left&quot;,&quot;loc&quot;:{&quot;line&quot;:963,&quot;column&quot;:17}}">分类</th>
                <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-right-3552560c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-right-3552560c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-right&quot;,&quot;loc&quot;:{&quot;line&quot;:964,&quot;column&quot;:17}}">会话数</th>
                <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-right-3652579f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-right-3652579f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-right&quot;,&quot;loc&quot;:{&quot;line&quot;:965,&quot;column&quot;:17}}">策略数</th>
                <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-right-37525932" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-right-37525932&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-right&quot;,&quot;loc&quot;:{&quot;line&quot;:966,&quot;column&quot;:17}}">平均轮次</th>
                <th className="text-left py-2 pl-3 font-medium" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-left-e5b5fd66" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-left-e5b5fd66&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;text-left&quot;,&quot;loc&quot;:{&quot;line&quot;:967,&quot;column&quot;:17}}">主要策略</th>
              </tr>
            </thead>
            <tbody data-qoder-id="qel-tbody-97a7b408" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tbody-97a7b408&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;tbody&quot;,&quot;loc&quot;:{&quot;line&quot;:970,&quot;column&quot;:13}}">
              {Object.entries(CATEGORY_STRATEGY_STATS)
                .sort((a, b) => b[1].conversations - a[1].conversations)
                .map(([cat, stats]) => (
                <tr key={cat} style={{ borderBottom: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-tr-395310e7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tr-395310e7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;tr&quot;,&quot;loc&quot;:{&quot;line&quot;:974,&quot;column&quot;:17}}">
                  <td className="py-1.5 pr-3 font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-py-1-5-eab150d9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-py-1-5-eab150d9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;py-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:975,&quot;column&quot;:19}}">{cat}</td>
                  <td className="py-1.5 px-2 text-right font-mono" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-py-1-5-e9b14f46" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-py-1-5-e9b14f46&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;py-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:976,&quot;column&quot;:19}}">{stats.conversations.toLocaleString()}</td>
                  <td className="py-1.5 px-2 text-right font-mono" style={{ color: 'var(--cursor-orange)' }} data-qoder-id="qel-py-1-5-f4b16097" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-py-1-5-f4b16097&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;py-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:977,&quot;column&quot;:19}}">{stats.strategies.toLocaleString()}</td>
                  <td className="py-1.5 px-2 text-right font-mono" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-py-1-5-f3b15f04" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-py-1-5-f3b15f04&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;py-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:978,&quot;column&quot;:19}}">{stats.avg_turns}</td>
                  <td className="py-1.5 pl-3" data-qoder-id="qel-py-1-5-e6af0bf6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-py-1-5-e6af0bf6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;py-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:979,&quot;column&quot;:19}}">
                    <div className="flex flex-wrap gap-1" data-qoder-id="qel-flex-49fcf7d0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-49fcf7d0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:980,&quot;column&quot;:21}}">
                      {stats.top.slice(0, 3).map(t => (
                        <span key={t} className="rounded-full px-1.5 py-0.5 text-[9px]" style={{
                          background: STRATEGY_COLORS[t]?.bg || 'var(--cursor-surface-300)',
                          color: STRATEGY_COLORS[t]?.fg || 'var(--cursor-ink)',
                        }} data-qoder-id="qel-rounded-full-67f15dce" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-full-67f15dce&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;StrategyPanel&quot;,&quot;elementRole&quot;:&quot;rounded-full&quot;,&quot;loc&quot;:{&quot;line&quot;:982,&quot;column&quot;:25}}">
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
export default function KnowledgeBase(qoderProps) {
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
    <div className={["flex h-full", qoderProps?.className].filter(Boolean).join(" ")} data-component="knowledge-base" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Left: Category Tree */}
      <div
        className="flex w-72 flex-col lg:w-80"
        style={{
          borderRight: '1px solid var(--cursor-border-10)',
          background: 'var(--cursor-surface-400)',
        }}
       data-qoder-id="qel-flex-8f0b1d9b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-8f0b1d9b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1023,&quot;column&quot;:7}}">
        <div className="p-3" style={{ borderBottom: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-p-3-4853f459" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-3-4853f459&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;p-3&quot;,&quot;loc&quot;:{&quot;line&quot;:1030,&quot;column&quot;:9}}">
          <h2 className="mb-2 text-sm font-semibold cursor-display" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-mb-2-0451f4a9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-2-0451f4a9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;mb-2&quot;,&quot;loc&quot;:{&quot;line&quot;:1031,&quot;column&quot;:11}}">
            食安知识库
          </h2>
          <div className="relative" data-qoder-id="qel-relative-9a9616c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-relative-9a9616c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;relative&quot;,&quot;loc&quot;:{&quot;line&quot;:1034,&quot;column&quot;:11}}">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-absolute-dac889f4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-dac889f4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:1035,&quot;column&quot;:13}}"/>
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
             data-qoder-id="qel-w-full-e93cc0e7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-e93cc0e7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:1036,&quot;column&quot;:13}}"/>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin py-2" data-qoder-id="qel-flex-1-80e8d866" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-80e8d866&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:1060,&quot;column&quot;:9}}">
          {filteredCategories.map((cat) => (
            <TreeNode
              key={cat.id}
              category={cat}
              selectedId={selectedEntry?.id}
              onSelect={(entry) => {
                setSelectedEntry(entry)
                setRightTab('detail')
              }}
             data-qoder-id="qel-treenode-0dbd6455" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-treenode-0dbd6455&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;treenode&quot;,&quot;loc&quot;:{&quot;line&quot;:1062,&quot;column&quot;:13}}"/>
          ))}
        </div>

        <div className="p-3" style={{ borderTop: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-p-3-4351ade3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-3-4351ade3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;p-3&quot;,&quot;loc&quot;:{&quot;line&quot;:1074,&quot;column&quot;:9}}">
          <p className="text-[11px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-583b3e53" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-583b3e53&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:1075,&quot;column&quot;:11}}">
            {FOOD_SAFETY_CATEGORIES.length} 大类 / {FOOD_SAFETY_CATEGORIES.reduce((a, c) => a + c.children.length, 0)} 子分类 · 23标签闭集
          </p>
        </div>
      </div>

      {/* Right: Detail + Panels */}
      <div className="flex flex-1 flex-col overflow-y-auto scrollbar-thin" data-qoder-id="qel-flex-fd037c00" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-fd037c00&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1082,&quot;column&quot;:7}}">
        {/* Tab bar */}
        <div className="flex gap-1 px-6 pt-4 pb-2" style={{ borderBottom: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-flex-fe037d93" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-fe037d93&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:1084,&quot;column&quot;:9}}">
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
               data-qoder-id="qel-gap-1-5-106cfbcc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-gap-1-5-106cfbcc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;gap-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:1093,&quot;column&quot;:15}}">
                <TabIcon className="h-3 w-3"  data-qoder-id="qel-h-3-e4e32521" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-e4e32521&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:1104,&quot;column&quot;:17}}"/>
                {tab.label}
              </Button>
            )
          })}
        </div>

        <div className="flex-1 p-6" data-qoder-id="qel-flex-1-88e8e4fe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-88e8e4fe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:1111,&quot;column&quot;:9}}">
          {rightTab === 'detail' && (
            <div className="space-y-6" data-qoder-id="qel-space-y-6-f1145d7d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-6-f1145d7d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;space-y-6&quot;,&quot;loc&quot;:{&quot;line&quot;:1113,&quot;column&quot;:13}}">
              <EntryDetail entry={selectedEntry}  data-qoder-id="qel-entrydetail-533aeae3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-entrydetail-533aeae3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;entrydetail&quot;,&quot;loc&quot;:{&quot;line&quot;:1114,&quot;column&quot;:15}}"/>
              <RAGTestPanel  data-qoder-id="qel-ragtestpanel-5cedaa78" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ragtestpanel-5cedaa78&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;ragtestpanel&quot;,&quot;loc&quot;:{&quot;line&quot;:1115,&quot;column&quot;:15}}"/>
            </div>
          )}
          {rightTab === 'strategy' && <StrategyPanel  data-qoder-id="qel-strategypanel-5c3aa451" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strategypanel-5c3aa451&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;strategypanel&quot;,&quot;loc&quot;:{&quot;line&quot;:1118,&quot;column&quot;:39}}"/>}
          {rightTab === 'boundary' && <BoundaryPairsPanel  data-qoder-id="qel-boundarypairspanel-a5876804" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-boundarypairspanel-a5876804&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;boundarypairspanel&quot;,&quot;loc&quot;:{&quot;line&quot;:1119,&quot;column&quot;:39}}"/>}
          {rightTab === 'script' && <ScriptLibrary  data-qoder-id="qel-scriptlibrary-d73b7d53" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-scriptlibrary-d73b7d53&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/knowledge/KnowledgeBase.jsx&quot;,&quot;componentName&quot;:&quot;KnowledgeBase&quot;,&quot;elementRole&quot;:&quot;scriptlibrary&quot;,&quot;loc&quot;:{&quot;line&quot;:1120,&quot;column&quot;:37}}"/>}
        </div>
      </div>
    </div>
  )
}
