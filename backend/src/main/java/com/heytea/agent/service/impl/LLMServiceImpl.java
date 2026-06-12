package com.heytea.agent.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heytea.agent.dto.ChatResponse;
import com.heytea.agent.entity.Message;
import com.heytea.agent.service.LLMService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

@Slf4j
@Service
public class LLMServiceImpl implements LLMService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${llm.api-key}")
    private String apiKey;

    @Value("${llm.model}")
    private String model;

    @Value("${llm.base-url}")
    private String baseUrl;

    @Value("${llm.max-tokens}")
    private int maxTokens;

    @Value("${llm.temperature}")
    private double temperature;

    private static final Duration TIMEOUT = Duration.ofSeconds(60);

    // ── Reply templates loaded from JSON ──
    private Map<String, Object> replyTemplates;

    // ── Precompiled regex patterns for keyword matching ──
    private static final Pattern[] FOOD_SAFETY_PATTERNS;
    private static final Pattern[] SERVICE_COMPLAINT_PATTERNS;
    private static final Pattern[] DELIVERY_ISSUE_PATTERNS;
    private static final Pattern[] PRODUCT_QUALITY_PATTERNS;
    private static final Pattern[] EFFICIENCY_PATTERNS;
    private static final Pattern[] PACKAGING_PATTERNS;
    private static final Pattern[] HYGIENE_PATTERNS;

    static {
        // ── Food Safety: 来自 关键词.xlsx + v5评测错误分析增强 ──
        FOOD_SAFETY_PATTERNS = compilePatterns(
                // 外源性异物 (regex from 关键词.xlsx + 用户常见表述)
                "(异物|头发|毛发|根毛|有毛|塑料|金属|玻璃|虫|苍蝇|蟑螂|纸片|线头|棉絮|小虫|飞虫|圆片|片片|胶体|黑色.*物)",
                "(喝出|吃出|吸出).{0,6}(虫|发|毛|塑料|金属|玻璃|纸|线|棉|东西|异物)",
                "(不明物|黑色|黑的|颗粒物|沉淀物|不明物体)",
                "(封口标签|封口贴|标签|贴纸).{0,5}(掉|落|进|在)",
                "(有个.{0,2}东西|有个.{0,2}啥|有个.{0,2}什么|里面有.{0,2}东西|里有这个|有这个|里有.{0,2}个)",
                "(双眼皮贴|创可贴|指甲|耳环|戒指|胶带|绳子|橡皮)",
                // 内源性异物
                "(果核|籽|茶渣|果皮|果肉|柠檬皮|柠檬籽|芒果核|芒果皮|葡萄皮|百香果籽|橙皮)",
                "(有核|有籽|有.{0,3}皮|去皮|太.{0,3}皮|皮.*太.{0,3}多|核.*大|籽.*多)",
                "(纤维|果肉.{0,2}块|水果纤维|茶叶.{0,2}渣|有茶叶|茶叶.*多|茶渣)",
                "(渣子|渣渣|全是渣|都是渣|有渣)",
                // 身体不适 (大幅扩展)
                "(拉肚子|腹泻|拉稀|呕吐|过敏|恶心|头晕|发烧|不舒服|肚子疼|肚子痛)",
                "(上吐下泻|拉肚|吃完不舒服|喝了以后|喝完.*不舒服|食物中毒)",
                "(皮疹|红疹|瘙痒|胃痛|胃疼|肠胃|食物中毒|疯狂拉|一直拉|不停拉)",
                "(拉.*肚子|肚子.*拉|肚子.*不舒服|肚子.*疼|肚子.*痛)",
                "(身体.*不适|全身.*痒|起疹|嘴.*肿|嘴.*麻|喉咙.*不舒服)",
                // 变质/异味 (扩展酸味/变味/苦味/味淡描述)
                "(变质|发霉|过期|馊|酸了|酸酸的|异味|怪味|味道不对|一股味道|味道.{0,3}奇怪)",
                "(有一.{0,2}股|有股|变酸|变味|发酸|发臭|腐烂|腐坏|地沟油|品质问题|消毒水味|化学味)",
                "(发苦|是苦的|苦味|涩味|发涩|味道淡|没味道|变淡|味道变了|味道.{0,2}不对)",
                "(保质期|临期|有效期|生产日期|过了.*期)",
                "(是酸的|闻着.*酸|闻着.{0,5}酸|不太新鲜|不新鲜|像是坏|好像.*坏|好像.*变质)",
                "(牛奶.*不新鲜|奶.*酸|奶.*过期)",
                // 投诉/维权
                "(退款|赔偿|补偿|投诉|曝光|差评|给我一个说法|举报|工商|消协|12315)",
                "(食品问题|食品安全问题|怎么处理|怎么解决|给个说法|给个交代)",
                // 包装/卫生
                "(包装破|漏杯|封口不严|食安|食品安全|卫生问题|不干净|不卫生)",
                "(杯盖.{0,3}(掉进|掉到|掉入)|吸管.{0,5}(脏|黑|变色|异物))",
                "(杯底.*有个|杯盖.*掉|杯子里.*有|杯底.*东西)",
                // 模糊但有食安语境的表述
                "(这是啥|这个是什么|这是什么呀|啥东西|什么情况|啥情况)",
                "(正常吗|正常的吗|这个正常|是不是正常|这样正常)",
                "(吸出来|吸.*出来|喝到最后|喝到后面|喝出)",
                "(给错|做错|弄错|出.*错).{0,6}(茶|饮|杯)",
                "(反馈问题|反馈.{0,3}(食安|安全|卫生|质量))",
                "(潮潮|黏黏|粘稠|结块|发粘)",
                // 英文
                "(foreign object|refund|sick|allergic|contaminated|hair|mold|expired|dirty)"
        );

        // ── Service Complaints: from 关键词.xlsx 服务问题 ──
        SERVICE_COMPLAINT_PATTERNS = compilePatterns(
                "(服务态度|态度.{0,2}(差|不好|很差|恶劣|差劲)|爱理不理|冷漠|不耐烦|甩脸|凶|骂人)",
                "(翻白眼|不理人|忽视|敷衍|推卸|踢皮球|不负责)",
                "(没礼貌|不热情|恶语|甩话|黑脸|不搭理)",
                "(餐具|保温袋|没给|漏给|忘记给)",
                "(会员|积分|优惠券|兑换|核销|用不了|过期)",
                "(封口.{0,3}(松|开|不严|漏)|杯盖.{0,3}(松|紧|难|打不开))"
        );

        // ── Delivery Issues: from 关键词.xlsx 外卖问题 ──
        DELIVERY_ISSUE_PATTERNS = compilePatterns(
                "(外卖.{0,4}(撒|漏|洒|翻)|配送.{0,4}(撒|漏|洒))",
                "(配送.{0,3}(慢|迟|超时|晚)|外卖.{0,3}(慢|迟|超时|晚)|骑手.{0,3}(慢|迟))",
                "(没送到|没收到|送错|漏送|少送|错送|餐品不对)",
                "(提前.{0,3}(送达|点送达|签收)|未送达|放门口|没放)",
                "(配送费|包装费|骑手态度|骑手卫生|不送上门)"
        );

        // ── Product Quality: from 关键词.xlsx 制作品质 + 产品问题 ──
        PRODUCT_QUALITY_PATTERNS = compilePatterns(
                "(不好喝|难喝|味道淡|没味道|水一样|太甜|太苦|太酸|太涩)",
                "(口感|口味).{0,5}(差|不好|一般|不行|怪)",
                "(冰.{0,2}(太多|太少|没|化完|没了)|冰量|去冰|少冰)",
                "(甜度|糖度|太甜|不够甜|代糖|零卡糖)",
                "(果肉.{0,2}少|小料.{0,2}少|料.{0,2}少|份量.{0,2}少|不满杯|半杯)",
                "(做错了|出品错误|做错|不是.*点|加错|漏做|没做)",
                "(不新鲜|水果.{0,2}(坏|烂|不新鲜)|变质|发黄|发黑)",
                "(波波|珍珠|啵啵).{0,5}(硬|变|不对|没有|少)",
                "(融化|化了|分层|沉底|混在一起|芝士.{0,2}化|冰淇淋.{0,2}化|奶油.{0,2}化)",
                "(温度|太烫|太热|不够热|凉了|冷的|常温.*冷|温.*烫)"
        );

        // ── Efficiency: from 关键词.xlsx 制作效率 ──
        EFFICIENCY_PATTERNS = compilePatterns(
                "(等了.{0,5}(久|长|半天|小时|分钟)|排队.{0,5}(久|长))",
                "(叫号.{0,3}(没|不|还|才)|没叫号|叫了.*没做好|做好了.*没叫)",
                "(超.{0,3}(预估|时间|时)|制作.{0,3}(慢|久|效率))",
                "(等了很久|等半天|等了好久|效率低|出杯慢)"
        );

        // ── Packaging: from 关键词.xlsx 包装问题 ──
        PACKAGING_PATTERNS = compilePatterns(
                "(杯底|杯身|杯盖).{0,5}(裂|破|坏|漏|变形|歪)",
                "(吸管.{0,5}(断|裂|坏|脏|弯|折))",
                "(包装袋|纸袋|袋子).{0,5}(破|烂|坏|脏|没有))",
                "(玻璃瓶|保温袋|冰袋).{0,5}(破|坏|没|漏)"
        );

        // ── Hygiene: from 关键词.xlsx 卫生问题 ──
        HYGIENE_PATTERNS = compilePatterns(
                "(卫生.{0,3}(差|不好|问题)|不卫生|脏乱|脏脏)",
                "(飞虫.{0,3}(多|飞)|苍蝇.{0,3}(多|飞)|蚊虫|蚂蚁)",
                "(员工.{0,3}(没.{0,2}(戴口罩|戴手套|洗手)|卫生)|操作台.{0,3}脏)",
                "(地面.{0,3}脏|桌子.{0,3}脏|椅子.{0,3}脏|垃圾桶.{0,3}满)"
        );
    }

    private static Pattern[] compilePatterns(String... regexes) {
        List<Pattern> patterns = new ArrayList<>();
        for (String regex : regexes) {
            try {
                patterns.add(Pattern.compile(regex));
            } catch (PatternSyntaxException e) {
                log.warn("Invalid regex pattern: {}", regex);
            }
        }
        return patterns.toArray(new Pattern[0]);
    }

    private static boolean matchAny(String text, Pattern[] patterns) {
        for (Pattern p : patterns) {
            if (p.matcher(text).find()) return true;
        }
        return false;
    }

    private static String findMatch(String text, Pattern[] patterns) {
        for (Pattern p : patterns) {
            var m = p.matcher(text);
            if (m.find()) return m.group();
        }
        return null;
    }

    // ── Ordering keywords (unchanged, no product names to avoid food safety false positives) ──
    private static final Pattern[] ORDERING_PATTERNS;
    static {
        ORDERING_PATTERNS = compilePatterns(
                "(点单|下单|点一杯|来一杯|买一杯|要一杯|我想点|想喝)",
                "(推荐饮品|推荐喝|菜单|看看菜单|有什么喝的|有什么推荐)",
                "(甜度|冰量|少冰|去冰|几分糖|加料|规格)",
                "(确认订单|订单确认|配送地址|送到|自提|外卖地址)",
                "(多少钱|价格|size|menu|order)"
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  SUB-SCENARIO DETECTION — 二级场景识别（在确定大类后调用）
    // ══════════════════════════════════════════════════════════════

    private String detectFoodSafetySubScenario(String msg) {
        // 身体不适 → highest priority
        if (matchAny(msg, compilePatterns(
                "(拉肚子|腹泻|拉稀|呕吐|过敏|头晕|发烧|肚子疼|肚子痛|上吐下泻|身体不适|不舒服|食物中毒|皮疹|胃)",
                "(拉.*肚子|肚子.*拉|肚子.*不舒服|肚子.*疼|肚子.*痛|身体.*不适|起疹|嘴.*肿|疯狂拉|一直拉|不停拉)")
        )) {
            return "body_discomfort";
        }
        // 变质/过期 → critical
        if (matchAny(msg, compilePatterns(
                "(变质|发霉|过期|馊|变酸|发臭|腐|保质期|临期|有效期|不.{0,2}新鲜)"))) {
            return "spoilage";
        }
        // 外源性异物 → high
        if (matchAny(msg, compilePatterns(
                "(异物|头发|毛发|根毛|有毛|塑料|金属|玻璃|虫|苍蝇|蟑螂|纸片|线头|棉絮|不明物|黑的|封口标签|封口贴|双眼皮贴|创可贴|指甲|胶体|黑色.*物)",
                "(有个.{0,2}东西|有个.{0,2}啥|有个.{0,2}什么|里面有.{0,2}东西|里有这个|有这个|里有.{0,2}个)",
                "(喝出来|吸出来|吸.*出来|吃出.*色|里边.*个|圆片|片片|杯底.*盖|杯底.*东西)")
        )) {
            return "foreign_object_external";
        }
        // 内源性异物 → medium
        if (matchAny(msg, compilePatterns(
                "(果核|籽|茶渣|果皮|果肉|柠檬皮|柠檬籽|芒果核|芒果皮|葡萄皮|百香果籽|橙皮|纤维|有.{0,3}皮|去皮|太.{0,3}皮|皮.*太.{0,3}多|有茶叶|茶渣|有渣|全是渣|都是渣|有渣|有核|有籽)"))) {
            return "foreign_object_internal";
        }
        // 异味/口感异常 → medium
        if (matchAny(msg, compilePatterns(
                "(异味|怪味|味道不对|味道也不对|一股味道|有股|酸酸的|酸了|恶心|发苦|是苦的|苦味|涩味|发涩|消毒水味|味道不佳|味淡|味道淡|没味道|变淡|味道变了|板蓝根味|味道.{0,3}奇怪|味道.{0,2}不对)"))) {
            return "taste_issue";
        }
        return "general_food_safety";
    }

    private String detectGeneralSubScenario(String msg) {
        if (matchAny(msg, SERVICE_COMPLAINT_PATTERNS)) return "service_complaint";
        if (matchAny(msg, DELIVERY_ISSUE_PATTERNS)) return "delivery_issue";
        if (matchAny(msg, PRODUCT_QUALITY_PATTERNS)) return "product_quality";
        if (matchAny(msg, EFFICIENCY_PATTERNS)) return "efficiency";
        if (matchAny(msg, PACKAGING_PATTERNS)) return "packaging";
        if (matchAny(msg, HYGIENE_PATTERNS)) return "hygiene";
        return null;
    }

    private String detectOrderingSubScenario(String msg) {
        if (matchAny(msg, compilePatterns("(推荐|有什么|什么好喝|热门|新品)"))) return "recommendation";
        if (matchAny(msg, compilePatterns("(确认|下单|购买|来一|要一)"))) return "place_order";
        if (matchAny(msg, compilePatterns("(地址|门店|在哪|几点|营业)"))) return "store_info";
        return "browse_menu";
    }

    // ══════════════════════════════════════════════════════════════
    //  DYNAMIC SYSTEM PROMPT ASSEMBLY — 基于场景动态组装提示词
    // ══════════════════════════════════════════════════════════════

    private String buildSystemPrompt(String intent, String subScenario, String userMessage) {
        StringBuilder sb = new StringBuilder();

        // ── 1. Base identity ──
        sb.append("你是喜茶智能客服助手「阿喜」。\n\n");

        // ── 2. Intent-specific core prompt ──
        switch (intent) {
            case "food_safety" -> buildFoodSafetyPrompt(sb, subScenario, userMessage);
            case "ordering" -> buildOrderingPrompt(sb, subScenario);
            default -> buildGeneralPrompt(sb, subScenario, userMessage);
        }

        // ── 3. Universal quality rules (from AI评测教训) ──
        sb.append("\n【回复质量要求 — 必须遵守】\n");
        sb.append("1. 回复必须针对用户提到的具体问题，提及具体产品名称和问题细节\n");
        sb.append("2. 禁止使用通用模板（如\"非常抱歉给您带来不愉快的消费体验\"），必须有针对性内容\n");
        sb.append("3. 回复字数不少于30字，建议80-150字\n");
        sb.append("4. 称呼只用\"您好\"，禁止使用\"亲\"/\"亲爱的\"/\"宝\"\n");
        sb.append("5. 禁止反问句、禁止使用感叹号、禁止负面词汇\n");
        sb.append("6. 正面评价→感谢，负面投诉→致歉+解决方案\n");
        sb.append("7. 回复必须是纯文本，不包含JSON/XML/元数据/内部信息\n");

        return sb.toString();
    }

    private void buildFoodSafetyPrompt(StringBuilder sb, String subScenario, String userMessage) {
        sb.append("食品安全是喜茶的生命线，你必须以最高优先级处理每一个食安问题。\n\n");

        sb.append("【核心处理流程 — 4步法】\n");
        sb.append("第1步 — 立即共情致歉（第一句话必须表达关切）\n");
        sb.append("第2步 — 收集关键信息：问题类型、购买渠道、购买时间和门店、问题描述、是否身体不适\n");
        sb.append("第3步 — 明确承诺：24小时内专人跟进，72小时初步调查结果，提供工单号\n");
        sb.append("第4步 — 补偿引导：退款/就医报销/补偿券\n\n");

        // Sub-scenario specific guidance
        switch (subScenario) {
            case "body_discomfort" -> {
                sb.append("【当前场景：身体不适 — 最高紧急级别】\n");
                sb.append("- 第一句话必须关心用户身体状况，不是收集信息\n");
                sb.append("- 建议立即就医并保留就医凭证\n");
                sb.append("- 医疗费用由公司负责处理\n");
                sb.append("- 已紧急上报至品控部门\n");
                sb.append("- 参考话术：\"非常关心您的身体状况，首先向您致以最诚挚的歉意。如您感到身体不适，建议尽快就医并保留好就医凭证，相关医疗费用我们会负责处理。\"\n");
            }
            case "spoilage" -> {
                sb.append("【当前场景：变质/过期 — 严重级别】\n");
                sb.append("- 确认用户是否已饮用/食用\n");
                sb.append("- 请求产品照片作为凭证\n");
                sb.append("- 已立即通知门店排查同批次原料\n");
                sb.append("- 参考话术：\"非常抱歉，这是我们的严重失误。食品安全是我们最重视的底线，已立即通知门店排查同批次原料。\"\n");
            }
            case "foreign_object_external" -> {
                sb.append("【当前场景：外源性异物（塑料/金属/头发/虫等）— 高级别】\n");
                sb.append("- 请求保留异物和饮品作为凭证\n");
                sb.append("- 请求异物照片\n");
                sb.append("- 会立即联系门店进行排查\n");
                sb.append("- 参考话术：\"对于您反馈的异物问题我们非常重视，会立即联系门店进行排查。请您保留好异物和饮品作为凭证。\"\n");
            }
            case "foreign_object_internal" -> {
                sb.append("【当前场景：内源性异物（果核/茶渣/果皮等）— 中级别】\n");
                sb.append("- 这类情况可能是制作过程中未能完全过滤\n");
                sb.append("- 已记录并反馈门店加强品控\n");
                sb.append("- 可邀请用户联系门店重新制作\n");
                sb.append("- 参考话术：\"非常抱歉给您带来了不好的体验，这类情况可能是制作过程中未能完全过滤，已反馈门店加强品控。\"\n");
            }
            case "taste_issue" -> {
                sb.append("【当前场景：异味/口感异常 — 中级别】\n");
                sb.append("- 详细记录用户描述的具体味道\n");
                sb.append("- 反馈门店品控团队核查\n");
                sb.append("- 参考话术：\"非常抱歉饮品口感没有达到您的预期，您描述的味道问题已详细记录，会反馈给门店品控团队核查。\"\n");
            }
            default -> {
                sb.append("【当前场景：食品安全综合处理】\n");
                sb.append("- 先共情安抚，再收集信息\n");
                sb.append("- 如用户情绪激动，优先安抚\n");
            }
        }

        sb.append("\n【注意事项】\n");
        sb.append("- 绝不推卸责任或质疑用户的描述\n");
        sb.append("- 所有信息用于内部品质改进追溯\n");
        sb.append("- 联系门店方式：\"诚邀您抽空电话联系门店，门店电话可在小程序门店详情中查看\"\n");
        sb.append("- 也可以：\"通过喜茶小程序的在线客服联系我们\"\n");
    }

    private void buildOrderingPrompt(StringBuilder sb, String subScenario) {
        sb.append("你的核心职责是帮助用户完成点单流程。\n\n");

        sb.append("【能力范围】\n");
        sb.append("- 浏览菜单、推荐当季热门饮品\n");
        sb.append("- 确认饮品名称、规格（杯型/甜度/冰量）和数量\n");
        sb.append("- 查询门店地址和配送范围\n");
        sb.append("- 确认订单、模拟下单流程\n\n");

        sb.append("【热门饮品推荐】\n");
        sb.append("- 多肉葡萄 ¥29 — 经典必点，清爽葡萄风味\n");
        sb.append("- 芝芝莓莓 ¥32 — 草莓搭配芝士奶盖\n");
        sb.append("- 烤黑糖波波 ¥25 — 黑糖珍珠奶茶\n");
        sb.append("- 生椰拿铁 ¥28 — 椰子风味咖啡\n");
        sb.append("- 轻乳茶系列 ¥22-26 — 轻盈茶底选择\n\n");

        sb.append("【回复规范】\n");
        sb.append("- 主动推荐2-3款当季热门饮品\n");
        sb.append("- 用户确认饮品后主动询问规格偏好（甜度/冰量）\n");
        sb.append("- 点单完成后汇总确认订单信息\n");
        sb.append("- 用友好、活泼的语气回复，保持喜茶品牌调性\n");
    }

    private void buildGeneralPrompt(StringBuilder sb, String subScenario, String userMessage) {
        sb.append("你是喜茶的全能客服助手，可以处理各类咨询和投诉。\n\n");

        if (subScenario != null) {
            // Sub-scenario detected — inject specific handling
            switch (subScenario) {
                case "service_complaint" -> {
                    sb.append("【当前场景：服务投诉】\n");
                    sb.append("用户对门店服务不满意（态度/业务技能/封口/杯盖等）\n\n");
                    sb.append("【处理策略】\n");
                    sb.append("1. 第一句话致歉：\"非常抱歉给您带来了不愉快的服务体验\"\n");
                    sb.append("2. 表明重视：\"我们对服务品质有严格要求，已将您的反馈转达给门店负责人\"\n");
                    sb.append("3. 承诺改进：\"会加强员工培训，避免类似情况再次发生\"\n");
                    sb.append("4. 引导联系：\"诚邀您联系我们以便进一步跟进处理\"\n");
                }
                case "delivery_issue" -> {
                    sb.append("【当前场景：外卖/配送问题】\n");
                    sb.append("用户遇到配送相关问题（撒漏/超时/送错/未送达等）\n\n");
                    sb.append("【处理策略】\n");
                    sb.append("1. 致歉：\"非常抱歉外卖过程中出现了问题\"\n");
                    sb.append("2. 针对具体问题给方案：撒漏→退款/重送；超时→反馈优化；送错→退款/补送\n");
                    sb.append("3. 已反馈配送团队\n");
                    sb.append("4. 引导通过平台申请售后\n");
                }
                case "product_quality" -> {
                    sb.append("【当前场景：产品品质问题】\n");
                    sb.append("用户对饮品口感/温度/甜度/份量等不满意\n\n");
                    sb.append("【处理策略】\n");
                    sb.append("1. 致歉并提及具体产品：\"非常抱歉[产品名]没有达到您的期望\"\n");
                    sb.append("2. 解释或建议（如甜度冰量可调整、口感因人而异）\n");
                    sb.append("3. 已反馈门店核查出品标准\n");
                    sb.append("4. 可邀请联系门店重新制作\n");
                }
                case "efficiency" -> {
                    sb.append("【当前场景：制作效率/等候问题】\n");
                    sb.append("用户反映等候时间长/叫号问题\n\n");
                    sb.append("【处理策略】\n");
                    sb.append("1. 致歉：\"非常抱歉让您久等了\"\n");
                    sb.append("2. 解释：\"高峰期订单集中可能导致等候时间延长\"\n");
                    sb.append("3. 建议：\"可以通过小程序实时查看制作进度\"\n");
                    sb.append("4. 已反馈门店优化出杯效率\n");
                }
                case "packaging" -> {
                    sb.append("【当前场景：包装问题】\n");
                    sb.append("用户反映杯具/吸管/包装袋等问题\n\n");
                    sb.append("【处理策略】\n");
                    sb.append("1. 致歉：\"非常抱歉杯具/包装给您带来了不便\"\n");
                    sb.append("2. 已反馈品控部门核查\n");
                    sb.append("3. 不同饮品使用不同杯型设计（如有设计差异可解释）\n");
                }
                case "hygiene" -> {
                    sb.append("【当前场景：卫生问题】\n");
                    sb.append("用户反映门店/员工卫生问题\n\n");
                    sb.append("【处理策略】\n");
                    sb.append("1. 致歉：\"非常抱歉门店卫生没有达到您的期望\"\n");
                    sb.append("2. 已反馈门店立即整改\n");
                    sb.append("3. 我们有严格的卫生标准和巡检制度\n");
                }
                default -> {
                    sb.append("【通用咨询处理】\n");
                    sb.append("- 用专业、友好的语气回复\n");
                    sb.append("- 如果不确定具体信息，建议用户通过喜茶小程序或官方渠道确认\n");
                    sb.append("- 可以适当推荐相关饮品或活动\n");
                    sb.append("- 回复简洁，不超过3-4句话\n");
                }
            }
        } else {
            // No sub-scenario — general customer service
            sb.append("【能力范围】\n");
            sb.append("- 门店查询（地址、营业时间、联系方式）\n");
            sb.append("- 会员制度、积分规则、会员等级\n");
            sb.append("- 优惠活动、新品资讯、联名活动\n");
            sb.append("- 配送方式、取餐方式\n");
            sb.append("- 品牌故事、企业文化\n\n");
            sb.append("【回复规范】\n");
            sb.append("- 用专业、友好的语气回复\n");
            sb.append("- 如果不确定具体信息，建议用户通过喜茶小程序或官方渠道确认\n");
            sb.append("- 可以适当推荐相关饮品或活动\n");
            sb.append("- 回复简洁，不超过3-4句话\n");
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  INITIALIZATION
    // ══════════════════════════════════════════════════════════════

    public LLMServiceImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder().build();
    }

    @PostConstruct
    @SuppressWarnings("unchecked")
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("reply-templates.json");
            InputStream is = resource.getInputStream();
            String json = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            replyTemplates = objectMapper.readValue(json, new TypeReference<>() {});
            log.info("Reply templates loaded successfully");
        } catch (Exception e) {
            log.warn("Failed to load reply-templates.json: {}", e.getMessage());
            replyTemplates = Map.of();
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  CHAT — Main conversation endpoint
    // ══════════════════════════════════════════════════════════════

    @Override
    public ChatResponse chat(String conversationId, String userMessage, String intent, List<Message> history) {
        long startTime = System.currentTimeMillis();

        // Detect sub-scenario BEFORE try block so fallback can access it
        String subScenario = detectSubScenario(userMessage, intent);
        log.info("Sub-scenario detected: {} for intent: {}", subScenario, intent);

        try {
            // Build dynamic system prompt
            String systemPrompt = buildSystemPrompt(intent, subScenario, userMessage);

            // Build message list for the LLM
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));

            // Include conversation history (last 20 messages max)
            if (history != null && !history.isEmpty()) {
                int fromIndex = Math.max(0, history.size() - 20);
                for (Message msg : history.subList(fromIndex, history.size())) {
                    messages.add(Map.of("role", msg.getRole(), "content", msg.getContent()));
                }
            }

            // Current user message
            messages.add(Map.of("role", "user", "content", userMessage));

            // Build request body (OpenAI-compatible format)
            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", maxTokens);
            requestBody.put("temperature", temperature);

            String requestBodyJson = objectMapper.writeValueAsString(requestBody);

            log.debug("LLM request: model={}, messages={}, subScenario={}, conversationId={}",
                    model, messages.size(), subScenario, conversationId);

            // Call DashScope compatible API
            String responseBody;
            try {
                responseBody = webClient.post()
                        .uri(baseUrl + "/chat/completions")
                        .header("Authorization", "Bearer " + apiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(requestBodyJson)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(TIMEOUT)
                        .block();
            } catch (org.springframework.web.reactive.function.client.WebClientResponseException wcre) {
                log.error("LLM API error: status={}, body={}, promptLength={}",
                        wcre.getStatusCode(), wcre.getResponseBodyAsString(), systemPrompt.length());
                throw wcre;
            }

            long latencyMs = System.currentTimeMillis() - startTime;

            // Parse the response
            Map<String, Object> responseMap = objectMapper.readValue(responseBody, new TypeReference<>() {});

            // Extract assistant content
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
            String content = "Sorry, I could not generate a response.";
            if (choices != null && !choices.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> messageObj = (Map<String, Object>) choices.get(0).get("message");
                if (messageObj != null && messageObj.get("content") != null) {
                    content = messageObj.get("content").toString();
                }
            }

            // Extract usage metadata
            Map<String, Object> metadata = new LinkedHashMap<>();
            if (responseMap.containsKey("usage")) {
                metadata.put("usage", responseMap.get("usage"));
            }
            metadata.put("model", model);
            metadata.put("intent", intent);
            metadata.put("subScenario", subScenario);

            return ChatResponse.builder()
                    .conversationId(conversationId)
                    .messageId(UUID.randomUUID().toString())
                    .content(content)
                    .intent(intent)
                    .role("assistant")
                    .metadata(metadata)
                    .latencyMs(latencyMs)
                    .createdAt(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            long latencyMs = System.currentTimeMillis() - startTime;
            log.error("LLM call failed for conversation {}: {}", conversationId, e.getMessage(), e);
            return buildFallbackResponse(conversationId, latencyMs, intent, subScenario);
        }
    }

    private String detectSubScenario(String userMessage, String intent) {
        if (userMessage == null || userMessage.isBlank()) return null;
        return switch (intent) {
            case "food_safety" -> detectFoodSafetySubScenario(userMessage);
            case "ordering" -> detectOrderingSubScenario(userMessage);
            default -> detectGeneralSubScenario(userMessage);
        };
    }

    // ══════════════════════════════════════════════════════════════
    //  CLASSIFY INTENT — 两阶段分类：关键词(regex) + LLM(11大类)
    // ══════════════════════════════════════════════════════════════

    // ── Store-environment context patterns (hygiene-only, not food safety) ──
    private static final Pattern[] ENVIRONMENT_CONTEXT_PATTERNS;
    static {
        ENVIRONMENT_CONTEXT_PATTERNS = compilePatterns(
                "(门店|店里|店内|操作台|大堂|大厅|吧台|柜台|店里头)"
        );
    }

    @Override
    public String classifyIntent(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return "general_knowledge";
        }
        String msg = userMessage.toLowerCase();

        // ── Pre-check: Store-environment hygiene → NOT food_safety ──
        // Messages describing store hygiene (flies/pests/dirtiness IN the store)
        // should go to general_knowledge/hygiene, not food_safety
        boolean isEnvironmentOnly = matchAny(msg, ENVIRONMENT_CONTEXT_PATTERNS)
                && matchAny(msg, HYGIENE_PATTERNS)
                && !matchAny(msg, compilePatterns("(喝出|吃出|吸出|喝了|吃了|我的.*茶|我的.*饮|杯子里|饮品里)"));

        // ── Phase 1: 正则快速通道（毫秒级，来自关键词.xlsx 113条规则）──
        // 食安最高优先级 (skip if environment-only hygiene)
        if (!isEnvironmentOnly && matchAny(msg, FOOD_SAFETY_PATTERNS)) {
            String matched = findMatch(msg, FOOD_SAFETY_PATTERNS);
            log.info("Keyword fast-path: food_safety (matched: {})", matched);
            return "food_safety";
        }
        // 点单
        if (matchAny(msg, ORDERING_PATTERNS)) {
            String matched = findMatch(msg, ORDERING_PATTERNS);
            log.info("Keyword fast-path: ordering (matched: {})", matched);
            return "ordering";
        }

        // ── Phase 2: LLM 增强分类（11大类精细分类）──
        try {
            String classificationPrompt = """
                    你是喜茶客服意图分类器。请根据用户消息判断其意图类别。
                    
                    【分类体系 — 3大类】
                    1. food_safety（食品安全）— 仅当消息包含以下健康/安全信号时才归入此类：
                       异物(头发/虫/塑料/金属/不明物体)、变质/发霉/过期、身体不适(拉肚子/呕吐/过敏/发烧)、
                       异味(消毒水味/化学味/发苦/发涩/发酸等异常味道，可能表示原料问题)、
                       退款/赔偿/投诉食品安全、卫生安全(食安/食品安全)
                       ⚠ 关键边界规则：
                       - 异常味道(发苦/发涩/消毒水味/化学味/怪味/味道变了) → food_safety
                       - 主观口味偏好(太甜/太淡/不够甜/水一样) → general_knowledge(产品品质)
                       - 口感不好/味道淡/太甜/太苦(主观评价) → general_knowledge(产品品质)
                       - 外卖撒漏/配送超时/送错 → general_knowledge(外卖问题)
                       - 杯盖破/吸管断/袋子坏/杯底裂 → general_knowledge(包装问题)
                       - 门店脏/门店有苍蝇飞虫/员工没戴口罩 → general_knowledge(卫生问题)
                       - 态度差/不理人 → general_knowledge(服务投诉)
                    
                    2. ordering（点单）
                       点饮品/查看菜单/推荐/修改查询订单/价格规格
                       信号：点单/下单/来一杯/菜单/推荐/甜度/冰量/多少钱
                    
                    3. general_knowledge（通用咨询/其他投诉）
                       以下全部归入此类，由系统内部细分：
                       - 服务投诉（态度差/不理人/敷衍）
                       - 外卖问题（撒漏/超时/送错/没收到）
                       - 产品品质（口感不好/温度不对/甜度/份量少/做错了/味道淡/太苦/太淡等主观评价）
                       - 制作效率（等太久/叫号问题/超时）
                       - 包装问题（杯子破/吸管断/袋子坏/杯盖裂/杯底裂）
                       - 卫生问题（门店脏/员工没戴口罩/操作台脏/门店有飞虫苍蝇）
                       - 门店管理（排队/线上关闭/售罄/座位）
                       - 一般咨询（门店/会员/优惠/活动/品牌）
                       信号：门店/在哪/几点/会员/积分/优惠/活动/新品/等了/态度/外卖
                    
                    只返回类别名称（food_safety / ordering / general_knowledge），不要返回其他任何文字。
                    
                    用户消息：%s
                    """.formatted(userMessage);

            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", List.of(
                    Map.of("role", "system", "content", "你是意图分类器，只返回类别名称：food_safety、ordering 或 general_knowledge。"),
                    Map.of("role", "user", "content", classificationPrompt)
            ));
            requestBody.put("max_tokens", 20);
            requestBody.put("temperature", 0.0);

            String requestBodyJson = objectMapper.writeValueAsString(requestBody);

            String responseBody = webClient.post()
                    .uri(baseUrl + "/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBodyJson)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            Map<String, Object> responseMap = objectMapper.readValue(responseBody, new TypeReference<>() {});

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
            if (choices != null && !choices.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> messageObj = (Map<String, Object>) choices.get(0).get("message");
                if (messageObj != null && messageObj.get("content") != null) {
                    String result = messageObj.get("content").toString().trim().toLowerCase();
                    log.info("LLM classified intent: {}", result);
                    if (result.contains("food_safety")) return "food_safety";
                    if (result.contains("ordering")) return "ordering";
                    if (result.contains("general_knowledge")) return "general_knowledge";
                }
            }

        } catch (Exception e) {
            log.warn("LLM intent classification failed, defaulting to general_knowledge: {}", e.getMessage());
        }

        return "general_knowledge";
    }

    // ══════════════════════════════════════════════════════════════
    //  FALLBACK
    // ══════════════════════════════════════════════════════════════

    private ChatResponse buildFallbackResponse(String conversationId, long latencyMs, String intent, String subScenario) {
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("error", "LLM call failed");
        meta.put("fallback", true);
        meta.put("intent", intent);
        meta.put("subScenario", subScenario);
        return ChatResponse.builder()
                .conversationId(conversationId)
                .messageId(UUID.randomUUID().toString())
                .content("抱歉，系统暂时无法响应，请稍后再试或转接人工客服。您也可以拨打门店电话或通过喜茶小程序在线客服联系我们。")
                .intent(intent)
                .role("assistant")
                .metadata(meta)
                .latencyMs(latencyMs)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
