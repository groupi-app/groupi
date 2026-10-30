import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { EventSettingsAddons } from './organisms/event-settings-addons';
vi.mock('@/features/event-settings', () => ({
  useOptionalEventSettingsDraft: () => state.draft,
}));
vi.unmock('@/convex/_generated/api');
vi.mock('@/context/global-user-context', () => ({
  useGlobalUser: () => ({ person: { _id: 'person-a' } }),
}));
vi.mock('@/hooks/convex/use-accounts', () => ({
  useHasLinkedProviders: vi.fn(),
}));
const state = vi.hoisted(() => ({
  draft: null as null | {
    values: {
      addons: Array<{ addonType: string; config: unknown; enabled: boolean }>;
    };
    patch: {
      addons?: Array<{ addonType: string; config: unknown; enabled: boolean }>;
    };
    epoch: number;
    busy: boolean;
    setSection: ReturnType<typeof vi.fn>;
  },
  definitions: ['bring-list'] as string[],
  role: 'ORGANIZER',
  configs: [] as unknown[],
  enable: vi.fn(),
  disable: vi.fn(),
  update: vi.fn(),
}));
vi.mock('@/hooks/convex/use-events', () => ({
  useEventHeader: () => ({
    event: { _id: 'event-one', title: 'Picnic' },
    userMembership: { role: state.role },
  }),
}));
vi.mock('../hooks/use-addons', () => ({
  useEventAddons: () => state.configs,
  useEnableAddon: () => state.enable,
  useDisableAddon: () => state.disable,
  useUpdateAddonConfig: () => state.update,
}));
vi.mock('./organisms/template-picker', () => ({ TemplatePicker: () => null }));
vi.mock('./catalog', async importOriginal => {
  const actual = await importOriginal<typeof import('./catalog')>();
  return {
    ...actual,
    getEventAddonDefinitions: (
      configs: Parameters<typeof actual.getEventAddonDefinitions>[0]
    ) =>
      actual
        .getEventAddonDefinitions(configs)
        .filter(definition => state.definitions.includes(definition.id)),
  };
});
const eventId = 'event-one' as Id<'events'>;
const config = { items: [{ id: 'plates', name: 'Plates', quantity: 2 }] };
function saved(
  addonType = 'bring-list',
  enabled = true,
  value: unknown = config
): Doc<'eventAddonConfigs'> {
  return {
    _id: 'config-one' as Id<'eventAddonConfigs'>,
    _creationTime: 1,
    eventId,
    addonType,
    config: value as Doc<'eventAddonConfigs'>['config'],
    enabled,
    createdAt: 1,
    updatedAt: 1,
  };
}
beforeEach(() => {
  state.draft = null;
  state.definitions = ['bring-list'];
  state.role = 'ORGANIZER';
  state.configs = [saved()];
  vi.clearAllMocks();
  state.enable.mockResolvedValue({ success: true });
  state.disable.mockResolvedValue({ success: true });
  state.update.mockResolvedValue({ success: true });
});
describe('Event Settings feature management', () => {
  it('does not change configuration on mount and confirms destructive disable before any mutation', async () => {
    const user = userEvent.setup();
    render(<EventSettingsAddons eventId={eventId} />);
    expect(state.enable).not.toHaveBeenCalled();
    expect(state.update).not.toHaveBeenCalled();
    expect(state.disable).not.toHaveBeenCalled();
    await user.click(screen.getByRole('switch'));
    const dialog = screen.getByRole('alertdialog', {
      name: 'Disable event feature?',
    });
    expect(dialog).toHaveTextContent('Existing claims will be cleared');
    expect(state.disable).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(state.disable).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('switch')).toHaveFocus());
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('switch'));
    await user.click(screen.getByRole('button', { name: 'Confirm change' }));
    await waitFor(() =>
      expect(state.disable).toHaveBeenCalledWith(eventId, 'bring-list')
    );
  });
  it('retains item drafts and the confirmation on failure, then saves only after explicit retry', async () => {
    const user = userEvent.setup();
    state.update.mockRejectedValueOnce(new Error('Rejected'));
    render(<EventSettingsAddons eventId={eventId} />);
    await user.click(screen.getByRole('button', { name: 'Expand settings' }));
    await user.click(screen.getByRole('button', { name: 'Add Item' }));
    await user.type(
      screen.getByPlaceholderText('Item name (e.g. "Chips")'),
      'Forks'
    );
    await user.click(screen.getByRole('button', { name: /^Add$/ }));
    await user.click(screen.getByRole('button', { name: 'Save Items' }));
    expect(state.update).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirm change' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your edits are still here'
    );
    expect(screen.getByText('Forks')).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm change' }));
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    );
    expect(state.update).toHaveBeenCalledTimes(2);
    expect(state.update).toHaveBeenLastCalledWith(eventId, 'bring-list', {
      items: [
        { id: 'plates', name: 'Plates', quantity: 2 },
        expect.objectContaining({ name: 'Forks', quantity: 1 }),
      ],
    });
  });
  it('preserves disabled saved configuration when explicitly re-enabling and shows unknown saved features without raw data', async () => {
    const user = userEvent.setup();
    state.configs = [
      saved('bring-list', false),
      saved('unknown', true, { message: 'private-saved-value' }),
    ];
    render(<EventSettingsAddons eventId={eventId} />);
    expect(
      screen.getByRole('heading', { name: 'Saved event feature' })
    ).toBeInTheDocument();
    expect(screen.queryByText('private-saved-value')).not.toBeInTheDocument();
    expect(state.enable).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Enable Bring List' }));
    await waitFor(() =>
      expect(state.enable).toHaveBeenCalledWith(eventId, 'bring-list', config)
    );
    expect(state.disable).not.toHaveBeenCalled();
  });
  it('withholds configuration controls from attendees', () => {
    state.role = 'ATTENDEE';
    render(<EventSettingsAddons eventId={eventId} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Only current event organizers and moderators'
    );
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});

