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
