'use client';
import { LayoutGroup, motion } from 'framer-motion';
import { useState } from 'react';
import { AddInvite } from './add-invite';
import { DeleteInvites } from './delete-invites';
import { Icons } from '@/components/icons';
import { InviteLinkCard } from './invite-link-card';
import { Checkbox } from '@/components/ui/checkbox';
import { useEventInvites } from '@/hooks/convex/use-invites';
import { Doc, Id } from '@/convex/_generated/dataModel';

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

  // Loading state
  if (inviteData === undefined) {
    return (
      <div className='animate-pulse'>
        <div className='h-8 bg-muted rounded w-32 mb-4'></div>
        <div className='space-y-2'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='h-16 bg-muted rounded'></div>
          ))}
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
          <AddInvite eventId={eventId} />
          <DeleteInvites
            selectedInvites={selectedInvites}
            setSelectedInvites={setSelectedInvites}
            eventId={eventId}
          />
        </div>
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
    </div>
  );
}
