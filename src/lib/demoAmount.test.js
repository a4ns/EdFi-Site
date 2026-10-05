import { describe, expect, it } from 'vitest';
import {
  demoAmountInput, demoAmountPortion, formatDemoAmount, isDemoAddress, parseDemoAmount,
} from './demoAmount';

describe('parseDemoAmount', () => {
  it.each([
    ['450', 45000], ['449.99', 44999], ['0.01', 1], ['1.01', 101],
    ['0', 0], ['0.00', 0], ['.1', 10], ['.01', 1], ['1.', 100],
    [' 001.20 ', 120], ['1,01', 101], ['90071992547409.91', Number.MAX_SAFE_INTEGER],
  ])('parses %j as exactly %i integer hundredths', (input, expected) => {
    expect(parseDemoAmount(input)).toBe(expected);
  });

  it.each([
    '', ' ', '.', ',', '-1', '-0.01', '+1', '1.001', '1.000', '0.009',
    '1e2', '1E-2', '0x10', '1,234.56', '1.2.3', '1 00', '12 EDC',
    'Infinity', 'NaN', '90071992547409.92', '99999999999999999999999',
    null, undefined, 1, NaN, Infinity, {}, [],
  ])('rejects %j instead of coercing or rounding it', (input) => {
    expect(parseDemoAmount(input)).toBeNull();
  });
});

describe('demo amount display and presets', () => {
  it.each([
    [0, '0.00'], [1, '0.01'], [10, '0.10'], [101, '1.01'],
    [44999, '449.99'], [45000, '450.00'],
    [Number.MAX_SAFE_INTEGER, '90071992547409.91'],
  ])('round-trips %i units without losing a cent', (units, text) => {
    expect(demoAmountInput(units)).toBe(text);
    expect(parseDemoAmount(text)).toBe(units);
  });

  it.each([-1, 0.1, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid display units %j', (units) => {
      expect(() => demoAmountInput(units)).toThrow(RangeError);
    },
  );

  it.each([
    [0, '0.00'], [1, '0.01'], [-1, '-0.01'], [100000, '1,000.00'],
    [-44999, '-449.99'], [Number.MAX_SAFE_INTEGER, '90,071,992,547,409.91'],
  ])('formats %i units exactly as %s', (units, expected) => {
    expect(formatDemoAmount(units)).toBe(expected);
  });

  it.each([
    [101, 0, 0], [101, 25, 25], [101, 50, 50], [101, 75, 75], [101, 100, 101],
    [1, 25, 0], [1, 50, 0], [1, 75, 0], [1, 100, 1], [0, 100, 0],
    [Number.MAX_SAFE_INTEGER, 25, 2251799813685247],
    [Number.MAX_SAFE_INTEGER, 100, Number.MAX_SAFE_INTEGER],
  ])('floors %i units at %i percent to %i units', (units, percent, expected) => {
    const result = demoAmountPortion(units, percent);
    expect(result).toBe(expected);
    expect(Number.isSafeInteger(result)).toBe(true);
    expect(result).toBeLessThanOrEqual(units);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('isDemoAddress', () => {
  it.each([
    '0x71C4e2b8A3f09d5E6c1B7a2D4f8E0c3B9a5D9A24',
    `0x${'a'.repeat(40)}`, `  0x${'0'.repeat(40)}  `,
  ])('accepts a sample address %j', (address) => {
    expect(isDemoAddress(address)).toBe(true);
  });

  it.each([
    '', '0x1234', `0x${'a'.repeat(39)}`, `0x${'a'.repeat(41)}`,
    `0x${'g'.repeat(40)}`, 'a'.repeat(40), null, undefined, 123,
  ])('rejects a malformed address %j', (address) => {
    expect(isDemoAddress(address)).toBe(false);
  });
});
