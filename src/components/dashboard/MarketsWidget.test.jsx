import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import MarketsWidget from './MarketsWidget';
import { MarketsContext } from '../../state/markets';
import { LocaleContext } from '../../state/locale';
import { translate } from '../../i18n/messages';

const list = [
  { symbol: 'EDC', name: 'EdFi Coin', price: 0.025, change: 2, tick: 0 },
  { symbol: 'BNB', name: 'BNB', price: 800, change: 1.25, tick: 0 },
];
function Fixture({ locale = 'en', live = true, rows = list }) {
  return <MemoryRouter><LocaleContext.Provider value={{ locale, t: (key, values) => translate(locale, key, values) }}>
    <MarketsContext.Provider value={{ list: rows, live }}><MarketsWidget balance={450} /></MarketsContext.Provider>
  </LocaleContext.Provider></MemoryRouter>;
}

describe('honest holding quote sources', () => {
  it.each(['en', 'ru', 'kk'])('labels the fixed USDT assumption and omits fabricated change in %s', (locale) => {
    render(<Fixture locale={locale} />);
    const row = screen.getAllByRole('listitem').find((item) => within(item).queryByText('USDT', { exact: true }));
    expect(within(row).getByText(translate(locale, 'Not available'))).toBeVisible();
    expect(row).not.toHaveTextContent('0.01%');
    expect(row).not.toHaveTextContent('0,01');
    expect(screen.getByText(translate(locale, 'Sample holdings. USDT uses a fixed demo value of 1 USD; its 24h change is unavailable.'))).toBeVisible();
    expect(screen.getByText(translate(locale, 'BNB uses live market data. EDC is simulated.'))).toBeVisible();
  });

  it('labels saved BNB prices after a feed failure without changing the fixed demo valuation', () => {
    render(<Fixture live={false} />);
    expect(screen.getByText('BNB uses a saved price snapshot. EDC is simulated.')).toBeVisible();
    expect(screen.queryByText('BNB uses live market data. EDC is simulated.')).not.toBeInTheDocument();
  });

  it('handles an all-negative gainers filter without showing losing coins', async () => {
    const user = userEvent.setup();
    render(<Fixture rows={list.map((quote) => ({ ...quote, change: -1 }))} />);
    await user.click(screen.getByRole('tab', { name: 'Gainers' }));
    expect(screen.getByText('No coins with a positive 24h change.')).toBeVisible();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
