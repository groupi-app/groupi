import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { ConvexHttpClient } from 'convex/browser';
import { getFunctionName } from 'convex/server';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import GroupQuestionnairePage from '@/app/(groups)/groups/[groupId]/questionnaire/page';
import SignInPage from '@/app/(auth)/sign-in/[[...sign-in]]/page';
import { OnboardingContent } from '@/app/(auth)/onboarding/onboarding-content';
import { OnboardingGuard } from '@/app/(auth)/onboarding/components/onboarding-guard';
import { OnboardingRedirectWrapper } from '@/components/onboarding-redirect-wrapper';
import { GlobalUserProvider } from '@/context/global-user-context';
import { GroupLanding } from './group-landing';
import type { Id } from '@/convex/_generated/dataModel';

vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
// Next resolves this alias for legacy dynamic require; bridge that resolution in Vitest.
const legacyAlias = await vi.hoisted(async () => {
  vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', 'https://fixture.convex.cloud');
  const { default: Module } = await import('node:module');
  const { resolve } = await import('node:path');
  const resolver = Module as typeof Module & {
    _resolveFilename: (request: string, ...args: unknown[]) => string;
  };
  const original = resolver._resolveFilename;
  const apiPath = resolve(process.cwd(), '../../convex/_generated/api.js');
  resolver._resolveFilename = function (request, ...args) {
    return original.call(
      this,
      request === '@/convex/_generated/api' ? apiPath : request,
      ...args
    );
  };
  return () => {
    resolver._resolveFilename = original;
  };
});
const external = vi.hoisted(() => ({
  path: '/sign-in?redirect=%2Fg%2Fgroup-one',
  navigate: (path: string): void => {
    throw new Error(`Router not mounted: ${path}`);
  },
  session: null as { user: { id: string } } | null,
  needsOnboarding: true,
  magicLink: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useParams: () => ({ groupId: 'group-one' }),
  useRouter: () => ({ push: external.navigate, replace: external.navigate }),
  usePathname: () => new URL(external.path, 'https://fixture.local').pathname,
  useSearchParams: () =>
    new URL(external.path, 'https://fixture.local').searchParams,
}));
vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({ data: external.session, isPending: false }),
  sendMagicLinkWithEmailOrUsername: external.magicLink,
  signIn: { social: vi.fn() },
  authClient: { signIn: { passkey: vi.fn() } },
}));
afterAll(() => legacyAlias());
const landing = {
  groupId: 'group-one',
  name: 'Neighbors',
  description: 'Our block',
  image: null,
};
const existingUser = {
  user: {
    _id: 'user-one',
    email: 'member@example.com',
    name: 'Member',
    image: null,
    username: 'member',
    role: 'user',
  },
  person: { _id: 'person-one', bio: null },
  needsOnboarding: false,
};
const newUser = {
  ...existingUser,
  user: { ...existingUser.user, username: null },
  person: null,
  needsOnboarding: true,
};
const fetchAccessToken = async () => 'fixture-token';
function useExternalAuth() {
  return {
    isLoading: false,
    isAuthenticated: external.session !== null,
    fetchAccessToken,
  };
}

function FixtureRoutes({ client }: { client: ConvexReactClient }) {
  const [path, setPath] = useState(external.path);
  external.path = path;
  external.navigate = setPath;
  const pathname = new URL(path, 'https://fixture.local').pathname;
  return (
    <ConvexProviderWithAuth client={client} useAuth={useExternalAuth}>
      <GlobalUserProvider>
        <OnboardingRedirectWrapper />
        {pathname === '/sign-in' ? (
          <SignInPage />
        ) : pathname === '/onboarding' ? (
          <OnboardingGuard>
            <OnboardingContent />
          </OnboardingGuard>
        ) : pathname.endsWith('/questionnaire') ? (
          <GroupQuestionnairePage />
        ) : (
          <GroupLanding groupId={'group-one' as Id<'groups'>} />
        )}
      </GlobalUserProvider>
    </ConvexProviderWithAuth>
  );
}

