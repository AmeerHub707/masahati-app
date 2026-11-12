// Central API client for the Masahati Laravel backend.
// Auth uses a Bearer token (Sanctum opaque token, not JWT).
//
// Ported from the web app (src/lib/api.js) with the browser surface replaced:
//   localStorage  -> ./platform/storage
//   import.meta   -> process.env.EXPO_PUBLIC_API_URL
//   window.location.assign('/login') -> registered session-expired callback

import {
  getItem,
  setItem,
  removeItem,
  removeItemByPrefix,
  TOKEN_KEY,
  flush,
} from './platform/storage';

export const BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://masahati-backend.apps.taqat.academy'
).replace(/\/+$/, '');

if (__DEV__) console.log('[api] base URL:', BASE_URL);

const USER_KEY = 'masahati_user';

export function imageUrl(path) {
  if (!path || typeof path !== 'string') return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('file:')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function getToken() {
  return getItem(TOKEN_KEY) || null;
}

export function setToken(token) {
  setItem(TOKEN_KEY, token);
}

export function clearToken() {
  removeItem(TOKEN_KEY);
}

export function getUser() {
  try {
    const raw = getItem(USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user && typeof user === 'object' ? user : null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  if (!user) return;
  setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser() {
  removeItem(USER_KEY);
}

// Every device-local key that belongs to a user session. A new account must
// never inherit an old account's avatar, cache, notification reads...
const RESET_KEYS = [
  'profile_picture_url',
  'profile_picture_version',
  'masahati_dashboard_cache',
  'masahati_owner_cache',
  'masahati_customer_ads_seen_v1',
  'masahati_notifications_read_v1',
  'masahati_assistant_messages',
];

export function resetLocalUserData() {
  removeItem(TOKEN_KEY);
  removeItem(USER_KEY);
  for (const key of RESET_KEYS) removeItem(key);
  removeItemByPrefix('masahati_notif_read_');
}

let sessionExpired = false;

export function consumeSessionExpired() {
  if (!sessionExpired) return false;
  sessionExpired = false;
  return true;
}

let onSessionExpired = null;

export function registerSessionExpiredHandler(fn) {
  onSessionExpired = typeof fn === 'function' ? fn : null;
}

function expireSession() {
  sessionExpired = true;
  if (onSessionExpired) onSessionExpired();
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.fieldErrors = normalizeFieldErrors(data?.errors);
    this.code = data?.code ?? null;
  }
}

function normalizeFieldErrors(errors) {
  if (!errors || typeof errors !== 'object') return null;
  const out = {};
  for (const key of Object.keys(errors)) {
    const value = errors[key];
    out[key] = Array.isArray(value) ? value[0] : String(value);
  }
  return out;
}

function extractErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (data.message && typeof data.message === 'string') return data.message;
  if (data.errors) {
    const firstKey = Object.keys(data.errors)[0];
    if (firstKey && Array.isArray(data.errors[firstKey])) return data.errors[firstKey][0];
  }
  return fallback;
}

/**
 * Base request.
 *
 * The bearer token is read at send time (not build time) so a token that was
 * just written/removed is always the one used.
 *
 * @param {string} path starts with /api
 * @param {object} options {
 *   method, body (object|FormData), auth, isForm, timeoutMs,
 *   token, tokenGetter, requireToken, scopedToken, raw, onUnauthorized
 * }
 */
export async function request(path, options = {}) {
  const {
    method = 'GET',
    body,
    auth = false,
    isForm = false,
    timeoutMs = 25000,
    token = null,
    tokenGetter = null,
    requireToken = false,
    scopedToken = false,
    raw = false,
    onUnauthorized = null,
  } = options;

  const bearer =
    (typeof tokenGetter === 'function' ? tokenGetter() : token) ||
    (scopedToken ? null : getToken());

  if (auth && requireToken && !bearer) {
    throw new ApiError('انتهت الجلسة. يرجى تسجيل الدخول من جديد.', 401, null);
  }

  const headers = { Accept: 'application/json' };
  if (auth && bearer) headers.Authorization = `Bearer ${bearer}`;

  let payload;
  if (isForm) {
    // React Native's fetch adds the multipart boundary itself; never set
    // Content-Type manually for FormData.
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  const url = `${BASE_URL}${path}`;
  try {
    res = await fetch(url, { method, headers, body: payload, signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (__DEV__) console.warn('[api] network error:', method, path, err?.name || err?.message);
    if (err && err.name === 'AbortError') {
      throw new ApiError('انتهت مهلة الطلب. تحقق من اتصالك وحاول مجدداً.', 0, {
        url,
        reason: 'timeout',
      });
    }
    throw new ApiError('تعذّر الوصول إلى الخادم. تحقق من اتصالك بالإنترنت.', 0, {
      url,
      reason: 'offline',
      cause: err?.name || 'Error',
    });
  }
  clearTimeout(timer);

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (__DEV__) console.warn('[api] failed:', method, path, res.status, extractErrorMessage(data, ''));
    // A 401 only expires the session when we actually sent a token. Public
    // endpoints also answer 401, and that must not log a valid user out.
    if (res.status === 401 && auth && bearer) {
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        clearToken();
        clearUser();
        expireSession();
      }
    }

    if (res.status === 429) {
      const retryAfterHeader = res.headers?.get?.('retry-after') ?? null;
      const retryAfter = Number(retryAfterHeader);
      const seconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null;
      throw new ApiError(
        seconds
          ? `تم تجاوز عدد المحاولات المسموح. حاول مجدداً بعد ${seconds} ثانية.`
          : 'تم تجاوز عدد المحاولات المسموح. انتظر قليلاً ثم حاول مجدداً.',
        429,
        { retryAfterSeconds: seconds, url }
      );
    }

    throw new ApiError(
      extractErrorMessage(data, `تعذر إتمام الطلب (${res.status}).`),
      res.status,
      data
    );
  }

  if (raw) return text;

  // A 200 that returns the Laravel welcome page instead of JSON means the
  // route isn't implemented. Surface that instead of silently returning null.
  if (text && data === null && /^\s*</.test(text)) {
    throw new ApiError(
      'استجابة الخادم غير متوقعة (صفحة HTML بدلاً من JSON). يبدو أن المسار غير مُطبّق بعد.',
      200,
      null
    );
  }

  return data;
}

/** Persist pending storage writes before navigating away from a session. */
export async function flushStorage() {
  await flush();
}
