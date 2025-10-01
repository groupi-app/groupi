import { auth } from '@clerk/nextjs/server';
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
    // Get the authenticated user from Clerk
    const { userId } = await auth();

    apiLogger.debug('Pusher Beams auth request', { userId });

    if (!userId) {
      apiLogger.warn('No userId found in auth context');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate Pusher Beams token for the authenticated user
    const beamsToken = beamsClient.generateToken(userId);

    apiLogger.info('Generated Pusher Beams token successfully', {
      userId,
    });

    return NextResponse.json(beamsToken);
  } catch (error) {
    apiLogger.error('Error generating Pusher Beams token', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication token' },
      { status: 500 }
    );
  }
}
