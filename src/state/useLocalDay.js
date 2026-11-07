import { useEffect, useState } from 'react';
import { localDayBounds } from './demoWallet';

// Refresh after local midnight and when returning from a suspended/background tab.
export function useLocalDay() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let timer;
    const schedule = () => {
      clearTimeout(timer);
      const current = Date.now();
      timer = setTimeout(refresh, localDayBounds(current).end - current);
    };
    const refresh = () => {
      setNow(Date.now());
      schedule();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    // Mount may cross midnight between the state initializer and this effect.
    timer = setTimeout(refresh, 0);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return now;
}
