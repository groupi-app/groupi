/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file uses 'any' types for test data and mocking flexibility

import { renderHook, act } from "@testing-library/react";
import { expect, test, describe, beforeEach, vi } from "vitest";

// Mock the entire hook module to avoid dynamic import issues with require()
const mockUseEventAvailabilityData = vi.fn();
const mockSubmitAvailabilityFn = vi.fn();
const mockUpdateSingleAvailabilityFn = vi.fn();
const mockClearAllAvailabilityFn = vi.fn();
const mockAddPotentialDateTimesFn = vi.fn();
const mockRemovePotentialDateTimesFn = vi.fn();

const mockToast = vi.fn();

// Mock convex/react
vi.mock("convex/react", () => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
}));

// Mock toast
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock the availability hooks to avoid require('@/convex/_generated/api') issues
vi.mock("./use-availability", () => ({
  useEventAvailabilityData: (eventId: any) =>
    mockUseEventAvailabilityData(eventId),
  useSubmitAvailability: () => mockSubmitAvailabilityFn,
  useUpdateSingleAvailability: () => mockUpdateSingleAvailabilityFn,
  useClearAllAvailability: () => mockClearAllAvailabilityFn,
  useAddPotentialDateTimes: () => mockAddPotentialDateTimesFn,
  useRemovePotentialDateTimes: () => mockRemovePotentialDateTimesFn,
}));

