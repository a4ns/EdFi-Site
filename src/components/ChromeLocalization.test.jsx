import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';
import Footer from './Footer';
import AuthModal from './AuthModal';
import LanguageSwitcher from './LanguageSwitcher';
import QRCode from './QRCode';
import LocaleProvider from '../state/LocaleProvider';
import { AuthContext } from '../state/auth';
import { MarketsContext } from '../state/markets';
import { messages, translate } from '../i18n/messages';
import { FOOTER_COLUMNS, NAV } from '../data/content';

const MARKET = {
  list: [{ symbol: 'BTC', name: 'Bitcoin', price: 84016, change: -0.5, volume: 1500 }],
  quotes: {}, live: false,
};

function renderChrome(children) {
  return render(
    <MemoryRouter>
      <LocaleProvider>
        <AuthContext.Provider value={{ openAuth: vi.fn() }}>
          <MarketsContext.Provider value={MARKET}>{children}</MarketsContext.Provider>
        </AuthContext.Provider>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = 'en';
});

describe('shared navigation localization', () => {
  it('uses compact mobile spacing for the Kazakh app header while retaining its controls and desktop spacing', async () => {
    localStorage.setItem('edfi.locale', 'kk');
    const user = userEvent.setup();
    const onDeposit = vi.fn();
    renderChrome(<Header variant="app" onDeposit={onDeposit} />);
    const deposit = screen.getByRole('button', { name: translate('kk', 'Deposit') });
    const actions = deposit.parentElement;
    // This protects the responsive class contract; actual widths require browser verification.
    expect(screen.getByRole('link', { name: translate('kk', 'EdFi home') })).toHaveClass('mr-2', 'sm:mr-5');
    expect(actions).toHaveClass('gap-1', 'sm:gap-2');
    expect(deposit).toHaveClass('btn', 'btn-primary', 'btn-sm');
    expect(within(actions).getByRole('button', { name: translate('kk', 'Notifications, {count} unread', { count: 3 }) })).toBeEnabled();
    expect(within(actions).getByRole('button', { name: translate('kk', 'Account menu') })).toBeEnabled();
    await user.click(deposit);
    expect(onDeposit).toHaveBeenCalledOnce();
    await user.click(within(actions).getByRole('button', { name: translate('kk', 'Open menu') }));
    expect(screen.getByRole('dialog', { name: translate('kk', 'Menu') })).toBeInTheDocument();
  });

  it.each([null, 'kk', 'en', 'ru'])('orders named language controls in the desktop panel and footer with saved locale %s', async (savedLocale) => {
    if (savedLocale) localStorage.setItem('edfi.locale', savedLocale);
    const locale = savedLocale ?? 'en';
    const user = userEvent.setup();
    renderChrome(<><Header /><Footer /></>);
    await user.click(screen.getByRole('button', { name: translate(locale, 'Language and currency') }));
    const controls = screen.getAllByRole('combobox', { name: translate(locale, 'Language') });
    expect(controls).toHaveLength(2);
    for (const control of controls) {
      expect(within(control).getAllByRole('option').map((option) => [option.value, option.textContent, option.lang])).toEqual([
        ['kk', 'Қазақша', 'kk'], ['en', 'English', 'en'], ['ru', 'Русский', 'ru'],
      ]);
      expect(control).toHaveValue(locale);
    }
    expect(localStorage.getItem('edfi.locale')).toBe(locale);
    await user.selectOptions(controls[0], 'ru');
    for (const control of screen.getAllByRole('combobox', { name: translate('ru', 'Language') })) {
      expect(control).toHaveValue('ru');
    }
    expect(localStorage.getItem('edfi.locale')).toBe('ru');
    expect(document.documentElement).toHaveAttribute('lang', 'ru');
    expect(screen.getAllByText(translate('ru', 'Market prices use USD. Demo KZT estimates use a fixed rate of 1 USD = 520 KZT, not a live exchange rate.'))).toHaveLength(2);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: translate('ru', 'Language and currency') })).toHaveFocus();
    const footerControl = screen.getByRole('combobox', { name: translate('ru', 'Language') });
    await user.selectOptions(footerControl, 'kk');
    expect(footerControl).toHaveValue('kk');
    expect(screen.getByText(translate('kk', 'Independent concept project. Not affiliated with or endorsed by Binance.'))).toBeInTheDocument();
  });

  it.each(['kk', 'en', 'ru'])('orders mobile languages and preserves saved %s before a focused language change', async (locale) => {
    localStorage.setItem('edfi.locale', locale);
    const user = userEvent.setup();
    renderChrome(<Header />);
    const opener = screen.getByRole('button', { name: translate(locale, 'Open menu') });
    await user.click(opener);
    let drawer = screen.getByRole('dialog', { name: translate(locale, 'Menu') });
    expect(within(drawer).getByRole('button', { name: translate(locale, 'Close menu') })).toHaveFocus();
    const control = within(drawer).getByRole('combobox', { name: translate(locale, 'Language') });
    expect(within(control).getAllByRole('option').map((option) => [option.value, option.textContent, option.lang])).toEqual([
      ['kk', 'Қазақша', 'kk'], ['en', 'English', 'en'], ['ru', 'Русский', 'ru'],
    ]);
    expect(control).toHaveValue(locale);
    expect(localStorage.getItem('edfi.locale')).toBe(locale);
    await user.selectOptions(control, 'kk');
    drawer = screen.getByRole('dialog', { name: translate('kk', 'Menu') });
    expect(control).toHaveFocus();
    expect(control).toHaveValue('kk');
    expect(within(drawer).getByRole('link', { name: translate('kk', 'Open web demo') })).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: translate('kk', 'Dark theme') })).toBeInTheDocument();
    await user.click(within(drawer).getByRole('button', { name: translate('kk', 'Close menu') }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('preserves an open footer accordion when its language changes', async () => {
    const user = userEvent.setup();
    renderChrome(<Footer />);
    const accordion = screen.getByText('About', { selector: 'summary' }).closest('details');
    accordion.open = true;
    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'ru');
    expect(accordion.open).toBe(true);
    expect(within(accordion).getByText(translate('ru', 'About EdFi'))).toBeInTheDocument();
  });

  it.each(['ru', 'kk'])('searches translated page titles in %s', async (locale) => {
    localStorage.setItem('edfi.locale', locale);
    const user = userEvent.setup();
    renderChrome(<Header />);
    await user.click(screen.getByRole('button', { name: translate(locale, 'Search') }));
    const input = screen.getByRole('textbox', { name: translate(locale, 'Search coins or pages') });
    await user.type(input, translate(locale, 'Markets overview'));
    expect(screen.getByRole('button', { name: translate(locale, 'Markets overview') })).toBeInTheDocument();
    expect(screen.getByText(translate(locale, 'No coins match “{query}”', { query: translate(locale, 'Markets overview') }))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: translate(locale, 'Clear search') }));
    expect(input).toHaveValue('');
    expect(screen.getByText(translate(locale, 'Hot'))).toBeInTheDocument();
  });

  it('uses web-demo and fixed conversion wording instead of native-app or launch promises', () => {
    renderChrome(<><Header /><Footer /></>);
    expect(screen.getByRole('button', { name: 'Open web demo' })).toBeInTheDocument();
    expect(screen.getByText('Scan to open the web demo')).toBeInTheDocument();
    expect(screen.queryByText('iOS and Android')).not.toBeInTheDocument();
    expect(screen.queryByText(/More languages and KZT arrive/)).not.toBeInTheDocument();
    expect(screen.getByText(/Demo KZT estimates use a fixed rate of 1 USD = 520 KZT/)).toBeInTheDocument();
    expect(screen.getByText(/EdFi © \d{4}/)).toBeInTheDocument();
  });

  it('has Russian and Kazakh translations for every navigation/footer source string', () => {
    const keys = [
      ...NAV.flatMap((item) => [item.label, ...(item.menu ?? []).flatMap(({ title, desc }) => [title, desc])]),
      ...FOOTER_COLUMNS.flatMap((column) => [column.title, ...column.links.map(([label]) => label)]),
    ];
    for (const key of keys) {
      expect(messages[key]?.ru, key).toBeTruthy();
      expect(messages[key]?.kk, key).toBeTruthy();
    }
  });
});

