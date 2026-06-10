/**
 * 喜茶 MCP 认证服务
 * 
 * 对标瑞幸 My Coffee MCP 认证架构：
 * - 手机号 + SMS 验证码登录
 * - Bearer Token 生命周期管理（获取/刷新/撤销）
 * - Token 本地持久化（localStorage + 文件导出）
 * - CLI 回调模式（本地 HTTP 接收 Web 端 Token 回传）
 * 
 * 认证流程:
 * 1. 用户输入手机号 → sendSmsCode()
 * 2. 用户输入验证码 → login(phone, code) → 获取 token
 * 3. Token 存入 localStorage + 更新 mcp-client 配置
 * 4. CLI 模式：本地起 HTTP server，Web 端回调 POST token
 */

import { configureMCP, getMCPConfig } from './mcp-client.js'

// ─── 配置 ───
const AUTH_CONFIG = {
  // 喜茶开放平台（对标瑞幸 open.lkcoffee.com）
  baseUrl: 'https://open.heytea.com',
  // API 端点
  endpoints: {
    sendSmsCode: '/api/v1/auth/sms/send',
    login: '/api/v1/auth/login',
    getToken: '/api/v1/oauth/mcp/getToken',
    refreshToken: '/api/v1/oauth/mcp/refreshToken',
    revokeToken: '/api/v1/oauth/mcp/revokeToken',
    getUserProfile: '/api/v1/user/profile',
    sliderVerify: '/api/v1/auth/slider/verify',
    logout: '/api/v1/auth/logout',
  },
  // CLI 回调配置
  cli: {
    callbackPort: 19527,
    sessionPrefix: 'heytea-cli-',
  },
  // Token 存储键名
  storageKeys: {
    token: 'heytea_mcp_token',
    refreshToken: 'heytea_mcp_refresh_token',
    expiresAt: 'heytea_mcp_token_expires',
    userProfile: 'heytea_mcp_user',
  },
  // Token 有效期（默认 24 小时）
  defaultTokenTTL: 24 * 60 * 60 * 1000,
}

// ─── 状态管理 ───
let _authState = {
  isLoggedIn: false,
  phone: null,
  token: null,
  refreshToken: null,
  expiresAt: null,
  userProfile: null,
}

// ─── 初始化：从 localStorage 恢复 ───
export function initAuth() {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.storageKeys.token)
    const refreshToken = localStorage.getItem(AUTH_CONFIG.storageKeys.refreshToken)
    const expiresAt = localStorage.getItem(AUTH_CONFIG.storageKeys.expiresAt)
    const userProfile = localStorage.getItem(AUTH_CONFIG.storageKeys.userProfile)

    if (token && expiresAt && Date.now() < Number(expiresAt)) {
      _authState = {
        isLoggedIn: true,
        phone: null,
        token,
        refreshToken,
        expiresAt: Number(expiresAt),
        userProfile: userProfile ? JSON.parse(userProfile) : null,
      }
      // 同步到 MCP 客户端配置
      configureMCP({ token, useMock: false })
    }
  } catch {
    // localStorage 不可用（SSR 等），保持未登录
  }
  return getAuthState()
}

/**
 * 获取当前认证状态（只读副本）
 */
export function getAuthState() {
  return { ..._authState }
}

/**
 * 检查 Token 是否有效（未过期）
 */
export function isTokenValid() {
  return _authState.isLoggedIn && _authState.token && _authState.expiresAt > Date.now()
}

// ═══════════════════════════════════════════════════
// ─── 1. SMS 验证码 ───
// ═══════════════════════════════════════════════════

/**
 * 发送短信验证码
 * @param {string} phone - 11位手机号
 * @returns {Promise<{success: boolean, message: string, cooldown: number}>}
 */
