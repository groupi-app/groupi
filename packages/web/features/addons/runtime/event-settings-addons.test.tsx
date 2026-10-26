import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { EventSettingsAddons } from './organisms/event-settings-addons';
vi.unmock('@/convex/_generated/api');
vi.mock('@/context/global-user-context', () => ({
  useGlobalUser: () => ({ person: { _id: 'person-a' } }),
}));
vi.mock('@/hooks/convex/use-accounts', () => ({
  useHasLinkedProviders: vi.fn(),
}));
const state = vi.hoisted(() => ({
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
        .filter(definition => definition.id === 'bring-list'),
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
