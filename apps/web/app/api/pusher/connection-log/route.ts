import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

const logger = createLogger('pusher-connections');

interface ConnectionEvent {
  event:
    | 'connected'
    | 'disconnected'
    | 'state_change'
    | 'error'
    | 'subscribe'
    | 'unsubscribe';
  userId?: string;
  socketId?: string;
  channel?: string;
  state?: string;
  previousState?: string;
  error?: string;
  timestamp: number;
  userAgent?: string;
  pathname?: string;
}

/**
 * API endpoint to log Pusher connection events to Loki
 * Called from client-side Pusher hooks to track connection patterns
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ConnectionEvent;

    const logData = {
      ...body,
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
    };

    switch (body.event) {
      case 'connected':
        logger.info(logData, 'Pusher connection established');
        break;
      case 'disconnected':
        logger.warn(logData, 'Pusher connection disconnected');
        break;
      case 'state_change':
        logger.info(
          logData,
          `Pusher state: ${body.previousState} → ${body.state}`
        );
        break;
      case 'error':
        logger.error(logData, 'Pusher connection error');
        break;
      case 'subscribe':
        logger.info(logData, `Subscribed to channel: ${body.channel}`);
        break;
      case 'unsubscribe':
        logger.info(logData, `Unsubscribed from channel: ${body.channel}`);
        break;
      default:
        logger.debug(logData, 'Pusher event');
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error({ error }, 'Failed to log Pusher connection event');
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
