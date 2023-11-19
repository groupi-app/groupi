import { currentUser } from "@clerk/nextjs";
import { Editor } from "@/components/editor";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import Link from "next/link";

export default async function Page({
  params,
}: {
  params: { eventId: string };
}) {
  const user = await currentUser();
  const userId = user ? user.id : "";

  const { eventId } = params;

  return (
    <div className="container pt-6">
      <Link href={`/event/${eventId}`}>
        <Button variant={"ghost"} className="flex items-center gap-1 pl-2 mb-4">
          <Icons.back />
          <span>Back</span>
        </Button>
      </Link>

      <Editor authorId={userId} eventId={eventId} />
    </div>
  );
}
