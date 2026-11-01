/** In-memory teaching state only. Never performs HTTP or stores credentials. */
export type SimulatedEvent = { eventId: string; title: string };
export type SimulationState = {
  event?: SimulatedEvent;
  retained?: { title: string; identity: string };
  response: string;
};
export const simulationPrerequisites: Record<string, string> = {
  expired:
    '401 Unauthorized: the simulated credential has expired. Stop and verify the intended instance and account. No credential fallback.',
  'wrong-instance':
    'Wrong instance: stop and verify the instance and account. Never forward a credential to an untrusted origin.',
  'unsupported-version':
    'Unsupported API version: verify the target release before proceeding.',
  unavailable:
    'Upcoming capability: source examples do not establish runtime availability.',
};
export function simulateCreate(
  state: SimulationState,
  input: {
    title: string;
    identity: string;
    scenario: string;
    lost: boolean;
    replay: boolean;
    eventId: string;
  }
): SimulationState {
  const fail = (response: string) => ({ ...state, response });
  if (simulationPrerequisites[input.scenario])
    return fail(simulationPrerequisites[input.scenario]);
  if (input.scenario === 'expired-request')
    return fail(
      '409 Expired request: the 24-hour replay window has elapsed. Inspect current state before deliberately creating a new request; no automatic new identifier.'
    );
  if (input.identity !== 'organizer' || input.scenario === 'denied')
    return fail(
      '403 Forbidden: this demo identity lacks event-create permission. No credential fallback.'
    );
  if (!input.title.trim() || input.title.length > 200)
    return fail(
      '400 Bad Request: title is required and must be at most 200 characters.'
    );
  if (
    state.retained &&
    (state.retained.title !== input.title ||
      state.retained.identity !== input.identity)
  )
    return fail(
      '409 Conflict: retained request identity or body changed. Restore the original payload and inspect current state; do not create with a new identifier.'
    );
  if (input.replay && !state.retained)
    return fail('No retained create to replay.');
  const event = state.event ?? { eventId: input.eventId, title: input.title };
  return {
    event,
    retained: { title: input.title, identity: input.identity },
    response:
      input.lost && !input.replay
        ? 'Outcome uncertain: simulated request committed but its response was lost. Replay the retained create with identical identity, identifier and body.'
        : `201 Created${state.event ? ' (same retained demo request)' : ''}\n${JSON.stringify({ eventId: event.eventId, membershipId: 'membership_fixture_001' }, null, 2)}\n200 OK · permitted read-back (selected fields)\n${JSON.stringify({ id: event.eventId, title: event.title, chosenDateTime: null }, null, 2)}`,
  };
}
