import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { act, createElement, type ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
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
  post: null as unknown,
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  confirm: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));
vi.unmock('react');
vi.mock('expo-router', () => ({
  router: { push: state.push, replace: state.replace, back: vi.fn() },
}));
vi.mock('../../hooks/use-groups', () => ({ useGroup: () => state.group }));
vi.mock('../../hooks/use-group-posts', () => ({
  useGroupPosts: () => ({ page: [], isDone: true, continueCursor: '' }),
  useGroupPost: () => state.post,
  useCreateGroupPost: () => state.create,
  useUpdateGroupPost: () => state.update,
  useDeleteGroupPost: () => state.remove,
  useGroupPostReplies: () => ({ page: [], isDone: true, continueCursor: '' }),
  useCreateGroupPostReply: () => vi.fn(),
  useUpdateGroupPostReply: () => vi.fn(),
  useDeleteGroupPostReply: () => vi.fn(),
}));
vi.mock('../ui/button', () => ({
  Button: (props: Record<string, unknown>) => createElement('Button', props),
}));
vi.mock('../ui/text', () => ({
  Text: (props: Record<string, unknown>) => createElement('Text', props),
}));
vi.mock('../ui/input', () => ({
  Input: (props: Record<string, unknown>) => createElement('Input', props),
}));
vi.mock('../ui/confirm-dialog', () => ({
  showConfirmDialog: state.confirm,
}));
vi.mock('react-native', () => ({
  View: (props: Record<string, unknown>) => createElement('View', props),
}));
import { GroupPostDetail, GroupPostEditor } from './group-posts';
const groupId = 'group' as Id<'groups'>;
const postId = 'post' as Id<'groupPosts'>;
beforeEach(() => {
  vi.clearAllMocks();
  state.group = { joiningQuestionnaire: { canAccessMemberContent: true } };
  state.post = {
    _id: postId,
    groupId,
    title: 'Discussion',
    content: 'Text',
    authorName: 'Alex',
    createdAt: 1,
    canEdit: true,
    canDelete: true,
  };
});
it('native creation uses the same shared post mutation and detail route', async () => {
  state.create.mockResolvedValue(postId);
  let tree!: Mounted;
  await act(async () => {
    tree = renderer.create(createElement(GroupPostEditor, { groupId }));
  });
  await act(async () => {
    const title = tree.root.findAll(
      n => n.type === 'Input' && n.props.accessibilityLabel === 'Title'
    )[0];
    const content = tree.root.findAll(
      n => n.type === 'Input' && n.props.accessibilityLabel === 'Post'
    )[0];
    (title.props.onChangeText as (text: string) => void)('Ideas');
    (content.props.onChangeText as (text: string) => void)('Bring ideas');
  });
  await act(async () => {
    const button = tree.root.findAll(
      n => n.type === 'Button' && n.props.variant === undefined
    )[0];
    await (button.props.onPress as () => Promise<void>)();
  });
  expect(state.create).toHaveBeenCalledWith({
    groupId,
    title: 'Ideas',
    content: 'Bring ideas',
  });
  expect(state.replace).toHaveBeenCalledWith('/groups/group/posts/post');
  await act(async () => tree.unmount());
});
it('native destructive post actions wait for confirmation', async () => {
  let tree!: Mounted;
  await act(async () => {
    tree = renderer.create(createElement(GroupPostDetail, { groupId, postId }));
  });
  await act(async () => {
    const button = tree.root.findAll(
      n => n.type === 'Button' && n.props.variant === 'destructive'
    )[0];
    (button.props.onPress as () => void)();
  });
  expect(state.remove).not.toHaveBeenCalled();
  const options = state.confirm.mock.calls[0][0] as {
    destructive: boolean;
    onConfirm: () => Promise<void>;
  };
  expect(options.destructive).toBe(true);
  await act(async () => options.onConfirm());
  expect(state.remove).toHaveBeenCalledWith({ postId });
  await act(async () => tree.unmount());
});
it('native detail refuses a post under another Group URL', async () => {
  let tree!: Mounted;
  await act(async () => {
    tree = renderer.create(
      createElement(GroupPostDetail, {
        groupId: 'other' as Id<'groups'>,
        postId,
      })
    );
  });
  expect(
    tree.root.findAll(
      n => n.type === 'Text' && n.props.accessibilityRole === 'alert'
    )[0].props.children
  ).toBe('Post unavailable.');
  expect(tree.root.findAll(n => n.type === 'Button')).toHaveLength(0);
  await act(async () => tree.unmount());
});
