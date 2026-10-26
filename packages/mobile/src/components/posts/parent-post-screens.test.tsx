import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { act, createElement, type ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { setToastAdapter } from '@groupi/shared/platform';
import type { Id } from 'convex/_generated/dataModel';
const require = createRequire(import.meta.url);
interface NativeNode {
  type: unknown;
  props: Record<string, unknown>;
}
interface Mounted {
  root: { findAll: (test: (node: NativeNode) => boolean) => NativeNode[] };
  unmount: () => void;
}
const renderer = require(
  require.resolve('react-test-renderer', {
    paths: [
      dirname(require.resolve('@testing-library/react-native/package.json')),
    ],
  })
) as { create: (element: ReactNode) => Mounted };
const state = vi.hoisted(() => ({
  group: { joiningQuestionnaire: { canAccessMemberContent: true } } as unknown,
  detail: null as unknown,
  createGroup: vi.fn(),
  createReply: vi.fn(),
  createEvent: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  confirm: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  addFile: vi.fn(),
  removeFile: vi.fn(),
  uploadAll: vi.fn(),
  clearAll: vi.fn(),
  allowNavigation: vi.fn(),
  unsaved: vi.fn(),
  menu: vi.fn(),
  pendingUploads: [] as { id: string; filename: string; status: string }[],
}));
vi.unmock('react');
vi.unmock('convex/_generated/api');
vi.unmock('@groupi/shared');
vi.mock('expo-router', () => ({
  router: { push: state.push, replace: state.replace, back: state.back },
}));
vi.mock('convex/react', () => ({ useQuery: () => state.group }));
vi.mock('../../hooks/use-posts', () => ({
  useCreatePost: () => state.createEvent,
  useCreateReply: () => state.createReply,
  useUpdatePost: () => state.update,
  useDeletePost: () => state.remove,
  useDeleteReply: () => vi.fn(),
  useUpdateReply: () => vi.fn(),
}));
vi.mock('../../hooks/use-group-posts', () => ({
  useCreateGroupPost: () => state.createGroup,
}));
vi.mock('../../hooks/use-parent-post-detail', () => ({
  useParentPostDetail: () => state.detail,
}));
vi.mock('../../hooks/use-unsaved-changes', () => ({
  useUnsavedChanges: (value: boolean) => {
    state.unsaved(value);
    return state.allowNavigation;
  },
}));
vi.mock('../../hooks/use-file-upload', () => ({
  useAttachments: () => ({
    pendingUploads: state.pendingUploads,
    isUploading: false,
    addFile: state.addFile,
    removeFile: state.removeFile,
    uploadAll: state.uploadAll,
    clearAll: state.clearAll,
  }),
}));
vi.mock('../../hooks/use-presence', () => ({
  usePostPresence: () => ({ roomToken: 'room' }),
  useTypingState: () => ({ setTyping: vi.fn() }),
  useTypingIndicators: () => [],
}));
vi.mock('../../hooks/use-muting', () => ({
  useIsPostMuted: () => ({ isMuted: false }),
  useTogglePostMute: () => vi.fn(),
}));
vi.mock('../../hooks/use-reports', () => ({ useCreateReport: () => vi.fn() }));
vi.mock('../../context/global-user-context', () => ({
  useGlobalUser: () => ({ person: { _id: 'person' } }),
}));
vi.mock('../ui/action-menu', () => ({
  useActionMenu: () => ({ showActionMenu: state.menu }),
}));
vi.mock('../ui/confirm-dialog', () => ({ showConfirmDialog: state.confirm }));
vi.mock('../ui/button', () => ({
  Button: (props: Record<string, unknown>) => createElement('Button', props),
}));
vi.mock('../ui/text', () => ({
  Text: (props: Record<string, unknown>) => createElement('Text', props),
}));
vi.mock('../ui/safe-area-view', () => ({
  SafeAreaView: (props: Record<string, unknown>) =>
    createElement('SafeAreaView', props),
}));
vi.mock('../ui/back-button', () => ({ BackButton: 'BackButton' }));
vi.mock('../ui/user-avatar', () => ({ UserAvatar: 'UserAvatar' }));
vi.mock('../members/member-avatar', () => ({ MemberAvatar: 'MemberAvatar' }));
vi.mock('../molecules', () => ({
  LoadingState: 'LoadingState',
  formatTimeAgo: () => '',
}));
vi.mock('./rich-text-editor', () => ({ RichTextEditor: 'RichTextEditor' }));
vi.mock('./post-title-input', () => ({ PostTitleInput: 'PostTitleInput' }));
vi.mock('./post-composer-keyboard-view', () => ({
  PostComposerKeyboardView: (props: Record<string, unknown>) =>
    createElement('KeyboardView', props),
}));
vi.mock('./reply-composer', () => ({
  ReplyComposer: 'ReplyComposer',
  MAX_REPLY_LENGTH: 5000,
  REPLY_EDITOR_HEIGHT: 76,
}));
vi.mock('./typing-indicator', () => ({ TypingIndicator: 'TypingIndicator' }));
vi.mock('../attachments/attachment-button', () => ({
  AttachmentButton: 'AttachmentButton',
}));
vi.mock('../attachments/attachment-preview', () => ({
  AttachmentPreview: 'AttachmentPreview',
}));
vi.mock('../attachments/attachment-gallery', () => ({
  AttachmentGallery: 'AttachmentGallery',
}));
vi.mock('../attachments/attachment-edit-list', () => ({
  AttachmentEditList: 'AttachmentEditList',
}));
vi.mock('uniwind', () => ({ useCSSVariable: () => 'transparent' }));
import { NewPostScreen } from './new-post-screen';
import { EditPostScreen } from './edit-post-screen';
import { PostDetailScreen } from './post-detail-screen';
const groupId = 'group' as Id<'groups'>,
  postId = 'post' as Id<'posts'>;
beforeEach(() => {
  vi.clearAllMocks();
  setToastAdapter({
    show: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  });
  state.pendingUploads = [];
  state.group = { joiningQuestionnaire: { canAccessMemberContent: true } };
  state.detail = {
    post: {
      _id: postId,
      groupId,
      _creationTime: 1,
      title: 'Discussion',
      content: '<p>Saved</p>',
      authorId: 'person',
      author: { person: { _id: 'person' }, user: { name: 'Alex' } },
      attachments: [],
      replies: [],
    },
    canEdit: true,
    canDelete: true,
    canModerate: false,
    canLoadMoreReplies: false,
  };
  state.createGroup.mockResolvedValue(postId);
  state.uploadAll.mockResolvedValue([]);
});
async function mount(element: ReactNode) {
  let tree!: Mounted;
  await act(async () => {
    tree = renderer.create(element);
  });
  return tree;
}
function node(tree: Mounted, type: string, label?: string) {
  return tree.root.findAll(
    n => n.type === type && (!label || n.props.accessibilityLabel === label)
  )[0];
}
it('creates a canonical Group rich-text post with uploaded attachments and protects unsaved edits', async () => {
  state.pendingUploads = [
    { id: 'file-1', filename: 'photo.jpg', status: 'pending' },
  ];
  state.uploadAll.mockResolvedValue([
    {
      storageId: 'storage',
      filename: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 20,
      width: 10,
      height: 10,
    },
  ]);
  const tree = await mount(createElement(NewPostScreen, { groupId }));
  await act(async () => {
    (
      node(tree, 'PostTitleInput').props.onChangeText as (value: string) => void
    )('Ideas');
    (node(tree, 'RichTextEditor').props.onChange as (value: string) => void)(
      '<p><strong>Bring ideas</strong></p>'
    );
  });
  expect(state.unsaved).toHaveBeenLastCalledWith(true);
  await act(async () => {
    await (node(tree, 'Button', 'Post').props.onPress as () => Promise<void>)();
  });
  expect(state.createEvent).not.toHaveBeenCalled();
  expect(state.createGroup).toHaveBeenCalledWith({
    groupId,
    title: 'Ideas',
    content: '<p><strong>Bring ideas</strong></p>',
    attachments: [
      {
        storageId: 'storage',
        filename: 'photo.jpg',
        mimeType: 'image/jpeg',
        size: 20,
        width: 10,
        height: 10,
      },
    ],
  });
  expect(state.allowNavigation).toHaveBeenCalled();
  expect(state.replace).toHaveBeenCalledWith('/groups/group/posts');
  await act(async () => tree.unmount());
});
it('edits canonical post content and preserves attachment removal intents', async () => {
  state.detail = {
    ...(state.detail as object),
    post: {
      ...(state.detail as { post: object }).post,
      attachments: [
        {
          _id: 'attachment',
          filename: 'a.jpg',
          type: 'IMAGE',
          mimeType: 'image/jpeg',
        },
      ],
    },
  };
  const tree = await mount(createElement(EditPostScreen, { groupId, postId }));
  await act(async () => {
    (node(tree, 'RichTextEditor').props.onChange as (value: string) => void)(
      '<p>Edited</p>'
    );
    (
      node(tree, 'AttachmentEditList').props.onRemove as (value: string) => void
    )('attachment');
  });
  await act(async () => {
    await (
      tree.root.findAll(n => n.type === 'Button')[0].props
        .onPress as () => Promise<void>
    )();
  });
  expect(state.update).toHaveBeenCalledWith({
    postId,
    title: 'Discussion',
    content: '<p>Edited</p>',
    attachmentsToAdd: [],
    attachmentIdsToDelete: ['attachment'],
  });
  await act(async () => tree.unmount());
});
it('shares canonical detail attachments, replies, mute actions, and confirmed deletion', async () => {
  state.detail = {
    ...(state.detail as object),
    post: {
      ...(state.detail as { post: object }).post,
      attachments: [{ _id: 'attachment' }],
    },
  };
  const tree = await mount(
    createElement(PostDetailScreen, { groupId, postId })
  );
  expect(node(tree, 'ReplyComposer').props.postId).toBe(postId);
  const actions = tree.root.findAll(
    n => n.type === 'Pressable' && typeof n.props.onPress === 'function'
  )[0];
  await act(async () => {
    (actions.props.onPress as () => void)();
  });
  const options = state.menu.mock.calls[0][0].options as {
    label: string;
    onPress: () => void;
  }[];
  expect(options.map(o => o.label)).toContain('Mute Post');
  options.find(o => o.label === 'Edit Post')?.onPress();
  expect(state.push).toHaveBeenCalledWith('/groups/group/posts/post/edit');
  options.find(o => o.label === 'Delete Post')?.onPress();
  expect(state.remove).not.toHaveBeenCalled();
  await act(async () => {
    await state.confirm.mock.calls[0][0].onConfirm();
  });
  expect(state.remove).toHaveBeenCalledWith({ postId });
  await act(async () => tree.unmount());
});
it('renders no post controls for an unavailable or mismatched parent', async () => {
  state.detail = null;
  const tree = await mount(
    createElement(PostDetailScreen, {
      groupId: 'wrong' as Id<'groups'>,
      postId,
    })
  );
  expect(tree.root.findAll(n => n.type === 'ReplyComposer')).toHaveLength(0);
  expect(tree.root.findAll(n => n.type === 'AttachmentGallery')).toHaveLength(
    0
  );
  expect(state.menu).not.toHaveBeenCalled();
  await act(async () => tree.unmount());
});

it.each(['Group', 'Event'])(
  'creates an attachment-only %s Post with a valid title and no empty HTML',
  async owner => {
    state.group = {
      joiningQuestionnaire: { canAccessMemberContent: true },
      userMembership: { role: 'ATTENDEE' },
      permissions: { createPosts: 'EVERYONE' },
    };
    state.pendingUploads = [
      { id: 'pending', filename: 'file.pdf', status: 'pending' },
    ];
    state.uploadAll.mockResolvedValue([
      {
        storageId: 'storage',
        filename: 'file.pdf',
        mimeType: 'application/pdf',
        size: 20,
      },
    ]);
    state.createEvent.mockResolvedValue({ postId });
    const tree = await mount(
      createElement(
        NewPostScreen,
        owner === 'Group' ? { groupId } : { eventId: 'event' as Id<'events'> }
      )
    );
    await act(async () => {
      (
        node(tree, 'PostTitleInput').props.onChangeText as (
          value: string
        ) => void
      )('Document');
      (node(tree, 'RichTextEditor').props.onChange as (value: string) => void)(
        '<p><br></p>'
      );
    });
    expect(node(tree, 'Button', 'Post').props.disabled).toBe(false);
    await act(async () => {
      await (
        node(tree, 'Button', 'Post').props.onPress as () => Promise<void>
      )();
    });
    const write = owner === 'Group' ? state.createGroup : state.createEvent;
    expect(write).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Document',
        content: '',
        attachments: [expect.objectContaining({ storageId: 'storage' })],
      })
    );
    await act(async () => tree.unmount());
  }
);
it('keeps a retained attachment-only Post editable and blocks removing its final attachment without text', async () => {
  state.detail = {
    ...(state.detail as object),
    post: {
      ...(state.detail as { post: object }).post,
      content: '',
      attachments: [
        {
          _id: 'attachment',
          filename: 'file.pdf',
          mimeType: 'application/pdf',
          type: 'FILE',
        },
      ],
    },
  };
  const tree = await mount(createElement(EditPostScreen, { groupId, postId }));
  await act(async () => {
    (
      node(tree, 'PostTitleInput').props.onChangeText as (value: string) => void
    )('Revised title');
  });
  expect(tree.root.findAll(n => n.type === 'Button')[0].props.disabled).toBe(
    false
  );
  await act(async () => {
    await (
      tree.root.findAll(n => n.type === 'Button')[0].props
        .onPress as () => Promise<void>
    )();
  });
  expect(state.update).toHaveBeenCalledWith(
    expect.objectContaining({ postId, content: '', attachmentIdsToDelete: [] })
  );
  state.update.mockClear();
  await act(async () => {
    (
      node(tree, 'AttachmentEditList').props.onRemove as (value: string) => void
    )('attachment');
  });
  expect(tree.root.findAll(n => n.type === 'Button')[0].props.disabled).toBe(
    true
  );
  await act(async () => {
    await (
      tree.root.findAll(n => n.type === 'Button')[0].props
        .onPress as () => Promise<void>
    )();
  });
  expect(state.update).not.toHaveBeenCalled();
  await act(async () => tree.unmount());
});
it('preserves the attachment-only draft and unsaved guard after upload failure', async () => {
  state.pendingUploads = [
    { id: 'pending', filename: 'file.pdf', status: 'pending' },
  ];
  state.uploadAll.mockRejectedValue(new Error('Upload failed'));
  const tree = await mount(createElement(NewPostScreen, { groupId }));
  await act(async () => {
    (
      node(tree, 'PostTitleInput').props.onChangeText as (value: string) => void
    )('Keep draft');
  });
  await act(async () => {
    await (node(tree, 'Button', 'Post').props.onPress as () => Promise<void>)();
  });
  expect(state.createGroup).not.toHaveBeenCalled();
  expect(state.clearAll).not.toHaveBeenCalled();
  expect(state.allowNavigation).not.toHaveBeenCalled();
  expect(state.replace).not.toHaveBeenCalled();
  expect(node(tree, 'PostTitleInput').props.value).toBe('Keep draft');
  expect(state.unsaved).toHaveBeenLastCalledWith(true);
  await act(async () => tree.unmount());
});

