import { z } from 'zod';
import { actions } from '../authorization/contracts';
export const scopesSchema = z.array(
  z.enum(['openid', 'offline_access', ...actions])
);
export function parseScopeString(value: string) {
  return scopesSchema.parse(value ? value.split(' ') : []);
}
const scopeString = z
  .string()
  .refine(
    value => scopesSchema.safeParse(value ? value.split(' ') : []).success
  );

/** Strict serialization profile for oidc-provider 9.12.2; new upstream fields fail closed. */
export const modelSchema = z.enum([
  'Client',
  'AccessToken',
  'RefreshToken',
  'AuthorizationCode',
  'Grant',
  'Interaction',
  'Session',
  'ReplayDetection',
]);
const claimRequest = z.union([
  z.null(),
  z
    .object({
      essential: z.boolean().optional(),
      value: z.string().optional(),
      values: z.array(z.string()).optional(),
    })
    .strict(),
]);
const claimSet = z
  .object({
    sub: claimRequest.optional(),
    name: claimRequest.optional(),
    email: claimRequest.optional(),
    auth_time: claimRequest.optional(),
    acr: claimRequest.optional(),
  })
  .strict();
const claims = z
  .object({ id_token: claimSet.optional(), userinfo: claimSet.optional() })
  .strict();
const base = { iat: z.number(), exp: z.number().optional(), kind: modelSchema };
const authenticated = {
  accountId: z.string(),
  clientId: z.string(),
  grantId: z.string(),
  scope: scopeString,
  authTime: z.number().optional(),
  acr: z.string().optional(),
  amr: z.array(z.string()).optional(),
  nonce: z.string().optional(),
  claims: claims.optional(),
  sid: z.string().optional(),
  sessionUid: z.string().optional(),
  expiresWithSession: z.boolean().optional(),
  resource: z.union([z.string(), z.array(z.string())]).optional(),
};
const openid = z
  .object({
    scope: scopeString.optional(),
    claims: z.array(z.string()).optional(),
  })
  .strict();
const resources = z.record(z.string(), scopeString);
const grantShape = {
  ...base,
  accountId: z.string(),
  clientId: z.string(),
  openid: openid.optional(),
  resources: resources.optional(),
  rejected: z
    .object({ openid: openid.optional(), resources: resources.optional() })
    .strict()
    .optional(),
};
const result = z
  .object({
    login: z
      .object({
        accountId: z.string(),
        remember: z.boolean().optional(),
        ts: z.number().optional(),
        acr: z.string().optional(),
        amr: z.array(z.string()).optional(),
      })
      .strict()
      .optional(),
    consent: z.object({ grantId: z.string() }).strict().optional(),
    error: z.string().optional(),
    error_description: z.string().optional(),
  })
  .strict();
const params = z
  .object({
    client_id: z.string(),
    redirect_uri: z.string().optional(),
    response_type: z.literal('code'),
    scope: scopeString,
    state: z.string().optional(),
    nonce: z.string().optional(),
    code_challenge: z.string(),
    code_challenge_method: z.literal('S256'),
    resource: z.union([z.string(), z.array(z.string())]).optional(),
    prompt: z.string().optional(),
    max_age: z.string().optional(),
    login_hint: z.string().optional(),
    id_token_hint: z.string().optional(),
    response_mode: z.enum(['query', 'form_post']).optional(),
    claims: z.string().optional(),
  })
  .strict();
const schemas = {
  AccessToken: z
    .object({
      ...base,
      ...authenticated,
      aud: z.union([z.string(), z.array(z.string())]).optional(),
      gty: z.string().optional(),
      extra: z.object({}).strict().optional(),
    })
    .strict(),
  RefreshToken: z
    .object({
      ...base,
      ...authenticated,
      consumed: z.number().optional(),
      gty: z.string().optional(),
      rotations: z.number().optional(),
      iiat: z.number().optional(),
    })
    .strict(),
  AuthorizationCode: z
    .object({
      ...base,
      ...authenticated,
      consumed: z.number().optional(),
      codeChallenge: z.string(),
      codeChallengeMethod: z.literal('S256'),
      redirectUri: z.string(),
    })
    .strict(),
  Grant: z.object(grantShape).strict(),
  Interaction: z
    .object({
      ...base,
      params,
      prompt: z
        .object({
          name: z.enum(['login', 'consent']),
          reasons: z.array(z.string()),
          details: z
            .object({
              missingOIDCScope: z.array(z.string()).optional(),
              missingOIDCClaims: z.array(z.string()).optional(),
              missingResourceScopes: z
                .record(z.string(), z.array(z.string()))
                .optional(),
            })
            .strict(),
        })
        .strict(),
      session: z
        .object({
          accountId: z.string(),
          uid: z.string(),
          cookie: z.string(),
          acr: z.string().optional(),
          amr: z.array(z.string()).optional(),
        })
        .strict()
        .optional(),
      result: result.optional(),
      returnTo: z.string(),
      trusted: z.array(z.string()).optional(),
      grantId: z.string().optional(),
      lastSubmission: result.optional(),
      cid: z.string().optional(),
    })
    .strict(),
  Session: z
    .object({
      ...base,
      uid: z.string(),
      accountId: z.string().optional(),
      loginTs: z.number().optional(),
      transient: z.boolean().optional(),
      state: z.string().optional(),
      acr: z.string().optional(),
      amr: z.array(z.string()).optional(),
      authorizations: z
        .record(
          z.string(),
          z
            .object({
              sid: z.string().optional(),
              grantId: z.string().optional(),
              persistsLogout: z.boolean().optional(),
            })
            .strict()
        )
        .optional(),
    })
    .strict(),
  ReplayDetection: z.object({ ...base, iss: z.string() }).strict(),
};
export function validatePayload(
  model: z.infer<typeof modelSchema>,
  serialized: string
) {
  if (model === 'Client')
    throw new Error('Client metadata is owned by app registration');
  const payload: unknown = JSON.parse(serialized);
  const validated = schemas[model].parse(payload);
  if (validated.kind !== model)
    throw new Error('Provider payload model mismatch');
  return validated;
}

const base64url = z.string().regex(/^[A-Za-z0-9_-]+$/);
const publicRsa = z
  .object({
    kty: z.literal('RSA'),
    kid: z.string().min(1).max(100),
    alg: z.literal('RS256'),
    use: z.literal('sig').optional(),
    n: base64url.min(342).max(2048),
    e: base64url,
  })
  .strict();
const publicEc = z
  .object({
    kty: z.literal('EC'),
    kid: z.string().min(1).max(100),
    alg: z.literal('ES256'),
    use: z.literal('sig').optional(),
    crv: z.literal('P-256'),
    x: base64url.length(43),
    y: base64url.length(43),
  })
  .strict();
export const publicJwksSchema = z
  .object({
    keys: z
      .array(z.union([publicRsa, publicEc]))
      .min(1)
      .max(5),
  })
  .strict()
  .refine(
    value => new Set(value.keys.map(key => key.kid)).size === value.keys.length
  );
export const signingJwksSchema = z
  .object({
    keys: z
      .array(
        publicRsa
          .extend({
            d: base64url,
            p: base64url,
            q: base64url,
            dp: base64url,
            dq: base64url,
            qi: base64url,
          })
          .strict()
      )
      .min(1)
      .max(5),
  })
  .strict();

export const accessTokenPayloadSchema = schemas.AccessToken;
