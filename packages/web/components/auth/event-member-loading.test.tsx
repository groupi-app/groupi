import 'tsconfig-paths/register';
import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventMemberOnly, EventOrganizerOnly } from './auth-wrappers';

const fixture = vi.hoisted(() => ({
  authenticated: true,
  loaded: false,
  role: 'ATTENDEE' as 'ATTENDEE' | 'ORGANIZER' | null,
}));
vi.mock('convex/react', () => ({
  Authenticated: ({ children }: { children: ReactNode }) =>
    fixture.authenticated ? children : null,
  Unauthenticated: () => null,
  AuthLoading: () => null,
  useQuery: () =>
    fixture.loaded
      ? { userMembership: fixture.role ? { role: fixture.role } : null }
      : undefined,
}));

beforeEach(() => {
  fixture.authenticated = true;
  fixture.loaded = false;
  fixture.role = 'ATTENDEE';
});
afterEach(cleanup);

describe('Event membership loading boundaries', () => {
  it('replaces loading placeholders only after membership resolves', () => {
    const tree = () => (
      <EventMemberOnly eventId='event-fixture'>
        <button>Private member control</button>
      </EventMemberOnly>
    );
    const view = render(tree());
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent(/loading event/i);
    expect(
      view.container.querySelector('[aria-busy="true"]')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
    fixture.loaded = true;
    view.rerender(tree());
    expect(
      screen.getByRole('button', { name: 'Private member control' })
    ).toBeVisible();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('preserves denied membership fallback without leaking a control or busy skeleton', () => {
    fixture.loaded = true;
    fixture.role = null;
    const { container } = render(
      <EventMemberOnly eventId='event-fixture'>
        <button>Private member control</button>
      </EventMemberOnly>
    );
    expect(screen.getByText('Event membership required')).toBeVisible();
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('does not turn loading into organizer authority for an attendee', () => {
    const tree = () => (
      <EventOrganizerOnly
        eventId='event-fixture'
        fallback={<p>Organizer only</p>}
      >
        <button>Private organizer control</button>
      </EventOrganizerOnly>
    );
    const view = render(tree());
    expect(screen.getByRole('status')).toHaveTextContent(/loading event/i);
    fixture.loaded = true;
    view.rerender(tree());
    expect(screen.getByText('Organizer only')).toBeVisible();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
