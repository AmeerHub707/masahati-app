// Customer dashboard data — talks to the real Laravel backend.
//
// Endpoints:
//   GET  /api/profile
//   GET  /api/dashboard/stats
//   GET  /api/dashboard/upcoming-booking
//   GET  /api/dashboard/bookings
//   GET  /api/dashboard/favorites
//   POST /api/dashboard/favorites/toggle
//   GET  /api/ads/open            (via ads.js)
//   GET  /api/spaces?page=1       (via spaces.js)
//
// Ported from the web app's src/lib/dashboard.js; localStorage -> storage facade.

import { request, imageUrl } from './api';
import { getUser } from './authStore';
import { extractPicturePath, resolvePictureUrl, getCachedPictureUrl } from './profilePicture';
import { loadCustomerAdsWithFallback } from './ads';
import { loadNewSpacesWithFallback } from './spaces';
import { getItem, setItem, removeItem } from './platform/storage';

// 15s: long enough for a Render cold start (measured ~11s) without hanging.
const DASH_TIMEOUT_MS = 15000;
const DASH_CACHE_KEY = 'masahati_dashboard_cache';

export function readDashboardCache() {
  try {
    const raw = getItem(DASH_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

export function clearDashboardCache() {
  removeItem(DASH_CACHE_KEY);
}

export function writeDashboardCache(payload) {
  try {
    setItem(DASH_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* storage unavailable */
  }
}

function unwrapUser(res) {
  if (!res || typeof res !== 'object') return {};
  let cur = res;
  if (cur.user && typeof cur.user === 'object') cur = cur.user;
  if (cur.data && typeof cur.data === 'object') cur = cur.data;
  if (cur.user && typeof cur.user === 'object') cur = cur.user;
  return cur || {};
}

function pickUser(...sources) {
  const out = {};
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;
    for (const key of ['name', 'full_name', 'email', 'phone', 'role', 'picture', 'photo', 'status']) {
      if (!out[key] && src[key]) out[key] = src[key];
    }
  }
  return out;
}

function mapBookings(rows = []) {
  return rows.map((b) => ({
    id: b.booking_id ?? b.id,
    spaceName: b.space_name ?? b.title ?? '',
    image: imageUrl(b.image) || '',
    date: b.date || '',
    time: b.time_from && b.time_to ? `${b.time_from} – ${b.time_to}` : b.time || '',
    hours: b.hours || 0,
    price: b.price || b.cost || 0,
    status: b.status || (b.time_from ? 'confirmed' : 'pending'),
  }));
}

function mapFavorites(rows = []) {
  return rows.map((f) => ({
    id: f.space_id ?? f.id,
    name: f.title ?? f.name ?? '',
    image: imageUrl(f.image) || '',
    rating: f.rating ?? 0,
    location: f.location || '',
    pricePerHour: f.price ?? f.price_per_hour ?? 0,
    power: f.power ?? f.has_power ?? f.electricity ?? null,
    internet: f.internet ?? f.has_internet ?? f.wifi ?? null,
  }));
}

function listOf(res, key) {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== 'object') return [];
  if (res[key] && Array.isArray(res[key])) return res[key];
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.[key] && Array.isArray(res.data[key])) return res.data[key];
  const looksLikeItem = 'id' in res || 'booking_id' in res || 'space_id' in res || 'title' in res;
  return looksLikeItem ? [res] : [];
}

export async function fetchDashboard() {
  const [stats, upcomingApi, historyApi, favoritesApi, profileApi, adsRes, newSpacesRes] =
    await Promise.all([
      request('/api/dashboard/stats', { method: 'GET', auth: true, timeoutMs: DASH_TIMEOUT_MS }).catch(() => null),
      request('/api/dashboard/upcoming-booking', { method: 'GET', auth: true, timeoutMs: DASH_TIMEOUT_MS }).catch(() => null),
      request('/api/dashboard/bookings', { method: 'GET', auth: true, timeoutMs: DASH_TIMEOUT_MS }).catch(() => null),
      request('/api/dashboard/favorites', { method: 'GET', auth: true, timeoutMs: DASH_TIMEOUT_MS }).catch(() => null),
      request('/api/profile', { method: 'GET', auth: true, timeoutMs: DASH_TIMEOUT_MS }).catch(() => null),
      loadCustomerAdsWithFallback(),
      loadNewSpacesWithFallback(),
    ]);

  const s = stats || {};
  const localUser = getUser() || {};

  const failedPrimary = [stats, upcomingApi, historyApi, favoritesApi, profileApi].filter(
    (v) => v == null
  ).length;
  const error =
    failedPrimary >= 3
      ? 'تعذّر تحميل بيانات لوحة التحكم من الخادم.'
      : adsRes?.error || null;

  const u = pickUser(unwrapUser(profileApi), localUser);

  const rawPhoto = extractPicturePath(profileApi, localUser) || getCachedPictureUrl();
  const photo = resolvePictureUrl(rawPhoto);

  const rawRole = u.role || localUser.role || 'customer';
  const role = rawRole === 'space_owner' ? 'owner' : rawRole;

  const result = {
    user: {
      id: u.id ?? u.user_id ?? localUser.id ?? null,
      name: u.name || u.full_name || '',
      full_name: u.full_name || u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      role,
      status: u.status || '',
      photo,
    },
    stats: {
      upcomingBookings: s.upcoming_bookings_count ?? 0,
      hoursThisMonth: s.total_hours ?? 0,
      savedFavorites: s.favorite_spaces_count ?? 0,
      hoursSpentThisMonth: s.booked_hours_this_month ?? 0,
    },
    upcoming: mapBookings(listOf(upcomingApi, 'bookings')),
    bookings: mapBookings(listOf(historyApi, 'bookings')),
    favorites: mapFavorites(listOf(favoritesApi, 'favorites')),
    ads: (adsRes?.ads || []).filter((a) => a.title),
    newSpaces: newSpacesRes?.spaces || [],
    error,
  };

  writeDashboardCache(result);
  return result;
}

export async function toggleFavorite(spaceId) {
  const res = await request('/api/dashboard/favorites/toggle', {
    method: 'POST',
    auth: true,
    body: { space_id: spaceId },
  });
  const isFavorited =
    typeof res?.is_favorited === 'boolean'
      ? res.is_favorited
      : typeof res?.data?.is_favorited === 'boolean'
        ? res.data.is_favorited
        : null;
  return { message: res?.message || '', isFavorited };
}

// The backend has no cancel endpoint. Never fake success: the UI must show the
// honest message and leave state untouched.
export const CANCEL_BOOKING_UNSUPPORTED = 'إلغاء الحجز غير متاح من الخادم حالياً، وسيُضاف قريباً.';

export async function cancelBooking() {
  return { ok: false, reason: 'unsupported', message: CANCEL_BOOKING_UNSUPPORTED };
}
