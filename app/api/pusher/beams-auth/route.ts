import { auth } from '@clerk/nextjs/server';
import PushNotifications from '@pusher/push-notifications-server';
import { env } from '@/env.mjs';
import { NextResponse } from 'next/server';

const beamsClient = new PushNotifications({
  instanceId: env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID,
  secretKey: env.PUSHER_BEAMS_SECRET_KEY,
});

export async function POST() {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();

    console.log('Pusher Beams auth request - userId:', userId);

    if (!userId) {
      console.log('No userId found in auth context');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate Pusher Beams token for the authenticated user
    const beamsToken = beamsClient.generateToken(userId);

    console.log('Generated Pusher Beams token successfully for user:', userId);

    return NextResponse.json(beamsToken);
  } catch (error) {
    console.error('Error generating Pusher Beams token:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication token' },
      { status: 500 }
    );
  }
}
