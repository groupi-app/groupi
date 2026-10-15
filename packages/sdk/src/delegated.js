import { GroupiError, Transport } from './transport.js';
export const delegatedActions = Object.freeze([
  'groups.context.read',
  'groups.events.read',
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
]);
function configuration(config) {
  const origin = new Transport({
    instance: config.instance,
    credential: {
      type: 'delegated',
      audience: 'validate',
      getToken: async () => ({}),
    },
  }).origin;
  if (
    config.issuer !== origin + '/oauth' ||
    config.audience !== origin + '/api/v2' ||
    !config.clientId ||
    !['native', 'confidentialWeb'].includes(config.clientType)
  )
    throw new TypeError('Explicit instance-bound OAuth profile required');
  if (
    config.clientType === 'confidentialWeb' &&
    typeof config.getClientAssertion !== 'function'
  )
    throw new TypeError('private_key_jwt signer required');
  if (
    !Array.isArray(config.actions) ||
    new Set(config.actions).size !== config.actions.length ||
    config.actions.some(action => !delegatedActions.includes(action))
  )
    throw new TypeError('Choose distinct supported delegated actions');
  return {
    ...config,
    instance: origin,
    actions: Object.freeze([...config.actions]),
  };
}
function randomValue() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64url(bytes);
}
function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}
/** An explicit approved OAuth adapter for opaque API access; identity JWTs are not consumed. */
export class DelegatedSession {
  constructor(config) {
    if (typeof globalThis.window !== 'undefined')
      throw new TypeError(
        'Native/confidential OAuth adapter is unavailable in browser runtimes; provide a verified bearer token explicitly'
      );
    this.config = configuration(config);
    this.tokens = undefined;
    this.pending = undefined;
    this.background = false;
  }
  static restore(config, state) {
    const session = new DelegatedSession(config);
    if (
      !state ||
      state.instance !== session.config.instance ||
      state.issuer !== session.config.issuer ||
      state.audience !== session.config.audience ||
      state.clientId !== session.config.clientId ||
      state.clientType !== session.config.clientType ||
      typeof state.background !== 'boolean' ||
      state.background !== Boolean(state.refreshToken) ||
      typeof state.accessToken !== 'string' ||
      !state.accessToken ||
      !Number.isFinite(state.expiresAt) ||
      !Array.isArray(state.grantedActions) ||
      state.grantedActions.some(
        action => !session.config.actions.includes(action)
      ) ||
      (state.refreshToken !== undefined &&
        (typeof state.refreshToken !== 'string' || !state.refreshToken))
    )
      throw new GroupiError('Invalid stored delegated state', {
        code: 'INVALID_TOKEN_RESPONSE',
      });
    session.tokens = {
      accessToken: state.accessToken,
      expiresAt: state.expiresAt,
      refreshToken: state.refreshToken,
    };
    session.grantedActions = [...state.grantedActions].sort();
    session.background = Boolean(state.refreshToken);
    return session;
  }
  static async authorizationRequest(
    config,
    { redirectUri, background = false, selectedGroupId }
  ) {
    config = configuration(config);
    const state = randomValue(),
      nonce = randomValue(),
      codeVerifier = randomValue();
    const challenge = base64url(
      new Uint8Array(
        await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(codeVerifier)
        )
      )
    );
    const url = new URL(config.issuer + '/auth');
    url.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: [
        'openid',
        ...config.actions,
        ...(background ? ['offline_access'] : []),
      ].join(' '),
      state,
      nonce,
      prompt: 'consent',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      resource: config.audience,
    }).toString();
    if (selectedGroupId) url.searchParams.set('group_id', selectedGroupId);
    return {
      url: url.href,
      state,
      nonce,
      codeVerifier,
      redirectUri,
      background,
    };
  }
  static async fromAuthorizationCode(
    config,
    {
      code,
      codeVerifier,
      redirectUri,
      state,
      expectedState,
      background = false,
    },
    options = {}
  ) {
    if (!code || !codeVerifier || !state || state !== expectedState)
      throw new GroupiError('Authorization state mismatch', {
        code: 'INVALID_AUTHORIZATION_RESPONSE',
      });
    const session = new DelegatedSession(config);
    session.background = background;
    const tokens = await session.tokenRequest(
      {
        grant_type: 'authorization_code',
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
      },
      options.signal
    );
    session.adopt(tokens, false);
    await session.persist();
    return session;
  }
  adopt(tokens, renewal) {
    const scopes =
      tokens && typeof tokens.scope === 'string'
        ? tokens.scope.split(' ').filter(Boolean).sort()
        : undefined;
    if (
      !tokens ||
      tokens.token_type?.toLowerCase() !== 'bearer' ||
      typeof tokens.access_token !== 'string' ||
      !tokens.access_token ||
      !Number.isFinite(tokens.expires_in) ||
      tokens.expires_in <= 0 ||
      tokens.expires_in > 300 ||
      !scopes ||
      new Set(scopes).size !== scopes.length ||
      scopes.some(scope => !this.config.actions.includes(scope)) ||
      (renewal && scopes.join(' ') !== this.grantedActions.join(' '))
    )
      throw new GroupiError('Token response exceeds approved grant', {
        code: 'INVALID_TOKEN_RESPONSE',
      });
    if (
      tokens.refresh_token !== undefined &&
      (typeof tokens.refresh_token !== 'string' || !tokens.refresh_token)
    )
      throw new GroupiError('Malformed refresh token', {
        code: 'INVALID_TOKEN_RESPONSE',
      });
    if (tokens.refresh_token && !this.background)
      throw new GroupiError('Background renewal was not selected', {
        code: 'BACKGROUND_CONSENT_REQUIRED',
      });
    if (
      renewal &&
      (!tokens.refresh_token ||
        tokens.refresh_token === this.tokens.refreshToken)
    )
      throw new GroupiError('Refresh token did not rotate', {
        code: 'INVALID_TOKEN_RESPONSE',
      });
    this.grantedActions = scopes;
    this.tokens = {
      accessToken: tokens.access_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      refreshToken: tokens.refresh_token,
    };
  }
  async persist() {
    if (this.config.storeTokens)
      await this.config.storeTokens(
        this.tokens
          ? {
              ...this.tokens,
              grantedActions: [...this.grantedActions],
              instance: this.config.instance,
              issuer: this.config.issuer,
              audience: this.config.audience,
              clientId: this.config.clientId,
              clientType: this.config.clientType,
              background: Boolean(this.tokens.refreshToken),
            }
          : null
      );
  }
  async tokenRequest(fields, signal) {
    const endpoint = this.config.issuer + '/token';
    const body = new URLSearchParams({
      ...fields,
      client_id: this.config.clientId,
    });
    if (this.config.clientType === 'confidentialWeb') {
      const assertion = await this.config.getClientAssertion({
        tokenEndpoint: endpoint,
        clientId: this.config.clientId,
        signal,
      });
      if (typeof assertion !== 'string' || !assertion)
        throw new GroupiError('Client assertion unavailable', {
          code: 'INVALID_CLIENT',
        });
      body.set(
        'client_assertion_type',
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'
      );
      body.set('client_assertion', assertion);
    }
    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body,
        redirect: 'manual',
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(30000)])
          : AbortSignal.timeout(30000),
      });
    } catch (cause) {
      throw new GroupiError('Token exchange outcome unknown', {
        code: 'TOKEN_TRANSPORT_ERROR',
        uncertain: true,
        details: cause,
      });
    }
    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel();
      throw new GroupiError('Token redirect refused', {
        status: response.status,
        code: 'REDIRECT_REFUSED',
      });
    }
    const reader = response.body?.getReader();
    let size = 0;
    const chunks = [];
    try {
      if (reader)
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > 65536) {
            await reader.cancel();
            throw new Error('Token response exceeds limit');
          }
          chunks.push(value);
        }
    } catch {
      throw new GroupiError('Incomplete token response', {
        code: 'INVALID_TOKEN_RESPONSE',
        uncertain: true,
      });
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    let result;
    try {
      result = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      throw new GroupiError('Invalid token response', {
        code: 'INVALID_TOKEN_RESPONSE',
        uncertain: true,
      });
    }
    if (!response.ok)
      throw new GroupiError('Token endpoint denied request', {
        status: response.status,
        code: typeof result.error === 'string' ? result.error : 'OAUTH_ERROR',
        uncertain: response.status >= 500,
      });
    return result;
  }
  async refresh(options = {}) {
    if (this.pending) return this.pending;
    if (!this.tokens?.refreshToken)
      throw new GroupiError('No background renewal grant', {
        code: 'UNAUTHORIZED',
      });
    this.pending = (async () => {
      try {
        const response = await this.tokenRequest(
          {
            grant_type: 'refresh_token',
            refresh_token: this.tokens.refreshToken,
          },
          options.signal
        );
        this.adopt(response, true);
        await this.persist();
      } catch (error) {
        this.tokens = undefined;
        await this.persist();
        throw error;
      } finally {
        this.pending = undefined;
      }
    })();
    return this.pending;
  }
  async getToken({ instance, audience, signal }) {
    if (instance !== this.config.instance || audience !== this.config.audience)
      throw new GroupiError('Delegated instance or audience mismatch', {
        code: 'UNAUTHORIZED',
      });
    if (!this.tokens)
      throw new GroupiError('Delegated session is disconnected', {
        code: 'UNAUTHORIZED',
      });
    if (this.tokens.expiresAt <= Date.now() + 30000)
      await this.refresh({ signal });
    return {
      accessToken: this.tokens.accessToken,
      expiresAt: this.tokens.expiresAt,
      instance: this.config.instance,
      audience: this.config.audience,
    };
  }
  credential() {
    return {
      type: 'delegated',
      audience: this.config.audience,
      getToken: input => this.getToken(input),
    };
  }
}
