'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface TypingUser {
  personId: string;
  name: string;
  image?: string | null;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  className?: string;
}

/**
 * Discord-style typing indicator
 * Shows animated dots with user names:
 * - 1 user: "Alice is typing"
 * - 2 users: "Alice and Bob are typing"
 * - 3 users: "Alice, Bob, and Charlie are typing"
 * - 4+ users: "Several people are typing"
 */
export function TypingIndicator({
  typingUsers,
  className,
}: TypingIndicatorProps) {
  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    const count = typingUsers.length;

    if (count === 1) {
      return (
        <>
          <span className='font-semibold text-foreground'>
            {typingUsers[0].name}
          </span>{' '}
          <span className='text-muted-foreground'>is typing</span>
        </>
      );
    }

    if (count === 2) {
      return (
        <>
          <span className='font-semibold text-foreground'>
            {typingUsers[0].name}
          </span>{' '}
          <span className='text-muted-foreground'>and</span>{' '}
          <span className='font-semibold text-foreground'>
            {typingUsers[1].name}
          </span>{' '}
          <span className='text-muted-foreground'>are typing</span>
        </>
      );
    }

    if (count === 3) {
      return (
        <>
          <span className='font-semibold text-foreground'>
            {typingUsers[0].name}
          </span>
          <span className='text-muted-foreground'>,</span>{' '}
          <span className='font-semibold text-foreground'>
            {typingUsers[1].name}
          </span>
          <span className='text-muted-foreground'>, and</span>{' '}
          <span className='font-semibold text-foreground'>
            {typingUsers[2].name}
          </span>{' '}
          <span className='text-muted-foreground'>are typing</span>
        </>
      );
    }

    // 4 or more users
    return (
      <>
        <span className='font-semibold text-foreground'>Several people</span>{' '}
        <span className='text-muted-foreground'>are typing</span>
      </>
    );
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Show up to 3 avatars, stacked
  const visibleUsers = typingUsers.slice(0, 3);

  return (
    <div
      className={cn(
        'flex items-center gap-2 py-2 px-3 text-sm animate-in fade-in duration-200',
        className
      )}
    >
      {/* Stacked avatars */}
      <div className='flex items-center -space-x-2'>
        {visibleUsers.map((user, index) => (
          <Avatar
            key={user.personId}
            className={cn(
              'h-6 w-6 border-2 border-background',
              // Add z-index so first avatar is on top
              index === 0 && 'z-30',
              index === 1 && 'z-20',
              index === 2 && 'z-10'
            )}
          >
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback className='text-[10px] bg-muted'>
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>

      {/* Animated dots bubble */}
      <div className='flex items-center justify-center h-6 px-2 bg-muted rounded-full'>
        <div className='flex gap-0.5'>
          <span
            className='w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce'
            style={{ animationDelay: '0ms', animationDuration: '1s' }}
          />
          <span
            className='w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce'
            style={{ animationDelay: '150ms', animationDuration: '1s' }}
          />
          <span
            className='w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce'
            style={{ animationDelay: '300ms', animationDuration: '1s' }}
          />
        </div>
      </div>

      {/* Typing text */}
      <span className='text-sm'>{getTypingText()}</span>
    </div>
  );
}
