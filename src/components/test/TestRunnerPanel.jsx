/**
 * TestRunnerPanel — 循环测试打分面板
 * 用真实历史 case 跑 AI 流程，按分类准确率/回复质量/处理效率/合规性打分
 */

import { useState, useCallback, useRef } from 'react'
import { runTestBatch, getScoringDimensions, scoreCase } from '../../lib/test-runner.js'
import { getAllCases, getCategoryStats, getMetadata, sampleCases, getCasesByType } from '../../lib/case-library.js'

export default function TestRunnerPanel(qoderProps) {
  const [testConfig, setTestConfig] = useState({ count: 10, filter: {} })
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, latestResult: null })
  const [report, setReport] = useState(null)
  const [previewCases, setPreviewCases] = useState([])
  const [activeTab, setActiveTab] = useState('config')
  const abortRef = useRef(false)

  const metadata = getMetadata()
  const categoryStats = getCategoryStats()
  const dimensions = getScoringDimensions()

  // 预览案例
  const handlePreview = useCallback(() => {
    const cases = testConfig.filter.type
      ? sampleCases(testConfig.count, { type: testConfig.filter.type })
      : sampleCases(testConfig.count, testConfig.filter)
    setPreviewCases(cases)
    setActiveTab('preview')
  }, [testConfig])

  // 运行测试
  const handleRunTest = useCallback(async () => {
    setIsRunning(true)
    abortRef.current = false
    setReport(null)
    setProgress({ current: 0, total: testConfig.count, latestResult: null })

    try {
      const result = await runTestBatch(
        {
          count: testConfig.count,
          filter: testConfig.filter,
          // 离线模式 — 不调用 LLM
          agentEngine: null,
        },
        (current, total, latestResult) => {
          if (abortRef.current) throw new Error('aborted')
          setProgress({ current, total, latestResult })
        }
      )
      setReport(result)
      setActiveTab('report')
    } catch (e) {
      if (e.message !== 'aborted') {
        console.error('Test batch error:', e)
      }
    } finally {
      setIsRunning(false)
    }
  }, [testConfig])

  const handleAbort = () => { abortRef.current = true }

  // ── 渲染 ──
  return (
    <div data-component="test-runner-panel" style={{ ...({
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white',
      }} data-qoder-id="qel-div-a3604a74" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a3604a74&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;TestRunnerPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:75,&quot;column&quot;:7}}">
        <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }} data-qoder-id="qel-div-a4604c07" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a4604c07&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;TestRunnerPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:80,&quot;column&quot;:9}}">
          循环测试打分
        </div>
        <div style={{ fontSize: '12px', opacity: 0.7 }} data-qoder-id="qel-div-a160474e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a160474e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;TestRunnerPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:83,&quot;column&quot;:9}}">
          {metadata.total_cases || 0} 条真实案例 · {metadata.categories_covered || 0} 个分类 · 来源 {metadata.source ? '70个Excel' : ''}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }} data-qoder-id="qel-div-a26048e1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a26048e1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;TestRunnerPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:89,&quot;column&quot;:7}}">
        {[
          { id: 'config', label: '测试配置' },
          { id: 'preview', label: '案例预览' },
          { id: 'report', label: '测试报告' },
          { id: 'library', label: '案例库' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 0',
              fontSize: '13px',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #1a1a2e' : '2px solid transparent',
              background: 'none',
              color: activeTab === tab.id ? '#1a1a2e' : '#718096',
              fontWeight: activeTab === tab.id ? '600' : '400',
              cursor: 'pointer',
            }}
           data-qoder-id="qel-button-dcbd0cf4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-dcbd0cf4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;TestRunnerPanel&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:96,&quot;column&quot;:11}}">
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }} data-qoder-id="qel-div-a06045bb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a06045bb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;TestRunnerPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:117,&quot;column&quot;:7}}">
        {activeTab === 'config' && (
          <ConfigTab
            testConfig={testConfig}
            setTestConfig={setTestConfig}
            dimensions={dimensions}
            categoryStats={categoryStats}
            onPreview={handlePreview}
            onRun={handleRunTest}
            isRunning={isRunning}
            progress={progress}
            onAbort={handleAbort}
           data-qoder-id="qel-configtab-7f7cd3a2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-configtab-7f7cd3a2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;TestRunnerPanel&quot;,&quot;elementRole&quot;:&quot;configtab&quot;,&quot;loc&quot;:{&quot;line&quot;:119,&quot;column&quot;:11}}"/>
        )}
        {activeTab === 'preview' && (
          <PreviewTab cases={previewCases}  data-qoder-id="qel-previewtab-1d66ae93" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-previewtab-1d66ae93&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;TestRunnerPanel&quot;,&quot;elementRole&quot;:&quot;previewtab&quot;,&quot;loc&quot;:{&quot;line&quot;:132,&quot;column&quot;:11}}"/>
        )}
        {activeTab === 'report' && report && (
          <ReportTab report={report} dimensions={dimensions}  data-qoder-id="qel-reporttab-e76fda0f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-reporttab-e76fda0f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;TestRunnerPanel&quot;,&quot;elementRole&quot;:&quot;reporttab&quot;,&quot;loc&quot;:{&quot;line&quot;:135,&quot;column&quot;:11}}"/>
        )}
        {activeTab === 'report' && !report && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#a0aec0' }} data-qoder-id="qel-div-059c8914" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-059c8914&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;TestRunnerPanel&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:138,&quot;column&quot;:11}}">
            运行测试后查看报告
          </div>
        )}
        {activeTab === 'library' && (
          <LibraryTab categoryStats={categoryStats} metadata={metadata}  data-qoder-id="qel-librarytab-9b23ed91" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-librarytab-9b23ed91&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;TestRunnerPanel&quot;,&quot;elementRole&quot;:&quot;librarytab&quot;,&quot;loc&quot;:{&quot;line&quot;:143,&quot;column&quot;:11}}"/>
        )}
      </div>
    </div>
  )
}

