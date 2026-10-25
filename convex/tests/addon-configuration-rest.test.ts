import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

async function setup() {
  const t = createTestInstance();
  registerBetterAuth(t);
  return actor(t, 'addon-organizer');
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

async function fixture() {
  const organizer = await setup();
  const attendee = await actor(organizer.t, 'attendance-user');
  const moderator = await actor(organizer.t, 'attendance-moderator');
  const outsider = await actor(organizer.t, 'attendance-outsider');
  const start = Date.now() + 7 * 86400000;
  const created = await (
    await organizer.request('/events', 'POST', {
      title: 'Attendance',
      potentialDateTimeOptions: [
        {
          start: new Date(start).toISOString(),
          end: new Date(start + 3600000).toISOString(),
          note: 'Morning',
        },
        { start: new Date(start + 86400000).toISOString() },
      ],
    })
  ).json();
  const link = await (
    await organizer.request(`/events/${created.eventId}/invites`, 'POST', {})
  ).json();
  for (const person of [attendee, moderator]) {
    const joined = await (
      await person.request(`/invites/${link.token}/accept`, 'POST')
    ).json();
    if (person === moderator)
      await organizer.t.run(ctx =>
        ctx.db.patch(joined.membershipId, { role: 'MODERATOR' })
      );
  }
  const event = await (
    await organizer.request(`/events/${created.eventId}`, 'GET')
  ).json();
  return {
    organizer,
    attendee,
    moderator,
    outsider,
    eventId: created.eventId,
    event,
    start,
  };
}
async function body(response: Response, status = 200) {
  expect(response.status, await response.clone().text()).toBe(status);
  return response.json();
}
const questions = {
  questions: [
    { id: 'q', label: 'Meal?', type: 'SHORT_ANSWER', required: true },
  ],
};
describe('Authenticated add-on configuration', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('uses moderator lifecycle including response reset and notifications', async () => {
    const { organizer, moderator, attendee, outsider, eventId } =
      await fixture();
    const path = `/events/${eventId}/addons/questionnaire`;
    await body(
      await attendee.request(path + '/enable', 'POST', { config: questions }),
      403
    );
    await body(await outsider.request(`/events/${eventId}/addons`, 'GET'), 403);
    await body(
      await organizer.request(path + '/enable', 'POST', { config: questions })
    );
    await attendee.auth.mutation(api.addons.mutations.setAddonData, {
      eventId,
      addonType: 'questionnaire',
      key: `response:${attendee.personId}`,
      data: { q: 'Pasta' },
    });
    const changed = {
      questions: [{ ...questions.questions[0], label: 'Drink?' }],
    };
    await body(
      await moderator.request(path + '/config', 'PATCH', { config: changed })
    );
    expect(
      await organizer.t.run(ctx => ctx.db.query('addonData').collect())
    ).toEqual([]);
    const notices = await organizer.t.run(ctx =>
      ctx.db.query('notifications').collect()
    );
    expect(
      notices.some(
        n => n.type === 'ADDON_CONFIG_RESET' && n.personId === attendee.personId
      )
    ).toBe(true);
    await body(await moderator.request(path + '/disable', 'POST'));
    await body(
      await moderator.request(path + '/config', 'PATCH', { config: changed }),
      400
    );
    await body(
      await organizer.request(
        `/events/${eventId}/addons/reminders/enable`,
        'POST',
        { config: { reminderOffset: 'NOPE' } }
      ),
      400
    );
  });
  it('uses an existing owned published custom template and protects definitions', async () => {
    const { organizer, attendee, eventId } = await fixture();
    const template = {
      name: 'Meals',
      description: 'Choose a meal',
      iconName: 'listChecks',
      sections: [
        {
          id: 's',
          title: 'Meal',
          fields: [
            {
              id: 'f',
              type: 'select',
              label: 'Meal',
              required: true,
              configurable: true,
              options: ['Pasta'],
            },
          ],
        },
      ],
    };
    const templateId = await organizer.t.run(ctx =>
      ctx.db.insert('addonTemplates', {
        ownerId: organizer.personId,
        name: 'Meals',
        description: 'Choose a meal',
        iconName: 'listChecks',
        template,
        version: 1,
        isPublished: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
    const path = `/events/${eventId}/addons/custom:${templateId}`;
    await body(
      await organizer.request(path + '/enable', 'POST', {
        config: { templateId },
      })
    );
    const configs = await body(
      await attendee.request(`/events/${eventId}/addons`, 'GET')
    );
    expect(configs[0].config.template).toEqual(template);
    const configured = structuredClone(template);
    configured.sections[0].fields[0].options = ['Pasta', 'Rice'];
    await body(
      await organizer.request(path + '/config', 'PATCH', {
        config: { templateId, template: configured },
      })
    );
    configured.name = 'Forged definition';
    await body(
      await organizer.request(path + '/config', 'PATCH', {
        config: { templateId, template: configured },
      }),
      400
    );
    await body(
      await attendee.request(path + '/config', 'PATCH', {
        config: { templateId, template },
      }),
      403
    );
    const otherId = await organizer.t.run(ctx =>
      ctx.db.insert('addonTemplates', {
        ownerId: attendee.personId,
        name: 'Meals',
        description: 'Choose a meal',
        iconName: 'listChecks',
        template,
        version: 1,
        isPublished: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
    await body(
      await organizer.request(
        `/events/${eventId}/addons/custom:${otherId}/enable`,
        'POST',
        { config: { templateId: otherId } }
      ),
      400
    );
  });
  it('preserves protected metadata in configurable sections and permits app-created vote defaults', async () => {
    const { organizer, eventId } = await fixture();
    const template = {
      name: 'Vote',
      description: 'Pick a meal',
      iconName: 'listChecks',
      sections: [
        {
          id: 's',
          title: 'Meal',
          configurable: true,
          allowedFieldTypes: ['select'],
          fields: [
            {
              id: 'f',
              type: 'select',
              label: 'Meal',
              required: true,
              configurable: true,
              options: ['Pasta'],
            },
          ],
        },
        {
          id: 'votes',
          title: 'Votes',
          layout: 'interactive',
          configurable: true,
          allowedFieldTypes: ['vote'],
          fields: [],
        },
      ],
    };
    const templateId = await organizer.t.run(ctx =>
      ctx.db.insert('addonTemplates', {
        ownerId: organizer.personId,
        name: 'Vote',
        description: 'Pick a meal',
        iconName: 'listChecks',
        template,
        version: 1,
        isPublished: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
    const path = `/events/${eventId}/addons/custom:${templateId}`;
    await body(
      await organizer.request(path + '/enable', 'POST', {
        config: { templateId },
      })
    );
    const configs = await body(
      await organizer.request(`/events/${eventId}/addons`, 'GET')
    );
    const config = configs[0].config;
    config.template.sections[0].fields[0].options = ['Rice'];
    config.template.sections[1].fields.push({
      id: 'v',
      type: 'vote',
      label: 'Vote',
      required: false,
      options: ['One', 'Two'],
      allowMultiple: false,
      showResults: true,
    });
    await body(await organizer.request(path + '/config', 'PATCH', { config }));
    config.template.sections[0].fields[0].configurable = false;
    await body(
      await organizer.request(path + '/config', 'PATCH', { config }),
      400
    );
  });

  it('redacts webhook secrets and preserves them on public configuration round-trip', async () => {
    const { organizer, attendee, eventId } = await fixture();
    const template = {
      name: 'Meals',
      description: 'Choose a meal',
      iconName: 'listChecks',
      sections: [
        {
          id: 's',
          title: 'Meal',
          fields: [
            {
              id: 'f',
              type: 'select',
              label: 'Meal',
              required: true,
              configurable: true,
              options: ['Pasta'],
            },
          ],
        },
      ],
      onSubmitActions: [
        {
          type: 'send_webhook',
          webhookUrl: 'https://secret.example/token',
          webhookHeaders: { Authorization: 'secret-token' },
        },
      ],
    };
    const templateId = await organizer.t.run(ctx =>
      ctx.db.insert('addonTemplates', {
        ownerId: organizer.personId,
        name: 'Meals',
        description: 'Choose a meal',
        iconName: 'listChecks',
        template,
        version: 1,
        isPublished: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
    const path = `/events/${eventId}/addons/custom:${templateId}`;
    await body(
      await organizer.request(path + '/enable', 'POST', {
        config: { templateId },
      })
    );
    const configs = await body(
      await attendee.request(`/events/${eventId}/addons`, 'GET')
    );
    expect(JSON.stringify(configs)).not.toContain('secret-token');
    expect(JSON.stringify(configs)).not.toContain('secret.example');
    const config = configs[0].config;
    config.template.sections[0].fields[0].options = ['Rice'];
    const updated = await body(
      await organizer.request(path + '/config', 'PATCH', { config })
    );
    expect(JSON.stringify(updated)).not.toContain('secret-token');
    const stored = await organizer.t.run(ctx =>
      ctx.db
        .query('eventAddonConfigs')
        .withIndex('by_event_addon', q =>
          q.eq('eventId', eventId).eq('addonType', `custom:${templateId}`)
        )
        .first()
    );
    expect(stored?.config.template.onSubmitActions[0].webhookHeaders).toEqual({
      Authorization: 'secret-token',
    });
    config.template.onSubmitActions[0].webhookUrl = 'https://attacker.example/';
    await body(
      await organizer.request(path + '/config', 'PATCH', { config }),
      400
    );
    const templates = await body(
      await organizer.request(
        '/addon-templates?pagination=cursor&limit=1',
        'GET'
      )
    );
    expect(templates.items).toHaveLength(1);
    expect(JSON.stringify(templates)).not.toContain('secret-token');
    const attendeeTemplates = await body(
      await attendee.request(
        '/addon-templates?pagination=cursor&limit=1',
        'GET'
      )
    );
    expect(attendeeTemplates.items).toEqual([]);
  });
  it('covers remaining built-ins, disabled cleanup, and cross-event role checks', async () => {
    const { organizer, moderator, attendee, eventId } = await fixture();
    const items = { items: [{ id: 'rice', name: 'Rice', quantity: 2 }] };
    await body(
      await moderator.request(
        `/events/${eventId}/addons/bring-list/enable`,
        'POST',
        { config: items }
      )
    );
    await attendee.auth.mutation(api.addons.mutations.setAddonData, {
      eventId,
      addonType: 'bring-list',
      key: `claims:${attendee.personId}`,
      data: { rice: 1 },
    });
    await body(
      await moderator.request(
        `/events/${eventId}/addons/bring-list/disable`,
        'POST'
      )
    );
    expect(
      await organizer.t.run(ctx => ctx.db.query('addonData').collect())
    ).toEqual([]);
    await body(
      await moderator.request(
        `/events/${eventId}/addons/reminders/enable`,
        'POST',
        { config: { reminderOffset: '1_DAY' } }
      )
    );
    await body(
      await moderator.request(
        `/events/${eventId}/addons/reminders/config`,
        'PATCH',
        { config: { reminderOffset: '1_HOUR' } }
      )
    );
    const discord = { guildId: 'guild1', guildName: 'Groupi' };
    await body(
      await moderator.request(
        `/events/${eventId}/addons/discord/enable`,
        'POST',
        { config: discord }
      ),
      400
    );
    await organizer.t.run(ctx =>
      ctx.db.insert('discordGuildAuthorizations', {
        personId: moderator.personId,
        guildId: 'guild1',
        guildName: 'Groupi',
        botInstalled: true,
        authorizedAt: Date.now(),
      })
    );
    await body(
      await moderator.request(
        `/events/${eventId}/addons/discord/enable`,
        'POST',
        { config: discord }
      )
    );
    await body(
      await moderator.request(
        `/events/${eventId}/addons/discord/config`,
        'PATCH',
        { config: discord }
      )
    );
    const second = await body(
      await organizer.request('/events', 'POST', {
        title: 'Private second event',
        potentialDateTimeOptions: [
          { start: new Date(Date.now() + 86400000).toISOString() },
        ],
      }),
      201
    );
    await body(
      await moderator.request(
        `/events/${second.eventId}/addons/reminders/enable`,
        'POST',
        { config: { reminderOffset: '1_HOUR' } }
      ),
      403
    );
    const page = await body(
      await organizer.request(
        `/events/${eventId}/addons?pagination=cursor&limit=1`,
        'GET'
      )
    );
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBeTypeOf('string');
    const next = await body(
      await organizer.request(
        `/events/${eventId}/addons?pagination=cursor&limit=1&cursor=${encodeURIComponent(page.nextCursor)}`,
        'GET'
      )
    );
    expect(next.items[0].id).not.toBe(page.items[0].id);
  });
});
