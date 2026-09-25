import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Copy, GraduationCap, History, Home, QrCode, Wallet } from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/dashboard/Sidebar';
import BalanceCard from '../components/dashboard/BalanceCard';
import TasksCard from '../components/dashboard/TasksCard';
import TransactionsCard from '../components/dashboard/TransactionsCard';
import MarketsWidget from '../components/dashboard/MarketsWidget';
import AnnouncementsCard from '../components/dashboard/AnnouncementsCard';
import ReferralCard from '../components/dashboard/ReferralCard';
import PayModal from '../components/dashboard/PayModal';
import DepositModal from '../components/dashboard/DepositModal';
import WithdrawModal from '../components/dashboard/WithdrawModal';
import Toast from '../components/dashboard/Toast';
import { INITIAL_TASKS, initialTransactions, shortAddress } from '../components/dashboard/data';
import { formatAmount } from '../lib/format';

const DAY = 24 * 3600 * 1000;

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
            <span className="-mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-yellow text-yellow-on">
              <Ico size={18} />
            </span>
          ) : (
            <Ico size={20} className={i === 0 ? 'text-yellow-text' : ''} />
          )}
          {target === 'pay' ? null : label}
        </button>
      ))}
    </nav>
  );
}

export default function DashboardApp() {
  const [sessionStart] = useState(() => Date.now());
  const [balance, setBalance] = useState(450);
  const [transactions, setTransactions] = useState(() => initialTransactions());
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [active, setActive] = useState('dashboard');

  useEffect(() => {
    document.title = 'Dashboard | EdFi';
    return () => {
      document.title = 'EdFi | Learn-to-Earn on BNB Chain';
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (text) => setToast({ id: Date.now(), text });
  const addTx = (tx) => setTransactions((ts) => [{ id: `t${Date.now()}`, at: Date.now(), ...tx }, ...ts].slice(0, 8));
  const closeModal = useCallback(() => setModal(null), []);

  const todayEarned = transactions
    .filter((t) => t.kind === 'reward' && t.at > sessionStart - DAY)
    .reduce((s, t) => s + t.amount, 0);

  const goTo = (target) => {
    if (target === 'pay') return setModal('pay');
    if (target === 'top') return window.scrollTo({ top: 0, behavior: 'smooth' });
    return document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const claim = (task) => {
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, status: 'claimed' } : t)));
    setBalance((b) => b + task.reward);
    addTx({ kind: 'reward', title: task.title, sub: 'Learn & Earn reward', amount: task.reward });
    showToast(`${formatAmount(task.reward)} EDC added to your wallet`);
  };

  const advance = (task) => {
    if (task.verify) {
      setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, progress: 1, status: 'verifying' } : t)));
      showToast('DOI submitted. Verification usually takes 1–2 days');
      return;
    }
    setTasks((ts) =>
      ts.map((t) => {
        if (t.id !== task.id) return t;
        const progress = t.progress + 1;
        return { ...t, progress, status: progress >= t.total ? 'claimable' : 'active' };
      }),
    );
    showToast(task.progress + 1 >= task.total ? 'Course completed. Your reward is ready to claim' : 'Lesson completed');
  };

  const pay = ({ merchant, amount }) => {
    setBalance((b) => b - amount);
    addTx({ kind: 'payment', title: merchant.name, sub: 'Scan Pay', amount: -amount });
  };

  const withdraw = ({ address, amount }) => {
    setBalance((b) => b - amount);
    addTx({ kind: 'withdraw', title: 'Withdraw', sub: `To ${shortAddress(address)}`, amount: -amount });
    setModal(null);
    showToast(`Withdrawal of ${formatAmount(amount)} EDC submitted`);
  };

  return (
    <div className="min-h-screen bg-page">
      <Header
        variant="app"
        onDeposit={() => setModal('deposit')}
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
            <ProfileRow onCopy={() => showToast('UID copied')} />
            <div className="mt-6 grid gap-4 lg:mt-8 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
                <BalanceCard
                  balance={balance}
                  todayEarned={todayEarned}
                  onPay={() => setModal('pay')}
                  onDeposit={() => setModal('deposit')}
                  onWithdraw={() => setModal('withdraw')}
                />
                <TasksCard tasks={tasks} onClaim={claim} onContinue={advance} />
                <TransactionsCard transactions={transactions} />
              </div>
              <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
                <MarketsWidget balance={balance} />
                <ReferralCard onCopy={() => showToast('Referral link copied')} />
                <AnnouncementsCard />
              </div>
            </div>
          </div>
        </main>
      </div>
      <MobileTabBar onSelect={goTo} />

      {modal === 'pay' && <PayModal balance={balance} onClose={closeModal} onPay={pay} />}
      {modal === 'deposit' && <DepositModal onClose={closeModal} />}
      {modal === 'withdraw' && <WithdrawModal balance={balance} onClose={closeModal} onWithdraw={withdraw} />}
      <Toast toast={toast} />
    </div>
  );
}
