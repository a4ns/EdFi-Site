import { useMemo } from 'react';
import qrcode from 'qrcode-generator';
import { LogoMark } from './Logo';

// Real, scannable QR code rendered as a single SVG path, with the EdFi mark in the centre.
export default function QRCode({ value, size = 120, className = '' }) {
  const { path, count } = useMemo(() => {
    const qr = qrcode(0, 'H');
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r += 1) {
      for (let c = 0; c < n; c += 1) {
        if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
      }
    }
    return { path: d, count: n };
  }, [value]);

  const logo = size * 0.24;
  return (
    <div className={`relative inline-flex rounded-lg bg-white p-2 ${className}`} style={{ width: size + 16, height: size + 16 }}>
      <svg width={size} height={size} viewBox={`0 0 ${count} ${count}`} shapeRendering="crispEdges" role="img" aria-label={`QR code for ${value}`}>
        <path d={path} fill="#0B0E11" />
      </svg>
      <span
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md bg-white"
        style={{ width: logo + 6, height: logo + 6 }}
      >
        <span className="flex items-center justify-center rounded bg-brand" style={{ width: logo, height: logo }}>
          <LogoMark size={logo * 0.72} color="#202630" />
        </span>
      </span>
    </div>
  );
}
