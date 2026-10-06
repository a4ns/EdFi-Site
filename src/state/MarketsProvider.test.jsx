import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MarketsProvider from './MarketsProvider';
import { useMarkets } from './markets';
import { EDC_START, FALLBACK_MARKETS } from '../data/content';

function rowsAt(factor = 1) {
  return Object.entries(FALLBACK_MARKETS).map(([symbol, quote]) => ({
    symbol: `${symbol}USDT`, lastPrice: String(quote.price * factor),
    priceChangePercent: String(quote.change), quoteVolume: String(quote.volume),
    highPrice: String(quote.high * factor), lowPrice: String(quote.low * factor),
  }));
}

const response = (rows) => ({ ok: true, json: async () => rows });
const advance = (ms) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
const settle = () => act(async () => {});
let fetchMock;

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.48);
  fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));
});
afterEach(async () => {
  cleanup();
  await settle();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('market snapshot lifecycle', () => {
  it('starts with finite fallback prices and never calls the public endpoint for EDC', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(useMarkets, { wrapper: MarketsProvider });
    expect(result.current.live).toBe(false);
    expect(result.current.quotes.EDC).toMatchObject({ price: EDC_START.price, tick: 0, dir: null });
    expect(result.current.quotes.EDC.change).toBeCloseTo(EDC_START.change);
    for (const [symbol, quote] of Object.entries(FALLBACK_MARKETS)) {
      expect(result.current.quotes[symbol]).toEqual({ ...quote, tick: 0, dir: null });
    }
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(`${url.origin}${url.pathname}`).toBe('https://data-api.binance.vision/api/v3/ticker/24hr');
    expect(JSON.parse(url.searchParams.get('symbols'))).toEqual(Object.keys(FALLBACK_MARKETS).map((symbol) => `${symbol}USDT`));
    expect(result.current.list.map(({ symbol }) => symbol)).toEqual(['EDC', ...Object.keys(FALLBACK_MARKETS)]);
    await advance(3000);
    expect(result.current.live).toBe(false);
  });

  it('applies complete snapshots atomically and flashes only when a price changes', async () => {
    fetchMock.mockResolvedValueOnce(response(rowsAt(2))).mockResolvedValueOnce(response(rowsAt(2))).mockResolvedValueOnce(response(rowsAt(1.5)));
    const { result } = renderHook(useMarkets, { wrapper: MarketsProvider });
    await settle();
    expect(result.current.live).toBe(true);
    const first = result.current.quotes;
    for (const symbol of Object.keys(FALLBACK_MARKETS)) {
      expect(first[symbol]).toMatchObject({ price: FALLBACK_MARKETS[symbol].price * 2, tick: 1, dir: 'up' });
    }
    await advance(5000);
    expect(result.current.quotes.BTC.tick).toBe(1);
    await advance(5000);
    expect(result.current.quotes.BTC).toMatchObject({ price: FALLBACK_MARKETS.BTC.price * 1.5, tick: 2, dir: 'down' });
    expect(first.BTC.price).toBe(FALLBACK_MARKETS.BTC.price * 2);
    expect(result.current.quotes.EDC).toMatchObject({ price: EDC_START.price, tick: 0, dir: null });
    expect(result.current.quotes.EDC.change).toBeCloseTo(EDC_START.change);
  });

  it.each([
    ['empty', []], ['non-array', { message: 'Service unavailable' }], ['null', null],
    ['partial', rowsAt(3).slice(1)],
    ['invalid numeric price', rowsAt(3).map((row, i) => i ? row : { ...row, lastPrice: 'NaN' })],
    ['duplicate pair', [...rowsAt(3), rowsAt(3)[0]]],
  ])('rejects a %s response without losing the last good snapshot, then recovers', async (_, rows) => {
    fetchMock.mockResolvedValueOnce(response(rowsAt(2))).mockResolvedValueOnce(response(rows)).mockResolvedValueOnce(response(rowsAt(3)));
    const { result } = renderHook(useMarkets, { wrapper: MarketsProvider });
    await settle();
    const good = result.current.quotes.BTC;
    await advance(5000);
    expect(result.current.live).toBe(false);
    expect(result.current.quotes.BTC).toBe(good);
    expect(result.current.list.every((quote) => ['price', 'change', 'volume', 'high', 'low'].every((key) => Number.isFinite(quote[key])))).toBe(true);
    await advance(5000);
    expect(result.current.live).toBe(true);
    expect(result.current.quotes.BTC.price).toBe(FALLBACK_MARKETS.BTC.price * 3);
  });

  it.each([
    ['network', () => Promise.reject(new Error('Offline'))],
    ['HTTP error', async () => ({ ok: false, status: 429, json: async () => rowsAt(2) })],
    ['JSON error', async () => ({ ok: true, json: async () => { throw new SyntaxError('Invalid JSON'); } })],
  ])('keeps fallback data on an initial %s failure', async (_, load) => {
    fetchMock.mockImplementation(load);
    const { result } = renderHook(useMarkets, { wrapper: MarketsProvider });
    await settle();
    expect(result.current.live).toBe(false);
    expect(result.current.quotes.BTC.price).toBe(FALLBACK_MARKETS.BTC.price);
  });

  it('backs off after three failures and resets to five seconds after recovery', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Offline')).mockRejectedValueOnce(new Error('Offline')).mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(response(rowsAt(2)));
    const { result } = renderHook(useMarkets, { wrapper: MarketsProvider });
    await settle();
    await advance(10000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await advance(59999);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await advance(1);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(result.current.live).toBe(true);
    await advance(4999);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    await advance(1);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('waits until a request finishes before starting its next polling interval', async () => {
    let resolve;
    fetchMock.mockImplementationOnce(() => new Promise((done) => { resolve = done; })).mockResolvedValue(response(rowsAt(2)));
    renderHook(useMarkets, { wrapper: MarketsProvider });
    await advance(3999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => resolve(response(rowsAt(2))));
    await advance(4999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each(['headers', 'body'])('aborts stalled %s, retries and ignores a late stale response', async (stage) => {
    let resolve;
    const stalled = new Promise((done) => { resolve = done; });
    fetchMock.mockImplementationOnce(() => stage === 'headers' ? stalled : Promise.resolve({ ok: true, json: () => stalled }))
      .mockResolvedValue(response(rowsAt(2)));
    const { result } = renderHook(useMarkets, { wrapper: MarketsProvider });
    const signal = fetchMock.mock.calls[0][1].signal;
    await advance(3999);
    expect(signal.aborted).toBe(false);
    await advance(1);
    expect(signal.aborted).toBe(true);
    expect(result.current.live).toBe(false);
    await advance(5000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.live).toBe(true);
    await act(async () => resolve(stage === 'headers' ? response(rowsAt(9)) : rowsAt(9)));
    expect(result.current.quotes.BTC.price).toBe(FALLBACK_MARKETS.BTC.price * 2);
    expect(result.current.live).toBe(true);
  });

  it('aborts on unmount and removes request, retry and simulation timers', async () => {
    let resolve;
    fetchMock.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    const { unmount } = renderHook(useMarkets, { wrapper: MarketsProvider });
    const signal = fetchMock.mock.calls[0][1].signal;
    unmount();
    expect(signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => resolve(response(rowsAt(3))));
    await advance(120000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels its scheduled backoff on unmount', async () => {
    const { unmount } = renderHook(useMarkets, { wrapper: MarketsProvider });
    await settle();
    await advance(10000);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    await advance(120000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('isolates aborted Strict Mode effects from the replacement request', async () => {
    let resolve;
    fetchMock.mockImplementationOnce(() => new Promise((done) => { resolve = done; })).mockResolvedValue(response(rowsAt(2)));
    const { result } = renderHook(useMarkets, { wrapper: MarketsProvider, reactStrictMode: true });
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    await act(async () => resolve(response(rowsAt(9))));
    expect(result.current.live).toBe(true);
    expect(result.current.quotes.BTC.price).toBe(FALLBACK_MARKETS.BTC.price * 2);
    await advance(5000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
