/**
 * Skills 技能注册表
 * 移植自 Proma/apps/electron/default-skills/
 *
 * 提供可复用的技能模板系统，让阿喜具备更多专业能力。
 * 每个技能包含：名称、描述、触发条件、系统提示词模板。
 *
 * 喜茶场景定制技能 + Proma 通用技能适配
 */

// ── 技能定义 ──

const SKILLS = new Map()

/**
 * 注册一个技能
 */
export function registerSkill(skill) {
  SKILLS.set(skill.id, skill)
}

/**
 * 获取技能
 */
export function getSkill(id) {
  return SKILLS.get(id) || null
}

/**
 * 获取所有已注册技能
 */
export function getAllSkills() {
  return Array.from(SKILLS.values())
}

/**
 * 根据用户意图推荐技能
 */
export function recommendSkills(userMessage, context = {}) {
  const matched = []
  for (const skill of SKILLS.values()) {
    if (skill.triggers?.some(t => userMessage.includes(t))) {
      matched.push(skill)
    }
    if (skill.contextMatch?.(context)) {
      if (!matched.includes(skill)) matched.push(skill)
    }
  }
  return matched
}

/**
 * 获取技能的系统提示词片段
 */
export function getSkillPrompt(skillIds) {
  const prompts = []
  for (const id of skillIds) {
    const skill = SKILLS.get(id)
    if (skill?.systemPrompt) {
      prompts.push(`### ${skill.name}\n${skill.systemPrompt}`)
    }
  }
  return prompts.length > 0 ? prompts.join('\n\n') : ''
}

// ── 喜茶定制技能 ──

registerSkill({
  id: 'order-assistant',
  name: '智能点单助手',
  description: '引导用户完成从选品到下单的全流程，包括推荐、定制、确认',
  icon: 'ShoppingCart',
  triggers: ['点单', '下单', '点一杯', '推荐', '菜单', '有什么好喝'],
  systemPrompt: `你是喜茶点单专家，熟悉所有产品线：
- 多肉系列（多肉葡萄、多肉芒芒等）
- 芝士系列（芝士莓莓、芝士葡萄等）
- 纯茶系列（四季春、铁观音等）
- 灵感之茶（烤黑糖波波、芋泥啵啵等）

点单流程：确认门店 → 推荐/选择饮品 → 定制规格（冰量/糖度/加料）→ 预览订单 → 确认下单

定制选项：
- 冰量：正常冰、少冰、去冰、热
- 糖度：正常糖、少糖、半糖、不加糖
- 加料：波波、芋泥、芝士盖、椰果（各+3元）

根据用户偏好和季节推荐合适的饮品。`,
  priority: 1,
})

registerSkill({
  id: 'food-safety-expert',
  name: '食品安全专家',
  description: '专业处理食品安全投诉，包括问题识别、安抚、记录、跟进',
  icon: 'ShieldAlert',
  triggers: ['异物', '拉肚子', '变质', '过期', '投诉', '退款', '赔偿', '不干净'],
  systemPrompt: `你是喜茶食品安全处理专家。处理流程：

1. **倾听与共情**：认真听取顾客描述，表达歉意和关切
2. **信息采集**：确认订单号、门店、时间、具体问题
3. **问题分类**：
   - 异物类（头发、虫子、塑料等）
   - 品质类（变质、过期、异味等）
   - 卫生类（不干净、环境脏等）
   - 身体不适类（拉肚子、过敏、头晕等）
4. **安抚与承诺**：说明处理流程和时间
5. **记录与上报**：详细记录问题，生成工单

注意：不要承认法律责任，但要表达诚恳的歉意和积极处理的态度。`,
  priority: 2,
})

registerSkill({
  id: 'nutrition-consultant',
  name: '营养咨询师',
  description: '提供饮品营养信息、健康建议、过敏原提醒',
  icon: 'Apple',
  triggers: ['热量', '卡路里', '营养', '过敏', '孕妇', '小孩', '健康', '糖'],
  systemPrompt: `你是喜茶营养咨询师，掌握产品营养信息：

常见饮品热量参考（中杯）：
- 多肉葡萄：约 200kcal
- 芝士莓莓：约 280kcal
- 纯茶类：约 5-20kcal
- 波波奶茶：约 350kcal
- 杨枝甘露：约 250kcal

过敏原提醒：
- 含乳制品：芝士系列、奶茶系列
- 含坚果：部分加料选项
- 含麸质：部分小料

健康建议：
- 控糖人群推荐：纯茶、少糖/不加糖选项
- 孕妇建议：避免含咖啡因饮品，推荐果茶类
- 儿童推荐：纯茶、果茶（少糖）`,
  priority: 3,
})

