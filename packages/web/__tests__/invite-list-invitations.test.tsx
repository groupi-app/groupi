import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { anyApi, getFunctionName } from 'convex/server';
import { UnifiedInviteDialog } from '@/components/unified-invite-dialog';
import { useInviteDialogStore } from '@/stores/invite-dialog-store';
import type { Id } from '@/convex/_generated/dataModel';
import { ConvexError } from 'convex/values';
import { NavigationGuardProvider } from '@/app/(settings)/settings/components/navigation-guard-context';

// jsdom omits these browser methods used by the real Radix Select.
Object.defineProperties(HTMLElement.prototype, {
  scrollIntoView: { configurable: true, value: () => {} },
  hasPointerCapture: { configurable: true, value: () => false },
  releasePointerCapture: { configurable: true, value: () => {} },
});

const boundary = vi.hoisted(() => ({
  send: vi.fn(),
  single: vi.fn(),
  create: vi.fn(),
  role: 'ORGANIZER',
  lists: {} as Record<string, unknown>,
  pending: [] as unknown[],
  reviewFailure: false,
  skipped: {} as Record<string, string>,
}));
vi.mock('@/env.mjs', () => ({
  env: { NEXT_PUBLIC_BASE_URL: 'https://test.example' },
}));
vi.mock('@/convex/_generated/api', () => ({ api: anyApi }));
vi.mock('next/navigation', () => {
  const router = { push: vi.fn() };
  return { useRouter: () => router };
});
vi.mock('convex/react', () => ({
  useQuery: (
    query: Parameters<typeof getFunctionName>[0],
    args: { inviteListId?: string; personIds?: string[] } | 'skip'
  ) => {
    if (!query || args === 'skip') return undefined;
    const name = getFunctionName(query);
    if (name === 'inviteLists/queries:listInviteLists')
      return { items: Object.values(boundary.lists) };
    if (name === 'inviteLists/queries:getInviteList')
      return boundary.lists[args.inviteListId!];
    if (name === 'inviteLists/queries:getFriendChoices')
      return { items: [people[0]] };
    if (name === 'inviteLists/queries:searchPeople')
      return { items: [people[2]] };
    if (name === 'inviteLists/queries:getPeopleByIds')
      return {
        items: args.personIds!.map(personId => ({
          ...people.find(person => person.personId === personId),
          personId,
          available: boundary.skipped[personId] !== 'UNAVAILABLE',
        })),
      };
    if (name === 'inviteLists/queries:reviewInviteListRecipients') {
      if (boundary.reviewFailure) throw new Error('Review unavailable');
      const results = args.personIds!.map(personId => ({
        ...people.find(person => person.personId === personId),
        personId,
        available: boundary.skipped[personId] !== 'UNAVAILABLE',
        status: boundary.skipped[personId] ? 'skipped' : 'eligible',
        reason: boundary.skipped[personId],
      }));
      return {
        eventId: 'event',
        totalCount: results.length,
        eligibleCount: results.filter(person => person.status === 'eligible')
          .length,
        skippedCount: results.filter(person => person.status === 'skipped')
          .length,
        results,
      };
    }
    if (
      name === 'events/queries:getEventHeader' ||
      name === 'events/queries:getEventAttendeesData'
    )
      return {
        event: { memberships: [] },
        userMembership: { role: boundary.role },
      };
    if (name === 'friends/queries:getFriends') return [people[0]];
    if (name === 'eventInvites/queries:getSentEventInvites')
      return boundary.pending;
    if (name === 'eventInvites/queries:searchUserByExactUsernameForEventInvite')
      return null;
    if (name === 'eventInvites/queries:searchUsersForEventInvite')
      return [people[2]];
    if (name === 'invites/queries:getEventInvites')
      return { invites: [], pendingEmailCount: 0 };
  },
  useMutation: (mutation: Parameters<typeof getFunctionName>[0]) => {
    const name = mutation ? getFunctionName(mutation) : '';
    const run =
      name === 'inviteLists/mutations:sendInviteListRecipients'
        ? boundary.send
        : name === 'eventInvites/mutations:sendEventInvite'
          ? boundary.single
          : name === 'inviteLists/mutations:createInviteList'
            ? boundary.create
            : vi.fn();
    return Object.assign(run, { withOptimisticUpdate: () => run });
  },
}));

