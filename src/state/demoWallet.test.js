import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoAmountInput, demoAmountPortion, parseDemoAmount } from '../lib/demoAmount';
import {
  createDemoWallet, demoWalletReducer, localDayBounds, RECENT_TRANSACTION_LIMIT, todayEarnedUnits,
} from './demoWallet';

const NOW = new Date(2026, 9, 5, 12, 0, 0).getTime();
const ADDRESS = `0x${'a'.repeat(40)}`;
const payment = (amountUnits, requestId = 'pay-1') => ({
  type: 'pay', merchantId: 'canteen', amountUnits, requestId, at: NOW,
});
const withdrawal = (amountUnits, requestId = 'withdraw-1') => ({
  type: 'withdraw', address: ADDRESS, amountUnits, requestId, at: NOW,
});
const claim = (taskId = 'week', requestId = 'claim-1') => ({
  type: 'claim', taskId, requestId, at: NOW,
});

function expectNoMoneyChange(before, after) {
  expect(after.balanceUnits).toBe(before.balanceUnits);
  expect(after.ledger).toEqual(before.ledger);
  expect(after.tasks).toEqual(before.tasks);
}

describe('demo wallet initialization', () => {
  it('stores the starting balance, ledger amounts and task rewards in integer hundredths', () => {
    const wallet = createDemoWallet(NOW);
    expect(wallet.balanceUnits).toBe(45000);
    expect(wallet.ledger.map((tx) => tx.amountUnits)).toEqual([5000, -1500, 2500, -12000, 30000, -10000]);
    expect(wallet.tasks.map((task) => task.rewardUnits)).toEqual([2500, 4000, 20000, 10000, 30000]);
    expect(wallet.ledger.every((tx) => Number.isSafeInteger(tx.amountUnits))).toBe(true);
    expect(wallet.tasks.every((task) => Number.isSafeInteger(task.rewardUnits))).toBe(true);
    expect(wallet.error).toBeNull();
  });

  it('creates independent mutable collections for each wallet', () => {
    const first = createDemoWallet(NOW);
    const second = createDemoWallet(NOW);
    first.tasks[0].status = 'claimed';
    first.ledger[0].title = 'Changed';
    expect(second.tasks[0].status).toBe('claimable');
    expect(second.ledger[0].title).toBe('Exam grade A');
  });
});

describe('exact demo debits', () => {
  it('leaves one cent after paying 449.99, then pays Max to exactly zero', () => {
    let wallet = createDemoWallet(NOW);
    wallet = demoWalletReducer(wallet, payment(parseDemoAmount('449.99')));
    expect(wallet.balanceUnits).toBe(1);
    expect(demoAmountInput(wallet.balanceUnits)).toBe('0.01');
    const max = parseDemoAmount(demoAmountInput(demoAmountPortion(wallet.balanceUnits, 100)));
    wallet = demoWalletReducer(wallet, payment(max, 'pay-max'));
    expect(wallet.balanceUnits).toBe(0);
    expect(wallet.ledger.slice(0, 2).map((tx) => tx.amountUnits)).toEqual([-1, -44999]);
    expect(wallet.error).toBeNull();
  });

  it('rejects a genuine one-cent overspend and leaves no transaction', () => {
    const initial = createDemoWallet(NOW);
    const first = demoWalletReducer(initial, payment(45001));
    expectNoMoneyChange(initial, first);
    expect(first.error).toMatchObject({ requestId: 'pay-1', message: 'Insufficient balance' });

    const lastCent = demoWalletReducer(initial, payment(44999, 'pay-almost-all'));
    const overspend = demoWalletReducer(lastCent, payment(2, 'pay-two-cents'));
    expectNoMoneyChange(lastCent, overspend);
    expect(overspend.error.message).toBe('Insufficient balance');
  });

  it('withdraws Max 1.01 after paying 448.99, without a phantom insufficient-balance error', () => {
    const afterPayment = demoWalletReducer(createDemoWallet(NOW), payment(44899));
    expect(afterPayment.balanceUnits).toBe(101);
    const max = parseDemoAmount(demoAmountInput(demoAmountPortion(afterPayment.balanceUnits, 100)));
    expect(max).toBe(101);
    const wallet = demoWalletReducer(afterPayment, withdrawal(max));
    expect(wallet.balanceUnits).toBe(0);
    expect(wallet.error).toBeNull();
    expect(wallet.ledger[0]).toMatchObject({
      id: 'withdraw-1', kind: 'withdraw', amountUnits: -101, status: 'processing', at: NOW,
    });
  });

  it('uses the latest balance when stale payment and withdrawal submissions arrive', () => {
    const wallet = demoWalletReducer(createDemoWallet(NOW), payment(30000, 'first'));
    for (const stale of [payment(20000, 'stale-pay'), withdrawal(20000, 'stale-withdraw')]) {
      const rejected = demoWalletReducer(wallet, stale);
      expectNoMoneyChange(wallet, rejected);
      expect(rejected.error.message).toBe('Insufficient balance');
    }
  });

  it('clears an earlier validation error after a valid payment', () => {
    const invalid = demoWalletReducer(createDemoWallet(NOW), payment(45001, 'invalid'));
    const valid = demoWalletReducer(invalid, payment(1, 'valid'));
    expect(valid.balanceUnits).toBe(44999);
    expect(valid.error).toBeNull();
  });
});

