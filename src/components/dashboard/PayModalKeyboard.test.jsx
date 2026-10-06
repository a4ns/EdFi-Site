import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PayModal from './PayModal';
import { MERCHANTS } from './data';
import { LocaleContext } from '../../state/locale';
import { translate } from '../../i18n/messages';

function localized(locale, children) {
  return (
    <LocaleContext.Provider value={{ locale, setLocale: vi.fn(), t: (key, values) => translate(locale, key, values) }}>
      {children}
    </LocaleContext.Provider>
  );
}

describe('payment merchant keyboard selection', () => {
  it.each(['en', 'ru', 'kk'])('uses one Tab stop and wrapping arrows while submitting the selected merchant in %s', async (locale) => {
    const user = userEvent.setup();
    const onPay = vi.fn();
    const t = (key) => translate(locale, key);
    render(localized(locale, <PayModal balanceUnits={45000} onClose={vi.fn()} onPay={onPay} />));
    await user.click(screen.getByRole('button', { name: t('Select merchant instead') }));
    const group = within(screen.getByRole('radiogroup', { name: t('Merchant') }));
    const options = MERCHANTS.map((merchant) => group.getByRole('radio', { name: t(merchant.name) }));
    expect(options.map((option) => option.tabIndex)).toEqual([0, -1, -1, -1]);
    screen.getByRole('button', { name: t('Close') }).focus();
    await user.tab();
    expect(options[0]).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(options[3]).toHaveFocus();
    expect(options[3]).toHaveAttribute('aria-checked', 'true');
    await user.keyboard('{ArrowDown}');
    expect(options[0]).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowDown}');
    expect(options[2]).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(options[1]).toHaveFocus();
    await user.keyboard('{End}');
    expect(options[3]).toHaveFocus();
    await user.keyboard('{Home}{ArrowRight}{ArrowRight} ');
    expect(options[2]).toHaveFocus();
    expect(options.map((option) => option.tabIndex)).toEqual([-1, -1, 0, -1]);
    expect(group.getAllByRole('radio', { checked: true })).toEqual([options[2]]);
    expect(onPay).not.toHaveBeenCalled();
    await user.tab();
    const amount = screen.getByRole('textbox', { name: t('Amount') });
    expect(amount).toHaveFocus();
    await user.tab({ shift: true });
    expect(options[2]).toHaveFocus();
    await user.tab();
    await user.clear(amount);
    await user.type(amount, '12.34{Enter}');
    expect(onPay).toHaveBeenCalledExactlyOnceWith({ merchantId: 'merch', amountUnits: 1234 });
  });

  it('preserves the selected merchant and radio focus across language changes and receipt transition', async () => {
    const user = userEvent.setup();
    const props = { balanceUnits: 45000, onClose: vi.fn(), onPay: vi.fn(), onViewHistory: vi.fn() };
    const view = render(localized('ru', <PayModal {...props} />));
    await user.click(screen.getByRole('button', { name: translate('ru', 'Select merchant instead') }));
    await user.click(screen.getByRole('radio', { name: translate('ru', 'Campus Canteen') }));
    await user.keyboard('{ArrowRight}');
    const selected = screen.getByRole('radio', { name: translate('ru', 'Dormitory Office') });
    expect(selected).toHaveFocus();
    view.rerender(localized('kk', <PayModal {...props} />));
    expect(selected).toHaveFocus();
    expect(selected).toHaveAccessibleName(translate('kk', 'Dormitory Office'));
    expect(selected).toHaveAttribute('aria-checked', 'true');
    await user.tab();
    await user.keyboard('{Enter}');
    expect(props.onPay).toHaveBeenCalledExactlyOnceWith({ merchantId: 'dorm', amountUnits: 1500 });
    const transaction = { id: 'demo-keyboard-payment', title: 'Dormitory Office', amountUnits: -1500, at: new Date(2026, 9, 5, 12).getTime() };
    view.rerender(localized('kk', <PayModal {...props} transaction={transaction} />));
    expect(screen.getByText(translate('kk', 'Demo payment complete'))).toBeVisible();
    expect(screen.getByText(translate('kk', 'Dormitory Office'))).toBeVisible();
    expect(screen.getByText('demo-keyboard-payment')).toBeVisible();
    await waitFor(() => expect(screen.getByRole('dialog')).toContainElement(document.activeElement));
    expect(props.onPay).toHaveBeenCalledOnce();
  });
});
