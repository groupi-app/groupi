'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMobile } from '@/hooks/use-mobile';

interface ActionMenuButtonProps {
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent | React.TouchEvent) => void;
  className?: string;
  children: React.ReactNode;
  dropdownContent: React.ReactNode;
}

/**
 * ActionMenuButton component that conditionally renders as Button (mobile) or DropdownMenuTrigger (desktop)
 * On mobile: Regular button that opens drawer
 * On desktop: Dropdown menu trigger
 */
export function ActionMenuButton({
  onClick,
  onContextMenu,
  className,
  children,
  dropdownContent,
}: ActionMenuButtonProps) {
  const isMobile = useMobile();

  if (isMobile) {
    return (
      <Button
        variant='ghost'
        size='icon'
        className={className}
        onClick={onClick}
        onContextMenu={onContextMenu}
        style={{ touchAction: 'manipulation' }}
      >
        {children}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className={className}>
          {children}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>{dropdownContent}</DropdownMenuContent>
    </DropdownMenu>
  );
}
