import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { formatAmount, formatChartDate, formatDate } from '../../lib/format';
import { BALANCE_RANGES, balanceAxis, balanceDate, buildBalanceSeries } from '../../lib/balanceChart';
import { useLocale } from '../../state/locale';

// Balance history ending at the current balance, drawn at the container's real pixel width.
export default function BalanceChart({ end, height = 168 }) {
  const { locale, t } = useLocale();
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

  const points = useMemo(() => buildBalanceSeries(end, BALANCE_RANGES[range]), [end, range]);

  const { ticks, digits } = balanceAxis(Math.min(...points), Math.max(...points));
  const tickLabels = ticks.map((value) => formatAmount(value, digits, locale));
  const pad = 8;
  const gutter = Math.max(52, ...tickLabels.map((label) => label.length * 7 + 12));
  const axis = 22; // room for x-axis date labels
  const plotH = height - axis;
  const min = ticks[0];
  const max = ticks[ticks.length - 1];
  const x = (i) => gutter + (i / (points.length - 1)) * (width - gutter - pad);
  const y = (v) => plotH - pad - ((v - min) / (max - min || 1)) * (plotH - pad * 2);
  const line = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const hi = Math.min(hover ?? points.length - 1, points.length - 1);
  const date = balanceDate(today, points.length - 1 - hi);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - gutter) / (width - gutter - pad)) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-ink-3">{t('Illustrative balance chart')}</span>
        <div className="flex gap-1">
          {Object.keys(BALANCE_RANGES).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRange(r); setHover(null); }}
              aria-label={t('Last {count} days', { count: BALANCE_RANGES[r] })}
              aria-pressed={range === r}
              className={`h-6 rounded px-2 text-xs transition-colors ${range === r ? 'bg-raised text-ink' : 'text-ink-3 hover:text-ink'}`}
            >
              {t('{count}D', { count: BALANCE_RANGES[r] })}
            </button>
          ))}
        </div>
      </div>
      <div ref={wrap} className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <svg width={width} height={height} className="block text-yellow-text" aria-hidden="true">
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.16" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((v, i) => (
            <g key={v}>
              <line x1={gutter} x2={width} y1={y(v)} y2={y(v)} stroke="currentColor" className="text-line" strokeDasharray="2 4" />
              <text x={0} y={y(v) + 4} fontSize="12" fill="rgb(var(--c-ink-3))" className="num">
                {tickLabels[i]}
              </text>
            </g>
          ))}
          <path d={`${line} L${x(points.length - 1)} ${plotH} L${x(0)} ${plotH} Z`} fill={`url(#${gid})`} />
          <path d={line} fill="none" stroke="currentColor" strokeWidth="1.5" />
          {[0, 0.5, 1].map((f) => {
            const i = Math.round(f * (points.length - 1));
            const d = balanceDate(today, points.length - 1 - i);
            const label = formatChartDate(d, locale);
            return (
              <text key={f} x={x(i)} y={height - 5} fontSize="12" textAnchor={f === 0 ? 'start' : f === 1 ? 'end' : 'middle'} fill="rgb(var(--c-ink-3))" className="num">
                {label}
              </text>
            );
          })}
          {hover != null && <line x1={x(hi)} x2={x(hi)} y1={0} y2={plotH} stroke="currentColor" className="text-line-strong" strokeDasharray="3 3" />}
          <circle cx={x(hi)} cy={y(points[hi])} r="3.5" fill="currentColor" />
        </svg>
        {hover != null && (
          <div
            className="pointer-events-none absolute top-0 z-10 rounded-md bg-raised px-2 py-1 text-xs shadow-pop"
            style={{ left: Math.min(Math.max(x(hi) - 60, 0), width - 128) }}
          >
            <span className="num text-ink-3">{formatDate(date, locale)}</span>{' '}
            <span className="num font-medium text-ink">{formatAmount(points[hi], Math.max(2, digits), locale)} EDC</span>
          </div>
        )}
      </div>
    </div>
  );
}
