import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CoinDetailPage from './CoinDetailPage';
import MarketsPage from './MarketsPage';
import LocaleProvider from '../state/LocaleProvider';
import { AuthContext } from '../state/auth';
import { MarketsContext } from '../state/markets';
import { COINS, EDC_START, FALLBACK_MARKETS } from '../data/content';
import { translate } from '../i18n/messages';
import { formatChange, formatCompact, formatUsd } from '../lib/format';
import { LANGUAGE_OPTIONS, LOCALE_STORAGE_KEY } from '../lib/locale';

const QUOTES = Object.fromEntries(Object.entries({ EDC: EDC_START, ...FALLBACK_MARKETS })
  .map(([symbol, quote]) => [symbol, { ...quote, tick: 0, dir: null }]));

function Providers({ path = '/markets/BTC', quotes = QUOTES, live = false }) {
  const market = { quotes, live, list: Object.entries(quotes).map(([symbol, quote]) => ({ symbol, name: COINS[symbol].name, ...quote })) };
  return (
    <LocaleProvider>
      <MarketsContext.Provider value={market}>
        <AuthContext.Provider value={{ openAuth: vi.fn() }}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/markets" element={<MarketsPage />} />
              <Route path="/markets/:symbol" element={<CoinDetailPage />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </MarketsContext.Provider>
    </LocaleProvider>
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  localStorage.clear();
  document.documentElement.lang = 'en';
});

describe('coin detail quotes and disclosure', () => {
  it.each(['en', 'ru', 'kk'])('shows the actual quote, pair and range in %s', (locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    render(<Providers path="/markets/btc" live />);
    const main = within(screen.getByRole('main'));
    const t = (key, values) => translate(locale, key, values);
    expect(main.getByRole('heading', { level: 1, name: 'Bitcoin' })).toBeVisible();
    expect(document.title).toBe(t('{name} ({symbol}) price | EdFi', { name: 'Bitcoin', symbol: 'BTC' }));
    expect(main.getByText(t('Live market quote'))).toBeVisible();
    expect(main.getByText(formatUsd(QUOTES.BTC.price, locale), { normalizer: (text) => text })).toBeVisible();
    expect(main.getByText(formatChange(QUOTES.BTC.change, locale), { normalizer: (text) => text })).toBeVisible();
    expect(main.getByText(formatCompact(QUOTES.BTC.volume, locale), { exact: false, normalizer: (text) => text })).toBeVisible();
    expect(main.getByText('BTC/USDT')).toBeVisible();
    expect(main.getByText(t('Binance public market data'))).toBeVisible();
    expect(main.getByText(t('Prices are quoted in USDT and shown with USD formatting. No currency conversion is applied.'))).toBeVisible();
    expect(main.getByRole('img', { name: t('Price {price}; low {low}; high {high}', {
      price: formatUsd(QUOTES.BTC.price, locale), low: formatUsd(QUOTES.BTC.low, locale), high: formatUsd(QUOTES.BTC.high, locale),
    }) })).toBeVisible();
    expect(main.queryByRole('button', { name: /buy|sell|trade/i })).not.toBeInTheDocument();
  });

  it('marks retained prices as a snapshot after a feed failure and resumes updated values', () => {
    const view = render(<Providers live />);
    view.rerender(<Providers live={false} />);
    const main = within(screen.getByRole('main'));
    expect(main.getByText('Price snapshot')).toBeVisible();
    expect(main.getByText('Saved market snapshot')).toBeVisible();
    expect(main.getByText('Live market data is unavailable. Values may be the bundled snapshot or the last successful update; they are not a current quote.')).toBeVisible();
    expect(main.queryByText('Live market quote')).not.toBeInTheDocument();
    const next = { ...QUOTES, BTC: { ...QUOTES.BTC, price: 85000, tick: 1, dir: 'up' } };
    view.rerender(<Providers quotes={next} live />);
    expect(main.getByText('Live market quote')).toBeVisible();
    expect(main.getByText(formatUsd(next.BTC.price))).toBeVisible();
    expect(main.queryByText('Saved market snapshot')).not.toBeInTheDocument();
  });

  it.each(['en', 'ru', 'kk'])('never describes EDC as a live market in %s', (locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    render(<Providers path="/markets/EDC" live />);
    const main = within(screen.getByRole('main'));
    const t = (key) => translate(locale, key);
    expect(main.getByText(t('Simulated quote'))).toBeVisible();
    expect(main.getByText(t('Simulated 24h volume'))).toBeVisible();
    expect(main.getByText(t('EDC prices are simulated. The token is not deployed.'))).toBeVisible();
    expect(main.getByText(t('All EDC prices, changes, ranges and volume on this page are illustrative. EDC has no public order book or exchange listing.'))).toBeVisible();
    expect(main.getByRole('link', { name: t('Open web demo') })).toHaveAttribute('href', '/demo');
    expect(main.queryByText(t('Live market quote'))).not.toBeInTheDocument();
    expect(main.queryByText(t('Binance public market data'))).not.toBeInTheDocument();
    expect(main.queryByText('EDC/USDT')).not.toBeInTheDocument();
  });

  it('keeps a known coin identity when its quote is unavailable', () => {
    render(<Providers quotes={{}} path="/markets/ETH" live />);
    const main = within(screen.getByRole('main'));
    expect(main.getByRole('heading', { name: 'Ethereum', level: 1 })).toBeVisible();
    expect(main.getByText('Quote unavailable')).toBeVisible();
    expect(main.getAllByText('Not available')).toHaveLength(4);
    expect(main.getByText('Price range is unavailable for this quote.')).toBeVisible();
    expect(main.queryByRole('img')).not.toBeInTheDocument();
    expect(main.queryByText('Live market quote')).not.toBeInTheDocument();
    expect(main.getByRole('link', { name: 'Back to markets' })).toHaveAttribute('href', '/markets');
  });

  it.each([
    { price: Number.NaN, change: Number.POSITIVE_INFINITY, high: 20, low: 30, volume: -1 },
    { price: -10, change: null, high: null, low: Number.NEGATIVE_INFINITY, volume: null },
  ])('does not display invalid quotes or misleading ranges: %o', (invalid) => {
    render(<Providers quotes={{ ...QUOTES, BTC: { ...QUOTES.BTC, ...invalid } }} live />);
    const main = within(screen.getByRole('main'));
    expect(main.getByText('Quote unavailable')).toBeVisible();
    expect(main.getAllByText('Not available')).toHaveLength(4);
    expect(main.getByText('Price range is unavailable for this quote.')).toBeVisible();
    expect(main.queryByRole('img')).not.toBeInTheDocument();
    expect(main.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
  });

  it('handles an unchanged range without dividing by zero and rejects a price outside its range', () => {
    const fixed = { ...QUOTES.BTC, price: 12, high: 12, low: 12 };
    const view = render(<Providers quotes={{ ...QUOTES, BTC: fixed }} />);
    expect(within(screen.getByRole('main')).getByRole('img')).toHaveAccessibleName('Price $12.00; low $12.00; high $12.00');
    view.rerender(<Providers quotes={{ ...QUOTES, BTC: { ...fixed, price: 13 } }} />);
    expect(within(screen.getByRole('main')).queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Price range is unavailable for this quote.')).toBeVisible();
  });

  it.each(['unknown', '__proto__', 'constructor'])('shows a recoverable unknown-symbol state for %s', (symbol) => {
    render(<Providers path={`/markets/${symbol}`} />);
    const main = within(screen.getByRole('main'));
    expect(main.getByRole('heading', { name: 'Coin not found', level: 1 })).toBeVisible();
    expect(main.getByRole('link', { name: 'Browse all coins' })).toHaveAttribute('href', '/markets');
    expect(document.title).toBe('Coin not found | EdFi');
  });
});

describe('market detail navigation', () => {
  it('opens a table coin with the keyboard and goes back to markets', async () => {
    const user = userEvent.setup();
    render(<Providers path="/markets" />);
    const coinLink = within(screen.getByRole('table')).getByRole('link', { name: 'View Bitcoin (BTC) details' });
    expect(coinLink).toHaveAttribute('href', '/markets/BTC');
    coinLink.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { name: 'Bitcoin', level: 1 })).toBeVisible();
    const back = screen.getByRole('link', { name: 'Back to markets' });
    back.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { name: 'Markets', level: 1 })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Illustrative trend' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Last 7 days' })).not.toBeInTheDocument();
    expect(screen.getByText('Trend lines are illustrative graphics, not historical market data.')).toBeInTheDocument();
  });

  it('opens a summary-card coin and preserves the selected language across details and return navigation', async () => {
    const user = userEvent.setup();
    render(<Providers path="/markets" />);
    const hot = screen.getByRole('heading', { name: 'Hot Coins' }).parentElement;
    await user.click(within(hot).getByRole('link', { name: 'View Bitcoin (BTC) details' }));
    expect(screen.getByRole('heading', { name: 'Bitcoin', level: 1 })).toBeVisible();
    const label = Object.fromEntries(LANGUAGE_OPTIONS.map((option) => [option.value, option.label]));
    const languageButton = (locale) => screen.getByRole('button', { name: label[locale] });
    for (const locale of ['kk', 'ru', 'en']) {
      const group = languageButton('kk').closest('[role="group"]');
      expect(within(group).getAllByRole('button').map((button) => button.lang)).toEqual(['kk', 'en', 'ru']);
      await user.click(languageButton(locale));
      expect(languageButton(locale)).toHaveAttribute('aria-pressed', 'true');
      expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe(locale);
      expect(screen.getByText(translate(locale, 'Price snapshot'))).toBeVisible();
      expect(screen.getByRole('heading', { name: 'Bitcoin', level: 1 })).toBeVisible();
      expect(document.title).toBe(translate(locale, '{name} ({symbol}) price | EdFi', { name: 'Bitcoin', symbol: 'BTC' }));
    }
    await user.click(languageButton('kk'));
    await user.click(screen.getByRole('link', { name: translate('kk', 'Back to markets') }));
    expect(screen.getByRole('heading', { name: translate('kk', 'Markets'), level: 1 })).toBeVisible();
    expect(languageButton('kk')).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('kk');
  });

  it('stars a coin and lists it under Favorites', async () => {
    const user = userEvent.setup();
    render(<Providers path="/markets" />);
    await user.click(screen.getByRole('tab', { name: 'Favorites' }));
    expect(screen.getByText('No favorites yet. Tap the star next to a coin.')).toBeVisible();
    await user.click(screen.getByRole('tab', { name: 'All' }));
    await user.click(screen.getByRole('button', { name: 'Favorite BTC' }));
    expect(screen.getByRole('button', { name: 'Favorite BTC' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('tab', { name: 'Favorites' }));
    const table = screen.getByRole('table');
    expect(within(table).getByRole('link', { name: 'View Bitcoin (BTC) details' })).toBeVisible();
    expect(within(table).queryByRole('link', { name: 'View Ethereum (ETH) details' })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('edfi.favorites'))).toEqual(['BTC']);
  });
});
