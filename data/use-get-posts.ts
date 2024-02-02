import { fetchPosts } from "@/lib/actions/posts";
import { useQuery } from "@tanstack/react-query";

export function useGetPosts(eventId: string) {
  return useQuery({
    queryFn: async () => fetchPosts(eventId),
    queryKey: ["posts", eventId],
  });
}