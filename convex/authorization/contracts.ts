import { v } from 'convex/values';
export const actions = [
  'groups.context.read',
  'groups.events.read',
  'groups.events.join',
  'groups.events.rsvp',
  'groups.events.leave',
  'groups.leave',
  'groups.applications.submit',
  'groups.applications.edit',
  'groups.applications.withdraw',
  'identity.display-name',
  'identity.email',
  'events.read',
  'events.update',
  'members.read',
  'discussion.read',
  'discussion.create',
  'discussion.update',
  'discussion.delete',
  'files.read',
  'files.upload',
  'profiles.read',
] as const;
export const action = v.union(...actions.map(value => v.literal(value)));
export const selector = v.union(
  v.object({ kind: v.literal('selected-group'), groupId: v.id('groups') }),
  v.object({ kind: v.literal('selected'), eventIds: v.array(v.id('events')) }),
  v.object({ kind: v.literal('all-current-and-future') })
);
export const principalKind = v.union(
  v.literal('user'),
  v.literal('integration')
);
export const principalFields = {
  kind: principalKind,
  ownerPersonId: v.id('persons'),
  name: v.string(),
  createdAt: v.number(),
};
export const grantFields = {
  principalId: v.id('authorizationPrincipals'),
  grantorPersonId: v.id('persons'),
  name: v.string(),
  actions: v.array(action),
  selector,
  background: v.boolean(),
  appId: v.optional(v.id('delegatedApps')),
  instanceId: v.optional(v.string()),
  expiresAt: v.optional(v.number()),
  revokedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
};
const sharedCredentialFields = {
  grantId: v.id('authorizationGrants'),
  secretHash: v.string(),
  expiresAt: v.optional(v.number()),
  revokedAt: v.optional(v.number()),
  createdAt: v.number(),
};
export const credentialValidator = v.union(
  v.object({ ...sharedCredentialFields, kind: v.literal('named-key') }),
  v.object({
    ...sharedCredentialFields,
    kind: v.literal('delegated-access'),
    actions: v.array(action),
    audience: v.string(),
  })
);
export const auditFields = {
  ownerPersonId: v.id('persons'),
  grantId: v.id('authorizationGrants'),
  principalId: v.id('authorizationPrincipals'),
  credentialId: v.optional(v.id('authorizationCredentials')),
  eventId: v.optional(v.id('events')),
  operation: v.string(),
  result: v.union(v.literal('allowed'), v.literal('denied')),
  reason: v.string(),
  createdAt: v.number(),
};
export const grantSummary = v.object({
  grantId: v.id('authorizationGrants'),
  principalId: v.id('authorizationPrincipals'),
  appId: v.union(v.id('delegatedApps'), v.null()),
  principalKind,
  name: v.string(),
  actions: v.array(action),
  selector,
  expiresAt: v.union(v.number(), v.null()),
  revokedAt: v.union(v.number(), v.null()),
  createdAt: v.number(),
  updatedAt: v.number(),
  background: v.boolean(),
});
