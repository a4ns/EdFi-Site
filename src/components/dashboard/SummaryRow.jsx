export default function SummaryRow({ label, children, strong }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="shrink-0 text-ink-3">{label}</span>
      <span className={`num min-w-0 break-words text-right ${strong ? 'font-semibold text-ink' : 'text-ink-2'}`}>{children}</span>
    </div>
  );
}
