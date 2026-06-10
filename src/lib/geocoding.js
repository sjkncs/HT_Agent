/**
 * 地理编码服务 — 文字地址 → 坐标 / 门店搜索
 *
 * 解决"用户给文字地址，工具需要经纬度"的桥梁问题。
 * Mock 模式下通过本地门店数据做关键词模糊匹配。
 * 真实模式下调用地图 API（高德/腾讯）做地理编码。
 */

// ─── 配置 ───
const GEO_CONFIG = {
  provider: 'mock', // 'mock' | 'amap' | 'tencent'
  apiKey: '',       // 地图 API key（amap/tencent 模式需要）
  timeout: 5000,
}

/**
 * 配置地理编码服务
 * @param {Object} config - { provider, apiKey }
 */
export function configureGeocoding(config) {
  Object.assign(GEO_CONFIG, config)
}

/**
 * 将文字地址解析为坐标
 * @param {string} address - 文字地址（如"深圳前海鸿荣源中心A座"）
 * @returns {Promise<{ longitude: number, latitude: number, formatted: string } | null>}
 */
export async function geocodeAddress(address) {
  if (!address || typeof address !== 'string') return null

  if (GEO_CONFIG.provider === 'mock') {
    return _mockGeocode(address)
  }

  if (GEO_CONFIG.provider === 'amap') {
    return _amapGeocode(address)
  }

  if (GEO_CONFIG.provider === 'tencent') {
    return _tencentGeocode(address)
  }

  return null
}

/**
 * 根据文字地址搜索附近门店
 * 核心桥梁函数：文字地址 → 坐标 → 门店列表
 * @param {string} address - 用户输入的文字地址
 * @param {Array} stores - 门店列表数据（Mock 模式下使用）
 * @returns {Promise<{ stores: Array, coordinates: { longitude, latitude } | null }>}
 */
export async function searchStoresByAddress(address, stores = []) {
  // 1. 先尝试从门店列表中模糊匹配（Mock 模式优先）
  if (stores.length > 0) {
    const matched = _fuzzyMatchStores(address, stores)
    if (matched.length > 0) {
      return {
        stores: matched,
        coordinates: matched[0]
          ? { longitude: matched[0].longitude, latitude: matched[0].latitude }
          : null,
      }
    }
  }

  // 2. 调用地理编码获取坐标（真实模式）
  const coords = await geocodeAddress(address)
  if (coords && stores.length > 0) {
    // 用坐标计算所有门店的距离并排序
    const withDistance = stores.map(s => ({
      ...s,
      distance: _haversine(coords.latitude, coords.longitude, s.latitude, s.longitude),
    })).sort((a, b) => a.distance - b.distance)

    return { stores: withDistance, coordinates: coords }
  }

  return { stores: [], coordinates: coords }
}

// ─── 内部实现 ───

/**
 * Mock 地理编码：从地址文本中提取关键词匹配已知地标
 */
function _mockGeocode(address) {
  // 已知地标的粗略坐标映射（深圳区域为主）
  const landmarks = {
    '万象天地': { longitude: 113.94512, latitude: 22.52891 },
    '海岸城': { longitude: 113.93856, latitude: 22.51723 },
    '来福士': { longitude: 113.92987, latitude: 22.51045 },
    '益田假日': { longitude: 113.97012, latitude: 22.53456 },
    '前海': { longitude: 113.89873, latitude: 22.52468 },
    '鸿荣源': { longitude: 113.89873, latitude: 22.52468 },
    '科技园': { longitude: 113.94283, latitude: 22.54309 },
    '福田': { longitude: 114.05586, latitude: 22.52288 },
    '罗湖': { longitude: 114.13152, latitude: 22.54876 },
    '宝安': { longitude: 113.88368, latitude: 22.55532 },
    '龙华': { longitude: 114.03603, latitude: 22.65716 },
    '哈工大': { longitude: 113.97234, latitude: 22.58891 },
    '深圳大学': { longitude: 113.93312, latitude: 22.53267 },
    '华强北': { longitude: 114.08822, latitude: 22.54768 },
    '欢乐海岸': { longitude: 113.97813, latitude: 22.52678 },
    '蛇口': { longitude: 113.91886, latitude: 22.48734 },
    '龙岗': { longitude: 114.24718, latitude: 22.72063 },
    '南山': { longitude: 113.93045, latitude: 22.53291 },
  }

  for (const [keyword, coords] of Object.entries(landmarks)) {
    if (address.includes(keyword)) {
      return { ...coords, formatted: address }
    }
  }

  // 无法匹配，返回深圳中心区坐标作为兜底
  return { longitude: 114.05786, latitude: 22.54310, formatted: address }
}

