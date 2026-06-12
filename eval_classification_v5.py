#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
喜茶 AI Agent — 食安分类评测 v5
基于 历史会话导出2026-05-08_食安划分.xlsx (882条标注会话)
+ 4.8日联名活动.xlsx (非食安对照)
测试维度：intent(食安/非食安) + subScenario(子场景)
"""
import os, re, sys, json, time, random
import requests
import pandas as pd
from datetime import datetime
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

API_BASE = "http://localhost:8081/api"
PRD_DIR = r"E:\PRD周边质量问题解决方案"
SAMPLE_SIZE = 100  # 食安/非食安各取100条
RESULTS_DIR = os.path.dirname(os.path.abspath(__file__))

# ── 登录 ──
def login():
    res = requests.post(f"{API_BASE}/auth/login",
                        json={"username": "admin", "password": "admin123"})
    return res.json()["data"]["token"]

# ── 从会话文本中提取首条用户消息（复用 v4 逻辑）──
def extract_first_user_message(conversation_text):
    if not conversation_text or pd.isna(conversation_text):
        return None
    text = str(conversation_text).strip()
    if not text or text in ("None", "nan"):
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

    # 客服识别
    greeting_re = re.compile(
        r'为您服务|有什么.*帮到|阿喜在的|正在排队|春光明媚|金毫满枝|喜悦发生'
        r'|很高兴.*服务|感谢.*联系|客服.*号|小喜.*在的'
        r'|不好意思.*让您久等|火速赶来|稍作等候|先为您查看'
    )
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
    strong_agent_re = re.compile(
        r'向您致以|真挚的歉意|马上反馈门店'
        r'|非常重视.*排查|抱歉没有给您满意|造成困扰.*辛苦您'
        r'|不好意思.*让您久等|阿喜正火速|阿喜.*为您查看'
    )
    user_phrase_re = re.compile(
        r'我要投诉|我要举报|怎么回事|你们.*太|垃圾|差劲|骗人'
        r'|我的.*什么时候|请问.*怎么|帮我.*退|我想.*问'
    )

    agent_speakers = set()
    speaker_scores = {}

    for speaker, msg in messages:
        if speaker not in speaker_scores:
            speaker_scores[speaker] = 0
        if greeting_re.search(msg):
            agent_speakers.add(speaker)
            speaker_scores[speaker] += 10
        agent_matches = agent_phrase_re.findall(msg)
        if agent_matches:
            speaker_scores[speaker] += len(agent_matches) * 3
        if user_phrase_re.search(msg):
            speaker_scores[speaker] -= 5

    if not agent_speakers:
        sorted_speakers = sorted(speaker_scores.items(), key=lambda x: -x[1])
        for sp, score in sorted_speakers:
            if score > 0:
                agent_speakers.add(sp)
                break

    if not agent_speakers and len(messages) >= 2:
        agent_speakers.add(messages[0][0])

    for speaker, msg in messages:
        if speaker in agent_speakers:
            continue
        if strong_agent_re.search(msg):
            continue
        if msg.startswith("http") or msg.startswith("{") or len(msg) < 2:
            continue
        cleaned = re.sub(r'[^\w\u4e00-\u9fff]', '', msg)
        if len(cleaned) < 1:
            continue
        return msg[:500]

    return None


# ── subScenario → 二级分类映射 ──
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

# 二级分类 → subScenario 映射（评测用）
LABEL_TO_SUB_SCENARIO = {
    '外源性异物': 'foreign_object_external',
    '内源性异物': 'foreign_object_internal',
    '身体不适': 'body_discomfort',
    '品质问题': ['spoilage', 'taste_issue', 'product_quality'],  # 多个可能
    '苍蝇或蟑螂': 'foreign_object_external',
    '虫类': 'foreign_object_external',
    '不明物': 'foreign_object_external',
    '异物': 'foreign_object_external',
    '变质': 'spoilage',
    '过期': 'spoilage',
    '口味异常': 'taste_issue',
    '异味': 'taste_issue',
    '饮品异味': ['taste_issue', 'spoilage'],
    '原料变质': ['spoilage', 'taste_issue'],
}


def load_food_safety_samples():
    """从 历史会话导出_食安划分.xlsx 加载食安样本"""
    path = os.path.join(PRD_DIR, "历史会话导出2026-05-08_食安划分.xlsx")
    print(f"  Loading {path} ...")
    df = pd.read_excel(path, sheet_name="all_samples", engine="openpyxl")
    print(f"  Total rows: {len(df)}")

    samples = []
    for _, row in df.iterrows():
        # 使用 current_turn_text（已清洗的对话文本）或 merged_text
        text = row.get("current_turn_text") or row.get("merged_text")
        msg = extract_first_user_message(text)
        if not msg:
            continue

        l1 = str(row.get("level_1_manual", "")).strip()
        l2 = str(row.get("level_2_manual", "")).strip()
        l3 = str(row.get("level_3_manual", "")).strip()
        target = str(row.get("target_label", "")).strip()

        samples.append({
            "message": msg,
            "expected_intent": "food_safety",
            "level_1": l1,
            "level_2": l2,
            "level_3": l3,
            "target_label": target,
        })

    print(f"  Extracted {len(samples)} food-safety messages with valid user text")
    return samples


def load_non_food_safety_samples():
    """从 4.8日联名活动.xlsx 加载非食安样本"""
    path = os.path.join(PRD_DIR, "4.8日联名活动.xlsx")
    print(f"  Loading {path} ...")
    content_col = "会话内容（不包含富文本标签）"
    df = pd.read_excel(path, engine="openpyxl",
                       usecols=[content_col, "一级分类", "二级分类"],
                       nrows=200)
    samples = []
    for _, row in df.iterrows():
        msg = extract_first_user_message(row.get(content_col))
        if msg:
            samples.append({
                "message": msg,
                "expected_intent": "general_knowledge",
                "level_1": str(row.get("一级分类", "线上活动")),
                "level_2": str(row.get("二级分类", "")),
                "level_3": "",
                "target_label": f"{row.get('一级分类', '')}/{row.get('二级分类', '')}",
            })
    print(f"  Extracted {len(samples)} non-food-safety messages")
    return samples


def classify_message(token, message):
    """调用后端 API 进行分类"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json; charset=utf-8"
    }
    try:
        res = requests.post(f"{API_BASE}/chat/send",
                            json={"message": message},
                            headers=headers, timeout=60)
        data = res.json()
        if data.get("code") == 200:
            d = data["data"]
            return {
                "intent": d.get("intent", "unknown"),
                "subScenario": d.get("metadata", {}).get("subScenario"),
            }
        return {"intent": f"error:{data.get('code')}", "subScenario": None}
    except Exception as e:
        return {"intent": f"error:{str(e)[:50]}", "subScenario": None}


