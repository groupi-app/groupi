import { ConvexError } from 'convex/values';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { getFunctionName } from 'convex/server';
import type { Id } from '@/convex/_generated/dataModel';
import { GroupPostDetail, GroupPostEditor, GroupPosts } from './group-posts';
const state = vi.hoisted(() => ({
  mobile: false,
  group: { joiningQuestionnaire: { canAccessMemberContent: true } } as unknown,
  post: null as unknown,
  replies: { page: [] as unknown[], isDone: true, continueCursor: '' },
  pinned: [] as unknown[],
  pin: vi.fn(),
  replyControl: vi.fn(),
  posts: { page: [] as unknown[], isDone: true, continueCursor: '' },
  profile: vi.fn(),
  replyUpdate: vi.fn(),
  replyCreate: vi.fn(),
  upload: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  mutation: vi.fn(),
  push: vi.fn(),
  back: vi.fn(),
  guard: vi.fn(),
}));
vi.mock('@/hooks/convex/use-post-controls', () => ({
  usePinnedGroupPosts: () => state.pinned,
  useSetPostRepliesDisabled: () => state.replyControl,
  useSetPostPinned: () => state.pin,
}));
vi.mock('@/hooks/use-mobile', () => ({ useMobile: () => state.mobile }));
vi.unmock('@/convex/_generated/api');
vi.mock('convex/react', () => ({
  useMutation: () => state.mutation,
  useQuery: (reference: Parameters<typeof getFunctionName>[0]) => {
    const name = getFunctionName(reference);
    if (name === 'groupPosts/queries:mentionMembers')
      return [
        {
          personId: 'member',
          userId: 'public-user',
          name: 'Alex',
          username: 'alex',
        },
      ];
    if (name === 'muting/queries:isPostMuted') return { isMuted: false };
    return undefined;
  },
}));
vi.mock('next/dynamic', () => ({
  default: () =>
    function RichEditor(props: {
      content: string;
      onChange: (value: string) => void;
      mentionMembers: unknown[];
    }) {
      return (
        <>
          <textarea
            aria-label='Post text'
            value={props.content}
            onChange={event => props.onChange(event.target.value)}
          />
          <span data-testid='mention-count'>{props.mentionMembers.length}</span>
        </>
      );
    },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: state.push, back: state.back }),
}));
vi.mock('@/hooks/use-invite-list-navigation-guard', () => ({
  useInviteListNavigationGuard: (dirty: boolean) => {
    state.guard(dirty);
  },
}));
vi.mock('@/components/profile-view-dialog', () => ({
  ProfileViewDialog: (props: { userId: string }) => {
    state.profile(props.userId);
    return null;
  },
}));
vi.mock('@/components/attachments', () => ({
  AttachmentGallery: ({
    attachments,
  }: {
    attachments: { filename: string }[];
  }) => (
    <div>
      {attachments.map(item => (
        <span key={item.filename}>{item.filename}</span>
      ))}
    </div>
  ),
  AttachmentButton: () => <button type='button'>Add files</button>,
  AttachmentPreview: () => null,
  fromPendingUpload: vi.fn(),
  fromServerAttachment: vi.fn(),
}));
vi.mock('@/hooks/convex/use-file-upload', () => ({
  useAttachments: () => ({
    pendingUploads: [],
    uploadAll: state.upload,
    clearAll: vi.fn(),
    addFiles: vi.fn(),
    removeFile: vi.fn(),
    updateFile: vi.fn(),
    toggleSpoiler: vi.fn(),
    isUploading: false,
  }),
}));
vi.mock('@/hooks/convex/use-presence', () => ({
  useCurrentUserPostPresence: () => ({ roomToken: 'room' }),
  useCurrentUserTypingState: () => ({ setTyping: vi.fn() }),
  useTypingIndicators: () => [],
}));
vi.mock('@/hooks/convex/use-groups', () => ({ useGroup: () => state.group }));
vi.mock('@/hooks/convex/use-group-posts', () => ({
  useGroupPostReplies: () => state.replies,
  useCreateGroupPostReply: () => state.replyCreate,
  useUpdateGroupPostReply: () => state.replyUpdate,
  useDeleteGroupPostReply: () => vi.fn(),
  useGroupPosts: () => state.posts,
  useGroupPost: () => state.post,
  useCreateGroupPost: () => state.create,
  useUpdateGroupPost: () => state.update,
  useDeleteGroupPost: () => state.remove,
}));
const groupId = 'group' as Id<'groups'>;
const postId = 'post' as Id<'posts'>;
beforeEach(() => {
  vi.clearAllMocks();
  state.mobile = false;
  state.upload.mockResolvedValue([]);
  state.group = { joiningQuestionnaire: { canAccessMemberContent: true } };
  state.post = {
    _id: postId,
    groupId,
    title: 'Discussion',
    content: '<p><strong>Rich post</strong></p>',
    authorName: 'Alex',
    createdAt: 1,
    canEdit: true,
    canDelete: true,
    attachments: [{ filename: 'photo.png' }],
    replyCount: 0,
    viewerPersonId: 'viewer',
  };
  state.pinned = [];
  state.pin.mockResolvedValue({ revision: 1 });
  state.replyControl.mockResolvedValue({ revision: 1 });
  state.posts = { page: [], isDone: true, continueCursor: '' };
  state.replies = { page: [], isDone: true, continueCursor: '' };
  state.mutation.mockResolvedValue({});
});
describe('canonical Group Posts', () => {
  it('rejects a pending upload submission locally when replies close before publication', async () => {
    let resolve!: (value: never[]) => void;
    state.upload.mockReturnValue(
      new Promise(done => {
        resolve = done;
      })
    );
    const view = render(<GroupPostDetail groupId={groupId} postId={postId} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Post text' }), {
      target: { value: '<p>Keep my draft</p>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send reply' }));
    state.post = { ...(state.post as object), repliesDisabled: true };
    view.rerender(<GroupPostDetail groupId={groupId} postId={postId} />);
    await act(async () => resolve([]));
    expect(state.replyCreate).not.toHaveBeenCalled();
    state.post = { ...(state.post as object), repliesDisabled: false };
    view.rerender(<GroupPostDetail groupId={groupId} postId={postId} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your draft is preserved'
    );
    expect(screen.getByRole('textbox', { name: 'Post text' })).toHaveValue(
      '<p>Keep my draft</p>'
    );
  });

  it('reports a full pin limit in the mobile ActionMenu without optimistic success', async () => {
    state.mobile = true;
    state.post = { ...(state.post as object), canPin: true, pinRevision: 2 };
    state.pin.mockRejectedValue(
      new ConvexError({
        code: 'PIN_LIMIT',
        message: 'Unpin a post before pinning another.',
      })
    );
    render(<GroupPostDetail groupId={groupId} postId={postId} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Post actions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pin post' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unpin a post');
    expect(state.pin).toHaveBeenCalledExactlyOnceWith({
      postId,
      pinned: true,
      expectedRevision: 2,
    });
    expect(screen.getByRole('button', { name: 'Pin post' })).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: 'Unpin post' })
    ).not.toBeInTheDocument();
  });

  it('publishes a Group post with replies disabled only when the composer option is chosen', async () => {
    state.create.mockResolvedValue(postId);
    render(<GroupPostEditor groupId={groupId} />);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Update' },
    });
    fireEvent.change(screen.getByLabelText('Post text'), {
      target: { value: '<p>No replies needed</p>' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Allow replies' }));
    fireEvent.click(screen.getByRole('button', { name: 'Publish post' }));
    await waitFor(() =>
      expect(state.create).toHaveBeenCalledWith(
        expect.objectContaining({ groupId, repliesDisabled: true })
      )
    );
  });
  it('keeps existing replies readable and editable while hiding the new reply composer when closed', () => {
    state.post = { ...(state.post as object), repliesDisabled: true };
    state.replies = {
      page: [
        {
          _id: 'reply',
          authorName: 'Mina',
          createdAt: 1,
          content: '<p>Existing reply</p>',
          attachments: [],
          canEdit: true,
          canDelete: true,
        },
      ],
      isDone: true,
      continueCursor: '',
    };
    render(<GroupPostDetail groupId={groupId} postId={postId} />);
    expect(screen.getByText('Existing reply')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Edit reply' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Send reply' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Replies are closed.')).toBeInTheDocument();
  });
  it('retains an unsent reply draft when a remote lock closes then reopens replies', () => {
    state.replies = {
      page: [
        {
          _id: 'existing',
          authorName: 'Mina',
          createdAt: 1,
          content: '<p>Prior reply</p>',
          attachments: [],
          canEdit: true,
          canDelete: true,
        },
      ],
      isDone: true,
      continueCursor: '',
    };
    const view = render(<GroupPostDetail groupId={groupId} postId={postId} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Post text' }), {
      target: { value: '<p>My unsent reply</p>' },
    });
    state.post = { ...(state.post as object), repliesDisabled: true };
    view.rerender(<GroupPostDetail groupId={groupId} postId={postId} />);
    expect(
      screen.queryByRole('button', { name: 'Send reply' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit reply' })).toBeEnabled();
    state.post = { ...(state.post as object), repliesDisabled: false };
    view.rerender(<GroupPostDetail groupId={groupId} postId={postId} />);
    expect(screen.getByRole('textbox', { name: 'Post text' })).toHaveValue(
      '<p>My unsent reply</p>'
    );
  });
  it('renders separately retrieved pins before polls without duplicating normal-page IDs', () => {
    const base = state.post as object;
    state.pinned = [
      {
        ...base,
        _id: 'older',
        title: 'Older pin',
        pinnedAt: 10,
        replyCount: 0,
        unreadCount: 0,
      },
      {
        ...base,
        _id: 'newer',
        title: 'Newest pin',
        pinnedAt: 20,
        replyCount: 0,
        unreadCount: 0,
      },
    ];
    state.posts = {
      page: [
        {
          ...base,
          _id: 'newer',
          title: 'Newest pin',
          pinnedAt: 20,
          replyCount: 0,
          unreadCount: 0,
        },
        {
          ...base,
          _id: 'ordinary',
          title: 'Ordinary post',
          replyCount: 0,
          unreadCount: 0,
        },
      ],
      isDone: false,
      continueCursor: 'next',
    };
    render(<GroupPosts groupId={groupId} />);
    expect(screen.getAllByRole('link', { name: 'Newest pin' })).toHaveLength(1);
    const links = screen.getAllByRole('link');
    expect(links.map(link => link.textContent)).toEqual([
      'Newest pin',
      'Older pin',
      'Ordinary post',
    ]);
  });
  it('offers only server-authorized reply and pin actions through the post menu', async () => {
    state.post = {
      ...(state.post as object),
      canSetRepliesDisabled: true,
      canPin: false,
      repliesRevision: 3,
    };
    render(<GroupPostDetail groupId={groupId} postId={postId} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Post actions' }));
    expect(
      screen.queryByRole('menuitem', { name: 'Pin post' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Lock replies' }));
    await waitFor(() =>
      expect(state.replyControl).toHaveBeenCalledWith({
        postId,
        repliesDisabled: true,
        expectedRevision: 3,
      })
    );
    expect(state.pin).not.toHaveBeenCalled();
  });

  it('gates member content behind current Group onboarding', () => {
    state.group = { joiningQuestionnaire: { canAccessMemberContent: false } };
    render(<GroupPosts groupId={groupId} />);
    expect(
      screen.getByText(/completed required onboarding/)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Posts' })
    ).not.toBeInTheDocument();
  });
  it('renders rich post content and attachment previews, marks read, and confirms deletion', async () => {
    render(<GroupPostDetail groupId={groupId} postId={postId} />);
    expect(screen.getByText('Rich post').tagName).toBe('STRONG');
    expect(screen.getByText('photo.png')).toBeInTheDocument();
    await waitFor(() =>
      expect(state.mutation).toHaveBeenCalledWith({ postId })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete post' }));
    expect(state.remove).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm deleting post' })
    );
    await waitFor(() => expect(state.remove).toHaveBeenCalledWith({ postId }));
    expect(state.push).toHaveBeenCalledWith('/groups/group');
  });
  it('renders unsafe legacy content as escaped text', () => {
    state.post = {
      ...(state.post as object),
      content: '<script>text</script>',
    };
    render(<GroupPostDetail groupId={groupId} postId={postId} />);
    expect(screen.getByText('<script>text</script>')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });
  it('does not display or manage a post from another Group URL', () => {
    render(
      <GroupPostDetail groupId={'other' as Id<'groups'>} postId={postId} />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Post unavailable');
    expect(
      screen.queryByRole('heading', { name: 'Discussion' })
    ).not.toBeInTheDocument();
    expect(state.mutation).not.toHaveBeenCalled();
  });
  it('creates canonical rich content with attachments and Group-safe mention suggestions', async () => {
    state.create.mockResolvedValue(postId);
    render(<GroupPostEditor groupId={groupId} />);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'New discussion' },
    });
    fireEvent.change(screen.getByLabelText('Post text'), {
      target: { value: '<p>Ideas welcome</p>' },
    });
    expect(screen.getByTestId('mention-count')).toHaveTextContent('1');
    fireEvent.click(screen.getByRole('button', { name: 'Publish post' }));
    await waitFor(() =>
      expect(state.create).toHaveBeenCalledWith({
        groupId,
        repliesDisabled: false,
        title: 'New discussion',
        content: '<p>Ideas welcome</p>',
        attachments: [],
      })
    );
    expect(state.push).toHaveBeenCalledWith('/groups/group/posts/post');
  });
  it('keeps rich editor input after failed writes and guards unsaved cancellation', async () => {
    state.create.mockRejectedValue(new Error('Access changed'));
    render(<GroupPostEditor groupId={groupId} />);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Retained title' },
    });
    fireEvent.change(screen.getByLabelText('Post text'), {
      target: { value: '<p>Retained text</p>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publish post' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Access changed'
    );
    expect(screen.getByLabelText('Post text')).toHaveValue(
      '<p>Retained text</p>'
    );
    expect(state.guard).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(state.back).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.getByLabelText('Post text')).toHaveValue(
      '<p>Retained text</p>'
    );
  });
});

it('shows canonical unread state in the Group feed', () => {
  state.posts = {
    page: [{ ...(state.post as object), unreadCount: 2 }],
    isDone: true,
    continueCursor: '',
  };
  render(<GroupPosts groupId={groupId} />);
  expect(screen.getByLabelText('2 unread notifications')).toHaveTextContent(
    'Unread'
  );
});
it('opens Group-safe mention profiles using keyboard activation', () => {
  state.post = {
    ...(state.post as object),
    content: '<p>Hello <span class="mention" data-id="member">@alex</span></p>',
  };
  render(<GroupPostDetail groupId={groupId} postId={postId} />);
  fireEvent.keyDown(
    screen.getByRole('button', { name: 'Open profile for @alex' }),
    { key: 'Enter' }
  );
  expect(state.profile).toHaveBeenCalledWith('public-user');
});
it('edits canonical rich replies and preserves attachment update arguments', async () => {
  state.replies = {
    page: [
      {
        _id: 'reply-one',
        content: '<p>Original reply</p>',
        authorName: 'Reply author',
        createdAt: 1,
        canEdit: true,
        canDelete: true,
        attachments: [],
      },
    ],
    isDone: true,
    continueCursor: '',
  };
  render(<GroupPostDetail groupId={groupId} postId={postId} />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit reply' }));
  const reply = screen.getByText(/Reply author/).closest('article')!;
  fireEvent.change(within(reply).getByLabelText('Post text'), {
    target: { value: '<p>Updated reply</p>' },
  });
  fireEvent.click(within(reply).getByRole('button', { name: 'Save reply' }));
  await waitFor(() =>
    expect(state.replyUpdate).toHaveBeenCalledWith({
      replyId: 'reply-one',
      content: '<p>Updated reply</p>',
      attachmentsToAdd: [],
      attachmentIdsToDelete: [],
    })
  );
});
it('preserves a new reply draft before allowing another reply to enter edit mode', async () => {
  state.replies = {
    page: [
      {
        _id: 'reply-one',
        content: '<p>Existing reply</p>',
        authorName: 'Reply author',
        createdAt: 1,
        canEdit: true,
        canDelete: true,
        attachments: [],
      },
    ],
    isDone: true,
    continueCursor: '',
  };
  render(<GroupPostDetail groupId={groupId} postId={postId} />);
  fireEvent.change(screen.getByLabelText('Post text'), {
    target: { value: '<p>Unsaved reply</p>' },
  });
  expect(screen.getByRole('button', { name: 'Edit reply' })).toBeDisabled();
  expect(
    screen.getByText(/Save or cancel your reply draft/)
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.getByLabelText('Post text')).toHaveValue(
    '<p>Unsaved reply</p>'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Edit reply' })).toBeEnabled()
  );
  expect(screen.getByLabelText('Post text')).toHaveValue('');
});
it('keeps one reply editor mounted and blocks pagination while editing', () => {
  state.replies = {
    page: [
      {
        _id: 'reply-one',
        content: '<p>First</p>',
        authorName: 'First author',
        createdAt: 1,
        canEdit: true,
        canDelete: true,
        attachments: [],
      },
      {
        _id: 'reply-two',
        content: '<p>Second</p>',
        authorName: 'Second author',
        createdAt: 2,
        canEdit: true,
        canDelete: true,
        attachments: [],
      },
    ],
    isDone: false,
    continueCursor: 'next-page',
  };
  render(<GroupPostDetail groupId={groupId} postId={postId} />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Edit reply' })[0]);
  expect(screen.getByRole('button', { name: 'Edit reply' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next replies' })).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Save reply' })
  ).toBeInTheDocument();
});
