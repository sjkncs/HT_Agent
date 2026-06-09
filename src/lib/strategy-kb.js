/**
 * 策略知识库 — 从 38,644 条真实客服对话中深度提取
 * 覆盖 22 个客诉分类场景，70 个 Excel 文件
 * 提取日期: 2026-06-08
 */

export const STRATEGY_META = {
  totalFiles: 70,
  totalConversations: 38602,
  totalCategories: 22,
  extractionDate: '2026-06-08',
}

/* ─── 开场白模板 (Top 10 by frequency) ─── */
export const OPENING_SCRIPTS = [
  { template: '[主题]，浓厚甜润，[产品]为您服务，请问有什么可以为您效劳？', count: 48032, type: '标准开场白' },
  { template: '[主题]，喜悦发生，[产品]为您服务，请问有什么可以为您效劳？', count: 9542, type: '季节主题' },
  { template: '您好，当前正在排队，您可以先描述遇到的问题，如有订单问题（催促、产品售后等）着急可直接致电门店~', count: 7981, type: '排队提示' },
  { template: '[主题]，灵感满格。[产品]为您服务，请问有什么可以为您效劳？', count: 1628, type: '创意主题' },
  { template: '新春快乐，[产品]为您服务，请问有什么可以为您效劳？', count: 1310, type: '节日主题' },
  { template: '春茶龙井归来，[产品]为您服务，请问有什么可以为您效劳？', count: 947, type: '季节限定' },
  { template: '您好，在的，有什么可以帮助您的吗？', count: 350, type: '简洁人工' },
  { template: '喜悦发生，[产品]为您服务，请问有什么可以为您效劳？', count: 279, type: '品牌口号' },
  { template: '您好，阿喜在此恭候，[产品]为您服务，请问有什么可以为您效劳的~', count: 187, type: '阿喜人设' },
  { template: '您好，请问有什么可以帮助到您', count: 173, type: '极简人工' },
]

/* ─── 排队管理话术 ─── */
export const QUEUE_SCRIPTS = [
  '您好，当前正在排队，您可以先描述遇到的问题，如有订单问题（催促、产品售后等）着急可直接致电门店~ 订单详情页面可以直接点击联系门店的~',
  '不好意思，让您久等了。阿喜正火速赶来，请您再稍作等候。',
]

/* ─── 接入确认话术 (Top 6) ─── */
export const ACKNOWLEDGMENT_SCRIPTS = [
  '您好，阿喜是人工的，非常抱歉给您造成伤害的，对于您描述的情况阿喜非常重视',
  '阿喜是人工的，请问有什么可以帮到您',
  '您好，阿喜是人工的，请问是反馈的上海长宁来福士店 8410 这笔订单吗',
  '阿喜来啦，请问有什么可以帮到您的',
  '阿喜是人工的，辛苦您详细描述一下遇到的问题，阿喜会尽快核实，感谢您的理解和反馈',
  '您好，阿喜在的，请问有什么可以帮助您的吗？',
]

/* ─── 信息收集话术 (5 类) ─── */
export const INFO_COLLECTION_SCRIPTS = [
  {
    type: '请求订单号',
    examples: [
      '麻烦您复制一下美团订单号给到阿喜为您核实处理的',
      '这边还辛苦您给阿喜提供一下相关的订单编号的这边为您核实的',
      '还麻烦您提供订单号和饮品图片',
      '麻烦您提供下订单编号，方便阿喜为您跟进查询一下的~',
    ],
  },
  {
    type: '请求手机号',
    examples: [
      '理解您的心情的，麻烦您提供一下手机号和饮品异物的图片的',
      '实在是非常抱歉给到了您不好的体验的，辛苦您提供一下方便联系的手机号的',
      '麻烦您提供一下您的手机号码',
      '请问一下您的会员手机号方便联系到您吗',
    ],
  },
  {
    type: '请求图片',
    examples: [
      '实在是非常抱歉的，阿喜这边通过您提供的图片无法明确判断的，请问您方便提供问题图片的吗',
      '还麻烦您提供一下异物图片，茶茶为您反馈的',
      '还请您提供一下带有饮品标签的图片信息，茶茶这边便于同步记录反馈的',
    ],
  },
  {
    type: '请求门店信息',
    examples: [
      '这边为您反馈下单门店核实后联系到您处理的',
      '阿喜明白的，因为刚刚您这边反馈异物的时候，未提供具体订单，阿喜这边记录给到今天下单的门店核实',
      '请问您下单的是具体哪家门店呢',
    ],
  },
  {
    type: '请求饮品图片',
    examples: [
      '为了更好的解决您的问题，麻烦您提供一下饮品撒漏图片，阿喜马上为您登记处理',
      '还请您提供一下饮品图片的',
      '如您方便辛苦您提供一下饮品问题与饮品标签同框的图片，阿喜这边会为您如实记录反馈',
    ],
  },
]

