import {
  BUG_REPORT_LIMITS,
  readBoundedText,
  parseBugReportResult,
} from '@groupi/shared/utils';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });

/** Narrow approved transport exception. All report business logic is Convex-owned. */
export async function forwardBugReport(
  request: Request,
  operation: 'submit' | 'receipt'
) {
  const secret = process.env.BUG_REPORT_PROXY_SECRET;
  const ip = request.headers.get('x-vercel-forwarded-for');
  if (
    process.env.VERCEL !== '1' ||
    !secret ||
    secret.length < 32 ||
    secret.length > 256 ||
    !ip ||
    !isIP(ip)
  )
    return json({ status: 'failed', code: 'unavailable' }, 503);
  let origin: URL;
  try {
    origin = new URL(process.env.BUG_REPORT_CONVEX_SITE_URL ?? '');
    if (
      origin.protocol !== 'https:' ||
      !/^[a-z0-9-]+\.convex\.site$/.test(origin.hostname) ||
      origin.port ||
      origin.username ||
      origin.password ||
      origin.pathname !== '/' ||
      origin.search ||
      origin.hash
    )
      throw new Error('invalid fixed backend');
  } catch {
    return json({ status: 'failed', code: 'unavailable' }, 503);
  }
  if (request.method !== 'POST')
    return json({ status: 'failed', code: 'invalid-input' }, 405);
  if (new URL(request.url).search)
    return json({ status: 'failed', code: 'invalid-input' }, 400);
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json')
    return json({ status: 'failed', code: 'invalid-input' }, 415);
  const requestOrigin = request.headers.get('origin');
  if (requestOrigin && requestOrigin !== new URL(request.url).origin)
    return json({ status: 'failed', code: 'forbidden' }, 403);
  const maxBytes =
    operation === 'receipt' ? 1024 : BUG_REPORT_LIMITS.requestBytes;
  const contentLength = Number(request.headers.get('content-length'));
  if (contentLength > maxBytes)
    return json({ status: 'failed', code: 'request-too-large' }, 413);
  let body: string;
  try {
    body = await readBoundedText(request.body, maxBytes, 10_000);
  } catch (error) {
    const code =
      error instanceof Error && error.message === 'request-too-large'
        ? 'request-too-large'
        : 'invalid-input';
    return json(
      { status: 'failed', code },
      code === 'request-too-large' ? 413 : 400
    );
  }
  const networkKey = createHmac('sha256', secret)
    .update(`bug-report-network:${ip}`)
    .digest('hex');
  const headers = new Headers({
    'Content-Type': 'application/json',
    'x-groupi-bug-proxy': secret,
    'x-groupi-bug-network': networkKey,
  });
  const authorization = request.headers.get('authorization');
  if (authorization) {
    if (
      authorization.length > 8192 ||
      !/^Bearer [A-Za-z0-9._-]+$/.test(authorization)
    )
      return json({ status: 'failed', code: 'invalid-input' }, 400);
    headers.set('Authorization', authorization);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(
      `${origin.origin}/bug-reports${operation === 'receipt' ? '/receipt' : ''}`,
      {
        method: 'POST',
        headers,
        body,
        redirect: 'error',
        signal: controller.signal,
      }
    );
    const outcome = parseBugReportResult(
      JSON.parse(await readBoundedText(response.body, 4096, 5000))
    );
    if (!outcome)
      return json(
        { status: 'outcome-unknown', code: 'network-uncertain' },
        502
      );
    return json(outcome, response.status);
  } catch {
    return json({ status: 'outcome-unknown', code: 'network-uncertain' }, 502);
  } finally {
    clearTimeout(timer);
  }
}
