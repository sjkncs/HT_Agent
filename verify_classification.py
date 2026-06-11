#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
喜茶 AI Agent — 意图分类准确率验证脚本 v3
Uses pandas with selective column loading for fast execution.
"""

import os, re, sys, json, time, random, requests
import pandas as pd
from datetime import datetime

API_BASE = "http://localhost:8081/api"
PRD_DIR = r"E:\PRD周边质量问题解决方案"
SAMPLE_SIZE = 50
RESULTS_DIR = os.path.dirname(os.path.abspath(__file__))

CONTENT_COL = "会话内容（不包含富文本标签）"


def login():
    res = requests.post(f"{API_BASE}/auth/login",
                        json={"username": "admin", "password": "admin123"})
    return res.json()["data"]["token"]


def extract_first_user_message(conversation_text):
    if not conversation_text or pd.isna(conversation_text):
        return None
    text = str(conversation_text).strip()
    if not text or text == "None" or text == "nan":
        return None

    lines = text.split("\n")
    speaker_pattern = re.compile(r'^.+?\s+\d{4}年\d{2}月\d{2}日\s+\d{2}:\d{2}:\d{2}$')
    
    messages = []
    current_speaker = None
    current_msg_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if speaker_pattern.match(line):
            if current_speaker and current_msg_lines:
                messages.append((current_speaker, "\n".join(current_msg_lines).strip()))
            current_speaker = line
            current_msg_lines = []
        else:
            current_msg_lines.append(line)
    
    if current_speaker and current_msg_lines:
        messages.append((current_speaker, "\n".join(current_msg_lines).strip()))

    greeting_re = re.compile(
        r'为您服务|有什么.*帮到|阿喜在的|正在排队|春光明媚|金毫满枝|喜悦发生'
    )
    
    agent_speakers = set()
    for speaker, msg in messages:
        if greeting_re.search(msg):
            agent_speakers.add(speaker)
    
    if not agent_speakers and len(messages) >= 2:
        agent_speakers.add(messages[0][0])

    for speaker, msg in messages:
        if speaker in agent_speakers:
            continue
        if msg.startswith("http"):
            continue
        if msg.startswith("{"):
            continue
        if len(msg) < 2:
            continue
        cleaned = re.sub(r'[^\w\u4e00-\u9fff]', '', msg)
        if len(cleaned) < 1:
            continue
        return msg[:500]
    
    return None


def load_food_safety_samples():
    print("  Loading 5.6食安测试.xlsx ...")
    df = pd.read_excel(
        os.path.join(PRD_DIR, "5.6食安测试.xlsx"),
        engine="openpyxl",
        usecols=[CONTENT_COL, "一级分类", "二级分类"]
    )
    samples = []
    for _, row in df.iterrows():
        msg = extract_first_user_message(row.get(CONTENT_COL))
        if msg:
            samples.append({
                "message": msg,
                "expected": "food_safety",
                "label": str(row.get("一级分类", "食安问题")),
                "sublabel": str(row.get("二级分类", "")),
            })
    return samples


def load_non_food_safety_samples():
    print("  Loading 4.8日联名活动.xlsx ...")
    df = pd.read_excel(
        os.path.join(PRD_DIR, "4.8日联名活动.xlsx"),
        engine="openpyxl",
        usecols=[CONTENT_COL, "一级分类", "二级分类"],
        nrows=200
    )
    samples = []
    for _, row in df.iterrows():
        msg = extract_first_user_message(row.get(CONTENT_COL))
        if msg:
            samples.append({
                "message": msg,
                "expected": "general_knowledge",
                "label": str(row.get("一级分类", "线上活动")),
                "sublabel": str(row.get("二级分类", "")),
            })
    return samples


def classify_message(token, message):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    try:
        res = requests.post(f"{API_BASE}/chat/send",
                            json={"message": message},
                            headers=headers, timeout=60)
        data = res.json()
        if data.get("code") == 200:
            return data["data"].get("intent", "unknown")
        return f"error:{data.get('code')}"
    except Exception as e:
        return f"error:{str(e)[:50]}"


def run_test():
    print("=" * 60)
    print("  喜茶 AI Agent — 意图分类准确率验证")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    token = login()
    print(f"\n[OK] JWT token acquired")
    
    # Load
    print("\n-- 食安测试数据 --")
    fs_samples = load_food_safety_samples()
    print(f"  Extracted {len(fs_samples)} food-safety messages from {len(fs_samples)} sessions")
    
    print("\n-- 非食安测试数据 --")
    non_fs_samples = load_non_food_safety_samples()
    print(f"  Extracted {len(non_fs_samples)} non-food-safety messages")
    
    # Sample
    random.seed(42)
    fs_test = random.sample(fs_samples, min(SAMPLE_SIZE, len(fs_samples)))
    non_fs_test = random.sample(non_fs_samples, min(SAMPLE_SIZE, len(non_fs_samples)))
    all_tests = fs_test + non_fs_test
    random.shuffle(all_tests)
    
    print(f"\n-- Test Set --")
    print(f"  Food safety:     {len(fs_test)}")
    print(f"  Non-food safety: {len(non_fs_test)}")
    print(f"  Total:           {len(all_tests)}")
    
    # Classify
    print(f"\n-- Classification ({datetime.now().strftime('%H:%M:%S')}) --")
    results = []
    tp = fp = tn = fn = 0
    
    for i, test in enumerate(all_tests):
        intent = classify_message(token, test["message"])
        expected = test["expected"]
        
        is_fs = (intent == "food_safety")
        should_be_fs = (expected == "food_safety")
        
        if is_fs and should_be_fs:
            tp += 1; status = "TP"
        elif not is_fs and not should_be_fs:
            tn += 1; status = "TN"
        elif is_fs and not should_be_fs:
            fp += 1; status = "FP"
        else:
            fn += 1; status = "FN"
        
        mark = "+" if status in ("TP", "TN") else "-"
        results.append({
            "index": i + 1,
            "message": test["message"][:100],
            "expected": expected,
            "predicted": intent,
            "label": test["label"],
            "sublabel": test.get("sublabel", ""),
            "status": status,
        })
        
        msg_preview = test["message"][:45].replace("\n", " ")
        print(f"  [{i+1:3d}/{len(all_tests)}] {mark} {status:2s} exp={expected:18s} got={intent:18s} | {msg_preview}")
        sys.stdout.flush()
        
        time.sleep(0.3)
    
    # Metrics
    total = len(all_tests)
    accuracy = (tp + tn) / total if total > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
    
    print(f"\n{'=' * 60}")
    print(f"  CLASSIFICATION ACCURACY REPORT")
    print(f"{'=' * 60}")
    print(f"\n  Total: {total} | FoodSafety: {len(fs_test)} | Non-FS: {len(non_fs_test)}")
    print(f"\n  Confusion Matrix:")
    print(f"                        Predicted")
    print(f"                   food_safety  non_food_safety")
    print(f"  Actual FS        TP={tp:<6d}    FN={fn:<6d}")
    print(f"  Actual non-FS    FP={fp:<6d}    TN={tn:<6d}")
    print(f"\n  Accuracy:    {accuracy:.2%}")
    print(f"  Precision:   {precision:.2%}")
    print(f"  Recall:      {recall:.2%}")
    print(f"  F1 Score:    {f1:.2%}")
    print(f"  Specificity: {specificity:.2%}")
    
    # Error analysis
    errors = [r for r in results if r["status"] in ("FP", "FN")]
    if errors:
        print(f"\n  Misclassified ({len(errors)}):")
        for e in errors[:15]:
            print(f"    [{e['index']}] {e['status']} exp={e['expected']} got={e['predicted']}")
            print(f"         label={e['label']}/{e['sublabel']}")
            print(f"         msg={e['message'][:80]}")
    
    # Save
    output_path = os.path.join(RESULTS_DIR, "classification_results.json")
    report = {
        "timestamp": datetime.now().isoformat(),
        "total_samples": total,
        "food_safety_samples": len(fs_test),
        "non_food_safety_samples": len(non_fs_test),
        "confusion_matrix": {"TP": tp, "TN": tn, "FP": fp, "FN": fn},
        "metrics": {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "specificity": round(specificity, 4),
        },
        "results": results,
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"\n  Results saved: {output_path}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    run_test()
