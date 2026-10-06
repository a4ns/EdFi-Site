export function sectionHref(href, pathname = '/') {
  return href.startsWith('#') && pathname !== '/' ? `/${href}` : href;
}

export function preferredScrollBehavior() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

export function focusMainContent(scroll = false) {
  const main = document.getElementById('main-content');
  main?.focus({ preventScroll: true });
  if (scroll) main?.scrollIntoView({ block: 'start', behavior: 'auto' });
}

export function moveToRouteContent(pathname, hash, pathChanged) {
  if (pathChanged) {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (!document.querySelector('[role="dialog"][aria-modal="true"]')) focusMainContent();
  }
  // Dashboard owns its section and dialog hashes without resetting its wallet.
  if (!hash || pathname === '/demo') return;
  let id;
  try {
    id = decodeURIComponent(hash.slice(1));
  } catch {
    return;
  }
  document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'auto' });
}

export function moveFilterTab(event, currentIndex, count, selectIndex) {
  let next;
  if (event.key === 'ArrowRight') next = (currentIndex + 1) % count;
  else if (event.key === 'ArrowLeft') next = (currentIndex + count - 1) % count;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = count - 1;
  else return;
  event.preventDefault();
  const buttons = event.currentTarget.parentElement.querySelectorAll('[role="tab"]');
  selectIndex(next);
  buttons[next]?.focus();
}
