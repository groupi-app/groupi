import { query } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';

/**
 * Get all addon templates owned by the current user.
 */
export const getMyTemplates = query({
  args: {},
  handler: async ctx => {
    const { person } = await requireAuth(ctx);

    return await ctx.db
      .query('addonTemplates')
      .withIndex('by_owner', q => q.eq('ownerId', person._id))
      .collect();
  },
});

/**
 * Get a single addon template by ID.
 * Only the owner can access their templates.
 */
export const getTemplate = query({
  args: {
    templateId: v.id('addonTemplates'),
  },
  handler: async (ctx, { templateId }) => {
    const { person } = await requireAuth(ctx);

    const template = await ctx.db.get(templateId);
    if (!template) return null;

    // Only the owner can view their templates
    if (template.ownerId !== person._id) return null;

    return template;
  },
});

/**
 * Get only published templates owned by the current user.
 * Used for the template picker when attaching addons to events.
 */
export const getMyPublishedTemplates = query({
  args: {},
  handler: async ctx => {
    const { person } = await requireAuth(ctx);

    return await ctx.db
      .query('addonTemplates')
      .withIndex('by_owner_published', q =>
        q.eq('ownerId', person._id).eq('isPublished', true)
      )
      .collect();
  },
});
