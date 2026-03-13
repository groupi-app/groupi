import { describe, test, expect, beforeEach } from 'vitest';
import { createTestInstance, createTestEventWithUser } from './test_helpers';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const api: any = require('../_generated/api').api;

// ===== Import pure functions for unit testing =====

import {
  resolveTemplate,
  buildVariableContext,
} from '../addons/automations/resolve';
import { evaluateConditions } from '../addons/automations/conditions';
import {
  isValidAutomation,
  isValidAutomations,
  isValidTrigger,
  isValidAction,
  isValidCondition,
} from '../addons/automations/types';
import type { AutomationCondition } from '../addons/automations/types';

// ===== Unit Tests: Template Resolution =====

describe('resolveTemplate', () => {
  const ctx = buildVariableContext({
    memberName: 'Alice',
    memberRole: 'ATTENDEE',
    eventTitle: 'Game Night',
    eventLocation: 'Room 42',
    eventDate: 'Friday, Jan 10, 2025',
    fieldValues: { dietary: 'Vegan', guests: 3 },
    topVoteOption: 'Board Games',
    addonName: 'Potluck Signup',
  });

  test('resolves simple variables', () => {
    expect(resolveTemplate('Hello {{member.name}}!', ctx)).toBe('Hello Alice!');
  });

  test('resolves nested field variables', () => {
    expect(resolveTemplate('Diet: {{fields.dietary}}', ctx)).toBe(
      'Diet: Vegan'
    );
  });

  test('resolves numeric fields', () => {
    expect(resolveTemplate('Guests: {{fields.guests}}', ctx)).toBe('Guests: 3');
  });

  test('resolves event variables', () => {
    expect(resolveTemplate('{{event.title}} at {{event.location}}', ctx)).toBe(
      'Game Night at Room 42'
    );
  });

  test('replaces unknown variables with empty string', () => {
    expect(resolveTemplate('{{unknown.path}}', ctx)).toBe('');
  });

  test('handles multiple variables in one template', () => {
    expect(resolveTemplate('{{member.name}} joined {{event.title}}', ctx)).toBe(
      'Alice joined Game Night'
    );
  });

  test('handles templates with no variables', () => {
    expect(resolveTemplate('No variables here', ctx)).toBe('No variables here');
  });

  test('handles empty template', () => {
    expect(resolveTemplate('', ctx)).toBe('');
  });

  test('resolves addon name', () => {
    expect(resolveTemplate('From: {{addon.name}}', ctx)).toBe(
      'From: Potluck Signup'
    );
  });

  test('resolves vote top option', () => {
    expect(resolveTemplate('Winner: {{vote.top_option}}', ctx)).toBe(
      'Winner: Board Games'
    );
  });
});

// ===== Unit Tests: Condition Evaluation =====

