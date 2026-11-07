import { useLocale } from '../../state/locale';

export default function SummaryRow({ label, children, strong }) {
  const { t } = useLocale();
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="min-w-0 flex-1 text-ink-3">{t(label)}</span>
      <span className={`num min-w-0 flex-1 break-words text-right ${strong ? 'font-semibold text-ink' : 'text-ink-2'}`}>{children}</span>
    </div>
  );
}
