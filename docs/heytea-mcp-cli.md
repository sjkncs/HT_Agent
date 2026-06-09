# 喜茶 MCP CLI 工具文档

> 版本 1.0.0 | 基于 Model Context Protocol (MCP) Streamable HTTP 协议
>
> 对标 [瑞幸咖啡 MCP 服务](https://open.lkcoffee.com/docs)，适配喜茶茶饮生态

---

## 概述

喜茶 MCP 服务提供 **8 个工具**，覆盖茶饮自助点单全流程：门店查询、商品搜索、茶饮定制、订单管理。采用 **Streamable HTTP** 传输协议，遵循 **JSON-RPC 2.0** 规范。

### 协议说明

| 项目 | 说明 |
|------|------|
| 协议版本 | MCP 2024-11-05 |
| 传输方式 | Streamable HTTP (POST) |
| 数据格式 | JSON-RPC 2.0 |
| 认证方式 | Bearer Token (Authorization header) |
| 响应格式 | JSON / Server-Sent Events (SSE) |

### MCP Server 配置

```json
{
  "mcpServers": {
    "heytea-order": {
      "type": "streamablehttp",
      "url": "https://mcp.heytea.com/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer {YOUR_HEYTEA_MCP_TOKEN}"
      }
    }
  }
}
```

### 通用响应结构

```json
{
  "code": 0,
  "msg": "success",
  "data": { ... },
  "success": true
}
```

错误响应：

```json
{
  "code": 40001,
  "msg": "门店不存在",
  "data": null,
  "success": false
}
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 40001 | 参数错误 |
| 40002 | 门店不存在 |
| 40003 | 商品不存在 |
| 40004 | 门店已休息 |
| 40010 | 订单不存在 |
| 40011 | 订单不可取消（已制作） |
| 50001 | 系统内部错误 |
| 50002 | 服务暂不可用 |

---

## 工具总览

| 序号 | 分类 | 工具名 | 说明 | 瑞幸对应 |
|------|------|--------|------|----------|
| 1 | 门店 | `queryStoreList` | 查询附近门店列表 | `queryShopList` |
| 2 | 商品 | `searchProduct` | 搜索匹配商品 | `searchProductForMcp` |
| 3 | 商品 | `customizeProduct` | 商品属性定制 | `switchProduct` |
| 4 | 商品 | `queryProductDetail` | 查询商品详情 | `queryProductDetailInfo` |
| 5 | 订单 | `previewOrder` | 订单预览 | `previewOrder` |
| 6 | 订单 | `createOrder` | 创建订单 | `createOrder` |
| 7 | 订单 | `queryOrderDetail` | 查询订单详情 | `queryOrderDetailInfo` |
| 8 | 订单 | `cancelOrder` | 取消订单 | `cancelOrder` |

---

## 1. queryStoreList — 查询门店列表

查询附近喜茶门店，支持按名称搜索和按距离排序。

### 入参

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| longitude | number | 是 | 用户经度，如 `113.94441` |
| latitude | number | 是 | 用户纬度，如 `22.52736` |
| storeName | string | 否 | 门店名称关键词 |

### 响应 data (数组)

| 字段 | 类型 | 说明 |
|------|------|------|
| storeId | number | 门店ID |
| storeName | string | 门店名称 |
| address | string | 门店地址 |
| storeTags | string[] | 门店标签：堂食/外卖/24h/新店 |
| longitude | number | 门店经度 |
| latitude | number | 门店纬度 |
| workTimeStart | string | 营业开始时间 |
| workTimeEnd | string | 营业结束时间 |
| businessStatus | number | 1=营业中, 2=休息中, 3=即将打烊 |
| distance | number | 距离 (km) |
| storeNo | string | 门店编号 |
| phone | string | 门店电话 |

### 示例

请求：
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "queryStoreList",
    "arguments": {
      "longitude": 113.94441,
      "latitude": 22.52736
    }
  }
}
```

响应：
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "storeId": 10086,
      "storeName": "喜茶·深圳万象天地店",
      "address": "深圳市南山区深南大道9668号万象天地LG层",
      "storeTags": ["堂食", "外卖"],
      "longitude": 113.94512,
      "latitude": 22.52891,
      "workTimeStart": "10:00",
      "workTimeEnd": "22:00",
      "businessStatus": 1,
      "distance": 0.23,
      "storeNo": "SZ-0086",
      "phone": "0755-88886666"
    }
  ],
  "success": true
}
```

---

## 2. searchProduct — 搜索商品

根据用户查询文本匹配喜茶商品，支持品类搜索、关键词搜索。

### 入参

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| storeId | integer | 是 | 门店ID |
| query | string | 是 | 用户原始查询文本 |

### 响应 data (数组)

| 字段 | 类型 | 说明 |
|------|------|------|
| productId | number | 商品ID |
| productName | string | 商品名称 |
| skuCode | string | 商品SKU编码 |
| pictureUrl | string | 商品图片URL |
| category | string | 分类：芝芝系列/多肉系列/纯茶/果茶/季节限定/小食 |
| description | string | 商品描述 |
| productAttrs | array | 商品属性列表（见下方属性结构） |
| tags | string[] | 标签：新品/热销/限定 |
| initialPrice | number | 面价 (元) |
| estimatePrice | number | 预估到手价 (元) |

### 商品属性结构 (productAttrs)

| 字段 | 类型 | 说明 |
|------|------|------|
| attributeId | number | 属性组ID (1=糖度, 2=冰量, 3=加料, 4=杯型) |
| attributeName | string | 属性组名称 |
| multiSelect | boolean | 是否可多选（加料支持多选） |
| productSubAttrs | array | 属性值列表 |

### 属性值结构 (productSubAttrs)

| 字段 | 类型 | 说明 |
|------|------|------|
| attributeId | number | 属性值ID |
| attributeName | string | 属性值名称 |
| selected | boolean\|null | 是否选中 |
| price | number | 属性加价 (元) |
| canSelected | number\|null | 是否可选 |

### 喜茶特有属性

**糖度** (attributeId=1)：全糖 / 七分糖 / 五分糖 / 三分糖 / 无糖

**冰量** (attributeId=2)：正常冰 / 少冰 / 去冰 / 温 / 热

**加料** (attributeId=3, 可多选)：芝士(+3) / 椰果(+2) / 珍珠(+2) / 芋圆(+3) / 红豆(+2) / 芦荟(+2)

**杯型** (attributeId=4)：中杯 / 大杯(+3)

### 示例

请求：
```json
{
  "params": {
    "name": "searchProduct",
    "arguments": { "storeId": 10086, "query": "多肉葡萄" }
  }
}
```

响应：
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "productId": 2001,
      "productName": "多肉葡萄",
      "skuCode": "HT-2001",
      "category": "多肉系列",
      "description": "手剥巨峰葡萄搭配清新茉莉绿茶底，果肉满满",
      "productAttrs": [
        {
          "attributeId": 1,
          "attributeName": "糖度",
          "multiSelect": false,
          "productSubAttrs": [
            { "attributeId": 101, "attributeName": "全糖", "selected": null, "price": 0 },
            { "attributeId": 102, "attributeName": "七分糖", "selected": null, "price": 0 },
            { "attributeId": 103, "attributeName": "五分糖", "selected": null, "price": 0 },
            { "attributeId": 104, "attributeName": "三分糖", "selected": null, "price": 0 },
            { "attributeId": 105, "attributeName": "无糖", "selected": null, "price": 0 }
          ]
        }
      ],
      "tags": ["热销", "经典"],
      "initialPrice": 29,
      "estimatePrice": 29
    }
  ],
  "success": true
}
```

