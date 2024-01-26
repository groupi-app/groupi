import { PostCard } from "@/components/post-card";
import { PostWithReplies } from "@/types";

export default function PostFeed({ posts }: { posts: PostWithReplies[] }) {
  return (
    <div>
      <h2 className="text-xl font-heading">Posts</h2>
      <div className="w-full flex flex-col items-center gap-3 py-2">
        {posts
          .sort(
            (a, b) =>
              a.updatedAt.getMilliseconds() - b.updatedAt.getMilliseconds()
          )
          .map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
      </div>
    </div>
  );
}