def check_sub_scenario_match(predicted_sub, expected_l2, expected_l3):
    """检查 subScenario 是否与标注的二级/三级分类匹配"""
    if not predicted_sub:
        return False, "无subScenario"

    # 直接映射检查
    expected_label = SUB_SCENARIO_TO_LABEL.get(predicted_sub, "")

    # 二级分类匹配
    if expected_l2 and expected_l2 != "nan" and expected_l2 != "--":
        if expected_l2 == expected_label:
            return True, "二级匹配"
        # 多对多映射
        mapped = LABEL_TO_SUB_SCENARIO.get(expected_l2)
        if mapped:
            if isinstance(mapped, list) and predicted_sub in mapped:
                return True, "二级映射匹配"
            elif isinstance(mapped, str) and predicted_sub == mapped:
                return True, "二级映射匹配"

    # 三级分类匹配
    if expected_l3 and expected_l3 != "nan" and expected_l3 != "--":
        mapped = LABEL_TO_SUB_SCENARIO.get(expected_l3)
        if mapped:
            if isinstance(mapped, list) and predicted_sub in mapped:
                return True, "三级映射匹配"
            elif isinstance(mapped, str) and predicted_sub == mapped:
                return True, "三级映射匹配"

    # 外源性异物/内源性异物 特殊处理
    if expected_l2 == "外源性异物" and predicted_sub in ("foreign_object_external",):
        return True, "异物类型匹配"
    if expected_l2 == "内源性异物" and predicted_sub in ("foreign_object_internal",):
        return True, "异物类型匹配"

    return False, f"不匹配(预测={predicted_sub}, 标注L2={expected_l2}, L3={expected_l3})"


