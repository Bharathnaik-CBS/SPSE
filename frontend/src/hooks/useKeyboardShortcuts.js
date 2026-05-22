import { useEffect } from 'react';

export const useKeyboardShortcuts = ({
  searchInputRef,
  onAdd,
  onEscape,
  onArrowDown,
  onArrowUp,
  onEnter,
  drawerOpen,
}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (!isTyping && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        onAdd();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape();
        return;
      }

      if (drawerOpen) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        onArrowDown();
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        onArrowUp();
        return;
      }

      if (event.key === 'Enter') {
        onEnter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen, onAdd, onArrowDown, onArrowUp, onEnter, onEscape, searchInputRef]);
};
