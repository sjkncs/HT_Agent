#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
喜茶 AI 客服 Agent — 完整标准化数据集生成器
=============================================
基于:
  - 历史会话导出2026-05-08_食安划分.xlsx (881条食安标注, train/val/test)
  - 4.8日联名活动.xlsx (200条非食安对照)
  - 饮品名称.docx (86款官方产品)
  - 完整复习纲要.docx (课程知识点 → 评测维度参考)

生成 4 套数据集:
  1. train_set  — 训练集: 用于关键词模式学习/正则调优 (60%)
  2. val_set    — 验证集: 用于超参调优和模式验证 (15%)
  3. test_set   — 测试集: 最终性能评估, 不参与任何调优 (15%)
  4. eval_set   — 评测集: 自动化回归测试, 含预期结果标注 (10%)

覆盖 3 大意图 × 15+ 子场景:
  food_safety:   body_discomfort, spoilage, foreign_object_external,
                 foreign_object_internal, taste_issue, general_food_safety
  ordering:      recommendation, place_order, store_info, browse_menu
  general:       service_complaint, delivery_issue, product_quality,
                 efficiency, packaging, hygiene

输出:
  datasets/heytea_full_dataset.xlsx (多 sheet)
  datasets/heytea_eval_suite.json (自动化评测配置)
