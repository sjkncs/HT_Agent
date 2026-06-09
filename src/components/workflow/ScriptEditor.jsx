import { useState } from 'react'
import {
  FileText, Edit3, Eye, Save, Play, Variable, Code,
  CheckCircle2, AlertCircle, Plus, ChevronDown, Braces
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { cn } from '../../lib/utils.js'
import { SCRIPT_TEMPLATES } from '../../lib/workflow-data.js'

/* ─── Variable Chip — Cursor pill ─── */
function VariableChip({ name, onClick, ...qoderProps }) {
  return (
    <button
      onClick={() => onClick?.(name)}
      className={["inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors hover:text-[var(--cursor-error)]", qoderProps?.className].filter(Boolean).join(" ")}
      style={{ ...({ background: 'var(--cursor-surface-500)', color: 'var(--cursor-border-55)', borderRadius: '9999px' }), ...(qoderProps?.style) }}
     data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <Braces className="h-3 w-3"  data-qoder-id="qel-h-3-e645fed5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-e645fed5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;VariableChip&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:18,&quot;column&quot;:7}}"/>
      {name}
    </button>
  )
}

/* ─── Template Preview — Cursor card ─── */
function TemplatePreview({ template, variables, ...qoderProps }) {
  let preview = template
  const mockValues = {
    category: '外源性异物/毛发', product_name: '多肉葡萄', store_name: '南山科技园店',
    coupon_amount: '30', refund_amount: '19', coupon_valid_days: '30',
    sla_hours: '4', subcategory: '毛发', symptoms: '轻微腹痛',
    store_callback: true, store_callback_sla_hours: '4',
  }
  preview = preview.replace(/\{\{(\w+)\}\}/g, (_, key) => mockValues[key] || `[${key}]`)
  preview = preview.replace(/\{\{#if \w+\}\}/g, '').replace(/\{\{\/if\}\}/g, '')

  return (
    <div className={["rounded-lg border p-4", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ background: 'var(--cursor-surface-300)', borderColor: 'var(--cursor-border-10)' }), ...(qoderProps?.style) }} data-component="template-preview" data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="mb-2 flex items-center gap-1.5" data-qoder-id="qel-mb-2-6dac2568" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-2-6dac2568&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;TemplatePreview&quot;,&quot;elementRole&quot;:&quot;mb-2&quot;,&quot;loc&quot;:{&quot;line&quot;:38,&quot;column&quot;:7}}">
        <Eye className="h-3.5 w-3.5" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-5-06ef26f7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-06ef26f7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;TemplatePreview&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:39,&quot;column&quot;:9}}"/>
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-142bd11b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-142bd11b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;TemplatePreview&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:40,&quot;column&quot;:9}}">预览效果</span>
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap cursor-serif" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-dc0b23cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-dc0b23cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;TemplatePreview&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:42,&quot;column&quot;:7}}">
        {preview}
      </div>
    </div>
  )
}

