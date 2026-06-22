package com.heytea.agent.service.llm;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.*;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

/**
 * Intent classifier — two-phase: regex fast-path + LLM fallback.
 * Extracted from LLMServiceImpl (was 930 lines).
 */
@Slf4j
@Component
public class IntentClassifier {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${llm.api-key}")
    private String apiKey;

    @Value("${llm.model}")
    private String model;

    @Value("${llm.base-url}")
    private String baseUrl;

    // ── Precompiled regex patterns ──
    private static final Pattern[] FOOD_SAFETY_PATTERNS;
    private static final Pattern[] FOOD_SAFETY_EDGE_PATTERNS;
    private static final Pattern[] SERVICE_COMPLAINT_PATTERNS;
    private static final Pattern[] DELIVERY_ISSUE_PATTERNS;
    private static final Pattern[] PRODUCT_QUALITY_PATTERNS;
    private static final Pattern[] EFFICIENCY_PATTERNS;
    private static final Pattern[] PACKAGING_PATTERNS;
    private static final Pattern[] HYGIENE_PATTERNS;
    private static final Pattern[] ORDERING_PATTERNS;
    private static final Pattern[] STORE_INFO_PATTERNS;
    private static final Pattern[] ENVIRONMENT_CONTEXT_PATTERNS;