it('stages enabling and new Bring item edits in the global draft without backend writes', async () => {
  state.configs = [];
  const setSection = vi.fn((_key, value) => {
    if (state.draft) {
      state.draft.values.addons = value;
      state.draft.patch.addons = value;
    }
  });
  state.draft = {
    values: {
      addons: [
        {
          addonType: 'reminders',
          config: { reminderOffset: '1_DAY' },
          enabled: true,
        },
      ],
    },
    patch: {},
    epoch: 0,
    busy: false,
    setSection,
  };
  const mounted = render(<EventSettingsAddons eventId={eventId} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('switch'));
  await user.click(screen.getByRole('button', { name: 'Add Item' }));
  await user.type(
    screen.getByPlaceholderText('Item name (e.g. "Chips")'),
    'Forks'
  );
  await user.click(screen.getByRole('button', { name: /^Add$/ }));
  expect(setSection).toHaveBeenLastCalledWith('addons', [
    {
      addonType: 'reminders',
      config: { reminderOffset: '1_DAY' },
      enabled: true,
    },
    {
      addonType: 'bring-list',
      config: {
        items: [expect.objectContaining({ name: 'Forks', quantity: 1 })],
      },
      enabled: true,
    },
  ]);
  mounted.rerender(<EventSettingsAddons eventId={eventId} />);
  expect(
    screen.queryByRole('button', { name: 'Save Items' })
  ).not.toBeInTheDocument();
  expect(state.enable).not.toHaveBeenCalled();
  expect(state.update).not.toHaveBeenCalled();
  expect(state.disable).not.toHaveBeenCalled();
});

it('stages reminder changes for global Save and resets the editor on Revert epoch', async () => {
  state.configs = [saved('reminders', true, { reminderOffset: '1_DAY' })];
  state.definitions = ['reminders'];
  const baseline = {
    addonType: 'reminders',
    enabled: true,
    config: { reminderOffset: '1_DAY' },
  };
  const setSection = vi.fn((_key, value) => {
    if (state.draft) {
      state.draft.values.addons = value;
      state.draft.patch.addons = value;
    }
  });
  state.draft = {
    values: { addons: [baseline] },
    patch: {},
    epoch: 0,
    busy: false,
    setSection,
  };
  const mounted = render(<EventSettingsAddons eventId={eventId} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Expand settings' }));
  Element.prototype.scrollIntoView = vi.fn();
  screen.getByRole('combobox').focus();
  await user.keyboard('{Enter}');
  await user.keyboard('2 days');
  await user.keyboard('{Enter}');
  expect(setSection).toHaveBeenLastCalledWith('addons', [
    {
      addonType: 'reminders',
      enabled: true,
      config: { reminderOffset: '2_DAYS' },
    },
  ]);
  expect(state.update).not.toHaveBeenCalled();
  expect(state.enable).not.toHaveBeenCalled();
  state.draft.values.addons = [baseline];
  state.draft.patch = {};
  state.draft.epoch++;
  mounted.rerender(<EventSettingsAddons eventId={eventId} />);
  await user.click(screen.getByRole('button', { name: 'Expand settings' }));
  expect(screen.getByRole('combobox')).toHaveTextContent('1 day before');
});

it('stages a destructive disable only after confirmation, leaving the backend for global Save', async () => {
  const setSection = vi.fn((_key, value) => {
    if (state.draft) {
      state.draft.values.addons = value;
      state.draft.patch.addons = value;
    }
  });
  state.draft = {
    values: { addons: [{ addonType: 'bring-list', enabled: true, config }] },
    patch: {},
    epoch: 0,
    busy: false,
    setSection,
  };
  const mounted = render(<EventSettingsAddons eventId={eventId} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('switch'));
  expect(setSection).not.toHaveBeenCalled();
  expect(state.disable).not.toHaveBeenCalled();
  expect(screen.getByRole('alertdialog')).toHaveTextContent(
    'when you save Event settings'
  );
  await user.click(screen.getByRole('button', { name: 'Confirm change' }));
  await waitFor(() =>
    expect(setSection).toHaveBeenCalledWith('addons', [
      {
        addonType: 'bring-list',
        enabled: false,
        config,
        confirmedDestructive: true,
      },
    ])
  );
  expect(state.disable).not.toHaveBeenCalled();
  mounted.rerender(<EventSettingsAddons eventId={eventId} />);
  expect(
    screen.getByRole('button', { name: 'Enable Bring List' })
  ).toBeVisible();
  // A failed global save leaves the provider patch unchanged, so this staged
  // disable remains visible and never falls back to an immediate mutation.
  mounted.rerender(<EventSettingsAddons eventId={eventId} />);
  expect(
    screen.getByRole('button', { name: 'Enable Bring List' })
  ).toBeVisible();
  state.draft!.values.addons = [
    { addonType: 'bring-list', enabled: true, config },
  ];
  state.draft!.patch = {};
  state.draft!.epoch++;
  mounted.rerender(<EventSettingsAddons eventId={eventId} />);
  expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  expect(state.disable).not.toHaveBeenCalled();
  expect(state.update).not.toHaveBeenCalled();
});