/* ─── Script Editor ─── */
export default function ScriptEditor(qoderProps) {
  const [templates] = useState(SCRIPT_TEMPLATES)
  const [selectedTemplate, setSelectedTemplate] = useState(SCRIPT_TEMPLATES[0])
  const [editContent, setEditContent] = useState(SCRIPT_TEMPLATES[0]?.template || '')
  const [mode, setMode] = useState('edit')
  const [isSaved, setIsSaved] = useState(true)
  const [testResult, setTestResult] = useState(null)

  const handleSelectTemplate = (tpl) => { setSelectedTemplate(tpl); setEditContent(tpl.template); setIsSaved(true); setTestResult(null) }
  const handleEdit = (value) => { setEditContent(value); setIsSaved(false) }
  const handleSave = () => { setIsSaved(true) }
  const handleTest = () => {
    setTestResult({
      success: true,
      output: editContent.replace(/\{\{(\w+)\}\}/g, (_, key) => `[${key}]`).replace(/\{\{#if \w+\}\}/g, '').replace(/\{\{\/if\}\}/g, ''),
      variables_found: (editContent.match(/\{\{(\w+)\}\}/g) || []).length,
    })
  }
  const insertVariable = (name) => { setEditContent((prev) => prev + `{{${name}}}`); setIsSaved(false) }

  return (
    <div className={["flex h-full", qoderProps?.className].filter(Boolean).join(" ")} data-component="script-editor" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Left: Template list — Cursor warm panel */}
      <div className="w-64 flex-shrink-0 border-r flex flex-col overflow-hidden" style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-w-64-88701dbf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-64-88701dbf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;w-64&quot;,&quot;loc&quot;:{&quot;line&quot;:73,&quot;column&quot;:7}}">
        <div className="flex items-center justify-between border-b px-3 py-2.5" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-flex-878be87e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-878be87e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:74,&quot;column&quot;:9}}">
          <h3 className="text-sm font-semibold cursor-title" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-33ae36c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-33ae36c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:75,&quot;column&quot;:11}}">话术模板</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="新建模板" data-qoder-id="qel-h-7-a4dcd1ba" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-7-a4dcd1ba&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;h-7&quot;,&quot;loc&quot;:{&quot;line&quot;:76,&quot;column&quot;:11}}"><Plus className="h-4 w-4"  data-qoder-id="qel-h-4-94ae0ee6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-94ae0ee6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:76,&quot;column&quot;:80}}"/></Button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1" data-qoder-id="qel-flex-1-90720f2c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-90720f2c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:78,&quot;column&quot;:9}}">
          {templates.map((tpl) => (
            <button key={tpl.id} onClick={() => handleSelectTemplate(tpl)}
              className={cn('w-full text-left rounded-lg px-3 py-2.5 transition-colors',
                selectedTemplate?.id === tpl.id
                  ? 'border'
                  : 'hover:bg-[var(--cursor-surface-300)] border border-transparent'
              )}
              style={selectedTemplate?.id === tpl.id ? { background: 'var(--cursor-surface-500)', borderColor: 'var(--cursor-border-20)' } : {}}
             data-qoder-id="qel-button-17574495" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-17574495&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:80,&quot;column&quot;:13}}">
              <div className="flex items-center gap-2" data-qoder-id="qel-flex-898beba4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-898beba4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:88,&quot;column&quot;:15}}">
                <FileText className="h-3.5 w-3.5 flex-shrink-0" style={{ color: selectedTemplate?.id === tpl.id ? 'var(--cursor-orange)' : 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-5-6376eed8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-6376eed8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:89,&quot;column&quot;:17}}"/>
                <span className="text-sm font-medium truncate" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-b45c5a62" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-b45c5a62&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:90,&quot;column&quot;:17}}">{tpl.name}</span>
              </div>
              <p className="mt-1 text-[11px] truncate pl-5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-mt-1-a9ac4002" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-1-a9ac4002&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;mt-1&quot;,&quot;loc&quot;:{&quot;line&quot;:92,&quot;column&quot;:15}}">{tpl.category}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Center: Editor */}
      <div className="flex-1 flex flex-col overflow-hidden" data-qoder-id="qel-flex-1-1e79aa7b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-1e79aa7b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:99,&quot;column&quot;:7}}">
        {/* Editor toolbar */}
        <div className="flex items-center justify-between border-b px-4 py-2" style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-flex-80899ee2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-80899ee2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:101,&quot;column&quot;:9}}">
          <div className="flex items-center gap-3" data-qoder-id="qel-flex-7f899d4f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-7f899d4f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:102,&quot;column&quot;:11}}">
            <h3 className="text-sm font-semibold cursor-title" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-39b07ecf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-39b07ecf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:103,&quot;column&quot;:13}}">{selectedTemplate?.name}</h3>
            {!isSaved && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: 'hsl(33 80% 94%)', color: 'var(--cursor-gold)' }} data-qoder-id="qel-rounded-full-47c52432" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-full-47c52432&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;rounded-full&quot;,&quot;loc&quot;:{&quot;line&quot;:105,&quot;column&quot;:15}}">未保存</span>
            )}
          </div>
          <div className="flex items-center gap-2" data-qoder-id="qel-flex-7c899896" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-7c899896&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:108,&quot;column&quot;:11}}">
            <div className="flex rounded-lg border p-0.5" style={{ borderColor: 'var(--cursor-border-10)' }} data-qoder-id="qel-flex-7b899703" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-7b899703&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:109,&quot;column&quot;:13}}">
              {['edit', 'split', 'preview'].map((m) => (
                <Button key={m} variant="ghost" size="sm" onClick={() => setMode(m)}
                  className={cn('h-7 px-2.5', mode === m && 'bg-[var(--cursor-surface-500)]')} style={{ borderRadius: 'var(--seed-radius)' }} data-qoder-id="qel-button-fbc52d28" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-fbc52d28&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:111,&quot;column&quot;:17}}">
                  {m === 'edit' ? <Edit3 className="h-3 w-3 mr-1"  data-qoder-id="qel-h-3-2684c41a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-2684c41a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:113,&quot;column&quot;:35}}"/> : null}
                  {m === 'preview' ? <Eye className="h-3 w-3 mr-1"  data-qoder-id="qel-h-3-6f283905" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-6f283905&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:114,&quot;column&quot;:38}}"/> : null}
                  {m === 'split' ? <Code className="h-3 w-3 mr-1"  data-qoder-id="qel-h-3-40ebc04d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-40ebc04d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;h-3&quot;,&quot;loc&quot;:{&quot;line&quot;:115,&quot;column&quot;:36}}"/> : null}
                  {m === 'edit' ? '编辑' : m === 'preview' ? '预览' : '分屏'}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={handleTest} data-qoder-id="qel-button-7dc22837" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-7dc22837&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:120,&quot;column&quot;:13}}"><Play className="h-3.5 w-3.5 mr-1"  data-qoder-id="qel-h-3-5-143c8758" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-143c8758&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:120,&quot;column&quot;:68}}"/>测试</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaved} style={{ borderRadius: 'var(--seed-radius)' }} data-qoder-id="qel-button-7fc22b5d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-7fc22b5d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:121,&quot;column&quot;:13}}"><Save className="h-3.5 w-3.5 mr-1"  data-qoder-id="qel-h-3-5-47c9b75b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-47c9b75b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:121,&quot;column&quot;:136}}"/>保存</Button>
          </div>
        </div>

        {/* Variable bar */}
        <div className="flex items-center gap-2 border-b px-4 py-2 overflow-x-auto scrollbar-thin" style={{ background: 'var(--cursor-surface-300)', borderColor: 'var(--cursor-border-10)' }} data-component="variable-bar" data-qoder-id="qel-variable-bar-c5dd17b2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-variable-bar-c5dd17b2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;variable-bar&quot;,&quot;loc&quot;:{&quot;line&quot;:126,&quot;column&quot;:9}}">
          <Variable className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }}  data-qoder-id="qel-h-3-5-7224218a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-3-5-7224218a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;h-3-5&quot;,&quot;loc&quot;:{&quot;line&quot;:127,&quot;column&quot;:11}}"/>
          <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-198ea32b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-198ea32b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:128,&quot;column&quot;:11}}">变量:</span>
          {(selectedTemplate?.variables || []).map((v) => (<VariableChip key={v} name={v} onClick={insertVariable}  data-qoder-id="qel-variablechip-045d4a28" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-variablechip-045d4a28&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;variablechip&quot;,&quot;loc&quot;:{&quot;line&quot;:129,&quot;column&quot;:60}}"/>))}
        </div>

        {/* Editor area */}
        <div className="flex-1 flex overflow-hidden" data-qoder-id="qel-flex-1-a176a71d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-a176a71d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:133,&quot;column&quot;:9}}">
          {(mode === 'edit' || mode === 'split') && (
            <div className={cn('flex-1 flex flex-col overflow-hidden', mode === 'split' && 'border-r')} style={mode === 'split' ? { borderColor: 'var(--cursor-border-10)' } : {}} data-qoder-id="qel-div-6e70de03" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-6e70de03&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:135,&quot;column&quot;:13}}">
              <div className="flex-1 overflow-y-auto scrollbar-thin" data-qoder-id="qel-flex-1-297e38fa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-297e38fa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:136,&quot;column&quot;:15}}">
                <textarea value={editContent} onChange={(e) => handleEdit(e.target.value)}
                  className="h-full w-full resize-none p-4 font-mono text-sm leading-relaxed focus:outline-none"
                  style={{ background: 'var(--cursor-cream)', color: 'var(--cursor-ink)' }}
                  placeholder="在此编辑话术模板...&#10;&#10;使用 {{变量名}} 插入动态内容&#10;使用 {{#if 变量}}...{{/if}} 添加条件"
                  spellCheck={false}  data-qoder-id="qel-h-full-38a97c01" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-full-38a97c01&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;h-full&quot;,&quot;loc&quot;:{&quot;line&quot;:137,&quot;column&quot;:17}}"/>
              </div>
            </div>
          )}
          {(mode === 'preview' || mode === 'split') && (
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4" style={{ background: 'var(--cursor-cream)' }} data-qoder-id="qel-flex-1-277e35d4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-277e35d4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:146,&quot;column&quot;:13}}">
              <TemplatePreview template={editContent} variables={selectedTemplate?.variables}  data-qoder-id="qel-templatepreview-102066f3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-templatepreview-102066f3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;templatepreview&quot;,&quot;loc&quot;:{&quot;line&quot;:147,&quot;column&quot;:15}}"/>
              {testResult && (
                <div className="mt-4 rounded-lg border p-4" style={{ background: 'var(--cursor-surface-400)', borderColor: 'var(--cursor-border-10)' }} data-component="test-result" data-qoder-id="qel-test-result-abe22a4f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-test-result-abe22a4f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;test-result&quot;,&quot;loc&quot;:{&quot;line&quot;:149,&quot;column&quot;:17}}">
                  <div className="mb-2 flex items-center gap-2" data-qoder-id="qel-mb-2-d8cc7fa4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-2-d8cc7fa4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;mb-2&quot;,&quot;loc&quot;:{&quot;line&quot;:150,&quot;column&quot;:19}}">
                    {testResult.success ? (<CheckCircle2 className="h-4 w-4" style={{ color: 'var(--cursor-success)' }}  data-qoder-id="qel-h-4-7b6e43e1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-7b6e43e1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:151,&quot;column&quot;:44}}"/>) : (<AlertCircle className="h-4 w-4" style={{ color: 'var(--cursor-error)' }}  data-qoder-id="qel-h-4-d6d5874e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-4-d6d5874e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;h-4&quot;,&quot;loc&quot;:{&quot;line&quot;:151,&quot;column&quot;:128}}"/>)}
                    <span className="text-xs font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-89046007" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-89046007&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:152,&quot;column&quot;:21}}">测试结果</span>
                    <span className="ml-auto text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-ml-auto-3ab6946d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-auto-3ab6946d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;ml-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:153,&quot;column&quot;:21}}">发现 {testResult.variables_found} 个变量</span>
                  </div>
                  <pre className="rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap font-mono" style={{ background: 'var(--cursor-surface-300)', color: 'var(--cursor-ink)' }} data-qoder-id="qel-rounded-lg-17f39a61" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-lg-17f39a61&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/workflow/ScriptEditor.jsx&quot;,&quot;componentName&quot;:&quot;ScriptEditor&quot;,&quot;elementRole&quot;:&quot;rounded-lg&quot;,&quot;loc&quot;:{&quot;line&quot;:155,&quot;column&quot;:19}}">{testResult.output}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
