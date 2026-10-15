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
  const progress = useQuery(api.groups.expulsions.progress, {
    groupId,
    personId,
  });
  const [operationId, setOperationId] = useState<string>();
  const [error, setError] = useState<string>();
  const submit = async () => {
    const intent = operationId ?? crypto.randomUUID();
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
  if (progress)
    return (
      <div role='status'>
        <p>Exclusion committed. Cleanup {progress.cleanup}.</p>
        {progress.conflicts.map(conflict => (
          <p key={conflict.eventId}>
            {conflict.code === 'PROTECTED_ORGANIZER'
              ? 'Resolve protected Organizer ownership before cleanup.'
              : 'A current Event Organizer must authorize cleanup.'}
          </p>
        ))}
      </div>
    );
  return (
    <div>
      <GroupConfirmedAction
        successMessage='Exclusion committed. Cleanup pending reconciliation.'
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
