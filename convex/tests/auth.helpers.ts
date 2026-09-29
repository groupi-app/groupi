import { components } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import betterAuthSchema from '../betterAuth/schema';
import { createTestInstance } from './test_helpers';

const betterAuthModules = import.meta.glob('../betterAuth/**/*.ts');

export function registerBetterAuth(t: ReturnType<typeof createTestInstance>) {
  t.registerComponent('betterAuth', betterAuthSchema, betterAuthModules);
}

/** Create real component credentials, optionally linking an existing scenario. */
export async function createAuthAccount(
  t: ReturnType<typeof createTestInstance>,
  username: string,
  existingPersonId?: Id<'persons'>
) {
  const now = Date.now();
  const user = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'user',
      data: {
        name: username,
        username,
        email: `${username}@example.com`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  const session = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'session',
      data: {
        userId: user._id,
        token: `${username}-session`,
        expiresAt: now + 3_600_000,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  const personId = await t.run(async ctx => {
    if (existingPersonId) {
      await ctx.db.patch(existingPersonId, { userId: user._id });
      return existingPersonId;
    }
    return ctx.db.insert('persons', { userId: user._id });
  });
  return {
    user,
    session,
    personId,
    auth: t.withIdentity({ subject: user._id, sessionId: session._id }),
  };
}
