import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { act, createElement, useEffect, type ReactNode } from 'react';
import { getFunctionName } from 'convex/server';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import type { Id } from 'convex/_generated/dataModel';
import { beforeEach, expect, it, vi } from 'vitest';
vi.unmock('convex/_generated/api');
vi.mock('../context/global-user-context', () => ({
  useGlobalUser: () => ({ person: { _id: 'person' } }),
}));
import { useParentPostDetail } from './use-parent-post-detail';
const require = createRequire(import.meta.url);
const renderer = require(
  require.resolve('react-test-renderer', {
    paths: [
      dirname(require.resolve('@testing-library/react-native/package.json')),
    ],
  })
) as { create: (element: ReactNode) => { unmount: () => void } };
const postId = 'post' as Id<'posts'>,
  groupId = 'group' as Id<'groups'>;
const writes = vi.fn(async (_input: Record<string, unknown>) => undefined),
  pages = vi.fn();
let result: ReturnType<typeof useParentPostDetail>;
let actualGroup = groupId;
const reads: { name: string; args: unknown }[] = [];
function Probe({ owner }: { owner?: Id<'groups'> }) {
  const value = useParentPostDetail(postId, owner);
  useEffect(() => {
    result = value;
  });
  return null;
}
beforeEach(() => {
  vi.clearAllMocks();
  reads.length = 0;
  actualGroup = groupId;
  vi.mocked(useQuery).mockImplementation((...args) => {
    const [reference, input] = args;
    if (input === 'skip') return undefined;
    const name = getFunctionName(reference);
    reads.push({ name, args: input });
    if (name === 'groupPosts/queries:getPost')
      return {
        _id: postId,
        groupId: actualGroup,
        attachments: [{ _id: 'file' }],
        canEdit: true,
        canDelete: true,
        canModerate: false,
      };
    return {
      post: { _id: postId, eventId: 'event', authorId: 'person', replies: [] },
      userMembership: { role: 'ATTENDEE' },
    };
  });
  vi.mocked(useMutation).mockImplementation(() => {
    const mutate = Object.assign(
      (input: Record<string, unknown> = {}) => writes(input),
      { withOptimisticUpdate: () => mutate }
    );
    return mutate;
  });
  vi.mocked(usePaginatedQuery).mockImplementation((_reference, args) => {
    pages(args);
    return {
      results: [],
      status: 'CanLoadMore',
      isLoading: false,
      loadMore: vi.fn(),
    };
  });
});
it('reads the scoped canonical Group Post and marks only that valid thread read', async () => {
  let tree!: ReturnType<typeof renderer.create>;
  await act(async () => {
    tree = renderer.create(createElement(Probe, { owner: groupId }));
  });
  expect(reads.map(row => row.name)).toEqual(['groupPosts/queries:getPost']);
  expect(pages).toHaveBeenCalledWith({ postId });
  expect(writes).toHaveBeenCalledWith({ postId });
  expect(result).toMatchObject({
    post: { _id: postId, groupId, attachments: [{ _id: 'file' }] },
    canLoadMoreReplies: true,
  });
  await act(async () => tree.unmount());
});
it('rejects a spoofed Group parent before marking read or reading reply/attachment controls', async () => {
  actualGroup = 'another' as Id<'groups'>;
  let tree!: ReturnType<typeof renderer.create>;
  await act(async () => {
    tree = renderer.create(createElement(Probe, { owner: groupId }));
  });
  expect(result).toBeNull();
  expect(writes).not.toHaveBeenCalled();
  expect(pages).toHaveBeenCalledWith('skip');
  await act(async () => tree.unmount());
});
it('preserves the Event detail endpoint and canonical read marking for Event routes', async () => {
  let tree!: ReturnType<typeof renderer.create>;
  await act(async () => {
    tree = renderer.create(createElement(Probe, {}));
  });
  expect(reads.map(row => row.name)).toEqual(['posts/queries:getPostDetail']);
  expect(pages).toHaveBeenCalledWith('skip');
  expect(writes).toHaveBeenCalledWith({ postId });
  expect(result?.canEdit).toBe(true);
  await act(async () => tree.unmount());
});
