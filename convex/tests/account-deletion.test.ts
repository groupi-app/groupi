import { describe, expect, test } from 'vitest';
import { mutationGeneric } from 'convex/server';
import { v } from 'convex/values';
import { api, components } from '../_generated/api';
import betterAuthSchema from '../betterAuth/schema';
import { createTestInstance } from './test_helpers';
import { createAuthAccount, registerBetterAuth } from './auth_helpers';

async function seedCredentials(
  t: ReturnType<typeof createTestInstance>,
  userId: string
) {
  const now = Date.now();
  for (const providerId of ['credential', 'google']) {
    await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'account',
        data: {
          userId,
          providerId,
          accountId: `${userId}-${providerId}`,
          password: providerId === 'credential' ? 'password-hash' : undefined,
          accessToken: providerId === 'google' ? 'oauth-token' : undefined,
          refreshToken: providerId === 'google' ? 'refresh-token' : undefined,
          createdAt: now,
          updatedAt: now,
        },
      },
    });
  }
  await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'passkey',
      data: {
        userId,
        publicKey: 'test-public-key',
        credentialID: `${userId}-passkey`,
        counter: 0,
        deviceType: 'multiDevice',
        backedUp: true,
      },
    },
  });
  await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'apikey',
      data: {
        userId,
        key: `${userId}-api-key-hash`,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
}

async function readCredentials(
  t: ReturnType<typeof createTestInstance>,
  userId: string
) {
  const result = [];
  for (const model of [
    'user',
    'account',
    'session',
    'passkey',
    'apikey',
  ] as const) {
    result.push(
      await t.query(components.betterAuth.adapter.findMany, {
        model,
        where: [{ field: model === 'user' ? '_id' : 'userId', value: userId }],
        paginationOpts: { cursor: null, numItems: 200 },
      })
    );
  }
  return result.map(result => result.page);
}

