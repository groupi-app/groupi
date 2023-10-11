import { db } from '@/lib/db';
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'

type Event = {
    data: Record<string, string | number>,
    object: "event",
    type: EventType,
}

type EventType = "user.created" | "user.updated" | "user.deleted" | "*";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET as string;

  const svix_id = req.headers.get("svix-id") ?? "";
  const svix_timestamp = req.headers.get("svix-timestamp") ?? "";
  const svix_signature = req.headers.get("svix-signature") ?? "";

  const body = await req.text(); // This gets the raw body as a string


  const sivx = new Webhook(WEBHOOK_SECRET);

  let payload: Event | null = null;
  try {
    payload = sivx.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as Event;

  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({}, { status: 400});
  }

  const eventType:EventType = payload.type;

  if (eventType === "user.created") {
    const userId = payload.data.id as string;
    const person = await db.person.create({
        data:{
            id: userId
        }
    });
    return NextResponse.json({ message: 'Created person' + person })
  }

  if (eventType === "user.deleted") {
    const userId = payload.data.id as string;
    const person = await db.person.deleteMany({
      where: {
        id: userId
      }
    });
    return NextResponse.json({ message: `Deleted ${person.count} ${person.count === 1 ? 'person' : 'people'}` })
  }


  return NextResponse.json({ message: 'webhook test' })
}