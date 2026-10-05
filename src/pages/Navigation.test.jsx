import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { translate } from '../i18n/messages';
import { preferredScrollBehavior, sectionHref } from '../lib/navigation';

vi.mock('../state/MarketsProvider', async () => {
  const { MarketsContext } = await import('../state/markets');
  const { COINS, EDC_START, FALLBACK_MARKETS } = await import('../data/content');
  const quotes = Object.fromEntries(Object.entries({ EDC: EDC_START, ...FALLBACK_MARKETS })
    .map(([symbol, quote]) => [symbol, { ...quote, tick: 0, dir: null }]));
  const data = { quotes, list: Object.entries(quotes).map(([symbol, quote]) => ({ symbol, name: COINS[symbol].name, ...quote })), live: false };
  return { default: function FixedMarkets({ children }) { return <MarketsContext.Provider value={data}>{children}</MarketsContext.Provider>; } };
});

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  vi.clearAllMocks();
});

describe('complete site destinations', () => {
  it.each(['en', 'ru', 'kk'])('shows a useful 404 and returns home in %s', async (locale) => {
    localStorage.setItem('edfi.locale', locale);
    window.history.replaceState(null, '', '/missing-page');
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('heading', { name: translate(locale, 'This page could not be found') })).toBeVisible();
    expect(document.title).toBe(translate(locale, 'Page not found | EdFi'));
    await user.click(screen.getByRole('link', { name: translate(locale, 'Back to home') }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(translate(locale, 'ACADEMIC'));
    expect(document.documentElement.lang).toBe(locale);
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('takes a selected homepage coin to its own detail screen and exposes a working return link', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('link', { name: /^BTC Bitcoin/ }));
    expect(window.location.pathname).toBe('/markets/BTC');
    expect(screen.getByRole('heading', { level: 1, name: 'Bitcoin' })).toBeVisible();
    expect(screen.getByText('BTC/USDT')).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Back to markets' }));
    expect(window.location.pathname).toBe('/markets');
    expect(screen.getByRole('heading', { level: 1, name: 'Markets' })).toBeVisible();
  });

  it('returns footer sections to the homepage and expands the requested FAQ', async () => {
    window.history.replaceState(null, '', '/markets/BTC');
    const user = userEvent.setup();
    render(<App />);
    const footer = document.querySelector('footer');
    expect(footer.querySelector('a[href="#"]')).toBeNull();
    expect(within(footer).getByRole('link', { name: 'View source on GitHub' })).toHaveAttribute('href', 'https://github.com/a4ns/EdFi-Site');
    const target = within(footer).getAllByRole('link', { name: 'Withdrawing EDC' })[0];
    expect(target).toHaveAttribute('href', '/#faq-withdrawals');
    await user.click(target);
    expect(window.location.pathname).toBe('/');
    expect(window.location.hash).toBe('#faq-withdrawals');
    expect(screen.getByRole('button', { name: /Can I withdraw EDC to an exchange/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: /Can I withdraw EDC to an exchange/ })).toHaveTextContent('Not yet.');
  });

  it('links each product to its matching demo function and avoids an unimplemented welcome bonus', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Start earning' })).toHaveAttribute('href', '/demo#tasks');
    expect(screen.getByRole('link', { name: 'See Campus Pay' })).toHaveAttribute('href', '/demo#pay');
    expect(screen.getByRole('link', { name: 'How withdrawals work' })).toHaveAttribute('href', '/demo#withdraw');
    expect(screen.getByText('Explore sample rewards and campus payments')).toBeVisible();
    expect(screen.queryByText(/100 EDC welcome/)).not.toBeInTheDocument();
  });

  it('keeps a keyboard skip link on every route without rewriting the route fragment', async () => {
    window.history.replaceState(null, '', '/markets');
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('link', { name: 'Skip to main content' }));
    expect(screen.getByRole('main')).toHaveFocus();
    expect(window.location.hash).toBe('');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('does not invent a market pair for an asset that is not in the market feed', () => {
    window.history.replaceState(null, '', '/markets/USDT');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Coin not found' })).toBeVisible();
    expect(screen.queryByText('USDT/USDT')).not.toBeInTheDocument();
  });

  it('leaves an initial deep-linked demo modal focused and returns to content on dismissal', async () => {
    window.history.replaceState(null, '', '/demo#pay');
    const user = userEvent.setup();
    render(<App />);
    const dialog = screen.getByRole('dialog', { name: 'Scan Pay' });
    expect(dialog).toContainElement(document.activeElement);
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(window.location.hash).toBe('');
    expect(screen.getByRole('main')).toHaveFocus();
  });
});

it('uses safe section links and respects reduced-motion scrolling', () => {
  expect(sectionHref('#earn', '/markets/BTC')).toBe('/#earn');
  expect(sectionHref('#earn', '/')).toBe('#earn');
  expect(sectionHref('/demo', '/markets')).toBe('/demo');
  window.matchMedia.mockReturnValueOnce({ matches: true });
  expect(preferredScrollBehavior()).toBe('auto');
  window.matchMedia.mockReturnValueOnce({ matches: false });
  expect(preferredScrollBehavior()).toBe('smooth');
});
