import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { BadgeCheck, Copy } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { HomeNavIcon, EarnNavIcon, PayNavIcon, HistoryNavIcon, AssetsNavIcon } from '../components/NavIcons';
import { preferredScrollBehavior } from '../lib/navigation';
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
import CopyFallbackModal from '../components/dashboard/CopyFallbackModal';
import { createDemoWallet, demoWalletReducer, DEMO_SETTLEMENT_MS, RECENT_TRANSACTION_LIMIT, todayEarnedUnits } from '../state/demoWallet';
import { useLocalDay } from '../state/useLocalDay';
import { useLocale } from '../state/locale';
import { formatAmount, formatInt, formatPercent } from '../lib/format';
import { copyText } from '../lib/clipboard';

const DEMO_UID = '210404';
const TARGET_IDS = { top: 'dashboard', balance: 'assets', tasks: 'earn', pay: 'pay', withdraw: 'assets', history: 'history', referral: 'referral', account: 'account', settings: 'settings' };
const ROUTE_DIALOGS = ['pay', 'withdraw'];

function ProfileRow({ onCopy }) {
  const { locale, t } = useLocale();
  const stats = [
    ['UID', <span key="uid" className="inline-flex items-center gap-1">{DEMO_UID} <button type="button" onClick={onCopy} className="text-ink-3 hover:text-yellow-text" aria-label={t('Copy UID')}><Copy size={14} /></button></span>],
    ['Earn Rate', `${formatAmount(1.4, 1, locale)}×`],
    ['Attendance', formatPercent(98, 0, locale)],
    ['GPA', formatAmount(3.72, 2, locale)],
  ];
  return (
    <section className="flex flex-col gap-5 xl:flex-row xl:items-center xl:gap-6">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-raised text-lg font-semibold text-yellow-text">AK</span>
        <div>
          <h1 className="text-xl font-semibold text-ink md:text-2xl">Ansar Kazbekov</h1>
          <p className="text-sm text-ink-3">{t('Kozybayev University')}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <span className="chip bg-yellow/10 text-yellow-text">{t('Scholar Tier {level}', { level: formatInt(2, locale) })}</span>
            <span className="chip bg-up/10 text-up">
              <BadgeCheck size={12} />
              {t('Sample profile')}
            </span>
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 xl:ml-auto xl:flex xl:gap-10">
        {stats.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-ink-3">{t(k)}</dt>
            <dd className="num mt-1 truncate text-sm font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function MobileTabBar({ active, onSelect }) {
  const { t } = useLocale();
  const items = [
    ['Home', HomeNavIcon, 'top'],
    ['Earn', EarnNavIcon, 'tasks'],
    ['Pay', PayNavIcon, 'pay'],
    ['History', HistoryNavIcon, 'history'],
    ['Assets', AssetsNavIcon, 'balance'],
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-page pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label={t('App')}>
      {items.map(([label, Ico, target]) => (
        <button
          key={label}
          type="button"
          onClick={() => onSelect(target)}
          aria-current={active === TARGET_IDS[target] ? 'page' : undefined}
          className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${active === TARGET_IDS[target] ? 'text-ink' : 'text-ink-3'}`}
        >
          {target === 'pay' ? (
            <span className="-mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-yellow text-yellow-on">
              <Ico size={18} />
            </span>
          ) : (
            <Ico size={20} className={active === TARGET_IDS[target] ? 'text-yellow-text' : ''} />
          )}
          {t(label)}
        </button>
      ))}
    </nav>
  );
}

export default function DashboardApp() {
  const { t } = useLocale();
  const [wallet, dispatch] = useReducer(demoWalletReducer, undefined, () => createDemoWallet(Date.now()));
  const { balanceUnits, ledger, tasks } = wallet;
  const day = useLocalDay();
  const [modalOverride, setModalOverride] = useState(null);
  const [toast, setToast] = useState(null);
  const [selection, setSelection] = useState(null);
  const copyRequest = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { hash, key: locationKey } = location;
  const [renderedLocationKey, setRenderedLocationKey] = useState(locationKey);
  // Transient dialogs and menu selection belong only to the current visit.
  // Discard them even when Back returns to a previously visited history entry.
  if (renderedLocationKey !== locationKey) {
    setRenderedLocationKey(locationKey);
    setModalOverride(null);
    setSelection(null);
  }
  const target = hash.slice(1);
  // Route intent is derived immediately. Back/Forward cannot revive a delayed
  // modal timer or replay a request that is already in this session's ledger.
  const routeModal = ROUTE_DIALOGS.includes(target) ? { name: target, requestId: `demo-route-${locationKey}` } : null;
  const modal = modalOverride?.locationKey === locationKey ? modalOverride.value : routeModal;
  const active = selection?.locationKey === locationKey ? selection.id : TARGET_IDS[target] ?? 'dashboard';

  useEffect(() => () => { copyRequest.current += 1; }, [locationKey]);

  useEffect(() => {
    document.title = t('Dashboard | EdFi');
    return () => {
      document.title = t('EdFi | Learn-to-Earn on BNB Chain');
    };
  }, [t]);

  // Deep links such as /demo#tasks from the marketing site.
  useEffect(() => {
    if (!hash || ROUTE_DIALOGS.includes(hash.slice(1))) return;
    const id = hash.slice(1);
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: preferredScrollBehavior(), block: 'start' }), 150);
    return () => clearTimeout(t);
  }, [hash]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (text, amountUnits) => setToast({ id: Date.now(), text, amountUnits });
  const closeModal = useCallback(() => {
    copyRequest.current += 1;
    setModalOverride({ locationKey, value: null });
    if (ROUTE_DIALOGS.includes(hash.slice(1))) navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true });
  }, [hash, location.pathname, location.search, locationKey, navigate]);
  const openModal = (name) => {
    copyRequest.current += 1;
    setToast(null);
    setModalOverride({ locationKey, value: { name, requestId: `demo-${crypto.randomUUID()}` } });
  };

  const copy = async (value, label, successText) => {
    const request = ++copyRequest.current;
    setToast(null);
    const copied = await copyText(value);
    // Ignore a delayed result after navigation, another copy, or a newer dialog.
    if (request !== copyRequest.current) return;
    if (copied) showToast(successText);
    else setModalOverride({ locationKey, value: { name: 'copy', label, value } });
  };
  const copyUid = () => copy(DEMO_UID, 'UID', 'UID copied');

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
    copyRequest.current += 1;
    if (target === 'account' || target === 'settings') {
      setSelection({ locationKey, id: TARGET_IDS[target] });
      return openModal(target);
    }
    setModalOverride({ locationKey, value: null });
    navigate({ pathname: location.pathname, search: location.search, hash: target === 'top' ? '' : `#${target}` });
    if (target === 'top') window.scrollTo({ top: 0, behavior: preferredScrollBehavior() });
  };

  const claim = (task) => {
    if (task.status !== 'claimable') return;
    dispatch({ type: 'claim', taskId: task.id, requestId: `demo-reward-${task.id}`, at: Date.now() });
    showToast('{amount} demo EDC added to your sample balance', task.rewardUnits);
  };

  const advance = (task) => {
    if (task.status !== 'active') return;
    dispatch({ type: 'advance', taskId: task.id });
    showToast(task.verify
      ? 'Demo verification started. No DOI or registrar request was sent'
      : task.progress + 1 >= task.total ? 'Demo goal reached. Your sample reward is ready to claim' : (task.doneText ?? 'Demo lesson completed'));
  };

  const verify = (task) => {
    if (task.status !== 'verifying' || !task.verify || task.progress !== task.total) return;
    dispatch({ type: 'verify', taskId: task.id });
    showToast('Demo verification complete. Your sample reward is ready to claim');
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
        onCopyUid={copyUid}
        onAppNavigate={(item) => goTo(item.action ?? item.target)}
      />
      <div className="flex border-t border-line">
        <Sidebar
          active={active}
          onSelect={(item) => goTo(item.action ?? item.target)}
        />
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-6 lg:px-8 lg:pb-12 lg:pt-8 scroll-mt-16 focus:outline-none">
          <div className="mx-auto max-w-[1200px]">
            <DemoNotice kind="overview" className="mb-6" />
            <ProfileRow onCopy={copyUid} />
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
                <TasksCard tasks={tasks} onClaim={claim} onContinue={advance} onVerify={verify} />
              </div>
              <div className="flex min-w-0 flex-col gap-4 max-xl:order-3 lg:gap-6">
                <ReferralCard onCopy={(value) => copy(value, 'Referral link', 'Referral link copied')} />
                <AnnouncementsCard />
              </div>
            </div>
            <div className="mt-4 lg:mt-6">
              <TransactionsCard transactions={ledger.slice(0, RECENT_TRANSACTION_LIMIT)} />
            </div>
          </div>
        </main>
      </div>
      <MobileTabBar active={active} onSelect={goTo} />

      {modal?.name === 'pay' && (
        <PayModal
          key={modal.requestId}
          balanceUnits={balanceUnits}
          transaction={transaction}
          error={error}
          onClose={closeModal}
          onPay={pay}
          onViewHistory={() => goTo('history')}
        />
      )}
      {modal?.name === 'deposit' && <DepositModal onClose={closeModal} />}
      {modal?.name === 'copy' && <CopyFallbackModal label={modal.label} value={modal.value} onClose={closeModal} />}
      {(modal?.name === 'account' || modal?.name === 'settings') && (
        <AccountModal mode={modal.name} onClose={closeModal} onLogout={() => navigate('/')} />
      )}
      {modal?.name === 'withdraw' && <WithdrawModal key={modal.requestId} balanceUnits={balanceUnits} transaction={transaction} error={error} onClose={closeModal} onWithdraw={withdraw} />}
      <Toast toast={toast} />
    </div>
  );
}
