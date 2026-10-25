import { describe, expect, it } from 'vitest';
import { components, internal } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import {
  createTestEventWithMultipleUsers,
  createTestInstance,
} from './test_helpers';

async function fixture() {
  const t = createTestInstance();
  const { eventId, organizer, attendee } =
    await createTestEventWithMultipleUsers(t);
  await t.run(ctx =>
    ctx.db.insert('eventAddonConfigs', {
      eventId,
      addonType: 'questionnaire',
      enabled: true,
      config: {
        questions: [
          {
            id: 'answer',
            label: 'Answer',
            type: 'SHORT_ANSWER',
            required: false,
          },
        ],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  );
  const input = {
    eventId,
    addonType: 'questionnaire',
    key: `response:${attendee.personId}`,
    personId: attendee.personId,
  };
  const entry = await t.mutation(internal.addons.rest.setAddonData, {
    ...input,
    data: { answer: 'original' },
  });
  return { t, input, entry, organizer, attendee };
}

describe('Add-on data transaction authorization', () => {
  it.each(['v1', 'v2'])(
    'preserves %s envelopes and rejects reserved-key writes inside the mutation',
    async version => {
      const { t, input, organizer, attendee } = await fixture();
      registerBetterAuth(t);
      const account = await createAuthAccount(
        t,
        'addon-data-user',
        attendee.personId
      );
      const rawKey = 'grp_addon_data_authorization_test_key';
      const hash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(rawKey)
      );
      await t.mutation(components.betterAuth.adapter.create, {
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
      const request = (key: string, method: 'PUT' | 'DELETE') =>
        t.fetch(
          `/api/${version}/events/${input.eventId}/addons/questionnaire/data/${encodeURIComponent(key)}`,
          {
            method,
            headers: {
              'x-api-key': rawKey,
              'content-type': 'application/json',
            },
            ...(method === 'PUT'
              ? { body: JSON.stringify({ data: { answer: 'through REST' } }) }
              : {}),
          }
        );

      const allowed = await request(input.key, 'PUT');
      expect(allowed.status, await allowed.clone().text()).toBe(200);
      const allowedBody = await allowed.json();
      const entry = version === 'v1' ? allowedBody.data : allowedBody;
      expect(entry.data).toEqual({ answer: 'through REST' });
      expect(entry.createdBy).toBe(attendee.personId);
      expect(allowedBody.success).toBe(version === 'v1' ? true : undefined);

      const denied = await request(`response:${organizer.personId}`, 'PUT');
      expect(denied.status, await denied.clone().text()).toBe(403);
      const deniedBody = await denied.json();
      expect(deniedBody.error.code).toBe('FORBIDDEN');
      expect(deniedBody.success).toBe(version === 'v1' ? false : undefined);

      const deleted = await request(input.key, 'DELETE');
      expect(deleted.status).toBe(version === 'v1' ? 200 : 204);
      if (version === 'v1') expect((await deleted.json()).success).toBe(true);
      else expect(await deleted.text()).toBe('');

      await t.run(ctx => ctx.db.delete(attendee.membershipId));
      expect((await request('new-entry', 'PUT')).status).toBe(403);
      expect((await request(input.key, 'DELETE')).status).toBe(403);
    }
  );

  it.each(['response:', 'claims:'])(
    'rejects writing another person’s %s key, including for organizers',
    async prefix => {
      const { t, input, organizer } = await fixture();
      await expect(
        t.mutation(internal.addons.rest.setAddonData, {
          ...input,
          personId: organizer.personId,
          key: `${prefix}${input.personId}`,
          data: { forged: true },
        })
      ).rejects.toThrow('Reserved add-on data key must belong');
    }
  );

  it('dispatches custom submission automations with the submitting actor', async () => {
    const { t, input } = await fixture();
    const addonType = 'custom:submission-test';
    await t.run(ctx =>
      ctx.db.insert('eventAddonConfigs', {
        eventId: input.eventId,
        addonType,
        enabled: true,
        config: {
          templateId: 'submission',
          template: {
            name: 'Submission',
            description: '',
            iconName: 'List',
            sections: [
              {
                id: 'form',
                title: 'Form',
                fields: [
                  {
                    id: 'submitted',
                    label: 'Submitted',
                    type: 'yesno',
                    required: false,
                  },
                ],
              },
            ],
            automations: [
              {
                id: 'submitted',
                name: 'Record submission',
                enabled: true,
                trigger: { type: 'form_submitted' },
                conditions: [],
                actions: [
                  {
                    type: 'set_addon_data',
                    key: 'automation-result',
                    data: { ran: true },
                  },
                ],
              },
            ],
          },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
    await t.mutation(internal.addons.rest.setAddonData, {
      ...input,
      addonType,
      key: `response:${input.personId}`,
      data: { submitted: true },
    });
    const effect = await t.run(ctx =>
      ctx.db
        .query('addonData')
        .withIndex('by_event_addon_key', q =>
          q
            .eq('eventId', input.eventId)
            .eq('addonType', addonType)
            .eq('key', 'automation-result')
        )
        .unique()
    );
    expect(effect?.data).toEqual({ ran: true });
    expect(effect?.createdBy).toBe(input.personId);
  });

  it.each(['insert', 'update', 'delete', 'delete-missing'] as const)(
    'rejects a removed member attempting %s without changing data',
    async operation => {
      const { t, input, entry, attendee } = await fixture();
      await t.run(ctx => ctx.db.delete(attendee.membershipId));
      const before = await t.run(ctx => ctx.db.query('addonData').collect());

      const write =
        operation === 'insert' || operation === 'update'
          ? t.mutation(internal.addons.rest.setAddonData, {
              ...input,
              key: operation === 'insert' ? 'new-response' : input.key,
              data: { answer: 'changed' },
            })
          : t.mutation(internal.addons.rest.deleteAddonData, {
              ...input,
              key: operation === 'delete-missing' ? 'missing' : input.key,
            });

      await expect(write).rejects.toThrow('Event membership required');
      expect(await t.run(ctx => ctx.db.query('addonData').collect())).toEqual(
        before
      );
      expect(await t.run(ctx => ctx.db.get(entry.id))).not.toBeNull();
    }
  );

  it('preserves participant ownership even for organizers', async () => {
    const { t, input, entry, organizer } = await fixture();
    const updated = await t.mutation(internal.addons.rest.setAddonData, {
      ...input,
      data: { answer: 'own edit' },
    });
    expect(updated.created).toBe(false);
    const otherInput = {
      ...input,
      key: `response:${organizer.personId}`,
      personId: organizer.personId,
    };
    await t.mutation(internal.addons.rest.setAddonData, {
      ...otherInput,
      data: { answer: 'organizer' },
    });
    for (const [actor, key] of [
      [input.personId, otherInput.key],
      [organizer.personId, input.key],
    ]) {
      await expect(
        t.mutation(internal.addons.rest.setAddonData, {
          ...input,
          personId: actor,
          key,
          data: { answer: 'forged' },
        })
      ).rejects.toThrow('Reserved add-on data key must belong');
      await expect(
        t.mutation(internal.addons.rest.deleteAddonData, {
          ...input,
          personId: actor,
          key,
        })
      ).rejects.toThrow('Reserved add-on data key must belong');
    }
    await t.mutation(internal.addons.rest.deleteAddonData, input);
    expect(await t.run(ctx => ctx.db.get(entry.id))).toBeNull();
    await expect(
      t.mutation(internal.addons.rest.deleteAddonData, input)
    ).resolves.toEqual({ success: true });
  });
});
