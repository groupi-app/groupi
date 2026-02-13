'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn, formatDateTimeRangeShort, formatDate } from '@/lib/utils';
import { StickerIcon } from '@/components/atoms';
import { Id } from '@/convex/_generated/dataModel';
import { useState } from 'react';

interface EventInviteItemProps {
  inviteId: Id<'eventInvites'>;
  eventId: Id<'events'>;
  eventTitle: string;
  eventDescription: string | null;
  eventImageUrl: string | null;
  eventLocation: string | null;
  eventDateTime: number | null;
  eventVisibility?: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
  memberCount: number;
  role: 'ATTENDEE' | 'MODERATOR';
  message: string | null;
  createdAt: number;
  inviter: {
    personId: Id<'persons'>;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  onAccept: (
    inviteId: Id<'eventInvites'>,
    eventId: Id<'events'>
  ) => Promise<void>;
  onDecline: (inviteId: Id<'eventInvites'>) => Promise<void>;
  className?: string;
}

// Gradient patterns for invites without images
const gradientPatterns = [
  'from-primary/20 to-secondary/20',
  'from-accent/30 to-muted/30',
  'from-muted/40 to-card/20',
  'from-secondary/25 to-accent/25',
  'from-card/30 to-primary/15',
];

/**
 * EventInviteItem - Displays a single pending event invite
 */
export function EventInviteItem({
  inviteId,
  eventId,
  eventTitle,
  eventDescription,
  eventImageUrl,
  eventLocation,
  eventDateTime,
  eventVisibility,
  memberCount,
  // role is kept in the interface but unused here for now
  role: _role,
  message,
  createdAt,
  inviter,
  onAccept,
  onDecline,
  className,
}: EventInviteItemProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(inviteId, eventId);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      await onDecline(inviteId);
    } finally {
      setIsDeclining(false);
    }
  };

  // Consistent gradient based on event ID
  const gradientIndex =
    eventId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    gradientPatterns.length;
  const gradientClass = gradientPatterns[gradientIndex];

  const inviterDisplayName = inviter.name || inviter.username || 'Someone';
  const inviterInitials = inviterDisplayName.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-card shadow-raised bg-card',
        'transition-all duration-fast ease-bounce',
        'hover:shadow-floating',
        className
      )}
    >
      {/* Cover image area */}
      <div className='relative aspect-[16/9] overflow-hidden'>
        {eventImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- Convex storage URLs require native img */
          <img
            src={eventImageUrl}
            alt={eventTitle}
            className='absolute inset-0 w-full h-full object-cover'
          />
        ) : (
          <div
            className={cn('absolute inset-0 bg-gradient-to-br', gradientClass)}
          >
            <div className='absolute inset-0 flex items-center justify-center'>
              <Icons.party className='size-12 text-muted-foreground/30' />
            </div>
          </div>
        )}

        {/* RSVP badge - top left */}
        <div className='absolute top-3 left-3 bg-primary text-primary-foreground px-2.5 py-1 rounded-badge text-xs font-semibold shadow-raised border-2 border-white w-fit animate-wiggle-periodic'>
          RSVP Pending!
        </div>
      </div>

      {/* Content area */}
      <div className='p-4 flex flex-col gap-3'>
        {/* Title */}
        <h3 className='font-heading text-lg font-medium line-clamp-1'>
          {eventTitle}
        </h3>

        {/* Description */}
        {eventDescription && (
          <p className='text-sm text-muted-foreground line-clamp-2'>
            {eventDescription}
          </p>
        )}

        {/* Date/Time */}
        <div className='flex items-center gap-2 text-sm'>
          <StickerIcon icon={Icons.date} size='xs' color='info' />
          <span className='text-muted-foreground'>
            {eventDateTime
              ? formatDateTimeRangeShort(eventDateTime, undefined)
              : 'Date TBD'}
          </span>
        </div>

        {/* Location */}
        {eventLocation && (
          <div className='flex items-center gap-2 text-sm'>
            <StickerIcon icon={Icons.location} size='xs' color='success' />
            <span className='text-muted-foreground line-clamp-1'>
              {eventLocation}
            </span>
          </div>
        )}

        {/* Member count */}
        <div className='flex items-center gap-2 text-sm'>
          <StickerIcon icon={Icons.people} size='xs' color='primary' />
          <span className='text-muted-foreground'>
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>

        {/* Visibility */}
        <div className='flex items-center gap-2 text-sm'>
          {eventVisibility === 'FRIENDS' ? (
            <Icons.people className='size-3.5 text-muted-foreground/60' />
          ) : (
            <Icons.lock className='size-3.5 text-muted-foreground/60' />
          )}
          <span className='text-muted-foreground/60'>
            {eventVisibility === 'FRIENDS'
              ? 'Friends'
              : eventVisibility === 'PUBLIC'
                ? 'Public'
                : 'Private'}
          </span>
        </div>

        {/* Personal message from inviter */}
        {message && (
          <div className='bg-muted/50 rounded-input p-3 text-sm'>
            <p className='italic text-muted-foreground'>
              &ldquo;{message}&rdquo;
            </p>
          </div>
        )}

        {/* Inviter info */}
        <div className='flex items-center gap-2 pt-1 border-t border-border'>
          <Avatar className='size-6'>
            <AvatarImage
              src={inviter.image || undefined}
              alt={inviterDisplayName}
            />
            <AvatarFallback className='text-xs'>
              {inviterInitials}
            </AvatarFallback>
          </Avatar>
          <div className='flex flex-col min-w-0'>
            <span className='text-sm line-clamp-1'>
              Invited by{' '}
              <span className='font-medium'>{inviterDisplayName}</span>
            </span>
            <span className='text-xs text-muted-foreground'>
              {formatDate(createdAt)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className='flex gap-2 pt-2'>
          <Button
            variant='outline'
            className='flex-1 rounded-button'
            onClick={handleDecline}
            disabled={isDeclining || isAccepting}
          >
            {isDeclining ? (
              <Icons.spinner className='size-4 animate-spin mr-2' />
            ) : (
              <Icons.close className='size-4 mr-2' />
            )}
            Decline
          </Button>
          <Button
            className='flex-1 rounded-button'
            onClick={handleAccept}
            disabled={isDeclining || isAccepting}
          >
            {isAccepting ? (
              <Icons.spinner className='size-4 animate-spin mr-2' />
            ) : (
              <Icons.check className='size-4 mr-2' />
            )}
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
