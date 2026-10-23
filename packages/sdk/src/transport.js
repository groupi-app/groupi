/** A server error preserves its status and public wire error. */
export class GroupiError extends Error {
  constructor(
    message,
    { status = 0, code = 'TRANSPORT_ERROR', details, uncertain = false } = {}
  ) {
    super(message);
    this.name = 'GroupiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.uncertain = uncertain;
  }
}
export class Transport {
  constructor({
    instance,
    credential,
    retries = 2,
    timeoutMs = 30000,
    maxResponseBytes = 4 * 1024 * 1024,
  }) {
    const url = new URL(instance);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (url.pathname !== '/' && url.pathname !== '')
    )
      throw new TypeError('instance must be an origin');
    if (
      url.protocol !== 'https:' &&
      !(
        url.protocol === 'http:' &&
        ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
      )
    )
      throw new TypeError('HTTPS required outside loopback');
    if (
      !credential ||
      !['apiKey', 'boundedApiKey', 'delegated'].includes(credential.type)
    )
      throw new TypeError('Explicit credential mode required');
    if (
      ['apiKey', 'boundedApiKey'].includes(credential.type) &&
      typeof globalThis.window !== 'undefined'
    )
      throw new TypeError('API key credentials are server-only');
    if (
      ['apiKey', 'boundedApiKey'].includes(credential.type) &&
      !credential.key
    )
      throw new TypeError('API key required');
    if (
      credential.type === 'delegated' &&
      (typeof credential.getToken !== 'function' || !credential.audience)
    )
      throw new TypeError('Delegated token provider required');
    if (
      !Number.isInteger(retries) ||
      retries < 0 ||
      retries > 5 ||
      !Number.isSafeInteger(timeoutMs) ||
      timeoutMs <= 0 ||
      !Number.isSafeInteger(maxResponseBytes) ||
      maxResponseBytes <= 0
    )
      throw new TypeError('Invalid transport bounds');
    if (
      credential.type === 'boundedApiKey' &&
      !credential.key.startsWith('grp_b_')
    )
      throw new TypeError('Bounded API key required');
    if (credential.type === 'apiKey' && credential.key.startsWith('grp_b_'))
      throw new TypeError('Select boundedApiKey explicitly');
    this.origin = url.origin;
    this.credential = credential;
    this.retries = retries;
    this.timeoutMs = timeoutMs;
    this.maxResponseBytes = maxResponseBytes;
  }
  async request(method, path, input = {}, options = {}) {
    const url = new URL(
      '/api/v2' +
        path.replace(/\{([^}]+)\}/g, (_, key) => {
          const value = input.path?.[key];
          if (value === undefined)
            throw new TypeError('Missing path parameter: ' + key);
          return encodeURIComponent(String(value));
        }),
      this.origin
    );
    for (const [key, value] of Object.entries(input.query ?? {}))
      if (value !== undefined && value !== null)
        url.searchParams.set(key, String(value));
    if (!['GET', 'HEAD'].includes(method)) {
      const health = await this.health(options);
      if (health?.version !== '2.0.0')
        throw new GroupiError('Unsupported API version', {
          code: 'INCOMPATIBLE_API',
        });
      const capability = path.startsWith('/groups')
        ? 'groups'
        : path.startsWith('/addon-template-definitions')
          ? 'addonAuthoring'
          : path.includes('/member-invites')
            ? 'inviteWrites'
            : path.startsWith('/invite-lists')
              ? 'inviteLists'
              : undefined;
      if (capability && (health.capabilities?.[capability]?.version ?? 0) < 1)
        throw new GroupiError('Unsupported API capability: ' + capability, {
          code: 'INCOMPATIBLE_API',
        });
      if (
        path === '/events' &&
        options.idempotencyKey &&
        (health.capabilities?.eventCreationIdempotency?.version ?? 0) < 1
      )
        throw new GroupiError('Event create replay unsupported', {
          code: 'INCOMPATIBLE_API',
        });
    }
    const headers = { Accept: 'application/json' };
    if (['apiKey', 'boundedApiKey'].includes(this.credential.type))
      headers['x-api-key'] = this.credential.key;
    else {
      const token = await this.credential.getToken({
        instance: this.origin,
        audience: this.credential.audience,
        signal: options.signal,
      });
      if (
        !token ||
        token.instance !== this.origin ||
        token.audience !== this.credential.audience ||
        typeof token.accessToken !== 'string' ||
        (token.expiresAt !== undefined && token.expiresAt <= Date.now())
      )
        throw new GroupiError('Invalid or expired delegated token', {
          code: 'UNAUTHORIZED',
        });
      headers.Authorization = 'Bearer ' + token.accessToken;
    }
    if (options.idempotencyKey)
      headers['Idempotency-Key'] = options.idempotencyKey;
    if (input.body !== undefined) headers['Content-Type'] = 'application/json';
    if (input.rawBody !== undefined) {
      headers['Content-Type'] = input.contentType;
      headers['X-Filename'] = input.filename;
    }
    const safe = method === 'GET' || method === 'HEAD';
    for (let attempt = 0; ; attempt++) {
      options.signal?.throwIfAborted();
      const signal = options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(this.timeoutMs)])
        : AbortSignal.timeout(this.timeoutMs);
      let response;
      try {
        response = await fetch(url, {
          method,
          headers,
          body:
            input.rawBody ??
            (input.body === undefined ? undefined : JSON.stringify(input.body)),
          redirect: 'manual',
          signal,
        });
      } catch (cause) {
        if (options.signal?.aborted) {
          if (safe) throw cause;
          throw new GroupiError('Write cancelled after dispatch', {
            code: 'CANCELLED',
            uncertain: true,
            details: cause,
          });
        }
        if (safe && attempt < this.retries) continue;
        throw new GroupiError('Request failed', {
          uncertain: !safe,
          details: cause,
        });
      }
      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel();
        throw new GroupiError('Redirect refused', {
          status: response.status,
          code: 'REDIRECT_REFUSED',
        });
      }
      if (
        safe &&
        [429, 502, 503, 504].includes(response.status) &&
        attempt < this.retries
      ) {
        const delay = Number(response.headers.get('Retry-After') ?? 0);
        await response.body?.cancel();
        if (Number.isFinite(delay) && delay > 0) {
          if (delay > 5)
            throw new GroupiError('Retry delay exceeds automatic retry bound', {
              status: response.status,
              code: 'RATE_LIMITED',
            });
          await new Promise((resolve, reject) => {
            const timer = setTimeout(resolve, delay * 1000);
            options.signal?.addEventListener(
              'abort',
              () => {
                clearTimeout(timer);
                reject(options.signal.reason);
              },
              { once: true }
            );
          });
        }
        continue;
      }
      const reader = response.body?.getReader();
      let bytes = 0;
      const chunks = [];
      try {
        if (reader)
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > this.maxResponseBytes) {
              await reader.cancel();
              throw new GroupiError('Response exceeds byte limit', {
                code: 'INVALID_RESPONSE',
                uncertain: !safe,
              });
            }
            chunks.push(value);
          }
      } catch (cause) {
        if (cause instanceof GroupiError) throw cause;
        throw new GroupiError('Incomplete response', {
          uncertain: !safe,
          details: cause,
        });
      }
      const joined = new Uint8Array(bytes);
      let offset = 0;
      for (const chunk of chunks) {
        joined.set(chunk, offset);
        offset += chunk.byteLength;
      }
      let data;
      try {
        data = bytes ? JSON.parse(new TextDecoder().decode(joined)) : null;
      } catch {
        throw new GroupiError('Invalid JSON response', {
          status: response.status,
          code: 'INVALID_RESPONSE',
          uncertain: !safe,
        });
      }
      if (!response.ok)
        throw new GroupiError(data?.error?.message ?? 'API request failed', {
          status: response.status,
          code: data?.error?.code ?? 'HTTP_ERROR',
          details: data?.error,
          uncertain: !safe && response.status >= 500,
        });
      return response.status === 204 ? undefined : data;
    }
  }
  upload(
    data,
    {
      filename,
      mimeType = 'application/octet-stream',
      purpose = 'attachment',
      eventId,
    },
    options = {}
  ) {
    if (
      !(data instanceof Uint8Array) ||
      data.byteLength < 1 ||
      data.byteLength > 10 * 1024 * 1024
    )
      throw new TypeError('Upload must contain 1 byte to 10 MiB');
    if (
      !['attachment', 'avatar', 'cover'].includes(purpose) ||
      !filename ||
      /[\r\n]/.test(filename)
    )
      throw new TypeError('Invalid upload metadata');
    return this.request(
      'POST',
      '/uploads',
      {
        rawBody: data,
        filename,
        contentType: mimeType,
        query: { purpose, eventId },
      },
      options
    );
  }
  discardUpload(storageId, options = {}) {
    return this.request(
      'DELETE',
      '/uploads/{storageId}',
      { path: { storageId } },
      options
    );
  }
  async *iterate(path, input, adapter, options = {}) {
    const seen = new Set();
    let cursor = input.query?.cursor;
    if (cursor !== undefined) seen.add(cursor);
    for (let count = 0; count < (options.maxPages ?? 10000); count++) {
      const query = { ...input.query, cursor };
      if (adapter.mode) query.pagination = adapter.mode;
      const page = await this.request(
        'GET',
        path,
        { ...input, query },
        options
      );
      const items = page?.[adapter.items];
      const done = adapter.done
        ? page?.[adapter.done]
        : page?.[adapter.cursor] === null;
      const next = page?.[adapter.cursor];
      if (
        !Array.isArray(items) ||
        items.length > (query.limit ?? 100) ||
        (adapter.done && typeof done !== 'boolean') ||
        (!done &&
          (typeof next !== 'string' ||
            !next.length ||
            next.length > 16384 ||
            seen.has(next)))
      )
        throw new GroupiError('Malformed or cyclic pagination page', {
          code: 'INVALID_PAGE',
        });
      for (const item of items) yield item;
      if (done) return;
      seen.add(next);
      cursor = next;
    }
    throw new GroupiError('Page limit exceeded', { code: 'INVALID_PAGE' });
  }
  async *iterateEvents(query = {}, options = {}) {
    const seen = new Set();
    let cursor = query.cursor;
    if (cursor !== undefined) seen.add(cursor);
    const limit = query.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new TypeError('Event limit must be 1..100');
    for (
      let pageNumber = 0;
      pageNumber < (options.maxPages ?? 10000);
      pageNumber++
    ) {
      const page = await this.request(
        'GET',
        '/events',
        { query: { ...query, pagination: 'cursor', cursor, limit } },
        options
      );
      if (
        !page ||
        !Array.isArray(page.items) ||
        page.items.length > limit ||
        !(
          page.nextCursor === null ||
          (typeof page.nextCursor === 'string' &&
            page.nextCursor.length > 0 &&
            page.nextCursor.length <= 16384)
        )
      )
        throw new GroupiError('Malformed event page', { code: 'INVALID_PAGE' });
      if (page.nextCursor !== null && seen.has(page.nextCursor))
        throw new GroupiError('Cyclic pagination cursor', {
          code: 'INVALID_PAGE',
        });
      for (const event of page.items) yield event;
      if (page.nextCursor === null) return;
      seen.add(page.nextCursor);
      cursor = page.nextCursor;
    }
    throw new GroupiError('Page limit exceeded', { code: 'INVALID_PAGE' });
  }
  async health(options = {}) {
    return this.request('GET', '/health', {}, options);
  }
  async requireCapability(name, version = 1, options = {}) {
    const health = await this.health(options);
    if (
      health.version !== '2.0.0' ||
      (health.capabilities?.[name]?.version ?? 0) < version
    )
      throw new GroupiError('Unsupported API capability: ' + name, {
        code: 'INCOMPATIBLE_API',
      });
    return health;
  }
}
