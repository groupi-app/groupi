import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const id = context.params.id;

  const result = await db.post.findUnique({
    where: {
      id: id,
    },
    include: {
      replies: true,
    },
  });

  if (!result) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(result, { status: 200 });
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const id = context.params.id;

  try {
    const result = await db.post.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return NextResponse.json(
          { message: "Post not found" },
          { status: 404 }
        );
      }
      throw e;
    }
  }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  const id = context.params.id;
  const body = await request.json();

  try {
    const result = await db.post.update({
      where: {
        id: id,
      },
      data: {
        title: body.title,
        content: body.content,
      },
    });
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return NextResponse.json(
          { message: "Post not found" },
          { status: 404 }
        );
      }
      throw e;
    }
  }
}
