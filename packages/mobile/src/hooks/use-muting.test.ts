import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  mutation: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('react', () => ({
  useCallback: <T>(callback: T) => callback,
}));

vi.mock('convex/react', () => ({
  useQuery: mocks.useQuery,
  useMutation: () => mocks.mutation,
}));

vi.mock('convex/_generated/api', () => ({
  api: {
    muting: {
      queries: { isEventMuted: 'isEventMuted' },
      mutations: { toggleEventMute: 'toggleEventMute' },
    },
  },
}));

vi.mock('@groupi/shared/platform', () => ({
  toast: {
    success: mocks.success,
    error: mocks.error,
  },
}));

import { useIsEventMuted, useToggleEventMute } from './use-muting';

describe('event muting hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the boolean mute state from the query result', () => {
    mocks.useQuery.mockReturnValueOnce({ isMuted: false });
    expect(useIsEventMuted('event-123')).toBe(false);

    mocks.useQuery.mockReturnValueOnce({ isMuted: true });
    expect(useIsEventMuted('event-123')).toBe(true);
  });

  it('uses the mutation isMuted result for the success message', async () => {
    mocks.mutation.mockResolvedValueOnce({ isMuted: true });
    await useToggleEventMute()('event-123');
    expect(mocks.success).toHaveBeenLastCalledWith('Event muted');

    mocks.mutation.mockResolvedValueOnce({ isMuted: false });
    await useToggleEventMute()('event-123');
    expect(mocks.success).toHaveBeenLastCalledWith('Event unmuted');
  });
});
