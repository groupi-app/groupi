import { Children, isValidElement, type ReactNode } from 'react';
import { router } from 'expo-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventCard } from '../event-card';

const mocks = vi.hoisted(() => ({
  showActionSheet: vi.fn(),
  showConfirmDialog: vi.fn(),
  toggleMute: vi.fn(),
  deleteEvent: vi.fn(),
  leaveEvent: vi.fn(),
}));

vi.mock('../../ui/action-sheet', () => ({
  showActionSheet: mocks.showActionSheet,
}));

vi.mock('../../ui/confirm-dialog', () => ({
  showConfirmDialog: mocks.showConfirmDialog,
}));

vi.mock('../../../hooks/use-events', () => ({
  useDeleteEvent: () => mocks.deleteEvent,
  useLeaveEvent: () => mocks.leaveEvent,
}));

vi.mock('../../../hooks/use-muting', () => ({
  useToggleEventMute: () => mocks.toggleMute,
}));

const event = {
  _id: 'event-123',
  title: 'Launch Party',
  location: 'Community Hall',
  chosenDateTime: '2025-06-15T14:00:00Z',
  memberCount: 12,
};

function createEventCardTree({
  role = 'ATTENDEE',
  rsvpStatus = 'YES',
  isMuted = false,
}: {
  role?: string;
  rsvpStatus?: string;
  isMuted?: boolean;
} = {}) {
  return EventCard({
    event,
    membership: { role, rsvpStatus },
    organizer: { user: { name: 'Avery' } },
    isMuted,
  });
}

function collectText(node: ReactNode): string[] {
  if (typeof node === 'string' || typeof node === 'number') {
    return [String(node)];
  }
  if (!isValidElement<{ children?: ReactNode }>(node)) {
    return Children.toArray(node).flatMap(collectText);
  }
  return collectText(node.props.children);
}

describe('EventCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders event details and organizer state', () => {
    const card = createEventCardTree({ role: 'ORGANIZER' });
    const text = collectText(card);

    expect(text).toEqual(
      expect.arrayContaining([
        'Launch Party',
        'by ',
        'Avery',
        'Community Hall',
        '12',
        'Organizer',
      ])
    );
  });

  it('navigates to the selected event', () => {
    const card = createEventCardTree();

    card.props.onPress();

    expect(router.push).toHaveBeenCalledWith('/event/event-123');
  });

  it('offers attendee mute and leave actions', () => {
    const card = createEventCardTree({ isMuted: true });

    card.props.onLongPress();

    expect(mocks.showActionSheet).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Launch Party',
        options: [
          expect.objectContaining({ label: 'Unmute Event' }),
          expect.objectContaining({ label: 'Leave Event', destructive: true }),
        ],
      })
    );

    const { options } = mocks.showActionSheet.mock.calls[0][0];
    options[0].onPress();
    options[1].onPress();

    expect(mocks.toggleMute).toHaveBeenCalledWith('event-123');
    expect(mocks.showConfirmDialog).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Leave Event', destructive: true })
    );

    const leaveConfirmation = mocks.showConfirmDialog.mock.calls[0][0];
    leaveConfirmation.onConfirm();
    expect(mocks.leaveEvent).toHaveBeenCalledWith('event-123');
  });

  it('offers organizer edit and delete actions', () => {
    const card = createEventCardTree({ role: 'ORGANIZER' });

    card.props.onLongPress();

    const { options } = mocks.showActionSheet.mock.calls[0][0];
    expect(options.map((option: { label: string }) => option.label)).toEqual([
      'Mute Event',
      'Edit Event',
      'Delete Event',
    ]);

    options[1].onPress();
    options[2].onPress();

    expect(router.push).toHaveBeenCalledWith('/event/event-123/edit');
    expect(mocks.showConfirmDialog).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Delete Event', destructive: true })
    );

    const deleteConfirmation = mocks.showConfirmDialog.mock.calls[0][0];
    deleteConfirmation.onConfirm();
    expect(mocks.deleteEvent).toHaveBeenCalledWith('event-123');
  });
});
