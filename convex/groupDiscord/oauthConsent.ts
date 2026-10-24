import { createAuthMiddleware } from 'better-auth/api';

/** Better Auth owns session, state, callback validation and token storage. */
export async function discordLinkStateHash(state: unknown) {
  if (typeof state !== 'string' || !state) return undefined;
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(state)
  );
  return Array.from(new Uint8Array(digest), byte =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}
export const discordEnrollmentConsent = (
  record: (userId: string, hash: string) => Promise<void>
) =>
  createAuthMiddleware(async ctx => {
    if (ctx.path !== '/link-social' || ctx.body?.provider !== 'discord') return;
    const result = ctx.context.returned;
    if (
      !result ||
      typeof result !== 'object' ||
      !('url' in result) ||
      typeof result.url !== 'string' ||
      !result.url
    )
      return;
    const url = new URL(result.url);
    if (
      url.origin !== 'https://discord.com' ||
      url.pathname !== '/api/oauth2/authorize'
    )
      throw new Error('Unexpected Discord authorization destination.');
    const hash = await discordLinkStateHash(url.searchParams.get('state'));
    if (hash && ctx.context.session?.user.id)
      await record(ctx.context.session.user.id, hash);
    if (
      !Array.isArray(ctx.body?.scopes) ||
      !ctx.body.scopes.includes('guilds.join')
    )
      return;
    url.searchParams.set('prompt', 'consent');
    if (!ctx.body.disableRedirect) ctx.setHeader('Location', url.toString());
    return ctx.json({ ...result, url: url.toString() });
  });
