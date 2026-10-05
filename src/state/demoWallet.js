import { INITIAL_TASKS, MERCHANTS, initialTransactions, shortAddress } from '../components/dashboard/data';
import { isDemoAddress } from '../lib/demoAmount';

export const RECENT_TRANSACTION_LIMIT = 8;
export const DEMO_SETTLEMENT_MS = 4000;

export function createDemoWallet(now) {
  return {
    balanceUnits: 45000,
    ledger: initialTransactions(now),
    tasks: INITIAL_TASKS.map((task) => ({ ...task })),
    error: null,
  };
}

function reject(state, action, message) {
  return { ...state, error: { requestId: action.requestId, message } };
}

function record(state, action, transaction) {
  return {
    ...state,
    balanceUnits: state.balanceUnits + transaction.amountUnits,
    ledger: [{ id: action.requestId, at: action.at, status: 'completed', ...transaction }, ...state.ledger],
    error: null,
  };
}

// All balance, ledger and reward changes are atomic, including repeated/stale submissions.
export function demoWalletReducer(state, action) {
  if (action.type === 'settle') {
    return {
      ...state,
      ledger: state.ledger.map((tx) => tx.id === action.id && tx.kind === 'withdraw' && tx.status === 'processing'
        ? { ...tx, status: 'completed' } : tx),
    };
  }

  if (action.type === 'advance') {
    const task = state.tasks.find((item) => item.id === action.taskId);
    if (!task || task.status !== 'active') return state;
    const progress = Math.min(task.progress + 1, task.total);
    return {
      ...state,
      tasks: state.tasks.map((item) => item.id === task.id
        ? { ...item, progress, status: task.verify ? 'verifying' : progress >= task.total ? 'claimable' : 'active' }
        : item),
    };
  }

  if (!['claim', 'pay', 'withdraw'].includes(action.type)) return state;
  if (!action.requestId || !Number.isFinite(action.at)) return state;
  if (state.ledger.some((tx) => tx.id === action.requestId)) return state;

  if (action.type === 'claim') {
    const task = state.tasks.find((item) => item.id === action.taskId);
    if (!task || task.status !== 'claimable') return state;
    if (!Number.isSafeInteger(state.balanceUnits + task.rewardUnits)) return state;
    const next = record(state, action, {
      kind: 'reward', title: task.title, sub: 'Demo Learn & Earn reward', amountUnits: task.rewardUnits,
    });
    return { ...next, tasks: next.tasks.map((item) => item.id === task.id ? { ...item, status: 'claimed' } : item) };
  }

  const minimum = action.type === 'withdraw' ? 100 : 1;
  if (!Number.isSafeInteger(action.amountUnits) || action.amountUnits < minimum) {
    return reject(state, action, 'Enter a valid demo amount');
  }
  if (action.amountUnits > state.balanceUnits) return reject(state, action, 'Insufficient balance');

  if (action.type === 'pay') {
    const merchant = MERCHANTS.find((item) => item.id === action.merchantId);
    if (!merchant) return reject(state, action, 'Select a demo merchant');
    return record(state, action, {
      kind: 'payment', title: merchant.name, sub: 'Demo Scan Pay', amountUnits: -action.amountUnits,
    });
  }

  if (!isDemoAddress(action.address)) return reject(state, action, 'Enter a valid sample address');
  return record(state, action, {
    kind: 'withdraw', title: 'Demo withdrawal', sub: `Sample recipient ${shortAddress(action.address.trim())}`,
    subKey: 'Sample recipient {address}', subParams: { address: shortAddress(action.address.trim()) },
    amountUnits: -action.amountUnits, status: 'processing',
  });
}

export function localDayBounds(now) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.getTime(), end: end.getTime() };
}

export function todayEarnedUnits(ledger, now) {
  const { start, end } = localDayBounds(now);
  return ledger.reduce((total, tx) => tx.kind === 'reward' && tx.at >= start && tx.at < end
    ? total + tx.amountUnits : total, 0);
}
