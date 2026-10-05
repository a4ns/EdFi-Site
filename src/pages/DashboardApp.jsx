import { useCallback, useEffect, useReducer, useState } from 'react';
import { BadgeCheck, Copy, GraduationCap, History, Home, QrCode, Wallet } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/dashboard/Sidebar';
import BalanceCard from '../components/dashboard/BalanceCard';
import TasksCard from '../components/dashboard/TasksCard';
import TransactionsCard from '../components/dashboard/TransactionsCard';
import MarketsWidget from '../components/dashboard/MarketsWidget';
import AnnouncementsCard from '../components/dashboard/AnnouncementsCard';
import ReferralCard from '../components/dashboard/ReferralCard';
import AccountModal from '../components/dashboard/AccountModal';
import PayModal from '../components/dashboard/PayModal';
import DepositModal from '../components/dashboard/DepositModal';
import WithdrawModal from '../components/dashboard/WithdrawModal';
import Toast from '../components/dashboard/Toast';
import DemoNotice from '../components/dashboard/DemoNotice';
import { formatDemoAmount } from '../lib/demoAmount';
import { createDemoWallet, demoWalletReducer, DEMO_SETTLEMENT_MS, RECENT_TRANSACTION_LIMIT, todayEarnedUnits } from '../state/demoWallet';
import { useLocalDay } from '../state/useLocalDay';

