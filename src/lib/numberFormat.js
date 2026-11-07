import { localeTag } from './locale';

const KAZAKH_COMPACT = { K: 'мың', M: 'млн', B: 'млрд', T: 'трлн' };
const KAZAKH_CURRENCY = { USD: '$', KZT: '₸' };

export function numberFormatter(locale = 'en', options = {}) {
  if (locale !== 'kk') return new Intl.NumberFormat(localeTag(locale), options);

  // Browsers can advertise Kazakh while using English number patterns. Keep
  // Intl's rounding, compact scaling and exact BigInt support, but supply the
  // Kazakh separators and labels ourselves so partial ICU data cannot leak.
  const formatter = new Intl.NumberFormat('en-US', options);
  const formatToParts = (value) => {
    let currency;
    const parts = formatter.formatToParts(value).flatMap((part) => {
      if (part.type === 'currency') {
        currency = { ...part, value: KAZAKH_CURRENCY[options.currency] ?? part.value };
        return [];
      }
      // en-US inserts a space after alphabetic currency symbols; Kazakh puts
      // every currency after the number with one nonbreaking space instead.
      if (part.type === 'literal' && options.style === 'currency') return [];
      if (part.type === 'group') return { ...part, value: '\u00a0' };
      if (part.type === 'decimal') return { ...part, value: ',' };
      if (part.type === 'compact') return [
        { type: 'literal', value: '\u00a0' },
        { ...part, value: KAZAKH_COMPACT[part.value] ?? part.value },
      ];
      return part;
    });
    if (currency) parts.push({ type: 'literal', value: '\u00a0' }, currency);
    return parts;
  };
  return {
    format: (value) => formatToParts(value).map((part) => part.value).join(''),
    formatToParts,
  };
}
