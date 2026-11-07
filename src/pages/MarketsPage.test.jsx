import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MarketsPage from './MarketsPage';
import { MarketsContext } from '../state/markets';
import { LocaleContext } from '../state/locale';
import { AuthContext } from '../state/auth';
import { COINS, FALLBACK_MARKETS } from '../data/content';
import { translate } from '../i18n/messages';

function renderMarkets(changes, locale = 'en') {
  const quotes = Object.fromEntries(Object.entries(changes).map(([symbol, change]) => [symbol, { ...FALLBACK_MARKETS[symbol], change, tick: 0, dir: null }]));
  const list = Object.entries(quotes).map(([symbol, quote]) => ({ symbol, name: COINS[symbol].name, ...quote }));
  return render(
    <MemoryRouter>
      <LocaleContext.Provider value={{ locale, setLocale: vi.fn(), t: (key, values) => translate(locale, key, values) }}>
        <AuthContext.Provider value={{ openAuth: vi.fn() }}>
          <MarketsContext.Provider value={{ quotes, list, live: false }}><MarketsPage /></MarketsContext.Provider>
        </AuthContext.Provider>
      </LocaleContext.Provider>
    </MemoryRouter>,
  );
}

function card(label, locale = 'en') {
  return within(screen.getByRole('heading', { level: 2, name: translate(locale, label) }).parentElement);
}

function linkedCoins(target) {
  return target.queryAllByRole('link').map((link) => link.getAttribute('href'));
}

describe('market summary cards', () => {
  it.each(['en', 'ru', 'kk'])('shows only gainers and an explained empty losers card for an all-positive snapshot in %s', (locale) => {
    renderMarkets({ BTC: 1, ETH: 4, BNB: 3, SOL: 2 }, locale);
    expect(linkedCoins(card('Top Gainers', locale))).toEqual(['/markets/ETH', '/markets/BNB', '/markets/SOL']);
    const losers = card('Top Losers', locale);
    expect(linkedCoins(losers)).toEqual([]);
    expect(losers.getByText(translate(locale, 'No coins with a negative 24h change.'))).toBeVisible();
  });

  it.each(['en', 'ru', 'kk'])('shows only losers and an explained empty gainers card for an all-negative snapshot in %s', (locale) => {
    renderMarkets({ BTC: -1, ETH: -4, BNB: -3, SOL: -2 }, locale);
    expect(linkedCoins(card('Top Losers', locale))).toEqual(['/markets/ETH', '/markets/BNB', '/markets/SOL']);
    const gainers = card('Top Gainers', locale);
    expect(linkedCoins(gainers)).toEqual([]);
    expect(gainers.getByText(translate(locale, 'No coins with a positive 24h change.'))).toBeVisible();
  });

  it.each(['en', 'ru', 'kk'])('does not classify unchanged coins as gainers or losers in %s', (locale) => {
    renderMarkets({ BTC: 0, ETH: 0, BNB: 0, SOL: 0 }, locale);
    const gainers = card('Top Gainers', locale);
    const losers = card('Top Losers', locale);
    expect(linkedCoins(gainers)).toEqual([]);
    expect(linkedCoins(losers)).toEqual([]);
    expect(gainers.getByText(translate(locale, 'No coins with a positive 24h change.'))).toBeVisible();
    expect(losers.getByText(translate(locale, 'No coins with a negative 24h change.'))).toBeVisible();
    expect(linkedCoins(card('Hot Coins', locale))).toHaveLength(3);
    expect(within(screen.getByRole('table')).getAllByRole('link')).toHaveLength(4);
  });

  it('does not fill a short category with unchanged or opposite-direction coins', () => {
    renderMarkets({ BTC: -5, ETH: 0, BNB: -1, SOL: 3 });
    expect(linkedCoins(card('Top Gainers'))).toEqual(['/markets/SOL']);
    expect(linkedCoins(card('Top Losers'))).toEqual(['/markets/BTC', '/markets/BNB']);
  });

  it.each(['en', 'ru', 'kk'])('explains a completely empty market snapshot in %s', (locale) => {
    renderMarkets({}, locale);
    expect(card('Hot Coins', locale).getByText(translate(locale, 'No market quotes are available.'))).toBeVisible();
    expect(linkedCoins(card('Top Gainers', locale))).toEqual([]);
    expect(linkedCoins(card('Top Losers', locale))).toEqual([]);
  });
});
