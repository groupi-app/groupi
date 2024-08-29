import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Post } from "@prisma/client";
import { createPost } from "@/lib/actions/post";
import { auth } from "@clerk/nextjs";

export async function POST(request: Request) {
  const { title, content, eventId, authorId }: Post = await request.json();
  if (!title || !content || !eventId || !authorId) {
    return NextResponse.json(
      { message: "Incomplete Request Object" },
      { status: 400 }
    );
  }

  const { userId }: { userId: string | null } = auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (userId !== authorId) {
    return NextResponse.json(
      { message: "You do not have permission to create a post for this user." },
      { status: 403 }
    );
  }

  const res = await createPost({ title, content, eventId });

  if (!res.success) {
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }

  return NextResponse.json({ message: "Post Created" }, { status: 200 });
}

export async function GET(request: Request) {
  const posts = await db.post.findMany({
    include: {
      replies: true,
    },
  });
  return NextResponse.json(posts, { status: 200 });
}
