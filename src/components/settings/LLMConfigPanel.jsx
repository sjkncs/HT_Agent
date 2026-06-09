import { useState, useEffect } from 'react'
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
function SectionTitle({ children, desc }) {
  return (
    <div className="mb-2 mt-5 first:mt-0">
      <h3 className="text-xs font-semibold" style={{ color: 'var(--cursor-ink)' }}>{children}</h3>
      {desc && <p className="text-[10px] mt-0.5" style={{ color: 'var(--cursor-border-55)' }}>{desc}</p>}
    </div>
  )
}

/** 开关组件 */
function Toggle({ label, checked, onChange, desc }) {
  const handleToggle = () => onChange(!checked)
  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onChange(!checked)
    }
  }
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        className="relative w-8 h-4 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{ background: checked ? 'var(--cursor-orange)' : 'var(--cursor-border-10)', outline: 'none' }}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <div
          className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform shadow-sm"
          style={{ transform: checked ? 'translateX(17px)' : 'translateX(2px)' }}
        />
      </div>
      <div className="flex-1">
        <span className="text-[11px] font-medium" style={{ color: 'var(--cursor-ink)' }}>{label}</span>
        {desc && <span className="block text-[10px]" style={{ color: 'var(--cursor-border-55)' }}>{desc}</span>}
      </div>
    </label>
  )
}

