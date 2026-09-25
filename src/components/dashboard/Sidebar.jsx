import { Link } from 'react-router-dom';
import { Gift, GraduationCap, History, LayoutDashboard, LogOut, QrCode, Settings, User, UserPlus, Wallet } from 'lucide-react';

const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, target: 'top' },
  { id: 'assets', label: 'Assets', icon: Wallet, target: 'balance' },
  { id: 'earn', label: 'Learn & Earn', icon: GraduationCap, target: 'tasks' },
  { id: 'pay', label: 'Campus Pay', icon: QrCode, action: 'pay' },
  { id: 'history', label: 'History', icon: History, target: 'history' },
  { id: 'rewards', label: 'Rewards Hub', icon: Gift, target: 'tasks' },
  { id: 'referral', label: 'Referral', icon: UserPlus, target: 'top' },
  { id: 'account', label: 'Account', icon: User, target: 'top' },
  { id: 'settings', label: 'Settings', icon: Settings, target: 'top' },
];

export default function Sidebar({ active, onSelect }) {
  return (
    <div className="hidden w-[240px] shrink-0 border-r border-line lg:block">
      <aside className="sticky top-16 flex h-[calc(100vh-64px)] flex-col overflow-y-auto px-3 py-4">
        <nav className="flex flex-col gap-1" aria-label="Account">
          {SIDEBAR_ITEMS.map((item) => {
            const { id, label, icon: Ico } = item;
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(item)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-12 items-center gap-3 rounded-lg px-4 text-left text-sm font-medium transition-colors ${
                  isActive ? 'bg-card text-ink' : 'text-ink-3 hover:bg-card hover:text-ink'
                }`}
              >
                <Ico size={20} className={isActive ? 'text-ink' : ''} />
                {label}
              </button>
            );
          })}
        </nav>
        <Link
          to="/"
          className="mt-auto flex h-12 items-center gap-3 rounded-lg px-4 text-sm font-medium text-ink-3 transition-colors hover:bg-card hover:text-ink"
        >
          <LogOut size={20} />
          Exit demo
        </Link>
      </aside>
    </div>
  );
}
