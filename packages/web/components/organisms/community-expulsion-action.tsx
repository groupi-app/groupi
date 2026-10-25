'use client';
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { GroupConfirmedAction } from './group-confirmed-action';
/** Keeps one intent after an uncertain response; live progress is authoritative. */
export function CommunityExpulsionAction({
  groupId,
  personId,
  name,
}: {
  groupId: Id<'groups'>;
  personId: Id<'persons'>;
  name: string;
}) {
  const expel = useMutation(api.groups.expulsions.expel);
  const resume = useMutation(api.groups.expulsions.resume);
  const reinstate = useMutation(api.groups.expulsions.reinstate);
  const [resolution, setResolution] = useState<{
    action: 'resume' | 'reinstate';
    generation: number;
    operationId: string;
  }>();
  const [busy, setBusy] = useState(false);
  const progress = useQuery(api.groups.expulsions.progress, {
    groupId,
    personId,
  });
  const [operationId, setOperationId] = useState<string>();
  const [error, setError] = useState<string>();
  const submit = async () => {
    const intent =
      progress?.exclusion === 'inactive'
        ? crypto.randomUUID()
        : (operationId ?? crypto.randomUUID());
    setOperationId(intent);
    try {
      await expel({ groupId, personId, operationId: intent });
      setError(undefined);
      return { success: true };
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Outcome unknown. Reconcile staff progress before a new intent.'
      );
      throw cause;
    }
  };
  const resolve = async (action: 'resume' | 'reinstate') => {
    if (!progress) return;
    const intent =
      resolution?.action === action &&
      resolution.generation === progress.generation
        ? resolution
        : {
            action,
            generation: progress.generation,
            operationId: crypto.randomUUID(),
          };
    setResolution(intent);
    setBusy(true);
    try {
      await (action === 'resume' ? resume : reinstate)({
        groupId,
        personId,
        generation: intent.generation,
        operationId: intent.operationId,
      });
      setResolution(undefined);
      setError(undefined);
      return { success: true };
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Outcome unknown. Reconcile current progress and retry the same intent.'
      );
      throw cause;
    } finally {
      setBusy(false);
    }
  };
  if (progress?.exclusion === 'active')
    return (
      <div role='status'>
        <p>Exclusion committed. Event cleanup {progress.cleanup}.</p>
        <p>
          Discord role removal runs separately. Check Group Discord settings for
          pending cleanup or permission errors.
        </p>
        <p>Generation {progress.generation}</p>
        {progress.events?.map(event => (
          <p key={event.eventId}>
            Event {event.eventId}: {event.state}
          </p>
        ))}
        {progress.conflicts.map(conflict => (
          <p key={conflict.eventId}>
            {conflict.code === 'PROTECTED_ORGANIZER'
              ? 'Resolve protected Organizer ownership before Event cleanup.'
              : 'A current Event Organizer must authorize Event cleanup.'}
          </p>
        ))}
        <Button
          disabled={busy}
          onClick={() => {
            void resolve('resume').catch(() => {});
          }}
        >
          Resume Event cleanup for {name}
        </Button>
        {progress.cleanup === 'complete' && (
          <GroupConfirmedAction
            label={`Reinstate ${name}`}
            confirmation={`Confirm reinstatement of ${name}`}
            explanation='Lifts only this community exclusion after Event and Group participation cleanup. Pending Discord role cleanup continues after reinstatement. Membership, invitations, RSVP and independent bans are never restored. Fresh admission is required.'
            onConfirm={() => resolve('reinstate')}
          />
        )}
        {error && <p role='alert'>{error}</p>}
      </div>
    );
  return (
    <div>
      {progress?.exclusion === 'inactive' && (
        <p role='status'>
          Reinstated. Fresh admission is required. Pending Discord role cleanup
          continues.
        </p>
      )}
      <GroupConfirmedAction
        successMessage='Exclusion committed. Event cleanup pending reconciliation. Discord role removal is tracked separately.'
        label={`Expel ${name}`}
        confirmation={`Confirm coordinated expulsion of ${name}`}
        explanation='Immediately excludes this person from current and future community Events, including other audience routes. Event cleanup may remain blocked by independent Organizer authority. Completed history remains available.'
        onConfirm={submit}
      />
      {error && (
        <div role='alert'>
          <p>{error}</p>
          <p>
            {progress === undefined
              ? 'Checking current staff progress…'
              : 'No committed exclusion found in current staff progress.'}
          </p>
          <Button onClick={submit}>Retry same intent</Button>
        </div>
      )}
    </div>
  );
}
