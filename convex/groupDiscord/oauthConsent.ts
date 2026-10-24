import { createAuthMiddleware } from 'better-auth/api';

/** Better Auth owns session, state, callback validation and token storage. */
export const discordEnrollmentConsent = createAuthMiddleware(async ctx => {
  if (
    ctx.path !== '/link-social' ||
    ctx.body?.provider !== 'discord' ||
    !Array.isArray(ctx.body?.scopes) ||
    !ctx.body.scopes.includes('guilds.join')
  )
    return;
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
  url.searchParams.set('prompt', 'consent');
  if (!ctx.body.disableRedirect) ctx.setHeader('Location', url.toString());
  return ctx.json({ ...result, url: url.toString() });
});
