export const currentTheme = () =>
  typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

export function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#181A20' : '#FFFFFF');
  try {
    localStorage.setItem('edfi-theme', t);
  } catch {
    /* storage can be unavailable (private mode) */
  }
}
