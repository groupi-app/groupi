import { httpAction } from '../_generated/server';
import { internal } from '../_generated/api';
/** The HTTP boundary only serializes the pinned instance request for the Node runtime. */
export const handler = httpAction(async (ctx, request) => {
  if (Number(request.headers.get('content-length') ?? 0) > 65536)
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 413,
    });
  const body =
    request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : await request.text();
  if (body && new TextEncoder().encode(body).length > 65536)
    return new Response(JSON.stringify({ error: 'invalid_request' }), {
      status: 413,
    });
  const headers: { name: string; value: string }[] = [];
  request.headers.forEach((value, name) => headers.push({ name, value }));
  try {
    const result = await ctx.runAction(internal.delegatedApps.provider.handle, {
      url: request.url,
      method: request.method as 'GET' | 'POST' | 'OPTIONS',
      headers,
      body,
    });
    const outgoing = new Headers();
    for (const { name: key, value } of result.headers) {
      if (key && value !== undefined) outgoing.append(key, value);
    }
    outgoing.set('cache-control', 'no-store');
    outgoing.set('referrer-policy', 'no-referrer');
    outgoing.set('x-content-type-options', 'nosniff');
    return new Response(result.body || null, {
      status: result.status,
      headers: outgoing,
    });
  } catch {
    // Browser recovery stays on the operator-configured frontend. Never copy
    // a caller's return/theme URL or a one-use approval into the error page.
    if (
      request.method === 'GET' &&
      request.headers.get('accept')?.includes('text/html')
    ) {
      try {
        const issuer = new URL(process.env.DELEGATED_ISSUER ?? '');
        const target = new URL(request.url);
        const prefix = `${issuer.pathname.replace(/\/$/, '')}/interaction/`;
        const interactionId = target.pathname.startsWith(prefix)
          ? decodeURIComponent(target.pathname.slice(prefix.length))
          : '';
        if (interactionId && !interactionId.includes('/')) {
          const recovery = new URL('/oauth/error', process.env.SITE_URL);
          recovery.searchParams.set('interactionId', interactionId);
          return new Response(null, {
            status: 303,
            headers: {
              location: recovery.href,
              'cache-control': 'no-store',
              'referrer-policy': 'no-referrer',
            },
          });
        }
      } catch {
        /* Invalid/missing operator configuration fails closed below. */
      }
    }
    return new Response(
      JSON.stringify({
        error: 'invalid_request',
        error_description:
          'Authorization could not be completed. Return to the app to reconnect.',
      }),
      {
        status: 400,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store',
        },
      }
    );
  }
});
