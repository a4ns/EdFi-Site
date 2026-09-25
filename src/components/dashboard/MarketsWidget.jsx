import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import CoinIcon from '../CoinIcon';
import { Change, Price } from '../PriceCell';
import { useMarkets } from '../../state/markets';
import { formatAmount } from '../../lib/format';

export default function MarketsWidget({ balance }) {
  const { list } = useMarkets();
  const [tab, setTab] = useState('hot');
  const edc = list.find((q) => q.symbol === 'EDC');
  const rows =
    tab === 'holding'
      ? [edc]
      : tab === 'hot'
        ? ['EDC', 'BNB', 'BTC', 'ETH', 'SOL'].map((s) => list.find((q) => q.symbol === s))
        : [...list].sort((a, b) => b.change - a.change).slice(0, 5);

  return (
    <section className="panel p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Markets</h2>
        <a href="/#markets" className="link-more">
          More
          <ChevronRight size={16} />
        </a>
      </div>
      <div role="tablist" aria-label="Market lists" className="mt-3 flex gap-5">
        {[
          ['holding', 'Holding'],
          ['hot', 'Hot'],
          ['gainers', 'Gainers'],
        ].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className="tab !text-sm" onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex h-8 items-center text-xs text-ink-3">
        <span className="flex-1">Coin</span>
        <span className="w-[104px] text-right">{tab === 'holding' ? 'Amount' : 'Price'}</span>
        <span className="w-[88px] text-right">24h Change</span>
      </div>
      <ul>
        {rows.map((r) => (
          <li key={r.symbol} className="flex h-12 items-center">
            <span className="flex flex-1 items-center gap-2">
              <CoinIcon symbol={r.symbol} size={20} />
              <span className="text-sm font-medium text-ink">{r.symbol}</span>
            </span>
            {tab === 'holding' ? (
              <span className="w-[104px] text-right">
                <span className="num block text-sm text-ink">{formatAmount(balance)}</span>
                <Price quote={r} className="block text-xs text-ink-3" />
              </span>
            ) : (
              <Price quote={r} className="w-[104px] text-right text-sm text-ink" />
            )}
            <Change value={r.change} className="w-[88px] text-right text-sm" />
          </li>
        ))}
      </ul>
    </section>
  );
}