/**
 * 模糊匹配门店：从用户地址中提取关键词，与门店地址交叉匹配
 */
function _fuzzyMatchStores(address, stores) {
  // 提取地址中的关键词（去掉"市""区""路""号"等通用词后的有意义词）
  const keywords = _extractKeywords(address)

  if (keywords.length === 0) return stores.slice(0, 3) // 无法解析时返回前3家

  // 对每个门店计算匹配度
  const scored = stores.map(store => {
    let score = 0
    const storeAddr = (store.address || '') + (store.storeName || '')
    for (const kw of keywords) {
      if (storeAddr.includes(kw)) score += 1
    }
    return { ...store, _matchScore: score }
  })

  // 按匹配度排序，匹配度相同时按距离排序
  scored.sort((a, b) => {
    if (b._matchScore !== a._matchScore) return b._matchScore - a._matchScore
    return (a.distance || 999) - (b.distance || 999)
  })

  // 返回有匹配的门店，最多 5 家
  return scored
    .filter(s => s._matchScore > 0)
    .slice(0, 5)
    .map(({ _matchScore, ...rest }) => rest)
}

/**
 * 从地址文本中提取有意义的关键词
 */
function _extractKeywords(address) {
  // 去除通用词和标点
  const noise = /[市区省县镇街道号栋座楼层室市区路大道大街交叉口交汇处]/g
  const cleaned = address.replace(noise, ' ').replace(/\s+/g, ' ').trim()

  // 提取 2-6 字的有意义片段
  const keywords = []
  const parts = cleaned.split(/\s+/).filter(p => p.length >= 2)

  for (const part of parts) {
    keywords.push(part)
    // 对于较长的词，也加入子片段（如"鸿荣源中心" → "鸿荣源"）
    if (part.length > 3) {
      keywords.push(part.slice(0, 3))
    }
  }

  return [...new Set(keywords)] // 去重
}

/**
 * Haversine 公式计算两点间距离（km）
 */
function _haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * 高德地图地理编码（真实模式）
 * https://lbs.amap.com/api/webservice/guide/api/georegeo
 */
async function _amapGeocode(address) {
  if (!GEO_CONFIG.apiKey) {
    console.warn('高德 API key 未配置，回退到 mock')
    return _mockGeocode(address)
  }
  try {
    const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}&key=${GEO_CONFIG.apiKey}&output=JSON`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), GEO_CONFIG.timeout)
    const resp = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    const data = await resp.json()
    if (data.status === '1' && data.geocodes?.length > 0) {
      const [lng, lat] = data.geocodes[0].location.split(',').map(Number)
      return { longitude: lng, latitude: lat, formatted: data.geocodes[0].formatted_address }
    }
  } catch (e) {
    console.warn('高德地理编码失败:', e.message)
  }
  return _mockGeocode(address)
}

/**
 * 腾讯地图地理编码（真实模式）
 * https://lbs.qq.com/service/webService/webServiceGuide/webServiceGeocoder
 */
async function _tencentGeocode(address) {
  if (!GEO_CONFIG.apiKey) {
    console.warn('腾讯地图 API key 未配置，回退到 mock')
    return _mockGeocode(address)
  }
  try {
    const url = `https://apis.map.qq.com/ws/geocoder/v1/?address=${encodeURIComponent(address)}&key=${GEO_CONFIG.apiKey}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), GEO_CONFIG.timeout)
    const resp = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    const data = await resp.json()
    if (data.status === 0 && data.result?.location) {
      return {
        longitude: data.result.location.lng,
        latitude: data.result.location.lat,
        formatted: data.result.title || address,
      }
    }
  } catch (e) {
    console.warn('腾讯地图地理编码失败:', e.message)
  }
  return _mockGeocode(address)
}
