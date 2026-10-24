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

/** Narrow server-only join helper: validate actual application/scope/identity before using a token. */
export async function joinDiscordGuild(
  ctx: ActionCtx,
  accountId: string,
  guildId: string,
  botToken: string,
  authorize: () => Promise<boolean>
): Promise<Response | null> {
  const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
  const tokens = await auth.api.getAccessToken({
    body: { providerId: 'discord', accountId },
    headers,
  });
  if (!tokens.accessToken) return null;
  const authorization = { Authorization: `Bearer ${tokens.accessToken}` };
  const [infoResponse, identityResponse] = await Promise.all([
    fetch('https://discord.com/api/v10/oauth2/@me', { headers: authorization }),
    fetch('https://discord.com/api/v10/users/@me', { headers: authorization }),
  ]);
  if (!infoResponse.ok || !identityResponse.ok) return null;
  const info: {
    application?: { id: string };
    scopes?: string[];
    expires?: string;
  } = await infoResponse.json();
  const identity: { id: string } = await identityResponse.json();
  if (
    identity.id !== accountId ||
    info.application?.id !== process.env.DISCORD_CLIENT_ID ||
    !info.scopes?.includes('guilds.join') ||
    !info.expires ||
    !Number.isFinite(Date.parse(info.expires)) ||
    Date.parse(info.expires) <= Date.now()
  )
    return null;
  if (!(await authorize()))
    throw new Error('Group access changed before joining Discord.');
  return fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${accountId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: tokens.accessToken }),
    }
  );
}