function ProfileRow({ onCopy }) {
  const stats = [
    ['UID', <span key="uid" className="inline-flex items-center gap-1">210404 <button type="button" onClick={onCopy} className="text-ink-3 hover:text-yellow-text" aria-label="Copy UID"><Copy size={14} /></button></span>],
    ['Earn Rate', '1.4x'],
    ['Attendance', '98%'],
    ['GPA', '3.72'],
  ];
  return (
    <section className="flex flex-col gap-5 md:flex-row md:items-center md:gap-6">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-raised text-lg font-semibold text-yellow-text">AK</span>
        <div>
          <h1 className="text-xl font-semibold text-ink md:text-2xl">Ansar Kazbekov</h1>
          <p className="text-sm text-ink-3">Kozybayev University</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <span className="chip bg-yellow/10 text-yellow-text">Scholar Tier 2</span>
            <span className="chip bg-up/10 text-up">
              <BadgeCheck size={12} />
              Verified
            </span>
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-4 gap-x-4 md:ml-auto md:flex md:gap-10">
        {stats.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-ink-3">{k}</dt>
            <dd className="num mt-1 truncate text-sm font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function MobileTabBar({ onSelect }) {
  const items = [
    ['Home', Home, 'top'],
    ['Earn', GraduationCap, 'tasks'],
    ['Pay', QrCode, 'pay'],
    ['History', History, 'history'],
    ['Assets', Wallet, 'balance'],
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-page pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="App">
      {items.map(([label, Ico, target], i) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelect(target)}
          className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${i === 0 ? 'text-ink' : 'text-ink-3'}`}
        >
          {target === 'pay' ? (
            <span className="-mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-yellow text-yellow-on">
              <Ico size={18} />
            </span>
          ) : (
            <Ico size={20} className={i === 0 ? 'text-yellow-text' : ''} />
          )}
          {label}
        </button>
      ))}
    </nav>
  );
}

export default function DashboardApp() {
  const [wallet, dispatch] = useReducer(demoWalletReducer, undefined, () => createDemoWallet(Date.now()));
  const { balanceUnits, ledger, tasks } = wallet;
  const day = useLocalDay();
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [active, setActive] = useState('dashboard');
  const navigate = useNavigate();
  const { hash } = useLocation();

  useEffect(() => {
    document.title = 'Dashboard | EdFi';
    return () => {
      document.title = 'EdFi | Learn-to-Earn on BNB Chain';
    };
  }, []);

  // Deep links such as /demo#tasks from the marketing site.
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    return () => clearTimeout(t);
  }, [hash]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (text) => setToast({ id: Date.now(), text });
  const closeModal = useCallback(() => setModal(null), []);
  const openModal = (name) => {
    setToast(null);
    setModal({ name, requestId: `demo-${crypto.randomUUID()}` });
  };

  const earnedUnits = todayEarnedUnits(ledger, day);
  const transaction = modal ? ledger.find((tx) => tx.id === modal.requestId) : null;
  const error = wallet.error?.requestId === modal?.requestId ? wallet.error?.message : null;

  useEffect(() => {
    const timers = ledger.filter((tx) => tx.kind === 'withdraw' && tx.status === 'processing').map((tx) =>
      setTimeout(() => dispatch({ type: 'settle', id: tx.id }), Math.max(0, tx.at + DEMO_SETTLEMENT_MS - Date.now())),
    );
    return () => timers.forEach(clearTimeout);
  }, [ledger]);

  const goTo = (target) => {
    if (target === 'pay' || target === 'account' || target === 'settings') return openModal(target);
    if (target === 'top') return window.scrollTo({ top: 0, behavior: 'smooth' });
    return document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const claim = (task) => {
    if (task.status !== 'claimable') return;
    dispatch({ type: 'claim', taskId: task.id, requestId: `demo-reward-${task.id}`, at: Date.now() });
    showToast(`${formatDemoAmount(task.rewardUnits)} demo EDC added to your sample balance`);
  };

  const advance = (task) => {
    if (task.status !== 'active') return;
    dispatch({ type: 'advance', taskId: task.id });
    showToast(task.verify
      ? 'Demo verification started. No DOI or registrar request was sent'
      : task.progress + 1 >= task.total ? 'Demo goal reached. Your sample reward is ready to claim' : (task.doneText ?? 'Demo lesson completed'));
  };

  const pay = ({ merchantId, amountUnits }) => {
    dispatch({ type: 'pay', merchantId, amountUnits, requestId: modal.requestId, at: Date.now() });
  };

  const withdraw = ({ address, amountUnits }) => {
    dispatch({ type: 'withdraw', address, amountUnits, requestId: modal.requestId, at: Date.now() });
  };

  return (
    <div className="min-h-screen bg-page">
      <Header
        variant="app"
        onDeposit={() => openModal('deposit')}
        onCopyUid={() => showToast('UID copied')}
        onAppNavigate={(item) => {
          setActive(item.id);
          goTo(item.action ?? item.target);
        }}
      />
      <div className="flex border-t border-line">
        <Sidebar
          active={active}
          onSelect={(item) => {
            setActive(item.id);
            goTo(item.action ?? item.target);
          }}
        />
        <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <div className="mx-auto max-w-[1200px]">
            <DemoNotice kind="overview" className="mb-6" />
            <ProfileRow onCopy={() => showToast('UID copied')} />
            <div className="mt-6 grid gap-4 lg:mt-8 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <BalanceCard
                balanceUnits={balanceUnits}
                earnedUnits={earnedUnits}
                onPay={() => openModal('pay')}
                onDeposit={() => openModal('deposit')}
                onWithdraw={() => openModal('withdraw')}
              />
              <div className="flex min-w-0 max-xl:order-2 [&>section]:min-w-0 [&>section]:flex-1">
                <MarketsWidget balance={balanceUnits / 100} />
              </div>
              <div className="flex min-w-0 max-xl:order-1 [&>section]:min-w-0 [&>section]:flex-1">
                <TasksCard tasks={tasks} onClaim={claim} onContinue={advance} />
              </div>
              <div className="flex min-w-0 flex-col gap-4 max-xl:order-3 lg:gap-6">
                <ReferralCard onCopy={() => showToast('Referral link copied')} />
                <AnnouncementsCard />
              </div>
            </div>
            <div className="mt-4 lg:mt-6">
              <TransactionsCard transactions={ledger.slice(0, RECENT_TRANSACTION_LIMIT)} />
            </div>
          </div>
        </main>
      </div>
      <MobileTabBar onSelect={goTo} />

      {modal?.name === 'pay' && (
        <PayModal
          balanceUnits={balanceUnits}
          transaction={transaction}
          error={error}
          onClose={closeModal}
          onPay={pay}
          onViewHistory={() => {
            setModal(null);
            goTo('history');
          }}
        />
      )}
      {modal?.name === 'deposit' && <DepositModal onClose={closeModal} />}
      {(modal?.name === 'account' || modal?.name === 'settings') && (
        <AccountModal mode={modal.name} onClose={closeModal} onLogout={() => navigate('/')} />
      )}
      {modal?.name === 'withdraw' && <WithdrawModal balanceUnits={balanceUnits} transaction={transaction} error={error} onClose={closeModal} onWithdraw={withdraw} />}
      <Toast toast={toast} />
    </div>
  );
}