def run_evaluation():
    print("=" * 70)
    print("  喜茶 AI Agent — 食安分类评测 v5")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    token = login()
    print(f"\n[OK] JWT token acquired")

    # 加载数据
    print("\n── 食安测试数据 ──")
    fs_samples = load_food_safety_samples()

    print("\n── 非食安对照数据 ──")
    non_fs_samples = load_non_food_safety_samples()

    # 采样
    random.seed(42)
    fs_test = random.sample(fs_samples, min(SAMPLE_SIZE, len(fs_samples)))
    non_fs_test = random.sample(non_fs_samples, min(SAMPLE_SIZE, len(non_fs_samples)))
    all_tests = fs_test + non_fs_test
    random.shuffle(all_tests)

    print(f"\n── 测试集 ──")
    print(f"  食安样本:     {len(fs_test)}")
    print(f"  非食安样本:   {len(non_fs_test)}")
    print(f"  合计:         {len(all_tests)}")

    # 逐条分类
    print(f"\n── 分类评测 ({datetime.now().strftime('%H:%M:%S')}) ──")
    results = []
    tp = fp = tn = fn = 0
    sub_match = 0
    sub_total = 0
    sub_details = []

    for i, test in enumerate(all_tests):
        pred = classify_message(token, test["message"])
        expected_intent = test["expected_intent"]
        predicted_intent = pred["intent"]

        is_fs = (predicted_intent == "food_safety")
        should_be_fs = (expected_intent == "food_safety")

        if is_fs and should_be_fs:
            tp += 1; status = "TP"
        elif not is_fs and not should_be_fs:
            tn += 1; status = "TN"
        elif is_fs and not should_be_fs:
            fp += 1; status = "FP"
        else:
            fn += 1; status = "FN"

        # subScenario 评测（仅对食安样本）
        sub_status = ""
        if should_be_fs and is_fs and pred["subScenario"]:
            sub_total += 1
            matched, reason = check_sub_scenario_match(
                pred["subScenario"], test["level_2"], test["level_3"])
            if matched:
                sub_match += 1
                sub_status = f"SUB+({reason})"
            else:
                sub_status = f"SUB-({reason})"
            sub_details.append({
                "msg": test["message"][:60],
                "sub": pred["subScenario"],
                "l2": test["level_2"],
                "l3": test["level_3"],
                "matched": matched,
                "reason": reason,
            })

        mark = "+" if status in ("TP", "TN") else "-"
        results.append({
            "index": i + 1,
            "message": test["message"][:80],
            "expected_intent": expected_intent,
            "predicted_intent": predicted_intent,
            "sub_scenario": pred.get("subScenario", ""),
            "level_1": test["level_1"],
            "level_2": test["level_2"],
            "level_3": test["level_3"],
            "target_label": test["target_label"],
            "status": status,
            "sub_status": sub_status,
        })

        if (i + 1) % 10 == 0:
            print(f"  [{i+1}/{len(all_tests)}] {status} {sub_status}")

    # 计算指标
    total = tp + fp + tn + fn
    accuracy = (tp + tn) / total if total else 0
    precision = tp / (tp + fp) if (tp + fp) else 0
    recall = tp / (tp + fn) if (tp + fn) else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0
    specificity = tn / (tn + fp) if (tn + fp) else 0
    sub_accuracy = sub_match / sub_total if sub_total else 0

    # 输出结果
    print(f"\n{'='*70}")
    print(f"  评测结果")
    print(f"{'='*70}")
    print(f"  ── Intent 分类（食安 vs 非食安）──")
    print(f"  总样本:    {total}")
    print(f"  TP(食安):  {tp}    FP(误报):  {fp}")
    print(f"  FN(漏报):  {fn}    TN(非食安): {tn}")
    print(f"  准确率:    {accuracy:.1%}")
    print(f"  精确率:    {precision:.1%}")
    print(f"  召回率:    {recall:.1%}")
    print(f"  F1:        {f1:.1%}")
    print(f"  特异性:    {specificity:.1%}")

    print(f"\n  ── SubScenario 子场景评测（仅食安样本）──")
    print(f"  可评测:    {sub_total}")
    print(f"  匹配:      {sub_match}")
    print(f"  子场景准确率: {sub_accuracy:.1%}")

    # 错误分析
    errors = [r for r in results if r["status"] in ("FP", "FN")]
    if errors:
        print(f"\n  ── 错误分析 ({len(errors)}条) ──")
        for e in errors[:10]:
            print(f"  [{e['status']}] {e['message'][:60]}")
            print(f"         期望={e['expected_intent']} 预测={e['predicted_intent']} | {e['level_1']}/{e['level_2']}/{e['level_3']}")

    # subScenario 错误分析
    sub_errors = [s for s in sub_details if not s["matched"]]
    if sub_errors:
        print(f"\n  ── 子场景错误分析 ({len(sub_errors)}条) ──")
        for s in sub_errors[:10]:
            print(f"  {s['msg'][:50]}")
            print(f"    预测={s['sub']} 标注L2={s['l2']} L3={s['l3']} ({s['reason']})")

    # 保存结果
    results_df = pd.DataFrame(results)
    output_path = os.path.join(RESULTS_DIR, "classification_eval_v5.xlsx")
    results_df.to_excel(output_path, index=False)
    print(f"\n  结果已保存到: {output_path}")

    # 保存 JSON 摘要
    summary = {
        "timestamp": datetime.now().isoformat(),
        "total": total,
        "tp": tp, "fp": fp, "tn": tn, "fn": fn,
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "specificity": round(specificity, 4),
        "sub_total": sub_total,
        "sub_match": sub_match,
        "sub_accuracy": round(sub_accuracy, 4),
    }
    summary_path = os.path.join(RESULTS_DIR, "classification_eval_v5.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"  摘要已保存到: {summary_path}")


if __name__ == "__main__":
    run_evaluation()
