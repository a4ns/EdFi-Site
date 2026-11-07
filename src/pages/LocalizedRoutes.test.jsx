import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LocaleContext } from '../state/locale';
import { AuthContext } from '../state/auth';
import { MarketsContext } from '../state/markets';
import { COINS, EDC_START, FALLBACK_MARKETS } from '../data/content';
import { translate } from '../i18n/messages';
import { formatUsd } from '../lib/format';
import LandingPage from './LandingPage';
import MarketsPage from './MarketsPage';

const quotes = Object.fromEntries(Object.entries({ EDC: EDC_START, ...FALLBACK_MARKETS })
  .map(([symbol, quote]) => [symbol, { ...quote, tick: 0, dir: null }]));
const market = { quotes, live: false, list: Object.entries(quotes).map(([symbol, quote]) => ({ symbol, name: COINS[symbol].name, ...quote })) };

function Providers({ locale, children }) {
  return <MemoryRouter>
    <LocaleContext.Provider value={{ locale, setLocale: vi.fn(), t: (key, values) => translate(locale, key, values) }}>
      <AuthContext.Provider value={{ openAuth: vi.fn() }}>
        <MarketsContext.Provider value={market}>{children}</MarketsContext.Provider>
      </AuthContext.Provider>
    </LocaleContext.Provider>
  </MemoryRouter>;
}

describe('localized routes', () => {
  it.each(['en', 'ru', 'kk'])('updates landing and market document titles in %s', (locale) => {
    const view = render(<Providers locale={locale}><LandingPage /></Providers>);
    expect(document.title).toBe(translate(locale, 'EdFi | Learn-to-Earn on BNB Chain'));
    view.rerender(<Providers locale={locale}><MarketsPage /></Providers>);
    expect(document.title).toBe(translate(locale, 'Markets | EdFi'));
    view.rerender(<Providers locale={locale}><LandingPage /></Providers>);
    expect(document.title).toBe(translate(locale, 'EdFi | Learn-to-Earn on BNB Chain'));
  });

  it('retains market filters and sorting while localizing price, labels and empty states', () => {
    const view = render(<Providers locale="en"><MarketsPage /></Providers>);
    fireEvent.click(screen.getByRole('tab', { name: 'Top Gainers' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Search coins' }), { target: { value: 'EDC' } });
    fireEvent.click(screen.getByRole('button', { name: 'Price', exact: true }));
    for (const locale of ['ru', 'kk']) {
      const t = (key) => translate(locale, key);
      view.rerender(<Providers locale={locale}><MarketsPage /></Providers>);
      expect(screen.getByRole('tab', { name: t('Top Gainers') })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('textbox', { name: t('Search coins') })).toHaveValue('EDC');
      expect(screen.getByRole('button', { name: t('Price'), exact: true }).closest('th')).toHaveAttribute('aria-sort', 'descending');
      expect(screen.getAllByRole('row')).toHaveLength(2);
      expect(within(screen.getByRole('table')).getByText(formatUsd(EDC_START.price, locale), { normalizer: (text) => text })).toBeVisible();
      expect(screen.getByText(t('EDC prices are simulated. The token is not deployed.'), { exact: false })).toBeVisible();
    }
    fireEvent.change(screen.getByRole('textbox', { name: translate('kk', 'Search coins') }), { target: { value: 'no-such-coin' } });
    expect(screen.getByText(translate('kk', 'No coins match your filters.'))).toBeVisible();
  });
});
