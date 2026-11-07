import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardApp from './DashboardApp';
import LocaleProvider from '../state/LocaleProvider';
import { useLocale } from '../state/locale';
import { AuthContext } from '../state/auth';
import { MarketsContext } from '../state/markets';
import { COINS, EDC_START, FALLBACK_MARKETS } from '../data/content';
import { formatAmount, formatDate, formatDateTime, KZT_PER_USD } from '../lib/format';
import { formatDemoAmount } from '../lib/demoAmount';
import { translate } from '../i18n/messages';

const NOW = new Date(2026, 9, 5, 12, 0, 0);
const ADDRESS = `0x${'1'.repeat(40)}`;
const QUOTES = Object.fromEntries(Object.entries({ EDC: EDC_START, ...FALLBACK_MARKETS })
  .map(([symbol, quote]) => [symbol, { ...quote, tick: 0, dir: null }]));
const MARKETS = {
  quotes: QUOTES,
  list: Object.entries(QUOTES).map(([symbol, quote]) => ({ symbol, name: COINS[symbol].name, ...quote })),
  live: false,
};

function LocaleControls() {
  const { setLocale } = useLocale();
  return ['en', 'ru', 'kk'].map((locale) => (
    <button key={locale} type="button" onClick={() => setLocale(locale)}>Switch to {locale}</button>
  ));
}

function renderDashboard() {
  render(
    <LocaleProvider>
      <LocaleControls />
      <MemoryRouter initialEntries={['/demo']}>
        <AuthContext.Provider value={{ openAuth: vi.fn() }}>
          <MarketsContext.Provider value={MARKETS}>
            <DashboardApp />
          </MarketsContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    </LocaleProvider>,
  );
}

