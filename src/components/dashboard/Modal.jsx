import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children }) {
  const panel = useRef(null);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    panel.current?.querySelector('input, button:not([data-close])')?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={onClose} />
      <div
        ref={panel}
        className="relative max-h-[92vh] w-full animate-pop-in overflow-y-auto rounded-t-2xl bg-card p-6 shadow-pop sm:max-w-[420px] sm:rounded-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <button type="button" data-close className="icon-btn -mr-1" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
