import { PostCard } from "@/components/post-card";
import { PostWithAuthorInfo } from "@/types";
import { Person } from "@prisma/client";

export default function PostFeed({
  posts,
  isMod,
  userId,
}: {
  posts: PostWithAuthorInfo[];
  isMod: boolean;
  userId: string;
}) {
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
            <PostCard userId={userId} isMod={isMod} key={post.id} post={post} />
          ))}
      </div>
    </div>
  );
}
