/**
 * Theme Mutations
 *
 * Mutation functions for managing theme preferences and custom themes.
 */

import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireAuth } from '../auth';

// Token overrides validator
const tokenOverridesValidator = v.object({
  brand: v.optional(
    v.object({
      primary: v.optional(v.string()),
      secondary: v.optional(v.string()),
      accent: v.optional(v.string()),
    })
  ),
  background: v.optional(
    v.object({
      page: v.optional(v.string()),
      surface: v.optional(v.string()),
      elevated: v.optional(v.string()),
      sunken: v.optional(v.string()),
    })
  ),
  text: v.optional(
    v.object({
      primary: v.optional(v.string()),
      secondary: v.optional(v.string()),
      heading: v.optional(v.string()),
      muted: v.optional(v.string()),
    })
  ),
  status: v.optional(
    v.object({
      success: v.optional(v.string()),
      warning: v.optional(v.string()),
      error: v.optional(v.string()),
      info: v.optional(v.string()),
    })
  ),
  shadow: v.optional(
    v.object({
      raised: v.optional(v.string()),
      floating: v.optional(v.string()),
    })
  ),
});

/**
 * Save theme preference for the current user
 * Creates new preference if none exists, otherwise updates existing
 */
export const saveThemePreference = mutation({
  args: {
    selectedThemeType: v.union(v.literal('base'), v.literal('custom')),
    selectedThemeId: v.string(),
    selectedCustomThemeId: v.optional(v.id('customThemes')),
    useSystemPreference: v.boolean(),
    systemLightThemeId: v.string(),
    systemDarkThemeId: v.string(),
  },
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);

    // Check if preferences already exist
    const existing = await ctx.db
      .query('themePreferences')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing preferences
      await ctx.db.patch(existing._id, {
        selectedThemeType: args.selectedThemeType,
        selectedThemeId: args.selectedThemeId,
        selectedCustomThemeId: args.selectedCustomThemeId,
        useSystemPreference: args.useSystemPreference,
        systemLightThemeId: args.systemLightThemeId,
        systemDarkThemeId: args.systemDarkThemeId,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new preferences
      const id = await ctx.db.insert('themePreferences', {
        personId: person._id,
        selectedThemeType: args.selectedThemeType,
        selectedThemeId: args.selectedThemeId,
        selectedCustomThemeId: args.selectedCustomThemeId,
        useSystemPreference: args.useSystemPreference,
        systemLightThemeId: args.systemLightThemeId,
        systemDarkThemeId: args.systemDarkThemeId,
        updatedAt: now,
      });
      return id;
    }
  },
});

/**
 * Create a new custom theme
 */
export const createCustomTheme = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    baseThemeId: v.string(),
    mode: v.union(v.literal('light'), v.literal('dark')),
    tokenOverrides: tokenOverridesValidator,
  },
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);

    const now = Date.now();

    const id = await ctx.db.insert('customThemes', {
      personId: person._id,
      name: args.name,
      description: args.description,
      baseThemeId: args.baseThemeId,
      mode: args.mode,
      tokenOverrides: args.tokenOverrides,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

/**
 * Update an existing custom theme
 */
export const updateCustomTheme = mutation({
  args: {
    themeId: v.id('customThemes'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    tokenOverrides: v.optional(tokenOverridesValidator),
  },
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);

    // Get the theme and verify ownership
    const theme = await ctx.db.get(args.themeId);
    if (!theme) {
      throw new Error('Theme not found');
    }
    if (theme.personId !== person._id) {
      throw new Error('Not authorized to modify this theme');
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.description !== undefined) {
      updates.description = args.description;
    }
    if (args.tokenOverrides !== undefined) {
      updates.tokenOverrides = args.tokenOverrides;
    }

    await ctx.db.patch(args.themeId, updates);

    return args.themeId;
  },
});

/**
 * Delete a custom theme
 */
export const deleteCustomTheme = mutation({
  args: {
    themeId: v.id('customThemes'),
  },
  handler: async (ctx, { themeId }) => {
    const { person } = await requireAuth(ctx);

    // Get the theme and verify ownership
    const theme = await ctx.db.get(themeId);
    if (!theme) {
      throw new Error('Theme not found');
    }
    if (theme.personId !== person._id) {
      throw new Error('Not authorized to delete this theme');
    }

    // Check if this theme is currently selected in preferences
    const preferences = await ctx.db
      .query('themePreferences')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .first();

    if (
      preferences &&
      preferences.selectedThemeType === 'custom' &&
      preferences.selectedCustomThemeId === themeId
    ) {
      // Reset to default base theme
      await ctx.db.patch(preferences._id, {
        selectedThemeType: 'base',
        selectedThemeId: 'groupi-light',
        selectedCustomThemeId: undefined,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(themeId);

    return { success: true };
  },
});

/**
 * Duplicate a custom theme
 * Creates a copy with " (Copy)" appended to the name
 */
export const duplicateCustomTheme = mutation({
  args: {
    themeId: v.id('customThemes'),
  },
  handler: async (ctx, { themeId }) => {
    const { person } = await requireAuth(ctx);

    // Get the theme and verify ownership
    const theme = await ctx.db.get(themeId);
    if (!theme) {
      throw new Error('Theme not found');
    }
    if (theme.personId !== person._id) {
      throw new Error('Not authorized to duplicate this theme');
    }

    const now = Date.now();

    const newId = await ctx.db.insert('customThemes', {
      personId: person._id,
      name: `${theme.name} (Copy)`,
      description: theme.description,
      baseThemeId: theme.baseThemeId,
      mode: theme.mode,
      tokenOverrides: theme.tokenOverrides,
      createdAt: now,
      updatedAt: now,
    });

    return newId;
  },
});