describe('evaluateConditions', () => {
  const ctx = buildVariableContext({
    memberName: 'Alice',
    memberRole: 'ATTENDEE',
    fieldValues: {
      dietary: 'Vegan',
      guests: 3,
      allergies: '',
      tags: ['fun', 'outdoor'],
    },
  });

  test('empty conditions always pass', () => {
    expect(evaluateConditions([], ctx)).toBe(true);
  });

  test('equals operator', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.dietary', operator: 'equals', value: 'Vegan' },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  test('equals is case-insensitive for strings', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.dietary', operator: 'equals', value: 'vegan' },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  test('not_equals operator', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.dietary', operator: 'not_equals', value: 'None' },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  test('not_equals returns false when equal', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.dietary', operator: 'not_equals', value: 'Vegan' },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(false);
  });

  test('contains operator with string', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.dietary', operator: 'contains', value: 'ega' },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  test('contains operator with array', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.tags', operator: 'contains', value: 'fun' },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  test('not_contains operator', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.dietary', operator: 'not_contains', value: 'Meat' },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  test('greater_than operator', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.guests', operator: 'greater_than', value: 2 },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  test('less_than operator', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.guests', operator: 'less_than', value: 5 },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  test('greater_or_equal operator', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.guests', operator: 'greater_or_equal', value: 3 },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  test('less_or_equal operator', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.guests', operator: 'less_or_equal', value: 3 },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  test('is_empty operator on empty string', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.allergies', operator: 'is_empty' },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  test('is_empty operator on non-empty string', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.dietary', operator: 'is_empty' },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(false);
  });

  test('is_not_empty operator', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.dietary', operator: 'is_not_empty' },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  test('is_empty on undefined field', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.nonexistent', operator: 'is_empty' },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  test('in_list operator', () => {
    const conditions: AutomationCondition[] = [
      {
        field: 'member.role',
        operator: 'in_list',
        value: ['ORGANIZER', 'MODERATOR', 'ATTENDEE'],
      },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  test('not_in_list operator', () => {
    const conditions: AutomationCondition[] = [
      {
        field: 'member.role',
        operator: 'not_in_list',
        value: ['ORGANIZER', 'MODERATOR'],
      },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  test('AND logic: all conditions must pass', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.dietary', operator: 'not_equals', value: 'None' },
      { field: 'fields.guests', operator: 'greater_than', value: 2 },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(true);
  });

  test('AND logic: one failing condition fails all', () => {
    const conditions: AutomationCondition[] = [
      { field: 'fields.dietary', operator: 'not_equals', value: 'None' },
      { field: 'fields.guests', operator: 'greater_than', value: 10 },
    ];
    expect(evaluateConditions(conditions, ctx)).toBe(false);
  });
});

// ===== Unit Tests: Validation =====

describe('automation validation', () => {
  test('isValidTrigger accepts valid trigger', () => {
    expect(isValidTrigger({ type: 'form_submitted' })).toBe(true);
  });

  test('isValidTrigger rejects invalid type', () => {
    expect(isValidTrigger({ type: 'invalid_trigger' })).toBe(false);
  });

  test('isValidTrigger requires fieldId for list_item_full', () => {
    expect(isValidTrigger({ type: 'list_item_full' })).toBe(false);
    expect(isValidTrigger({ type: 'list_item_full', fieldId: 'f1' })).toBe(
      true
    );
  });

  test('isValidTrigger requires threshold for vote_threshold', () => {
    expect(isValidTrigger({ type: 'vote_threshold' })).toBe(false);
    expect(isValidTrigger({ type: 'vote_threshold', threshold: 0 })).toBe(
      false
    );
    expect(isValidTrigger({ type: 'vote_threshold', threshold: 5 })).toBe(true);
  });

  test('isValidCondition accepts valid condition', () => {
    expect(
      isValidCondition({ field: 'fields.x', operator: 'equals', value: 'y' })
    ).toBe(true);
  });

  test('isValidCondition rejects empty field', () => {
    expect(isValidCondition({ field: '', operator: 'equals' })).toBe(false);
  });

  test('isValidCondition rejects invalid operator', () => {
    expect(isValidCondition({ field: 'x', operator: 'invalid' })).toBe(false);
  });

  test('isValidAction accepts valid actions', () => {
    expect(isValidAction({ type: 'notify_members', message: 'Hello' })).toBe(
      true
    );
    expect(
      isValidAction({ type: 'create_post', title: 'Title', message: 'Body' })
    ).toBe(true);
    expect(
      isValidAction({ type: 'send_webhook', webhookUrl: 'https://example.com' })
    ).toBe(true);
    expect(isValidAction({ type: 'set_addon_data', key: 'my-key' })).toBe(true);
  });

  test('isValidAction rejects missing required fields', () => {
    expect(isValidAction({ type: 'notify_members' })).toBe(false); // missing message
    expect(isValidAction({ type: 'create_post', title: 'T' })).toBe(false); // missing message
    expect(isValidAction({ type: 'create_post', message: 'M' })).toBe(false); // missing title
    expect(isValidAction({ type: 'send_webhook' })).toBe(false); // missing url
    expect(isValidAction({ type: 'set_addon_data' })).toBe(false); // missing key
  });

  test('isValidAutomation accepts valid automation', () => {
    expect(
      isValidAutomation({
        id: 'a1',
        name: 'Test',
        enabled: true,
        trigger: { type: 'form_submitted' },
        conditions: [],
        actions: [{ type: 'notify_members', message: 'Hello' }],
      })
    ).toBe(true);
  });

  test('isValidAutomation rejects empty actions', () => {
    expect(
      isValidAutomation({
        id: 'a1',
        name: 'Test',
        enabled: true,
        trigger: { type: 'form_submitted' },
        conditions: [],
        actions: [],
      })
    ).toBe(false);
  });

  test('isValidAutomation rejects missing name', () => {
    expect(
      isValidAutomation({
        id: 'a1',
        name: '',
        enabled: true,
        trigger: { type: 'form_submitted' },
        conditions: [],
        actions: [{ type: 'notify_members', message: 'Hello' }],
      })
    ).toBe(false);
  });

  test('isValidAutomations validates array', () => {
    expect(isValidAutomations([])).toBe(true);
    expect(
      isValidAutomations([
        {
          id: 'a1',
          name: 'Test',
          enabled: true,
          trigger: { type: 'form_submitted' },
          conditions: [],
          actions: [{ type: 'notify_members', message: 'Hello' }],
        },
      ])
    ).toBe(true);
    expect(isValidAutomations('not-an-array')).toBe(false);
  });
});

// ===== Integration Tests: Template with Automations =====

describe('custom addon with automations', () => {
  let t: ReturnType<typeof createTestInstance>;

  beforeEach(() => {
    t = createTestInstance();
  });

  const templateWithAutomations = {
    name: 'Potluck Signup',
    description: 'Coordinate who brings what',
    iconName: 'listChecks',
    sections: [
      {
        id: 'sec1',
        title: 'Dietary Info',
        fields: [
          {
            id: 'f1',
            type: 'text',
            label: 'Dietary restrictions',
            required: true,
            variant: 'short',
          },
        ],
      },
    ],
    automations: [
      {
        id: 'a1',
        name: 'Dietary alert',
        enabled: true,
        trigger: { type: 'form_submitted' },
        conditions: [
          { field: 'fields.dietary', operator: 'not_equals', value: 'None' },
        ],
        actions: [
          {
            type: 'notify_organizers',
            message: '{{member.name}} has dietary needs: {{fields.dietary}}',
          },
        ],
      },
    ],
  };

  test('should accept template with valid automations', async () => {
    const { userId, eventId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const result = await asUser.mutation(api.addons.mutations.enableAddon, {
      eventId,
      addonType: 'custom:potluck',
      config: {
        templateId: 'potluck',
        template: templateWithAutomations,
      },
    });

    expect(result.success).toBe(true);
  });

  test('should reject template with invalid automations', async () => {
    const { userId, eventId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const badTemplate = {
      ...templateWithAutomations,
      automations: [
        {
          id: 'a1',
          name: '', // invalid: empty name
          enabled: true,
          trigger: { type: 'form_submitted' },
          conditions: [],
          actions: [{ type: 'notify_members', message: 'Hi' }],
        },
      ],
    };

    await expect(
      asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'custom:bad',
        config: { templateId: 'bad', template: badTemplate },
      })
    ).rejects.toThrow('Invalid config');
  });

  test('should reject automation with invalid trigger type', async () => {
    const { userId, eventId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const badTemplate = {
      ...templateWithAutomations,
      automations: [
        {
          id: 'a1',
          name: 'Bad trigger',
          enabled: true,
          trigger: { type: 'not_a_trigger' },
          conditions: [],
          actions: [{ type: 'notify_members', message: 'Hi' }],
        },
      ],
    };

    await expect(
      asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'custom:bad',
        config: { templateId: 'bad', template: badTemplate },
      })
    ).rejects.toThrow('Invalid config');
  });

  test('should reject automation with no actions', async () => {
    const { userId, eventId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const badTemplate = {
      ...templateWithAutomations,
      automations: [
        {
          id: 'a1',
          name: 'No actions',
          enabled: true,
          trigger: { type: 'form_submitted' },
          conditions: [],
          actions: [],
        },
      ],
    };

    await expect(
      asUser.mutation(api.addons.mutations.enableAddon, {
        eventId,
        addonType: 'custom:bad',
        config: { templateId: 'bad', template: badTemplate },
      })
    ).rejects.toThrow('Invalid config');
  });

  test('template with no automations works fine', async () => {
    const { userId, eventId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    const noAutoTemplate = {
      name: 'No Automations',
      description: 'Simple template',
      iconName: 'list',
      sections: [
        {
          id: 's1',
          title: 'Section',
          fields: [
            {
              id: 'f1',
              type: 'text',
              label: 'Name',
              required: true,
              variant: 'short',
            },
          ],
        },
      ],
      // No automations field at all
    };

    const result = await asUser.mutation(api.addons.mutations.enableAddon, {
      eventId,
      addonType: 'custom:simple',
      config: { templateId: 'simple', template: noAutoTemplate },
    });

    expect(result.success).toBe(true);
  });

  test('onDataSubmitted lifecycle fires from setAddonData', async () => {
    const { userId, eventId, personId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    // Enable addon with automation that triggers on form submission
    await asUser.mutation(api.addons.mutations.enableAddon, {
      eventId,
      addonType: 'custom:potluck',
      config: {
        templateId: 'potluck',
        template: templateWithAutomations,
      },
    });

    // Submit data — this should trigger onDataSubmitted lifecycle
    // The automation should fire (conditions: dietary != None)
    // but since the organizer who submitted IS the only organizer,
    // the notify_organizers action won't create a notification for them.
    const result = await asUser.mutation(api.addons.mutations.setAddonData, {
      eventId,
      addonType: 'custom:potluck',
      key: `response:${personId}`,
      data: { dietary: 'Vegan' },
    });

    expect(result.id).toBeDefined();
  });

  test('setAddonData still works normally with automations', async () => {
    const { userId, eventId, personId } = await createTestEventWithUser(t);
    const asUser = t.withIdentity({ subject: userId });

    // Enable addon
    await asUser.mutation(api.addons.mutations.enableAddon, {
      eventId,
      addonType: 'custom:potluck',
      config: {
        templateId: 'potluck',
        template: templateWithAutomations,
      },
    });

    // Submit data
    await asUser.mutation(api.addons.mutations.setAddonData, {
      eventId,
      addonType: 'custom:potluck',
      key: `response:${personId}`,
      data: { dietary: 'None' },
    });

    // Verify data was stored
    const data = await t.run(async ctx => {
      return await ctx.db
        .query('addonData')
        .withIndex('by_event_addon', q =>
          q.eq('eventId', eventId).eq('addonType', 'custom:potluck')
        )
        .collect();
    });

    expect(data).toHaveLength(1);
    expect(data[0].key).toBe(`response:${personId}`);
  });
});
