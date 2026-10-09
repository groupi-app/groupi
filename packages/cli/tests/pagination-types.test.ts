import { expectTypeOf, it } from 'vitest';
import type { listAddons } from '../src/addons.js';
import type { listDiscordGuilds } from '../src/discord.js';
import type { discoverEvents } from '../src/event-management.js';
import type { listSocial } from '../src/social.js';

it('preserves the inferred item types of resource projections', () => {
  expectTypeOf<
    Awaited<ReturnType<typeof listAddons>>['items'][number]
  >().not.toBeAny();
  expectTypeOf<
    Awaited<ReturnType<typeof listDiscordGuilds>>['items'][number]
  >().not.toBeAny();
  expectTypeOf<
    Awaited<ReturnType<typeof discoverEvents>>['items'][number]
  >().not.toBeAny();
  expectTypeOf<
    Awaited<ReturnType<typeof listSocial>>['items'][number]
  >().not.toBeAny();
});
