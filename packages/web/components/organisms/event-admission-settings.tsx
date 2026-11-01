'use client';

import type { Id } from '@/convex/_generated/dataModel';
import { Label } from '@/components/ui/label';
import { EventApplicationSettings } from './event-application-settings';
import { useEventSettingsDraft } from '@/features/event-settings';

export function EventAdmissionSettings({
  eventId,
  role,
}: {
  eventId: Id<'events'>;
  role?: string;
}) {
  if (role !== 'ORGANIZER') return null;
  return <AdmissionFields eventId={eventId} />;
}
function AdmissionFields({ eventId }: { eventId: Id<'events'> }) {
  const { values, setSection, busy } = useEventSettingsDraft();
  const policy = values.admissionPolicy;
  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='event-admission-policy'>Admission</Label>
        <select
          id='event-admission-policy'
          value={policy}
          disabled={busy}
          onChange={event =>
            setSection('admissionPolicy', event.target.value as typeof policy)
          }
          className='w-full rounded-input border border-input bg-background p-2 text-foreground'
          aria-describedby='event-admission-helper'
        >
          <option value='INVITATION_ONLY'>Invitation only</option>
          <option value='DIRECT'>Join directly</option>
          <option value='APPLY'>Apply for approval</option>
        </select>
        <p
          id='event-admission-helper'
          className='text-sm text-muted-foreground'
        >
          {policy === 'DIRECT'
            ? 'People with access can join.'
            : policy === 'APPLY'
              ? 'People with access apply before joining.'
              : 'An invitation is required to join.'}
        </p>
      </div>
      {policy === 'APPLY' && <EventApplicationSettings eventId={eventId} />}
    </div>
  );
}
