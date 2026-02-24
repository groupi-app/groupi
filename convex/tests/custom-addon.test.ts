import { describe, test, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import {
  createTestInstance,
  createTestEventWithUser,
  createTestUser,
} from './test_helpers';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const api: any = require('../_generated/api').api;

// ===== Test template fixtures =====

const validTemplate = {
  name: 'Potluck Signup',
  description: 'Coordinate who brings what',
  iconName: 'listChecks',
  settings: {
    requiresCompletion: false,
    supportsOptOut: true,
    optOutLabel: "I'm not bringing food",
  },
  sections: [
    {
      id: 'sec1',
      title: 'Dietary Info',
      fields: [
        {
          id: 'f1',
          type: 'multiselect',
          label: 'Dietary restrictions',
          required: true,
          options: ['None', 'Vegetarian', 'Vegan', 'Gluten-free'],
        },
      ],
    },
    {
      id: 'sec2',
      title: 'What are you bringing?',
      fields: [
        {
          id: 'f2',
          type: 'list_item',
          label: 'Sign up for items',
          required: false,
          items: [
            { id: 'i1', name: 'Main dish', quantity: 2 },
            { id: 'i2', name: 'Side dish', quantity: 4 },
          ],
        },
        {
          id: 'f3',
          type: 'vote',
          label: 'Best potluck theme',
          required: false,
          options: ['Hawaiian', 'Mexican', 'Italian', 'BBQ'],
          allowMultiple: false,
          showResults: true,
        },
      ],
    },
  ],
};

const minimalTemplate = {
  name: 'Simple Poll',
  description: 'A simple poll',
  iconName: 'barChart',
  sections: [
    {
      id: 's1',
      title: 'Poll',
      fields: [
        {
          id: 'f1',
          type: 'select',
          label: 'Pick one',
          required: true,
          options: ['Option A', 'Option B'],
        },
      ],
    },
  ],
};

// ===== Template CRUD Tests =====

describe('addonTemplates', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = createTestInstance();
  });

  describe('createTemplate', () => {
    test('should create a template as draft', async () => {
      const { userId } = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const templateId = await asUser.mutation(
        api.addonTemplates.mutations.createTemplate,
        {
          name: 'Test Template',
          description: 'A test template',
          iconName: 'listChecks',
          template: validTemplate,
        }
      );

      expect(templateId).toBeDefined();

      const saved = await t.run(async ctx => {
        return await ctx.db.get(templateId);
      });

      expect(saved).toBeTruthy();
      expect(saved!.name).toBe('Test Template');
      expect(saved!.isPublished).toBe(false);
      expect(saved!.version).toBe(1);
    });

    test('should reject names longer than 60 characters', async () => {
      const { userId } = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addonTemplates.mutations.createTemplate, {
          name: 'x'.repeat(61),
          description: 'desc',
          iconName: 'icon',
          template: minimalTemplate,
        })
      ).rejects.toThrow('Name must be between 1 and 60 characters');
    });

    test('should reject empty names', async () => {
      const { userId } = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addonTemplates.mutations.createTemplate, {
          name: '',
          description: 'desc',
          iconName: 'icon',
          template: minimalTemplate,
        })
      ).rejects.toThrow('Name must be between 1 and 60 characters');
    });

    test('should reject descriptions longer than 200 characters', async () => {
      const { userId } = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.addonTemplates.mutations.createTemplate, {
          name: 'Valid Name',
          description: 'x'.repeat(201),
          iconName: 'icon',
          template: minimalTemplate,
        })
      ).rejects.toThrow('Description must be at most 200 characters');
    });

    test('should require authentication', async () => {
      await expect(
        t.mutation(api.addonTemplates.mutations.createTemplate, {
          name: 'Test',
          description: 'desc',
          iconName: 'icon',
          template: minimalTemplate,
        })
      ).rejects.toThrow();
    });
  });

  describe('getMyTemplates', () => {
    test('should return only templates owned by the current user', async () => {
      const { userId: user1Id } = await createTestUser(t, {
        email: 'user1@test.com',
      });
      const { userId: user2Id } = await createTestUser(t, {
        email: 'user2@test.com',
      });
      const asUser1 = t.withIdentity({ subject: user1Id });
      const asUser2 = t.withIdentity({ subject: user2Id });

      // User 1 creates a template
      await asUser1.mutation(api.addonTemplates.mutations.createTemplate, {
        name: 'User 1 Template',
        description: 'desc',
        iconName: 'icon',
        template: minimalTemplate,
      });

      // User 2 creates a template
      await asUser2.mutation(api.addonTemplates.mutations.createTemplate, {
        name: 'User 2 Template',
        description: 'desc',
        iconName: 'icon',
        template: minimalTemplate,
      });

      const user1Templates = await asUser1.query(
        api.addonTemplates.queries.getMyTemplates,
        {}
      );
      expect(user1Templates).toHaveLength(1);
      expect(user1Templates[0].name).toBe('User 1 Template');

      const user2Templates = await asUser2.query(
        api.addonTemplates.queries.getMyTemplates,
        {}
      );
      expect(user2Templates).toHaveLength(1);
      expect(user2Templates[0].name).toBe('User 2 Template');
    });
  });

  describe('updateTemplate', () => {
    test('should update template and increment version', async () => {
      const { userId } = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const templateId = await asUser.mutation(
        api.addonTemplates.mutations.createTemplate,
        {
          name: 'Original',
          description: 'desc',
          iconName: 'icon',
          template: minimalTemplate,
        }
      );

      await asUser.mutation(api.addonTemplates.mutations.updateTemplate, {
        templateId,
        name: 'Updated',
      });

      const updated = await t.run(async ctx => ctx.db.get(templateId));
      expect(updated!.name).toBe('Updated');
      expect(updated!.version).toBe(2);
    });

    test('should reject updates from non-owners', async () => {
      const { userId: ownerId } = await createTestUser(t, {
        email: 'owner@test.com',
      });
      const { userId: otherId } = await createTestUser(t, {
        email: 'other@test.com',
      });
      const asOwner = t.withIdentity({ subject: ownerId });
      const asOther = t.withIdentity({ subject: otherId });

      const templateId = await asOwner.mutation(
        api.addonTemplates.mutations.createTemplate,
        {
          name: 'Owner Template',
          description: 'desc',
          iconName: 'icon',
          template: minimalTemplate,
        }
      );

      await expect(
        asOther.mutation(api.addonTemplates.mutations.updateTemplate, {
          templateId,
          name: 'Hijacked',
        })
      ).rejects.toThrow('You do not own this template');
    });
  });

  describe('publishTemplate', () => {
    test('should publish a valid template', async () => {
      const { userId } = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const templateId = await asUser.mutation(
        api.addonTemplates.mutations.createTemplate,
        {
          name: 'Publishable',
          description: 'desc',
          iconName: 'icon',
          template: validTemplate,
        }
      );

      await asUser.mutation(api.addonTemplates.mutations.publishTemplate, {
        templateId,
      });

      const published = await t.run(async ctx => ctx.db.get(templateId));
      expect(published!.isPublished).toBe(true);
    });

    test('should reject publishing an invalid template', async () => {
      const { userId } = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const templateId = await asUser.mutation(
        api.addonTemplates.mutations.createTemplate,
        {
          name: 'Invalid',
          description: 'desc',
          iconName: 'icon',
          template: { invalid: true }, // invalid template shape
        }
      );

      await expect(
        asUser.mutation(api.addonTemplates.mutations.publishTemplate, {
          templateId,
        })
      ).rejects.toThrow('Template has validation errors');
    });
  });

  describe('deleteTemplate', () => {
    test('should delete a template', async () => {
      const { userId } = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const templateId = await asUser.mutation(
        api.addonTemplates.mutations.createTemplate,
        {
          name: 'To Delete',
          description: 'desc',
          iconName: 'icon',
          template: minimalTemplate,
        }
      );

      await asUser.mutation(api.addonTemplates.mutations.deleteTemplate, {
        templateId,
      });

      const deleted = await t.run(async ctx => ctx.db.get(templateId));
      expect(deleted).toBeNull();
    });

    test('should reject deletion by non-owners', async () => {
      const { userId: ownerId } = await createTestUser(t, {
        email: 'owner@test.com',
      });
      const { userId: otherId } = await createTestUser(t, {
        email: 'other@test.com',
      });
      const asOwner = t.withIdentity({ subject: ownerId });
      const asOther = t.withIdentity({ subject: otherId });

      const templateId = await asOwner.mutation(
        api.addonTemplates.mutations.createTemplate,
        {
          name: 'Protected',
          description: 'desc',
          iconName: 'icon',
          template: minimalTemplate,
        }
      );

      await expect(
        asOther.mutation(api.addonTemplates.mutations.deleteTemplate, {
          templateId,
        })
      ).rejects.toThrow('You do not own this template');
    });
  });

  describe('duplicateTemplate', () => {
    test('should create a copy with (copy) suffix', async () => {
      const { userId } = await createTestUser(t);
      const asUser = t.withIdentity({ subject: userId });

      const templateId = await asUser.mutation(
        api.addonTemplates.mutations.createTemplate,
        {
          name: 'Original',
          description: 'desc',
          iconName: 'icon',
          template: validTemplate,
        }
      );

      const copyId = await asUser.mutation(
        api.addonTemplates.mutations.duplicateTemplate,
        { templateId }
      );

      expect(copyId).toBeDefined();
      expect(copyId).not.toBe(templateId);

      const copy = await t.run(async ctx => ctx.db.get(copyId));
      expect(copy!.name).toBe('Original (copy)');
      expect(copy!.isPublished).toBe(false);
      expect(copy!.version).toBe(1);
    });
  });
});

