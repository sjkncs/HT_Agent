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
function SectionTitle({ children, desc }) {
  return (
    <div className="mb-2 mt-5 first:mt-0">
      <h3 className="text-xs font-semibold" style={{ color: 'var(--cursor-ink)' }}>{children}</h3>
      {desc && <p className="text-[10px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }}>{desc}</p>}
    </div>
  )
}

/** 服务状态指示器 */
function StatusDot({ active, label }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md" style={{
      background: active ? 'hsl(159 40% 94%)' : 'hsl(345 60% 96%)',
      border: `1px solid ${active ? 'hsl(159 63% 33% / 0.12)' : 'hsl(345 63% 33% / 0.12)'}`,
    }}>
      <div className="h-2.5 w-2.5 rounded-full" style={{ background: active ? 'var(--cursor-success)' : 'var(--cursor-error)' }} />
      <span className="text-[11px] font-medium" style={{ color: active ? 'var(--cursor-success)' : 'var(--cursor-error)' }}>
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

export default function ServiceConfigPanel() {
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
    if (status === 'testing') return <span style={{ color: 'var(--cursor-orange)', fontSize: '11px' }}>测试中...</span>
    if (status === 'success') return <span style={{ color: 'var(--cursor-success)', fontSize: '11px' }}>连接成功</span>
    return <span style={{ color: 'var(--cursor-error)', fontSize: '11px' }}>{status}</span>
  }

  const visionConfigured = !!(config.vision.apiKey && config.vision.baseUrl)
  const searchConfigured = !!config.search.apiKey
  const memoryConfigured = !!(config.memory.apiKey)

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="max-w-2xl mx-auto space-y-1">
        {/* Settings Tab Navigation */}
        <div className="flex gap-1 mb-4 pb-2" style={{ borderBottom: '1px solid var(--cursor-border-10)' }}>
          <Link to="/settings" style={{
            padding: '6px 14px',
            borderRadius: '6px 6px 0 0',
            fontSize: '12px',
            fontWeight: 500,
            textDecoration: 'none',
            color: 'var(--cursor-border-55)',
            borderBottom: '2px solid transparent',
            background: 'transparent',
          }}>模型设置</Link>
          <Link to="/settings/services" style={{
            padding: '6px 14px',
            borderRadius: '6px 6px 0 0',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
            color: 'var(--cursor-orange)',
            borderBottom: '2px solid var(--cursor-orange)',
            background: 'transparent',
          }}>服务 API 设置</Link>
        </div>

        {/* 页面标题 */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--cursor-ink)' }}>服务 API 设置</h2>
          <p className="text-[11px] mt-1" style={{ color: 'var(--cursor-border-55)' }}>
            配置视觉分析、联网搜索、长期记忆等扩展服务的 API Key，让阿喜拥有更强大的能力
          </p>
        </div>

        {/* 状态总览 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatusDot active={visionConfigured} label={visionConfigured ? '视觉分析 ✓' : '视觉分析 ✗'} />
          <StatusDot active={searchConfigured} label={searchConfigured ? '联网搜索 ✓' : '联网搜索 ✗'} />
          <StatusDot active={memoryConfigured} label={memoryConfigured ? '长期记忆 ✓' : '长期记忆 ✗'} />
        </div>

        {/* ═══ 视觉分析 ═══ */}
        <SectionTitle desc="DashScope qwen-vl 视觉模型，用于分析用户上传的图片（产品照片、小票、食安问题照片）">
          视觉分析（DashScope）
        </SectionTitle>

        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
            API Key
          </label>
          <input
            type="password"
            className={inputClass}
            style={inputStyle}
            placeholder="sk-..."
            value={config.vision.apiKey}
            onChange={e => setConfig(prev => ({ ...prev, vision: { ...prev.vision, apiKey: e.target.value } }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
              Base URL
            </label>
            <input
              type="text"
              className={inputClass}
              style={inputStyle}
              value={config.vision.baseUrl}
              onChange={e => setConfig(prev => ({ ...prev, vision: { ...prev.vision, baseUrl: e.target.value } }))}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
              模型
            </label>
            <input
              type="text"
              className={inputClass}
              style={inputStyle}
              value={config.vision.model}
              onChange={e => setConfig(prev => ({ ...prev, vision: { ...prev.vision, model: e.target.value } }))}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
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
          >
            测试连接
          </button>
          {renderTestStatus('vision')}
        </div>

        {/* ═══ 联网搜索 ═══ */}
        <SectionTitle desc="Tavily 搜索引擎 API，让阿喜能搜索互联网获取最新信息（新品、活动等）">
          联网搜索（Tavily）
        </SectionTitle>

        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
            API Key
          </label>
          <input
            type="password"
            className={inputClass}
            style={inputStyle}
            placeholder="tvly-dev-..."
            value={config.search.apiKey}
            onChange={e => setConfig(prev => ({ ...prev, search: { ...prev.search, apiKey: e.target.value } }))}
          />
        </div>

        <div className="flex items-center gap-3 mt-2">
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
          >
            测试连接
          </button>
          {renderTestStatus('search')}
        </div>

        {/* ═══ 长期记忆 ═══ */}
        <SectionTitle desc="MemOS Cloud 长期记忆服务，让阿喜跨会话记住用户偏好、历史投诉等重要信息">
          长期记忆（MemOS Cloud）
        </SectionTitle>

        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
            API Key
          </label>
          <input
            type="password"
            className={inputClass}
            style={inputStyle}
            placeholder="mpg-..."
            value={config.memory.apiKey}
            onChange={e => setConfig(prev => ({ ...prev, memory: { ...prev.memory, apiKey: e.target.value } }))}
          />
        </div>

        <div className="mt-2">
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
            Base URL
          </label>
          <input
            type="text"
            className={inputClass}
            style={inputStyle}
            value={config.memory.baseUrl}
            onChange={e => setConfig(prev => ({ ...prev, memory: { ...prev.memory, baseUrl: e.target.value } }))}
          />
        </div>

        <div className="flex items-center gap-3 mt-2">
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
          >
            测试连接
          </button>
          {renderTestStatus('memory')}
        </div>

        {/* ═══ 保存按钮 ═══ */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md text-xs font-medium text-white transition-colors"
            style={{ background: 'var(--cursor-orange)', cursor: 'pointer' }}
          >
            {saved ? '已保存 ✓' : '保存配置'}
          </button>
          <span className="text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>
            配置保存在浏览器本地存储中，刷新页面后自动加载
          </span>
        </div>
      </div>
    </div>
  )
}

export { applyConfigToServices, loadServiceConfig }
