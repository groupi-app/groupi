import {
  createUserFromWebhook,
  updateUserFromWebhook,
  deleteUserFromWebhook,
} from '@groupi/services';
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';

type EventType = 'user.created' | 'user.updated' | 'user.deleted' | '*';

type UserJSON = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string;
  image_url?: string;
};

export async function POST(req: NextRequest) {
  const evt = await verifyWebhook(req);

  const eventType = evt.type as EventType;
  const data: unknown = evt.data;

  if (eventType === 'user.created') {
    const userData = data as UserJSON;
    const { id, first_name, last_name, username, image_url } = userData;

    if (!username) {
      return NextResponse.json(
        { message: 'username is required' },
        { status: 400 }
      );
    }

    // Create the person using service
    const person = await createUserFromWebhook({
      id,
      firstName: first_name ?? null,
      lastName: last_name ?? null,
      username: username as string,
      imageUrl: image_url ?? '',
    });

    return NextResponse.json(
      { message: 'Created person with settings', person },
      { status: 201 }
    );
  }

  if (eventType === 'user.updated') {
    const userData = data as UserJSON;
    const { id, first_name, last_name, username, image_url } = userData;

    if (!username) {
      return NextResponse.json(
        { message: 'username is required' },
        { status: 400 }
      );
    }

    const person = await updateUserFromWebhook({
      id,
      firstName: first_name ?? null,
      lastName: last_name ?? null,
      username: username as string,
      imageUrl: image_url ?? '',
    });

    return NextResponse.json(
      { message: 'Upserted person', person },
      { status: 200 }
    );
  }

  if (eventType === 'user.deleted') {
    const userData = data as UserJSON;
    const userId = userData.id as string;
    const [error, result] = await deleteUserFromWebhook({ userId });

    if (error || !result) {
      return NextResponse.json(
        {
          message: `Failed to delete user: ${error?.message || 'Unknown error'}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: result.message,
    });
  }

  return NextResponse.json({ message: 'webhook test' });
}
