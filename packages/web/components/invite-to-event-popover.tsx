'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { Id } from '@/convex/_generated/dataModel';
import {
  useEventsForUserInvite,
  useSendEventInvite,
} from '@/hooks/convex/use-event-invites';
import { useMobile } from '@/hooks/use-mobile';
import { Check } from 'lucide-react';

type InvitableEvent = {
  eventId: string;
  title: string;
  location: string | null;
  chosenDateTime: number | null;
  memberCount: number;
  eventImageUrl: string | null;
  currentUserRole: string;
};

interface InviteToEventPopoverProps {
  targetPersonId: Id<'persons'>;
  children: React.ReactNode;
}

export function InviteToEventPopover({
  targetPersonId,
  children,
}: InviteToEventPopoverProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useMobile();

  if (isMobile) {
    return (
      <>
        <div onClick={() => setOpen(true)}>{children}</div>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Invite to Event</DrawerTitle>
            </DrawerHeader>
            <div className='pb-4 max-h-[60vh] overflow-y-auto'>
              <InviteToEventContent targetPersonId={targetPersonId} />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='start'>
        <InviteToEventContent targetPersonId={targetPersonId} />
      </PopoverContent>
    </Popover>
  );
}

function InviteToEventContent({
  targetPersonId,
}: {
  targetPersonId: Id<'persons'>;
}) {
  const events = useEventsForUserInvite(targetPersonId) as
    | InvitableEvent[]
    | undefined;
  const sendInvite = useSendEventInvite();
  const [sentEventIds, setSentEventIds] = useState<Set<string>>(new Set());
  const [sendingEventId, setSendingEventId] = useState<string | null>(null);

  const handleInvite = async (eventId: Id<'events'>) => {
    setSendingEventId(eventId);
    const result = await sendInvite(eventId, targetPersonId, 'ATTENDEE');
    if (result.success) {
      setSentEventIds(prev => new Set([...prev, eventId]));
    }
    setSendingEventId(null);
  };

  // Loading state
  if (events === undefined) {
    return (
      <div className='p-4 space-y-3'>
        <EventItemSkeleton />
        <EventItemSkeleton />
        <EventItemSkeleton />
      </div>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className='p-4 text-center'>
        <Icons.date className='size-8 mx-auto mb-2 text-muted-foreground opacity-50' />
        <p className='text-sm text-muted-foreground'>No events to invite to</p>
        <p className='text-xs text-muted-foreground mt-1'>
          This user is already in all your events, or you have no upcoming
          events.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className='max-h-[300px]'>
      <div className='p-1'>
        {events.map(event => {
          const isSent = sentEventIds.has(event.eventId);
          const isSending = sendingEventId === event.eventId;

          return (
            <button
              key={event.eventId}
              onClick={() =>
                !isSent && handleInvite(event.eventId as Id<'events'>)
              }
              disabled={isSent || isSending}
              className='w-full flex items-center gap-3 p-2.5 rounded-card hover:bg-accent/50 transition-colors text-left disabled:opacity-60 disabled:cursor-default'
            >
              <div className='flex-1 min-w-0 space-y-0.5'>
                <div className='font-medium text-sm truncate'>
                  {event.title}
                </div>
                <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                  <span className='flex items-center gap-1 whitespace-nowrap'>
                    <Icons.date className='size-3 text-info shrink-0' />
                    {event.chosenDateTime
                      ? new Date(event.chosenDateTime).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'TBD'}
                  </span>
                  {event.location && (
                    <span className='flex items-center gap-1 truncate'>
                      <Icons.location className='size-3 text-success shrink-0' />
                      <span className='truncate max-w-[80px]'>
                        {event.location}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className='shrink-0'>
                {isSent ? (
                  <span className='flex items-center gap-1 text-xs text-success'>
                    <Check className='size-3.5' />
                    Sent
                  </span>
                ) : isSending ? (
                  <Icons.spinner className='size-4 animate-spin text-muted-foreground' />
                ) : (
                  <span className='text-xs text-primary font-medium'>
                    Invite
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function EventItemSkeleton() {
  return (
    <div className='flex items-center gap-3 p-2.5'>
      <div className='flex-1 space-y-1.5'>
        <Skeleton className='h-4 w-28' />
        <Skeleton className='h-3 w-40' />
      </div>
      <Skeleton className='h-4 w-10' />
    </div>
  );
}
