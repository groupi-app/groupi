'use client';

import { cn } from '@/lib/utils';
import { Check, Palette } from 'lucide-react';
import {
  type BaseTheme,
  type ThemeTokenOverrides,
  baseThemeRegistry,
} from '@groupi/shared/design/themes';
import { useActionMenu } from '@/hooks/use-action-menu';
import { ActionMenu } from '@/components/ui/action-menu';
import { ActionMenuButton } from '@/components/ui/action-menu-button';
import { ContextMenuItem } from '@/components/ui/context-menu';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

/**
 * Extract preview colors from token overrides with smart fallbacks.
 * Tries multiple token paths before falling back to base theme colors.
 */
function getPreviewColorsFromOverrides(
  tokenOverrides: ThemeTokenOverrides | undefined,
  baseThemeId: string | undefined,
  mode: 'light' | 'dark'
): { primary: string; background: string; accent: string } {
  // Get base theme for fallback colors
  const baseTheme = baseThemeId ? baseThemeRegistry[baseThemeId] : undefined;

  // Mode-aware default fallbacks (used only if base theme is also unavailable)
  const modeDefaults =
    mode === 'dark'
      ? {
          primary: '#8b5cf6', // purple
          background: '#1a1a2e', // dark bg
          accent: '#06b6d4', // cyan
        }
      : {
          primary: '#8b5cf6', // purple
          background: '#ffffff', // white
          accent: '#06b6d4', // cyan
        };

  // Try to extract primary color from overrides
  const primary =
    tokenOverrides?.brand?.primary ||
    tokenOverrides?.brand?.secondary ||
    baseTheme?.preview.primary ||
    modeDefaults.primary;

  // Try to extract background color from overrides
  const background =
    tokenOverrides?.background?.page ||
    tokenOverrides?.background?.surface ||
    baseTheme?.preview.background ||
    modeDefaults.background;

  // Try to extract accent color from overrides
  const accent =
    tokenOverrides?.brand?.accent ||
    tokenOverrides?.status?.info ||
    tokenOverrides?.status?.success ||
    baseTheme?.preview.accent ||
    modeDefaults.accent;

  return { primary, background, accent };
}

interface ThemeCardProps {
  theme: BaseTheme;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

/**
 * Theme preview card showing a visual representation of a theme.
 * Displays the primary colors and allows selection.
 */
export function ThemeCard({
  theme,
  isSelected,
  onSelect,
  disabled = false,
}: ThemeCardProps) {
  return (
    <button
      type='button'
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'relative flex flex-col gap-2 rounded-card border-2 p-3 transition-all duration-fast cursor-pointer',
        'hover:shadow-floating hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        isSelected
          ? 'border-primary bg-bg-surface shadow-raised'
          : 'border-border bg-card hover:border-primary hover:bg-bg-surface/50'
      )}
    >
      {/* Color preview */}
      <div className='flex gap-1 h-16 rounded-rounded overflow-hidden'>
        {/* Primary color - largest portion */}
        <div
          className='flex-[3] rounded-l-rounded'
          style={{ backgroundColor: theme.preview.primary }}
        />
        {/* Background color */}
        <div
          className='flex-[2]'
          style={{ backgroundColor: theme.preview.background }}
        />
        {/* Accent color */}
        <div
          className='flex-1 rounded-r-rounded'
          style={{ backgroundColor: theme.preview.accent }}
        />
      </div>

      {/* Theme info */}
      <div className='flex items-center justify-between'>
        <div className='text-left'>
          <p className='text-sm font-medium text-foreground'>{theme.name}</p>
          <p className='text-xs text-muted-foreground capitalize'>
            {theme.mode} mode
          </p>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground'>
            <Check className='h-4 w-4' />
          </div>
        )}
      </div>
    </button>
  );
}