// ===== Custom Addon Handler Tests =====

describe('custom addon handler', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = createTestInstance();
  });

  const customConfig = {
    templateId: 'template123',
    template: validTemplate,
  };

  test('should enable a custom addon with valid config', async () => {
    const { userId, eventId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const result = await asUser.mutation(api.addons.mutations.enableAddon, {
      eventId,
      addonType: 'custom:template123',
      config: customConfig,
    });

    expect(result.success).toBe(true);

    const configs = await t.run(async ctx => {
      return await ctx.db
        .query('eventAddonConfigs')
        .withIndex('by_event_addon', q =>
          q.eq('eventId', eventId).eq('addonType', 'custom:template123')
        )
        .collect();
    });

    expect(configs).toHaveLength(1);
    expect(configs[0].enabled).toBe(true);
  });

  test('should reject custom addon with invalid config', async () => {
    const { userId, eventId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'custom:template123',
        config: { templateId: 'template123', template: { invalid: true } },
      })
    ).rejects.toThrow('Invalid config');
  });

  test('should reject custom addon without templateId', async () => {
    const { userId, eventId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'custom:template123',
        config: { template: validTemplate },
      })
    ).rejects.toThrow('Invalid config');
  });

  test('should allow multiple custom addons on the same event', async () => {
    const { userId, eventId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await asUser.mutation(api.addons.mutations.enableAddon, {
      eventId,
      addonType: 'custom:template1',
      config: {
        templateId: 'template1',
        template: validTemplate,
      },
    });

    await asUser.mutation(api.addons.mutations.enableAddon, {
      eventId,
      addonType: 'custom:template2',
      config: {
        templateId: 'template2',
        template: minimalTemplate,
      },
    });

    const configs = await t.run(async ctx => {
      return await ctx.db
        .query('eventAddonConfigs')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .collect();
    });

    const customConfigs = configs.filter((c: { addonType: string }) =>
      c.addonType.startsWith('custom:')
    );
    expect(customConfigs).toHaveLength(2);
  });

  test('should store and retrieve addon data for custom addon', async () => {
    const { userId, eventId, personId } = await createTestEventWithUser(t, {});
    const asUser = t.withIdentity({ subject: userId });

    // Enable addon
    await asUser.mutation(api.addons.mutations.enableAddon, {
      eventId,
      addonType: 'custom:template123',
      config: customConfig,
    });

    // Set response data
    await asUser.mutation(api.addons.mutations.setAddonData, {
      eventId,
      addonType: 'custom:template123',
      key: `response:${personId}`,
      data: { f1: ['Vegetarian'], f3: 'Hawaiian' },
    });

    // Retrieve data
    const data = await t.run(async ctx => {
      return await ctx.db
        .query('addonData')
        .withIndex('by_event_addon', q =>
          q.eq('eventId', eventId).eq('addonType', 'custom:template123')
        )
        .collect();
    });

    expect(data).toHaveLength(1);
    expect(data[0].key).toBe(`response:${personId}`);
  });

  test('should clean up data when custom addon is disabled', async () => {
    const { userId, eventId, personId } = await createTestEventWithUser(t, {});
    const asUser = t.withIdentity({ subject: userId });

    // Enable addon and set data
    await asUser.mutation(api.addons.mutations.enableAddon, {
      eventId,
      addonType: 'custom:template123',
      config: customConfig,
    });

    await asUser.mutation(api.addons.mutations.setAddonData, {
      eventId,
      addonType: 'custom:template123',
      key: `response:${personId}`,
      data: { f1: ['None'] },
    });

    // Disable addon
    await asUser.mutation(api.addons.mutations.disableAddon, {
      eventId,
      addonType: 'custom:template123',
    });

    // Verify data was cleaned up
    const data = await t.run(async ctx => {
      return await ctx.db
        .query('addonData')
        .withIndex('by_event_addon', q =>
          q.eq('eventId', eventId).eq('addonType', 'custom:template123')
        )
        .collect();
    });

    expect(data).toHaveLength(0);
  });

  test('should clear data on config update', async () => {
    const { userId, eventId, personId } = await createTestEventWithUser(t, {});
    const asUser = t.withIdentity({ subject: userId });

    // Enable addon and set data
    await asUser.mutation(api.addons.mutations.enableAddon, {
      eventId,
      addonType: 'custom:template123',
      config: customConfig,
    });

    await asUser.mutation(api.addons.mutations.setAddonData, {
      eventId,
      addonType: 'custom:template123',
      key: `response:${personId}`,
      data: { f1: ['Vegan'] },
    });

    // Update config
    await asUser.mutation(api.addons.mutations.updateAddonConfig, {
      eventId,
      addonType: 'custom:template123',
      config: {
        templateId: 'template123',
        template: {
          ...validTemplate,
          name: 'Updated Potluck',
        },
      },
    });

    // Verify data was cleared
    const data = await t.run(async ctx => {
      return await ctx.db
        .query('addonData')
        .withIndex('by_event_addon', q =>
          q.eq('eventId', eventId).eq('addonType', 'custom:template123')
        )
        .collect();
    });

    expect(data).toHaveLength(0);
  });
});