---

## 3. customizeProduct — 商品属性定制

切换喜茶商品属性（糖度、冰量、加料、杯型），支持加料多选。

### 入参

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| storeId | integer | 是 | 门店ID |
| productId | integer | 是 | 商品ID |
| skuCode | string | 是 | 商品SKU编码 |
| attrOperationParam | object | 是 | 属性切换参数 |
| amount | integer | 是 | 商品数量 |

### attrOperationParam 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| attributeId | integer | 属性组ID (1=糖度, 2=冰量, 3=加料, 4=杯型) |
| subAttr.attributeId | integer | 属性值ID |
| subAttr.operation | integer | 操作类型：3=选中, 1=取消（加料多选时使用取消） |

### 响应 data

与 `searchProduct` 中的商品结构相同，属性值反映切换后的选中状态。

### 示例

请求（选择五分糖）：
```json
{
  "params": {
    "name": "customizeProduct",
    "arguments": {
      "storeId": 10086,
      "productId": 2001,
      "skuCode": "HT-2001",
      "attrOperationParam": {
        "attributeId": 1,
        "subAttr": { "attributeId": 103, "operation": 3 }
      },
      "amount": 1
    }
  }
}
```

---

## 4. queryProductDetail — 查询商品详情

查询喜茶商品完整详情，包含原料、过敏原、营养信息。

### 入参

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| storeId | integer | 是 | 门店ID |
| productId | integer | 是 | 商品ID |

### 响应 data