    static {
        FOOD_SAFETY_PATTERNS = compilePatterns(
                "(异物|头发|毛发|根毛|有毛|塑料|金属|玻璃|虫|苍蝇|蟑螂|纸片|线头|棉絮|小虫|飞虫|圆片|片片|胶体|黑色.*物)",
                "(喝出|吃出|吸出).{0,6}(虫|发|毛|塑料|金属|玻璃|纸|线|棉|东西|异物)",
                "(不明物|黑色|黑的|颗粒物|沉淀物|不明物体)",
                "(封口标签|封口贴|标签|贴纸).{0,5}(掉|落|进|在)",
                "(有个.{0,2}东西|有个.{0,2}啥|有个.{0,2}什么|里面有.{0,2}东西|里有这个|有这个|里有.{0,2}个)",
                "(双眼皮贴|创可贴|指甲|耳环|戒指|胶带|绳子|橡皮)",
                "(果核|籽|茶渣|果皮|果肉|柠檬皮|柠檬籽|芒果核|芒果皮|葡萄皮|百香果籽|橙皮)",
                "(有核|有籽|有.{0,3}皮|去皮|太.{0,3}皮|皮.*太.{0,3}多|核.*大|籽.*多)",
                "(纤维|果肉.{0,2}块|水果纤维|茶叶.{0,2}渣|有茶叶|茶叶.*多|茶渣)",
                "(渣子|渣渣|全是渣|都是渣|有渣)",
                "(拉肚子|腹泻|拉稀|呕吐|过敏|恶心|头晕|发烧|不舒服|肚子疼|肚子痛)",
                "(上吐下泻|拉肚|吃完不舒服|喝了以后|喝完.*不舒服|食物中毒)",
                "(皮疹|红疹|瘙痒|胃痛|胃疼|肠胃|食物中毒|疯狂拉|一直拉|不停拉)",
                "(拉.*肚子|肚子.*拉|肚子.*不舒服|肚子.*疼|肚子.*痛)",
                "(身体.*不适|全身.*痒|起疹|嘴.*肿|嘴.*麻|喉咙.*不舒服)",
                "(变质|发霉|过期|馊|酸了|酸酸的|异味|怪味|味道不对|一股味道|味道.{0,3}奇怪)",
                "(有一.{0,2}股|有股|变酸|变味|发酸|发臭|腐烂|腐坏|地沟油|品质问题|消毒水味|化学味)",
                "(发苦|是苦的|苦味|涩味|发涩|味道淡|没味道|变淡|味道变了|味道.{0,2}不对)",
                "(保质期|临期|有效期|生产日期|过了.*期)",
                "(是酸的|闻着.*酸|闻着.{0,5}酸|不太新鲜|不新鲜|像是坏|好像.*坏|好像.*变质)",
                "(牛奶.*不新鲜|奶.*酸|奶.*过期)",
                "(退款|赔偿|补偿|投诉|曝光|差评|给我一个说法|举报|工商|消协|12315)",
                "(食品问题|食品安全问题|怎么处理|怎么解决|给个说法|给个交代)",
                "(包装破|漏杯|封口不严|食安|食品安全|卫生问题|不干净|不卫生)",
                "(杯盖.{0,3}(掉进|掉到|掉入)|吸管.{0,8}(脏|黑|黑圈|变色|异物))",
                "(杯底.*有个|杯盖.*掉|杯子里.*有|杯底.*东西)",
                "(这是啥|这个是啥|这个是什么|这是什么呀|啥东西|什么情况|啥情况)",
                "(正常吗|正常的吗|这个正常|是不是正常|这样正常)",
                "(吸出来|吸.*出来|喝到最后|喝到后面|喝出)",
                "(给错|做错|弄错|出.*错).{0,6}(茶|饮|杯)",
                "(反馈问题|反馈.{0,3}(食安|安全|卫生|质量))",
                "(潮潮|黏黏|粘稠|结块|发粘)",
                "(?<![a-zA-Z])\\d{16,20}(?!\\d)",
                "(闭店|整改|停业|关门.{0,3}(整改|检查|卫生)|歇业)",
                "(非常抱歉给您|非常重视您的|请您提供订单编号|马上为您核实|门店负责人亲自联系|消消气)",
                "(商家的回复|商家.{0,2}(回复|答复|回应).{0,3}(什么|啥)意思)",
                "(foreign object|refund|sick|allergic|contaminated|hair|mold|expired|dirty)"
        );

        SERVICE_COMPLAINT_PATTERNS = compilePatterns(
                "(服务态度|态度.{0,2}(差|不好|很差|恶劣|差劲)|爱理不理|冷漠|不耐烦|甩脸|凶|骂人)",
                "(翻白眼|不理人|忽视|敷衍|推卸|踢皮球|不负责)",
                "(没礼貌|不热情|恶语|甩话|黑脸|不搭理)",
                "(餐具|保温袋|没给|漏给|忘记给)",
                "(会员|积分|优惠券|兑换|核销|用不了|过期)",
                "(封口.{0,3}(松|开|不严|漏)|杯盖.{0,3}(松|紧|难|打不开))"
        );

        DELIVERY_ISSUE_PATTERNS = compilePatterns(
                "(外卖.{0,4}(撒|漏|洒|翻)|配送.{0,4}(撒|漏|洒))",
                "(配送.{0,3}(慢|迟|超时|晚)|外卖.{0,3}(慢|迟|超时|晚)|骑手.{0,3}(慢|迟))",
                "(没送到|没收到|送错|漏送|少送|错送|餐品不对)",
                "(提前.{0,3}(送达|点送达|签收)|未送达|放门口|没放)",
                "(配送费|包装费|骑手态度|骑手卫生|不送上门)"
        );

        PRODUCT_QUALITY_PATTERNS = compilePatterns(
                "(不好喝|难喝|味道淡|没味道|水一样|太甜|太苦|太酸|太涩)",
                "(口感|口味).{0,5}(差|不好|一般|不行|怪)",
                "(冰.{0,2}(太多|太少|没|化完|没了)|冰量|去冰|少冰)",
                "(甜度|糖度|太甜|不够甜|代糖|零卡糖)",
                "(果肉.{0,2}少|小料.{0,2}少|料.{0,2}少|份量.{0,2}少|不满杯|半杯)",
                "(做错了|出品错误|做错|不是.*点|加错|漏做|没做)",
                "(不新鲜|水果.{0,2}(坏|烂|不新鲜)|变质|发黄|发黑)",
                "(波波|珍珠|啵啵|珠珠).{0,5}(硬|变|不对|没有|少)",
                "(融化|化了|分层|沉底|混在一起|芝士.{0,2}化|冰淇淋.{0,2}化|奶油.{0,2}化)",
                "(温度|太烫|太热|不够热|凉了|冷的|常温.*冷|温.*烫)"
        );

        EFFICIENCY_PATTERNS = compilePatterns(
                "(等了.{0,5}(久|长|半天|小时|分钟)|排队.{0,5}(久|长))",
                "(等了.{0,3}(分钟|小时|半天).{0,6}(还没|没做|没好|还没做好|没出))",
                "(叫号.{0,3}(没|不|还|才)|没叫号|叫了.*没做好|做好了.*没叫|叫号.*没人|叫.*半天.*没人)",
                "(超.{0,3}(预估|时间|时)|制作.{0,3}(慢|久|效率))",
                "(等了很久|等半天|等了好久|效率低|出杯慢|出杯速度|出杯太慢|速度太慢|速度.*慢)",
                "(前面.{0,3}(人|位).{0,5}(等|排).{0,5}(久|长|半|小时|分钟))",
                "(做.{0,3}(太慢|好慢|很慢)|出品.{0,3}慢|上杯.{0,3}慢)"
        );

        PACKAGING_PATTERNS = compilePatterns(
                "(杯底|杯身|杯盖).{0,5}(裂|破|坏|漏|变形|歪)",
                "(吸管.{0,5}(断|裂|坏|脏|弯|折))",
                "(包装袋|纸袋|袋子).{0,5}(破|烂|坏|脏|没有))",
                "(玻璃瓶|保温袋|冰袋).{0,5}(破|坏|没|漏)"
        );

        HYGIENE_PATTERNS = compilePatterns(
                "(卫生.{0,3}(差|不好|问题)|不卫生|脏乱|脏脏)",
                "(飞虫.{0,3}(多|飞)|苍蝇.{0,3}(多|飞)|蚊虫|蚂蚁)",
                "(员工.{0,3}(没.{0,2}(戴口罩|戴手套|洗手)|卫生)|操作台.{0,3}脏)",
                "(地面.{0,3}脏|桌子.{0,3}脏|椅子.{0,3}脏|垃圾桶.{0,3}满)"
        );

        ORDERING_PATTERNS = compilePatterns(
                "(点单|下单|点一杯|来一杯|买一杯|要一杯|我想点|想喝)",
                "(推荐饮品|推荐喝|菜单|看看菜单|有什么喝的|有什么推荐)",
                "(甜度|冰量|少冰|去冰|几分糖|加料|规格)",
                "(确认订单|订单确认|配送地址|送到|自提|外卖地址)",
                "(多少钱|价格|size|menu|order)"
        );

        STORE_INFO_PATTERNS = compilePatterns(
                "(门店.{0,5}(在|哪|地址|位置|怎么|电话|联系))",
                "(哪家店|最近的店|哪个门店|哪里.{0,3}(有|能|可以).{0,3}(喜茶|店|门店))",
                "(几点.{0,5}(开|关|营业|打烊|上班|下班))",
                "(营业.{0,3}(时间|几点|到))",
                "(门店.{0,5}(停车|车位|停车费|座位|wifi|WiFi|洗手间|卫生间))",
                "(哪些.{0,3}门店|哪些.{0,3}店|有没有.{0,3}店)"
        );

        ENVIRONMENT_CONTEXT_PATTERNS = compilePatterns(
                "(门店|店里|店内|操作台|大堂|大厅|吧台|柜台|店里头)"
        );

        // ── Edge-case patterns: colloquial/novel food safety expressions ──
        // These catch novel phrasings that standard patterns miss
        FOOD_SAFETY_EDGE_PATTERNS = compilePatterns(
                // 颜色/外观异常 (novel descriptions of spoilage)
                "(颜色.{0,3}(发|变|成了).{0,4}(绿|黑|灰|暗|浑浊))",
                "(看起来.{0,5}(不对劲|有问题|怪怪的|不太对))",
                "(变色了|浑浊|有沉淀|有悬浮|飘着.{0,3}(黑|绿|白).{0,3}(点|丝|块|东西))",
                // 化学/添加剂质疑 (food safety questioning, not complaint)
                "(防腐剂|添加剂|色素|香精|化学.{0,3}(成分|物质|添加)|人工.{0,3}(合成|添加))",
                "(是不是.{0,5}(有毒|有害|不安全|不健康|有问题))",
                "(含.{0,3}(防腐剂|添加剂|色素|香精|化学成分))",
                // 口语化身体不适 (internet slang / colloquial)
                "(跑厕所|进医院|上医院|去急诊|挂急诊|看急诊)",
                "(拉.{0,2}(到|得|了).{0,4}(脱水|虚脱|不行|站不住))",
                "(吐.{0,2}(到|得|了).{0,4}(不行|脱水|胆汁|血丝))",
                "(胃.{0,2}(在烧|灼热|绞痛|翻腾|痉挛)|肚子.{0,2}(绞痛|痉挛|翻江倒海))",
                "(浑身.{0,3}(无力|发软|发抖|冒冷汗)|全身.{0,3}(发麻|起鸡皮))",
                // 隐喻/夸张表达 (metaphorical but genuine food safety)
                "(喝完.{0,8}(直接|当场|立马).{0,5}(进|去|跑|送).{0,5}(医院|厕所|急诊))",
                "(避雷.{0,5}(医院|拉肚子|中毒|不舒服|恶心))",
                "(喝完.{0,5}(人|身体|状态).{0,5}(不对|出问题|出状况))",
                // 模糊但有食安语境的活体/动态描述
                "(在动|在爬|在游|在飞|蠕动|活的|会动的)",
                "(黑点|黑斑|白点|白斑|绿点|绿斑).{0,5}(在动|在爬|活的|蠕动)",
                // 模糊异物描述 (vague foreign object descriptions)
                "(硬硬的|软软的|黏糊糊的|毛毛的|刺刺的).{0,5}(东西|物体|东西|啥)",
                "(跟|像|好像|像是|类似).{0,8}(棉花|毛线|头发|虫子|蜘蛛|丝|絮|渣).{0,5}(似|一样|的|般|那种)",
                "(咬到|硌到|嚼到|吃到).{0,8}(硬|软|怪|不对|不该有).{0,5}(东西|的)",
                "(有个|有个像|有个跟).{0,8}(东西|物体|啥|什么).{0,5}(咬|硌|嚼)",
                // 网络用语呕吐/恶心 (internet slang disgust/vomiting)
                "(yue了|yue|吐了|干呕|呕|反胃|想吐|恶心死了|恶心得要死)",
                "(泔水味|馊水味|下水道味|臭水沟味|阴沟味)",
                "(闻起来|喝着|喝起来).{0,5}(yue|想吐|反胃|恶心|作呕)"
        );
    }

