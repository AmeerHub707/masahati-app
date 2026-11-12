// Arabic-Indic number formatting — one source for every screen.
// Hermes' Intl support varies by build, so we map digits explicitly.

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toArabicDigits(value) {
  return String(value ?? '').replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]);
}

export function toLatinDigits(value) {
  return String(value ?? '').replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

export function fmtNumber(n) {
  const num = Number(n) || 0;
  const rounded = Number.isInteger(num) ? String(num) : String(Math.round(num * 10) / 10);
  return toArabicDigits(rounded);
}

export function fmtRating(n) {
  return toArabicDigits((Number(n) || 0).toFixed(1));
}

export function fmtMoney(n) {
  return toArabicDigits((Number(n) || 0).toFixed(2));
}

export function fmtPrice(value, currency = 'ش.ج') {
  return `${fmtNumber(value)} ${currency}`;
}
