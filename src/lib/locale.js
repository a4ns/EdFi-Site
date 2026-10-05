export const LOCALES = ['en', 'ru', 'kk'];
export const LOCALE_TAGS = { en: 'en-US', ru: 'ru-RU', kk: 'kk-KZ' };
export const LOCALE_STORAGE_KEY = 'edfi.locale';

export const isLocale = (locale) => LOCALES.includes(locale);
export const localeTag = (locale = 'en') => LOCALE_TAGS[locale] ?? LOCALE_TAGS.en;

// An explicit English default keeps the first visit predictable. Only the
// display preference is stored; wallet balances and form data stay in memory.
export function readLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(saved) ? saved : 'en';
  } catch {
    return 'en';
  }
}

export function saveLocale(locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Private browsing or blocked storage must not prevent a language change.
  }
}
