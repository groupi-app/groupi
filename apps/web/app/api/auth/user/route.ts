import { NextResponse } from 'next/server';
import { getUserIdUncached } from '@groupi/services';
import { apiLogger } from '@/lib/logger';

export async function GET() {
  try {
    const [error, userId] = await getUserIdUncached();
    if (error || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ userId });
  } catch (error) {
    apiLogger.error({ error }, 'Error getting user');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
