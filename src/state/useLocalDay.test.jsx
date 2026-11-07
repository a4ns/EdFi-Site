import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalDay } from './useLocalDay';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useLocalDay', () => {
  it('refreshes exactly at local midnight and schedules the next calendar day', () => {
    const beforeMidnight = new Date(2026, 9, 5, 23, 59, 59, 500);
    const midnight = new Date(2026, 9, 6, 0, 0, 0, 0);
    const followingMidnight = new Date(2026, 9, 7, 0, 0, 0, 0);
    vi.setSystemTime(beforeMidnight);
    const { result } = renderHook(() => useLocalDay());
    expect(result.current).toBe(beforeMidnight.getTime());

    act(() => vi.advanceTimersByTime(499));
    expect(result.current).toBe(beforeMidnight.getTime());
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(midnight.getTime());
    act(() => vi.advanceTimersByTime(followingMidnight.getTime() - midnight.getTime()));
    expect(result.current).toBe(followingMidnight.getTime());
    expect(vi.getTimerCount()).toBe(1);
  });

  it('catches up when a suspended tab becomes visible and replaces its old midnight timer', () => {
    const initial = new Date(2026, 9, 5, 18, 0, 0);
    const resumed = new Date(2026, 9, 7, 10, 0, 0);
    const nextMidnight = new Date(2026, 9, 8, 0, 0, 0);
    vi.setSystemTime(initial);
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    const { result } = renderHook(() => useLocalDay());

    // Jump wall-clock time without running timers, as if the tab was suspended.
    vi.setSystemTime(resumed);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(result.current).toBe(initial.getTime());
    visibility.mockReturnValue('visible');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(result.current).toBe(resumed.getTime());
    expect(vi.getTimerCount()).toBe(1);

    act(() => vi.advanceTimersByTime(nextMidnight.getTime() - resumed.getTime()));
    expect(result.current).toBe(nextMidnight.getTime());
    expect(vi.getTimerCount()).toBe(1);
  });

  it('removes its timer and visibility listener when unmounted', () => {
    vi.setSystemTime(new Date(2026, 9, 5, 12, 0, 0));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    const { unmount } = renderHook(() => useLocalDay());
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);

    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('catches up if midnight passes between the initializer and the first effect', () => {
    const before = new Date(2026, 9, 5, 23, 59, 59, 999).getTime();
    const after = new Date(2026, 9, 6, 0, 0, 0, 5).getTime();
    vi.setSystemTime(after);
    vi.spyOn(Date, 'now').mockReturnValueOnce(before).mockReturnValue(after);
    const { result } = renderHook(() => useLocalDay());
    expect(result.current).toBe(before);
    act(() => vi.advanceTimersByTime(0));
    expect(result.current).toBe(after);
    expect(vi.getTimerCount()).toBe(1);
  });

});
