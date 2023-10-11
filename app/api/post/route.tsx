import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();

  //TODO: Add validation for body.title, body.content, body.eventId, and body.authorId
  //TODO: Error handling

  const result = await db.post.create({
    data: {
      title: body.title,
      content: body.content,
      event: {
        connect: {
          id: body.eventId,
        },
      },
      author: {
        connect: {
          id: body.authorId,
        },
      },
    },
  });

  if (!result) {
    return NextResponse.json(
      { message: "Error creating post" },
      { status: 400 }
    );
  }

  return NextResponse.json(result, { status: 200 });
}
