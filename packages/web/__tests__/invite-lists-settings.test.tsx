import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  render,
  screen,
  waitFor,
  cleanup,
  act,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InviteListsSettings from '@/app/(settings)/settings/invite-lists/page';
import SettingsPage from '@/app/(settings)/settings/page';
import { SettingsNav } from '@/app/(settings)/settings/components/settings-nav';
import { NavigationGuardProvider } from '@/app/(settings)/settings/components/navigation-guard-context';
import { ConvexError } from 'convex/values';
import { StrictMode, useEffect, useState } from 'react';
import APIReferencePage from '@/app/docs/api/page';
import { navigationHistoryBootstrapScript } from '@/lib/navigation-history';
import { useNavigationGuard } from '@/hooks/use-navigation-guard';
import { useRegisterNavigationGuard } from '@/app/(settings)/settings/components/navigation-guard-context';
import { GlobalNavigationGuard } from '@/components/global-navigation-guard';

const boundary = vi.hoisted(() => ({
  collection: undefined as unknown,
  detail: undefined as unknown,
  search: undefined as unknown,
  profiles: undefined as unknown,
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  push: vi.fn(),
}));

vi.mock('@/convex/_generated/api', () => ({
  api: {
    inviteLists: {
      queries: {
        listInviteLists: 'lists',
        getInviteList: 'detail',
        searchPeople: 'search',
        getFriendChoices: 'friends',
        getPeopleByIds: 'profiles',
      },
      mutations: {
        createInviteList: 'create',
        updateInviteList: 'update',
        deleteInviteList: 'delete',
      },
    },
  },
}));
vi.mock('next/navigation', () => {
  const router = { push: boundary.push };
  return {
    useRouter: () => router,
    usePathname: () => '/settings/invite-lists',
  };
});
vi.mock('convex/react', () => ({
  useQuery: (query: string, args: unknown) => {
    if (args === 'skip') return undefined;
    if (query === 'lists') {
      if (boundary.collection instanceof Error) throw boundary.collection;
      return boundary.collection;
    }
    if (query === 'detail') {
      if (boundary.detail instanceof Error) throw boundary.detail;
      return boundary.detail;
    }
    if (query === 'friends') return { items: [friend] };
    if (query === 'profiles')
      return (
        boundary.profiles ?? {
          items: (args as { personIds: string[] }).personIds.map(
            personId =>
              [friend, other].find(person => person.personId === personId) ?? {
                personId,
                name: null,
                username: null,
                image: null,
                available: false,
              }
          ),
        }
      );
    if (query === 'search') {
      if (boundary.search instanceof Error) throw boundary.search;
      return boundary.search;
    }
  },
  useMutation: (mutation: string) =>
    mutation === 'update'
      ? boundary.update
      : mutation === 'delete'
        ? boundary.delete
        : boundary.create,
}));

const friend = {
  personId: 'friend',
  name: 'Ada Friend',
  username: 'ada',
  image: null,
  available: true,
};
const other = {
  personId: 'other',
  name: 'Sam Other',
  username: 'sam',
  image: null,
  available: true,
};

