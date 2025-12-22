'use client';

import * as React from 'react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { useMobile } from '@/hooks/use-mobile';

interface ActionMenuProps {
  children: React.ReactNode;
  drawerTitle: string;
  drawerContent: React.ReactNode;
  contextMenuContent: React.ReactNode;
  sheetOpen: boolean;
  onSheetOpenChange: (open: boolean) => void;
  onContextMenu: (e: React.MouseEvent | React.TouchEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

/**
 * ActionMenu component that conditionally renders Drawer (mobile) or ContextMenu (desktop)
 * Provides consistent menu behavior across the app
 */
export function ActionMenu({
  children,
  drawerTitle,
  drawerContent,
  contextMenuContent,
  sheetOpen,
  onSheetOpenChange,
  onContextMenu,
  onClick,
  disabled = false,
}: ActionMenuProps) {
  const isMobile = useMobile();

  if (isMobile) {
    return (
      <Drawer
        open={sheetOpen && !disabled}
        onOpenChange={open => {
          // Prevent opening via onOpenChange - only allow via contextmenu handler
          if (isMobile && open && !sheetOpen) {
            return;
          }
          // Allow closing
          if (!open) {
            onSheetOpenChange(false);
          }
        }}
        modal={true}
      >
        <div
          onContextMenu={onContextMenu}
          onClick={onClick}
          style={{ touchAction: 'manipulation' }}
        >
          {children}
        </div>
        <DrawerContent>
          <VisuallyHidden>
            <DrawerTitle>{drawerTitle}</DrawerTitle>
          </VisuallyHidden>
          {drawerContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      {!disabled && contextMenuContent && (
        <ContextMenuContent>{contextMenuContent}</ContextMenuContent>
      )}
    </ContextMenu>
  );
}

