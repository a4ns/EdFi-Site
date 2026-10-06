import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LocaleProvider from './LocaleProvider';
import { useLocale } from './locale';
import { LOCALE_STORAGE_KEY, readLocale } from '../lib/locale';

function Preferences() {
  const { locale, setLocale, t } = useLocale();
  return <>
    <output aria-label="locale">{locale}</output>
    <p>{t('Language')}</p>
    {['en', 'ru', 'kk', 'invalid'].map((key) => <button key={key} onClick={() => setLocale(key)}>{key}</button>)}
  </>;
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  document.documentElement.lang = 'en';
});

describe('LocaleProvider display preferences', () => {
  it('defaults to English and persists only the selected language', () => {
    render(<LocaleProvider><Preferences /></LocaleProvider>);
    expect(screen.getByLabelText('locale')).toHaveTextContent('en');
    fireEvent.click(screen.getByRole('button', { name: 'kk', exact: true }));
    expect(screen.getByText('Тіл')).toBeVisible();
    expect(document.documentElement.lang).toBe('kk');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('kk');
    expect(localStorage.length).toBe(1);
  });

  it.each(['ru', 'kk'])('restores a saved %s preference on a fresh mount', (locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    const view = render(<LocaleProvider><Preferences /></LocaleProvider>);
    expect(screen.getByLabelText('locale')).toHaveTextContent(locale);
    view.unmount();
    render(<LocaleProvider><Preferences /></LocaleProvider>);
    expect(document.documentElement.lang).toBe(locale);
  });

  it('rejects unsupported saved values and unsupported setter input', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'javascript:alert(1)');
    render(<LocaleProvider><Preferences /></LocaleProvider>);
    expect(document.documentElement.lang).toBe('en');
    fireEvent.click(screen.getByRole('button', { name: 'invalid' }));
    expect(screen.getByLabelText('locale')).toHaveTextContent('en');
    expect(readLocale()).toBe('en');
  });

  it('works in memory when browser storage reads and writes are blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Blocked', 'QuotaExceededError'); });
    render(<LocaleProvider><Preferences /></LocaleProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'ru', exact: true }));
    expect(screen.getByText('Язык')).toBeVisible();
    expect(document.documentElement.lang).toBe('ru');
  });

  it('synchronizes valid cross-tab preferences and removes its listener on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const view = render(<LocaleProvider><Preferences /></LocaleProvider>);
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: LOCALE_STORAGE_KEY, newValue: 'kk' })));
    expect(document.documentElement.lang).toBe('kk');
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'other-app', newValue: 'ru' })));
    expect(document.documentElement.lang).toBe('kk');
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: LOCALE_STORAGE_KEY, newValue: 'invalid' })));
    expect(document.documentElement.lang).toBe('kk');
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: LOCALE_STORAGE_KEY, newValue: null })));
    expect(document.documentElement.lang).toBe('en');
    view.unmount();
    expect(remove).toHaveBeenCalledWith('storage', expect.any(Function));
  });
});
