export default function SummaryRow({ label, children, strong }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-3">{label}</span>
      <span className={`num ${strong ? 'font-semibold text-ink' : 'text-ink-2'}`}>{children}</span>
    </div>
  );
}
