import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EventPage from '@/app/(event)/event/[eventId]/page';
import EventLoading from '@/app/(event)/event/[eventId]/loading';
import EventRouteLoading from '@/app/(event)/loading';
import { EventPageSkeleton } from './event-page-skeleton';

const fixture = vi.hoisted(() => ({
  loading: true,
  missingHeader: false,
  title: 'Picnic',
  description: 'Bring a blanket.',
  members: undefined as undefined | null | { count: number },
  posts: undefined as undefined | null | { title: string },
}));
vi.mock('@/app/(event)/event/[eventId]/context', () => ({
  useEventData: () => ({
    isLoading: fixture.loading,
    headerData: fixture.missingHeader
      ? null
      : {
          event: { title: fixture.title, description: fixture.description },
          userMembership: { role: 'ATTENDEE' },
          permissions: {},
        },
    membersData: fixture.members,
    postFeedData: fixture.posts,
  }),
}));
vi.mock('@/app/(event)/event/[eventId]/components/event-header', () => ({
  EventHeader: ({
    data,
  }: {
    data: { event: { title: string; description: string } };
  }) => (
    <header>
      <h1>{data.event.title}</h1>
      <p>{data.event.description}</p>
    </header>
  ),
}));
vi.mock('@/app/(event)/event/[eventId]/components/member-list', () => ({
  MemberList: () => (
    <section aria-label='Private roster'>Member details</section>
  ),
}));
vi.mock('@/app/(event)/event/[eventId]/components/post-feed', () => ({
  PostFeed: ({ data }: { data: { title: string } }) => (
    <section aria-label='Discussion'>{data.title}</section>
  ),
}));
vi.mock('@/features/addons/runtime', () => ({
  EventAddons: () => (
    <section aria-label='Private add-ons'>Add-on details</section>
  ),
}));
vi.mock('@/components/new-post-button', () => ({
  NewPostButton: () => <button>New Post</button>,
}));

function assertLoadingContent(container: HTMLElement) {
  const status = screen.getByRole('status');
  expect(status).toHaveTextContent(/loading event/i);
  expect(status.closest('[aria-hidden="true"]')).toBeNull();
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Private roster')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Private add-ons')).not.toBeInTheDocument();
}

beforeEach(() => {
  fixture.loading = true;
  fixture.missingHeader = false;
  fixture.title = 'Picnic';
  fixture.description = 'Bring a blanket.';
  fixture.members = undefined;
  fixture.posts = undefined;
});
afterEach(cleanup);

describe('Event page loading content', () => {
  it.each([
    ['page query', () => <EventPageSkeleton />],
    ['route suspense', () => <EventLoading />],
    ['route group suspense', () => <EventRouteLoading />],
  ])('announces once and offers no fake actions for %s', (_name, Component) => {
    const { container } = render(<Component />);
    assertLoadingContent(container);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it.each([
    ['Picnic', 'Bring a blanket.'],
    [
      'A very long private event title describing a full weekend of activities and shared plans',
      'Long private event details. '.repeat(12).trim(),
    ],
  ])(
    'replaces placeholders with settled content for %s',
    (title, description) => {
      fixture.title = title;
      fixture.description = description;
      const view = render(<EventPage />);
      assertLoadingContent(view.container);
      expect(screen.queryByText(title)).not.toBeInTheDocument();
      expect(screen.queryByText(description)).not.toBeInTheDocument();

      fixture.loading = false;
      fixture.members = { count: 3 };
      fixture.posts = { title: 'Private discussion content' };
      view.rerender(<EventPage />);
      expect(
        screen.getByRole('heading', { level: 1, name: title })
      ).toBeVisible();
      expect(screen.getByText(description)).toBeVisible();
      expect(
        screen.getByRole('region', { name: 'Private roster' })
      ).toBeVisible();
      expect(screen.getByRole('button', { name: 'New Post' })).toBeVisible();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(view.container.querySelector('[aria-busy="true"]')).toBeNull();
    }
  );

  it.each(['header', 'feed'])(
    'does not misrepresent a settled missing %s as indefinite loading',
    missing => {
      fixture.loading = false;
      fixture.members = null;
      fixture.posts =
        missing === 'feed' ? null : { title: 'Private discussion' };
      fixture.missingHeader = missing === 'header';
      const { container } = render(<EventPage />);
      expect(screen.queryByRole('status')).toBeNull();
      expect(screen.queryByRole('heading')).toBeNull();
      expect(screen.queryByRole('button')).toBeNull();
      expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    }
  );

  it('keeps header and actions private until the feed settles, then permits a restricted roster', () => {
    fixture.loading = false;
    fixture.members = null;
    const view = render(<EventPage />);
    assertLoadingContent(view.container);
    fixture.posts = { title: 'Discussion without roster access' };
    view.rerender(<EventPage />);
    expect(screen.getByRole('heading', { name: 'Picnic' })).toBeVisible();
    expect(screen.getByText('Discussion without roster access')).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Private roster' })).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
