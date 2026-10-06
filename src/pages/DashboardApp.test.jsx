import { act, cleanup, configure, fireEvent, getConfig, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardApp from './DashboardApp';
import { AuthContext } from '../state/auth';
import { MarketsContext } from '../state/markets';
import { COINS, EDC_START, FALLBACK_MARKETS } from '../data/content';

const SAMPLE_ADDRESS = `0x${'1'.repeat(40)}`;
const QUOTES = Object.fromEntries(Object.entries({ EDC: EDC_START, ...FALLBACK_MARKETS })
  .map(([symbol, quote]) => [symbol, { ...quote, tick: 0, dir: null }]));
const MARKETS = {
  quotes: QUOTES,
  list: Object.entries(QUOTES).map(([symbol, quote]) => ({ symbol, name: COINS[symbol].name, ...quote })),
  live: false,
};
const DEFAULT_ASYNC_WRAPPER = getConfig().asyncWrapper;

function renderDashboard() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <MemoryRouter initialEntries={['/demo']}>
      <AuthContext.Provider value={{ openAuth: vi.fn() }}>
        <MarketsContext.Provider value={MARKETS}>
          <DashboardApp />
        </MarketsContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
  return user;
}

function balanceCard() {
  return within(screen.getByRole('heading', { name: 'Demo EDC balance' }).closest('section'));
}

function expectBalance(amount) {
  expect(balanceCard().getByText(amount, { exact: true })).toBeVisible();
}

function transactionRows() {
  const history = screen.getByRole('heading', { name: 'Recent demo transactions' }).closest('section');
  return within(within(history).getByRole('table')).getAllByRole('row').slice(1);
}

function taskRow(title) {
  const tasks = screen.getByRole('heading', { name: 'Learn & Earn' }).closest('section');
  return within(within(tasks).getByText(title, { exact: true }).closest('li'));
}

async function openPayment(user) {
  await user.click(balanceCard().getByRole('button', { name: 'Scan Pay' }));
  const dialog = screen.getByRole('dialog', { name: 'Scan Pay' });
  await user.click(within(dialog).getByRole('button', { name: 'Select merchant instead' }));
  return dialog;
}

async function enterAmount(user, dialog, amount) {
  const input = within(dialog).getByRole('textbox', { name: 'Amount' });
  await user.clear(input);
  await user.type(input, amount);
  return input;
}

async function pay(user, amount) {
  const dialog = await openPayment(user);
  await enterAmount(user, dialog, amount);
  await user.click(within(dialog).getByRole('button', { name: 'Simulate payment' }));
  expect(within(dialog).getByText('Demo payment complete')).toBeVisible();
  await user.click(within(dialog).getByRole('button', { name: 'Done' }));
}

async function openWithdrawal(user) {
  await user.click(balanceCard().getByRole('button', { name: 'Withdraw' }));
  return screen.getByRole('dialog', { name: 'Withdraw EDC' });
}

beforeEach(() => {
  vi.useFakeTimers();
  // Local noon keeps the seeded 2-hour-old reward in today's calendar day.
  vi.setSystemTime(new Date(2026, 9, 5, 12, 0, 0));
  vi.spyOn(globalThis, 'fetch').mockImplementation(() => { throw new Error('Demo flows must not access the network'); });
  // RTL's default microtask drain detects Jest timers only. Use React's async act
  // with Vitest so user-event can advance its own timers without a real-time wait.
  configure({ asyncWrapper: async (callback) => {
    let result;
    await act(async () => { result = await callback(); });
    return result;
  } });
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  configure({ asyncWrapper: DEFAULT_ASYNC_WRAPPER });
});