/* ─── 安抚共情话术 (Top 8) ─── */
export const EMPATHY_SCRIPTS = [
  '非常理解您的心情，很抱歉没有给您满意的体验，向您致以我们真挚的歉意',
  '阿喜是非常重视您的体验也希望帮到您的，我非常理解您的心情，我们一定会竭尽全力为您解决的',
  '非常理解您的心情的，阿喜对于您口感体验一直是非常重视，为您升级申请一张25元券。希望下次给到您更好体验',
  '您反馈的问题我们非常重视，我们会马上将您的问题反馈给相关负责人，我们负责人会核实情况后在12小时内联系到您，与您协商解决',
  '非常理解您的心情，阿喜特殊为您申请一张25元无门槛优惠券，希望您可以继续支持我们，感谢您的支持与理解~',
  '请您不要着急，阿喜非常理解您的心情，我们一定会竭尽全力为您解决的，麻烦您这边保持电话畅通',
  '给您体验带来不便阿喜向您再次致歉，我们非常重视该问题的，我们反馈后，会有门店负责人认真查明核实，后续会给您致电沟通处理的',
  '非常理解您的心情，阿喜特殊为您升级申请一张30元代金券，希望您可以继续支持我们的',
]

/* ─── 解决方案话术 (按分类场景，6 大方案类型) ─── */
export const SOLUTION_SCRIPTS = {
  '异物-果核': {
    补偿方案: [
      '阿喜非常理解您的心情，根据您反馈的情况，阿喜为您特殊申请一张30元无门槛代金券（30天有效，24小时内发放到账），诚邀您再次体验的',
      '理解您的心情的，阿喜这边为您特殊申请成两张20元无门槛代金券（30天有效期）您看可以吗',
      '我们坚持使用鲜果和优质原料制作，还请您放心，您反馈的相关果核的情况阿喜也会如实记录反馈优化的，阿喜为您申请代金券您可以在方便的时候重新换购',
    ],
    退款方案: [
      '明白了，阿喜这边已将您的退款申请诉求反馈给门店，门店预计在24小时内处理',
      '好的，这边会为您反馈登记申请的，后续也请您留意退款信息',
      '理解您的心情的，如门店核实后没有问题会直接为您退款，具体也是需要后续门店的处理为准的',
    ],
    联系门店: [
      '阿喜通知门店负责人加强自查，不再另外打扰到您，您看可以吗',
      '非常理解您的心情，看到您提供的图片的确是我们做得不够好，阿喜马上通知门店给您重做，恳请您的谅解',
      '消消气的，确实很抱歉，阿喜也非常理解，我们一直坚持不满意重做的服务宗旨，阿喜可以为您反馈门店重做，也可以为您补券',
    ],
    重做方案: [
      '给您带来不便非常抱歉的，阿喜这边为您申请补送的订单是需要根据您的茶饮选项进行重新制作的',
      '或阿喜这边为您反馈门店跟进重新制作，您可以告诉阿喜您的选择或诉求',
    ],
  },
  '异物-苍蝇/蟑螂': {
    退款方案: [
      '真的非常抱歉没有给您满意体验，了解到门店是已为您该笔订单退款，请问您是对该方案不满意吗',
      '查询到您的订单是已经退款完成的，请问您这边是已经和门店沟通过该情况的吗',
    ],
    联系门店: [
      '很抱歉给您造成的不便，根据您反馈的情况确实是我们做得不够好，阿喜已经将您的问题反馈门店，还请您留意下反馈结果',
      '好的，这边马上为您反馈门店重新制作为您补送',
      '抱歉给您不好的体验，阿喜会如实记录反馈门店负责人自查制作过程，严格把控茶饮品质的',
    ],
    补偿方案: [
      '给您带来的不便再次向您致以阿喜真挚的歉意，您反馈的茶饮的问题我们非常重视，阿喜为您申请一张15元无门槛代金券，有效期30天，预计24小时内发放到账',
    ],
  },
  '异物-塑料': {
    退款方案: [
      '您的问题阿喜会反馈给专人核实处理的，同步阿喜这边将您的退款申请诉求反馈给门店，门店预计在24小时内处理',
      '理解您的心情的,对于您反馈的情况我们也是非常重视的,阿喜这边也会备注上您反馈投诉的情况和需要退款的诉求给到相关专员跟进',
    ],
    补偿方案: [
      '非常理解您的心情，看到您提供的图片的确是我们做得不够好，阿喜可以为您申请25元无门槛代金券（有效期30天）',
      '为了不耽误您的体验阿喜这边可以直接为您申请一张20元无门槛代金券，诚邀您下次下单体验',
    ],
    联系门店: [
      '好的，阿喜这边为您反馈门店负责人处理您的订单问题，还请您留意一下负责人来电的',
      '请您不要着急，我非常理解您的心情，我们一定会竭尽全力为您解决的，阿喜这边已经为您反馈门店负责人，进行溯源及排查',
    ],
  },
  '变质-一般': {
    退款方案: [
      '理解您的心情的，您的诉求阿喜这边也是会如实为您记录的，辛苦您后续留意退款到账或来电信息的',
      '我们对于这个情况非常非常重视，会由门店负责人亲自联系您沟通解决',
    ],
    补偿方案: [
      '时效问题也是我们一直在努力优化的。本次订单没有给到您满意体验的情况茶茶也是非常重视的，为您申请一张10元无门槛代金券',
      '如您不方便，茶茶也可以为您申请1张20元无门槛代金券，您看可以吗',
    ],
    联系门店: [
      '阿喜这边是全国茶饮售后客服，是不参与制作的，如您需要了解，请您提供一下联系方式，这边为您反馈门店负责人排查制作情况后与您联系',
      '您反馈的问题我们非常重视，阿喜马上反馈门店负责人排查并尽快联系您',
    ],
    重做方案: [
      '我们坚持使用新鲜的原料制作，每一颗水果在生长中受到阳光和水分的影响，所以甜度和大小都会有一定差异。如果您对于出品有任何不满意，请随时告知门店小伙伴，我们将免费为您重新制作',
    ],
  },
  '变质-发霉': {
    联系门店: [
      '阿喜明白的，如您不愿意接受补券，阿喜已经将您的诉求反馈门店，还请您留意下反馈结果',
      '好的，阿喜这边已经记录您的信息，会为您反馈门店负责人处理，预计12小时内会与您联系',
    ],
    退款方案: [
      '理解您的心情的，如您对于产品不满意可以申请退货退款的，抱歉给您添麻烦了',
      '阿喜这边也会为您催促负责人尽快给您处理，还请您后续留意负责人的退款或来电的',
    ],
    补偿方案: [
      '再次向您致歉，由于我们的失误，让您多等了，为弥补您的体验，我们已为您补偿1张优先券+10元代金券',
    ],
  },
  '呕吐': {
    补偿方案: [
      '阿喜这边为您升级申请一张20元的无门槛代金券，恳请得到您的谅解，您看方便吗',
      '我们对于这个情况非常非常重视，为您撤销代金券方案，为了给到您好的解决，会由门店负责人亲自联系您沟通解决',
      '如您不方便，阿喜也可以给您申请一张25元代金券，有效期30天，24小时到账',
    ],
    联系门店: [
      '您反馈的问题我们非常重视，阿喜马上反馈门店负责人排查并尽快联系您。如您有相关诊断结果的图片，您也是可以同步发一下给到阿喜的',
      '如果仍感到不舒服，阿喜建议您及时就医。同时您反馈的问题我们也是非常重视，阿喜马上反馈门店负责人排查并尽快联系您处理',
    ],
    创建工单: [
      '阿喜这边为您升级申请一张20元的无门槛代金券，恳请得到您的谅解',
      '如果后续没有联系您或者没有为您满意解决，都请您再次联系阿喜为您升级反馈跟进',
    ],
  },
  '过期': {
    联系门店: [
      '您反馈的问题我们非常重视，阿喜马上反馈门店负责人排查并尽快联系您。暂不为您申请代金券方案，辛苦您可以给阿喜发一下您方便联系的手机号的',
      '请问您的诉求是什么呢？阿喜为您反馈门店核实处理',
    ],
    补偿方案: [
      '没有给您满意体验非常抱歉，如果您不方便回到门店为您重做的话，阿喜为您申请一张20元无门槛代金券',
      '非常理解您的心情的，对于您反馈的情况是十分重视的，阿喜为您申请1张20元代金券，诚邀您重新下单体验',
    ],
    退款方案: [
      '非常理解您的心情，由于退款需要门店审核，阿喜无法直接操作。已为您记录您的诉求的',
    ],
  },
  '过敏': {
    创建工单: [
      '这边为您升级反馈给相关负责人排查核实后与您联系沟通处理的，还请您提供一下可以联系到您的联系电话给阿喜的',
      '理解您的心情的，阿喜对于您的情况十分重视，如您不需要门店负责人联系，阿喜这边为您升级上级负责人核实后与您联系沟通',
    ],
    补偿方案: [
      '阿喜为您申请一张25元无门槛代金券的请问您考虑一下吗',
      '如您不方便，阿喜也可以为您申请20元无门槛代金券（有效期30天），诚邀您再次体验',
    ],
    退款方案: [
      '阿喜这边为您反馈负责人您的退款诉求的，后续负责人也是会核实后一并为您处理的',
    ],
  },
  'OEM': {
    补偿方案: [
      '阿喜非常理解您的心情，根据您反馈的情况，阿喜为您特殊申请一张20元无门槛代金券',
      '如果您不方便等待补送，阿喜可以为您申请成1张10,1张20元无门槛代金券（30天有效期，24小时内发放到账）',
    ],
    退款方案: [
      '阿喜这边会将您的退款申请诉求反馈给门店，门店预计在24小时内处理',
    ],
    联系门店: [
      '阿喜这边也是有把情况反馈门店的，稍后门店也会联系您处理',
    ],
  },
  '杯盖': {
    退款方案: [
      '非常抱歉没能给到您满意的茶饮体验的，阿喜这边已将您的退款申请诉求反馈给门店，门店预计在24小时内处理',
    ],
    补偿方案: [
      '非常抱歉没有给您满意体验，阿喜根据您提供的图片，该情况可能是门店伙伴为您添加芝士时忙中出错，阿喜这边可以为您补偿一张10元无门槛代金券的',
    ],
  },
  '有效期': {
    联系门店: [
      '非常抱歉让您不愉快了，根据您的描述是门店伙伴做的不够好，我们一定会反馈门店伙伴加强员工培训并优化出品',
    ],
    补偿方案: [
      '对于您的体验问题我们一直都是非常重视的，为您申请一张20元无门槛代金券，真诚邀请您持续陪伴我们成长',
    ],
    重做方案: [
      '我们坚持使用鲜果和优质原料制作，每一颗水果在生长中受到阳光和水分的影响，所以甜度和大小都会有一定差异。如果您对于出品有任何不满意，请随时告知门店小伙伴，我们将免费为您重新制作',
    ],
  },
}

