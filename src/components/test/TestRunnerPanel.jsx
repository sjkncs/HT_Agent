/**
 * TestRunnerPanel — 循环测试打分面板
 * 用真实历史 case 跑 AI 流程，按分类准确率/回复质量/处理效率/合规性打分
 */

import { useState, useCallback, useRef } from 'react'
import { runTestBatch, getScoringDimensions, scoreCase } from '../../lib/test-runner.js'
import { getAllCases, getCategoryStats, getMetadata, sampleCases, getCasesByType } from '../../lib/case-library.js'

export default function TestRunnerPanel() {
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
    <div data-component="test-runner-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white',
      }}>
        <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>
          循环测试打分
        </div>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>
          {metadata.total_cases || 0} 条真实案例 · {metadata.categories_covered || 0} 个分类 · 来源 {metadata.source ? '70个Excel' : ''}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
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
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
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
          />
        )}
        {activeTab === 'preview' && (
          <PreviewTab cases={previewCases} />
        )}
        {activeTab === 'report' && report && (
          <ReportTab report={report} dimensions={dimensions} />
        )}
        {activeTab === 'report' && !report && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#a0aec0' }}>
            运行测试后查看报告
          </div>
        )}
        {activeTab === 'library' && (
          <LibraryTab categoryStats={categoryStats} metadata={metadata} />
        )}
      </div>
    </div>
  )
}

// ═══ Config Tab ═══
function ConfigTab({ testConfig, setTestConfig, dimensions, categoryStats, onPreview, onRun, isRunning, progress, onAbort }) {
  const foodSafetyTypes = ['外源性异物', '内源性异物', '身体不适', '原料变质', 'OEM']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 测试数量 */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', display: 'block', marginBottom: '6px' }}>
          测试案例数量
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
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
            >
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
          >
            全部 (83)
          </button>
        </div>
      </div>

      {/* 食安类型筛选 */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', display: 'block', marginBottom: '6px' }}>
          食安类型筛选
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            onClick={() => setTestConfig(prev => ({ ...prev, filter: {} }))}
            style={{
              padding: '4px 12px', borderRadius: '12px', fontSize: '12px',
              border: !testConfig.filter.type ? '1px solid #1a1a2e' : '1px solid #e2e8f0',
              background: !testConfig.filter.type ? '#edf2f7' : 'white',
              cursor: 'pointer',
            }}
          >
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
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 评分维度说明 */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: '600', color: '#4a5568', display: 'block', marginBottom: '6px' }}>
          评分维度（总分 100）
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {Object.entries(dimensions).map(([key, dim]) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', background: 'white', borderRadius: '6px',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '8px',
                background: `hsl(${key === 'classification_accuracy' ? '210' : key === 'response_quality' ? '150' : key === 'handling_efficiency' ? '30' : '0'}, 60%, 95%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: '700',
                color: `hsl(${key === 'classification_accuracy' ? '210' : key === 'response_quality' ? '150' : key === 'handling_efficiency' ? '30' : '0'}, 60%, 40%)`,
              }}>
                {Math.round(dim.weight * 100)}%
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>{dim.name}</div>
                <div style={{ fontSize: '11px', color: '#a0aec0' }}>{dim.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          onClick={onPreview}
          disabled={isRunning}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px',
            border: '1px solid #e2e8f0', background: 'white',
            color: '#4a5568', fontSize: '13px', cursor: 'pointer',
          }}
        >
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
          >
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
          >
            开始测试 ({testConfig.count} cases)
          </button>
        )}
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div style={{ height: '4px', borderRadius: '2px', background: '#e2e8f0', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(progress.current / progress.total) * 100}%`,
            background: 'linear-gradient(90deg, #1a1a2e, #2563eb)',
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}
    </div>
  )
}