// ===== Template Validation Tests =====

describe('custom template validation', () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = createTestInstance();
  });

  test('should reject template with empty sections', async () => {
    const { userId, eventId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'custom:t1',
        config: {
          templateId: 't1',
          template: { ...validTemplate, sections: [] },
        },
      })
    ).rejects.toThrow('Invalid config');
  });

  test('should reject template with empty fields in section', async () => {
    const { userId, eventId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'custom:t1',
        config: {
          templateId: 't1',
          template: {
            ...validTemplate,
            sections: [{ id: 's1', title: 'Empty', fields: [] }],
          },
        },
      })
    ).rejects.toThrow('Invalid config');
  });

  test('should reject select field with less than 2 options', async () => {
    const { userId, eventId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'custom:t1',
        config: {
          templateId: 't1',
          template: {
            ...validTemplate,
            sections: [
              {
                id: 's1',
                title: 'Bad',
                fields: [
                  {
                    id: 'f1',
                    type: 'select',
                    label: 'Pick',
                    required: true,
                    options: ['Only one'],
                  },
                ],
              },
            ],
          },
        },
      })
    ).rejects.toThrow('Invalid config');
  });

  test('should reject list_item field with no items', async () => {
    const { userId, eventId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'custom:t1',
        config: {
          templateId: 't1',
          template: {
            ...validTemplate,
            sections: [
              {
                id: 's1',
                title: 'Bad',
                fields: [
                  {
                    id: 'f1',
                    type: 'list_item',
                    label: 'Sign up',
                    required: false,
                    items: [],
                  },
                ],
              },
            ],
          },
        },
      })
    ).rejects.toThrow('Invalid config');
  });

  test('should reject name longer than 60 chars in template', async () => {
    const { userId, eventId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    await expect(
      asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'custom:t1',
        config: {
          templateId: 't1',
          template: {
            ...validTemplate,
            name: 'x'.repeat(61),
          },
        },
      })
    ).rejects.toThrow('Invalid config');
  });

  test('should accept template with all field types', async () => {
    const { userId, eventId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const allTypesTemplate = {
      name: 'All Types',
      description: 'Tests every field type',
      iconName: 'list',
      sections: [
        {
          id: 's1',
          title: 'Form Fields',
          fields: [
            {
              id: 'f1',
              type: 'text',
              label: 'Short text',
              required: true,
              variant: 'short',
            },
            {
              id: 'f2',
              type: 'text',
              label: 'Long text',
              required: false,
              variant: 'long',
              maxLength: 500,
            },
            {
              id: 'f3',
              type: 'number',
              label: 'Count',
              required: true,
              min: 0,
              max: 100,
            },
            {
              id: 'f4',
              type: 'select',
              label: 'Dropdown',
              required: true,
              options: ['A', 'B', 'C'],
            },
            {
              id: 'f5',
              type: 'multiselect',
              label: 'Checkboxes',
              required: false,
              options: ['X', 'Y'],
            },
            { id: 'f6', type: 'yesno', label: 'Toggle', required: true },
          ],
        },
        {
          id: 's2',
          title: 'Interactive Fields',
          fields: [
            {
              id: 'f7',
              type: 'list_item',
              label: 'Signup list',
              required: false,
              items: [
                { id: 'i1', name: 'Item 1', quantity: 3 },
                { id: 'i2', name: 'Item 2', quantity: 1 },
              ],
            },
            {
              id: 'f8',
              type: 'vote',
              label: 'Poll',
              required: false,
              options: ['Choice 1', 'Choice 2', 'Choice 3'],
              allowMultiple: true,
              showResults: true,
            },
          ],
        },
      ],
    };

    const result = await asUser.mutation(api.addons.mutations.enableAddon, {
      eventId,
      addonType: 'custom:allTypes',
      config: {
        templateId: 'allTypes',
        template: allTypesTemplate,
      },
    });

    expect(result.success).toBe(true);
  });
});
