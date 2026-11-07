import { useId } from 'react';
import { useLocale } from '../state/locale';
import { LANGUAGE_OPTIONS } from '../lib/locale';

export default function LanguageSwitcher({ className = '', selectClassName = '', variant = 'select' }) {
  const id = useId();
  const { locale, setLocale, t } = useLocale();
  if (variant === 'inline') {
    // Segmented control that matches the footer theme switch.
    return (
      <div role="group" aria-label={t('Language')} className={`flex rounded-lg bg-card p-1 ${className}`}>
        {LANGUAGE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            lang={value}
            aria-pressed={locale === value}
            onClick={() => setLocale(value)}
            className={`h-7 rounded-md px-2.5 text-xs font-medium transition-colors ${locale === value ? 'bg-raised text-ink' : 'text-ink-3 hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="block text-sm text-ink-2">{t('Language')}</label>
      <select
        id={id}
        name="language"
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        className={`input mt-2 !h-10 !py-0 ${selectClassName}`}
      >
        {LANGUAGE_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value} lang={value}>{label}</option>
        ))}
      </select>
    </div>
  );
}
