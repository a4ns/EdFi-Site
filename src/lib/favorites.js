// Favourite coins on /markets. Stored per browser; reads and writes never throw
// (private mode or blocked storage simply means no saved favourites).
export const FAVORITES_STORAGE_KEY = 'edfi.favorites';

export function readFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((symbol) => typeof symbol === 'string') : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(favorites, symbol) {
  const next = favorites.includes(symbol) ? favorites.filter((s) => s !== symbol) : [...favorites, symbol];
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable: keep the change for this visit only.
  }
  return next;
}