const people = [
  {
    personId: 'ada',
    name: 'Ada Friend',
    username: 'ada',
    image: null,
    available: true,
  },
  {
    personId: 'lee',
    name: 'Lee Friend',
    username: 'lee',
    image: null,
    available: true,
  },
  {
    personId: 'sam',
    name: 'Sam Other',
    username: 'sam',
    image: null,
    available: true,
  },
];

describe('From list invitation flow', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    boundary.send.mockReset();
    boundary.single.mockReset();
    boundary.create.mockReset();
    boundary.create.mockImplementation(
      async ({ name, personIds }: { name: string; personIds: string[] }) => ({
        inviteListId: 'new-list',
        name,
        personCount: personIds.length,
        availablePersonCount: personIds.length,
        needsAttention: false,
        people: people.filter(person => personIds.includes(person.personId)),
      })
    );
    boundary.role = 'ORGANIZER';
    boundary.pending = [];
    boundary.reviewFailure = false;
    boundary.skipped = {};
    boundary.lists = {
      first: {
        inviteListId: 'first',
        name: 'Weekend',
        personCount: 2,
        availablePersonCount: 2,
        needsAttention: false,
        people: [people[0], people[1]],
      },
      second: {
        inviteListId: 'second',
        name: 'Dinner',
        personCount: 2,
        availablePersonCount: 2,
        needsAttention: false,
        people: [people[1], people[2]],
      },
    };
    boundary.send.mockImplementation(
      async ({ personIds }: { personIds: string[] }) => ({
        eventId: 'event',
        totalCount: personIds.length,
        sentCount: personIds.length,
        skippedCount: 0,
        results: personIds.map(personId => ({
          personId,
          status: 'sent',
          inviteId: `invite-${personId}`,
        })),
      })
    );
    useInviteDialogStore.setState({
      open: false,
      eventId: null,
      defaultTab: 'link',
    });
  });

  async function chooseWeekend(user: ReturnType<typeof userEvent.setup>) {
    useInviteDialogStore.getState().openDialog('event' as Id<'events'>, 'list');
    const view = render(<UnifiedInviteDialog />, {
      wrapper: NavigationGuardProvider,
    });
    await user.click(screen.getByRole('button', { name: 'Choose Weekend' }));
    await user.click(screen.getByRole('button', { name: 'Add Weekend' }));
    return view;
  }

  it('saves inline without changing the reviewed recipients and restores the exact prior list view', async () => {
    const user = userEvent.setup();
    await chooseWeekend(user);
    await user.click(screen.getByRole('button', { name: 'Choose Dinner' }));
    const opener = screen.getByRole('button', { name: 'Create invite list' });
    await user.click(opener);
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByLabelText('List name')).toHaveFocus();
    await user.type(screen.getByLabelText('List name'), 'Private dinner');
    await user.type(
      screen.getByRole('textbox', { name: 'Search by username' }),
      'sam'
    );
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(screen.getByRole('button', { name: 'Add Sam Other' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(
      await screen.findByRole('button', { name: 'Add Dinner' })
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Create invite list' })
    ).toHaveFocus();
    const review = screen.getByRole('region', { name: 'Recipients' });
    expect(
      within(review).getAllByRole('button', { name: /^Remove / })
    ).toHaveLength(2);
    expect(
      within(review).queryByRole('button', { name: 'Remove Sam Other' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'List saved. No invitations were sent.'
    );
  });

  it('retains failed inline saves and Save and use copies the saved people without sending', async () => {
    const user = userEvent.setup();
    boundary.create.mockRejectedValueOnce(
      new ConvexError({ code: 'VALIDATION_ERROR' })
    );
    await chooseWeekend(user);
    await user.click(
      screen.getByRole('button', { name: 'Create invite list' })
    );
    await user.type(screen.getByLabelText('List name'), 'Dinner');
    await user.click(screen.getByRole('button', { name: 'Add Ada Friend' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Search by username' }),
      'sam'
    );
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(screen.getByRole('button', { name: 'Add Sam Other' }));
    await user.click(screen.getByRole('button', { name: 'Save and use' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your name and people are preserved'
    );
    expect(screen.getByLabelText('List name')).toHaveValue('Dinner');
    expect(
      screen.getByRole('button', { name: 'Remove Sam Other' })
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Save and use' }));
    expect(
      await screen.findByRole('region', { name: 'Recipients' })
    ).toBeVisible();
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(3);
    expect(screen.queryByText(/invitations sent/)).not.toBeInTheDocument();
  });

  it.each(['Back to invitations', 'Cancel'])(
    'returns a clean inline editor through %s without a discard prompt',
    async action => {
      const user = userEvent.setup();
      await chooseWeekend(user);
      await user.click(
        screen.getByRole('button', { name: 'Create invite list' })
      );
      await user.click(screen.getByRole('button', { name: action }));
      expect(
        screen.queryByRole('button', { name: 'Keep Editing' })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Create invite list' })
      ).toHaveFocus();
      expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(
        2
      );
    }
  );

  it.each([
    'Close',
    'Escape',
    'Outside',
    'Back to invitations',
    'Cancel',
    'Browser Back',
  ])(
    'protects a dirty inline draft on %s in the same flow, retaining the prior invite context',
    async action => {
      const user = userEvent.setup();
      window.history.replaceState({}, '', '/previous');
      await chooseWeekend(user);
      window.history.pushState({ __NA: true }, '', '/event/invite');
      await user.click(screen.getByRole('tab', { name: 'Username' }));
      await user.type(
        await screen.findByRole('textbox', { name: 'Search by username' }),
        'sam{Enter}'
      );
      await user.click(screen.getByRole('tab', { name: 'From list' }));
      await user.click(
        await screen.findByRole('button', { name: 'Create invite list' })
      );
      await user.type(screen.getByLabelText('List name'), 'Keep my draft');
      await user.click(screen.getByRole('button', { name: 'Add Ada Friend' }));
      const dismiss = async () => {
        if (action === 'Escape') await user.keyboard('{Escape}');
        else if (action === 'Outside')
          await user.click(
            document.querySelector('[data-slot="dialog-overlay"]')!
          );
        else if (action === 'Browser Back') act(() => window.history.back());
        else await user.click(screen.getByRole('button', { name: action }));
      };
      await dismiss();
      expect(
        await screen.findByRole('heading', {
          name: 'Discard this invite list?',
        })
      ).toHaveFocus();
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
      if (action === 'Browser Back')
        await waitFor(() =>
          expect(window.location.pathname).toBe('/event/invite')
        );
      await user.click(screen.getByRole('button', { name: 'Keep Editing' }));
      expect(screen.getByLabelText('List name')).toHaveValue('Keep my draft');
      expect(
        screen.getByRole('button', { name: 'Remove Ada Friend' })
      ).toBeVisible();
      await dismiss();
      await user.click(await screen.findByRole('button', { name: 'Discard' }));
      expect(
        screen.getByRole('button', { name: 'Create invite list' })
      ).toHaveFocus();
      expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(
        2
      );
      await user.click(screen.getByRole('tab', { name: 'Username' }));
      expect(
        await screen.findByRole('textbox', { name: 'Search by username' })
      ).toHaveValue('sam');
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /Sam Other/ })).toBeVisible()
      );
    }
  );

  it('prevents using Needs attention lists and anonymizes unavailable picker entries', async () => {
    const user = userEvent.setup();
    boundary.lists.second = {
      inviteListId: 'second',
      name: 'Needs repair',
      personCount: 1,
      availablePersonCount: 0,
      needsAttention: true,
      people: [{ ...people[2], available: false }],
    };
    boundary.lists.first = {
      inviteListId: 'first',
      name: 'Weekend',
      personCount: 2,
      availablePersonCount: 1,
      needsAttention: false,
      people: [people[0], { ...people[1], available: false }],
    };
    useInviteDialogStore.getState().openDialog('event' as Id<'events'>, 'list');
    render(<UnifiedInviteDialog />);
    expect(
      screen.getByRole('button', { name: 'Choose Needs repair' })
    ).toBeDisabled();
    expect(screen.getByText(/Needs attention/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Choose Weekend' }));
    expect(screen.getByText('Unavailable person')).toBeVisible();
    expect(screen.queryByText('Lee Friend')).not.toBeInTheDocument();
    expect(screen.queryByText('@lee')).not.toBeInTheDocument();
  });

  it('retains the original protected send through a lost response, revoked permission, and query failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    let original: unknown;
    boundary.send.mockImplementationOnce(async (args: unknown) => {
      original = structuredClone(args);
      throw new Error('Response lost');
    });
    boundary.send.mockImplementationOnce(async (args: unknown) => {
      expect(args).toEqual(original);
      throw new ConvexError({ code: 'FORBIDDEN' });
    });
    boundary.send.mockImplementationOnce(async (args: unknown) => {
      expect(args).toEqual(original);
      return {
        eventId: 'event',
        totalCount: 2,
        sentCount: 2,
        skippedCount: 0,
        results: [
          { personId: 'ada', status: 'sent', inviteId: 'a' },
          { personId: 'lee', status: 'sent', inviteId: 'l' },
        ],
      };
    });
    const view = await chooseWeekend(user);
    screen.getByLabelText('Invite as').focus();
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('option', { name: 'Moderator' }));
    await waitFor(() =>
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    );
    await user.type(
      screen.getByLabelText('Message (optional)'),
      'Original message'
    );
    await user.click(screen.getByRole('button', { name: 'Send invitations' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'outcome is uncertain'
    );
    expect(screen.getByLabelText('Message (optional)')).toBeDisabled();
    boundary.role = 'MODERATOR';
    view.rerender(<UnifiedInviteDialog />);
    expect(
      screen.getByRole('combobox', { name: 'Invite as' })
    ).toHaveTextContent('Moderator');
    expect(
      screen.getByRole('button', { name: 'Remove Ada Friend' })
    ).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Retry original send' })
    );
    expect(screen.getByLabelText('Message (optional)')).toBeDisabled();
    boundary.reviewFailure = true;
    view.rerender(<UnifiedInviteDialog />);
    await user.click(
      screen.getByRole('button', { name: 'Retry original send' })
    );
    expect(
      await screen.findByText('2 invitations sent. 0 skipped.')
    ).toBeVisible();
  });

  it('allows correction after a definitive fresh rejection and keeps the app message limit at 280', async () => {
    const user = userEvent.setup();
    boundary.send.mockRejectedValueOnce(
      new ConvexError({ code: 'VALIDATION_ERROR' })
    );
    await chooseWeekend(user);
    await user.type(
      screen.getByLabelText('Message (optional)'),
      'x'.repeat(281)
    );
    expect(screen.getByLabelText('Message (optional)')).toHaveValue(
      'x'.repeat(280)
    );
    expect(
      screen.getByRole('button', { name: 'Send invitations' })
    ).toBeEnabled();
    await user.clear(screen.getByLabelText('Message (optional)'));
    await user.click(screen.getByRole('button', { name: 'Send invitations' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No invitations were sent'
    );
    expect(screen.getByLabelText('Message (optional)')).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Remove Lee Friend' }));
    await user.click(screen.getByRole('button', { name: 'Send invitations' }));
    expect(
      await screen.findByText('1 invitation sent. 0 skipped.')
    ).toBeVisible();
  });

  it('retains an expired original attempt until acknowledgement, then starts a new review without sending', async () => {
    const user = userEvent.setup();
    const requests: {
      eventId: string;
      personIds: string[];
      role: string;
      message: string;
      requestId: string;
    }[] = [];
    boundary.send.mockImplementation(async args => {
      requests.push(structuredClone(args));
      if (requests.length === 1) throw new Error('Response lost');
      if (requests.length === 2)
        throw new ConvexError({ code: 'IDEMPOTENCY_EXPIRED' });
      expect(args.requestId).not.toBe(requests[0].requestId);
      expect(args.requestId).toMatch(/22222222-2222-4222-8222-222222222222$/);
      expect({ ...args, requestId: requests[0].requestId }).toEqual(
        requests[0]
      );
      return {
        eventId: 'event',
        totalCount: 2,
        sentCount: 1,
        skippedCount: 1,
        results: [
          { personId: 'ada', status: 'skipped', reason: 'INVITATION_PENDING' },
          { personId: 'lee', status: 'sent', inviteId: 'new-lee' },
        ],
      };
    });
    await chooseWeekend(user);
    const uuid = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('11111111-1111-4111-8111-111111111111')
      .mockReturnValueOnce('22222222-2222-4222-8222-222222222222');
    await user.type(
      screen.getByLabelText('Message (optional)'),
      'Preserve this message'
    );
    screen.getByLabelText('Invite as').focus();
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('option', { name: 'Moderator' }));
    await waitFor(() =>
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    );
    await user.click(screen.getByRole('button', { name: 'Send invitations' }));
    await user.click(
      await screen.findByRole('button', { name: 'Retry original send' })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'may already have been sent'
    );
    expect(
      screen.getByRole('heading', { name: 'Original request expired' })
    ).toHaveFocus();
    expect(screen.getByText(requests[0].requestId)).toBeVisible();
    expect(requests[1]).toEqual(requests[0]);
    expect(
      screen.queryByRole('button', { name: 'Retry original send' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Send invitations' })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Message (optional)')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Start a new review' })
    ).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeVisible();
    boundary.pending = [
      {
        inviteId: 'pending-ada',
        status: 'PENDING',
        role: 'MODERATOR',
        createdAt: 1,
        invitee: people[0],
      },
    ];
    await user.click(
      screen.getByRole('button', { name: 'Inspect pending invitations' })
    );
    expect(
      await screen.findByRole('heading', { name: /Pending Invites/ })
    ).toBeVisible();
    await user.click(
      screen.getByRole('checkbox', {
        name: /I understand the original send may have completed/,
      })
    );
    await user.click(
      screen.getByRole('button', { name: 'Start a new review' })
    );
    expect(screen.getByLabelText('Message (optional)')).toBeEnabled();
    expect(screen.getByLabelText('Message (optional)')).toHaveFocus();
    expect(screen.getByLabelText('Message (optional)')).toHaveValue(
      'Preserve this message'
    );
    expect(
      screen.getByRole('combobox', { name: 'Invite as' })
    ).toHaveTextContent('Moderator');
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(2);
    expect(requests).toHaveLength(2);
    expect(uuid).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Send invitations' }));
    expect(
      await screen.findByText('1 invitation sent. 1 skipped.')
    ).toBeVisible();
    uuid.mockRestore();
  });

  it('requires acknowledgement after an uncertain request passes its device-clock deadline despite forbidden retries', async () => {
    const user = userEvent.setup();
    const requests: {
      eventId: string;
      personIds: string[];
      role: string;
      message: string;
      requestId: string;
    }[] = [];
    boundary.send.mockImplementation(async args => {
      requests.push(structuredClone(args));
      if (requests.length === 1) throw new Error('Response lost');
      if (requests.length < 4) throw new ConvexError({ code: 'FORBIDDEN' });
      return {
        eventId: 'event',
        totalCount: 2,
        sentCount: 2,
        skippedCount: 0,
        results: [
          { personId: 'ada', status: 'sent', inviteId: 'a' },
          { personId: 'lee', status: 'sent', inviteId: 'l' },
        ],
      };
    });
    await chooseWeekend(user);
    const startedAt = 1791000000000;
    const clock = vi.spyOn(Date, 'now').mockReturnValue(startedAt);
    const uuid = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('11111111-1111-4111-8111-111111111111')
      .mockReturnValueOnce('22222222-2222-4222-8222-222222222222');
    try {
      await user.type(
        screen.getByLabelText('Message (optional)'),
        'Keep this original message'
      );
      await user.click(
        screen.getByRole('button', { name: 'Send invitations' })
      );
      clock.mockReturnValue(startedAt + 24 * 60 * 60 * 1000 - 1);
      await user.click(
        await screen.findByRole('button', { name: 'Retry original send' })
      );
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'outcome is uncertain'
      );
      expect(screen.getByLabelText('Message (optional)')).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Retry original send' })
      ).toBeEnabled();
      expect(
        screen.queryByRole('button', { name: 'Start a new review' })
      ).not.toBeInTheDocument();

      clock.mockReturnValue(startedAt + 24 * 60 * 60 * 1000 + 1);
      await user.click(
        screen.getByRole('button', { name: 'Retry original send' })
      );
      expect(await screen.findByRole('alert')).toHaveTextContent(
        "Based on this device's clock, request protection may have expired"
      );
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Some invitations may already have been sent'
      );
      expect(
        screen.queryByText(/No invitations were sent/)
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: 'Request protection may have expired',
        })
      ).toHaveFocus();
      expect(requests[1]).toEqual(requests[0]);
      expect(requests[2]).toEqual(requests[0]);
      expect(screen.getByText(requests[0].requestId)).toBeVisible();
      expect(
        screen.queryByRole('button', { name: 'Retry original send' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Send invitations' })
      ).not.toBeInTheDocument();
      expect(screen.getByLabelText('Message (optional)')).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Start a new review' })
      ).toBeDisabled();
      await user.keyboard('{Escape}');
      expect(screen.getByRole('dialog')).toBeVisible();
      await user.click(
        screen.getByRole('checkbox', {
          name: /I understand the original send may have completed/,
        })
      );
      await user.click(
        screen.getByRole('button', { name: 'Start a new review' })
      );
      expect(screen.getByLabelText('Message (optional)')).toBeEnabled();
      expect(screen.getByLabelText('Message (optional)')).toHaveFocus();
      expect(screen.getByLabelText('Message (optional)')).toHaveValue(
        'Keep this original message'
      );
      expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(
        2
      );
      expect(requests).toHaveLength(3);
      expect(uuid).toHaveBeenCalledTimes(1);
      await user.click(
        screen.getByRole('button', { name: 'Send invitations' })
      );
      expect(
        await screen.findByText('2 invitations sent. 0 skipped.')
      ).toBeVisible();
      expect(requests[3].requestId).not.toBe(requests[0].requestId);
      expect({ ...requests[3], requestId: requests[0].requestId }).toEqual(
        requests[0]
      );
      expect(uuid).toHaveBeenCalledTimes(2);
    } finally {
      clock.mockRestore();
      uuid.mockRestore();
    }
  });

  it('preserves the common invitation role and message when adding a manual person to a list draft', async () => {
    const user = userEvent.setup();
    await chooseWeekend(user);
    await user.type(
      screen.getByLabelText('Message (optional)'),
      'Common message'
    );
    screen.getByLabelText('Invite as').focus();
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('option', { name: 'Moderator' }));
    await waitFor(() =>
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    );
    await user.click(screen.getByRole('tab', { name: 'Username' }));
    await user.type(
      await screen.findByRole('textbox', { name: 'Search by username' }),
      'sam{Enter}'
    );
    await user.click(await screen.findByRole('button', { name: /Sam Other/ }));
    expect(screen.getByLabelText('Message (optional)')).toHaveValue(
      'Common message'
    );
    expect(
      screen.getByRole('combobox', { name: 'Invite as' })
    ).toHaveTextContent('Moderator');
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(3);
  });

  it('shows privacy-safe review reasons and an honest zero-sent result', async () => {
    const user = userEvent.setup();
    boundary.skipped = { ada: 'ALREADY_MEMBER', lee: 'UNAVAILABLE' };
    boundary.send.mockResolvedValueOnce({
      eventId: 'event',
      totalCount: 2,
      sentCount: 0,
      skippedCount: 2,
      results: [
        { personId: 'ada', status: 'skipped', reason: 'ALREADY_MEMBER' },
        { personId: 'lee', status: 'skipped', reason: 'UNAVAILABLE' },
      ],
    });
    await chooseWeekend(user);
    const review = screen.getByRole('region', { name: 'Recipients' });
    expect(within(review).getByText('Already a member')).toBeVisible();
    expect(within(review).getByText('Recipient unavailable')).toBeVisible();
    expect(within(review).queryByText('Lee Friend')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send invitations' }));
    expect(
      await screen.findByText('No invitations were sent. 2 skipped.')
    ).toBeVisible();
    expect(screen.queryByText(/blocked|preferences/i)).not.toBeInTheDocument();
  });

  it('preserves a copied draft across list changes and lets manual search add another person', async () => {
    const user = userEvent.setup();
    const view = await chooseWeekend(user);
    boundary.lists.first = {
      inviteListId: 'first',
      name: 'Changed list',
      personCount: 1,
      availablePersonCount: 1,
      needsAttention: false,
      people: [people[2]],
    };
    view.rerender(<UnifiedInviteDialog />);
    await user.click(screen.getByRole('tab', { name: 'Username' }));
    await user.type(
      await screen.findByPlaceholderText(/username/i),
      'sam{Enter}'
    );
    await user.click(await screen.findByRole('button', { name: /Sam Other/ }));
    const review = screen.getByRole('region', { name: 'Recipients' });
    await waitFor(() =>
      expect(
        within(review).getByRole('button', { name: 'Remove Ada Friend' })
      ).toBeVisible()
    );
    expect(
      within(review).getByRole('button', { name: 'Remove Lee Friend' })
    ).toBeVisible();
    expect(
      within(review).getByRole('button', { name: 'Remove Sam Other' })
    ).toBeVisible();
  });

  it('rejects a merged draft larger than 100 without truncating the existing selection', async () => {
    const user = userEvent.setup();
    const hundred = Array.from({ length: 100 }, (_, index) => ({
      personId: `p${index}`,
      name: `Person ${index}`,
      username: `person${index}`,
      image: null,
      available: true,
    }));
    boundary.lists.first = {
      inviteListId: 'first',
      name: 'Weekend',
      personCount: 100,
      availablePersonCount: 100,
      needsAttention: false,
      people: hundred,
    };
    await chooseWeekend(user);
    await user.click(screen.getByRole('button', { name: 'Choose Dinner' }));
    await user.click(screen.getByRole('button', { name: 'Add Dinner' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose at most 100 recipients.'
    );
    expect(
      within(screen.getByRole('region', { name: 'Recipients' })).getAllByRole(
        'button',
        { name: /^Remove / }
      )
    ).toHaveLength(100);
    expect(
      screen.queryByRole('button', { name: 'Remove Sam Other' })
    ).not.toBeInTheDocument();
  });

  it('offers Moderator only to an organizer and falls back to Attendee after demotion', async () => {
    const user = userEvent.setup();
    boundary.send.mockImplementationOnce(async (args: { role: string }) => {
      expect(args.role).toBe('ATTENDEE');
      return {
        eventId: 'event',
        totalCount: 2,
        sentCount: 2,
        skippedCount: 0,
        results: [],
      };
    });
    const view = await chooseWeekend(user);
    screen.getByLabelText('Invite as').focus();
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('option', { name: 'Moderator' }));
    boundary.role = 'MODERATOR';
    view.rerender(<UnifiedInviteDialog />);
    screen.getByLabelText('Invite as').focus();
    await user.keyboard('{Enter}');
    expect(
      screen.queryByRole('option', { name: 'Moderator' })
    ).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(
      await screen.findByRole('button', { name: 'Send invitations' })
    );
    expect(
      await screen.findByText('2 invitations sent. 0 skipped.')
    ).toBeVisible();
  });

  it('copies multiple lists and a manual person into an editable, deduplicated review before explicit Send', async () => {
    const user = userEvent.setup();
    useInviteDialogStore
      .getState()
      .openDialog('event' as Id<'events'>, 'username');
    render(<UnifiedInviteDialog />);
    await user.click(screen.getByRole('button', { name: /Ada Friend/ }));
    await user.click(screen.getByRole('tab', { name: 'From list' }));
    await user.click(
      await screen.findByRole('button', { name: 'Choose Weekend' })
    );
    await user.click(screen.getByRole('button', { name: 'Add Weekend' }));
    await user.click(screen.getByRole('button', { name: 'Choose Dinner' }));
    await user.click(screen.getByRole('button', { name: 'Add Dinner' }));
    const review = screen.getByRole('region', { name: 'Recipients' });
    expect(
      within(review).getAllByRole('button', { name: /^Remove / })
    ).toHaveLength(3);
    expect(screen.queryByText(/invitations sent/)).not.toBeInTheDocument();
    await user.click(
      within(review).getByRole('button', { name: 'Remove Lee Friend' })
    );
    await user.click(screen.getByRole('button', { name: 'Send invitations' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      '2 invitations sent. 0 skipped.'
    );
  });

  it('preserves the existing individual invitation endpoint and clears its selection after Send', async () => {
    const user = userEvent.setup();
    boundary.single.mockImplementationOnce(async (args: unknown) => {
      expect(args).toEqual({
        eventId: 'event',
        inviteePersonId: 'ada',
        role: 'ATTENDEE',
        message: 'Hello Ada',
      });
      return { inviteId: 'single-invite' };
    });
    useInviteDialogStore
      .getState()
      .openDialog('event' as Id<'events'>, 'username');
    render(<UnifiedInviteDialog />);
    await user.click(screen.getByRole('button', { name: /Ada Friend/ }));
    await user.type(
      screen.getByLabelText('Personal message (optional)'),
      'Hello Ada'
    );
    await user.click(screen.getByRole('button', { name: 'Send Invite' }));
    expect(await screen.findByLabelText('Search by username')).toBeVisible();
    expect(
      screen.queryByRole('region', { name: 'Recipients' })
    ).not.toBeInTheDocument();
  });

  it('does not show an earlier successful result as completion of a later uncertain send', async () => {
    const user = userEvent.setup();
    await chooseWeekend(user);
    await user.click(screen.getByRole('button', { name: 'Send invitations' }));
    expect(
      await screen.findByText('2 invitations sent. 0 skipped.')
    ).toBeVisible();
    boundary.send.mockRejectedValueOnce(new Error('Response lost'));
    await user.click(screen.getByRole('button', { name: 'Send invitations' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'outcome is uncertain'
    );
    expect(
      screen.queryByText('2 invitations sent. 0 skipped.')
    ).not.toBeInTheDocument();
  });

  it('keeps an in-flight send mounted until its response and permits closing after recovery', async () => {
    const user = userEvent.setup();
    let finish: (value: unknown) => void = () => {};
    boundary.send.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        })
    );
    await chooseWeekend(user);
    await user.click(screen.getByRole('button', { name: 'Send invitations' }));
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByRole('dialog')).toBeVisible();
    finish({
      eventId: 'event',
      totalCount: 2,
      sentCount: 2,
      skippedCount: 0,
      results: [],
    });
    expect(
      await screen.findByText('2 invitations sent. 0 skipped.')
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
