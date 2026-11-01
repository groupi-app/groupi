/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useSyncExternalStore } from 'react';
import { getFunctionName } from 'convex/server';
const params = new URLSearchParams(location.search);
const empty = params.has('empty');
export const keyName =
  'Community schedule reader with a deliberately long, recognizable identity 長い名前';
export const appName =
  'Community calendar companion for everyone in the neighborhood 長いアプリ名';
export const legacyName =
  'Older account automation retained for continuity and careful manual review';
const groups = [
  {
    groupId: 'group-one',
    name: 'Friends of the community garden and neighborhood library 長いグループ名',
    canWithdraw: true,
  },
  {
    groupId: 'group-two',
    name: 'Accessible afternoon walks and shared meals for everyone',
    canWithdraw: true,
  },
];
const initial = {
  revision: 'r1',
  role: 'ORGANIZER',
  details: {
    title:
      'An afternoon gathering with everyone from our neighborhood community',
    description: empty
      ? ''
      : 'Bring a picnic and share ideas for a welcoming afternoon together.',
    location: empty ? '' : 'The community garden and accessible meeting room',
    visibility: params.has('friendsBase') ? 'FRIENDS' : 'PRIVATE',
    imageUrl: null,
  },
  permissions: {
    createPosts: 'EVERYONE',
    inviteMembers: 'MODERATOR',
    viewAttendeeList: 'EVERYONE',
  },
  admissionPolicy: empty ? 'INVITATION_ONLY' : 'APPLY',
  applications: {
    questions: empty
      ? []
      : [
          {
            id: 'access',
            label:
              'What would help you feel comfortable and included during the gathering?',
            type: 'LONG_ANSWER',
            required: false,
          },
        ],
    reviewerPolicy: 'ORGANIZERS_AND_MODERATORS',
  },
  audiences: {
    friendsShared: params.has('friendsBase') ? true : !empty,
    canManageEvent: true,
    groups: empty ? [] : [groups[0]],
  },
  date: { options: [] },
  addons: [],
};
const state = {
  snapshot:
    JSON.parse(localStorage.getItem('management-event-snapshot') || 'null') ||
    initial,
  calls: [] as any[],
  credentialCalls: [] as string[],
  failNext: false,
  delay: false,
};
const subscribers = new Set<() => void>();
let version = 0;
let route = location.pathname;
function publish() {
  version++;
  subscribers.forEach(cb => cb());
}
function useFixture() {
  useSyncExternalStore(
    cb => {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
    () => version
  );
  return state;
}
const emitRoute = () => {
  route = location.pathname;
  publish();
};
window.addEventListener('popstate', emitRoute);
function navigate(href: string) {
  history.pushState({}, '', href);
  emitRoute();
}
export const usePathname = () => {
  useFixture();
  return route;
};
export const useRouter = () => ({
  push: navigate,
  replace: (href: string) => {
    history.replaceState({}, '', href);
    emitRoute();
  },
  back: () => history.back(),
  refresh: () => {},
});
export function Link({ href, children, onClick, ...props }: any) {
  return (
    <a
      href={href}
      {...props}
      onClick={event => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          event.preventDefault();
          navigate(href);
        }
      }}
    >
      {children}
    </a>
  );
}
export const useEventSettings = (args: any) => {
  useFixture();
  return args === 'skip' ? undefined : state.snapshot;
};
export const useEventSettingsAudienceOptions = (args: any) => ({
  page: groups.filter(
    group =>
      !args.search ||
      group.name.toLowerCase().includes(args.search.toLowerCase())
  ),
  isDone: true,
  continueCursor: '',
});
export const useSaveEventSettings = () => async (input: any) => {
  state.calls.push(input);
  if (state.delay) await new Promise(resolve => setTimeout(resolve, 300));
  if (state.failNext) {
    state.failNext = false;
    throw Error('Synthetic atomic save failed. Your edits are still here.');
  }
  if (input.expectedRevision !== state.snapshot.revision)
    throw Error('Settings changed. Review the latest version before saving.');
  const patch = input.patch;
  const effectiveAudiences = {
    ...state.snapshot.audiences,
    ...(patch.details?.visibility !== undefined &&
    patch.details.visibility !== state.snapshot.details.visibility
      ? { friendsShared: patch.details.visibility === 'FRIENDS' }
      : {}),
  };
  const next = {
    ...state.snapshot,
    ...patch,
    revision: `r${Number(state.snapshot.revision.slice(1)) + 1}`,
    details: { ...state.snapshot.details, ...patch.details },
    audiences: patch.audiences
      ? {
          ...effectiveAudiences,
          ...patch.audiences,
          groups: groups.filter(group =>
            patch.audiences.groupIds.includes(group.groupId)
          ),
        }
      : effectiveAudiences,
  };
  state.snapshot = next;
  localStorage.setItem('management-event-snapshot', JSON.stringify(next));
  publish();
  return next;
};
export const useFileUpload = () => ({
  uploadFile: async () => {
    throw Error('Cover upload is outside this read-only fixture');
  },
});
export const ALLOWED_MIME_TYPES = {
  IMAGE: ['image/png', 'image/jpeg', 'image/webp'],
};
const forbidden = (name: string) => async () => {
  state.credentialCalls.push(name);
  throw Error('Credential writes are forbidden in this read-only fixture');
};
const grants = empty
  ? []
  : [
      {
        grantId: 'grant-one',
        name: keyName,
        principalKind: 'user',
        actions: ['events.read'],
        selector: { kind: 'selected', eventIds: ['event-one'] },
        createdAt: 1793000000000,
        expiresAt: 1893000000000,
      },
    ];
