import { useSyncExternalStore } from 'react';
import { currentTheme, subscribeTheme } from '../lib/theme';

export function useTheme() {
  return useSyncExternalStore(subscribeTheme, currentTheme, currentTheme);
}
