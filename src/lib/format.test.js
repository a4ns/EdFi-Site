import { describe, expect, it, vi } from 'vitest';
import {
  formatAmount, formatChange, formatChartDate, formatCompact, formatCurrency, formatDate, formatDateTime, formatInt, formatPercent, formatPrice, formatUsd,
} from './format';

describe('market formatting', () => {
  it.each([
    [1234.5, '1,234.50'], [1000, '1,000.00'], [10, '10.00'], [1, '1.0000'],
    [0.1, '0.1000'], [0.012345, '0.01235'], [0, '0.00000'],
    [null, '--'], [undefined, '--'], [NaN, '--'],
  ])('formats price %j as %s', (value, expected) => {
    expect(formatPrice(value)).toBe(expected);
  });

  it('adds the USD currency prefix', () => {
    expect(formatUsd(1234.5)).toBe('$1,234.50');
  });

  it.each([
    [1.234, '+1.23%'], [-1.234, '-1.23%'], [0, '+0.00%'],
    [null, '--'], [undefined, '--'], [NaN, '--'],
  ])('formats change %j as %s', (value, expected) => {
    expect(formatChange(value)).toBe(expected);
  });

  it('formats amounts with grouping and the requested precision', () => {
    expect(formatAmount(1234.5)).toBe('1,234.50');
    expect(formatAmount(-0.01)).toBe('-0.01');
    expect(formatAmount(1.2345, 3)).toBe('1.235');
    expect(formatAmount(0)).toBe('0.00');
    expect(formatInt(1234.5)).toBe('1,235');
  });

  it.each([
    [0, '0.00'], [999, '999.00'], [1000, '1.00K'], [12345, '12.35K'],
    [1000000, '1.00M'], [1250000000, '1.25B'],
  ])('formats compact value %i as %s', (value, expected) => {
    expect(formatCompact(value)).toBe(expected);
  });
});

describe('formatDateTime', () => {
  it('uses localized local-calendar dates with unambiguous 24-hour time', () => {
    expect(formatDateTime(new Date(2026, 0, 2, 3, 4, 5))).toBe('01/02/2026, 03:04:05');
    expect(formatDateTime(new Date(2026, 0, 2, 3, 4, 5), 'ru')).toBe('02.01.2026, 03:04:05');
    expect(formatDateTime(new Date(2026, 0, 2, 3, 4, 5), 'kk')).toBe('02.01.2026, 03:04:05');
  });
});

describe('formatChartDate', () => {
  it.each([
    [new Date(2026, 8, 6, 12), '06.09'],
    [new Date(2026, 8, 21, 12), '21.09'],
    [new Date(2026, 9, 5, 12), '05.10'],
    [new Date(2026, 8, 30, 23, 59), '30.09'],
    [new Date(2026, 9, 1, 0, 1), '01.10'],
    [new Date(2027, 0, 1, 0, 1), '01.01'],
    [new Date(2028, 1, 29, 23, 59), '29.02'],
  ])('formats the local Kazakh date %s as %s', (date, expected) => {
    expect(formatChartDate(date, 'kk')).toBe(expected);
  });

  it('does not depend on Intl month-name support for Kazakh axis labels', () => {
    const dateFormatter = vi.spyOn(Intl, 'DateTimeFormat');
    try {
      expect(formatChartDate(new Date(2026, 8, 6), 'kk')).toBe('06.09');
      expect(dateFormatter).not.toHaveBeenCalled();
    } finally {
      dateFormatter.mockRestore();
    }
  });

  it.each(['en', 'ru'])('preserves the existing short-month format for %s', (locale) => {
    const date = new Date(2026, 9, 1, 0, 1);
    expect(formatChartDate(date, locale)).toBe(formatDate(date, locale, { month: 'short', day: 'numeric' }));
  });

  it('keeps English as the default', () => {
    expect(formatChartDate(new Date(2026, 9, 5, 12))).toBe('Oct 5');
  });
});

describe.each([['en', 'en-US'], ['ru', 'ru-RU'], ['kk', 'kk-KZ']])('Intl formatting in %s', (locale, tag) => {
  it('formats grouping, decimals, percentages and currencies using the locale', () => {
    expect(formatAmount(1234.5, 2, locale)).toBe(new Intl.NumberFormat(tag, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(1234.5));
    expect(formatInt(6000, locale)).toBe(new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }).format(6000));
    expect(formatPercent(98, 0, locale)).toBe(new Intl.NumberFormat(tag, { style: 'percent' }).format(0.98));
    expect(formatCurrency(6247.8, 'KZT', locale)).toBe(new Intl.NumberFormat(tag, { style: 'currency', currency: 'KZT', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(6247.8));
    expect(formatUsd(1234.5, locale)).toBe(new Intl.NumberFormat(tag, { style: 'currency', currency: 'USD' }).format(1234.5));
    expect(formatCompact(12345, locale)).toBe(new Intl.NumberFormat(tag, { notation: 'compact', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(12345));
  });

  it('uses locale-aware dates and preserves small-price precision', () => {
    const date = new Date(2026, 9, 5, 12);
    expect(formatDate(date, locale, { month: 'short', day: 'numeric' })).toBe(new Intl.DateTimeFormat(tag, { month: 'short', day: 'numeric' }).format(date));
    expect(formatPrice(0.012345, locale)).toBe(new Intl.NumberFormat(tag, { minimumFractionDigits: 5, maximumFractionDigits: 5 }).format(0.012345));
  });
});
