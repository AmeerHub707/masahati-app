// "New spaces" — a space shows in the hero banner for 3 days after it was
// added/approved. Pure helpers, no API and no React (same as the web app).

const DAY_MS = 24 * 60 * 60 * 1000;

export const NEW_SPACES_WINDOW_DAYS = 3;
export const NEW_SPACES_LIMIT = 8;

// Two hours of clock-skew tolerance (server time may be slightly ahead).
const CLOCK_SKEW_TOLERANCE_MS = 2 * 60 * 60 * 1000;

export function parseSpaceDate(value) {
  if (value == null || value === '') return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw) ? raw.replace(' ', 'T') : raw;
  const t = Date.parse(normalized);
  return Number.isFinite(t) ? t : null;
}

export function isNewSpace(space, now = Date.now(), days = NEW_SPACES_WINDOW_DAYS) {
  const at = parseSpaceDate(space?.created_at);
  if (at === null) return false;
  const age = now - at;
  return age <= days * DAY_MS && age >= -CLOCK_SKEW_TOLERANCE_MS;
}

export function pickNewSpaces(
  spaces,
  { now = Date.now(), days = NEW_SPACES_WINDOW_DAYS, limit = NEW_SPACES_LIMIT } = {}
) {
  if (!Array.isArray(spaces)) return [];
  return spaces
    .filter((s) => isNewSpace(s, now, days))
    .sort((a, b) => (parseSpaceDate(b?.created_at) ?? 0) - (parseSpaceDate(a?.created_at) ?? 0))
    .slice(0, limit);
}
