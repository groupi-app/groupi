import { NextRequest, NextResponse } from 'next/server';
import { db } from '@groupi/services';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Look up user by username
    const user = await db.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive', // Case-insensitive search
        },
      },
      select: {
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ email: user.email });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error looking up username:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