    public IntentClassifier(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder().build();
    }

    // ── Public API: expose pattern arrays for SubScenarioDetector ──

    public static Pattern[] getFoodSafetyPatterns() { return FOOD_SAFETY_PATTERNS; }
    public static Pattern[] getServiceComplaintPatterns() { return SERVICE_COMPLAINT_PATTERNS; }
    public static Pattern[] getDeliveryIssuePatterns() { return DELIVERY_ISSUE_PATTERNS; }
    public static Pattern[] getProductQualityPatterns() { return PRODUCT_QUALITY_PATTERNS; }
    public static Pattern[] getEfficiencyPatterns() { return EFFICIENCY_PATTERNS; }
    public static Pattern[] getPackagingPatterns() { return PACKAGING_PATTERNS; }
    public static Pattern[] getHygienePatterns() { return HYGIENE_PATTERNS; }
    public static Pattern[] getStoreInfoPatterns() { return STORE_INFO_PATTERNS; }

    /**
     * Classify user message intent: food_safety / ordering / general_knowledge.
     * Architecture: regex confidence scoring + LLM few-shot fallback.
     * - High-confidence regex match → fast-path (no LLM call)
     * - Edge pattern match → food_safety (catches colloquial/novel expressions)
     * - Low/zero confidence → LLM few-shot classification
     */
    public String classify(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return "general_knowledge";
        }
        String msg = userMessage.toLowerCase();

