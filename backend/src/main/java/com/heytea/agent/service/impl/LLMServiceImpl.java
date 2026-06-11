package com.heytea.agent.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.heytea.agent.dto.ChatResponse;
import com.heytea.agent.entity.Message;
import com.heytea.agent.service.LLMService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

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

    private static final Map<String, String> SYSTEM_PROMPTS = Map.of(
            "ordering",
            """
            你是喜茶智能点单助手「阿喜」。你的核心职责是帮助用户完成点单流程。
            
            能力范围：
            - 浏览菜单、推荐当季热门饮品
            - 确认饮品名称、规格（杯型/甜度/冰量）和数量
            - 查询门店地址和配送范围
            - 确认订单、模拟下单流程
            
            回复规范：
            1. 主动推荐 2-3 款当季热门饮品
            2. 用户确认饮品后，主动询问规格偏好
            3. 点单完成后，汇总确认订单信息
            4. 用友好、活泼的语气回复，适当使用喜茶品牌调性
            """,
            "general_knowledge",
            """
            你是喜茶智能客服助手「阿喜」。你可以回答关于喜茶品牌的一般性问题。
            
            能力范围：
            - 门店查询（地址、营业时间、联系方式）
            - 会员制度、积分规则、会员等级
            - 优惠活动、新品资讯、联名活动
            - 配送方式、取餐方式
            - 品牌故事、企业文化
            
            回复规范：
            1. 用专业、友好的语气回复
            2. 如果不确定具体信息，建议用户通过喜茶小程序或官方渠道确认
            3. 可以适当推荐相关饮品或活动
            4. 回复简洁，不超过 3-4 句话
            """,
            "food_safety",
            """
            你是喜茶食品安全专员助手。食品安全是喜茶的生命线，你必须以最高优先级处理每一个食安问题。
            
            【核心处理流程】
            1. 立即表达关切和歉意 — 让用户感受到被重视
            2. 收集关键信息（按优先级）：
               - 问题类型：异物/变质/过敏/卫生/其他
               - 购买渠道：门店堂食/外卖/小程序
               - 购买时间和门店
               - 问题详细描述（异物外观、气味异常等）
               - 是否已造成身体不适
            3. 告知处理承诺：
               - 24 小时内专人跟进
               - 72 小时内给出初步调查结果
               - 提供工单号供后续查询
            4. 补偿方案引导：
               - 退款处理
               - 就医费用报销（如有身体不适）
               - 额外补偿券
            
            【注意事项】
            - 绝不推卸责任或质疑用户的描述
            - 如用户情绪激动，先安抚再收集信息
            - 如涉及人身安全（过敏/身体不适），建议立即就医并保留就医凭证
            - 所有信息将用于内部品质改进追溯
            """
    );

    private static final String DEFAULT_SYSTEM_PROMPT =
            "你是喜茶智能客服助手，可以帮助用户处理点单、咨询和投诉等问题。请用友好、专业的语气回复。";

    public LLMServiceImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder().build();
    }

    @Override
    public ChatResponse chat(String conversationId, String userMessage, String intent, List<Message> history) {
        long startTime = System.currentTimeMillis();

        try {
            // Build message list for the LLM
            List<Map<String, String>> messages = new ArrayList<>();

            // System prompt based on intent
            String systemPrompt = SYSTEM_PROMPTS.getOrDefault(intent, DEFAULT_SYSTEM_PROMPT);
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

            log.debug("LLM request: model={}, messages={}, conversationId={}", model, messages.size(), conversationId);

            // Call DashScope compatible API
            String responseBody = webClient.post()
                    .uri(baseUrl + "/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBodyJson)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(TIMEOUT)
                    .block();

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

            @SuppressWarnings("unchecked")
            Map<String, Object> usage = (Map<String, Object>) responseMap.get("usage");
            int tokenCount = 0;
            if (usage != null && usage.containsKey("total_tokens")) {
                tokenCount = ((Number) usage.get("total_tokens")).intValue();
            }

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
            return buildFallbackResponse(conversationId, latencyMs);
        }
    }

    // ── 关键词快速通道：食安信号词（命中即返回 food_safety）──
    private static final String[] FOOD_SAFETY_KEYWORDS = {
            // 异物类
            "异物", "头发", "塑料", "金属", "玻璃", "虫", "苍蝇", "蟑螂", "纸片", "线头",
            "果核", "籽", "茶渣", "果皮", "果肉", "沉淀", "纤维", "颗粒物",
            "柠檬皮", "柠檬籽", "黑黑的", "黑的", "不明物", "有虫子", "喝出虫", "喝出头发",
            "喝出皮", "吃出异物", "封口标签", "封口贴", "喝出来", "吸出来",
            // 身体不适类
            "拉肚子", "腹泻", "呕吐", "过敏", "恶心", "头晕", "发烧", "不舒服",
            "肚子疼", "肚子痛", "上吐下泻", "拉肚", "吃完不舒服", "喝了以后",
            // 变质/异味类
            "变质", "发霉", "过期", "馊", "酸了", "酸酸的", "异味", "怪味",
            "饮品异味", "味道不对", "一股味道", "有股", "地沟油", "品控", "品质问题",
            // 投诉/维权类
            "退款", "赔偿", "补偿", "投诉", "曝光", "差评", "给我一个说法",
            // 包装/卫生类
            "包装破", "漏杯", "撒了", "封口不严",
            "食安", "食品安全", "卫生问题", "不干净", "脏",
            // 英文
            "foreign object", "refund", "sick", "allergic", "contaminated",
            "hair", "mold", "expired", "dirty"
    };

    // ── 关键词快速通道：点单信号词（命中即返回 ordering）──
    // 注意：不包含产品名称（多肉葡萄、芝芝莓莓等），避免产品名出现在食安投诉中时误判
    private static final String[] ORDERING_KEYWORDS = {
            "点单", "下单", "点一杯", "来一杯", "买一杯", "要一杯", "我想点",
            "推荐饮品", "推荐喝", "菜单", "看看菜单", "有什么喝的",
            "甜度", "冰量", "少冰", "去冰", "几分糖", "加料",
            "确认订单", "订单确认", "配送地址", "送到", "自提",
            "order", "menu", "recommend drink", "place order",
            "how much", "price", "size"
    };

    @Override
    public String classifyIntent(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return "general_knowledge";
        }
        String lowerMsg = userMessage.toLowerCase();

        // ── Phase 1: 关键词快速通道（毫秒级） ──
        // 食安优先级高于点单（安全问题必须第一时间进入食安通道）
        for (String kw : FOOD_SAFETY_KEYWORDS) {
            if (lowerMsg.contains(kw.toLowerCase())) {
                log.info("Keyword fast-path: food_safety (matched: {})", kw);
                return "food_safety";
            }
        }
        for (String kw : ORDERING_KEYWORDS) {
            if (lowerMsg.contains(kw.toLowerCase())) {
                log.info("Keyword fast-path: ordering (matched: {})", kw);
                return "ordering";
            }
        }

        // ── Phase 2: LLM 增强分类（关键词未命中时使用） ──
        try {
            String classificationPrompt = """
                    你是喜茶客服意图分类器。请根据用户消息判断其意图类别。
                    
                    【分类规则】
                    1. food_safety（食品安全）— 最高优先级
                       用户反馈饮品中有异物、变质、导致身体不适、要求退款赔偿、投诉品质问题
                       关键词信号：异物/头发/虫子/拉肚子/过敏/变质/退款/投诉/不干净
                    
                    2. ordering（点单）
                       用户想要点饮品、查看菜单、推荐饮品、修改/查询订单、询问价格规格
                       关键词信号：点单/下单/来一杯/菜单/推荐/甜度/冰量/多少钱
                    
                    3. general_knowledge（通用咨询）
                       用户询问门店信息、营业时间、会员制度、优惠活动、品牌故事等
                       关键词信号：门店/在哪/几点/会员/积分/优惠/活动/新品
                    
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
                    log.info("LLM classified intent: {} (raw: {})", result, result);
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

    /**
     * Build a fallback ChatResponse when the LLM call fails.
     */
    private ChatResponse buildFallbackResponse(String conversationId, long latencyMs) {
        return ChatResponse.builder()
                .conversationId(conversationId)
                .messageId(UUID.randomUUID().toString())
                .content("抱歉，系统暂时无法响应，请稍后再试或转接人工客服。")
                .intent("unknown")
                .role("assistant")
                .metadata(Map.of("error", "LLM call failed", "fallback", true))
                .latencyMs(latencyMs)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
