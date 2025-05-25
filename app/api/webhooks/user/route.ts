import { db } from '@/lib/db';
import { UserJSON } from '@clerk/types';
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';

type EventType = 'user.created' | 'user.updated' | 'user.deleted' | '*';

export async function POST(req: NextRequest) {
  const evt = await verifyWebhook(req);

  const eventType = evt.type as EventType;
  const data: unknown = evt.data;

  if (eventType === 'user.created') {
    const userData = data as UserJSON;
    const { id, first_name, last_name, username, image_url } = userData;

    if (!username) {
      return NextResponse.json({ message: 'username is required' }, { status: 400 });
    }

    // Create the person
    const person = await db.person.create({
      data: {
        id,
        firstName: first_name ?? null,
        lastName: last_name ?? null,
        username,
        imageUrl: image_url,
      }
    });

    return NextResponse.json({ message: 'Created person with settings', person }, { status: 201 });
  }

  if (eventType === 'user.updated') {
    const userData = data as UserJSON;
    const { id, first_name, last_name, username, image_url } = userData;

    if (!username) {
      return NextResponse.json({ message: 'username is required' }, { status: 400 });
    }

    const person = await db.person.upsert({
      where: { id },
      update: {
        firstName: first_name ?? null,
        lastName: last_name ?? null,
        username,
        imageUrl: image_url,
      },
      create: {
        id,
        firstName: first_name ?? null,
        lastName: last_name ?? null,
        username,
        imageUrl: image_url,
      }
    });
    return NextResponse.json({ message: 'Upserted person', person }, { status: 200 });
  }

  if (eventType === 'user.deleted') {
    const userData = data as UserJSON;
    const userId = userData.id as string;
    const person = await db.person.deleteMany({
      where: {
        id: userId,
      },
    });
    return NextResponse.json({
      message: `Deleted ${person.count} ${person.count === 1 ? 'person' : 'people'}`,
    });
  }

  return NextResponse.json({ message: 'webhook test' });
}
