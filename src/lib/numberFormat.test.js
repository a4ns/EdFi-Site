import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dictionaries, translate } from '../i18n/messages';
import { formatDemoAmount } from './demoAmount';
import {
  formatAmount, formatChange, formatCompact, formatCurrency, formatInt,
  formatPercent, formatPrice, formatUsd,
} from './format';
import { numberFormatter } from './numberFormat';

const NativeNumberFormat = Intl.NumberFormat;

describe.each(['unsupported', 'partial'])('Kazakh numbers with %s locale data', (support) => {
  beforeEach(() => {
    const mock = vi.spyOn(Intl, 'NumberFormat').mockImplementation(function (locale, options = {}) {
      if (locale !== 'kk-KZ') return new NativeNumberFormat(locale, options);
      // Model both silent locale negotiation to English and a browser that
      // advertises kk-KZ but only has Kazakh ordinary decimal patterns.
      const hasPatterns = support === 'partial' && !options.style && !options.notation;
      const formatter = new NativeNumberFormat(hasPatterns ? 'kk-KZ' : 'en-US', options);
      return {
        format: formatter.format,
        formatToParts: formatter.formatToParts.bind(formatter),
        resolvedOptions: () => ({ ...formatter.resolvedOptions(), locale: support === 'partial' ? 'kk-KZ' : 'en-US' }),
      };
    });
    mock.supportedLocalesOf = (locales) => NativeNumberFormat.supportedLocalesOf(locales)
      .filter((locale) => support === 'partial' || !locale.startsWith('kk'));
  });

  afterEach(() => vi.restoreAllMocks());

  it('reproduces the runtime failure even when the locale reports support', () => {
    const formatter = new Intl.NumberFormat('kk-KZ', { style: 'currency', currency: 'USD' });
    expect(formatter.format(85532)).toBe('$85,532.00');
    expect(formatter.resolvedOptions().locale).toBe(support === 'partial' ? 'kk-KZ' : 'en-US');
    expect(Intl.NumberFormat.supportedLocalesOf(['kk-KZ'])).toEqual(support === 'partial' ? ['kk-KZ'] : []);
    expect(new Intl.NumberFormat('kk-KZ').format(6000)).toBe(support === 'partial' ? '6\u00a0000' : '6,000');
  });

  it('uses Kazakh grouping and decimals with the original price precision', () => {
    expect(formatInt(6000, 'kk')).toBe('6\u00a0000');
    expect(formatInt(1234.5, 'kk')).toBe('1\u00a0235');
    expect(formatAmount(85532, 2, 'kk')).toBe('85\u00a0532,00');
    expect(formatAmount(-1234.5, 2, 'kk')).toBe('-1\u00a0234,50');
    expect(formatPrice(0.012345, 'kk')).toBe('0,01235');
    expect(formatPrice(null, 'kk')).toBe('--');
  });

  it('puts USD and KZT after the number with the requested precision', () => {
    expect(formatUsd(85532, 'kk')).toBe('85\u00a0532,00\u00a0$');
    expect(formatUsd(0.012345, 'kk')).toBe('0,01235\u00a0$');
    expect(formatCurrency(-6247.8, 'USD', 'kk')).toBe('-6\u00a0247,80\u00a0$');
    expect(formatCurrency(6247.8, 'KZT', 'kk')).toBe('6\u00a0247,80\u00a0₸');
    expect(formatCurrency(6247.8, 'KZT', 'kk', 0)).toBe('6\u00a0248\u00a0₸');
  });

  it('preserves the percent sign, sign display and decimal precision', () => {
    expect(formatPercent(98, 0, 'kk')).toBe('98%');
    expect(formatPercent(98.125, 2, 'kk')).toBe('98,13%');
    expect(formatChange(1.234, 'kk')).toBe('+1,23%');
    expect(formatChange(-1.234, 'kk')).toBe('-1,23%');
    expect(formatChange(0, 'kk')).toBe('+0,00%');
  });

  it.each([
    [0, '0,00'], [999, '999,00'], [1000, '1,00\u00a0мың'],
    [12345, '12,35\u00a0мың'], [-12345, '-12,35\u00a0мың'],
    [999994, '999,99\u00a0мың'], [999995, '1,00\u00a0млн'],
    [1250000, '1,25\u00a0млн'], [1250000000, '1,25\u00a0млрд'],
    [1250000000000, '1,25\u00a0трлн'], [1e15, '1000,00\u00a0трлн'],
  ])('formats compact %s as %s without English or Russian suffixes', (value, expected) => {
    expect(formatCompact(value, 'kk')).toBe(expected);
  });

  it('retains every integer hundredth, including the largest safe positive and negative balances', () => {
    expect(formatDemoAmount(1, 'kk')).toBe('0,01');
    expect(formatDemoAmount(-1, 'kk')).toBe('-0,01');
    expect(formatDemoAmount(600001, 'kk')).toBe('6\u00a0000,01');
    expect(formatDemoAmount(Number.MAX_SAFE_INTEGER, 'kk')).toBe('90\u00a0071\u00a0992\u00a0547\u00a0409,91');
    expect(formatDemoAmount(-Number.MAX_SAFE_INTEGER, 'kk')).toBe('-90\u00a0071\u00a0992\u00a0547\u00a0409,91');
    expect(formatDemoAmount(Number.MAX_SAFE_INTEGER - 1, 'kk')).toBe('90\u00a0071\u00a0992\u00a0547\u00a0409,90');
  });

  it('formats numeric placeholders without changing source messages, values or plural selection', () => {
    const key = 'Last {count} days';
    const source = dictionaries.kk[key];
    const values = Object.freeze({ count: 6000 });
    expect(translate('kk', key, values)).toBe('Соңғы 6\u00a0000 күн');
    expect(translate('kk', key, { count: 1 })).toBe('Соңғы 1 күн');
    expect(translate('kk', '{value}', { value: 1234.5678 })).toBe('1\u00a0234,568');
    expect(translate('kk', '{value}', { value: '1234.5678' })).toBe('1234.5678');
    expect(dictionaries.kk[key]).toBe(source);
    expect(values.count).toBe(6000);
  });

  it.each([['en', 'en-US'], ['ru', 'ru-RU']])('preserves %s numeric and plural formatting', (locale, tag) => {
    expect(formatAmount(1234.5, 2, locale)).toBe(new NativeNumberFormat(tag, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(1234.5));
    expect(formatCurrency(6247.8, 'KZT', locale)).toBe(new NativeNumberFormat(tag, { style: 'currency', currency: 'KZT' }).format(6247.8));
    expect(formatCompact(12345, locale)).toBe(new NativeNumberFormat(tag, { notation: 'compact', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(12345));
    expect(translate('ru', '{count} ready to claim', { count: 21 })).toBe('21 награда доступна');
    expect(translate('en', 'Last {count} days', { count: 1 })).toBe('Last 1 day');
    expect(translate('en', 'Last {count} days', { count: 2 })).toBe('Last 2 days');
  });

  it('keeps English for the default and unknown locale', () => {
    expect(numberFormatter().format(1234.5)).toBe('1,234.5');
    expect(numberFormatter('unknown').format(1234.5)).toBe('1,234.5');
    expect(formatUsd(85532)).toBe('$85,532.00');
    expect(translate('unknown', '{value}', { value: 1234.5 })).toBe('1,234.5');
  });
});
