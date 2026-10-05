import { messages as common } from './common';
import { messages as site } from './site';
import { messages as dashboard } from './dashboard';
import { messages as dialogs } from './dialogs';
import { messages as chrome } from './chrome';
import { messages as markets } from './markets';
import { messages as navigation } from './navigation';
import { messages as coinDetails } from './coinDetails';
import { messages as demoActions } from './demoActions';
import { isLocale, LOCALES, localeTag } from '../lib/locale';

// English source messages are stable keys. Data and ledger records keep these
// keys, so changing language never rewrites financial state or sample data.
export const messageGroups = { common, site, dashboard, dialogs, chrome, markets, navigation, coinDetails, demoActions };
export const messages = Object.assign({}, ...Object.values(messageGroups));
export const dictionaries = Object.fromEntries(LOCALES.map((locale) => [locale,
  Object.fromEntries(Object.entries(messages).map(([key, entry]) => [key, locale === 'en' ? entry.en ?? key : entry[locale]])),
]));

export function translate(locale, key, values = {}) {
  const language = isLocale(locale) ? locale : 'en';
  let message = Object.hasOwn(dictionaries[language], key) ? dictionaries[language][key] : key;
  if (message && typeof message === 'object') {
    const category = new Intl.PluralRules(localeTag(language)).select(Number(values.count));
    message = message[category] ?? message.other;
  }
  if (typeof message !== 'string') return '';
  return message.replace(/\{(\w+)\}/g, (placeholder, name) => {
    if (!Object.hasOwn(values, name)) return placeholder;
    return typeof values[name] === 'number'
      ? new Intl.NumberFormat(localeTag(language)).format(values[name])
      : String(values[name]);
  });
}
