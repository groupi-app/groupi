import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const idSchema = z.string().length(32).startsWith("user_");

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = (await context.params);

  const validationResult = idSchema.safeParse(id);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: validationResult.error },
      { status: 400 }
    );
  }

  const result = await db.person.findUnique({
    where: {
      id: id,
    },
  });

  if (!result) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json(result, { status: 200 });
}
