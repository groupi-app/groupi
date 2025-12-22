'use client';
import { LayoutGroup, motion } from 'framer-motion';
import { useState } from 'react';
import { AddInvite } from './add-invite';
import { DeleteInvites } from './delete-invites';
import { Icons } from '@/components/icons';
import { InviteLinkCard } from './invite-link-card';
import { Checkbox } from '@/components/ui/checkbox';
import { usePusherRealtime } from '@/hooks/use-pusher-realtime';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchEventInvites } from '@/lib/queries/invite-queries';
import { qk } from '@/lib/query-keys';
import type { EventInvitePageData, EventInviteData } from '@groupi/schema/data';

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
 * Client component with hybrid caching + realtime
 * - Receives cached initial data from server for fast load (SSR/PPR)
 * - React Query manages client-side state for optimistic updates
 * - Pusher syncs real-time updates via setQueryData (no router.refresh)
 */
export function InviteCardListClient({
  eventId,
  initialData,
}: {
  eventId: string;
  initialData: EventInvitePageData;
}) {
  const queryClient = useQueryClient();
  const [showValid, setShowValid] = useState(true);
  const [showExpired, setShowExpired] = useState(false);
  const [selectedInvites, setSelectedInvites] = useState<string[]>([]);

  // React Query manages client-side state
  // Don't use select - extract invites in component to preserve animation state
  const { data: invitePageData } = useQuery({
    queryKey: qk.invites.management(eventId),
    queryFn: () => fetchEventInvites(eventId),
    initialData,
    staleTime: 30 * 1000, // Consider fresh for 30s (matches server cache TTL)
  });

  const invites = invitePageData?.invites || initialData.invites;

  // Sync with Pusher invite changes using setQueryData (no router.refresh)
  usePusherRealtime({
    channel: `event-${eventId}-invites`,
    event: 'invite-changed',
    tags: [`event-${eventId}`, `event-${eventId}-invites`],
    queryKey: qk.invites.management(eventId),
    // Custom handlers to update EventInvitePageData structure
    onInsert: data => {
      // Data from Pusher is EventInviteData
      const newInvite = data as EventInviteData;

      queryClient.setQueryData<EventInvitePageData>(
        qk.invites.management(eventId),
        old => {
          if (!old) return old;

          // Check if invite already exists (avoid duplicates)
          const exists = old.invites.some(i => i.id === newInvite.id);
          if (exists) {
            return old;
          }

          // Check if there's an optimistic invite to replace
          // Match by name and eventId to find the corresponding optimistic invite
          // Prefer the most recent optimistic invite (last one in array, since they're added at the start)
          const optimisticInvites = old.invites
            .map((i, idx) => ({ invite: i, index: idx }))
            .filter(({ invite }) => invite.id.startsWith('optimistic-'));

          // Find the most recent optimistic invite that matches
          // Match by name and eventId (most reliable fields)
          // Handle case where optimistic invite has 'New Invite' fallback but server returns null
          const matchingOptimistic = optimisticInvites.find(({ invite: i }) => {
            const eventIdMatch = i.eventId === newInvite.eventId;
            if (!eventIdMatch) return false;

            // Name matching: handle exact match, both null, or 'New Invite' fallback case
            const nameMatch =
              i.name === newInvite.name || // Exact match
              (!i.name && !newInvite.name) || // Both null/undefined
              (i.name === 'New Invite' && !newInvite.name) || // Optimistic fallback vs null
              (!i.name && newInvite.name === 'New Invite'); // Null vs optimistic fallback (shouldn't happen but handle it)

            return nameMatch;
          });

          const optimisticIndex = matchingOptimistic?.index ?? -1;

          if (optimisticIndex !== -1) {
            // Replace optimistic invite with real one in place (same position)
            // This prevents glitching because Framer Motion sees it as the same item
            // Also remove any other optimistic invites (cleanup stale ones)
            return {
              ...old,
              invites: old.invites
                .map((i, idx) => (idx === optimisticIndex ? newInvite : i))
                .filter(
                  (i, idx) =>
                    idx === optimisticIndex || !i.id.startsWith('optimistic-')
                ),
            };
          }

          // Clean up any stale optimistic invites before adding new one
          const withoutStaleOptimistic = old.invites.filter(
            i => !i.id.startsWith('optimistic-')
          );

          // No optimistic invite to replace, add new one
          return {
            ...old,
            invites: [newInvite, ...withoutStaleOptimistic],
          };
        }
      );
    },
    onUpdate: data => {
      // Data from Pusher is EventInviteData
      const updatedInvite = data as EventInviteData;

      queryClient.setQueryData<EventInvitePageData>(
        qk.invites.management(eventId),
        old => {
          if (!old) return old;

          return {
            ...old,
            invites: old.invites.map(i =>
              i.id === updatedInvite.id ? updatedInvite : i
            ),
          };
        }
      );
    },
    onDelete: data => {
      const deletedInvite = data as { id: string };
      queryClient.setQueryData<EventInvitePageData>(
        qk.invites.management(eventId),
        old => {
          if (!old) return old;

          // Check if invite exists before removing (avoid removing wrong invite if event arrives late)
          const exists = old.invites.some(i => i.id === deletedInvite.id);
          if (!exists) {
            // Invite already removed (optimistically or by another event), skip
            return old;
          }

          return {
            ...old,
            invites: old.invites.filter(i => i.id !== deletedInvite.id),
          };
        }
      );
    },
  });

  const valid = invites.filter(invite => {
    if (invite.expiresAt) {
      const expiresAt =
        invite.expiresAt instanceof Date
          ? invite.expiresAt
          : new Date(invite.expiresAt);
      if (expiresAt.getTime() <= new Date().getTime()) return false;
    }
    return invite.usesRemaining === null || invite.usesRemaining > 0;
  });

  const expired = invites.filter(invite => {
    if (invite.expiresAt) {
      const expiresAt =
        invite.expiresAt instanceof Date
          ? invite.expiresAt
          : new Date(invite.expiresAt);
      if (expiresAt.getTime() >= new Date().getTime()) return false;
    }
    return invite.usesRemaining !== null && invite.usesRemaining === 0;
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
          variants={container}
          initial='hidden'
          animate='show'
          className='flex flex-col gap-2 py-4'
        >
          <LayoutGroup>
            {valid.map(invite => (
              <motion.div
                layout
                key={invite.id}
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
          variants={container}
          initial='hidden'
          animate='show'
          className='flex flex-col gap-2 py-4'
        >
          <LayoutGroup>
            {expired.map(invite => (
              <motion.div
                layout
                key={invite.id}
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