"""

import os, re, sys, json, random, hashlib
from datetime import datetime
from collections import Counter, defaultdict

import pandas as pd

sys.stdout.reconfigure(encoding='utf-8')

# ── 路径 ──
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PRD_DIR = r"E:\PRD周边质量问题解决方案"
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "datasets")

FOOD_SAFETY_XLSX = os.path.join(PRD_DIR, "历史会话导出2026-05-08_食安划分.xlsx")
NON_FS_XLSX = os.path.join(PRD_DIR, "4.8日联名活动.xlsx")

random.seed(42)

# ═══════════════════════════════════════════════════════════
#  意图/子场景 分类体系 (标准化)
# ═══════════════════════════════════════════════════════════

INTENT_TAXONOMY = {
    "food_safety": {
        "label": "食品安全",
        "sub_scenarios": {
            "body_discomfort":          "身体不适",
            "spoilage":                 "变质/过期",
            "foreign_object_external":  "外源性异物",
            "foreign_object_internal":  "内源性异物",
            "taste_issue":             "口味异常",
            "general_food_safety":     "食安问题(通用)",
        },
        "priority": 1,
    },
    "ordering": {
        "label": "点单/购买",
        "sub_scenarios": {
            "recommendation": "产品推荐",
            "place_order":    "下单点单",
            "store_info":     "门店信息",
            "browse_menu":    "浏览菜单",
        },
        "priority": 2,
    },
    "general_knowledge": {
        "label": "通用/其他",
        "sub_scenarios": {
            "service_complaint": "服务投诉",
            "delivery_issue":    "配送问题",
            "product_quality":   "产品品质",
            "efficiency":        "效率问题",
            "packaging":         "包装问题",
            "hygiene":           "卫生问题",
        },
        "priority": 3,
    },
}

# L2 标注 → 标准化 sub_scenario 映射
L2_TO_SUB_SCENARIO = {
    "外源性异物": "foreign_object_external",
    "内源性异物": "foreign_object_internal",
    "身体不适":   "body_discomfort",
    "饮品异味":   "taste_issue",
    "原料变质":   "spoilage",
    "OEM":        "general_food_safety",
    "原料未熟":   "spoilage",
}

# L3 标注 → 标准化 sub_scenario 映射 (更精细)
L3_TO_SUB_SCENARIO = {
    "果核": "foreign_object_internal",
    "果皮": "foreign_object_internal",
    "茶渣": "foreign_object_internal",
    "水果纤维": "foreign_object_internal",
    "果蔬杂质或其它原料": "foreign_object_internal",
    "不明物": "foreign_object_external",
    "虫类": "foreign_object_external",
    "毛发": "foreign_object_external",
    "塑料": "foreign_object_external",
    "苍蝇或蟑螂": "foreign_object_external",
    "杯盖或小白塞": "foreign_object_external",
    "拉肚子": "body_discomfort",
    "呕吐": "body_discomfort",
    "其它不适": "body_discomfort",
}


# ═══════════════════════════════════════════════════════════
#  合成测试用例 — 覆盖所有意图×子场景 (非来自真实数据)
# ═══════════════════════════════════════════════════════════

SYNTHETIC_CASES = [
    # ── food_safety / body_discomfort ──
    ("喝完这个之后肚子一直不舒服", "food_safety", "body_discomfort", "high"),
    ("我孩子喝了你们奶茶后上吐下泻", "food_safety", "body_discomfort", "critical"),
    ("感觉有点过敏，身上起了好多疹子", "food_safety", "body_discomfort", "high"),
    ("拉肚子拉了一天了，昨晚喝的芝芝莓莓", "food_safety", "body_discomfort", "critical"),
    ("喝完发烧了，是不是食材有问题", "food_safety", "body_discomfort", "critical"),

    # ── food_safety / spoilage ──
    ("这杯奶茶闻起来有一股馊味", "food_safety", "spoilage", "high"),
    ("买回来发现已经过了保质期", "food_safety", "spoilage", "high"),
    ("牛奶看起来不太新鲜，有点结块", "food_safety", "spoilage", "high"),
    ("酸奶是不是变质了，喝着酸酸的", "food_safety", "spoilage", "medium"),
    ("这个发霉了吧，上面有绿点", "food_safety", "spoilage", "critical"),

    # ── food_safety / foreign_object_external ──
    ("杯子里面有一根头发", "food_safety", "foreign_object_external", "high"),
    ("吸管吸出来一个苍蝇", "food_safety", "foreign_object_external", "high"),
    ("喝到一半发现有塑料碎片", "food_safety", "foreign_object_external", "critical"),
    ("封口贴掉进杯子里了", "food_safety", "foreign_object_external", "medium"),
    ("里面有个不明物体，黑色的", "food_safety", "foreign_object_external", "high"),
    ("有个创可贴在袋子底部", "food_safety", "foreign_object_external", "high"),
    ("杯盖掉进饮料里了", "food_safety", "foreign_object_external", "medium"),

    # ── food_safety / foreign_object_internal ──
    ("茶里面有好多茶渣", "food_safety", "foreign_object_internal", "low"),
    ("怎么有芒果皮在里面", "food_safety", "foreign_object_internal", "low"),
    ("吸出来好多果肉纤维", "food_safety", "foreign_object_internal", "low"),
    ("葡萄皮太多了吧", "food_safety", "foreign_object_internal", "low"),
    ("有柠檬籽，正常吗", "food_safety", "foreign_object_internal", "low"),

    # ── food_safety / taste_issue ──
    ("这个味道好奇怪，和上次不一样", "food_safety", "taste_issue", "medium"),
    ("喝起来有一股消毒水的味道", "food_safety", "taste_issue", "high"),
    ("珍珠是苦的，奶茶味道也不对", "food_safety", "taste_issue", "medium"),
    ("怎么感觉味道变淡了很多", "food_safety", "taste_issue", "low"),
    ("这杯怎么是酸的，我点的是正常甜", "food_safety", "taste_issue", "medium"),

    # ── food_safety / general_food_safety ──
    ("我想投诉食品安全问题", "food_safety", "general_food_safety", "high"),
    ("你们的食品安全怎么保障", "food_safety", "general_food_safety", "low"),
    ("出现食品问题怎么处理", "food_safety", "general_food_safety", "medium"),
    ("我要退款，东西有问题", "food_safety", "general_food_safety", "high"),
    ("这个正常吗，里面有白色沉淀", "food_safety", "general_food_safety", "medium"),

    # ── ordering / recommendation ──
    ("有什么好喝的推荐吗", "ordering", "recommendation", "low"),
    ("第一次来，推荐什么新品", "ordering", "recommendation", "low"),
    ("想喝清爽一点的，有推荐吗", "ordering", "recommendation", "low"),
    ("你们最热门的饮品是哪款", "ordering", "recommendation", "low"),
    ("夏天喝什么比较解暑", "ordering", "recommendation", "low"),

    # ── ordering / place_order ──
    ("我要一杯多肉葡萄，少冰", "ordering", "place_order", "low"),
    ("帮我下单两杯芝芝莓莓", "ordering", "place_order", "low"),
    ("来一杯烤黑糖波波牛乳茶，热的", "ordering", "place_order", "low"),
    ("我想点外卖，三杯饮品", "ordering", "place_order", "low"),

    # ── ordering / store_info ──
    ("最近的门店在哪里", "ordering", "store_info", "low"),
    ("天河城店几点关门", "ordering", "store_info", "low"),
    ("北京有哪些门店", "ordering", "store_info", "low"),
    ("你们门店有停车位吗", "ordering", "store_info", "low"),

    # ── ordering / browse_menu ──
    ("看看菜单", "ordering", "browse_menu", "low"),
    ("多肉葡萄多少钱一杯", "ordering", "browse_menu", "low"),
    ("你们有哪些水果茶", "ordering", "browse_menu", "low"),
    ("有没有不含咖啡因的饮品", "ordering", "browse_menu", "low"),

    # ── general_knowledge / service_complaint ──
    ("店员态度太差了，爱理不理的", "general_knowledge", "service_complaint", "high"),
    ("你们的服务真的让人失望", "general_knowledge", "service_complaint", "medium"),
    ("店员对我翻白眼", "general_knowledge", "service_complaint", "high"),
    ("排队等了很久没人理", "general_knowledge", "service_complaint", "medium"),
    ("店员不耐烦，甩脸色", "general_knowledge", "service_complaint", "high"),

    # ── general_knowledge / delivery_issue ──
    ("外卖撒了一大半", "general_knowledge", "delivery_issue", "high"),
    ("等了一个小时还没送到", "general_knowledge", "delivery_issue", "medium"),
    ("送错地址了，不是我的", "general_knowledge", "delivery_issue", "high"),
    ("骑手提前点送达了，东西还没到", "general_knowledge", "delivery_issue", "high"),
    ("少送了一杯，订单是三杯", "general_knowledge", "delivery_issue", "medium"),

    # ── general_knowledge / product_quality ──
    ("这个太甜了，我点的少糖", "general_knowledge", "product_quality", "medium"),
    ("冰也太多了吧，都快化了", "general_knowledge", "product_quality", "medium"),
    ("做错了，我点的是多肉葡萄不是莓莓", "general_knowledge", "product_quality", "medium"),
    ("波波好硬，跟平时不一样", "general_knowledge", "product_quality", "medium"),
    ("份量明显少了，才半杯", "general_knowledge", "product_quality", "medium"),

    # ── general_knowledge / efficiency ──
    ("等了40分钟还没做好", "general_knowledge", "efficiency", "medium"),
    ("叫号叫了半天没人应", "general_knowledge", "efficiency", "medium"),
    ("前面才3个人，等了半小时", "general_knowledge", "efficiency", "medium"),
    ("出杯速度太慢了吧", "general_knowledge", "efficiency", "low"),

    # ── general_knowledge / packaging ──
    ("杯盖裂了，一直在漏", "general_knowledge", "packaging", "medium"),
    ("吸管断了，没法喝", "general_knowledge", "packaging", "medium"),
    ("包装袋破了，饮料洒了一地", "general_knowledge", "packaging", "high"),
    ("杯底有裂缝", "general_knowledge", "packaging", "medium"),

    # ── general_knowledge / hygiene ──
    ("门店地上好脏，到处是纸", "general_knowledge", "hygiene", "medium"),
    ("员工没戴口罩也没戴手套", "general_knowledge", "hygiene", "medium"),
    ("操作台上看起来很脏", "general_knowledge", "hygiene", "high"),
    ("门店里有好多苍蝇在飞", "general_knowledge", "hygiene", "high"),

    # ── 边界用例/对抗样本 ──
    ("你好", "general_knowledge", None, "low"),
    ("人工客服", "general_knowledge", None, "low"),
    ("转人工", "general_knowledge", None, "low"),
    ("我要投诉", "general_knowledge", "service_complaint", "high"),
    ("谢谢", "general_knowledge", None, "low"),
    ("你们几点开门", "ordering", "store_info", "low"),
    ("能开发票吗", "general_knowledge", None, "low"),
    ("加盟条件是什么", "general_knowledge", None, "low"),
    ("周边产品在哪里买", "general_knowledge", None, "low"),
    ("会员积分怎么用", "general_knowledge", None, "low"),
]


# ═══════════════════════════════════════════════════════════
#  消息提取 (复用 eval_classification_v5.py 逻辑)
# ═══════════════════════════════════════════════════════════

SPEAKER_PATTERN = re.compile(r'^.+?\s+\d{4}年\d{2}月\d{2}日\s+\d{2}:\d{2}:\d{2}$')

GREETING_RE = re.compile(
    r'为您服务|有什么.*帮到|阿喜在的|正在排队|春光明媚|金毫满枝|喜悦发生'
    r'|很高兴.*服务|感谢.*联系|客服.*号|小喜.*在的'
    r'|不好意思.*让您久等|火速赶来|稍作等候|先为您查看'
)
AGENT_PHRASE_RE = re.compile(
    r'理解您的心情|致以.*歉意|马上反馈|详细描述|辛苦您'
    r'|真挚的歉意|非常重视|尽快联系|尽快核实'
    r'|给您带来不便|已记录|会.*跟进|帮您查看|帮您查询'
    r'|感谢您的.*反馈|提供一下|订单编号|门店信息'
    r'|向您致以|真的非常抱歉|满意.*体验|给您满意'
    r'|造成困扰|可联系的|抱歉没有给您|尽快核实'
    r'|门店负责人|排查并|给您造成|非常抱歉没有给'
    r'|阿喜.*核实|阿喜.*反馈|阿喜.*查看'
)
STRONG_AGENT_RE = re.compile(
    r'向您致以|真挚的歉意|马上反馈门店'
    r'|非常重视.*排查|抱歉没有给您满意|造成困扰.*辛苦您'
    r'|不好意思.*让您久等|阿喜正火速|阿喜.*为您查看'
)
USER_PHRASE_RE = re.compile(
    r'我要投诉|我要举报|怎么回事|你们.*太|垃圾|差劲|骗人'
    r'|我的.*什么时候|请问.*怎么|帮我.*退|我想.*问'
)


def extract_first_user_message(conversation_text):
    if not conversation_text or pd.isna(conversation_text):
        return None
    text = str(conversation_text).strip()
    if not text or text in ("None", "nan"):
        return None

    lines = text.split("\n")
    messages = []
    current_speaker = None
    current_msg_lines = []

    for line in lines:
        line = line.strip()
        if not line:
            continue
        if SPEAKER_PATTERN.match(line):
            if current_speaker and current_msg_lines:
                messages.append((current_speaker, "\n".join(current_msg_lines).strip()))
            current_speaker = line
            current_msg_lines = []
        else:
            current_msg_lines.append(line)

    if current_speaker and current_msg_lines:
        messages.append((current_speaker, "\n".join(current_msg_lines).strip()))

    agent_speakers = set()
    speaker_scores = {}

    for speaker, msg in messages:
        if speaker not in speaker_scores:
            speaker_scores[speaker] = 0
        if GREETING_RE.search(msg):
            agent_speakers.add(speaker)
            speaker_scores[speaker] += 10
        agent_matches = AGENT_PHRASE_RE.findall(msg)
        if agent_matches:
            speaker_scores[speaker] += len(agent_matches) * 3
        if USER_PHRASE_RE.search(msg):
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
        if STRONG_AGENT_RE.search(msg):
            continue
        if msg.startswith("http") or msg.startswith("{") or len(msg) < 2:
            continue
        cleaned = re.sub(r'[^\w\u4e00-\u9fff]', '', msg)
        if len(cleaned) < 1:
            continue
        return msg[:500]

    return None


# ═══════════════════════════════════════════════════════════
#  数据加载
# ═══════════════════════════════════════════════════════════

def load_food_safety_data():
    """加载食安标注数据，提取首条用户消息和标注"""
    print("[1/4] 加载食安标注数据...")
    df = pd.read_excel(FOOD_SAFETY_XLSX, sheet_name="all_samples", engine="openpyxl")
    print(f"  原始行数: {len(df)}")

    records = []
    for _, row in df.iterrows():
        text = row.get("current_turn_text") or row.get("merged_text")
        msg = extract_first_user_message(text)
        if not msg:
            continue

        l1 = str(row.get("level_1_manual", "")).strip()
        l2 = str(row.get("level_2_manual", "")).strip()
        l3 = str(row.get("level_3_manual", "")).strip()
        target = str(row.get("target_label", "")).strip()
        split = str(row.get("split", "")).strip()

        # 标准化 sub_scenario
        sub_scenario = L2_TO_SUB_SCENARIO.get(l2, "general_food_safety")
        # L3 更精细映射覆盖
        if l3 in L3_TO_SUB_SCENARIO:
            sub_scenario = L3_TO_SUB_SCENARIO[l3]

        records.append({
            "source": "food_safety_labeled",
            "message": msg,
            "intent": "food_safety",
            "sub_scenario": sub_scenario,
            "level_1": l1,
            "level_2": l2,
            "level_3": l3,
            "target_label": target,
            "original_split": split,
            "risk_level": _assess_risk(sub_scenario, l2, l3),
        })

    print(f"  提取有效消息: {len(records)}")
    return records


def load_non_food_safety_data():
    """加载非食安对照数据"""
    print("[2/4] 加载非食安对照数据...")
    content_col = "会话内容（不包含富文本标签）"
    df = pd.read_excel(NON_FS_XLSX, engine="openpyxl",
                       usecols=[content_col, "一级分类", "二级分类"],
                       nrows=200)

    records = []
    for _, row in df.iterrows():
        msg = extract_first_user_message(row.get(content_col))
        if not msg:
            continue

        l1 = str(row.get("一级分类", ""))
        l2 = str(row.get("二级分类", ""))

        # 非食安数据默认归为 general_knowledge
        records.append({
            "source": "non_food_safety",
            "message": msg,
            "intent": "general_knowledge",
            "sub_scenario": None,
            "level_1": l1,
            "level_2": l2,
            "level_3": "",
            "target_label": f"{l1}/{l2}",
            "original_split": "",
            "risk_level": "low",
        })

    print(f"  提取有效消息: {len(records)}")
    return records


def generate_synthetic_cases():
    """生成合成测试用例"""
    print("[3/4] 生成合成测试用例...")
    records = []
    for msg, intent, sub_scenario, risk in SYNTHETIC_CASES:
        records.append({
            "source": "synthetic",
            "message": msg,
            "intent": intent,
            "sub_scenario": sub_scenario,
            "level_1": "食安问题" if intent == "food_safety" else "非食安",
            "level_2": sub_scenario or "",
            "level_3": "",
            "target_label": f"{intent}/{sub_scenario or ''}",
            "original_split": "",
            "risk_level": risk,
        })
    print(f"  合成用例: {len(records)}")
    return records


def _assess_risk(sub_scenario, l2, l3):
    """根据子场景评估风险等级"""
    critical = {"body_discomfort", "spoilage"}
    high = {"foreign_object_external", "foreign_object_internal"}
    if sub_scenario in critical:
        return "critical"
    if sub_scenario in high:
        return "high"
    if l2 in ("原料变质",):
        return "high"
    if l3 in ("拉肚子", "呕吐"):
        return "critical"
    return "medium"


# ═══════════════════════════════════════════════════════════
#  数据集划分
# ═══════════════════════════════════════════════════════════

def split_datasets(fs_records, nfs_records, synth_records):
    """
    划分策略:
      - 食安真实数据: 尊重原有 train/val/test 划分
      - 非食安真实数据: 随机 60/20/20
      - 合成用例: 全部放入 eval_set (评测回归集)
    """
    print("[4/4] 数据集划分...")

    # 按原始 split 分组食安数据
    fs_by_split = defaultdict(list)
    for r in fs_records:
        sp = r["original_split"]
        if sp in ("train", "val", "test"):
            fs_by_split[sp].append(r)
        else:
            fs_by_split["train"].append(r)  # fallback

    # 非食安数据随机划分
    random.shuffle(nfs_records)
    n = len(nfs_records)
    nfs_train = nfs_records[:int(n * 0.6)]
    nfs_val = nfs_records[int(n * 0.6):int(n * 0.8)]
    nfs_test = nfs_records[int(n * 0.8):]

    # 组合各集合
    train_set = fs_by_split["train"] + nfs_train
    val_set = fs_by_split["val"] + nfs_val
    test_set = fs_by_split["test"] + nfs_test
    eval_set = synth_records

    # 打乱顺序 (避免同类型聚集)
    random.shuffle(train_set)
    random.shuffle(val_set)
    random.shuffle(test_set)

    # 添加序号和唯一ID
    for i, r in enumerate(train_set):
        r["id"] = f"train_{i+1:04d}"
        r["dataset"] = "train"
    for i, r in enumerate(val_set):
        r["id"] = f"val_{i+1:04d}"
        r["dataset"] = "val"
    for i, r in enumerate(test_set):
        r["id"] = f"test_{i+1:04d}"
        r["dataset"] = "test"
    for i, r in enumerate(eval_set):
        r["id"] = f"eval_{i+1:04d}"
        r["dataset"] = "eval"

    print(f"  训练集 (train): {len(train_set)} 条")
    print(f"  验证集 (val):   {len(val_set)} 条")
    print(f"  测试集 (test):  {len(test_set)} 条")
    print(f"  评测集 (eval):  {len(eval_set)} 条")

    return train_set, val_set, test_set, eval_set


# ═══════════════════════════════════════════════════════════
#  输出
# ═══════════════════════════════════════════════════════════

COLUMNS = [
    "id", "dataset", "source", "message",
    "intent", "sub_scenario", "risk_level",
    "level_1", "level_2", "level_3", "target_label",
]


def write_excel(train_set, val_set, test_set, eval_set):
    """输出 Excel (多 sheet)"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, "heytea_full_dataset.xlsx")

    def to_df(records):
        return pd.DataFrame([{k: r.get(k, "") for k in COLUMNS} for r in records])

    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        # 概览 sheet
        overview = pd.DataFrame({
            "数据集": ["train (训练集)", "val (验证集)", "test (测试集)", "eval (评测集)", "合计"],
            "条数": [len(train_set), len(val_set), len(test_set), len(eval_set),
                     len(train_set) + len(val_set) + len(test_set) + len(eval_set)],
            "用途": [
                "关键词模式学习 / 正则调优 / SFT 训练",
                "超参调优 / 模式验证 / 早期停止",
                "最终性能评估, 不参与任何调优",
                "自动化回归测试, 含预期结果标注",
                "—",
            ],
            "来源": [
                "食安标注(train) + 非食安(60%)",
                "食安标注(val) + 非食安(20%)",
                "食安标注(test) + 非食安(20%)",
                "合成测试用例 (覆盖全场景)",
                "—",
            ],
        })
        overview.to_excel(writer, sheet_name="概览", index=False)

        # 各数据集 sheet
        to_df(train_set).to_excel(writer, sheet_name="train_set", index=False)
        to_df(val_set).to_excel(writer, sheet_name="val_set", index=False)
        to_df(test_set).to_excel(writer, sheet_name="test_set", index=False)
        to_df(eval_set).to_excel(writer, sheet_name="eval_set", index=False)

        # 分类体系 sheet
        taxonomy_rows = []
        for intent_key, intent_val in INTENT_TAXONOMY.items():
            for sub_key, sub_label in intent_val["sub_scenarios"].items():
                taxonomy_rows.append({
                    "intent": intent_key,
                    "intent_label": intent_val["label"],
                    "sub_scenario": sub_key,
                    "sub_scenario_label": sub_label,
                    "priority": intent_val["priority"],
                })
        pd.DataFrame(taxonomy_rows).to_excel(writer, sheet_name="分类体系", index=False)

        # 统计 sheet
        stats_rows = []
        for name, data in [("train", train_set), ("val", val_set), ("test", test_set), ("eval", eval_set)]:
            intent_counts = Counter(r["intent"] for r in data)
            sub_counts = Counter(r["sub_scenario"] for r in data if r["sub_scenario"])
            risk_counts = Counter(r["risk_level"] for r in data)
            stats_rows.append({
                "dataset": name,
                "total": len(data),
                "food_safety": intent_counts.get("food_safety", 0),
                "ordering": intent_counts.get("ordering", 0),
                "general_knowledge": intent_counts.get("general_knowledge", 0),
                "critical_risk": risk_counts.get("critical", 0),
                "high_risk": risk_counts.get("high", 0),
                "medium_risk": risk_counts.get("medium", 0),
                "low_risk": risk_counts.get("low", 0),
            })
        pd.DataFrame(stats_rows).to_excel(writer, sheet_name="统计概览", index=False)

    print(f"\n  Excel 已保存: {path}")
    return path


