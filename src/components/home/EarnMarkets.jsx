import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import Icon from '../Icon';
import { useMarkets } from '../../state/markets';
import { EARN_ACTIVITIES, EARN_CATEGORIES } from '../../data/content';
import { formatAmount, formatInt } from '../../lib/format';

export default function EarnMarkets() {
  const [cat, setCat] = useState('All');
  const { quotes } = useMarkets();
  const rows = cat === 'All' ? EARN_ACTIVITIES : EARN_ACTIVITIES.filter((a) => a.category === cat);

  return (
    <section id="earn" className="page-x scroll-mt-16 py-16 lg:py-24">
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

      <div role="tablist" aria-label="Reward categories" className="no-scrollbar mt-8 flex gap-6 overflow-x-auto border-b border-line">
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
            <th className="w-[112px] text-right font-normal md:w-[140px]">Reward</th>
            <th className="hidden w-[120px] text-right font-normal md:table-cell">≈ Value</th>
            <th className="hidden w-[140px] text-right font-normal lg:table-cell">Frequency</th>
            <th className="hidden w-[210px] pl-10 font-normal lg:table-cell">Verified by</th>
            <th className="hidden w-[130px] text-right font-normal md:table-cell">Earners (24h)</th>
            <th className="w-[64px] text-right font-normal md:w-[96px]">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="group h-16 border-t border-line/60 transition-colors hover:bg-card">
              <td className="rounded-l-lg pl-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised text-yellow">
                    <Icon name={a.icon} size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{a.name}</span>
                    <span className="block text-xs text-ink-3">{a.category}</span>
                  </span>
                </div>
              </td>
              <td className="num text-right text-sm font-semibold text-ink">
                +{a.reward} <span className="font-normal text-ink-3">EDC</span>
              </td>
              <td className="num hidden text-right text-sm text-ink-2 md:table-cell">${formatAmount(a.reward * quotes.EDC.price)}</td>
              <td className="hidden text-right text-sm text-ink-2 lg:table-cell">{a.frequency}</td>
              <td className="hidden pl-10 text-sm text-ink-2 lg:table-cell">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-up" />
                  {a.oracle}
                </span>
              </td>
              <td className="num hidden text-right text-sm text-ink-2 md:table-cell">{formatInt(a.earners24h)}</td>
              <td className="rounded-r-lg pr-2 text-right">
                <Link to="/demo" className="text-sm font-medium text-yellow hover:underline">
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
