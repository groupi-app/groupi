import type { MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { ConvexError } from 'convex/values';
import {
  safeDiscussionContent,
  validateDiscussionLength,
} from '../../packages/shared/src/utils/discussion-content';
import { discussionParent, type DiscussionParent } from './discussionAccess';
import { canAccessGroupMemberContent } from '../groups/contentAccess';
import { checkIsBlocked } from './privacy';
export async function validateContent(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  parent: Id<'events'> | DiscussionParent,
  input: string,
  limit: number,
  previous?: string
) {
  if (input === previous) return input;
  const owner = discussionParent(
    typeof parent === 'string' ? { eventId: parent } : parent
  );
  try {
    const value = safeDiscussionContent(input);
    validateDiscussionLength(input, limit, previous);
    for (const id of value.mentions) {
      const target = ctx.db.normalizeId('persons', id);
      const member = target
        ? owner.eventId
          ? await ctx.db
              .query('memberships')
              .withIndex('by_person_event', q =>
                q.eq('personId', target).eq('eventId', owner.eventId!)
              )
              .first()
          : await canAccessGroupMemberContent(ctx, owner.groupId!, target)
        : null;
      if (!target || !member || (await checkIsBlocked(ctx, personId, target)))
        throw new Error(
          'Mentions must identify an accessible member of this content parent.'
        );
    }
    return value.html.trim();
  } catch (error) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: error instanceof Error ? error.message : 'Invalid content',
    });
  }
}
export function validateTitle(title: string, previous?: string) {
  const value = title.trim();
  if (!value)
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Post title is required',
    });
  const length = Array.from(value).length,
    old = previous ? Array.from(previous).length : 0;
  if (value !== previous && length > 100 && !(old > 100 && length < old))
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message:
        'Title exceeds 100 characters; oversized legacy titles must shrink.',
    });
  return value;
}
