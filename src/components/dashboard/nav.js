import { GraduationCap, History, LayoutDashboard, QrCode, Settings, User, UserPlus, Wallet } from 'lucide-react';

// Account navigation shared by the desktop sidebar and the mobile app drawer.
export const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, target: 'top' },
  { id: 'assets', label: 'Assets', icon: Wallet, target: 'balance' },
  { id: 'earn', label: 'Learn & Earn', icon: GraduationCap, target: 'tasks' },
  { id: 'pay', label: 'Campus Pay', icon: QrCode, action: 'pay' },
  { id: 'history', label: 'History', icon: History, target: 'history' },
  { id: 'referral', label: 'Referral', icon: UserPlus, target: 'referral' },
  { id: 'account', label: 'Account', icon: User, action: 'account' },
  { id: 'settings', label: 'Settings', icon: Settings, action: 'settings' },
];
