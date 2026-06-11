import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

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
      <h3 className="text-xs font-semibold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-xs-f9d7ba43" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-f9d7ba43&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;SectionTitle&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:16,&quot;column&quot;:7}}">{children}</h3>
      {desc && <p className="text-[10px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-0fc425c3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-0fc425c3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;SectionTitle&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:17,&quot;column&quot;:16}}">{desc}</p>}
    </div>
  )
}

/** 服务状态指示器 */
function StatusDot({ active, label, ...qoderProps }) {
  return (
    <div className={["flex items-center gap-2 p-2 rounded-md", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({
      background: active ? 'hsl(159 40% 94%)' : 'hsl(345 60% 96%)',
      border: `1px solid ${active ? 'hsl(159 63% 33% / 0.12)' : 'hsl(345 63% 33% / 0.12)'}`,
    }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="h-2.5 w-2.5 rounded-full" style={{ background: active ? 'var(--cursor-success)' : 'var(--cursor-error)' }}  data-qoder-id="qel-h-2-5-fc173eaa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-2-5-fc173eaa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;StatusDot&quot;,&quot;elementRole&quot;:&quot;h-2-5&quot;,&quot;loc&quot;:{&quot;line&quot;:29,&quot;column&quot;:7}}"/>
      <span className="text-[11px] font-medium" style={{ color: active ? 'var(--cursor-success)' : 'var(--cursor-error)' }} data-qoder-id="qel-text-11px-4bad57f3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-4bad57f3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;StatusDot&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:30,&quot;column&quot;:7}}">
        {label}
      </span>
    </div>
  )
}

/**
 * 从 localStorage 读取/写入配置
 */
const STORAGE_KEY = 'heytea_service_config'

function loadServiceConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  // 预填各服务模块的硬编码默认值
  return {
    vision: { apiKey: 'sk-ae08dbba7ec94b9dbdbac405c035b057', baseUrl: '/api/vision', model: 'qwen-vl-max' },
    search: { apiKey: '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', provider: 'tavily' },
    memory: { apiKey: 'mpg-B8vt02G3gwlMsZ6sJ4u8yTJalxdHD6os9+Ep5dLP', enabled: true, baseUrl: 'https://memos.memtensor.cn/api/openmem/v1' },
  }
}

function saveServiceConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch { /* ignore */ }
}

/**
 * 动态更新各服务模块的运行时配置
 */
async function applyConfigToServices(config) {
  try {
    const vision = await import('../../lib/vision-service.js')
    vision.configureVision({
      apiKey: config.vision.apiKey,
      baseUrl: config.vision.baseUrl,
      model: config.vision.model,
    })
  } catch { /* module not loaded yet */ }

  try {
    const search = await import('../../lib/web-search-service.js')
    search.configureSearch({
      apiKey: config.search.apiKey,
      provider: config.search.provider,
    })
  } catch { /* module not loaded yet */ }

  try {
    const memory = await import('../../lib/memos-client.js')
    memory.configureMemory({
      apiKey: config.memory.apiKey,
      enabled: !!config.memory.apiKey,
      baseUrl: config.memory.baseUrl,
    })
  } catch { /* module not loaded yet */ }
}

export default function ServiceConfigPanel(qoderProps) {
  const [config, setConfig] = useState(loadServiceConfig)
  const [saved, setSaved] = useState(false)
  const [testResults, setTestResults] = useState({})

  // 页面加载时应用已保存的配置
  useEffect(() => {
    const saved = loadServiceConfig()
    applyConfigToServices(saved)
  }, [])

  const handleSave = () => {
    saveServiceConfig(config)
    applyConfigToServices(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTestVision = async () => {
    setTestResults(prev => ({ ...prev, vision: 'testing' }))
    try {
      const res = await fetch(`${config.vision.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.vision.apiKey}`,
        },
        body: JSON.stringify({
          model: config.vision.model,
          messages: [{ role: 'user', content: [{ type: 'text', text: '回复OK即可' }] }],
          max_tokens: 10,
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) {
        setTestResults(prev => ({ ...prev, vision: 'success' }))
      } else {
        const text = await res.text()
        setTestResults(prev => ({ ...prev, vision: `error: ${res.status} ${text.slice(0, 80)}` }))
      }
    } catch (err) {
      setTestResults(prev => ({ ...prev, vision: `error: ${err.message}` }))
    }
  }

  const handleTestSearch = async () => {
    setTestResults(prev => ({ ...prev, search: 'testing' }))
    try {
      const res = await fetch('/api/tavily/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: config.search.apiKey,
          query: 'heytea',
          max_results: 1,
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) {
        setTestResults(prev => ({ ...prev, search: 'success' }))
      } else {
        const text = await res.text()
        setTestResults(prev => ({ ...prev, search: `error: ${res.status} ${text.slice(0, 80)}` }))
      }
    } catch (err) {
      setTestResults(prev => ({ ...prev, search: `error: ${err.message}` }))
    }
  }

  const handleTestMemory = async () => {
    setTestResults(prev => ({ ...prev, memory: 'testing' }))
    try {
      const baseUrl = (config.memory.baseUrl || '').replace(/\/$/, '')
      const res = await fetch(`${baseUrl}/search/memory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${config.memory.apiKey}`,
        },
        body: JSON.stringify({
          user_id: 'heytea-user',
          query: 'test',
          source: 'heytea-agent',
          memory_limit_number: 1,
          include_preference: false,
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) {
        setTestResults(prev => ({ ...prev, memory: 'success' }))
      } else {
        const text = await res.text()
        setTestResults(prev => ({ ...prev, memory: `error: ${res.status} ${text.slice(0, 80)}` }))
      }
    } catch (err) {
      setTestResults(prev => ({ ...prev, memory: `error: ${err.message}` }))
    }
  }

  const renderTestStatus = (key) => {
    const status = testResults[key]
    if (!status) return null
    if (status === 'testing') return <span style={{ color: 'var(--cursor-orange)', fontSize: '11px' }} data-qoder-id="qel-span-af1b2896" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-af1b2896&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:194,&quot;column&quot;:38}}">测试中...</span>
    if (status === 'success') return <span style={{ color: 'var(--cursor-success)', fontSize: '11px' }} data-qoder-id="qel-span-ba1b39e7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-ba1b39e7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:195,&quot;column&quot;:38}}">连接成功</span>
    return <span style={{ color: 'var(--cursor-error)', fontSize: '11px' }} data-qoder-id="qel-span-b91b3854" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b91b3854&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:196,&quot;column&quot;:12}}">{status}</span>
  }

  const visionConfigured = !!(config.vision.apiKey && config.vision.baseUrl)
  const searchConfigured = !!config.search.apiKey
  const memoryConfigured = !!(config.memory.apiKey)

  return (
    <div className={["flex-1 overflow-y-auto p-4 lg:p-6", qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div className="max-w-2xl mx-auto space-y-1" data-qoder-id="qel-max-w-2xl-5e2cbe2d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-max-w-2xl-5e2cbe2d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;max-w-2xl&quot;,&quot;loc&quot;:{&quot;line&quot;:205,&quot;column&quot;:7}}">
        {/* Settings Tab Navigation */}
        <div className="flex gap-1 mb-4 pb-2" style={{ borderBottom: '1px solid var(--cursor-border-10)' }} data-qoder-id="qel-flex-bf2f08fa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-bf2f08fa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:207,&quot;column&quot;:9}}">
          <Link to="/settings" style={{
            padding: '6px 14px',
            borderRadius: '6px 6px 0 0',
            fontSize: '12px',
            fontWeight: 500,
            textDecoration: 'none',
            color: 'var(--cursor-border-55)',
            borderBottom: '2px solid transparent',
            background: 'transparent',
          }} data-qoder-id="qel-link-75847d5d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-link-75847d5d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;link&quot;,&quot;loc&quot;:{&quot;line&quot;:208,&quot;column&quot;:11}}">模型设置</Link>
          <Link to="/settings/services" style={{
            padding: '6px 14px',
            borderRadius: '6px 6px 0 0',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
            color: 'var(--cursor-orange)',
            borderBottom: '2px solid var(--cursor-orange)',
            background: 'transparent',
          }} data-qoder-id="qel-link-6e847258" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-link-6e847258&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;link&quot;,&quot;loc&quot;:{&quot;line&quot;:218,&quot;column&quot;:11}}">服务 API 设置</Link>
        </div>

        {/* 页面标题 */}
        <div className="mb-4" data-qoder-id="qel-mb-4-81d3134c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mb-4-81d3134c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;mb-4&quot;,&quot;loc&quot;:{&quot;line&quot;:231,&quot;column&quot;:9}}">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-text-sm-54c47268" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-54c47268&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:232,&quot;column&quot;:11}}">服务 API 设置</h2>
          <p className="text-[11px] mt-1" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-11px-7196198d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-7196198d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:233,&quot;column&quot;:11}}">
            配置视觉分析、联网搜索、长期记忆等扩展服务的 API Key，让阿喜拥有更强大的能力
          </p>
        </div>

        {/* 状态总览 */}
        <div className="grid grid-cols-3 gap-2 mb-4" data-qoder-id="qel-grid-484f96c9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-484f96c9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:239,&quot;column&quot;:9}}">
          <StatusDot active={visionConfigured} label={visionConfigured ? '视觉分析 ✓' : '视觉分析 ✗'}  data-qoder-id="qel-statusdot-376bba2f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-statusdot-376bba2f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;statusdot&quot;,&quot;loc&quot;:{&quot;line&quot;:240,&quot;column&quot;:11}}"/>
          <StatusDot active={searchConfigured} label={searchConfigured ? '联网搜索 ✓' : '联网搜索 ✗'}  data-qoder-id="qel-statusdot-b073346f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-statusdot-b073346f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;statusdot&quot;,&quot;loc&quot;:{&quot;line&quot;:241,&quot;column&quot;:11}}"/>
          <StatusDot active={memoryConfigured} label={memoryConfigured ? '长期记忆 ✓' : '长期记忆 ✗'}  data-qoder-id="qel-statusdot-af7332dc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-statusdot-af7332dc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;statusdot&quot;,&quot;loc&quot;:{&quot;line&quot;:242,&quot;column&quot;:11}}"/>
        </div>

        {/* ═══ 视觉分析 ═══ */}
        <SectionTitle desc="DashScope qwen-vl 视觉模型，用于分析用户上传的图片（产品照片、小票、食安问题照片）" data-qoder-id="qel-sectiontitle-4e0de7af" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sectiontitle-4e0de7af&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;sectiontitle&quot;,&quot;loc&quot;:{&quot;line&quot;:246,&quot;column&quot;:9}}">
          视觉分析（DashScope）
        </SectionTitle>

        <div data-qoder-id="qel-div-940b119e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-940b119e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:250,&quot;column&quot;:9}}">
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-2102bfbe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-2102bfbe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:251,&quot;column&quot;:11}}">
            API Key
          </label>
          <input
            type="password"
            className={inputClass}
            style={inputStyle}
            placeholder="sk-..."
            value={config.vision.apiKey}
            onChange={e => setConfig(prev => ({ ...prev, vision: { ...prev.vision, apiKey: e.target.value } }))}
           data-qoder-id="qel-input-26871af8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-26871af8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:254,&quot;column&quot;:11}}"/>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2" data-qoder-id="qel-grid-5051e1f8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-grid-5051e1f8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;grid&quot;,&quot;loc&quot;:{&quot;line&quot;:264,&quot;column&quot;:9}}">
          <div data-qoder-id="qel-div-980b17ea" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-980b17ea&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:265,&quot;column&quot;:11}}">
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-1d02b972" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-1d02b972&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:266,&quot;column&quot;:13}}">
              Base URL
            </label>
            <input
              type="text"
              className={inputClass}
              style={inputStyle}
              value={config.vision.baseUrl}
              onChange={e => setConfig(prev => ({ ...prev, vision: { ...prev.vision, baseUrl: e.target.value } }))}
             data-qoder-id="qel-input-228714ac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-228714ac&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:269,&quot;column&quot;:13}}"/>
          </div>
          <div data-qoder-id="qel-div-8d08c802" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8d08c802&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:277,&quot;column&quot;:11}}">
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-8a05a3a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-8a05a3a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:278,&quot;column&quot;:13}}">
              模型
            </label>
            <input
              type="text"
              className={inputClass}
              style={inputStyle}
              value={config.vision.model}
              onChange={e => setConfig(prev => ({ ...prev, vision: { ...prev.vision, model: e.target.value } }))}
             data-qoder-id="qel-input-2384d7a8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-2384d7a8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:281,&quot;column&quot;:13}}"/>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2" data-qoder-id="qel-flex-28342b73" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-28342b73&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:291,&quot;column&quot;:9}}">
          <button
            onClick={handleTestVision}
            disabled={!config.vision.apiKey || testResults.vision === 'testing'}
            className="px-3 py-1 rounded-md text-[11px] font-medium transition-colors"
            style={{
              border: '1px solid var(--cursor-border-10)',
              background: 'var(--cursor-bg)',
              color: 'var(--cursor-ink)',
              cursor: config.vision.apiKey ? 'pointer' : 'not-allowed',
              opacity: config.vision.apiKey ? 1 : 0.5,
            }}
           data-qoder-id="qel-px-3-d444a3ae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-d444a3ae&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:292,&quot;column&quot;:11}}">
            测试连接
          </button>
          {renderTestStatus('vision')}
        </div>

        {/* ═══ 联网搜索 ═══ */}
        <SectionTitle desc="Tavily 搜索引擎 API，让阿喜能搜索互联网获取最新信息（新品、活动等）" data-qoder-id="qel-sectiontitle-c70ad493" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sectiontitle-c70ad493&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;sectiontitle&quot;,&quot;loc&quot;:{&quot;line&quot;:310,&quot;column&quot;:9}}">
          联网搜索（Tavily）
        </SectionTitle>

        <div data-qoder-id="qel-div-8708be90" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8708be90&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:314,&quot;column&quot;:9}}">
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-9005ad12" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-9005ad12&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:315,&quot;column&quot;:11}}">
            API Key
          </label>
          <input
            type="password"
            className={inputClass}
            style={inputStyle}
            placeholder="tvly-dev-..."
            value={config.search.apiKey}
            onChange={e => setConfig(prev => ({ ...prev, search: { ...prev.search, apiKey: e.target.value } }))}
           data-qoder-id="qel-input-1d84ce36" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-1d84ce36&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:318,&quot;column&quot;:11}}"/>
        </div>

        <div className="flex items-center gap-3 mt-2" data-qoder-id="qel-flex-32343b31" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-32343b31&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:328,&quot;column&quot;:9}}">
          <button
            onClick={handleTestSearch}
            disabled={!config.search.apiKey || testResults.search === 'testing'}
            className="px-3 py-1 rounded-md text-[11px] font-medium transition-colors"
            style={{
              border: '1px solid var(--cursor-border-10)',
              background: 'var(--cursor-bg)',
              color: 'var(--cursor-ink)',
              cursor: config.search.apiKey ? 'pointer' : 'not-allowed',
              opacity: config.search.apiKey ? 1 : 0.5,
            }}
           data-qoder-id="qel-px-3-4a4c1935" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-4a4c1935&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:329,&quot;column&quot;:11}}">
            测试连接
          </button>
          {renderTestStatus('search')}
        </div>

        {/* ═══ 长期记忆 ═══ */}
        <SectionTitle desc="MemOS Cloud 长期记忆服务，让阿喜跨会话记住用户偏好、历史投诉等重要信息" data-qoder-id="qel-sectiontitle-c3088fb0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sectiontitle-c3088fb0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;sectiontitle&quot;,&quot;loc&quot;:{&quot;line&quot;:347,&quot;column&quot;:9}}">
          长期记忆（MemOS Cloud）
        </SectionTitle>

        <div data-qoder-id="qel-div-9d0f9cf7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9d0f9cf7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:351,&quot;column&quot;:9}}">
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-9407f1f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-9407f1f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:352,&quot;column&quot;:11}}">
            API Key
          </label>
          <input
            type="password"
            className={inputClass}
            style={inputStyle}
            placeholder="mpg-..."
            value={config.memory.apiKey}
            onChange={e => setConfig(prev => ({ ...prev, memory: { ...prev.memory, apiKey: e.target.value } }))}
           data-qoder-id="qel-input-2b78184d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-2b78184d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:355,&quot;column&quot;:11}}"/>
        </div>

        <div className="mt-2" data-qoder-id="qel-mt-2-a3c44721" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-a3c44721&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:365,&quot;column&quot;:9}}">
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }} data-qoder-id="qel-block-8f07ea16" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-block-8f07ea16&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;block&quot;,&quot;loc&quot;:{&quot;line&quot;:366,&quot;column&quot;:11}}">
            Base URL
          </label>
          <input
            type="text"
            className={inputClass}
            style={inputStyle}
            value={config.memory.baseUrl}
            onChange={e => setConfig(prev => ({ ...prev, memory: { ...prev.memory, baseUrl: e.target.value } }))}
           data-qoder-id="qel-input-28781394" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-input-28781394&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;input&quot;,&quot;loc&quot;:{&quot;line&quot;:369,&quot;column&quot;:11}}"/>
        </div>

        <div className="flex items-center gap-3 mt-2" data-qoder-id="qel-flex-332770d1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-332770d1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:378,&quot;column&quot;:9}}">
          <button
            onClick={handleTestMemory}
            disabled={!config.memory.apiKey || testResults.memory === 'testing'}
            className="px-3 py-1 rounded-md text-[11px] font-medium transition-colors"
            style={{
              border: '1px solid var(--cursor-border-10)',
              background: 'var(--cursor-bg)',
              color: 'var(--cursor-ink)',
              cursor: config.memory.apiKey ? 'pointer' : 'not-allowed',
              opacity: config.memory.apiKey ? 1 : 0.5,
            }}
           data-qoder-id="qel-px-3-514c243a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-514c243a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:379,&quot;column&quot;:11}}">
            测试连接
          </button>
          {renderTestStatus('memory')}
        </div>

        {/* ═══ 保存按钮 ═══ */}
        <div className="mt-6 flex items-center gap-3" data-qoder-id="qel-mt-6-63f28707" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-6-63f28707&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;mt-6&quot;,&quot;loc&quot;:{&quot;line&quot;:397,&quot;column&quot;:9}}">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md text-xs font-medium text-white transition-colors"
            style={{ background: 'var(--cursor-orange)', cursor: 'pointer' }}
           data-qoder-id="qel-px-4-4ca20ca0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-4ca20ca0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:398,&quot;column&quot;:11}}">
            {saved ? '已保存 ✓' : '保存配置'}
          </button>
          <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }} data-qoder-id="qel-text-10px-c5bff859" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-c5bff859&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/settings/ServiceConfigPanel.jsx&quot;,&quot;componentName&quot;:&quot;ServiceConfigPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:405,&quot;column&quot;:11}}">
            配置保存在浏览器本地存储中，刷新页面后自动加载
          </span>
        </div>
      </div>
    </div>
  )
}

export { applyConfigToServices, loadServiceConfig }
