import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Zap, Brain, GitBranch, GitFork, Puzzle, MessageCircle, Play,
  BookOpen, UserCheck, Clock, Settings, ChevronRight, GripVertical,
  Plus, Trash2, Copy, Eye, PlayCircle, PauseCircle, MoreVertical,
  ArrowRight, AlertCircle, CheckCircle2, XCircle, Download, Upload,
  Save, RotateCcw, Link2, Unlink
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { cn } from '../../lib/utils.js'
import { NODE_TYPES, MOCK_WORKFLOWS, EXECUTION_LOG } from '../../lib/workflow-data.js'

const iconMap = {
  Zap, Brain, GitBranch, GitFork, Puzzle, MessageCircle, Play,
  BookOpen, UserCheck, Clock,
}

/* ─── Deep clone helper ─── */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

/* ─── Generate unique ID ─── */
let idCounter = 100
function genId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${(++idCounter).toString(36)}`
}

/* ─── Flow Node (Editable) — Cursor warm style ─── */
function FlowNode({ node, isSelected, isConnectSource, onSelect, onDragStart, onPortClick, ...qoderProps }) {
  const nodeType = NODE_TYPES[node.type]
  const Icon = iconMap[nodeType?.icon] || Settings

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      style={{ ...({ cursor: 'grab' }), ...(qoderProps?.style) }}
      data-component={`node-${node.type}`}
      onMouseDown={(e) => { e.stopPropagation(); onDragStart(e, node) }}
      onClick={(e) => { e.stopPropagation(); onSelect(node) }}
     className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Shadow — Cursor atmospheric */}
      <rect x="1" y="2" width="160" height="56" rx="8" fill="rgba(0,0,0,0.06)"  data-qoder-id="qel-rect-0de2f6c3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-0de2f6c3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowNode&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:43,&quot;column&quot;:7}}"/>
      {/* Card — Cursor surface */}
      <rect
        x="0" y="0" width="160" height="56" rx="8"
        fill="var(--cursor-surface-400)"
        stroke={isSelected ? 'var(--cursor-orange)' : isConnectSource ? 'var(--cursor-read)' : 'var(--cursor-border-10)'}
        strokeWidth={isSelected || isConnectSource ? 2 : 1}
       data-qoder-id="qel-rect-0ce2f530" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-0ce2f530&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowNode&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:45,&quot;column&quot;:7}}"/>
      {/* Color accent bar — Cursor timeline color */}
      <rect x="0" y="0" width="4" height="56" rx="2" fill={nodeType?.color || 'var(--cursor-border-55)'}  data-qoder-id="qel-rect-13e30035" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-13e30035&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowNode&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:52,&quot;column&quot;:7}}"/>
      {/* Icon */}
      <foreignObject x="14" y="14" width="28" height="28" data-qoder-id="qel-foreignobject-e0e3132a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-foreignobject-e0e3132a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowNode&quot;,&quot;elementRole&quot;:&quot;foreignobject&quot;,&quot;loc&quot;:{&quot;line&quot;:54,&quot;column&quot;:7}}">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${nodeType?.color}18` }} data-qoder-id="qel-flex-94d2108b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-94d2108b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowNode&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:55,&quot;column&quot;:9}}">
          <Icon className="h-3.5 w-3.5" style={{ color: nodeType?.color }}  data-qoder-id="qel-h-3-5-45d12525" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-45d12525&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowNode&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:56,&quot;column&quot;:11}}"/>
        </div>
      </foreignObject>
      {/* Label */}
      <foreignObject x="48" y="10" width="105" height="36" data-qoder-id="qel-foreignobject-d5e301d9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-foreignobject-d5e301d9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowNode&quot;,&quot;elementRole&quot;:&quot;foreignobject&quot;,&quot;loc&quot;:{&quot;line&quot;:60,&quot;column&quot;:7}}">
        <div data-qoder-id="qel-div-0cbf1ad2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-0cbf1ad2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowNode&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:61,&quot;column&quot;:9}}">
          <p className="text-xs font-semibold leading-tight cursor-title" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-4eca0353" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-4eca0353&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowNode&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:62,&quot;column&quot;:11}}">
            {node.label}
          </p>
          <p className="text-[10px] leading-tight" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-052e1554" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-052e1554&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowNode&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:65,&quot;column&quot;:11}}">
            {nodeType?.label}
          </p>
        </div>
      </foreignObject>

      {/* Input port (left) */}
      {node.type !== 'trigger' && (
        <circle
          cx="0" cy="28" r="5"
          fill="var(--cursor-surface-400)"
          stroke={isConnectSource ? 'var(--cursor-read)' : 'var(--cursor-border-10)'}
          strokeWidth="1.5"
          className="cursor-crosshair"
          onClick={(e) => { e.stopPropagation(); onPortClick(node, 'in') }}
         data-qoder-id="qel-cursor-crosshair-8774f425" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cursor-crosshair-8774f425&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowNode&quot;,&quot;elementRole&quot;:&quot;cursor-crosshair&quot;,&quot;loc&quot;:{&quot;line&quot;:73,&quot;column&quot;:9}}"/>
      )}

      {/* Output port (right) */}
      <circle
        cx="160" cy="28" r="5"
        fill={isConnectSource ? 'var(--cursor-read)' : 'var(--cursor-surface-400)'}
        stroke={isConnectSource ? 'var(--cursor-read)' : 'var(--cursor-border-10)'}
        strokeWidth="1.5"
        className="cursor-crosshair"
        onClick={(e) => { e.stopPropagation(); onPortClick(node, 'out') }}
       data-qoder-id="qel-cursor-crosshair-8674f292" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cursor-crosshair-8674f292&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowNode&quot;,&quot;elementRole&quot;:&quot;cursor-crosshair&quot;,&quot;loc&quot;:{&quot;line&quot;:84,&quot;column&quot;:7}}"/>

      {/* Selection indicator — Cursor orange */}
      {isSelected && <circle cx="152" cy="8" r="4" fill="var(--cursor-orange)"  data-qoder-id="qel-circle-1b71e68a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-circle-1b71e68a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowNode&quot;,&quot;elementRole&quot;:&quot;circle&quot;,&quot;loc&quot;:{&quot;line&quot;:94,&quot;column&quot;:22}}"/>}
    </g>
  )
}

