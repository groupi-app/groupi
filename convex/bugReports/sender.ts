'use node';

// Only the server selects the Sentry project. Redirects and arbitrary origins
// cannot turn this into a public forwarding proxy.
export function configuredDestination() {
  try {
    const dsn = new URL(process.env.BUG_REPORT_SENTRY_DSN ?? '');
    if (
      dsn.protocol !== 'https:' ||
      dsn.password ||
      dsn.port ||
      dsn.search ||
      dsn.hash ||
      !/^[a-zA-Z0-9]{1,64}$/.test(dsn.username) ||
      !/^\/[0-9]+$/.test(dsn.pathname) ||
      !/^o[0-9]+\.ingest(?:\.(?:us|de))?\.sentry\.io$/.test(dsn.hostname)
    )
      return null;
    return dsn;
  } catch {
    return null;
  }
}

/** An isolated supported envelope sender: deliberately no browser Sentry SDK. */
export async function sendFeedback(
  feedback: {
    message: string;
    email?: string;
    replayId?: string;
    release?: string;
  },
  eventId: string,
  images: { bytes: Uint8Array; mimeType: string; filename: string }[]
) {
  const dsn = configuredDestination();
  if (!dsn) return { status: 'failed' as const, code: 'unavailable' };
  const endpoint = `${dsn.origin}/api/${dsn.pathname.slice(1)}/envelope/?sentry_key=${dsn.username}&sentry_version=7`;
  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    type: 'feedback',
    platform: 'javascript',
    level: 'info',
    release: feedback.release,
    contexts: {
      feedback: {
        message: feedback.message,
        contact_email: feedback.email,
        replay_id: feedback.replayId,
      },
    },
  };
  const eventBytes = new TextEncoder().encode(
    [
      JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() }),
      JSON.stringify({ type: 'feedback' }),
      JSON.stringify(event),
      '',
    ].join('\n')
  );
  const chunks: Uint8Array[] = [eventBytes];
  for (const image of images) {
    chunks.push(
      new TextEncoder().encode(
        JSON.stringify({
          type: 'attachment',
          length: image.bytes.byteLength,
          filename: image.filename,
          content_type: image.mimeType,
        }) + '\n'
      ),
      image.bytes,
      new Uint8Array([10])
    );
  }
  const body = Buffer.concat(chunks);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      redirect: 'error',
      signal: controller.signal,
    });
    // Do not read/log upstream bodies. Their contents are unnecessary for an
    // acceptance decision and could contain user data or be unbounded.
    void response.body?.cancel().catch(() => undefined);
    if (response.ok) return { status: 'accepted' as const, eventId };
    if (response.status === 429) {
      const seconds = Number(response.headers.get('retry-after'));
      return {
        status: 'failed' as const,
        code: 'rate-limited',
        retryAfterMs:
          Number.isFinite(seconds) && seconds > 0
            ? Math.min(seconds * 1000, 3_600_000)
            : 60_000,
      };
    }
    if (response.status >= 500)
      return {
        status: 'outcome-unknown' as const,
        code: 'upstream-unavailable',
      };
    return { status: 'failed' as const, code: 'upstream-rejected' };
  } catch {
    return { status: 'outcome-unknown' as const, code: 'network-uncertain' };
  } finally {
    clearTimeout(timer);
  }
}
