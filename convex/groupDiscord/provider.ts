'use node';
import type { ActionCtx } from '../_generated/server';
import { internal } from '../_generated/api';

export class ProviderFailure extends Error {
  constructor(
    message: string,
    public delay = 300000
  ) {
    super(message);
  }
}

/** Durable bot-wide and conservative per-guild route-family pauses preserve provider retry windows. */
export async function discordBot(
  ctx: ActionCtx,
  path: string,
  init: RequestInit = {}
) {
  const route = `${init.method ?? 'GET'}:${path
    .split('?')[0]
    .replace(/\/members\/[^/]+/g, '/members/:identity')
    .replace(/\/roles\/[^/]+/g, '/roles/:role')}`;
  const pause = await ctx.runQuery(
    internal.groupDiscord.reconciliation.providerPause,
    { scope: route }
  );
  if (pause > Date.now())
    throw new ProviderFailure(
      'Discord synchronization rate limited; retry pending.',
      pause - Date.now()
    );
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token)
    throw new ProviderFailure(
      'Discord bot unavailable. Contact the Groupi administrator.'
    );
  const response = await fetch(`https://discord.com/api/v10${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bot ${token}` },
  });
  if (response.status === 429) {
    const body: { retry_after?: number; global?: boolean } | null =
      await response.json().catch(() => null);
    const seconds = Number(
      response.headers.get('Retry-After') ??
        body?.retry_after ??
        response.headers.get('X-RateLimit-Reset-After') ??
        1
    );
    const delay = Number.isFinite(seconds)
      ? Math.max(1000, seconds * 1000)
      : 300000;
    const global =
      body?.global === true ||
      response.headers.get('X-RateLimit-Global') === 'true';
    await ctx.runMutation(internal.groupDiscord.reconciliation.pauseProvider, {
      until: Date.now() + delay,
      scope: global ? 'bot' : route,
    });
    throw new ProviderFailure(
      'Discord synchronization rate limited; retry pending.',
      delay
    );
  }
  if (response.status >= 500)
    throw new ProviderFailure(
      'Discord temporarily unavailable; retry pending.',
      5000
    );
  return response;
}
