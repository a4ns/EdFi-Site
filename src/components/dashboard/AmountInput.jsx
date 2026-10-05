import { useLocale } from '../../state/locale';
import { demoAmountInput, demoAmountPortion, formatDemoAmount } from '../../lib/demoAmount';
import { formatPercent } from '../../lib/format';

export default function AmountInput({ id, value, onChange, maxUnits, invalid }) {
  const { locale, t } = useLocale();
  return (
    <>
    <div
      className={`flex h-12 items-center rounded-lg border px-4 transition-colors focus-within:border-yellow hover:border-yellow ${
        invalid ? '!border-down' : 'border-line-strong'
      }`}
    >
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        className="num min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
        placeholder={formatDemoAmount(0, locale)}
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(e) => {
          const v = e.target.value.replace(',', '.');
          if (/^\d*\.?\d{0,2}$/.test(v)) onChange(v);
        }}
      />
      <span className="text-sm font-medium text-ink">EDC</span>
      <span className="mx-3 h-4 w-px bg-line-strong" />
      <button type="button" className="text-sm font-medium text-yellow-text hover:text-yellow-hover" onClick={() => onChange(demoAmountInput(maxUnits))}>
        {t('Max')}
      </button>
    </div>
    <div className="mt-2 grid grid-cols-4 gap-2">
      {[25, 50, 75, 100].map((pct) => (
        <button
          key={pct}
          type="button"
          onClick={() => onChange(demoAmountInput(demoAmountPortion(maxUnits, pct)))}
          className="num h-7 rounded bg-raised text-xs font-medium text-ink-2 transition-colors hover:text-ink"
        >
          {formatPercent(pct, 0, locale)}
        </button>
      ))}
    </div>
    </>
  );
}
