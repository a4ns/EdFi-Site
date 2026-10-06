import { afterEach, describe, expect, it, vi } from 'vitest';
import { FAVORITES_STORAGE_KEY, readFavorites, toggleFavorite } from './favorites';

describe('market favorites', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('adds and removes symbols and persists them', () => {
    const added = toggleFavorite([], 'BTC');
    expect(added).toEqual(['BTC']);
    expect(readFavorites()).toEqual(['BTC']);
    expect(toggleFavorite(added, 'BTC')).toEqual([]);
    expect(readFavorites()).toEqual([]);
  });

  it('ignores malformed stored values', () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, '{"BTC":true}');
    expect(readFavorites()).toEqual([]);
    localStorage.setItem(FAVORITES_STORAGE_KEY, 'not json');
    expect(readFavorites()).toEqual([]);
    localStorage.setItem(FAVORITES_STORAGE_KEY, '["ETH", 3, null]');
    expect(readFavorites()).toEqual(['ETH']);
  });

  it('keeps working when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(readFavorites()).toEqual([]);
    expect(toggleFavorite([], 'SOL')).toEqual(['SOL']);
  });
});
