'use node';
import Provider, {
  errors,
  type AdapterPayload,
  type Configuration,
} from 'oidc-provider';
import { toReqRes, toFetchResponse } from 'fetch-to-node';
import { createHash } from 'node:crypto';
import { v } from 'convex/values';
import { internalAction, type ActionCtx } from '../_generated/server';
import { internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import {
  modelSchema,
  validatePayload,
  publicJwksSchema,
  signingJwksSchema,
} from './payloads';
import { actions } from '../authorization/contracts';

const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');
function adapter(ctx: ActionCtx) {
  return class {
    private model: ReturnType<typeof modelSchema.parse>;
    constructor(model: string) {
      this.model = modelSchema.parse(model);
    }
    async find(key: string): Promise<AdapterPayload | undefined> {
      if (this.model === 'Client') {
        let serialized: string | null;
        try {
          serialized = await ctx.runQuery(
            internal.delegatedApps.storage.client,
            { appId: key as Id<'delegatedApps'> }
          );
        } catch {
          return undefined;
        }
        if (!serialized) return undefined;
        const app: Doc<'delegatedApps'> = JSON.parse(serialized);
        return {
          client_id: app._id,
          client_name: app.name,
          redirect_uris: app.redirectUris,
          grant_types: ['authorization_code', 'refresh_token'],
          response_types: ['code'],
          subject_type: 'pairwise',
          token_endpoint_auth_method:
            app.clientType === 'native' ? 'none' : 'private_key_jwt',
          ...(app.publicJwks
            ? { jwks: publicJwksSchema.parse(JSON.parse(app.publicJwks)) }
            : {}),
          application_type: app.clientType === 'native' ? 'native' : 'web',
        };
      }
      const payload = await ctx.runQuery(internal.delegatedApps.storage.find, {
        model: this.model,
        keyHash: hash(key),
        now: Date.now(),
      });
      return payload
        ? ({
            ...validatePayload(this.model, payload),
            jti: key,
          } as AdapterPayload)
        : undefined;
    }
    async upsert(key: string, payload: AdapterPayload, expiresIn = 3600) {
      // Raw opaque tokens never cross into persistent storage, including payload.jti.
      const stored = { ...payload };
      delete stored.jti;
      const grantKey =
        payload.grantId ?? (this.model === 'Grant' ? key : undefined);
      const saved = await ctx.runMutation(
        internal.delegatedApps.storage.upsert,
        {
          model: this.model,
          keyHash: hash(key),
          payload: JSON.stringify(
            validatePayload(this.model, JSON.stringify(stored))
          ),
          grantKey,
          expiresAt: Date.now() + expiresIn * 1000,
        }
      );
      if (!saved) throw new errors.InvalidGrant('Grant no longer active');
    }
    async consume(key: string) {
      const consumed = await ctx.runMutation(
        internal.delegatedApps.storage.consume,
        { model: this.model, keyHash: hash(key) }
      );
      if (!consumed) throw new errors.InvalidGrant('Artifact already consumed');
    }
    async destroy(key: string) {
      await ctx.runMutation(internal.delegatedApps.storage.destroy, {
        model: this.model,
        keyHash: hash(key),
        ...(this.model === 'Grant' ? { grantKey: key } : {}),
      });
    }
    async revokeByGrantId(grantKey: string) {
      await ctx.runMutation(internal.delegatedApps.storage.revokeGrant, {
        grantKey,
      });
    }
    async findByUserCode() {
      return undefined;
    }
    async findByUid() {
      return undefined;
    }
  };
}
function configuration(
  ctx: ActionCtx,
  issuer: string,
  jwks: Configuration['jwks'],
  cookieKeys: string[]
): Configuration {
  const audience = `${new URL(issuer).origin}/api/v2`;
  return {
    adapter: adapter(ctx),
    jwks,
    cookies: { keys: cookieKeys },
    clients: [],
    clientDefaults: {
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      subject_type: 'pairwise',
      id_token_signed_response_alg: 'RS256',
    },
    subjectTypes: ['pairwise'],
    responseTypes: ['code'],
    scopes: ['openid', 'offline_access', ...actions],
    claims: {
      openid: ['sub'],
      'identity.display-name': ['name'],
      'identity.email': ['email'],
    },
    pkce: { required: () => true },
    features: {
      devInteractions: { enabled: false },
      resourceIndicators: {
        enabled: true,
        defaultResource: () => audience,
        useGrantedResource: () => true,
        getResourceServerInfo: (_ctx, resource) => {
          if (resource !== audience)
            throw new errors.InvalidTarget('Unexpected API audience');
          return {
            scope: actions.join(' '),
            audience,
            accessTokenFormat: 'opaque',
            accessTokenTTL: 300,
          };
        },
      },
    },
    rotateRefreshToken: true,
    issueRefreshToken: (_ctx, _client, code) =>
      code.scopes.has('offline_access'),
    expiresWithSession: () => false,
    ttl: {
      AuthorizationCode: 60,
      AccessToken: 300,
      IdToken: 300,
      Interaction: 600,
      Session: 600,
      Grant: 30 * 86400,
      RefreshToken: (_ctx, token) =>
        Math.max(
          0,
          Math.min(
            7 * 86400,
            (token.iiat ?? token.iat ?? Math.floor(Date.now() / 1000)) +
              30 * 86400 -
              Math.floor(Date.now() / 1000)
          )
        ),
    },
    interactions: {
      url: (_ctx, interaction) =>
        `${issuer}/interaction/${encodeURIComponent(interaction.uid)}`,
    },
    pairwiseIdentifier: (_ctx, personId, client) =>
      ctx.runMutation(internal.delegatedApps.storage.subject, {
        appId: client.clientId as Id<'delegatedApps'>,
        personId: personId as Id<'persons'>,
        instanceId: issuer,
      }),
    findAccount: async (_request, personId) => {
      const account = await ctx.runQuery(
        internal.delegatedApps.storage.account,
        { personId: personId as Id<'persons'>, now: Date.now() }
      );
      return account
        ? {
            accountId: personId,
            claims: async (_use, scope) => ({
              sub: personId,
              ...(scope.split(' ').includes('identity.display-name')
                ? { name: account.name }
                : {}),
              ...(scope.split(' ').includes('identity.email')
                ? { email: account.email }
                : {}),
            }),
          }
        : undefined;
    },
    extraClientMetadata: {
      validator: (_ctx, key, value) => {
        if (key === 'jwks_uri' && value)
          throw new errors.InvalidClientMetadata(
            'Remote keys are not supported'
          );
      },
    },
    renderError: async (context, out) => {
      context.status = 400;
      context.type = 'application/json';
      context.body = {
        error: out.error,
        error_description:
          'Authorization could not be completed. Return to the app to reconnect.',
      };
    },
  };
}

export const handle = internalAction({
  args: {
    url: v.string(),
    method: v.union(v.literal('GET'), v.literal('POST'), v.literal('OPTIONS')),
    headers: v.array(v.object({ name: v.string(), value: v.string() })),
    body: v.optional(v.string()),
  },
  returns: v.object({
    status: v.number(),
    headers: v.array(v.object({ name: v.string(), value: v.string() })),
    body: v.string(),
  }),
  handler: async (ctx, args) => {
    const issuer = process.env.DELEGATED_ISSUER;
    const keyMaterial = process.env.DELEGATED_SIGNING_JWKS;
    const cookieMaterial = process.env.DELEGATED_COOKIE_KEYS;
    const siteUrl = process.env.SITE_URL;
    if (!issuer || !keyMaterial || !cookieMaterial || !siteUrl)
      return {
        status: 503,
        headers: [{ name: 'content-type', value: 'application/json' }],
        body: JSON.stringify({ error: 'temporarily_unavailable' }),
      };
    const target = new URL(args.url);
    const pinned = new URL(issuer);
    if (
      pinned.protocol !== 'https:' ||
      pinned.search ||
      pinned.hash ||
      pinned.username ||
      pinned.password ||
      target.origin !== pinned.origin ||
      !target.pathname.startsWith(`${pinned.pathname}/`)
    )
      return {
        status: 400,
        headers: [],
        body: JSON.stringify({ error: 'invalid_request' }),
      };
    const cookieKeys: unknown = JSON.parse(cookieMaterial);
    if (
      !Array.isArray(cookieKeys) ||
      !cookieKeys.length ||
      cookieKeys.some(key => typeof key !== 'string' || key.length < 32)
    )
      throw new Error('Invalid delegated cookie key configuration');
    if (
      args.method === 'POST' &&
      target.pathname === `${pinned.pathname}/token` &&
      new URLSearchParams(args.body).has('scope')
    )
      return {
        status: 400,
        headers: [{ name: 'content-type', value: 'application/json' }],
        body: JSON.stringify({
          error: 'invalid_scope',
          error_description:
            'Token renewal preserves the original consent; omit scope.',
        }),
      };
    const provider = new Provider(
      issuer,
      configuration(
        ctx,
        issuer,
        signingJwksSchema.parse(JSON.parse(keyMaterial)),
        cookieKeys
      )
    );
    // Convex terminates TLS; fetch-to-node intentionally has no socket. Trust the pinned transport only.
    Object.defineProperty(provider.request, 'protocol', { get: () => 'https' });
    Object.defineProperty(provider.request, 'ip', { get: () => '' });
    provider.proxy = true;
    const headers = new Headers();
    for (const { name: key, value } of args.headers) {
      if (
        key &&
        value !== undefined &&
        ![
          'host',
          'x-forwarded-host',
          'x-forwarded-proto',
          'content-length',
        ].includes(key.toLowerCase())
      )
        headers.append(key, value);
    }
    headers.set('host', pinned.host);
    headers.set('x-forwarded-proto', 'https');
    if (args.body !== undefined)
      headers.set('content-length', String(Buffer.byteLength(args.body)));
    const request = new Request(args.url, {
      method: args.method,
      headers,
      ...(args.body !== undefined ? { body: args.body } : {}),
    });
    const { req, res } = toReqRes(request);
    const interactionPath = `${pinned.pathname}/interaction/`;
    if (target.pathname.startsWith(interactionPath)) {
      const interaction = await provider.interactionDetails(req, res);
      const clientId = String(interaction.params.client_id);
      if (
        decodeURIComponent(target.pathname.slice(interactionPath.length)) !==
        interaction.uid
      )
        throw new errors.InvalidRequest('Interaction browser mismatch');
      const approvals = target.searchParams.getAll('approval');
      if (approvals.length > 1)
        throw new errors.InvalidRequest('Ambiguous approval');
      await ctx.runMutation(internal.delegatedApps.storage.prepareConsent, {
        interactionId: interaction.uid,
        appId: clientId as Id<'delegatedApps'>,
        instanceId: issuer,
        requestedScopes: String(interaction.params.scope ?? '')
          .split(' ')
          .filter(Boolean),
        expiresAt: interaction.exp * 1000,
      });
      if (approvals.length === 1)
        await ctx.runMutation(internal.delegatedApps.storage.finalizeConsent, {
          interactionId: interaction.uid,
          ticketHash: hash(approvals[0]),
          instanceId: issuer,
          appId: clientId as Id<'delegatedApps'>,
        });
      const serialized = await ctx.runQuery(
        internal.delegatedApps.storage.consentDecision,
        { interactionId: interaction.uid, now: Date.now() }
      );
      const decision: {
        request: Doc<'delegatedConsentRequests'>;
        grant: Doc<'authorizationGrants'> | null;
      } | null = serialized ? JSON.parse(serialized) : null;
      if (!decision?.request.decision) {
        const consent = new URL('/oauth/consent', siteUrl);
        consent.searchParams.set('interactionId', interaction.uid);
        return {
          status: 303,
          headers: [
            { name: 'location', value: consent.href },
            { name: 'cache-control', value: 'no-store' },
          ],
          body: '',
        };
      }
      let resume: string;
      if (decision.request.decision === 'denied')
        resume = await provider.interactionResult(
          req,
          res,
          { error: 'access_denied' },
          { mergeWithLastSubmission: false }
        );
      else {
        if (
          !decision.grant ||
          !decision.request.personId ||
          !decision.request.grantKey
        )
          throw new errors.InvalidGrant();
        const grant = new provider.Grant({
          accountId: decision.request.personId,
          clientId,
        });
        grant.jti = decision.request.grantKey;
        const grantedScopes = [
          'openid',
          ...decision.grant.actions,
          ...(decision.grant.background ? ['offline_access'] : []),
        ].join(' ');
        grant.addOIDCScope(grantedScopes);
        grant.addResourceScope(
          audienceFor(issuer),
          decision.grant.actions
            .filter(action => !action.startsWith('identity.'))
            .join(' ')
        );
        await grant.save();
        resume = await provider.interactionResult(
          req,
          res,
          {
            login: { accountId: decision.request.personId, remember: false },
            consent: { grantId: decision.request.grantKey },
          },
          { mergeWithLastSubmission: false }
        );
      }
      if (new URL(resume).origin !== pinned.origin)
        throw new errors.InvalidRequest('Unexpected resume origin');
      return {
        status: 303,
        headers: [
          { name: 'location', value: resume },
          { name: 'cache-control', value: 'no-store' },
        ],
        body: '',
      };
    }
    Object.assign(req, {
      originalUrl: `${target.pathname}${target.search}`,
      url: `${target.pathname.slice(pinned.pathname.length)}${target.search}`,
    });
    const responsePromise = toFetchResponse(res);
    provider.callback()(req, res);
    const response = await responsePromise;
    const responseHeaders: { name: string; value: string }[] = [];
    response.headers.forEach((value, key) => {
      if (key !== 'set-cookie') responseHeaders.push({ name: key, value });
    });
    for (const cookie of response.headers.getSetCookie())
      responseHeaders.push({ name: 'set-cookie', value: cookie });
    return {
      status: response.status,
      headers: responseHeaders,
      body: await response.text(),
    };
  },
});
function audienceFor(issuer: string) {
  return `${new URL(issuer).origin}/api/v2`;
}
