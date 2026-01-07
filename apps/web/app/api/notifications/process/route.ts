import { NextRequest, NextResponse } from 'next/server';
import { processNotificationDelivery } from '@groupi/services';
import { runWithContextAsync } from '@groupi/services/request-context';
import { apiLogger } from '@/lib/logger';

/**
 * API route to process notification delivery (email, webhook, and push)
 * This is called as a background job when notifications are created
 *
 * POST /api/notifications/process
 * Body: { notificationId: string }
 */
export async function POST(request: NextRequest) {
  // Get trace ID from middleware header
  const traceId = request.headers.get('x-trace-id') || undefined;

  return runWithContextAsync(
    { traceId, path: '/api/notifications/process' },
    async () => {
      try {
        const body = await request.json();
        const { notificationId } = body;

        apiLogger.info({ notificationId }, 'Notification process API called');

        if (!notificationId || typeof notificationId !== 'string') {
          return NextResponse.json(
            { error: 'notificationId is required' },
            { status: 400 }
          );
        }

        // Process notification delivery (fire-and-forget style)
        // We don't await this to avoid blocking the request
        // Pass traceId to preserve log correlation in async context
        processNotificationDelivery(notificationId, traceId)
          .then(result => {
            apiLogger.info(
              {
                notificationId,
                emailsSent: result.emailsSent,
                webhooksSent: result.webhooksSent,
                pushesSent: result.pushesSent,
              },
              'Notification delivery processed'
            );
          })
          .catch(error => {
            apiLogger.error(
              {
                notificationId,
                error: error instanceof Error ? error.message : String(error),
              },
              'Error processing notification delivery'
            );
          });

        // Return immediately
        return NextResponse.json({
          success: true,
          message: 'Notification delivery queued',
        });
      } catch (error) {
        apiLogger.error(
          { error: error instanceof Error ? error.message : String(error) },
          'Error in notification process route'
        );
        return NextResponse.json(
          {
            error: 'Failed to process notification',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }
  );
}
