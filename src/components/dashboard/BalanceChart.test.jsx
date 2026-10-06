import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BalanceChart from './BalanceChart';
import { LocaleContext } from '../../state/locale';
import { translate } from '../../i18n/messages';
import { balanceDate } from '../../lib/balanceChart';
import { formatChartDate } from '../../lib/format';

const today = new Date(2026, 9, 5, 12).getTime();
function LocalizedChart({ locale = 'en', end = 450 }) {
  return <LocaleContext.Provider value={{ locale, t: (key, values) => translate(locale, key, values) }}>
    <BalanceChart end={end} />
  </LocaleContext.Provider>;
}
const series = (container) => container.querySelector('svg path[fill="none"]').getAttribute('d');
const axisLabels = (container) => [...container.querySelectorAll('svg g text')].map((label) => label.textContent);

beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(today));
afterEach(() => vi.restoreAllMocks());

describe('illustrative balance chart', () => {
  it.each(['en', 'ru', 'kk'])('keeps small balance ticks readable and the disclosure translated in %s', (locale) => {
    const { container } = render(<LocalizedChart locale={locale} end={0.01} />);
    expect(screen.getByText(translate(locale, 'Illustrative balance chart'))).toBeVisible();
    for (const days of [7, 30, 90]) {
      const button = screen.getByRole('button', { name: translate(locale, 'Last {count} days', { count: days }) });
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'true');
      const labels = axisLabels(container);
      expect(new Set(labels).size).toBe(labels.length);
      expect(labels.some((label) => /[.,]\d{3,}/.test(label))).toBe(true);
      expect(series(container)).not.toMatch(/NaN|Infinity/);
    }
  });

  it('keeps numeric history and selected range stable while localizing dates', () => {
    const { container, rerender } = render(<LocalizedChart />);
    fireEvent.click(screen.getByRole('button', { name: 'Last 90 days' }));
    const initial = series(container);
    for (const locale of ['ru', 'kk', 'en']) {
      rerender(<LocalizedChart locale={locale} />);
      expect(series(container)).toBe(initial);
      expect(screen.getByRole('button', { name: translate(locale, 'Last {count} days', { count: 90 }) })).toHaveAttribute('aria-pressed', 'true');
      const dates = [...container.querySelectorAll('svg > text')].map((label) => label.textContent);
      expect(dates).toEqual([89, 44, 0].map((daysAgo) => formatChartDate(balanceDate(today, daysAgo), locale)));
    }
  });

  it('resets a historical hover when switching to a shorter range and clamps the cursor at both ends', () => {
    const { container } = render(<LocalizedChart />);
    fireEvent.click(screen.getByRole('button', { name: 'Last 90 days' }));
    const chart = container.querySelector('svg').parentElement;
    fireEvent.mouseMove(chart, { clientX: 10000 });
    expect(screen.getByText('450.00 EDC')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));
    expect(screen.queryByText('450.00 EDC')).not.toBeInTheDocument();
    expect(container.querySelector('circle').getAttribute('cy')).not.toMatch(/NaN|Infinity/);
    fireEvent.mouseMove(chart, { clientX: -100 });
    const firstX = Number(container.querySelector('circle').getAttribute('cx'));
    fireEvent.mouseMove(chart, { clientX: 10000 });
    expect(Number(container.querySelector('circle').getAttribute('cx'))).toBeGreaterThan(firstX);
    expect(screen.getByText('450.00 EDC')).toBeVisible();
    fireEvent.mouseLeave(chart);
    expect(screen.queryByText('450.00 EDC')).not.toBeInTheDocument();
  });

  it('shows a flat zero history and safely updates it to a tiny balance', () => {
    const { container, rerender } = render(<LocalizedChart end={0} />);
    expect(axisLabels(container)).toEqual(['0', '1']);
    const path = series(container);
    const heights = [...path.matchAll(/[ML][\d.]+ ([\d.]+)/g)].map((match) => match[1]);
    expect(new Set(heights).size).toBe(1);
    rerender(<LocalizedChart end={0.01} />);
    expect(series(container)).not.toBe(path);
    fireEvent.mouseMove(container.querySelector('svg').parentElement, { clientX: 10000 });
    expect(screen.getByText('0.010 EDC')).toBeVisible();
  });

  it('disconnects its resize observer on unmount', () => {
    const disconnect = vi.fn();
    const observer = vi.spyOn(globalThis, 'ResizeObserver').mockImplementation(function () {
      this.observe = vi.fn();
      this.disconnect = disconnect;
    });
    const { unmount } = render(<LocalizedChart />);
    expect(observer).toHaveBeenCalledOnce();
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
