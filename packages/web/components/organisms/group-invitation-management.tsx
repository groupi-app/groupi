'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useGroupInvites,
  useSendGroupInvite,
  useUpdateGroupInvitationPolicy,
} from '@/hooks/convex/use-group-invitations';
import { useBanGroupPerson } from '@/hooks/convex/use-group-moderation';
import { GroupConfirmedAction } from './group-confirmed-action';
import { GroupInvitationCard } from './group-invitation-card';
import { GroupPagination } from './group-pagination';

export function GroupInvitationManagement({
  groupId,
  invitationsEnabled,
  canManagePolicies,
}: {
  groupId: Id<'groups'>;
  invitationsEnabled: boolean;
  canManagePolicies: boolean;
}) {
  const ban = useBanGroupPerson();
  const [cursor, setCursor] = useState<string | null>(null);
  const invitations = useGroupInvites(groupId, { numItems: 20, cursor });
  return (
    <section
      className='space-y-4'
      aria-labelledby='group-invitation-management-heading'
    >
      <h2
        id='group-invitation-management-heading'
        className='text-lg font-semibold'
      >
        Group invitations
      </h2>
      {canManagePolicies && (
        <GroupInvitationPolicy
          groupId={groupId}
          invitationsEnabled={invitationsEnabled}
        />
      )}
      {invitationsEnabled ? (
        <GroupInviteSearch groupId={groupId} />
      ) : (
        <p className='text-sm text-muted-foreground'>
          New invitations are disabled for this Group.
        </p>
      )}
      <h3 className='font-semibold'>Invitation history</h3>
      {invitations === undefined ? (
        <p role='status'>Loading invitation history…</p>
      ) : (
        <>
          {invitations.page.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              No invitations sent.
            </p>
          )}
          {invitations.page.map(invitation => (
            <div key={invitation.inviteId} className='space-y-2'>
              <GroupInvitationCard invitation={invitation} manager />
              {invitation.canBan && (
                <GroupConfirmedAction
                  label={`Ban invited user ${invitation.invitee.name || invitation.invitee.username || 'Unavailable user'}`}
                  confirmation={`Confirm ban of invited user ${invitation.invitee.name || invitation.invitee.username || 'Unavailable user'}`}
                  explanation='This pending invitation cannot be accepted after a ban. New invitations and re-entry stay blocked until a manager lifts the ban. Independent Events remain unchanged.'
                  onConfirm={() =>
                    ban({ groupId, personId: invitation.invitee.personId })
                  }
                />
              )}
            </div>
          ))}
          <GroupPagination
            cursor={cursor}
            onCursor={setCursor}
            page={invitations}
            label='sent invitations'
          />
        </>
      )}
    </section>
  );
}

function GroupInvitationPolicy({
  groupId,
  invitationsEnabled,
}: {
  groupId: Id<'groups'>;
  invitationsEnabled: boolean;
}) {
  const update = useUpdateGroupInvitationPolicy();
  const [override, setOverride] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const enabled = override ?? invitationsEnabled;
  return (
    <form
      className='rounded-card border border-border p-4 space-y-3'
      onSubmit={async event => {
        event.preventDefault();
        setPending(true);
        setError('');
        try {
          await update({ groupId, invitationsEnabled: enabled });
          setOverride(null);
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Unable to save invitation settings.'
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <Label className='flex items-center gap-2'>
        <input
          type='checkbox'
          checked={enabled}
          onChange={event => setOverride(event.target.checked)}
          disabled={pending}
        />
        Allow manager invitations
      </Label>
      <p className='text-sm text-muted-foreground'>
        The owner controls invitations. Sharing the unlisted Group page does not
        invite or admit anyone.
      </p>
      <Button disabled={pending || enabled === invitationsEnabled}>
        Save invitation settings
      </Button>
      {error && (
        <p role='alert' className='text-destructive'>
          {error}
        </p>
      )}
    </form>
  );
}

function GroupInviteSearch({ groupId }: { groupId: Id<'groups'> }) {
  const [input, setInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingId, setPendingId] = useState<Id<'persons'> | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const results = useQuery(
    api.friends.queries.searchUsersByUsername,
    searchTerm.length >= 3 ? { searchTerm } : 'skip'
  );
  const send = useSendGroupInvite();
  return (
    <div className='space-y-3'>
      <form
        className='space-y-2'
        onSubmit={event => {
          event.preventDefault();
          setSearchTerm(input.trim());
          setError('');
          setMessage('');
        }}
      >
        <Label htmlFor='group-invite-username'>
          Find an existing user by username
        </Label>
        <div className='flex gap-2'>
          <Input
            id='group-invite-username'
            value={input}
            onChange={event => setInput(event.target.value)}
          />
          <Button disabled={input.trim().length < 3}>Search users</Button>
        </div>
      </form>
      {searchTerm.length >= 3 &&
        (results === undefined ? (
          <p role='status'>Searching users…</p>
        ) : results.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <ul className='space-y-2'>
            {results.map(person => {
              const name = person.name || person.username || 'User';
              return (
                <li
                  key={person.personId}
                  className='flex items-center justify-between gap-3 rounded-card bg-card p-3'
                >
                  <div>
                    <p className='font-medium'>{name}</p>
                    {person.username && (
                      <p className='text-sm text-muted-foreground'>
                        @{person.username}
                      </p>
                    )}
                  </div>
                  <Button
                    disabled={pendingId !== null}
                    aria-label={`Invite ${name} to Group`}
                    onClick={async () => {
                      setPendingId(person.personId);
                      setError('');
                      setMessage('');
                      try {
                        await send({
                          groupId,
                          inviteePersonId: person.personId,
                        });
                        setMessage(`Invitation sent to ${name}.`);
                      } catch {
                        setError(
                          'This user is unavailable for a Group invitation.'
                        );
                      } finally {
                        setPendingId(null);
                      }
                    }}
                  >
                    Invite
                  </Button>
                </li>
              );
            })}
          </ul>
        ))}
      {message && <p role='status'>{message}</p>}
      {error && (
        <p role='alert' className='text-destructive'>
          {error}
        </p>
      )}
    </div>
  );
}
