import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Info, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CoinIcon from '../components/CoinIcon';
import { Change, Price } from '../components/PriceCell';
import { COINS, FALLBACK_MARKETS } from '../data/content';
import { formatCompact, formatUsd } from '../lib/format';
import { useLocale } from '../state/locale';
import { useMarkets } from '../state/markets';

const positive = (value) => Number.isFinite(value) && value > 0;

function QuoteStat({ label, children, className = '' }) {
  return (
    <div className={`min-w-0 rounded-xl bg-card p-4 md:p-5 ${className}`}>
      <dt className="text-xs leading-5 text-ink-3">{label}</dt>
      <dd className="num mt-2 break-words text-lg font-medium text-ink">{children}</dd>
    </div>
  );
}

function PriceRange({ quote, simulated }) {
  const { locale, t } = useLocale();
  const valid = positive(quote?.price) && positive(quote?.low) && positive(quote?.high)
    && quote.high >= quote.low && quote.price >= quote.low && quote.price <= quote.high;
  const position = valid && quote.high > quote.low ? ((quote.price - quote.low) / (quote.high - quote.low)) * 100 : 50;

  return (
    <section className="panel p-5 md:p-6" aria-labelledby="price-range-title">
      <h2 id="price-range-title" className="text-base font-semibold text-ink">{t(simulated ? 'Simulated price range' : '24h price range')}</h2>
      <p className="mt-2 text-sm leading-6 text-ink-3">
        {t(simulated
          ? 'This range uses simulated demo values, not market trades.'
          : 'The latest price within the reported 24-hour low and high. This is not a price-history chart.')}
      </p>
      {valid ? (
        <>
          <div className="mt-7 px-1.5" role="img" aria-label={t('Price {price}; low {low}; high {high}', {
            price: formatUsd(quote.price, locale), low: formatUsd(quote.low, locale), high: formatUsd(quote.high, locale),
          })}>
            <div className="relative h-2 rounded-full bg-raised">
              <div className="h-full rounded-full bg-yellow/40" style={{ width: `${position}%` }} />
              <span className="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-accent" style={{ left: `${position}%` }} />
            </div>
          </div>
          <div className="mt-4 flex justify-between gap-4 text-sm">
            <div className="min-w-0">
              <p className="text-xs text-ink-3">{t('Low')}</p>
              <p className="num mt-1 break-words font-medium text-ink">{formatUsd(quote.low, locale)}</p>
            </div>
            <div className="min-w-0 text-right">
              <p className="text-xs text-ink-3">{t('High')}</p>
              <p className="num mt-1 break-words font-medium text-ink">{formatUsd(quote.high, locale)}</p>
            </div>
          </div>
        </>
      ) : <p className="mt-6 rounded-lg bg-card p-4 text-sm text-ink-3">{t('Price range is unavailable for this quote.')}</p>}
    </section>
  );
}

