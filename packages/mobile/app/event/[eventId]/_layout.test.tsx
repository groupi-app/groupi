import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  completionStatus: undefined as unknown,
  pathname: '/event/event-123',
  requestedEventIds: [] as Array<string | undefined>,
  replace: vi.fn(),
}));

vi.mock('react', async importOriginal => {
  const actual = (await importOriginal()) as typeof import('react');
  return {
    ...actual,
    useEffect: (effect: () => void) => effect(),
  };
});

vi.mock('expo-router', () => ({
  router: { replace: mocks.replace },
  Stack: 'Stack',
  useLocalSearchParams: () => ({ eventId: 'event-123' }),
  usePathname: () => mocks.pathname,
}));

vi.mock('../../../src/hooks/use-addons', () => ({
  useAddonCompletionStatus: (eventId: string | undefined) => {
    mocks.requestedEventIds.push(eventId);
    return mocks.completionStatus;
  },
}));
vi.mock('../../../src/components/molecules', () => ({
  LoadingState: 'LoadingState',
}));
vi.mock('../../../src/components/ui/safe-area-view', () => ({
  SafeAreaView: 'SafeAreaView',
}));

import EventLayout from './_layout';

describe('event layout completion gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pathname = '/event/event-123';
    mocks.requestedEventIds.length = 0;
  });

  it('loads completion status and redirects gated event routes', () => {
    mocks.completionStatus = {
      isOrganizer: false,
      availability: { required: true, completed: false },
      addons: [{ addonType: 'questionnaire', completed: false }],
    };

    const layout = EventLayout();

    expect(mocks.requestedEventIds).toEqual(['event-123']);
    expect(mocks.replace).toHaveBeenCalledWith('/event/event-123/availability');
    expect(layout.type).toBe('SafeAreaView');
  });

  it('does not query or redirect from a required completion route', () => {
    mocks.pathname = '/event/event-123/availability';
    mocks.completionStatus = undefined;

    const layout = EventLayout();

    expect(mocks.requestedEventIds).toEqual([undefined]);
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(layout.type).toBe('Stack');
  });

  it('renders event routes after completion requirements are satisfied', () => {
    mocks.completionStatus = {
      isOrganizer: false,
      availability: { required: true, completed: true },
      addons: [{ addonType: 'questionnaire', completed: true }],
    };

    const layout = EventLayout();

    expect(mocks.replace).not.toHaveBeenCalled();
    expect(layout.type).toBe('Stack');
  });
});
