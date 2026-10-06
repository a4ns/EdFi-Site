import { localeTag } from './locale';
import { numberFormatter } from './numberFormat';

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
  return numberFormatter(locale, {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: priceDigits(p), maximumFractionDigits: priceDigits(p),
  }).format(p);
}

export function formatChange(c, locale = 'en') {
  if (c == null || !Number.isFinite(c)) return '--';
  return numberFormatter(locale, {
    style: 'percent', signDisplay: 'always', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(c / 100);
}

export function formatAmount(n, digits = 2, locale = 'en') {
  return numberFormatter(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

export function formatPercent(value, digits = 0, locale = 'en') {
  return numberFormatter(locale, {
    style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(value / 100);
}

export function formatCurrency(n, currency, locale = 'en', digits = 2) {
  return numberFormatter(locale, {
    style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(n);
}

export function formatInt(n, locale = 'en') {
  return numberFormatter(locale, { maximumFractionDigits: 0 }).format(n);
}

export function formatCompact(n, locale = 'en') {
  return numberFormatter(locale, {
    notation: 'compact', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);
}

function formatKazakhLocalDate(d, includeTime = false) {
  const date = d === undefined ? new Date() : new Date(d);
  if (!Number.isFinite(date.getTime())) throw new RangeError('Invalid time value');
  const twoDigits = (value) => String(value).padStart(2, '0');
  const day = twoDigits(date.getDate());
  const month = twoDigits(date.getMonth() + 1);
  const year = String(date.getFullYear()).padStart(4, '0');
  const numericDate = `${day}.${month}.${year}`;
  if (!includeTime) return numericDate;
  return `${numericDate}, ${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}:${twoDigits(date.getSeconds())}`;
}

export function formatDate(d, locale = 'en', options = {}) {
  // The chart tooltip uses a plain local date. Do not let missing Kazakh ICU
  // data turn it into an ambiguous US month/day date.
  if (locale === 'kk' && Object.keys(options).length === 0) return formatKazakhLocalDate(d);
  return new Intl.DateTimeFormat(localeTag(locale), options).format(d);
}

export function formatChartDate(d, locale = 'en') {
  // Some browsers lack Kazakh short month names; numeric local dates stay portable.
  if (locale === 'kk') {
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
  }
  return formatDate(d, locale, { month: 'short', day: 'numeric' });
}

export function formatDateTime(d, locale = 'en') {
  // Receipts and history share an explicit local-calendar, 24-hour format.
  if (locale === 'kk') return formatKazakhLocalDate(d, true);
  return formatDate(d, locale, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
}
