import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatChartDate, formatDate, formatDateTime } from './format';

const NativeDateTimeFormat = Intl.DateTimeFormat;
const receiptOptions = {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
};

describe.each(['unsupported', 'partial'])('Kazakh local dates with %s locale data', (support) => {
  beforeEach(() => {
    vi.stubEnv('TZ', 'UTC');
    const mock = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function (locale, options) {
      if (locale !== 'kk-KZ') return new NativeDateTimeFormat(locale, options);
      // Unsupported engines negotiate English; partial data can still claim
      // Kazakh while supplying a different locale's date patterns.
      const formatter = new NativeDateTimeFormat(support === 'partial' ? 'en-CA' : 'en-US', options);
      return {
        format: formatter.format,
        resolvedOptions: () => ({ ...formatter.resolvedOptions(), locale: support === 'partial' ? 'kk-KZ' : 'en-US' }),
      };
    });
    mock.supportedLocalesOf = (locales) => NativeDateTimeFormat.supportedLocalesOf(locales)
      .filter((locale) => support === 'partial' || !locale.startsWith('kk'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('reproduces incorrect patterns even when the engine reports Kazakh support', () => {
    const date = new Date(2026, 0, 2, 3, 4, 5);
    const formatter = new Intl.DateTimeFormat('kk-KZ', receiptOptions);
    expect(formatter.format(date)).toBe(support === 'partial' ? '2026-01-02, 03:04:05' : '01/02/2026, 03:04:05');
    expect(formatter.resolvedOptions().locale).toBe(support === 'partial' ? 'kk-KZ' : 'en-US');
    expect(Intl.DateTimeFormat.supportedLocalesOf(['kk-KZ'])).toEqual(support === 'partial' ? ['kk-KZ'] : []);
  });

  it.each([
    ['2026-01-02T03:04:05Z', '02.01.2026, 03:04:05'],
    ['2026-09-30T23:59:59Z', '30.09.2026, 23:59:59'],
    ['2026-10-01T00:00:00Z', '01.10.2026, 00:00:00'],
    ['2026-12-31T23:59:59Z', '31.12.2026, 23:59:59'],
    ['2027-01-01T00:00:00Z', '01.01.2027, 00:00:00'],
    ['2028-02-29T12:30:01Z', '29.02.2028, 12:30:01'],
  ])('formats receipts, history, tooltip and chart dates consistently at %s', (instant, expected) => {
    const date = new Date(instant);
    expect(formatDateTime(date, 'kk')).toBe(expected);
    expect(formatDateTime(date.getTime(), 'kk')).toBe(expected);
    expect(formatDate(date, 'kk')).toBe(expected.slice(0, 10));
    expect(formatDate(date.getTime(), 'kk', {})).toBe(expected.slice(0, 10));
    expect(formatChartDate(date, 'kk')).toBe(expected.slice(0, 5));
    expect(date.toISOString()).toBe(new Date(instant).toISOString());
    expect(Intl.DateTimeFormat).not.toHaveBeenCalled();
  });

  it.each([
    ['Asia/Almaty', '2026-09-30T19:00:00Z', '01.10.2026, 00:00:00', -300],
    ['Asia/Almaty', '2026-12-31T19:00:00Z', '01.01.2027, 00:00:00', -300],
    ['America/New_York', '2027-01-01T04:59:59Z', '31.12.2026, 23:59:59', 300],
    ['America/New_York', '2026-03-08T06:59:59Z', '08.03.2026, 01:59:59', 300],
    ['America/New_York', '2026-03-08T07:00:00Z', '08.03.2026, 03:00:00', 240],
    ['America/New_York', '2026-11-01T05:59:59Z', '01.11.2026, 01:59:59', 240],
    ['America/New_York', '2026-11-01T06:00:00Z', '01.11.2026, 01:00:00', 300],
  ])('uses device-local time in %s at %s', (zone, instant, expected, offset) => {
    vi.stubEnv('TZ', zone);
    const date = new Date(instant);
    expect(date.getTimezoneOffset()).toBe(offset);
    expect(formatDateTime(date, 'kk')).toBe(expected);
    expect(formatDateTime(date.getTime(), 'kk')).toBe(expected);
    expect(formatDate(date, 'kk')).toBe(expected.slice(0, 10));
    expect(formatChartDate(date, 'kk')).toBe(expected.slice(0, 5));
  });

  it.each([['en', 'en-US'], ['ru', 'ru-RU']])('preserves every current Intl option shape in %s', (locale, tag) => {
    const date = new Date(2026, 0, 2, 3, 4, 5);
    const chartOptions = { month: 'short', day: 'numeric' };
    expect(formatDate(date, locale)).toBe(new NativeDateTimeFormat(tag).format(date));
    expect(formatDate(date, locale, chartOptions)).toBe(new NativeDateTimeFormat(tag, chartOptions).format(date));
    expect(formatChartDate(date, locale)).toBe(new NativeDateTimeFormat(tag, chartOptions).format(date));
    expect(formatDateTime(date, locale)).toBe(new NativeDateTimeFormat(tag, receiptOptions).format(date));
    expect(formatDateTime(date.getTime(), locale)).toBe(new NativeDateTimeFormat(tag, receiptOptions).format(date));
  });

  it('keeps the English default and invalid-date errors', () => {
    const date = new Date(2026, 0, 2, 3, 4, 5);
    expect(formatDate(date)).toBe('1/2/2026');
    expect(formatDateTime(date)).toBe('01/02/2026, 03:04:05');
    expect(() => formatDate(new Date(NaN), 'kk')).toThrow(RangeError);
    expect(() => formatDateTime(NaN, 'kk')).toThrow(RangeError);
  });
});
