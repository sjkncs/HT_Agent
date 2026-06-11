#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
喜茶 AI Agent — 意图分类准确率验证脚本 v4
v4: Multi-phase agent detection (greeting + professional phrases + user exclusion scoring)
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

    # Phase 1: 标准客服问候语（高置信度）
    greeting_re = re.compile(
        r'为您服务|有什么.*帮到|阿喜在的|正在排队|春光明媚|金毫满枝|喜悦发生'
        r'|很高兴.*服务|感谢.*联系|客服.*号|小喜.*在的'
        r'|不好意思.*让您久等|火速赶来|稍作等候|先为您查看'
    )
    # Phase 2: 客服专业话术（中置信度，需配合其他信号）
    agent_phrase_re = re.compile(
        r'理解您的心情|致以.*歉意|马上反馈|详细描述|辛苦您'
        r'|真挚的歉意|非常重视|尽快联系|尽快核实'
        r'|给您带来不便|已记录|会.*跟进|帮您查看|帮您查询'
        r'|感谢您的.*反馈|提供一下|订单编号|门店信息'
        r'|向您致以|真的非常抱歉|满意.*体验|给您满意'
        r'|造成困扰|可联系的|抱歉没有给您|尽快核实'
        r'|门店负责人|排查并|给您造成|非常抱歉没有给'
        r'|阿喜.*核实|阿喜.*反馈|阿喜.*查看'
    )
    # Per-message agent detector (strong phrases that almost certainly indicate agent)
    strong_agent_re = re.compile(
        r'向您致以|真挚的歉意|理解您的心情|马上反馈门店'
        r'|非常重视.*排查|抱歉没有给您满意|造成困扰.*辛苦您'
        r'|不好意思.*让您久等|阿喜正火速|阿喜.*为您查看'
    )
    # Phase 3: 排除用户的特征（用户常用但客服不常用）
    user_phrase_re = re.compile(
        r'我要投诉|我要举报|怎么回事|你们.*太|垃圾|差劲|骗人'
        r'|我的.*什么时候|请问.*怎么|帮我.*退|我想.*问'
    )
    
    agent_speakers = set()
    speaker_scores = {}  # speaker -> agent likelihood score
    
    for speaker, msg in messages:
        if speaker not in speaker_scores:
            speaker_scores[speaker] = 0
        
        # Phase 1: 标准问候语 → 高置信度客服
        if greeting_re.search(msg):
            agent_speakers.add(speaker)
            speaker_scores[speaker] += 10
        
        # Phase 2: 客服专业话术 → 累加中置信度信号
        agent_matches = agent_phrase_re.findall(msg)
        if agent_matches:
            speaker_scores[speaker] += len(agent_matches) * 3
        
        # Phase 3: 用户特征 → 扣分
        if user_phrase_re.search(msg):
            speaker_scores[speaker] -= 5
    
    # 按得分排序，得分最高且>0的视为客服
    if not agent_speakers:
        sorted_speakers = sorted(speaker_scores.items(), key=lambda x: -x[1])
        for sp, score in sorted_speakers:
            if score > 0:
                agent_speakers.add(sp)
                break  # 只取最高分的一个
    
    # Fallback: 如果仍然没识别出客服，取第一条消息的发言者
    if not agent_speakers and len(messages) >= 2:
        agent_speakers.add(messages[0][0])

    for speaker, msg in messages:
        if speaker in agent_speakers:
            continue
        # Per-message strong agent check: skip even unknown speakers if msg is clearly agent
        if strong_agent_re.search(msg):
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
        # Strip emoji/non-BMP chars for Windows GBK console
        msg_preview = msg_preview.encode('gbk', errors='replace').decode('gbk', errors='replace')
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
            msg_snippet = e['message'][:80].encode('gbk', errors='replace').decode('gbk', errors='replace')
            print(f"         msg={msg_snippet}")
    
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
