// Real authentication store — talks to the Laravel backend.
// The Bearer token is the only source of truth for an active session.
// Ported from the web app's src/lib/authStore.js.

import {
  request,
  getToken,
  setToken,
  setUser,
  clearUser,
  getUser,
  ApiError,
  resetLocalUserData,
  consumeSessionExpired,
  flushStorage,
} from './api';
import { extractPicturePath, assetToFormData } from './profilePicture';

export { request, ApiError, consumeSessionExpired, getToken, setToken, getUser, setUser, clearUser };

export function isLoggedIn() {
  return !!getToken();
}

/** Accept { user } / { data } / { data: { user } } / the object itself. */
export function extractUser(res) {
  if (!res || typeof res !== 'object') return {};
  let cur = res;
  if (cur.user && typeof cur.user === 'object') cur = cur.user;
  if (cur.data && typeof cur.data === 'object') cur = cur.data;
  if (cur.user && typeof cur.user === 'object') cur = cur.user;
  return cur || {};
}

export function normalizeRole(role) {
  if (!role) return '';
  const s = String(role).trim().toLowerCase();
  if (['space_owner', 'space owner', 'spaceowner', 'owner'].includes(s)) return 'space_owner';
  if (s === 'customer' || s === 'client') return 'customer';
  return s;
}

function isPending(user) {
  return String(user?.status || '').trim().toLowerCase() === 'pending';
}

/** Where a session belongs after login / app launch. */
export function routeForUser(user) {
  const role = normalizeRole(user?.role) || normalizeRole(getUser()?.role);
  // Pending approval only applies to space owners. A customer account must
  // never be held back by a status field (the web app routes customers by role
  // alone after email login).
  if (role === 'space_owner') {
    return isPending(user) ? '/pending-approval' : '/owner-unavailable';
  }
  if (role === 'customer') return '/home';
  if (isPending(user)) return '/pending-approval';
  // Unknown role: never hand it the customer dashboard.
  return '/login';
}

