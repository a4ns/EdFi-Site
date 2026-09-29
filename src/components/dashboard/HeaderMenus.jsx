import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronRight, Copy, LogOut, Settings, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NOTIFICATIONS } from './data';

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

export function NotificationsMenu() {
  const { open, setOpen, ref } = usePopover();
  const [unread, setUnread] = useState(NOTIFICATIONS.length);
  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        className="icon-btn relative w-10"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={20} />
        {unread > 0 && <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-down" />}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] animate-pop-in rounded-xl border border-line bg-card shadow-pop">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-base font-semibold text-ink">Notifications</h2>
            <button type="button" onClick={() => setUnread(0)} disabled={!unread} className="text-xs font-medium text-yellow-text disabled:text-ink-4">
              Mark all as read
            </button>
          </div>
          <ul className="max-h-[360px] overflow-y-auto border-t border-line">
            {NOTIFICATIONS.map((n, i) => (
              <li key={n.id} className="flex gap-3 border-b border-line px-4 py-3 last:border-0">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${i < unread ? 'bg-yellow' : 'bg-transparent'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-ink-3">{n.text}</p>
                  <p className="mt-1 text-xs text-ink-4">{n.ago}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AccountMenu({ onAccount, onSettings, onCopyUid }) {
  const { open, setOpen, ref } = usePopover();
  const item = 'flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-ink transition-colors hover:bg-raised';
  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Account menu"
        className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-raised text-xs font-semibold text-yellow-text transition-colors hover:bg-line-strong"
      >
        AK
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[280px] animate-pop-in rounded-xl border border-line bg-card p-2 shadow-pop">
          <div className="px-3 pb-3 pt-2">
            <p className="text-base font-semibold text-ink">Ansar Kazbekov</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-3">
              <span className="num">UID 210404</span>
              <button
                type="button"
                onClick={() => {
                  onCopyUid();
                  setOpen(false);
                }}
                className="hover:text-yellow-text"
                aria-label="Copy UID"
              >
                <Copy size={12} />
              </button>
              <span className="text-ink-4">·</span>
              <span>Scholar Tier 2</span>
            </p>
          </div>
          <div className="border-t border-line pt-2">
            <button
              type="button"
              className={item}
              onClick={() => {
                setOpen(false);
                onAccount();
              }}
            >
              <User size={18} className="text-ink-3" />
              Account
              <ChevronRight size={16} className="ml-auto text-ink-4" />
            </button>
            <button
              type="button"
              className={item}
              onClick={() => {
                setOpen(false);
                onSettings();
              }}
            >
              <Settings size={18} className="text-ink-3" />
              Settings
              <ChevronRight size={16} className="ml-auto text-ink-4" />
            </button>
            <Link to="/" className={item}>
              <LogOut size={18} className="text-ink-3" />
              Log Out
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
