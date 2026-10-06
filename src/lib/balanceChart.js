export const BALANCE_RANGES = { '7D': 7, '30D': 30, '90D': 90 };

// Illustrative values only, independent of locale and the demo wallet ledger.
// The seeded walk always ends exactly at the current balance.
export function buildBalanceSeries(end, days) {
  const n = Object.values(BALANCE_RANGES).includes(days) ? days : 30;
  const balance = Number.isFinite(end) && end >= 0 ? end : 0;
  let seed = 11 + n;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const growth = { 7: 0.86, 30: 0.62, 90: 0.4 }[n];
  const step = Math.pow(growth, 1 / (n - 1));
  const values = [balance];
  let value = balance;
  for (let i = 1; i < n; i += 1) {
    const shock = rand() < 0.12 ? (rand() - 0.3) * 0.09 : (rand() - 0.5) * 0.012;
    value = Math.max(balance * 0.15, value * step * (1 + shock));
    values.unshift(value);
  }
  return values;
}

export function balanceAxis(lo, hi) {
  const raw = (hi - lo) / 3 || 1;
  const exponent = Math.floor(Math.log10(raw));
  const magnitude = 10 ** exponent;
  const multiplier = [1, 2, 2.5, 5, 10].find((value) => value * magnitude >= raw);
  const step = multiplier * magnitude;
  const start = Math.floor(lo / step);
  const count = Math.max(1, Math.ceil(hi / step) - start);
  // Index multiplication avoids an accumulated floating-point error in the loop.
  const ticks = Array.from({ length: count + 1 }, (_, i) => Number(((start + i) * step).toPrecision(14)));
  const digits = Math.max(0, -exponent + (multiplier === 2.5 ? 1 : multiplier === 10 ? -1 : 0));
  return { ticks, digits };
}

export function balanceDate(today, daysAgo) {
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  return date;
}
