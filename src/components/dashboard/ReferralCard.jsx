import { Copy, UserPlus } from 'lucide-react';
import { useLocale } from '../../state/locale';
import { formatInt } from '../../lib/format';
import { formatDemoAmount } from '../../lib/demoAmount';

export default function ReferralCard({ onCopy }) {
  const { locale, t } = useLocale();
  const code = 'EDFI-AK210404';
  const copy = () => onCopy(`${window.location.origin}/?ref=${code}`);
  return (
    <section id="referral" className="panel scroll-mt-20 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">{t('Invite classmates')}</h2>
          <p className="mt-1 text-sm text-ink-3">
            {t('Demo referral preview. Rewards and friend counts are illustrative.')}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-raised text-yellow-text">
          <UserPlus size={20} />
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card px-3 py-2.5">
        <span className="text-xs text-ink-3">{t('Referral code')}</span>
        <span className="flex items-center gap-2">
          <span className="num text-sm font-medium text-ink">{code}</span>
          <button type="button" onClick={copy} className="text-ink-3 transition-colors hover:text-yellow-text" aria-label={t('Copy referral link')}>
            <Copy size={14} />
          </button>
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4">
        <div>
          <p className="text-xs text-ink-3">{t('Friends joined')}</p>
          <p className="num mt-1 text-sm font-medium text-ink">{formatInt(3, locale)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-3">{t('Referral rewards')}</p>
          <p className="num mt-1 text-sm font-medium text-ink">{formatDemoAmount(6000, locale)} EDC</p>
        </div>
      </div>
    </section>
  );
}
