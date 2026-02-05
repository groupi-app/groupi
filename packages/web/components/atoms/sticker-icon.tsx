'use client';

import { cn } from '@/lib/utils';

/**
 * Icon component type - accepts any component that takes className.
 */
type IconComponent = React.ComponentType<{ className?: string }>;

/**
 * Size variants for the sticker icon.
 */
const sizeClasses = {
  xs: 'size-6',
  sm: 'size-10',
  md: 'size-12',
  lg: 'size-14',
  xl: 'size-24',
} as const;

/**
 * Icon size variants matching the container sizes.
 */
const iconSizeClasses = {
  xs: 'size-3.5',
  sm: 'size-5',
  md: 'size-6',
  lg: 'size-7',
  xl: 'size-12',
} as const;

/**
 * Border width variants for the sticker effect.
 */
const borderClasses = {
  xs: 'border-[1.5px]',
  sm: 'border-2',
  md: 'border-[3px]',
  lg: 'border-4',
  xl: 'border-4',
} as const;

/**
 * Color variants using design tokens.
 */
export type StickerIconColor =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

const colorClasses: Record<StickerIconColor, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
} as const;

export interface StickerIconProps {
  /**
   * The icon component to render.
   */
  icon: IconComponent;
  /**
   * The background color of the sticker.
   * @default 'primary'
   */
  color?: StickerIconColor;
  /**
   * The size of the sticker icon.
   * @default 'md'
   */
  size?: keyof typeof sizeClasses;
  /**
   * Additional CSS classes to apply.
   */
  className?: string;
}

/**
 * A sticker-style icon with a colored background and white border.
 * Creates a die-cut sticker aesthetic with proper aspect ratio.
 */
export function StickerIcon({
  icon: Icon,
  color = 'primary',
  size = 'md',
  className,
}: StickerIconProps) {
  return (
    <div
      className={cn(
        // Base styles - square aspect ratio with flex centering
        'flex-shrink-0 flex items-center justify-center',
        // Rounded corners using card radius token
        'rounded-card',
        // Shadow for depth
        'shadow-raised',
        // White border for sticker effect
        'border-white',
        // Size variant
        sizeClasses[size],
        // Border width variant
        borderClasses[size],
        // Color variant
        colorClasses[color],
        className
      )}
    >
      <Icon className={cn('text-white', iconSizeClasses[size])} />
    </div>
  );
}
