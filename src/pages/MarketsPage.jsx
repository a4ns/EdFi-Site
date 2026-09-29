import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CoinIcon from '../components/CoinIcon';
import Sparkline from '../components/Sparkline';
import { Change, ChangePill, Price } from '../components/PriceCell';
import { useMarkets } from '../state/markets';
import { formatCompact, formatPrice } from '../lib/format';

const TABS = [
  ['all', 'All'],
  ['gainers', 'Top Gainers'],
  ['losers', 'Top Losers'],
  ['volume', 'Top Volume'],
];

function HotCard({ title, rows }) {
  return (
    <div className="card p-4 md:p-5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <ul className="mt-2">
        {rows.map((r) => (
          <li key={r.symbol} className="flex h-11 items-center">
            <CoinIcon symbol={r.symbol} size={20} />
            <span className="ml-2 text-sm font-medium text-ink">{r.symbol}</span>
            <Price quote={r} className="ml-auto mr-3 text-sm text-ink" />
            <Change value={r.change} className="w-[68px] text-right text-sm" />
          </li>
        ))}
      </ul>
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
  const { list, live } = useMarkets();
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ key: null, dir: 'desc' });

  useEffect(() => {
    document.title = 'Markets | EdFi';
    return () => {
      document.title = 'EdFi | Learn-to-Earn on BNB Chain';
    };
  }, []);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    let out = list.filter((c) => !term || c.symbol.toLowerCase().includes(term) || c.name.toLowerCase().includes(term));
    if (tab === 'gainers') out = out.filter((c) => c.change > 0).sort((a, b) => b.change - a.change);
    else if (tab === 'losers') out = out.filter((c) => c.change < 0).sort((a, b) => a.change - b.change);
    else if (tab === 'volume') out = [...out].sort((a, b) => b.volume - a.volume);
    else out = [...out].sort((a, b) => (a.symbol === 'EDC' ? -1 : b.symbol === 'EDC' ? 1 : b.volume - a.volume));
    if (sort.key) out = [...out].sort((a, b) => (sort.dir === 'desc' ? b[sort.key] - a[sort.key] : a[sort.key] - b[sort.key]));
    return out;
  }, [list, tab, q, sort]);

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));
  const top = (fn) => [...list].sort(fn).slice(0, 3);

  return (
    <div className="min-h-screen bg-page">
      <Header variant="site" />
      <main className="page-x pb-16 pt-8 md:pt-12">
        <h1 className="text-[32px] font-semibold leading-10 text-ink md:text-[40px] md:leading-[48px]">Markets</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-ink-3">
          <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-up' : 'bg-ink-3'}`} />
          {live ? 'Live prices from Binance market data.' : 'Price snapshot.'} EDC is an EdFi pilot token (simulated).
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <HotCard title="Hot Coins" rows={top((a, b) => b.volume - a.volume)} />
          <HotCard title="Top Gainers" rows={top((a, b) => b.change - a.change)} />
          <HotCard title="Top Losers" rows={top((a, b) => a.change - b.change)} />
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-4 border-b border-line">
          <div role="tablist" aria-label="Market lists" className="no-scrollbar flex gap-6 overflow-x-auto">
            {TABS.map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} className="tab shrink-0" onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>
          <label className="mb-2 flex h-9 w-full items-center gap-2 rounded-lg border border-line-strong px-3 focus-within:border-yellow hover:border-yellow sm:w-[240px]">
            <Search size={16} className="text-ink-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search coins"
              aria-label="Search coins"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
            />
          </label>
        </div>

        <table className="w-full table-fixed">
          <thead>
            <tr className="h-12 text-left text-xs text-ink-3">
              <th className="w-auto pl-2 font-normal">Name</th>
              <SortHead k="price" sort={sort} onSort={toggleSort} className="w-[120px] md:w-[150px]">
                Price
              </SortHead>
              <SortHead k="change" sort={sort} onSort={toggleSort} className="w-[96px] md:w-[130px]">
                24h Change
              </SortHead>
              <th className="hidden w-[190px] text-right font-normal lg:table-cell">24h High / Low</th>
              <SortHead k="volume" sort={sort} onSort={toggleSort} className="hidden w-[150px] md:table-cell">
                24h Volume
              </SortHead>
              <th className="hidden w-[130px] pr-2 text-right font-normal lg:table-cell">Last 7 days</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.symbol} className="h-16 border-t border-line/60 transition-colors hover:bg-card">
                <td className="rounded-l-lg pl-2">
                  <Link to="/demo" className="flex min-w-0 items-center gap-3">
                    <CoinIcon symbol={c.symbol} size={28} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                        {c.symbol}
                        {c.symbol === 'EDC' && <span className="chip bg-yellow/10 !px-1.5 !py-0.5 text-[11px] text-yellow-text">Pilot</span>}
                      </span>
                      <span className="block truncate text-xs text-ink-3">{c.name}</span>
                    </span>
                  </Link>
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
                  ${formatPrice(c.high)} / ${formatPrice(c.low)}
                </td>
                <td className="num hidden text-right text-sm text-ink-2 md:table-cell">${formatCompact(c.volume)}</td>
                <td className="hidden rounded-r-lg pr-2 lg:table-cell">
                  <Sparkline seed={c.symbol} up={c.change >= 0} width={110} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="py-16 text-center text-sm text-ink-3">No coins match your filters.</p>}
      </main>
      <Footer />
    </div>
  );
}
