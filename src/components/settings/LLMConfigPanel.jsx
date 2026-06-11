import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { setLLMConfig, getLLMConfig, isLLMConfigured, API_PRESETS, chatCompletion, getModelDisplayName } from '../../lib/llm-client.js'

const PRESET_KEYS = Object.keys(API_PRESETS)

/** Safe numeric parsers — return previous value on NaN */
const safeInt = (v, prev) => { const n = parseInt(v); return Number.isNaN(n) ? prev : n }
const safeFloat = (v, prev) => { const n = parseFloat(v); return Number.isNaN(n) ? prev : n }

/** 输入框基础样式 */
const inputStyle = {
  borderColor: 'var(--cursor-border-10)',
  background: 'var(--cursor-bg)',
  color: 'var(--cursor-ink)',
}
const inputClass = 'w-full rounded-md border px-2 py-1.5 text-xs font-mono'

/** 分区标题 */
function SectionTitle({ children, desc, ...qoderProps }) {
  return (
    <div className={["mb-2 mt-5 first:mt-0", qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <h3 className="text-xs font-semibold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-0365f487" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-0365f487&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;SectionTitle&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:22,&quot;column&quot;:7}}">{children}</h3>
      {desc && <p className="text-[10px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-4d84178f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-4d84178f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;SectionTitle&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:23,&quot;column&quot;:16}}">{desc}</p>}
    </div>
  )
}

/** 开关组件 */
function Toggle({ label, checked, onChange, desc, ...qoderProps }) {
  const handleToggle = () => onChange(!checked)
  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onChange(!checked)
    }
  }
  return (
    <label className={["flex items-center gap-2 cursor-pointer", qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        className="relative w-8 h-4 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{ background: checked ? 'var(--cursor-orange)' : 'var(--cursor-border-10)', outline: 'none' }}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
       data-qoder-id="qel-relative-1513546c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-relative-1513546c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;Toggle&quot;,&quot;elementRole&quot;:&quot;relative&quot;,&quot;loc&quot;:{&quot;line&quot;:39,&quot;column&quot;:7}}">
        <div
          className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform shadow-sm"
          style={{ transform: checked ? 'translateX(17px)' : 'translateX(2px)' }}
         data-qoder-id="qel-absolute-24a4c66c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-24a4c66c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;Toggle&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:48,&quot;column&quot;:9}}"/>
      </div>
      <div className="flex-1" data-qoder-id="qel-flex-1-f4224f47" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-f4224f47&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;Toggle&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:53,&quot;column&quot;:7}}">
        <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-11px-630fb622" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-630fb622&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;Toggle&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:54,&quot;column&quot;:9}}">{label}</span>
        {desc && <span className="block text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-block-bcc510ec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-bcc510ec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;Toggle&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:55,&quot;column&quot;:18}}">{desc}</span>}
      </div>
    </label>
  )
}

