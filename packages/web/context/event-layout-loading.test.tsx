import { Component, Suspense, type ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import EventError from '@/app/(event)/event/[eventId]/error';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EventIdLayout from '@/app/(event)/event/[eventId]/layout';
import EventRouteLayout from '@/app/(event)/layout';
import { AuthenticatedLayout } from '@/components/auth/AuthenticatedLayout';

const fixture = vi.hoisted(() => ({
  loading: true,
  queryFailure: false,
  reset: vi.fn(),
  missing: false,
  member: true,
  authenticated: true,
  authPending: false,
  convexPending: false,
  onboarding: false as boolean | null | undefined,
  push: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: fixture.push }),
  usePathname: () => '/event/event-fixture',
}));
vi.mock('@/app/(event)/event/[eventId]/context', () => ({
  EventDataProvider: ({ children }: { children: ReactNode }) => children,
  useEventData: () => {
    if (fixture.queryFailure) throw new Error('Fixture query unavailable');
    return {
      isLoading: fixture.loading,
      headerData: fixture.missing
        ? null
        : fixture.loading
          ? undefined
          : { userMembership: fixture.member ? { role: 'ATTENDEE' } : null },
    };
  },
}));
vi.mock('@/features/addons/gating', () => ({
  EventAddonGate: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({
    isPending: fixture.authPending,
    data: fixture.authenticated ? { user: { id: 'fixture-user' } } : null,
  }),
}));
vi.mock('convex/react', () => ({
  useConvexAuth: () => ({
    isLoading: fixture.convexPending,
    isAuthenticated: fixture.authenticated,
  }),
}));
vi.mock('@/context/global-user-context', () => ({
  useNeedsOnboardingFromContext: () => ({ data: fixture.onboarding }),
}));

vi.mock('@/lib/logger', () => ({ componentLogger: { error: vi.fn() } }));

class EventErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <EventError error={this.state.error} reset={fixture.reset} />
    ) : (
      this.props.children
    );
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  fixture.loading = true;
  fixture.queryFailure = false;
  fixture.missing = false;
  fixture.member = true;
  fixture.authenticated = true;
  fixture.authPending = false;
  fixture.convexPending = false;
  fixture.onboarding = false;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function mountEventLayout() {
  const params = Promise.resolve({ eventId: 'event-fixture' });
  const tree = () => (
    <EventErrorBoundary>
      <Suspense>
        <EventIdLayout params={params}>
          <h1>Private event title</h1>
        </EventIdLayout>
      </Suspense>
    </EventErrorBoundary>
  );
  let view: ReturnType<typeof render>;
  await act(async () => {
    view = render(tree());
  });
  return { view: view!, tree };
}

describe('Event query and route boundaries', () => {
  it('uses one inert page skeleton, then reveals the authorized route', async () => {
    const { view, tree } = await mountEventLayout();
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent(/loading event/i);
    expect(
      view.container.querySelector('[aria-busy="true"]')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByText('Private event title')).toBeNull();
    expect(fixture.push).not.toHaveBeenCalled();

    fixture.loading = false;
    view.rerender(tree());
    expect(
      screen.getByRole('heading', { name: 'Private event title' })
    ).toBeVisible();
    expect(screen.queryByRole('status')).toBeNull();
    expect(view.container.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('lets query failures reach the existing event error/retry boundary instead of loading forever', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { view, tree } = await mountEventLayout();
    expect(screen.getByRole('status')).toHaveTextContent(/loading event/i);
    fixture.queryFailure = true;
    view.rerender(tree());
    expect(
      screen.getByText(
        'We encountered an error while loading the event. Please try again.'
      )
    ).toBeVisible();
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByText('Private event title')).toBeNull();
    expect(view.container.querySelector('[aria-busy="true"]')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(fixture.reset).toHaveBeenCalledOnce();
  });

  it.each(['missing', 'nonmember'] as const)(
    'preserves the %s redirect without exposing private children',
    async state => {
      fixture.loading = false;
      fixture.missing = state === 'missing';
      fixture.member = state !== 'nonmember';
      const { view } = await mountEventLayout();
      expect(fixture.push).toHaveBeenCalledWith('/events');
      expect(screen.queryByText('Private event title')).toBeNull();
      expect(view.container.querySelector('[aria-busy="true"]')).toBeNull();
    }
  );
});

describe('Event authentication boundary', () => {
  it.each(['session', 'convex', 'onboarding'] as const)(
    'uses the page skeleton while %s is unresolved, then settles',
    stage => {
      fixture.authPending = stage === 'session';
      fixture.convexPending = stage === 'convex';
      fixture.onboarding = stage === 'onboarding' ? undefined : false;
      const tree = () => (
        <EventRouteLayout>
          <h1>Private event title</h1>
        </EventRouteLayout>
      );
      const view = render(tree());
      expect(screen.getAllByRole('status')).toHaveLength(1);
      expect(screen.getByRole('status')).toHaveTextContent(/loading event/i);
      expect(screen.queryByText('Private event title')).toBeNull();
      fixture.authPending = false;
      fixture.convexPending = false;
      fixture.onboarding = false;
      view.rerender(tree());
      expect(
        screen.getByRole('heading', { name: 'Private event title' })
      ).toBeVisible();
      expect(screen.queryByRole('status')).toBeNull();
    }
  );

  it('keeps event content hidden while onboarding redirects and leaves other layout fallbacks unchanged', () => {
    fixture.onboarding = true;
    const view = render(
      <EventRouteLayout>
        <h1>Private event title</h1>
      </EventRouteLayout>
    );
    expect(screen.getByRole('status')).toHaveTextContent(/loading event/i);
    expect(screen.queryByText('Private event title')).toBeNull();
    view.unmount();

    fixture.authPending = true;
    render(
      <AuthenticatedLayout>
        <h1>Other private route</h1>
      </AuthenticatedLayout>
    );
    expect(screen.queryByText('Other private route')).toBeNull();
    expect(screen.queryByText(/loading event/i)).toBeNull();
  });

  it('keeps event content hidden while redirecting a signed-out visitor', () => {
    fixture.authenticated = false;
    render(
      <EventRouteLayout>
        <h1>Private event title</h1>
      </EventRouteLayout>
    );
    expect(screen.queryByText('Private event title')).toBeNull();
    expect(fixture.push).toHaveBeenCalledWith(
      '/sign-in?returnUrl=%2Fevent%2Fevent-fixture'
    );
  });
});
