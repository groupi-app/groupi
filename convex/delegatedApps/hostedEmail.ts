/** Delivery boundary shared by hosted Better Auth sign-in; sender mailbox stays operator-owned. */
type Appearance = { brandName: string; senderName: string; accent: string };
type Message = { from: string; to: string; subject: string; html: string };
function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    character =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ]!
  );
}
function interactionFromMagicLink(url: string, siteOrigin: string) {
  try {
    const verification = new URL(url);
    const origin = new URL(siteOrigin).origin;
    if (verification.origin !== origin) return null;
    const callbacks = verification.searchParams.getAll('callbackURL');
    if (callbacks.length !== 1) return null;
    const callback = new URL(callbacks[0], origin);
    if (callback.origin !== origin) return null;
    let continuation = callback;
    if (callback.pathname === '/onboarding') {
      const redirects = callback.searchParams.getAll('redirect');
      if (redirects.length !== 1) return null;
      // The web callback double-encodes nested consent queries for Better Auth.
      continuation = new URL(decodeURIComponent(redirects[0]), origin);
    }
    if (
      continuation.origin !== origin ||
      !['/oauth/consent', '/oauth/discord'].includes(continuation.pathname)
    )
      return null;
    const ids = continuation.searchParams.getAll(
      continuation.pathname === '/oauth/discord' ? 'state' : 'interactionId'
    );
    return ids.length === 1 && ids[0] ? ids[0] : null;
  } catch {
    return null;
  }
}
export async function deliverMagicLink({
  email,
  url,
  siteOrigin,
  from,
  lookup,
  send,
}: {
  email: string;
  url: string;
  siteOrigin: string;
  from: string;
  lookup: (interactionId: string) => Promise<Appearance | null>;
  send: (message: Message) => Promise<{ error: unknown }>;
}) {
  const interactionId = interactionFromMagicLink(url, siteOrigin);
  const appearance = interactionId ? await lookup(interactionId) : null;
  const brand = appearance?.brandName ?? 'Groupi';
  const mailbox = from.match(/<([^<>]+)>$/)?.[1] ?? from;
  const sender = appearance ? `${appearance.senderName} <${mailbox}>` : from;
  const result = await send({
    from: sender,
    to: email,
    subject: `Sign in to ${brand}`,
    html: `<html><body><h1 style="color:${appearance?.accent ?? '#2563eb'}">${escapeHtml(brand)}</h1>
      <p>Sign-in provided by Groupi</p><p>Open this link in the browser where you started sign-in. This link expires in 5 minutes and can be used once.</p>
      <p><a href="${escapeHtml(url)}">Sign in to ${escapeHtml(brand)}</a></p>
      <p>If the link has expired, was used, or opened in another browser, return to the app and request a new link. If you did not request it, ignore this email.</p></body></html>`,
  });
  if (result.error)
    throw new Error('Sign-in email could not be delivered. Please try again.');
}
