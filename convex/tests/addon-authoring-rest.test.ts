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

const document = {
  schemaVersion: 1,
  name: 'Meals',
  description: 'Choose a meal',
  iconName: 'listChecks',
  template: {
    name: 'Meals',
    description: 'Choose a meal',
    iconName: 'listChecks',
    sections: [
      {
        id: 's',
        title: 'Meal',
        fields: [{ id: 'meal', type: 'text', label: 'Meal', required: true }],
      },
    ],
  },
};
async function body(response: Response, status = 200) {
  expect(response.status, await response.clone().text()).toBe(status);
  return response.json();
}
describe('Authenticated template authoring', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  it('round trips an owned draft through the authenticated resource', async () => {
    const owner = await setup();
    const created = await body(
      await owner.request('/addon-template-definitions', 'POST', document),
      201
    );
    expect(created).toMatchObject({
      name: document.name,
      template: document.template,
      version: 1,
      isPublished: false,
    });
    expect(
      await body(
        await owner.request('/addon-template-definitions/' + created.id, 'GET')
      )
    ).toEqual(created);
    expect(
      await body(await owner.request('/addon-template-definitions', 'GET'))
    ).toEqual({ items: [created], nextCursor: null });
  });

  it('isolates definitions from other identities including event moderators', async () => {
    const owner = await setup();
    const other = await actor(owner.t, 'other');
    const created = await body(
      await owner.request('/addon-template-definitions', 'POST', document),
      201
    );
    const event = await body(
      await owner.request('/events', 'POST', {
        title: 'Owner event',
        potentialDateTimeOptions: [
          { start: new Date(Date.now() + 86400000).toISOString() },
        ],
      }),
      201
    );
    await owner.t.run(ctx =>
      ctx.db.insert('memberships', {
        eventId: event.eventId,
        personId: other.personId,
        role: 'MODERATOR',
        rsvpStatus: 'YES',
      })
    );
    const path = '/addon-template-definitions/' + created.id;
    expect(
      await body(await other.request('/addon-template-definitions', 'GET'))
    ).toEqual({ items: [], nextCursor: null });
    for (const [suffix, method, payload] of [
      ['', 'GET', undefined],
      ['', 'PATCH', { ...document, expectedVersion: 1 }],
      ['/publish', 'POST', { expectedVersion: 1 }],
      ['/unpublish', 'POST', { expectedVersion: 1 }],
      ['?expectedVersion=1', 'DELETE', undefined],
    ] as const)
      await body(await other.request(path + suffix, method, payload), 404);
    await body(await owner.t.fetch('/api/v2' + path, { method: 'GET' }), 401);
    expect(await body(await owner.request(path, 'GET'))).toEqual(created);
  });
  it('rejects invalid, unsupported and unsafe writes without changing the saved definition', async () => {
    const owner = await setup();
    const created = await body(
      await owner.request('/addon-template-definitions', 'POST', document),
      201
    );
    const path = '/addon-template-definitions/' + created.id;
    const invalid = [
      { ...document, schemaVersion: 2 },
      { ...document, ownerId: 'forged' },
      { ...document, template: { ...document.template, script: 'evil' } },
      { ...document, template: { ...document.template, sections: [] } },
      {
        ...document,
        template: {
          ...document.template,
          onSubmitActions: [
            { type: 'send_webhook', webhookUrl: 'http://localhost' },
          ],
        },
      },
      {
        ...document,
        template: {
          ...document.template,
          sections: [
            document.template.sections[0],
            document.template.sections[0],
          ],
        },
      },
      {
        ...document,
        template: {
          ...document.template,
          onSubmitActions: [
            {
              type: 'set_addon_data',
              key: 'custom',
              data: JSON.parse('{"__proto__":{"polluted":true}}'),
            },
          ],
        },
      },
    ];
    for (const candidate of invalid) {
      await body(
        await owner.request(path, 'PATCH', {
          ...candidate,
          expectedVersion: 1,
        }),
        400
      );
      expect(await body(await owner.request(path, 'GET'))).toEqual(created);
    }
    await body(await owner.request(path, 'PATCH', { ...document }), 400);
    await body(await owner.request(path + '?expectedVersion=0', 'DELETE'), 400);
  });
  it('protects all transitions with versions including concurrent web publication', async () => {
    const owner = await setup();
    const created = await body(
      await owner.request('/addon-template-definitions', 'POST', document),
      201
    );
    const path = '/addon-template-definitions/' + created.id;
    const updated = await body(
      await owner.request(path, 'PATCH', {
        ...document,
        name: 'Updated',
        expectedVersion: 1,
      })
    );
    expect(updated).toMatchObject({
      name: 'Updated',
      version: 2,
      isPublished: false,
    });
    await body(
      await owner.request(path, 'PATCH', { ...document, expectedVersion: 1 }),
      409
    );
    await body(
      await owner.request(path + '/publish', 'POST', { expectedVersion: 1 }),
      409
    );
    const published = await body(
      await owner.request(path + '/publish', 'POST', { expectedVersion: 2 })
    );
    expect(published).toMatchObject({ isPublished: true, version: 3 });
    const edited = await body(
      await owner.request(path, 'PATCH', { ...document, expectedVersion: 3 })
    );
    expect(edited).toMatchObject({ isPublished: true, version: 4 });
    await owner.auth.mutation(api.addonTemplates.mutations.unpublishTemplate, {
      templateId: created.id,
    });
    await body(
      await owner.request(path + '/publish', 'POST', { expectedVersion: 4 }),
      409
    );
    const latest = await body(await owner.request(path, 'GET'));
    expect(latest).toMatchObject({ version: 5, isPublished: false });
    await body(await owner.request(path + '?expectedVersion=4', 'DELETE'), 409);
    const removed = await body(
      await owner.request(path + '?expectedVersion=5', 'DELETE')
    );
    expect(removed).toEqual({ id: created.id, deleted: true });
    await body(await owner.request(path, 'GET'), 404);
  });
  it('round trips settings, automation and visibility while preserving enabled event snapshots', async () => {
    const owner = await setup();
    const full = {
      ...document,
      template: {
        ...document.template,
        settings: {
          requiresCompletion: true,
          cardLinkLabel: 'Answer',
          cardSubtitle: '{{response_count}} replies',
          cardOnly: false,
        },
        submitButtonLabel: 'Save',
        onSubmitActions: [{ type: 'notify_submitter', message: 'Saved' }],
        automations: [
          {
            id: 'a',
            name: 'Thank you',
            enabled: false,
            trigger: { type: 'form_submitted' },
            conditions: [{ field: 'fields.meal', operator: 'is_not_empty' }],
            actions: [
              { type: 'set_addon_data', key: 'custom', data: { value: 1 } },
            ],
          },
        ],
        sections: [
          {
            ...document.template.sections[0],
            description: 'Meal details',
            layout: 'form',
            configurable: false,
            allowedFieldTypes: ['text'],
            visibilityConditions: [
              { field: 'fields.meal', operator: 'is_not_empty' },
            ],
            fields: [
              {
                ...document.template.sections[0].fields[0],
                configurable: true,
                variant: 'short',
                placeholder: 'Dish',
                maxLength: 100,
                visibilityConditions: [
                  { field: 'fields.meal', operator: 'is_not_empty' },
                ],
              },
            ],
          },
        ],
      },
    };
    const created = await body(
      await owner.request('/addon-template-definitions', 'POST', full),
      201
    );
    expect(created.template).toEqual(full.template);
    const path = '/addon-template-definitions/' + created.id;
    const event = await body(
      await owner.request('/events', 'POST', {
        title: 'Meals',
        potentialDateTimeOptions: [
          { start: new Date(Date.now() + 86400000).toISOString() },
        ],
      }),
      201
    );
    const addonPath = `/events/${event.eventId}/addons/custom:${created.id}`;
    await body(
      await owner.request(addonPath + '/enable', 'POST', {
        config: { templateId: created.id },
      }),
      400
    );
    await body(
      await owner.request(path + '/publish', 'POST', { expectedVersion: 1 })
    );
    await body(
      await owner.request(addonPath + '/enable', 'POST', {
        config: { templateId: created.id },
      })
    );
    await body(
      await owner.request(addonPath + '/participation', 'POST', {
        action: 'respond',
        data: { meal: 'Rice' },
      })
    );
    const before = await owner.t.run(ctx =>
      ctx.db.query('addonData').collect()
    );
    expect(before.length).toBeGreaterThan(0);
    await body(
      await owner.request(path, 'PATCH', {
        ...full,
        template: { ...full.template, name: 'Changed definition' },
        expectedVersion: 2,
      })
    );
    const config = (
      await body(await owner.request(`/events/${event.eventId}/addons`, 'GET'))
    )[0];
    expect(config.config.template).toEqual(full.template);
    const configured = structuredClone(full.template);
    configured.sections[0].fields[0].maxLength = 120;
    await body(
      await owner.request(addonPath + '/config', 'PATCH', {
        config: { templateId: created.id, template: configured },
      })
    );
    const retained = await owner.t.run(ctx =>
      ctx.db.query('addonData').collect()
    );
    await body(
      await owner.request(path + '/unpublish', 'POST', { expectedVersion: 3 })
    );
    await body(await owner.request(path + '?expectedVersion=4', 'DELETE'));
    expect(
      (
        await body(
          await owner.request(`/events/${event.eventId}/addons`, 'GET')
        )
      )[0].config.template
    ).toEqual(configured);
    expect(
      await owner.t.run(ctx => ctx.db.query('addonData').collect())
    ).toEqual(retained);
  });
  it('reads legacy definitions faithfully but rejects unsupported publication and replacements', async () => {
    const owner = await setup();
    const unsafe = {
      ...document.template,
      onSubmitActions: [
        {
          type: 'send_webhook',
          webhookUrl: 'https://example.invalid',
          webhookHeaders: { Authorization: 'legacy-fixture' },
        },
      ],
    };
    const id = await owner.auth.mutation(
      api.addonTemplates.mutations.createTemplate,
      {
        name: document.name,
        description: document.description,
        iconName: document.iconName,
        template: unsafe,
      }
    );
    const path = '/addon-template-definitions/' + id;
    expect((await body(await owner.request(path, 'GET'))).template).toEqual(
      unsafe
    );
    await body(
      await owner.request(path + '/publish', 'POST', { expectedVersion: 1 }),
      400
    );
    await body(
      await owner.request(path, 'PATCH', {
        ...document,
        template: unsafe,
        expectedVersion: 1,
      }),
      400
    );
  });
  it('preserves every supported field type and paginates only owned definitions', async () => {
    const owner = await setup();
    const fields = [
      {
        id: 'text',
        type: 'text',
        label: 'Text',
        required: true,
        variant: 'long',
        maxLength: 80,
        placeholder: 'Type',
      },
      {
        id: 'number',
        type: 'number',
        label: 'Number',
        required: false,
        min: 1,
        max: 10,
      },
      {
        id: 'select',
        type: 'select',
        label: 'Select',
        required: false,
        options: ['A', 'B'],
      },
      {
        id: 'multi',
        type: 'multiselect',
        label: 'Multi',
        required: false,
        options: ['A', 'B'],
        minSelections: 1,
        maxSelections: 2,
      },
      { id: 'yes', type: 'yesno', label: 'Yes?', required: false },
      {
        id: 'static',
        type: 'static_text',
        required: false,
        content: 'Hello',
        textFormat: 'h2',
      },
      {
        id: 'summary',
        type: 'dynamic_summary',
        required: false,
        summaryType: 'response_count',
        summaryLabel: 'Count',
      },
      { id: 'divider', type: 'divider', required: false, dividerLabel: 'Next' },
      {
        id: 'info',
        type: 'info_callout',
        required: false,
        calloutMessage: 'Read me',
        calloutVariant: 'info',
      },
    ];
    const interactive = [
      {
        id: 'list',
        type: 'list_item',
        label: 'Bring',
        required: false,
        items: [{ id: 'cups', name: 'Cups', quantity: 2 }],
      },
      {
        id: 'vote',
        type: 'vote',
        label: 'Vote',
        required: false,
        options: ['A', 'B'],
        allowMultiple: true,
        showResults: true,
      },
      {
        id: 'toggle',
        type: 'toggle',
        label: 'Toggle',
        required: false,
        defaultEnabled: false,
      },
      {
        id: 'button',
        type: 'action_button',
        required: false,
        buttonLabel: 'Click',
        buttonVariant: 'outline',
        actions: [{ type: 'notify_organizers', message: 'Clicked' }],
      },
    ];
    const complete = {
      ...document,
      template: {
        ...document.template,
        sections: [
          { id: 'form', title: 'Form', layout: 'form', fields },
          {
            id: 'interactive',
            title: 'Interact',
            layout: 'interactive',
            fields: interactive,
          },
        ],
      },
    };
    const first = await body(
      await owner.request('/addon-template-definitions', 'POST', complete),
      201
    );
    expect(first.template).toEqual(complete.template);
    const second = await body(
      await owner.request('/addon-template-definitions', 'POST', document),
      201
    );
    const page = await body(
      await owner.request('/addon-template-definitions?limit=1', 'GET')
    );
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toEqual(expect.any(String));
    const next = await body(
      await owner.request(
        '/addon-template-definitions?limit=1&cursor=' +
          encodeURIComponent(page.nextCursor),
        'GET'
      )
    );
    const end = await body(
      await owner.request(
        '/addon-template-definitions?limit=1&cursor=' +
          encodeURIComponent(next.nextCursor),
        'GET'
      )
    );
    expect(end).toEqual({ items: [], nextCursor: null });
    expect(new Set([...page.items, ...next.items].map(x => x.id))).toEqual(
      new Set([first.id, second.id])
    );
  });
  it('applies the 64 KiB authoring limit to UTF-8 bytes instead of JavaScript characters', async () => {
    const owner = await setup();
    const large = {
      ...document,
      template: {
        ...document.template,
        sections: [
          {
            id: 's',
            title: 'Large',
            fields: [0, 1, 2].map(n => ({
              id: 'f' + n,
              type: 'static_text',
              required: false,
              content: '界'.repeat(9000),
            })),
          },
        ],
      },
    };
    expect(JSON.stringify(large).length).toBeLessThan(64 * 1024);
    expect(
      new TextEncoder().encode(JSON.stringify(large)).byteLength
    ).toBeGreaterThan(64 * 1024);
    await body(
      await owner.request('/addon-template-definitions', 'POST', large),
      400
    );
    large.template.sections[0].fields = large.template.sections[0].fields.slice(
      0,
      2
    );
    expect(
      new TextEncoder().encode(JSON.stringify(large)).byteLength
    ).toBeLessThan(64 * 1024);
    const valid = await body(
      await owner.request('/addon-template-definitions', 'POST', large),
      201
    );
    expect(valid.template).toEqual(large.template);
  });
  it('preserves configurable sections with empty fields while rejecting empty fixed sections', async () => {
    const owner = await setup();
    const configurable = {
      ...document,
      template: {
        ...document.template,
        sections: [
          {
            id: 'configurable',
            title: 'Organizer configures',
            configurable: true,
            fields: [],
            allowedFieldTypes: ['text'],
          },
        ],
      },
    };
    const created = await body(
      await owner.request('/addon-template-definitions', 'POST', configurable),
      201
    );
    expect(created.template).toEqual(configurable.template);
    expect(
      (
        await body(
          await owner.request(
            '/addon-template-definitions/' + created.id,
            'GET'
          )
        )
      ).template
    ).toEqual(configurable.template);
    await body(
      await owner.request(
        '/addon-template-definitions/' + created.id + '/publish',
        'POST',
        { expectedVersion: 1 }
      )
    );
    configurable.template.sections[0].configurable = false;
    const fixedError = await body(
      await owner.request('/addon-template-definitions', 'POST', configurable),
      400
    );
    expect(fixedError.error.issues).toContainEqual({
      path: 'template.sections.0.fields',
      message: expect.any(String),
    });
  });
  it('rejects unusable identifiers and contradictory selections with bounded value-free issue paths', async () => {
    const owner = await setup();
    for (const unsafeId of ['$bad', '界', 'bad\u0001', '__proto__']) {
      const invalid = {
        ...document,
        template: {
          ...document.template,
          sections: [
            {
              ...document.template.sections[0],
              fields: [
                { ...document.template.sections[0].fields[0], id: unsafeId },
              ],
            },
          ],
        },
      };
      const response = await body(
        await owner.request('/addon-template-definitions', 'POST', invalid),
        400
      );
      expect(response.error.issues).toContainEqual({
        path: 'template.sections.0.fields.0.id',
        message: expect.any(String),
      });
      expect(JSON.stringify(response)).not.toContain(unsafeId);
    }
    for (const config of [
      { minSelections: 2, maxSelections: 1 },
      { minSelections: 0, maxSelections: 0 },
      { minSelections: 3, maxSelections: 3 },
      { options: ['A', 'A'] },
      { maxSelections: 3 },
    ]) {
      const invalid = {
        ...document,
        template: {
          ...document.template,
          sections: [
            {
              ...document.template.sections[0],
              fields: [
                {
                  id: 'choice',
                  type: 'multiselect',
                  label: 'Choose',
                  required: true,
                  options: ['A', 'B'],
                  ...config,
                },
              ],
            },
          ],
        },
      };
      const response = await body(
        await owner.request('/addon-template-definitions', 'POST', invalid),
        400
      );
      expect(
        response.error.issues.some((i: { path: string }) =>
          i.path.startsWith('template.sections.0.fields.0.')
        )
      ).toBe(true);
    }
    const response = await body(
      await owner.request('/addon-template-definitions', 'POST', {
        ...document,
        SECRET_UNKNOWN_FIELD: 'SECRET_VALUE',
      }),
      400
    );
    expect(JSON.stringify(response)).not.toContain('SECRET');
    expect(response.error.issues.length).toBeLessThanOrEqual(10);
    expect(
      response.error.issues.every(
        (i: { path: string; message: string }) =>
          i.path.length <= 200 && i.message.length <= 240
      )
    ).toBe(true);
  });
});
