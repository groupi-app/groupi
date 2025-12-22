import { NextRequest, NextResponse } from 'next/server';
import { processNotificationDelivery } from '@groupi/services';

/**
 * API route to process notification delivery (email, webhook, and push)
 * This is called as a background job when notifications are created
 *
 * POST /api/notifications/process
 * Body: { notificationId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId || typeof notificationId !== 'string') {
      return NextResponse.json(
        { error: 'notificationId is required' },
        { status: 400 }
      );
    }

    // Process notification delivery (fire-and-forget style)
    // We don't await this to avoid blocking the request
    processNotificationDelivery(notificationId)
      .then(result => {
        console.log('Notification delivery processed', {
          notificationId,
          emailsSent: result.emailsSent,
          webhooksSent: result.webhooksSent,
          pushesSent: result.pushesSent,
        });
      })
      .catch(error => {
        console.error('Error processing notification delivery', {
          notificationId,
          error: error instanceof Error ? error.message : String(error),
        });
      });

    // Return immediately
    return NextResponse.json({
      success: true,
      message: 'Notification delivery queued',
    });
  } catch (error) {
    console.error('Error in notification process route', error);
    return NextResponse.json(
      {
        error: 'Failed to process notification',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
