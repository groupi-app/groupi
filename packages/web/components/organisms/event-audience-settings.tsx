'use client';
import { useState } from 'react';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useGroups } from '@/hooks/convex/use-groups';
import {
  useEventAudiences,
  useShareEventWithGroup,
  useWithdrawGroupEventAudience,
  useSetEventFriendsAudience,
} from '@/hooks/convex/use-group-event-audiences';
import { GroupPagination } from './group-pagination';
import { AudienceBoundary } from './audience-boundary';
export function EventAudienceSettings({
  eventId,
  visibility,
}: {
  eventId: Id<'events'>;
  visibility: Doc<'events'>['visibility'];
}) {
  return (
    <AudienceBoundary key={eventId}>
      <AudienceControls eventId={eventId} visibility={visibility} />
    </AudienceBoundary>
  );
}
function AudienceControls({
  eventId,
  visibility,
}: {
  eventId: Id<'events'>;
  visibility: Doc<'events'>['visibility'];
}) {
  const audiences = useEventAudiences({ eventId });
  const withdraw = useWithdrawGroupEventAudience();
  const friends = useSetEventFriendsAudience();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(success);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to change Event sharing. Refresh your current access and try again.'
      );
    } finally {
      setBusy(false);
    }
  }
  if (audiences === undefined)
    return <p role='status'>Loading Event audiences…</p>;
  return (
    <section
      className='rounded-card border border-border p-4 space-y-4'
      aria-labelledby='event-audiences-heading'
    >
      <h2 id='event-audiences-heading' className='text-xl font-semibold'>
        Event logistics audiences
      </h2>
      <p>
        Whole Groups and Friends provide independent access to Event logistics.
        Sharing does not invite or join anyone, change RSVP, or expose member
        tools.
      </p>
      <p>
        {visibility === 'PUBLIC'
          ? 'Public basic Event details remain public.'
          : visibility === 'FRIENDS'
            ? 'Legacy visibility is Friends. The Friends audience control below determines current Friends access.'
            : 'Legacy visibility is Private. Selected audiences can still read Event logistics.'}
      </p>
      {audiences.canManageEvent && (
        <>
          <p>
            Friends audience:{' '}
            {audiences.friendsShared ? 'shared' : 'not shared'}
          </p>
          <Button
            variant='outline'
            disabled={busy}
            onClick={() =>
              void run(
                () => friends({ eventId, enabled: !audiences.friendsShared }),
                audiences.friendsShared
                  ? 'Friends audience removed. Other independent access remains.'
                  : 'Event logistics shared with Friends.'
              )
            }
          >
            {audiences.friendsShared
              ? 'Remove Friends audience'
              : 'Share with Friends'}
          </Button>
          <GroupSelector
            eventId={eventId}
            sharedGroupIds={audiences.groups.map(group => group.groupId)}
            disabled={busy}
          />
        </>
      )}
      {!audiences.canManageEvent && (
        <p>
          Only the current Event Organizer can add audiences. You can withdraw a
          permitted Group grant below.
        </p>
      )}
      <ul className='space-y-3'>
        {audiences.groups.map(group => (
          <li
            key={group.groupId}
            className='flex flex-wrap items-center justify-between gap-3'
          >
            <span>{group.name}</span>
            {group.canWithdraw && (
              <Button
                variant='outline'
                disabled={busy}
                onClick={() =>
                  void run(
                    () => withdraw({ eventId, groupId: group.groupId }),
                    'Group audience withdrawn. Other independent access remains.'
                  )
                }
              >
                Withdraw {group.name} audience
              </Button>
            )}
          </li>
        ))}
      </ul>
      {audiences.groups.length === 0 && <p>No visible Group audiences.</p>}
      {message && <p role='status'>{message}</p>}
      {error && (
        <p role='alert' className='text-error'>
          {error}
        </p>
      )}
    </section>
  );
}
function GroupSelector({
  eventId,
  sharedGroupIds,
  disabled,
}: {
  eventId: Id<'events'>;
  sharedGroupIds: Id<'groups'>[];
  disabled: boolean;
}) {
  const [cursor, setCursor] = useState<string | null>(null),
    [groupId, setGroupId] = useState<Id<'groups'> | ''>(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const groups = useGroups({ cursor, numItems: 20 });
  const share = useShareEventWithGroup();
  if (groups === undefined)
    return <p role='status'>Loading eligible Groups…</p>;
  const eligible = groups.page.filter(
    group => group.canShareEvents && !sharedGroupIds.includes(group._id)
  );
  const selected = eligible.some(group => group._id === groupId) ? groupId : '';
  return (
    <form
      className='space-y-3'
      onSubmit={async event => {
        event.preventDefault();
        if (!selected) return;
        setBusy(true);
        setError('');
        setMessage('');
        try {
          await share({ eventId, groupId: selected });
          setGroupId('');
          setMessage('Event logistics shared with Group.');
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Unable to share. Current Group sharing permission is required.'
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <Label htmlFor='event-audience-group'>Whole Group</Label>
      <select
        id='event-audience-group'
        className='w-full rounded-input border border-input bg-background p-2 text-foreground'
        value={selected}
        disabled={busy || disabled}
        onChange={event => {
          setGroupId(event.target.value as Id<'groups'> | '');
          setMessage('');
        }}
      >
        <option value=''>Choose a permitted Group</option>
        {eligible.map(group => (
          <option key={group._id} value={group._id}>
            {group.name}
          </option>
        ))}
      </select>
      {eligible.length === 0 && (
        <p>
          No additional Groups on this page currently permit you to share
          Events. Complete required Group onboarding or ask the Group owner
          about sharing policy.
        </p>
      )}
      <Button disabled={busy || disabled || !selected}>
        {busy ? 'Sharing…' : 'Share with Group'}
      </Button>
      <GroupPagination
        cursor={cursor}
        onCursor={value => {
          setCursor(value);
          setGroupId('');
        }}
        page={groups}
        label='sharing Groups'
      />
      {message && <p role='status'>{message}</p>}
      {error && (
        <p role='alert' className='text-error'>
          {error}
        </p>
      )}
    </form>
  );
}
