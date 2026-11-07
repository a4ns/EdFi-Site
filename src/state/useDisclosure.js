import { useCallback, useEffect, useId, useRef, useState } from 'react';

// Non-modal panels keep normal Tab order and return focus when dismissed.
export function useDisclosure() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const pinned = useRef(false);
  const panelId = useId();

  const close = useCallback((restoreFocus = false) => {
    pinned.current = false;
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const toggle = () => {
    if (open && pinned.current) close();
    else {
      pinned.current = true;
      setOpen(true);
    }
  };

  const onMouseEnter = () => setOpen(true);
  const onMouseLeave = () => {
    if (!pinned.current && !containerRef.current?.contains(document.activeElement)) close();
  };

  useEffect(() => {
    if (!open) return undefined;
    let returnFocusOnClick = false;
    const onAnotherPanel = (event) => {
      if (event.detail !== panelId) close();
    };
    const onDown = (event) => {
      if (containerRef.current?.contains(event.target)) return;
      returnFocusOnClick = containerRef.current?.contains(document.activeElement);
    };
    const onClick = (event) => {
      if (containerRef.current?.contains(event.target)) return;
      // Let the clicked control receive focus; return it only for empty space.
      close(containerRef.current?.contains(document.activeElement)
        || (returnFocusOnClick && document.activeElement === document.body));
    };
    const onFocus = (event) => {
      if (!containerRef.current?.contains(event.target)) close();
    };
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      close(true);
    };
    document.dispatchEvent(new CustomEvent('edfi:disclosure-open', { detail: panelId }));
    document.addEventListener('edfi:disclosure-open', onAnotherPanel);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('click', onClick);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('edfi:disclosure-open', onAnotherPanel);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('click', onClick);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close, panelId]);

  return { open, containerRef, triggerRef, panelId, close, toggle, onMouseEnter, onMouseLeave };
}
