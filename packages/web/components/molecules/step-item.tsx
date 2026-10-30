'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { StepBadge, type StepBadgeColor } from '@/components/atoms';

export interface StepItemProps {
  /**
   * The step number to display.
   */
  step: number | string;
  /**
   * The color of the step badge.
   */
  color: StepBadgeColor;
  /**
   * The step title.
   */
  title: string;
  /**
   * The step description.
   */
  description: string;
  /**
   * Additional CSS classes to apply.
   */
  className?: string;
}

/**
 * A step item with a numbered badge, title, and description.
 * Used for "how it works" sections.
 */
export function StepItem({
  step,
  color,
  title,
  description,
  className,
}: StepItemProps) {
  return (
    <Card
      treatment='quiet'
      className={cn(
        // Card styles
        'flex items-start gap-4',
        'bg-card rounded-card p-5',
        className
      )}
    >
      <StepBadge color={color}>{step}</StepBadge>
      <div className='pt-0.5'>
        <h3 className='font-heading text-base font-bold text-foreground mb-1'>
          {title}
        </h3>
        <p className='text-muted-foreground text-sm leading-relaxed'>
          {description}
        </p>
      </div>
    </Card>
  );
}
