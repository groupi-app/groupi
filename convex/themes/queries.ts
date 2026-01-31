/**
 * Theme Queries
 *
 * Query functions for theme preferences and custom themes.
 */

import { v } from 'convex/values';
import { query } from '../_generated/server';
import { getCurrentPerson } from '../auth';

/**
 * Get the current user's theme preferences
 * Returns null if no preferences are set (user should use defaults)
 */
export const getThemePreferences = query({
  args: {},
  handler: async ctx => {
    const person = await getCurrentPerson(ctx);
    if (!person) {
      return null;
    }

    const preferences = await ctx.db
      .query('themePreferences')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .first();

    return preferences;
  },
});

/**
 * Get all custom themes for the current user
 */
export const getCustomThemes = query({
  args: {},
  handler: async ctx => {
    const person = await getCurrentPerson(ctx);
    if (!person) {
      return [];
    }

    const themes = await ctx.db
      .query('customThemes')
      .withIndex('by_person', q => q.eq('personId', person._id))
      .collect();

    return themes;
  },
});

/**
 * Get a single custom theme by ID
 * Returns null if not found or not owned by current user
 */
export const getCustomTheme = query({
  args: {
    themeId: v.id('customThemes'),
  },
  handler: async (ctx, { themeId }) => {
    const person = await getCurrentPerson(ctx);
    if (!person) {
      return null;
    }

    const theme = await ctx.db.get(themeId);

    // Only return if owned by current user
    if (!theme || theme.personId !== person._id) {
      return null;
    }

    return theme;
  },
});