/* ─── Flow Edge (Selectable + Deletable) — Cursor warm ─── */
function FlowEdge({ edge, nodes, isSelected, onSelect, onDelete }) {
  const fromNode = nodes.find((n) => n.id === edge.from)
  const toNode = nodes.find((n) => n.id === edge.to)
  if (!fromNode || !toNode) return null

  const x1 = fromNode.x + 160, y1 = fromNode.y + 28
  const x2 = toNode.x, y2 = toNode.y + 28
  const midX = (x1 + x2) / 2

  const branchColors = { high: '#cf2d56', medium: '#c08532', low: '#1f8a65' }
  const strokeColor = edge.branch ? branchColors[edge.branch] : isSelected ? 'var(--cursor-orange)' : 'var(--cursor-border-55)'

  return (
    <g data-component="flow-edge" onClick={(e) => { e.stopPropagation(); onSelect(edge) }} className="cursor-pointer" data-qoder-id="qel-flow-edge-1d656a2f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flow-edge-1d656a2f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowEdge&quot;,&quot;elementRole&quot;:&quot;flow-edge&quot;,&quot;loc&quot;:{&quot;line&quot;:113,&quot;column&quot;:5}}">
      <path d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`} fill="none" stroke="transparent" strokeWidth="12"  data-qoder-id="qel-path-ee006c6d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-ee006c6d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowEdge&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:114,&quot;column&quot;:7}}"/>
      <path
        d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
        fill="none" stroke={strokeColor} strokeWidth={isSelected ? 2.5 : 1.5}
        strokeDasharray={edge.branch ? '4 3' : 'none'}
        markerEnd="url(#arrowhead)"
       data-qoder-id="qel-path-ed006ada" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-ed006ada&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowEdge&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:115,&quot;column&quot;:7}}"/>
      {edge.branch && (
        <text x={midX - 12} y={(y1 + y2) / 2 - 6} fontSize="9" fill={strokeColor} fontWeight="500" data-qoder-id="qel-text-b8c54f3b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-b8c54f3b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowEdge&quot;,&quot;elementRole&quot;:&quot;text&quot;,&quot;loc&quot;:{&quot;line&quot;:122,&quot;column&quot;:9}}">{edge.branch}</text>
      )}
      {isSelected && (
        <g transform={`translate(${midX - 8}, ${(y1 + y2) / 2 + 6})`} onClick={(e) => { e.stopPropagation(); onDelete(edge) }} className="cursor-pointer" data-qoder-id="qel-cursor-pointer-18d655e5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cursor-pointer-18d655e5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowEdge&quot;,&quot;elementRole&quot;:&quot;cursor-pointer&quot;,&quot;loc&quot;:{&quot;line&quot;:125,&quot;column&quot;:9}}">
          <rect x="-2" y="-2" width="20" height="16" rx="4" fill="var(--cursor-error)"  data-qoder-id="qel-rect-6c97157a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-6c97157a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowEdge&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:126,&quot;column&quot;:11}}"/>
          <text x="8" y="9" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold" data-qoder-id="qel-text-3fbdd4fb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-3fbdd4fb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;FlowEdge&quot;,&quot;elementRole&quot;:&quot;text&quot;,&quot;loc&quot;:{&quot;line&quot;:127,&quot;column&quot;:11}}">×</text>
        </g>
      )}
    </g>
  )
}

/* ─── Editable Config Panel — Cursor warm panel ─── */
function NodeConfigPanel({ node, onUpdate, onDelete, onClose }) {
  if (!node) return null
  const nodeType = NODE_TYPES[node.type]
  const [editLabel, setEditLabel] = useState(node.label)
  const [editConfig, setEditConfig] = useState(() => deepClone(node.config || {}))

  const handleSave = () => {
    onUpdate({ ...node, label: editLabel, config: editConfig })
  }

  const handleConfigChange = (key, value) => {
    setEditConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddArrayItem = (key) => {
    setEditConfig((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), `item_${(prev[key] || []).length + 1}`],
    }))
  }

  const handleRemoveArrayItem = (key, index) => {
    setEditConfig((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, i) => i !== index),
    }))
  }

  const inputClass = "mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-[var(--cursor-orange)] focus:ring-1 focus:ring-[rgba(245,78,0,0.12)]"
  const inputStyle = {
    background: 'var(--cursor-surface-100)',
    borderColor: 'var(--cursor-border-10)',
    color: 'var(--cursor-ink)',
  }

  return (
    <div
      className="animate-slide-in-right border-l w-80 flex-shrink-0 flex flex-col overflow-hidden"
      style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }}
      data-component="node-config-panel"
     data-qoder-id="qel-node-config-panel-4786039e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-node-config-panel-4786039e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;node-config-panel&quot;,&quot;loc&quot;:{&quot;line&quot;:171,&quot;column&quot;:5}}">
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-flex-e17fc8b6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-e17fc8b6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:176,&quot;column&quot;:7}}">
        <div className="flex items-center gap-2" data-qoder-id="qel-flex-e47fcd6f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-e47fcd6f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:177,&quot;column&quot;:9}}">
          <div className="h-2 w-2 rounded-full" style={{ background: nodeType?.color }}  data-qoder-id="qel-h-2-8084f5b4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-8084f5b4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;h-2&quot;,&quot;loc&quot;:{&quot;line&quot;:178,&quot;column&quot;:11}}"/>
          <h3 className="text-sm font-semibold cursor-title" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-53d0dfb2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-53d0dfb2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:179,&quot;column&quot;:11}}">
            编辑节点
          </h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} data-qoder-id="qel-h-7-be5cc658" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-7-be5cc658&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;h-7&quot;,&quot;loc&quot;:{&quot;line&quot;:183,&quot;column&quot;:9}}">
          <XCircle className="h-4 w-4"  data-qoder-id="qel-h-4-72f8c624" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-72f8c624&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:184,&quot;column&quot;:11}}"/>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4" data-qoder-id="qel-flex-1-88133b06" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-88133b06&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:188,&quot;column&quot;:7}}">
        {/* Label */}
        <div data-qoder-id="qel-div-ce6e53e6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ce6e53e6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:190,&quot;column&quot;:9}}">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-2bfb3bc7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-2bfb3bc7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:191,&quot;column&quot;:11}}">节点名称</label>
          <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className={inputClass} style={inputStyle}  data-qoder-id="qel-input-f7fe6acc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-f7fe6acc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:192,&quot;column&quot;:11}}"/>
        </div>

        {/* Type info (read-only) */}
        <div data-qoder-id="qel-div-cd6e5253" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-cd6e5253&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:196,&quot;column&quot;:9}}">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-26fb33e8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-26fb33e8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:197,&quot;column&quot;:11}}">节点类型</label>
          <p className="mt-1 text-sm" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-mt-1-e316a246" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-e316a246&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:198,&quot;column&quot;:11}}">{nodeType?.label}</p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-0-5-9da2ad1c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-9da2ad1c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:199,&quot;column&quot;:11}}">{nodeType?.description}</p>
        </div>

        {/* Editable config fields */}
        {Object.entries(editConfig).map(([key, value]) => (
          <div key={key} data-qoder-id="qel-div-d16e589f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d16e589f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:204,&quot;column&quot;:11}}">
            <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-22fb2d9c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-22fb2d9c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:205,&quot;column&quot;:13}}">
              {key.replace(/_/g, ' ')}
            </label>
            {typeof value === 'string' ? (
              value.length > 60 ? (
                <textarea value={value} onChange={(e) => handleConfigChange(key, e.target.value)} rows={3} className={cn(inputClass, 'font-mono text-xs resize-y')} style={inputStyle}  data-qoder-id="qel-textarea-f6cab65d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-textarea-f6cab65d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;textarea&quot;,&quot;loc&quot;:{&quot;line&quot;:210,&quot;column&quot;:17}}"/>
              ) : (
                <input type="text" value={value} onChange={(e) => handleConfigChange(key, e.target.value)} className={inputClass} style={inputStyle}  data-qoder-id="qel-input-8c060f8d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-8c060f8d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:212,&quot;column&quot;:17}}"/>
              )
            ) : typeof value === 'number' ? (
              <input type="number" value={value} step={value < 1 ? 0.05 : 1} onChange={(e) => handleConfigChange(key, parseFloat(e.target.value) || 0)} className={inputClass} style={inputStyle}  data-qoder-id="qel-input-8b060dfa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-8b060dfa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:215,&quot;column&quot;:15}}"/>
            ) : typeof value === 'boolean' ? (
              <div className="mt-1 flex items-center gap-2" data-qoder-id="qel-mt-1-c98ad477" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-c98ad477&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:217,&quot;column&quot;:15}}">
                <button onClick={() => handleConfigChange(key, !value)} className={cn('relative h-5 w-9 rounded-full transition-colors', value ? 'bg-[var(--cursor-orange)]' : 'bg-[var(--cursor-surface-500)]')} data-qoder-id="qel-button-bfba8428" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-bfba8428&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:218,&quot;column&quot;:17}}">
                  <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform', value ? 'left-[18px]' : 'left-0.5')}  data-qoder-id="qel-span-56313b89" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-56313b89&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:219,&quot;column&quot;:19}}"/>
                </button>
                <span className="text-xs" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-785897c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-785897c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:221,&quot;column&quot;:17}}">{value ? '开启' : '关闭'}</span>
              </div>
            ) : Array.isArray(value) ? (
              <div className="mt-1 space-y-1" data-qoder-id="qel-mt-1-c58ace2b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-c58ace2b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:224,&quot;column&quot;:15}}">
                {value.map((item, i) => (
                  <div key={i} className="flex items-center gap-1" data-qoder-id="qel-flex-e5844c30" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-e5844c30&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:226,&quot;column&quot;:19}}">
                    <input type="text" value={typeof item === 'object' ? JSON.stringify(item) : String(item)} onChange={(e) => { const newArr = [...value]; newArr[i] = e.target.value; handleConfigChange(key, newArr) }} className={cn(inputClass, 'flex-1 rounded-md font-mono text-xs py-1.5 px-2.5')} style={inputStyle}  data-qoder-id="qel-input-840602f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-840602f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:227,&quot;column&quot;:21}}"/>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => handleRemoveArrayItem(key, i)} data-qoder-id="qel-h-6-85e8c6fd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-6-85e8c6fd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;h-6&quot;,&quot;loc&quot;:{&quot;line&quot;:228,&quot;column&quot;:21}}">
                      <Trash2 className="h-3 w-3" style={{ color: 'var(--cursor-error)' }}  data-qoder-id="qel-h-3-d9374c22" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-d9374c22&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:229,&quot;column&quot;:23}}"/>
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={() => handleAddArrayItem(key)} data-qoder-id="qel-w-full-ff8b84b0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-ff8b84b0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:233,&quot;column&quot;:17}}">
                  <Plus className="h-3 w-3 mr-1"  data-qoder-id="qel-h-3-75795154" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-75795154&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:234,&quot;column&quot;:19}}"/>添加项
                </Button>
              </div>
            ) : (
              <textarea value={JSON.stringify(value, null, 2)} onChange={(e) => { try { handleConfigChange(key, JSON.parse(e.target.value)) } catch {} }} rows={4} className={cn(inputClass, 'font-mono text-xs resize-y')} style={inputStyle}  data-qoder-id="qel-textarea-7cd0067d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-textarea-7cd0067d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;textarea&quot;,&quot;loc&quot;:{&quot;line&quot;:238,&quot;column&quot;:15}}"/>
            )}
          </div>
        ))}

        {/* Node ID (read-only) */}
        <div className="border-t pt-3" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-border-t-38c2cdd8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-border-t-38c2cdd8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;border-t&quot;,&quot;loc&quot;:{&quot;line&quot;:244,&quot;column&quot;:9}}">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-9bf5dbe9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-9bf5dbe9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:245,&quot;column&quot;:11}}">节点 ID</label>
          <p className="mt-1 text-xs font-mono" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-1-62115a05" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-62115a05&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:246,&quot;column&quot;:11}}">{node.id}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="border-t p-3 flex items-center gap-2" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-border-t-3bc2d291" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-border-t-3bc2d291&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;border-t&quot;,&quot;loc&quot;:{&quot;line&quot;:251,&quot;column&quot;:7}}">
        <Button variant="primary" size="sm" className="flex-1" style={{ borderRadius: 'var(--seed-radius)' }} onClick={handleSave} data-qoder-id="qel-flex-1-474a74cb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-474a74cb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:252,&quot;column&quot;:9}}">
          <Save className="h-3.5 w-3.5 mr-1"  data-qoder-id="qel-h-3-5-d4b9060c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-d4b9060c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:253,&quot;column&quot;:11}}"/>保存更改
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(node)} data-qoder-id="qel-button-027e26f3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-027e26f3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:255,&quot;column&quot;:9}}">
          <Trash2 className="h-3.5 w-3.5 mr-1" style={{ color: 'var(--cursor-error)' }}  data-qoder-id="qel-h-3-5-7b0d8400" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-7b0d8400&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodeConfigPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:256,&quot;column&quot;:11}}"/>删除
        </Button>
      </div>
    </div>
  )
}

/* ─── Coze Import/Export Dialog — Cursor modal ─── */
function CozeImportExportDialog({ mode, onClose, onImport, ...qoderProps }) {
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState(null)

  const sampleCozeWorkflow = JSON.stringify({
    version: '1.0', source: 'coze',
    workflow: {
      name: '导入的工作流', description: '从 Coze 平台导入',
      nodes: [
        { id: 'start', type: 'trigger', label: '开始', config: { triggerType: 'message' } },
        { id: 'llm_1', type: 'llm', label: 'LLM 处理', config: { model: 'qwen-max', temperature: 0.7 } },
        { id: 'end', type: 'action', label: '结束', config: { action: 'reply' } },
      ],
      edges: [{ from: 'start', to: 'llm_1' }, { from: 'llm_1', to: 'end' }],
    },
  }, null, 2)

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonText)
      if (!parsed.workflow || !parsed.workflow.nodes) { setError('缺少 workflow.nodes 字段，请检查 JSON 格式'); return }
      const nodes = parsed.workflow.nodes.map((n, i) => ({ ...n, id: n.id || genId('n'), x: n.x || (60 + (i % 4) * 200), y: n.y || (120 + Math.floor(i / 4) * 120), config: n.config || {} }))
      const edges = parsed.workflow.edges || []
      onImport({ id: genId('wf'), name: parsed.workflow.name || '导入的工作流', description: parsed.workflow.description || '从 Coze 导入', status: 'draft', version: '1.0', updatedAt: new Date().toISOString(), nodes, edges })
      onClose()
    } catch (e) { setError(`JSON 解析失败: ${e.message}`) }
  }

  return (
    <div className={["fixed inset-0 z-50 flex items-center justify-center", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ background: 'rgba(38, 37, 30, 0.4)' }), ...(qoderProps?.style) }} onClick={onClose} data-component="coze-dialog" data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="w-[560px] max-h-[80vh] flex flex-col overflow-hidden" style={{ background: 'var(--cursor-surface-400)', border: '1px solid var(--cursor-border-10)', borderRadius: 'var(--seed-radius)', boxShadow: 'var(--shadow-card)' }} onClick={(e) => e.stopPropagation()} data-qoder-id="qel-w-560px-c2866306" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-560px-c2866306&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;w-560px&quot;,&quot;loc&quot;:{&quot;line&quot;:294,&quot;column&quot;:7}}">
        <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-flex-022c6935" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-022c6935&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:295,&quot;column&quot;:9}}">
          <h3 className="text-sm font-semibold cursor-title" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-7d9c7e2d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-7d9c7e2d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:296,&quot;column&quot;:11}}">{mode === 'import' ? '导入 Coze 工作流' : '导出工作流 JSON'}</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} data-qoder-id="qel-h-7-38cab665" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-7-38cab665&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;h-7&quot;,&quot;loc&quot;:{&quot;line&quot;:297,&quot;column&quot;:11}}"><XCircle className="h-4 w-4"  data-qoder-id="qel-h-4-d89d6a73" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-d89d6a73&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:297,&quot;column&quot;:85}}"/></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3" data-qoder-id="qel-flex-1-ec7fbe6f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-ec7fbe6f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:299,&quot;column&quot;:9}}">
          {mode === 'import' && (<>
            <p className="text-xs cursor-serif" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-17aef66f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-17aef66f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:301,&quot;column&quot;:13}}">粘贴 Coze 工作流 JSON，或点击「加载示例」查看格式要求。支持 Coze Workflow v1/v2 格式自动转换。</p>
            <textarea value={jsonText} onChange={(e) => { setJsonText(e.target.value); setError(null) }} placeholder={'{\n  "version": "1.0",\n  "source": "coze",\n  "workflow": { "name": "...", "nodes": [...], "edges": [...] }\n}'} rows={14} className="w-full rounded-lg border p-3 font-mono text-xs leading-relaxed resize-y focus:outline-none focus:border-[var(--cursor-orange)]" style={{ background: 'var(--cursor-surface-100)', borderColor: 'var(--cursor-border-10)', color: 'var(--cursor-ink)' }}  data-qoder-id="qel-w-full-6d9b7789" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-6d9b7789&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:302,&quot;column&quot;:13}}"/>
            {error && (<div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: 'hsl(345 60% 96%)', color: 'var(--cursor-error)' }} data-qoder-id="qel-flex-f92a1c73" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-f92a1c73&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:303,&quot;column&quot;:24}}"><AlertCircle className="h-3.5 w-3.5 flex-shrink-0"  data-qoder-id="qel-h-3-5-fbabff9a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-fbabff9a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:303,&quot;column&quot;:167}}"/>{error}</div>)}
          </>)}
        </div>
        <div className="border-t px-5 py-3 flex items-center justify-between" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-border-t-772ffcad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-border-t-772ffcad&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;border-t&quot;,&quot;loc&quot;:{&quot;line&quot;:306,&quot;column&quot;:9}}">
          <div data-qoder-id="qel-div-e5633fac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-e5633fac&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:307,&quot;column&quot;:11}}">{mode === 'import' && (<Button variant="ghost" size="sm" onClick={() => { setJsonText(sampleCozeWorkflow); setError(null) }} data-qoder-id="qel-button-34a70297" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-34a70297&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:307,&quot;column&quot;:39}}"><Eye className="h-3.5 w-3.5 mr-1"  data-qoder-id="qel-h-3-5-8de5b233" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-8de5b233&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:307,&quot;column&quot;:141}}"/>加载示例</Button>)}</div>
          <div className="flex gap-2" data-qoder-id="qel-flex-ff2a25e5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-ff2a25e5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:308,&quot;column&quot;:11}}">
            <Button variant="ghost" size="sm" onClick={onClose} data-qoder-id="qel-button-27a6ee20" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-27a6ee20&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:309,&quot;column&quot;:13}}">取消</Button>
            {mode === 'import' && (<Button variant="accent" size="sm" onClick={handleImport} disabled={!jsonText.trim()} data-qoder-id="qel-button-28a6efb3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-28a6efb3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:310,&quot;column&quot;:36}}"><Upload className="h-3.5 w-3.5 mr-1"  data-qoder-id="qel-h-3-5-55297974" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-55297974&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;CozeImportExportDialog&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:310,&quot;column&quot;:122}}"/>导入</Button>)}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Execution Log Panel — Cursor warm log ─── */
function ExecutionLogPanel(qoderProps) {
  const statusIcons = {
    success: <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--cursor-success)' }}  data-qoder-id="qel-h-3-5-04917dde" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-04917dde&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;ExecutionLogPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:321,&quot;column&quot;:14}}"/>,
    escalated: <AlertCircle className="h-3.5 w-3.5" style={{ color: 'var(--cursor-gold)' }}  data-qoder-id="qel-h-3-5-f8c72ac5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-f8c72ac5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;ExecutionLogPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:322,&quot;column&quot;:16}}"/>,
    failed: <XCircle className="h-3.5 w-3.5" style={{ color: 'var(--cursor-error)' }}  data-qoder-id="qel-h-3-5-78345e4c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-78345e4c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;ExecutionLogPanel&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:323,&quot;column&quot;:13}}"/>,
  }
  return (
    <div className={["border-t", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }), ...(qoderProps?.style) }} data-component="execution-log" data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-flex-17c91a4c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-17c91a4c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;ExecutionLogPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:327,&quot;column&quot;:7}}">
        <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-e7f2f2e6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-e7f2f2e6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;ExecutionLogPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:328,&quot;column&quot;:9}}">执行日志</h4>
        <Button variant="ghost" size="sm" className="text-xs" data-qoder-id="qel-text-xs-bc0015f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-bc0015f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;ExecutionLogPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:329,&quot;column&quot;:9}}">查看全部<ChevronRight className="h-3 w-3 ml-1"  data-qoder-id="qel-h-3-27762f44" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-27762f44&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;ExecutionLogPanel&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:329,&quot;column&quot;:67}}"/></Button>
      </div>
      <div className="max-h-36 overflow-y-auto scrollbar-thin" data-qoder-id="qel-max-h-36-a3f9f854" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-max-h-36-a3f9f854&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;ExecutionLogPanel&quot;,&quot;elementRole&quot;:&quot;max-h-36&quot;,&quot;loc&quot;:{&quot;line&quot;:331,&quot;column&quot;:7}}">
        {EXECUTION_LOG.map((log) => (
          <div key={log.id} className="flex items-center gap-3 px-4 py-2 text-xs transition-colors hover:bg-[var(--cursor-surface-300)]" style={{ borderBottom: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-flex-2ec6ffea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-2ec6ffea&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;ExecutionLogPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:333,&quot;column&quot;:11}}">
            {statusIcons[log.status]}
            <span className="font-mono w-16 flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-font-mono-5d1aa3d2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-mono-5d1aa3d2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;ExecutionLogPanel&quot;,&quot;elementRole&quot;:&quot;font-mono&quot;,&quot;loc&quot;:{&quot;line&quot;:335,&quot;column&quot;:13}}">{log.timestamp}</span>
            <span className="w-24 flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-w-24-525241c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-24-525241c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;ExecutionLogPanel&quot;,&quot;elementRole&quot;:&quot;w-24&quot;,&quot;loc&quot;:{&quot;line&quot;:336,&quot;column&quot;:13}}">{log.workflow}</span>
            <span className="flex-1 truncate" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-flex-1-c19251f8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-c19251f8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;ExecutionLogPanel&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:337,&quot;column&quot;:13}}">{log.summary}</span>
            <span className="flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-flex-shrink-0-0f77a706" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-0f77a706&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;ExecutionLogPanel&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:338,&quot;column&quot;:13}}">{log.duration}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Node Palette — Cursor warm chips ─── */
function NodePalette({ onAddNode, ...qoderProps }) {
  return (
    <div className={["border-b p-3", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }), ...(qoderProps?.style) }} data-component="node-palette" data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mb-2-18007d4b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-2-18007d4b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodePalette&quot;,&quot;elementRole&quot;:&quot;mb-2&quot;,&quot;loc&quot;:{&quot;line&quot;:350,&quot;column&quot;:7}}">
        节点面板 <span className="text-[9px] normal-case opacity-60" data-qoder-id="qel-text-9px-8fb6427b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-8fb6427b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodePalette&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:351,&quot;column&quot;:14}}">（双击添加）</span>
      </h4>
      <div className="flex flex-wrap gap-1.5" data-qoder-id="qel-flex-dec5933f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-dec5933f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodePalette&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:353,&quot;column&quot;:7}}">
        {Object.entries(NODE_TYPES).map(([key, type]) => {
          const Icon = iconMap[type.icon] || Settings
          return (
            <div key={key} className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 cursor-pointer transition-all hover:shadow-sm" style={{ background: 'var(--cursor-surface-100)', borderColor: 'var(--cursor-border-10)' }} title={`${type.description}（双击添加到画布）`} onDoubleClick={() => onAddNode(key)} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cursor-border-20)' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--cursor-border-10)' }} data-qoder-id="qel-flex-ddc591ac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-ddc591ac&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodePalette&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:357,&quot;column&quot;:13}}">
              <Icon className="h-3 w-3" style={{ color: type.color }}  data-qoder-id="qel-h-3-7009362e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-7009362e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodePalette&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:358,&quot;column&quot;:15}}"/>
              <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-2f8ce9a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-2f8ce9a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;NodePalette&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:359,&quot;column&quot;:15}}">{type.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Workflow Editor (Main) ─── */
export default function WorkflowEditor(qoderProps) {
  const [workflows, setWorkflows] = useState(() => deepClone(MOCK_WORKFLOWS))
  const [selectedWfId, setSelectedWfId] = useState(MOCK_WORKFLOWS[0].id)
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedEdge, setSelectedEdge] = useState(null)
  const [showLog, setShowLog] = useState(true)
  const [zoom, setZoom] = useState(0.85)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dragNodeId, setDragNodeId] = useState(null)
  const [connectSource, setConnectSource] = useState(null)
  const [showCozeDialog, setShowCozeDialog] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  const svgRef = useRef(null)

  const selectedWorkflow = workflows.find((w) => w.id === selectedWfId) || workflows[0]
  const nodes = selectedWorkflow?.nodes || []
  const edges = selectedWorkflow?.edges || []

  const handleNodeSelect = useCallback((node) => { setSelectedNode(node); setSelectedEdge(null) }, [])

  const updateWorkflow = useCallback((wfId, updater) => {
    setWorkflows((prev) => prev.map((wf) => wf.id === wfId ? updater(deepClone(wf)) : wf))
    setHasChanges(true)
  }, [])

  const handleAddNode = useCallback((type) => {
    const nodeType = NODE_TYPES[type]
    if (!nodeType || !selectedWorkflow) return
    const maxX = Math.max(...nodes.map((n) => n.x), 200)
    const newNode = {
      id: genId('n'), type, label: nodeType.label, x: maxX + 60, y: 120 + Math.random() * 200,
      config: type === 'llm' ? { model: 'qwen-max', temperature: 0.7, max_tokens: 800 } : type === 'classifier' ? { model: 'qwen2.5-vl-finetuned', categories: [], confidence_threshold: 0.85 } : type === 'plugin' ? { plugin: '', params: {} } : type === 'condition' ? { branches: [] } : type === 'knowledge' ? { index: 'food_safety_kb_v2', topK: 3, similarity_threshold: 0.7 } : type === 'script' ? { template_id: '', variables: [] } : type === 'action' ? { action: '' } : type === 'human' ? { escalation_group: '', sla_hours: 4 } : type === 'delay' ? { seconds: 5 } : { triggerType: 'message' },
    }
    updateWorkflow(selectedWorkflow.id, (wf) => { wf.nodes.push(newNode); return wf })
    setSelectedNode(newNode)
  }, [selectedWorkflow, nodes, updateWorkflow])

  const handleDeleteNode = useCallback((node) => {
    if (!selectedWorkflow) return
    updateWorkflow(selectedWorkflow.id, (wf) => { wf.nodes = wf.nodes.filter((n) => n.id !== node.id); wf.edges = wf.edges.filter((e) => e.from !== node.id && e.to !== node.id); return wf })
    setSelectedNode(null)
  }, [selectedWorkflow, updateWorkflow])

  const handleUpdateNode = useCallback((updatedNode) => {
    if (!selectedWorkflow) return
    updateWorkflow(selectedWorkflow.id, (wf) => { const idx = wf.nodes.findIndex((n) => n.id === updatedNode.id); if (idx !== -1) wf.nodes[idx] = updatedNode; return wf })
    setSelectedNode(updatedNode)
  }, [selectedWorkflow, updateWorkflow])

  const handleDeleteEdge = useCallback((edge) => {
    if (!selectedWorkflow) return
    updateWorkflow(selectedWorkflow.id, (wf) => { wf.edges = wf.edges.filter((e) => !(e.from === edge.from && e.to === edge.to)); return wf })
    setSelectedEdge(null)
  }, [selectedWorkflow, updateWorkflow])

  const handlePortClick = useCallback((node, portType) => {
    if (portType === 'out') { setConnectSource(node); setSelectedNode(null); setSelectedEdge(null) }
    else if (portType === 'in' && connectSource) {
      if (connectSource.id !== node.id) {
        const newEdge = { from: connectSource.id, to: node.id }
        const exists = edges.some((e) => e.from === newEdge.from && e.to === newEdge.to)
        if (!exists) { updateWorkflow(selectedWorkflow.id, (wf) => { wf.edges.push(newEdge); return wf }) }
      }
      setConnectSource(null)
    } else { setConnectSource(null) }
  }, [connectSource, edges, selectedWorkflow, updateWorkflow])

  const handleDragStart = useCallback((e, node) => {
    if (!svgRef.current) return
    const svg = svgRef.current; const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
    setDragOffset({ x: svgP.x - node.x, y: svgP.y - node.y }); setDragNodeId(node.id); setIsDragging(true); setSelectedEdge(null)
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragNodeId || !svgRef.current) return
    const svg = svgRef.current; const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
    const newX = Math.max(0, Math.round((svgP.x - dragOffset.x) / 20) * 20); const newY = Math.max(0, Math.round((svgP.y - dragOffset.y) / 20) * 20)
    updateWorkflow(selectedWorkflow.id, (wf) => { const n = wf.nodes.find((nd) => nd.id === dragNodeId); if (n) { n.x = newX; n.y = newY }; return wf })
    if (selectedNode?.id === dragNodeId) { setSelectedNode((prev) => prev ? { ...prev, x: newX, y: newY } : prev) }
  }, [isDragging, dragNodeId, dragOffset, selectedWorkflow, updateWorkflow, selectedNode])

  const handleMouseUp = useCallback(() => { setIsDragging(false); setDragNodeId(null) }, [])
  const handleCanvasClick = useCallback(() => { setSelectedNode(null); setSelectedEdge(null); setConnectSource(null) }, [])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') { if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return; if (selectedNode) handleDeleteNode(selectedNode); else if (selectedEdge) handleDeleteEdge(selectedEdge) }
      if (e.key === 'Escape') { setConnectSource(null); setSelectedNode(null); setSelectedEdge(null) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedNode, selectedEdge, handleDeleteNode, handleDeleteEdge])

  const handleImportWorkflow = useCallback((newWf) => { setWorkflows((prev) => [...prev, newWf]); setSelectedWfId(newWf.id); setHasChanges(true) }, [])

  const handleExport = useCallback(() => {
    if (!selectedWorkflow) return
    const blob = new Blob([JSON.stringify({ version: selectedWorkflow.version, source: 'heytea-agent', workflow: selectedWorkflow }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${selectedWorkflow.name}_${selectedWorkflow.version}.json`; a.click(); URL.revokeObjectURL(url)
  }, [selectedWorkflow])

  const maxX = Math.max(...nodes.map((n) => n.x), 800) + 220
  const maxY = Math.max(...nodes.map((n) => n.y), 400) + 100

  return (
    <div className={["flex h-full flex-col", qoderProps?.className].filter(Boolean).join(" ")} data-component="workflow-editor" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Top toolbar — Cursor warm bar */}
      <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }} data-component="workflow-toolbar" data-qoder-id="qel-workflow-toolbar-05fa41b7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-workflow-toolbar-05fa41b7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;workflow-toolbar&quot;,&quot;loc&quot;:{&quot;line&quot;:479,&quot;column&quot;:7}}">
        <div className="flex items-center gap-3" data-qoder-id="qel-flex-2ccc3472" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-2ccc3472&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:480,&quot;column&quot;:9}}">
          <div className="flex gap-1" data-qoder-id="qel-flex-2dcc3605" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-2dcc3605&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:481,&quot;column&quot;:11}}">
            {workflows.map((wf) => (
              <Button key={wf.id} variant="ghost" size="sm" onClick={() => { setSelectedWfId(wf.id); setSelectedNode(null); setSelectedEdge(null); setConnectSource(null) }}
                className={cn(selectedWfId === wf.id && 'bg-[var(--cursor-surface-500)] text-[var(--cursor-ink)] font-medium')} style={{ borderRadius: 'var(--seed-radius)' }} data-qoder-id="qel-button-5bf63914" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-5bf63914&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:483,&quot;column&quot;:15}}">
                {wf.status === 'active' ? <PlayCircle className="h-3.5 w-3.5 mr-1.5" style={{ color: 'var(--cursor-success)' }}  data-qoder-id="qel-h-3-5-826aacc1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-826aacc1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:485,&quot;column&quot;:43}}"/> : <PauseCircle className="h-3.5 w-3.5 mr-1.5"  data-qoder-id="qel-h-3-5-bb611406" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-bb611406&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:485,&quot;column&quot;:134}}"/>}
                {wf.name}
                <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--cursor-surface-500)', color: 'var(--cursor-border-55)' }} data-qoder-id="qel-ml-1-5-faa8c258" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-1-5-faa8c258&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;ml-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:487,&quot;column&quot;:17}}">v{wf.version}</span>
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2" data-qoder-id="qel-flex-aecf3faf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-aecf3faf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:492,&quot;column&quot;:9}}">
          {hasChanges && (<span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: 'hsl(33 80% 94%)', color: 'var(--cursor-gold)' }} data-qoder-id="qel-rounded-full-62a2a93d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-full-62a2a93d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;rounded-full&quot;,&quot;loc&quot;:{&quot;line&quot;:493,&quot;column&quot;:27}}">未保存</span>)}
          <Button variant="ghost" size="sm" onClick={() => setShowCozeDialog('import')} data-qoder-id="qel-button-61f8811d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-61f8811d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:494,&quot;column&quot;:11}}"><Upload className="h-3.5 w-3.5 mr-1"  data-qoder-id="qel-h-3-5-3a38c0b7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-3a38c0b7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:494,&quot;column&quot;:89}}"/>导入</Button>
          <Button variant="ghost" size="sm" onClick={handleExport} data-qoder-id="qel-button-5bf877ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-5bf877ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:495,&quot;column&quot;:11}}"><Download className="h-3.5 w-3.5 mr-1"  data-qoder-id="qel-h-3-5-cf1abb0c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-cf1abb0c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:495,&quot;column&quot;:68}}"/>导出</Button>
          <Button variant="ghost" size="sm" onClick={() => setShowLog(!showLog)} data-qoder-id="qel-button-5df87ad1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-5df87ad1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:496,&quot;column&quot;:11}}"><Eye className="h-3.5 w-3.5 mr-1"  data-qoder-id="qel-h-3-5-ca967a39" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-ca967a39&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:496,&quot;column&quot;:82}}"/>日志</Button>
          <div className="h-4 w-px" style={{ background: 'var(--cursor-border-10)' }}  data-qoder-id="qel-h-4-e1ac4a09" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-e1ac4a09&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:497,&quot;column&quot;:11}}"/>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} data-qoder-id="qel-h-8-14e89ddf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-8-14e89ddf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;h-8&quot;,&quot;loc&quot;:{&quot;line&quot;:498,&quot;column&quot;:11}}"><span className="text-xs font-mono" data-qoder-id="qel-text-xs-a5f891ad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-a5f891ad&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:498,&quot;column&quot;:118}}">−</span></Button>
          <span className="text-xs font-mono w-10 text-center" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-xs-a4f8901a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-a4f8901a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:499,&quot;column&quot;:11}}">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} data-qoder-id="qel-h-8-8ff01b45" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-8-8ff01b45&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;h-8&quot;,&quot;loc&quot;:{&quot;line&quot;:500,&quot;column&quot;:11}}"><span className="text-xs font-mono" data-qoder-id="qel-text-xs-a2f88cf4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-a2f88cf4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:500,&quot;column&quot;:118}}">+</span></Button>
          <div className="h-4 w-px" style={{ background: 'var(--cursor-border-10)' }}  data-qoder-id="qel-h-4-ebae985e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-ebae985e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:501,&quot;column&quot;:11}}"/>
          <Button variant="accent" size="sm" onClick={() => setHasChanges(false)} data-qoder-id="qel-button-4af1a123" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-4af1a123&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:502,&quot;column&quot;:11}}"><Play className="h-3.5 w-3.5 mr-1"  data-qoder-id="qel-h-3-5-94c10f58" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-94c10f58&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:502,&quot;column&quot;:83}}"/>发布</Button>
        </div>
      </div>

      {/* Connection mode hint */}
      {connectSource && (
        <div className="flex items-center gap-2 border-b px-4 py-1.5" style={{ background: 'rgba(159, 187, 224, 0.12)', borderColor: 'rgba(159, 187, 224, 0.2)' }} data-component="connect-hint" data-qoder-id="qel-connect-hint-685e3266" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-connect-hint-685e3266&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;connect-hint&quot;,&quot;loc&quot;:{&quot;line&quot;:508,&quot;column&quot;:9}}">
          <Link2 className="h-3.5 w-3.5" style={{ color: 'var(--cursor-read)' }}  data-qoder-id="qel-h-3-5-06405fd8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-06405fd8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:509,&quot;column&quot;:11}}"/>
          <span className="text-xs" style={{ color: 'var(--cursor-read)' }} data-qoder-id="qel-text-xs-9cf88382" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-9cf88382&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:510,&quot;column&quot;:11}}">连线模式：从 <strong data-qoder-id="qel-strong-47fcb667" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strong-47fcb667&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;strong&quot;,&quot;loc&quot;:{&quot;line&quot;:510,&quot;column&quot;:84}}">{connectSource.label}</strong> 的输出端口 → 点击目标节点的输入端口完成连接。按 Esc 取消。</span>
          <Button variant="ghost" size="sm" className="h-6 ml-auto text-xs" onClick={() => setConnectSource(null)} data-qoder-id="qel-h-6-00468e53" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-6-00468e53&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;h-6&quot;,&quot;loc&quot;:{&quot;line&quot;:511,&quot;column&quot;:11}}">取消</Button>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden" data-qoder-id="qel-flex-40ca1557" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-40ca1557&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:516,&quot;column&quot;:7}}">
        {/* Left panel — Cursor warm sidebar */}
        <div className="w-56 flex-shrink-0 border-r overflow-y-auto scrollbar-thin" style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }} data-component="workflow-left-panel" data-qoder-id="qel-workflow-left-panel-60fec6d1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-workflow-left-panel-60fec6d1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;workflow-left-panel&quot;,&quot;loc&quot;:{&quot;line&quot;:518,&quot;column&quot;:9}}">
          <NodePalette onAddNode={handleAddNode}  data-qoder-id="qel-nodepalette-53f845c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-nodepalette-53f845c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;nodepalette&quot;,&quot;loc&quot;:{&quot;line&quot;:519,&quot;column&quot;:11}}"/>
          <div className="p-3 space-y-3" data-qoder-id="qel-p-3-0d8a6d05" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-3-0d8a6d05&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;p-3&quot;,&quot;loc&quot;:{&quot;line&quot;:520,&quot;column&quot;:11}}">
            <div data-qoder-id="qel-div-a8bc4fdb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a8bc4fdb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:521,&quot;column&quot;:13}}">
              <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-5eebdd5a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-5eebdd5a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:522,&quot;column&quot;:15}}">工作流信息</label>
              <h3 className="mt-1 text-sm font-semibold cursor-title" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-mt-1-fe99f9d9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-fe99f9d9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:523,&quot;column&quot;:15}}">{selectedWorkflow?.name}</h3>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-0-5-f1f5af7e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-0-5-f1f5af7e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;mt-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:524,&quot;column&quot;:15}}">{selectedWorkflow?.description}</p>
            </div>
            <div className="flex items-center gap-2" data-qoder-id="qel-flex-b0c276e2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-b0c276e2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:526,&quot;column&quot;:13}}">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: selectedWorkflow?.status === 'active' ? 'hsl(159 40% 94%)' : 'var(--cursor-surface-500)', color: selectedWorkflow?.status === 'active' ? 'var(--cursor-success)' : 'var(--cursor-border-55)' }} data-qoder-id="qel-inline-flex-8f6f8344" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-inline-flex-8f6f8344&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;inline-flex&quot;,&quot;loc&quot;:{&quot;line&quot;:527,&quot;column&quot;:15}}">
                {selectedWorkflow?.status === 'active' ? '运行中' : '草稿'}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-f75a0601" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-f75a0601&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:531,&quot;column&quot;:15}}">{nodes.length} 节点 · {edges.length} 连线</span>
            </div>
          </div>
          <div className="border-t p-3 space-y-2" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-border-t-7a81f3fb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-border-t-7a81f3fb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;border-t&quot;,&quot;loc&quot;:{&quot;line&quot;:534,&quot;column&quot;:11}}">
            <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-5bee1738" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-5bee1738&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:535,&quot;column&quot;:13}}">快速操作</label>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => handleAddNode('llm')} data-qoder-id="qel-w-full-192cd958" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-192cd958&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:536,&quot;column&quot;:13}}"><Brain className="h-3 w-3 mr-2" style={{ color: NODE_TYPES.llm.color }}  data-qoder-id="qel-h-3-a9c89a58" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-a9c89a58&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:536,&quot;column&quot;:125}}"/>添加 LLM 节点</Button>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => handleAddNode('plugin')} data-qoder-id="qel-w-full-1b2cdc7e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-1b2cdc7e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:537,&quot;column&quot;:13}}"><Puzzle className="h-3 w-3 mr-2" style={{ color: NODE_TYPES.plugin.color }}  data-qoder-id="qel-h-3-a8547210" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-a8547210&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:537,&quot;column&quot;:128}}"/>添加插件节点</Button>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => handleAddNode('condition')} data-qoder-id="qel-w-full-152cd30c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-152cd30c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:538,&quot;column&quot;:13}}"><GitFork className="h-3 w-3 mr-2" style={{ color: NODE_TYPES.condition.color }}  data-qoder-id="qel-h-3-5e094acf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5e094acf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:538,&quot;column&quot;:131}}"/>添加条件分支</Button>
          </div>
          <div className="border-t p-3 space-y-2" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-border-t-80843c04" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-border-t-80843c04&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;border-t&quot;,&quot;loc&quot;:{&quot;line&quot;:540,&quot;column&quot;:11}}">
            <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-63f06267" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-63f06267&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:541,&quot;column&quot;:13}}">运行统计</label>
            <div className="grid grid-cols-2 gap-2" data-qoder-id="qel-grid-d02e9f7d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-d02e9f7d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:542,&quot;column&quot;:13}}">
              <div className="rounded-lg p-2 text-center" style={{ background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-rounded-lg-701225b1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-701225b1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:543,&quot;column&quot;:15}}">
                <p className="text-lg font-semibold cursor-heading" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-lg-588f69df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-lg-588f69df&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;text-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:544,&quot;column&quot;:17}}">342</p>
                <p className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-f4487b96" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-f4487b96&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:545,&quot;column&quot;:17}}">今日调用</p>
              </div>
              <div className="rounded-lg p-2 text-center" style={{ background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-rounded-lg-6d1220f8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-6d1220f8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:547,&quot;column&quot;:15}}">
                <p className="text-lg font-semibold cursor-heading" style={{ color: 'var(--cursor-success)' }} data-qoder-id="qel-text-lg-5b8f6e98" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-lg-5b8f6e98&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;text-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:548,&quot;column&quot;:17}}">98.5%</p>
                <p className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-ff488ce7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-ff488ce7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:549,&quot;column&quot;:17}}">成功率</p>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Flow Canvas — Cursor warm cream dot grid */}
        <div className="flex-1 overflow-auto" data-component="flow-canvas" style={{ background: 'var(--cursor-cream)', backgroundImage: 'radial-gradient(circle, rgba(38, 37, 30, 0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }} data-qoder-id="qel-flow-canvas-cea9bd00" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flow-canvas-cea9bd00&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;flow-canvas&quot;,&quot;loc&quot;:{&quot;line&quot;:556,&quot;column&quot;:9}}">
          <svg ref={svgRef} width={maxX * zoom} height={maxY * zoom} viewBox={`0 0 ${maxX} ${maxY}`} className="min-w-full min-h-full" style={{ cursor: isDragging ? 'grabbing' : connectSource ? 'crosshair' : 'default' }} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={handleCanvasClick} data-qoder-id="qel-min-w-full-efe0389d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-min-w-full-efe0389d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;min-w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:557,&quot;column&quot;:11}}">
            <defs data-qoder-id="qel-defs-70114c62" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-defs-70114c62&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;defs&quot;,&quot;loc&quot;:{&quot;line&quot;:558,&quot;column&quot;:13}}">
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto" data-qoder-id="qel-arrowhead-c82af8d2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-arrowhead-c82af8d2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;arrowhead&quot;,&quot;loc&quot;:{&quot;line&quot;:559,&quot;column&quot;:15}}">
                <polygon points="0 0, 8 3, 0 6" fill="var(--cursor-border-55)"  data-qoder-id="qel-polygon-9fb428d4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-polygon-9fb428d4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;polygon&quot;,&quot;loc&quot;:{&quot;line&quot;:560,&quot;column&quot;:17}}"/>
              </marker>
            </defs>
            {edges.map((edge) => (<FlowEdge key={`${edge.from}-${edge.to}`} edge={edge} nodes={nodes} isSelected={selectedEdge?.from === edge.from && selectedEdge?.to === edge.to} onSelect={(e) => { setSelectedEdge(e); setSelectedNode(null) }} onDelete={handleDeleteEdge}  data-qoder-id="qel-flowedge-e5bda351" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flowedge-e5bda351&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;flowedge&quot;,&quot;loc&quot;:{&quot;line&quot;:563,&quot;column&quot;:35}}"/>))}
            {nodes.map((node) => (<FlowNode key={node.id} node={node} isSelected={selectedNode?.id === node.id} isConnectSource={connectSource?.id === node.id} onSelect={handleNodeSelect} onDragStart={handleDragStart} onPortClick={handlePortClick}  data-qoder-id="qel-flownode-4a24d65a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flownode-4a24d65a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;flownode&quot;,&quot;loc&quot;:{&quot;line&quot;:564,&quot;column&quot;:35}}"/>))}
          </svg>
        </div>

        {selectedNode && (<NodeConfigPanel node={selectedNode} onUpdate={handleUpdateNode} onDelete={handleDeleteNode} onClose={() => setSelectedNode(null)}  data-qoder-id="qel-nodeconfigpanel-aff32b79" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-nodeconfigpanel-aff32b79&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;nodeconfigpanel&quot;,&quot;loc&quot;:{&quot;line&quot;:568,&quot;column&quot;:27}}"/>)}
      </div>

      {showLog && <ExecutionLogPanel  data-qoder-id="qel-executionlogpanel-e092f650" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-executionlogpanel-e092f650&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;executionlogpanel&quot;,&quot;loc&quot;:{&quot;line&quot;:571,&quot;column&quot;:19}}"/>}
      {showCozeDialog && (<CozeImportExportDialog mode={showCozeDialog} onClose={() => setShowCozeDialog(null)} onImport={handleImportWorkflow}  data-qoder-id="qel-cozeimportexportdialog-c19398f3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-cozeimportexportdialog-c19398f3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/WorkflowEditor.jsx&quot;,&quot;componentName&quot;:&quot;WorkflowEditor&quot;,&quot;elementRole&quot;:&quot;cozeimportexportdialog&quot;,&quot;loc&quot;:{&quot;line&quot;:572,&quot;column&quot;:27}}"/>)}
    </div>
  )
}
