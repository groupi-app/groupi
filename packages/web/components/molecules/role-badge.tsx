import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

export type MemberRole = 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';

export interface RoleBadgeProps {
  /** The member role to display */
  role: MemberRole;
  /** Display variant */
  variant?: 'full' | 'abbreviated' | 'icon';
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
}

const roleConfig: Record<
  MemberRole,
  {
    icon: React.ReactNode;
    label: string;
    abbreviation: string;
    colorClass: string;
  }
> = {
  ORGANIZER: {
    icon: <Icons.crown className='size-3.5' />,
    label: 'Organizer',
    abbreviation: 'ORG',
    colorClass: 'text-fun-streak bg-fun-streak/10 border-fun-streak/20',
  },
  MODERATOR: {
    icon: <Icons.shield className='size-3.5' />,
    label: 'Moderator',
    abbreviation: 'MOD',
    colorClass:
      'text-brand-secondary bg-brand-secondary/10 border-brand-secondary/20',
  },
  ATTENDEE: {
    icon: <Icons.user className='size-3.5' />,
    label: 'Attendee',
    abbreviation: 'ATT',
    colorClass: 'text-muted-foreground bg-muted border-border',
  },
};

/**
 * RoleBadge - Displays a member's role in an event
 *
 * Shows ORGANIZER/MODERATOR/ATTENDEE with consistent styling:
 * - full: Icon + full label text
 * - abbreviated: Icon + abbreviated text (ORG, MOD, ATT)
 * - icon: Just the role icon
 *
 * Uses distinct colors:
 * - Organizer: Orange/gold (crown icon)
 * - Moderator: Blue (shield icon)
 * - Attendee: Gray/muted (user icon)
 */
export function RoleBadge({
  role,
  variant = 'full',
  size = 'md',
  className,
}: RoleBadgeProps) {
  const config = roleConfig[role];
  const sizeClass =
    size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  if (variant === 'icon') {
    return (
      <span
        data-slot='role-badge'
        className={cn('inline-flex items-center', className)}
        aria-label={config.label}
      >
        <span
          className={cn('flex items-center', config.colorClass.split(' ')[0])}
        >
          {config.icon}
        </span>
      </span>
    );
  }

  const text = variant === 'abbreviated' ? config.abbreviation : config.label;

  return (
    <Badge
      data-slot='role-badge'
      variant='outline'
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        sizeClass,
        config.colorClass,
        className
      )}
    >
      {config.icon}
      <span>{text}</span>
    </Badge>
  );
}
