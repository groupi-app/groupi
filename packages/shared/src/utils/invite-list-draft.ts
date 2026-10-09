/** Copy people into an editable draft without linking it to a saved list. */
export function mergeInviteRecipients<Person extends { personId: string }>(
  current: readonly Person[],
  added: readonly Person[]
) {
  const people = new Map<string, Person>();
  for (const person of [...current, ...added]) {
    if (!people.has(person.personId))
      people.set(person.personId, { ...person });
  }
  if (people.size > 100) throw new RangeError('Choose at most 100 recipients.');
  return [...people.values()];
}

/** Keep this attempt until its outcome is known; retries submit the same args. */
export function createInviteListSendAttempt<
  PersonId extends string,
  Input extends object,
>(input: Input & { personIds: PersonId[] }, createUuid: () => string) {
  const personIds = [...new Set(input.personIds)];
  if (personIds.length === 0)
    throw new RangeError('Choose at least one recipient.');
  if (personIds.length > 100)
    throw new RangeError('Choose at most 100 recipients.');
  Object.freeze(personIds);
  return {
    args: Object.freeze({
      ...input,
      personIds,
      requestId: `${Date.now()}.${createUuid()}`,
    }),
  };
}

function inviteListErrorCode(error: unknown) {
  // Apps and shared can resolve distinct Convex copies. The SDK uses this
  // global symbol to identify its errors across those constructor boundaries.
  if (
    !error ||
    typeof error !== 'object' ||
    Reflect.get(error, Symbol.for('ConvexError')) !== true ||
    !('data' in error)
  )
    return undefined;
  let data: unknown = error.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return undefined;
    }
  }
  return data &&
    typeof data === 'object' &&
    'code' in data &&
    typeof data.code === 'string'
    ? data.code
    : undefined;
}

/** Applies to a fresh attempt only; a rejection cannot resolve an earlier lost response. */
export function isDefiniteInviteListRejection(error: unknown) {
  const code = inviteListErrorCode(error);
  return (
    code !== undefined &&
    ['VALIDATION_ERROR', 'FORBIDDEN', 'NOT_FOUND', 'UNAUTHORIZED'].includes(
      code
    )
  );
}

/** Expiry ends retry protection, but does not establish the original send outcome. */
export function isExpiredInviteListRequest(error: unknown) {
  return inviteListErrorCode(error) === 'IDEMPOTENCY_EXPIRED';
}

/**
 * Local fallback when a failed retry's permission check hides server expiry.
 * Clock time cannot establish the original outcome; keep its ID until the user
 * explicitly acknowledges inspection and chooses to start a new review.
 */
export function hasInviteListRequestExpired(
  requestId: string,
  now = Date.now()
) {
  if (
    !Number.isFinite(now) ||
    !/^\d{13}\.[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      requestId
    )
  )
    return false;
  const issued = Number(requestId.split('.')[0]);
  return issued + 86_400_000 <= now;
}
