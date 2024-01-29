import { currentUser } from "@clerk/nextjs";
import { Editor } from "@/components/editor";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { db } from "@/lib/db";

export default async function Page({
  params,
}: {
  params: { eventId: string };
}) {
  const user = await currentUser();
  const userId = user ? user.id : "";

  const { eventId } = params;
  const event = await db.event.findUnique({
    where: {
      id: eventId,
    },
  });

  return (
    <div className="container pt-6">
      <Editor authorId={userId} eventId={eventId} />
    </div>
  );
}
