'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn, formatDateTimeRangeShort } from '@/lib/utils';
import { StickerIcon } from '@/components/atoms';
import { Id } from '@/convex/_generated/dataModel';
import { useState } from 'react';
import { useJoinDiscoverableEvent } from '@/hooks/convex/use-events';
import { useRouter } from 'next/navigation';

interface DiscoverableEvent {
  eventId: Id<'events'>;
  title: string;
  description: string | null;
  location: string | null;
  chosenDateTime: number | null;
  chosenEndDateTime: number | null;
  imageUrl: string | null;
  memberCount: number;
  createdAt: number;
  organizer: {
    personId: Id<'persons'>;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
}

// Gradient patterns for events without images
const gradientPatterns = [
  'from-primary/20 to-secondary/20',
  'from-accent/30 to-muted/30',
  'from-muted/40 to-card/20',
  'from-secondary/25 to-accent/25',
  'from-card/30 to-primary/15',
];

function DiscoverEventCard({ event }: { event: DiscoverableEvent }) {
  const [isJoining, setIsJoining] = useState(false);
  const joinEvent = useJoinDiscoverableEvent();
  const router = useRouter();

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await joinEvent(event.eventId);
      router.push(`/event/${event.eventId}`);
    } catch {
      // Error toast handled by hook
    } finally {
      setIsJoining(false);
    }
  };

  // Consistent gradient based on event ID
  const gradientIndex =
    event.eventId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    gradientPatterns.length;
  const gradientClass = gradientPatterns[gradientIndex];

  const organizerName =
    event.organizer?.name || event.organizer?.username || 'Someone';
  const organizerInitials = organizerName.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-card shadow-raised bg-card',
        'transition-all duration-fast ease-bounce',
        'hover:shadow-floating'
      )}
    >
      {/* Cover image area */}
      <div className='relative aspect-[16/9] overflow-hidden'>
        {event.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- Convex storage URLs require native img */
          <img
            src={event.imageUrl}
            alt={event.title}
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

        {/* Friends badge - top left */}
        <div className='absolute top-3 left-3 bg-info text-info-foreground px-2.5 py-1 rounded-badge text-xs font-semibold shadow-raised border-2 border-white w-fit'>
          Friends Event
        </div>
      </div>

      {/* Content area */}
      <div className='p-4 flex flex-col gap-3'>
        {/* Title */}
        <h3 className='font-heading text-lg font-medium line-clamp-1'>
          {event.title}
        </h3>

        {/* Description */}
        {event.description && (
          <p className='text-sm text-muted-foreground line-clamp-2'>
            {event.description}
          </p>
        )}

        {/* Date/Time */}
        <div className='flex items-center gap-2 text-sm'>
          <StickerIcon icon={Icons.date} size='xs' color='info' />
          <span className='text-muted-foreground'>
            {event.chosenDateTime
              ? formatDateTimeRangeShort(
                  event.chosenDateTime,
                  event.chosenEndDateTime ?? undefined
                )
              : 'Date TBD'}
          </span>
        </div>

        {/* Location */}
        {event.location && (
          <div className='flex items-center gap-2 text-sm'>
            <StickerIcon icon={Icons.location} size='xs' color='success' />
            <span className='text-muted-foreground line-clamp-1'>
              {event.location}
            </span>
          </div>
        )}

        {/* Member count */}
        <div className='flex items-center gap-2 text-sm'>
          <StickerIcon icon={Icons.people} size='xs' color='primary' />
          <span className='text-muted-foreground'>
            {event.memberCount} {event.memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>

        {/* Visibility */}
        <div className='flex items-center gap-2 text-sm'>
          <Icons.people className='size-3.5 text-muted-foreground/60' />
          <span className='text-muted-foreground/60'>Friends</span>
        </div>

        {/* Organizer info */}
        <div className='flex items-center gap-2 pt-1 border-t border-border'>
          <Avatar className='size-6'>
            <AvatarImage
              src={event.organizer?.image || undefined}
              alt={organizerName}
            />
            <AvatarFallback className='text-xs'>
              {organizerInitials}
            </AvatarFallback>
          </Avatar>
          <span className='text-sm line-clamp-1'>
            Hosted by <span className='font-medium'>{organizerName}</span>
          </span>
        </div>

        {/* Join button */}
        <div className='pt-2'>
          <Button
            className='w-full rounded-button'
            onClick={handleJoin}
            disabled={isJoining}
          >
            {isJoining ? (
              <Icons.spinner className='size-4 animate-spin mr-2' />
            ) : (
              <Icons.check className='size-4 mr-2' />
            )}
            Join Event
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DiscoverTab({ events }: { events: DiscoverableEvent[] }) {
  if (events.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <Icons.search className='size-12 text-muted-foreground/30 mb-4' />
        <h3 className='text-lg font-medium mb-1'>No events to discover</h3>
        <p className='text-sm text-muted-foreground max-w-sm'>
          When your friends make their events discoverable, they&apos;ll appear
          here. Add more friends to see more events!
        </p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {events.map(event => (
        <DiscoverEventCard key={event.eventId} event={event} />
      ))}
    </div>
  );
}