export default function CoinDetailPage() {
  const { symbol: routeSymbol = '' } = useParams();
  const symbol = routeSymbol.toUpperCase();
  const listed = symbol === 'EDC' || Object.hasOwn(FALLBACK_MARKETS, symbol);
  const coin = listed && Object.hasOwn(COINS, symbol) ? COINS[symbol] : null;
  const { quotes, live } = useMarkets();
  const quote = Object.hasOwn(quotes, symbol) ? quotes[symbol] : null;
  const { locale, t } = useLocale();
  const simulated = symbol === 'EDC';
  const hasPrice = positive(quote?.price);
  const hasRange = positive(quote?.high) && positive(quote?.low) && quote.high >= quote.low;
  const status = !hasPrice ? 'Quote unavailable' : simulated ? 'Simulated quote' : live ? 'Live market quote' : 'Price snapshot';

  useEffect(() => {
    document.title = coin ? t('{name} ({symbol}) price | EdFi', { name: coin.name, symbol }) : t('Coin not found | EdFi');
    return () => { document.title = t('EdFi | Learn-to-Earn on BNB Chain'); };
  }, [coin, symbol, t]);

  return (
    <div className="min-h-screen bg-page">
      <Header variant="site" />
      <main id="main-content" tabIndex={-1} className="page-x pb-16 pt-6 scroll-mt-16 focus:outline-none md:pt-10">
        <Link to="/markets" className="inline-flex min-h-10 items-center gap-2 rounded text-sm text-ink-3 transition-colors hover:text-yellow-text">
          <ArrowLeft size={16} aria-hidden="true" />
          {t('Back to markets')}
        </Link>

        {!coin ? (
          <section className="panel my-8 px-5 py-12 text-center md:py-16">
            <Search size={32} className="mx-auto text-ink-3" aria-hidden="true" />
            <h1 className="mt-5 text-2xl font-semibold text-ink">{t('Coin not found')}</h1>
            <p className="mx-auto mt-3 max-w-md break-words text-sm leading-6 text-ink-3">{t('The symbol “{symbol}” is not in this market overview.', { symbol: routeSymbol })}</p>
            <Link to="/markets" className="btn btn-primary btn-md mt-6">{t('Browse all coins')}</Link>
          </section>
        ) : (
          <>
            <div className="mt-7 flex flex-col justify-between gap-6 border-b border-line pb-7 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <CoinIcon symbol={symbol} size={48} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h1 className="break-words text-[28px] font-semibold leading-9 text-ink md:text-[36px] md:leading-[44px]">{coin.name}</h1>
                    <span className="text-base text-ink-3">{symbol}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-3">{t(simulated ? 'EdFi concept token' : 'Market overview')}</p>
                </div>
              </div>
              <span className={`chip max-w-full self-start !px-3 !py-2 sm:self-center ${simulated ? 'bg-yellow/10 text-yellow-text' : hasPrice && live ? 'bg-up/10 text-up' : 'bg-card text-ink-2'}`}>
                <span className="mr-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
                {t(status)}
              </span>
            </div>

            <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
              <div className="min-w-0">
                <section aria-labelledby="coin-price-title">
                  <h2 id="coin-price-title" className="text-sm text-ink-3">{t(simulated ? 'Simulated EDC price' : '{symbol} price', { symbol })}</h2>
                  <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
                    {hasPrice ? <Price quote={quote} className="min-w-0 break-words text-[36px] font-semibold leading-tight text-ink md:text-[44px]" />
                      : <p className="text-2xl font-medium text-ink">{t('Not available')}</p>}
                    {Number.isFinite(quote?.change) && <div className="pb-1 text-sm">
                      <Change value={quote.change} className="font-medium" />
                      <span className="ml-2 text-ink-3">{t('24h')}</span>
                    </div>}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-ink-3">{t(simulated ? 'Illustrative USD value · No real market' : 'USDT quote · USD display')}</p>
                </section>

                <dl className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <QuoteStat label={t('24h High')}>{hasRange ? formatUsd(quote.high, locale) : t('Not available')}</QuoteStat>
                  <QuoteStat label={t('24h Low')}>{hasRange ? formatUsd(quote.low, locale) : t('Not available')}</QuoteStat>
                  <QuoteStat label={t(simulated ? 'Simulated 24h volume' : '24h Volume')} className="col-span-2 sm:col-span-1">
                    {Number.isFinite(quote?.volume) && quote.volume >= 0
                      ? <>{formatCompact(quote.volume, locale)}<span className="ml-1 text-xs font-normal text-ink-3">{simulated ? 'USD' : 'USDT'}</span></>
                      : t('Not available')}
                  </QuoteStat>
                </dl>
                <PriceRange quote={quote} simulated={simulated} />
              </div>

              <aside className="panel min-w-0 self-start p-5 md:p-6" aria-labelledby="quote-source-title">
                <h2 id="quote-source-title" className="flex items-center gap-2 text-base font-semibold text-ink">
                  <Info size={18} className="shrink-0 text-ink-3" aria-hidden="true" />
                  {t('About these numbers')}
                </h2>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="text-xs text-ink-3">{t('Data source')}</dt>
                    <dd className="mt-1 text-ink">{t(simulated ? 'EdFi demo simulation' : hasPrice && !live ? 'Saved market snapshot' : 'Binance public market data')}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-3">{t(simulated ? 'Token status' : 'Market pair')}</dt>
                    <dd className="mt-1 text-ink">{simulated ? t('Not deployed') : `${symbol}/USDT`}</dd>
                  </div>
                </dl>
                <div className="mt-5 space-y-3 border-t border-line pt-5 text-sm leading-6 text-ink-3">
                  {simulated ? (
                    <>
                      <p>{t('EDC prices are simulated. The token is not deployed.')}</p>
                      <p>{t('All EDC prices, changes, ranges and volume on this page are illustrative. EDC has no public order book or exchange listing.')}</p>
                    </>
                  ) : (
                    <>
                      <p>{t(!hasPrice ? 'No usable price is available for this coin. Check the markets overview for other quotes.'
                        : live ? 'The latest available quote is from the public market-data feed. Changes, highs, lows and volume cover its rolling 24-hour window.'
                          : 'Live market data is unavailable. Values may be the bundled snapshot or the last successful update; they are not a current quote.')}</p>
                      <p>{t('Prices are quoted in USDT and shown with USD formatting. No currency conversion is applied.')}</p>
                    </>
                  )}
                </div>
              </aside>
            </div>

            <section className="mt-8 flex flex-col gap-5 rounded-2xl bg-card p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
              <div className="max-w-2xl">
                <h2 className="text-base font-semibold text-ink">{t(simulated ? 'Explore the EdFi concept' : 'Read-only market overview')}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-3">{t(simulated
                  ? 'See how academic rewards and campus payments could work with a sample EDC balance in the demo.'
                  : 'EdFi does not offer buying, selling or wallet transfers. Use this view to explore the available market data.')}</p>
              </div>
              <Link to={simulated ? '/demo' : '/markets'} className={`btn btn-md shrink-0 self-start sm:self-center ${simulated ? 'btn-primary' : 'btn-secondary'}`}>
                {t(simulated ? 'Open web demo' : 'Browse all coins')}
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
