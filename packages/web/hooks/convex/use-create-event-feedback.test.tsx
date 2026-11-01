import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mutation, feedback } = vi.hoisted(() => ({
  mutation: Object.assign(vi.fn(), { withOptimisticUpdate: vi.fn() }),
  feedback: vi.fn(),
}));
vi.mock('@/convex/_generated/api', () => ({
  api: {
    events: { queries: { getUserEvents: 'getUserEvents' }, mutations: {} },
  },
}));
vi.mock('convex/react', () => ({
  useMutation: () => mutation,
  useQuery: vi.fn(),
}));
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: feedback }),
}));
vi.mock('@/providers/visibility-provider', () => ({ useIsActive: () => true }));

import {
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useLeaveEvent,
} from './use-events';
import type { Id } from '@/convex/_generated/dataModel';

describe('event creation feedback ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutation.withOptimisticUpdate.mockReturnValue(mutation);
  });

  it('returns the result without a second success toast from the hook', async () => {
    mutation.mockResolvedValue({ eventId: 'fixture-event' });
    const { result } = renderHook(() => useCreateEvent());
    await act(async () => {
      await expect(result.current({ title: 'Fixture' })).resolves.toEqual({
        eventId: 'fixture-event',
      });
    });
    expect(mutation).toHaveBeenCalledOnce();
    expect(feedback).not.toHaveBeenCalled();
  });

  it('preserves the failure for the creation form to announce once', async () => {
    const failure = new Error('Create failed');
    mutation.mockRejectedValue(failure);
    const { result } = renderHook(() => useCreateEvent());
    await act(async () => {
      await expect(result.current({ title: 'Fixture' })).rejects.toBe(failure);
    });
    expect(feedback).not.toHaveBeenCalled();
  });

  it.each([
    ['update', useUpdateEvent],
    ['delete', useDeleteEvent],
    ['leave', useLeaveEvent],
  ] as const)(
    'lets the %s dialog or form announce success and failure',
    async (action, hook) => {
      const eventId = 'fixture-event' as Id<'events'>;
      const { result } = renderHook(() => hook());
      const invoke = () =>
        action === 'update'
          ? (result.current as ReturnType<typeof useUpdateEvent>)({
              eventId,
              title: 'Updated',
            })
          : (result.current as ReturnType<typeof useLeaveEvent>)(eventId);
      mutation.mockResolvedValue('done');
      await act(async () => {
        await expect(invoke()).resolves.toBe('done');
      });
      const failure = new Error('Mutation failed');
      mutation.mockRejectedValue(failure);
      await act(async () => {
        await expect(invoke()).rejects.toBe(failure);
      });
      expect(feedback).not.toHaveBeenCalled();
    }
  );

  it('retains optimistic deletion of only the selected event', () => {
    renderHook(() => useDeleteEvent());
    const applyOptimisticUpdate =
      mutation.withOptimisticUpdate.mock.calls[0][0];
    const remaining = { event: { _id: 'keep-event' } };
    const localStore = {
      getQuery: vi
        .fn()
        .mockReturnValue([{ event: { _id: 'delete-event' } }, remaining]),
      setQuery: vi.fn(),
    };
    applyOptimisticUpdate(localStore, { eventId: 'delete-event' });
    expect(localStore.setQuery).toHaveBeenCalledWith('getUserEvents', {}, [
      remaining,
    ]);
  });
});