describe.each([
  ['payment', payment], ['withdrawal', withdrawal],
])('%s validation', (_label, actionForAmount) => {
  it.each([0, -1, -100, 0.01, 100.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, '100', null, undefined])(
    'rejects invalid integer units %j atomically', (amount) => {
      const before = createDemoWallet(NOW);
      const after = demoWalletReducer(before, actionForAmount(amount));
      expectNoMoneyChange(before, after);
      expect(after.error?.message).toBe('Enter a valid demo amount');
    },
  );
});

describe('recipient and minimum validation', () => {
  it('accepts a one-cent payment but enforces the 1 EDC withdrawal minimum', () => {
    const before = createDemoWallet(NOW);
    expect(demoWalletReducer(before, payment(1)).balanceUnits).toBe(44999);
    const belowMinimum = demoWalletReducer(before, withdrawal(99));
    expectNoMoneyChange(before, belowMinimum);
    expect(belowMinimum.error).not.toBeNull();
    expect(demoWalletReducer(before, withdrawal(100)).balanceUnits).toBe(44900);
  });

  it('rejects unknown merchants without debiting or adding a receipt', () => {
    const before = createDemoWallet(NOW);
    const after = demoWalletReducer(before, { ...payment(100), merchantId: 'not-a-merchant' });
    expectNoMoneyChange(before, after);
    expect(after.error.message).toBe('Select a demo merchant');
  });

  it('rejects malformed withdrawal addresses without debiting', () => {
    const before = createDemoWallet(NOW);
    const after = demoWalletReducer(before, { ...withdrawal(100), address: '0x123' });
    expectNoMoneyChange(before, after);
    expect(after.error.message).toBe('Enter a valid sample address');
  });
});

