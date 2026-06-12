import { useState } from "react";

const EVAL_DATA = {
  intent: {
    label: "意图分类 (Intent)",
    accuracy: 87.2,
    target: 90,
    status: "close",
    scenarios: [
      { name: "food_safety 食安", precision: 100, recall: 63, f1: 77.3, samples: 881, trend: "up", notes: "召回率从35%→63%，仍有提升空间" },
      { name: "ordering 点单", precision: 95, recall: 90, f1: 92.4, samples: 50, trend: "stable", notes: "基本稳定" },
      { name: "general_knowledge 通用", precision: 78, recall: 92, f1: 84.4, samples: 200, trend: "up", notes: "FP已修复(外卖/包装/卫生)" },
    ],
  },
  subScenario: {
    label: "子场景分类 (SubScenario)",
    accuracy: 84.1,
    target: 90,
    status: "fail",
    scenarios: [
      { name: "body_discomfort 身体不适", precision: 95, recall: 88, f1: 91.4, samples: 120, trend: "stable", notes: "已添加拉稀/疯狂拉等" },
      { name: "spoilage 变质/过期", precision: 90, recall: 82, f1: 85.8, samples: 95, trend: "stable", notes: "基本稳定" },
      { name: "foreign_object_external 外源异物", precision: 92, recall: 78, f1: 84.4, samples: 280, trend: "up", notes: "已添加喝出/吸出/杯底等" },
      { name: "foreign_object_internal 内源异物", precision: 88, recall: 80, f1: 83.8, samples: 110, trend: "up", notes: "已添加葡萄皮/有核/有籽" },
      { name: "taste_issue 异味/口感", precision: 85, recall: 72, f1: 77.9, samples: 85, trend: "up", notes: "刚修复: 发苦/味淡/变淡" },
      { name: "general_food_safety 食安综合", precision: 70, recall: 65, f1: 67.4, samples: 191, trend: "stable", notes: "兜底类别，精度偏低" },
    ],
  },
  boundary: {
    label: "边界分类 (FP控制)",
    accuracy: 100,
    target: 95,
    status: "pass",
    scenarios: [
      { name: "外卖撒漏→非食安", precision: 100, recall: 100, f1: 100, samples: 15, trend: "up", notes: "已修复: 移除'撒了'模式" },
      { name: "杯盖/杯底破损→非食安", precision: 100, recall: 100, f1: 100, samples: 15, trend: "up", notes: "已修复: 收窄杯盖/杯底模式" },
      { name: "门店卫生→非食安", precision: 100, recall: 100, f1: 100, samples: 10, trend: "up", notes: "已修复: 环境上下文前置检查" },
      { name: "主观口味→非食安", precision: 90, recall: 85, f1: 87.4, samples: 20, trend: "stable", notes: "太甜/太苦 vs 发苦/怪味" },
    ],
  },
  latency: {
    label: "响应延迟",
    accuracy: 15.5,
    target: 10,
    status: "fail",
    scenarios: [
      { name: "P50 中位延迟", precision: 0, recall: 0, f1: 0, samples: 0, trend: "stable", notes: "~8s (正则命中时<100ms)", isLatency: true, value: "8s" },
      { name: "P95 延迟", precision: 0, recall: 0, f1: 0, samples: 0, trend: "stable", notes: "~15.5s (LLM分类+回复生成)", isLatency: true, value: "15.5s" },
      { name: "正则快速通道覆盖率", precision: 0, recall: 0, f1: 0, samples: 0, trend: "stable", notes: "约63%的食安消息走正则(<100ms)", isLatency: true, value: "63%" },
    ],
  },
};

