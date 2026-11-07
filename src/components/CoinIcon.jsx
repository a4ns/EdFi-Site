import { LogoMark } from './Logo';

// Curated, locally served SVGs. Attribution and the upstream revision are in public/coins/NOTICE.md.
const COIN_MARKS = {
  ADA: '/coins/ada.svg',
  AVAX: '/coins/avax.svg',
  BNB: '/coins/bnb.svg',
  BTC: '/coins/btc.svg',
  DOGE: '/coins/doge.svg',
  DOT: '/coins/dot.svg',
  ETH: '/coins/eth.svg',
  LINK: '/coins/link.svg',
  LTC: '/coins/ltc.svg',
  SOL: '/coins/sol.svg',
  SUI: '/coins/sui.svg',
  TON: '/coins/ton.svg',
  TRX: '/coins/trx.svg',
  USDT: '/coins/usdt.svg',
  XRP: '/coins/xrp.svg',
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

  if (Object.hasOwn(COIN_MARKS, symbol)) {
    return (
      <img
        src={COIN_MARKS[symbol]}
        width={size}
        height={size}
        className={`shrink-0 rounded-full ring-1 ring-inset ring-line ${className}`}
        alt=""
        aria-hidden="true"
        draggable="false"
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`shrink-0 text-ink-3 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="12" className="fill-raised" />
      <path fill="currentColor" fillRule="evenodd" d="M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" />
      <path fill="currentColor" d="m12 8.5 3.5 3.5-3.5 3.5L8.5 12Z" />
    </svg>
  );
}
