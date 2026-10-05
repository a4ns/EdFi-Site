import { localeTag } from './locale';

// A fixed illustrative conversion, never a live FX quote or redemption rate.
export const KZT_PER_USD = 520;

function priceDigits(price) {
  return price >= 10 ? 2 : price >= 0.1 ? 4 : 5;
}

export function formatPrice(p, locale = 'en') {
  if (p == null || !Number.isFinite(p)) return '--';
  return formatAmount(p, priceDigits(p), locale);
}

export function formatUsd(p, locale = 'en') {
  if (p == null || !Number.isFinite(p)) return '--';
  return new Intl.NumberFormat(localeTag(locale), {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: priceDigits(p), maximumFractionDigits: priceDigits(p),
  }).format(p);
}

export function formatChange(c, locale = 'en') {
  if (c == null || !Number.isFinite(c)) return '--';
  return new Intl.NumberFormat(localeTag(locale), {
    style: 'percent', signDisplay: 'always', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(c / 100);
}

export function formatAmount(n, digits = 2, locale = 'en') {
  return new Intl.NumberFormat(localeTag(locale), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

export function formatPercent(value, digits = 0, locale = 'en') {
  return new Intl.NumberFormat(localeTag(locale), {
    style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(value / 100);
}

export function formatCurrency(n, currency, locale = 'en', digits = 2) {
  return new Intl.NumberFormat(localeTag(locale), {
    style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(n);
}

export function formatInt(n, locale = 'en') {
  return new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: 0 }).format(n);
}

export function formatCompact(n, locale = 'en') {
  return new Intl.NumberFormat(localeTag(locale), {
    notation: 'compact', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(d, locale = 'en', options = {}) {
  return new Intl.DateTimeFormat(localeTag(locale), options).format(d);
}

export function formatDateTime(d, locale = 'en') {
  return formatDate(d, locale, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
}