const OPTIMIZATION_OPTIONS = [
  {
    id: "recall",
    icon: "🎯",
    title: "提升食安召回率",
    desc: "当前63%→目标80%+。扩展FOOD_SAFETY_PATTERNS，覆盖更多长尾表述",
    impact: "high",
    effort: "medium",
    category: "intent",
  },
  {
    id: "sub_accuracy",
    icon: "📊",
    title: "提升子场景准确率",
    desc: "当前84.1%→目标90%。重点优化general_food_safety兜底类别和taste_issue",
    impact: "high",
    effort: "medium",
    category: "subScenario",
  },
  {
    id: "latency",
    icon: "⚡",
    title: "降低响应延迟",
    desc: "P95从15.5s→目标<8s。优化LLM调用、缓存策略、流式输出",
    impact: "high",
    effort: "high",
    category: "latency",
  },
  {
    id: "dataset",
    icon: "📦",
    title: "扩充训练/评测数据",
    desc: "增加尾部标签样本(35→60+)、补充边界case、完善eval suite",
    impact: "medium",
    effort: "low",
    category: "intent",
  },
  {
    id: "taxonomy",
    icon: "🏷️",
    title: "优化标签体系",
    desc: "拆分/合并'不明物'和'果蔬杂质'等语义模糊标签，减少混淆",
    impact: "high",
    effort: "high",
    category: "subScenario",
  },
  {
    id: "prompt",
    icon: "🤖",
    title: "优化LLM回复质量",
    desc: "改进system prompt、增加参考话术、提升回复针对性和专业度",
    impact: "medium",
    effort: "low",
    category: "quality",
  },
  {
    id: "frontend",
    icon: "🎨",
    title: "前端体验优化",
    desc: "改进侧边栏筛选、对话元数据展示、食安工单流程可视化",
    impact: "medium",
    effort: "medium",
    category: "ux",
  },
  {
    id: "boundary",
    icon: "🛡️",
    title: "加强边界case测试",
    desc: "针对模糊表述(口味偏好vs异味、包装vs食安)做更多对抗测试",
    impact: "medium",
    effort: "low",
    category: "boundary",
  },
];

const TREND_ICON = { up: "↑", stable: "→", down: "↓" };
const TREND_COLOR = { up: "#22c55e", stable: "#94a3b8", down: "#ef4444" };

