import { describe, it, expect } from 'vitest';
import { api } from '../_generated/api';
import { createTestInstance, TestScenarios } from './test_helpers';

describe('Template draft contracts', () => {
  it('rejects unstructured templates while allowing a structured incomplete draft', async () => {
    const t = createTestInstance();
    const { auth } = await TestScenarios.simpleUser(t);
    await expect(
      auth.mutation(api.addonTemplates.mutations.createTemplate, {
        name: 'Draft',
        description: '',
        iconName: 'List',
        template: 'invalid',
      })
    ).rejects.toThrow();
    const id = await auth.mutation(
      api.addonTemplates.mutations.createTemplate,
      {
        name: 'Draft',
        description: '',
        iconName: 'List',
        template: {
          name: 'Draft',
          description: '',
          iconName: 'List',
          sections: [],
        },
      }
    );
    const draft = await auth.query(api.addonTemplates.queries.getTemplate, {
      templateId: id,
    });
    expect(draft?.template).toEqual({
      name: 'Draft',
      description: '',
      iconName: 'List',
      sections: [],
    });
    const { auth: stranger } = await TestScenarios.simpleUser(t);
    expect(
      await stranger.query(api.addonTemplates.queries.getTemplate, {
        templateId: id,
      })
    ).toBeNull();
    await expect(
      stranger.mutation(api.addonTemplates.mutations.updateTemplate, {
        templateId: id,
        name: 'Stolen',
      })
    ).rejects.toThrow('You do not own');
    await expect(
      auth.mutation(api.addonTemplates.mutations.publishTemplate, {
        templateId: id,
      })
    ).rejects.toThrow();
  });
});

it('preserves text automation payloads authored by the app and stores interpolated data', async () => {
  const t = createTestInstance();
  const { auth, eventId, personId } = await TestScenarios.singleEvent(t);
  const templateId = await auth.mutation(
    api.addonTemplates.mutations.createTemplate,
    {
      name: 'Text action',
      description: 'Test',
      iconName: 'List',
      template: {
        name: 'Text action',
        description: 'Test',
        iconName: 'List',
        sections: [
          {
            id: 'form',
            title: 'Form',
            fields: [
              { id: 'answer', type: 'text', label: 'Answer', required: false },
            ],
          },
        ],
        onSubmitActions: [
          {
            type: 'set_addon_data',
            key: 'saved',
            data: 'Saved {{fields.answer}}',
          },
        ],
      },
    }
  );
  const draft = await auth.query(api.addonTemplates.queries.getTemplate, {
    templateId,
  });
  expect(draft?.template.onSubmitActions?.[0].data).toBe(
    'Saved {{fields.answer}}'
  );
  await auth.mutation(api.addons.mutations.enableAddon, {
    eventId,
    addonType: `custom:${templateId}`,
    config: { templateId, template: draft!.template },
  });
  await auth.mutation(api.addons.mutations.setAddonData, {
    eventId,
    addonType: `custom:${templateId}`,
    key: `response:${personId}`,
    data: { answer: 'Yes' },
  });
  const entries = await auth.query(api.addons.queries.getAddonData, {
    eventId,
    addonType: `custom:${templateId}`,
  });
  expect(entries.find(entry => entry.key === 'saved')?.data).toBe('Saved Yes');
});
