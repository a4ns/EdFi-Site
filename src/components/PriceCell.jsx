import { formatChange, formatUsd } from '../lib/format';
import { useLocale } from '../state/locale';

// Price that briefly flashes green/red when it ticks, like on binance.com.
// The flash is scoped to the text so it never fills a wider layout cell.
export function Price({ quote, className = '' }) {
  const { locale } = useLocale();
  const flash = quote.dir === 'up' ? 'animate-flash-up' : quote.dir === 'down' ? 'animate-flash-down' : '';
  return (
    <span className={className}>
      <span key={quote.tick} className={`num rounded-sm px-0.5 ${quote.tick ? flash : ''}`}>
        {formatUsd(quote.price, locale)}
      </span>
    </span>
  );
}

export function Change({ value, className = '' }) {
  const { locale } = useLocale();
  return <span className={`num ${value >= 0 ? 'text-up' : 'text-down'} ${className}`}>{formatChange(value, locale)}</span>;
}

export function ChangePill({ value, className = '' }) {
  const { locale } = useLocale();
  return (
    <span
      className={`num inline-flex h-7 min-w-[72px] items-center justify-center rounded px-2 text-sm font-medium text-white ${value >= 0 ? 'bg-up' : 'bg-down'} ${className}`}
    >
      {formatChange(value, locale)}
    </span>
  );
}