export default function LLMConfigPanel(qoderProps) {
  const [config, setConfig] = useState(getLLMConfig())
  const [selectedPreset, setSelectedPreset] = useState(() => {
    const current = getLLMConfig()
    for (const [key, preset] of Object.entries(API_PRESETS)) {
      if (key !== 'custom' && current.baseUrl === preset.baseUrl) return key
    }
    return 'nvidia' // 默认 NVIDIA
  })
  const [testStatus, setTestStatus] = useState(null)
  const [testResult, setTestResult] = useState('')
  const [saved, setSaved] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    const current = getLLMConfig()
    setConfig(current)
    for (const [key, preset] of Object.entries(API_PRESETS)) {
      if (key !== 'custom' && current.baseUrl === preset.baseUrl) {
        setSelectedPreset(key)
        break
      }
    }
  }, [])

  const handlePresetChange = (key) => {
    setSelectedPreset(key)
    if (key !== 'custom') {
      const preset = API_PRESETS[key]
      setConfig(prev => ({
        ...prev,
        baseUrl: preset.baseUrl,
        model: preset.models[0] || prev.model,
        enableThinking: preset.enableThinking ?? prev.enableThinking,
      }))
    }
  }

  const handleSave = () => {
    setLLMConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTest = async () => {
    setTestStatus('testing')
    setTestResult('')
    setLLMConfig(config)

    try {
      const result = await chatCompletion([
        { role: 'system', content: '你是喜茶食安客服阿喜。用一句话回复测试消息。' },
        { role: 'user', content: '测试连接' },
      ], {
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        model: config.model,
        maxTokens: 100,
        temperature: 0.3,
        timeout: 20000,
        enableThinking: config.enableThinking,
        reasoningBudget: config.reasoningBudget,
      })

      const parts = [`模型: ${getModelDisplayName(result.model)}`]
      if (result.reasoning_content) {
        parts.push(`推理链: ${result.reasoning_content.slice(0, 40)}...`)
      }
      parts.push(`回复: ${result.content.slice(0, 60)}...`)
      parts.push(`Token: ${result.usage?.total_tokens || '?'}`)
      if (result.usage?.reasoning_tokens > 0) {
        parts.push(`推理Token: ${result.usage.reasoning_tokens}`)
      }

      setTestStatus('success')
      setTestResult(parts.join(' | '))
    } catch (err) {
      setTestStatus('error')
      setTestResult(err.message || '连接失败')
    }
  }

  const configured = isLLMConfigured()
  const isNvidia = selectedPreset === 'nvidia'
  const currentPreset = API_PRESETS[selectedPreset]
  const currentModelMeta = currentPreset?.modelMeta?.[config.model]

  return (
    <div className={["flex-1 overflow-y-auto p-4 lg:p-6", qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="max-w-2xl mx-auto space-y-1" data-qoder-id="qel-max-w-2xl-95b45f75" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-max-w-2xl-95b45f75&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;max-w-2xl&quot;,&quot;loc&quot;:{&quot;line&quot;:150,&quot;column&quot;:7}}">
        {/* Settings Tab Navigation */}
        <div className="flex gap-1 mb-4 pb-2" style={{ borderBottom: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-flex-faaf6952" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-faaf6952&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:153,&quot;column&quot;:9}}">
          <Link to="/settings" style={{
            padding: '6px 14px',
            borderRadius: '6px 6px 0 0',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
            color: 'var(--cursor-orange)',
            borderBottom: '2px solid var(--cursor-orange)',
            background: 'transparent',
          }} data-qoder-id="qel-link-85755495" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-link-85755495&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;link&quot;,&quot;loc&quot;:{&quot;line&quot;:154,&quot;column&quot;:11}}">模型设置</Link>
          <Link to="/settings/services" style={{
            padding: '6px 14px',
            borderRadius: '6px 6px 0 0',
            fontSize: '12px',
            fontWeight: 500,
            textDecoration: 'none',
            color: 'var(--cursor-border-55)',
            borderBottom: '2px solid transparent',
            background: 'transparent',
          }} data-qoder-id="qel-link-7e754990" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-link-7e754990&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;link&quot;,&quot;loc&quot;:{&quot;line&quot;:164,&quot;column&quot;:11}}">服务 API 设置</Link>
        </div>

        {/* 页面标题 */}
        <div className="mb-4" data-qoder-id="qel-mb-4-f69dd851" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-f69dd851&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:152,&quot;column&quot;:9}}">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-ed1eb56f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-ed1eb56f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:153,&quot;column&quot;:11}}">模型设置</h2>
          <p className="text-[11px] mt-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-3595037c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-3595037c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:154,&quot;column&quot;:11}}">
            配置 LLM API 以启用真实大语言模型生成回复，支持 NVIDIA / OpenAI / DeepSeek 等 OpenAI 兼容接口
          </p>
        </div>

        {/* 状态指示 */}
        <div className="flex items-center gap-2 p-2 rounded-md" style={{ background: configured ? 'hsl(159 40% 94%)' : 'hsl(345 60% 96%)', border: `1px solid ${configured ? 'hsl(159 63% 33% / 0.12)' : 'hsl(345 63% 33% / 0.12)'}` }} data-qoder-id="qel-flex-f5af6173" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-f5af6173&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:160,&quot;column&quot;:9}}">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: configured ? 'var(--cursor-success)' : 'var(--cursor-error)' }}  data-qoder-id="qel-h-2-5-dd17c870" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-dd17c870&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:161,&quot;column&quot;:11}}"/>
          <span className="text-[11px] font-medium" style={{ color: configured ? 'var(--cursor-success)' : 'var(--cursor-error)' }} data-qoder-id="qel-text-11px-e391eca7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-e391eca7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:162,&quot;column&quot;:11}}">
            {configured ? `已连接 — ${getModelDisplayName(config.model)}` : '未配置 (使用模板引擎回复)'}
          </span>
        </div>

        {/* ═══ 推理模型配置 ═══ */}
        <SectionTitle desc="主推理模型的 API 端点和参数" data-qoder-id="qel-sectiontitle-ead949ee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sectiontitle-ead949ee&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;sectiontitle&quot;,&quot;loc&quot;:{&quot;line&quot;:168,&quot;column&quot;:9}}">推理模型</SectionTitle>

        {/* API 提供商选择 */}
        <div data-qoder-id="qel-div-e23f78a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-e23f78a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:171,&quot;column&quot;:9}}">
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-24754612" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-24754612&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:172,&quot;column&quot;:11}}">
            API 提供商
          </label>
          <select
            value={selectedPreset}
            onChange={e => handlePresetChange(e.target.value)}
            className="w-full rounded-md border px-2 py-1.5 text-xs"
            style={inputStyle}
           data-qoder-id="qel-w-full-d8b3d3d7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-d8b3d3d7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:175,&quot;column&quot;:11}}">
            {PRESET_KEYS.map(key => (
              <option key={key} value={key} data-qoder-id="qel-option-6518cae7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-6518cae7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:182,&quot;column&quot;:15}}">{API_PRESETS[key].name}</option>
            ))}
          </select>
        </div>

        {/* Base URL */}
        <div className="mt-2" data-qoder-id="qel-mt-2-24e029dd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-24e029dd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:188,&quot;column&quot;:9}}">
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-20753fc6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-20753fc6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:189,&quot;column&quot;:11}}">
            API 端点 (Base URL)
          </label>
          <input
            type="text"
            value={config.baseUrl}
            onChange={e => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
            placeholder="https://integrate.api.nvidia.com/v1"
            className={inputClass}
            style={inputStyle}
           data-qoder-id="qel-input-df4ccb90" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-df4ccb90&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:192,&quot;column&quot;:11}}"/>
        </div>

        {/* API Key */}
        <div className="mt-2" data-qoder-id="qel-mt-2-1fe021fe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-1fe021fe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:203,&quot;column&quot;:9}}">
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-1f753e33" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-1f753e33&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:204,&quot;column&quot;:11}}">
            API Key
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={e => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            placeholder="nvapi-... / sk-..."
            className={inputClass}
            style={inputStyle}
           data-qoder-id="qel-input-ec4ce007" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-ec4ce007&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:207,&quot;column&quot;:11}}"/>
        </div>

        {/* Model */}
        <div className="mt-2" data-qoder-id="qel-mt-2-1ae01a1f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-1ae01a1f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:218,&quot;column&quot;:9}}">
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-2a778e1b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-2a778e1b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:219,&quot;column&quot;:11}}">
            模型
          </label>
          {selectedPreset !== 'custom' && currentPreset?.models?.length > 0 ? (
            <select
              value={config.model}
              onChange={e => {
                const model = e.target.value
                const meta = currentPreset?.modelMeta?.[model]
                setConfig(prev => ({
                  ...prev,
                  model,
                  enableThinking: meta?.thinking ?? prev.enableThinking,
                  maxTokens: meta?.maxTokens ?? prev.maxTokens,
                }))
              }}
              className="w-full rounded-md border px-2 py-1.5 text-xs"
              style={inputStyle}
             data-qoder-id="qel-w-full-dcb618ba" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-dcb618ba&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:223,&quot;column&quot;:13}}">
              {currentPreset.models.map(m => {
                const meta = currentPreset.modelMeta?.[m]
                return (
                  <option key={m} value={m} data-qoder-id="qel-option-6316892a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-6316892a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:241,&quot;column&quot;:19}}">
                    {meta ? `${meta.label}${meta.thinking ? ' [Thinking]' : ''}` : m}
                  </option>
                )
              })}
            </select>
          ) : (
            <input
              type="text"
              value={config.model}
              onChange={e => setConfig(prev => ({ ...prev, model: e.target.value }))}
              placeholder="nvidia/nemotron-3-ultra-550b-a55b"
              className={inputClass}
              style={inputStyle}
             data-qoder-id="qel-input-5d49c053" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-5d49c053&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:248,&quot;column&quot;:13}}"/>
          )}
        </div>

        {/* NVIDIA Reasoning 开关 */}
        {isNvidia && (
          <div className="mt-3 p-2.5 rounded-md space-y-2" style={{ background: 'var(--cursor-surface-300)', border: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-mt-3-3b00aa48" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-3-3b00aa48&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;mt-3&quot;,&quot;loc&quot;:{&quot;line&quot;:261,&quot;column&quot;:11}}">
            <Toggle
              label="启用推理链 (Thinking)"
              desc={currentModelMeta?.thinking
                ? `${getModelDisplayName(config.model)} 支持思维链，提升复杂问题回答质量`
                : '当前模型不支持 thinking 模式'}
              checked={config.enableThinking || false}
              onChange={v => {
                if (!currentModelMeta || currentModelMeta.thinking) {
                  setConfig(prev => ({ ...prev, enableThinking: v }))
                }
              }}
             data-qoder-id="qel-toggle-151b0f21" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-toggle-151b0f21&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;toggle&quot;,&quot;loc&quot;:{&quot;line&quot;:262,&quot;column&quot;:13}}"/>
            {config.enableThinking && (
              <div data-qoder-id="qel-div-ef440a48" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ef440a48&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:275,&quot;column&quot;:15}}">
                <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-block-2f7795fa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-2f7795fa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:276,&quot;column&quot;:17}}">
                  推理 Token 预算: {config.reasoningBudget || 8192}
                </label>
                <input
                  type="range"
                  min="1024"
                  max="16384"
                  step="1024"
                  value={config.reasoningBudget || 8192}
                  onChange={e => setConfig(prev => ({ ...prev, reasoningBudget: safeInt(e.target.value, prev.reasoningBudget || 8192) }))}
                  className="w-full"
                 data-qoder-id="qel-w-full-416ab36f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-416ab36f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:279,&quot;column&quot;:17}}"/>
              </div>
            )}
          </div>
        )}

        {/* 基础参数 */}
        <div className="grid grid-cols-2 gap-3 mt-2" data-qoder-id="qel-grid-733bf510" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-733bf510&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:294,&quot;column&quot;:9}}">
          <div data-qoder-id="qel-div-674b82f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-674b82f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:295,&quot;column&quot;:11}}">
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-3179d7b7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-3179d7b7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:296,&quot;column&quot;:13}}">
              Temperature
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={e => setConfig(prev => ({ ...prev, temperature: safeFloat(e.target.value, prev.temperature) }))}
              className={inputClass}
              style={inputStyle}
             data-qoder-id="qel-input-de3dbf73" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-de3dbf73&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:299,&quot;column&quot;:13}}"/>
          </div>
          <div data-qoder-id="qel-div-644b7e3c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-644b7e3c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:310,&quot;column&quot;:11}}">
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-2c79cfd8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-2c79cfd8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:311,&quot;column&quot;:13}}">
              Max Tokens
            </label>
            <input
              type="number"
              min="64"
              max="16384"
              step="64"
              value={config.maxTokens}
              onChange={e => setConfig(prev => ({ ...prev, maxTokens: safeInt(e.target.value, prev.maxTokens) }))}
              className={inputClass}
              style={inputStyle}
             data-qoder-id="qel-input-e33dc752" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-e33dc752&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:314,&quot;column&quot;:13}}"/>
          </div>
        </div>

        {/* ═══ 内容安全护栏 ═══ */}
        <SectionTitle desc="使用 NVIDIA nemotron-3.5-content-safety 模型对回复进行安全检查" data-qoder-id="qel-sectiontitle-76d1d78d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sectiontitle-76d1d78d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;sectiontitle&quot;,&quot;loc&quot;:{&quot;line&quot;:328,&quot;column&quot;:9}}">内容安全护栏</SectionTitle>

        <div className="p-2.5 rounded-md space-y-2" style={{ background: 'var(--cursor-surface-300)', border: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-p-2-5-d494fd7e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-2-5-d494fd7e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;p-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:330,&quot;column&quot;:9}}">
          <Toggle
            label="启用内容安全检查"
            desc="对 Agent 回复进行 post-generation 安全审核 (3H Alignment)"
            checked={config.contentSafetyEnabled || false}
            onChange={v => setConfig(prev => ({ ...prev, contentSafetyEnabled: v }))}
           data-qoder-id="qel-toggle-92228fad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-toggle-92228fad&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;toggle&quot;,&quot;loc&quot;:{&quot;line&quot;:331,&quot;column&quot;:11}}"/>
          {config.contentSafetyEnabled && (
            <div data-qoder-id="qel-div-6e4b8dfa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-6e4b8dfa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:338,&quot;column&quot;:13}}">
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-b67ce7ad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-b67ce7ad&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:339,&quot;column&quot;:15}}">
                内容安全 API Key
              </label>
              <input
                type="password"
                value={config.contentSafetyKey || ''}
                onChange={e => setConfig(prev => ({ ...prev, contentSafetyKey: e.target.value }))}
                placeholder="nvapi-... (内容安全模型专用 key)"
                className={inputClass}
                style={inputStyle}
               data-qoder-id="qel-input-db3b7c23" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-db3b7c23&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:342,&quot;column&quot;:15}}"/>
              <p className="text-[10px] mt-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-c0dee267" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-c0dee267&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:350,&quot;column&quot;:15}}">
                使用 nemotron-3.5-content-safety 模型，独立于推理模型的 API Key
              </p>
            </div>
          )}
        </div>

        {/* ═══ 高级设置 ═══ */}
        <div className="mt-4" data-qoder-id="qel-mt-4-e8846c5c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-4-e8846c5c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;mt-4&quot;,&quot;loc&quot;:{&quot;line&quot;:358,&quot;column&quot;:9}}">
          <button
            className="text-[11px] font-medium px-0"
            style={{ color: 'var(--cursor-orange)', background: 'none', border: 'none' }}
            onClick={() => setShowAdvanced(!showAdvanced)}
           data-qoder-id="qel-text-11px-230a966e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-230a966e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:359,&quot;column&quot;:11}}">
            {showAdvanced ? '收起高级设置 ▴' : '展开高级设置 ▾'}
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-2" data-qoder-id="qel-space-y-2-df0744a7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-2-df0744a7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;space-y-2&quot;,&quot;loc&quot;:{&quot;line&quot;:369,&quot;column&quot;:11}}">
            <div className="grid grid-cols-2 gap-3" data-qoder-id="qel-grid-824089db" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-824089db&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:370,&quot;column&quot;:13}}">
              <div data-qoder-id="qel-div-60493959" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-60493959&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:371,&quot;column&quot;:15}}">
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-ae7cdb15" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-ae7cdb15&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:372,&quot;column&quot;:17}}">
                  Top-P
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.topP}
                  onChange={e => setConfig(prev => ({ ...prev, topP: safeFloat(e.target.value, prev.topP) }))}
                  className={inputClass}
                  style={inputStyle}
                 data-qoder-id="qel-input-e33b88bb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-e33b88bb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:375,&quot;column&quot;:17}}"/>
              </div>
              <div data-qoder-id="qel-div-f350dc87" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-f350dc87&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:386,&quot;column&quot;:15}}">
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-9d7efee9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-9d7efee9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:387,&quot;column&quot;:17}}">
                  Frequency Penalty
                </label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.05"
                  value={config.frequencyPenalty}
                  onChange={e => setConfig(prev => ({ ...prev, frequencyPenalty: safeFloat(e.target.value, prev.frequencyPenalty) }))}
                  className={inputClass}
                  style={inputStyle}
                 data-qoder-id="qel-input-ee4255d1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-ee4255d1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:390,&quot;column&quot;:17}}"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3" data-qoder-id="qel-grid-ed4370e3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-ed4370e3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:402,&quot;column&quot;:13}}">
              <div data-qoder-id="qel-div-ef50d63b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ef50d63b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:403,&quot;column&quot;:15}}">
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-a17f0535" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-a17f0535&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:404,&quot;column&quot;:17}}">
                  超时 (ms)
                </label>
                <input
                  type="number"
                  min="5000"
                  max="120000"
                  step="5000"
                  value={config.timeout}
                  onChange={e => setConfig(prev => ({ ...prev, timeout: safeInt(e.target.value, prev.timeout) }))}
                  className={inputClass}
                  style={inputStyle}
                 data-qoder-id="qel-input-f2425c1d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-f2425c1d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:407,&quot;column&quot;:17}}"/>
              </div>
              <div data-qoder-id="qel-div-f050d7ce" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-f050d7ce&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:418,&quot;column&quot;:15}}">
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-a47f09ee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-a47f09ee&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:419,&quot;column&quot;:17}}">
                  最大重试次数
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="1"
                  value={config.maxRetries}
                  onChange={e => setConfig(prev => ({ ...prev, maxRetries: safeInt(e.target.value, prev.maxRetries) }))}
                  className={inputClass}
                  style={inputStyle}
                 data-qoder-id="qel-input-e3424480" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-e3424480&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:422,&quot;column&quot;:17}}"/>
              </div>
            </div>
          </div>
        )}

        {/* ═══ 操作按钮 ═══ */}
        <div className="flex gap-2 mt-4" data-qoder-id="qel-flex-8caa3efa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-8caa3efa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:438,&quot;column&quot;:9}}">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md text-xs font-medium transition-colors"
            style={{
              background: saved ? 'var(--cursor-success)' : 'var(--cursor-orange)',
              color: '#fff',
              transition: 'all 0.15s ease',
              borderRadius: '8px',
            }}
           data-qoder-id="qel-px-4-ab7a3e46" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-ab7a3e46&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:439,&quot;column&quot;:11}}">
            {saved ? '已保存' : '保存配置'}
          </button>
          <button
            onClick={handleTest}
            disabled={testStatus === 'testing' || !config.apiKey}
            className="px-4 py-2 rounded-md text-xs font-medium border transition-colors"
            style={{
              borderColor: 'var(--cursor-border-10)',
              background: testStatus === 'success' ? 'hsl(159 40% 94%)' : testStatus === 'error' ? 'hsl(345 60% 96%)' : 'var(--cursor-surface-300)',
              color: testStatus === 'success' ? 'var(--cursor-success)' : testStatus === 'error' ? 'var(--cursor-error)' : 'var(--cursor-ink)',
              opacity: (!config.apiKey || testStatus === 'testing') ? 0.5 : 1,
              transition: 'all 0.15s ease',
              borderRadius: '8px',
            }}
           data-qoder-id="qel-px-4-aa7a3cb3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-aa7a3cb3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:449,&quot;column&quot;:11}}">
            {testStatus === 'testing' ? '测试中...' : '测试连接'}
          </button>
        </div>

        {/* 测试结果 */}
        {testResult && (
          <div className="rounded-md p-2.5 text-[10px] leading-relaxed" style={{
            background: testStatus === 'success' ? 'hsl(159 40% 94%)' : 'hsl(345 60% 96%)',
            border: `1px solid ${testStatus === 'success' ? 'hsl(159 63% 33% / 0.15)' : 'hsl(345 63% 33% / 0.15)'}`,
            color: testStatus === 'success' ? 'var(--cursor-success)' : 'var(--cursor-error)',
          }} data-qoder-id="qel-rounded-md-c29a0871" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-md-c29a0871&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;rounded-md&quot;,&quot;loc&quot;:{&quot;line&quot;:466,&quot;column&quot;:11}}">
            {testResult}
          </div>
        )}

        {/* ═══ 说明 ═══ */}
        <div className="text-[10px] leading-relaxed p-3 rounded-md" style={{ color: 'var(--cursor-border-55)', background: 'var(--cursor-surface-300)' }} data-qoder-id="qel-text-10px-ee79b106" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-ee79b106&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:476,&quot;column&quot;:9}}">
          <p className="font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-font-medium-47099b58" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-medium-47099b58&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;font-medium&quot;,&quot;loc&quot;:{&quot;line&quot;:477,&quot;column&quot;:11}}">配置说明</p>
          <p className="mb-1" data-qoder-id="qel-mb-1-050cd909" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-1-050cd909&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;mb-1&quot;,&quot;loc&quot;:{&quot;line&quot;:478,&quot;column&quot;:11}}">
            配置 LLM API 后，阿喜将使用真实大语言模型生成回复（基于 ICL 语境学习 + CAMEL 角色扮演框架）。
            未配置时使用模板回复。
          </p>
          <p className="mb-1" data-qoder-id="qel-mb-1-040cd776" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-1-040cd776&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;mb-1&quot;,&quot;loc&quot;:{&quot;line&quot;:482,&quot;column&quot;:11}}">
            <strong data-qoder-id="qel-strong-68446aa4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strong-68446aa4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;strong&quot;,&quot;loc&quot;:{&quot;line&quot;:483,&quot;column&quot;:13}}">Heytea-V1-Pro</strong> — Mamba-Transformer MoE，100万上下文，Agent推理/工具调用/规划首选。
          </p>
          <p className="mb-1" data-qoder-id="qel-mb-1-0e0ce734" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-1-0e0ce734&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;mb-1&quot;,&quot;loc&quot;:{&quot;line&quot;:485,&quot;column&quot;:11}}">
            <strong data-qoder-id="qel-strong-6a2ea77b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strong-6a2ea77b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;strong&quot;,&quot;loc&quot;:{&quot;line&quot;:486,&quot;column&quot;:13}}">Heytea-V1-Thinking-High</strong> — 推理旗舰，支持深度思维链，复杂食安问题最佳。
          </p>
          <p className="mb-1" data-qoder-id="qel-mb-1-0e0f25cb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-1-0e0f25cb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;mb-1&quot;,&quot;loc&quot;:{&quot;line&quot;:488,&quot;column&quot;:11}}">
            <strong data-qoder-id="qel-strong-6c2eaaa1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strong-6c2eaaa1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;strong&quot;,&quot;loc&quot;:{&quot;line&quot;:489,&quot;column&quot;:13}}">Heytea-V1-Flash</strong> — 快速响应，日常对话和简单咨询。
            <strong data-qoder-id="qel-strong-6b2ea90e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strong-6b2ea90e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;strong&quot;,&quot;loc&quot;:{&quot;line&quot;:490,&quot;column&quot;:13}}"> Heytea-V1-Lite</strong> — 轻量通用对话。
          </p>
          <p data-qoder-id="qel-p-21fd7419" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-21fd7419&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:492,&quot;column&quot;:11}}">
            <strong data-qoder-id="qel-strong-6d2eac34" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strong-6d2eac34&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/LLMConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;LLMConfigPanel&quot;,&quot;elementRole&quot;:&quot;strong&quot;,&quot;loc&quot;:{&quot;line&quot;:493,&quot;column&quot;:13}}">内容安全护栏</strong> — 对每条回复做安全检查 (3H Alignment)，防止有害输出。
          </p>
        </div>
      </div>
    </div>
  )
}
