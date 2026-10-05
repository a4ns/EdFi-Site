import { useLocale } from '../../state/locale';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, CircleCheck, Gift, GraduationCap, QrCode } from 'lucide-react';
import CoinIcon from '../CoinIcon';
import { AppleIcon, GoogleIcon } from '../SocialIcons';
import { Change, Price } from '../PriceCell';
import { useMarkets } from '../../state/markets';
import { useAuth } from '../../state/auth';
import { NEWS } from '../../data/content';
function MarketsCard() {
  const { t } = useLocale();
  const { list, live } = useMarkets();
  const [tab, setTab] = useState('popular');
  const rows =
    tab === 'popular'
      ? ['EDC', 'BNB', 'BTC', 'ETH', 'SOL'].map((s) => list.find((q) => q.symbol === s))
      : [...list].sort((a, b) => b.change - a.change).slice(0, 5);

  return (
    <div id="markets" className="card scroll-mt-20 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <div role="tablist" aria-label={t('Markets')} className="flex flex-wrap gap-x-4">
          {[
            ['popular', 'Popular'],
            ['gainers', 'Top Gainers'],
          ].map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className="tab" onClick={() => setTab(id)}>
              {t(label)}
            </button>
          ))}
        </div>
        <Link to="/markets" className="link-more shrink-0 pb-2">
          {t('View All')}
          <ChevronRight size={16} />
        </Link>
      </div>

      <ul className="mt-3">
        {rows.map((r) => (
          <li key={r.symbol}>
            <Link to="/demo" className="-mx-2 flex h-14 items-center rounded-lg px-2 transition-colors hover:bg-raised">
              <CoinIcon symbol={r.symbol} size={24} />
              <span className="ml-3 text-sm font-semibold text-ink">{r.symbol}</span>
              <span className="ml-2 hidden truncate text-sm text-ink-3 sm:inline">{r.name}</span>
              <Price quote={r} className="ml-auto px-1 text-right text-sm font-medium text-ink" />
              <Change value={r.change} className="w-[76px] text-right text-sm font-medium" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-3">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${live ? 'bg-up' : 'bg-ink-4'}`} />
        {t(live ? 'Live prices from Binance market data.' : 'Price snapshot.')} {t('EDC price is simulated; the token is not live.')}
      </p>
    </div>
  );
}

function NewsCard() {
  const { t } = useLocale();
  return (
    <div className="card p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <h2 className="text-base font-semibold text-ink">{t('News')}</h2>
        <a href="#faq" className="link-more">
          {t('View All News')}
          <ChevronRight size={16} />
        </a>
      </div>
      <ul className="mt-4 space-y-4">
        {NEWS.slice(0, 4).map((title) => (
          <li key={title}>
            <a href="#faq" className="block text-sm text-ink transition-colors hover:text-yellow-text">
              {t(title)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Hero() {
  const { t } = useLocale();
  const { openAuth } = useAuth();
  const onSubmit = (e) => {
    e.preventDefault();
    openAuth('signup', new FormData(e.currentTarget).get('identifier') ?? '');
  };

  return (
    <section className="page-x grid grid-cols-1 gap-10 pb-12 pt-8 md:pt-14 lg:grid-cols-[minmax(0,1fr)_468px] lg:gap-16 lg:pb-12 lg:pt-16">
      <div className="flex flex-col">
        <h1 className="break-words text-[40px] font-semibold leading-[48px] text-ink sm:text-[56px] sm:leading-[64px] md:text-[64px] md:leading-[72px] lg:text-[60px] lg:leading-[68px] xl:text-[68px] xl:leading-[76px]">
          <span className="block">{t('ACADEMIC')}</span>
          <span className="block">{t('STATUS,')}</span>
          <span className="block text-yellow-text">{t('NOW LIQUID.')}</span>
        </h1>

        <div className="mt-8 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-raised text-yellow-text">
            <Gift size={22} />
          </span>
          <p className="text-base text-ink">
            {t('Try the demo with a sample {amount} welcome reward', { amount: '100 EDC' })}
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 flex max-w-[520px] flex-col gap-3 sm:flex-row md:max-w-[640px] lg:max-w-[520px]">
          <label htmlFor="hero-signup" className="sr-only">{t('University email or student ID')}</label>
          <input id="hero-signup" name="identifier" className="input min-w-0 sm:flex-1" placeholder={t('University email / Student ID')} autoComplete="email" />
          <button type="submit" className="btn btn-primary btn-lg shrink-0 sm:px-5">{t('Sign Up')}</button>
        </form>

        <div className="mt-10 flex max-w-[520px] flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm text-ink-3">{t('Or try demo sign-in with')}</p>
            <div className="mt-3 flex gap-3">
              {[
                ['Google', <GoogleIcon key="g" />],
                ['Apple', <AppleIcon key="a" />],
                ['University SSO', <GraduationCap key="u" size={20} className="text-ink" />],
              ].map(([label, icon]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => openAuth('signup')}
                  aria-label={t('Try demo sign-in with {provider}', { provider: t(label) })}
                  title={t(label)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-raised transition-colors hover:bg-line-strong"
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-ink-3">{t('Open the web demo')}</p>
            <a
              href="#download"
              aria-label={t('Open the web demo')}
              className="mt-3 hidden h-10 w-10 items-center justify-center rounded-lg bg-raised text-ink transition-colors hover:bg-line-strong sm:flex"
            >
              <QrCode size={20} />
            </a>
            <div className="mt-3 flex flex-wrap gap-2 sm:hidden">
              <Link to="/demo" className="btn btn-secondary btn-md px-4">{t('iOS web demo')}</Link>
              <Link to="/demo" className="btn btn-secondary btn-md px-4">{t('Android web demo')}</Link>
            </div>
          </div>
        </div>

        <ul className="mt-12 flex max-w-[520px] flex-col gap-3 border-t border-line pt-6 text-sm text-ink-2 lg:mt-auto">
          {['University-verified rewards are planned', 'Try campus payments with sample data', 'Contracts tested locally; not deployed'].map((label) => (
            <li key={label} className="flex items-center gap-2">
              <CircleCheck size={16} className="shrink-0 text-up" />
              {t(label)}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:flex lg:flex-col">
        <MarketsCard />
        <NewsCard />
      </div>
    </section>
  );
}
