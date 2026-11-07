import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardApp from './DashboardApp';
import LocaleProvider from '../state/LocaleProvider';
import { useLocale } from '../state/locale';
import { AuthContext } from '../state/auth';
import { MarketsContext } from '../state/markets';
import { COINS, EDC_START, FALLBACK_MARKETS } from '../data/content';
import { translate } from '../i18n/messages';
import { formatDemoAmount } from '../lib/demoAmount';

const QUOTES = Object.fromEntries(Object.entries({ EDC: EDC_START, ...FALLBACK_MARKETS })
  .map(([symbol, quote]) => [symbol, { ...quote, tick: 0, dir: null }]));
const MARKETS = {
  quotes: QUOTES,
  list: Object.entries(QUOTES).map(([symbol, quote]) => ({ symbol, name: COINS[symbol].name, ...quote })),
  live: false,
};
const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

function Controls() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setLocale } = useLocale();
  return (
    <nav aria-label="Test controls">
      <button onClick={() => navigate(-1)}>Back</button>
      <button onClick={() => navigate(1)}>Forward</button>
      {['pay', 'withdraw', 'tasks', 'history'].map((target) => <button key={target} onClick={() => navigate(`/demo#${target}`)}>Go to {target}</button>)}
      <button onClick={() => navigate('/away')}>Leave demo</button>
      {['en', 'ru', 'kk'].map((locale) => <button key={locale} onClick={() => setLocale(locale)}>Switch to {locale}</button>)}
      <span data-testid="location">{location.pathname}{location.hash}</span>
    </nav>
  );
}

function renderDashboard(path = '/demo') {
  return render(
    <LocaleProvider>
      <MemoryRouter initialEntries={[path]}>
        <Controls />
        <AuthContext.Provider value={{ openAuth: vi.fn() }}>
          <MarketsContext.Provider value={MARKETS}>
            <Routes>
              <Route path="/demo" element={<DashboardApp />} />
              <Route path="/away" element={<p>Outside demo</p>} />
            </Routes>
          </MarketsContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    </LocaleProvider>,
  );
}

function setClipboard(value) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value });
}
const click = (name) => fireEvent.click(screen.getByRole('button', { name, exact: true }));
const mobile = () => within(screen.getByRole('navigation', { name: 'App' }));
const balance = () => within(document.getElementById('balance'));
const task = (title, locale = 'en') => within(within(document.getElementById('tasks')).getByText(translate(locale, title)).closest('li'));
const rows = () => within(document.getElementById('history')).getAllByRole('row').slice(1);
const expectBalance = (units, locale = 'en') => expect(balance().getByText(formatDemoAmount(units, locale), { exact: true })).toBeVisible();

function copyFrom(source) {
  if (source === 'header') {
    click('Account menu');
    fireEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Copy UID' }));
  } else click(source === 'profile' ? 'Copy UID' : 'Copy referral link');
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 5, 12));
  vi.spyOn(globalThis, 'fetch').mockImplementation(() => { throw new Error('Local demo interactions cannot submit data'); });
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  if (clipboardDescriptor) Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
  else delete navigator.clipboard;
  localStorage.clear();
});

