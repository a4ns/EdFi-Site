const usd2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export const KZT_PER_USD = 520;

export function formatPrice(p) {
  if (p == null || Number.isNaN(p)) return '--';
  if (p >= 1) return usd2.format(p);
  return p.toFixed(4);
}

export function formatUsd(p) {
  return `$${formatPrice(p)}`;
}

export function formatChange(c) {
  if (c == null || Number.isNaN(c)) return '--';
  return `${c >= 0 ? '+' : ''}${c.toFixed(2)}%`;
}

export function formatAmount(n, digits = 2) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

export function formatInt(n) {
  return int.format(n);
}

export function formatCompact(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return usd2.format(n);
}

const pad = (n) => String(n).padStart(2, '0');

export function formatDateTime(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
