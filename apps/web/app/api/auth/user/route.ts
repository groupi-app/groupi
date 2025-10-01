import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiLogger } from '@/lib/logger';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ userId });
  } catch (error) {
    apiLogger.error('Error getting user', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
