// Space normalizer extracted from the web app's owner.js so browsing code does
// not drag in the whole owner module.

import { imageUrl } from './api';

const AMENITY_TO_API = { electricity: 'power' };
const AMENITY_FROM_API = { power: 'electricity', wifi: 'internet' };

export function toApiAmenities(list) {
  const out = [];
  for (const a of Array.isArray(list) ? list : []) {
    const key = AMENITY_TO_API[a] || a;
    if (key && !out.includes(key)) out.push(key);
  }
  return out;
}

function normalizeAmenities(s) {
  const raw = Array.isArray(s.amenities) ? s.amenities : [];
  const keys = raw
    .map((a) => (typeof a === 'string' ? a : a?.key ?? a?.name ?? ''))
    .filter(Boolean);
  const out = [];
  for (const k of keys) {
    const key = AMENITY_FROM_API[k] || k;
    if (!out.includes(key)) out.push(key);
  }
  return out;
}

function spaceStatus(s) {
  const known = ['active', 'inactive', 'pending', 'rejected'];
  if (typeof s.status === 'string' && known.includes(s.status)) return s.status;
  return typeof s.is_active === 'boolean' ? (s.is_active ? 'active' : 'inactive') : 'active';
}

function normalizeSpaceDocs(docs) {
  const items = Array.isArray(docs)
    ? docs
    : docs && typeof docs === 'object'
      ? Object.entries(docs).map(([id, d]) => ({ id, ...(d || {}) }))
      : [];
  return items
    .filter((d) => d && (d.name || d.file?.name))
    .map((d) => ({
      id: d.id ?? d.key ?? '',
      name: d.name || d.file?.name || 'مستند',
      size: Number(d.size ?? d.file?.size ?? 0),
      type: d.type || d.file?.type || 'application/octet-stream',
    }));
}

function coordOf(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100000) / 100000 : null;
}

function normTime(v) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i);
  if (!m) return '';
  let h = Number(m[1]);
  const min = m[2];
  if (!Number.isInteger(h) || h > 23 || Number(min) > 59) return '';
  const mer = m[3] ? m[3].toLowerCase() : '';
  if (mer === 'pm' && h < 12) h += 12;
  else if (mer === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

function safeImageUrl(v) {
  if (v === true || v === false || v === 1 || v === 0 || v === '1' || v === '0') return '';
  const s = String(v ?? '').trim();
  if (!s || s === 'true' || s === 'false') return '';
  if (/^https?:\/\//i.test(s) || s.startsWith('/')) return imageUrl(s) || '';
  return '';
}

export function mapSpace(s) {
  const img = safeImageUrl(s.image);
  const gallery = Array.isArray(s.gallery)
    ? s.gallery.map(safeImageUrl).filter(Boolean)
    : img
      ? [img]
      : [];
  const status = spaceStatus(s);
  return {
    id: s.space_id ?? s.id,
    created_at: s.approved_at ?? s.published_at ?? s.created_at ?? s.created ?? '',
    title: s.title ?? '',
    description: s.description ?? '',
    location: s.location ?? '',
    lat: coordOf(s.lat ?? s.latitude ?? s.lat_f ?? s.latitude_f),
    lng: coordOf(s.lng ?? s.longitude ?? s.lng_f ?? s.longitude_f ?? s.lon ?? s.long),
    image: img,
    gallery,
    price_per_hour: Number(s.price_per_hour ?? s.price ?? 0),
    capacity: Number(s.capacity ?? 0),
    open_time: normTime(s.open_time ?? s.opening_time ?? s.opens_at ?? s.start_time),
    close_time: normTime(s.close_time ?? s.closing_time ?? s.closes_at ?? s.end_time),
    contact_phone: String(s.contact_phone ?? s.contact_number ?? s.phone ?? s.mobile ?? '').trim(),
    amenities: normalizeAmenities(s),
    internet: s.internet ?? s.has_internet ?? s.wifi ?? null,
    power: s.power ?? s.has_power ?? s.electricity ?? null,
    status,
    is_active: status === 'active',
    docs: normalizeSpaceDocs(s.docs),
    rating: Math.round(Number(s.rating ?? 0) * 10) / 10,
    category: typeof s.category === 'string' ? s.category : '',
    area: String(s.area ?? s.neighborhood ?? s.district ?? ''),
    review_count: Number(s.review_count ?? s.reviews_count ?? s.ratings_count ?? 0),
    instant_booking: Boolean(s.instant_booking ?? s.instant ?? false),
  };
}
