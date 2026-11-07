import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useLocale } from '../state/locale';
import { focusMainContent, moveToRouteContent } from '../lib/navigation';

export default function RouteAccessibility() {
  const { pathname, hash } = useLocation();
  const previousPath = useRef(null);
  const { t } = useLocale();
  useEffect(() => {
    moveToRouteContent(pathname, hash, previousPath.current !== pathname);
    previousPath.current = pathname;
  }, [pathname, hash]);
  return (
    <a
      href="#main-content"
      onClick={(event) => { event.preventDefault(); focusMainContent(true); }}
      className="sr-only z-[100] rounded-lg bg-yellow font-medium text-yellow-on focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:px-4 focus:py-3"
    >
      {t('Skip to main content')}
    </a>
  );
}