describe('authentication and QR localization', () => {
  it('keeps entered demo details and the password step across locale changes without transmission', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('No network in demo authentication'));
    renderChrome(<><LanguageSwitcher /><AuthModal mode="signup" onClose={vi.fn()} onDone={onDone} /></>);
    await user.type(screen.getByRole('textbox', { name: 'University email' }), 'student@example.test');
    const language = screen.getByRole('combobox', { name: 'Language' });
    fireEvent.change(language, { target: { value: 'ru' } });
    expect(screen.getByRole('textbox', { name: translate('ru', 'University email') })).toHaveValue('student@example.test');
    await user.click(screen.getByRole('button', { name: translate('ru', 'Next') }));
    const password = screen.getByLabelText(translate('ru', 'Password'), { selector: 'input' });
    await user.type(password, 'fake-pass');
    fireEvent.change(language, { target: { value: 'kk' } });
    expect(screen.getByLabelText(translate('kk', 'Password'), { selector: 'input' })).toHaveValue('fake-pass');
    expect(screen.getByText(translate('kk', 'Set a password for {identifier}', { identifier: 'student@example.test' }))).toBeInTheDocument();
    expect(screen.getByText(translate('kk', 'Demo only: use made-up details. Nothing is sent or saved.'))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: translate('kk', 'Show password') }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: translate('kk', 'Create Account') }));
    expect(onDone).toHaveBeenCalledOnce();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('edfi.locale')).toBe('kk');
    expect(localStorage.length).toBe(1);
    fetchSpy.mockRestore();
  });

  it('localizes default QR descriptions and accepts explicit demo-only labels', () => {
    localStorage.setItem('edfi.locale', 'kk');
    renderChrome(<><QRCode value="https://example.test/demo" /><QRCode value="EDFI_DEMO_ONLY" label="Sample only" /></>);
    expect(screen.getByRole('img', { name: translate('kk', 'QR code for {value}', { value: 'https://example.test/demo' }) })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Sample only' })).toBeInTheDocument();
  });
});
