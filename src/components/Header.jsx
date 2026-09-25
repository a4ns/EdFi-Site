import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Check, ChevronDown, ChevronRight, Download, Globe, LogOut, Menu, Moon, Search, Sun, X } from 'lucide-react';
import Logo from './Logo';
import Icon from './Icon';
import QRCode from './QRCode';
import CoinIcon from './CoinIcon';
import ThemeToggle from './ThemeToggle';
import { Change } from './PriceCell';
import { NAV } from '../data/content';
import { appUrl } from '../lib/links';
import { applyTheme, currentTheme } from '../lib/theme';
import { formatPrice } from '../lib/format';
import { useMarkets } from '../state/markets';
import { SIDEBAR_ITEMS } from './dashboard/nav';

// On the homepage "#earn" scrolls in place; elsewhere it must point back to "/#earn".
const resolveHref = (href, onHome) => (href.startsWith('#') && !onHome ? `/${href}` : href);

function SmartLink({ href, className, onClick, children }) {
  if (href.startsWith('/') && !href.startsWith('/#')) {
    return (
      <Link to={href} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
}

function HoverPanel({ align = 'left', children }) {
  return (
    <div
      className={`invisible absolute top-full z-50 -mt-2 opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
    >
      {children}
    </div>
  );
}

function NavItem({ item, onHome }) {
  if (!item.menu) {
    return (
      <SmartLink
        href={resolveHref(item.href, onHome)}
        className="flex h-16 items-center px-3 text-sm font-medium text-ink transition-colors hover:text-yellow-text"
      >
        {item.label}
      </SmartLink>
    );
  }
  return (
    <div className="group relative">
      <button
        type="button"
        className="flex h-16 items-center gap-0.5 px-3 text-sm font-medium text-ink transition-colors group-hover:text-yellow-text"
        aria-haspopup="true"
      >
        {item.label}
        <ChevronDown size={16} className="transition-transform duration-200 group-hover:rotate-180" />
      </button>
      <HoverPanel>
        <div className="w-[320px] rounded-xl border border-line bg-card p-2 shadow-pop">
          {item.menu.map((m) => (
            <SmartLink
              key={m.title}
              href={resolveHref(m.href, onHome)}
              className="group/item flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-raised"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-raised text-ink transition-colors group-hover/item:bg-page group-hover/item:text-yellow-text">
                <Icon name={m.icon} size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{m.title}</span>
                <span className="block truncate text-xs text-ink-3">{m.desc}</span>
              </span>
            </SmartLink>
          ))}
        </div>
      </HoverPanel>
    </div>
  );
}

const PAGES = [
  { label: 'Markets overview', href: '/#markets' },
  { label: 'Learn & Earn rewards', href: '/#earn' },
  { label: 'Campus Pay', href: '/#products' },
  { label: 'Roadmap', href: '/#roadmap' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Dashboard (demo)', href: '/demo' },
];

function SearchBox() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const box = useRef(null);
  const navigate = useNavigate();
  const { list } = useMarkets();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !box.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const term = q.trim().toLowerCase();
  const coins = term
    ? list.filter((c) => c.symbol.toLowerCase().includes(term) || c.name.toLowerCase().includes(term)).slice(0, 6)
    : [...list].sort((a, b) => b.volume - a.volume).slice(0, 6);
  const pages = term ? PAGES.filter((p) => p.label.toLowerCase().includes(term)) : [];

  const go = (href) => {
    setOpen(false);
    setQ('');
    if (href.startsWith('/#')) window.location.assign(href);
    else navigate(href);
  };

  return (
    <div ref={box} className="relative hidden lg:block">
      <button type="button" className="icon-btn w-10" aria-label="Search" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Search size={20} />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[400px] animate-pop-in rounded-xl border border-line bg-card p-4 shadow-pop">
          <div className="flex h-10 items-center gap-2 rounded-lg border border-line-strong px-3 focus-within:border-yellow">
            <Search size={16} className="text-ink-3" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search coins or pages"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
              aria-label="Search coins or pages"
            />
            {q && (
              <button type="button" onClick={() => setQ('')} className="text-ink-3 hover:text-ink" aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>
          <p className="mb-1 mt-4 text-xs text-ink-3">{term ? 'Coins' : 'Hot'}</p>
          {coins.length ? (
            <ul>
              {coins.map((c) => (
                <li key={c.symbol}>
                  <button
                    type="button"
                    onClick={() => go('/#markets')}
                    className="-mx-2 flex h-11 w-[calc(100%+16px)] items-center rounded-lg px-2 text-left transition-colors hover:bg-raised"
                  >
                    <CoinIcon symbol={c.symbol} size={20} />
                    <span className="ml-2 text-sm font-medium text-ink">{c.symbol}</span>
                    <span className="ml-1 text-xs text-ink-3">/USDT</span>
                    <span className="num ml-auto text-sm text-ink">{formatPrice(c.price)}</span>
                    <Change value={c.change} className="w-[72px] text-right text-sm" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-3 text-sm text-ink-3">No coins match &ldquo;{q}&rdquo;</p>
          )}
          {pages.length > 0 && (
            <>
              <p className="mb-1 mt-3 text-xs text-ink-3">Pages</p>
              <ul>
                {pages.map((p) => (
                  <li key={p.href}>
                    <button
                      type="button"
                      onClick={() => go(p.href)}
                      className="-mx-2 flex h-10 w-[calc(100%+16px)] items-center justify-between rounded-lg px-2 text-sm text-ink transition-colors hover:bg-raised"
                    >
                      {p.label}
                      <ChevronRight size={16} className="text-ink-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DownloadPopover() {
  return (
    <div className="group relative hidden lg:block">
      <button type="button" className="icon-btn h-16 w-10" aria-label="Download app">
        <Download size={20} />
      </button>
      <HoverPanel align="right">
        <div className="flex w-[232px] flex-col items-center rounded-xl border border-line bg-card p-6 text-center shadow-pop">
          <QRCode value={appUrl()} size={128} />
          <p className="mt-4 text-sm font-semibold text-ink">Scan to Download App</p>
          <p className="mt-1 text-xs text-ink-3">iOS and Android</p>
          <a href="/#download" className="btn btn-secondary btn-sm mt-4 w-full">More Download Options</a>
        </div>
      </HoverPanel>
    </div>
  );
}

const LANGUAGES = [
  ['English', true],
  ['Русский', false],
  ['Қазақша', false],
];

function RegionPopover() {
  return (
    <div className="group relative hidden lg:block">
      <button type="button" className="icon-btn h-16 w-10" aria-label="Language and currency">
        <Globe size={20} />
      </button>
      <HoverPanel align="right">
        <div className="w-[240px] rounded-xl border border-line bg-card p-2 shadow-pop">
          <p className="px-3 pb-1 pt-2 text-xs text-ink-3">Language</p>
          {LANGUAGES.map(([label, active]) => (
            <div key={label} className="flex h-10 items-center justify-between rounded-lg px-3 text-sm">
              <span className={active ? 'text-ink' : 'text-ink-4'}>{label}</span>
              {active ? <Check size={16} className="text-yellow-text" /> : <span className="text-xs text-ink-4">Soon</span>}
            </div>
          ))}
          <div className="mx-3 my-1 border-t border-line" />
          <p className="px-3 pb-1 pt-2 text-xs text-ink-3">Currency</p>
          <div className="flex h-10 items-center justify-between rounded-lg px-3 text-sm">
            <span className="text-ink">USD - $</span>
            <Check size={16} className="text-yellow-text" />
          </div>
          <div className="flex h-10 items-center justify-between rounded-lg px-3 text-sm">
            <span className="text-ink-4">KZT - ₸</span>
            <span className="text-xs text-ink-4">Soon</span>
          </div>
        </div>
      </HoverPanel>
    </div>
  );
}

function DrawerThemeRow() {
  const [theme, setTheme] = useState(currentTheme);
  const set = (t) => {
    applyTheme(t);
    setTheme(t);
  };
  return (
    <div className="flex h-14 items-center justify-between px-3">
      <span className="text-base font-medium text-ink">Theme</span>
      <div className="flex rounded-lg bg-card p-1">
        {[
          ['dark', Moon],
          ['light', Sun],
        ].map(([t, Ico]) => (
          <button
            key={t}
            type="button"
            onClick={() => set(t)}
            aria-pressed={theme === t}
            aria-label={`${t} theme`}
            className={`flex h-8 w-10 items-center justify-center rounded-md transition-colors ${theme === t ? 'bg-raised text-ink' : 'text-ink-3'}`}
          >
            <Ico size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}

function MobileDrawer({ open, onClose, onHome, variant, onAppNavigate }) {
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
  const row = 'flex h-14 w-full items-center rounded-lg px-3 text-left text-base font-medium text-ink transition-colors hover:bg-card';

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[400px] animate-slide-in flex-col overflow-y-auto bg-page">
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <Logo />
          <button type="button" className="icon-btn text-ink" onClick={onClose} aria-label="Close menu">
            <X size={24} />
          </button>
        </div>

        {variant === 'app' ? (
          <>
            <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl bg-card p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-raised text-sm font-semibold text-yellow-text">AK</span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-ink">Ansar Kazbekov</p>
                <p className="num text-xs text-ink-3">UID 210404 · Scholar Tier 2</p>
              </div>
            </div>
            <nav className="px-2" aria-label="Account">
              {SIDEBAR_ITEMS.map((item) => {
                const Ico = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${row} gap-3`}
                    onClick={() => {
                      onClose();
                      onAppNavigate?.(item);
                    }}
                  >
                    <Ico size={20} className="text-ink-3" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 px-4 pb-4">
              <Link to="/demo" className="btn btn-secondary btn-md" onClick={onClose}>Log In</Link>
              <Link to="/demo" className="btn btn-primary btn-md" onClick={onClose}>Sign Up</Link>
            </div>
            <nav className="px-2" aria-label="Main">
              {NAV.map((item) =>
                item.menu ? (
                  <div key={item.label}>
                    <button
                      type="button"
                      className={`${row} justify-between`}
                      onClick={() => setExpanded(expanded === item.label ? null : item.label)}
                      aria-expanded={expanded === item.label}
                    >
                      {item.label}
                      <ChevronDown size={18} className={`text-ink-3 transition-transform ${expanded === item.label ? 'rotate-180' : ''}`} />
                    </button>
                    {expanded === item.label && (
                      <div className="pb-2 pl-2">
                        {item.menu.map((m) => (
                          <SmartLink
                            key={m.title}
                            href={resolveHref(m.href, onHome)}
                            onClick={onClose}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-card"
                          >
                            <Icon name={m.icon} size={20} className="text-ink-3" />
                            <span className="text-sm text-ink">{m.title}</span>
                          </SmartLink>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <SmartLink key={item.label} href={resolveHref(item.href, onHome)} onClick={onClose} className={row}>
                    {item.label}
                  </SmartLink>
                ),
              )}
              <SmartLink href={resolveHref('#download', onHome)} onClick={onClose} className={row}>
                Download App
              </SmartLink>
            </nav>
          </>
        )}

        <div className="mt-auto border-t border-line px-2 pb-6 pt-2">
          <div className="flex h-14 items-center justify-between px-3">
            <span className="text-base font-medium text-ink">Language</span>
            <span className="text-sm text-ink-3">English</span>
          </div>
          <div className="flex h-14 items-center justify-between px-3">
            <span className="text-base font-medium text-ink">Currency</span>
            <span className="text-sm text-ink-3">USD - $</span>
          </div>
          <DrawerThemeRow />
          {variant === 'app' && (
            <Link to="/" onClick={onClose} className={`${row} gap-3 text-ink-3`}>
              <LogOut size={20} />
              Exit demo
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Header({ variant = 'site', onDeposit, onAppNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const onHome = pathname === '/';
  const isApp = variant === 'app';

  return (
    <header className="sticky top-0 z-50 h-16 w-full bg-page">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          <Link to="/" className="mr-5 flex items-center" aria-label="EdFi home">
            <Logo />
          </Link>
          <nav className="hidden items-center lg:flex" aria-label="Main">
            {NAV.map((item) => (
              <NavItem key={item.label} item={item} onHome={onHome} />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <SearchBox />
          {isApp ? (
            <>
              <button type="button" className="btn btn-primary btn-sm" onClick={onDeposit}>
                <Download size={16} className="-ml-0.5" />
                Deposit
              </button>
              <button type="button" className="icon-btn relative hidden w-10 sm:inline-flex" aria-label="Notifications, 3 unread">
                <Bell size={20} />
                <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-down" />
              </button>
              <span className="ml-1 hidden h-8 w-8 items-center justify-center rounded-full bg-raised text-xs font-semibold text-yellow-text sm:flex" aria-label="Ansar Kazbekov">
                AK
              </span>
            </>
          ) : (
            <>
              <Link to="/demo" className="btn btn-secondary btn-sm hidden sm:inline-flex">Log In</Link>
              <Link to="/demo" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
          <span className="mx-1 hidden h-4 w-px bg-line-strong lg:block" />
          <DownloadPopover />
          <RegionPopover />
          <ThemeToggle className="hidden lg:inline-flex" />
          <button type="button" className="icon-btn w-10 lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </div>
      </div>
      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onHome={onHome}
        variant={variant}
        onAppNavigate={onAppNavigate}
      />
    </header>
  );
}
