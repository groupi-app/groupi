import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

export type RSVPStatusValue = 'YES' | 'NO' | 'MAYBE' | 'PENDING';

export interface RSVPStatusProps {
  /** The RSVP status to display */
  status: RSVPStatusValue;
  /** Display variant */
  variant?: 'badge' | 'icon' | 'text' | 'icon-text';
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
}

const statusConfig: Record<
  RSVPStatusValue,
  {
    icon: React.ReactNode;
    label: string;
    colorClass: string;
    badgeVariant: 'success' | 'destructive' | 'warning' | 'secondary';
  }
> = {
  YES: {
    icon: <Icons.check className='size-4' />,
    label: 'Going',
    colorClass: 'text-success',
    badgeVariant: 'success',
  },
  NO: {
    icon: <Icons.close className='size-4' />,
    label: 'Not Going',
    colorClass: 'text-destructive',
    badgeVariant: 'destructive',
  },
  MAYBE: {
    icon: (
      <span className='font-semibold text-lg leading-none text-center'>?</span>
    ),
    label: 'Maybe',
    colorClass: 'text-warning',
    badgeVariant: 'warning',
  },
  PENDING: {
    icon: <Icons.clock className='size-4' />,
    label: 'Pending',
    colorClass: 'text-muted-foreground',
    badgeVariant: 'secondary',
  },
};

/**
 * RSVPStatus - Displays an event RSVP status
 *
 * Shows YES/NO/MAYBE/PENDING status with consistent styling:
 * - badge: Full badge with background color
 * - icon: Just the status icon
 * - text: Just the status text
 * - icon-text: Icon followed by status text
 */
export function RSVPStatus({
  status,
  variant = 'badge',
  size = 'md',
  className,
}: RSVPStatusProps) {
  const config = statusConfig[status];
  const sizeClass = size === 'sm' ? 'text-xs' : 'text-sm';

  if (variant === 'badge') {
    return (
      <Badge
        data-slot='rsvp-status'
        variant={config.badgeVariant}
        className={cn(sizeClass, className)}
      >
        {config.label}
      </Badge>
    );
  }

  if (variant === 'icon') {
    return (
      <span
        data-slot='rsvp-status'
        className={cn(
          'flex items-center justify-center',
          config.colorClass,
          className
        )}
        aria-label={config.label}
      >
        {config.icon}
      </span>
    );
  }

  if (variant === 'text') {
    return (
      <span
        data-slot='rsvp-status'
        className={cn(sizeClass, config.colorClass, 'font-medium', className)}
      >
        {config.label}
      </span>
    );
  }

  // icon-text variant
  return (
    <span
      data-slot='rsvp-status'
      className={cn(
        'inline-flex items-center gap-1',
        sizeClass,
        config.colorClass,
        className
      )}
    >
      {config.icon}
      <span className='font-medium'>{config.label}</span>
    </span>
  );
}
