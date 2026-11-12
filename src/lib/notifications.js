// In-app notifications — GET /api/notifications, POST /api/notifications/read.
// Reads never throw (return { error, notifications }); actions throw real errors.

import { request } from './api';
import { getItem, setItem } from './platform/storage';

const REQ_TIMEOUT_MS = 8000;

function fmtTime(iso) {
  if (!iso) return '';
  const t = new Date(String(iso).replace(' ', 'T'));
  if (Number.isNaN(t.getTime())) return '';
  const diff = Math.max(0, Math.round((Date.now() - t.getTime()) / 3600000));
  if (diff < 1) return 'الآن';
  if (diff < 24) return `منذ ${diff} ساعات`;
  const days = Math.round(diff / 24);
  return days <= 30 ? `منذ ${days} يوم` : `منذ ${Math.round(days / 30)} شهر`;
}

function asText(value) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function firstText(...values) {
  for (const value of values) {
    const text = asText(value);
    if (text) return text;
  }
  return '';
}

function isReadFlag(value) {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return v === '1' || v === 'true' || v === 'yes';
  }
  return false;
}

function mapNotif(n) {
  const item = n && typeof n === 'object' ? n : {};
  const title = firstText(item.title, item.subject, item.heading);
  const body = firstText(item.text, item.message, item.body, item.content, item.description);
  const created = item.created_at ?? item.sent_at ?? item.time ?? item.date ?? '';
  return {
    id: item.id ?? item.notification_id ?? item.uuid ?? null,
    title,
    text: body || title,
    time: asText(item.time) || fmtTime(created),
    read: isReadFlag(item.read ?? item.is_read ?? item.seen ?? item.read_at),
    icon: firstText(item.icon, item.type) || 'bell',
    link: firstText(item.link, item.url, item.action_url),
    created_at: asText(created),
  };
}

const LIST_KEYS = ['notifications', 'data', 'items', 'results', 'rows', 'list'];

function listOf(res, depth = 0) {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== 'object' || depth > 4) return [];
  for (const key of LIST_KEYS) {
    const value = res[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      const nested = listOf(value, depth + 1);
      if (nested.length) return nested;
    }
  }
  return [];
}

export async function fetchNotifications() {
  const res = await request('/api/notifications', {
    method: 'GET',
    auth: true,
    timeoutMs: REQ_TIMEOUT_MS,
  });
  return listOf(res).map(mapNotif);
}

export async function markNotificationsRead() {
  const res = await request('/api/notifications/read', {
    method: 'POST',
    auth: true,
    timeoutMs: REQ_TIMEOUT_MS,
  });
  return res?.message || 'تم تحديث الإشعارات.';
}

export async function loadNotificationsWithFallback() {
  try {
    return { error: null, notifications: await fetchNotifications() };
  } catch (err) {
    return { error: err?.message || 'تعذّر تحميل الإشعارات', notifications: [] };
  }
}

export async function markAllNotificationsReadWithFallback() {
  try {
    const message = await markNotificationsRead();
    return { error: null, message };
  } catch (err) {
    throw err instanceof Error ? err : new Error(err?.message || 'تعذّر تحديث الإشعارات.');
  }
}

// Local "seen" markers per user, so a reopen of the screen keeps read state
// even if the backend read flag lags.
const READ_PREFIX = 'masahati_notif_read_';

export function readSeenIds(userId) {
  if (!userId) return [];
  try {
    const raw = getItem(`${READ_PREFIX}${userId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function writeSeenIds(userId, ids) {
  if (!userId) return;
  const unique = Array.from(new Set((ids || []).filter((v) => v != null).map(String)));
  setItem(`${READ_PREFIX}${userId}`, JSON.stringify(unique));
}
