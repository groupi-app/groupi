'use client';

import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';
import { StickerIcon, type StickerIconColor } from '@/components/atoms';

export interface StickerCardProps {
  /**
   * The icon to display in the sticker.
   */
  icon: LucideIcon;
  /**
   * The color of the sticker icon.
   */
  iconColor: StickerIconColor;
  /**
   * The card title.
   */
  title: string;
  /**
   * The card description.
   */
  description: string;
  /**
   * Additional CSS classes to apply to the card container.
   */
  className?: string;
}

/**
 * A card with a sticker icon, title, and description.
 * Used for value propositions and feature highlights.
 */
export function StickerCard({
  icon,
  iconColor,
  title,
  description,
  className,
}: StickerCardProps) {
  return (
    <div
      className={cn(
        // Card base styles
        'bg-card rounded-card p-6',
        // Shadow for depth
        'shadow-raised',
        // Ring for subtle definition
        'ring-1 ring-border/40',
        className
      )}
    >
      <div className='flex items-start gap-4'>
        <StickerIcon icon={icon} color={iconColor} />
        <div>
          <h3 className='text-base font-bold text-foreground mb-1'>{title}</h3>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