describe('Account deletion with Better Auth', () => {
  test('revokes pending verification credentials across pages without deleting other emails or signing keys', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const current = await createAuthAccount(t, 'verification-user');
    const other = await createAuthAccount(t, 'verification-other');
    const now = Date.now();
    const createVerification = (identifier: string, value: string) =>
      t.mutation(components.betterAuth.adapter.create, {
        input: {
          model: 'verification',
          data: {
            identifier,
            value,
            expiresAt: now + 3_600_000,
            createdAt: now,
            updatedAt: now,
          },
        },
      });
    const deleted = [];
    const retained = [];
    for (const type of ['sign-in', 'email-verification', 'forget-password']) {
      deleted.push(
        await createVerification(
          `${type}-otp-${current.user.email}`,
          '123456:0'
        )
      );
      retained.push(
        await createVerification(`${type}-otp-${other.user.email}`, '654321:0')
      );
    }
    // Force the random-token checks onto later pages, including opaque values.
    for (let index = 0; index < 101; index++) {
      retained.push(
        await createVerification(`unrelated-${index}`, 'opaque-token')
      );
    }
    deleted.push(
      await createVerification(
        'current-magic-link',
        JSON.stringify({
          email: current.user.email.toUpperCase(),
          name: 'Current user',
        })
      ),
      await createVerification(
        'reset-password:current-reset',
        current.user._id
      ),
      await createVerification(
        'delete-account-current-delete',
        current.user._id
      ),
      await createVerification(
        'current-passkey-challenge',
        JSON.stringify({
          expectedChallenge: 'challenge',
          userData: { id: current.user._id },
        })
      )
    );
    retained.push(
      await createVerification(
        'other-magic-link',
        JSON.stringify({
          email: other.user.email,
          name: current.user.email,
        })
      ),
      await createVerification(
        'similar-email-magic-link',
        JSON.stringify({
          email: `prefix-${current.user.email}`,
        })
      ),
      await createVerification(
        `sign-in-otp-${current.user.email}.other`,
        '123456:0'
      ),
      await createVerification('reset-password:other-reset', other.user._id),
      await createVerification('delete-account-other-delete', other.user._id),
      await createVerification(
        'other-passkey-challenge',
        JSON.stringify({
          expectedChallenge: 'challenge',
          userData: { id: other.user._id },
        })
      ),
      await createVerification(
        'anonymous-passkey-challenge',
        JSON.stringify({
          expectedChallenge: 'challenge',
          userData: { id: '' },
        })
      ),
      await createVerification('unknown-format', current.user._id),
      await createVerification(
        'malformed-json',
        `{"email":"${current.user.email}`
      ),
      await createVerification('null-json', 'null')
    );
    const jwks = await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'jwks',
        data: {
          publicKey: 'shared-public',
          privateKey: 'shared-private',
          createdAt: now,
        },
      },
    });

    await current.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'verification-user',
    });

    for (const verification of deleted) {
      expect(
        await t.query(components.betterAuth.adapter.findOne, {
          model: 'verification',
          where: [{ field: '_id', value: verification._id }],
        })
      ).toBeNull();
    }
    for (const verification of retained) {
      expect(
        await t.query(components.betterAuth.adapter.findOne, {
          model: 'verification',
          where: [{ field: '_id', value: verification._id }],
        })
      ).toEqual(verification);
    }
    expect(
      await t.query(components.betterAuth.adapter.findOne, {
        model: 'jwks',
        where: [{ field: '_id', value: jwks._id }],
      })
    ).toEqual(jwks);

    const otpResponse = await t.fetch('/api/auth/sign-in/email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: current.user.email, otp: '123456' }),
    });
    expect(otpResponse.status).toBe(400);
    expect(await otpResponse.json()).toMatchObject({ code: 'INVALID_OTP' });
    const magicResponse = await t.fetch(
      '/api/auth/magic-link/verify?token=current-magic-link'
    );
    expect(magicResponse.status).toBe(302);
    expect(magicResponse.headers.get('location')).toContain(
      'error=INVALID_TOKEN'
    );
    expect(
      await t.query(components.betterAuth.adapter.findOne, {
        model: 'user',
        where: [{ field: 'email', value: current.user.email }],
      })
    ).toBeNull();
  });

  test('deletes only the requester and every credential page, rejecting stale sessions', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const deleting = await createAuthAccount(t, 'delete-me');
    const other = await createAuthAccount(t, 'keep-me');
    await seedCredentials(t, deleting.user._id);
    await seedCredentials(t, other.user._id);
    const otherBefore = await readCredentials(t, other.user._id);
    const now = Date.now();
    // Exceed the deletion page size so a single adapter call cannot pass.
    for (let index = 0; index < 101; index++) {
      await t.mutation(components.betterAuth.adapter.create, {
        input: {
          model: 'session',
          data: {
            userId: deleting.user._id,
            token: `extra-session-${index}`,
            expiresAt: now + 3_600_000,
            createdAt: now,
            updatedAt: now,
          },
        },
      });
    }
    const settingsId = await t.run(ctx =>
      ctx.db.insert('personSettings', { personId: deleting.personId })
    );

    await expect(
      deleting.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: ' DELETE-ME ',
      })
    ).resolves.toEqual({ success: true });

    expect(await readCredentials(t, deleting.user._id)).toEqual([
      [],
      [],
      [],
      [],
      [],
    ]);
    expect(await readCredentials(t, other.user._id)).toEqual(otherBefore);
    expect(await t.run(ctx => ctx.db.get(deleting.personId))).toBeNull();
    expect(await t.run(ctx => ctx.db.get(settingsId))).toBeNull();
    expect(await t.run(ctx => ctx.db.get(other.personId))).not.toBeNull();
    await expect(
      deleting.auth.mutation(api.users.mutations.completeOnboarding, {
        username: 'recreated-account',
      })
    ).rejects.toThrow('Authentication required');
    expect(
      await t.run(ctx =>
        ctx.db
          .query('persons')
          .withIndex('by_user_id', q => q.eq('userId', deleting.user._id))
          .collect()
      )
    ).toEqual([]);
  });

  test('rejects unauthenticated requests and another account username without deleting data', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const current = await createAuthAccount(t, 'current-user');
    const other = await createAuthAccount(t, 'other-user');
    await seedCredentials(t, current.user._id);
    const before = await readCredentials(t, current.user._id);
    await expect(
      t.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: 'current-user',
      })
    ).rejects.toThrow('Authentication required');
    await expect(
      current.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: 'other-user',
      })
    ).rejects.toThrow('Invalid confirmation');
    expect(await readCredentials(t, current.user._id)).toEqual(before);
    expect(await t.run(ctx => ctx.db.get(current.personId))).not.toBeNull();
    expect(await t.run(ctx => ctx.db.get(other.personId))).not.toBeNull();
  });

  test('rolls back app and credential deletion if the final identity deletion fails', async () => {
    const t = createTestInstance();
    const modules = import.meta.glob('../betterAuth/**/*.ts');
    t.registerComponent('betterAuth', betterAuthSchema, {
      ...modules,
      '../betterAuth/adapter.ts': async () => ({
        ...(await import('../betterAuth/adapter')),
        deleteOne: mutationGeneric({
          args: {
            input: v.object({
              model: v.literal('user'),
              where: v.array(
                v.object({ field: v.literal('_id'), value: v.string() })
              ),
            }),
          },
          returns: v.null(),
          handler: async () => {
            throw new Error('Injected identity deletion failure');
          },
        }),
      }),
    });
    const current = await createAuthAccount(t, 'rollback-user');
    await seedCredentials(t, current.user._id);
    const before = await readCredentials(t, current.user._id);
    const settingsId = await t.run(ctx =>
      ctx.db.insert('personSettings', { personId: current.personId })
    );

    await expect(
      current.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: 'rollback-user',
      })
    ).rejects.toThrow('Injected identity deletion failure');

    expect(await readCredentials(t, current.user._id)).toEqual(before);
    expect(await t.run(ctx => ctx.db.get(current.personId))).not.toBeNull();
    expect(await t.run(ctx => ctx.db.get(settingsId))).not.toBeNull();
  });
});
