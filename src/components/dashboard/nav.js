import { AccountNavIcon, AssetsNavIcon, DashboardNavIcon, EarnNavIcon, HistoryNavIcon, PayNavIcon, ReferralNavIcon, SettingsNavIcon } from '../NavIcons';

// Account navigation shared by the desktop sidebar and the mobile app drawer.
export const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardNavIcon, target: 'top' },
  { id: 'assets', label: 'Assets', icon: AssetsNavIcon, target: 'balance' },
  { id: 'earn', label: 'Learn & Earn', icon: EarnNavIcon, target: 'tasks' },
  { id: 'pay', label: 'Campus Pay', icon: PayNavIcon, action: 'pay' },
  { id: 'history', label: 'History', icon: HistoryNavIcon, target: 'history' },
  { id: 'referral', label: 'Referral', icon: ReferralNavIcon, target: 'referral' },
  { id: 'account', label: 'Account', icon: AccountNavIcon, action: 'account' },
  { id: 'settings', label: 'Settings', icon: SettingsNavIcon, action: 'settings' },
];