/* ─── 收尾话术 (Top 6) ─── */
export const CLOSING_SCRIPTS = [
  '感谢您的理解与支持~如还需要任何帮助，请您可以再次联系我们，也非常感谢您给我们的反馈，帮助我们持续改善和进步。',
  '感谢您的理解与支持的~',
  '请问还有其他问题可以帮到您的吗',
  '非常感谢您的理解和支持，不好意思给您添麻烦了',
  '阿喜也祝您生活愉快',
  '请问还有其他可以帮到您的吗？如果没有其他问题，茶茶就不打扰您了，麻烦您可以给茶茶五星好评~有任何问题也都可以再次联系我们~',
]

/* ─── 升级转接话术 (Top 6) ─── */
export const ESCALATION_SCRIPTS = [
  '您好，真的非常非常抱歉给您带来不愉快的消费体验了，请您消消气并告知阿喜具体的事情经过，我会如实记录您的投诉',
  '确实是我们做的不够好，阿喜会记录投诉到门店负责人，加强培训和管理。',
  '我们对于这个情况非常非常重视，为了给到您好的解决，会由门店负责人亲自致电您沟通解决。沟通后有任何问题您也可以再次联系我们帮您反馈',
  '非常理解您的心情的，这边如实记录您的投诉的，还请您提供一下方便联系的号码，后续门店负责人会与您沟通处理',
  '阿喜非常理解您的感受，您描述的情况确实是我们做的不足，阿喜这边也会如实记录您的反馈与投诉给到门店负责人，后续也会对门店伙伴加强培训',
  '您反馈的小伙伴未有及时回应的情况，会一并记录并投诉至负责人进行考核处罚，并会加强服务的培训，避免再次出现该问题。',
]