const changeLocale = (locale) => fireEvent.click(screen.getByRole('button', { name: `Switch to ${locale}` }));
const balance = () => within(document.getElementById('balance'));
const tasks = () => within(document.getElementById('tasks'));
const history = () => within(document.getElementById('history'));
const rows = () => within(history().getByRole('table')).getAllByRole('row').slice(1);
const button = (container, locale, key) => container.getByRole('button', { name: translate(locale, key), exact: true });

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.spyOn(globalThis, 'fetch').mockImplementation(() => { throw new Error('Locale changes must never submit demo data'); });
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('dashboard locale changes preserve demo accounting', () => {
  it('retranslates existing and claimed rewards and toast text without resetting the wallet', () => {
    renderDashboard();
    const week = within(tasks().getByText('100% weekly attendance').closest('li'));
    fireEvent.click(button(week, 'en', 'Claim'));
    expect(balance().getByText('475.00', { exact: true })).toBeVisible();
    expect(rows()).toHaveLength(7);
    expect(screen.getByRole('status')).toHaveTextContent('25.00 demo EDC added to your sample balance');

    changeLocale('ru');
    expect(balance().getByRole('heading', { name: 'Демобаланс EDC' })).toBeVisible();
    expect(balance().getByText('475,00', { exact: true })).toBeVisible();
    expect(within(tasks().getByText('100% посещаемость за неделю').closest('li')).getByText('Получено')).toBeVisible();
    expect(rows()).toHaveLength(7);
    expect(within(rows()[0]).getByText('100% посещаемость за неделю')).toBeVisible();
    expect(within(rows()[0]).getByText('Демонаграда за учёбу')).toBeVisible();
    expect(history().getAllByText('Оценка A за экзамен')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('На демобаланс добавлено 25,00 EDC');

    changeLocale('kk');
    expect(balance().getByText(formatDemoAmount(47500, 'kk'), { exact: true })).toBeVisible();
    expect(within(tasks().getByText('Апта бойы 100% қатысу').closest('li')).getByText('Алынды')).toBeVisible();
    expect(rows()).toHaveLength(7);
    expect(within(rows()[0]).getByText('Оқу үшін демосыйақы')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Демобалансқа 25,00 EDC қосылды');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves the selected merchant, draft amount and posted payment while switching languages', () => {
    renderDashboard();
    fireEvent.click(button(balance(), 'en', 'Scan Pay'));
    let dialog = within(screen.getByRole('dialog', { name: 'Scan Pay' }));
    fireEvent.click(button(dialog, 'en', 'Select merchant instead'));
    fireEvent.click(dialog.getByRole('radio', { name: 'Merch Store' }));
    fireEvent.change(dialog.getByRole('textbox', { name: 'Amount' }), { target: { value: '1,25' } });

    changeLocale('ru');
    dialog = within(screen.getByRole('dialog', { name: translate('ru', 'Scan Pay') }));
    expect(dialog.getByRole('radio', { name: translate('ru', 'Merch Store') })).toHaveAttribute('aria-checked', 'true');
    expect(dialog.getByRole('textbox', { name: 'Сумма' })).toHaveValue('1.25');
    fireEvent.click(button(dialog, 'ru', 'Simulate payment'));
    expect(dialog.getByText(translate('ru', 'Demo payment complete'))).toBeVisible();
    expect(balance().getByText('448,75', { exact: true })).toBeVisible();
    expect(rows()).toHaveLength(7);

    changeLocale('kk');
    dialog = within(screen.getByRole('dialog', { name: translate('kk', 'Scan Pay') }));
    expect(dialog.getByText(translate('kk', 'Demo payment complete'))).toBeVisible();
    expect(dialog.getByText(translate('kk', 'Merch Store'))).toBeVisible();
    expect(balance().getByText(formatDemoAmount(44875, 'kk'), { exact: true })).toBeVisible();
    fireEvent.click(button(dialog, 'kk', 'Done'));
    expect(rows()).toHaveLength(7);
    expect(within(rows()[0]).getByText('Демо: QR арқылы төлеу')).toBeVisible();
    expect(within(rows()[0]).getByText(translate('kk', 'Merch Store'))).toBeVisible();
    expect(within(rows()[0]).getByText(formatDateTime(NOW, 'kk'))).toBeVisible();

    changeLocale('en');
    expect(balance().getByText('448.75', { exact: true })).toBeVisible();
    expect(within(rows()[0]).getByText('Demo Scan Pay')).toBeVisible();
    expect(rows()).toHaveLength(7);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps pending withdrawal settlement and recipient metadata intact across locale changes', () => {
    renderDashboard();
    fireEvent.click(button(balance(), 'en', 'Withdraw'));
    let dialog = within(screen.getByRole('dialog', { name: 'Withdraw EDC' }));
    fireEvent.change(dialog.getByRole('textbox', { name: 'Sample address' }), { target: { value: ADDRESS } });
    fireEvent.change(dialog.getByRole('textbox', { name: 'Amount' }), { target: { value: '1.01' } });
    fireEvent.click(button(dialog, 'en', 'Simulate withdrawal'));
    expect(balance().getByText('448.99', { exact: true })).toBeVisible();

    changeLocale('ru');
    dialog = within(screen.getByRole('dialog', { name: translate('ru', 'Withdraw EDC') }));
    expect(dialog.getByRole('status')).toHaveTextContent(translate('ru', 'Demo withdrawal processing'));
    expect(dialog.getByText(translate('ru', 'Sample recipient {address}', { address: '0x1111…1111' }))).toBeVisible();
    act(() => vi.advanceTimersByTime(4000));
    expect(dialog.getByRole('status')).toHaveTextContent(translate('ru', 'Demo withdrawal complete'));
    expect(balance().getByText('448,99', { exact: true })).toBeVisible();

    changeLocale('kk');
    dialog = within(screen.getByRole('dialog', { name: translate('kk', 'Withdraw EDC') }));
    expect(dialog.getByRole('status')).toHaveTextContent(translate('kk', 'Demo withdrawal complete'));
    expect(dialog.getByText(translate('kk', 'Sample recipient {address}', { address: '0x1111…1111' }))).toBeVisible();
    fireEvent.click(button(dialog, 'kk', 'Done'));
    expect(rows()).toHaveLength(7);
    expect(within(rows()[0]).getByText(translate('kk', 'Sample recipient {address}', { address: '0x1111…1111' }))).toBeVisible();
    expect(balance().getByText(formatDemoAmount(44899, 'kk'), { exact: true })).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['en', 'ru', 'kk'])('formats chart dates and the illustrative KZT balance for %s', (locale) => {
    renderDashboard();
    const series = document.querySelector('#balance svg path[stroke-width="1.5"]');
    const originalSeries = series.getAttribute('d');
    changeLocale(locale);
    const caption = translate(locale, 'Demo conversion: 1 USD = {rate} KZT. Fixed assumption, not a live exchange rate.', { rate: KZT_PER_USD });
    fireEvent.click(balance().getByRole('button', { name: translate(locale, 'About these values') }));
    expect(balance().getByText(caption)).toBeVisible();
    expect(balance().getByRole('button', { name: translate(locale, 'Last {count} days', { count: 30 }) })).toHaveAttribute('aria-pressed', 'true');
    const axisDates = [new Date(2026, 8, 6, 12), new Date(2026, 8, 21, 12), NOW];
    const dates = locale === 'kk' ? ['06.09', '21.09', '05.10'] : axisDates.map((date) => (
      formatDate(date, locale, { month: 'short', day: 'numeric' })
    ));
    const axisLabels = document.querySelectorAll('#balance svg text[text-anchor]');
    expect(Array.from(axisLabels, (label) => label.textContent)).toEqual(dates);
    expect(document.querySelector('#balance svg path[stroke-width="1.5"]').getAttribute('d')).toBe(originalSeries);

    fireEvent.click(button(balance(), locale, 'Balance display currency'));
    fireEvent.click(balance().getByRole('option', { name: 'KZT' }));
    expect(balance().getByText(formatAmount(450 * EDC_START.price * KZT_PER_USD, 2, locale), { exact: true, normalizer: (text) => text })).toBeVisible();
    expect(history().getAllByText(translate(locale, 'Exam grade A'))).toHaveLength(2);
    expect(fetch).not.toHaveBeenCalled();
  });
});