const events = [
  {
    _id: 'event-one',
    title:
      'A long shared neighborhood event name for accessible planning and thoughtful collaboration',
  },
];
export const useAuthorizationGrants = () => grants;
export const useAuthorizationEvents = () => events;
export const useAuthorizationCatalog = () => [
  { action: 'events.read', description: 'Read event details' },
];
export const useAuthorizationAudit = () => [];
export const useIssueAuthorization = () => forbidden('issue');
export const useRevokeAuthorization = () => forbidden('revoke');
export const useReplaceAuthorizationBounds = () => forbidden('replace');
export const useRevokeUserCredentials = () => forbidden('recover');
export function useQuery(ref: any) {
  const name = getFunctionName(ref);
  if (name === 'delegatedApps/queries:listOwnedApps')
    return empty
      ? []
      : [
          {
            _id: 'app-one',
            name: appName,
            purpose:
              'A local synthetic application used only to inspect identity details.',
            status: 'testing',
            reviewStatus: 'not-requested',
            clientType: 'native',
            redirectUris: ['groupi-fixture://callback/long-test-route'],
          },
        ];
  if (name === 'authorization/queries:eligibleEvents') return events;
  if (name === 'delegatedApps/queries:listConnections')
    return empty
      ? []
      : [
          {
            grantId: 'connected-one',
            appName,
            actions: ['events.read'],
            selector: { kind: 'selected', eventIds: ['event-one'] },
            status: 'active',
            background: false,
          },
        ];
  throw Error(`Unmodeled read-only query ${name}`);
}
export const useMutation = (ref: any) => forbidden(getFunctionName(ref));
export const authClient = {
  apiKey: {
    list: async () => ({
      data: {
        apiKeys: empty
          ? []
          : [
              {
                id: 'legacy-one',
                name: legacyName,
                start: 'fixture-prefix',
                createdAt: 1793000000000,
                expiresAt: null,
              },
            ],
      },
    }),
    create: forbidden('legacy-create'),
    delete: forbidden('legacy-delete'),
  },
};
(window as any).managementFixture = {
  state,
  failNext: () => {
    state.failNext = true;
  },
  setDelay: (value: boolean) => {
    state.delay = value;
  },
  conflict: () => {
    state.snapshot = {
      ...state.snapshot,
      revision: 'r999',
      details: { ...state.snapshot.details, title: 'Remote competing title' },
    };
    publish();
  },
  navigate,
};
export const useConvexAuth = () => ({
  isAuthenticated: true,
  isLoading: false,
});
