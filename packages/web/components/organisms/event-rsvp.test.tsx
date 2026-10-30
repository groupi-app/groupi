import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventRSVP } from '@/app/(event)/event/[eventId]/components/event-rsvp';
import type { Id } from '@/convex/_generated/dataModel';

const fixture = vi.hoisted(() => ({
  update: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  role: 'ATTENDEE',
  status: 'PENDING',
}));
vi.mock('@/app/(event)/event/[eventId]/context', () => ({
  useEventData: () => ({
    headerData: {
      event: { title: 'Isolated RSVP fixture', chosenDateTime: 1792929600000 },
      userMembership: {
        role: fixture.role,
        rsvpStatus: fixture.status,
        rsvpNote: '',
      },
    },
  }),
}));
vi.mock('@/hooks/convex/use-events', () => ({
  useUpdateRSVP: () => fixture.update,
}));
vi.mock('sonner', () => ({
  toast: { success: fixture.success, error: fixture.error },
}));
beforeEach(() => {
  vi.clearAllMocks();
  fixture.update.mockResolvedValue(undefined);
  fixture.role = 'ATTENDEE';
  fixture.status = 'PENDING';
});
afterEach(cleanup);

describe('mounted event RSVP form', () => {
  it('selects Maybe without submitting and saves the selected response exactly once', async () => {
    await act(async () => {
      render(<EventRSVP eventId={'fixture-event' as Id<'events'>} />);
    });
    fireEvent.click(screen.getByRole('button', { name: 'RSVP Pending!' }));
    const dialog = screen.getByRole('dialog', { name: 'RSVP' });
    const choices = within(dialog).getByRole('group', { name: 'Your RSVP' });
    fireEvent.click(within(choices).getByRole('button', { name: 'Maybe' }));
    expect(
      within(choices).getByRole('button', { name: 'Maybe' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(choices).getByRole('button', { name: 'Yes' })
    ).toHaveAttribute('aria-pressed', 'false');
    expect(fixture.update).not.toHaveBeenCalled();
    fireEvent.change(
      within(dialog).getByPlaceholderText('Add a note (optional)'),
      { target: { value: 'Depends on timing' } }
    );
    const save = within(dialog).getByRole('button', { name: 'Save' });
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);
    await waitFor(() =>
      expect(fixture.update).toHaveBeenCalledExactlyOnceWith({
        eventId: 'fixture-event',
        rsvpStatus: 'MAYBE',
        rsvpNote: 'Depends on timing',
      })
    );
    expect(fixture.success).toHaveBeenCalledTimes(1);
    expect(fixture.error).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not submit an unchanged Pending response and keeps choices available on reopening', async () => {
    await act(async () => {
      render(<EventRSVP eventId={'fixture-event' as Id<'events'>} />);
    });
    fireEvent.click(screen.getByRole('button', { name: 'RSVP Pending!' }));
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(fixture.update).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'RSVP Pending!' }));
    expect(screen.getByRole('button', { name: 'Maybe' })).toBeInTheDocument();
  });

  it('does not show attendee RSVP controls for the organizer', async () => {
    fixture.role = 'ORGANIZER';
    await act(async () => {
      render(<EventRSVP eventId={'fixture-event' as Id<'events'>} />);
    });
    expect(
      screen.queryByRole('button', { name: /RSVP/ })
    ).not.toBeInTheDocument();
  });
});
