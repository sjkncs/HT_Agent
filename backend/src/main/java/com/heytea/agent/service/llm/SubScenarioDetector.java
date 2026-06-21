package com.heytea.agent.service.llm;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

import static com.heytea.agent.service.llm.IntentClassifier.*;

/**
 * Sub-scenario detector — second-level classification within each intent.
 * Extracted from LLMServiceImpl for single-responsibility.
 */
@Slf4j
@Component
public class SubScenarioDetector {

    /**
     * Detect sub-scenario based on intent type.
     */
    public String detect(String userMessage, String intent) {
        if (userMessage == null || userMessage.isBlank()) return null;
        return switch (intent) {
            case "food_safety" -> detectFoodSafety(userMessage);
            case "ordering" -> detectOrdering(userMessage);
            default -> detectGeneral(userMessage);
        };
    }

    private String detectFoodSafety(String msg) {
        if (matchAny(msg, compilePatterns(
                "(拉肚子|腹泻|拉稀|呕吐|过敏|头晕|发烧|肚子疼|肚子痛|上吐下泻|身体不适|不舒服|食物中毒|皮疹|胃)",
                "(拉.*肚子|肚子.*拉|肚子.*不舒服|肚子.*疼|肚子.*痛|身体.*不适|起疹|嘴.*肿|疯狂拉|一直拉|不停拉)")
        )) return "body_discomfort";

        if (matchAny(msg, compilePatterns(
                "(变质|发霉|过期|馊|变酸|发臭|腐|保质期|临期|有效期|不.{0,2}新鲜)")))
            return "spoilage";

        if (matchAny(msg, compilePatterns(
                "(异物|头发|毛发|根毛|有毛|塑料|金属|玻璃|虫|苍蝇|蟑螂|纸片|线头|棉絮|不明物|黑的|封口标签|封口贴|双眼皮贴|创可贴|指甲|胶体|黑色.*物)",
                "(有个.{0,2}东西|有个.{0,2}啥|有个.{0,2}什么|里面有.{0,2}东西|里有这个|有这个|里有.{0,2}个)",
                "(喝出来|吸出来|吸.*出来|吃出.*色|里边.*个|圆片|片片|杯底.*盖|杯底.*东西)")
        )) return "foreign_object_external";

        if (matchAny(msg, compilePatterns(
                "(果核|籽|茶渣|果皮|果肉|柠檬皮|柠檬籽|芒果核|芒果皮|葡萄皮|百香果籽|橙皮|纤维|有.{0,3}皮|去皮|太.{0,3}皮|皮.*太.{0,3}多|有茶叶|茶渣|有渣|全是渣|都是渣|有渣|有核|有籽)")))
            return "foreign_object_internal";

        if (matchAny(msg, compilePatterns(
                "(异味|怪味|味道不对|味道也不对|一股味道|有股|酸酸的|酸了|恶心|发苦|是苦的|苦味|涩味|发涩|消毒水味|味道不佳|味淡|味道淡|没味道|变淡|味道变了|板蓝根味|味道.{0,3}奇怪|味道.{0,2}不对)")))
            return "taste_issue";

        return "general_food_safety";
    }

    private String detectGeneral(String msg) {
        if (matchAny(msg, IntentClassifier.getServiceComplaintPatterns())) return "service_complaint";
        if (matchAny(msg, IntentClassifier.getDeliveryIssuePatterns())) return "delivery_issue";
        if (matchAny(msg, IntentClassifier.getEfficiencyPatterns())) return "efficiency";
        if (matchAny(msg, IntentClassifier.getProductQualityPatterns())) return "product_quality";
        if (matchAny(msg, IntentClassifier.getPackagingPatterns())) return "packaging";
        if (matchAny(msg, IntentClassifier.getHygienePatterns())) return "hygiene";
        return null;
    }

    private String detectOrdering(String msg) {
        if (matchAny(msg, compilePatterns("(推荐|有什么|什么好喝|热门|新品)"))) return "recommendation";
        if (matchAny(msg, compilePatterns("(确认|下单|购买|来一|要一)"))) return "place_order";
        if (matchAny(msg, IntentClassifier.getStoreInfoPatterns()) || matchAny(msg, compilePatterns(
                "(地址|门店|在哪|几点|营业|开门|关门|打烊|停车|车位|座位|哪些店|哪家店|最近的店|洗手间|卫生间|wifi|WiFi)")))
            return "store_info";
        return "browse_menu";
    }
}
