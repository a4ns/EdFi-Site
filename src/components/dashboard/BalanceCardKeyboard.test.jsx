import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import BalanceCard from './BalanceCard';
import LanguageSwitcher from '../LanguageSwitcher';
import LocaleProvider from '../../state/LocaleProvider';
import { MarketsContext } from '../../state/markets';
import { translate } from '../../i18n/messages';

function renderBalance() {
  return render(
    <LocaleProvider>
      <MarketsContext.Provider value={{ quotes: { EDC: { price: 0.0267 } } }}>
        <BalanceCard balanceUnits={45000} earnedUnits={1000} />
        <LanguageSwitcher />
        <button type="button">Outside control</button>
        <p>Outside text</p>
      </MarketsContext.Provider>
    </LocaleProvider>,
  );
}

beforeEach(() => localStorage.clear());

describe('balance currency keyboard selection', () => {
  it.each(['en', 'ru', 'kk'])('supports selection, arrow keys, Home, End, letters and Escape in %s', async (locale) => {
    localStorage.setItem('edfi.locale', locale);
    const user = userEvent.setup();
    renderBalance();
    const trigger = screen.getByRole('button', { name: translate(locale, 'Balance display currency') });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('option', { name: 'EDC' })).toHaveFocus();
    expect(screen.getByRole('option', { name: 'EDC' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('option', { name: 'KZT' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'EDC' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('option', { name: 'KZT' })).toHaveFocus();
    await user.keyboard('{Home}{ArrowDown}');
    expect(screen.getByRole('option', { name: 'USDT' })).toHaveFocus();
    await user.keyboard('k');
    expect(screen.getByRole('option', { name: 'KZT' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveTextContent('KZT');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'KZT' })).toHaveFocus();
    await user.keyboard('{Home}{Escape}');
    expect(trigger).toHaveTextContent('KZT');
    expect(trigger).toHaveFocus();
    await user.keyboard('{ArrowUp}e ');
    expect(trigger).toHaveTextContent('EDC');
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on repeated trigger clicks and outside clicks without stealing another control’s focus', async () => {
    const user = userEvent.setup();
    renderBalance();
    const trigger = screen.getByRole('button', { name: 'Balance display currency' });
    await user.click(trigger);
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.click(trigger);
    await user.click(screen.getByText('Outside text'));
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Outside control' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Outside control' })).toHaveFocus();
  });

  it('closes on Tab and Shift+Tab and continues through the surrounding controls', async () => {
    const user = userEvent.setup();
    renderBalance();
    const trigger = screen.getByRole('button', { name: 'Balance display currency' });
    await user.click(trigger);
    await user.tab();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scan Pay' })).toHaveFocus();
    await user.click(trigger);
    await user.tab({ shift: true });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide balance' })).toHaveFocus();
  });

  it('preserves the chosen currency and focused option through an in-place language change', async () => {
    const user = userEvent.setup();
    renderBalance();
    const trigger = screen.getByRole('button', { name: 'Balance display currency' });
    await user.click(trigger);
    await user.keyboard('k{Enter}{Enter}');
    const option = screen.getByRole('option', { name: 'KZT' });
    expect(option).toHaveFocus();
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: 'kk' } });
    expect(trigger).toHaveAccessibleName(translate('kk', 'Balance display currency'));
    expect(trigger).toHaveTextContent('KZT');
    expect(option).toHaveFocus();
    expect(option).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
    expect(localStorage.getItem('edfi.locale')).toBe('kk');
  });
});
