import { ArrowDownLeft, ArrowUpRight, ChevronRight, QrCode } from 'lucide-react';
import { formatAmount, formatDateTime } from '../../lib/format';

const KIND = {
  reward: { label: 'Reward', icon: ArrowDownLeft, cls: 'bg-up/10 text-up' },
  payment: { label: 'Campus Pay', icon: QrCode, cls: 'bg-raised text-ink-2' },
  withdraw: { label: 'Withdraw', icon: ArrowUpRight, cls: 'bg-raised text-ink-2' },
  deposit: { label: 'Deposit', icon: ArrowDownLeft, cls: 'bg-up/10 text-up' },
};

function Amount({ value }) {
  return (
    <span className={`num whitespace-nowrap text-sm font-medium ${value > 0 ? 'text-up' : 'text-ink'}`}>
      {value > 0 ? '+' : '-'}
      {formatAmount(Math.abs(value))} EDC
    </span>
  );
}

export default function TransactionsCard({ transactions }) {
  return (
    <section id="history" className="panel scroll-mt-20 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Recent Transactions</h2>
        <button type="button" className="link-more">
          More
          <ChevronRight size={16} />
        </button>
      </div>

      {/* desktop table */}
      <table className="mt-4 hidden w-full md:table">
        <thead>
          <tr className="h-9 text-left text-xs text-ink-3">
            <th className="font-normal">Activity</th>
            <th className="font-normal">Type</th>
            <th className="text-right font-normal">Amount</th>
            <th className="text-right font-normal">Date</th>
            <th className="w-[110px] text-right font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => {
            const k = KIND[t.kind];
            const Ico = k.icon;
            return (
              <tr key={t.id} className="h-14 border-t border-line">
                <td>
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${k.cls}`}>
                      <Ico size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{t.title}</span>
                      <span className="block truncate text-xs text-ink-3">{t.sub}</span>
                    </span>
                  </div>
                </td>
                <td className="text-sm text-ink-2">{k.label}</td>
                <td className="text-right">
                  <Amount value={t.amount} />
                </td>
                <td className="num text-right text-sm text-ink-3">{formatDateTime(new Date(t.at))}</td>
                <td className="text-right">
                  <span className="inline-flex items-center gap-1.5 text-sm text-ink-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-up" />
                    Completed
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* mobile list */}
      <ul className="mt-2 md:hidden">
        {transactions.map((t) => {
          const k = KIND[t.kind];
          const Ico = k.icon;
          return (
            <li key={t.id} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${k.cls}`}>
                <Ico size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{t.title}</p>
                <p className="num truncate text-xs text-ink-3">{formatDateTime(new Date(t.at))}</p>
              </div>
              <div className="text-right">
                <Amount value={t.amount} />
                <p className="text-xs text-ink-3">Completed</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
