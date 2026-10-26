/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useSyncExternalStore } from 'react';
const listeners = new Set<() => void>();
let version = 0;
function emit() {
  version++;
  for (const fn of listeners) fn();
}
function useVersion() {
  useSyncExternalStore(
    fn => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => version
  );
}
const params = new URLSearchParams(location.search);
const manager = !params.has('normal');
const initial = {
  _id: 'post-one',
  groupId: 'group-one',
  eventId: 'event-one',
  title:
    'Planning a welcoming afternoon with the entire community and our visiting friends',
  content:
    '<p>Our existing post remains readable with a long description about getting everyone together comfortably and accessibly.</p>',
  authorId: 'person-one',
  authorName: 'Alexandria Community Coordinator 長い名前',
  createdAt: 1700000000000,
  attachments: [],
  replyCount: 1,
  canEdit: true,
  canDelete: manager,
  canSetRepliesDisabled: manager || params.has('author'),
  canPin: manager,
  viewerPersonId: 'person-one',
  repliesDisabled: params.has('locked'),
  repliesRevision: 0,
  pinRevision: 0,
};
let post: any =
  JSON.parse(localStorage.getItem('post-controls') || 'null') || initial;
const calls: any[] = [];
let failure = '';
let delay = 250;
const noop = async () => {};
function save() {
  localStorage.setItem('post-controls', JSON.stringify(post));
  emit();
}
async function mutate(kind: string, args: any) {
  calls.push({ kind, args });
  await new Promise(r => setTimeout(r, delay));
  if (failure) {
    const message = failure;
    failure = '';
    throw new Error(message);
  }
  if (kind === 'replies') {
    post = {
      ...post,
      repliesDisabled: args.repliesDisabled,
      repliesRevision: post.repliesRevision + 1,
    };
  } else if (kind === 'pin') {
    post = {
      ...post,
      pinnedAt: args.pinned ? 1700000000000 : undefined,
      pinRevision: post.pinRevision + 1,
    };
  }
  save();
  return kind === 'replies'
    ? { revision: post.repliesRevision, repliesDisabled: post.repliesDisabled }
    : { revision: post.pinRevision, pinned: post.pinnedAt !== undefined };
}
export const useSetPostRepliesDisabled = () => async (args: any) =>
  mutate('replies', args);
export const useSetPostPinned = () => async (args: any) => mutate('pin', args);
export function useFixturePost() {
  useVersion();
  return post;
}
export function useGroupPost(args: any) {
  useVersion();
  return args === 'skip' ? undefined : post;
}
export function useGroupPosts() {
  useVersion();
  return {
    page: params.has('pins') ? [post, ...pins()] : [post],
    isDone: true,
  };
}
export const useGroup = () => ({
  _id: 'group-one',
  canManage: manager,
  role: manager ? 'OWNER' : 'MEMBER',
  joiningQuestionnaire: { canAccessMemberContent: true },
});
export const useGroupPostReplies = () => ({
  page: [
    {
      _id: 'reply-old',
      authorName: 'A long-standing participant 参加者',
      content:
        '<p>This existing reply remains readable after replies are locked.</p>',
      createdAt: 1700000010000,
      attachments: [],
      canEdit: false,
      canDelete: false,
    },
  ],
  isDone: true,
});
export const useCreateGroupPost = () => async (args: any) => {
  calls.push({ kind: 'create', args });
  post = { ...post, ...args };
  save();
  return post._id;
};
export const useUpdateGroupPost = () => async (args: any) => {
  calls.push({ kind: 'update', args });
  post = { ...post, ...args };
  save();
};
export const useDeleteGroupPost = () => noop;
export const useCreateGroupPostReply = () => noop;
export const useUpdateGroupPostReply = () => noop;
export const useDeleteGroupPostReply = () => noop;
export const useIsActive = () => false;
export const useCurrentUserPostPresence = () => ({ roomToken: undefined });
export const useTypingIndicators = () => [];
export const useCurrentUserTypingState = () => ({ setTyping: () => {} });
export const useQuery = () => ({ isMuted: false });
export const useMutation = () => noop;
export const useConvexAuth = () => ({
  isAuthenticated: true,
  isLoading: false,
});
export const useAttachments = () => ({
  pendingUploads: [],
  isUploading: false,
  uploadAll: async () => [],
  clearAll: () => {},
  addFiles: async () => ({ errors: [] }),
  removeFile: () => {},
  toggleSpoiler: () => {},
  updateFile: () => {},
});
export const useFileUpload = () => ({});
export const useInviteListNavigationGuard = () => {};
export const useRouter = () => ({
  push: () => {},
  back: () => {},
  refresh: () => {},
});
export const usePathname = () => location.pathname;
export const useSearchParams = () => params;
export function Link({ href, children, ...props }: any) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
export const authClient = {
  useSession: () => ({ data: { user: { id: 'synthetic-user' } } }),
};
export const useSession = authClient.useSession;
export const useIsPostMutedFromContext = () => ({
  isMuted: false,
  setOptimisticMuted: () => {},
});
export const useTogglePostMute = () => noop;
export const useGlobalUser = () => ({
  person: { _id: 'person-one' },
  user: { id: 'synthetic-user' },
});
export function Editor({ content, onChange, disabled }: any) {
  return (
    <textarea
      aria-label='Synthetic rich text editor'
      className='w-full rounded-md border p-3'
      value={content}
      disabled={disabled}
      onChange={event => onChange(event.target.value)}
    />
  );
}
(window as any).postControlsFixture = {
  state: () => ({ post, calls }),
  switchPost: () => {
    post = {
      ...initial,
      _id: 'post-two',
      title: 'A different post on the same component',
      repliesDisabled: false,
      repliesRevision: 0,
      pinRevision: 0,
      pinnedAt: undefined,
    };
    save();
  },
  fail: (message: string) => {
    failure = message;
  },
  delay: (ms: number) => {
    delay = ms;
  },
};

export const BlockNoteEditor = Editor;
export const ALLOWED_MIME_TYPES = ['image/png'];

function pins() {
  return [1, 2, 3].map(n => ({
    ...post,
    _id: `pinned-${n}`,
    title: `Pinned announcement ${n}`,
    pinnedAt: 1700000000000 + n,
    canPin: manager,
    canSetRepliesDisabled: manager,
  }));
}
export function usePinnedGroupPosts() {
  useVersion();
  return params.has('pins') ? pins() : post.pinnedAt ? [post] : [];
}
export function usePinnedEventPosts() {
  return usePinnedGroupPosts().map(row => ({
    ...eventPost(),
    ...row,
    _creationTime: row.createdAt,
    author: { kind: 'integration', user: { name: row.authorName } },
    recentReplyAuthors: [],
  }));
}

export const useIsPostMuted = () => ({ isMuted: false });
export function eventPost() {
  return {
    ...post,
    _creationTime: post.createdAt,
    author: {
      _id: 'person-one',
      kind: 'integration',
      user: { name: post.authorName },
    },
    event: { _id: 'event-one', title: 'Synthetic Event', memberships: [] },
    replies: [],
  };
}
export const useDeletePost = () => async () => {};

export function MutedPostsProvider({ children }: any) {
  return children;
}
export function EventToolScope({ children }: any) {
  return children;
}
