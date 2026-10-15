import { ConvexError, v } from 'convex/values';
import { mutation, query, internalQuery } from '../_generated/server';
import { getCurrentPerson, requireAuth } from '../auth';
import { isAdminRole } from '../lib/constants';
import { hostedAppearance } from './contracts';

/** Appearance is administrative configuration, never an authorization parameter. */
export const configureAppearance = mutation({
  args: { appId: v.id('delegatedApps'), appearance: hostedAppearance },
  returns: v.null(),
  handler: async (ctx, { appId, appearance }) => {
    const { user } = await requireAuth(ctx);
    if (!isAdminRole(user.role))
      throw new ConvexError('Platform administrator required');
    const app = await ctx.db.get(appId);
    if (!app) throw new ConvexError('App not found');
    if (appearance.statusReturnUrl) {
      let url: URL;
      try {
        url = new URL(appearance.statusReturnUrl);
      } catch {
        throw new ConvexError('Invalid status return URL');
      }
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.hash ||
        !app.redirectUris.some(uri => {
          try {
            return new URL(uri).origin === url.origin;
          } catch {
            return false;
          }
        })
      )
        throw new ConvexError(
          'Status return must use an approved HTTPS app origin'
        );
    }
    for (const name of [appearance.brandName, appearance.senderName]) {
      if (!name.trim() || name.length > 100 || /[<>\r\n]/.test(name))
        throw new ConvexError('Invalid hosted brand or sender name');
    }
    if (
      /[,;@"\\]/.test(appearance.senderName) ||
      [...appearance.senderName].some(
        character =>
          character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
      )
    )
      throw new ConvexError('Invalid hosted sender name');
    if (!/^#[0-9a-f]{6}$/i.test(appearance.accent))
      throw new ConvexError('Invalid hosted accent');
    await ctx.db.patch(appId, { appearance, updatedAt: Date.now() });
    return null;
  },
});

export const getAppearance = query({
  args: { interactionId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      appName: v.string(),
      providerName: v.string(),
      instance: v.string(),
      appearance: v.optional(hostedAppearance),
      expiresAt: v.number(),
    })
  ),
  handler: async (ctx, { interactionId }) => {
    const request = await ctx.db
      .query('delegatedConsentRequests')
      .withIndex('by_interactionId', q => q.eq('interactionId', interactionId))
      .unique();
    if (!request || request.decision || request.expiresAt <= Date.now())
      return null;
    const app = await ctx.db.get(request.appId);
    if (!app || app.status === 'suspended') return null;
    if (app.status !== 'approved') {
      const person = await getCurrentPerson(ctx);
      if (person?._id !== app.ownerPersonId) return null;
    }
    return {
      appName: app.name,
      providerName: 'Groupi',
      instance: request.instanceId,
      appearance: app.appearance,
      expiresAt: request.expiresAt,
    };
  },
});

/** Only the exact local hosted continuation can select a registered email brand. */
export const getEmailAppearance = internalQuery({
  args: { interactionId: v.string() },
  returns: v.union(v.null(), hostedAppearance),
  handler: async (ctx, { interactionId }) => {
    const request = await ctx.db
      .query('delegatedConsentRequests')
      .withIndex('by_interactionId', q => q.eq('interactionId', interactionId))
      .unique();
    if (!request || request.decision || request.expiresAt <= Date.now())
      return null;
    const app = await ctx.db.get(request.appId);
    return app?.status === 'approved' ? (app.appearance ?? null) : null;
  },
});