interface CustomThemeCardProps {
  name: string;
  mode: 'light' | 'dark';
  /** Base theme ID this custom theme extends */
  baseThemeId: string;
  /** Token overrides from the custom theme */
  tokenOverrides?: ThemeTokenOverrides;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

/**
 * Card for displaying a user's custom theme.
 * Uses ActionMenu for edit and delete actions (dropdown on desktop, drawer on mobile).
 */
export function CustomThemeCard({
  name,
  mode,
  baseThemeId,
  tokenOverrides,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  disabled = false,
}: CustomThemeCardProps) {
  // Get preview colors with smart fallbacks
  const previewColors = getPreviewColorsFromOverrides(
    tokenOverrides,
    baseThemeId,
    mode
  );
  const {
    sheetOpen,
    setSheetOpen,
    handleContextMenu,
    handleClick,
    handleMoreClick,
  } = useActionMenu();

  const hasActions = onEdit || onDelete;

  // Drawer content for mobile
  const drawerContent = hasActions ? (
    <div className='flex flex-col gap-2 px-4 pb-4 pt-4'>
      {onEdit && (
        <Button
          variant='ghost'
          className='w-full justify-start'
          onClick={() => {
            setSheetOpen(false);
            onEdit();
          }}
        >
          <Icons.edit className='size-4 mr-2' />
          Edit Theme
        </Button>
      )}
      {onDelete && (
        <Button
          variant='ghost'
          className='w-full justify-start hover:bg-destructive hover:text-destructive-foreground'
          onClick={() => {
            setSheetOpen(false);
            onDelete();
          }}
        >
          <Icons.delete className='size-4 mr-2' />
          Delete Theme
        </Button>
      )}
    </div>
  ) : null;

  // Context menu content for desktop
  const contextMenuContent = hasActions ? (
    <>
      {onEdit && (
        <ContextMenuItem
          onSelect={e => {
            e.preventDefault();
            onEdit();
          }}
          className='cursor-pointer'
        >
          <div className='flex items-center gap-1'>
            <Icons.edit className='size-4' />
            <span>Edit Theme</span>
          </div>
        </ContextMenuItem>
      )}
      {onDelete && (
        <ContextMenuItem
          onSelect={e => {
            e.preventDefault();
            onDelete();
          }}
          className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
        >
          <div className='flex items-center gap-1'>
            <Icons.delete className='size-4' />
            <span>Delete Theme</span>
          </div>
        </ContextMenuItem>
      )}
    </>
  ) : null;

  // Dropdown menu content for desktop action button
  const dropdownContent = hasActions ? (
    <>
      {onEdit && (
        <DropdownMenuItem
          onSelect={e => {
            e.preventDefault();
            onEdit();
          }}
          className='cursor-pointer'
        >
          <div className='flex items-center gap-1'>
            <Icons.edit className='size-4' />
            <span>Edit Theme</span>
          </div>
        </DropdownMenuItem>
      )}
      {onDelete && (
        <DropdownMenuItem
          onSelect={e => {
            e.preventDefault();
            onDelete();
          }}
          className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
        >
          <div className='flex items-center gap-1'>
            <Icons.delete className='size-4' />
            <span>Delete Theme</span>
          </div>
        </DropdownMenuItem>
      )}
    </>
  ) : null;

  // Handle keyboard interaction for the card
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  const cardContent = (
    <div
      role='button'
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={handleKeyDown}
      aria-disabled={disabled}
      className={cn(
        'relative flex flex-col gap-2 rounded-card border-2 p-3 transition-all duration-fast cursor-pointer text-left group',
        'hover:shadow-floating hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100',
        isSelected
          ? 'border-primary bg-bg-surface shadow-raised'
          : 'border-border bg-card hover:border-primary hover:bg-bg-surface/50'
      )}
    >
      {/* Action menu button */}
      {hasActions && (
        <ActionMenuButton
          onClick={e => {
            e.stopPropagation();
            handleMoreClick(e);
          }}
          onContextMenu={handleContextMenu}
          className='absolute z-float size-7 bg-background/90 hover:bg-accent transition-all rounded-md top-2 right-2 flex items-center justify-center shadow-raised'
          dropdownContent={dropdownContent}
        >
          <Icons.more className='size-4' />
        </ActionMenuButton>
      )}

      {/* Color preview */}
      <div className='flex gap-1 h-16 rounded-rounded overflow-hidden'>
        <div
          className='flex-[3] rounded-l-rounded flex items-center justify-center'
          style={{
            backgroundColor: previewColors.primary,
          }}
        >
          <Palette className='h-6 w-6 text-white/80' />
        </div>
        <div
          className='flex-[2]'
          style={{
            backgroundColor: previewColors.background,
          }}
        />
        <div
          className='flex-1 rounded-r-rounded'
          style={{
            backgroundColor: previewColors.accent,
          }}
        />
      </div>

      {/* Theme info and selected indicator */}
      <div className='flex items-center justify-between'>
        <div className='text-left'>
          <p className='text-sm font-medium text-foreground'>{name}</p>
          <p className='text-xs text-muted-foreground capitalize'>
            {mode} mode
          </p>
        </div>

        <div className='flex items-center gap-1'>
          {isSelected && (
            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground'>
              <Check className='h-4 w-4' />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (hasActions) {
    return (
      <ActionMenu
        drawerTitle='Theme Options'
        drawerContent={drawerContent}
        contextMenuContent={contextMenuContent}
        sheetOpen={sheetOpen}
        onSheetOpenChange={setSheetOpen}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
      >
        {cardContent}
      </ActionMenu>
    );
  }

  return cardContent;
}

interface CreateThemeCardProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Card for creating a new custom theme.
 */
export function CreateThemeCard({
  onClick,
  disabled = false,
}: CreateThemeCardProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed p-3 h-full min-h-[120px]',
        'transition-all duration-fast',
        'border-border hover:border-primary/50 hover:bg-bg-surface/50',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-muted'>
        <Palette className='h-5 w-5 text-muted-foreground' />
      </div>
      <span className='text-sm font-medium text-muted-foreground'>
        Create Custom Theme
      </span>
    </button>
  );
}
