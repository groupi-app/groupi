'use client';

import { useState, useCallback } from 'react';
import { useMobile } from './use-mobile';

/**
 * Hook for managing action menu state and handlers
 * Provides state and handlers for mobile drawer + desktop dropdown/context menu pattern
 */
export function useActionMenu() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useMobile();

  // Handle context menu (right-click or long-press) on mobile
  const handleContextMenu = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isMobile) return;
      e.preventDefault();
      e.stopPropagation();
      setSheetOpen(true);
    },
    [isMobile]
  );

  // Prevent regular clicks from opening drawer
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [isMobile]
  );

  // Handle three dots button click on mobile
  const handleMoreClick = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) {
        e.preventDefault();
        e.stopPropagation();
        setSheetOpen(true);
      }
    },
    [isMobile]
  );

  return {
    sheetOpen,
    setSheetOpen,
    handleContextMenu,
    handleClick,
    handleMoreClick,
    isMobile,
  };
}

