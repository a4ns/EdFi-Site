import { useLocale } from '../../state/locale';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children }) {
  const { t } = useLocale();
  const panel = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab' || !panel.current) return undefined;
      const items = [...panel.current.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')];
      if (!items.length) return undefined;
      const first = items[0];
      const last = items[items.length - 1];
      if (!panel.current.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      return undefined;
    };
    window.addEventListener('keydown', onKey);
    const focusInside = () => {
      if (!panel.current || panel.current.contains(document.activeElement)) return;
      // Focus a button on touch devices so opening a sheet does not summon the keyboard.
      const selector = window.matchMedia('(min-width: 640px) and (hover: hover)').matches
        ? 'input:not([disabled]), select:not([disabled]), button:not([data-close]):not([disabled])' : 'button[data-close]';
      (panel.current.querySelector(selector) ?? panel.current.querySelector('button'))?.focus();
    };
    focusInside();
    // Scan -> form -> receipt can remove the focused control without remounting Modal.
    const observer = new MutationObserver(focusInside);
    observer.observe(panel.current, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={onClose} />
      <div
        ref={panel}
        className="relative max-h-[90dvh] w-full animate-pop-in overflow-y-auto rounded-t-2xl bg-card p-6 shadow-pop sm:max-w-[420px] sm:rounded-2xl"
      >
        <span className="mx-auto -mt-2 mb-4 block h-1 w-9 rounded-full bg-line-strong sm:hidden" aria-hidden="true" />
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <button type="button" data-close className="icon-btn -mr-1 shrink-0" onClick={onClose} aria-label={t('Close')}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
