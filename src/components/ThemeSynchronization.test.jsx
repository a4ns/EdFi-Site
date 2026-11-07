import { LANGUAGE_OPTIONS } from '../lib/locale';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';
import Footer from './Footer';
import ThemeToggle from './ThemeToggle';
import AccountModal from './dashboard/AccountModal';
import LocaleProvider from '../state/LocaleProvider';
import { MarketsContext } from '../state/markets';
import { applyTheme } from '../lib/theme';
import { translate } from '../i18n/messages';

const MARKET = { list: [], quotes: {}, live: false };

function renderControls(children) {
  return render(
    <MemoryRouter>
      <LocaleProvider>
        <MarketsContext.Provider value={MARKET}>{children}</MarketsContext.Provider>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  applyTheme('dark');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.lang = 'en';
});

describe('shared theme controls', () => {
  it('updates the mounted desktop toggle after a mobile selection and changes the theme on its first click', async () => {
    const user = userEvent.setup();
    applyTheme('light');
    vi.stubGlobal('innerWidth', 390);
    renderControls(<Header />);
    const desktop = screen.getByRole('button', { name: 'Switch to dark theme' });
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const drawer = screen.getByRole('dialog', { name: 'Menu' });
    await user.click(within(drawer).getByRole('button', { name: 'Dark theme' }));
    expect(desktop).toHaveAccessibleName('Switch to light theme');
    expect(desktop).toHaveAttribute('title', 'Light theme');
    await user.click(within(drawer).getByRole('button', { name: 'Close menu' }));
    vi.stubGlobal('innerWidth', 1440);
    fireEvent(window, new Event('resize'));
    // jsdom tests the still-mounted control; CSS visibility needs browser verification.
    await user.click(desktop);
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(localStorage.getItem('edfi-theme')).toBe('light');
    expect(desktop).toHaveAccessibleName('Switch to dark theme');
  });

  it('keeps footer, settings, desktop and newly opened drawer controls in sync in both directions', async () => {
    const user = userEvent.setup();
    renderControls(<><Header /><Footer /><AccountModal mode="settings" onClose={vi.fn()} /></>);
    const footer = screen.getByRole('contentinfo');
    const settings = screen.getByRole('dialog', { name: 'Settings' });
    const desktop = screen.getByRole('button', { name: 'Switch to light theme' });
    const expectTheme = (theme) => {
      expect(document.documentElement).toHaveAttribute('data-theme', theme);
      expect(localStorage.getItem('edfi-theme')).toBe(theme);
      expect(desktop).toHaveAccessibleName(theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      for (const value of ['dark', 'light']) {
        const label = value === 'dark' ? 'Dark' : 'Light';
        expect(within(footer).getByRole('button', { name: `${label} theme` })).toHaveAttribute('aria-pressed', String(theme === value));
        expect(within(settings).getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', String(theme === value));
      }
    };
    await user.click(within(footer).getByRole('button', { name: 'Light theme' }));
    expectTheme('light');
    await user.click(within(settings).getByRole('button', { name: 'Dark', exact: true }));
    expectTheme('dark');
    await user.click(desktop);
    expectTheme('light');
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const drawer = screen.getByRole('dialog', { name: 'Menu' });
    expect(within(drawer).getByRole('button', { name: 'Light theme' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(within(drawer).getByRole('button', { name: 'Dark theme' }));
    expectTheme('dark');
    act(() => applyTheme('light'));
    expectTheme('light');
    expect(within(drawer).getByRole('button', { name: 'Light theme' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('supports repeated keyboard toggling and remounts with the current shared theme', async () => {
    const user = userEvent.setup();
    const view = renderControls(<><ThemeToggle /><Footer /></>);
    const toggle = screen.getByRole('button', { name: 'Switch to light theme' });
    toggle.focus();
    for (const [key, theme] of [['{Enter}', 'light'], [' ', 'dark'], ['{Enter}', 'light']]) {
      await user.keyboard(key);
      expect(document.documentElement).toHaveAttribute('data-theme', theme);
      expect(localStorage.getItem('edfi-theme')).toBe(theme);
      expect(screen.getByRole('button', { name: 'Light theme' })).toHaveAttribute('aria-pressed', String(theme === 'light'));
      expect(toggle).toHaveFocus();
    }
    view.unmount();
    renderControls(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
  });

  it.each(['ru', 'kk'])('preserves theme state and translated control labels when switching to %s', async (locale) => {
    const user = userEvent.setup();
    renderControls(<><ThemeToggle /><Footer /></>);
    await user.click(screen.getByRole('button', { name: 'Light theme' }));
    await user.click(screen.getByRole('button', { name: LANGUAGE_OPTIONS.find((option) => option.value === locale).label }));
    const toggle = screen.getByRole('button', { name: translate(locale, 'Switch to dark theme') });
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    await user.click(toggle);
    expect(toggle).toHaveAccessibleName(translate(locale, 'Switch to light theme'));
    expect(screen.getByRole('button', { name: translate(locale, 'Dark theme') })).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('edfi.locale')).toBe(locale);
    expect(localStorage.getItem('edfi-theme')).toBe('dark');
  });

  it('updates every control when saving the theme is blocked', async () => {
    const user = userEvent.setup();
    renderControls(<><ThemeToggle /><Footer /></>);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Blocked', 'QuotaExceededError'); });
    await user.click(screen.getByRole('button', { name: 'Light theme' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'true');
  });
});
