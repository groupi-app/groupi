import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getUserIdUncached } from '@groupi/services/server';
import { runWithContextAsync } from '@groupi/services/request-context';
import { apiLogger } from '@/lib/logger';

export async function POST(request: Request) {
  // Get trace ID from middleware header
  const traceId = request.headers.get('x-trace-id') || undefined;

  return runWithContextAsync(
    { traceId, path: '/api/cache/invalidate' },
    async () => {
      try {
        const [authError, userId] = await getUserIdUncached();
        if (authError || !userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let body;
        try {
          body = await request.json();
        } catch (parseError) {
          apiLogger.error(
            { error: parseError },
            'Failed to parse request body'
          );
          return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
          );
        }

        const { tags } = body;
        if (!Array.isArray(tags)) {
          apiLogger.warn({ tags }, 'Invalid tags array received');
          return NextResponse.json({ error: 'Invalid tags' }, { status: 400 });
        }

        // Validate and filter tags
        const validTags = tags.filter(
          (tag): tag is string => typeof tag === 'string' && tag.length > 0
        );

        if (validTags.length === 0) {
          apiLogger.warn({ tags }, 'No valid tags provided');
          return NextResponse.json(
            { error: 'No valid tags provided' },
            { status: 400 }
          );
        }

        // Revalidate tags server-side (Route Handlers must use revalidateTag, not updateTag)
        validTags.forEach(tag => {
          try {
            revalidateTag(tag, 'max');
          } catch (tagError) {
            apiLogger.error(
              { tag, error: tagError },
              'Failed to revalidate cache tag'
            );
            throw tagError;
          }
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        apiLogger.error(
          {
            error,
            errorMessage:
              error instanceof Error ? error.message : String(error),
          },
          'Error invalidating cache'
        );
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    }
  );
}