// ═══ Preview Tab ═══
function PreviewTab({ cases }) {
  if (!cases.length) {
    return <div style={{ textAlign: 'center', padding: '40px 0', color: '#a0aec0' }}>点击"预览案例"查看</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>
        共 {cases.length} 条测试案例
      </div>
      {cases.map((c, i) => (
        <div key={c.id} style={{
          padding: '12px', background: 'white', borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#a0aec0' }}>#{i + 1} {c.category}</span>
            <span style={{
              fontSize: '11px', padding: '1px 8px', borderRadius: '10px',
              background: c.classification.risk === 'high' ? '#fff5f5' : c.classification.risk === 'medium' ? '#fffff0' : '#f0fff4',
              color: c.classification.risk === 'high' ? '#c53030' : c.classification.risk === 'medium' ? '#744210' : '#276749',
            }}>
              {c.classification.risk}
            </span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#2d3748', marginBottom: '4px' }}>
            "{c.user_input.first_message}"
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#a0aec0' }}>
            <span>{c.classification.type} · {c.classification.label}</span>
            <span>情绪: {c.user_input.emotion}</span>
            {c.user_input.has_image && <span>📷 有图</span>}
            {c.user_input.has_order && <span>📋 有订单</span>}
            {c.classification.risk === 'high' && <span>⚠️ 需升级</span>}
          </div>
          {c.reference_replies && c.reference_replies.length > 0 && (
            <div style={{ marginTop: '6px', padding: '6px 8px', background: '#f7fafc', borderRadius: '4px', fontSize: '11px', color: '#718096' }}>
              参考回复: {c.reference_replies[0].substring(0, 80)}...
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══ Report Tab ═══
function ReportTab({ report, dimensions }) {
  const gradeColors = { A: '#276749', B: '#2b6cb0', C: '#d69e2e', D: '#dd6b20', F: '#c53030' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Score summary */}
      <div style={{
        padding: '20px', background: 'white', borderRadius: '12px',
        border: '1px solid #e2e8f0', textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', fontWeight: '800', color: gradeColors[report.grade] || '#4a5568' }}>
          {report.averageScore}
        </div>
        <div style={{ fontSize: '14px', color: '#718096', marginTop: '4px' }}>
          平均分 · 等级 <strong style={{ color: gradeColors[report.grade] }}>{report.grade}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px', fontSize: '13px' }}>
          <span style={{ color: '#38a169' }}>✓ 通过 {report.passed}</span>
          <span style={{ color: '#e53e3e' }}>✗ 未通过 {report.failed}</span>
          <span style={{ color: '#718096' }}>通过率 {report.passRate}%</span>
        </div>
      </div>

      {/* Dimension scores */}
      <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#2d3748' }}>维度得分</div>
        {Object.entries(report.dimensionAverages).map(([key, dim]) => (
          <div key={key} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: '#4a5568' }}>{dim.name} ({Math.round(dim.weight * 100)}%)</span>
              <span style={{ fontWeight: '600', color: dim.average >= 80 ? '#38a169' : dim.average >= 60 ? '#d69e2e' : '#e53e3e' }}>
                {dim.average}分
              </span>
            </div>
            <div style={{ height: '6px', borderRadius: '3px', background: '#e2e8f0' }}>
              <div style={{
                height: '100%', borderRadius: '3px',
                width: `${dim.average}%`,
                background: dim.average >= 80 ? '#38a169' : dim.average >= 60 ? '#d69e2e' : '#e53e3e',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#2d3748' }}>分类统计</div>
        {Object.entries(report.categoryBreakdown).map(([cat, data]) => (
          <div key={cat} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderBottom: '1px solid #f7fafc',
          }}>
            <span style={{ fontSize: '12px', color: '#4a5568' }}>{cat}</span>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
              <span style={{ color: '#a0aec0' }}>{data.count}例</span>
              <span style={{
                fontWeight: '600',
                color: data.average >= 80 ? '#38a169' : data.average >= 60 ? '#d69e2e' : '#e53e3e',
              }}>
                {data.average}分
              </span>
              <span style={{ color: '#a0aec0' }}>{data.passRate}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Individual results */}
      <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#2d3748' }}>逐条结果</div>
        {report.results.map((r, i) => (
          <div key={r.caseId} style={{
            padding: '10px', marginBottom: '8px', borderRadius: '6px',
            background: r.totalScore >= 80 ? '#f0fff4' : r.totalScore >= 60 ? '#fffff0' : '#fff5f5',
            border: `1px solid ${r.totalScore >= 80 ? '#c6f6d5' : r.totalScore >= 60 ? '#fefcbf' : '#fed7d7'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: '#4a5568' }}>#{i + 1} {r.category}</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: gradeColors[r.grade] }}>
                {r.totalScore}分 ({r.grade})
              </span>
            </div>
            {r.reply && (
              <div style={{ fontSize: '11px', color: '#718096', marginTop: '4px' }}>
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
function LibraryTab({ categoryStats, metadata }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        padding: '12px 16px', background: 'white', borderRadius: '8px',
        border: '1px solid #e2e8f0', fontSize: '12px', color: '#4a5568',
      }}>
        <div>数据来源: {metadata.source || '70个Excel文件'}</div>
        <div>原始会话: {metadata.total_cases || 0} 条（提取前 38,644 条）</div>
        <div>提取日期: {metadata.extraction_date || '2026-06-09'}</div>
      </div>

      <div style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>分类分布</div>
      {categoryStats.map(cat => (
        <div key={cat.category} style={{
          padding: '10px 12px', background: 'white', borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#2d3748', fontWeight: '500' }}>{cat.category}</span>
            <span style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
              background: '#edf2f7', color: '#4a5568',
            }}>
              {cat.count} 条
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '4px' }}>
            {cat.type}
          </div>
          <div style={{ height: '3px', borderRadius: '2px', background: '#e2e8f0', marginTop: '6px' }}>
            <div style={{
              height: '100%', borderRadius: '2px',
              width: `${Math.min((cat.count / 15) * 100, 100)}%`,
              background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}
