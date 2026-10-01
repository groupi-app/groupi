// @vitest-environment node
import { expect, it } from 'vitest';
import { api } from '../_generated/api';
import { cliRestBridge } from './cli-rest-bridge.helpers';
async function body(response: Response, status = 200) {
  expect(response.status, await response.clone().text()).toBe(status);
  return response.json();
}
it('public CLI performs validated built-in participation with isolation, paging, repeats and disabled-state errors', async () => {
  const b = await cliRestBridge();
  try {
    const organizer = await b.actor('participation-organizer');
    const attendee = await b.actor('participation-attendee');
    const moderator = await b.actor('participation-moderator');
    const outsider = await b.actor('participation-outsider');
    const event = await body(
      await organizer.request('/events', 'POST', {
        title: 'Participant workflows',
      }),
      201
    );
    const eventId = event.eventId;
    const link = await body(
      await organizer.request(`/events/${eventId}/invites`, 'POST', {}),
      201
    );
    for (const actor of [attendee, moderator]) {
      const joined = await body(
        await actor.request(`/invites/${link.token}/accept`, 'POST')
      );
      if (actor === moderator)
        await b.t.run(ctx =>
          ctx.db.patch(joined.membershipId, { role: 'MODERATOR' })
        );
    }
    const base = `/events/${eventId}/addons`;
    await body(
      await organizer.request(`${base}/questionnaire/enable`, 'POST', {
        config: {
          questions: [
            {
              id: 'meal',
              label: 'Meal',
              type: 'MULTIPLE_CHOICE',
              required: true,
              options: ['Pasta', 'Rice'],
            },
          ],
        },
      })
    );
    const run = (
      actor: typeof attendee,
      action: string,
      type: string,
      extra: string[] = []
    ) =>
      b.cli(actor.rawKey, [
        'addons',
        action,
        b.wireId(eventId),
        type,
        ...extra,
      ]);
    for (const actor of [organizer, attendee, moderator]) {
      const result = await run(actor, 'respond', 'questionnaire', [
        '--data',
        '{"meal":"Rice"}',
      ]);
      expect(result.code, result.stderr).toBe(0);
    }
    expect(
      (
        await run(outsider, 'respond', 'questionnaire', [
          '--data',
          '{"meal":"Rice"}',
        ])
      ).code
    ).not.toBe(0);
    const invalid = await run(attendee, 'respond', 'questionnaire', [
      '--data',
      '{"meal":"Unknown"}',
    ]);
    expect(invalid.code).not.toBe(0);
    expect(invalid.stderr).toContain('USAGE');
    expect(
      (await run(attendee, 'respond', 'questionnaire', ['--data', '{}'])).stderr
    ).toContain('USAGE');
    expect((await run(attendee, 'respond', 'questionnaire')).code).toBe(2);
    expect(
      (await run(attendee, 'respond', 'questionnaire', ['--data', '{bad'])).code
    ).toBe(2);
    const repeated = await run(attendee, 'respond', 'questionnaire', [
      '--data',
      '{"meal":"Pasta"}',
    ]);
    expect(repeated.code, repeated.stderr).toBe(0);
    const page = await run(attendee, 'data', 'questionnaire', ['--limit', '1']);
    expect(page.code, page.stderr).toBe(0);
    expect(JSON.parse(page.stdout).items).toHaveLength(1);
    expect(JSON.parse(page.stdout).nextCursor).toBeTruthy();
    const all = await run(attendee, 'data', 'questionnaire', [
      '--limit',
      '1',
      '--all',
    ]);
    expect(JSON.parse(all.stdout).items, all.stdout).toHaveLength(3);
    const impersonation = `${base}/questionnaire/data/${encodeURIComponent(`response:${attendee.personId}`)}`;
    await body(
      await moderator.request(impersonation, 'PUT', { data: { meal: 'Rice' } }),
      400
    );
    await body(await moderator.request(impersonation, 'DELETE'), 403);
    const second = await body(
      await outsider.request('/events', 'POST', { title: 'Other event' }),
      201
    );
    await body(
      await attendee.request(
        `/events/${second.eventId}/addons/questionnaire/participation`,
        'POST',
        { action: 'respond', data: { meal: 'Rice' } }
      ),
      403
    );
    expect(
      (await run(attendee, 'clear-response', 'questionnaire')).stderr
    ).toContain('CONFIRMATION_REQUIRED');
    expect(
      (await run(attendee, 'clear-response', 'questionnaire', ['--yes'])).code
    ).toBe(0);
    expect(
      (await run(attendee, 'clear-response', 'questionnaire', ['--yes'])).code
    ).toBe(0);
    await body(
      await organizer.request(`${base}/bring-list/enable`, 'POST', {
        config: { items: [{ id: 'cups', name: 'Cups', quantity: 3 }] },
      })
    );
    expect(
      (await run(attendee, 'claim', 'bring-list', ['--data', '{"cups":2}']))
        .code
    ).toBe(0);
    expect(
      (await run(attendee, 'claim', 'bring-list', ['--data', '{"cups":4}']))
        .code
    ).not.toBe(0);
    expect(
      (await run(attendee, 'claim', 'bring-list', ['--data', '{"missing":1}']))
        .code
    ).not.toBe(0);
    expect(
      (await run(moderator, 'claim', 'bring-list', ['--data', '{"cups":2}']))
        .code
    ).not.toBe(0);
    expect(
      (await run(moderator, 'claim', 'bring-list', ['--data', '{"cups":1}']))
        .code
    ).toBe(0);
    await body(
      await organizer.request(`${base}/reminders/enable`, 'POST', {
        config: { reminderOffset: '1_DAY' },
      })
    );
    for (let i = 0; i < 2; i++)
      expect(
        JSON.parse((await run(attendee, 'opt-out', 'reminders')).stdout)
          .isOptedOut
      ).toBe(true);
    expect(
      JSON.parse((await run(attendee, 'data', 'reminders')).stdout).isOptedOut
    ).toBe(true);
    expect(
      JSON.parse((await run(attendee, 'opt-in', 'reminders')).stdout).isOptedOut
    ).toBe(false);
    expect((await run(attendee, 'opt-out', 'questionnaire')).code).not.toBe(0);
    await body(await organizer.request(`${base}/bring-list/disable`, 'POST'));
    expect(
      (await run(attendee, 'claim', 'bring-list', ['--data', '{"cups":1}']))
        .stderr
    ).toContain('USAGE');
  } finally {
    await b.close();
  }
}, 60000);

