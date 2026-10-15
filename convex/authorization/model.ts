import { ConvexError, type Infer } from 'convex/values';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import {
  authComponent,
  type AuthUserId,
  getEventMembershipForPerson,
} from '../auth';
import { action, selector } from './contracts';
export type AuthorizationAction = Infer<typeof action>;
export type EventSelector = Infer<typeof selector>;
export function denied(message = 'Credential does not permit this operation.') {
  return new ConvexError({ code: 'FORBIDDEN', message });
}
export async function secretHash(secret: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  );
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
export function randomSecret() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), byte =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}
export async function accountActive(
  ctx: QueryCtx | MutationCtx,
  personId: Id<'persons'>,
  now: number
) {
  const person = await ctx.db.get(personId);
  if (!person) throw denied();
  const user = await authComponent.getAnyUserById(
    ctx,
    person.userId as AuthUserId
  );
  if (
    !user ||
    (user.banned && (user.banExpires == null || user.banExpires > now))
  )
    throw denied();
  return person;
}
export async function assertBounds(
  ctx: QueryCtx | MutationCtx,
  ownerPersonId: Id<'persons'>,
  kind: 'user' | 'integration',
  selected: EventSelector,
  granted: AuthorizationAction[]
) {
  if (
    !granted.length ||
    granted.length > 32 ||
    new Set(granted).size !== granted.length
  )
    throw denied('Choose distinct supported actions.');
  if (
    kind === 'integration' &&
    (selected.kind !== 'selected' ||
      !selected.eventIds.length ||
      granted.some(a => a.startsWith('identity.')))
  )
    throw denied('Integrations require selected events and event actions.');
  if (selected.kind === 'selected-group') {
    if (
      kind !== 'user' ||
      !(await ctx.db.get(selected.groupId)) ||
      granted.some(
        a =>
          !a.startsWith('identity.') &&
          ![
            'groups.context.read',
            'groups.events.read',
            'groups.events.join',
            'groups.events.rsvp',
            'groups.events.leave',
            'groups.leave',
            'groups.applications.submit',
            'groups.applications.edit',
            'groups.applications.withdraw',
          ].includes(a)
      )
    )
      throw denied(
        'Selected Group grants permit only implemented own community actions.'
      );
  } else if (granted.some(a => a.startsWith('groups.')))
    throw denied('Select one Group.');
  if (selected.kind === 'selected') {
    if (
      selected.eventIds.length > 100 ||
      new Set(selected.eventIds).size !== selected.eventIds.length
    )
      throw denied('Choose at most 100 distinct events.');
    for (const eventId of selected.eventIds) {
      const member = await getEventMembershipForPerson(
        ctx,
        eventId,
        ownerPersonId
      );
      if (
        !member ||
        !(await ctx.db.get(eventId)) ||
        (kind === 'integration' && member.role !== 'ORGANIZER')
      )
        throw denied('Current event authority is required.');
      if (granted.includes('events.update') && member.role === 'ATTENDEE')
        throw denied('Moderator authority is required for event changes.');
    }
  }
}
export async function liveGrant(
  ctx: QueryCtx | MutationCtx,
  grantId: Id<'authorizationGrants'>,
  now: number
) {
  const grant = await ctx.db.get(grantId);
  if (
    !grant ||
    grant.revokedAt !== undefined ||
    (grant.expiresAt !== undefined && grant.expiresAt <= now)
  )
    throw denied();
  const principal = await ctx.db.get(grant.principalId);
  if (!principal || principal.ownerPersonId !== grant.grantorPersonId)
    throw denied();
  await accountActive(ctx, grant.grantorPersonId, now);
  if (grant.appId !== undefined) {
    if (!grant.instanceId || grant.instanceId !== process.env.DELEGATED_ISSUER)
      throw denied();
    const app = await ctx.db.get(grant.appId);
    if (
      !app ||
      app.status === 'suspended' ||
      (app.status === 'testing' && app.ownerPersonId !== grant.grantorPersonId)
    )
      throw denied();
  }
  return { grant, principal };
}
export function delegatedAudience() {
  const issuer = process.env.DELEGATED_ISSUER;
  if (!issuer) return null;
  try {
    return `${new URL(issuer).origin}/api/v2`;
  } catch {
    return null;
  }
}
export async function authorizeCredential(
  ctx: QueryCtx | MutationCtx,
  credentialId: Id<'authorizationCredentials'>,
  requested: AuthorizationAction,
  eventId: Id<'events'> | undefined,
  now: number
) {
  const credential = await ctx.db.get(credentialId);
  if (
    !credential ||
    credential.revokedAt !== undefined ||
    (credential.expiresAt !== undefined && credential.expiresAt <= now)
  )
    throw denied();
  const { grant, principal } = await liveGrant(ctx, credential.grantId, now);
  if (!grant.actions.includes(requested)) throw denied();
  if (
    credential.kind === 'delegated-access' &&
    (!credential.actions.includes(requested) ||
      !delegatedAudience() ||
      credential.audience !== delegatedAudience())
  )
    throw denied();
  let membership: Doc<'memberships'> | null = null;
  if (eventId !== undefined) {
    if (
      grant.selector.kind === 'selected-group' ||
      (grant.selector.kind === 'selected' &&
        !grant.selector.eventIds.includes(eventId))
    )
      throw denied();
    membership = await getEventMembershipForPerson(
      ctx,
      eventId,
      grant.grantorPersonId
    );
    if (
      !membership ||
      !(await ctx.db.get(eventId)) ||
      (principal.kind === 'integration' && membership.role !== 'ORGANIZER')
    )
      throw denied();
    if (requested === 'events.update' && membership.role === 'ATTENDEE')
      throw denied();
  } else if (!requested.startsWith('identity.') && requested !== 'events.read')
    throw denied();
  return { credential, grant, principal, membership };
}
export async function audit(
  ctx: MutationCtx,
  grant: Doc<'authorizationGrants'>,
  operation: string,
  result: 'allowed' | 'denied',
  reason: string,
  eventId?: Id<'events'>,
  credentialId?: Id<'authorizationCredentials'>
) {
  await ctx.db.insert('authorizationAudit', {
    ownerPersonId: grant.grantorPersonId,
    grantId: grant._id,
    principalId: grant.principalId,
    operation,
    result,
    reason,
    eventId,
    credentialId,
    createdAt: Date.now(),
  });
}

