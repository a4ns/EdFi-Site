import { formatAmount } from '../../lib/format';
import { useLocale } from '../../state/locale';
import { Link } from 'react-router-dom';
import { ChevronRight, Monitor, Smartphone } from 'lucide-react';
import PhoneMockup from './PhoneMockup';
import QRCode from '../QRCode';
import { appUrl } from '../../lib/links';

function AppleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.6 1.3-.1 1.7-.8 3.3-.8 1.5 0 1.9.8 3.3.8 1.4 0 2.2-1.3 3-2.5a10 10 0 0 0 1.4-2.8 4.3 4.3 0 0 1-2.3-4.2zM13.9 5c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" />
    </svg>
  );
}

const PLATFORMS = [
  ['iOS web demo', <AppleGlyph key="ios" />],
  ['Android web demo', <Smartphone key="and" size={20} />],
  ['Web App', <Monitor key="web" size={20} />],
];

export default function AppDownload() {
  const { locale, t } = useLocale();
  return (
    <section id="download" className="page-x scroll-mt-16 py-8 lg:py-12">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <div className="relative mx-auto w-fit">
            <PhoneMockup />
            <div className="absolute -left-[126px] top-[170px] hidden w-[152px] rounded-xl border border-line bg-card p-3 shadow-pop lg:block" aria-hidden="true">
              <p className="text-xs text-ink-3">{t('Sample reward')}</p>
              <p className="num mt-1 text-lg font-semibold text-up">+{formatAmount(50, 2, locale)} EDC</p>
              <p className="mt-0.5 text-xs text-ink-3">{t('Macroeconomics · A')}</p>
            </div>
            <div className="absolute -right-[126px] top-[420px] hidden w-[152px] rounded-xl border border-line bg-card p-3 shadow-pop lg:block" aria-hidden="true">
              <p className="flex flex-wrap items-center justify-between gap-1 text-xs text-ink-3">
                {t('Campus Canteen')}
                <span className="text-up">{t('Demo payment')}</span>
              </p>
              <p className="num mt-1 text-lg font-semibold text-ink">−{formatAmount(15, 2, locale)} EDC</p>
              <p className="mt-0.5 text-xs text-ink-3">{t('Simulation only')}</p>
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <h2 className="section-title">
            {t('Try EdFi on the go.')}
            <br />
            {t('A web demo for any device.')}
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-3">{t('Illustrative screens with sample data. Native iOS and Android apps are planned.')}</p>
          <div className="mt-10 hidden w-full max-w-[520px] items-center gap-6 rounded-xl border border-line p-6 sm:flex">
            <QRCode value={appUrl()} size={112} label={t('Scan to open the web demo')} />
            <div>
              <p className="text-sm text-ink-3">{t('Scan to open the web demo')}</p>
              <p className="mt-1 text-xl font-semibold text-ink">{t('Works in your browser')}</p>
            </div>
          </div>
          <Link to="/demo" className="btn btn-primary btn-lg mt-8 w-full sm:hidden">{t('Open the web demo')}</Link>
          <div className="mt-6 flex flex-wrap gap-3">
            {PLATFORMS.map(([label, icon]) => (
              <Link key={label} to="/demo" className="btn btn-secondary btn-md gap-2 px-4">
                {icon}
                {t(label)}
              </Link>
            ))}
          </div>
          <Link to="/demo" className="link-more mt-6 hidden text-ink sm:inline-flex">
            {t('Explore the web demo')}
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