function StatusBadge({ status }) {
  const cfg = {
    pass: { bg: "#dcfce7", color: "#166534", text: "PASS" },
    fail: { bg: "#fef2f2", color: "#991b1b", text: "FAIL" },
    close: { bg: "#fef9c3", color: "#854d0e", text: "CLOSE" },
  };
  const c = cfg[status] || cfg.close;
  return (
    <span style={{ background: c.bg, color: c.color, padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
      {c.text}
    </span>
  );
}

function ProgressBar({ value, target, max = 100, color }) {
  const pct = Math.min(value / max * 100, 100);
  const targetPct = Math.min(target / max * 100, 100);
  const barColor = value >= target ? "#22c55e" : value >= target * 0.85 ? "#eab308" : "#ef4444";
  return (
    <div style={{ position: "relative", height: 8, background: "#f1f5f9", borderRadius: 4, width: "100%" }}>
      <div style={{ height: "100%", width: pct + "%", background: barColor, borderRadius: 4, transition: "width 0.5s" }} />
      <div style={{ position: "absolute", left: targetPct + "%", top: -3, width: 2, height: 14, background: "#64748b", borderRadius: 1 }} />
    </div>
  );
}

function MetricCard({ dimKey, data, expanded, onToggle }) {
  const isLatency = dimKey === "latency";
  const displayValue = isLatency ? data.accuracy + "s" : data.accuracy + "%";
  const targetValue = isLatency ? "<" + data.target + "s" : "≥" + data.target + "%";
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fff", marginBottom: 12 }}>
      <div
        onClick={onToggle}
        style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", userSelect: "none" }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{data.label}</span>
            <StatusBadge status={data.status} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>{displayValue}</span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>目标 {targetValue}</span>
          </div>
        </div>
        <div style={{ width: 180 }}>
          {!isLatency && <ProgressBar value={data.accuracy} target={data.target} />}
        </div>
        <span style={{ fontSize: 18, color: "#94a3b8", transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </div>
      {expanded && (
        <div style={{ borderTop: "1px solid #f1f5f9", padding: "8px 18px 14px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#94a3b8" }}>
                <th style={{ textAlign: "left", padding: "6px 0", fontWeight: 500 }}>场景</th>
                {!isLatency && <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 500 }}>P</th>}
                {!isLatency && <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 500 }}>R</th>}
                {!isLatency && <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 500 }}>F1</th>}
                <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 500 }}>趋势</th>
                <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 500 }}>备注</th>
              </tr>
            </thead>
            <tbody>
              {data.scenarios.map((s, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f8fafc" }}>
                  <td style={{ padding: "8px 0", color: "#334155", fontWeight: 500 }}>{s.name}</td>
                  {!isLatency && <td style={{ textAlign: "center", padding: "8px", color: "#475569" }}>{s.precision}%</td>}
                  {!isLatency && <td style={{ textAlign: "center", padding: "8px", color: "#475569" }}>{s.recall}%</td>}
                  {!isLatency && <td style={{ textAlign: "center", padding: "8px", color: "#475569", fontWeight: 600 }}>{s.f1}%</td>}
                  <td style={{ textAlign: "center", padding: "8px", color: TREND_COLOR[s.trend], fontWeight: 700, fontSize: 15 }}>{TREND_ICON[s.trend]}</td>
                  <td style={{ padding: "8px", color: "#64748b", fontSize: 12 }}>{s.isLatency ? s.value + " — " : ""}{s.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OptimizationCard({ opt, selected, onToggle }) {
  const impactColor = { high: "#dc2626", medium: "#eab308", low: "#22c55e" };
  const effortColor = { high: "#dc2626", medium: "#eab308", low: "#22c55e" };
  return (
    <div
      onClick={onToggle}
      style={{
        border: selected ? "2px solid #3b82f6" : "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "12px 14px",
        cursor: "pointer",
        background: selected ? "#eff6ff" : "#fff",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 20 }}>{opt.icon}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", flex: 1 }}>{opt.title}</span>
        {selected && <span style={{ color: "#3b82f6", fontSize: 16 }}>✓</span>}
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{opt.desc}</p>
      <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11 }}>
        <span>
          影响: <span style={{ color: impactColor[opt.impact], fontWeight: 700 }}>{opt.impact === "high" ? "高" : opt.impact === "medium" ? "中" : "低"}</span>
        </span>
        <span>
          工作量: <span style={{ color: effortColor[opt.effort], fontWeight: 700 }}>{opt.effort === "high" ? "大" : opt.effort === "medium" ? "中" : "小"}</span>
        </span>
      </div>
    </div>
  );
}

export default function OptimizationSelector() {
  const [expandedDims, setExpandedDims] = useState({});
  const [selectedOpts, setSelectedOpts] = useState([]);
  const [filterCategory, setFilterCategory] = useState("all");

  const toggleDim = (key) => setExpandedDims((d) => ({ ...d, [key]: !d[key] }));
  const toggleOpt = (id) => setSelectedOpts((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const categories = [
    { key: "all", label: "全部" },
    { key: "intent", label: "意图分类" },
    { key: "subScenario", label: "子场景" },
    { key: "boundary", label: "边界控制" },
    { key: "latency", label: "性能" },
    { key: "quality", label: "回复质量" },
    { key: "ux", label: "用户体验" },
  ];

  const filteredOpts = filterCategory === "all" ? OPTIMIZATION_OPTIONS : OPTIMIZATION_OPTIONS.filter((o) => o.category === filterCategory);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>喜茶 AI Agent — 评测看板</h1>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>展开各维度查看详细指标，选择下一步优化方向</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#64748b", margin: "0 0 10px", letterSpacing: 1, textTransform: "uppercase" }}>评测维度</h2>
        {Object.entries(EVAL_DATA).map(([key, data]) => (
          <MetricCard key={key} dimKey={key} data={data} expanded={!!expandedDims[key]} onToggle={() => toggleDim(key)} />
        ))}
      </div>

      <div>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#64748b", margin: "0 0 10px", letterSpacing: 1, textTransform: "uppercase" }}>
          选择优化方向 {selectedOpts.length > 0 && <span style={{ color: "#3b82f6", fontSize: 13, fontWeight: 600 }}>(已选 {selectedOpts.length} 项)</span>}
        </h2>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilterCategory(c.key)}
              style={{
                padding: "4px 14px",
                borderRadius: 99,
                border: "none",
                background: filterCategory === c.key ? "#1e293b" : "#f1f5f9",
                color: filterCategory === c.key ? "#fff" : "#64748b",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {filteredOpts.map((opt) => (
            <OptimizationCard key={opt.id} opt={opt} selected={selectedOpts.includes(opt.id)} onToggle={() => toggleOpt(opt.id)} />
          ))}
        </div>
      </div>

      {selectedOpts.length > 0 && (
        <div style={{ position: "sticky", bottom: 16, marginTop: 20, background: "#1e293b", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          <div style={{ color: "#e2e8f0", fontSize: 13 }}>
            已选择 <span style={{ fontWeight: 800, color: "#60a5fa" }}>{selectedOpts.length}</span> 个优化方向：
            <span style={{ color: "#94a3b8", marginLeft: 6 }}>
              {selectedOpts.map((id) => OPTIMIZATION_OPTIONS.find((o) => o.id === id)?.title).join("、")}
            </span>
          </div>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>告诉 QoderWork 开始执行</div>
        </div>
      )}
    </div>
  );
}
