// Customer-facing ads — GET /api/ads/open.
// Reads never throw: they return an explicit error plus an empty list.

import { request, imageUrl } from './api';

const REQ_TIMEOUT_MS = 8000;

function listOf(res, key) {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== 'object') return [];
  if (res[key] && Array.isArray(res[key])) return res[key];
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.[key] && Array.isArray(res.data[key])) return res.data[key];
  return [];
}

export function mapCustomerAd(a) {
  const expires = a.expires_at ?? a.expiresAt ?? '';
  return {
    id: a.ad_id ?? a.id,
    title: a.title ?? '',
    description: a.description ?? a.notes ?? '',
    link: a.link ?? a.url ?? '',
    image: imageUrl(a.image) || '',
    ownerName: a.owner_name ?? '',
    spaceName: a.owner_name ?? a.space_name ?? '',
    tag: a.target === 'space_customers' ? 'خاص' : 'عرض',
    expiresAt: expires,
  };
}

function isExpired(ad) {
  if (!ad.expiresAt) return false;
  const t = Date.parse(ad.expiresAt);
  return Number.isFinite(t) && t < Date.now();
}

export async function fetchOpenAds() {
  const res = await request('/api/ads/open', {
    method: 'GET',
    auth: true,
    timeoutMs: REQ_TIMEOUT_MS,
  });
  return listOf(res, 'ads').map(mapCustomerAd).filter((a) => !isExpired(a));
}

export async function loadCustomerAdsWithFallback() {
  try {
    return { error: null, ads: await fetchOpenAds() };
  } catch (err) {
    return { error: err?.message || 'تعذّر تحميل الإعلانات', ads: [] };
  }
}