        // Pre-check: alphanumeric IDs → NOT food_safety
        if (msg.matches("^[a-zA-Z0-9_\\-]{10,}$") && msg.matches(".*[a-zA-Z].*") && msg.matches(".*\\d.*")) {
            log.info("Alphanumeric ID detected, defaulting to general_knowledge");
            return "general_knowledge";
        }

        // Pre-check: store-environment hygiene → NOT food_safety
        boolean isEnvironmentOnly = matchAny(msg, ENVIRONMENT_CONTEXT_PATTERNS)
                && matchAny(msg, HYGIENE_PATTERNS)
                && !matchAny(msg, compilePatterns("(喝出|吃出|吸出|喝了|吃了|我的.*茶|我的.*饮|杯子里|饮品里)"));

        // ── Phase 1: Edge-case patterns (high priority, catches novel expressions) ──
        if (!isEnvironmentOnly && matchAny(msg, FOOD_SAFETY_EDGE_PATTERNS)) {
            String matched = findMatch(msg, FOOD_SAFETY_EDGE_PATTERNS);
            log.info("Edge-case fast-path: food_safety (matched: {})", matched);
            return "food_safety";
        }

        // ── Phase 2: Standard regex with confidence scoring ──
        // Count food safety pattern matches for confidence
        int fsMatches = countMatches(msg, FOOD_SAFETY_PATTERNS);
        boolean orderingMatch = matchAny(msg, ORDERING_PATTERNS);
        boolean storeMatch = matchAny(msg, STORE_INFO_PATTERNS);

