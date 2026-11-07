import { describe, expect, it, vi } from 'vitest';
import { balanceAxis, balanceDate, buildBalanceSeries } from './balanceChart';
import { formatAmount } from './format';

describe('illustrative balance series', () => {
  it.each([7, 30, 90])('keeps the %i-day history deterministic and ends at the supplied balance', (days) => {
    const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Must stay deterministic'); });
    try {
      const first = buildBalanceSeries(450, days);
      expect(first).toHaveLength(days);
      expect(first.at(-1)).toBe(450);
      expect(first.every((value) => Number.isFinite(value) && value >= 0)).toBe(true);
      expect(first[0]).toBeLessThan(first.at(-1));
      buildBalanceSeries(270, 90);
      expect(buildBalanceSeries(450, days)).toEqual(first);
      // Changing the wallet total scales the same illustrative shape.
      expect(buildBalanceSeries(900, days)).toEqual(first.map((value) => value * 2));
    } finally {
      random.mockRestore();
    }
  });

  it.each([7, 30, 90])('keeps zero balances flat over %i days', (days) => {
    expect(buildBalanceSeries(0, days)).toEqual(Array(days).fill(0));
  });

  it.each([0.01, 1, 450, 1000000, Number.MAX_SAFE_INTEGER / 100])('covers the full %s EDC series with finite, distinct readable ticks', (balance) => {
    for (const days of [7, 30, 90]) {
      const points = buildBalanceSeries(balance, days);
      const { ticks, digits } = balanceAxis(Math.min(...points), Math.max(...points));
      expect(points.at(-1)).toBe(balance);
      expect(ticks.length).toBeGreaterThanOrEqual(2);
      expect(ticks.length).toBeLessThanOrEqual(6);
      expect(ticks.every(Number.isFinite)).toBe(true);
      expect(ticks[0]).toBeLessThanOrEqual(Math.min(...points));
      expect(ticks.at(-1)).toBeGreaterThanOrEqual(Math.max(...points));
      expect(ticks).toEqual([...ticks].sort((a, b) => a - b));
      for (const locale of ['en', 'ru', 'kk']) {
        const labels = ticks.map((tick) => formatAmount(tick, digits, locale));
        expect(new Set(labels).size).toBe(ticks.length);
      }
    }
  });

  it('uses precision that distinguishes fractional tick increments', () => {
    const { ticks, digits } = balanceAxis(0.001, 0.008);
    expect(ticks).toEqual([0, 0.0025, 0.005, 0.0075, 0.01]);
    expect(digits).toBe(4);
    expect(ticks.map((value) => formatAmount(value, digits))).toEqual(['0.0000', '0.0025', '0.0050', '0.0075', '0.0100']);
    expect(balanceAxis(0, 0)).toEqual({ ticks: [0, 1], digits: 0 });
  });

  it.each([NaN, Infinity, -1, undefined])('keeps unsupported balance %s from producing invalid geometry', (balance) => {
    expect(buildBalanceSeries(balance, 7)).toEqual(Array(7).fill(0));
  });

  it('falls back to the default range for an unsupported day count', () => {
    expect(buildBalanceSeries(450, 1)).toEqual(buildBalanceSeries(450, 30));
  });

  it('uses local calendar days across month boundaries and daylight-saving changes', () => {
    const today = new Date(2026, 2, 9, 0, 30);
    const previous = balanceDate(today.getTime(), 1);
    expect([previous.getFullYear(), previous.getMonth(), previous.getDate(), previous.getHours(), previous.getMinutes()]).toEqual([2026, 2, 8, 0, 30]);
    expect(balanceDate(new Date(2026, 0, 2, 12).getTime(), 6)).toEqual(new Date(2025, 11, 27, 12));
    expect(today).toEqual(new Date(2026, 2, 9, 0, 30));
  });
});
