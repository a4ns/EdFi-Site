import { useLocale } from '../../state/locale';
import { useId, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react';
import Icon from '../Icon';
import Sparkline from '../Sparkline';
import FilterTabs from '../FilterTabs';
import { useMarkets } from '../../state/markets';
import { EARN_ACTIVITIES, EARN_CATEGORIES } from '../../data/content';
import { formatUsd, formatInt } from '../../lib/format';

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
  const { locale, t } = useLocale();
  const { hash } = useLocation();
  const panelId = useId();
  const [selection, setSelection] = useState(null);
  const match = hash.match(/^#earn-(\w+)$/);
  const linked = hash === '#earn' ? 'All' : match && EARN_CATEGORIES.find((category) => category.toLowerCase() === match[1]);
  const cat = linked && selection?.hash !== hash ? linked : selection?.value ?? linked ?? 'All';
  const setCat = (value) => setSelection({ hash, value });
  const { quotes } = useMarkets();
  const [sort, setSort] = useState({ key: null, dir: 'desc' });

  const filtered = cat === 'All' ? EARN_ACTIVITIES : EARN_ACTIVITIES.filter((a) => a.category === cat);
  const rows = sort.key ? [...filtered].sort((a, b) => (sort.dir === 'desc' ? b[sort.key] - a[sort.key] : a[sort.key] - b[sort.key])) : filtered;
  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));

  return (
    <section id="earn" className="page-x scroll-mt-16 py-8 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="section-title">{t('Learn & Earn')}</h2>
          <p className="mt-3 max-w-xl text-base text-ink-3">
            {t('Proposed EDC rewards for a future Kozybayev University pilot. Rates, earner counts, values and trends are illustrative.')}
          </p>
        </div>
        <Link to="/demo#tasks" className="link-more">
          {t('View demo rewards')}
          <ChevronRight size={16} />
        </Link>
      </div>

      {EARN_CATEGORIES.slice(1).map((c) => (
        <span key={c} id={`earn-${c.toLowerCase()}`} className="block h-0 scroll-mt-24" aria-hidden="true" />
      ))}
      <FilterTabs label={t('Reward categories')} tabs={EARN_CATEGORIES.map((category) => ({ id: category, label: t(category) }))} value={cat} onChange={setCat} panelId={panelId} className="no-scrollbar mt-8 flex gap-6 overflow-x-auto border-b border-line [mask-image:linear-gradient(to_right,#000_calc(100%-32px),transparent)] md:[mask-image:none]" />

      <div id={panelId} role="tabpanel" aria-labelledby={`${panelId}-tab-${cat}`} tabIndex={0}>
      <table className="mt-2 w-full table-fixed">
        <thead>
          <tr className="h-12 text-left text-xs text-ink-3">
            <th className="w-auto pl-2 font-normal">{t('Activity')}</th>
            <SortHead k="reward" sort={sort} onSort={toggleSort} className="w-[72px] sm:w-[120px] lg:w-[140px]">
              <span className="sm:hidden">EDC</span>
              <span className="hidden sm:inline">{t('Reward')}</span>
            </SortHead>
            <th className="hidden w-[110px] text-right font-normal md:table-cell">{t('≈ Value')}</th>
            <th className="hidden w-[130px] font-normal lg:table-cell">{t('Frequency')}</th>
            <th className="hidden w-[200px] font-normal lg:table-cell">{t('Verified by')}</th>
            <SortHead k="earners24h" sort={sort} onSort={toggleSort} className="hidden w-[130px] md:table-cell">{t('Earners (24h)')}</SortHead>
            <th className="hidden w-[120px] text-right font-normal lg:table-cell">{t('Illustrative trend')}</th>
            <th className="w-[100px] pr-2 text-right font-normal md:w-[96px]">{t('Action')}</th>
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
                    <span className="block text-sm font-semibold leading-5 text-ink">{t(a.name)}</span>
                    <span className="block text-xs text-ink-3">{t(a.category)}</span>
                  </span>
                </div>
              </td>
              <td className="num text-right text-sm font-semibold text-ink">
                +{formatInt(a.reward, locale)} <span className="hidden font-normal text-ink-3 sm:inline">EDC</span>
              </td>
              <td className="num hidden text-right text-sm text-ink-2 md:table-cell">{formatUsd(a.reward * quotes.EDC.price, locale)}</td>
              <td className="hidden text-sm text-ink-2 lg:table-cell">{t(a.frequency)}</td>
              <td className="hidden text-sm text-ink-2 lg:table-cell">
                {t(a.oracle)}
              </td>
              <td className="num hidden text-right text-sm text-ink-2 md:table-cell">{formatInt(a.earners24h, locale)}</td>
              <td className="hidden text-right lg:table-cell">
                <Sparkline seed={a.id} />
              </td>
              <td className="rounded-r-lg pr-2 text-right">
                <Link to="/demo#tasks" className="inline-flex min-h-8 items-center rounded-md px-2 py-1 text-sm font-medium text-yellow-text transition-colors hover:bg-raised">
                  {t('Earn')}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </section>
  );
}
