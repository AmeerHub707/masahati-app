// Public spaces catalog — only what the customer dashboard needs
// (new spaces for the hero banner). Space detail/booking live elsewhere.

import { request } from './api';
import { mapSpace } from './spaceMap';
import { pickNewSpaces, NEW_SPACES_LIMIT } from './newSpaces';

const SPACES_TIMEOUT_MS = 10000;

function messageOf(err) {
  return err && typeof err.message === 'string' && err.message.trim()
    ? err.message
    : 'تعذّر الاتصال بالخادم. حاول مجدداً بعد قليل.';
}

export async function fetchSpaces(page = 1) {
  const res = await request(`/api/spaces?page=${page}`, {
    method: 'GET',
    timeoutMs: SPACES_TIMEOUT_MS,
  });
  const rawItems = res?.data?.data || res?.data || res?.spaces || [];
  const items = Array.isArray(rawItems) ? rawItems : [];
  return {
    spaces: items.map(mapSpace),
    current_page: res?.current_page ?? res?.data?.current_page ?? page,
    last_page: res?.last_page ?? res?.data?.last_page ?? 1,
    has_more: res?.has_more ?? res?.data?.has_more ?? false,
    total: res?.total ?? res?.data?.total ?? items.length,
  };
}

export async function fetchNewSpaces() {
  const result = await fetchSpaces(1);
  return pickNewSpaces(result.spaces, { limit: NEW_SPACES_LIMIT });
}

export async function loadNewSpacesWithFallback() {
  try {
    return { error: null, spaces: await fetchNewSpaces() };
  } catch (err) {
    return { error: messageOf(err), spaces: [] };
  }
}