// ═══ Config Tab ═══
function ConfigTab({ testConfig, setTestConfig, dimensions, categoryStats, onPreview, onRun, isRunning, progress, onAbort, ...qoderProps }) {
  const foodSafetyTypes = ['外源性异物', '内源性异物', '身体不适', '原料变质', 'OEM']

  return (
    <div style={{ ...({ display: 'flex', flexDirection: 'column', gap: '16px' }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* 测试数量 */}
      <div data-qoder-id="qel-div-55c0fb0c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-55c0fb0c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:157,&quot;column&quot;:7}}">
        <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', display: 'block', marginBottom: '6px' }} data-qoder-id="qel-label-bb2d9793" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-label-bb2d9793&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;label&quot;,&quot;loc&quot;:{&quot;line&quot;:158,&quot;column&quot;:9}}">
          测试案例数量
        </label>
        <div style={{ display: 'flex', gap: '8px' }} data-qoder-id="qel-div-57c0fe32" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-57c0fe32&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:161,&quot;column&quot;:9}}">
          {[5, 10, 20, 50].map(n => (
            <button
              key={n}
              onClick={() => setTestConfig(prev => ({ ...prev, count: n }))}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: testConfig.count === n ? '2px solid #1a1a2e' : '1px solid #e2e8f0',
                background: testConfig.count === n ? '#1a1a2e' : 'white',
                color: testConfig.count === n ? 'white' : '#4a5568',
                fontSize: '13px',
                cursor: 'pointer',
              }}
             data-qoder-id="qel-button-3a557a6d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-3a557a6d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:163,&quot;column&quot;:13}}">
              {n}
            </button>
          ))}
          <button
            onClick={() => setTestConfig(prev => ({ ...prev, count: 83, filter: { ...prev.filter, all: true } }))}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: testConfig.filter?.all ? '2px solid #1a1a2e' : '1px solid #e2e8f0',
              background: testConfig.filter?.all ? '#1a1a2e' : 'white',
              color: testConfig.filter?.all ? 'white' : '#4a5568',
              fontSize: '13px',
              cursor: 'pointer',
            }}
           data-qoder-id="qel-button-2b5562d0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-2b5562d0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:179,&quot;column&quot;:11}}">
            全部 (83)
          </button>
        </div>
      </div>

      {/* 食安类型筛选 */}
      <div data-qoder-id="qel-div-5ac102eb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5ac102eb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:197,&quot;column&quot;:7}}">
        <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', display: 'block', marginBottom: '6px' }} data-qoder-id="qel-label-50353de7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-label-50353de7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;label&quot;,&quot;loc&quot;:{&quot;line&quot;:198,&quot;column&quot;:9}}">
          食安类型筛选
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }} data-qoder-id="qel-div-e2c894c8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-e2c894c8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:201,&quot;column&quot;:9}}">
          <button
            onClick={() => setTestConfig(prev => ({ ...prev, filter: {} }))}
            style={{
              padding: '4px 12px', borderRadius: '12px', fontSize: '12px',
              border: !testConfig.filter.type ? '1px solid #1a1a2e' : '1px solid #e2e8f0',
              background: !testConfig.filter.type ? '#edf2f7' : 'white',
              cursor: 'pointer',
            }}
           data-qoder-id="qel-button-a75ce1c9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-a75ce1c9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:202,&quot;column&quot;:11}}">
            全部类型
          </button>
          {foodSafetyTypes.map(type => (
            <button
              key={type}
              onClick={() => setTestConfig(prev => ({ ...prev, filter: { type }, count: prev.count }))}
              style={{
                padding: '4px 12px', borderRadius: '12px', fontSize: '12px',
                border: testConfig.filter.type === type ? '1px solid #1a1a2e' : '1px solid #e2e8f0',
                background: testConfig.filter.type === type ? '#edf2f7' : 'white',
                cursor: 'pointer',
              }}
             data-qoder-id="qel-button-a65ce036" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-a65ce036&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:214,&quot;column&quot;:13}}">
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 评分维度说明 */}
      <div data-qoder-id="qel-div-e7c89ca7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-e7c89ca7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:231,&quot;column&quot;:7}}">
        <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', display: 'block', marginBottom: '6px' }} data-qoder-id="qel-label-4b353608" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-label-4b353608&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;label&quot;,&quot;loc&quot;:{&quot;line&quot;:232,&quot;column&quot;:9}}">
          评分维度（总分 100）
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} data-qoder-id="qel-div-e9c89fcd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-e9c89fcd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:235,&quot;column&quot;:9}}">
          {Object.entries(dimensions).map(([key, dim]) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', background: 'white', borderRadius: '6px',
              border: '1px solid #e2e8f0',
            }} data-qoder-id="qel-div-e8c89e3a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-e8c89e3a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:237,&quot;column&quot;:13}}">
              <div style={{
                width: '40px', height: '40px', borderRadius: '8px',
                background: `hsl(${key === 'classification_accuracy' ? '210' : key === 'response_quality' ? '150' : key === 'handling_efficiency' ? '30' : '0'}, 60%, 95%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: '700',
                color: `hsl(${key === 'classification_accuracy' ? '210' : key === 'response_quality' ? '150' : key === 'handling_efficiency' ? '30' : '0'}, 60%, 40%)`,
              }} data-qoder-id="qel-div-dbc889c3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-dbc889c3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:242,&quot;column&quot;:15}}">
                {Math.round(dim.weight * 100)}%
              </div>
              <div data-qoder-id="qel-div-dac88830" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-dac88830&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:251,&quot;column&quot;:15}}">
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }} data-qoder-id="qel-div-ddc64e52" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ddc64e52&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:252,&quot;column&quot;:17}}">{dim.name}</div>
                <div style={{ fontSize: '11px', color: '#a0aec0' }} data-qoder-id="qel-div-dec64fe5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-dec64fe5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:253,&quot;column&quot;:17}}">{dim.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }} data-qoder-id="qel-div-dbc64b2c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-dbc64b2c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:261,&quot;column&quot;:7}}">
        <button
          onClick={onPreview}
          disabled={isRunning}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px',
            border: '1px solid #e2e8f0', background: 'white',
            color: '#4a5568', fontSize: '13px', cursor: 'pointer',
          }}
         data-qoder-id="qel-button-3e59fde7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-3e59fde7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:262,&quot;column&quot;:9}}">
          预览案例
        </button>
        {isRunning ? (
          <button
            onClick={onAbort}
            style={{
              flex: 2, padding: '10px', borderRadius: '8px',
              border: 'none', background: '#e53e3e',
              color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}
           data-qoder-id="qel-button-3b59f92e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-3b59f92e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:274,&quot;column&quot;:11}}">
            停止测试 ({progress.current}/{progress.total})
          </button>
        ) : (
          <button
            onClick={onRun}
            style={{
              flex: 2, padding: '10px', borderRadius: '8px',
              border: 'none', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}
           data-qoder-id="qel-button-3c59fac1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-3c59fac1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:285,&quot;column&quot;:11}}">
            开始测试 ({testConfig.count} cases)
          </button>
        )}
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div style={{ height: '4px', borderRadius: '2px', background: '#e2e8f0', overflow: 'hidden' }} data-qoder-id="qel-div-d7c644e0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d7c644e0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:300,&quot;column&quot;:9}}">
          <div style={{
            height: '100%',
            width: `${(progress.current / progress.total) * 100}%`,
            background: 'linear-gradient(90deg, #1a1a2e, #2563eb)',
            transition: 'width 0.3s ease',
          }}  data-qoder-id="qel-div-d8c64673" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d8c64673&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ConfigTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:301,&quot;column&quot;:11}}"/>
        </div>
      )}
    </div>
  )
}

// ═══ Preview Tab ═══
function PreviewTab({ cases, ...qoderProps }) {
  if (!cases.length) {
    return <div style={{ ...({ textAlign: 'center', padding: '40px 0', color: '#a0aec0' }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>点击"预览案例"查看</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} data-qoder-id="qel-div-469a60ff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-469a60ff&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;PreviewTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:320,&quot;column&quot;:5}}">
      <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }} data-qoder-id="qel-div-479823fb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-479823fb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;PreviewTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:321,&quot;column&quot;:7}}">
        共 {cases.length} 条测试案例
      </div>
      {cases.map((c, i) => (
        <div key={c.id} style={{
          padding: '12px', background: 'white', borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }} data-qoder-id="qel-div-46982268" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-46982268&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;PreviewTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:325,&quot;column&quot;:9}}">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }} data-qoder-id="qel-div-49982721" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-49982721&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;PreviewTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:329,&quot;column&quot;:11}}">
            <span style={{ fontSize: '11px', color: '#a0aec0' }} data-qoder-id="qel-span-760b3c02" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-760b3c02&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;PreviewTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:330,&quot;column&quot;:13}}">#{i + 1} {c.category}</span>
            <span style={{
              fontSize: '11px', padding: '1px 8px', borderRadius: '10px',
              background: c.classification.risk === 'high' ? '#fff5f5' : c.classification.risk === 'medium' ? '#fffff0' : '#f0fff4',
              color: c.classification.risk === 'high' ? '#c53030' : c.classification.risk === 'medium' ? '#744210' : '#276749',
            }} data-qoder-id="qel-span-710b3423" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-710b3423&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;PreviewTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:331,&quot;column&quot;:13}}">
              {c.classification.risk}
            </span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#2d3748', marginBottom: '4px' }} data-qoder-id="qel-div-4a9828b4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4a9828b4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;PreviewTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:339,&quot;column&quot;:11}}">
            "{c.user_input.first_message}"
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#a0aec0' }} data-qoder-id="qel-div-4d982d6d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4d982d6d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;PreviewTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:342,&quot;column&quot;:11}}">
            <span data-qoder-id="qel-span-720b35b6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-720b35b6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;PreviewTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:343,&quot;column&quot;:13}}">{c.classification.type} · {c.classification.label}</span>
            <span data-qoder-id="qel-span-7d0b4707" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-7d0b4707&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;PreviewTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:344,&quot;column&quot;:13}}">情绪: {c.user_input.emotion}</span>
            {c.user_input.has_image && <span data-qoder-id="qel-span-7c0b4574" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-7c0b4574&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;PreviewTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:345,&quot;column&quot;:40}}">📷 有图</span>}
            {c.user_input.has_order && <span data-qoder-id="qel-span-ef0828e6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-ef0828e6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;PreviewTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:346,&quot;column&quot;:40}}">📋 有订单</span>}
            {c.classification.risk === 'high' && <span data-qoder-id="qel-span-f0082a79" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-f0082a79&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;PreviewTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:347,&quot;column&quot;:50}}">⚠️ 需升级</span>}
          </div>
          {c.reference_replies && c.reference_replies.length > 0 && (
            <div style={{ marginTop: '6px', padding: '6px 8px', background: '#f7fafc', borderRadius: '4px', fontSize: '11px', color: '#718096' }} data-qoder-id="qel-div-bf950f4c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-bf950f4c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;PreviewTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:350,&quot;column&quot;:13}}">
              参考回复: {c.reference_replies[0].substring(0, 80)}...
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══ Report Tab ═══
function ReportTab({ report, dimensions, ...qoderProps }) {
  const gradeColors = { A: '#276749', B: '#2b6cb0', C: '#d69e2e', D: '#dd6b20', F: '#c53030' }

  return (
    <div style={{ ...({ display: 'flex', flexDirection: 'column', gap: '16px' }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Score summary */}
      <div style={{
        padding: '20px', background: 'white', borderRadius: '12px',
        border: '1px solid #e2e8f0', textAlign: 'center',
      }} data-qoder-id="qel-div-28241434" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-28241434&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:367,&quot;column&quot;:7}}">
        <div style={{ fontSize: '48px', fontWeight: '800', color: gradeColors[report.grade] || '#4a5568' }} data-qoder-id="qel-div-292415c7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-292415c7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:371,&quot;column&quot;:9}}">
          {report.averageScore}
        </div>
        <div style={{ fontSize: '14px', color: '#718096', marginTop: '4px' }} data-qoder-id="qel-div-2a24175a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-2a24175a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:374,&quot;column&quot;:9}}">
          平均分 · 等级 <strong style={{ color: gradeColors[report.grade] }} data-qoder-id="qel-strong-7d66ae9b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strong-7d66ae9b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;strong&quot;,&quot;loc&quot;:{&quot;line&quot;:375,&quot;column&quot;:20}}">{report.grade}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px', fontSize: '13px' }} data-qoder-id="qel-div-1c240150" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1c240150&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:377,&quot;column&quot;:9}}">
          <span style={{ color: '#38a169' }} data-qoder-id="qel-span-3dc9123f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-3dc9123f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:378,&quot;column&quot;:11}}">✓ 通过 {report.passed}</span>
          <span style={{ color: '#e53e3e' }} data-qoder-id="qel-span-b6d08c7f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b6d08c7f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:379,&quot;column&quot;:11}}">✗ 未通过 {report.failed}</span>
          <span style={{ color: '#718096' }} data-qoder-id="qel-span-b5d08aec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b5d08aec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:380,&quot;column&quot;:11}}">通过率 {report.passRate}%</span>
        </div>
      </div>

      {/* Dimension scores */}
      <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }} data-qoder-id="qel-div-982b8049" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-982b8049&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:385,&quot;column&quot;:7}}">
        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#2d3748' }} data-qoder-id="qel-div-972b7eb6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-972b7eb6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:386,&quot;column&quot;:9}}">维度得分</div>
        {Object.entries(report.dimensionAverages).map(([key, dim]) => (
          <div key={key} style={{ marginBottom: '10px' }} data-qoder-id="qel-div-9a2b836f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9a2b836f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:388,&quot;column&quot;:11}}">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }} data-qoder-id="qel-div-992b81dc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-992b81dc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:389,&quot;column&quot;:13}}">
              <span style={{ color: '#4a5568' }} data-qoder-id="qel-span-b4d08959" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b4d08959&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:390,&quot;column&quot;:15}}">{dim.name} ({Math.round(dim.weight * 100)}%)</span>
              <span style={{ fontWeight: '600', color: dim.average >= 80 ? '#38a169' : dim.average >= 60 ? '#d69e2e' : '#e53e3e' }} data-qoder-id="qel-span-b3d087c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b3d087c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:391,&quot;column&quot;:15}}">
                {dim.average}分
              </span>
            </div>
            <div style={{ height: '6px', borderRadius: '3px', background: '#e2e8f0' }} data-qoder-id="qel-div-9e2b89bb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9e2b89bb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:395,&quot;column&quot;:13}}">
              <div style={{
                height: '100%', borderRadius: '3px',
                width: `${dim.average}%`,
                background: dim.average >= 80 ? '#38a169' : dim.average >= 60 ? '#d69e2e' : '#e53e3e',
              }}  data-qoder-id="qel-div-9d2b8828" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9d2b8828&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:396,&quot;column&quot;:15}}"/>
            </div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }} data-qoder-id="qel-div-30289dfa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-30289dfa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:407,&quot;column&quot;:7}}">
        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#2d3748' }} data-qoder-id="qel-div-31289f8d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-31289f8d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:408,&quot;column&quot;:9}}">分类统计</div>
        {Object.entries(report.categoryBreakdown).map(([cat, data]) => (
          <div key={cat} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderBottom: '1px solid #f7fafc',
          }} data-qoder-id="qel-div-2e289ad4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-2e289ad4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:410,&quot;column&quot;:11}}">
            <span style={{ fontSize: '12px', color: '#4a5568' }} data-qoder-id="qel-span-afce42e3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-afce42e3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:414,&quot;column&quot;:13}}">{cat}</span>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }} data-qoder-id="qel-div-2c2897ae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-2c2897ae&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:415,&quot;column&quot;:13}}">
              <span style={{ color: '#a0aec0' }} data-qoder-id="qel-span-b5ce4c55" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b5ce4c55&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:416,&quot;column&quot;:15}}">{data.count}例</span>
              <span style={{
                fontWeight: '600',
                color: data.average >= 80 ? '#38a169' : data.average >= 60 ? '#d69e2e' : '#e53e3e',
              }} data-qoder-id="qel-span-b2ce479c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b2ce479c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:417,&quot;column&quot;:15}}">
                {data.average}分
              </span>
              <span style={{ color: '#a0aec0' }} data-qoder-id="qel-span-b3ce492f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-b3ce492f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:423,&quot;column&quot;:15}}">{data.passRate}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Individual results */}
      <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }} data-qoder-id="qel-div-28289162" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-28289162&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:430,&quot;column&quot;:7}}">
        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#2d3748' }} data-qoder-id="qel-div-292892f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-292892f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:431,&quot;column&quot;:9}}">逐条结果</div>
        {report.results.map((r, i) => (
          <div key={r.caseId} style={{
            padding: '10px', marginBottom: '8px', borderRadius: '6px',
            background: r.totalScore >= 80 ? '#f0fff4' : r.totalScore >= 60 ? '#fffff0' : '#fff5f5',
            border: `1px solid ${r.totalScore >= 80 ? '#c6f6d5' : r.totalScore >= 60 ? '#fefcbf' : '#fed7d7'}`,
          }} data-qoder-id="qel-div-b21c9ead" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-b21c9ead&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:433,&quot;column&quot;:11}}">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }} data-qoder-id="qel-div-b11c9d1a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-b11c9d1a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:438,&quot;column&quot;:13}}">
              <span style={{ fontSize: '12px', color: '#4a5568' }} data-qoder-id="qel-span-c0d5196b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-c0d5196b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:439,&quot;column&quot;:15}}">#{i + 1} {r.category}</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: gradeColors[r.grade] }} data-qoder-id="qel-span-bfd517d8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-bfd517d8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:440,&quot;column&quot;:15}}">
                {r.totalScore}分 ({r.grade})
              </span>
            </div>
            {r.reply && (
              <div style={{ fontSize: '11px', color: '#718096', marginTop: '4px' }} data-qoder-id="qel-div-ae1c9861" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ae1c9861&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;ReportTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:445,&quot;column&quot;:15}}">
                回复: {r.reply.substring(0, 100)}{r.reply.length > 100 ? '...' : ''}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══ Library Tab ═══
function LibraryTab({ categoryStats, metadata, ...qoderProps }) {
  return (
    <div style={{ ...({ display: 'flex', flexDirection: 'column', gap: '12px' }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div style={{
        padding: '12px 16px', background: 'white', borderRadius: '8px',
        border: '1px solid #e2e8f0', fontSize: '12px', color: '#4a5568',
      }} data-qoder-id="qel-div-9c3bc206" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9c3bc206&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;LibraryTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:460,&quot;column&quot;:7}}">
        <div data-qoder-id="qel-div-9d3bc399" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9d3bc399&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;LibraryTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:464,&quot;column&quot;:9}}">数据来源: {metadata.source || '70个Excel文件'}</div>
        <div data-qoder-id="qel-div-a63bd1c4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a63bd1c4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;LibraryTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:465,&quot;column&quot;:9}}">原始会话: {metadata.total_cases || 0} 条（提取前 38,644 条）</div>
        <div data-qoder-id="qel-div-a73bd357" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a73bd357&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;LibraryTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:466,&quot;column&quot;:9}}">提取日期: {metadata.extraction_date || '2026-06-09'}</div>
      </div>

      <div style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }} data-qoder-id="qel-div-a43e0d35" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a43e0d35&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;LibraryTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:469,&quot;column&quot;:7}}">分类分布</div>
      {categoryStats.map(cat => (
        <div key={cat.category} style={{
          padding: '10px 12px', background: 'white', borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }} data-qoder-id="qel-div-a33e0ba2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a33e0ba2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;LibraryTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:471,&quot;column&quot;:9}}">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} data-qoder-id="qel-div-a23e0a0f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a23e0a0f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;LibraryTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:475,&quot;column&quot;:11}}">
            <span style={{ fontSize: '13px', color: '#2d3748', fontWeight: '500' }} data-qoder-id="qel-span-12af88f0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-12af88f0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;LibraryTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:476,&quot;column&quot;:13}}">{cat.category}</span>
            <span style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
              background: '#edf2f7', color: '#4a5568',
            }} data-qoder-id="qel-span-19af93f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-19af93f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;LibraryTab&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:477,&quot;column&quot;:13}}">
              {cat.count} 条
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '4px' }} data-qoder-id="qel-div-9f3e0556" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9f3e0556&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;LibraryTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:484,&quot;column&quot;:11}}">
            {cat.type}
          </div>
          <div style={{ height: '3px', borderRadius: '2px', background: '#e2e8f0', marginTop: '6px' }} data-qoder-id="qel-div-9e3e03c3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9e3e03c3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;LibraryTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:487,&quot;column&quot;:11}}">
            <div style={{
              height: '100%', borderRadius: '2px',
              width: `${Math.min((cat.count / 15) * 100, 100)}%`,
              background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
            }}  data-qoder-id="qel-div-9d3e0230" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9d3e0230&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/test/TestRunnerPanel.jsx&quot;,&quot;componentName&quot;:&quot;LibraryTab&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:488,&quot;column&quot;:13}}"/>
          </div>
        </div>
      ))}
    </div>
  )
}
