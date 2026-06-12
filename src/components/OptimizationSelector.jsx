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

function StatusBadge({ status, ...qoderProps }) {
  const cfg = {
    pass: { bg: "#dcfce7", color: "#166534", text: "PASS" },
    fail: { bg: "#fef2f2", color: "#991b1b", text: "FAIL" },
    close: { bg: "#fef9c3", color: "#854d0e", text: "CLOSE" },
  };
  const c = cfg[status] || cfg.close;
  return (
    <span style={{ ...({ background: c.bg, color: c.color, padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {c.text}
    </span>
  );
}

function ProgressBar({ value, target, max = 100, color, ...qoderProps }) {
  const pct = Math.min(value / max * 100, 100);
  const targetPct = Math.min(target / max * 100, 100);
  const barColor = value >= target ? "#22c55e" : value >= target * 0.85 ? "#eab308" : "#ef4444";
  return (
    <div style={{ ...({ position: "relative", height: 8, background: "#f1f5f9", borderRadius: 4, width: "100%" }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div style={{ height: "100%", width: pct + "%", background: barColor, borderRadius: 4, transition: "width 0.5s" }}  data-qoder-id="qel-div-7d6196cc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7d6196cc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;ProgressBar&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:152,&quot;column&quot;:7}}"/>
      <div style={{ position: "absolute", left: targetPct + "%", top: -3, width: 2, height: 14, background: "#64748b", borderRadius: 1 }}  data-qoder-id="qel-div-7c619539" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7c619539&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;ProgressBar&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:153,&quot;column&quot;:7}}"/>
    </div>
  );
}

function MetricCard({ dimKey, data, expanded, onToggle, ...qoderProps }) {
  const isLatency = dimKey === "latency";
  const displayValue = isLatency ? data.accuracy + "s" : data.accuracy + "%";
  const targetValue = isLatency ? "<" + data.target + "s" : "≥" + data.target + "%";
  return (
    <div style={{ ...({ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fff", marginBottom: 12 }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div
        onClick={onToggle}
        style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", userSelect: "none" }}
       data-qoder-id="qel-div-394b5493" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-394b5493&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:164,&quot;column&quot;:7}}">
        <div style={{ flex: 1 }} data-qoder-id="qel-div-384b5300" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-384b5300&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:168,&quot;column&quot;:9}}">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }} data-qoder-id="qel-div-474b6a9d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-474b6a9d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:169,&quot;column&quot;:11}}">
            <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }} data-qoder-id="qel-span-9256d7ae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-9256d7ae&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:170,&quot;column&quot;:13}}">{data.label}</span>
            <StatusBadge status={data.status}  data-qoder-id="qel-statusbadge-c51ab7aa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-statusbadge-c51ab7aa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;statusbadge&quot;,&quot;loc&quot;:{&quot;line&quot;:171,&quot;column&quot;:13}}"/>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }} data-qoder-id="qel-div-53a23d79" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-53a23d79&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:173,&quot;column&quot;:11}}">
            <span style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", lineHeight: 1 }} data-qoder-id="qel-span-eaa1c9ac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-eaa1c9ac&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:174,&quot;column&quot;:13}}">{displayValue}</span>
            <span style={{ fontSize: 12, color: "#94a3b8" }} data-qoder-id="qel-span-eba1cb3f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-eba1cb3f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:175,&quot;column&quot;:13}}">目标 {targetValue}</span>
          </div>
        </div>
        <div style={{ width: 180 }} data-qoder-id="qel-div-56a24232" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-56a24232&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:178,&quot;column&quot;:9}}">
          {!isLatency && <ProgressBar value={data.accuracy} target={data.target}  data-qoder-id="qel-progressbar-76d0b799" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-progressbar-76d0b799&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;progressbar&quot;,&quot;loc&quot;:{&quot;line&quot;:179,&quot;column&quot;:26}}"/>}
        </div>
        <span style={{ fontSize: 18, color: "#94a3b8", transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }} data-qoder-id="qel-span-e6a1c360" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e6a1c360&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:181,&quot;column&quot;:9}}">▾</span>
      </div>
      {expanded && (
        <div style={{ borderTop: "1px solid #f1f5f9", padding: "8px 18px 14px" }} data-qoder-id="qel-div-55a2409f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-55a2409f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:184,&quot;column&quot;:9}}">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }} data-qoder-id="qel-table-a4348532" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-table-a4348532&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;table&quot;,&quot;loc&quot;:{&quot;line&quot;:185,&quot;column&quot;:11}}">
            <thead data-qoder-id="qel-thead-c7425969" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-thead-c7425969&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;thead&quot;,&quot;loc&quot;:{&quot;line&quot;:186,&quot;column&quot;:13}}">
              <tr style={{ color: "#94a3b8" }} data-qoder-id="qel-tr-cfa50a81" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tr-cfa50a81&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;tr&quot;,&quot;loc&quot;:{&quot;line&quot;:187,&quot;column&quot;:15}}">
                <th style={{ textAlign: "left", padding: "6px 0", fontWeight: 500 }} data-qoder-id="qel-th-ad10bd56" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-ad10bd56&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:188,&quot;column&quot;:17}}">场景</th>
                {!isLatency && <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 500 }} data-qoder-id="qel-th-ac10bbc3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-ac10bbc3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:189,&quot;column&quot;:32}}">P</th>}
                {!isLatency && <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 500 }} data-qoder-id="qel-th-ab10ba30" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-ab10ba30&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:190,&quot;column&quot;:32}}">R</th>}
                {!isLatency && <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 500 }} data-qoder-id="qel-th-b210c535" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-b210c535&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:191,&quot;column&quot;:32}}">F1</th>}
                <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 500 }} data-qoder-id="qel-th-b110c3a2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-b110c3a2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:192,&quot;column&quot;:17}}">趋势</th>
                <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 500 }} data-qoder-id="qel-th-b010c20f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-th-b010c20f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;th&quot;,&quot;loc&quot;:{&quot;line&quot;:193,&quot;column&quot;:17}}">备注</th>
              </tr>
            </thead>
            <tbody data-qoder-id="qel-tbody-5cabc8a4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tbody-5cabc8a4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;tbody&quot;,&quot;loc&quot;:{&quot;line&quot;:196,&quot;column&quot;:13}}">
              {data.scenarios.map((s, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f8fafc" }} data-qoder-id="qel-tr-c7a4fde9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-tr-c7a4fde9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;tr&quot;,&quot;loc&quot;:{&quot;line&quot;:198,&quot;column&quot;:17}}">
                  <td style={{ padding: "8px 0", color: "#334155", fontWeight: 500 }} data-qoder-id="qel-td-82830ae6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-td-82830ae6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;td&quot;,&quot;loc&quot;:{&quot;line&quot;:199,&quot;column&quot;:19}}">{s.name}</td>
                  {!isLatency && <td style={{ textAlign: "center", padding: "8px", color: "#475569" }} data-qoder-id="qel-td-8580d108" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-td-8580d108&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;td&quot;,&quot;loc&quot;:{&quot;line&quot;:200,&quot;column&quot;:34}}">{s.precision}%</td>}
                  {!isLatency && <td style={{ textAlign: "center", padding: "8px", color: "#475569" }} data-qoder-id="qel-td-8680d29b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-td-8680d29b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;td&quot;,&quot;loc&quot;:{&quot;line&quot;:201,&quot;column&quot;:34}}">{s.recall}%</td>}
                  {!isLatency && <td style={{ textAlign: "center", padding: "8px", color: "#475569", fontWeight: 600 }} data-qoder-id="qel-td-8780d42e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-td-8780d42e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;td&quot;,&quot;loc&quot;:{&quot;line&quot;:202,&quot;column&quot;:34}}">{s.f1}%</td>}
                  <td style={{ textAlign: "center", padding: "8px", color: TREND_COLOR[s.trend], fontWeight: 700, fontSize: 15 }} data-qoder-id="qel-td-8880d5c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-td-8880d5c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;td&quot;,&quot;loc&quot;:{&quot;line&quot;:203,&quot;column&quot;:19}}">{TREND_ICON[s.trend]}</td>
                  <td style={{ padding: "8px", color: "#64748b", fontSize: 12 }} data-qoder-id="qel-td-8980d754" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-td-8980d754&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;MetricCard&quot;,&quot;elementRole&quot;:&quot;td&quot;,&quot;loc&quot;:{&quot;line&quot;:204,&quot;column&quot;:19}}">{s.isLatency ? s.value + " — " : ""}{s.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OptimizationCard({ opt, selected, onToggle, ...qoderProps }) {
  const impactColor = { high: "#dc2626", medium: "#eab308", low: "#22c55e" };
  const effortColor = { high: "#dc2626", medium: "#eab308", low: "#22c55e" };
  return (
    <div
      onClick={onToggle}
      style={{ ...({
        border: selected ? "2px solid #3b82f6" : "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "12px 14px",
        cursor: "pointer",
        background: selected ? "#eff6ff" : "#fff",
        transition: "all 0.15s",
      }), ...(qoderProps?.style) }}
     className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }} data-qoder-id="qel-div-2b315501" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-2b315501&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:230,&quot;column&quot;:7}}">
        <span style={{ fontSize: 20 }} data-qoder-id="qel-span-8a4b5e2a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-8a4b5e2a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:231,&quot;column&quot;:9}}">{opt.icon}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", flex: 1 }} data-qoder-id="qel-span-7d4b49b3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-7d4b49b3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:232,&quot;column&quot;:9}}">{opt.title}</span>
        {selected && <span style={{ color: "#3b82f6", fontSize: 16 }} data-qoder-id="qel-span-7c4b4820" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-7c4b4820&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:233,&quot;column&quot;:22}}">✓</span>}
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.5 }} data-qoder-id="qel-p-b214cf04" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-b214cf04&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationCard&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:235,&quot;column&quot;:7}}">{opt.desc}</p>
      <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11 }} data-qoder-id="qel-div-242000db" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-242000db&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:236,&quot;column&quot;:7}}">
        <span data-qoder-id="qel-span-8d4da17a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-8d4da17a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:237,&quot;column&quot;:9}}">
          影响: <span style={{ color: impactColor[opt.impact], fontWeight: 700 }} data-qoder-id="qel-span-8e4da30d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-8e4da30d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:238,&quot;column&quot;:15}}">{opt.impact === "high" ? "高" : opt.impact === "medium" ? "中" : "低"}</span>
        </span>
        <span data-qoder-id="qel-span-874d9808" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-874d9808&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:240,&quot;column&quot;:9}}">
          工作量: <span style={{ color: effortColor[opt.effort], fontWeight: 700 }} data-qoder-id="qel-span-884d999b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-884d999b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:241,&quot;column&quot;:16}}">{opt.effort === "high" ? "大" : opt.effort === "medium" ? "中" : "小"}</span>
        </span>
      </div>
    </div>
  );
}

