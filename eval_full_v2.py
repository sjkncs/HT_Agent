#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
喜茶 AI Agent — 全场景自动化评测脚本 v2
==========================================
基于 datasets/heytea_eval_suite.json 评测配置
覆盖: 意图分类 + 子场景分类 + 回复质量 + 性能延迟
"""
import os, sys, json, time, statistics
import requests
import pandas as pd
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

API_BASE = "http://localhost:8081/api"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
EVAL_SUITE_PATH = os.path.join(SCRIPT_DIR, "datasets", "heytea_eval_suite.json")
RESULTS_DIR = SCRIPT_DIR

# ── 子场景中文标签映射 (用于匹配评估) ──
SUB_SCENARIO_TO_LABEL = {
    'body_discomfort': '身体不适',
    'spoilage': '品质问题',
    'foreign_object_external': '外源性异物',
    'foreign_object_internal': '内源性异物',
    'taste_issue': '品质问题',
    'general_food_safety': '食安问题',
    'service_complaint': '服务投诉',
    'delivery_issue': '配送问题',
    'product_quality': '品质问题',
    'efficiency': '效率问题',
    'packaging': '包装问题',
    'hygiene': '卫生问题',
}


def login():
    res = requests.post(f"{API_BASE}/auth/login",
                        json={"username": "admin", "password": "admin123"})
    return res.json()["data"]["token"]


def classify_message(token, message):
    """调用后端 API, 返回完整结果"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json; charset=utf-8"
    }
    start = time.time()
    try:
        res = requests.post(f"{API_BASE}/chat/send",
                            json={"message": message},
                            headers=headers, timeout=60)
        elapsed = time.time() - start
        data = res.json()
        if data.get("code") == 200:
            d = data["data"]
            return {
                "intent": d.get("intent", "unknown"),
                "subScenario": d.get("metadata", {}).get("subScenario"),
                "content": d.get("content", ""),
                "latency_ms": round(elapsed * 1000),
                "error": None,
            }
        return {"intent": f"error:{data.get('code')}", "subScenario": None,
                "content": "", "latency_ms": round(elapsed * 1000),
                "error": data.get("message", "unknown")}
    except Exception as e:
        elapsed = time.time() - start
        return {"intent": f"error:{str(e)[:50]}", "subScenario": None,
                "content": "", "latency_ms": round(elapsed * 1000),
                "error": str(e)[:100]}


def check_sub_scenario_match(predicted_sub, expected_sub):
    """检查子场景是否匹配"""
    if not predicted_sub or not expected_sub:
        return expected_sub is None and predicted_sub is None
    
    if predicted_sub == expected_sub:
        return True
    
    # 允许 品质问题 组内的模糊匹配
    quality_group = {"spoilage", "taste_issue", "product_quality"}
    if predicted_sub in quality_group and expected_sub in quality_group:
        return True
    
    return False


def check_response_safety(content):
    """基础安全检查: 回复中是否包含不当内容"""
    bad_patterns = [
        "亲", "亲爱的", "宝",  # 禁止的称呼
        "！!",  # 禁止感叹号 (按需求文档)
    ]
    issues = []
    for p in bad_patterns:
        if p in content:
            issues.append(f"包含禁止词: {p}")
    
    if len(content) < 20:
        issues.append("回复过短 (<20字)")
    
    return len(issues) == 0, issues


