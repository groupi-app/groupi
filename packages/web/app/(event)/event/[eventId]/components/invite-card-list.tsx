'use client';
import { LayoutGroup, motion } from 'framer-motion';
import { useState } from 'react';
import { DeleteInvites } from './delete-invites';
import { Icons } from '@/components/icons';
import { InviteLinkCard } from './invite-link-card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useEventInvites } from '@/hooks/convex/use-invites';
import {
  useSentEventInvites,
  useCancelEventInvite,
  SentEventInvite,
} from '@/hooks/convex/use-event-invites';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { UnifiedInviteDialog } from '@/components/unified-invite-dialog';
import { useInviteDialogStore } from '@/stores/invite-dialog-store';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * Client component with Convex real-time subscriptions
 * - Uses Convex useQuery for real-time data with automatic updates
 * - No need for React Query or Pusher - Convex handles everything
 * - Invite changes update automatically via Convex subscriptions
 */
export function InviteCardList({ eventId }: { eventId: Id<'events'> }) {
  const [showValid, setShowValid] = useState(true);
  const [showExpired, setShowExpired] = useState(false);
  const [selectedInvites, setSelectedInvites] = useState<Id<'invites'>[]>([]);

  // Use Convex hook for real-time invite data
  const inviteData = useEventInvites(eventId);

  // Unified invite dialog store
  const openInviteDialog = useInviteDialogStore(state => state.openDialog);

  // Get sent internal invites (username invites)
  const sentInvites = useSentEventInvites(eventId);
  const cancelInvite = useCancelEventInvite();

  // Filter to only show pending internal invites
  const pendingInternalInvites = (sentInvites ?? []).filter(
    (invite: SentEventInvite) => invite.status === 'PENDING'
  );

  // Loading state - show actual structure with skeleton placeholders
  if (inviteData === undefined) {
    return (
      <div>
        {/* Header - actual title with skeleton action buttons */}
        <div className='flex items-center mt-4 gap-4 flex-wrap'>
          <h1 className='font-heading font-medium text-4xl'>Invites</h1>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-10 w-32 rounded-button' />
            <Skeleton className='h-10 w-10 rounded-button' />
            <Skeleton className='h-10 w-10 rounded-button' />
          </div>
        </div>

        {/* Valid section header */}
        <div className='flex items-center gap-2 ml-2 mt-4'>
          <Skeleton className='size-6 rounded-md' />
          <div className='flex items-center gap-1'>
            <h1 className='font-heading text-2xl text-muted-foreground'>
              Valid
            </h1>
            <Skeleton className='size-6' />
          </div>
        </div>

        {/* Invite card skeletons */}
        <div className='flex flex-col gap-2 py-4'>
          <InviteCardSkeleton />
          <InviteCardSkeleton />
          <InviteCardSkeleton />
        </div>

        {/* Expired section header */}
        <div className='flex items-center gap-2 ml-2 mt-4'>
          <Skeleton className='size-6 rounded-md' />
          <div className='flex items-center gap-1'>
            <h1 className='font-heading text-2xl text-muted-foreground'>
              Expired
            </h1>
            <Skeleton className='size-6' />
          </div>
        </div>
      </div>
    );
  }

  const invites = inviteData.invites;

  const valid = invites.filter((invite: Doc<'invites'>) => {
    if (invite.expiresAt) {
      const expiresAt = new Date(invite.expiresAt);
      if (expiresAt.getTime() <= new Date().getTime()) return false;
    }
    return invite.usesRemaining === undefined || invite.usesRemaining > 0;
  });

  const expired = invites.filter((invite: Doc<'invites'>) => {
    if (invite.expiresAt) {
      const expiresAt = new Date(invite.expiresAt);
      if (expiresAt.getTime() >= new Date().getTime()) return false;
    }
    return invite.usesRemaining !== undefined && invite.usesRemaining === 0;
  });

  return (
    <div>
      <div className='flex items-center mt-4 gap-4 flex-wrap'>
        <h1 className='font-heading font-medium text-4xl'>Invites</h1>
        <div className='flex items-center gap-2'>
          <Button onClick={() => openInviteDialog(eventId, 'link')}>
            <Icons.invite className='size-4 mr-2' />
            Invite
          </Button>
          <DeleteInvites
            selectedInvites={selectedInvites}
            setSelectedInvites={setSelectedInvites}
            eventId={eventId}
          />
        </div>
        <UnifiedInviteDialog />
      </div>
      <div className='flex items-center gap-2 ml-2 mt-4'>
        <Checkbox
          className='size-6 hover:bg-primary transition-all'
          checked={valid.every((invite: Doc<'invites'>) =>
            selectedInvites.includes(invite._id)
          )}
          onCheckedChange={() => {
            if (
              valid.every((invite: Doc<'invites'>) =>
                selectedInvites.includes(invite._id)
              )
            ) {
              setSelectedInvites([]);
            } else {
              setSelectedInvites(
                valid.map((invite: Doc<'invites'>) => invite._id)
              );
            }
          }}
        />
        <button
          onClick={() => {
            setShowValid(!showValid);
          }}
        >
          <div>
            <div className='flex items-center gap-1 transition-all text-muted-foreground hover:text-accent-foreground'>
              <h1 className='font-heading text-2xl '>Valid ({valid.length})</h1>
              <div className='size-6'>
                {showValid ? (
                  <Icons.up className='w-full h-full' />
                ) : (
                  <Icons.down className='w-full h-full' />
                )}
              </div>
            </div>
          </div>
        </button>
      </div>
      {showValid && (
        <motion.div
          variants={container}
          initial='hidden'
          animate='show'
          className='flex flex-col gap-2 py-4'
        >
          <LayoutGroup>
            {valid.map((invite: Doc<'invites'>) => (
              <motion.div
                layout
                key={invite._id}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  opacity: { duration: 0.2 },
                  y: { duration: 0.2 },
                }}
              >
                <InviteLinkCard
                  selectedInvites={selectedInvites}
                  setSelectedInvites={setSelectedInvites}
                  invite={invite}
                />
              </motion.div>
            ))}
          </LayoutGroup>
        </motion.div>
      )}
      <div className='flex items-center gap-2 ml-2 mt-4'>
        <Checkbox
          className='size-6 hover:bg-primary transition-all'
          checked={
            expired.length > 0 &&
            expired.every((invite: Doc<'invites'>) =>
              selectedInvites.includes(invite._id)
            )
          }
          onCheckedChange={() => {
            if (
              expired.every((invite: Doc<'invites'>) =>
                selectedInvites.includes(invite._id)
              )
            ) {
              setSelectedInvites([]);
            } else {
              setSelectedInvites(
                expired.map((invite: Doc<'invites'>) => invite._id)
              );
            }
          }}
        />
        <button
          onClick={() => {
            setShowExpired(!showExpired);
          }}
        >
          <div>
            <div className='flex items-center gap-1 transition-all text-muted-foreground hover:text-accent-foreground'>
              <h1 className='font-heading text-2xl '>
                Expired ({expired.length})
              </h1>
              <div className='size-6'>
                {showExpired ? (
                  <Icons.up className='w-full h-full' />
                ) : (
                  <Icons.down className='w-full h-full' />
                )}
              </div>
            </div>
          </div>
        </button>
      </div>
      {showExpired && (
        <motion.div
          variants={container}
          initial='hidden'
          animate='show'
          className='flex flex-col gap-2 py-4'
        >
          <LayoutGroup>
            {expired.map((invite: Doc<'invites'>) => (
              <motion.div
                layout
                key={invite._id}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  opacity: { duration: 0.2 },
                  y: { duration: 0.2 },
                }}
              >
                <InviteLinkCard
                  selectedInvites={selectedInvites}
                  setSelectedInvites={setSelectedInvites}
                  invite={invite}
                />
              </motion.div>
            ))}
          </LayoutGroup>
        </motion.div>
      )}

      {/* Pending Internal Invites Section */}
      {pendingInternalInvites.length > 0 && (
        <div className='mt-8'>
          <div className='flex items-center gap-2 mb-4'>
            <User className='size-5 text-muted-foreground' />
            <h2 className='font-heading text-2xl text-muted-foreground'>
              Pending User Invites ({pendingInternalInvites.length})
            </h2>
          </div>
          <motion.div
            variants={container}
            initial='hidden'
            animate='show'
            className='flex flex-col gap-2'
          >
            <LayoutGroup>
              {pendingInternalInvites.map((invite: SentEventInvite) => (
                <PendingInternalInviteCard
                  key={invite.inviteId}
                  invite={invite}
                  onCancel={cancelInvite}
                />
              ))}
            </LayoutGroup>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/**
 * InviteCardSkeleton - Skeleton for a single invite card
 * Matches InviteLinkCard: checkbox, name/created, time, uses, delete button
 */
function InviteCardSkeleton() {
  return (
    <div className='relative max-w-3xl'>
      {/* Checkbox placeholder */}
      <Skeleton className='size-6 absolute left-4 top-4 md:top-0 md:bottom-0 my-auto rounded-md' />

      {/* Card body */}
      <div className='border border-border shadow-floating rounded-lg py-3 px-6 bg-card'>
        <div className='flex items-center md:pl-8'>
          <div className='flex md:items-center gap-2 md:gap-8 flex-col md:flex-row w-full'>
            {/* Name and created date */}
            <div className='pl-8 md:pl-0 pr-8 md:pr-0 md:w-2/5'>
              <Skeleton className='h-7 w-48 mb-1' />
              <Skeleton className='h-4 w-32' />
            </div>

            {/* Time and uses */}
            <div className='flex items-center gap-4 md:gap-8 px-3'>
              {/* Time until expiry */}
              <div className='flex items-center gap-1'>
                <Skeleton className='size-8 rounded-full' />
                <Skeleton className='h-5 w-16' />
              </div>

              {/* Uses remaining */}
              <div className='flex items-center gap-1'>
                <Skeleton className='size-8 rounded-full' />
                <Skeleton className='h-5 w-12' />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete button placeholder */}
      <Skeleton className='size-10 absolute right-4 top-3 md:top-0 md:bottom-0 my-auto rounded-button' />
    </div>
  );
}

/**
 * PendingInternalInviteCard - Card for a pending internal (username) invite
 */
function PendingInternalInviteCard({
  invite,
  onCancel,
}: {
  invite: SentEventInvite;
  onCancel: (inviteId: Id<'eventInvites'>) => Promise<{ success: boolean }>;
}) {
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancel(invite.inviteId);
    } finally {
      setIsCancelling(false);
    }
  };

  const inviteeDisplayName =
    invite.invitee.name || invite.invitee.username || 'Unknown User';
  const inviteeInitials = inviteeDisplayName.slice(0, 2).toUpperCase();

  return (
    <motion.div
      layout
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        opacity: { duration: 0.2 },
        y: { duration: 0.2 },
      }}
    >
      <div className='relative max-w-3xl'>
        <div className='border border-border shadow-raised rounded-card py-3 px-4 bg-card'>
          <div className='flex items-center gap-4'>
            {/* Avatar */}
            <Avatar className='size-10'>
              <AvatarImage
                src={invite.invitee.image || undefined}
                alt={inviteeDisplayName}
              />
              <AvatarFallback>{inviteeInitials}</AvatarFallback>
            </Avatar>

            {/* Name and details */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2'>
                <p className='font-medium truncate'>{inviteeDisplayName}</p>
                <Badge
                  variant='outline'
                  className='text-xs bg-bg-warning-subtle text-warning border-border-warning'
                >
                  Pending
                </Badge>
                <Badge variant='secondary' className='text-xs'>
                  {invite.role === 'MODERATOR' ? 'Moderator' : 'Attendee'}
                </Badge>
              </div>
              {invite.invitee.username && invite.invitee.name && (
                <p className='text-sm text-muted-foreground'>
                  @{invite.invitee.username}
                </p>
              )}
              <p className='text-xs text-muted-foreground'>
                Invited {formatDate(invite.createdAt)}
              </p>
            </div>

            {/* Cancel button */}
            <Button
              variant='ghost'
              size='icon'
              onClick={handleCancel}
              disabled={isCancelling}
              className='size-9 text-muted-foreground hover:text-error hover:bg-bg-error-subtle'
            >
              {isCancelling ? (
                <Icons.spinner className='size-4 animate-spin' />
              ) : (
                <Icons.close className='size-4' />
              )}
            </Button>
          </div>

          {/* Message preview if present */}
          {invite.message && (
            <div className='mt-3 pt-3 border-t border-border'>
              <p className='text-sm text-muted-foreground italic line-clamp-2'>
                &ldquo;{invite.message}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