def write_eval_suite(eval_set):
    """输出评测配置 JSON (自动化评测用)"""
    suite = {
        "version": "1.0",
        "generated_at": datetime.now().isoformat(),
        "description": "喜茶 AI 客服 Agent 自动化评测套件",
        "taxonomy": {
            intent_key: {
                "label": intent_val["label"],
                "sub_scenarios": list(intent_val["sub_scenarios"].keys()),
                "priority": intent_val["priority"],
            }
            for intent_key, intent_val in INTENT_TAXONOMY.items()
        },
        "metrics": [
            {"name": "intent_accuracy", "type": "classification", "description": "意图分类准确率"},
            {"name": "intent_precision", "type": "classification", "description": "意图分类精确率"},
            {"name": "intent_recall", "type": "classification", "description": "意图分类召回率"},
            {"name": "intent_f1", "type": "classification", "description": "意图分类 F1"},
            {"name": "sub_scenario_accuracy", "type": "classification", "description": "子场景分类准确率"},
            {"name": "response_quality", "type": "llm_judge", "description": "回复质量 (LLM-as-Judge)"},
            {"name": "response_relevance", "type": "llm_judge", "description": "回复相关性"},
            {"name": "response_safety", "type": "rule", "description": "回复安全检查"},
            {"name": "latency_p50", "type": "performance", "description": "P50 响应延迟"},
            {"name": "latency_p95", "type": "performance", "description": "P95 响应延迟"},
        ],
        "eval_dimensions": [
            "意图识别准确性 (intent classification)",
            "子场景分类精度 (sub-scenario classification)",
            "回复内容质量 (LLM 生成质量, 参考 RLHF 偏好对齐)",
            "回复相关性 (是否针对用户问题)",
            "安全性检查 (是否有有害/不当内容)",
            "响应延迟 (端到端 API 延迟)",
            "鲁棒性 (边界用例/对抗样本处理)",
        ],
        "test_cases": [
            {
                "id": r["id"],
                "message": r["message"],
                "expected_intent": r["intent"],
                "expected_sub_scenario": r["sub_scenario"],
                "expected_risk_level": r["risk_level"],
            }
            for r in eval_set
        ],
        "pass_criteria": {
            "intent_accuracy_min": 0.80,
            "sub_scenario_accuracy_min": 0.70,
            "response_quality_min": 0.70,
            "latency_p95_max_ms": 10000,
        },
    }

    path = os.path.join(OUTPUT_DIR, "heytea_eval_suite.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(suite, f, ensure_ascii=False, indent=2)
    print(f"  评测配置已保存: {path}")
    return path


# ═══════════════════════════════════════════════════════════
#  主流程
# ═══════════════════════════════════════════════════════════

def main():
    print("=" * 70)
    print("  喜茶 AI 客服 Agent — 完整标准化数据集生成")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    # 加载数据
    fs_records = load_food_safety_data()
    nfs_records = load_non_food_safety_data()
    synth_records = generate_synthetic_cases()

    # 划分
    train_set, val_set, test_set, eval_set = split_datasets(
        fs_records, nfs_records, synth_records)

    # 输出
    print("\n── 写入数据集文件 ──")
    xlsx_path = write_excel(train_set, val_set, test_set, eval_set)
    json_path = write_eval_suite(eval_set)

    # 统计摘要
    all_data = train_set + val_set + test_set + eval_set
    print(f"\n{'=' * 70}")
    print(f"  生成完成!")
    print(f"{'=' * 70}")
    print(f"  总条数: {len(all_data)}")
    print(f"  训练集: {len(train_set)} (食安 {sum(1 for r in train_set if r['intent']=='food_safety')})")
    print(f"  验证集: {len(val_set)} (食安 {sum(1 for r in val_set if r['intent']=='food_safety')})")
    print(f"  测试集: {len(test_set)} (食安 {sum(1 for r in test_set if r['intent']=='food_safety')})")
    print(f"  评测集: {len(eval_set)} (合成 {len(eval_set)})")
    print(f"\n  意图分布:")
    intent_counts = Counter(r["intent"] for r in all_data)
    for k, v in intent_counts.most_common():
        print(f"    {k}: {v} ({v/len(all_data)*100:.1f}%)")
    print(f"\n  子场景分布 (top 15):")
    sub_counts = Counter(r["sub_scenario"] for r in all_data if r["sub_scenario"])
    for k, v in sub_counts.most_common(15):
        print(f"    {k}: {v}")
    print(f"\n  文件:")
    print(f"    {xlsx_path}")
    print(f"    {json_path}")


if __name__ == "__main__":
    main()
