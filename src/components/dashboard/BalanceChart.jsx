import { useId, useMemo } from 'react';

// Small 30-day balance area chart ending at the current balance.
export default function BalanceChart({ end, width = 280, height = 88 }) {
  const gid = useId();
  const points = useMemo(() => {
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const n = 30;
    const vals = [];
    let v = end * 0.52;
    for (let i = 0; i < n - 1; i += 1) {
      v += (end - v) * 0.08 + (rand() - 0.42) * end * 0.05;
      vals.push(v);
    }
    vals.push(end);
    return vals;
  }, [end]);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const x = (i) => (i / (points.length - 1)) * width;
  const y = (v) => height - 6 - ((v - min) / (max - min || 1)) * (height - 14);
  const line = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#F0B90B" stopOpacity="0.28" />
          <stop offset="1" stopColor="#F0B90B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${width} ${height} L0 ${height} Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke="#F0B90B" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <circle cx={x(points.length - 1) - 2} cy={y(end)} r="3" fill="#F0B90B" />
    </svg>
  );
}