it('allows an attachment-only canonical Reply and retains uploads when sending fails', async () => {
  const { ReplyComposer } =
    await vi.importActual<typeof import('./reply-composer')>(
      './reply-composer'
    );
  state.pendingUploads = [
    { id: 'pending', filename: 'file.pdf', status: 'pending' },
  ];
  state.uploadAll.mockResolvedValue([
    {
      storageId: 'storage',
      filename: 'file.pdf',
      mimeType: 'application/pdf',
      size: 20,
    },
  ]);
  state.createReply.mockRejectedValue(new Error('Send failed'));
  const typing = vi.fn();
  const tree = await mount(
    createElement(ReplyComposer, { postId, onTypingChange: typing })
  );
  expect(node(tree, 'Button', 'Send reply').props.disabled).toBe(false);
  await act(async () => {
    await (
      node(tree, 'Button', 'Send reply').props.onPress as () => Promise<void>
    )();
  });
  expect(state.createReply).toHaveBeenCalledWith({
    postId,
    text: '',
    attachments: [expect.objectContaining({ storageId: 'storage' })],
  });
  expect(state.clearAll).not.toHaveBeenCalled();
  expect(node(tree, 'Button', 'Send reply').props.disabled).toBe(false);
  await act(async () => tree.unmount());
});
it('blocks a canonical Reply with neither visible text nor attachments', async () => {
  const { ReplyComposer } =
    await vi.importActual<typeof import('./reply-composer')>(
      './reply-composer'
    );
  const tree = await mount(
    createElement(ReplyComposer, { postId, onTypingChange: vi.fn() })
  );
  expect(node(tree, 'Button', 'Send reply').props.disabled).toBe(true);
  await act(async () => {
    await (
      node(tree, 'Button', 'Send reply').props.onPress as () => Promise<void>
    )();
  });
  expect(state.createReply).not.toHaveBeenCalled();
  expect(state.uploadAll).not.toHaveBeenCalled();
  await act(async () => tree.unmount());
});
