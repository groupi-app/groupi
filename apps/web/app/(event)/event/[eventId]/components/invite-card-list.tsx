'use client';
import { useEventInvites } from '@groupi/hooks';
import { LayoutGroup, motion } from 'framer-motion';
import { useState } from 'react';
import { AddInvite } from './add-invite';
import { DeleteInvites } from './delete-invites';
import { Icons } from '@/components/icons';
import { InviteLinkCard } from './invite-link-card';
import { Checkbox } from '@/components/ui/checkbox';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export function InviteCardList({ eventId }: { eventId: string }) {
  const [showValid, setShowValid] = useState(true);
  const [showExpired, setShowExpired] = useState(false);
  const [selectedInvites, setSelectedInvites] = useState<string[]>([]);

  const { data, isLoading } = useEventInvites(eventId);

  if (isLoading || !data) {
    return <div>Loading invites...</div>;
  }

  const [error, inviteData] = data;

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return <div>Event not found</div>;
      case 'UnauthorizedError':
        return <div>You are not a member of this event</div>;
      case 'DatabaseError':
      case 'ConnectionError':
        return <div>Error loading invites</div>;
      default:
        return <div>An unexpected error occurred</div>;
    }
  }

  // If error is null, inviteData is guaranteed to exist
  const { invites } = inviteData;

  const valid = invites.filter(
    invite =>
      (!invite.expiresAt ||
        invite.expiresAt.getTime() > new Date().getTime()) &&
      (invite.usesRemaining === null || invite.usesRemaining > 0)
  );

  const expired = invites.filter(
    invite =>
      (invite.expiresAt && invite.expiresAt.getTime() < new Date().getTime()) ||
      (invite.usesRemaining !== null && invite.usesRemaining === 0)
  );

  return (
    <div>
      <div className='flex items-center mt-4 gap-4 flex-wrap'>
        <h1 className='font-heading font-medium text-4xl'>Invites</h1>
        <div className='flex items-center gap-2'>
          <AddInvite eventId={eventId} />
          <DeleteInvites
            selectedInvites={selectedInvites}
            setSelectedInvites={setSelectedInvites}
          />
        </div>
      </div>
      <div className='flex items-center gap-2 ml-2 mt-4'>
        <Checkbox
          className='size-6 hover:bg-primary transition-all'
          checked={valid.every(invite => selectedInvites.includes(invite.id))}
          onCheckedChange={() => {
            if (valid.every(invite => selectedInvites.includes(invite.id))) {
              setSelectedInvites([]);
            } else {
              setSelectedInvites(valid.map(invite => invite.id));
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
          initial='hidden'
          animate='show'
          variants={container}
          className='flex flex-col gap-2 py-4'
        >
          <LayoutGroup>
            {valid.map(invite => (
              <motion.div layout key={invite.id} variants={item}>
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
            expired.every(invite => selectedInvites.includes(invite.id))
          }
          onCheckedChange={() => {
            if (expired.every(invite => selectedInvites.includes(invite.id))) {
              setSelectedInvites([]);
            } else {
              setSelectedInvites(expired.map(invite => invite.id));
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
          initial='hidden'
          animate='show'
          variants={container}
          className='flex flex-col gap-2 py-4'
        >
          <LayoutGroup>
            {expired.map(invite => (
              <motion.div variants={item} key={invite.id}>
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
