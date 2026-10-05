import { createContext, useContext } from 'react';
import { translate } from '../i18n/messages';

export const LocaleContext = createContext({ locale: 'en', setLocale: () => {}, t: (key, values) => translate('en', key, values) });
export const useLocale = () => useContext(LocaleContext);
