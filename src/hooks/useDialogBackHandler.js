import { useEffect, useRef } from 'react';

/**
 * Hook that intercepts the browser/OS "back" navigation when a dialog is open,
 * closing the dialog instead of navigating away.
 */
export function useDialogBackHandler(isOpen, onClose) {
  const closedByBackRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    closedByBackRef.current = false;

    // Push a dummy state so "back" hits this entry first
    window.history.pushState({ dialogOpen: true }, '');

    const handlePopState = () => {
      closedByBackRef.current = true;
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose])
}