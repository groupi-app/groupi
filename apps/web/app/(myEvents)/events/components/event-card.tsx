'use client';

import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { useState, useCallback } from 'react';
import { useMobile } from '@/hooks/use-mobile';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { DeleteEventDialog } from '@/app/(event)/event/[eventId]/components/deleteEventDialog';
import { LeaveEventDialog } from '@/app/(event)/event/[eventId]/components/leaveEventDialog';
import type { RoleType } from '@groupi/schema';

// Type for the event data that this component expects
// Simplified to match what we actually have from UserDashboardData.memberships[].event
type EventCardData = {
  id: string;
  title: string;
  description: string;
  location: string;
  chosenDateTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

interface EventCardProps {
  event: EventCardData;
  userRole: RoleType;
  eventId: string;
}

interface EventActionMenuProps {
  children: React.ReactNode;
  isMobile: boolean;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  handleContextMenu: (e: React.MouseEvent | React.TouchEvent) => void;
  handleClick: (e: React.MouseEvent) => void;
  isOrganizer: boolean;
  eventId: string;
  setDeleteDialogOpen: (open: boolean) => void;
  setLeaveDialogOpen: (open: boolean) => void;
}

function EventActionMenu({
  children,
  isMobile,
  sheetOpen,
  setSheetOpen,
  handleContextMenu,
  handleClick,
  isOrganizer,
  eventId,
  setDeleteDialogOpen,
  setLeaveDialogOpen,
}: EventActionMenuProps) {
  if (isMobile) {
    return (
      <Drawer
        open={sheetOpen}
        onOpenChange={open => {
          // Prevent opening via onOpenChange - only allow via contextmenu handler
          if (isMobile && open && !sheetOpen) {
            return;
          }
          // Allow closing
          if (!open) {
            setSheetOpen(false);
          }
        }}
        modal={true}
      >
        <div
          onContextMenu={handleContextMenu}
          onClick={handleClick}
          style={{ touchAction: 'manipulation' }}
        >
          {children}
        </div>
        <DrawerContent>
          <VisuallyHidden>
            <DrawerTitle>Event Options</DrawerTitle>
          </VisuallyHidden>
          <div className='flex flex-col gap-2 px-4 pb-4 pt-4'>
            {isOrganizer ? (
              <>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  asChild
                >
                  <Link href={`/event/${eventId}/edit`}>
                    <Icons.edit className='size-4 mr-2' />
                    Edit Details
                  </Link>
                </Button>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  asChild
                >
                  <Link href={`/event/${eventId}/change-date`}>
                    <Icons.date className='size-4 mr-2' />
                    Change Date
                  </Link>
                </Button>
                <Button
                  variant='ghost'
                  className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10'
                  onClick={() => {
                    setSheetOpen(false);
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
                  setSheetOpen(false);
                  setLeaveDialogOpen(true);
                }}
              >
                <Icons.leave className='size-4 mr-2' />
                Leave Event
              </Button>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <ContextMenu>
      {children}
      <ContextMenuContent>
        {isOrganizer ? (
          <>
            <ContextMenuItem className='cursor-pointer' asChild>
              <Link href={`/event/${eventId}/edit`}>
                <div className='flex items-center gap-1'>
                  <Icons.edit className='size-4' />
                  <span>Edit Details</span>
                </div>
              </Link>
            </ContextMenuItem>
            <ContextMenuItem className='cursor-pointer' asChild>
              <Link href={`/event/${eventId}/change-date`}>
                <div className='flex items-center gap-1'>
                  <Icons.date className='size-4' />
                  <span>Change Date</span>
                </div>
              </Link>
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={e => {
                e.preventDefault();
                setDeleteDialogOpen(true);
              }}
              className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
            >
              <div className='flex items-center gap-1'>
                <Icons.delete className='size-4' />
                <span>Delete Event</span>
              </div>
            </ContextMenuItem>
          </>
        ) : (
          <ContextMenuItem
            onSelect={e => {
              e.preventDefault();
              setLeaveDialogOpen(true);
            }}
            className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
          >
            <div className='flex items-center gap-1'>
              <Icons.leave className='size-4' />
              <span>Leave Event</span>
            </div>
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function EventCard({
  event,
  userRole,
  eventId,
}: EventCardProps) {
  const {
    id,
    title,
    description,
    location,
    chosenDateTime,
    createdAt,
    updatedAt,
  } = event;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const isMobile = useMobile();
  const isOrganizer = userRole === 'ORGANIZER';

  const handleContextMenu = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isMobile) return;
      e.preventDefault();
      e.stopPropagation();
      setSheetOpen(true);
    },
    [isMobile]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [isMobile]
  );

  const cardContent = (
    <Link href={`/event/${id}`}>
      <div className='flex flex-col gap-2 border border-border shadow-md p-4 px-6 hover:bg-accent transition-all cursor-pointer rounded-md'>
        <div className='flex flex-col md:flex-row gap-2 md:gap-8'>
          <div className='flex flex-col grow gap-2 md:w-1/2'>
            <h1 className='font-heading text-2xl'>{title}</h1>
            <p className='text-muted-foreground'>{description}</p>
            {/* Owner info removed - not available in current data structure */}
          </div>
          <div className='flex flex-col md:w-1/2 justify-between gap-2'>
            <div className='flex flex-col gap-2'>
              {location && (
                <div className='flex items-center gap-1 '>
                  <Icons.location className='size-6 text-primary' />
                  <span>{location}</span>
                </div>
              )}
              <div className='flex items-center gap-1 '>
                <Icons.date className='size-6 text-primary' />
                {chosenDateTime != null ? (
                  <span>
                    {new Date(chosenDateTime).toLocaleString([], {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                  </span>
                ) : (
                  <span>TBD</span>
                )}
              </div>
              {/* Member count removed - not available in current data structure */}
            </div>
            <div className='flex flex-col'>
              {/* Created at */}
              <div className='flex items-center gap-1 '>
                <span className='text-muted-foreground'>
                  Created {formatDate(new Date(createdAt))}
                </span>
              </div>
              {/* Last activity at*/}
              <div className='flex items-center gap-1 '>
                <span className='text-muted-foreground'>
                  Last activity {formatDate(new Date(updatedAt))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DeleteEventDialog eventId={eventId} />
      </Dialog>
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <LeaveEventDialog eventId={eventId} />
      </Dialog>
      <EventActionMenu
        isMobile={isMobile}
        sheetOpen={sheetOpen}
        setSheetOpen={setSheetOpen}
        handleContextMenu={handleContextMenu}
        handleClick={handleClick}
        isOrganizer={isOrganizer}
        eventId={eventId}
        setDeleteDialogOpen={setDeleteDialogOpen}
        setLeaveDialogOpen={setLeaveDialogOpen}
      >
        {isMobile ? (
          <div onContextMenu={handleContextMenu}>{cardContent}</div>
        ) : (
          <ContextMenuTrigger asChild>
            {cardContent}
          </ContextMenuTrigger>
        )}
      </EventActionMenu>
    </>
  );
}
