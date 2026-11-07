import { Moon, Sun } from 'lucide-react';
import { useLocale } from '../state/locale';
import { useTheme } from '../state/useTheme';
import { applyTheme } from '../lib/theme';

export default function ThemeToggle({ className = '' }) {
  const { t } = useLocale();
  const theme = useTheme();
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className={`icon-btn w-10 ${className}`}
      aria-label={t(theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')}
      title={t(theme === 'dark' ? 'Light theme' : 'Dark theme')}
    >
      {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
