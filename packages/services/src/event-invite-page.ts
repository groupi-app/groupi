import { Effect } from 'effect';
import {
  EventInvitePageResult,
  EventInvitePageData,
  EventInvitePageError,
  EventInvitePageDataSchema,
} from '@groupi/schema';
import { success, error } from '@groupi/schema';
import { getEventInviteDataEffect } from './invite';

// ============================================================================
// EVENT INVITE PAGE SERVICE
// ============================================================================

/**
 * Fetches data needed for the Event Invite page
 * Returns event title and invite list
 * Reuses the existing invite service and transforms the data
 */
export const getEventInvitePageData = async (
  eventId: string,
  userId: string
): Promise<EventInvitePageResult> => {
  try {
    // Reuse existing effect and transform the data
    const inviteData = await Effect.runPromise(
      getEventInviteDataEffect(eventId, userId)
    );

    const result: EventInvitePageData = {
      event: {
        id: inviteData.id,
        title: inviteData.title,
      },
      invites: inviteData.invites.map(invite => ({
        id: invite.id,
        name: invite.name,
        expiresAt: invite.expiresAt,
        usesRemaining: invite.usesRemaining,
        maxUses: invite.maxUses,
        createdAt: invite.createdAt,
        createdByName: invite.createdByName,
      })),
    };

    // Validate result against schema
    const validatedResult = EventInvitePageDataSchema.parse(result);
    return success(validatedResult);
  } catch (err) {
    // Map service errors to page errors
    if (err instanceof Error) {
      if (
        err.message.includes('not found') ||
        err.message.includes('Invite not found')
      ) {
        return error<EventInvitePageError>({
          _tag: 'EventNotFoundError',
          message: 'Event not found',
        });
      }
      if (err.message.includes('not a member')) {
        return error<EventInvitePageError>({
          _tag: 'EventUserNotMemberError',
          message: 'You are not a member of this event',
        });
      }
      if (
        err.message.includes('permission') ||
        err.message.includes('Unauthorized')
      ) {
        return error<EventInvitePageError>({
          _tag: 'UnauthorizedError',
          message: 'You do not have permission to view invites',
        });
      }
    }

    console.error('Error in getEventInvitePageData:', err);
    return error<EventInvitePageError>({
      _tag: 'DatabaseError',
      message:
        err instanceof Error ? err.message : 'Failed to fetch invite data',
    });
  }
};
