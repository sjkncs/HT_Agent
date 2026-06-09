/**
 * 喜茶品牌配置 — 集中管理品牌标识、开场白模板、季节主题
 * 数据源: strategy-kb.js OPENING_SCRIPTS (从 38,644 条真实客服对话提取)
 */

import { OPENING_SCRIPTS } from './strategy-kb.js'
import { HOT_DRINK_NAMES } from './mock-data.js'

/* ─── 品牌标识 ─── */
export const BRAND = {
  name: '喜茶',
  nameEn: 'HEYTEA',
  systemName: '喜茶食品安全智能系统',
  agentName: '阿喜',
  tagline: 'AIQC_V2 多模型质检 · 感知-决策-执行全链路闭环 · 实时风险识别与守护',
  disclaimer: '阿喜智能助手生成的所有内容仅供参考，不代表喜茶官方立场与观点。涉及食品安全、退款补偿等重要事项，请以门店负责人或官方客服的最终处理结果为准。如有紧急问题，请直接致电门店或联系人工客服。',
}

/* ─── 季节主题 (根据当前月份自动匹配) ─── */
const SEASON_THEMES = {
  spring: { months: [3, 4, 5], label: '春茶季' },
  summer: { months: [6, 7, 8], label: '夏日冰饮季' },
  autumn: { months: [9, 10, 11], label: '秋韵暖饮季' },
  winter: { months: [12, 1, 2], label: '冬日暖心季' },
}

export function getCurrentSeason() {
  const month = new Date().getMonth() + 1
  return Object.values(SEASON_THEMES).find(s => s.months.includes(month)) || SEASON_THEMES.summer
}

/* ─── 当季推荐产品 (取频次最高的 Top 1) ─── */
export function getFeaturedProduct() {
  return HOT_DRINK_NAMES[0]?.name || '喜茶饮品'
}

/* ─── 品牌开场白生成器 ─── */
/**
 * 使用 OPENING_SCRIPTS 中频次最高的标准开场白模板
 * 模板: '[主题]，浓厚甜润，[产品]为您服务，请问有什么可以为您效劳？' (count: 48032)
 * 自动替换 [主题] 为当季主题词, [产品] 为当季推荐产品
 */
export function generateBrandGreeting() {
  const season = getCurrentSeason()
  const product = getFeaturedProduct()
  const topScript = OPENING_SCRIPTS[0] // 标准开场白 (count: 48032)
  return topScript.template
    .replace('[主题]', season.label)
    .replace('[产品]', product)
}

/* ─── 排队提示话术 (OPENING_SCRIPTS[2]) ─── */
export function getQueueGreeting() {
  const queueScript = OPENING_SCRIPTS.find(s => s.type === '排队提示')
  return queueScript?.template || '您好，当前正在排队，您可以先描述遇到的问题。'
}

/* ─── 品牌收尾话术 ─── */
export function getClosingScript() {
  return '感谢您的理解与支持，如还需要任何帮助，请您可以再次联系我们，也非常感谢您给我们的反馈，帮助我们持续改善和进步。'
}

/* ─── 品牌模型显示映射 (NVIDIA 模型 → 喜茶品牌名) ─── */
export const BRAND_MODEL_MAP = {
  'meta/llama-3.3-70b-instruct': 'HEYTEA-V1-Pro',
  'nvidia/llama-3.1-nemotron-70b-instruct': 'HEYTEA-V1-Thinking-High',
  'meta/llama-3.1-8b-instruct': 'HEYTEA-V1-Flash',
  'meta/llama-3.1-70b-instruct': 'HEYTEA-V1-Standard',
  'nvidia/llama-3.1-nemotron-nano-8b-v1': 'HEYTEA-V1-Lite',
  'nvidia/llama-nemotron-embed-512': 'HEYTEA-Embed',
  'nvidia/llama-3.2-nv-embedqa-1b-v2': 'HEYTEA-Embed-Lite',
  'nvidia/llama-3.2-nv-rerankqa-1b-v2': 'HEYTEA-Rerank',
  'nvidia/nemotron-mini-4b-instruct': 'HEYTEA-V1-Finetune',
}
