import type { ComponentProps } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PostCard } from './post-card';

vi.mock('@/hooks/use-mobile', () => ({ useMobile: () => false }));
vi.mock('@/hooks/convex/use-muting', () => ({
  useIsPostMutedFromContext: () => ({
    isMuted: false,
    setOptimisticMuted: vi.fn(),
  }),
  useTogglePostMute: () => vi.fn(),
}));
vi.mock('./delete-post-dialog', () => ({ DeletePostDialog: () => null }));
vi.mock('./report-dialog', () => ({ ReportDialog: () => null }));
vi.mock('./post-card-content', () => ({
  PostCardContent: () => <p>Post body</p>,
}));
vi.mock('./replies-icons', () => ({ default: () => null }));
vi.mock('@/components/member-icon', () => ({
  default: () => <button>Member profile</button>,
}));

function renderPost(kind: 'user' | 'integration') {
  const createdAt = 1_700_000_000_000;
  const personId = 'author-1' as Id<'persons'>;
  const eventId = 'event-1' as Id<'events'>;
  const author = {
    _id: personId,
    _creationTime: createdAt,
    userId: 'auth-user-1',
    kind,
    user: {
      _id: 'auth-user-1',
      name: 'Community bot',
      email: null,
      image: null,
      username: null,
    },
  };
  const postData = {
    _id: 'post-1' as Id<'posts'>,
    _creationTime: createdAt,
    title: 'Community update',
    content: '',
    authorId: personId,
    eventId,
    author,
    event: {
      _id: eventId,
      _creationTime: createdAt,
      title: 'Community gathering',
      creatorId: personId,
      createdAt,
      updatedAt: createdAt,
      timezone: 'UTC',
      potentialDateTimes: [],
      memberships: [
        {
          _id: 'member-1' as Id<'memberships'>,
          _creationTime: createdAt,
          personId,
          eventId,
          role: 'ATTENDEE',
          rsvpStatus: 'YES',
          person: author,
        },
      ],
    },
    replies: [],
  } satisfies ComponentProps<typeof PostCard>['postData'];
  return render(
    <PostCard
      postData={postData}
      eventDateTime={null}
      userId='viewer-1'
      userRole='ATTENDEE'
    />
  );
}

describe('Post card merged attribution and actions', () => {
  it('keeps integration attribution distinct from member actions and the primary link', async () => {
    const user = userEvent.setup();
    renderPost('integration');
    const destination = screen.getByRole('link', { name: /Community update/ });
    expect(destination).toHaveAttribute('href', '/event/event-1/post/post-1');
    expect(destination).toHaveAttribute('data-slot', 'card-action');
    expect(within(destination).getByText('Integration')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Community bot, integration')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Member profile' })).toBeNull();
    expect(within(destination).queryByRole('button')).toBeNull();
    const actions = screen.getByRole('button', {
      name: 'Actions for post Community update',
    });
    expect(actions.closest('a')).toBeNull();
    await user.click(actions);
    expect(
      screen.getByRole('menuitem', { name: /Mute Post/ })
    ).toBeInTheDocument();
  });

  it('retains separate member profile controls for human-authored posts', () => {
    renderPost('user');
    expect(screen.queryByText('Integration')).toBeNull();
    const profile = screen.getByRole('button', { name: 'Member profile' });
    expect(profile.closest('a')).toBeNull();
    expect(profile.closest('[data-slot="card-actions"]')).not.toBeNull();
    expect(
      screen.getByRole('link', { name: /Community update/ })
    ).toHaveAttribute('data-slot', 'card-action');
  });
});