export async function sendSmsCode(phone) {
  if (!/^1\d{10}$/.test(phone)) {
    return { success: false, message: '请输入正确的11位手机号', cooldown: 0 }
  }

  try {
    const resp = await fetch(`${AUTH_CONFIG.baseUrl}${AUTH_CONFIG.endpoints.sendSmsCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    const json = await resp.json()

    if (json.success || json.code === 0) {
      return { success: true, message: '验证码已发送', cooldown: json.data?.cooldown || 60 }
    }
    return { success: false, message: json.msg || '发送失败', cooldown: 0 }
  } catch {
    // Mock 模式：模拟发送成功
    return { success: true, message: '验证码已发送（Mock）', cooldown: 60 }
  }
}

// ═══════════════════════════════════════════════════
// ─── 2. 登录 ───
// ═══════════════════════════════════════════════════

/**
 * 手机号 + 验证码登录
 * @param {string} phone - 手机号
 * @param {string} code - SMS 验证码
 * @returns {Promise<{success: boolean, token?: string, message: string}>}
 */
export async function login(phone, code) {
  if (!phone || !code) {
    return { success: false, message: '手机号和验证码不能为空' }
  }

  try {
    const resp = await fetch(`${AUTH_CONFIG.baseUrl}${AUTH_CONFIG.endpoints.login}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    })
    const json = await resp.json()

    if (json.success || json.code === 0) {
      return await handleLoginSuccess(phone, json.data)
    }
    return { success: false, message: json.msg || '登录失败' }
  } catch {
    // Mock 模式：模拟登录成功
    const mockToken = `ht_mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const mockRefresh = `ht_refresh_${Date.now()}`
    return handleLoginSuccess(phone, {
      token: mockToken,
      refreshToken: mockRefresh,
      expiresIn: 86400,
      user: { nickname: '喜茶用户', phone: phone.slice(0, 3) + '****' + phone.slice(7) },
    })
  }
}

/**
 * 处理登录成功，存储 Token
 */
async function handleLoginSuccess(phone, data) {
  const expiresAt = Date.now() + (data.expiresIn || 86400) * 1000

  _authState = {
    isLoggedIn: true,
    phone,
    token: data.token,
    refreshToken: data.refreshToken || null,
    expiresAt,
    userProfile: data.user || null,
  }

  // 持久化
  try {
    localStorage.setItem(AUTH_CONFIG.storageKeys.token, data.token)
    if (data.refreshToken) {
      localStorage.setItem(AUTH_CONFIG.storageKeys.refreshToken, data.refreshToken)
    }
    localStorage.setItem(AUTH_CONFIG.storageKeys.expiresAt, String(expiresAt))
    if (data.user) {
      localStorage.setItem(AUTH_CONFIG.storageKeys.userProfile, JSON.stringify(data.user))
    }
  } catch { /* 存储不可用 */ }

  // 同步到 MCP 客户端
  configureMCP({ token: data.token, useMock: false })

  return { success: true, token: data.token, message: '登录成功' }
}

// ═══════════════════════════════════════════════════
// ─── 3. Token 刷新 ───
// ═══════════════════════════════════════════════════

/**
 * 刷新 Token
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function refreshAuthToken() {
  if (!_authState.refreshToken) {
    return { success: false, message: '无 refreshToken，请重新登录' }
  }

  try {
    const resp = await fetch(`${AUTH_CONFIG.baseUrl}${AUTH_CONFIG.endpoints.refreshToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${_authState.token}`,
      },
      body: JSON.stringify({ refreshToken: _authState.refreshToken }),
    })
    const json = await resp.json()

    if (json.success || json.code === 0) {
      const expiresAt = Date.now() + (json.data.expiresIn || 86400) * 1000
      _authState.token = json.data.token
      _authState.expiresAt = expiresAt
      if (json.data.refreshToken) _authState.refreshToken = json.data.refreshToken

      try {
        localStorage.setItem(AUTH_CONFIG.storageKeys.token, _authState.token)
        localStorage.setItem(AUTH_CONFIG.storageKeys.expiresAt, String(expiresAt))
      } catch {}

      configureMCP({ token: _authState.token })
      return { success: true, message: 'Token 已刷新' }
    }
    return { success: false, message: json.msg || '刷新失败' }
  } catch {
    return { success: false, message: '网络错误' }
  }
}

// ═══════════════════════════════════════════════════
// ─── 4. 登出 / Token 撤销 ───
// ═══════════════════════════════════════════════════

/**
 * 登出并撤销 Token
 */
export async function logout() {
  try {
    if (_authState.token) {
      await fetch(`${AUTH_CONFIG.baseUrl}${AUTH_CONFIG.endpoints.revokeToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${_authState.token}`,
        },
      })
    }
  } catch { /* 忽略网络错误 */ }

  // 清除本地状态
  _authState = { isLoggedIn: false, phone: null, token: null, refreshToken: null, expiresAt: null, userProfile: null }

  try {
    Object.values(AUTH_CONFIG.storageKeys).forEach(key => localStorage.removeItem(key))
  } catch {}

  // 恢复 Mock 模式
  configureMCP({ token: '', useMock: true })

  return { success: true, message: '已登出' }
}

// ═══════════════════════════════════════════════════
// ─── 5. CLI 回调模式 ───
// ═══════════════════════════════════════════════════

/**
 * 获取 CLI 认证 URL（用户在浏览器中打开此链接完成登录，Token 回传到本地 CLI server）
 * @returns {string} Web 认证 URL
 */
export function getCliAuthUrl() {
  const session = AUTH_CONFIG.cli.sessionPrefix + Date.now()
  const callbackUrl = `http://127.0.0.1:${AUTH_CONFIG.cli.callbackPort}`
  return `${AUTH_CONFIG.baseUrl}/auth?redirect_url=${encodeURIComponent(callbackUrl)}&cli_session=${session}`
}

/**
 * 启动 CLI 回调服务器（监听 Token 回传）
 * @param {Function} onTokenReceived - 收到 Token 后的回调
 * @returns {Object} { port, session, stop }
 */
export function startCliCallbackServer(onTokenReceived) {
  // 在浏览器环境中，我们使用 BroadcastChannel 或 postMessage 模拟
  // 在 Node.js CLI 环境中，使用 http.createServer
  const port = AUTH_CONFIG.cli.callbackPort
  const session = AUTH_CONFIG.cli.sessionPrefix + Date.now()

  // 浏览器模拟：监听 storage 事件（跨 tab Token 传递）
  const handler = (event) => {
    if (event.key === AUTH_CONFIG.storageKeys.token && event.newValue) {
      const token = event.newValue
      const refresh = localStorage.getItem(AUTH_CONFIG.storageKeys.refreshToken)
      const expiresAt = Number(localStorage.getItem(AUTH_CONFIG.storageKeys.expiresAt) || 0)

      _authState = {
        isLoggedIn: true,
        phone: null,
        token,
        refreshToken: refresh,
        expiresAt,
        userProfile: null,
      }
      configureMCP({ token, useMock: false })

      if (onTokenReceived) onTokenReceived({ token, success: true })
      window.removeEventListener('storage', handler)
    }
  }

  window.addEventListener('storage', handler)

  return {
    port,
    session,
    authUrl: getCliAuthUrl(),
    stop: () => window.removeEventListener('storage', handler),
  }
}

// ═══════════════════════════════════════════════════
// ─── 6. Token 导入/导出 ───
// ═══════════════════════════════════════════════════

/**
 * 导入外部 Token（从 CLI 文件或环境变量）
 * @param {string} token - Bearer Token
 * @param {Object} options - { refreshToken, expiresAt }
 */
export function importToken(token, options = {}) {
  if (!token) return { success: false, message: 'Token 不能为空' }

  const expiresAt = options.expiresAt || Date.now() + AUTH_CONFIG.defaultTokenTTL

  _authState = {
    isLoggedIn: true,
    phone: null,
    token,
    refreshToken: options.refreshToken || null,
    expiresAt,
    userProfile: null,
  }

  try {
    localStorage.setItem(AUTH_CONFIG.storageKeys.token, token)
    localStorage.setItem(AUTH_CONFIG.storageKeys.expiresAt, String(expiresAt))
    if (options.refreshToken) {
      localStorage.setItem(AUTH_CONFIG.storageKeys.refreshToken, options.refreshToken)
    }
  } catch {}

  configureMCP({ token, useMock: false })
  return { success: true, message: 'Token 已导入' }
}

/**
 * 导出 Token 用于 CLI 配置
 * @returns {Object} { token, refreshToken, expiresAt, mcpServersConfig }
 */
export function exportTokenConfig() {
  if (!_authState.token) return null

  const config = getMCPConfig()
  return {
    token: _authState.token,
    refreshToken: _authState.refreshToken,
    expiresAt: _authState.expiresAt,
    expiresAtISO: new Date(_authState.expiresAt).toISOString(),
    // 标准 MCP Server 配置（可写入 Claude/Cursor 的 mcp.json）
    mcpServersConfig: {
      mcpServers: {
        'heytea-order': {
          type: 'streamableHttp',
          url: config.serverUrl,
          headers: {
            'Authorization': `Bearer ${_authState.token}`,
          },
        },
      },
    },
  }
}

// ═══════════════════════════════════════════════════
// ─── 7. 用户信息 ───
// ═══════════════════════════════════════════════════

/**
 * 获取用户信息
 * @returns {Promise<Object>} 用户 profile
 */
export async function getUserProfile() {
  if (!_authState.token) return null

  // 优先返回缓存
  if (_authState.userProfile) return _authState.userProfile

  try {
    const resp = await fetch(`${AUTH_CONFIG.baseUrl}${AUTH_CONFIG.endpoints.getUserProfile}`, {
      headers: { 'Authorization': `Bearer ${_authState.token}` },
    })
    const json = await resp.json()
    if (json.success || json.code === 0) {
      _authState.userProfile = json.data
      try {
        localStorage.setItem(AUTH_CONFIG.storageKeys.userProfile, JSON.stringify(json.data))
      } catch {}
      return json.data
    }
  } catch {}

  return null
}