describe('Dashboard demo wallet flows', () => {
  it('claims a reward once, announces it, and credits the exact balance and daily earnings', async () => {
    const user = renderDashboard();
    expectBalance('450.00');
    expect(balanceCard().getByText('+50.00 EDC')).toBeVisible();

    await user.dblClick(taskRow('100% weekly attendance').getByRole('button', { name: 'Claim' }));

    expectBalance('475.00');
    expect(balanceCard().getByText('+75.00 EDC')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('25.00 demo EDC added to your sample balance');
    expect(taskRow('100% weekly attendance').getByText('Claimed')).toBeVisible();
    expect(taskRow('100% weekly attendance').queryByRole('button', { name: 'Claim' })).not.toBeInTheDocument();
    expect(transactionRows().filter((row) => within(row).queryByText('100% weekly attendance'))).toHaveLength(1);

    act(() => vi.advanceTimersByTime(2600));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expectBalance('475.00');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('finishes the last course lesson before making its reward claimable', async () => {
    const user = renderDashboard();
    const course = taskRow('Blockchain Basics course');
    expect(course.getByText('3/4')).toBeVisible();
    expect(course.queryByRole('button', { name: 'Claim' })).not.toBeInTheDocument();

    await user.click(course.getByRole('button', { name: 'Next lesson' }));
    expect(course.getByText('4/4')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('sample reward is ready to claim');
    expectBalance('450.00');

    await user.click(course.getByRole('button', { name: 'Claim' }));
    expectBalance('490.00');
    expect(balanceCard().getByText('+90.00 EDC')).toBeVisible();
    expect(course.getByText('Claimed')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('40.00 demo EDC added');
  });

  it('completes local research verification and claims once without contacting a registrar', async () => {
    const user = renderDashboard();
    const research = taskRow('Publish a research article');
    await user.dblClick(research.getByRole('button', { name: 'Submit' }));

    expect(research.getByRole('button', { name: 'Verify' })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('No DOI or registrar request was sent');
    expectBalance('450.00');
    expect(transactionRows()).toHaveLength(6);
    await user.dblClick(research.getByRole('button', { name: 'Verify' }));
    expect(research.getByRole('button', { name: 'Claim' })).toBeVisible();
    expectBalance('450.00');
    expect(transactionRows()).toHaveLength(6);
    await user.dblClick(research.getByRole('button', { name: 'Claim' }));
    expect(research.getByText('Claimed')).toBeVisible();
    expectBalance('750.00');
    expect(balanceCard().getByText('+350.00 EDC')).toBeVisible();
    expect(transactionRows()).toHaveLength(7);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('pays 449.99 then pays the exact remaining 0.01 with Max', async () => {
    const user = renderDashboard();
    await pay(user, '449.99');
    expectBalance('0.01');

    const dialog = await openPayment(user);
    await user.click(within(dialog).getByRole('button', { name: 'Max' }));
    expect(within(dialog).getByRole('textbox', { name: 'Amount' })).toHaveValue('0.01');
    expect(within(dialog).getByRole('button', { name: 'Simulate payment' })).toBeEnabled();
    await user.click(within(dialog).getByRole('button', { name: 'Simulate payment' }));

    expect(within(dialog).getByText('-0.01 EDC')).toBeVisible();
    expectBalance('0.00');
    expect(within(transactionRows()[0]).getByText('-0.01 EDC')).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('pays 448.99 then withdraws the exact remaining 1.01 through simulated completion', async () => {
    const user = renderDashboard();
    await pay(user, '448.99');
    expectBalance('1.01');

    const dialog = await openWithdrawal(user);
    await user.type(within(dialog).getByRole('textbox', { name: 'Sample address' }), SAMPLE_ADDRESS);
    await user.click(within(dialog).getByRole('button', { name: 'Max' }));
    expect(within(dialog).getByRole('textbox', { name: 'Amount' })).toHaveValue('1.01');
    await user.click(within(dialog).getByRole('button', { name: 'Simulate withdrawal' }));

    expectBalance('0.00');
    expect(within(dialog).getByRole('status')).toHaveTextContent('Demo withdrawal processing');
    expect(within(transactionRows()[0]).getByText('Demo processing')).toBeVisible();
    expect(within(dialog).getByText('1.01 EDC')).toBeVisible();
    expect(within(dialog).getByRole('note')).toHaveTextContent('no funds are sent on-chain');
    expect(within(dialog).getByText(/Status changes are simulated locally/)).toHaveTextContent('Nothing is sent to this address');
    expect(within(dialog).getByText('Demo receipt')).toBeVisible();
    expect(within(dialog).queryByText(/transaction hash|tx hash/i)).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('link')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3999));
    expect(within(dialog).getByRole('status')).toHaveTextContent('Demo withdrawal processing');
    act(() => vi.advanceTimersByTime(1));
    expect(within(dialog).getByRole('status')).toHaveTextContent('Demo withdrawal complete');
    expect(within(transactionRows()[0]).getByText('Demo complete')).toBeVisible();
    expectBalance('0.00');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['payment', 'withdrawal'])('rejects a true 0.01 overspend for a %s without recording a debit', async (kind) => {
    const user = renderDashboard();
    const dialog = kind === 'payment' ? await openPayment(user) : await openWithdrawal(user);
    if (kind === 'withdrawal') {
      await user.type(within(dialog).getByRole('textbox', { name: 'Sample address' }), SAMPLE_ADDRESS);
    }
    await enterAmount(user, dialog, '450.01');

    expect(within(dialog).getByText('Insufficient balance')).toBeVisible();
    expect(within(dialog).getByRole('textbox', { name: 'Amount' })).toHaveAttribute('aria-invalid', 'true');
    expect(within(dialog).getByRole('button', { name: `Simulate ${kind}` })).toBeDisabled();
    // Enter can dispatch a submit even when the visible submit button is disabled.
    fireEvent.submit(within(dialog).getByRole('textbox', { name: 'Amount' }).closest('form'));
    expectBalance('450.00');
    expect(transactionRows()).toHaveLength(6);
    expect(within(dialog).queryByText('Demo receipt')).not.toBeInTheDocument();
  });

  it('cancels the scanner and its timer, then starts a fresh scan with no debit', async () => {
    const user = renderDashboard();
    await user.click(balanceCard().getByRole('button', { name: 'Scan Pay' }));
    const firstDialog = screen.getByRole('dialog', { name: 'Scan Pay' });
    expect(within(firstDialog).getByText(/No camera access is used/)).toBeVisible();
    await user.click(within(firstDialog).getByRole('button', { name: 'Close' }));

    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expectBalance('450.00');
    expect(transactionRows()).toHaveLength(6);

    await user.click(balanceCard().getByRole('button', { name: 'Scan Pay' }));
    const dialog = screen.getByRole('dialog', { name: 'Scan Pay' });
    expect(within(dialog).getByText('Preview a simulated merchant scan')).toBeVisible();
    act(() => vi.advanceTimersByTime(2599));
    expect(within(dialog).queryByRole('textbox', { name: 'Amount' })).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(within(dialog).getByRole('textbox', { name: 'Amount' })).toHaveValue('15.00');
    expect(within(dialog).queryByText('Demo receipt')).not.toBeInTheDocument();
    expectBalance('450.00');
  });

  it('discards an unsubmitted payment amount and merchant on cancellation', async () => {
    const user = renderDashboard();
    const firstDialog = await openPayment(user);
    await enterAmount(user, firstDialog, '12.34');
    await user.click(within(firstDialog).getByRole('radio', { name: 'Merch Store' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expectBalance('450.00');
    const dialog = await openPayment(user);
    expect(within(dialog).getByRole('textbox', { name: 'Amount' })).toHaveValue('15.00');
    expect(within(dialog).getByRole('radio', { name: 'Campus Canteen' })).toHaveAttribute('aria-checked', 'true');
    expect(within(dialog).queryByText('Demo receipt')).not.toBeInTheDocument();
    expect(transactionRows()).toHaveLength(6);
  });

  it('discards an unsubmitted withdrawal amount and address on cancellation', async () => {
    const user = renderDashboard();
    const firstDialog = await openWithdrawal(user);
    await enterAmount(user, firstDialog, '12.34');
    await user.type(within(firstDialog).getByRole('textbox', { name: 'Sample address' }), SAMPLE_ADDRESS);
    await user.click(within(firstDialog).getByRole('button', { name: 'Close' }));

    const dialog = await openWithdrawal(user);
    expect(within(dialog).getByRole('textbox', { name: 'Amount' })).toHaveValue('');
    expect(within(dialog).getByRole('textbox', { name: 'Sample address' })).toHaveValue('');
    expect(within(dialog).getByRole('button', { name: 'Simulate withdrawal' })).toBeDisabled();
    expect(within(dialog).queryByText('Demo receipt')).not.toBeInTheDocument();
    expectBalance('450.00');
    expect(transactionRows()).toHaveLength(6);
  });

  it('deduplicates payment submit events and creates a fresh receipt when the flow is repeated', async () => {
    const user = renderDashboard();
    const dialog = await openPayment(user);
    await enterAmount(user, dialog, '15');
    const form = within(dialog).getByRole('textbox', { name: 'Amount' }).closest('form');
    // Queue two real form events before React can replace the form with its receipt.
    act(() => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });

    expectBalance('435.00');
    expect(transactionRows()).toHaveLength(7);
    expect(within(dialog).getByText('Demo payment complete')).toBeVisible();
    expect(within(dialog).getByText('Local receipt only. No blockchain transaction exists.')).toBeVisible();
    const receipt = within(dialog).getByText(/^demo-[\da-f-]+$/i).textContent;
    expect(within(dialog).queryByText(/transaction hash|tx hash/i)).not.toBeInTheDocument();
    expect(dialog.textContent).not.toMatch(/0x[\da-f]{64}/i);
    expect(within(dialog).queryByRole('link')).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Done' }));

    const nextDialog = await openPayment(user);
    expect(within(nextDialog).queryByText(receipt)).not.toBeInTheDocument();
    expect(within(nextDialog).getByRole('textbox', { name: 'Amount' })).toHaveValue('15.00');
    await user.click(within(nextDialog).getByRole('button', { name: 'Simulate payment' }));
    expectBalance('420.00');
    expect(transactionRows()).toHaveLength(8);
    expect(within(nextDialog).getByText(/^demo-[\da-f-]+$/i).textContent).not.toBe(receipt);
  });

  it('deduplicates withdrawal submit events and settles after its receipt is closed', async () => {
    const user = renderDashboard();
    const dialog = await openWithdrawal(user);
    await user.type(within(dialog).getByRole('textbox', { name: 'Sample address' }), SAMPLE_ADDRESS);
    await enterAmount(user, dialog, '5');
    const form = within(dialog).getByRole('textbox', { name: 'Amount' }).closest('form');
    act(() => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });

    expectBalance('445.00');
    expect(transactionRows()).toHaveLength(7);
    expect(within(dialog).getByRole('status')).toHaveTextContent('Demo withdrawal processing');
    await user.click(within(dialog).getByRole('button', { name: 'Done' }));
    const nextDialog = await openWithdrawal(user);
    expect(within(nextDialog).getByRole('textbox', { name: 'Amount' })).toHaveValue('');
    expect(within(nextDialog).getByRole('textbox', { name: 'Sample address' })).toHaveValue('');
    expect(within(nextDialog).queryByText('Demo receipt')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(4000));
    expect(within(transactionRows()[0]).getByText('Demo complete')).toBeVisible();
    expectBalance('445.00');
    expect(within(nextDialog).queryByText('Demo receipt')).not.toBeInTheDocument();

    await user.type(within(nextDialog).getByRole('textbox', { name: 'Sample address' }), SAMPLE_ADDRESS);
    await enterAmount(user, nextDialog, '1');
    await user.click(within(nextDialog).getByRole('button', { name: 'Simulate withdrawal' }));
    expectBalance('444.00');
    expect(within(nextDialog).getByRole('status')).toHaveTextContent('Demo withdrawal processing');
    act(() => vi.advanceTimersByTime(4000));
    expect(within(nextDialog).getByRole('status')).toHaveTextContent('Demo withdrawal complete');
    expectBalance('444.00');
  });

  it('retains daily earnings after more than eight payments push rewards out of recent history', async () => {
    const user = renderDashboard();
    await user.click(taskRow('100% weekly attendance').getByRole('button', { name: 'Claim' }));

    for (let index = 0; index < 9; index += 1) {
      await pay(user, '1');
    }

    expectBalance('466.00');
    expect(transactionRows()).toHaveLength(8);
    expect(transactionRows().every((row) => within(row).queryByText('Demo Scan Pay'))).toBe(true);
    expect(balanceCard().getByText('+75.00 EDC')).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('shows deposit warnings and renders an explicitly non-wallet QR payload', async () => {
    const user = renderDashboard();
    expect(screen.getByRole('note')).toHaveTextContent('No wallet is connected and no funds are sent');
    await user.click(balanceCard().getByRole('button', { name: 'Deposit' }));
    const dialog = screen.getByRole('dialog', { name: 'Deposit EDC' });

    expect(within(dialog).getByRole('note')).toHaveTextContent('Do not send funds');
    expect(within(dialog).getByRole('note')).toHaveTextContent('no deposit address and cannot receive or credit deposits');
    expect(within(dialog).getByText('Sample QR only. It is not a wallet address.')).toBeVisible();
    const qr = within(dialog).getByRole('img', { name: 'QR code for EDFI-DEMO-ONLY:DO-NOT-SEND-FUNDS' });
    expect(qr).toBeVisible();
    expect(qr.getAttribute('aria-label')).not.toMatch(/0x[\da-f]{40}|ethereum:|bsc:/i);
    expect(within(dialog).queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
    expect(dialog.textContent).not.toMatch(/0x[\da-f]{40}/i);
    await user.click(within(dialog).getByRole('button', { name: 'Done' }));
    expectBalance('450.00');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refreshes today\'s earnings at local midnight without changing the wallet balance', async () => {
    vi.setSystemTime(new Date(2026, 9, 5, 23, 59, 59, 500));
    const user = renderDashboard();
    await user.click(taskRow('100% weekly attendance').getByRole('button', { name: 'Claim' }));
    expect(balanceCard().getByText('+75.00 EDC')).toBeVisible();

    act(() => vi.advanceTimersByTime(500));
    expect(balanceCard().getByText('+0.00 EDC')).toBeVisible();
    expectBalance('475.00');
    expect(transactionRows()).toHaveLength(7);
  });

  it.each(['payment', 'withdrawal'])('keeps keyboard focus inside the %s receipt and restores its opener', async (kind) => {
    const user = renderDashboard();
    const opener = balanceCard().getByRole('button', { name: kind === 'payment' ? 'Scan Pay' : 'Withdraw' });
    const dialog = kind === 'payment' ? await openPayment(user) : await openWithdrawal(user);
    if (kind === 'withdrawal') {
      await user.type(within(dialog).getByRole('textbox', { name: 'Sample address' }), SAMPLE_ADDRESS);
    }
    await enterAmount(user, dialog, '1.00');
    const submit = within(dialog).getByRole('button', { name: `Simulate ${kind}` });
    submit.focus();
    await user.keyboard('{Enter}');
    expect(within(dialog).getByText('Demo receipt')).toBeVisible();
    expect(dialog).toContainElement(document.activeElement);
    await user.tab();
    expect(dialog).toContainElement(document.activeElement);
    await user.tab({ shift: true });
    expect(dialog).toContainElement(document.activeElement);

    await user.click(within(dialog).getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('keeps input focus while editing and recovers Tab focus from outside an open dialog', async () => {
    const user = renderDashboard();
    const dialog = await openPayment(user);
    const amount = await enterAmount(user, dialog, '12.34');
    expect(amount).toHaveFocus();
    expect(amount).toHaveValue('12.34');

    // Even if an external script moves focus, the next Tab stays inside the modal.
    balanceCard().getByRole('button', { name: 'Deposit' }).focus();
    await user.tab();
    expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
  });

});
