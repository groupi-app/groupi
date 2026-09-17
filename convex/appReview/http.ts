import { httpAction } from '../_generated/server';
import { internal } from '../_generated/api';

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    character =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character]!
  );
}

function page(content: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Groupi reviewer inbox</title></head><body><main>
    <h1>Groupi reviewer inbox</h1>${content}
    <form method="post" action="/app-review/inbox">
    <p><label>Inbox access key <input type="password" name="accessKey" required
    autocomplete="off" minlength="64" maxlength="64"></label></p>
    <button type="submit">View current sign-in code</button></form>
    <p>Request a code in Groupi first, then enter the inbox access key provided in
    the store review instructions. The app uses email codes, not passwords.</p>
    </main></body></html>`,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
        Pragma: 'no-cache',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        'Content-Security-Policy':
          "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
      },
    }
  );
}

export const inbox = httpAction(async (ctx, request) => {
  if (process.env.APP_REVIEW_INBOX_ENABLED !== 'true')
    return page('<p>Inbox unavailable.</p>', 404);
  // Never accept a credential in a URL, cookie, or cross-origin form.
  if (new URL(request.url).search)
    return page('<p>Use the access-key form.</p>', 400);
  if (request.method === 'GET') return page('');
  const origin = request.headers.get('origin');
  if (
    (origin && origin !== new URL(request.url).origin) ||
    !request.headers
      .get('content-type')
      ?.startsWith('application/x-www-form-urlencoded')
  ) {
    return page('<p>Invalid request.</p>', 400);
  }
  const reader = request.body?.getReader();
  if (!reader) return page('<p>Invalid request.</p>', 400);
  let body = '';
  let bytes = 0;
  const decoder = new TextDecoder();
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > 256) {
      await reader.cancel();
      return page('<p>Invalid request.</p>', 400);
    }
    body += decoder.decode(chunk.value, { stream: true });
  }
  body += decoder.decode();
  const form = new URLSearchParams(body);
  if (
    form.getAll('accessKey').length !== 1 ||
    Array.from(form.keys()).some(key => key !== 'accessKey')
  ) {
    return page('<p>Invalid request.</p>', 400);
  }
  const result = await ctx.runQuery(internal.appReview.queries.readInbox, {
    accessKey: form.get('accessKey') ?? '',
  });
  if (!result)
    return page('<p>Access denied or review access has expired.</p>', 403);
  const content = result.otp
    ? `<p>Demo account: <strong>${escapeHtml(result.email)}</strong></p><p>Current sign-in code: <strong>${result.otp}</strong></p><p>Expires at ${new Date(result.expiresAt!).toISOString()}. Enter it in Groupi’s verification-code field. Codes are single-use.</p>`
    : `<p>Demo account: <strong>${escapeHtml(result.email)}</strong></p><p>No usable sign-in code. Request a new code in Groupi, then check this inbox again.</p>`;
  return page(content);
});
