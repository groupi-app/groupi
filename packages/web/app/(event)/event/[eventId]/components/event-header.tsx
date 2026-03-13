'use client';

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { Icons } from '@/components/icons';
import { StickerIcon } from '@/components/atoms';
import Link from 'next/link';
import { DeleteEventDialog } from './deleteEventDialog';
import { EventRSVP } from './event-rsvp';
import { LeaveEventDialog } from './leaveEventDialog';
import { ReportDialog } from '@/components/report-dialog';
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
  useMarkEventNotificationsAsRead,
  useEventHeaderData,
} from '@/hooks/convex';
import { useIsEventMuted, useToggleEventMute } from '@/hooks/convex/use-muting';
import { calculateObjectPosition } from '@/components/image-focal-point-picker';

// Type for the data prop (inferred from useEventHeaderData return type)
type EventHeaderDataType = NonNullable<ReturnType<typeof useEventHeaderData>>;

interface EventHeaderProps {
  data: EventHeaderDataType;
}

/**
 * Event header component - receives data from context
 * - Data is pre-loaded by EventDataProvider in layout
 * - Still uses hooks for mutations (muting, notifications)
 * - No loading state needed - data is guaranteed
 */
export function EventHeader({ data }: EventHeaderProps) {
  // Extract eventId from data for hooks and links
  const eventIdTyped = data.event._id;
  const eventId = data.event._id as string;

  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  // State hooks
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
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
    const timer = setTimeout(async () => {
      try {
        await markEventNotificationsAsRead(eventIdTyped);
      } catch (err) {
        // Silently fail - don't block page rendering
        console.error('Failed to mark event notifications as read:', err);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [eventIdTyped, markEventNotificationsAsRead]);

  // Extract data from props (guaranteed to be present)
  const { event, userMembership } = data;

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

  // Data is guaranteed by parent - no loading/error checks needed

  const {
    title,
    location,
    chosenDateTime,
    chosenEndDateTime,
    description,
    visibility,
  } = event;

  const visibilityLabel =
    visibility === 'FRIENDS'
      ? 'Friends'
      : visibility === 'PUBLIC'
        ? 'Public'
        : 'Private';

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
        <Link href={`/event/${eventId}/manage-addons`}>
          <Button
            variant='ghost'
            className='w-full justify-start'
            onClick={() => setDrawerOpen(false)}
          >
            <Icons.sliders className='size-4 mr-2' />
            Manage Add-ons
          </Button>
        </Link>
        <Button
          variant='ghost'
          className='w-full justify-start hover:bg-destructive hover:text-destructive-foreground'
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
          className='w-full justify-start'
          onClick={() => {
            setDrawerOpen(false);
            setReportDialogOpen(true);
          }}
        >
          <Icons.flag className='size-4 mr-2' />
          Report Event
        </Button>
        <Button
          variant='ghost'
          className='w-full justify-start hover:bg-destructive hover:text-destructive-foreground'
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
            className='w-full aspect-[21/9] md:aspect-[32/9] overflow-hidden rounded-card mb-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-border shadow-raised'
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
                className='size-12 hover:bg-accent/80 transition-all rounded-md'
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
              <DropdownMenuTrigger className='size-12 hover:bg-accent/80 transition-all rounded-md flex items-center justify-center'>
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
                    <Link href={`/event/${eventId}/manage-addons`}>
                      <DropdownMenuItem className='cursor-pointer'>
                        <div className='flex items-center gap-1'>
                          <Icons.sliders className='size-4' />
                          <span>Manage Add-ons</span>
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
                  <>
                    <DropdownMenuItem
                      className='cursor-pointer'
                      onClick={() => setReportDialogOpen(true)}
                    >
                      <div className='flex items-center gap-1'>
                        <Icons.flag className='size-4' />
                        <span>Report Event</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
                      onClick={() => setLeaveDialogOpen(true)}
                    >
                      <div className='flex items-center gap-1'>
                        <Icons.leave className='size-4' />
                        <span>Leave Event</span>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className='flex flex-col gap-2'>
          {location && (
            <div className='flex items-center gap-2.5'>
              <StickerIcon icon={Icons.location} size='sm' color='success' />
              <span data-test='event-location' className='font-semibold'>
                {location}
              </span>
            </div>
          )}
          {eventDateStr != null ? (
            <div className='flex items-center gap-2.5'>
              <StickerIcon icon={Icons.date} size='sm' color='info' />
              <span data-test='event-datetime' className='font-semibold'>
                {eventDateStr}
              </span>
            </div>
          ) : userMembership.role === 'ORGANIZER' ? (
            <Link href={`/event/${eventId}/date-select`}>
              <Button className='flex items-center gap-2.5 px-4 py-2.5 h-auto text-base font-semibold rounded-card border-[3px]'>
                <Icons.date className='size-5' />
                Choose Date/Time
                <Icons.arrowRight className='size-4' />
              </Button>
            </Link>
          ) : (
            <Link href={`/event/${eventId}/availability`}>
              <Button className='flex items-center gap-2.5 px-4 py-2.5 h-auto text-base font-semibold rounded-card border-[3px]'>
                <Icons.date className='size-5' />
                Set Availability
                <Icons.arrowRight className='size-4' />
              </Button>
            </Link>
          )}
          <div className='flex items-center gap-2.5'>
            {visibility === 'FRIENDS' ? (
              <Icons.people className='size-4 text-muted-foreground/70' />
            ) : (
              <Icons.lock className='size-4 text-muted-foreground/70' />
            )}
            <span className='text-sm text-muted-foreground/70'>
              {visibilityLabel}
            </span>
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
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <ReportDialog
          targetType='EVENT'
          targetId={eventId}
          targetLabel={title}
          onClose={() => setReportDialogOpen(false)}
        />
      </Dialog>
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
