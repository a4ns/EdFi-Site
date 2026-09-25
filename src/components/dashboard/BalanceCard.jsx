import { useState } from 'react';
import { ChevronDown, Download, Eye, EyeOff, QrCode, Upload } from 'lucide-react';
import BalanceChart from './BalanceChart';
import { useMarkets } from '../../state/markets';
import { KZT_PER_USD, formatAmount } from '../../lib/format';

const UNITS = ['EDC', 'USDT', 'KZT'];

export default function BalanceCard({ balance, todayEarned, onPay, onDeposit, onWithdraw }) {
  const [hidden, setHidden] = useState(false);
  const [unit, setUnit] = useState('EDC');
  const [unitOpen, setUnitOpen] = useState(false);
  const { quotes } = useMarkets();
  const usd = balance * quotes.EDC.price;
  const shown = unit === 'EDC' ? balance : unit === 'USDT' ? usd : usd * KZT_PER_USD;
  const mask = (s) => (hidden ? '******' : s);
  const start = balance - todayEarned;
  const pct = start > 0 ? (todayEarned / start) * 100 : 0;

  return (
    <section id="balance" className="panel scroll-mt-20 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-ink">Estimated Balance</h2>
            <button type="button" className="icon-btn h-6 w-6" onClick={() => setHidden((h) => !h)} aria-label={hidden ? 'Show balance' : 'Hide balance'}>
              {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="num text-[32px] font-semibold leading-10 text-ink">{mask(formatAmount(shown))}</span>
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-0.5 text-sm font-medium text-ink"
                onClick={() => setUnitOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={unitOpen}
              >
                {unit}
                <ChevronDown size={14} className={`transition-transform ${unitOpen ? 'rotate-180' : ''}`} />
              </button>
              {unitOpen && (
                <ul role="listbox" className="absolute left-0 top-7 z-20 w-28 animate-fade-in rounded-lg border border-line bg-card py-1 shadow-pop">
                  {UNITS.map((u) => (
                    <li key={u}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={u === unit}
                        onClick={() => {
                          setUnit(u);
                          setUnitOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-raised ${u === unit ? 'text-yellow' : 'text-ink'}`}
                      >
                        {u}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <p className="num mt-1 text-sm text-ink-3">
            ≈ {mask(`$${formatAmount(usd)}`)} <span className="text-ink-4">·</span> {mask(`₸${formatAmount(usd * KZT_PER_USD, 0)}`)}
          </p>
          <p className="num mt-3 text-sm text-ink-3">
            Today&apos;s Earnings{' '}
            <span className="font-medium text-up">{mask(`+${formatAmount(todayEarned)} EDC (+${pct.toFixed(2)}%)`)}</span>
          </p>
        </div>

        <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
          <button type="button" className="btn btn-primary btn-md min-w-0 px-2 sm:px-4" onClick={onPay}>
            <QrCode size={16} />
            Scan Pay
          </button>
          <button type="button" className="btn btn-secondary btn-md min-w-0 px-2 sm:px-4" onClick={onDeposit}>
            <Download size={16} />
            Deposit
          </button>
          <button type="button" className="btn btn-secondary btn-md min-w-0 px-2 sm:px-4" onClick={onWithdraw}>
            <Upload size={16} />
            Withdraw
          </button>
        </div>
      </div>
      <div className="mt-4 border-t border-line pt-4">
        <div className="mb-1 flex justify-between text-xs text-ink-3">
          <span>Balance, last 30 days</span>
          <span className="num">{mask(`${formatAmount(balance)} EDC`)}</span>
        </div>
        <BalanceChart end={balance} width={640} height={96} />
      </div>
    </section>
  );
}
