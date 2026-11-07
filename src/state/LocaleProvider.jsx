import { useCallback, useEffect, useMemo, useState } from 'react';
import { LocaleContext } from './locale';
import { translate } from '../i18n/messages';
import { isLocale, LOCALE_STORAGE_KEY, readLocale, saveLocale } from '../lib/locale';

export default function LocaleProvider({ children }) {
  const [locale, updateLocale] = useState(readLocale);
  const setLocale = useCallback((next) => {
    if (isLocale(next)) updateLocale(next);
  }, []);
  const t = useCallback((key, values) => translate(locale, key, values), [locale]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  useEffect(() => {
    document.documentElement.lang = locale;
    saveLocale(locale);
  }, [locale]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === LOCALE_STORAGE_KEY || event.key === null) {
        if (event.newValue === null) updateLocale('en');
        else if (isLocale(event.newValue)) updateLocale(event.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