describe('Invite lists Settings', () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    boundary.profiles = undefined;
    boundary.collection = { items: [] };
    boundary.detail = undefined;
    boundary.search = { items: [other] };
    window.history.replaceState({}, '', '/settings/invite-lists');
    boundary.create.mockImplementation(async ({ name }) => {
      boundary.detail = {
        inviteListId: 'saved',
        name,
        personCount: 2,
        availablePersonCount: 2,
        needsAttention: false,
        createdAt: 1,
        updatedAt: 1,
        people: [friend, other],
      };
      return boundary.detail;
    });
    boundary.update.mockImplementation(async ({ name, personIds }) => {
      const detail = boundary.detail as { inviteListId: string };
      boundary.detail = {
        ...detail,
        name,
        personCount: personIds.length,
        people: [friend, other].filter(person =>
          personIds.includes(person.personId)
        ),
      };
      return boundary.detail;
    });
    boundary.delete.mockImplementation(async () => {
      boundary.collection = { items: [] };
      return { deleted: true, inviteListId: 'saved' };
    });
  });

  it('creates and inspects a private list using friends and other existing users', async () => {
    const user = userEvent.setup();
    render(<InviteListsSettings />);
    expect(screen.getByText('No invite lists yet')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Create invite list' })
    );
    expect(screen.getByLabelText('List name')).toHaveFocus();
    await user.type(screen.getByLabelText('List name'), '  Weekend people  ');
    await user.click(screen.getByRole('button', { name: 'Add Ada Friend' }));
    await user.type(screen.getByLabelText('Search by username'), 'sam');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(screen.getByRole('button', { name: 'Add Sam Other' }));
    await user.click(screen.getByRole('button', { name: 'Save list' }));
    expect(
      await screen.findByRole('heading', { name: 'Weekend people' })
    ).toHaveFocus();
    expect(screen.getByText('@ada')).toBeInTheDocument();
    expect(screen.getByText('@sam')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'List saved. No invitations were sent.'
    );
  });

  it.each(['Cancel', 'Escape'])(
    'keeps a dirty draft and restores focus after %s',
    async dismissal => {
      const user = userEvent.setup();
      render(<InviteListsSettings />);
      await user.click(
        screen.getByRole('button', { name: 'Create invite list' })
      );
      await user.type(screen.getByLabelText('List name'), 'Weekend');
      await user.click(screen.getByRole('button', { name: 'Add Ada Friend' }));
      if (dismissal === 'Escape') await user.keyboard('{Escape}');
      else await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(
        screen.getByRole('heading', { name: 'Discard this invite list?' })
      ).toHaveFocus();
      await user.click(screen.getByRole('button', { name: 'Keep Editing' }));
      expect(screen.getByLabelText('List name')).toHaveValue('Weekend');
      expect(
        screen.getByRole('button', { name: 'Remove Ada Friend' })
      ).toBeInTheDocument();
      if (dismissal === 'Cancel')
        expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
      if (dismissal === 'Escape') await user.keyboard('{Escape}');
      else await user.click(screen.getByRole('button', { name: 'Cancel' }));
      await user.click(screen.getByRole('button', { name: 'Discard' }));
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Create invite list' })
        ).toHaveFocus()
      );
      await user.click(
        screen.getByRole('button', { name: 'Create invite list' })
      );
      expect(screen.getByLabelText('List name')).toHaveValue('');
      expect(
        screen.queryByRole('button', { name: 'Remove Ada Friend' })
      ).not.toBeInTheDocument();
    }
  );

  it('protects Settings navigation and resumes the chosen destination only after Discard', async () => {
    const user = userEvent.setup();
    render(<InviteListsSettings />);
    await user.click(
      screen.getByRole('button', { name: 'Create invite list' })
    );
    await user.type(screen.getByLabelText('List name'), 'Keep me');
    await user.click(screen.getByRole('link', { name: 'Settings' }));
    expect(
      screen.getByRole('heading', { name: 'Discard this invite list?' })
    ).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Keep Editing' }));
    expect(screen.getByLabelText('List name')).toHaveValue('Keep me');
    await user.click(screen.getByRole('link', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(boundary.push).toHaveBeenCalledWith('/settings');
  });

  it('retains the existing dirty editor link and unload protection after adopting the root-head tracker', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/settings/profile');
    const releaseHead = new Function(
      `return ${navigationHistoryBootstrapScript}`
    )() as () => void;
    function ExistingEditor() {
      const [name, setName] = useState('');
      const guard = useNavigationGuard(name !== '');
      useRegisterNavigationGuard(guard);
      return (
        <>
          <label>
            Existing profile name
            <input
              value={name}
              onChange={event => setName(event.target.value)}
            />
          </label>
          <a href='/events'>Events</a>
          {guard.shouldFlash && (
            <p role='alert'>Keep your unsaved profile changes.</p>
          )}
        </>
      );
    }
    const view = render(
      <NavigationGuardProvider>
        <GlobalNavigationGuard />
        <ExistingEditor />
      </NavigationGuardProvider>
    );
    try {
      await user.type(
        screen.getByLabelText('Existing profile name'),
        'Keep existing editor'
      );
      await user.click(screen.getByRole('link', { name: 'Events' }));
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Keep your unsaved profile changes'
      );
      expect(window.location.pathname).toBe('/settings/profile');
      const unload = new Event('beforeunload', { cancelable: true });
      act(() => window.dispatchEvent(unload));
      expect(unload.defaultPrevented).toBe(true);
      expect(screen.getByLabelText('Existing profile name')).toHaveValue(
        'Keep existing editor'
      );
      // The global tracker must leave the existing bubble pop handler active.
      act(() =>
        window.dispatchEvent(
          new PopStateEvent('popstate', { state: window.history.state })
        )
      );
      expect(screen.getByLabelText('Existing profile name')).toHaveValue(
        'Keep existing editor'
      );
    } finally {
      view.unmount();
      releaseHead();
    }
  });

  it('adopts the root-head tracker after early native links and preserves dirty Back and Forward through StrictMode cleanup', async () => {
    vi.stubGlobal('navigation', undefined);
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/docs/api');
    const initialLength = window.history.length;
    // Execute the actual inline-script response before mounting client providers.
    const releaseHead = new Function(
      `return ${navigationHistoryBootstrapScript}`
    )() as (() => void) | undefined;
    const view = render(<APIReferencePage />);
    // Next registers its Window handler before a dirty editor's React effect.
    // Model the SDK's observable reload/traverse boundary, not its internals.
    const nextNavigation = vi.fn();
    const nextPop = (event: PopStateEvent) => {
      if (!event.state) return;
      nextNavigation(event.state.__NA ? 'traverse' : 'reload');
    };
    try {
      expect(window.location.pathname).toBe('/docs/api');
      expect(window.history.length).toBe(initialLength);
      for (const name of ['Profile', 'Members']) {
        await user.click(
          within(screen.getByRole('navigation')).getByRole('link', { name })
        );
        await waitFor(() =>
          expect(window.location.hash).toBe(`#${name.toLowerCase()}`)
        );
      }
      const earlyScope = window.history.state?.__groupiNavigationScope;
      window.addEventListener('popstate', nextPop, true);
      view.rerender(
        <StrictMode>
          <NavigationGuardProvider>
            <APIReferencePage />
          </NavigationGuardProvider>
        </StrictMode>
      );
      // Next's hydration/replace boundary supplies only its real current tree.
      window.history.replaceState(
        {
          __NA: true,
          __PRIVATE_NEXTJS_INTERNALS_TREE: ['settings', 'invite-lists'],
        },
        '',
        '/settings/invite-lists'
      );
      const originalState = window.history.state;
      const length = window.history.length;
      view.rerender(
        <StrictMode>
          <NavigationGuardProvider>
            <InviteListsSettings />
          </NavigationGuardProvider>
        </StrictMode>
      );
      await user.click(
        screen.getByRole('button', { name: 'Create invite list' })
      );
      await user.type(screen.getByLabelText('List name'), 'Before hydration');
      // Native fragment traversal can blur a control before its popstate event.
      screen.getByLabelText('List name').blur();
      act(() => window.history.back());
      await screen.findByRole('button', { name: 'Keep Editing' });
      expect(window.location.pathname).toBe('/settings/invite-lists');
      expect(window.history.state).toEqual(originalState);
      expect(nextNavigation).not.toHaveBeenCalled();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Keep Editing' }));
      expect(nextNavigation).not.toHaveBeenCalled();
      expect(screen.getByLabelText('List name')).toHaveValue(
        'Before hydration'
      );
      expect(screen.getByLabelText('List name')).toHaveFocus();
      act(() => window.history.back());
      await user.click(await screen.findByRole('button', { name: 'Discard' }));
      await waitFor(() => expect(window.location.hash).toBe('#profile'));
      expect(nextNavigation).toHaveBeenCalledExactlyOnceWith('reload');
      expect(window.history.state.__groupiNavigationScope).toBe(earlyScope);
      expect(window.history.state).not.toHaveProperty('__NA');
      expect(window.history.state).not.toHaveProperty(
        '__PRIVATE_NEXTJS_INTERNALS_TREE'
      );
      act(() => window.history.forward());
      await waitFor(() =>
        expect(window.location.pathname).toBe('/settings/invite-lists')
      );
      expect(window.history.state).toEqual(originalState);
      expect(nextNavigation).toHaveBeenLastCalledWith('traverse');
      expect(window.history.length).toBe(length);
      // Client teardown releases only its lease; the root-head owner remains.
      view.unmount();
      window.history.pushState(
        { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: ['events'] },
        '',
        '/events'
      );
      expect(window.history.state.__groupiNavigationScope).toBe(earlyScope);
      expect(window.history.state.__PRIVATE_NEXTJS_INTERNALS_TREE).toEqual([
        'events',
      ]);
    } finally {
      window.removeEventListener('popstate', nextPop, true);
      view.unmount();
      releaseHead?.();
    }
  });

  it.each(['push', 'replace'])(
    'preserves a dirty draft without inferring distance across an unindexed fragment before a tracked %s',
    async operation => {
      vi.stubGlobal('navigation', undefined);
      const user = userEvent.setup();
      window.history.replaceState(null, '', '/docs/api');
      const releaseHead = new Function(
        `return ${navigationHistoryBootstrapScript}`
      )() as () => void;
      const view = render(<APIReferencePage />);
      try {
        for (const name of ['Profile', 'Members']) {
          await user.click(
            within(screen.getByRole('navigation')).getByRole('link', { name })
          );
          await waitFor(() =>
            expect(window.location.hash).toBe(`#${name.toLowerCase()}`)
          );
        }
        const membersState = window.history.state;
        act(() => {
          window.location.hash = 'unattributed';
        });
        await waitFor(() => expect(window.history.state == null).toBe(true));
        window.history[operation === 'push' ? 'pushState' : 'replaceState'](
          { __NA: true, tree: 'settings' },
          '',
          '/settings/invite-lists'
        );
        const settingsState = window.history.state;
        const length = window.history.length;
        view.rerender(
          <NavigationGuardProvider>
            <InviteListsSettings />
          </NavigationGuardProvider>
        );
        await user.click(
          screen.getByRole('button', { name: 'Create invite list' })
        );
        await user.type(screen.getByLabelText('List name'), 'Across a gap');
        act(() => window.history.go(operation === 'push' ? -2 : -1));
        await screen.findByRole('button', { name: 'Keep Editing' });
        expect(screen.getByRole('alert')).toHaveTextContent(
          'cannot safely restore an untracked history entry'
        );
        expect(window.location.hash).toBe('#members');
        expect(window.history.state).toEqual(membersState);
        expect(window.history.length).toBe(length);
        const heading = screen.getByRole('heading', {
          name: 'Discard this invite list?',
        });
        // Native fragment default focus runs after the popstate confirmation.
        heading.blur();
        await waitFor(() => expect(heading).toHaveFocus());
        await user.click(screen.getByRole('button', { name: 'Keep Editing' }));
        expect(screen.getByLabelText('List name')).toHaveValue('Across a gap');
        act(() => window.history.go(operation === 'push' ? 2 : 1));
        await waitFor(() =>
          expect(window.location.pathname).toBe('/settings/invite-lists')
        );
        expect(window.history.state).toEqual(settingsState);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByLabelText('List name')).toHaveValue('Across a gap');
      } finally {
        view.unmount();
        releaseHead();
      }
    }
  );

  it('restores the Settings entry after Back to an earlier native API fragment and preserves Forward history', async () => {
    vi.stubGlobal('navigation', undefined);
    const user = userEvent.setup();
    const nextState = { __NA: true, tree: { route: '/docs/api' } };
    window.history.replaceState(nextState, '', '/docs/api');
    const view = render(
      <NavigationGuardProvider>
        <APIReferencePage />
      </NavigationGuardProvider>
    );
    await user.click(
      within(screen.getByRole('navigation')).getByRole('link', {
        name: 'Profile',
      })
    );
    await waitFor(() => expect(window.location.hash).toBe('#profile'));
    window.history.pushState(
      { __NA: true, tree: 'settings' },
      '',
      '/settings/invite-lists'
    );
    const originalState = window.history.state;
    const length = window.history.length;
    view.rerender(
      <NavigationGuardProvider>
        <InviteListsSettings />
      </NavigationGuardProvider>
    );
    await user.click(
      screen.getByRole('button', { name: 'Create invite list' })
    );
    await user.type(screen.getByLabelText('List name'), 'From API reference');
    act(() => window.history.back());
    await screen.findByRole('button', { name: 'Keep Editing' });
    expect(window.location.pathname).toBe('/settings/invite-lists');
    expect(window.location.hash).toBe('');
    expect(window.history.state).toEqual(originalState);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Keep Editing' }));
    expect(screen.getByLabelText('List name')).toHaveValue(
      'From API reference'
    );
    act(() => window.history.back());
    await user.click(await screen.findByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(window.location.hash).toBe('#profile'));
    expect(window.location.pathname).toBe('/docs/api');
    expect(window.history.state).toMatchObject(nextState);
    act(() => window.history.back());
    await waitFor(() => expect(window.location.hash).toBe(''));
    act(() => window.history.forward());
    await waitFor(() => expect(window.location.hash).toBe('#profile'));
    expect(window.history.state).toMatchObject(nextState);
    act(() => window.history.forward());
    await waitFor(() =>
      expect(window.location.pathname).toBe('/settings/invite-lists')
    );
    expect(window.history.state).toEqual(originalState);
    expect(window.history.length).toBe(length);
  });

  it.each(['Keep Editing', 'Discard', 'move focus'])(
    'respects %s before the browser settles confirmation focus',
    async choice => {
      // Control only the browser's frame boundary so a fast user choice precedes
      // the late native-fragment focus correction.
      const frames = new Map<number, FrameRequestCallback>();
      let nextFrame = 0;
      vi.stubGlobal(
        'requestAnimationFrame',
        (callback: FrameRequestCallback) => {
          frames.set(++nextFrame, callback);
          return nextFrame;
        }
      );
      vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
      const user = userEvent.setup();
      render(<InviteListsSettings />);
      await user.click(
        screen.getByRole('button', { name: 'Create invite list' })
      );
      await user.type(screen.getByLabelText('List name'), 'Focus stays here');
      await user.keyboard('{Escape}');
      screen.getByRole('heading', { name: 'Discard this invite list?' }).blur();
      if (choice === 'move focus') await user.tab();
      else await user.click(screen.getByRole('button', { name: choice }));
      await act(async () => {
        const pending = Array.from(frames.values());
        frames.clear();
        pending.forEach(callback => callback(performance.now()));
      });
      if (choice === 'move focus')
        expect(screen.getByRole('link', { name: 'Settings' })).toHaveFocus();
      else if (choice === 'Keep Editing') {
        expect(screen.getByLabelText('List name')).toHaveFocus();
        expect(screen.getByLabelText('List name')).toHaveValue(
          'Focus stays here'
        );
      } else
        expect(
          screen.getByRole('button', { name: 'Create invite list' })
        ).toHaveFocus();
    }
  );

  it.each(['Back', 'Forward'])(
    'restores browser %s across app entries created on mount before opening Settings without the Navigation API',
    async direction => {
      vi.stubGlobal('navigation', undefined);
      const user = userEvent.setup();
      window.history.replaceState(
        { __NA: true, tree: 'landing' },
        '',
        '/landing'
      );
      function InitialAppNavigation() {
        useEffect(() => {
          window.history.pushState(
            { __NA: true, tree: 'first-route' },
            '',
            direction === 'Back' ? '/events' : '/settings/invite-lists'
          );
          window.history.pushState(
            { __NA: true, tree: 'second-route' },
            '',
            direction === 'Back' ? '/settings/invite-lists' : '/events'
          );
        }, []);
        return <p>Opening app</p>;
      }
      const view = render(
        <NavigationGuardProvider>
          <InitialAppNavigation />
        </NavigationGuardProvider>
      );
      if (direction === 'Forward') {
        act(() => window.history.back());
        await waitFor(() =>
          expect(window.location.pathname).toBe('/settings/invite-lists')
        );
      }
      const originalState = window.history.state;
      const length = window.history.length;
      view.rerender(
        <NavigationGuardProvider>
          <InviteListsSettings />
        </NavigationGuardProvider>
      );
      await user.click(
        screen.getByRole('button', { name: 'Create invite list' })
      );
      await user.type(screen.getByLabelText('List name'), 'Before Settings');
      act(() =>
        direction === 'Back' ? window.history.back() : window.history.forward()
      );
      await screen.findByRole('button', { name: 'Keep Editing' });
      expect(window.location.pathname).toBe('/settings/invite-lists');
      expect(window.history.state).toEqual(originalState);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Keep Editing' }));
      expect(screen.getByLabelText('List name')).toHaveValue('Before Settings');
      expect(window.history.length).toBe(length);
      act(() =>
        direction === 'Back' ? window.history.back() : window.history.forward()
      );
      await user.click(await screen.findByRole('button', { name: 'Discard' }));
      await waitFor(() => expect(window.location.pathname).toBe('/events'));
      expect(window.history.state).toMatchObject({
        __NA: true,
        tree: direction === 'Back' ? 'first-route' : 'second-route',
      });
      expect(window.history.length).toBe(length);
    }
  );

  it.each(['Back', 'Forward'])(
    'preserves a dirty draft on browser %s and replays navigation after Discard',
    async direction => {
      const user = userEvent.setup();
      window.history.replaceState({}, '', '/settings');
      render(
        <NavigationGuardProvider>
          <InviteListsSettings />
        </NavigationGuardProvider>
      );
      window.history.pushState({ __NA: true }, '', '/settings/invite-lists');
      if (direction === 'Forward') {
        window.history.pushState({ __NA: true }, '', '/events');
        act(() => window.history.back());
        await waitFor(() =>
          expect(window.location.pathname).toBe('/settings/invite-lists')
        );
      }
      await user.click(
        screen.getByRole('button', { name: 'Create invite list' })
      );
      await user.type(screen.getByLabelText('List name'), 'Stay here');
      act(() =>
        direction === 'Back' ? window.history.back() : window.history.forward()
      );
      expect(
        await screen.findByRole('heading', {
          name: 'Discard this invite list?',
        })
      ).toHaveFocus();
      await waitFor(() =>
        expect(window.location.pathname).toBe('/settings/invite-lists')
      );
      await user.click(screen.getByRole('button', { name: 'Keep Editing' }));
      expect(screen.getByLabelText('List name')).toHaveValue('Stay here');
      act(() =>
        direction === 'Back' ? window.history.back() : window.history.forward()
      );
      await screen.findByRole('button', { name: 'Discard' });
      await waitFor(() =>
        expect(window.location.pathname).toBe('/settings/invite-lists')
      );
      await user.click(screen.getByRole('button', { name: 'Discard' }));
      await waitFor(() =>
        expect(window.location.pathname).toBe(
          direction === 'Back' ? '/settings' : '/events'
        )
      );
    }
  );

  it.each(['Back', 'Forward'])(
    'preserves a dirty draft and reports the exact legacy unindexed %s limitation without probing',
    async direction => {
      const user = userEvent.setup();
      window.history.replaceState({ previous: true }, '', '/previous');
      window.history.pushState({ __NA: true }, '', '/settings/invite-lists');
      window.history.pushState({ future: true }, '', '/future');
      act(() => window.history.back());
      await waitFor(() =>
        expect(window.location.pathname).toBe('/settings/invite-lists')
      );
      render(
        <NavigationGuardProvider>
          <InviteListsSettings />
        </NavigationGuardProvider>
      );
      const length = window.history.length;
      await user.click(
        screen.getByRole('button', { name: 'Create invite list' })
      );
      await user.type(screen.getByLabelText('List name'), 'Recoverable draft');
      act(() =>
        direction === 'Back' ? window.history.back() : window.history.forward()
      );
      await screen.findByRole('button', { name: 'Keep Editing' });
      expect(screen.getByRole('alert')).toHaveTextContent(
        'cannot safely restore an untracked history entry'
      );
      expect(window.location.pathname).toBe(
        direction === 'Back' ? '/previous' : '/future'
      );
      expect(window.history.length).toBe(length);
      expect(window.history.state).toEqual(
        direction === 'Back' ? { previous: true } : { future: true }
      );
      await user.click(screen.getByRole('button', { name: 'Keep Editing' }));
      expect(screen.getByLabelText('List name')).toHaveValue(
        'Recoverable draft'
      );
      act(() =>
        direction === 'Back' ? window.history.forward() : window.history.back()
      );
      await waitFor(() =>
        expect(window.location.pathname).toBe('/settings/invite-lists')
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByLabelText('List name')).toHaveValue(
        'Recoverable draft'
      );
    }
  );

  it('keeps a dirty draft recoverable when a user-typed fragment creates an unindexed entry without the Navigation API', async () => {
    vi.stubGlobal('navigation', undefined);
    const user = userEvent.setup();
    render(
      <NavigationGuardProvider>
        <InviteListsSettings />
      </NavigationGuardProvider>
    );
    await user.click(
      screen.getByRole('button', { name: 'Create invite list' })
    );
    await user.type(screen.getByLabelText('List name'), 'Typed fragment draft');
    act(() => {
      window.location.hash = 'typed-fragment';
    });
    await screen.findByRole('button', { name: 'Keep Editing' });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'cannot safely restore an untracked history entry'
    );
    expect(window.location.hash).toBe('#typed-fragment');
    const length = window.history.length;
    const state = window.history.state;
    await user.click(screen.getByRole('button', { name: 'Keep Editing' }));
    expect(screen.getByLabelText('List name')).toHaveValue(
      'Typed fragment draft'
    );
    expect(window.history.state).toEqual(state);
    expect(window.history.length).toBe(length);
    act(() => window.history.back());
    await waitFor(() => expect(window.location.hash).toBe(''));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('List name')).toHaveValue(
      'Typed fragment draft'
    );
  });

  it.each(['Back', 'Forward'])(
    'uses browser Navigation API positions for unindexed %s entries',
    async direction => {
      const user = userEvent.setup();
      window.history.replaceState({ previous: true }, '', '/previous');
      window.history.pushState({ __NA: true }, '', '/settings/invite-lists');
      window.history.pushState({ future: true }, '', '/future');
      act(() => window.history.back());
      await waitFor(() =>
        expect(window.location.pathname).toBe('/settings/invite-lists')
      );
      vi.stubGlobal('navigation', {
        get currentEntry() {
          return {
            index:
              window.location.pathname === '/previous'
                ? 0
                : window.location.pathname === '/future'
                  ? 2
                  : 1,
          };
        },
      });
      render(
        <NavigationGuardProvider>
          <InviteListsSettings />
        </NavigationGuardProvider>
      );
      await user.click(
        screen.getByRole('button', { name: 'Create invite list' })
      );
      await user.type(screen.getByLabelText('List name'), 'Protected');
      act(() =>
        direction === 'Back' ? window.history.back() : window.history.forward()
      );
      await screen.findByRole('button', { name: 'Keep Editing' });
      expect(window.location.pathname).toBe('/settings/invite-lists');
      await user.click(screen.getByRole('button', { name: 'Keep Editing' }));
      expect(screen.getByLabelText('List name')).toHaveValue('Protected');
      act(() =>
        direction === 'Back' ? window.history.back() : window.history.forward()
      );
      await user.click(await screen.findByRole('button', { name: 'Discard' }));
      await waitFor(() =>
        expect(window.location.pathname).toBe(
          direction === 'Back' ? '/previous' : '/future'
        )
      );
      expect(window.history.state).toEqual(
        direction === 'Back' ? { previous: true } : { future: true }
      );
    }
  );

  it('anonymizes newly selected people when their current profile disappears without losing draft identity', async () => {
    const user = userEvent.setup();
    const view = render(<InviteListsSettings />);
    await user.click(
      screen.getByRole('button', { name: 'Create invite list' })
    );
    await user.type(screen.getByLabelText('List name'), 'Recoverable');
    await user.type(screen.getByLabelText('Search by username'), 'sam');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(screen.getByRole('button', { name: 'Add Sam Other' }));
    boundary.profiles = {
      items: [
        {
          personId: 'other',
          name: null,
          username: null,
          image: null,
          available: false,
        },
      ],
    };
    boundary.search = { items: [] };
    view.rerender(<InviteListsSettings />);
    expect(
      screen.getByRole('button', { name: 'Remove unavailable person' })
    ).toBeVisible();
    expect(screen.queryByText('Sam Other')).not.toBeInTheDocument();
    expect(screen.queryByText('@sam')).not.toBeInTheDocument();
    expect(screen.getByLabelText('List name')).toHaveValue('Recoverable');
    await user.click(
      screen.getByRole('button', { name: 'Remove unavailable person' })
    );
    await user.click(screen.getByRole('button', { name: 'Save list' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose at least one existing person.'
    );
  });

  it('keeps an all-unavailable named list visible and supports repair through Settings', async () => {
    const user = userEvent.setup();
    const missing = {
      personId: 'missing',
      name: 'Deleted name',
      username: 'deleted',
      image: 'https://test.example/deleted.png',
      available: false,
    };
    boundary.collection = {
      items: [
        {
          inviteListId: 'saved',
          name: 'Old friends',
          personCount: 1,
          availablePersonCount: 0,
          needsAttention: true,
        },
      ],
    };
    boundary.detail = {
      inviteListId: 'saved',
      name: 'Old friends',
      personCount: 1,
      availablePersonCount: 0,
      needsAttention: true,
      people: [missing],
    };
    boundary.update.mockImplementationOnce(async () => {
      boundary.detail = {
        inviteListId: 'saved',
        name: 'Old friends',
        personCount: 1,
        availablePersonCount: 1,
        needsAttention: false,
        people: [friend],
      };
      return boundary.detail;
    });
    render(<InviteListsSettings />);
    expect(screen.getByText(/Needs attention/)).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'View Old friends, 1 person' })
    );
    expect(screen.getByText('Unavailable person')).toBeVisible();
    expect(screen.queryByText('Deleted name')).not.toBeInTheDocument();
    expect(screen.queryByText('@deleted')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit list' }));
    await user.click(
      screen.getByRole('button', { name: 'Remove unavailable person' })
    );
    await user.click(screen.getByRole('button', { name: 'Add Ada Friend' }));
    await user.click(screen.getByRole('button', { name: 'Save list' }));
    expect(
      await screen.findByRole('heading', { name: 'Old friends' })
    ).toBeVisible();
    expect(screen.queryByText('Needs attention')).not.toBeInTheDocument();
    expect(screen.getByText('Ada Friend')).toBeVisible();
  });

  it('retains name and selected people when username search fails, and supports retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<InviteListsSettings />);
    await user.click(
      screen.getByRole('button', { name: 'Create invite list' })
    );
    await user.type(screen.getByLabelText('List name'), 'Keep this draft');
    await user.click(screen.getByRole('button', { name: 'Add Ada Friend' }));
    boundary.search = new Error('Search temporarily unavailable');
    await user.type(screen.getByLabelText('Search by username'), 'sam');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to load people.'
    );
    expect(screen.getByLabelText('List name')).toHaveValue('Keep this draft');
    expect(
      screen.getByRole('button', { name: 'Remove Ada Friend' })
    ).toBeInTheDocument();
    boundary.search = { items: [other] };
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await user.click(screen.getByRole('button', { name: 'Add Sam Other' }));
    expect(
      screen.getByRole('heading', { name: 'Selected people (2/100)' })
    ).toBeInTheDocument();
  });

  it('keeps an editable draft after validation and a duplicate-name failure', async () => {
    const user = userEvent.setup();
    render(<InviteListsSettings />);
    await user.click(
      screen.getByRole('button', { name: 'Create invite list' })
    );
    await user.click(screen.getByRole('button', { name: 'Save list' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Use a list name with 1–100 characters after trimming.'
    );
    await user.type(screen.getByLabelText('List name'), 'Weekend');
    await user.click(screen.getByRole('button', { name: 'Save list' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose at least one existing person.'
    );
    await user.click(screen.getByRole('button', { name: 'Add Ada Friend' }));
    boundary.create.mockRejectedValueOnce(
      new ConvexError({
        code: 'CONFLICT',
        message: 'An invite list with this name already exists',
      })
    );
    await user.click(screen.getByRole('button', { name: 'Save list' }));
    expect((await screen.findByRole('alert')).textContent).toBe(
      'An invite list with this name already exists'
    );
    expect(screen.getByLabelText('List name')).toHaveValue('Weekend');
    expect(
      screen.getByRole('button', { name: 'Remove Ada Friend' })
    ).toBeInTheDocument();
    await user.clear(screen.getByLabelText('List name'));
    await user.type(screen.getByLabelText('List name'), 'Another weekend');
    await user.click(screen.getByRole('button', { name: 'Save list' }));
    expect(
      await screen.findByRole('heading', { name: 'Another weekend' })
    ).toBeInTheDocument();
  });

  it('browses saved list details and returns focus to the chosen list', async () => {
    const user = userEvent.setup();
    const list = {
      inviteListId: 'saved',
      name: 'Existing list',
      personCount: 1,
      availablePersonCount: 1,
      needsAttention: false,
      createdAt: 1,
      updatedAt: 1,
    };
    boundary.collection = { items: [list] };
    boundary.detail = { ...list, people: [friend] };
    render(<InviteListsSettings />);
    await user.click(
      screen.getByRole('button', { name: 'View Existing list, 1 person' })
    );
    expect(
      screen.getByRole('heading', { name: 'Existing list' })
    ).toHaveFocus();
    await user.click(
      screen.getByRole('button', { name: 'Back to invite lists' })
    );
    expect(
      screen.getByRole('button', { name: 'View Existing list, 1 person' })
    ).toHaveFocus();
  });

  it('exposes Invite lists in desktop and mobile Settings navigation', async () => {
    render(<SettingsNav />);
    expect(screen.getByRole('link', { name: 'Invite lists' })).toHaveAttribute(
      'href',
      '/settings/invite-lists'
    );
    cleanup();
    vi.stubGlobal('innerWidth', 500);
    render(<SettingsPage />);
    expect(
      await screen.findByRole('link', { name: 'Invite lists' })
    ).toHaveAttribute('href', '/settings/invite-lists');
    vi.unstubAllGlobals();
  });

  it('shows loading and a recoverable collection error', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    boundary.collection = undefined;
    const page = render(<InviteListsSettings />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading invite lists…'
    );
    boundary.collection = new Error('Unavailable');
    page.rerender(<InviteListsSettings />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Unable to load your invite lists.'
    );
    boundary.collection = { items: [] };
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('No invite lists yet')).toBeInTheDocument();
  });

  it('explains the 100-list limit and prevents starting another list', () => {
    boundary.collection = {
      items: Array.from({ length: 100 }, (_, index) => ({
        inviteListId: String(index),
        name: `List ${index}`,
        personCount: 1,
        needsAttention: false,
      })),
    };
    render(<InviteListsSettings />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'You have reached the limit of 100 invite lists.'
    );
    expect(
      screen.getByRole('button', { name: 'Create invite list' })
    ).toBeDisabled();
  });

  it('accepts a 100-character trimmed name and rejects a longer name without losing people', async () => {
    const user = userEvent.setup();
    render(<InviteListsSettings />);
    await user.click(
      screen.getByRole('button', { name: 'Create invite list' })
    );
    await user.click(screen.getByRole('button', { name: 'Add Ada Friend' }));
    await user.type(screen.getByLabelText('List name'), 'x'.repeat(101));
    await user.click(screen.getByRole('button', { name: 'Save list' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      '1–100 characters after trimming'
    );
    expect(
      screen.getByRole('button', { name: 'Remove Ada Friend' })
    ).toBeInTheDocument();
    await user.clear(screen.getByLabelText('List name'));
    await user.type(
      screen.getByLabelText('List name'),
      `  ${'x'.repeat(100)}  `
    );
    await user.click(screen.getByRole('button', { name: 'Save list' }));
    expect(
      await screen.findByRole('heading', { name: 'x'.repeat(100) })
    ).toBeInTheDocument();
  });

  it('protects refresh or tab close while dirty and releases protection after local Discard', async () => {
    const user = userEvent.setup();
    render(<InviteListsSettings />);
    await user.click(
      screen.getByRole('button', { name: 'Create invite list' })
    );
    await user.type(screen.getByLabelText('List name'), 'Unsaved');
    const dirtyUnload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirtyUnload);
    expect(dirtyUnload.defaultPrevented).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Discard' }));
    const cleanUnload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(cleanUnload);
    expect(cleanUnload.defaultPrevented).toBe(false);
  });

  it('renames a saved list and replaces people silently', async () => {
    const user = userEvent.setup();
    const list = {
      inviteListId: 'saved',
      name: 'Weekend',
      personCount: 1,
      availablePersonCount: 1,
      needsAttention: false,
      createdAt: 1,
      updatedAt: 1,
    };
    boundary.collection = { items: [list] };
    boundary.detail = { ...list, people: [friend] };
    render(<InviteListsSettings />);
    await user.click(
      screen.getByRole('button', { name: 'View Weekend, 1 person' })
    );
    await user.click(screen.getByRole('button', { name: 'Edit list' }));
    expect(screen.getByLabelText('List name')).toHaveValue('Weekend');
    await user.clear(screen.getByLabelText('List name'));
    await user.type(screen.getByLabelText('List name'), '  Friday people  ');
    await user.click(screen.getByRole('button', { name: 'Remove Ada Friend' }));
    await user.type(screen.getByLabelText('Search by username'), 'sam');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(screen.getByRole('button', { name: 'Add Sam Other' }));
    await user.click(screen.getByRole('button', { name: 'Save list' }));
    expect(
      await screen.findByRole('heading', { name: 'Friday people' })
    ).toHaveFocus();
    expect(screen.getByText('@sam')).toBeInTheDocument();
    expect(screen.queryByText('@ada')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'List saved. No invitations were sent.'
    );
  });

  it('confirms deletion, keeps a saved list after failure, and allows retry', async () => {
    const user = userEvent.setup();
    const list = {
      inviteListId: 'saved',
      name: 'Weekend',
      personCount: 1,
      availablePersonCount: 1,
      needsAttention: false,
      createdAt: 1,
      updatedAt: 1,
    };
    boundary.collection = { items: [list] };
    boundary.detail = { ...list, people: [friend] };
    render(<InviteListsSettings />);
    await user.click(
      screen.getByRole('button', { name: 'View Weekend, 1 person' })
    );
    await user.click(screen.getByRole('button', { name: 'Delete list' }));
    expect(
      screen.getByRole('heading', { name: 'Delete this invite list?' })
    ).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Keep list' }));
    expect(screen.getByRole('button', { name: 'Delete list' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Delete list' }));
    boundary.delete.mockRejectedValueOnce(new Error('Network failure'));
    await user.click(screen.getByRole('button', { name: 'Delete list' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to delete this list. Please try again.'
    );
    expect(screen.getByText('Weekend')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete list' }));
    expect(await screen.findByText('No invite lists yet')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'List deleted. Existing invitations are unchanged.'
    );
  });

  it.each(['Cancel', 'Escape'])(
    'keeps saved data and an editing draft after a failed update and %s',
    async dismissal => {
      const user = userEvent.setup();
      const list = {
        inviteListId: 'saved',
        name: 'Weekend',
        personCount: 1,
        availablePersonCount: 1,
        needsAttention: false,
        createdAt: 1,
        updatedAt: 1,
      };
      boundary.collection = { items: [list] };
      boundary.detail = { ...list, people: [friend] };
      render(<InviteListsSettings />);
      await user.click(
        screen.getByRole('button', { name: 'View Weekend, 1 person' })
      );
      await user.click(screen.getByRole('button', { name: 'Edit list' }));
      await user.clear(screen.getByLabelText('List name'));
      await user.type(screen.getByLabelText('List name'), 'Conflicting name');
      boundary.update.mockRejectedValueOnce(
        new ConvexError({
          code: 'CONFLICT',
          message: 'An invite list with this name already exists',
        })
      );
      await user.click(screen.getByRole('button', { name: 'Save list' }));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'An invite list with this name already exists'
      );
      if (dismissal === 'Cancel')
        await user.click(screen.getByRole('button', { name: 'Cancel' }));
      else await user.keyboard('{Escape}');
      expect(
        screen.getByRole('heading', {
          name: 'Discard changes to this invite list?',
        })
      ).toHaveFocus();
      await user.click(screen.getByRole('button', { name: 'Keep Editing' }));
      expect(screen.getByLabelText('List name')).toHaveValue(
        'Conflicting name'
      );
      expect(
        screen.getByRole('button', { name: 'Remove Ada Friend' })
      ).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      await user.click(screen.getByRole('button', { name: 'Discard' }));
      expect(
        screen.getByRole('heading', { name: 'Weekend' })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit list' })).toHaveFocus();
    }
  );
});
