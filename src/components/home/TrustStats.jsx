import { formatInt } from '../../lib/format';
import { useLocale } from '../../state/locale';
import { TRUST_STATS } from '../../data/content';

export default function TrustStats() {
  const { locale, t } = useLocale();
  return (
    <section className="page-x" aria-label={t('EdFi in numbers')}>
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:gap-x-10">
        {TRUST_STATS.map((s) => (
          <div key={t(s.label)}>
            <p className="num text-[28px] font-semibold leading-10 text-ink lg:text-[36px] lg:leading-[48px]">{typeof s.value === 'number' ? formatInt(s.value, locale) : t(s.value)}</p>
            <p className="mt-1 text-sm text-ink-3">{t(s.label)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