def run_evaluation():
    # 加载评测配置
    with open(EVAL_SUITE_PATH, "r", encoding="utf-8") as f:
        suite = json.load(f)
    
    test_cases = suite["test_cases"]
    criteria = suite["pass_criteria"]
    
    print("=" * 70)
    print("  喜茶 AI Agent — 全场景自动化评测 v2")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  评测用例: {len(test_cases)} 条")
    print("=" * 70)
    
    token = login()
    print(f"\n[OK] JWT token acquired")
    
    # ── 逐条评测 ──
    results = []
    intent_tp = intent_fp = intent_tn = intent_fn = 0
    sub_correct = sub_total = 0
    safety_pass = safety_total = 0
    latencies = []
    
    # 按意图分组统计
    intent_stats = {
        "food_safety":       {"total": 0, "correct": 0},
        "ordering":          {"total": 0, "correct": 0},
        "general_knowledge": {"total": 0, "correct": 0},
    }
    sub_scenario_stats = {}
    
    for i, tc in enumerate(test_cases):
        pred = classify_message(token, tc["message"])
        expected_intent = tc["expected_intent"]
        expected_sub = tc.get("expected_sub_scenario")
        predicted_intent = pred["intent"]
        predicted_sub = pred["subScenario"]
        content = pred["content"]
        latency = pred["latency_ms"]
        latencies.append(latency)
        
        # Intent 评估
        is_fs = (predicted_intent == "food_safety")
        should_be_fs = (expected_intent == "food_safety")
        
        if is_fs and should_be_fs:
            intent_tp += 1
            intent_correct = True
        elif not is_fs and not should_be_fs:
            intent_tn += 1
            intent_correct = True
        elif is_fs and not should_be_fs:
            intent_fp += 1
            intent_correct = False
        else:
            intent_fn += 1
            intent_correct = False
        
        # 意图分组统计
        if expected_intent in intent_stats:
            intent_stats[expected_intent]["total"] += 1
            if intent_correct:
                intent_stats[expected_intent]["correct"] += 1
        
        # SubScenario 评估
        sub_match = False
        if expected_sub:
            sub_total += 1
            sub_match = check_sub_scenario_match(predicted_sub, expected_sub)
            if sub_match:
                sub_correct += 1
            
            if expected_sub not in sub_scenario_stats:
                sub_scenario_stats[expected_sub] = {"total": 0, "correct": 0}
            sub_scenario_stats[expected_sub]["total"] += 1
            if sub_match:
                sub_scenario_stats[expected_sub]["correct"] += 1
        
        # 安全检查
        safe, issues = check_response_safety(content)
        safety_total += 1
        if safe:
            safety_pass += 1
        
        # 记录结果
        results.append({
            "index": i + 1,
            "id": tc["id"],
            "message": tc["message"][:80],
            "expected_intent": expected_intent,
            "predicted_intent": predicted_intent,
            "intent_correct": intent_correct,
            "expected_sub": expected_sub or "",
            "predicted_sub": predicted_sub or "",
            "sub_match": sub_match,
            "risk_level": tc.get("expected_risk_level", ""),
            "latency_ms": latency,
            "response_length": len(content),
            "safety_pass": safe,
            "safety_issues": "; ".join(issues) if issues else "",
            "error": pred.get("error", ""),
        })
        
        if (i + 1) % 10 == 0:
            mark = "✓" if intent_correct else "✗"
            print(f"  [{i+1}/{len(test_cases)}] {mark} intent={predicted_intent:17s} sub={predicted_sub or '-':28s} {latency}ms")
    
    # ── 计算指标 ──
    total = intent_tp + intent_fp + intent_tn + intent_fn
    accuracy = (intent_tp + intent_tn) / total if total else 0
    precision = intent_tp / (intent_tp + intent_fp) if (intent_tp + intent_fp) else 0
    recall = intent_tp / (intent_tp + intent_fn) if (intent_tp + intent_fn) else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0
    specificity = intent_tn / (intent_tn + intent_fp) if (intent_tn + intent_fp) else 0
    sub_accuracy = sub_correct / sub_total if sub_total else 0
    safety_rate = safety_pass / safety_total if safety_total else 0
    
    p50 = statistics.median(latencies) if latencies else 0
    p95 = sorted(latencies)[int(len(latencies) * 0.95)] if latencies else 0
    avg_latency = statistics.mean(latencies) if latencies else 0
    
    # ── 输出结果 ──
    print(f"\n{'='*70}")
    print(f"  评测结果")
    print(f"{'='*70}")
    
    print(f"\n  ── 1. Intent 分类 ──")
    print(f"  总样本:    {total}")
    print(f"  TP: {intent_tp}  FP: {intent_fp}  FN: {intent_fn}  TN: {intent_tn}")
    print(f"  准确率:    {accuracy:.1%}  (标准: {criteria['intent_accuracy_min']:.0%})")
    print(f"  精确率:    {precision:.1%}")
    print(f"  召回率:    {recall:.1%}")
    print(f"  F1:        {f1:.1%}")
    print(f"  特异性:    {specificity:.1%}")
    
    print(f"\n  分意图准确率:")
    for intent, stats in intent_stats.items():
        if stats["total"] > 0:
            acc = stats["correct"] / stats["total"]
            print(f"    {intent:20s}: {acc:.1%} ({stats['correct']}/{stats['total']})")
    
    print(f"\n  ── 2. SubScenario 子场景 ──")
    print(f"  可评测:    {sub_total}")
    print(f"  匹配:      {sub_correct}")
    print(f"  准确率:    {sub_accuracy:.1%}  (标准: {criteria['sub_scenario_accuracy_min']:.0%})")
    
    print(f"\n  分子场景准确率:")
    for sub, stats in sorted(sub_scenario_stats.items(), key=lambda x: -x[1]["total"]):
        if stats["total"] > 0:
            acc = stats["correct"] / stats["total"]
            print(f"    {sub:30s}: {acc:.1%} ({stats['correct']}/{stats['total']})")
    
    print(f"\n  ── 3. 回复安全 ──")
    print(f"  通过率:    {safety_rate:.1%}")
    
    print(f"\n  ── 4. 性能延迟 ──")
    print(f"  平均:      {avg_latency:.0f}ms")
    print(f"  P50:       {p50:.0f}ms")
    print(f"  P95:       {p95:.0f}ms  (标准: <{criteria['latency_p95_max_ms']}ms)")
    
    # ── 通过/失败判定 ──
    print(f"\n  ── 5. 通过标准判定 ──")
    checks = [
        ("Intent 准确率", accuracy >= criteria["intent_accuracy_min"],
         f"{accuracy:.1%} >= {criteria['intent_accuracy_min']:.0%}"),
        ("SubScenario 准确率", sub_accuracy >= criteria["sub_scenario_accuracy_min"],
         f"{sub_accuracy:.1%} >= {criteria['sub_scenario_accuracy_min']:.0%}"),
        ("P95 延迟", p95 <= criteria["latency_p95_max_ms"],
         f"{p95:.0f}ms <= {criteria['latency_p95_max_ms']}ms"),
    ]
    all_pass = True
    for name, passed, detail in checks:
        status = "PASS" if passed else "FAIL"
        if not passed:
            all_pass = False
        print(f"    [{status}] {name}: {detail}")
    
    overall = "ALL PASS" if all_pass else "SOME FAILED"
    print(f"\n  总体: {overall}")
    
    # ── 错误分析 ──
    errors = [r for r in results if not r["intent_correct"]]
    if errors:
        print(f"\n  ── Intent 错误分析 ({len(errors)}条) ──")
        for e in errors[:10]:
            print(f"  [{e['expected_intent']:20s} → {e['predicted_intent']:20s}] {e['message'][:50]}")
    
    sub_errors = [r for r in results if r["expected_sub"] and not r["sub_match"]]
    if sub_errors:
        print(f"\n  ── SubScenario 错误分析 ({len(sub_errors)}条) ──")
        for e in sub_errors[:10]:
            print(f"  [{e['expected_sub']:28s} → {e['predicted_sub']:28s}] {e['message'][:50]}")
    
    # ── 保存结果 ──
    results_df = pd.DataFrame(results)
    xlsx_path = os.path.join(RESULTS_DIR, "full_eval_v2.xlsx")
    results_df.to_excel(xlsx_path, index=False)
    
    summary = {
        "timestamp": datetime.now().isoformat(),
        "total_cases": total,
        "intent": {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "specificity": round(specificity, 4),
            "by_intent": {k: {"accuracy": round(v["correct"]/v["total"], 4) if v["total"] else 0,
                              "total": v["total"], "correct": v["correct"]}
                          for k, v in intent_stats.items()},
        },
        "sub_scenario": {
            "accuracy": round(sub_accuracy, 4),
            "total": sub_total,
            "correct": sub_correct,
            "by_sub_scenario": {k: {"accuracy": round(v["correct"]/v["total"], 4) if v["total"] else 0,
                                     "total": v["total"], "correct": v["correct"]}
                                for k, v in sub_scenario_stats.items()},
        },
        "safety": {"pass_rate": round(safety_rate, 4)},
        "performance": {
            "avg_ms": round(avg_latency),
            "p50_ms": round(p50),
            "p95_ms": round(p95),
        },
        "pass_criteria": criteria,
        "overall_pass": all_pass,
    }
    json_path = os.path.join(RESULTS_DIR, "full_eval_v2.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    print(f"\n  结果: {xlsx_path}")
    print(f"  摘要: {json_path}")


if __name__ == "__main__":
    run_evaluation()
