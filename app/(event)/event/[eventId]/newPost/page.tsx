import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs";
import { NewPost } from "@/components/new-post";

interface EditorPageProps {
  params: { postId: string };
}

export default async function EditorPage({ params }: EditorPageProps) {
  const user = await currentUser();

  const userId = user ? user.id : "";

  return <NewPost authorId={userId} />;
}
