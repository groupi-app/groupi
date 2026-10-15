'use client';
import { useState } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useConfigureGroupEventSharing } from '@/hooks/convex/use-group-event-audiences';
export function GroupEventSharingPolicy({
  groupId,
  initialPolicy,
}: {
  groupId: Id<'groups'>;
  initialPolicy: 'MANAGERS' | 'MEMBERS';
}) {
  const configure = useConfigureGroupEventSharing();
  const [policy, setPolicy] = useState(initialPolicy),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  return (
    <form
      className='rounded-card border border-border p-4 space-y-3'
      aria-label='Group Event sharing policy'
      onSubmit={async event => {
        event.preventDefault();
        setBusy(true);
        setError('');
        setMessage('');
        try {
          await configure({ groupId, policy });
          setMessage(
            'Event sharing policy saved. Existing independent audiences remain.'
          );
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Unable to update sharing policy. Current Group ownership is required.'
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className='text-xl font-semibold'>Group Event sharing policy</h2>
      <p>
        Sharing also requires Event Organizer authority and current access to
        Group member content. This policy does not grant general Event
        management powers.
      </p>
      <Label htmlFor='group-event-sharing-policy'>
        Who may share Events with this Group?
      </Label>
      <select
        id='group-event-sharing-policy'
        className='w-full rounded-input border border-input bg-background p-2 text-foreground'
        value={policy}
        disabled={busy}
        onChange={event => {
          setPolicy(event.target.value as typeof policy);
          setMessage('');
        }}
      >
        <option value='MANAGERS'>Owner and moderators</option>
        <option value='MEMBERS'>Any Group member</option>
      </select>
      <Button disabled={busy || policy === initialPolicy}>
        {busy ? 'Saving…' : 'Save Event sharing policy'}
      </Button>
      {message && <p role='status'>{message}</p>}
      {error && (
        <p role='alert' className='text-error'>
          {error}
        </p>
      )}
    </form>
  );
}
