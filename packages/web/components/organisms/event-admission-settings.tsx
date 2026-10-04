'use client';

import { useState } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  useEventLogistics,
  useUpdateAdmissionPolicy,
} from '@/hooks/convex/use-event-admission';

export function EventAdmissionSettings({
  eventId,
  role,
}: {
  eventId: Id<'events'>;
  role?: string;
}) {
  if (role !== 'ORGANIZER') return null;
  return <OrganizerAdmissionSettings eventId={eventId} />;
}

function OrganizerAdmissionSettings({ eventId }: { eventId: Id<'events'> }) {
  const logistics = useEventLogistics(eventId);
  if (!logistics) return <p role='status'>Loading admission settings…</p>;
  return (
    <AdmissionForm
      key={logistics.event.admissionPolicy}
      eventId={eventId}
      initialPolicy={logistics.event.admissionPolicy}
    />
  );
}

function AdmissionForm({
  eventId,
  initialPolicy,
}: {
  eventId: Id<'events'>;
  initialPolicy: 'INVITATION_ONLY' | 'DIRECT';
}) {
  const update = useUpdateAdmissionPolicy();
  const [policy, setPolicy] = useState(initialPolicy);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  return (
    <section
      className='rounded-card border border-border p-4 space-y-3'
      aria-labelledby='event-admission-heading'
    >
      <h2 id='event-admission-heading' className='text-lg font-semibold'>
        Event admission
      </h2>
      <p className='text-sm text-muted-foreground'>
        Visibility controls who can read event logistics. Admission controls
        whether eligible viewers can join. Invitations remain available with
        either policy.
      </p>
      <form
        className='space-y-3'
        onSubmit={async event => {
          event.preventDefault();
          setPending(true);
          setError('');
          setMessage('');
          try {
            await update({ eventId, admissionPolicy: policy });
            setMessage('Admission policy saved.');
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : 'Unable to save admission policy. Please try again.'
            );
          } finally {
            setPending(false);
          }
        }}
      >
        <Label htmlFor='event-admission-policy'>Admission policy</Label>
        <select
          id='event-admission-policy'
          value={policy}
          disabled={pending}
          onChange={event => {
            setPolicy(event.target.value as typeof policy);
            setMessage('');
          }}
          className='w-full rounded-input border border-input bg-background p-2 text-foreground focus-visible:outline focus-visible:outline-2'
        >
          <option value='INVITATION_ONLY'>Invitation only</option>
          <option value='DIRECT'>Join directly</option>
        </select>
        <p className='text-sm text-muted-foreground'>
          {policy === 'DIRECT'
            ? 'Eligible viewers can explicitly join with a Pending RSVP.'
            : 'Viewers need an invitation to join.'}
        </p>
        <Button disabled={pending || policy === initialPolicy}>
          {pending ? 'Saving…' : 'Save admission policy'}
        </Button>
        {message && <p role='status'>{message}</p>}
        {error && (
          <p role='alert' className='text-destructive'>
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
