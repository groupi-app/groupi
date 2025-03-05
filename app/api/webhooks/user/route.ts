import { env } from "@/env.mjs";
import { db } from "@/lib/db";
import { WebhookEvent } from "@clerk/nextjs/server";
import { UserJSON } from "@clerk/types";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

type EventType = "user.created" | "user.updated" | "user.deleted" | "*";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = env.WEBHOOK_SECRET;

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json("Error occured -- no svix headers", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json({}, { status: 400 });
  }

  const eventType = evt.type as EventType;

  if (eventType === "user.created") {
    const userData = payload.data as UserJSON;
    const { id, first_name, last_name, username, image_url } = userData;

    if (!username) {
      return NextResponse.json(
        { message: "username is required" },
        { status: 400 }
      );
    }

    const person = await db.person.create({
      data: {
        id,
        firstName: first_name ?? null,
        lastName: last_name ?? null,
        username,
        imageUrl: image_url,
      },
    });
    return NextResponse.json(
      { message: "Created person", person },
      { status: 201 }
    );
  }

  if (eventType === "user.updated") {
    const userData = payload.data as UserJSON;
    const { id, first_name, last_name, username, image_url } = userData;

    if (!username) {
      return NextResponse.json(
        { message: "username is required" },
        { status: 400 }
      );
    }

    const person = await db.person.update({
      where: {
        id,
      },
      data: {
        firstName: first_name ?? null,
        lastName: last_name ?? null,
        username,
        imageUrl: image_url,
      },
    });
    return NextResponse.json(
      { message: "Updated person", person },
      { status: 200 }
    );
  }

  if (eventType === "user.deleted") {
    const userId = payload.data.id as string;
    const person = await db.person.deleteMany({
      where: {
        id: userId,
      },
    });
    return NextResponse.json({
      message: `Deleted ${person.count} ${
        person.count === 1 ? "person" : "people"
      }`,
    });
  }

  return NextResponse.json({ message: "webhook test" });
}
