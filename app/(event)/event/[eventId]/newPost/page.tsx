import { currentUser } from "@clerk/nextjs";
import { Editor } from "@/components/editor";

export default async function EditorPage({
  params,
}: {
  params: { eventId: string };
}) {
  const user = await currentUser();
  const userId = user ? user.id : "";

  const { eventId } = params;

  return (
    <div className="container pt-6">
      <Editor authorId={userId} eventId={eventId} />
    </div>
  );
}
