import { COINS } from '../data/content';
import { LogoMark } from './Logo';

const GLYPHS = {
  BTC: <text x="12" y="16.6" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">₿</text>,
  ETH: (
    <g fill="#fff">
      <path d="M12 4.5 7.6 12.1 12 14.7l4.4-2.6z" opacity="0.9" />
      <path d="M12 15.6 7.6 13l4.4 6.3 4.4-6.3z" opacity="0.7" />
    </g>
  ),
  BNB: (
    <g fill="#fff">
      <rect x="9.6" y="9.6" width="4.8" height="4.8" transform="rotate(45 12 12)" />
      <rect x="11" y="5.2" width="2" height="2" transform="rotate(45 12 6.2)" />
      <rect x="11" y="16.8" width="2" height="2" transform="rotate(45 12 17.8)" />
      <rect x="5.2" y="11" width="2" height="2" transform="rotate(45 6.2 12)" />
      <rect x="16.8" y="11" width="2" height="2" transform="rotate(45 17.8 12)" />
    </g>
  ),
  SOL: (
    <g fill="#fff">
      <path d="M8.2 7.2h9.4l-1.8 1.9H6.4z" />
      <path d="M6.4 11.1h9.4l1.8 1.9H8.2z" />
      <path d="M8.2 15h9.4l-1.8 1.9H6.4z" />
    </g>
  ),
  XRP: (
    <g fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round">
      <path d="M7 7.5l3.4 3.3a2.3 2.3 0 0 0 3.2 0L17 7.5" />
      <path d="M7 16.5l3.4-3.3a2.3 2.3 0 0 1 3.2 0l3.4 3.3" />
    </g>
  ),
  USDT: <text x="12" y="16.8" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">₮</text>,
};

export default function CoinIcon({ symbol, size = 24, className = '' }) {
  if (symbol === 'EDC') {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <LogoMark size={size * 0.64} color="#202630" />
      </span>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`shrink-0 ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill={COINS[symbol]?.color ?? '#474D57'} />
      {GLYPHS[symbol] ?? (
        <text x="12" y="16.2" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
          {symbol[0]}
        </text>
      )}
    </svg>
  );
}