/** Create consent-bound user authority without issuing a credential. */
export async function createUserGrant(
  ctx: MutationCtx,
  args: {
    personId: Id<'persons'>;
    name: string;
    actions: AuthorizationAction[];
    selector: EventSelector;
    background: boolean;
    appId?: Id<'delegatedApps'>;
    instanceId?: string;
    expiresAt?: number;
  }
) {
  const now = Date.now();
  await accountActive(ctx, args.personId, now);
  const name = args.name.trim();
  if (!name || name.length > 100) throw denied('Invalid grant name.');
  if (
    !(
      args.actions.length === 0 &&
      args.selector.kind === 'selected' &&
      args.selector.eventIds.length === 0
    )
  )
    await assertBounds(ctx, args.personId, 'user', args.selector, args.actions);
  const principalId = await ctx.db.insert('authorizationPrincipals', {
    kind: 'user',
    ownerPersonId: args.personId,
    name,
    createdAt: now,
  });
  const grantId = await ctx.db.insert('authorizationGrants', {
    principalId,
    grantorPersonId: args.personId,
    name,
    actions: args.actions,
    selector: args.selector,
    background: args.background,
    appId: args.appId,
    instanceId: args.instanceId,
    expiresAt: args.expiresAt,
    createdAt: now,
    updatedAt: now,
  });
  await audit(
    ctx,
    (await ctx.db.get(grantId))!,
    'consented',
    'allowed',
    'user-consented'
  );
  return grantId;
}
