import { internalQuery, internalMutation } from '../../../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../../../_generated/dataModel';

/**
 * Internal queries and mutations for theme routes
 */

export const listCustomThemes = internalQuery({
  args: {
    personId: v.string(),
  },
  handler: async (ctx, { personId }) => {
    const themes = await ctx.db
      .query('customThemes')
      .withIndex('by_person', q => q.eq('personId', personId as Id<'persons'>))
      .collect();

    return themes.map(theme => ({
      id: theme._id as string,
      name: theme.name,
      description: theme.description ?? null,
      baseThemeId: theme.baseThemeId,
      mode: theme.mode,
      tokenOverrides: theme.tokenOverrides,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
    }));
  },
});

export const getThemePreferences = internalQuery({
  args: {
    personId: v.string(),
  },
  handler: async (ctx, { personId }) => {
    const prefs = await ctx.db
      .query('themePreferences')
      .withIndex('by_person', q => q.eq('personId', personId as Id<'persons'>))
      .first();

    if (!prefs) return null;

    return {
      selectedThemeType: prefs.selectedThemeType,
      selectedThemeId: prefs.selectedThemeId,
      selectedCustomThemeId: prefs.selectedCustomThemeId
        ? (prefs.selectedCustomThemeId as string)
        : null,
      useSystemPreference: prefs.useSystemPreference,
      systemLightThemeId: prefs.systemLightThemeId,
      systemDarkThemeId: prefs.systemDarkThemeId,
    };
  },
});

export const createCustomTheme = internalMutation({
  args: {
    personId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    baseThemeId: v.string(),
    mode: v.union(v.literal('light'), v.literal('dark')),
    tokenOverrides: v.optional(v.any()),
  },
  handler: async (
    ctx,
    { personId, name, description, baseThemeId, mode, tokenOverrides }
  ) => {
    const now = Date.now();

    const themeId = await ctx.db.insert('customThemes', {
      personId: personId as Id<'persons'>,
      name: name.trim(),
      description: description?.trim(),
      baseThemeId,
      mode,
      tokenOverrides: tokenOverrides ?? {},
      createdAt: now,
      updatedAt: now,
    });

    const theme = await ctx.db.get(themeId);
    if (!theme) throw new Error('Failed to create theme');

    return {
      id: theme._id as string,
      name: theme.name,
      description: theme.description ?? null,
      baseThemeId: theme.baseThemeId,
      mode: theme.mode,
      tokenOverrides: theme.tokenOverrides,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
    };
  },
});

export const updateCustomTheme = internalMutation({
  args: {
    themeId: v.string(),
    personId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    baseThemeId: v.optional(v.string()),
    mode: v.optional(v.union(v.literal('light'), v.literal('dark'))),
    tokenOverrides: v.optional(v.any()),
  },
  handler: async (
    ctx,
    { themeId, personId, name, description, baseThemeId, mode, tokenOverrides }
  ) => {
    const theme = await ctx.db.get(themeId as Id<'customThemes'>);
    if (!theme) {
      throw new Error('Theme not found');
    }

    // Verify ownership
    if ((theme.personId as string) !== personId) {
      throw new Error('Access denied: you do not own this theme');
    }

    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) {
      updateData.description =
        description === null ? undefined : description.trim();
    }
    if (baseThemeId !== undefined) updateData.baseThemeId = baseThemeId;
    if (mode !== undefined) updateData.mode = mode;
    if (tokenOverrides !== undefined)
      updateData.tokenOverrides = tokenOverrides;

    await ctx.db.patch(themeId as Id<'customThemes'>, updateData);

    const updated = await ctx.db.get(themeId as Id<'customThemes'>);
    if (!updated) throw new Error('Theme not found after update');

    return {
      id: updated._id as string,
      name: updated.name,
      description: updated.description ?? null,
      baseThemeId: updated.baseThemeId,
      mode: updated.mode,
      tokenOverrides: updated.tokenOverrides,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  },
});

export const deleteCustomTheme = internalMutation({
  args: {
    themeId: v.string(),
    personId: v.string(),
  },
  handler: async (ctx, { themeId, personId }) => {
    const theme = await ctx.db.get(themeId as Id<'customThemes'>);
    if (!theme) {
      throw new Error('Theme not found');
    }

    // Verify ownership
    if ((theme.personId as string) !== personId) {
      throw new Error('Access denied: you do not own this theme');
    }

    await ctx.db.delete(themeId as Id<'customThemes'>);

    return { success: true };
  },
});

export const setThemePreference = internalMutation({
  args: {
    personId: v.string(),
    selectedThemeType: v.union(v.literal('base'), v.literal('custom')),
    selectedThemeId: v.string(),
    selectedCustomThemeId: v.optional(v.union(v.string(), v.null())),
    useSystemPreference: v.boolean(),
    systemLightThemeId: v.string(),
    systemDarkThemeId: v.string(),
  },
  handler: async (
    ctx,
    {
      personId,
      selectedThemeType,
      selectedThemeId,
      selectedCustomThemeId,
      useSystemPreference,
      systemLightThemeId,
      systemDarkThemeId,
    }
  ) => {
    const pId = personId as Id<'persons'>;
    const now = Date.now();

    const existing = await ctx.db
      .query('themePreferences')
      .withIndex('by_person', q => q.eq('personId', pId))
      .first();

    const prefsData = {
      personId: pId,
      selectedThemeType,
      selectedThemeId,
      selectedCustomThemeId:
        selectedCustomThemeId && selectedCustomThemeId !== null
          ? (selectedCustomThemeId as Id<'customThemes'>)
          : undefined,
      useSystemPreference,
      systemLightThemeId,
      systemDarkThemeId,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, prefsData);
    } else {
      await ctx.db.insert('themePreferences', prefsData);
    }

    return {
      selectedThemeType,
      selectedThemeId,
      selectedCustomThemeId: selectedCustomThemeId ?? null,
      useSystemPreference,
      systemLightThemeId,
      systemDarkThemeId,
    };
  },
});
