import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocaleContext } from '../../state/locale';
import LocaleProvider from '../../state/LocaleProvider';
import { translate } from '../../i18n/messages';
import { formatDemoAmount } from '../../lib/demoAmount';
import { formatPercent } from '../../lib/format';
import PayModal from './PayModal';
import WithdrawModal from './WithdrawModal';
import AccountModal from './AccountModal';
import DepositModal from './DepositModal';
import { NotificationsMenu } from './HeaderMenus';

const SAMPLE_ADDRESS = `0x${'1'.repeat(40)}`;

function localized(locale, children) {
  return (
    <LocaleContext.Provider value={{ locale, setLocale: vi.fn(), t: (key, values) => translate(locale, key, values) }}>
      {children}
    </LocaleContext.Provider>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(globalThis, 'fetch').mockImplementation(() => { throw new Error('Wallet dialogs must not use the network'); });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  document.documentElement.lang = 'en';
});

describe('Localized demo wallet dialogs', () => {
  it.each(['en', 'ru', 'kk'])('keeps exact amounts and keyboard withdrawal in %s', async (locale) => {
    const user = userEvent.setup();
    const onWithdraw = vi.fn();
    const t = (key) => translate(locale, key);
    render(localized(locale, <WithdrawModal balanceUnits={45001} onClose={vi.fn()} onWithdraw={onWithdraw} />));
    const dialog = within(screen.getByRole('dialog', { name: t('Withdraw EDC') }));
    const amount = dialog.getByRole('textbox', { name: t('Amount') });
    expect(dialog.getByRole('note')).toHaveTextContent(t('Demo only. This changes your sample balance; no funds are sent on-chain.'));
    await user.type(dialog.getByRole('textbox', { name: t('Sample address') }), SAMPLE_ADDRESS);
    await user.type(amount, '450,02');
    expect(amount).toHaveValue('450.02');
    expect(amount).toHaveAttribute('aria-invalid', 'true');
    expect(dialog.getByText(t('Insufficient balance'))).toBeVisible();
    expect(dialog.getByRole('button', { name: t('Simulate withdrawal') })).toBeDisabled();
    fireEvent.submit(amount.closest('form'));
    expect(onWithdraw).not.toHaveBeenCalled();

    await user.click(dialog.getByRole('button', { name: formatPercent(25, 0, locale) }));
    expect(amount).toHaveValue('112.50');
    await user.click(dialog.getByRole('button', { name: t('Max') }));
    expect(amount).toHaveValue('450.01');
    await user.click(amount);
    await user.keyboard('{Enter}');
    expect(onWithdraw).toHaveBeenCalledExactlyOnceWith({ address: SAMPLE_ADDRESS, amountUnits: 45001 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves the payment form, merchant and focus when switching RU to KK, then retranslates its receipt', async () => {
    const user = userEvent.setup();
    const onPay = vi.fn();
    const onClose = vi.fn();
    const props = { balanceUnits: 45000, onPay, onClose, onViewHistory: vi.fn() };
    const view = render(localized('ru', <PayModal {...props} />));
    await user.click(screen.getByRole('button', { name: translate('ru', 'Select merchant instead') }));
    await user.click(screen.getByRole('radio', { name: translate('ru', 'Merch Store') }));
    const amount = screen.getByRole('textbox', { name: translate('ru', 'Amount') });
    await user.clear(amount);
    await user.type(amount, '12,34');
    expect(amount).toHaveFocus();

    view.rerender(localized('kk', <PayModal {...props} />));
    expect(screen.getByRole('textbox', { name: translate('kk', 'Amount') })).toBe(amount);
    expect(amount).toHaveValue('12.34');
    expect(amount).toHaveFocus();
    expect(screen.getByRole('radio', { name: translate('kk', 'Merch Store') })).toHaveAttribute('aria-checked', 'true');
    await user.keyboard('{Enter}');
    expect(onPay).toHaveBeenCalledExactlyOnceWith({ merchantId: 'merch', amountUnits: 1234 });

    const transaction = { id: 'demo-pay-1', title: 'Merch Store', amountUnits: -1234, at: new Date(2026, 9, 5, 12).getTime() };
    view.rerender(localized('kk', <PayModal {...props} transaction={transaction} />));
    expect(screen.getByText(translate('kk', 'Demo payment complete'))).toBeVisible();
    expect(screen.getByText(`-${formatDemoAmount(1234, 'kk')} EDC`)).toBeVisible();
    expect(screen.getByText('demo-pay-1')).toBeVisible();
    await waitFor(() => expect(screen.getByRole('dialog')).toContainElement(document.activeElement));

    view.rerender(localized('ru', <PayModal {...props} transaction={transaction} />));
    expect(screen.getByText(translate('ru', 'Demo payment complete'))).toBeVisible();
    expect(screen.getByText(translate('ru', 'Merch Store'))).toBeVisible();
    expect(screen.getByText('demo-pay-1')).toBeVisible();
    expect(screen.getByText(translate('ru', 'Local receipt only. No blockchain transaction exists.'))).toBeVisible();
    expect(onPay).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves withdrawal inputs across locale changes and translates processing and completed receipts', async () => {
    const user = userEvent.setup();
    const props = { balanceUnits: 45000, onWithdraw: vi.fn(), onClose: vi.fn() };
    const view = render(localized('ru', <WithdrawModal {...props} />));
    await user.type(screen.getByRole('textbox', { name: translate('ru', 'Sample address') }), SAMPLE_ADDRESS);
    await user.type(screen.getByRole('textbox', { name: translate('ru', 'Amount') }), '1,01');
    view.rerender(localized('kk', <WithdrawModal {...props} />));
    expect(screen.getByRole('textbox', { name: translate('kk', 'Sample address') })).toHaveValue(SAMPLE_ADDRESS);
    expect(screen.getByRole('textbox', { name: translate('kk', 'Amount') })).toHaveValue('1.01');
    await user.click(screen.getByRole('button', { name: translate('kk', 'Simulate withdrawal') }));
    expect(props.onWithdraw).toHaveBeenCalledExactlyOnceWith({ address: SAMPLE_ADDRESS, amountUnits: 101 });

    const transaction = { id: 'demo-withdraw-1', status: 'processing', amountUnits: -101, sub: 'Sample recipient 0x1111…1111', subKey: 'Sample recipient {address}', subParams: { address: '0x1111…1111' } };
    view.rerender(localized('kk', <WithdrawModal {...props} transaction={transaction} />));
    expect(screen.getByRole('status')).toHaveTextContent(translate('kk', 'Demo withdrawal processing'));
    expect(screen.getByText(translate('kk', transaction.subKey, transaction.subParams))).toBeVisible();
    view.rerender(localized('ru', <WithdrawModal {...props} transaction={{ ...transaction, status: 'completed' }} />));
    expect(screen.getByRole('status')).toHaveTextContent(translate('ru', 'Demo withdrawal complete'));
    expect(screen.getByText(translate('ru', transaction.subKey, transaction.subParams))).toBeVisible();
    expect(screen.getByText('demo-withdraw-1')).toBeVisible();
    expect(screen.getByText(translate('ru', 'Status changes are simulated locally. Nothing is sent to this address.'))).toBeVisible();
    expect(props.onWithdraw).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('changes language in Settings without resetting switches and keeps select within the focus trap', async () => {
    const user = userEvent.setup();
    render(<LocaleProvider><AccountModal mode="settings" onClose={vi.fn()} /></LocaleProvider>);
    const push = screen.getByRole('switch', { name: 'Push notifications' });
    await user.click(push);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'kk');
    expect(document.documentElement).toHaveAttribute('lang', 'kk');
    expect(screen.getByRole('dialog', { name: translate('kk', 'Settings') })).toBeVisible();
    expect(screen.getByRole('switch', { name: translate('kk', 'Push notifications') })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('combobox', { name: translate('kk', 'Language') })).toHaveValue('kk');
    expect(screen.getByText(translate('kk', 'Sample: enabled'))).toBeVisible();
    await user.click(screen.getByRole('button', { name: translate('kk', 'Close') }));
    await user.tab();
    expect(screen.getByRole('combobox', { name: translate('kk', 'Language') })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: translate('kk', 'Close') })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: translate('kk', 'Done') })).toHaveFocus();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('translates notifications and preserves read state when switching locales', async () => {
    const user = userEvent.setup();
    const view = render(localized('ru', <NotificationsMenu />));
    await user.click(screen.getByRole('button', { name: translate('ru', 'Notifications, {count} unread', { count: 3 }) }));
    expect(screen.getByText(translate('ru', 'Weekly attendance verified'))).toBeVisible();
    await user.click(screen.getByRole('button', { name: translate('ru', 'Mark all as read') }));
    view.rerender(localized('kk', <NotificationsMenu />));
    expect(screen.getByRole('button', { name: translate('kk', 'Notifications') })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: translate('kk', 'Mark all as read') })).toBeDisabled();
    expect(screen.getByText(translate('kk', 'Weekly attendance verified'))).toBeVisible();
    expect(screen.getByText(translate('kk', 'The registrar oracle is confirming your semester GPA.'))).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['en', 'ru', 'kk'])('keeps the no-deposit warning explicit in %s', (locale) => {
    render(localized(locale, <DepositModal onClose={vi.fn()} />));
    expect(screen.getByRole('note')).toHaveTextContent(translate(locale, 'Demo only. Do not send funds. This prototype has no deposit address and cannot receive or credit deposits.'));
    expect(screen.getByText(translate(locale, 'Sample QR only. It is not a wallet address.'))).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });
});
