import { useEffect, useMemo, useState } from 'react';
import { MarketsContext } from './markets';
import { COINS, EDC_START, FALLBACK_MARKETS } from '../data/content';
import { parseMarketSnapshot } from '../lib/marketSnapshot';

const LIVE_SYMBOLS = Object.keys(FALLBACK_MARKETS);
// Binance's public market-data endpoint (read-only, CORS enabled, not geo-restricted).
const TICKER_URL = `https://data-api.binance.vision/api/v3/ticker/24hr?symbols=${encodeURIComponent(
  JSON.stringify(LIVE_SYMBOLS.map((s) => `${s}USDT`)),
)}`;
const POLL_MS = 5000;
const EDC_OPEN = EDC_START.price / (1 + EDC_START.change / 100);

function initialState() {
  const state = { EDC: { ...EDC_START, tick: 0, dir: null } };
  for (const s of LIVE_SYMBOLS) state[s] = { ...FALLBACK_MARKETS[s], tick: 0, dir: null };
  return state;
}

function withTick(prev, next) {
  if (prev.price === next.price) return { ...prev, ...next };
  return { ...prev, ...next, dir: next.price > prev.price ? 'up' : 'down', tick: prev.tick + 1 };
}

export default function MarketsProvider({ children }) {
  const [quotes, setQuotes] = useState(initialState);
  const [live, setLive] = useState(false);

  // Live prices for majors from Binance.
  useEffect(() => {
    let timer;
    let deadline;
    let cancelled = false;
    let active;
    let failures = 0;
    const load = async () => {
      const ctrl = new AbortController();
      active = ctrl;
      let onAbort;
      const aborted = new Promise((_, reject) => {
        onAbort = () => reject(new Error('Market request aborted'));
        ctrl.signal.addEventListener('abort', onAbort, { once: true });
      });
      const t = setTimeout(() => ctrl.abort(), 4000);
      deadline = t;
      try {
        // The deadline covers the body as well as headers. Racing the abort
        // also prevents a late response from an interrupted request winning.
        const rows = await Promise.race([
          fetch(TICKER_URL, { signal: ctrl.signal }).then((res) => {
            if (!res.ok) throw new Error(String(res.status));
            return res.json();
          }),
          aborted,
        ]);
        if (cancelled || ctrl.signal.aborted) return;
        const snapshot = parseMarketSnapshot(rows);
        if (!snapshot) throw new Error('Incomplete or invalid market snapshot');
        setQuotes((prev) => {
          const next = { ...prev };
          for (const s of LIVE_SYMBOLS) {
            next[s] = withTick(prev[s], snapshot[s]);
          }
          return next;
        });
        setLive(true);
        failures = 0;
      } catch {
        if (!cancelled) {
          failures += 1;
          setLive(false);
        }
      } finally {
        clearTimeout(t);
        ctrl.signal.removeEventListener('abort', onAbort);
        active = null;
        // back off when the API is unreachable
        if (!cancelled) timer = setTimeout(load, failures > 2 ? 60000 : POLL_MS);
      }
    };
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(deadline);
      active?.abort();
    };
  }, []);

  // EDC is a pilot token with no public order book yet: simulate a gentle random walk.
  useEffect(() => {
    const id = setInterval(() => {
      const drift = 1 + (Math.random() - 0.48) * 0.004;
      setQuotes((prev) => {
        const price = Math.max(0.02, prev.EDC.price * drift);
        return {
          ...prev,
          EDC: withTick(prev.EDC, {
            price,
            change: (price / EDC_OPEN - 1) * 100,
            high: Math.max(prev.EDC.high, price),
            low: Math.min(prev.EDC.low, price),
          }),
        };
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const value = useMemo(() => {
    const list = Object.entries(quotes).map(([symbol, q]) => ({ symbol, name: COINS[symbol].name, ...q }));
    return { quotes, list, live };
  }, [quotes, live]);

  return <MarketsContext.Provider value={value}>{children}</MarketsContext.Provider>;
}