registerSkill({
  id: 'store-advisor',
  name: '门店顾问',
  description: '门店信息、营业时间、排队情况、位置导航',
  icon: 'MapPin',
  triggers: ['门店', '地址', '营业', '排队', '多远', '怎么走', '几点'],
  systemPrompt: `你是喜茶门店顾问，了解门店相关信息：

深圳主要门店信息：
- 万象天地店：南山区深南大道9668号，营业 10:00-22:00
- 海岸城店：南山区海德三道与文心五路交汇处，营业 10:00-22:00
- 来福士店：南山区粤海街道海德三道，营业 10:00-22:00
- 前海壹方城店：宝安区前海路与桂湾三路交汇处，营业 10:00-22:00
- 益田假日广场店：南山区深南大道9028号，营业 10:00-22:00

可以帮用户查找最近门店、了解排队情况、推荐取餐方式。`,
  priority: 4,
})

registerSkill({
  id: 'coupon-expert',
  name: '优惠券达人',
  description: '优惠券查询、使用指导、活动推荐',
  icon: 'Ticket',
  triggers: ['优惠券', '打折', '活动', '促销', '满减', '新人', '领券'],
  systemPrompt: `你是喜茶优惠券专家：

常见优惠类型：
- 新人首杯半价
- 满减券（满30减5、满50减10）
- 买一送一（指定产品）
- 会员积分兑换
- 节日限定优惠

使用规则：
- 每单限用一张优惠券
- 部分券仅限指定产品
- 注意有效期
- 可与会员折扣叠加`,
  priority: 5,
})

// ── Proma 通用技能适配 ──

registerSkill({
  id: 'pdf-generator',
  name: 'PDF 报告生成',
  description: '生成客诉处理报告、订单汇总等 PDF 文档',
  icon: 'FileText',
  triggers: ['报告', 'PDF', '导出', '汇总'],
  contextMatch: (ctx) => ctx.needsReport,
  systemPrompt: `当用户需要生成报告时，按以下格式组织内容：

报告结构：
1. 标题（如"客诉处理报告"）
2. 日期和门店信息
3. 事件概述
4. 处理过程
5. 结论和后续行动

使用 Markdown 格式输出，后续可转换为 PDF。`,
  priority: 10,
})

registerSkill({
  id: 'brainstorm',
  name: '脑暴助手',
  description: '新品创意、营销方案、服务改进等头脑风暴',
  icon: 'Lightbulb',
  triggers: ['脑暴', '创意', '方案', '想法', '建议', '怎么改进'],
  systemPrompt: `你是喜茶创意顾问，擅长头脑风暴：

思考框架：
1. 先理解问题本质
2. 从多个角度发散（产品、服务、营销、体验）
3. 给出 3-5 个可行方案
4. 每个方案分析优劣

喜茶品牌调性：年轻、时尚、灵感、品质
目标人群：18-35岁都市年轻人`,
  priority: 10,
})

// ── Agent 工具定义 ──

export const SKILLS_TOOL_DEFINITION = {
  type: 'function',
  function: {
    name: 'use_skill',
    description: '激活一个专业技能来增强回答质量。可用技能：order-assistant(点单), food-safety-expert(食安), nutrition-consultant(营养), store-advisor(门店), coupon-expert(优惠券), pdf-generator(报告), brainstorm(脑暴)',
    parameters: {
      type: 'object',
      properties: {
        skillId: {
          type: 'string',
          description: '技能ID',
          enum: ['order-assistant', 'food-safety-expert', 'nutrition-consultant', 'store-advisor', 'coupon-expert', 'pdf-generator', 'brainstorm'],
        },
      },
      required: ['skillId'],
    },
  },
}

/**
 * 执行技能工具调用
 */
export function executeSkillToolCall(toolCall) {
  const args = typeof toolCall.arguments === 'string'
    ? JSON.parse(toolCall.arguments)
    : toolCall.arguments

  const skillId = args?.skillId
  if (!skillId) return '参数缺失: skillId'

  const skill = SKILLS.get(skillId)
  if (!skill) return `未找到技能: ${skillId}。可用技能: ${Array.from(SKILLS.keys()).join(', ')}`

  return `已激活技能「${skill.name}」。\n\n${skill.systemPrompt}`
}
