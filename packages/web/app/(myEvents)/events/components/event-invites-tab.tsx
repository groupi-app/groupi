'use client';

import { useCallback } from 'react';
import { EventInviteItem } from './event-invite-item';
import {
  useAcceptEventInvite,
  useDeclineEventInvite,
  EventInvite,
} from '@/hooks/convex/use-event-invites';
import { Id } from '@/convex/_generated/dataModel';
import { Icons } from '@/components/icons';

interface EventInvitesTabProps {
  /** Pending invites passed from parent (pre-fetched with events) */
  invites: EventInvite[];
}

/**
 * EventInvitesTab - Displays pending event invites for the current user
 * Receives invites as props from the parent page (fetched together with events)
 */
export function EventInvitesTab({ invites }: EventInvitesTabProps) {
  const acceptInvite = useAcceptEventInvite();
  const declineInvite = useDeclineEventInvite();

  const handleAccept = useCallback(
    async (inviteId: Id<'eventInvites'>, eventId: Id<'events'>) => {
      await acceptInvite(inviteId, eventId);
    },
    [acceptInvite]
  );

  const handleDecline = useCallback(
    async (inviteId: Id<'eventInvites'>) => {
      await declineInvite(inviteId);
    },
    [declineInvite]
  );

  // Empty state
  if (invites.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <div className='rounded-full bg-muted/50 p-4 mb-4'>
          <Icons.inbox className='size-8 text-muted-foreground' />
        </div>
        <h3 className='font-heading text-lg font-medium mb-1'>
          No pending invites
        </h3>
        <p className='text-muted-foreground text-sm max-w-sm'>
          When someone invites you to an event, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {invites.map((invite: EventInvite) => (
        <EventInviteItem
          key={invite.inviteId}
          inviteId={invite.inviteId}
          eventId={invite.eventId}
          eventTitle={invite.eventTitle}
          eventDescription={invite.eventDescription}
          eventImageUrl={invite.eventImageUrl}
          eventLocation={invite.eventLocation}
          eventDateTime={invite.eventDateTime}
          eventVisibility={invite.eventVisibility}
          memberCount={invite.memberCount}
          role={invite.role}
          message={invite.message}
          createdAt={invite.createdAt}
          inviter={invite.inviter}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      ))}
    </div>
  );
}
