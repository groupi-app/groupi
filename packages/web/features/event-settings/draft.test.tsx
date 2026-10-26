import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventSettingsDraftProvider, useEventSettingsDraft } from './draft';
import { EventDetailsFields } from './details';
import { EventDateFields } from './dates';
import { EventAdmissionSettings } from '@/components/organisms/event-admission-settings';
import { EventAudienceSettings } from '@/components/organisms/event-audience-settings';
import type { Id } from '@/convex/_generated/dataModel';
const fixture = vi.hoisted(() => ({
  pathname: '/event/event/settings/details',
  snapshot: null as unknown,
  save: vi.fn(),
  upload: vi.fn(),
  push: vi.fn(),
  actor: 0,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => fixture.pathname,
  useRouter: () => ({ push: fixture.push }),
}));
vi.mock('@/hooks/convex/use-event-settings', () => ({
  useEventSettings: () => fixture.snapshot,
  useSaveEventSettings: () => fixture.save,
  useEventSettingsAudienceOptions: () => ({
    page: [
      {
        groupId: 'group',
        name: 'Friends of the community with a very long name',
      },
    ],
    isDone: true,
    continueCursor: '',
  }),
}));
vi.mock('@/hooks/convex/use-file-upload', () => ({
  useFileUpload: () => ({ uploadFile: fixture.upload }),
}));
vi.mock('@/components/event-image-upload', () => ({
  EventImageUpload: () => null,
}));
const initial = () => ({
  revision: 'r1',
  role: 'ORGANIZER',
  details: {
    title: 'Dinner',
    description: 'A meal',
    location: 'Home',
    visibility: 'PRIVATE',
    imageUrl: null,
  },
  permissions: {
    createPosts: 'EVERYONE',
    inviteMembers: 'MODERATOR',
    viewAttendeeList: 'EVERYONE',
  },
  admissionPolicy: 'INVITATION_ONLY',
  applications: { questions: [], reviewerPolicy: 'ORGANIZERS_AND_MODERATORS' },
  audiences: { friendsShared: false, canManageEvent: true, groups: [] },
  date: { options: [] },
  addons: [],
});
const eventId = 'event' as Id<'events'>;
function Inspector() {
  const { values, setSection } = useEventSettingsDraft();
  return (
    <>
      <output aria-label='Admission value'>{values.admissionPolicy}</output>
      <button
        onClick={() =>
          setSection('permissions', {
            ...values.permissions,
            createPosts: 'MODERATOR',
          })
        }
      >
        Change permissions
      </button>
      <button
        onClick={() =>
          setSection('addons', [
            {
              addonType: 'reminders',
              enabled: false,
              config: { reminderOffset: '1_DAY' },
              confirmedDestructive: true,
            },
          ])
        }
      >
        Disable reminders
      </button>
      <a href='/events'>All events</a>
    </>
  );
}
function Content({ view = 'details' }: { view?: string }) {
  return (
    <EventSettingsDraftProvider
      actorId={`actor-${fixture.actor}`}
      eventId={eventId}
      enabled
    >
      <Inspector />
      {view === 'details' ? (
        <>
          <EventDetailsFields />
          <EventAdmissionSettings eventId={eventId} role='ORGANIZER' />
          <EventAudienceSettings eventId={eventId} visibility='PRIVATE' />
        </>
      ) : view === 'date' ? (
        <EventDateFields mode='SINGLE' />
      ) : view === 'poll' ? (
        <EventDateFields mode='POLL' />
      ) : (
        <p>Other route</p>
      )}
    </EventSettingsDraftProvider>
  );
}
afterEach(cleanup);
beforeEach(() => {
  fixture.actor++;
  fixture.pathname = '/event/event/settings/details';
  fixture.snapshot = initial();
  vi.clearAllMocks();
  fixture.save.mockImplementation(async () => ({
    ...initial(),
    revision: 'r2',
    details: { ...initial().details, title: 'New dinner' },
  }));
});
describe('one Event settings draft', () => {
  it('keeps an explicit Shared with override after Visibility changes Friends discovery', async () => {
    render(<Content />);
    fireEvent.change(screen.getByLabelText('Visibility'), {
      target: { value: 'FRIENDS' },
    });
    expect(
      screen.getByRole('button', { name: 'Remove Friends audience' })
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Friends audience' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(fixture.save).toHaveBeenCalled());
    expect(fixture.save.mock.calls[0][0].patch).toMatchObject({
      details: { visibility: 'FRIENDS' },
      audiences: { friendsShared: false, groupIds: [] },
    });
  });
  it('keeps the reverse Friends override and reverts visibility and audience together', () => {
    fixture.snapshot = {
      ...initial(),
      details: { ...initial().details, visibility: 'FRIENDS' },
      audiences: { friendsShared: true, canManageEvent: true, groups: [] },
    };
    render(<Content />);
    fireEvent.change(screen.getByLabelText('Visibility'), {
      target: { value: 'PRIVATE' },
    });
    expect(
      screen.queryByRole('button', { name: 'Remove Friends audience' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Shared with' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Friends' }));
    fireEvent.keyDown(screen.getByRole('checkbox', { name: 'Friends' }), {
      key: 'Escape',
    });
    expect(
      screen.getByRole('button', { name: 'Remove Friends audience' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Revert' }));
    expect(screen.getByLabelText('Visibility')).toHaveValue('FRIENDS');
    expect(
      screen.getByRole('button', { name: 'Remove Friends audience' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Save changes' })
    ).not.toBeInTheDocument();
  });
  it('clears dirty state when visibility and independent audiences both return to the baseline', () => {
    render(<Content />);
    fireEvent.change(screen.getByLabelText('Visibility'), {
      target: { value: 'FRIENDS' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Friends audience' })
    );
    fireEvent.change(screen.getByLabelText('Visibility'), {
      target: { value: 'PRIVATE' },
    });
    expect(
      screen.queryByRole('button', { name: 'Remove Friends audience' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Save changes' })
    ).not.toBeInTheDocument();
    expect(fixture.save).not.toHaveBeenCalled();
  });

  it('preserves persisted poll timestamps and votes when only a note changes', async () => {
    const start = new Date('2030-01-01T12:00:15.123').getTime();
    fixture.snapshot = {
      ...initial(),
      date: {
        options: [
          { id: 'date1', start, note: 'Old note' },
          { id: 'date2', start: start + 86400000 },
        ],
      },
    };
    fixture.pathname = '/event/event/settings/date/multi';
    render(<Content view='poll' />);
    fireEvent.change(screen.getAllByLabelText('Note (optional)')[0], {
      target: { value: 'New note' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(fixture.save).toHaveBeenCalled());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fixture.save.mock.calls[0][0].patch.date.options[0]).toEqual({
      id: 'date1',
      start,
      end: undefined,
      note: 'New note',
    });
    expect(fixture.save.mock.calls[0][0].patch.date.confirmedReset).toBe(false);
  });

  it('retains confirmed destructive addon drafts after failure until global Revert', async () => {
    fixture.snapshot = {
      ...initial(),
      addons: [
        {
          addonType: 'reminders',
          enabled: true,
          config: { reminderOffset: '1_DAY' },
        },
      ],
    };
    fixture.save.mockRejectedValue(new Error('Still offline'));
    render(<Content />);
    fireEvent.click(screen.getByRole('button', { name: 'Disable reminders' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByRole('alert');
    expect(fixture.save.mock.calls[0][0].patch.addons).toEqual([
      {
        addonType: 'reminders',
        enabled: false,
        config: { reminderOffset: '1_DAY' },
        confirmedDestructive: true,
      },
    ]);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Revert' }));
    expect(
      screen.queryByRole('button', { name: 'Save changes' })
    ).not.toBeInTheDocument();
  });

  it('recovers an actor-scoped draft after browser navigation unmounts the Event layout', () => {
    const mounted = render(<Content />);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Back and forward' },
    });
    mounted.unmount();
    const again = render(<Content />);
    expect(screen.getByLabelText('Title')).toHaveValue('Back and forward');
    again.unmount();
    fixture.actor++;
    render(<Content />);
    expect(screen.getByLabelText('Title')).toHaveValue('Dinner');
  });

  it('stages details, admission, applications and permissions into one save', async () => {
    render(<Content />);
    expect(
      screen.queryByRole('button', { name: 'Save changes' })
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'New dinner' },
    });
    fireEvent.change(screen.getByLabelText('Admission'), {
      target: { value: 'APPLY' },
    });
    const disclosure = screen.getByText('Application questions', {
      selector: 'summary',
    });
    expect(disclosure.parentElement).not.toHaveAttribute('open');
    fireEvent.click(disclosure);
    fireEvent.click(screen.getByRole('button', { name: 'Add question' }));
    fireEvent.change(screen.getByLabelText('Question text'), {
      target: { value: 'Any allergies?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Change permissions' }));
    expect(fixture.save).not.toHaveBeenCalled();
    expect(
      screen.getAllByRole('button', { name: 'Save changes' })
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(fixture.save).toHaveBeenCalledTimes(1));
    expect(fixture.save.mock.calls[0][0]).toMatchObject({
      eventId: 'event',
      expectedRevision: 'r1',
      patch: {
        details: { title: 'New dinner' },
        admissionPolicy: 'APPLY',
        applications: { questions: [{ label: 'Any allergies?' }] },
        permissions: { createPosts: 'MODERATOR' },
      },
    });
    expect(fixture.save.mock.calls[0][0].patch.details).not.toHaveProperty(
      'imageUrl'
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Save changes' })
      ).not.toBeInTheDocument()
    );
  });
  it('keeps drafts across settings routes and back to the Event, then reverts all', () => {
    const { rerender } = render(<Content />);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Draft title' },
    });
    fixture.pathname = '/event/event/settings/permissions';
    rerender(<Content view='other' />);
    fireEvent.click(screen.getByRole('button', { name: 'Change permissions' }));
    fixture.pathname = '/event/event';
    rerender(<Content view='other' />);
    expect(
      screen.queryByRole('button', { name: 'Save changes' })
    ).not.toBeInTheDocument();
    fixture.pathname = '/event/event/settings/details';
    rerender(<Content />);
    expect(screen.getByLabelText('Title')).toHaveValue('Draft title');
    fireEvent.click(screen.getByRole('button', { name: 'Revert' }));
    expect(screen.getByLabelText('Title')).toHaveValue('Dinner');
    expect(fixture.save).not.toHaveBeenCalled();
  });
  it('does not reset a dirty draft after a stale subscription or failed save', async () => {
    fixture.save.mockRejectedValue(
      new Error(
        'Event settings changed. Review the current settings before saving your draft.'
      )
    );
    const { rerender } = render(<Content />);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'My draft' },
    });
    fixture.snapshot = {
      ...initial(),
      revision: 'r9',
      details: { ...initial().details, title: 'Someone else' },
    };
    rerender(<Content />);
    expect(screen.getByLabelText('Title')).toHaveValue('My draft');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByRole('alert');
    expect(fixture.save.mock.calls[0][0].expectedRevision).toBe('r1');
    expect(screen.getByLabelText('Title')).toHaveValue('My draft');
    fireEvent.click(screen.getByRole('button', { name: 'Revert' }));
    expect(screen.getByLabelText('Title')).toHaveValue('Someone else');
  });
  it('locks all changes until acknowledgement and prevents repeated saves', async () => {
    let resolve!: (value: unknown) => void;
    fixture.save.mockReturnValue(
      new Promise(done => {
        resolve = done;
      })
    );
    render(<Content />);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Waiting' },
    });
    const save = screen.getByRole('button', { name: 'Save changes' });
    fireEvent.click(save);
    fireEvent.click(save);
    expect(screen.getByLabelText('Title')).toBeDisabled();
    expect(fixture.save).toHaveBeenCalledTimes(1);
    await act(async () =>
      resolve({
        ...initial(),
        revision: 'r2',
        details: { ...initial().details, title: 'Waiting' },
      })
    );
    expect(screen.getByLabelText('Title')).toHaveValue('Waiting');
  });
  it('has one Friends-first searchable audience selector and stages independent audiences', async () => {
    render(<Content />);
    fireEvent.click(screen.getByRole('button', { name: 'Shared with' }));
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toHaveAccessibleName('Friends');
    fireEvent.click(checkboxes[0]);
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Search audiences' }),
      { target: { value: 'community' } }
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /Friends of the community/ })
    );
    expect(
      screen.queryByRole('checkbox', { name: 'No sharing authority' })
    ).not.toBeInTheDocument();
    fireEvent.keyDown(
      screen.getByRole('textbox', { name: 'Search audiences' }),
      { key: 'Escape' }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(fixture.save).toHaveBeenCalled());
    expect(fixture.save.mock.calls[0][0].patch.audiences).toEqual({
      friendsShared: true,
      groupIds: ['group'],
    });
  });
  it('does not leave a dirty marker when reverting an audience selection', () => {
    render(<Content />);
    fireEvent.click(screen.getByRole('button', { name: 'Shared with' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Friends' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Friends' }));
    expect(
      screen.queryByRole('button', { name: 'Save changes' })
    ).not.toBeInTheDocument();
  });
  it('keeps incomplete raw date input over navigation and blocks the entire save', () => {
    fixture.pathname = '/event/event/settings/date/single';
    const { rerender } = render(<Content view='date' />);
    fireEvent.change(screen.getByLabelText('End (optional)'), {
      target: { value: '2030-01-01T12:00' },
    });
    fixture.pathname = '/event/event/settings/details';
    rerender(<Content />);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Keep this too' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Choose valid dates');
    expect(fixture.save).not.toHaveBeenCalled();
    fixture.pathname = '/event/event/settings/date/single';
    rerender(<Content view='date' />);
    expect(screen.getByLabelText('End (optional)')).toHaveValue(
      '2030-01-01T12:00'
    );
  });
  it('requires separate confirmation to replace existing dates before the atomic save', async () => {
    fixture.snapshot = {
      ...initial(),
      date: {
        chosenDateTime: new Date('2030-01-01T12:00').getTime(),
        options: [],
      },
    };
    fixture.pathname = '/event/event/settings/date/single';
    render(<Content view='date' />);
    fireEvent.change(screen.getByLabelText('Start'), {
      target: { value: '2030-01-02T12:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(
      screen.getByRole('dialog', { name: 'Replace event dates?' })
    ).toBeInTheDocument();
    expect(fixture.save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(fixture.save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm and save' }));
    await waitFor(() => expect(fixture.save).toHaveBeenCalled());
    expect(fixture.save.mock.calls[0][0].patch.date).toMatchObject({
      mode: 'SINGLE',
      confirmedReset: true,
    });
  });
  it('guards external navigation while retaining the local draft on cancel', () => {
    render(<Content />);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Stay here' },
    });
    fireEvent.click(screen.getByRole('link', { name: 'All events' }));
    expect(
      screen.getByRole('dialog', { name: 'Unsaved event settings' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(fixture.push).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Title')).toHaveValue('Stay here');
  });
  it('keeps moderator admission and date authority unchanged', () => {
    fixture.snapshot = {
      ...initial(),
      role: 'MODERATOR',
      audiences: { friendsShared: null, canManageEvent: false, groups: [] },
    };
    fixture.pathname = '/event/event/settings/date/single';
    render(<Content view='date' />);
    expect(screen.queryByLabelText('Start')).not.toBeInTheDocument();
    expect(
      screen.getByText('Only the organizer can change event dates.')
    ).toBeInTheDocument();
  });
});