export default function OptimizationSelector(qoderProps) {
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
    <div style={{ ...({ maxWidth: 720, margin: "0 auto", padding: "24px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div style={{ marginBottom: 24 }} data-qoder-id="qel-div-036a7b30" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-036a7b30&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:270,&quot;column&quot;:7}}">
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }} data-qoder-id="qel-h1-1275ba9f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h1-1275ba9f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;h1&quot;,&quot;loc&quot;:{&quot;line&quot;:271,&quot;column&quot;:9}}">喜茶 AI Agent — 评测看板</h1>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }} data-qoder-id="qel-p-17d51bfe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-17d51bfe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:272,&quot;column&quot;:9}}">展开各维度查看详细指标，选择下一步优化方向</p>
      </div>

      <div style={{ marginBottom: 20 }} data-qoder-id="qel-div-04683e2c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-04683e2c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:275,&quot;column&quot;:7}}">
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#64748b", margin: "0 0 10px", letterSpacing: 1, textTransform: "uppercase" }} data-qoder-id="qel-h2-93c7fc0b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h2-93c7fc0b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;h2&quot;,&quot;loc&quot;:{&quot;line&quot;:276,&quot;column&quot;:9}}">评测维度</h2>
        {Object.entries(EVAL_DATA).map(([key, data]) => (
          <MetricCard key={key} dimKey={key} data={data} expanded={!!expandedDims[key]} onToggle={() => toggleDim(key)}  data-qoder-id="qel-metriccard-6372bbc6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-metriccard-6372bbc6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;metriccard&quot;,&quot;loc&quot;:{&quot;line&quot;:278,&quot;column&quot;:11}}"/>
        ))}
      </div>

      <div data-qoder-id="qel-div-076842e5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-076842e5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:282,&quot;column&quot;:7}}">
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#64748b", margin: "0 0 10px", letterSpacing: 1, textTransform: "uppercase" }} data-qoder-id="qel-h2-96c800c4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h2-96c800c4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;h2&quot;,&quot;loc&quot;:{&quot;line&quot;:283,&quot;column&quot;:9}}">
          选择优化方向 {selectedOpts.length > 0 && <span style={{ color: "#3b82f6", fontSize: 13, fontWeight: 600 }} data-qoder-id="qel-span-ece91137" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-ece91137&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:284,&quot;column&quot;:46}}">(已选 {selectedOpts.length} 项)</span>}
        </h2>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }} data-qoder-id="qel-div-02683b06" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-02683b06&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:286,&quot;column&quot;:9}}">
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
             data-qoder-id="qel-button-7fb0afe1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-7fb0afe1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:288,&quot;column&quot;:13}}">
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} data-qoder-id="qel-div-0c684ac4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-0c684ac4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:306,&quot;column&quot;:9}}">
          {filteredOpts.map((opt) => (
            <OptimizationCard key={opt.id} opt={opt} selected={selectedOpts.includes(opt.id)} onToggle={() => toggleOpt(opt.id)}  data-qoder-id="qel-optimizationcard-17435765" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-optimizationcard-17435765&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;optimizationcard&quot;,&quot;loc&quot;:{&quot;line&quot;:308,&quot;column&quot;:13}}"/>
          ))}
        </div>
      </div>

      {selectedOpts.length > 0 && (
        <div style={{ position: "sticky", bottom: 16, marginTop: 20, background: "#1e293b", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} data-qoder-id="qel-div-966fdfc7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-966fdfc7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:314,&quot;column&quot;:9}}">
          <div style={{ color: "#e2e8f0", fontSize: 13 }} data-qoder-id="qel-div-956fde34" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-956fde34&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:315,&quot;column&quot;:11}}">
            已选择 <span style={{ fontWeight: 800, color: "#60a5fa" }} data-qoder-id="qel-span-5bf07bb9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-5bf07bb9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:316,&quot;column&quot;:17}}">{selectedOpts.length}</span> 个优化方向：
            <span style={{ color: "#94a3b8", marginLeft: 6 }} data-qoder-id="qel-span-5af07a26" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-5af07a26&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:317,&quot;column&quot;:13}}">
              {selectedOpts.map((id) => OPTIMIZATION_OPTIONS.find((o) => o.id === id)?.title).join("、")}
            </span>
          </div>
          <div style={{ color: "#94a3b8", fontSize: 12 }} data-qoder-id="qel-div-926fd97b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-926fd97b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/OptimizationSelector.jsx&quot;,&quot;componentName&quot;:&quot;OptimizationSelector&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:321,&quot;column&quot;:11}}">告诉 QoderWork 开始执行</div>
        </div>
      )}
    </div>
  );
}
