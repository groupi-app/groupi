import { deletePost, updatePost } from "@/lib/actions/post";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const { title, content } = await request.json();
  if (!title || !content) {
    return NextResponse.json(
      { message: "Incomplete Request Object" },
      { status: 400 }
    );
  }
  const res = await updatePost({ id, title, content });
  if (res.error) {
    return NextResponse.json({ message: res.error }, { status: 400 });
  }
  return NextResponse.json({ message: "Post Updated" }, { status: 200 });
}

export async function DELETE(
  _request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  await deletePost({ id });
  return NextResponse.json({ message: "Post Deleted" }, { status: 200 });
}
