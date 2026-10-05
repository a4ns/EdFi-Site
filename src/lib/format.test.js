import { describe, expect, it } from 'vitest';
import {
  formatAmount, formatChange, formatCompact, formatDateTime, formatInt, formatPrice, formatUsd,
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
  it('uses local calendar fields and zero-pads every part', () => {
    expect(formatDateTime(new Date(2026, 0, 2, 3, 4, 5))).toBe('2026-01-02 03:04:05');
  });
});
