import type { ActionCtx } from '../_generated/server';
import { authComponent, createAuth } from '../auth';

/** Keep provider credentials on the server and let Better Auth rotate/store them. */
export async function fetchDiscordUserApi(
  ctx: ActionCtx,
  accountId: string,
  path: '/users/@me' | '/users/@me/guilds'
): Promise<Response> {
  const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
  // In our Better Auth version, accountId is Discord's user ID. Session headers
  // restrict the lookup to the authenticated user's linked accounts.
  const body = { providerId: 'discord', accountId };
  const tokens = await auth.api.getAccessToken({ body, headers });
  if (!tokens.accessToken) throw new Error('Discord access token is missing');
  return fetch(`https://discord.com/api/v10${path}`, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
}
