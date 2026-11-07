import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import CoinIcon from '../CoinIcon';
import FilterTabs from '../FilterTabs';
import { Change, Price } from '../PriceCell';
import { useMarkets } from '../../state/markets';
import { useLocale } from '../../state/locale';
import { formatAmount, formatPercent, formatUsd } from '../../lib/format';

// Demo wallet: EDC follows the live balance; the rest are fixed sample holdings.
const OTHER_HOLDINGS = [
  ['BNB', 0.0215],
  ['USDT', 32.5],
];
// A fixed demo valuation, not a fetched quote or a measured market change.
const USDT = { symbol: 'USDT', name: 'TetherUS', price: 1, change: null, tick: 0, dir: null };
const BAR = { EDC: 'bg-yellow-accent', BNB: 'bg-ink-2', USDT: 'bg-up' };

export default function MarketsWidget({ balance }) {
  const { locale, t } = useLocale();
  const { list, live } = useMarkets();
  const [tab, setTab] = useState('holding');
  const panelId = useId();
  const find = (s) => (s === 'USDT' ? USDT : list.find((q) => q.symbol === s));

  const holdings = [['EDC', balance], ...OTHER_HOLDINGS].map(([symbol, amount]) => {
    const quote = find(symbol);
    return { symbol, amount, quote, value: amount * quote.price };
  });
  const total = holdings.reduce((s, h) => s + h.value, 0);

  const rows =
    tab === 'hot'
      ? ['EDC', 'BNB', 'BTC', 'ETH', 'SOL'].map(find).filter(Boolean)
      : list.filter((quote) => quote.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);

  return (
    <section className="panel flex flex-col p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">{t('Markets')}</h2>
        <Link to="/markets" className="link-more">
          {t('More')}
          <ChevronRight size={16} />
        </Link>
      </div>
      <FilterTabs label={t('Market lists')} tabs={[{ id: 'holding', label: t('Holding') }, { id: 'hot', label: t('Hot') }, { id: 'gainers', label: t('Gainers') }]} value={tab} onChange={setTab} panelId={panelId} className="mt-3 flex flex-wrap gap-x-4 gap-y-1" tabClassName="!text-sm" />

      <div id={panelId} role="tabpanel" aria-labelledby={`${panelId}-tab-${tab}`} tabIndex={0}>
      {tab === 'holding' ? (
        <>
          <div className="mt-3">
            <div className="flex items-baseline justify-between text-xs text-ink-3">
              <span>{t('Total value')}</span>
              <span className="num text-sm font-medium text-ink">≈ {formatUsd(total, locale)}</span>
            </div>
            <div className="mt-2 flex h-2 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={t('Portfolio distribution')}>
              {holdings.map((h) => (
                <span key={h.symbol} className={BAR[h.symbol]} style={{ width: `${Math.max((h.value / total) * 100, 2)}%` }} />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
              {holdings.map((h) => (
                <span key={h.symbol} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${BAR[h.symbol]}`} />
                  {h.symbol} <span className="num text-ink-2">{formatPercent((h.value / total) * 100, 1, locale)}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="mt-3 flex h-8 items-center text-xs text-ink-3">
            <span className="flex-1">{t('Coin')}</span>
            <span className="w-[112px] text-right">{t('Amount / Value')}</span>
            <span className="w-[80px] text-right">{t('24h')}</span>
          </div>
          <ul>
            {holdings.map((h) => (
              <li key={h.symbol} className="flex h-12 items-center">
                <span className="flex flex-1 items-center gap-2">
                  <CoinIcon symbol={h.symbol} size={20} />
                  <span className="text-sm font-medium text-ink">{h.symbol}</span>
                </span>
                <span className="w-[112px] text-right">
                  <span className="num block text-sm text-ink">{formatAmount(h.amount, h.symbol === 'BNB' ? 4 : 2, locale)}</span>
                  <span className="num block text-xs text-ink-3">{formatUsd(h.value, locale)}</span>
                </span>
                {h.symbol === 'USDT'
                  ? <span className="w-[80px] text-right text-xs text-ink-3">{t('Not available')}</span>
                  : <Change value={h.quote.change} className="w-[80px] text-right text-sm" />}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-ink-3">{t('Sample holdings. USDT uses a fixed demo value of 1 USD; its 24h change is unavailable.')}</p>
        </>
      ) : (
        <>
          <div className="mt-2 flex h-8 items-center text-xs text-ink-3">
            <span className="flex-1">{t('Coin')}</span>
            <span className="w-[112px] text-right">{t('Price')}</span>
            <span className="w-[80px] text-right">{t('24h')}</span>
          </div>
          <ul>
            {rows.map((r) => (
              <li key={r.symbol} className="flex h-12 items-center">
                <span className="flex flex-1 items-center gap-2">
                  <CoinIcon symbol={r.symbol} size={20} />
                  <span className="text-sm font-medium text-ink">{r.symbol}</span>
                </span>
                <Price quote={r} className="w-[112px] text-right text-sm text-ink" />
                <Change value={r.change} className="w-[80px] text-right text-sm" />
              </li>
            ))}
          </ul>
          {rows.length === 0 && <p className="py-5 text-sm text-ink-3">{t(tab === 'gainers' ? 'No coins with a positive 24h change.' : 'No market quotes are available.')}</p>}
        </>
      )}
      </div>
      <p className="pt-3 text-xs text-ink-3">{tab === 'holding'
        ? t(live ? 'BNB uses live market data. EDC is simulated.' : 'BNB uses a saved price snapshot. EDC is simulated.')
        : t(live ? 'Live prices from Binance market data. EDC is simulated.' : 'Market prices are delayed or illustrative. EDC is simulated.')}</p>
    </section>
  );
}
