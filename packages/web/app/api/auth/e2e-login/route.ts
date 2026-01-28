import { NextRequest, NextResponse } from 'next/server';

/**
 * E2E Test Login Endpoint
 *
 * This endpoint is ONLY for E2E testing. It creates a proper authenticated session
 * by calling Better Auth's internal API, which ensures the session cookie is properly signed.
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

    // Step 1: Request a magic link via Better Auth
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const magicLinkResponse = await fetch(
      `${baseUrl}/api/auth/sign-in/magic-link`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, callbackURL }),
      }
    );

    if (!magicLinkResponse.ok) {
      const error = await magicLinkResponse.text();
      return NextResponse.json(
        { error: `Failed to request magic link: ${error}` },
        { status: 500 }
      );
    }

    // Step 2: Query the verification token from Convex
    // We need to poll for the verification record
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'CONVEX_URL not configured' },
        { status: 500 }
      );
    }

    // Import dynamically to avoid issues
    const { ConvexHttpClient } = await import('convex/browser');
    const client = new ConvexHttpClient(convexUrl);

    let magicLinkUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (!magicLinkUrl && attempts < maxAttempts) {
      try {
        const result = await client.query(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          'e2e/mutations:getLastMagicLink' as any,
          { email }
        );
        if (result?.url) {
          magicLinkUrl = result.url;
        }
      } catch {
        // Retry
      }
      if (!magicLinkUrl) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }
    }

    if (!magicLinkUrl) {
      return NextResponse.json(
        { error: 'Could not retrieve magic link verification token' },
        { status: 500 }
      );
    }

    // Step 3: Navigate to the magic link to complete authentication
    // and capture the Set-Cookie header
    const verifyResponse = await fetch(magicLinkUrl, {
      method: 'GET',
      redirect: 'manual', // Don't follow redirects, we want the cookies
    });

    // Extract cookies from the response
    const setCookieHeader = verifyResponse.headers.get('set-cookie');

    if (!setCookieHeader) {
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
