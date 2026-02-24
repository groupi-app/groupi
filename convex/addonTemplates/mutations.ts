import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { isValidTemplate } from '../addons/handlers/custom';

/**
 * Create a new addon template. Starts as a draft.
 */
export const createTemplate = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    iconName: v.string(),
    template: v.any(),
  },
  handler: async (ctx, { name, description, iconName, template }) => {
    const { person } = await requireAuth(ctx);

    // Validate name/description length
    if (name.length === 0 || name.length > 60) {
      throw new Error('Name must be between 1 and 60 characters');
    }
    if (description.length > 200) {
      throw new Error('Description must be at most 200 characters');
    }

    const now = Date.now();

    const templateId = await ctx.db.insert('addonTemplates', {
      ownerId: person._id,
      name,
      description,
      iconName,
      template,
      version: 1,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    });

    return templateId;
  },
});

/**
 * Update an existing addon template.
 * Only the owner can update. Increments version on each update.
 */
export const updateTemplate = mutation({
  args: {
    templateId: v.id('addonTemplates'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    iconName: v.optional(v.string()),
    template: v.optional(v.any()),
  },
  handler: async (ctx, { templateId, ...updates }) => {
    const { person } = await requireAuth(ctx);

    const existing = await ctx.db.get(templateId);
    if (!existing) {
      throw new Error('Template not found');
    }
    if (existing.ownerId !== person._id) {
      throw new Error('You do not own this template');
    }

    // Validate name/description length if provided
    if (updates.name !== undefined) {
      if (updates.name.length === 0 || updates.name.length > 60) {
        throw new Error('Name must be between 1 and 60 characters');
      }
    }
    if (updates.description !== undefined && updates.description.length > 200) {
      throw new Error('Description must be at most 200 characters');
    }

    const patch: Record<string, unknown> = {
      updatedAt: Date.now(),
      version: existing.version + 1,
    };

    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.description !== undefined)
      patch.description = updates.description;
    if (updates.iconName !== undefined) patch.iconName = updates.iconName;
    if (updates.template !== undefined) patch.template = updates.template;

    await ctx.db.patch(templateId, patch);
    return { success: true };
  },
});

/**
 * Publish a template (mark as ready to use).
 * Validates the template structure before publishing.
 */
export const publishTemplate = mutation({
  args: {
    templateId: v.id('addonTemplates'),
  },
  handler: async (ctx, { templateId }) => {
    const { person } = await requireAuth(ctx);

    const existing = await ctx.db.get(templateId);
    if (!existing) {
      throw new Error('Template not found');
    }
    if (existing.ownerId !== person._id) {
      throw new Error('You do not own this template');
    }

    // Validate the template structure before publishing
    if (!isValidTemplate(existing.template)) {
      throw new Error(
        'Template has validation errors and cannot be published. Ensure all sections have at least one field with valid configuration.'
      );
    }

    await ctx.db.patch(templateId, {
      isPublished: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Unpublish a template (revert to draft).
 */
export const unpublishTemplate = mutation({
  args: {
    templateId: v.id('addonTemplates'),
  },
  handler: async (ctx, { templateId }) => {
    const { person } = await requireAuth(ctx);

    const existing = await ctx.db.get(templateId);
    if (!existing) {
      throw new Error('Template not found');
    }
    if (existing.ownerId !== person._id) {
      throw new Error('You do not own this template');
    }

    await ctx.db.patch(templateId, {
      isPublished: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete an addon template.
 * Only the owner can delete.
 */
export const deleteTemplate = mutation({
  args: {
    templateId: v.id('addonTemplates'),
  },
  handler: async (ctx, { templateId }) => {
    const { person } = await requireAuth(ctx);

    const existing = await ctx.db.get(templateId);
    if (!existing) {
      throw new Error('Template not found');
    }
    if (existing.ownerId !== person._id) {
      throw new Error('You do not own this template');
    }

    await ctx.db.delete(templateId);
    return { success: true };
  },
});

/**
 * Duplicate a template. Creates a copy owned by the current user.
 */
export const duplicateTemplate = mutation({
  args: {
    templateId: v.id('addonTemplates'),
  },
  handler: async (ctx, { templateId }) => {
    const { person } = await requireAuth(ctx);

    const existing = await ctx.db.get(templateId);
    if (!existing) {
      throw new Error('Template not found');
    }
    if (existing.ownerId !== person._id) {
      throw new Error('You do not own this template');
    }

    const now = Date.now();

    const newId = await ctx.db.insert('addonTemplates', {
      ownerId: person._id,
      name: `${existing.name} (copy)`,
      description: existing.description,
      iconName: existing.iconName,
      template: existing.template,
      version: 1,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    });

    return newId;
  },
});
