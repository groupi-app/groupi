import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PresenceIndicator, PresenceStatus } from '@/components/atoms';
import * as React from 'react';

export interface UserInfoCardProps {
  /** Avatar configuration */
  avatar: {
    src?: string | null;
    fallback: string;
  };
  /** User's display name */
  name: string;
  /** Optional subtitle (username, email, role, etc.) */
  subtitle?: string;
  /** Optional badge to display (role badge, status, etc.) */
  badge?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Presence status (shows indicator if provided) */
  presence?: PresenceStatus;
  /** Click handler (if provided, makes the card interactive) */
  onClick?: () => void;
  /** Additional class names */
  className?: string;
}

const sizeConfig = {
  sm: {
    avatar: 'size-8',
    name: 'text-sm',
    subtitle: 'text-xs',
    gap: 'gap-2',
  },
  md: {
    avatar: 'size-10',
    name: 'text-base',
    subtitle: 'text-sm',
    gap: 'gap-3',
  },
  lg: {
    avatar: 'size-16',
    name: 'text-xl',
    subtitle: 'text-base',
    gap: 'gap-3',
  },
};

/**
 * UserInfoCard - Displays user avatar with name and optional details
 *
 * A reusable pattern for displaying user information consistently:
 * - Avatar with fallback
 * - Name and subtitle
 * - Optional presence indicator
 * - Optional badge (role, status, etc.)
 *
 * Used in: member icons, profile slates, profile dropdowns, mentions
 */
export function UserInfoCard({
  avatar,
  name,
  subtitle,
  badge,
  size = 'md',
  presence,
  onClick,
  className,
}: UserInfoCardProps) {
  const config = sizeConfig[size];
  const isInteractive = !!onClick;

  const content = (
    <>
      <div className='relative flex-shrink-0'>
        <Avatar className={config.avatar}>
          <AvatarImage src={avatar.src || undefined} />
          <AvatarFallback
            className={cn(
              size === 'lg' && 'text-lg',
              size === 'sm' && 'text-xs'
            )}
          >
            {avatar.fallback}
          </AvatarFallback>
        </Avatar>
        {presence && (
          <PresenceIndicator
            status={presence}
            size={size === 'lg' ? 'lg' : 'sm'}
            className='absolute -bottom-0.5 -right-0.5 ring-2 ring-background'
          />
        )}
      </div>
      <div className='flex flex-col min-w-0 flex-1'>
        <span
          className={cn('font-medium truncate text-foreground', config.name)}
        >
          {name}
        </span>
        {subtitle && (
          <span
            className={cn('text-muted-foreground truncate', config.subtitle)}
          >
            {subtitle}
          </span>
        )}
      </div>
      {badge && <div className='flex-shrink-0'>{badge}</div>}
    </>
  );

  if (isInteractive) {
    return (
      <button
        type='button'
        data-slot='user-info-card'
        onClick={onClick}
        className={cn(
          'flex items-center w-full text-left rounded-subtle p-2 -m-2 transition-colors duration-fast hover:bg-accent/80',
          config.gap,
          className
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      data-slot='user-info-card'
      className={cn('flex items-center', config.gap, className)}
    >
      {content}
    </div>
  );
}
