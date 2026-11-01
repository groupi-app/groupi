import {
  Children,
  isValidElement,
  type ReactNode,
  type ReactElement,
} from 'react';
import { router } from 'expo-router';
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('../../hooks/use-addons', () => ({
  useAddonCompletionStatus: () => ({
    addons: [{ addonType: 'questionnaire', completed: true }],
  }),
}));
vi.mock('../ui/button', () => ({ Button: 'Button' }));
vi.mock('../ui/text', () => ({ Text: 'Text' }));
vi.mock('./reminder-addon', () => ({ ReminderAddon: 'ReminderAddon' }));
vi.mock('./discord-addon', () => ({ DiscordAddon: 'DiscordAddon' }));
vi.mock('./custom-addon-fallback', () => ({
  CustomAddonFallback: 'CustomAddonFallback',
}));
import {
  EventPlanningFeatures,
  EventParticipationFeatures,
} from './event-features';
const addons = [
  {
    addonType: 'reminders',
    enabled: true,
    config: { reminderOffset: '1_DAY' },
  },
  {
    addonType: 'questionnaire',
    enabled: true,
    config: {
      questions: [
        {
          id: 'name',
          label: 'Your name',
          type: 'SHORT_ANSWER',
          required: true,
        },
      ],
    },
  },
  {
    addonType: 'bring-list',
    enabled: true,
    config: { items: [{ id: 'ice', name: 'Ice', quantity: 1 }] },
  },
  { addonType: 'discord', enabled: true, config: { guildId: 'guild' } },
  ...['card', 'display', 'full'].map(mode => ({
    addonType: `custom:${mode}`,
    enabled: true,
    config: {
      template: {
        name: `Saved ${mode}`,
        description: 'For this Event',
        [mode]: true,
      },
    },
  })),
  {
    addonType: 'future-private',
    enabled: true,
    config: { secret: 'DO_NOT_RENDER' },
  },
  {
    addonType: 'custom:disabled',
    enabled: false,
    config: {
      template: { name: 'Disabled feature', description: 'Do not show' },
    },
  },
];
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (
    node === null ||
    node === undefined ||
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean'
  )
    return [];
  if (!isValidElement<Record<string, unknown>>(node))
    return Children.toArray(node).flatMap(elements);
  return [node, ...elements(node.props.children as ReactNode)];
}
function text(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (node === null || node === undefined || typeof node === 'boolean')
    return '';
  if (typeof node === 'number') return String(node);
  if (!isValidElement<Record<string, unknown>>(node))
    return Children.toArray(node).map(text).join(' ');
  return text(node.props.children as ReactNode);
}
beforeEach(() => vi.clearAllMocks());
it('places personal reminders and Discord status beside Event planning only', () => {
  const tree = elements(EventPlanningFeatures({ eventId: 'event', addons }));
  expect(tree.filter(item => item.type === 'ReminderAddon')).toHaveLength(1);
  expect(tree.filter(item => item.type === 'DiscordAddon')).toHaveLength(1);
  expect(tree.some(item => item.type === 'CustomAddonFallback')).toBe(false);
  expect(text(EventPlanningFeatures({ eventId: 'event', addons }))).toContain(
    'Remind me'
  );
});
it('retains every enabled custom experience and participant link without generic management', () => {
  const screen = EventParticipationFeatures({ eventId: 'event', addons }),
    tree = elements(screen);
  const buttons = tree.filter(item => item.type === 'Button');
  expect(buttons.map(item => item.props.children)).toEqual([
    'Your details',
    'What to bring',
  ]);
  expect(
    tree
      .filter(item => item.type === 'CustomAddonFallback')
      .map(item => item.props.addonType)
  ).toEqual(['custom:card', 'custom:display', 'custom:full']);
  (buttons[0].props.onPress as () => void)();
  (buttons[1].props.onPress as () => void)();
  expect(router.push).toHaveBeenCalledWith('/event/event/addons/questionnaire');
  expect(router.push).toHaveBeenCalledWith('/event/event/addons/bring-list');
  expect(text(screen)).toContain('Your details are complete');
  expect(text(screen)).toContain(
    'configuration and participant data are preserved'
  );
  expect(text(screen)).not.toContain('DO_NOT_RENDER');
  expect(text(screen)).not.toContain('View All');
  expect(text(screen)).not.toContain('Add-ons');
});
it('hides all disabled features and preserves malformed enabled types in the unavailable fallback', () => {
  const disabled = addons.map(addon => ({ ...addon, enabled: false }));
  expect(
    elements(
      EventParticipationFeatures({ eventId: 'event', addons: disabled })
    ).filter(
      item => item.type === 'Button' || item.type === 'CustomAddonFallback'
    )
  ).toHaveLength(0);
  const screen = EventParticipationFeatures({
    eventId: 'event',
    addons: [
      {
        addonType: 'bring-list',
        enabled: true,
        config: { items: 'secret-invalid' },
      },
    ],
  });
  expect(text(screen)).toContain('Saved event feature');
  expect(text(screen)).not.toContain('secret-invalid');
  expect(elements(screen).filter(item => item.type === 'Button')).toHaveLength(
    0
  );
});
