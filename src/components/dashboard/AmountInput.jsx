export default function AmountInput({ id, value, onChange, max, invalid }) {
  return (
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
        placeholder="0.00"
        value={value}
        onChange={(e) => {
          const v = e.target.value.replace(',', '.');
          if (/^\d*\.?\d{0,2}$/.test(v)) onChange(v);
        }}
      />
      <span className="text-sm font-medium text-ink">EDC</span>
      <span className="mx-3 h-4 w-px bg-line-strong" />
      <button type="button" className="text-sm font-medium text-yellow hover:text-yellow-hover" onClick={() => onChange(max.toFixed(2))}>
        Max
      </button>
    </div>
  );
}
