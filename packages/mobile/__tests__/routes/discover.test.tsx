import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { getFunctionName } from 'convex/server';

// Keep newer shared SDK factories real; this legacy route fixture mocks only transport.
vi.mock('@groupi/shared/hooks', async importOriginal => ({
  ...(await importOriginal<typeof import('@groupi/shared/hooks')>()),
}));

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  join: vi.fn(),
  push: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@rn-primitives/slot', () => ({ Text: 'Text' }));
vi.mock('uniwind', () => ({
  useCSSVariable: () => 'transparent',
  withUniwind: <T,>(component: T) => component,
}));
vi.mock('expo-router', () => ({ router: { push: mocks.push } }));
vi.unmock('convex/_generated/api');
vi.mock('convex/react', () => ({
  useQuery: mocks.query,
  useMutation: () => mocks.join,
}));
vi.mock('@groupi/shared/platform', () => ({
  toast: { success: mocks.success, error: mocks.error },
}));
vi.mock('../../src/components/templates', () => ({
  ListScreenTemplate: 'ListScreenTemplate',
}));
vi.mock('../../src/components/molecules', () => ({
  LoadingState: 'LoadingState',
}));
vi.mock('../../src/components/members/member-avatar', () => ({
  MemberAvatar: 'MemberAvatar',
}));
import DiscoverScreen from '../../app/(tabs)/discover';

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (typeof node === 'string' || typeof node === 'number') return [];
  if (!isValidElement<Record<string, unknown>>(node))
    return Children.toArray(node).flatMap(elements);
  return [node, ...elements(node.props.children as ReactNode)];
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.mockImplementation(query =>
    getFunctionName(query) === 'events/queries:getDiscoverableEvents'
      ? [
          {
            eventId: 'event-1',
            title: 'Friends picnic',
            accessReasons: { friends: true, groups: [] },
            entryAction: 'JOIN',
          },
        ]
      : undefined
  );
  mocks.join.mockResolvedValue({ success: true, membershipId: 'member-1' });
});
it('opens native Discover logistics without joining or changing RSVP', async () => {
  const list = elements(DiscoverScreen()).find(
    element => element.type === 'FlatList'
  );
  const card = (
    list!.props.renderItem as (args: { item: unknown }) => ReactNode
  )({ item: (list!.props.data as unknown[])[0] });
  const view = elements(card).find(
    element => element.props.accessibilityLabel === 'View Friends picnic'
  );
  await (view!.props.onPress as () => Promise<void>)();
  expect(getFunctionName(mocks.query.mock.calls[0][0])).toBe(
    'events/queries:getDiscoverableEvents'
  );
  expect(mocks.query.mock.calls[0][1]).toEqual({});
  expect(mocks.join).not.toHaveBeenCalled();
  expect(mocks.success).not.toHaveBeenCalled();
  expect(mocks.push).toHaveBeenCalledWith('/event/event-1/preview');
});
