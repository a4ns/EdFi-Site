export const currentTheme = () =>
  typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

const listeners = new Set();

export function subscribeTheme(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function applyTheme(t) {
  if (t !== 'dark' && t !== 'light') return;
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#181A20' : '#FFFFFF');
  try {
    localStorage.setItem('edfi-theme', t);
  } catch {
    /* storage can be unavailable (private mode) */
  }
  // All mounted controls read the same DOM snapshot, even if saving is blocked.
  listeners.forEach((listener) => listener());
}
