import { useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Star } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CoinIcon from '../components/CoinIcon';
import Sparkline from '../components/Sparkline';
import FilterTabs from '../components/FilterTabs';
import { Change, ChangePill, Price } from '../components/PriceCell';
import { useMarkets } from '../state/markets';
import { formatCompact, formatUsd } from '../lib/format';
import { useLocale } from '../state/locale';
import { readFavorites, toggleFavorite } from '../lib/favorites';

const TABS = [
  ['favorites', 'Favorites'],
  ['all', 'All'],
  ['gainers', 'Top Gainers'],
  ['losers', 'Top Losers'],
  ['volume', 'Top Volume'],
];

function HotCard({ title, rows, emptyMessage = 'No market quotes are available.' }) {
  const { t } = useLocale();
  return (
    <div className="card w-[86%] shrink-0 snap-start p-4 md:w-auto md:p-5">
      <h2 className="text-base font-semibold text-ink">{t(title)}</h2>
      {rows.length > 0 ? <ul className="mt-2">
        {rows.map((r) => (
          <li key={r.symbol}>
            <Link to={`/markets/${r.symbol}`} aria-label={t('View {name} ({symbol}) details', { name: r.name, symbol: r.symbol })} className="flex min-h-11 items-center rounded-md transition-colors hover:bg-raised">
              <CoinIcon symbol={r.symbol} size={20} />
              <span className="ml-2 text-xs font-medium text-ink xl:text-sm">{r.symbol}</span>
              <Price quote={r} className="ml-auto mr-2 text-xs text-ink xl:text-sm" />
              <Change value={r.change} className="w-[64px] shrink-0 text-right text-xs xl:text-sm" />
            </Link>
          </li>
        ))}
      </ul> : <p className="mt-3 text-sm leading-6 text-ink-3">{t(emptyMessage)}</p>}
    </div>
  );
}

function SortHead({ k, sort, onSort, children, className = '' }) {
  const on = sort.key === k;
  const Arrow = !on ? ArrowUpDown : sort.dir === 'desc' ? ArrowDown : ArrowUp;
  return (
    <th className={`text-right font-normal ${className}`} aria-sort={on ? (sort.dir === 'desc' ? 'descending' : 'ascending') : 'none'}>
      <button type="button" onClick={() => onSort(k)} className={`inline-flex items-center gap-1 transition-colors hover:text-ink ${on ? 'text-ink' : ''}`}>
        {children}
        <Arrow size={12} />
      </button>
    </th>
  );
}

