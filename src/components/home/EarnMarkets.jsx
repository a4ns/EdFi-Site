import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react';
import Icon from '../Icon';
import { useMarkets } from '../../state/markets';
import { EARN_ACTIVITIES, EARN_CATEGORIES } from '../../data/content';
import { formatAmount, formatInt } from '../../lib/format';

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

export default function EarnMarkets() {
  const [cat, setCat] = useState('All');
  const { quotes } = useMarkets();
  const [sort, setSort] = useState({ key: null, dir: 'desc' });
  const filtered = cat === 'All' ? EARN_ACTIVITIES : EARN_ACTIVITIES.filter((a) => a.category === cat);
  const rows = sort.key ? [...filtered].sort((a, b) => (sort.dir === 'desc' ? b[sort.key] - a[sort.key] : a[sort.key] - b[sort.key])) : filtered;
  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));

  return (
    <section id="earn" className="page-x scroll-mt-16 py-8 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="section-title">Learn &amp; Earn</h2>
          <p className="mt-3 max-w-xl text-base text-ink-3">
            Verified results pay out in EDC automatically. Current reward rates for the Kozybayev University pilot.
          </p>
        </div>
        <Link to="/demo" className="link-more">
          View my rewards
          <ChevronRight size={16} />
        </Link>
      </div>

      <div role="tablist" aria-label="Reward categories" className="no-scrollbar mt-8 flex gap-6 overflow-x-auto border-b border-line [mask-image:linear-gradient(to_right,#000_calc(100%-32px),transparent)] md:[mask-image:none]">
        {EARN_CATEGORIES.map((c) => (
          <button key={c} type="button" role="tab" aria-selected={cat === c} className="tab shrink-0" onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      <table className="mt-2 w-full table-fixed">
        <thead>
          <tr className="h-12 text-left text-xs text-ink-3">
            <th className="w-auto font-normal">Activity</th>
            <SortHead k="reward" sort={sort} onSort={toggleSort} className="w-[72px] sm:w-[120px] lg:w-[140px]">
              <span className="sm:hidden">EDC</span>
              <span className="hidden sm:inline">Reward</span>
            </SortHead>
            <th className="hidden w-[110px] text-right font-normal md:table-cell lg:w-[130px]">≈ Value</th>
            <th className="hidden w-[150px] text-right font-normal lg:table-cell">Frequency</th>
            <th className="hidden w-[230px] pl-12 font-normal lg:table-cell">Verified by</th>
            <SortHead k="earners24h" sort={sort} onSort={toggleSort} className="hidden w-[130px] md:table-cell">Earners (24h)</SortHead>
            <th className="w-[76px] text-right font-normal md:w-[96px]">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="group h-16 min-h-16 border-t border-line/60 transition-colors hover:bg-card">
              <td className="rounded-l-lg pl-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised text-yellow-text">
                    <Icon name={a.icon} size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-5 text-ink sm:truncate">{a.name}</span>
                    <span className="block text-xs text-ink-3">{a.category}</span>
                  </span>
                </div>
              </td>
              <td className="num text-right text-sm font-semibold text-ink">
                +{a.reward} <span className="hidden font-normal text-ink-3 sm:inline">EDC</span>
              </td>
              <td className="num hidden text-right text-sm text-ink-2 md:table-cell">${formatAmount(a.reward * quotes.EDC.price)}</td>
              <td className="hidden text-right text-sm text-ink-2 lg:table-cell">{a.frequency}</td>
              <td className="hidden pl-12 text-sm text-ink-2 lg:table-cell">
                {a.oracle}
              </td>
              <td className="num hidden text-right text-sm text-ink-2 md:table-cell">{formatInt(a.earners24h)}</td>
              <td className="rounded-r-lg pr-2 text-right">
                <Link to="/demo" className="text-sm font-medium text-yellow-text underline-offset-4 hover:underline">
                  Earn
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
