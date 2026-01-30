'use client';

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { DeleteEventDialog } from './deleteEventDialog';
import { EventRSVP } from './event-rsvp';
import { LeaveEventDialog } from './leaveEventDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
import {
  useEventManagement,
  useEventHeader,
  useMarkEventNotificationsAsRead,
} from '@/hooks/convex';
import { useIsEventMuted, useToggleEventMute } from '@/hooks/convex/use-muting';
import { EventHeaderSkeleton } from '@/components/skeletons';
import { NotFoundError, AccessDeniedError } from '@/components/error-display';
import { Id } from '@/convex/_generated/dataModel';
import { calculateObjectPosition } from '@/components/image-focal-point-picker';

interface EventHeaderProps {
  eventId: string;
}

/**
 * Client component with direct Convex hooks - Client-only pattern
 * - Uses useEventHeader hook for real-time event data
 * - Real-time updates via Convex subscriptions
 * - Loading states managed by component
 */
export function EventHeader({ eventId }: EventHeaderProps) {
  // Use the eventId prop directly for hooks
  const eventIdTyped = eventId as Id<'events'>;

  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  // State hooks
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [coverContainerSize, setCoverContainerSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const coverContainerRef = useRef<HTMLButtonElement>(null);

  // Platform hook
  const isMobile = useMobile();

  // Use direct Convex hook for real-time event data
  const eventData = useEventHeader(eventIdTyped);

  // Use management hooks for mutations
  // Note: Currently used for event/membership context that feeds into sub-components
  useEventManagement(eventIdTyped);

  // Auto-mark event-related notifications as read when page loads
  const markEventNotificationsAsRead = useMarkEventNotificationsAsRead();

  // Muting state (with optimistic updates)
  const { isMuted, setOptimisticMuted } = useIsEventMuted(eventIdTyped);
  const toggleMute = useToggleEventMute();

  const handleToggleMute = useCallback(async () => {
    setDrawerOpen(false);
    await toggleMute(eventIdTyped, isMuted, setOptimisticMuted);
  }, [eventIdTyped, isMuted, setOptimisticMuted, toggleMute]);

  // Callback hooks - must be called unconditionally
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

  // Handle cover image load to get natural dimensions
  const handleCoverImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      setImageNaturalSize({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
      if (coverContainerRef.current) {
        setCoverContainerSize({
          width: coverContainerRef.current.offsetWidth,
          height: coverContainerRef.current.offsetHeight,
        });
      }
    },
    []
  );

  // Update cover container size on window resize
  useEffect(() => {
    const updateCoverContainerSize = () => {
      if (coverContainerRef.current) {
        setCoverContainerSize({
          width: coverContainerRef.current.offsetWidth,
          height: coverContainerRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener('resize', updateCoverContainerSize);
    return () => window.removeEventListener('resize', updateCoverContainerSize);
  }, []);

  useEffect(() => {
    if (!eventId) return;

    const timer = setTimeout(async () => {
      try {
        await markEventNotificationsAsRead(eventIdTyped);
      } catch (err) {
        // Silently fail - don't block page rendering
        console.error('Failed to mark event notifications as read:', err);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [eventId, eventIdTyped, markEventNotificationsAsRead]);

  // Extract data from query result
  const event = eventData?.event;
  const userMembership = eventData?.userMembership;

  // Calculate correct object-position that centers the focal point
  const coverObjectPosition = useMemo(() => {
    const focalPoint = event?.imageFocalPoint;
    if (!focalPoint || !imageNaturalSize || !coverContainerSize) {
      return undefined;
    }
    const pos = calculateObjectPosition(
      focalPoint.x,
      focalPoint.y,
      imageNaturalSize.width,
      imageNaturalSize.height,
      coverContainerSize.width,
      coverContainerSize.height
    );
    return `${pos.x}% ${pos.y}%`;
  }, [event?.imageFocalPoint, imageNaturalSize, coverContainerSize]);

  // Check loading state (undefined = still loading)
  const isLoading = eventData === undefined;

  // Loading state - AFTER all hooks are called
  if (isLoading) {
    return <EventHeaderSkeleton />;
  }

  // Event not found (null = not found, or data loaded but event missing)
  if (eventData === null || !event) {
    return (
      <NotFoundError
        resourceType='event'
        message="This event doesn't exist or may have been deleted."
        showBackButton={true}
        showHomeButton={true}
      />
    );
  }

  // User is not a member of this event (access denied)
  if (!userMembership) {
    return (
      <AccessDeniedError
        message="You don't have access to this event. You may need an invite link to join."
        showBackButton={true}
        showHomeButton={true}
      />
    );
  }

  const { title, location, chosenDateTime, chosenEndDateTime, description } =
    event;

  // Format combined date string with start and optional end time
  const formatEventDateRange = (
    startTimestamp: number,
    endTimestamp?: number
  ): string => {
    const startDate = new Date(startTimestamp);

    const dateFormatOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };

    const timeOnlyOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
    };

    const startStr = startDate.toLocaleString([], dateFormatOptions);

    if (!endTimestamp) {
      return startStr;
    }

    const endDate = new Date(endTimestamp);

    // Check if same day (compare year, month, day)
    const isSameDay =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate();

    if (isSameDay) {
      // Same day: "Monday, 1/15/2024, 2:00 PM - 5:00 PM"
      const endTimeStr = endDate.toLocaleString([], timeOnlyOptions);
      return `${startStr} - ${endTimeStr}`;
    } else {
      // Different days: "Monday, 1/15/2024, 2:00 PM - Tuesday, 1/16/2024, 5:00 PM"
      const endStr = endDate.toLocaleString([], dateFormatOptions);
      return `${startStr} - ${endStr}`;
    }
  };

  const eventDateStr =
    chosenDateTime != null
      ? formatEventDateRange(chosenDateTime, chosenEndDateTime)
      : null;

  const menuItems =
    userMembership.role === 'ORGANIZER' ? (
      <>
        <Button
          variant='ghost'
          className='w-full justify-start'
          onClick={handleToggleMute}
        >
          {isMuted ? (
            <>
              <Icons.bell className='size-4 mr-2' />
              Unmute Event
            </>
          ) : (
            <>
              <Icons.bellOff className='size-4 mr-2' />
              Mute Event
            </>
          )}
        </Button>
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
      <>
        <Button
          variant='ghost'
          className='w-full justify-start'
          onClick={handleToggleMute}
        >
          {isMuted ? (
            <>
              <Icons.bell className='size-4 mr-2' />
              Unmute Event
            </>
          ) : (
            <>
              <Icons.bellOff className='size-4 mr-2' />
              Mute Event
            </>
          )}
        </Button>
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
      </>
    );

  return (
    <>
      <header className='flex flex-col md:my-5 max-w-4xl mx-auto gap-3'>
        {event.imageUrl && (
          <button
            ref={coverContainerRef}
            type='button'
            onClick={() => setLightboxOpen(true)}
            className='w-full aspect-[21/9] md:aspect-[32/9] overflow-hidden rounded-xl mb-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            style={{ touchAction: 'manipulation' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Convex storage URLs require native img */}
            <img
              src={event.imageUrl}
              alt={`Cover image for ${title}`}
              className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
              style={
                coverObjectPosition
                  ? { objectPosition: coverObjectPosition }
                  : undefined
              }
              onLoad={handleCoverImageLoad}
            />
          </button>
        )}
        <div className='flex justify-between flex-col-reverse gap-3 md:flex-row'>
          <div className='flex items-center gap-3'>
            <h1
              data-test='event-title'
              className='text-5xl font-heading font-medium'
            >
              {title}
            </h1>
            {isMuted && (
              <Icons.bellOff className='size-7 text-muted-foreground' />
            )}
          </div>
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
                <DropdownMenuItem
                  className='cursor-pointer'
                  onClick={handleToggleMute}
                >
                  <div className='flex items-center gap-1'>
                    {isMuted ? (
                      <>
                        <Icons.bell className='size-4' />
                        <span>Unmute Event</span>
                      </>
                    ) : (
                      <>
                        <Icons.bellOff className='size-4' />
                        <span>Mute Event</span>
                      </>
                    )}
                  </div>
                </DropdownMenuItem>
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
        <EventRSVP eventId={eventIdTyped} />
      </header>
      {userMembership.role === 'ORGANIZER' ? (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DeleteEventDialog eventId={eventIdTyped} />
        </Dialog>
      ) : (
        <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
          <LeaveEventDialog eventId={eventIdTyped} />
        </Dialog>
      )}
      {event.imageUrl && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className='max-w-4xl max-h-[90vh] p-0 overflow-hidden'>
            <VisuallyHidden>
              <DialogTitle>Event Cover Image</DialogTitle>
            </VisuallyHidden>
            {/* eslint-disable-next-line @next/next/no-img-element -- Convex storage URLs require native img */}
            <img
              src={event.imageUrl}
              alt={`Cover image for ${title}`}
              className='w-full h-auto max-h-[85vh] object-contain'
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
