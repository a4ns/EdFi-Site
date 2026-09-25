import { useEffect, useMemo, useRef, useState } from 'react';
import { MarketsContext } from './markets';
import { COINS, EDC_START, FALLBACK_MARKETS } from '../data/content';

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
  const failures = useRef(0);

  // Live prices for majors from Binance.
  useEffect(() => {
    let timer;
    let cancelled = false;
    const load = async () => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      try {
        const res = await fetch(TICKER_URL, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const rows = await res.json();
        if (cancelled) return;
        setQuotes((prev) => {
          const next = { ...prev };
          for (const r of rows) {
            const s = r.symbol.replace(/USDT$/, '');
            if (!next[s]) continue;
            next[s] = withTick(next[s], {
              price: Number(r.lastPrice),
              change: Number(r.priceChangePercent),
              volume: Number(r.quoteVolume),
            });
          }
          return next;
        });
        setLive(true);
        failures.current = 0;
      } catch {
        failures.current += 1;
        if (!cancelled) setLive(false);
      } finally {
        clearTimeout(t);
        // back off when the API is unreachable
        if (!cancelled) timer = setTimeout(load, failures.current > 2 ? 60000 : POLL_MS);
      }
    };
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  // EDC is a pilot token with no public order book yet: simulate a gentle random walk.
  useEffect(() => {
    const id = setInterval(() => {
      setQuotes((prev) => {
        const drift = 1 + (Math.random() - 0.48) * 0.004;
        const price = Math.max(0.02, prev.EDC.price * drift);
        return {
          ...prev,
          EDC: withTick(prev.EDC, { price, change: (price / EDC_OPEN - 1) * 100 }),
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
