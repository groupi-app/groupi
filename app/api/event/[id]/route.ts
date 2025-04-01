import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const id = (await context.params).id;

  const result = await db.event.findUnique({
    where: {
      id: id,
    },
    include: {
      memberships: true,
    },
  });

  if (!result) {
    return NextResponse.json({ message: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(result, { status: 200 });
}
