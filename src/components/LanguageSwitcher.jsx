import { useId } from 'react';
import { useLocale } from '../state/locale';

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
        <option value="en" lang="en">English</option>
        <option value="ru" lang="ru">Русский</option>
        <option value="kk" lang="kk">Қазақша</option>
      </select>
    </div>
  );
}