export default function MarketsPage() {
  const { locale, t } = useLocale();
  const { list, live } = useMarkets();
  const [tab, setTab] = useState('all');
  const panelId = useId();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ key: null, dir: 'desc' });
  const [favorites, setFavorites] = useState(readFavorites);

  useEffect(() => {
    document.title = t('Markets | EdFi');
    return () => {
      document.title = t('EdFi | Learn-to-Earn on BNB Chain');
    };
  }, [t]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    let out = list.filter((c) => !term || c.symbol.toLowerCase().includes(term) || c.name.toLowerCase().includes(term));
    if (tab === 'favorites') out = out.filter((c) => favorites.includes(c.symbol));
    else if (tab === 'gainers') out = out.filter((c) => c.change > 0).sort((a, b) => b.change - a.change);
    else if (tab === 'losers') out = out.filter((c) => c.change < 0).sort((a, b) => a.change - b.change);
    else if (tab === 'volume') out = [...out].sort((a, b) => b.volume - a.volume);
    else out = [...out].sort((a, b) => (a.symbol === 'EDC' ? -1 : b.symbol === 'EDC' ? 1 : b.volume - a.volume));
    if (sort.key) out = [...out].sort((a, b) => (sort.dir === 'desc' ? b[sort.key] - a[sort.key] : a[sort.key] - b[sort.key]));
    return out;
  }, [list, tab, q, sort, favorites]);

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));
  const top = (coins, fn) => [...coins].sort(fn).slice(0, 3);

  return (
    <div className="min-h-screen bg-page">
      <Header variant="site" />
      <main id="main-content" tabIndex={-1} className="page-x pb-16 pt-8 scroll-mt-16 focus:outline-none md:pt-12">
        <h1 className="text-[32px] font-semibold leading-10 text-ink md:text-[40px] md:leading-[48px]">{t('Markets')}</h1>
        <p className="mt-2 flex items-start gap-2 text-sm text-ink-3">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${live ? 'bg-up' : 'bg-ink-3'}`} />
          <span>{t(live ? 'Live prices from Binance market data.' : 'Price snapshot.')} {t('EDC prices are simulated. The token is not deployed.')}</span>
        </p>

        {/* Phones: one swipeable row with the next card peeking; tablet and up: three columns. */}
        <div className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
          <HotCard title="Hot Coins" rows={top(list, (a, b) => b.volume - a.volume)} />
          <HotCard title="Top Gainers" rows={top(list.filter((coin) => coin.change > 0), (a, b) => b.change - a.change)} emptyMessage="No coins with a positive 24h change." />
          <HotCard title="Top Losers" rows={top(list.filter((coin) => coin.change < 0), (a, b) => a.change - b.change)} emptyMessage="No coins with a negative 24h change." />
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-4 border-b border-line">
          <FilterTabs label={t('Market lists')} tabs={TABS.map(([id, label]) => ({ id, label: t(label) }))} value={tab} onChange={setTab} panelId={panelId} className="no-scrollbar flex max-w-full gap-6 overflow-x-auto" />
          <label className="mb-2 flex h-9 w-full items-center gap-2 rounded-lg border border-line-strong px-3 focus-within:border-focus hover:border-yellow sm:w-[240px]">
            <Search size={16} className="text-ink-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('Search coins')}
              aria-label={t('Search coins')}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
            />
          </label>
        </div>

        <div id={panelId} role="tabpanel" aria-labelledby={`${panelId}-tab-${tab}`} tabIndex={0}>
        <table className="w-full table-fixed">
          <thead>
            <tr className="h-12 text-left text-xs text-ink-3">
              <th className="w-auto pl-2 font-normal">{t('Name')}</th>
              <SortHead k="price" sort={sort} onSort={toggleSort} className="w-[120px] md:w-[150px]">
                {t('Price')}
              </SortHead>
              <SortHead k="change" sort={sort} onSort={toggleSort} className="w-[96px] md:w-[130px]">
                {t('24h Change')}
              </SortHead>
              <th className="hidden w-[190px] text-right font-normal lg:table-cell">{t('24h High / Low')}</th>
              <SortHead k="volume" sort={sort} onSort={toggleSort} className="hidden w-[150px] md:table-cell">
                {t('24h Volume')}
              </SortHead>
              <th className="hidden w-[130px] pr-2 text-right font-normal lg:table-cell">{t('Illustrative trend')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.symbol} className="h-16 border-t border-line/60 transition-colors hover:bg-card">
                <td className="rounded-l-lg pl-2">
                  <div className="flex min-w-0 items-center gap-1">
                  <button
                    type="button"
                    aria-pressed={favorites.includes(c.symbol)}
                    aria-label={t('Favorite {symbol}', { symbol: c.symbol })}
                    onClick={() => setFavorites((current) => toggleFavorite(current, c.symbol))}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors hover:text-yellow-text ${favorites.includes(c.symbol) ? 'text-yellow-accent' : 'text-ink-4'}`}
                  >
                    <Star size={16} fill={favorites.includes(c.symbol) ? 'currentColor' : 'none'} />
                  </button>
                  <Link to={`/markets/${c.symbol}`} aria-label={t('View {name} ({symbol}) details', { name: c.name, symbol: c.symbol })} className="flex min-w-0 items-center gap-3 rounded">
                    <CoinIcon symbol={c.symbol} size={28} />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-1 text-sm font-semibold text-ink">
                        {c.symbol}
                        {c.symbol === 'EDC' && <span className="chip bg-yellow/10 !px-1.5 !py-0.5 text-[11px] text-yellow-text">{t('Demo')}</span>}
                      </span>
                      <span className="block truncate text-xs text-ink-3">{c.name}</span>
                    </span>
                  </Link>
                  </div>
                </td>
                <td className="text-right text-sm font-medium text-ink">
                  <Price quote={c} />
                </td>
                <td className="text-right">
                  <span className="hidden md:inline">
                    <Change value={c.change} className="text-sm font-medium" />
                  </span>
                  <ChangePill value={c.change} className="md:hidden" />
                </td>
                <td className="num hidden text-right text-sm text-ink-2 lg:table-cell">
                  {formatUsd(c.high, locale)} / {formatUsd(c.low, locale)}
                </td>
                <td className="num hidden text-right text-sm text-ink-2 md:table-cell">{formatCompact(c.volume, locale)} USD</td>
                <td className="hidden rounded-r-lg pr-2 lg:table-cell">
                  <Sparkline seed={c.symbol} up={c.change >= 0} width={110} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 hidden text-xs leading-5 text-ink-3 lg:block">{t('Trend lines are illustrative graphics, not historical market data.')}</p>
        {rows.length === 0 && <p className="py-16 text-center text-sm text-ink-3">{t(tab === 'favorites' && !q.trim() ? 'No favorites yet. Tap the star next to a coin.' : 'No coins match your filters.')}</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
