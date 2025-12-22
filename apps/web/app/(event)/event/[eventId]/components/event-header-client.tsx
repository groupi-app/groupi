'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Icons } from '@/components/icons';
import type { EventHeaderData } from '@groupi/schema/data';
import type { MembershipData } from '@groupi/schema';
import Link from 'next/link';
import { DeleteEventDialog } from './deleteEventDialog';
import { EventRSVP } from './event-rsvp';
import { LeaveEventDialog } from './leaveEventDialog';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { useMobile } from '@/hooks/use-mobile';
import type { MembershipWithAvailabilities } from '@/types';
import { usePusherRealtime } from '@/hooks/use-pusher-realtime';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchEventHeader } from '@/lib/queries/event-queries';
import { qk } from '@/lib/query-keys';

interface EventHeaderClientProps {
  eventId: string;
  event: EventHeaderData['event'];
  userMembership: EventHeaderData['userMembership'];
}

/**
 * Client component with hybrid caching + realtime
 * - Receives cached initial data from server for fast load (SSR/PPR)
 * - React Query manages client-side state for optimistic updates
 * - Pusher syncs real-time updates via setQueryData (no router.refresh)
 */
export function EventHeaderClient({
  eventId,
  event: initialEvent,
  userMembership: initialUserMembership,
}: EventHeaderClientProps) {
  const queryClient = useQueryClient();

  // React Query manages client-side state
  // Same pattern as replies - useQuery with initialData handles registration
  const { data: eventData } = useQuery({
    queryKey: qk.events.header(eventId),
    queryFn: () => fetchEventHeader(eventId),
    initialData: {
      event: initialEvent,
      userMembership: initialUserMembership,
    } as EventHeaderData,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5min (matches server cache TTL)
  });

  const event = eventData?.event || initialEvent;
  const userMembership = eventData?.userMembership || initialUserMembership;

  // Auto-mark event-related notifications as read when page loads
  // Import action lazily to avoid bundling issues with Next.js cache components
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const { markEventNotificationsAsReadAction } = await import('@/actions/notification-actions');
        await markEventNotificationsAsReadAction({ eventId });
      } catch (err) {
        // Silently fail - don't block page rendering
        console.error('Failed to mark event notifications as read:', err);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [eventId]);

  // Sync with Pusher event changes using setQueryData (no router.refresh)
  usePusherRealtime({
    channel: `event-${eventId}-header`,
    event: 'event-changed',
    tags: [`event-${eventId}`, `event-${eventId}-header`],
    queryKey: qk.events.header(eventId),
    // Custom handler to preserve nested structures
    onUpdate: data => {
      queryClient.setQueryData<EventHeaderData>(
        qk.events.header(eventId),
        (old: EventHeaderData | undefined) => {
          if (!old) return old;

          // Check if we received MembershipData (from RSVP updates)
          // MembershipData has: id, personId, eventId, role, rsvpStatus
          const isMembershipData =
            (data as MembershipData).rsvpStatus !== undefined &&
            (data as MembershipData).role !== undefined &&
            (data as MembershipData).eventId !== undefined;

          if (isMembershipData) {
            // This is an RSVP update - update userMembership if it matches current user
            const membershipData = data as MembershipData;
            if (membershipData.id === old.userMembership?.id) {
              return {
                ...old,
                userMembership: {
                  ...old.userMembership,
                  rsvpStatus: membershipData.rsvpStatus,
                  role: membershipData.role,
                },
              };
            }
            // If it's not the current user's membership, ignore (member-changed handles others)
            return old;
          }

          // Check if we received full EventHeaderData structure
          const isFullEventHeaderData =
            (data as EventHeaderData).event !== undefined &&
            (data as EventHeaderData).userMembership !== undefined;

          if (isFullEventHeaderData) {
            // Full EventHeaderData update - merge properly preserving userMembership
            const fullData = data as EventHeaderData;
            return {
              ...fullData,
              // Preserve userMembership from old data (it's user-specific)
              userMembership: old.userMembership,
              event: {
                ...fullData.event,
                // Ensure chosenDateTime is properly converted
                chosenDateTime: fullData.event.chosenDateTime
                  ? typeof fullData.event.chosenDateTime === 'string'
                    ? new Date(fullData.event.chosenDateTime)
                    : fullData.event.chosenDateTime instanceof Date
                      ? fullData.event.chosenDateTime
                      : new Date(fullData.event.chosenDateTime)
                  : null,
              },
            };
          }

          // Partial update - merge with existing data
          const updateData = data as Partial<EventHeaderData['event']> & {
            id?: string;
            chosenDateTimeId?: string;
            chosenDateTime?: Date | string | null;
          };

          return {
            ...old,
            event: {
              ...old.event,
              ...updateData,
              // Handle chosenDateTime conversion
              chosenDateTime:
                updateData.chosenDateTime !== undefined
                  ? updateData.chosenDateTime
                    ? typeof updateData.chosenDateTime === 'string'
                      ? new Date(updateData.chosenDateTime)
                      : updateData.chosenDateTime instanceof Date
                        ? updateData.chosenDateTime
                        : null
                    : null
                  : old.event.chosenDateTime,
            },
            // Preserve userMembership
            userMembership: old.userMembership,
          } as EventHeaderData;
        }
      );
    },
  });

  // Sync with Pusher membership changes (for current user's RSVP) using setQueryData
  usePusherRealtime({
    channel: `event-${eventId}-members`,
    event: 'member-changed',
    tags: [`event-${eventId}-members`, `event-${eventId}-header`],
    queryKey: qk.events.header(eventId),
    // Custom handler to update only user's membership
    onUpdate: data => {
      const updatedMembership = data as MembershipData;
      queryClient.setQueryData<EventHeaderData>(
        qk.events.header(eventId),
        (old: EventHeaderData | undefined) => {
          if (!old) return old;
          // Only update if this is the current user's membership
          if (updatedMembership?.id === old.userMembership?.id) {
            return {
              ...old,
              userMembership: {
                ...old.userMembership,
                rsvpStatus: updatedMembership.rsvpStatus,
                role: updatedMembership.role,
              },
            };
          }
          return old;
        }
      );
    },
  });

  const { title, location, chosenDateTime, description } = event;

  const eventDateStr =
    chosenDateTime != null
      ? (chosenDateTime instanceof Date
          ? chosenDateTime
          : new Date(chosenDateTime)
        ).toLocaleString([], {
          weekday: 'long',
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : null;

  const isMobile = useMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const handleMoreClick = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) {
        e.preventDefault();
        e.stopPropagation();
        setDrawerOpen(true);
      }
    },
    [isMobile]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isMobile) return;
      e.preventDefault();
      e.stopPropagation();
      setDrawerOpen(true);
    },
    [isMobile]
  );

  const menuItems = userMembership.role === 'ORGANIZER' ? (
    <>
      <Link href={`/event/${eventId}/edit`}>
        <Button
          variant='ghost'
          className='w-full justify-start'
          onClick={() => setDrawerOpen(false)}
        >
          <Icons.edit className='size-4 mr-2' />
          Edit Details
        </Button>
      </Link>
      <Link href={`/event/${eventId}/change-date`}>
        <Button
          variant='ghost'
          className='w-full justify-start'
          onClick={() => setDrawerOpen(false)}
        >
          <Icons.date className='size-4 mr-2' />
          Change Date
        </Button>
      </Link>
      <Button
        variant='ghost'
        className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10'
        onClick={() => {
          setDrawerOpen(false);
          setDeleteDialogOpen(true);
        }}
      >
        <Icons.delete className='size-4 mr-2' />
        Delete Event
      </Button>
    </>
  ) : (
    <Button
      variant='ghost'
      className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10'
      onClick={() => {
        setDrawerOpen(false);
        setLeaveDialogOpen(true);
      }}
    >
      <Icons.leave className='size-4 mr-2' />
      Leave Event
    </Button>
  );

  return (
    <>
      <header className='flex flex-col md:my-5 max-w-4xl mx-auto gap-3'>
        <div className='flex justify-between flex-col-reverse gap-3 md:flex-row'>
          <h1
            data-test='event-title'
            className='text-5xl font-heading font-medium'
          >
            {title}
          </h1>
          {isMobile ? (
            <>
              <Button
                variant='ghost'
                size='icon'
                className='size-12 hover:bg-accent transition-all rounded-md'
                onClick={handleMoreClick}
                onContextMenu={handleContextMenu}
                style={{ touchAction: 'manipulation' }}
              >
                <Icons.more className='size-8' />
              </Button>
              <Drawer
                open={drawerOpen}
                onOpenChange={open => {
                  // Prevent opening via onOpenChange - only allow via click/contextmenu handler
                  if (isMobile && open && !drawerOpen) {
                    return;
                  }
                  // Allow closing
                  if (!open) {
                    setDrawerOpen(false);
                  }
                }}
                modal={true}
              >
                <DrawerContent>
                  <DrawerHeader className='text-left'>
                    <VisuallyHidden>
                      <DrawerTitle>Event Options</DrawerTitle>
                    </VisuallyHidden>
                    <div className='flex flex-col gap-2 px-4 pb-4 pt-4'>
                      {menuItems}
                    </div>
                  </DrawerHeader>
                </DrawerContent>
              </Drawer>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className='size-12 hover:bg-accent transition-all rounded-md flex items-center justify-center'>
                <Icons.more className='size-8' />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {userMembership.role === 'ORGANIZER' ? (
                  <>
                    <Link href={`/event/${eventId}/edit`}>
                      <DropdownMenuItem className='cursor-pointer'>
                        <div className='flex items-center gap-1'>
                          <Icons.edit className='size-4' />
                          <span>Edit Details</span>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                    <Link href={`/event/${eventId}/change-date`}>
                      <DropdownMenuItem className='cursor-pointer'>
                        <div className='flex items-center gap-1'>
                          <Icons.date className='size-4' />
                          <span>Change Date</span>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem
                      className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <div className='flex items-center gap-1'>
                        <Icons.delete className='size-4' />
                        <span>Delete Event</span>
                      </div>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
                    onClick={() => setLeaveDialogOpen(true)}
                  >
                    <div className='flex items-center gap-1'>
                      <Icons.leave className='size-4' />
                      <span>Leave Event</span>
                    </div>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className='flex flex-col gap-2'>
          {location && (
            <div className='flex items-center gap-1 text-muted-foreground'>
              <Icons.location className='size-6 text-primary' />
              <span data-test='event-location'>{location}</span>
            </div>
          )}
          <div className='flex items-center gap-1 text-muted-foreground'>
            <Icons.date className='size-6 text-primary' />
            {eventDateStr != null ? (
              <span data-test='event-datetime'>{eventDateStr}</span>
            ) : userMembership.role === 'ORGANIZER' ? (
              <Link href={`/event/${eventId}/date-select`}>
                <Button
                  className='flex items-center gap-1'
                  variant={'ghost'}
                  size={'sm'}
                >
                  <span>Choose Date/Time</span>
                  <Icons.arrowRight className='size-4' />
                </Button>
              </Link>
            ) : (
              <Link href={`/event/${eventId}/availability`}>
                <Button
                  className='flex items-center gap-1'
                  variant={'ghost'}
                  size={'sm'}
                >
                  <span>Set Availability</span>
                  <Icons.arrowRight className='size-4' />
                </Button>
              </Link>
            )}
          </div>
        </div>
        {description && <p data-test='event-description'>{description}</p>}
        <EventRSVP
          title={title}
          dateTime={chosenDateTime}
          userMembership={userMembership as MembershipWithAvailabilities}
          eventId={eventId}
        />
      </header>
      {userMembership.role === 'ORGANIZER' ? (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DeleteEventDialog eventId={eventId} />
        </Dialog>
      ) : (
        <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
          <LeaveEventDialog eventId={eventId} />
        </Dialog>
      )}
    </>
  );
}
