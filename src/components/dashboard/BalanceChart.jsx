import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { formatAmount } from '../../lib/format';

const RANGES = { '7D': 7, '30D': 30, '90D': 90 };
const DAY = 24 * 3600 * 1000;

// Balance history ending at the current balance, drawn at the container's real pixel width.
export default function BalanceChart({ end, height = 96 }) {
  const gid = useId();
  const wrap = useRef(null);
  const [width, setWidth] = useState(600);
  const [range, setRange] = useState('30D');
  const [hover, setHover] = useState(null);
  const [today] = useState(() => Date.now());

  useEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(200, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points = useMemo(() => {
    const n = RANGES[range];
    let seed = 7 + n;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const vals = [];
    let v = end * (n === 7 ? 0.85 : n === 30 ? 0.55 : 0.3);
    for (let i = 0; i < n - 1; i += 1) {
      v += (end * 0.97 - v) * (3 / n) + (rand() - 0.45) * end * 0.03;
      vals.push(Math.min(v, end * 0.985));
    }
    vals.push(end);
    return vals;
  }, [end, range]);

  const pad = 6;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const x = (i) => pad + (i / (points.length - 1)) * (width - pad * 2);
  const y = (v) => height - pad - ((v - min) / (max - min || 1)) * (height - pad * 2);
  const line = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const hi = hover ?? points.length - 1;
  const date = new Date(today - (points.length - 1 - hi) * DAY);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - pad) / (width - pad * 2)) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-ink-3">Balance history</span>
        <div className="flex gap-1">
          {Object.keys(RANGES).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={`h-6 rounded px-2 text-xs transition-colors ${range === r ? 'bg-raised text-ink' : 'text-ink-3 hover:text-ink'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div ref={wrap} className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <svg width={width} height={height} className="block" aria-hidden="true">
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#F0B90B" stopOpacity="0.28" />
              <stop offset="1" stopColor="#F0B90B" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line} L${x(points.length - 1)} ${height} L${x(0)} ${height} Z`} fill={`url(#${gid})`} />
          <path d={line} fill="none" stroke="#F0B90B" strokeWidth="1.5" />
          {hover != null && <line x1={x(hi)} x2={x(hi)} y1={0} y2={height} stroke="currentColor" className="text-line-strong" strokeDasharray="3 3" />}
          <circle cx={x(hi)} cy={y(points[hi])} r="3.5" fill="#F0B90B" />
        </svg>
        {hover != null && (
          <div
            className="pointer-events-none absolute top-0 z-10 rounded-md bg-raised px-2 py-1 text-xs shadow-pop"
            style={{ left: Math.min(Math.max(x(hi) - 60, 0), width - 128) }}
          >
            <span className="num text-ink-3">{date.toISOString().slice(0, 10)}</span>{' '}
            <span className="num font-medium text-ink">{formatAmount(points[hi])} EDC</span>
          </div>
        )}
      </div>
    </div>
  );
}