export default function LLMConfigPanel() {
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
    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
      <div className="max-w-2xl mx-auto space-y-1">
        {/* 页面标题 */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--cursor-ink)' }}>模型设置</h2>
          <p className="text-[11px] mt-1" style={{ color: 'var(--cursor-border-55)' }}>
            配置 LLM API 以启用真实大语言模型生成回复，支持 NVIDIA / OpenAI / DeepSeek 等 OpenAI 兼容接口
          </p>
        </div>

        {/* 状态指示 */}
        <div className="flex items-center gap-2 p-2 rounded-md" style={{ background: configured ? '#27ae6008' : '#e74c3c08', border: `1px solid ${configured ? '#27ae6020' : '#e74c3c20'}` }}>
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: configured ? '#27ae60' : '#e74c3c' }} />
          <span className="text-[11px] font-medium" style={{ color: configured ? '#27ae60' : '#e74c3c' }}>
            {configured ? `已连接 — ${getModelDisplayName(config.model)}` : '未配置 (使用模板引擎回复)'}
          </span>
        </div>

        {/* ═══ 推理模型配置 ═══ */}
        <SectionTitle desc="主推理模型的 API 端点和参数">推理模型</SectionTitle>

        {/* API 提供商选择 */}
        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
            API 提供商
          </label>
          <select
            value={selectedPreset}
            onChange={e => handlePresetChange(e.target.value)}
            className="w-full rounded-md border px-2 py-1.5 text-xs"
            style={inputStyle}
          >
            {PRESET_KEYS.map(key => (
              <option key={key} value={key}>{API_PRESETS[key].name}</option>
            ))}
          </select>
        </div>

        {/* Base URL */}
        <div className="mt-2">
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
            API 端点 (Base URL)
          </label>
          <input
            type="text"
            value={config.baseUrl}
            onChange={e => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
            placeholder="https://integrate.api.nvidia.com/v1"
            className={inputClass}
            style={inputStyle}
          />
        </div>

        {/* API Key */}
        <div className="mt-2">
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
            API Key
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={e => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
            placeholder="nvapi-... / sk-..."
            className={inputClass}
            style={inputStyle}
          />
        </div>

        {/* Model */}
        <div className="mt-2">
          <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
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
            >
              {currentPreset.models.map(m => {
                const meta = currentPreset.modelMeta?.[m]
                return (
                  <option key={m} value={m}>
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
            />
          )}
        </div>

        {/* NVIDIA Reasoning 开关 */}
        {isNvidia && (
          <div className="mt-3 p-2.5 rounded-md space-y-2" style={{ background: 'var(--cursor-surface-300)', border: '1px solid var(--cursor-border-10)' }}>
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
            />
            {config.enableThinking && (
              <div>
                <label className="block text-[10px] font-medium mb-1" style={{ color: 'var(--cursor-border-55)' }}>
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
                />
              </div>
            )}
          </div>
        )}

        {/* 基础参数 */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
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
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
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
            />
          </div>
        </div>

        {/* ═══ 内容安全护栏 ═══ */}
        <SectionTitle desc="使用 NVIDIA nemotron-3.5-content-safety 模型对回复进行安全检查">内容安全护栏</SectionTitle>

        <div className="p-2.5 rounded-md space-y-2" style={{ background: 'var(--cursor-surface-300)', border: '1px solid var(--cursor-border-10)' }}>
          <Toggle
            label="启用内容安全检查"
            desc="对 Agent 回复进行 post-generation 安全审核 (3H Alignment)"
            checked={config.contentSafetyEnabled || false}
            onChange={v => setConfig(prev => ({ ...prev, contentSafetyEnabled: v }))}
          />
          {config.contentSafetyEnabled && (
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
                内容安全 API Key
              </label>
              <input
                type="password"
                value={config.contentSafetyKey || ''}
                onChange={e => setConfig(prev => ({ ...prev, contentSafetyKey: e.target.value }))}
                placeholder="nvapi-... (内容安全模型专用 key)"
                className={inputClass}
                style={inputStyle}
              />
              <p className="text-[10px] mt-1" style={{ color: 'var(--cursor-border-55)' }}>
                使用 nemotron-3.5-content-safety 模型，独立于推理模型的 API Key
              </p>
            </div>
          )}
        </div>

        {/* ═══ 高级设置 ═══ */}
        <div className="mt-4">
          <button
            className="text-[11px] font-medium px-0"
            style={{ color: 'var(--cursor-orange)', background: 'none', border: 'none' }}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '收起高级设置 ▴' : '展开高级设置 ▾'}
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
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
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
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
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
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
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>
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
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══ 操作按钮 ═══ */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md text-xs font-medium transition-colors"
            style={{
              background: saved ? '#27ae60' : 'var(--cursor-orange)',
              color: '#fff',
            }}
          >
            {saved ? '已保存' : '保存配置'}
          </button>
          <button
            onClick={handleTest}
            disabled={testStatus === 'testing' || !config.apiKey}
            className="px-4 py-2 rounded-md text-xs font-medium border transition-colors"
            style={{
              borderColor: 'var(--cursor-border-10)',
              background: testStatus === 'success' ? '#27ae6015' : testStatus === 'error' ? '#e74c3c15' : 'var(--cursor-surface-300)',
              color: testStatus === 'success' ? '#27ae60' : testStatus === 'error' ? '#e74c3c' : 'var(--cursor-ink)',
              opacity: (!config.apiKey || testStatus === 'testing') ? 0.5 : 1,
            }}
          >
            {testStatus === 'testing' ? '测试中...' : '测试连接'}
          </button>
        </div>

        {/* 测试结果 */}
        {testResult && (
          <div className="rounded-md p-2.5 text-[10px] leading-relaxed" style={{
            background: testStatus === 'success' ? '#27ae6008' : '#e74c3c08',
            border: `1px solid ${testStatus === 'success' ? '#27ae6025' : '#e74c3c25'}`,
            color: testStatus === 'success' ? '#27ae60' : '#e74c3c',
          }}>
            {testResult}
          </div>
        )}

        {/* ═══ 说明 ═══ */}
        <div className="text-[10px] leading-relaxed p-3 rounded-md" style={{ color: 'var(--cursor-border-55)', background: 'var(--cursor-surface-300)' }}>
          <p className="font-medium mb-1" style={{ color: 'var(--cursor-ink)' }}>配置说明</p>
          <p className="mb-1">
            配置 LLM API 后，阿喜将使用真实大语言模型生成回复（基于 ICL 语境学习 + CAMEL 角色扮演框架）。
            未配置时使用模板回复。
          </p>
          <p className="mb-1">
            <strong>Heytea-V1-Pro</strong> — Mamba-Transformer MoE，100万上下文，Agent推理/工具调用/规划首选。
          </p>
          <p className="mb-1">
            <strong>Heytea-V1-Thinking-High</strong> — 推理旗舰，支持深度思维链，复杂食安问题最佳。
          </p>
          <p className="mb-1">
            <strong>Heytea-V1-Flash</strong> — 快速响应，日常对话和简单咨询。
            <strong> Heytea-V1-Lite</strong> — 轻量通用对话。
          </p>
          <p>
            <strong>内容安全护栏</strong> — 对每条回复做安全检查 (3H Alignment)，防止有害输出。
          </p>
        </div>
      </div>
    </div>
  )
}