        // High-confidence food safety: strong regex signal
        if (!isEnvironmentOnly && fsMatches >= 2) {
            String matched = findMatch(msg, FOOD_SAFETY_PATTERNS);
            log.info("High-confidence regex: food_safety ({} matches, matched: {})", fsMatches, matched);
            return "food_safety";
        }

        // Single food safety match: could be genuine or false positive → verify with LLM
        // This is the key insight: single regex match is NOT enough for borderline cases
        if (!isEnvironmentOnly && fsMatches == 1) {
            String matched = findMatch(msg, FOOD_SAFETY_PATTERNS);
            log.info("Low-confidence food_safety regex (1 match: {}), verifying with LLM", matched);
            // Fall through to LLM verification
        }

        // High-confidence ordering (no food safety signal at all)
        if (fsMatches == 0 && orderingMatch) {
            String matched = findMatch(msg, ORDERING_PATTERNS);
            log.info("Keyword fast-path: ordering (matched: {})", matched);
            return "ordering";
        }
        if (fsMatches == 0 && storeMatch) {
            String matched = findMatch(msg, STORE_INFO_PATTERNS);
            log.info("Keyword fast-path: ordering/store_info (matched: {})", matched);
            return "ordering";
        }

        // ── Phase 3: LLM few-shot classification (all ambiguous/uncertain cases) ──
        return llmClassify(userMessage);
    }

    /** Count how many patterns in the array match the text. */
    private static int countMatches(String text, Pattern[] patterns) {
        int count = 0;
        for (Pattern p : patterns) {
            if (p.matcher(text).find()) count++;
        }
        return count;
    }

    // ── LLM fallback classification ──

    private String llmClassify(String userMessage) {
        try {
            String classificationPrompt = """
                    你是喜茶客服意图分类器。判断用户消息的意图类别。
                    
                    【分类体系】
                    1. food_safety（食品安全）— 用户描述了与饮品安全/健康相关的问题
                    2. ordering（点单）— 点饮品/查看菜单/推荐/门店查询
                    3. general_knowledge（通用咨询/其他）— 服务投诉/外卖问题/产品口感偏好/效率/包装/卫生
                    
                    【⚠ 关键：food_safety 的判断边界 — 宁宽勿漏】
                    以下看似模糊但实际涉及食安的表述，必须归为 food_safety：
                    - 颜色/外观异常："颜色发绿了""变色了""浑浊""有沉淀"
                    - 化学/添加剂质疑："含防腐剂吗""有没有添加剂""是不是色素"
                    - 口语化身体不适："跑厕所三趟""进医院了""胃在烧""浑身发软"
                    - 隐喻/夸张表达："避雷！！喝完直接进医院""绝了喝完跑厕所跑三趟"
                    - 活体/动态异物："杯壁上有个黑点在动""发现虫子在爬"
                    - 模糊但有食安语境："是不是没加弹弹冻啊""这个正常吗"+"饮品内容物描述"
                    
                    以下 NOT food_safety（归入 general_knowledge）：
                    - 主观口味偏好："太甜了""不够甜""太淡"
                    - 配送问题："外卖撒了""送错了""超时了"
                    - 服务态度："态度差""不理人"
                    - 产品口感（非安全）："不好喝""口感一般"
                    
                    【示例】
                    用户：昨晚买的杨枝甘露，今天打开发现颜色发绿了 → food_safety
                    用户：你们用的椰奶是不是含防腐剂啊 → food_safety
                    用户：刚喝了两口发现杯壁上有个黑点在动 → food_safety
                    用户：绝了 喝完直接跑厕所跑了三趟 → food_safety
                    用户：避雷！！喝完直接进医院了 → food_safety
                    用户：感觉喝完胃在烧，之前从来没有过 → food_safety
                    用户：外卖撒了一半 怎么搞 → general_knowledge
                    用户：等了四十分钟还没做好 → general_knowledge
                    用户：服务态度太差了 → general_knowledge
                    用户：请问最近的门店在哪里 → ordering
                    
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

    // ── Utility methods ──

    static Pattern[] compilePatterns(String... regexes) {
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

    static boolean matchAny(String text, Pattern[] patterns) {
        for (Pattern p : patterns) {
            if (p.matcher(text).find()) return true;
        }
        return false;
    }

    static String findMatch(String text, Pattern[] patterns) {
        for (Pattern p : patterns) {
            var m = p.matcher(text);
            if (m.find()) return m.group();
        }
        return null;
    }
}
