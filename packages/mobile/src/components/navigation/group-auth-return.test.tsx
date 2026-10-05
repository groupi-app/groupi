import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { act, createElement, type ReactNode } from 'react';
import { getFunctionName } from 'convex/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
interface NativeNode {
  props: Record<string, unknown>;
}
interface Mounted {
  root: {
    findByProps: (props: Record<string, unknown>) => NativeNode;
    findByType: (type: string) => NativeNode;
  };
  update: (element: ReactNode) => void;
  unmount: () => void;
}
const renderer = require(
  require.resolve('react-test-renderer', {
    paths: [
      dirname(require.resolve('@testing-library/react-native/package.json')),
    ],
  })
) as { create: (element: ReactNode) => Mounted };
const external = vi.hoisted(() => ({
  route: {
    pathname: '/callback',
    segments: ['(auth)'],
    params: {
      cookie: 'better-auth.session_token=test-token; Path=/; HttpOnly',
      returnTo: '/g/group-123',
    },
  },
  session: {
    isAuthenticated: false,
    isLoading: false,
    needsOnboarding: null as boolean | null,
    user: null,
  },
  subscribers: new Set<() => void>(),
  getSession: vi.fn(),
  secureStore: new Map<string, string>(),
  completeOnboarding: vi.fn(),
  replace: vi.fn(),
}));
vi.unmock('react');
vi.unmock('convex/react');
vi.unmock('convex/_generated/api');
vi.unmock('@convex-dev/better-auth/react');
vi.unmock('../../providers/convex-provider');
vi.mock('expo-router', () => ({
  router: { replace: external.replace },
  useLocalSearchParams: () => external.route.params,
  useGlobalSearchParams: () => external.route.params,
  usePathname: () => external.route.pathname,
  useSegments: () => external.route.segments,
  Redirect: ({ href }: { href: unknown }) =>
    createElement('Redirect', { href }),
  Stack: Object.assign(
    ({ children }: { children: ReactNode }) =>
      createElement('Stack', null, children),
    { Screen: 'Screen' }
  ),
}));
vi.unmock('../../context/global-user-context');
vi.unmock('../../lib/native-auth-actions');
vi.mock('expo-secure-store', () => ({
  getItem: (key: string) => external.secureStore.get(key) ?? null,
  setItem: (key: string, value: string) => external.secureStore.set(key, value),
}));
vi.mock('../../lib/convex', () => ({
  convex: {
    watchQuery: (query: Parameters<typeof getFunctionName>[0]) => ({
      localQueryResult: () =>
        getFunctionName(query) === 'users/queries:checkNeedsOnboarding'
          ? external.session.needsOnboarding
          : getFunctionName(query) === 'auth/queries:getCurrentUserAndPerson'
            ? userAndPerson
            : { available: true },
      onUpdate: (listener: () => void) => {
        external.subscribers.add(listener);
        return () => external.subscribers.delete(listener);
      },
      journal: () => undefined,
    }),
    mutation: (_ref: unknown, args: unknown) =>
      external.completeOnboarding(args),
    setAuth: (_fetch: unknown, onChange: (authenticated: boolean) => void) =>
      onChange(true),
    clearAuth: vi.fn(),
  },
}));
const userAndPerson = {
  user: { id: 'user-123' },
  person: { _id: 'person-123' },
};
function authSession() {
  return {
    data: external.session.isAuthenticated
      ? { user: userAndPerson.user, session: { id: 'session-123' } }
      : null,
    isPending: external.session.isLoading,
  };
}
vi.mock('../../lib/auth-client', () => ({
  useSession: authSession,
  authClient: {
    getSession: external.getSession,
    useSession: authSession,
    convex: { token: async () => ({ data: null }) },
  },
}));
vi.mock('../molecules/loading-state', () => ({ LoadingState: 'LoadingState' }));
vi.mock('../ui/text', () => ({ Text: 'Text' }));
vi.mock('../ui/button', () => ({ Button: 'Button' }));
vi.mock('../ui/safe-area-view', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('../ui/labeled-input', () => ({ LabeledInput: 'Input' }));
vi.mock('../ui/labeled-textarea', () => ({ LabeledTextarea: 'Textarea' }));
import { GlobalUserProvider } from '../../context/global-user-context';
import { ConvexClientProvider } from '../../providers/convex-provider';
import { RootNavigator } from './root-navigator';
import NativeAuthCallbackScreen from '../../../app/(auth)/callback';
import OnboardingScreen from '../../../app/onboarding';

function screen(component: () => ReactNode) {
  return createElement(
    ConvexClientProvider,
    null,
    createElement(GlobalUserProvider, null, createElement(component))
  );
}

function follow(
  destination: string | { pathname: string; params?: Record<string, string> }
) {
  external.route.pathname =
    typeof destination === 'string' ? destination : destination.pathname;
  external.route.segments = [
    external.route.pathname === '/onboarding'
      ? 'onboarding'
      : external.route.pathname.startsWith('/g/')
        ? 'g'
        : '(auth)',
  ];
  external.route.params = (
    typeof destination === 'string' ? {} : (destination.params ?? {})
  ) as typeof external.route.params;
}

describe('production Group auth return screens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    external.route = {
      pathname: '/callback',
      segments: ['(auth)'],
      params: {
        cookie: 'better-auth.session_token=test-token; Path=/; HttpOnly',
        returnTo: '/g/group-123',
      },
    };
    external.session = {
      isAuthenticated: false,
      isLoading: false,
      needsOnboarding: null,
      user: null,
    };
    external.secureStore.clear();
    external.getSession.mockResolvedValue({
      data: { user: { id: 'user-123' }, session: { id: 'session-123' } },
    });
    external.completeOnboarding.mockResolvedValue(null);
  });

  it('completes callback then the actual session guard allows an existing member back to the Group landing', async () => {
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(NativeAuthCallbackScreen));
    });
    expect(external.getSession).toHaveBeenCalledOnce();
    expect(
      JSON.parse(external.secureStore.get('groupi_cookie')!)[
        'better-auth.session_token'
      ].value
    ).toBe('test-token');
    expect(external.replace).toHaveBeenCalledWith('/g/group-123');
    follow(external.replace.mock.calls[0][0]);
    external.session = {
      ...external.session,
      isAuthenticated: true,
      needsOnboarding: false,
    };
    await act(async () => {
      mounted!.update(screen(RootNavigator));
    });
    expect(mounted!.root.findByType('Stack')).toBeDefined();
    await act(async () => mounted!.unmount());
  });

  it.each([
    '/groups/group-123/apply',
    '/groups/group-123/applications',
    '/groups/group-123/events',
  ])(
    'preserves bounded %s through callback, session guard, and onboarding',
    async returnTo => {
      external.route.params.returnTo = returnTo;
      let mounted: Mounted;
      await act(async () => {
        mounted = renderer.create(screen(NativeAuthCallbackScreen));
      });
      expect(external.replace).toHaveBeenLastCalledWith(returnTo);
      follow(returnTo);
      external.route.segments = ['groups'];
      external.session.isAuthenticated = true;
      external.session.needsOnboarding = true;
      await act(async () => {
        mounted!.update(screen(RootNavigator));
      });
      const redirect = mounted!.root.findByType('Redirect');
      expect(redirect.props.href).toEqual({
        pathname: '/onboarding',
        params: { returnTo },
      });
      follow(redirect.props.href as Parameters<typeof follow>[0]);
      await act(async () => {
        mounted!.update(screen(OnboardingScreen));
      });
      await act(async () => {
        (
          mounted!.root.findByProps({ label: 'Username *' }).props
            .onChangeText as (value: string) => void
        )('reader');
      });
      await act(async () => {
        await (
          mounted!.root.findByType('Button').props
            .onPress as () => Promise<void>
        )();
      });
      expect(external.replace).toHaveBeenLastCalledWith(returnTo);
      follow(returnTo);
      external.route.segments = ['groups'];
      external.session.needsOnboarding = false;
      await act(async () => {
        for (const listener of external.subscribers) listener();
        mounted!.update(screen(RootNavigator));
      });
      expect(mounted!.root.findByType('Stack')).toBeDefined();
      await act(async () => mounted!.unmount());
    }
  );

  it('preserves the Group landing after the actual onboarding submit handler completes', async () => {
    external.session = {
      ...external.session,
      isAuthenticated: true,
      needsOnboarding: true,
    };
    follow('/g/group-123');
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(RootNavigator));
    });
    const redirect = mounted!.root.findByType('Redirect');
    expect(redirect.props.href).toEqual({
      pathname: '/onboarding',
      params: { returnTo: '/g/group-123' },
    });
    follow(redirect.props.href as Parameters<typeof follow>[0]);
    await act(async () => {
      mounted!.update(screen(OnboardingScreen));
    });
    const input = mounted!.root.findByProps({ label: 'Username *' });
    await act(async () => {
      (input.props.onChangeText as (value: string) => void)('bookreader');
    });
    const submit = mounted!.root.findByType('Button');
    await act(async () => {
      await (submit.props.onPress as () => Promise<void>)();
    });
    expect(external.completeOnboarding).toHaveBeenCalledWith({
      username: 'bookreader',
      displayName: undefined,
      pronouns: undefined,
      bio: undefined,
    });
    expect(external.replace).toHaveBeenLastCalledWith('/g/group-123');
    follow(external.replace.mock.calls.at(-1)![0]);
    external.session.needsOnboarding = false;
    await act(async () => {
      for (const listener of external.subscribers) listener();
      mounted!.update(screen(RootNavigator));
    });
    expect(mounted!.root.findByType('Stack')).toBeDefined();
    await act(async () => mounted!.unmount());
  });
});

