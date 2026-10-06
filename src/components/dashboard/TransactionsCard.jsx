import { ArrowDownLeft, ArrowUpRight, QrCode } from 'lucide-react';
import { formatDateTime } from '../../lib/format';
import { formatDemoAmount } from '../../lib/demoAmount';
import { useLocale } from '../../state/locale';

const KIND = {
  reward: { label: 'Reward', icon: ArrowDownLeft, cls: 'bg-up/10 text-up' },
  payment: { label: 'Campus Pay', icon: QrCode, cls: 'bg-raised text-ink-2' },
  withdraw: { label: 'Withdraw', icon: ArrowUpRight, cls: 'bg-raised text-ink-2' },
  deposit: { label: 'Deposit', icon: ArrowDownLeft, cls: 'bg-up/10 text-up' },
};

function Status({ status = 'completed', className = '' }) {
  const { t } = useLocale();
  const processing = status === 'processing';
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-ink-2 ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${processing ? 'animate-pulse bg-yellow' : 'bg-up'}`} />
      {t(processing ? 'Demo processing' : 'Demo complete')}
    </span>
  );
}

function Amount({ value }) {
  const { locale } = useLocale();
  return (
    <span className={`num whitespace-nowrap text-sm font-medium ${value > 0 ? 'text-up' : 'text-ink'}`}>
      {value > 0 ? '+' : '-'}
      {formatDemoAmount(Math.abs(value), locale)} EDC
    </span>
  );
}

export default function TransactionsCard({ transactions }) {
  const { locale, t } = useLocale();
  return (
    <section id="history" className="panel scroll-mt-20 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-ink">{t('Recent demo transactions')}</h2>
        <span className="text-xs text-ink-3">{t('Sample activity')}</span>
      </div>

      {/* desktop table */}
      <table className="mt-4 hidden w-full table-fixed lg:table">
        <thead>
          <tr className="h-9 text-left text-xs text-ink-3">
            <th className="font-normal">{t('Activity')}</th>
            <th className="hidden w-[150px] font-normal xl:table-cell">{t('Type')}</th>
            <th className="w-[170px] text-right font-normal">{t('Amount')}</th>
            <th className="w-[170px] text-right font-normal">{t('Date')}</th>
            <th className="w-[130px] text-right font-normal">{t('Status')}</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const k = KIND[tx.kind];
            const Ico = k.icon;
            return (
              <tr key={tx.id} className="h-14 border-t border-line">
                <td>
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${k.cls}`}>
                      <Ico size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink" title={t(tx.title)}>{t(tx.title)}</span>
                      <span className="block truncate text-xs text-ink-3" title={t(tx.subKey ?? tx.sub, tx.subParams)}>{t(tx.subKey ?? tx.sub, tx.subParams)}</span>
                    </span>
                  </div>
                </td>
                <td className="hidden text-sm text-ink-2 xl:table-cell">{t(k.label)}</td>
                <td className="text-right">
                  <Amount value={tx.amountUnits} />
                </td>
                <td className="num whitespace-nowrap text-right text-xs text-ink-3">{formatDateTime(new Date(tx.at), locale)}</td>
                <td className="text-right">
                  <Status status={tx.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* mobile list */}
      <ul className="mt-2 lg:hidden">
        {transactions.map((tx) => {
          const k = KIND[tx.kind];
          const Ico = k.icon;
          return (
            <li key={tx.id} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${k.cls}`}>
                <Ico size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium text-ink">{t(tx.title)}</p>
                <p className="num text-xs text-ink-3">{formatDateTime(new Date(tx.at), locale)}</p>
              </div>
              <div className="text-right">
                <Amount value={tx.amountUnits} />
                <p className="text-xs text-ink-3">{t(tx.status === 'processing' ? 'Demo processing' : 'Demo complete')}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