| 字段 | 类型 | 说明 |
|------|------|------|
| productId | number | 商品ID |
| productName | string | 商品名称 |
| skuCode | string | SKU编码 |
| pictureUrl | string | 图片URL |
| category | string | 分类 |
| description | string | 商品描述 |
| ingredients | string[] | 原料成分 |
| allergens | string[] | 过敏原信息 |
| nutritionInfo | object | 营养信息 {calories, sugar, caffeine} |
| productAttrs | array | 属性列表 |
| tags | string[] | 标签 |
| initialPrice | number | 面价 |
| estimatePrice | number | 预估到手价 |

### 示例

```json
{
  "params": {
    "name": "queryProductDetail",
    "arguments": { "storeId": 10086, "productId": 2001 }
  }
}
```

---

## 5. previewOrder — 订单预览

预览订单明细、价格计算、预计取餐时间。

### 入参

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| storeId | integer | 是 | 门店ID |
| productList | array | 是 | 商品列表 [{amount, productId, skuCode}] |
| pickupType | string | 否 | self_pickup / delivery |

### 响应 data

| 字段 | 类型 | 说明 |
|------|------|------|
| aboutTime | number | 预计取餐时间戳 (ms) |
| estimatedWaitMinutes | number | 预计等待分钟 |
| discountPrice | number | 实付金额 |
| totalInitialPrice | number | 商品总面价 |
| privilegeMoney | number | 优惠金额 |
| deliveryFee | number | 配送费 (外卖) |
| pickupType | string | 取餐方式 |
| storeInfo | object | 门店信息 |
| productInfoList | array | 商品明细 |
| couponCodeList | string[] | 优惠券编码 |

### 示例

请求：
```json
{
  "params": {
    "name": "previewOrder",
    "arguments": {
      "storeId": 10086,
      "productList": [
        { "amount": 1, "productId": 2001, "skuCode": "HT-2001-003" }
      ],
      "pickupType": "self_pickup"
    }
  }
}
```

---

## 6. createOrder — 创建订单

创建喜茶订单，返回支付链接和二维码。

### 入参

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| storeId | integer | 是 | 门店ID |
| productList | array | 是 | 商品列表 |
| longitude | number | 是 | 用户经度 |
| latitude | number | 是 | 用户纬度 |
| couponCodeList | string[] | 否 | 优惠券列表 |
| pickupType | string | 否 | self_pickup / delivery |
| remark | string | 否 | 订单备注，如"少放冰" |

### 响应 data

| 字段 | 类型 | 说明 |
|------|------|------|
| orderId | number | 订单ID |
| orderIdStr | string | 字符串订单ID |
| payOrderUrl | string | 微信支付URL |
| payOrderQrCodeUrl | string | 支付二维码链接 |
| discountPrice | number | 实付金额 |
| needPay | boolean | 是否需要支付 |
| tradeNo | string\|null | 交易号 |

---

## 7. queryOrderDetail — 查询订单详情

查询订单状态、取餐码、商品明细。

### 入参

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orderId | string | 是 | 订单ID |

### 响应 data

| 字段 | 类型 | 说明 |
|------|------|------|
| orderId | string | 订单ID |
| orderStatus | number | 订单状态（见下表） |
| orderStatusName | string | 状态名称 |
| aboutTime | number | 预计取餐时间戳 |
| takeMealTime | string | 实际取餐时间 |
| takeMealCodeInfo | object | 取餐码信息 |
| takeMealCodeInfo.code | string | 取餐码 |
| takeMealCodeInfo.shelfNo | string | 取餐架编号 |
| takeMealCodeInfo.takeOrderId | string | 取餐单ID |
| storeInfo | object | 门店信息 |
| productInfoList | array\|null | 商品明细 |
| orderPayAmount | number | 支付金额 |
| pickupType | string | 取餐方式 |
| dispatchInfo | object | 配送信息 (外卖) |
| remark | string | 订单备注 |

### 订单状态码

| 状态码 | 名称 | 说明 |
|--------|------|------|
| 10 | 待付款 | 订单已创建，等待支付 |
| 20 | 已接单 | 已支付，门店已接单 |
| 30 | 制作中 | 饮品正在制作 |
| 40 | 待取餐 | 制作完成，等待取餐 |
| 50 | 配送中 | 外卖订单正在配送 |
| 80 | 已完成 | 订单已完成 |
| 100 | 已取消 | 订单已取消 |

---

## 8. cancelOrder — 取消订单

取消喜茶订单。制作前可免费取消，制作中需门店审核。

### 入参

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orderId | string | 是 | 订单ID |
| cancelReason | string | 否 | 取消原因 |

### 响应 data

| 字段 | 类型 | 说明 |
|------|------|------|
| success | boolean | 是否取消成功 |
| refundAmount | number | 退款金额 |
| needReview | boolean | 是否需要门店审核 |
| message | string | 取消结果说明 |

---

