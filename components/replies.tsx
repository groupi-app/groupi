import ReplyFeed from "@/components/reply-feed";
import ReplyForm from "@/components/reply-form";

export default function Replies({
  postId,
  userId,
}: {
  postId: string;
  userId: string;
}) {
  return (
    <div className="flex flex-col my-12">
      <h1 className="text-2xl font-heading font-medium mb-4">Replies</h1>
      <div className="flex flex-col gap-4">
        <ReplyForm postId={postId} userId={userId} />
        <ReplyFeed postId={postId} />
      </div>
    </div>
  );
}