describe('atomic claims and request idempotency', () => {
  it('claims 25 EDC once, even with repeated or independently repeated claim requests', () => {
    const before = createDemoWallet(NOW);
    const after = demoWalletReducer(before, claim());
    expect(after.balanceUnits).toBe(47500);
    expect(after.tasks.find((task) => task.id === 'week').status).toBe('claimed');
    expect(after.ledger[0]).toMatchObject({ id: 'claim-1', kind: 'reward', amountUnits: 2500, at: NOW });
    expect(after.ledger).toHaveLength(before.ledger.length + 1);
    expect(demoWalletReducer(after, claim())).toBe(after);
    expect(demoWalletReducer(after, claim('week', 'claim-again'))).toBe(after);
    expect(before.balanceUnits).toBe(45000);
    expect(before.tasks.find((task) => task.id === 'week').status).toBe('claimable');
  });

  it.each(['course', 'gpa', 'paper', 'missing-task'])('does not claim an ineligible task %s', (taskId) => {
    const before = createDemoWallet(NOW);
    expect(demoWalletReducer(before, claim(taskId))).toBe(before);
  });

  it.each([
    ['payment', payment(101)], ['withdrawal', withdrawal(101)],
  ])('does not double-debit repeated %s submits', (_label, action) => {
    const before = createDemoWallet(NOW);
    const after = demoWalletReducer(before, action);
    expect(after.balanceUnits).toBe(44899);
    expect(after.ledger).toHaveLength(before.ledger.length + 1);
    expect(demoWalletReducer(after, action)).toBe(after);
  });

  it('does not reuse a successful request ID for a different money action', () => {
    const after = demoWalletReducer(createDemoWallet(NOW), payment(100, 'same-request'));
    expect(demoWalletReducer(after, withdrawal(200, 'same-request'))).toBe(after);
    expect(demoWalletReducer(after, claim('week', 'same-request'))).toBe(after);
  });

  it.each([
    { requestId: '' }, { requestId: undefined }, { at: NaN }, { at: Infinity }, { at: undefined },
  ])('ignores incomplete request metadata %j', (metadata) => {
    const before = createDemoWallet(NOW);
    expect(demoWalletReducer(before, { ...payment(100), ...metadata })).toBe(before);
  });

  it('does not overflow the safe-integer balance when claiming', () => {
    const before = { ...createDemoWallet(NOW), balanceUnits: Number.MAX_SAFE_INTEGER - 1 };
    expectNoMoneyChange(before, demoWalletReducer(before, claim()));
  });
});

describe('task progress and withdrawal settlement', () => {
  it('advances a course to claimable and credits only after claiming', () => {
    const before = createDemoWallet(NOW);
    const ready = demoWalletReducer(before, { type: 'advance', taskId: 'course' });
    expect(ready.tasks.find((task) => task.id === 'course')).toMatchObject({ progress: 4, total: 4, status: 'claimable' });
    expect(ready.balanceUnits).toBe(45000);
    expect(ready.ledger).toEqual(before.ledger);
    expect(demoWalletReducer(ready, { type: 'advance', taskId: 'course' })).toBe(ready);
    expect(demoWalletReducer(ready, claim('course')).balanceUnits).toBe(49000);
  });

  it('keeps a verification-required task unclaimable after submission', () => {
    const submitted = demoWalletReducer(createDemoWallet(NOW), { type: 'advance', taskId: 'paper' });
    expect(submitted.tasks.find((task) => task.id === 'paper').status).toBe('verifying');
    expect(demoWalletReducer(submitted, claim('paper'))).toBe(submitted);
    expect(demoWalletReducer(submitted, { type: 'advance', taskId: 'paper' })).toBe(submitted);
  });

  it('settles the matching withdrawal once without changing any balance or amount', () => {
    const pending = demoWalletReducer(createDemoWallet(NOW), withdrawal(101));
    const completed = demoWalletReducer(pending, { type: 'settle', id: 'withdraw-1' });
    expect(completed.balanceUnits).toBe(44899);
    expect(completed.ledger[0]).toEqual({ ...pending.ledger[0], status: 'completed' });
    expect(completed.ledger.slice(1)).toEqual(pending.ledger.slice(1));
    expect(demoWalletReducer(completed, { type: 'settle', id: 'withdraw-1' })).toEqual(completed);
    expect(demoWalletReducer(completed, { type: 'settle', id: 'missing-id' })).toEqual(completed);
    expect(demoWalletReducer(completed, withdrawal(101))).toBe(completed);
  });
});

