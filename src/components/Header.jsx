import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Download, Menu, Search, X } from 'lucide-react';
import Logo from './Logo';
import Icon from './Icon';
import QRCode from './QRCode';
import { NAV } from '../data/content';
import { appUrl } from '../lib/links';

function NavLink({ item, onHome }) {
  const href = onHome ? item.href : `/${item.href}`;
  if (!item.menu) {
    return (
      <a href={href} className="flex h-16 items-center px-3 text-sm font-medium text-ink transition-colors hover:text-yellow">
        {item.label}
      </a>
    );
  }
  return (
    <div className="group relative">
      <button
        type="button"
        className="flex h-16 items-center gap-0.5 px-3 text-sm font-medium text-ink transition-colors group-hover:text-yellow"
        aria-haspopup="true"
      >
        {item.label}
        <ChevronDown size={16} className="transition-transform duration-200 group-hover:rotate-180" />
      </button>
      <div className="invisible absolute left-0 top-full z-50 -mt-2 opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="w-[320px] rounded-xl border border-line bg-card p-2 shadow-pop">
          {item.menu.map((m) => (
            <a
              key={m.title}
              href={onHome ? m.href : `/${m.href}`}
              className="group/item flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-raised"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-raised text-ink transition-colors group-hover/item:bg-page group-hover/item:text-yellow">
                <Icon name={m.icon} size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{m.title}</span>
                <span className="block truncate text-xs text-ink-3">{m.desc}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function DownloadPopover() {
  return (
    <div className="group relative hidden lg:block">
      <button type="button" className="icon-btn h-16 w-10" aria-label="Download app">
        <Download size={20} />
      </button>
      <div className="invisible absolute right-0 top-full z-50 -mt-2 opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="flex w-[232px] flex-col items-center rounded-xl border border-line bg-card p-6 text-center shadow-pop">
          <QRCode value={appUrl()} size={128} />
          <p className="mt-4 text-sm font-semibold text-ink">Scan to Download App</p>
          <p className="mt-1 text-xs text-ink-3">iOS and Android</p>
          <a href="#download" className="btn btn-secondary btn-sm mt-4 w-full">More Download Options</a>
        </div>
      </div>
    </div>
  );
}

function MobileDrawer({ open, onClose, onHome }) {
  const [expanded, setExpanded] = useState(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col overflow-y-auto bg-page animate-slide-in">
        <div className="flex h-16 shrink-0 items-center justify-end px-4">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close menu">
            <X size={24} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          <Link to="/demo" className="btn btn-secondary btn-md" onClick={onClose}>Log In</Link>
          <Link to="/demo" className="btn btn-primary btn-md" onClick={onClose}>Sign Up</Link>
        </div>
        <nav className="px-2 pb-8">
          {NAV.map((item) =>
            item.menu ? (
              <div key={item.label}>
                <button
                  type="button"
                  className="flex h-14 w-full items-center justify-between rounded-lg px-3 text-base font-medium text-ink"
                  onClick={() => setExpanded(expanded === item.label ? null : item.label)}
                  aria-expanded={expanded === item.label}
                >
                  {item.label}
                  <ChevronDown size={18} className={`text-ink-3 transition-transform ${expanded === item.label ? 'rotate-180' : ''}`} />
                </button>
                {expanded === item.label && (
                  <div className="pb-2 pl-2">
                    {item.menu.map((m) => (
                      <a
                        key={m.title}
                        href={onHome ? m.href : `/${m.href}`}
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-card"
                      >
                        <Icon name={m.icon} size={20} className="text-ink-3" />
                        <span className="text-sm text-ink">{m.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <a
                key={item.label}
                href={onHome ? item.href : `/${item.href}`}
                onClick={onClose}
                className="flex h-14 items-center rounded-lg px-3 text-base font-medium text-ink hover:bg-card"
              >
                {item.label}
              </a>
            ),
          )}
          <a
            href={onHome ? '#download' : '/#download'}
            onClick={onClose}
            className="flex h-14 items-center gap-2 rounded-lg px-3 text-base font-medium text-ink hover:bg-card"
          >
            Download App
          </a>
        </nav>
      </div>
    </div>
  );
}

export default function Header({ variant = 'home', onDeposit }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const onHome = variant === 'home';

  return (
    <header className="sticky top-0 z-50 h-16 w-full bg-page">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          <Link to="/" className="mr-5 flex items-center" aria-label="EdFi home">
            <Logo />
          </Link>
          <nav className="hidden items-center lg:flex" aria-label="Main">
            {NAV.map((item) => (
              <NavLink key={item.label} item={item} onHome={onHome} />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {onHome ? (
            <>
              <button type="button" className="icon-btn hidden w-10 lg:inline-flex" aria-label="Search" onClick={() => navigate('/demo')}>
                <Search size={20} />
              </button>
              <Link to="/demo" className="btn btn-secondary btn-sm hidden sm:inline-flex">Log In</Link>
              <Link to="/demo" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-primary btn-sm" onClick={onDeposit}>
                <Download size={16} className="-ml-0.5" />
                Deposit
              </button>
              <button type="button" className="icon-btn relative hidden w-10 sm:inline-flex" aria-label="Notifications, 3 unread">
                <Bell size={20} />
                <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-down" />
              </button>
              <span className="ml-1 hidden h-8 w-8 items-center justify-center rounded-full bg-raised text-xs font-semibold text-yellow sm:flex" aria-label="Ansar Kazbekov">
                AK
              </span>
            </>
          )}
          <DownloadPopover />
          <button type="button" className="icon-btn w-10 lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </div>
      </div>
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} onHome={onHome} />
    </header>
  );
}
