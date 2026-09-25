import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, currentTheme } from '../lib/theme';

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(currentTheme);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className={`icon-btn w-10 ${className}`}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
    >
      {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
