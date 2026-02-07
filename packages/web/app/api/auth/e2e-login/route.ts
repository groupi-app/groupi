import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

/**
 * E2E Test Login Endpoint
 *
 * This endpoint is ONLY for E2E testing. It creates a magic link token directly
 * in Convex WITHOUT sending any email, then verifies it to establish a session.
 *
 * SECURITY: This endpoint should only be available when E2E_TESTING is enabled.
 */

// Check if E2E testing is enabled
const isE2EEnabled = process.env.E2E_TESTING === 'true';

export async function POST(request: NextRequest) {
  // Guard: Only allow in E2E testing mode
  if (!isE2EEnabled) {
    return NextResponse.json(
      { error: 'E2E testing is not enabled' },
      { status: 403 }
    );
  }

  try {
    const { email, callbackURL = '/events' } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'CONVEX_URL not configured' },
        { status: 500 }
      );
    }

    const client = new ConvexHttpClient(convexUrl);

    // Create a magic link token directly in Convex (bypasses email sending)
    const tokenResult = await client.mutation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'e2e/mutations:createMagicLinkToken' as any,
      { email }
    );

    if (!tokenResult?.url) {
      return NextResponse.json(
        { error: 'Failed to create magic link token' },
        { status: 500 }
      );
    }

    const magicLinkUrl = tokenResult.url;

    // Verify the magic link to get the session cookie
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const verifyResponse = await fetch(magicLinkUrl, {
      method: 'GET',
      redirect: 'manual', // Don't follow redirects, we want the cookies
    });

    // Extract cookies from the response
    const setCookieHeader = verifyResponse.headers.get('set-cookie');

    if (!setCookieHeader) {
      // The magic link might redirect without setting a cookie directly
      // Try to follow the redirect and get cookies from there
      const location = verifyResponse.headers.get('location');
      if (location) {
        const fullUrl = location.startsWith('/')
          ? `${baseUrl}${location}`
          : location;
        const followResponse = await fetch(fullUrl, {
          method: 'GET',
          redirect: 'manual',
        });
        const followCookies = followResponse.headers.get('set-cookie');
        if (followCookies) {
          const sessionMatch = followCookies.match(
            /better-auth\.session_token=([^;]+)/
          );
          if (sessionMatch) {
            const response = NextResponse.json({
              success: true,
              sessionToken: sessionMatch[1],
              magicLinkUrl,
              callbackURL,
            });
            response.headers.set('Set-Cookie', followCookies);
            return response;
          }
        }
      }

      return NextResponse.json(
        { error: 'No session cookie returned from verification' },
        { status: 500 }
      );
    }

    // Parse the session token from the cookie
    const sessionMatch = setCookieHeader.match(
      /better-auth\.session_token=([^;]+)/
    );
    if (!sessionMatch) {
      return NextResponse.json(
        { error: 'Session token not found in cookies' },
        { status: 500 }
      );
    }

    const sessionToken = sessionMatch[1];

    // Return the session token and set the cookie on the response
    const response = NextResponse.json({
      success: true,
      sessionToken,
      magicLinkUrl,
      callbackURL,
    });

    // Forward the Set-Cookie header
    response.headers.set('Set-Cookie', setCookieHeader);

    return response;
  } catch (error) {
    console.error('E2E login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
