import { Effect } from 'effect';
import { db } from './db';
import { dbOperation } from './shared/effect-patterns';
import { SentryHelpers } from './sentry';
import {
  InvitePageResult,
  InvitePageData,
  InvitePageError,
  InvitePageDataSchema,
} from '@groupi/schema';
import { success, error } from '@groupi/schema';

// ============================================================================
// INVITE PAGE SERVICE
// ============================================================================

/**
 * Fetches data needed for the Invite page
 * Returns invite with event details and member count
 */
export const getInvitePageData = async (
  inviteId: string
): Promise<InvitePageResult> => {
  const effect = SentryHelpers.withServiceOperation(
    Effect.gen(function* () {
      // Fetch invite with event and creator
      const inviteData = yield* dbOperation(
        () =>
          db.invite.findUnique({
            where: { id: inviteId },
            select: {
              id: true,
              name: true,
              eventId: true,
              createdById: true,
              expiresAt: true,
              usesRemaining: true,
              maxUses: true,
              createdAt: true,
              event: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  location: true,
                  chosenDateTime: true,
                  _count: {
                    select: {
                      memberships: true,
                    },
                  },
                },
              },
              createdBy: {
                select: {
                  id: true,
                  person: {
                    select: {
                      id: true,
                      name: true,
                      profilePhoto: true,
                    },
                  },
                },
              },
            },
          }),
        cause => new Error(`Failed to fetch invite data: ${cause}`),
        `fetch invite page data for ${inviteId}`
      );

      if (!inviteData) {
        return error<InvitePageError>({
          _tag: 'InviteNotFoundError',
          message: 'Invite not found',
        });
      }

      // Check if invite has expired
      if (
        inviteData.expiresAt !== null &&
        new Date().getTime() > inviteData.expiresAt.getTime()
      ) {
        return error<InvitePageError>({
          _tag: 'InviteExpiredError',
          message: 'This invite has expired',
        });
      }

      // Check if invite is out of uses
      if (inviteData.usesRemaining !== null && inviteData.usesRemaining < 1) {
        return error<InvitePageError>({
          _tag: 'InviteNoUsesError',
          message: 'This invite has no uses remaining',
        });
      }

      const result: InvitePageData = {
        id: inviteData.id,
        name: inviteData.name,
        eventId: inviteData.eventId,
        createdById: inviteData.createdById,
        expiresAt: inviteData.expiresAt,
        usesRemaining: inviteData.usesRemaining,
        maxUses: inviteData.maxUses,
        createdAt: inviteData.createdAt,
        event: {
          id: inviteData.event.id,
          title: inviteData.event.title,
          description: inviteData.event.description,
          location: inviteData.event.location,
          chosenDateTime: inviteData.event.chosenDateTime,
          memberCount: inviteData.event._count.memberships,
        },
        createdBy: {
          id: inviteData.createdBy.id,
          person: inviteData.createdBy.person,
        },
      };

      // Validate result against schema
      const validatedResult = InvitePageDataSchema.parse(result);
      return success(validatedResult);
    }).pipe(
      Effect.catchAll(err => {
        console.error('Error in getInvitePageData:', err);
        return Effect.succeed(
          error<InvitePageError>({
            _tag: 'DatabaseError',
            message:
              err instanceof Error ? err.message : 'Unknown database error',
          })
        );
      })
    ),
    'invite-page',
    'getInvitePageData',
    inviteId
  );

  try {
    return await Effect.runPromise(effect);
  } catch (err) {
    console.error('Failed to run getInvitePageData effect:', err);
    return error<InvitePageError>({
      _tag: 'DatabaseError',
      message: err instanceof Error ? err.message : 'Failed to fetch invite',
    });
  }
};