describe('Group landing authentication return through production routes', () => {
  beforeEach(() => {
    external.path = '/sign-in?redirect=%2Fg%2Fgroup-one';
    external.session = null;
    external.magicLink.mockReset();
    external.magicLink.mockResolvedValue({ error: null });
  });
  it.each([
    { account: 'existing account', destination: '/g/group-one' },
    { account: 'new account', destination: '/g/group-one' },
    {
      account: 'existing account',
      destination: '/groups/group-one/questionnaire',
    },
    { account: 'new account', destination: '/groups/group-one/questionnaire' },
  ])(
    'returns $account to $destination after email authentication',
    async ({ account, destination }) => {
      external.path = `/sign-in?redirect=${encodeURIComponent(destination)}`;
      external.needsOnboarding = account === 'new account';
      const client = new ConvexReactClient('https://fixture.convex.cloud', {
        unsavedChangesWarning: false,
      });
      vi.spyOn(client, 'setAuth').mockImplementation(
        (_fetchToken, onChange) => {
          onChange?.(true);
        }
      );
      vi.spyOn(client, 'clearAuth').mockImplementation(() => {});
      const listeners = new Set<() => void>();
      vi.spyOn(client, 'watchQuery').mockImplementation((...[query]) => ({
        onUpdate: listener => {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
        journal: () => undefined,
        localQueryResult: () => {
          const name = getFunctionName(query);
          if (name === 'users/queries:getCurrentUserData')
            return external.needsOnboarding ? newUser : existingUser;
          if (name === 'users/queries:checkNeedsOnboarding')
            return external.needsOnboarding;
          if (name === 'auth/queries:getCurrentUser') return existingUser.user;
          if (name === 'groups/queries:getGroupLanding') return landing;
          if (
            name === 'groupQuestionnaires/queries:getJoiningQuestionnaireAccess'
          )
            return {
              canRead: destination.endsWith('/questionnaire'),
              hasRecord: true,
              isMember: false,
            };
          if (name === 'groupQuestionnaires/queries:getJoiningQuestionnaire')
            return {
              groupId: 'group-one',
              enabled: false,
              version: 1,
              questions: [],
              answers: {},
              savedQuestions: [],
              completed: true,
              shouldPrompt: false,
              canEdit: false,
              canConfigure: false,
              canReview: false,
            };
          if (
            name === 'groups/queries:getGroup' ||
            name === 'groupInvites/queries:getMyGroupInviteForGroup'
          )
            return null;
          throw new Error(`Unexpected query ${name}`);
        },
      }));
      const mutation = vi
        .spyOn(client, 'mutation')
        .mockImplementation(async () => {
          external.needsOnboarding = false;
          listeners.forEach(listener => listener());
          return null;
        });
      const availability = vi
        .spyOn(ConvexHttpClient.prototype, 'query')
        .mockResolvedValue({ available: true });
      const mounted = render(<FixtureRoutes client={client} />);
      const user = userEvent.setup();
      await user.type(
        screen.getByLabelText('Email or username'),
        'member@example.com'
      );
      await user.click(
        screen.getByRole('button', { name: 'Continue with email' })
      );
      await screen.findByText('Check your email');
      const callback = external.magicLink.mock.calls[0][0]
        .callbackURL as string;
      // The external auth service decodes the callback once before navigation.
      external.session = { user: { id: 'user-one' } };
      const { act } = await import('@testing-library/react');
      await act(async () => external.navigate(decodeURIComponent(callback)));
      if (account === 'new account') {
        await user.type(
          await screen.findByLabelText('Username *'),
          'newmember'
        );
        await screen.findByText('Username is available');
        await user.click(
          screen.getByRole('button', { name: 'Complete Setup' })
        );
        await waitFor(() => expect(mutation).toHaveBeenCalled());
        expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
          'users/mutations:completeOnboarding'
        );
        expect(mutation.mock.calls[0][1]).toMatchObject({
          username: 'newmember',
        });
        expect(availability).toHaveBeenCalled();
      }
      await screen.findByRole('heading', {
        name: destination.endsWith('/questionnaire')
          ? 'Your Group questionnaire records'
          : 'Neighbors',
      });
      expect(external.path).toBe(destination);
      mounted.unmount();
      availability.mockRestore();
      await client.close();
    }
  );
});
