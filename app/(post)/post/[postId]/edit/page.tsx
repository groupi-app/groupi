import { Editor } from "@/components/editor";
import ErrorPage from "@/components/error";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs";

export default async function Page({ params }: { params: { postId: string } }) {
  const { postId } = params;

  const user = await currentUser();
  const userId = user ? user.id : "";

  const post = await db.post.findFirst({
    where: {
      id: postId,
    },
  });

  const title = post?.title || "";
  const content = post?.content || "";
  const id = post?.id || "";
  const authorId = post?.authorId || "";
  const eventId = post?.eventId || "";

  if (authorId !== userId) {
    return (
      <ErrorPage message={"You do not have permission to edit this post."} />
    );
  }

  return (
    <div className="container pt-6">
      <Editor eventId={eventId} postData={{ title, content, id }} />
    </div>
  );
}