it('existing custom forms, votes, claims, toggles and buttons share app lifecycle and reject forged identities', async () => {
  const b = await cliRestBridge();
  try {
    const a = await b.actor('custom-participant');
    const event = await body(
      await a.request('/events', 'POST', { title: 'Custom participation' }),
      201
    );
    const eventId = event.eventId;
    const participant = await b.actor('custom-attendee');
    const outsider = await b.actor('custom-outsider');
    const invite = await body(
      await a.request(`/events/${eventId}/invites`, 'POST', {}),
      201
    );
    await body(
      await participant.request(`/invites/${invite.token}/accept`, 'POST')
    );

    const template = {
      name: 'Choices',
      description: 'Existing published template',
      iconName: 'listChecks',
      sections: [
        {
          id: 'form',
          title: 'Answer',
          layout: 'form',
          fields: [
            {
              id: 'name',
              type: 'text',
              label: 'Name',
              required: true,
              maxLength: 20,
            },
            {
              id: 'attending',
              type: 'yesno',
              label: 'Attending',
              required: false,
            },
            {
              id: 'meal',
              type: 'text',
              label: 'Meal',
              required: true,
              visibilityConditions: [
                { field: 'fields.attending', operator: 'equals', value: 'yes' },
              ],
            },
          ],
        },
        {
          id: 'interactive',
          title: 'Actions',
          layout: 'interactive',
          fields: [
            {
              id: 'vote',
              type: 'vote',
              label: 'Vote',
              required: false,
              options: ['A', 'B'],
              allowMultiple: false,
            },
            { id: 'toggle', type: 'toggle', label: 'Switch', required: false },
            {
              id: 'list',
              type: 'list_item',
              label: 'Bring',
              required: false,
              items: [{ id: 'cups', name: 'Cups', quantity: 2 }],
            },
            {
              id: 'button',
              type: 'action_button',
              label: 'Button',
              buttonLabel: 'Execute',
              required: false,
              actions: [
                {
                  type: 'update_event_description',
                  message: 'Button executed',
                },
              ],
            },
          ],
        },
      ],
      automations: [
        {
          id: 'vote-threshold',
          name: 'Vote threshold',
          enabled: true,
          trigger: { type: 'vote_threshold', threshold: 2 },
          conditions: [],
          actions: [
            {
              type: 'update_event_description',
              message: 'Vote threshold reached',
            },
          ],
        },
        {
          id: 'list-full',
          name: 'List full',
          enabled: true,
          trigger: { type: 'list_item_full', fieldId: 'list' },
          conditions: [],
          actions: [
            {
              type: 'update_event_description',
              message: 'List capacity reached',
            },
          ],
        },
      ],
      onSubmitActions: [
        { type: 'update_event_description', message: 'Form submitted' },
        { type: 'notify_organizers', message: 'Participant submitted' },
      ],
    };
    const templateId = await b.t.run(ctx =>
      ctx.db.insert('addonTemplates', {
        ownerId: a.personId,
        name: template.name,
        description: template.description,
        iconName: template.iconName,
        template,
        version: 1,
        isPublished: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
    const type = `custom:${templateId}`;
    await body(
      await a.request(`/events/${eventId}/addons/${type}/enable`, 'POST', {
        config: { templateId },
      })
    );
    for (const [operation, data, field] of [
      ['respond', { name: 'From CLI' }, undefined],
      ['vote', { options: ['B'] }, 'vote'],
      ['claim', { cups: 1 }, undefined],
      ['toggle', { enabled: true }, 'toggle'],
      ['execute', null, 'button'],
    ] as const) {
      const result = await b.cli(participant.rawKey, [
        'addons',
        operation,
        b.wireId(eventId),
        b.wireId(type),
        ...(data ? ['--data', JSON.stringify(data)] : []),
        ...(field ? ['--field', field] : []),
        '--yes',
      ]);
      expect(result.code, result.stderr).toBe(0);
    }
    const human = await b.cli(
      participant.rawKey,
      ['addons', 'data', b.wireId(eventId), b.wireId(type)],
      'human'
    );
    expect(human.code, human.stderr).toBe(0);
    expect(human.stdout).toContain('key:');
    const action = (action: string, data: unknown, fieldId?: string) =>
      participant.request(
        `/events/${eventId}/addons/${type}/participation`,
        'POST',
        {
          action,
          data,
          ...(fieldId ? { fieldId } : {}),
        }
      );
    await body(await action('respond', { name: 'Theia' }));
    const notices = await b.t.run(ctx =>
      ctx.db.query('notifications').collect()
    );
    expect(
      notices.some(
        n =>
          n.type === 'ADDON_AUTOMATION' &&
          n.personId === a.personId &&
          n.authorId === participant.personId
      )
    ).toBe(true);
    await body(
      await outsider.request(
        `/events/${eventId}/addons/${type}/participation`,
        'POST',
        { action: 'respond', data: { name: 'Outsider' } }
      ),
      403
    );
    await body(await action('respond', {}), 400);
    // Existing visibility definitions use string "yes" for a boolean field.
    await body(
      await action('respond', { name: 'Theia', attending: true, meal: 'Pasta' })
    );
    await body(
      await action('respond', { name: 'Theia', attending: true }),
      400
    );
    await body(await action('respond', { name: 'Theia', attending: false }));

    expect((await b.t.run(ctx => ctx.db.get(eventId))).description).toBe(
      'Form submitted'
    );
    await body(await action('vote', { options: ['A'] }, 'vote'));
    await body(await action('vote', { options: ['A', 'B'] }, 'vote'), 400);
    await body(await action('toggle', { enabled: false }, 'toggle'));
    await body(await action('claim', { cups: 1 }));
    await body(await action('execute', null, 'button'));
    expect((await b.t.run(ctx => ctx.db.get(eventId))).description).toBe(
      'Button executed'
    );
    await body(await action('execute', null, 'name'), 400);
    await body(
      await a.request(
        `/events/${eventId}/addons/${type}/data/${encodeURIComponent('vote:vote:someone-else')}`,
        'PUT',
        { data: { options: ['B'] } }
      ),
      400
    );
    await body(
      await a.request(
        `/events/${eventId}/addons/${type}/data/${encodeURIComponent(`vote:vote:${participant.personId}`)}`,
        'PUT',
        { data: { options: ['B'] } }
      ),
      400
    );

    await body(
      await a.request(
        `/events/${eventId}/addons/${type}/participation`,
        'POST',
        { action: 'vote', fieldId: 'vote', data: { options: ['A'] } }
      )
    );
    expect((await b.t.run(ctx => ctx.db.get(eventId))).description).toBe(
      'Vote threshold reached'
    );
    await body(await action('claim', { cups: 2 }));
    expect((await b.t.run(ctx => ctx.db.get(eventId))).description).toBe(
      'List capacity reached'
    );
    // App uses the same identity checks and validation.
    await expect(
      a.auth.mutation(api.addons.mutations.setAddonData, {
        eventId,
        addonType: type,
        key: `toggle:toggle:someone-else`,
        data: { enabled: true },
      })
    ).rejects.toThrow('current user');
  } finally {
    await b.close();
  }
}, 30000);
