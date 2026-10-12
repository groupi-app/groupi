import { describe, expect, it, vi } from 'vitest';
vi.unmock('@/convex/_generated/api');
vi.mock('@/context/global-user-context', () => ({ useGlobalUser: vi.fn() }));
vi.mock('@/hooks/convex/use-events', () => ({
  useEventHeaderData: vi.fn(),
  useEventAttendeesData: vi.fn(),
}));
vi.mock('@/hooks/convex/use-accounts', () => ({
  useHasLinkedProviders: vi.fn(),
}));

// Catalog/creation behavior is exercised against the real definitions, so a
// missing catalog entry or a serializer dropping an add-on fails this suite.
describe('add-on catalog and creation', () => {
  it('provides all built-ins in stable display order before any rendering', async () => {
    const { getAddonRegistry } = await import('../runtime/catalog');
    expect(getAddonRegistry().map(addon => addon.id)).toEqual([
      'reminders',
      'questionnaire',
      'bring-list',
      'discord',
    ]);
  });

  it('serializes enabled saved configs in catalog order, followed by custom templates', async () => {
    const { serializeAddonConfigs } = await import('./catalog');
    const custom = {
      templateId: 'shared-template',
      template: {
        name: 'Event template',
        description: 'Saved event version',
        sections: [],
      },
    };
    expect(
      serializeAddonConfigs({
        addonConfigs: {
          'custom:shared-template': custom,
          discord: { guildId: 'guild-a' },
          questionnaire: {
            questions: [{ id: 'q1', type: 'text', question: 'Diet?' }],
          },
          reminders: { reminderOffset: '1_HOUR' },
        },
      })
    ).toEqual([
      { addonType: 'reminders', config: { reminderOffset: '1_HOUR' } },
      {
        addonType: 'questionnaire',
        config: { questions: [{ id: 'q1', type: 'text', question: 'Diet?' }] },
      },
      { addonType: 'discord', config: { guildId: 'guild-a' } },
      { addonType: 'custom:shared-template', config: custom },
    ]);
    expect(serializeAddonConfigs({})).toEqual([]);
  });
});
