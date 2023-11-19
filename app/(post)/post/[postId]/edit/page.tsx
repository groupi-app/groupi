import { currentUser } from "@clerk/nextjs";
import { Editor } from "@/components/editor";
import { db } from "@/lib/db";
import { title } from "process";

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

  return (
    <div className="container pt-6">
      <Editor
        authorId={authorId}
        eventId={eventId}
        postData={{ title, content, id }}
      />
    </div>
  );
}
