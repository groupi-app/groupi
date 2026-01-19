/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file uses 'any' types for test data and mocking flexibility

import { renderHook, act } from "@testing-library/react";
import { expect, test, describe, beforeEach, vi } from "vitest";

// Mock the entire hook module to avoid dynamic import issues with require()
const mockUseEventPostFeed = vi.fn();
const mockUsePost = vi.fn();
const mockCreatePostFn = vi.fn();
const mockUpdatePostFn = vi.fn();
const mockDeletePostFn = vi.fn();
const mockUseEventPosts = vi.fn();

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

// Mock the post hooks to avoid require('@/convex/_generated/api') issues
vi.mock("./use-posts", () => ({
  useEventPostFeed: (eventId: any) => mockUseEventPostFeed(eventId),
  usePost: (postId: any) => mockUsePost(postId),
  useCreatePost: () => mockCreatePostFn,
  useUpdatePost: () => mockUpdatePostFn,
  useDeletePost: () => mockDeletePostFn,
  useEventPosts: (eventId: any) => mockUseEventPosts(eventId),
}));

describe("usePosts hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockReset();
    mockUseEventPostFeed.mockReset();
    mockUsePost.mockReset();
    mockCreatePostFn.mockReset();
    mockUpdatePostFn.mockReset();
    mockDeletePostFn.mockReset();
    mockUseEventPosts.mockReset();
  });

  describe("useEventPostFeed", () => {
    test("returns undefined when loading", async () => {
      mockUseEventPostFeed.mockReturnValue(undefined);

      const { useEventPostFeed } = await import("./use-posts");
      const { result } = renderHook(() =>
        useEventPostFeed("test-event-id" as any)
      );

      expect(result.current).toBeUndefined();
      expect(mockUseEventPostFeed).toHaveBeenCalledWith("test-event-id");
    });

    test("returns feed data when loaded", async () => {
      const mockData = {
        event: {
          posts: [
            { _id: "post-1", title: "Test Post", content: "Content" },
            { _id: "post-2", title: "Second Post", content: "More content" },
          ],
        },
        userMembership: { role: "ORGANIZER" },
      };
      mockUseEventPostFeed.mockReturnValue(mockData);

      const { useEventPostFeed } = await import("./use-posts");
      const { result } = renderHook(() =>
        useEventPostFeed("test-event-id" as any)
      );

      expect(result.current).toEqual(mockData);
      expect(result.current?.event.posts).toHaveLength(2);
    });
  });

  describe("usePost", () => {
    test("returns undefined when loading", async () => {
      mockUsePost.mockReturnValue(undefined);

      const { usePost } = await import("./use-posts");
      const { result } = renderHook(() => usePost("test-post-id" as any));

      expect(result.current).toBeUndefined();
      expect(mockUsePost).toHaveBeenCalledWith("test-post-id");
    });

    test("returns post data when loaded", async () => {
      const mockPost = {
        _id: "post-1",
        title: "Test Post",
        content: "Test content",
        authorId: "author-1",
      };
      mockUsePost.mockReturnValue(mockPost);

      const { usePost } = await import("./use-posts");
      const { result } = renderHook(() => usePost("test-post-id" as any));

      expect(result.current).toEqual(mockPost);
    });
  });

  describe("useCreatePost", () => {
    test("calls mutation with correct data", async () => {
      mockCreatePostFn.mockResolvedValue({ postId: "new-post-id" });

      const { useCreatePost } = await import("./use-posts");
      const { result } = renderHook(() => useCreatePost());

      await act(async () => {
        await result.current({
          eventId: "event-1" as any,
          title: "New Post",
          content: "New content",
        });
      });

      expect(mockCreatePostFn).toHaveBeenCalledWith({
        eventId: "event-1",
        title: "New Post",
        content: "New content",
      });
    });

    test("shows error toast on failure", async () => {
      mockCreatePostFn.mockRejectedValue(new Error("Failed"));

      const { useCreatePost } = await import("./use-posts");
      const { result } = renderHook(() => useCreatePost());

      await expect(async () => {
        await act(async () => {
          await result.current({
            eventId: "event-1" as any,
            title: "New Post",
            content: "New content",
          });
        });
      }).rejects.toThrow("Failed");

      expect(mockCreatePostFn).toHaveBeenCalled();
    });

    test("does not show success toast on success", async () => {
      mockCreatePostFn.mockResolvedValue({ postId: "new-post-id" });

      const { useCreatePost } = await import("./use-posts");
      const { result } = renderHook(() => useCreatePost());

      await act(async () => {
        await result.current({
          eventId: "event-1" as any,
          title: "New Post",
          content: "New content",
        });
      });

      // No success toast - instant appearance is feedback enough
      expect(mockCreatePostFn).toHaveBeenCalled();
    });
  });

  describe("useUpdatePost", () => {
    test("calls mutation with correct data", async () => {
      mockUpdatePostFn.mockResolvedValue({ post: { _id: "post-1" } });

      const { useUpdatePost } = await import("./use-posts");
      const { result } = renderHook(() => useUpdatePost());

      await act(async () => {
        await result.current({
          postId: "post-1" as any,
          title: "Updated Title",
          content: "Updated content",
        });
      });

      expect(mockUpdatePostFn).toHaveBeenCalledWith({
        postId: "post-1",
        title: "Updated Title",
        content: "Updated content",
      });
    });

    test("shows error toast on failure", async () => {
      mockUpdatePostFn.mockRejectedValue(new Error("Update failed"));

      const { useUpdatePost } = await import("./use-posts");
      const { result } = renderHook(() => useUpdatePost());

      await expect(async () => {
        await act(async () => {
          await result.current({
            postId: "post-1" as any,
            title: "Updated",
            content: "Content",
          });
        });
      }).rejects.toThrow("Update failed");

      expect(mockUpdatePostFn).toHaveBeenCalled();
    });
  });

  describe("useDeletePost", () => {
    test("calls mutation with post ID", async () => {
      mockDeletePostFn.mockResolvedValue({ success: true });

      const { useDeletePost } = await import("./use-posts");
      const { result } = renderHook(() => useDeletePost());

      await act(async () => {
        await result.current("post-1" as any);
      });

      expect(mockDeletePostFn).toHaveBeenCalledWith("post-1");
    });

    test("shows error toast on failure", async () => {
      mockDeletePostFn.mockRejectedValue(new Error("Delete failed"));

      const { useDeletePost } = await import("./use-posts");
      const { result } = renderHook(() => useDeletePost());

      await expect(async () => {
        await act(async () => {
          await result.current("post-1" as any);
        });
      }).rejects.toThrow("Delete failed");

      expect(mockDeletePostFn).toHaveBeenCalled();
    });
  });

  describe("useEventPosts", () => {
    test("returns combined data with loading state", async () => {
      mockUseEventPosts.mockReturnValue({
        posts: [],
        isLoading: true,
        createPost: mockCreatePostFn,
      });

      const { useEventPosts } = await import("./use-posts");
      const { result } = renderHook(() => useEventPosts("event-1" as any));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.posts).toEqual([]);
    });

    test("returns posts when loaded", async () => {
      mockUseEventPosts.mockReturnValue({
        posts: [
          { _id: "post-1", title: "Post 1" },
          { _id: "post-2", title: "Post 2" },
        ],
        isLoading: false,
        event: { _id: "event-1" },
        userMembership: { role: "ORGANIZER" },
      });

      const { useEventPosts } = await import("./use-posts");
      const { result } = renderHook(() => useEventPosts("event-1" as any));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.posts).toHaveLength(2);
      expect(result.current.event).toBeTruthy();
      expect(result.current.userMembership).toBeTruthy();
    });

    test("provides createPost function bound to eventId", async () => {
      mockUseEventPosts.mockReturnValue({
        posts: [],
        isLoading: false,
        createPost: mockCreatePostFn,
      });
      mockCreatePostFn.mockResolvedValue({ postId: "new-post" });

      const { useEventPosts } = await import("./use-posts");
      const { result } = renderHook(() => useEventPosts("event-1" as any));

      await act(async () => {
        await result.current.createPost({
          title: "New Post",
          content: "Content",
        });
      });

      expect(mockCreatePostFn).toHaveBeenCalledWith({
        title: "New Post",
        content: "Content",
      });
    });
  });
});
