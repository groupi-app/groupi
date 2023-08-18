import { PostCard } from "@/components/post-card";
import { Post } from "@/types";

interface PostFeedProps {
  posts: Post[];
}

export default function PostFeed({ posts }: PostFeedProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-heading">Posts</h2>
      <div className="w-full flex flex-col items-center gap-3 py-2">
        {posts.map((post) => (
          <PostCard post={post} />
        ))}
      </div>
    </div>
  );
}
