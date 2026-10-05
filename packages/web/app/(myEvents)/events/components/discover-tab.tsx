'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn, formatDateTimeRangeShort } from '@/lib/utils';
import { StickerIcon } from '@/components/atoms';
import { useDiscoverableEvents } from '@/hooks/convex/use-event-admission';
import Link from 'next/link';

type DiscoverableEvent = NonNullable<
  ReturnType<typeof useDiscoverableEvents>
>[number];

// Gradient patterns for events without images
const gradientPatterns = [
  'from-primary/20 to-secondary/20',
  'from-accent/30 to-muted/30',
  'from-muted/40 to-card/20',
  'from-secondary/25 to-accent/25',
  'from-card/30 to-primary/15',
];

function DiscoverEventCard({ event }: { event: DiscoverableEvent }) {
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

        <div className='flex flex-wrap gap-2' aria-label='Your access reasons'>
          {event.accessReasons?.friends === true ? (
            <span className='bg-info text-info-foreground px-2 py-1 rounded-badge text-xs'>
              Shared by a friend
            </span>
          ) : null}
          {(event.accessReasons?.groups ?? []).map(group => (
            <span
              key={group.groupId}
              className='bg-secondary text-secondary-foreground px-2 py-1 rounded-badge text-xs'
            >
              Shared with {group.name}
            </span>
          ))}
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

        <p className='text-xs text-muted-foreground'>
          {event.entryAction === 'JOIN'
            ? 'Direct joining is available from the Event preview. Joining leaves your RSVP Pending.'
            : event.entryAction === 'APPLY'
              ? 'View the Event preview to apply for approval.'
              : event.entryAction === 'INVITATION_ONLY'
                ? 'An invitation is required to join. Sharing gives you access to Event logistics.'
                : 'Read Event logistics. Joining is currently unavailable.'}
        </p>
        <div className='pt-2'>
          <Button className='w-full rounded-button' asChild>
            <Link href={`/event/${event.eventId}/preview`}>View Event</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DiscoverTab({
  events,
}: {
  events: ReturnType<typeof useDiscoverableEvents>;
}) {
  if (events === undefined)
    return (
      <p role='status' className='py-6 text-muted-foreground'>
        Loading shared Events…
      </p>
    );
  if (events.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <Icons.search className='size-12 text-muted-foreground/30 mb-4' />
        <h3 className='text-lg font-medium mb-1'>No events to discover</h3>
        <p className='text-sm text-muted-foreground max-w-sm'>
          Upcoming and undated Events shared with you through eligible Groups or
          Friends will appear here. Your current access and completed required
          Group onboarding determine what you can discover.
        </p>
      </div>
    );
  }

  return (
    <div
      className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
      aria-label='Events shared with you'
    >
      {events.map(event => (
        <DiscoverEventCard key={event.eventId} event={event} />
      ))}
    </div>
  );
}
