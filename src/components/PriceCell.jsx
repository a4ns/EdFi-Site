import { formatChange, formatUsd } from '../lib/format';

// Price that briefly flashes green/red when it ticks, like on binance.com.
export function Price({ quote, className = '' }) {
  const flash = quote.dir === 'up' ? 'animate-flash-up' : quote.dir === 'down' ? 'animate-flash-down' : '';
  return (
    <span key={quote.tick} className={`num rounded-sm ${quote.tick ? flash : ''} ${className}`}>
      {formatUsd(quote.price)}
    </span>
  );
}

export function Change({ value, className = '' }) {
  return <span className={`num ${value >= 0 ? 'text-up' : 'text-down'} ${className}`}>{formatChange(value)}</span>;
}

export function ChangePill({ value, className = '' }) {
  return (
    <span
      className={`num inline-flex h-7 min-w-[72px] items-center justify-center rounded px-2 text-sm font-medium text-white ${value >= 0 ? 'bg-up' : 'bg-down'} ${className}`}
    >
      {formatChange(value)}
    </span>
  );
}
