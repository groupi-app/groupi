import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for Request Tracing
 *
 * Generates a unique trace ID for each request and passes it via headers.
 * This trace ID is picked up by server components/API routes and included in all logs.
 *
 * In Grafana Loki, filter by trace ID to see all logs for a single transaction:
 *   {service="groupi"} | json | traceId="abc123"
 */

// Generate a short trace ID (first 8 chars of crypto random)
function generateTraceId(): string {
  // Use crypto.randomUUID() which is available in Edge runtime
  return crypto.randomUUID().split('-')[0];
}

export function middleware(request: NextRequest) {
  // Generate trace ID for this request
  const traceId = generateTraceId();

  // Clone the request headers and add trace ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-trace-id', traceId);

  // Create response with the trace ID header (useful for debugging)
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Also set trace ID in response headers for client-side debugging
  response.headers.set('x-trace-id', traceId);

  return response;
}

// Run middleware on all routes except static files and assets
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