## 点单全流程

```
用户                    AI (阿喜)                MCP Server
 |                        |                         |
 | "我想点杯多肉葡萄"     |                         |
 |----------------------->|                         |
 |                        | searchProduct           |
 |                        |------------------------>|
 |                        |   返回商品列表           |
 |                        |<------------------------|
 | "推荐了多肉葡萄..."    |                         |
 |<-----------------------|                         |
 |                        |                         |
 | "五分糖，少冰"         |                         |
 |----------------------->|                         |
 |                        | customizeProduct        |
 |                        |------------------------>|
 |                        |   返回定制后详情         |
 |                        |<------------------------|
 | "已为您定制..."        |                         |
 |<-----------------------|                         |
 |                        |                         |
 | "好的，下单吧"         |                         |
 |----------------------->|                         |
 |                        | previewOrder            |
 |                        |------------------------>|
 |                        |   返回订单预览           |
 |                        |<------------------------|
 | "订单预览：¥29..."     |                         |
 |<-----------------------|                         |
 |                        |                         |
 | "确认"                 |                         |
 |----------------------->|                         |
 |                        | createOrder             |
 |                        |------------------------>|
 |                        |   返回支付链接           |
 |                        |<------------------------|
 | "订单已创建，请支付"   |                         |
 |<-----------------------|                         |
 |                        |                         |
 | "查一下订单状态"       |                         |
 |----------------------->|                         |
 |                        | queryOrderDetail        |
 |                        |------------------------>|
 |                        |   返回订单详情+取餐码    |
 |                        |<------------------------|
 | "取餐码 A086..."       |                         |
 |<-----------------------|                         |
```

---

## 与瑞幸 MCP 的差异对照

| 差异点 | 瑞幸咖啡 | 喜茶 |
|--------|----------|------|
| **商品属性** | 温度(热/冰)、杯型(大杯/超大杯) | 糖度(5档)、冰量(5档)、加料(6+种,可多选)、杯型(中杯/大杯) |
| **商品分类** | 咖啡为主（拿铁/美式/特调） | 茶饮为主（芝芝/多肉/纯茶/果茶/季节限定） |
| **门店标签** | deptTags 通用标签 | storeTags 含堂食/外卖/24h + businessStatus 营业状态 |
| **取餐方式** | 默认自取 | 显式 pickupType: self_pickup / delivery |
| **订单状态** | 6个状态 (10/20/30/60/80/100) | 7个状态 (新增 40=待取餐, 50=配送中) |
| **取消策略** | 直接取消 | 制作前免费取消, 制作中需审核, 增加 cancelReason |
| **取餐信息** | 取餐码 + 取餐单ID | 取餐码 + 取餐架编号(shelfNo) + 取餐单ID |
| **商品详情** | 基础属性+价格 | 增加 description, ingredients, allergens, nutritionInfo |
| **加料多选** | 无 | 加料属性组支持 multiSelect=true |

---

## 集成指南

### 在 Cursor 中配置

1. 打开 Cursor Settings → MCP
2. 添加 MCP Server：

```json
{
  "mcpServers": {
    "heytea-order": {
      "type": "streamablehttp",
      "url": "https://mcp.heytea.com/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}
```

3. 在对话中直接说"帮我点一杯多肉葡萄"即可触发点单流程

### 在 Claude Desktop 中配置

编辑 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "heytea-order": {
      "type": "streamablehttp",
      "url": "https://mcp.heytea.com/api/v1/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}
```

### 在 React 项目中集成

```javascript
import { configureMCP, searchProduct, createOrder } from './lib/mcp-client'

// 配置
configureMCP({
  serverUrl: 'https://mcp.heytea.com/api/v1/mcp',
  token: 'YOUR_TOKEN_HERE',
  useMock: false,  // 接入真实 API 时设为 false
})

// 搜索商品
const products = await searchProduct({ storeId: 10086, query: '多肉葡萄' })

// 创建订单
const order = await createOrder({
  storeId: 10086,
  productList: [{ amount: 1, productId: 2001, skuCode: 'HT-2001-003' }],
  longitude: 113.94441,
  latitude: 22.52736,
})
```

---

## 项目文件结构

```
react-vite/src/
├── lib/
│   ├── mcp-client.js              # MCP 客户端封装
│   ├── heytea-mock-data.js        # Mock 数据（门店/商品/订单）
│   └── mcp-prompt-integration.js  # AI 对话-点单集成
├── components/
│   └── order/
│       └── OrderingPanel.jsx      # 自助点单面板 UI
└── data/
    └── heytea-mcp-tools.json      # 工具定义 JSON Schema
```

---

*文档版本 1.0.0 | 最后更新: 2026-06-09*
