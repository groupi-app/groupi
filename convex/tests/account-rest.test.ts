import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

async function setup() {
  const t = createTestInstance();
  registerBetterAuth(t);
  return actor(t, 'event-organizer');
}
async function actor(t: ReturnType<typeof createTestInstance>, name: string) {
  const account = await createAuthAccount(t, name);
  const rawKey = `grp_event_writes_test_key_${name}`;
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(rawKey)
  );
  const key = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'apikey',
      data: {
        userId: account.user._id,
        key: btoa(String.fromCharCode(...new Uint8Array(hash)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        enabled: true,
      },
    },
  });
  const request = (
    path: string,
    method: string,
    body?: unknown,
    requestId?: string
  ) =>
    t.fetch(`/api/v2${path}`, {
      method,
      headers: {
        'x-api-key': rawKey,
        'content-type': 'application/json',
        ...(requestId ? { 'Idempotency-Key': requestId } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  return { t, ...account, request, rawKey, keyId: key._id };
}

async function body(response: Response, status = 200) {
  expect(response.status, await response.clone().text()).toBe(status);
  return response.json();
}
describe('Authenticated account preferences', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  it('persists profile and privacy only for the selected identity and rejects target injection', async () => {
    const owner = await setup();
    const other = await actor(owner.t, 'other-account');
    await body(
      await owner.request('/profile', 'PUT', {
        name: 'Updated',
        bio: 'Hello',
        username: 'my_account',
      })
    );
    expect(await body(await owner.request('/profile', 'GET'))).toMatchObject({
      name: 'Updated',
      bio: 'Hello',
      username: 'my_account',
    });
    expect(
      await body(await other.request('/profile', 'GET'))
    ).not.toMatchObject({ bio: 'Hello' });
    await body(
      await owner.request('/profile', 'PUT', {
        personId: other.personId,
        bio: 'Attack',
      }),
      400
    );
    await body(
      await owner.request('/settings/privacy', 'PUT', {
        allowFriendRequestsFrom: 'NO_ONE',
      })
    );
    expect(
      await body(await owner.request('/settings/privacy', 'GET'))
    ).toMatchObject({
      allowFriendRequestsFrom: 'NO_ONE',
      allowEventInvitesFrom: 'EVERYONE',
    });
    expect(
      await body(await other.request('/settings/privacy', 'GET'))
    ).toMatchObject({ allowFriendRequestsFrom: 'EVERYONE' });
    await body(
      await other.request('/profile', 'PUT', { username: 'MY_ACCOUNT' }),
      409
    );
  });
  it('saves notification methods and settings atomically and rejects foreign method IDs', async () => {
    const owner = await setup();
    const other = await actor(owner.t, 'notifications-other');
    const method = {
      type: 'EMAIL',
      enabled: true,
      value: 'owner@example.com',
      notifications: [{ notificationType: 'NEW_POST', enabled: false }],
    };
    await body(
      await owner.request('/settings/notifications', 'PUT', {
        notificationMethods: [method],
      })
    );
    const saved = await body(
      await owner.request('/settings/notifications', 'GET')
    );
    expect(saved.methods).toHaveLength(1);
    expect(saved.typeSettings[0]).toMatchObject({
      notificationType: 'NEW_POST',
      enabled: false,
    });
    await body(
      await other.request('/settings/notifications', 'PUT', {
        notificationMethods: [{ ...method, id: saved.methods[0].id }],
      }),
      403
    );
    expect(
      await body(await other.request('/settings/notifications', 'GET'))
    ).toMatchObject({ methods: [] });
    expect(
      (await body(await owner.request('/settings/notifications', 'GET')))
        .methods
    ).toHaveLength(1);
    await body(
      await owner.request('/settings/notifications', 'PUT', {
        notificationMethods: [
          {
            ...method,
            notifications: [{ notificationType: 'INVALID', enabled: true }],
          },
        ],
      }),
      400
    );
  });
  it('preserves omitted private webhook configuration during notification edits', async () => {
    const owner = await setup();
    const method = {
      type: 'WEBHOOK',
      enabled: true,
      value: 'https://example.com/hook',
      webhookFormat: 'CUSTOM',
      customTemplate: '{{title}}',
      webhookHeaders: '{"Authorization":"secret-token"}',
      notifications: [{ notificationType: 'NEW_POST', enabled: true }],
    };
    await body(
      await owner.request('/settings/notifications', 'PUT', {
        notificationMethods: [method],
      })
    );
    const saved = await body(
      await owner.request('/settings/notifications', 'GET')
    );
    await body(
      await owner.request('/settings/notifications', 'PUT', {
        notificationMethods: [
          {
            id: saved.methods[0].id,
            type: 'WEBHOOK',
            enabled: false,
            value: method.value,
            webhookFormat: 'CUSTOM',
            notifications: method.notifications,
          },
        ],
      })
    );
    const persisted = await owner.t.run(ctx => ctx.db.get(saved.methods[0].id));
    expect(persisted).toMatchObject({
      enabled: false,
      customTemplate: '{{title}}',
      webhookHeaders: { Authorization: 'secret-token' },
    });
  });
  it('sets base preferences and denies selecting another account custom theme', async () => {
    const owner = await setup();
    const other = await actor(owner.t, 'themes-other');
    const prefs = {
      selectedThemeType: 'base',
      selectedThemeId: 'groupi-dark',
      useSystemPreference: false,
      systemLightThemeId: 'groupi-light',
      systemDarkThemeId: 'groupi-dark',
    };
    await body(await owner.request('/themes/preferences', 'PUT', prefs));
    expect(
      await body(await owner.request('/themes/preferences', 'GET'))
    ).toMatchObject(prefs);
    expect(
      await body(await other.request('/themes/preferences', 'GET'))
    ).toBeNull();
    const theme = await body(
      await owner.request('/themes', 'POST', {
        name: 'Private',
        baseThemeId: 'groupi-light',
        mode: 'light',
      }),
      201
    );
    await body(
      await other.request('/themes/preferences', 'PUT', {
        ...prefs,
        selectedThemeType: 'custom',
        selectedCustomThemeId: theme.id,
      }),
      403
    );
  });
});
