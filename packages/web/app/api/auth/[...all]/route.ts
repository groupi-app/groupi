import { handler } from '@/lib/auth-server';
import { NextRequest } from 'next/server';

/**
 * Next.js route handler for Better Auth
 *
 * This proxies authentication requests to the Convex backend
 * where Better Auth handles the actual authentication logic.
 */

export async function GET(req: NextRequest) {
  return handler.GET(req);
}

export async function POST(req: NextRequest) {
  return handler.POST(req);
}