/* ─── 各分类策略分布统计 ─── */
export const CATEGORY_STRATEGY_STATS = {
  '补充样本': { conversations: 24500, strategies: 128488, avg_turns: 16.5, top: ['opening', 'empathy', 'info_collection', 'acknowledgment'] },
  '2025总样本': { conversations: 9123, strategies: 61333, avg_turns: 17.2, top: ['opening', 'empathy', 'acknowledgment', 'queue_management'] },
  '全量策略提取': { conversations: 1671, strategies: 6137, avg_turns: 11.2, top: ['opening', 'solution', 'info_collection', 'acknowledgment'] },
  '历史会话': { conversations: 1000, strategies: 4788, avg_turns: 16.1, top: ['opening', 'empathy', 'acknowledgment', 'info_collection'] },
  '异物-果核': { conversations: 694, strategies: 5102, avg_turns: 15.8, top: ['opening', 'info_collection', 'empathy', 'queue_management'] },
  '变质-一般': { conversations: 254, strategies: 1330, avg_turns: 19.4, top: ['opening', 'empathy', 'acknowledgment', 'info_collection'] },
  '异物-塑料': { conversations: 250, strategies: 1714, avg_turns: 15.5, top: ['info_collection', 'opening', 'empathy', 'acknowledgment'] },
  'OEM': { conversations: 213, strategies: 1011, avg_turns: 16.7, top: ['opening', 'info_collection', 'empathy', 'solution'] },
  '过期': { conversations: 133, strategies: 812, avg_turns: 23.5, top: ['opening', 'empathy', 'info_collection', 'acknowledgment'] },
  '呕吐': { conversations: 122, strategies: 626, avg_turns: 21.0, top: ['opening', 'empathy', 'acknowledgment', 'info_collection'] },
  '有效期': { conversations: 116, strategies: 755, avg_turns: 18.0, top: ['opening', 'info_collection', 'empathy', 'queue_management'] },
  '异物-苍蝇/蟑螂': { conversations: 100, strategies: 575, avg_turns: 15.7, top: ['opening', 'acknowledgment', 'empathy', 'info_collection'] },
  '变质-发霉': { conversations: 74, strategies: 427, avg_turns: 19.8, top: ['opening', 'acknowledgment', 'empathy', 'info_collection'] },
  '杯盖': { conversations: 69, strategies: 540, avg_turns: 17.7, top: ['info_collection', 'opening', 'empathy', 'acknowledgment'] },
  '过敏': { conversations: 60, strategies: 364, avg_turns: 23.8, top: ['opening', 'empathy', 'info_collection', 'acknowledgment'] },
  '异物-金属': { conversations: 39, strategies: 226, avg_turns: 15.2, top: ['opening', 'empathy', 'info_collection', 'acknowledgment'] },
  '异物-茶渣': { conversations: 33, strategies: 236, avg_turns: 24.5, top: ['opening', 'info_collection', 'acknowledgment', 'empathy'] },
  'OEM-变质': { conversations: 33, strategies: 199, avg_turns: 17.7, top: ['opening', 'empathy', 'acknowledgment', 'queue_management'] },
  '有效期-OEM': { conversations: 35, strategies: 132, avg_turns: 20.0, top: ['empathy', 'info_collection', 'solution', 'acknowledgment'] },
  '变质-变酸': { conversations: 19, strategies: 103, avg_turns: 19.0, top: ['opening', 'info_collection', 'empathy', 'acknowledgment'] },
  'OEM-补充': { conversations: 48, strategies: 335, avg_turns: 26.3, top: ['queue_management', 'opening', 'info_collection', 'solution'] },
  '变质-产品变质': { conversations: 16, strategies: 147, avg_turns: 27.0, top: ['opening', 'empathy', 'queue_management', 'acknowledgment'] },
}

