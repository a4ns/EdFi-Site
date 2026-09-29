// Deterministic mini chart. `up` fixes the direction; without it the seed decides.
function series(seed, dir, n = 24) {
  let h = 7;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 100003;
  const rand = () => {
    h = (h * 16807) % 2147483647;
    return h / 2147483647;
  };
  const d = dir ?? (rand() > 0.45 ? 1 : -1);
  const pts = [];
  let v = 0;
  for (let i = 0; i < n; i += 1) {
    v += (rand() - 0.5) * 1.7 + d * 0.24;
    pts.push(v);
  }
  return { pts, up: pts[n - 1] >= pts[0] };
}

export default function Sparkline({ seed, up, width = 90, height = 28, className = 'ml-auto' }) {
  const { pts, up: goesUp } = series(seed, up === undefined ? undefined : up ? 1 : -1);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const d = pts
    .map((v, i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1)) * (width - 2) + 1} ${height - 3 - ((v - min) / (max - min || 1)) * (height - 6)}`)
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={`${className} ${goesUp ? 'text-up' : 'text-down'}`} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
