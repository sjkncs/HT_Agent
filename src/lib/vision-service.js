/**
 * 视觉服务 (Vision Service)
 * 移植自 deepseek-vision/app/vision.py
 *
 * 将图片内容通过 OpenAI 兼容的视觉 API 转换为文字描述，
 * 使纯文本 LLM 也能"理解"用户上传的图片。
 *
 * 支持场景：产品照片分析、小票OCR、食品安全问题拍照等
 */

// ── 配置 ──
const VISION_CONFIG = {
  // 默认使用阿里云 DashScope (qwen-vl) 或可配置为 GPT-4o / GLM-4V 等
  // 默认使用 Vite 代理避免 CORS（/api/vision → DashScope）
  baseUrl: '/api/vision',
  apiKey: '',        // API Key
  model: 'qwen-vl-max', // 视觉模型名称
  maxImages: 5,      // 单次请求最大图片数
  prompt: '请详细描述这张图片的内容，包括：主体物品、文字内容（如有）、颜色、布局。如果是食品相关，请特别关注食品的外观、包装、标签等信息。',
  timeout: 30000,    // 超时时间(ms)
}

/**
 * 更新视觉服务配置
 */
export function configureVision(config) {
  Object.assign(VISION_CONFIG, config)
}

/**
 * 检查视觉服务是否已配置
 */
export function isVisionEnabled() {
  return !!(VISION_CONFIG.baseUrl && VISION_CONFIG.apiKey && VISION_CONFIG.model)
}

/**
 * 将单张图片发送给视觉 API，获取文字描述
 * @param {string} imageData - base64 编码的图片数据
 * @param {string} mediaType - MIME 类型 (image/png, image/jpeg 等)
 * @param {string|null} imageUrl - 图片 URL（与 imageData 二选一）
 * @param {number} index - 图片序号
 * @returns {Promise<string>} 图片描述文本
 */
async function describeImage(imageData, mediaType, imageUrl, index) {
  const { baseUrl, apiKey, model, prompt, timeout } = VISION_CONFIG
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`

  let imageContent
  if (imageUrl) {
    imageContent = { type: 'image_url', image_url: { url: imageUrl } }
  } else {
    const mtype = mediaType || 'image/jpeg'
    imageContent = {
      type: 'image_url',
      image_url: { url: `data:${mtype};base64,${imageData}` },
    }
  }

  const body = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          imageContent,
        ],
      },
    ],
    max_tokens: 1024,
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (err) {
    console.warn(`[Vision] 图片 ${index} 描述失败:`, err.message)
    return `[图片 ${index}: 描述暂不可用]`
  }
}

/**
 * 处理消息列表中的所有图片，将其替换为文字描述
 *
 * @param {Array} messages - 聊天消息列表 (OpenAI 格式)
 * @returns {Promise<Array>} 处理后的消息列表（图片 → 文字描述）
 */
export async function processImagesInMessages(messages) {
  if (!isVisionEnabled()) return messages

  // 扫描所有消息中的图片
  const imageEntries = []
  const processedMessages = JSON.parse(JSON.stringify(messages)) // deep clone

  for (let msgIdx = 0; msgIdx < processedMessages.length; msgIdx++) {
    const msg = processedMessages[msgIdx]
    if (!Array.isArray(msg.content)) continue

    for (let blockIdx = 0; blockIdx < msg.content.length; blockIdx++) {
      const block = msg.content[blockIdx]
      if (block.type === 'image_url' || block.type === 'image') {
        const imageUrl = block.image_url?.url || block.source?.url || null
        const imageData = block.source?.data || null
        const mediaType = block.source?.media_type || null

        imageEntries.push({
          msgIdx,
          blockIdx,
          imageData,
          mediaType,
          imageUrl,
          imageIndex: imageEntries.length + 1,
        })
      }
    }
  }

  if (imageEntries.length === 0) return processedMessages

  // 限制处理数量
  const toDescribe = imageEntries.slice(0, VISION_CONFIG.maxImages)

  console.log(`[Vision] 处理 ${toDescribe.length} 张图片 (模型: ${VISION_CONFIG.model})`)

  // 并行描述所有图片
  const captions = await Promise.all(
    toDescribe.map(img =>
      describeImage(img.imageData, img.mediaType, img.imageUrl, img.imageIndex)
    )
  )

  // 替换图片 block 为文字 block
  for (let i = 0; i < toDescribe.length; i++) {
    const img = toDescribe[i]
    const caption = captions[i]
    processedMessages[img.msgIdx].content[img.blockIdx] = {
      type: 'text',
      text: `[图片 ${img.imageIndex}] ${caption}`,
    }
  }

  return processedMessages
}

/**
 * 快捷方法：分析单张图片并返回描述
 * @param {File|Blob} file - 图片文件
 * @returns {Promise<string>} 图片描述
 */
export async function analyzeImage(file) {
  if (!isVisionEnabled()) {
    throw new Error('视觉服务未配置，请先设置 VISION_API_KEY 和 VISION_BASE_URL')
  }

  const base64 = await fileToBase64(file)
  const mediaType = file.type || 'image/jpeg'
  return describeImage(base64, mediaType, null, 1)
}

/**
 * 将 File/Blob 转为 base64 字符串（不含 data: 前缀）
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      // 去掉 "data:image/xxx;base64," 前缀
      const base64 = result.split(',')[1] || result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 为喜茶场景定制的图片分析提示
 */
export const HEYTEA_VISION_PROMPTS = {
  product: '这是喜茶的饮品或食品照片。请描述产品名称、外观、配料（可见的）、杯型大小、是否有异常（如异物、变色等）。',
  receipt: '这是一张小票或订单截图。请提取所有文字信息：门店名称、订单号、商品列表、价格、时间、取餐码等。',
  complaint: '这是一张食品安全相关照片。请详细描述问题：异物类型、变质迹象、包装破损、卫生问题等，用于客诉处理。',
  general: '请详细描述这张图片的内容，包括主体物品、文字内容（如有）、颜色、布局。如果是食品相关，请特别关注食品的外观和状态。',
}