export async function login(identifier, password) {
  const data = await request('/api/login', {
    method: 'POST',
    body: { login: identifier, password },
  });

  if (!data || !data.token) {
    throw new ApiError('استجابة الخادم غير متوقعة (لا يوجد رمز دخول).', 500, data);
  }

  setToken(data.token);
  const user = extractUser(data);
  let role = normalizeRole(user.role);

  if (__DEV__) {
    console.log('[auth] login response keys:', Object.keys(data || {}).join(','));
    console.log(
      '[auth] login user keys:',
      Object.keys(user).join(','),
      '| role:',
      user.role,
      '| status:',
      user.status
    );
  }

  // /api/login may not include the role; /api/profile is the source of truth.
  // Retry once: a cold backend can be slow on the first request after login.
  if (!role) {
    for (let attempt = 0; attempt < 2 && !role; attempt += 1) {
      try {
        const profile = extractUser(
          await request('/api/profile', { method: 'GET', auth: true, timeoutMs: 30000 })
        );
        role = normalizeRole(profile.role);
        if (role) {
          user.role = role;
          // Never copy `status` from /api/profile: the web app only trusts the
          // status that comes in the login/signup response. A profile-level
          // status must not send a customer to the pending-approval screen.
          for (const key of ['name', 'full_name', 'email', 'phone', 'picture', 'photo']) {
            if (typeof user[key] === 'undefined' && typeof profile[key] !== 'undefined') {
              user[key] = profile[key];
            }
          }
        }
      } catch {
        /* the profile call may fail; the role may still be absent */
        if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }
  }
  if (role && !user.role) user.role = role;

  if (__DEV__) console.log('[auth] resolved role:', role || '(none)');

  setUser(Object.keys(user).length ? user : null);
  // Make sure the token reached SecureStore before navigation, so a restart
  // right after login still restores the session.
  await flushStorage();
  return { ...data, user };
}

/** POST /api/register/customer (the only registration route the backend exposes). */
export async function registerCustomer(payload) {
  return request('/api/register/customer', { method: 'POST', body: payload });
}

function decodeGoogleIdToken(idToken) {
  try {
    const payload = String(idToken || '').split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const normalized = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    if (typeof globalThis.atob !== 'function') return null;
    const json = decodeURIComponent(
      globalThis
        .atob(normalized)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function googleLogin(idToken, role) {
  const data = await request('/api/auth/google', {
    method: 'POST',
    body: role ? { id_token: idToken, role } : { id_token: idToken },
  });

  if (!data || !data.token) {
    throw new ApiError('استجابة الخادم غير متوقعة (لا يوجد توكن).', 500, data);
  }

  setToken(data.token);

  const googlePayload = decodeGoogleIdToken(idToken) || {};
  const backendUser = extractUser(data);
  const merged = { ...backendUser };

  if (!extractPicturePath(backendUser) && googlePayload.picture) merged.picture = googlePayload.picture;
  if (!merged.name && googlePayload.name) merged.name = googlePayload.name;
  if (!merged.full_name && merged.name) merged.full_name = merged.name;
  if (!merged.email && googlePayload.email) merged.email = googlePayload.email;

  const normalized = normalizeRole(merged.role) || normalizeRole(role);
  if (normalized) merged.role = normalized;

  const fallbackAdded = Object.keys(merged).some((k) => merged[k] && merged[k] !== backendUser[k]);
  setUser(fallbackAdded ? merged : backendUser);
  await flushStorage();

  return { ...data, user: merged };
}

/**
 * Restore a session at launch from a token already on the device.
 * Network failures keep the cached session; a real 401 has already been
 * handled by api.js (token cleared + expiry callback).
 */
export async function restoreSession() {
  if (!getToken()) return null;
  try {
    const res = await request('/api/profile', { method: 'GET', auth: true, requireToken: true });
    const user = extractUser(res);
    const role = normalizeRole(user.role);
    // Match the web app: `status` is only trusted from the login/signup
    // response. /api/profile can report a status that is unrelated to account
    // approval; trusting it would trap customers in the pending screen.
    const { status: _profileStatus, ...profile } = user;
    setUser({ ...(getUser() || {}), ...profile, ...(role ? { role } : {}) });
    return getUser();
  } catch (err) {
    if (err?.status === 401) return null;
    return getUser();
  }
}

export async function getProfile() {
  return request('/api/profile', { method: 'GET', auth: true });
}

export async function updateProfile({ full_name, phone, email }) {
  return request('/api/customer/profile', {
    method: 'PATCH',
    auth: true,
    body: { full_name, phone, email },
  });
}

/** First picture upload — POST /api/uploadPicture (with an expo-image-picker asset). */
export async function uploadPicture(asset) {
  return request('/api/uploadPicture', {
    method: 'POST',
    auth: true,
    isForm: true,
    body: assetToFormData(asset),
  });
}

/** Replace the current picture — PATCH /api/profile/picture. */
export async function updateProfilePicture(asset) {
  return request('/api/profile/picture', {
    method: 'PATCH',
    auth: true,
    isForm: true,
    body: assetToFormData(asset),
  });
}

export async function changePassword({ oldPassword, newPassword, newPassword_confirmation }) {
  const data = await request('/api/change-pass', {
    method: 'POST',
    auth: true,
    body: { oldPassword, newPassword, newPassword_confirmation },
  });
  const payload = data && data.data && typeof data.data === 'object' ? data.data : data;
  if (payload && payload.token) setToken(payload.token);
  return data;
}

export async function logout() {
  try {
    await request('/api/logout', { method: 'POST', auth: true });
  } catch {
    /* clear locally even if the network failed */
  } finally {
    resetLocalUserData();
    await flushStorage();
  }
}

export async function deleteUser() {
  return request('/api/delete-user', { method: 'DELETE', auth: true });
}

export const ROLE_VISITOR = 'visitor';
export const ROLE_CUSTOMER = 'customer';
export const ROLE_SPACE_OWNER = 'space_owner';

export function getCurrentRole() {
  if (!isLoggedIn()) return ROLE_VISITOR;
  return normalizeRole(getUser()?.role) || ROLE_VISITOR;
}

export function canBook() {
  return getCurrentRole() === ROLE_CUSTOMER;
}
