import { NextResponse } from 'next/server';

/**
 * Redirect to the Convex REST API documentation
 *
 * This provides a convenient way to access the API docs at /api/docs
 * instead of needing to know the Convex site URL.
 */
export async function GET() {
  // Get the Convex cloud URL and convert to site URL
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_CONVEX_URL is not configured' },
      { status: 500 }
    );
  }

  // Convert .convex.cloud to .convex.site for HTTP endpoints
  const siteUrl = convexUrl.replace('.convex.cloud', '.convex.site');
  const docsUrl = `${siteUrl}/api/v1/docs`;

  return NextResponse.redirect(docsUrl);
}
