import { router } from 'expo-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PostCard } from './post-card';

const mocks = vi.hoisted(() => ({
  showActionMenu: vi.fn(),
  showConfirmDialog: vi.fn(),
  togglePostMute: vi.fn(),
  deletePost: vi.fn(),
  createReport: vi.fn(),
  useIsPostMuted: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('../ui/action-menu', () => ({
  useActionMenu: () => ({ showActionMenu: mocks.showActionMenu }),
}));

vi.mock('../ui/confirm-dialog', () => ({
  showConfirmDialog: mocks.showConfirmDialog,
}));

vi.mock('../../hooks/use-posts', () => ({
  useDeletePost: () => mocks.deletePost,
}));

vi.mock('../../hooks/use-muting', () => ({
  useIsPostMuted: mocks.useIsPostMuted,
  useTogglePostMute: () => mocks.togglePostMute,
}));

vi.mock('../../hooks/use-reports', () => ({
  useCreateReport: () => mocks.createReport,
}));

vi.mock('@groupi/shared/platform', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

vi.mock('../members/member-avatar', () => ({
  MemberAvatar: 'MemberAvatar',
}));

vi.mock('../molecules', () => ({
  Timestamp: 'Timestamp',
}));

vi.mock('../ui/card', () => ({
  Card: 'Card',
}));

vi.mock('../ui/text', () => ({
  Text: 'Text',
}));

const post = {
  _id: 'post-123',
  title: 'Packing list',
  content: '<p>Bring warm clothes.</p>',
  _creationTime: 1,
  authorId: 'person-author',
  author: { name: 'Avery', image: null },
  replyCount: 2,
};

function createPostCard({
  currentPersonId = 'person-current',
  userRole = 'ATTENDEE',
}: {
  currentPersonId?: string;
  userRole?: string;
} = {}) {
  return PostCard({
    post,
    eventId: 'event-123',
    currentPersonId,
    userRole,
  });
}

function menuOptions() {
  return mocks.showActionMenu.mock.calls[0][0].options as Array<{
    label: string;
    icon?: string;
    destructive?: boolean;
    showChevron?: boolean;
    onPress: () => void;
  }>;
}

describe('PostCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useIsPostMuted.mockReturnValue({ isMuted: false });
  });

  it('opens the post on a normal press', () => {
    const card = createPostCard();

    card.props.onPress();

    expect(router.push).toHaveBeenCalledWith('/event/event-123/post/post-123');
    expect(mocks.showActionMenu).not.toHaveBeenCalled();
  });

  it('offers mute and report actions for another member post', () => {
    const card = createPostCard();

    card.props.onLongPress();

    expect(mocks.showActionMenu).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Packing list' })
    );
    const options = menuOptions();
    expect(options.map(option => option.label)).toEqual([
      'Mute Post',
      'Report Post',
    ]);
    expect(options).toEqual([
      expect.objectContaining({ icon: 'notifications-off-outline' }),
      expect.objectContaining({ icon: 'flag-outline' }),
    ]);

    options[0].onPress();
    options[1].onPress();

    expect(mocks.togglePostMute).toHaveBeenCalledWith('post-123');
    expect(mocks.createReport).toHaveBeenCalledWith({
      targetType: 'POST',
      targetId: 'post-123',
      reason: 'INAPPROPRIATE_CONTENT',
    });
  });

  it('offers unmute, edit, and delete actions to the author', async () => {
    mocks.useIsPostMuted.mockReturnValue({ isMuted: true });
    mocks.deletePost.mockResolvedValue(undefined);
    const card = createPostCard({ currentPersonId: 'person-author' });

    card.props.onLongPress();

    const options = menuOptions();
    expect(options.map(option => option.label)).toEqual([
      'Unmute Post',
      'Edit Post',
      'Delete Post',
    ]);
    expect(options[2].destructive).toBe(true);
    expect(options[0].icon).toBe('notifications-outline');
    expect(options[1]).toEqual(
      expect.objectContaining({ icon: 'create-outline', showChevron: true })
    );
    expect(options[2].icon).toBe('trash-outline');

    options[1].onPress();
    options[2].onPress();

    expect(router.push).toHaveBeenCalledWith(
      '/event/event-123/post/post-123/edit'
    );
    expect(mocks.showConfirmDialog).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Delete Post', destructive: true })
    );

    const confirmation = mocks.showConfirmDialog.mock.calls[0][0] as {
      onConfirm: () => Promise<void>;
    };
    await confirmation.onConfirm();

    expect(mocks.deletePost).toHaveBeenCalledWith({ postId: 'post-123' });
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Post deleted');
  });

  it('lets moderators report or delete another member post', () => {
    const card = createPostCard({ userRole: 'MODERATOR' });

    card.props.onLongPress();

    const options = menuOptions();
    expect(options.map(option => option.label)).toEqual([
      'Mute Post',
      'Report Post',
      'Delete Post',
    ]);
    expect(options.some(option => option.label === 'Edit Post')).toBe(false);
  });
});
