import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import MyEventsPage from '@/app/(myEvents)/events/page';

vi.mock('@/hooks/convex/use-events', () => ({
  useUserEventsAndInvites: () => ({
    events: [],
    pendingInvites: [],
    pendingInviteCount: 105,
  }),
  useDiscoverableEvents: () => [],
}));
vi.mock('@/context/global-user-context', () => ({
  useGlobalUser: () => ({ user: { name: 'Alex' } }),
}));
vi.mock('@/hooks/convex/use-muting', () => ({
  MutedEventsProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@/app/(myEvents)/events/components/event-grid', () => ({
  EventGrid: () => null,
}));
vi.mock('@/app/(myEvents)/events/components/events-welcome-header', () => ({
  EventsWelcomeHeader: () => null,
}));
vi.mock('@/app/(myEvents)/events/components/event-invites-tab', () => ({
  EventInvitesTab: () => null,
}));
vi.mock('@/app/(myEvents)/events/components/discover-tab', () => ({
  DiscoverTab: () => null,
}));
vi.mock('@/components/molecules', () => ({ EventFilters: () => null }));

it('shows pending event invitations as a capped solid attention indicator', () => {
  render(<MyEventsPage />);
  const count = screen.getByLabelText('105 unread');
  expect(count).toHaveAttribute('data-slot', 'unread-indicator');
  expect(count).toHaveTextContent('99+');
  expect(
    screen.getByRole('tab', { name: 'Invited 105 unread' })
  ).toContainElement(count);
});