describe('production private questionnaire auth return', () => {
  it.each([
    '/groups/group-123/questionnaire',
    '/groups/group-123/questionnaire/settings',
    '/groups/group-123/questionnaire/answers',
    '/groups/group-123/questionnaire/history',
  ])('protects %s and finishes actual auth callback return', async path => {
    vi.clearAllMocks();
    external.route.pathname = path;
    external.route.segments = ['groups'];
    external.route.params = {} as typeof external.route.params;
    external.session = {
      isAuthenticated: false,
      isLoading: false,
      needsOnboarding: null,
      user: null,
    };
    external.getSession.mockResolvedValue({
      data: { user: { id: 'user-123' }, session: { id: 'session-123' } },
    });
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(RootNavigator));
    });
    const destination = mounted!.root.findByType('Redirect').props.href;
    expect(destination).toEqual({
      pathname: '/(auth)/sign-in',
      params: { returnTo: path },
    });
    external.route.pathname = '/callback';
    external.route.segments = ['(auth)'];
    external.route.params = {
      cookie: 'better-auth.session_token=test-token; Path=/; HttpOnly',
      returnTo: path,
    };
    await act(async () => {
      mounted!.update(screen(NativeAuthCallbackScreen));
    });
    expect(external.replace).toHaveBeenLastCalledWith(path);
    external.route.pathname = path;
    external.route.segments = ['groups'];
    external.route.params = {} as typeof external.route.params;
    external.session.isAuthenticated = true;
    external.session.needsOnboarding = false;
    await act(async () => {
      mounted!.update(screen(RootNavigator));
    });
    expect(mounted!.root.findByType('Stack')).toBeDefined();
    await act(async () => mounted!.unmount());
  });
  it('actual onboarding preserves questionnaire history return', async () => {
    vi.clearAllMocks();
    external.session = {
      isAuthenticated: true,
      isLoading: false,
      needsOnboarding: true,
      user: null,
    };
    external.route.pathname = '/groups/group-123/questionnaire/history';
    external.route.segments = ['groups'];
    external.route.params = {} as typeof external.route.params;
    external.completeOnboarding.mockResolvedValue(null);
    let mounted: Mounted;
    await act(async () => {
      mounted = renderer.create(screen(RootNavigator));
    });
    const redirect = mounted!.root.findByType('Redirect').props.href;
    expect(redirect).toEqual({
      pathname: '/onboarding',
      params: { returnTo: '/groups/group-123/questionnaire/history' },
    });
    follow(redirect as Parameters<typeof follow>[0]);
    await act(async () => {
      mounted!.update(screen(OnboardingScreen));
    });
    await act(async () => {
      (
        mounted!.root.findByProps({ label: 'Username *' }).props
          .onChangeText as (value: string) => void
      )('returningreader');
    });
    await act(async () => {
      await (
        mounted!.root.findByType('Button').props.onPress as () => Promise<void>
      )();
    });
    expect(external.replace).toHaveBeenLastCalledWith(
      '/groups/group-123/questionnaire/history'
    );
    await act(async () => mounted!.unmount());
  });
});