describe('full-ledger earnings', () => {
  it('keeps today’s earnings after eight payments have displaced all rewards from the recent list', () => {
    let wallet = createDemoWallet(NOW);
    expect(todayEarnedUnits(wallet.ledger, NOW)).toBe(5000);
    for (let index = 0; index < 8; index += 1) {
      wallet = demoWalletReducer(wallet, payment(1, `payment-${index}`));
    }
    expect(wallet.ledger).toHaveLength(14);
    expect(wallet.ledger.slice(0, RECENT_TRANSACTION_LIMIT).every((tx) => tx.kind === 'payment')).toBe(true);
    expect(todayEarnedUnits(wallet.ledger, NOW)).toBe(5000);
  });

  it('retains a claimed 25 EDC reward and its duplicate guard after many later transactions', () => {
    let wallet = demoWalletReducer(createDemoWallet(NOW), claim());
    for (let index = 0; index < 12; index += 1) {
      wallet = demoWalletReducer(wallet, payment(1, `later-payment-${index}`));
    }
    expect(wallet.ledger).toHaveLength(19);
    expect(todayEarnedUnits(wallet.ledger, NOW)).toBe(7500);
    expect(wallet.ledger.find((tx) => tx.id === 'claim-1')?.amountUnits).toBe(2500);
    expect(demoWalletReducer(wallet, payment(100, 'claim-1'))).toBe(wallet);
  });
});

describe('device-local calendar-day earnings', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('includes midnight and excludes both the preceding instant and next midnight', () => {
    const now = new Date(2026, 9, 5, 12).getTime();
    const start = new Date(2026, 9, 5).getTime();
    const end = new Date(2026, 9, 6).getTime();
    expect(localDayBounds(now)).toEqual({ start, end });
    const ledger = [
      { kind: 'reward', amountUnits: 100, at: start - 1 },
      { kind: 'reward', amountUnits: 200, at: start },
      { kind: 'reward', amountUnits: 300, at: end - 1 },
      { kind: 'reward', amountUnits: 400, at: end },
      { kind: 'payment', amountUnits: -100, at: now },
      { kind: 'withdraw', amountUnits: -100, at: now },
    ];
    expect(todayEarnedUnits(ledger, now)).toBe(500);
    expect(todayEarnedUnits([], now)).toBe(0);
  });

  it('rolls earnings to zero at the next local midnight without deleting historical rewards', () => {
    const beforeMidnight = new Date(2026, 9, 5, 23, 59, 59, 999).getTime();
    const ledger = [{ kind: 'reward', amountUnits: 2500, at: beforeMidnight }];
    expect(todayEarnedUnits(ledger, beforeMidnight)).toBe(2500);
    expect(todayEarnedUnits(ledger, beforeMidnight + 1)).toBe(0);
    expect(ledger).toHaveLength(1);
  });

  it('uses a non-UTC device’s local date even when the UTC date differs', () => {
    vi.stubEnv('TZ', 'Asia/Almaty');
    const now = Date.parse('2026-10-04T20:30:00Z');
    expect(new Date(now).getTimezoneOffset()).toBe(-300);
    expect(localDayBounds(now)).toEqual({
      start: Date.parse('2026-10-04T19:00:00Z'), end: Date.parse('2026-10-05T19:00:00Z'),
    });
    expect(todayEarnedUnits([
      { kind: 'reward', amountUnits: 2500, at: Date.parse('2026-10-04T20:00:00Z') },
      { kind: 'reward', amountUnits: 5000, at: Date.parse('2026-10-04T18:59:59Z') },
    ], now)).toBe(2500);
  });

  it.each([
    ['spring-forward', '2026-03-08T16:00:00Z', '2026-03-08T05:00:00Z', '2026-03-09T04:00:00Z', 23],
    ['fall-back', '2026-11-01T17:00:00Z', '2026-11-01T04:00:00Z', '2026-11-02T05:00:00Z', 25],
  ])('uses calendar midnights across the %s DST day', (_label, at, startAt, endAt, hours) => {
    vi.stubEnv('TZ', 'America/New_York');
    const now = Date.parse(at);
    const bounds = localDayBounds(now);
    expect(bounds).toEqual({ start: Date.parse(startAt), end: Date.parse(endAt) });
    expect(bounds.end - bounds.start).toBe(hours * 60 * 60 * 1000);
    expect(todayEarnedUnits([
      { kind: 'reward', amountUnits: 100, at: bounds.start - 1 },
      { kind: 'reward', amountUnits: 2500, at: bounds.start },
      { kind: 'reward', amountUnits: 5000, at: bounds.end - 1 },
      { kind: 'reward', amountUnits: 200, at: bounds.end },
    ], now)).toBe(7500);
  });
});
