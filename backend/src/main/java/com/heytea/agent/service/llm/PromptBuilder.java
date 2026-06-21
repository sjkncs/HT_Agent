package com.heytea.agent.service.llm;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Dynamic system prompt assembler — builds intent-specific prompts
 * with sub-scenario guidance and product catalog context.
 * Extracted from LLMServiceImpl for single-responsibility.
 */
@Slf4j
@Component
public class PromptBuilder {

    private final ObjectMapper objectMapper;
    private Map<String, Map<String, Object>> productCatalog;

    public PromptBuilder(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    @SuppressWarnings("unchecked")
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("data/product-knowledge-catalog.json");
            InputStream is = resource.getInputStream();
            String json = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            Map<String, Object> raw = objectMapper.readValue(json, new TypeReference<>() {});
            productCatalog = (Map<String, Map<String, Object>>) raw.get("products");
            log.info("Product catalog loaded: {} products", productCatalog.size());
        } catch (Exception e) {
            log.warn("Failed to load product-knowledge-catalog.json: {}", e.getMessage());
            productCatalog = Map.of();
        }
    }

    /**
     * Build the complete system prompt for the given intent + sub-scenario.
     */
    public String build(String intent, String subScenario, String userMessage) {
        StringBuilder sb = new StringBuilder();

        sb.append("你是喜茶智能客服助手「阿喜」。\n\n");

        switch (intent) {
            case "food_safety" -> buildFoodSafety(sb, subScenario);
            case "ordering" -> buildOrdering(sb, subScenario, userMessage);
            default -> buildGeneral(sb, subScenario);
        }

        sb.append("\n【回复质量要求 — 必须遵守】\n");
        sb.append("1. 回复必须针对用户提到的具体问题，提及具体产品名称和问题细节\n");
        sb.append("2. 禁止使用通用模板，必须有针对性内容\n");
        sb.append("3. 回复字数不少于30字，建议80-150字\n");
        sb.append("4. 称呼只用\"您好\"，禁止使用\"亲\"/\"亲爱的\"/\"宝\"\n");
        sb.append("5. 禁止反问句、禁止使用感叹号、禁止负面词汇\n");
        sb.append("6. 正面评价→感谢，负面投诉→致歉+解决方案\n");
        sb.append("7. 回复必须是纯文本，不包含JSON/XML/元数据/内部信息\n");

        return sb.toString();
    }

    // ── Food Safety prompt ──

    private void buildFoodSafety(StringBuilder sb, String sub) {
        sb.append("食品安全是喜茶的生命线，你必须以最高优先级处理每一个食安问题。\n\n");
        sb.append("【核心处理流程 — 4步法】\n");
        sb.append("第1步 — 立即共情致歉\n第2步 — 收集关键信息\n第3步 — 明确承诺：24小时专人跟进，72小时初步结果\n第4步 — 补偿引导\n\n");

        switch (sub) {
            case "body_discomfort" -> {
                sb.append("【当前场景：身体不适 — 最高紧急级别】\n");
                sb.append("- 第一句话关心身体状况\n- 建议立即就医并保留凭证\n- 医疗费用公司负责\n");
            }
            case "spoilage" -> {
                sb.append("【当前场景：变质/过期 — 严重级别】\n");
                sb.append("- 确认是否已饮用\n- 请求产品照片\n- 已通知门店排查同批次原料\n");
            }
            case "foreign_object_external" -> {
                sb.append("【当前场景：外源性异物 — 高级别】\n");
                sb.append("- 请求保留异物和饮品\n- 请求照片\n- 立即联系门店排查\n");
            }
            case "foreign_object_internal" -> {
                sb.append("【当前场景：内源性异物 — 中级别】\n");
                sb.append("- 可能是制作过程未完全过滤\n- 已反馈门店加强品控\n- 可邀请重新制作\n");
            }
            case "taste_issue" -> {
                sb.append("【当前场景：异味/口感异常 — 中级别】\n");
                sb.append("- 详细记录具体味道\n- 反馈门店品控团队核查\n");
            }
            default -> sb.append("【食品安全综合处理】\n- 先共情安抚，再收集信息\n");
        }

        sb.append("\n【注意事项】\n");
        sb.append("- 绝不推卸责任\n- 门店联系：\"诚邀您联系门店，电话可在小程序门店详情中查看\"\n");
    }

    // ── Ordering prompt ──

    private void buildOrdering(StringBuilder sb, String sub, String userMessage) {
        sb.append("你的核心职责是帮助用户完成点单流程。\n\n");
        sb.append("【产品分类 — 5大类】\n");
        sb.append("1. 茶特调/茗茶 2. 植物茶/鲜果茶 3. 苦巧/抹茶/波波茶 4. 灵感茶点 5. 咖啡/经典/小料\n\n");
        sb.append("【定制选项】\n");
        sb.append("- 糖度：全糖/七分/五分/三分/无糖\n- 加料：芝士+¥3、椰果+¥2等\n- 杯型：中杯/大杯+¥3\n\n");

        appendRelevantProducts(sb, userMessage);

        sb.append("【回复规范】\n- 主动推荐2-3款热门饮品\n- 确认后询问定制偏好\n- 完成后汇总确认\n");
    }

    @SuppressWarnings("unchecked")
    private void appendRelevantProducts(StringBuilder sb, String userMessage) {
        if (productCatalog == null || productCatalog.isEmpty()) {
            appendFallbackProducts(sb);
            return;
        }

        String msg = userMessage != null ? userMessage.toLowerCase() : "";
        List<Map.Entry<String, Integer>> scored = new ArrayList<>();

        for (var entry : productCatalog.entrySet()) {
            String name = entry.getKey();
            Map<String, Object> product = entry.getValue();
            int score = 0;

            if (msg.contains(name.toLowerCase())) score += 10;
            Object category = product.get("category");
            if (category instanceof String cat && msg.contains(cat.toLowerCase())) score += 5;

            Object tagsObj = product.get("tags");
            if (tagsObj instanceof Map<?, ?> tagsMap) {
                for (var tagEntry : tagsMap.entrySet()) {
                    Object val = tagEntry.getValue();
                    if (val instanceof String tagStr && !tagStr.isBlank() && msg.contains(tagStr.toLowerCase())) score += 3;
                }
            }

            if (score > 0) scored.add(Map.entry(name, score));
        }

        scored.sort((a, b) -> b.getValue() - a.getValue());
        var relevant = scored.subList(0, Math.min(8, scored.size()));

        if (relevant.isEmpty()) {
            appendFallbackProducts(sb);
            return;
        }

        sb.append("【相关产品推荐】\n");
        for (var entry : relevant) {
            String name = entry.getKey();
            Map<String, Object> product = productCatalog.get(name);
            Object pricing = product.get("pricing");
            int price = 0;
            if (pricing instanceof Map<?, ?> pm && pm.get("base") instanceof Number n) price = n.intValue();
            Object descObj = product.get("description");
            String shortDesc = "";
            if (descObj instanceof Map<?, ?> dm && dm.get("short") instanceof String sd) shortDesc = sd;
            sb.append("- ").append(name).append(" ¥").append(price).append(" — ").append(shortDesc).append("\n");
        }
        sb.append("\n");
    }

    private void appendFallbackProducts(StringBuilder sb) {
        sb.append("【热门饮品推荐】\n");
        sb.append("- 多肉葡萄 ¥29 — 经典必点\n- 芝芝多肉葡萄 ¥31\n- 烤黑糖波波牛乳茶 ¥25\n");
        sb.append("- 满杯红柚 ¥29\n- 小奶茉 ¥16\n- 芒椰糯米饭 ¥29\n\n");
    }

    // ── General prompt ──

    private void buildGeneral(StringBuilder sb, String sub) {
        sb.append("你是喜茶的全能客服助手，可以处理各类咨询和投诉。\n\n");

        if (sub == null) {
            sb.append("【能力范围】\n- 门店查询\n- 会员/积分/优惠\n- 活动/新品\n- 配送/取餐\n\n");
            sb.append("【回复规范】\n- 专业友好\n- 不确定时引导官方渠道\n- 简洁，3-4句话\n");
            return;
        }

        switch (sub) {
            case "service_complaint" -> {
                sb.append("【服务投诉】\n1. 致歉\n2. 表明重视\n3. 承诺改进\n4. 引导联系\n");
            }
            case "delivery_issue" -> {
                sb.append("【外卖/配送问题】\n1. 致歉\n2. 针对问题给方案\n3. 已反馈配送团队\n4. 引导平台售后\n");
            }
            case "product_quality" -> {
                sb.append("【产品品质问题】\n1. 致歉+具体产品\n2. 解释或建议\n3. 已反馈门店\n4. 可重新制作\n");
            }
            case "efficiency" -> {
                sb.append("【制作效率/等候】\n1. 致歉\n2. 解释高峰\n3. 建议小程序查进度\n4. 已反馈优化\n");
            }
            case "packaging" -> sb.append("【包装问题】\n1. 致歉\n2. 已反馈品控\n3. 不同杯型说明\n");
            case "hygiene" -> sb.append("【卫生问题】\n1. 致歉\n2. 已反馈整改\n3. 严格巡检制度\n");
            default -> sb.append("【通用咨询】\n- 专业友好\n- 简洁回复\n");
        }
    }
}
