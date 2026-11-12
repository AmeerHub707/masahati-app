// Profile picture — single source of truth for extracting and rendering the
// user's avatar URL. Read side ported from the web app; the browser-only
// upload helpers (FileReader/canvas) are replaced with React Native assets.

import { imageUrl } from './api';
import { getItem, setItem } from './platform/storage';

export const PICTURE_KEYS = [
  'profile_picture_url',
  'profile_picture',
  'profile_image_url',
  'profile_image',
  'picture_url',
  'picture',
  'photo_url',
  'photo',
  'avatar_url',
  'avatar',
  'image_url',
  'image',
  'secure_url',
  'url',
  'path',
];

const PICTURE_URL_KEY = 'profile_picture_url';
const PICTURE_VERSION_KEY = 'profile_picture_version';

/** Recognise a user object inside any { user } / { data } / { data: { user } } shape. */
function unwrapUser(obj) {
  if (!obj || typeof obj !== 'object') return null;
  let cur = obj;
  if (cur.user && typeof cur.user === 'object') cur = cur.user;
  if (cur.data && typeof cur.data === 'object') cur = cur.data;
  if (cur.user && typeof cur.user === 'object') cur = cur.user;
  return cur;
}

function urlFromValue(val) {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    for (const key of ['secure_url', 'url', 'path', 'profile_picture_url', 'picture', 'image']) {
      if (typeof val[key] === 'string' && val[key]) return val[key];
    }
  }
  return null;
}

export function extractPicturePath(...sources) {
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;
    for (const obj of [unwrapUser(src), src]) {
      if (!obj || typeof obj !== 'object') continue;
      for (const key of PICTURE_KEYS) {
        const found = urlFromValue(obj[key]);
        if (found) return found;
      }
    }
  }
  return null;
}

export function getCachedPictureUrl() {
  return getItem(PICTURE_URL_KEY) || null;
}

function withVersion(url, ts) {
  const cleaned = url.replace(/([?&])t=\d+/, '$1');
  if (/[?&]$/.test(cleaned)) return `${cleaned}t=${ts}`;
  return `${cleaned}${cleaned.includes('?') ? '&' : '?'}t=${ts}`;
}

export function resolvePictureUrl(rawPath) {
  if (!rawPath) return null;
  const base = imageUrl(rawPath);
  if (!base) return null;
  let url = base;
  const version = getItem(PICTURE_VERSION_KEY);
  if (version) url = withVersion(base, Number(version) || Date.now());
  setItem(PICTURE_URL_KEY, url);
  return url;
}

export function resolveNewPictureUrl(rawPath) {
  if (!rawPath) return null;
  const base = imageUrl(rawPath);
  if (!base) return null;
  const ts = Date.now();
  const url = withVersion(base, ts);
  setItem(PICTURE_VERSION_KEY, String(ts));
  setItem(PICTURE_URL_KEY, url);
  return url;
}

// ----- React Native upload helpers -----

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Validate an expo-image-picker asset before sending any bytes. */
export function validateAsset(asset, maxBytes = MAX_IMAGE_BYTES) {
  if (!asset?.uri) return 'لم يتم اختيار أي صورة.';
  if (asset.fileSize && asset.fileSize > maxBytes) {
    return 'حجم الصورة كبير جداً. الرجاء اختيار صورة أصغر من 5 ميجابايت.';
  }
  return null;
}

/** Turn picker output into the { uri, name, type } shape React Native expects. */
export function assetToFormData(asset, field = 'profile_picture') {
  const mime = asset.mimeType || 'image/jpeg';
  const ext = mime.split('/')[1] || 'jpg';
  const fd = new FormData();
  fd.append(field, {
    uri: asset.uri,
    name: asset.fileName || `profile.${ext}`,
    type: mime,
  });
  return fd;
}
