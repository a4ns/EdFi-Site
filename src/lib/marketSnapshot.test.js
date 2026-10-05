import { describe, expect, it } from 'vitest';
import { parseMarketSnapshot } from './marketSnapshot';
import { FALLBACK_MARKETS } from '../data/content';

const rows = Object.entries(FALLBACK_MARKETS).map(([symbol, quote]) => ({
  symbol: `${symbol}USDT`, lastPrice: String(quote.price), priceChangePercent: String(quote.change),
  quoteVolume: String(quote.volume), highPrice: String(quote.high), lowPrice: String(quote.low),
}));
const changed = (fields) => rows.map((row, i) => i ? row : { ...row, ...fields });

describe('untrusted public market snapshots', () => {
  it('accepts valid numbers and numeric strings without mutating the response', () => {
    const input = changed({ lastPrice: FALLBACK_MARKETS.BTC.price, quoteVolume: 0 });
    expect(parseMarketSnapshot(input).BTC).toEqual({ ...FALLBACK_MARKETS.BTC, volume: 0 });
    expect(input[0].highPrice).toBe(String(FALLBACK_MARKETS.BTC.high));
  });

  it.each([null, undefined, false, '', ' ', 'NaN', 'Infinity', Infinity, -Infinity, [], {}, '0x100'])('rejects coerced or non-finite numeric input %j', (value) => {
    for (const field of ['lastPrice', 'priceChangePercent', 'quoteVolume', 'highPrice', 'lowPrice']) {
      expect(parseMarketSnapshot(changed({ [field]: value }))).toBeNull();
    }
  });

  it.each([
    { lastPrice: 0 }, { lastPrice: -1 }, { quoteVolume: -1 }, { lowPrice: 0 },
    { lowPrice: 90000 }, { highPrice: 80000 }, { priceChangePercent: -101 },
  ])('rejects impossible market fields: %j', (fields) => {
    expect(parseMarketSnapshot(changed(fields))).toBeNull();
  });

  it('does not let additional unknown pairs or a fake EDC quote change known assets', () => {
    expect(parseMarketSnapshot([...rows, { symbol: 'EDCUSDT', lastPrice: 99 }, { symbol: '__proto__' }])).toEqual(FALLBACK_MARKETS);
    expect(parseMarketSnapshot([{ symbol: 'EDCUSDT', lastPrice: 99 }])).toBeNull();
  });

  it('rejects malformed rows and duplicate expected symbols', () => {
    expect(parseMarketSnapshot([...rows, null])).toBeNull();
    expect(parseMarketSnapshot([...rows, 'BTCUSDT'])).toBeNull();
    expect(parseMarketSnapshot([...rows, rows[0]])).toBeNull();
    expect(parseMarketSnapshot(rows.slice(1))).toBeNull();
  });
});
