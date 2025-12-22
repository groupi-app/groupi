import { getUserIdUncached } from '@groupi/services/server';
import PushNotifications from '@pusher/push-notifications-server';
import { env } from '@/env.mjs';
import { NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logger';

const beamsClient = new PushNotifications({
  instanceId: env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID,
  secretKey: env.PUSHER_BEAMS_SECRET_KEY,
});

export async function POST() {
  try {
    const [error, userId] = await getUserIdUncached();
    if (error || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    apiLogger.debug({ userId }, 'Pusher Beams auth request');

    // Generate Pusher Beams token for the authenticated user
    const beamsToken = beamsClient.generateToken(userId);

    apiLogger.info(
      {
        userId,
      },
      'Generated Pusher Beams token successfully'
    );

    return NextResponse.json(beamsToken);
  } catch (error) {
    apiLogger.error({ error }, 'Error generating Pusher Beams token');
    return NextResponse.json(
      { error: 'Failed to generate authentication token' },
      { status: 500 }
    );
  }
}
