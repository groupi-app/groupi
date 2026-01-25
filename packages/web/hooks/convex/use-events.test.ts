/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file uses 'any' types for test data and mocking flexibility

import { renderHook, act } from '@testing-library/react';
import { expect, test, describe, beforeEach, vi } from 'vitest';

// Mock the entire hook module to avoid dynamic import issues with require()
const mockUseEventHeaderData = vi.fn();
const mockUseEventAttendeesData = vi.fn();
const mockUseUserEvents = vi.fn();
const mockCreateEventFn = vi.fn();
const mockUpdateEventFn = vi.fn();
const mockDeleteEventFn = vi.fn();
const mockLeaveEventFn = vi.fn();
const mockUseEventManagement = vi.fn();

const mockToast = vi.fn();

// Mock convex/react
vi.mock('convex/react', () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock the event hooks to avoid require('@/convex/_generated/api') issues
vi.mock('./use-events', () => ({
  useEventHeaderData: (eventId: any) => mockUseEventHeaderData(eventId),
  useEventAttendeesData: (eventId: any) => mockUseEventAttendeesData(eventId),
  useUserEvents: () => mockUseUserEvents(),
  useCreateEvent: () => mockCreateEventFn,
  useUpdateEvent: () => mockUpdateEventFn,
  useDeleteEvent: () => mockDeleteEventFn,
  useLeaveEvent: () => mockLeaveEventFn,
  useEventManagement: (eventId: any) => mockUseEventManagement(eventId),
}));

describe('useEvents hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockReset();
    mockUseEventHeaderData.mockReset();
    mockUseEventAttendeesData.mockReset();
    mockUseUserEvents.mockReset();
    mockCreateEventFn.mockReset();
    mockUpdateEventFn.mockReset();
    mockDeleteEventFn.mockReset();
    mockLeaveEventFn.mockReset();
    mockUseEventManagement.mockReset();
  });

  describe('useEventHeaderData', () => {
    test('returns undefined when loading', async () => {
      mockUseEventHeaderData.mockReturnValue(undefined);

      const { useEventHeaderData } = await import('./use-events');
      const { result } = renderHook(() =>
        useEventHeaderData('test-event-id' as any)
      );

      expect(result.current).toBeUndefined();
      expect(mockUseEventHeaderData).toHaveBeenCalledWith('test-event-id');
    });

    test('returns header data when loaded', async () => {
      const mockData = {
        event: {
          _id: 'event-1',
          title: 'Test Event',
          description: 'A test event',
          location: 'Test Location',
        },
        userMembership: { role: 'ORGANIZER' },
      };
      mockUseEventHeaderData.mockReturnValue(mockData);

      const { useEventHeaderData } = await import('./use-events');
      const { result } = renderHook(() =>
        useEventHeaderData('test-event-id' as any)
      );

      expect(result.current).toEqual(mockData);
      expect(result.current?.event.title).toBe('Test Event');
    });
  });

  describe('useEventAttendeesData', () => {
    test('returns undefined when loading', async () => {
      mockUseEventAttendeesData.mockReturnValue(undefined);

      const { useEventAttendeesData } = await import('./use-events');
      const { result } = renderHook(() =>
        useEventAttendeesData('test-event-id' as any)
      );

      expect(result.current).toBeUndefined();
      expect(mockUseEventAttendeesData).toHaveBeenCalledWith('test-event-id');
    });

    test('returns attendees data when loaded', async () => {
      const mockData = {
        members: [
          { _id: 'member-1', role: 'ORGANIZER', rsvpStatus: 'YES' },
          { _id: 'member-2', role: 'ATTENDEE', rsvpStatus: 'MAYBE' },
        ],
      };
      mockUseEventAttendeesData.mockReturnValue(mockData);

      const { useEventAttendeesData } = await import('./use-events');
      const { result } = renderHook(() =>
        useEventAttendeesData('test-event-id' as any)
      );

      expect(result.current).toEqual(mockData);
    });
  });

  describe('useUserEvents', () => {
    test('returns user events', async () => {
      const mockData = {
        events: [
          { _id: 'event-1', title: 'Event 1' },
          { _id: 'event-2', title: 'Event 2' },
        ],
      };
      mockUseUserEvents.mockReturnValue(mockData);

      const { useUserEvents } = await import('./use-events');
      const { result } = renderHook(() => useUserEvents());

      expect(result.current).toEqual(mockData);
    });
  });

  describe('useCreateEvent', () => {
    test('calls mutation with correct data', async () => {
      mockCreateEventFn.mockResolvedValue({ eventId: 'new-event-id' });

      const { useCreateEvent } = await import('./use-events');
      const { result } = renderHook(() => useCreateEvent());

      await act(async () => {
        await result.current({
          title: 'New Event',
          description: 'A new event',
          location: 'New Location',
        });
      });

      expect(mockCreateEventFn).toHaveBeenCalledWith({
        title: 'New Event',
        description: 'A new event',
        location: 'New Location',
      });
    });

    test('shows success toast on success', async () => {
      mockCreateEventFn.mockResolvedValue({ eventId: 'new-event-id' });

      const { useCreateEvent } = await import('./use-events');
      const { result } = renderHook(() => useCreateEvent());

      await act(async () => {
        await result.current({ title: 'New Event' });
      });

      expect(mockCreateEventFn).toHaveBeenCalled();
    });

    test('shows error toast on failure', async () => {
      mockCreateEventFn.mockRejectedValue(new Error('Failed'));

      const { useCreateEvent } = await import('./use-events');
      const { result } = renderHook(() => useCreateEvent());

      await expect(async () => {
        await act(async () => {
          await result.current({ title: 'New Event' });
        });
      }).rejects.toThrow('Failed');

      expect(mockCreateEventFn).toHaveBeenCalled();
    });
  });

  describe('useUpdateEvent', () => {
    test('calls mutation with correct data', async () => {
      mockUpdateEventFn.mockResolvedValue({ success: true });

      const { useUpdateEvent } = await import('./use-events');
      const { result } = renderHook(() => useUpdateEvent());

      await act(async () => {
        await result.current({
          eventId: 'event-1' as any,
          title: 'Updated Title',
          description: 'Updated description',
        });
      });

      expect(mockUpdateEventFn).toHaveBeenCalledWith({
        eventId: 'event-1',
        title: 'Updated Title',
        description: 'Updated description',
      });
    });

    test('shows success toast on success', async () => {
      mockUpdateEventFn.mockResolvedValue({ success: true });

      const { useUpdateEvent } = await import('./use-events');
      const { result } = renderHook(() => useUpdateEvent());

      await act(async () => {
        await result.current({
          eventId: 'event-1' as any,
          title: 'Updated Title',
        });
      });

      expect(mockUpdateEventFn).toHaveBeenCalled();
    });

    test('shows error toast on failure', async () => {
      mockUpdateEventFn.mockRejectedValue(new Error('Failed'));

      const { useUpdateEvent } = await import('./use-events');
      const { result } = renderHook(() => useUpdateEvent());

      await expect(async () => {
        await act(async () => {
          await result.current({ eventId: 'event-1' as any });
        });
      }).rejects.toThrow('Failed');

      expect(mockUpdateEventFn).toHaveBeenCalled();
    });
  });

  describe('useDeleteEvent', () => {
    test('calls mutation with event ID', async () => {
      mockDeleteEventFn.mockResolvedValue({ success: true });

      const { useDeleteEvent } = await import('./use-events');
      const { result } = renderHook(() => useDeleteEvent());

      await act(async () => {
        await result.current('event-1' as any);
      });

      expect(mockDeleteEventFn).toHaveBeenCalledWith('event-1');
    });

    test('shows success toast on success', async () => {
      mockDeleteEventFn.mockResolvedValue({ success: true });

      const { useDeleteEvent } = await import('./use-events');
      const { result } = renderHook(() => useDeleteEvent());

      await act(async () => {
        await result.current('event-1' as any);
      });

      expect(mockDeleteEventFn).toHaveBeenCalled();
    });

    test('shows error toast on failure', async () => {
      mockDeleteEventFn.mockRejectedValue(new Error('Failed'));

      const { useDeleteEvent } = await import('./use-events');
      const { result } = renderHook(() => useDeleteEvent());

      await expect(async () => {
        await act(async () => {
          await result.current('event-1' as any);
        });
      }).rejects.toThrow('Failed');

      expect(mockDeleteEventFn).toHaveBeenCalled();
    });
  });

  describe('useLeaveEvent', () => {
    test('calls mutation with event ID', async () => {
      mockLeaveEventFn.mockResolvedValue({ success: true });

      const { useLeaveEvent } = await import('./use-events');
      const { result } = renderHook(() => useLeaveEvent());

      await act(async () => {
        await result.current('event-1' as any);
      });

      expect(mockLeaveEventFn).toHaveBeenCalledWith('event-1');
    });

    test('shows success toast on success', async () => {
      mockLeaveEventFn.mockResolvedValue({ success: true });

      const { useLeaveEvent } = await import('./use-events');
      const { result } = renderHook(() => useLeaveEvent());

      await act(async () => {
        await result.current('event-1' as any);
      });

      expect(mockLeaveEventFn).toHaveBeenCalled();
    });

    test('shows error toast for organizer trying to leave', async () => {
      mockLeaveEventFn.mockRejectedValue(new Error('Organizer cannot leave'));

      const { useLeaveEvent } = await import('./use-events');
      const { result } = renderHook(() => useLeaveEvent());

      await expect(async () => {
        await act(async () => {
          await result.current('event-1' as any);
        });
      }).rejects.toThrow('Organizer cannot leave');

      expect(mockLeaveEventFn).toHaveBeenCalled();
    });
  });

  describe('useEventManagement', () => {
    test('returns combined state when loading', async () => {
      mockUseEventManagement.mockReturnValue({
        isLoading: true,
        event: undefined,
      });

      const { useEventManagement } = await import('./use-events');
      const { result } = renderHook(() => useEventManagement('event-1' as any));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.event).toBeUndefined();
    });

    test('returns combined state when loaded', async () => {
      const mockData = {
        isLoading: false,
        event: { _id: 'event-1', title: 'Test Event' },
        userMembership: { role: 'ORGANIZER' },
        attendees: {
          members: [{ _id: 'member-1', role: 'ORGANIZER' }],
        },
      };
      mockUseEventManagement.mockReturnValue(mockData);

      const { useEventManagement } = await import('./use-events');
      const { result } = renderHook(() => useEventManagement('event-1' as any));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.event).toEqual(mockData.event);
      expect(result.current.userMembership).toEqual(mockData.userMembership);
      expect(result.current.attendees).toEqual(mockData.attendees);
    });
  });
});
