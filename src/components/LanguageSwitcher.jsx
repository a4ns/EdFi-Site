import { useId } from 'react';
import { useLocale } from '../state/locale';
import { LANGUAGE_OPTIONS } from '../lib/locale';

export default function LanguageSwitcher({ className = '', selectClassName = '' }) {
  const id = useId();
  const { locale, setLocale, t } = useLocale();
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
