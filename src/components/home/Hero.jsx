import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Gift, GraduationCap, QrCode } from 'lucide-react';
import CoinIcon from '../CoinIcon';
import { Change, Price } from '../PriceCell';
import { useMarkets } from '../../state/markets';
import { NEWS } from '../../data/content';
import { formatInt } from '../../lib/format';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-ink" aria-hidden="true">
      <path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.6 1.3-.1 1.7-.8 3.3-.8 1.5 0 1.9.8 3.3.8 1.4 0 2.2-1.3 3-2.5a10 10 0 0 0 1.4-2.8 4.3 4.3 0 0 1-2.3-4.2zM13.9 5c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" />
    </svg>
  );
}

function useEarnedCounter(start) {
  const [n, setN] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setN((v) => v + 5 + Math.floor(Math.random() * 45)), 2200);
    return () => clearInterval(id);
  }, []);
  return n;
}

function MarketsCard() {
  const { list, live } = useMarkets();
  const [tab, setTab] = useState('popular');
  const rows =
    tab === 'popular'
      ? ['EDC', 'BNB', 'BTC', 'ETH', 'SOL'].map((s) => list.find((q) => q.symbol === s))
      : [...list].sort((a, b) => b.change - a.change).slice(0, 5);

  return (
    <div id="markets" className="card scroll-mt-20 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div role="tablist" aria-label="Markets" className="flex gap-6">
          {[
            ['popular', 'Popular'],
            ['gainers', 'Top Gainers'],
          ].map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className="tab" onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
        <Link to="/demo" className="link-more pb-2">
          View All
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
      <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-4">
        <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-up' : 'bg-ink-4'}`} />
        {live ? 'Live prices from Binance market data.' : 'Price snapshot.'} EDC is a pilot token (simulated).
      </p>
    </div>
  );
}

function NewsCard() {
  return (
    <div className="card p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">News</h2>
        <a href="#faq" className="link-more">
          View All News
          <ChevronRight size={16} />
        </a>
      </div>
      <ul className="mt-4 space-y-4">
        {NEWS.slice(0, 4).map((title) => (
          <li key={title}>
            <a href="#faq" className="block truncate text-sm text-ink transition-colors hover:text-yellow-text">
              {title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Hero() {
  const navigate = useNavigate();
  const earned = useEarnedCounter(1204380);
  const onSubmit = (e) => {
    e.preventDefault();
    navigate('/demo');
  };

  return (
    <section className="page-x grid grid-cols-1 gap-10 pb-16 pt-8 md:pt-14 lg:grid-cols-[minmax(0,1fr)_468px] lg:gap-16 lg:pb-24 lg:pt-20">
      <div className="flex flex-col lg:pt-4">
        <h1 className="text-[40px] font-bold leading-[48px] text-ink md:text-[64px] md:leading-[72px] lg:text-[72px] lg:leading-[80px]">
          <span className="num block text-brand">{formatInt(earned)}</span>
          <span className="block">EDC EARNED</span>
          <span className="block">BY STUDENTS</span>
        </h1>

        <div className="mt-8 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-raised text-yellow-text">
            <Gift size={22} />
          </span>
          <p className="text-base text-ink">
            Up to <span className="font-semibold text-yellow-text">100 EDC</span> welcome reward for new students
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 flex max-w-[520px] flex-col gap-3 sm:flex-row">
          <label htmlFor="hero-signup" className="sr-only">University email or student ID</label>
          <input id="hero-signup" className="input sm:flex-1" placeholder="University email / Student ID" autoComplete="email" />
          <button type="submit" className="btn btn-primary btn-lg sm:w-[144px]">Sign Up</button>
        </form>

        <div className="mt-10 flex max-w-[520px] flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm text-ink-3">Or Continue With</p>
            <div className="mt-3 flex gap-3">
              {[
                ['Google', <GoogleIcon key="g" />],
                ['Apple', <AppleIcon key="a" />],
                ['University SSO', <GraduationCap key="u" size={20} className="text-ink" />],
              ].map(([label, icon]) => (
                <Link
                  key={label}
                  to="/demo"
                  aria-label={`Continue with ${label}`}
                  title={label}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-raised transition-colors hover:bg-line-strong"
                >
                  {icon}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-ink-3">Download App</p>
            <a
              href="#download"
              aria-label="Download App"
              className="mt-3 flex h-10 w-10 items-center justify-center rounded-lg bg-raised text-ink transition-colors hover:bg-line-strong"
            >
              <QrCode size={20} />
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <MarketsCard />
        <NewsCard />
      </div>
    </section>
  );
}