describe('truthful dashboard clipboard actions', () => {
  it.each(['profile', 'header', 'referral'])('waits for the %s clipboard write before announcing success', async (source) => {
    let resolveWrite;
    const writeText = vi.fn(() => new Promise((resolve) => { resolveWrite = resolve; }));
    setClipboard({ writeText });
    renderDashboard();
    copyFrom(source);
    const value = source === 'referral' ? `${window.location.origin}/?ref=EDFI-AK210404` : '210404';
    expect(writeText).toHaveBeenCalledExactlyOnceWith(value);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await act(async () => resolveWrite());
    expect(screen.getByRole('status')).toHaveTextContent(source === 'referral' ? 'Referral link copied' : 'UID copied');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['profile', 'header', 'referral'])('shows selectable %s text when clipboard permission is rejected', async (source) => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('Permission denied')) });
    renderDashboard();
    copyFrom(source);
    await act(async () => {});
    const dialog = within(screen.getByRole('dialog', { name: 'Copy manually' }));
    const value = source === 'referral' ? `${window.location.origin}/?ref=EDFI-AK210404` : '210404';
    const input = dialog.getByRole('textbox', { name: source === 'referral' ? 'Referral link' : 'UID' });
    expect(input).toHaveValue(value);
    expect(input).toHaveAttribute('readonly');
    fireEvent.focus(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(value.length);
    expect(dialog.getByText('Clipboard access is unavailable. Select and copy the text below.')).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(dialog.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expectBalance(45000);
  });

  it('offers a fallback when the clipboard API is unavailable and localizes it without changing its value', async () => {
    setClipboard(undefined);
    renderDashboard();
    await act(async () => copyFrom('referral'));
    for (const locale of ['ru', 'kk', 'en']) {
      click(`Switch to ${locale}`);
      const dialog = within(screen.getByRole('dialog', { name: translate(locale, 'Copy manually') }));
      expect(dialog.getByRole('textbox', { name: translate(locale, 'Referral link') })).toHaveValue(`${window.location.origin}/?ref=EDFI-AK210404`);
      expect(dialog.getByText(translate(locale, 'Clipboard access is unavailable. Select and copy the text below.'))).toBeVisible();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    }
  });

  it.each(['resolve', 'reject'])('ignores a late clipboard %s after opening another dialog', async (outcome) => {
    let complete;
    setClipboard({ writeText: () => new Promise((resolve, reject) => { complete = outcome === 'resolve' ? resolve : reject; }) });
    renderDashboard();
    copyFrom('profile');
    fireEvent.click(balance().getByRole('button', { name: 'Withdraw' }));
    await act(async () => complete());
    expect(screen.getByRole('dialog', { name: 'Withdraw EDC' })).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('ignores a late clipboard failure after leaving the dashboard', async () => {
    let rejectWrite;
    setClipboard({ writeText: () => new Promise((_resolve, reject) => { rejectWrite = reject; }) });
    renderDashboard();
    copyFrom('referral');
    click('Leave demo');
    await act(async () => rejectWrite());
    expect(screen.getByText('Outside demo')).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('complete local task steps', () => {
  it.each(['en', 'ru', 'kk'])('can verify and claim GPA, then finish volunteering in %s', (locale) => {
    renderDashboard();
    click(`Switch to ${locale}`);
    const gpa = task('Semester GPA 3.5+', locale);
    fireEvent.click(gpa.getByRole('button', { name: translate(locale, 'Verify') }));
    expectBalance(45000, locale);
    expect(rows()).toHaveLength(6);
    expect(screen.getByRole('status')).toHaveTextContent(translate(locale, 'Demo verification complete. Your sample reward is ready to claim'));
    fireEvent.click(gpa.getByRole('button', { name: translate(locale, 'Claim') }));
    expect(gpa.getByText(translate(locale, 'Claimed'))).toBeVisible();
    expectBalance(65000, locale);
    expect(rows()).toHaveLength(7);
    const volunteer = task('Volunteer 10 hours', locale);
    for (let hour = 7; hour <= 10; hour += 1) {
      fireEvent.click(volunteer.getByRole('button', { name: translate(locale, 'Log hour') }));
      expect(volunteer.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(hour));
      expectBalance(65000, locale);
    }
    fireEvent.click(volunteer.getByRole('button', { name: translate(locale, 'Claim') }));
    expectBalance(75000, locale);
    expect(rows()).toHaveLength(8);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('truthful sample-address paste feedback', () => {
  const address = `0x${'1'.repeat(40)}`;
  const fallback = 'Clipboard access is unavailable. Paste or type a sample address manually.';

  it('pastes clipboard text, trims it and leaves amount entry to the user', async () => {
    const readText = vi.fn().mockResolvedValue(`  ${address}  `);
    setClipboard({ readText });
    renderDashboard('/demo#withdraw');
    click('Paste');
    await act(async () => {});
    const dialog = within(screen.getByRole('dialog'));
    expect(readText).toHaveBeenCalledTimes(1);
    expect(dialog.getByRole('textbox', { name: 'Sample address' })).toHaveValue(address);
    expect(dialog.getByRole('textbox', { name: 'Sample address' })).toHaveFocus();
    expect(dialog.getByRole('textbox', { name: 'Amount' })).toHaveValue('');
    expect(dialog.queryByRole('status')).not.toBeInTheDocument();
    expectBalance(45000);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['missing', 'denied', 'empty'])('preserves the typed address and offers manual entry when clipboard is %s', async (kind) => {
    setClipboard(kind === 'missing' ? undefined : { readText: kind === 'denied' ? vi.fn().mockRejectedValue(new Error('Denied')) : vi.fn().mockResolvedValue('  ') });
    renderDashboard('/demo#withdraw');
    let dialog = within(screen.getByRole('dialog'));
    const input = dialog.getByRole('textbox', { name: 'Sample address' });
    fireEvent.change(input, { target: { value: address } });
    click('Paste');
    await act(async () => {});
    expect(input).toHaveValue(address);
    expect(input).toHaveFocus();
    const key = kind === 'empty' ? 'Clipboard is empty. Enter a sample address manually.' : fallback;
    expect(dialog.getByRole('status')).toHaveTextContent(key);
    expect(input).toHaveAccessibleDescription(key);
    for (const locale of ['ru', 'kk']) {
      click(`Switch to ${locale}`);
      dialog = within(screen.getByRole('dialog', { name: translate(locale, 'Withdraw EDC') }));
      expect(dialog.getByRole('status')).toHaveTextContent(translate(locale, key));
      expect(dialog.getByRole('textbox', { name: translate(locale, 'Sample address') })).toHaveValue(address);
    }
    fireEvent.change(input, { target: { value: `0x${'2'.repeat(40)}` } });
    expect(dialog.queryByRole('status')).not.toBeInTheDocument();
    expectBalance(45000, 'kk');
  });

  it('does not overwrite newer typing with a delayed clipboard read', async () => {
    let finish;
    setClipboard({ readText: () => new Promise((resolve) => { finish = resolve; }) });
    renderDashboard('/demo#withdraw');
    click('Paste');
    const input = within(screen.getByRole('dialog')).getByRole('textbox', { name: 'Sample address' });
    const typed = `0x${'2'.repeat(40)}`;
    fireEvent.change(input, { target: { value: typed } });
    await act(async () => finish(address));
    expect(input).toHaveValue(typed);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it.each(['resolve', 'reject'])('ignores a clipboard %s after cancel and reopen', async (outcome) => {
    let finish;
    setClipboard({ readText: () => new Promise((resolve, reject) => { finish = outcome === 'resolve' ? resolve : reject; }) });
    renderDashboard('/demo#withdraw');
    click('Paste');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }));
    fireEvent.click(balance().getByRole('button', { name: 'Withdraw' }));
    await act(async () => finish(address));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByRole('textbox', { name: 'Sample address' })).toHaveValue('');
    expect(dialog.queryByRole('status')).not.toBeInTheDocument();
    expectBalance(45000);
  });
});

describe('dashboard hash navigation and mobile selection', () => {
  it.each([['pay', 'Scan Pay'], ['withdraw', 'Withdraw EDC']])('opens # %s immediately and clears it on cancellation without a delayed reopen', (hash, title) => {
    renderDashboard(`/demo#${hash}`);
    const dialog = within(screen.getByRole('dialog', { name: title }));
    fireEvent.click(dialog.getByRole('button', { name: 'Close' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/demo');
    expect(screen.getByTestId('location')).not.toHaveTextContent('#');
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expectBalance(45000);
    expect(rows()).toHaveLength(6);
  });

  it('highlights the selected mobile target and restores selection with Back and Forward', () => {
    renderDashboard();
    expect(mobile().getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    for (const [label, hash] of [['Earn', 'tasks'], ['History', 'history'], ['Assets', 'balance']]) {
      fireEvent.click(mobile().getByRole('button', { name: label }));
      expect(mobile().getByRole('button', { name: label })).toHaveAttribute('aria-current', 'page');
      expect(mobile().getByRole('button', { name: 'Home' })).not.toHaveAttribute('aria-current');
      expect(screen.getByTestId('location')).toHaveTextContent(`/demo#${hash}`);
      expect(document.querySelectorAll('nav[aria-label="App"] [aria-current]')).toHaveLength(1);
    }
    click('Back');
    expect(mobile().getByRole('button', { name: 'History' })).toHaveAttribute('aria-current', 'page');
    click('Forward');
    expect(mobile().getByRole('button', { name: 'Assets' })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(mobile().getByRole('button', { name: 'Pay' }));
    expect(mobile().getByRole('button', { name: 'Pay' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('dialog', { name: 'Scan Pay' })).toBeVisible();
  });

  it('preserves posted payments and presents the same receipt on Forward without another debit', () => {
    renderDashboard('/demo#tasks');
    fireEvent.click(task('100% weekly attendance').getByRole('button', { name: 'Claim' }));
    click('Go to pay');
    let dialog = within(screen.getByRole('dialog', { name: 'Scan Pay' }));
    fireEvent.click(dialog.getByRole('button', { name: 'Select merchant instead' }));
    fireEvent.change(dialog.getByRole('textbox', { name: 'Amount' }), { target: { value: '1.25' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Simulate payment' }));
    const receipt = dialog.getByText(/^demo-route-/).textContent;
    expectBalance(47375);
    expect(rows()).toHaveLength(8);
    click('Back');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(task('100% weekly attendance').getByText('Claimed')).toBeVisible();
    click('Forward');
    dialog = within(screen.getByRole('dialog', { name: 'Scan Pay' }));
    expect(dialog.getByText(receipt)).toBeVisible();
    expect(dialog.getByText('Demo payment complete')).toBeVisible();
    expectBalance(47375);
    expect(rows()).toHaveLength(8);
    fireEvent.click(dialog.getByRole('button', { name: 'View in History' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mobile().getByRole('button', { name: 'History' })).toHaveAttribute('aria-current', 'page');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('cancels a scanning timer on newer navigation and starts a fresh unsubmitted form on Forward', () => {
    renderDashboard('/demo#tasks');
    click('Go to pay');
    click('Go to withdraw');
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole('dialog', { name: 'Withdraw EDC' })).toBeVisible();
    click('Back');
    const dialog = within(screen.getByRole('dialog', { name: 'Scan Pay' }));
    expect(dialog.getByText('Preview a simulated merchant scan')).toBeVisible();
    fireEvent.click(dialog.getByRole('button', { name: 'Select merchant instead' }));
    fireEvent.change(dialog.getByRole('textbox', { name: 'Amount' }), { target: { value: '55' } });
    click('Back');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    click('Forward');
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Scan Pay' })).getByRole('button', { name: 'Select merchant instead' }));
    expect(within(screen.getByRole('dialog')).getByRole('textbox', { name: 'Amount' })).toHaveValue('15.00');
    expectBalance(45000);
    expect(rows()).toHaveLength(6);
  });

  it('settles a submitted withdrawal once across Back and Forward and clears timers on dashboard exit', () => {
    renderDashboard('/demo#tasks');
    click('Go to withdraw');
    const dialog = within(screen.getByRole('dialog', { name: 'Withdraw EDC' }));
    fireEvent.change(dialog.getByRole('textbox', { name: 'Sample address' }), { target: { value: `0x${'1'.repeat(40)}` } });
    fireEvent.change(dialog.getByRole('textbox', { name: 'Amount' }), { target: { value: '1.01' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Simulate withdrawal' }));
    click('Back');
    act(() => vi.advanceTimersByTime(4000));
    expectBalance(44899);
    click('Forward');
    expect(within(screen.getByRole('dialog')).getByRole('status')).toHaveTextContent('Demo withdrawal complete');
    expectBalance(44899);
    expect(rows()).toHaveLength(7);
    click('Leave demo');
    // jsdom queues selectionchange after removing a focused input.
    act(() => vi.advanceTimersByTime(0));
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cleans up an unfinished withdrawal on exit and starts a new session on returning', () => {
    renderDashboard('/demo#withdraw');
    const dialog = within(screen.getByRole('dialog', { name: 'Withdraw EDC' }));
    fireEvent.change(dialog.getByRole('textbox', { name: 'Sample address' }), { target: { value: `0x${'1'.repeat(40)}` } });
    fireEvent.change(dialog.getByRole('textbox', { name: 'Amount' }), { target: { value: '2' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Simulate withdrawal' }));
    expectBalance(44800);
    click('Leave demo');
    act(() => vi.advanceTimersByTime(0));
    expect(vi.getTimerCount()).toBe(0);
    click('Back');
    expectBalance(45000);
    expect(rows()).toHaveLength(6);
    expect(within(screen.getByRole('dialog')).getByRole('textbox', { name: 'Amount' })).toHaveValue('');
    act(() => vi.advanceTimersByTime(5000));
    expectBalance(45000);
    expect(rows()).toHaveLength(6);
    expect(within(screen.getByRole('dialog')).queryByText('Demo receipt')).not.toBeInTheDocument();
  });
});
