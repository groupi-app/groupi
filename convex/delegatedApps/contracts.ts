import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { action, selector } from '../authorization/contracts';

export const scope = v.union(
  v.literal('openid'),
  v.literal('offline_access'),
  action
);
export const clientType = v.union(
  v.literal('confidential'),
  v.literal('native')
);
export const status = v.union(
  v.literal('testing'),
  v.literal('approved'),
  v.literal('suspended')
);
export const reviewStatus = v.union(
  v.literal('not-requested'),
  v.literal('pending'),
  v.literal('reviewed'),
  v.literal('rejected')
);
export const hostedAppearance = v.object({
  brandName: v.string(),
  accent: v.string(),
  senderName: v.string(),
});
export const appFields = {
  appearance: v.optional(hostedAppearance),
  ownerPersonId: v.id('persons'),
  name: v.string(),
  purpose: v.string(),
  clientType,
  redirectUris: v.array(v.string()),
  publicJwks: v.optional(v.string()),
  status,
  reviewStatus,
  createdAt: v.number(),
  updatedAt: v.number(),
};
export const app = v.object({
  _id: v.id('delegatedApps'),
  _creationTime: v.number(),
  ...appFields,
});

export const artifactModel = v.union(
  ...(
    [
      'Client',
      'AccessToken',
      'RefreshToken',
      'AuthorizationCode',
      'Grant',
      'Interaction',
      'Session',
      'ReplayDetection',
    ] as const
  ).map(value => v.literal(value))
);

/** Provider state stays separate from the app-owned authoritative grants. */
export const tables = {
  delegatedApps: defineTable(appFields)
    .index('by_ownerPersonId', ['ownerPersonId'])
    .index('by_reviewStatus', ['reviewStatus']),
  delegatedSubjects: defineTable({
    appId: v.id('delegatedApps'),
    personId: v.id('persons'),
    instanceId: v.string(),
    subject: v.string(),
  }).index('by_appId_and_personId_and_instanceId', [
    'appId',
    'personId',
    'instanceId',
  ]),
  delegatedArtifacts: defineTable({
    model: artifactModel,
    key: v.string(),
    payload: v.string(),
    grantKey: v.optional(v.string()),
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
  })
    .index('by_model_and_key', ['model', 'key'])
    .index('by_grantKey', ['grantKey'])
    .index('by_expiresAt', ['expiresAt']),
  delegatedGrantBindings: defineTable({
    active: v.boolean(),
    grantKey: v.string(),
    grantId: v.id('authorizationGrants'),
    appId: v.id('delegatedApps'),
    personId: v.id('persons'),
    instanceId: v.string(),
  })
    .index('by_grantKey', ['grantKey'])
    .index('by_grantId', ['grantId'])
    .index('by_personId', ['personId'])
    .index('by_personId_and_active', ['personId', 'active']),
  delegatedRevocations: defineTable({
    grantKey: v.string(),
    revokedAt: v.number(),
  }).index('by_grantKey', ['grantKey']),
  delegatedConsentApprovals: defineTable({
    ticketHash: v.string(),
    interactionId: v.string(),
    appId: v.id('delegatedApps'),
    instanceId: v.string(),
    requestedScopes: v.array(scope),
    personId: v.id('persons'),
    decision: v.union(v.literal('approved'), v.literal('denied')),
    actions: v.array(action),
    selector,
    background: v.boolean(),
    expiresAt: v.number(),
    consumedAt: v.optional(v.number()),
  })
    .index('by_ticketHash', ['ticketHash'])
    .index('by_interactionId_and_personId', ['interactionId', 'personId'])
    .index('by_expiresAt', ['expiresAt']),
  delegatedConsentRequests: defineTable({
    interactionId: v.string(),
    appId: v.id('delegatedApps'),
    instanceId: v.string(),
    requestedScopes: v.array(scope),
    expiresAt: v.number(),
    decision: v.optional(v.union(v.literal('approved'), v.literal('denied'))),
    personId: v.optional(v.id('persons')),
    grantId: v.optional(v.id('authorizationGrants')),
    grantKey: v.optional(v.string()),
  })
    .index('by_interactionId', ['interactionId'])
    .index('by_expiresAt', ['expiresAt']),
};
