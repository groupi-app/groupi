import { Effect } from 'effect';
import { db } from './db';
import { dbOperation } from './shared/effect-patterns';
import { SentryHelpers } from './sentry';
import type {
  PostDetailResult,
  PostDetailData,
  PostDetailError,
  PostDetailDataSchema,
} from '@groupi/schema';
import { success, error } from '@groupi/schema';

// ============================================================================
// POST DETAIL EFFECT SERVICE
// ============================================================================

/**
 * Fetches data needed for the PostDetail page (FullPost + Replies)
 * Returns only the fields required for post detail display
 */
export const getPostDetailData = async (
  postId: string,
  userId: string
): Promise<PostDetailResult> => {
  const effect = SentryHelpers.withServiceOperation(
    Effect.gen(function* () {
      // Fetch post with replies, author, and event data using dbOperation pattern
      const postData = yield* dbOperation(
        () =>
          db.post.findFirst({
            where: { id: postId },
            select: {
              id: true,
              title: true,
              content: true,
              createdAt: true,
              updatedAt: true,
              editedAt: true,
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  username: true,
                  imageUrl: true,
                },
              },
              event: {
                select: {
                  id: true,
                  title: true,
                  chosenDateTime: true,
                  memberships: {
                    where: { personId: userId },
                    select: {
                      id: true,
                      role: true,
                    },
                    take: 1,
                  },
                },
              },
              replies: {
                select: {
                  id: true,
                  content: true,
                  createdAt: true,
                  updatedAt: true,
                  author: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      username: true,
                      imageUrl: true,
                    },
                  },
                },
                orderBy: { createdAt: 'asc' },
              },
              _count: {
                select: {
                  replies: true,
                },
              },
            },
          }),
        cause => new Error(`Failed to fetch post detail data: ${cause}`),
        `fetch post detail data for ${postId}`
      );

      if (!postData) {
        return error<PostDetailError>({
          _tag: 'PostNotFoundError',
          message: 'Post not found',
        });
      }

      if (!postData.event || postData.event.memberships.length === 0) {
        return error<PostDetailError>({
          _tag: 'PostUserNotMemberError',
          message: 'User is not a member of this event',
        });
      }

      const userMembership = postData.event.memberships[0];

      const result: PostDetailData = {
        post: {
          id: postData.id,
          title: postData.title,
          content: postData.content,
          createdAt: postData.createdAt,
          updatedAt: postData.updatedAt,
          editedAt: postData.editedAt,
          author: postData.author,
          event: {
            id: postData.event.id,
            title: postData.event.title,
            chosenDateTime: postData.event.chosenDateTime,
          },
          replies: postData.replies,
          _count: postData._count,
        },
        userMembership: {
          id: userMembership.id,
          role: userMembership.role,
        },
      };

      // Validate result against schema
      const validatedResult = PostDetailDataSchema.parse(result);
      return success(validatedResult);
    }).pipe(
      Effect.catchAll(err => {
        return Effect.succeed(
          error<PostDetailError>({
            _tag: 'PostNotFoundError',
            message:
              err instanceof Error ? err.message : 'Service error occurred',
          })
        );
      })
    ),
    'post-detail',
    'getDetailData',
    postId
  );

  // Run the effect and return the result tuple
  return Effect.runPromise(effect);
};
