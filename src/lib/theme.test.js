import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, currentTheme, subscribeTheme } from './theme';

let meta;
const unsubscribers = [];

beforeEach(() => {
  localStorage.clear();
  meta = document.createElement('meta');
  meta.name = 'theme-color';
  document.head.appendChild(meta);
  applyTheme('dark');
});

afterEach(() => {
  unsubscribers.splice(0).forEach((unsubscribe) => unsubscribe());
  vi.restoreAllMocks();
  meta.remove();
  localStorage.clear();
});

describe('shared theme snapshot and persistence', () => {
  it.each(['light', 'dark'])('updates the DOM, browser color and saved %s preference before notifying controls', (theme) => {
    const listener = vi.fn(() => {
      expect(currentTheme()).toBe(theme);
      expect(document.documentElement).toHaveAttribute('data-theme', theme);
      expect(meta).toHaveAttribute('content', theme === 'dark' ? '#181A20' : '#FFFFFF');
      expect(localStorage.getItem('edfi-theme')).toBe(theme);
    });
    unsubscribers.push(subscribeTheme(listener));
    applyTheme(theme);
    expect(listener).toHaveBeenCalledOnce();
    expect(localStorage.length).toBe(1);
  });

  it.each(['system', '', null, undefined, 0, {}, 'LIGHT'])('ignores unsupported theme input %j without mutation or notification', (value) => {
    const listener = vi.fn();
    const save = vi.spyOn(Storage.prototype, 'setItem');
    unsubscribers.push(subscribeTheme(listener));
    applyTheme(value);
    expect(currentTheme()).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(meta).toHaveAttribute('content', '#181A20');
    expect(localStorage.getItem('edfi-theme')).toBe('dark');
    expect(save).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
  });

  it('notifies controls even when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    const listener = vi.fn(() => expect(currentTheme()).toBe('light'));
    unsubscribers.push(subscribeTheme(listener));
    expect(() => applyTheme('light')).not.toThrow();
    expect(meta).toHaveAttribute('content', '#FFFFFF');
    expect(listener).toHaveBeenCalledOnce();
  });

  it('removes subscriptions and allows missing browser-color metadata', () => {
    const removed = vi.fn();
    const active = vi.fn();
    const unsubscribe = subscribeTheme(removed);
    unsubscribers.push(unsubscribe, subscribeTheme(active));
    unsubscribe();
    meta.remove();
    expect(() => applyTheme('light')).not.toThrow();
    expect(removed).not.toHaveBeenCalled();
    expect(active).toHaveBeenCalledOnce();
  });
});