/* ─── 典型策略链 (每个分类的应对流程) ─── */
export const STRATEGY_CHAINS = {
  '异物-果核': [
    { step: '开场', strategy: 'opening', label: '标准/季节主题开场白' },
    { step: '排队', strategy: 'queue_management', label: '排队提示（高峰期）' },
    { step: '接入', strategy: 'acknowledgment', label: '人工确认接入' },
    { step: '信息收集', strategy: 'info_collection', label: '请求订单号+手机号+异物图片' },
    { step: '安抚', strategy: 'empathy', label: '共情安抚+致歉' },
    { step: '方案', strategy: 'solution', label: '代金券补偿(20-30元) / 重做 / 退款' },
    { step: '收尾', strategy: 'closing', label: '感谢理解+后续跟进承诺' },
  ],
  '异物-苍蝇/蟑螂': [
    { step: '开场', strategy: 'opening', label: '标准开场白' },
    { step: '信息收集', strategy: 'info_collection', label: '请求订单号+饮品图片' },
    { step: '安抚', strategy: 'empathy', label: '高度重视+真挚歉意' },
    { step: '方案', strategy: 'solution', label: '反馈门店排查+代金券(15元)+重做' },
    { step: '升级', strategy: 'escalation', label: '门店负责人亲自核实' },
    { step: '收尾', strategy: 'closing', label: '24小时内联系承诺' },
  ],
  '异物-塑料': [
    { step: '开场', strategy: 'opening', label: '标准开场白' },
    { step: '信息收集', strategy: 'info_collection', label: '请求订单号+异物+标签同框图片' },
    { step: '安抚', strategy: 'empathy', label: '理解心情+溯源排查' },
    { step: '方案', strategy: 'solution', label: '退款诉求记录+代金券(20-25元)' },
    { step: '升级', strategy: 'escalation', label: '门店负责人溯源+专人联系' },
  ],
  '变质-一般': [
    { step: '开场', strategy: 'opening', label: '标准/季节开场白' },
    { step: '接入', strategy: 'acknowledgment', label: '人工确认' },
    { step: '信息收集', strategy: 'info_collection', label: '手机号+饮品标签图片' },
    { step: '安抚', strategy: 'empathy', label: '共情+承诺反馈负责人' },
    { step: '方案', strategy: 'solution', label: '退款记录+代金券(10-20元)+重做' },
    { step: '升级', strategy: 'escalation', label: '投诉记录+门店培训' },
    { step: '收尾', strategy: 'closing', label: '24小时内处理承诺' },
  ],
  '变质-发霉': [
    { step: '开场', strategy: 'opening', label: '标准开场白' },
    { step: '接入', strategy: 'acknowledgment', label: '确认接入' },
    { step: '信息收集', strategy: 'info_collection', label: '手机号+图片' },
    { step: '安抚', strategy: 'empathy', label: '高度重视+真挚歉意' },
    { step: '方案', strategy: 'solution', label: '门店核实+退款+代金券' },
    { step: '升级', strategy: 'escalation', label: '反馈门店负责人核查' },
  ],
  '呕吐': [
    { step: '开场', strategy: 'opening', label: '标准开场白' },
    { step: '安抚', strategy: 'empathy', label: '高度重视+建议就医' },
    { step: '信息收集', strategy: 'info_collection', label: '诊断结果图片+联系方式' },
    { step: '方案', strategy: 'solution', label: '代金券(20-25元)+反馈门店排查' },
    { step: '升级', strategy: 'escalation', label: '门店负责人亲自联系' },
  ],
  '过期': [
    { step: '开场', strategy: 'opening', label: '标准开场白' },
    { step: '安抚', strategy: 'empathy', label: '共情+致歉' },
    { step: '信息收集', strategy: 'info_collection', label: '手机号+产品图片+有效期' },
    { step: '方案', strategy: 'solution', label: '反馈门店+退款+代金券(20元)' },
    { step: '升级', strategy: 'escalation', label: '门店负责人排查' },
  ],
  '过敏': [
    { step: '开场', strategy: 'opening', label: '标准开场白' },
    { step: '安抚', strategy: 'empathy', label: '高度重视+关心身体状况' },
    { step: '信息收集', strategy: 'info_collection', label: '过敏原信息+订单号+诊断图片' },
    { step: '方案', strategy: 'solution', label: '代金券(20-25元)+退款+升级负责人' },
    { step: '升级', strategy: 'escalation', label: '升级上级负责人核实' },
  ],
  'OEM': [
    { step: '开场', strategy: 'opening', label: '标准开场白' },
    { step: '接入', strategy: 'acknowledgment', label: '人工确认' },
    { step: '信息收集', strategy: 'info_collection', label: '订单号+手机号+产品图片' },
    { step: '安抚', strategy: 'empathy', label: '理解心情+解释解冻机制' },
    { step: '方案', strategy: 'solution', label: '补送+代金券(10-20元)+退款' },
  ],
  '杯盖': [
    { step: '开场', strategy: 'opening', label: '标准开场白' },
    { step: '信息收集', strategy: 'info_collection', label: '订单号+杯盖图片' },
    { step: '安抚', strategy: 'empathy', label: '共情+解释制作工艺' },
    { step: '方案', strategy: 'solution', label: '退款记录+代金券(10-20元)' },
  ],
  '有效期': [
    { step: '开场', strategy: 'opening', label: '标准开场白' },
    { step: '信息收集', strategy: 'info_collection', label: '产品有效期图片+订单号' },
    { step: '安抚', strategy: 'empathy', label: '理解心情+解释原料差异' },
    { step: '方案', strategy: 'solution', label: '重做+代金券(20元)+退款记录' },
    { step: '升级', strategy: 'escalation', label: '门店培训优化' },
  ],
}

/* ─── 全局策略频次统计 ─── */
export const GLOBAL_STRATEGY_FREQ = {
  opening: 71434,
  empathy: 38887,
  acknowledgment: 31470,
  info_collection: 28923,
  queue_management: 23277,
  solution: 16115,
  escalation: 903,
  closing: 134,
}

/* ─── 策略类型颜色映射 ─── */
export const STRATEGY_COLORS = {
  opening: { bg: '#fff7ed', fg: '#c2410c', label: '开场白' },
  queue_management: { bg: '#fefce8', fg: '#a16207', label: '排队管理' },
  acknowledgment: { bg: '#f0fdf4', fg: '#15803d', label: '接入确认' },
  info_collection: { bg: '#eff6ff', fg: '#1d4ed8', label: '信息收集' },
  empathy: { bg: '#fdf2f8', fg: '#be185d', label: '安抚共情' },
  solution: { bg: '#f5f3ff', fg: '#6d28d9', label: '解决方案' },
  escalation: { bg: '#fef2f2', fg: '#dc2626', label: '升级转接' },
  closing: { bg: '#ecfdf5', fg: '#047857', label: '收尾话术' },
}
