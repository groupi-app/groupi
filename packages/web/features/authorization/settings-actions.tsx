'use client';

import { useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { ActionMenu } from '@/components/ui/action-menu';
import { ActionMenuButton } from '@/components/ui/action-menu-button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ContextMenuItem } from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';
import { useActionMenu } from '@/hooks/use-action-menu';

export function SettingsActions({
  label,
  actions,
}: {
  label: string;
  actions: {
    label: string;
    onSelect: (trigger: HTMLButtonElement | null) => void;
    destructive?: boolean;
    disabled?: boolean;
  }[];
}) {
  const menu = useActionMenu();
  const anchor = useRef<HTMLDivElement>(null);
  function choose(action: (typeof actions)[number]) {
    menu.setSheetOpen(false);
    action.onSelect(anchor.current?.querySelector('button') ?? null);
  }
  return (
    <ActionMenu
      drawerTitle={label}
      drawerContent={
        <div className='space-y-1 p-4'>
          {actions.map(action => (
            <Button
              key={action.label}
              type='button'
              variant={action.destructive ? 'destructive-ghost' : 'ghost'}
              className='h-auto min-h-11 w-full justify-start whitespace-normal text-left'
              disabled={action.disabled}
              onClick={() => choose(action)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      }
      contextMenuContent={actions.map(action => (
        <ContextMenuItem
          key={action.label}
          disabled={action.disabled}
          className={action.destructive ? 'text-error' : undefined}
          onSelect={() => choose(action)}
        >
          {action.label}
        </ContextMenuItem>
      ))}
      sheetOpen={menu.sheetOpen}
      onSheetOpenChange={menu.setSheetOpen}
      onContextMenu={menu.handleContextMenu}
      onClick={menu.handleClick}
    >
      <div ref={anchor} className='shrink-0'>
        <ActionMenuButton
          label={label}
          onClick={menu.handleMoreClick}
          onContextMenu={menu.handleContextMenu}
          dropdownContent={
            <>
              {actions.map(action => (
                <DropdownMenuItem
                  key={action.label}
                  disabled={action.disabled}
                  className={action.destructive ? 'text-error' : undefined}
                  onSelect={() => choose(action)}
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </>
          }
        >
          <MoreHorizontal className='size-4' aria-hidden='true' />
        </ActionMenuButton>
      </div>
    </ActionMenu>
  );
}
