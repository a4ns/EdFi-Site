import { formatAmount } from '../../lib/format';
import { useLocale } from '../../state/locale';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, CircleCheck, ChevronRight } from 'lucide-react';
import Icon from '../Icon';
import CoinIcon from '../CoinIcon';
import { PRODUCTS } from '../../data/content';

function EarnPreview() {
  const { locale, t } = useLocale();
  return (
    <div className="space-y-2">
      {[
        ['Exam grade A', 'Macroeconomics', 50],
        ['Weekly attendance', '5 of 5 days', 25],
      ].map(([title, subtitle, value]) => (
        <div key={title} className="flex items-center gap-3 rounded-md bg-card px-3 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-up/10 text-up">
            <ArrowDownLeft size={14} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-ink">{t(title)}</span>
            <span className="block text-xs text-ink-3">{t(subtitle)}</span>
          </span>
          <span className="num text-[13px] font-semibold text-up">+{formatAmount(value, 2, locale)} EDC</span>
        </div>
      ))}
    </div>
  );
}

function SpendPreview() {
  const { locale, t } = useLocale();
  return (
    <div className="px-1">
      <div className="flex items-center justify-between text-xs text-ink-3">
        <span>{t('Campus Canteen')}</span>
        <span className="inline-flex items-center gap-1 text-up">
          <CircleCheck size={12} />
          {t('Demo payment')}
        </span>
      </div>
      <p className="num mt-1 text-xl font-semibold text-ink">
        −{formatAmount(15, 2, locale)} <span className="text-sm font-normal text-ink-3">EDC</span>
      </p>
      <div className="mt-2 flex justify-between border-t border-line pt-2 text-xs text-ink-3">
        <span>{t('Fee')}</span>
        <span className="num text-ink-2">{formatAmount(0, 2, locale)} EDC</span>
      </div>
    </div>
  );
}

function WithdrawPreview() {
  const { t } = useLocale();
  return (
    <div className="space-y-2.5 px-1 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-ink-3">{t('Coin')}</span>
        <span className="inline-flex items-center gap-1.5 font-medium text-ink">
          <CoinIcon symbol="EDC" size={14} />
          EDC
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-ink-3">{t('Network')}</span>
        <span className="text-right rounded bg-raised px-1.5 py-0.5 font-medium text-ink">{t('Planned: BNB Smart Chain')}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-ink-3">{t('Demo destination')}</span>
        <span className="text-right font-medium text-ink">{t('No wallet connected')}</span>
      </div>
    </div>
  );
}

const PREVIEWS = [EarnPreview, SpendPreview, WithdrawPreview];
const DESTINATIONS = ['/demo#tasks', '/demo#pay', '/demo#withdraw'];

export default function Products() {
  const { t } = useLocale();
  return (
    <section id="products" className="page-x scroll-mt-16 py-8 lg:py-12">
      <h2 className="section-title">{t('One token for your whole campus')}</h2>
      <p className="mt-3 max-w-xl text-base text-ink-3">
        {t('The idea: earn EDC for verified academic results and use it across campus. Explore sample flows below.')}
      </p>
      <div className="mt-10 grid gap-4 lg:grid-cols-3 lg:gap-6">
        {PRODUCTS.map((p, i) => {
          const Preview = PREVIEWS[i];
          return (
            <article key={p.tag} className="card flex flex-col gap-0 p-5 md:flex-row md:gap-6 lg:flex-col lg:gap-0 lg:p-6">
              <div className="flex min-h-[156px] flex-col justify-center rounded-lg bg-page p-3 md:w-[300px] md:shrink-0 lg:w-auto">
                <Preview />
              </div>
              <div className="flex flex-1 flex-col md:justify-center lg:justify-start">
              <p className="mt-5 flex items-center gap-1.5 text-xs font-medium text-yellow-text md:mt-0 lg:mt-5">
                <Icon name={p.icon} size={14} />
                {t(p.tag)}
              </p>
              <h3 className="mt-1 text-xl font-semibold text-ink">{t(p.title)}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-ink-3">{t(p.desc)}</p>
              <Link to={DESTINATIONS[i]} className="link-more mt-4 text-ink">
                {t(p.cta)}
                <ChevronRight size={16} />
              </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
