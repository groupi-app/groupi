import { act, renderHook } from '@testing-library/react';
import Module from 'node:module';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { Id } from '@/convex/_generated/dataModel';

const mocks = vi.hoisted(() => ({
  chooseEventDate: vi.fn(),
  useMutation: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('convex/react', () => ({
  useMutation: mocks.useMutation,
}));

vi.mock('sonner', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

type NodeModuleLoader = {
  _load: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean
  ) => unknown;
};

const nodeModuleLoader = Module as unknown as NodeModuleLoader;
const originalModuleLoad = nodeModuleLoader._load;
let useChooseDateTime: typeof import('./use-choose-date-time').useChooseDateTime;

describe('useChooseDateTime', () => {
  beforeAll(async () => {
    nodeModuleLoader._load = (request, parent, isMain) => {
      if (request === '@/convex/_generated/api') {
        return {
          api: {
            events: {
              mutations: {
                chooseEventDate: 'chooseEventDate',
              },
            },
          },
        };
      }

      return originalModuleLoad(request, parent, isMain);
    };

    ({ useChooseDateTime } = await import('./use-choose-date-time'));
  });

  afterAll(() => {
    nodeModuleLoader._load = originalModuleLoad;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useMutation.mockReturnValue(mocks.chooseEventDate);
  });

  it('sends an explicit manual selection without a potential date ID', async () => {
    const start = new Date('2026-09-10T18:00:00.000Z');
    const end = new Date('2026-09-10T20:00:00.000Z');
    const mutationResult = { event: { _id: 'event-1' } };
    mocks.chooseEventDate.mockResolvedValue(mutationResult);
    const { result } = renderHook(() => useChooseDateTime());

    let returned: unknown;
    await act(async () => {
      returned = await result.current({
        source: 'manual',
        eventId: 'event-1' as Id<'events'>,
        dateTime: start,
        endDateTime: end,
      });
    });

    expect(mocks.chooseEventDate).toHaveBeenCalledWith({
      eventId: 'event-1',
      chosenDateTime: start.getTime(),
      chosenEndDateTime: end.getTime(),
      selectionSource: 'MANUAL',
      potentialDateTimeId: undefined,
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      'Event date has been chosen!'
    );
    expect(returned).toBe(mutationResult);
  });

  it('sends an explicit poll selection with its required potential date ID', async () => {
    const start = new Date('2026-09-12T15:30:00.000Z');
    mocks.chooseEventDate.mockResolvedValue({ event: { _id: 'event-1' } });
    const { result } = renderHook(() => useChooseDateTime());

    await act(async () => {
      await result.current({
        source: 'poll',
        eventId: 'event-1' as Id<'events'>,
        dateTime: start,
        endDateTime: null,
        potentialDateTimeId: 'potential-date-1' as Id<'potentialDateTimes'>,
      });
    });

    expect(mocks.chooseEventDate).toHaveBeenCalledWith({
      eventId: 'event-1',
      chosenDateTime: start.getTime(),
      chosenEndDateTime: undefined,
      selectionSource: 'POLL',
      potentialDateTimeId: 'potential-date-1',
    });
  });

  it('shows the mutation error and propagates it to the caller', async () => {
    const error = new Error('The selected date is no longer available');
    mocks.chooseEventDate.mockRejectedValue(error);
    const { result } = renderHook(() => useChooseDateTime());

    await expect(
      act(async () => {
        await result.current({
          source: 'manual',
          eventId: 'event-1' as Id<'events'>,
          dateTime: new Date('2026-09-10T18:00:00.000Z'),
        });
      })
    ).rejects.toThrow('The selected date is no longer available');

    expect(mocks.toastError).toHaveBeenCalledWith(
      'The selected date is no longer available'
    );
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });
});
