import { useLocale } from '../../state/locale';
import { useState } from 'react';
import { Bell, ChevronRight, Copy, LogOut, Settings, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NOTIFICATIONS } from './data';
import { useDisclosure } from '../../state/useDisclosure';

export function NotificationsMenu() {
  const { t } = useLocale();
  const { open, containerRef, triggerRef, panelId, toggle } = useDisclosure();
  const [unread, setUnread] = useState(NOTIFICATIONS.length);
  return (
    <div ref={containerRef} className="sm:relative">
      <button
        ref={triggerRef}
        type="button"
        className="icon-btn relative w-10"
        aria-label={unread ? t('Notifications, {count} unread', { count: unread }) : t('Notifications')}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggle}
      >
        <Bell size={20} />
        {unread > 0 && <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-down" />}
      </button>
      {open && (
        <div id={panelId} className="fixed inset-x-4 top-[68px] z-50 animate-pop-in sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[360px] rounded-xl border border-line bg-card shadow-pop">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-base font-semibold text-ink">{t('Notifications')}</h2>
            <button type="button" onClick={() => setUnread(0)} disabled={!unread} className="text-xs font-medium text-yellow-text disabled:text-ink-4">
              {t('Mark all as read')}
            </button>
          </div>
          <ul className="max-h-[360px] overflow-y-auto border-t border-line">
            {NOTIFICATIONS.map((n, i) => (
              <li key={n.id} className="flex gap-3 border-b border-line px-4 py-3 last:border-0">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${i < unread ? 'bg-yellow' : 'bg-transparent'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{t(n.title)}</p>
                  <p className="mt-0.5 text-xs leading-5 text-ink-3">{t(n.text)}</p>
                  <p className="mt-1 text-xs text-ink-3">{t(n.ago)}</p>
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
  const { t } = useLocale();
  const { open, containerRef, triggerRef, panelId, close, toggle } = useDisclosure();
  const item = 'flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-ink transition-colors hover:bg-raised';
  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={t('Account menu')}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-raised text-xs font-semibold text-yellow-text transition-colors hover:bg-line-strong"
      >
        AK
      </button>
      {open && (
        <div id={panelId} className="absolute right-0 top-12 z-50 w-[280px] animate-pop-in rounded-xl border border-line bg-card p-2 shadow-pop">
          <div className="px-3 pb-3 pt-2">
            <p className="text-base font-semibold text-ink">Ansar Kazbekov</p>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
              <span className="num">UID 210404</span>
              <button
                type="button"
                onClick={() => {
                  close(true);
                  onCopyUid?.();
                }}
                className="hover:text-yellow-text"
                aria-label={t('Copy UID')}
              >
                <Copy size={12} />
              </button>
              <span className="text-ink-4">·</span>
              <span>{t('Scholar Tier 2')}</span>
            </p>
          </div>
          <div className="border-t border-line pt-2">
            <button
              type="button"
              className={item}
              onClick={() => {
                close(true);
                onAccount?.();
              }}
            >
              <User size={18} className="text-ink-3" />
              {t('Account')}
              <ChevronRight size={16} className="ml-auto text-ink-4" />
            </button>
            <button
              type="button"
              className={item}
              onClick={() => {
                close(true);
                onSettings?.();
              }}
            >
              <Settings size={18} className="text-ink-3" />
              {t('Settings')}
              <ChevronRight size={16} className="ml-auto text-ink-4" />
            </button>
            <Link to="/" className={item} onClick={() => close(true)}>
              <LogOut size={18} className="text-ink-3" />
              {t('Log Out')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
