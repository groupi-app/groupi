import { cn } from '@/lib/utils';
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

// Sticker journal aesthetic - solid colored badges with white borders
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
    colorClass:
      'bg-warning text-white border-2 border-white shadow-raised hover:opacity-90',
  },
  MODERATOR: {
    icon: <Icons.shield className='size-3.5' />,
    label: 'Moderator',
    abbreviation: 'MOD',
    colorClass:
      'bg-info text-white border-2 border-white shadow-raised hover:opacity-90',
  },
  ATTENDEE: {
    icon: <Icons.user className='size-3.5' />,
    label: 'Attendee',
    abbreviation: 'ATT',
    colorClass:
      'bg-muted text-muted-foreground border-2 border-white shadow-raised',
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

  // Sticker journal aesthetic - use solid badges instead of outline
  return (
    <span
      data-slot='role-badge'
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-badge',
        sizeClass,
        config.colorClass,
        className
      )}
    >
      {config.icon}
      <span>{text}</span>
    </span>
  );
}
