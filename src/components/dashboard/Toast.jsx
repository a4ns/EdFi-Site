import { CircleCheck } from 'lucide-react';

export default function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[55] flex justify-center px-4" role="status" aria-live="polite">
      <div key={toast.id} className="flex animate-pop-in items-center gap-2 rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink shadow-pop">
        <CircleCheck size={16} className="shrink-0 text-up" />
        {toast.text}
      </div>
    </div>
  );
}