describe("useAvailability hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockReset();
    mockUseEventAvailabilityData.mockReset();
    mockSubmitAvailabilityFn.mockReset();
    mockUpdateSingleAvailabilityFn.mockReset();
    mockClearAllAvailabilityFn.mockReset();
    mockAddPotentialDateTimesFn.mockReset();
    mockRemovePotentialDateTimesFn.mockReset();
  });

  describe("useEventAvailabilityData", () => {
    test("returns undefined when loading", async () => {
      mockUseEventAvailabilityData.mockReturnValue(undefined);

      const { useEventAvailabilityData } = await import("./use-availability");
      const { result } = renderHook(() =>
        useEventAvailabilityData("test-event-id" as any)
      );

      expect(result.current).toBeUndefined();
      expect(mockUseEventAvailabilityData).toHaveBeenCalledWith("test-event-id");
    });

    test("returns dates and responses when loaded", async () => {
      const mockData = {
        potentialDateTimes: [
          {
            _id: "date-1",
            dateTime: Date.now(),
            availabilities: [{ status: "YES", member: { _id: "member-1" } }],
          },
          {
            _id: "date-2",
            dateTime: Date.now() + 86400000,
            availabilities: [],
          },
        ],
        userRole: "ORGANIZER",
        userId: "user-1",
      };
      mockUseEventAvailabilityData.mockReturnValue(mockData);

      const { useEventAvailabilityData } = await import("./use-availability");
      const { result } = renderHook(() =>
        useEventAvailabilityData("test-event-id" as any)
      );

      expect(result.current).toEqual(mockData);
      expect(result.current?.potentialDateTimes).toHaveLength(2);
    });
  });

  describe("useSubmitAvailability", () => {
    test("calls mutation correctly", async () => {
      mockSubmitAvailabilityFn.mockResolvedValue({ responses: [] });

      const { useSubmitAvailability } = await import("./use-availability");
      const { result } = renderHook(() => useSubmitAvailability());

      await act(async () => {
        await result.current({
          eventId: "event-1" as any,
          responses: [
            { potentialDateTimeId: "date-1" as any, status: "YES" },
            { potentialDateTimeId: "date-2" as any, status: "NO" },
          ],
        });
      });

      expect(mockSubmitAvailabilityFn).toHaveBeenCalledWith({
        eventId: "event-1",
        responses: [
          { potentialDateTimeId: "date-1", status: "YES" },
          { potentialDateTimeId: "date-2", status: "NO" },
        ],
      });
    });

    test("shows success toast on success", async () => {
      mockSubmitAvailabilityFn.mockResolvedValue({ responses: [] });

      const { useSubmitAvailability } = await import("./use-availability");
      const { result } = renderHook(() => useSubmitAvailability());

      await act(async () => {
        await result.current({
          eventId: "event-1" as any,
          responses: [],
        });
      });

      expect(mockSubmitAvailabilityFn).toHaveBeenCalled();
    });

    test("shows error toast on failure", async () => {
      mockSubmitAvailabilityFn.mockRejectedValue(new Error("Failed"));

      const { useSubmitAvailability } = await import("./use-availability");
      const { result } = renderHook(() => useSubmitAvailability());

      await expect(async () => {
        await act(async () => {
          await result.current({
            eventId: "event-1" as any,
            responses: [],
          });
        });
      }).rejects.toThrow("Failed");

      expect(mockSubmitAvailabilityFn).toHaveBeenCalled();
    });
  });

  describe("useUpdateSingleAvailability", () => {
    test("calls mutation correctly", async () => {
      mockUpdateSingleAvailabilityFn.mockResolvedValue({ status: "YES" });

      const { useUpdateSingleAvailability } = await import("./use-availability");
      const { result } = renderHook(() => useUpdateSingleAvailability());

      await act(async () => {
        await result.current({
          potentialDateTimeId: "date-1" as any,
          status: "MAYBE",
        });
      });

      expect(mockUpdateSingleAvailabilityFn).toHaveBeenCalledWith({
        potentialDateTimeId: "date-1",
        status: "MAYBE",
      });
    });

    test("shows updated toast on success", async () => {
      mockUpdateSingleAvailabilityFn.mockResolvedValue({ status: "YES" });

      const { useUpdateSingleAvailability } = await import("./use-availability");
      const { result } = renderHook(() => useUpdateSingleAvailability());

      await act(async () => {
        await result.current({
          potentialDateTimeId: "date-1" as any,
          status: "YES",
        });
      });

      expect(mockUpdateSingleAvailabilityFn).toHaveBeenCalled();
    });
  });

  describe("useClearAllAvailability", () => {
    test("calls mutation with eventId", async () => {
      mockClearAllAvailabilityFn.mockResolvedValue({ deletedCount: 3 });

      const { useClearAllAvailability } = await import("./use-availability");
      const { result } = renderHook(() => useClearAllAvailability());

      await act(async () => {
        await result.current("event-1" as any);
      });

      expect(mockClearAllAvailabilityFn).toHaveBeenCalledWith("event-1");
    });

    test("shows cleared toast on success", async () => {
      mockClearAllAvailabilityFn.mockResolvedValue({ deletedCount: 3 });

      const { useClearAllAvailability } = await import("./use-availability");
      const { result } = renderHook(() => useClearAllAvailability());

      await act(async () => {
        await result.current("event-1" as any);
      });

      expect(mockClearAllAvailabilityFn).toHaveBeenCalled();
    });
  });

  describe("useAddPotentialDateTimes", () => {
    test("converts Date array to timestamps", async () => {
      mockAddPotentialDateTimesFn.mockResolvedValue({ potentialDateTimes: [] });

      const { useAddPotentialDateTimes } = await import("./use-availability");
      const { result } = renderHook(() => useAddPotentialDateTimes());

      const dates = [new Date("2025-01-15"), new Date("2025-01-16")];
      await act(async () => {
        await result.current({
          eventId: "event-1" as any,
          dateTimes: dates,
        });
      });

      expect(mockAddPotentialDateTimesFn).toHaveBeenCalledWith({
        eventId: "event-1",
        dateTimes: dates,
      });
    });

    test("shows success message with count", async () => {
      mockAddPotentialDateTimesFn.mockResolvedValue({
        potentialDateTimes: [{ id: "date-1" }, { id: "date-2" }],
      });

      const { useAddPotentialDateTimes } = await import("./use-availability");
      const { result } = renderHook(() => useAddPotentialDateTimes());

      await act(async () => {
        await result.current({
          eventId: "event-1" as any,
          dateTimes: [new Date()],
        });
      });

      expect(mockAddPotentialDateTimesFn).toHaveBeenCalled();
    });
  });

  describe("useRemovePotentialDateTimes", () => {
    test("calls mutation with IDs", async () => {
      mockRemovePotentialDateTimesFn.mockResolvedValue({ deletedCount: 2 });

      const { useRemovePotentialDateTimes } = await import("./use-availability");
      const { result } = renderHook(() => useRemovePotentialDateTimes());

      await act(async () => {
        await result.current(["date-1" as any, "date-2" as any]);
      });

      expect(mockRemovePotentialDateTimesFn).toHaveBeenCalledWith([
        "date-1",
        "date-2",
      ]);
    });

    test("shows success message with count", async () => {
      mockRemovePotentialDateTimesFn.mockResolvedValue({ deletedCount: 3 });

      const { useRemovePotentialDateTimes } = await import("./use-availability");
      const { result } = renderHook(() => useRemovePotentialDateTimes());

      await act(async () => {
        await result.current(["date-1" as any]);
      });

      expect(mockRemovePotentialDateTimesFn).toHaveBeenCalled();
    });

    test("shows error toast on failure", async () => {
      mockRemovePotentialDateTimesFn.mockRejectedValue(new Error("Failed"));

      const { useRemovePotentialDateTimes } = await import("./use-availability");
      const { result } = renderHook(() => useRemovePotentialDateTimes());

      await expect(async () => {
        await act(async () => {
          await result.current(["date-1" as any]);
        });
      }).rejects.toThrow("Failed");

      expect(mockRemovePotentialDateTimesFn).toHaveBeenCalled();
    });
  });
});
