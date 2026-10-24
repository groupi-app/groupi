'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';
import { Icons } from '@/components/icons';
import { StickerIcon, type StickerIconColor } from '@/components/atoms';

export interface StickerCardProps {
  icon: LucideIcon | keyof typeof Icons;
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
    <Card
      treatment='quiet'
      className={cn(
        // Card base styles
        'bg-card rounded-card p-6',
        className
      )}
    >
      <div className='flex items-start gap-4'>
        <StickerIcon icon={icon} color={iconColor} />
        <div>
          <h3 className='font-heading text-base font-bold text-foreground mb-1'>
            {title}
          </h3>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
}
