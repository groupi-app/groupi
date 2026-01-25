import { handler } from '@/lib/auth-server';
import { NextRequest } from 'next/server';

/**
 * Next.js route handler for Better Auth
 *
 * This proxies authentication requests to the Convex backend
 * where Better Auth handles the actual authentication logic.
 */

// Wrap handlers to catch and log errors
async function wrappedHandler(req: NextRequest) {
  const url = req.url;
  const pathname = new URL(url).pathname;

  // Log more details for auth requests
  console.log(`[Auth] ${req.method} ${pathname}`);

  // Log body for POST requests (helpful for debugging One Tap)
  if (req.method === 'POST') {
    try {
      const clonedReq = req.clone();
      const body = await clonedReq.text();
      console.log(
        `[Auth] ${req.method} ${pathname} body:`,
        body.substring(0, 500)
      );
    } catch {
      console.log(`[Auth] ${req.method} ${pathname} (could not read body)`);
    }
  }

  try {
    const method = req.method === 'GET' ? handler.GET : handler.POST;
    const result = await method(req);
    console.log(`[Auth] ${req.method} ${pathname} -> ${result.status}`);

    // Log response body for errors
    if (result.status >= 400) {
      try {
        const clonedRes = result.clone();
        const resBody = await clonedRes.text();
        console.error(
          `[Auth] ${req.method} ${pathname} error response:`,
          resBody.substring(0, 500)
        );
      } catch {
        // Ignore
      }
    }

    return result;
  } catch (error) {
    console.error(`[Auth] ${req.method} ${pathname} ERROR:`, error);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  return wrappedHandler(req);
}

export async function POST(req: NextRequest) {
  return wrappedHandler(req);
}
