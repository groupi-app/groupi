import { createRequire } from 'node:module';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { api } from '../../../../../convex/_generated/api';
import { createGroupPostHooks } from '../useGroupPosts';

const nativeRequire = createRequire(
  new URL('../../../../mobile/package.json', import.meta.url)
);
const renderer = nativeRequire(
  nativeRequire.resolve('react-test-renderer', {
    paths: [nativeRequire.resolve('@testing-library/react-native')],
  })
);
const groupId = 'parent-group' as Id<'groups'>;
const postId = 'canonical-post' as Id<'posts'>;
const replyId = 'canonical-reply' as Id<'replies'>;
const paginationOpts = { numItems: 20, cursor: null };
const attachment = {
  storageId: 'uploaded-file' as Id<'_storage'>,
  filename: 'notes.txt',
  size: 5,
  mimeType: 'text/plain',
};
const attachmentId = 'saved-attachment' as Id<'attachments'>;

describe('Group Post hooks with actual application SDK providers', () => {
  beforeEach(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true));
  afterEach(() => vi.unstubAllGlobals());

  for (const platform of ['web', 'mobile']) {
    it(`binds live canonical threads and attachment mutations to the ${platform} provider client`, async () => {
      const appRequire = createRequire(
        new URL(`../../../../${platform}/package.json`, import.meta.url)
      );
      // Load the application's installed SDK rather than mocking its React hooks.
      const appSdk = appRequire('convex/react');
      const { getFunctionName } = appRequire('convex/server');
      const hooks = createGroupPostHooks(api, appSdk);
      const results = new Map<string, unknown>();
      const subscriptions = new Map<string, Set<() => void>>();
      const client = {
        watchQuery: vi.fn((reference: unknown, _args: unknown) => {
          const name = getFunctionName(reference);
          return {
            localQueryResult: () => results.get(name),
            onUpdate(callback: () => void) {
              const listeners = subscriptions.get(name) ?? new Set();
              listeners.add(callback);
              subscriptions.set(name, listeners);
              return () => listeners.delete(callback);
            },
            journal: () => undefined,
          };
        }),
        mutation: vi.fn(async (reference: unknown, _args: unknown) => {
          const name = getFunctionName(reference);
          if (name === 'groupPosts/mutations:createPost') return postId;
          if (name === 'groupPosts/mutations:createReply') return replyId;
          return null;
        }),
      };
      let mutations: {
        createPost: ReturnType<typeof hooks.useCreateGroupPost>;
        updatePost: ReturnType<typeof hooks.useUpdateGroupPost>;
        deletePost: ReturnType<typeof hooks.useDeleteGroupPost>;
        createReply: ReturnType<typeof hooks.useCreateGroupPostReply>;
        updateReply: ReturnType<typeof hooks.useUpdateGroupPostReply>;
        deleteReply: ReturnType<typeof hooks.useDeleteGroupPostReply>;
      };
      let observed: { feed: unknown; post: unknown; replies: unknown };
      let tree: { unmount: () => void } | undefined;
      function ThreadProbe() {
        observed = {
          feed: hooks.useGroupPosts({ groupId, paginationOpts }),
          post: hooks.useGroupPost({ postId }),
          replies: hooks.useGroupPostReplies({ postId, paginationOpts }),
        };
        mutations = {
          createPost: hooks.useCreateGroupPost(),
          updatePost: hooks.useUpdateGroupPost(),
          deletePost: hooks.useDeleteGroupPost(),
          createReply: hooks.useCreateGroupPostReply(),
          updateReply: hooks.useUpdateGroupPostReply(),
          deleteReply: hooks.useDeleteGroupPostReply(),
        };
        return null;
      }
      try {
        await renderer.act(async () => {
          tree = renderer.create(
            createElement(
              appSdk.ConvexProvider,
              { client },
              createElement(ThreadProbe)
            )
          );
        });
        expect(observed!).toEqual({
          feed: undefined,
          post: undefined,
          replies: undefined,
        });
        const watchCalls = client.watchQuery.mock.calls.map(
          ([reference, args]) => [getFunctionName(reference), args]
        );
        expect(watchCalls).toEqual(
          expect.arrayContaining([
            ['groupPosts/queries:listPosts', { groupId, paginationOpts }],
            ['groupPosts/queries:getPost', { postId }],
            ['groupPosts/queries:listReplies', { postId, paginationOpts }],
          ])
        );
        expect(
          [...subscriptions.values()].every(listeners => listeners.size > 0)
        ).toBe(true);

        const post = {
          _id: postId,
          groupId,
          title: 'Plans',
          attachments: [attachment],
        };
        const reply = { _id: replyId, postId, text: 'Bring notes' };
        const feed = { page: [post], isDone: true, continueCursor: '' };
        const replies = { page: [reply], isDone: true, continueCursor: '' };
        await renderer.act(async () => {
          results.set('groupPosts/queries:listPosts', feed);
          results.set('groupPosts/queries:getPost', post);
          results.set('groupPosts/queries:listReplies', replies);
          for (const listeners of subscriptions.values())
            for (const notify of listeners) notify();
        });
        expect(observed!).toEqual({ feed, post, replies });

        // Call the actual SDK mutation closures. This catches use of a different
        // context and accidental routing to Event endpoints or old storage IDs.
        const createPost = {
          groupId,
          title: 'Plans',
          content: '',
          attachments: [attachment],
        };
        const updatePost = {
          postId,
          content: '<p>Updated</p>',
          attachmentsToAdd: [attachment],
          attachmentIdsToDelete: [attachmentId],
        };
        const createReply = { postId, content: '', attachments: [attachment] };
        const updateReply = {
          replyId,
          content: '<p>Revised</p>',
          attachmentsToAdd: [attachment],
          attachmentIdsToDelete: [attachmentId],
        };
        expect(await mutations!.createPost(createPost)).toBe(postId);
        await mutations!.updatePost(updatePost);
        expect(await mutations!.createReply(createReply)).toBe(replyId);
        await mutations!.updateReply(updateReply);
        await mutations!.deleteReply({ replyId });
        await mutations!.deletePost({ postId });
        expect(
          client.mutation.mock.calls.map(([reference, args]) => [
            getFunctionName(reference),
            args,
          ])
        ).toEqual([
          ['groupPosts/mutations:createPost', createPost],
          ['groupPosts/mutations:updatePost', updatePost],
          ['groupPosts/mutations:createReply', createReply],
          ['groupPosts/mutations:updateReply', updateReply],
          ['groupPosts/mutations:deleteReply', { replyId }],
          ['groupPosts/mutations:deletePost', { postId }],
        ]);
      } finally {
        await renderer.act(async () => tree?.unmount());
      }
      expect(
        [...subscriptions.values()].every(listeners => listeners.size === 0)
      ).toBe(true);
    });
  }
});
