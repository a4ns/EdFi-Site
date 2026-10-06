import { FALLBACK_MARKETS } from '../data/content';

const SYMBOLS = Object.keys(FALLBACK_MARKETS);
const PAIRS = new Map(SYMBOLS.map((symbol) => [`${symbol}USDT`, symbol]));

function numeric(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !/^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// Apply complete snapshots atomically, so "live" never describes a mixture of
// fresh prices and fallback data. EDC is deliberately absent from public pairs.
export function parseMarketSnapshot(rows) {
  if (!Array.isArray(rows)) return null;
  const snapshot = {};
  for (const row of rows) {
    if (!row || typeof row !== 'object') return null;
    const symbol = PAIRS.get(row.symbol);
    if (!symbol) continue;
    if (Object.hasOwn(snapshot, symbol)) return null;
    const quote = {
      price: numeric(row.lastPrice),
      change: numeric(row.priceChangePercent),
      volume: numeric(row.quoteVolume),
      high: numeric(row.highPrice),
      low: numeric(row.lowPrice),
    };
    if (Object.values(quote).some((value) => value === null)
      || quote.price <= 0 || quote.volume < 0 || quote.low <= 0
      || quote.low > quote.price || quote.high < quote.price || quote.change < -100) return null;
    snapshot[symbol] = quote;
  }
  return SYMBOLS.every((symbol) => Object.hasOwn(snapshot, symbol)) ? snapshot : null;
}
