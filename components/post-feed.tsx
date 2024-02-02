import { PostCard } from "@/components/post-card";
import { getIsMod } from "@/lib/actions/isMod";
import { fetchPosts } from "@/lib/actions/posts";
import { auth } from "@clerk/nextjs";

export default async function PostFeed({ eventId }: { eventId: string }) {
  const data = await fetchPosts(eventId);

  if (data?.error) {
    return <h1>{data.error}</h1>;
  }

  if (data?.success) {
    const posts = data.success;
    const { userId }: { userId: string | null } = auth();

    if (!userId) {
      throw new Error();
    }

    const isMod = await getIsMod(userId, eventId);

    return (
      <div>
        <h2 className="text-xl font-heading">Posts</h2>
        <div className="w-full flex flex-col items-center gap-3 py-2">
          {posts
            .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
            .map((post) => (
              <PostCard
                userId={userId}
                isMod={isMod}
                key={post.id}
                post={post}
              />
            ))}
        </div>
      </div>
    );
  }
}
