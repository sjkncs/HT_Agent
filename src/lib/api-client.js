/**
 * HEYTEA Agent — Backend API Client
 * Handles JWT authentication and REST API calls to the Spring Boot backend.
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8081/api';

let _token = null;
let _user = null;

// ── Token management ────────────────────────────

export function getToken() {
  return _token;
}

export function getUser() {
  return _user;
}

export function isAuthenticated() {
  return !!_token;
}

// ── Auth ─────────────────────────────────────────

/**
 * Login with username and password. Stores the JWT token.
 * @returns {Promise<{token, userId, username, nickname, role}>}
 */
export async function login(username, password) {
  const res = await _fetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (res.code !== 200) throw new Error(res.message || 'Login failed');
  _token = res.data.token;
  _user = res.data;
  return res.data;
}

/**
 * Register a new user.
 */
export async function register(username, password, nickname) {
  const res = await _fetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, nickname }),
  });
  if (res.code !== 200) throw new Error(res.message || 'Register failed');
  return res.data;
}

/**
 * Auto-login: try to login as admin, or register + login if not exists.
 * For development convenience.
 */
export async function autoLogin() {
  if (_token) return _user;
  try {
    return await login('admin', 'admin123');
  } catch {
    try {
      await register('admin', 'admin123', 'Admin');
      return await login('admin', 'admin123');
    } catch (e) {
      console.warn('[ApiClient] auto-login failed:', e.message);
      return null;
    }
  }
}

// ── Chat ─────────────────────────────────────────

/**
 * Send a chat message to the backend and get the AI response.
 * @param {string} message - User message text
 * @param {string} [conversationId] - Optional conversation ID to continue
 * @returns {Promise<{conversationId, messageId, content, intent, role, metadata, latencyMs, createdAt}>}
 */
export async function sendChat(message, conversationId = null) {
  const body = { message };
  if (conversationId) body.conversationId = conversationId;

  const res = await _fetch('/chat/send', {
    method: 'POST',
    body: JSON.stringify(body),
    auth: true,
  });
  if (res.code !== 200) throw new Error(res.message || 'Chat failed');
  return res.data;
}

/**
 * Get messages for a conversation.
 */
export async function getMessages(conversationId) {
  const res = await _fetch(`/chat/${conversationId}/messages`, {
    method: 'GET',
    auth: true,
  });
  if (res.code !== 200) throw new Error(res.message || 'Get messages failed');
  return res.data;
}

// ── Conversations ────────────────────────────────

/**
 * Get list of conversations for the current user.
 */
export async function getConversations(page = 1, size = 20) {
  const res = await _fetch(`/conversations?page=${page}&size=${size}`, {
    method: 'GET',
    auth: true,
  });
  if (res.code !== 200) throw new Error(res.message || 'Get conversations failed');
  return res.data;
}

// ── Internal fetch helper ────────────────────────

async function _fetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (options.auth && _token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  const url = `${API_BASE}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        _token = null;
        _user = null;
        throw new Error('Authentication required');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}
