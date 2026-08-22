---
name: security-review
description: Security review checklist for Groupi covering Better Auth authentication, Convex authorization, input validation, REST API security, and addon data isolation. Use when reviewing code for security issues or building auth-sensitive features.
---

# Security Review Guide

## Authentication Layer (Better Auth)

Groupi uses Better Auth with Convex component. Key files:

- `convex/auth.ts` - Auth helpers (`requireAuth`, `getCurrentPerson`)
- `convex/auth.config.ts` - Better Auth configuration
- `packages/web/lib/auth-client.ts` - Client-side auth

### Review Checklist

- [ ] All mutations use `requireAuth(ctx)` (throws if unauthenticated)
- [ ] Queries use `getCurrentPerson(ctx)` for optional auth
- [ ] No direct `ctx.auth.getUserIdentity()` calls (use the wrappers)
- [ ] Session tokens never logged or exposed in error messages
- [ ] Auth state never stored in localStorage (Better Auth handles cookies)

## Authorization (Convex Functions)

### Review Checklist

- [ ] Resource ownership verified before mutations (check `creatorId`, `personId`)
- [ ] Event membership verified for event-scoped operations
- [ ] Role checks use `requireEventRole(ctx, eventId, 'MODERATOR')` not manual checks
- [ ] Admin checks use `isAdminRole()` from `convex/lib/constants`
- [ ] No data from one event leaks into another event's queries

### Common Vulnerabilities

```typescript
// INSECURE: No ownership check
export const deletePost = mutation({
  handler: async (ctx, args) => {
    await ctx.db.delete(args.postId); // Anyone can delete!
  },
});

// SECURE: Verify ownership or role
export const deletePost = mutation({
  handler: async (ctx, args) => {
    const { person } = await requireAuth(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError('Post not found');

    const membership = await getMembership(ctx, post.eventId, person._id);
    if (post.authorId !== person._id && !isModeratorOrAbove(membership.role)) {
      throw new ConvexError('Not authorized to delete this post');
    }

    await ctx.db.delete(args.postId);
  },
});
```

## Input Validation

### Review Checklist

- [ ] All function `args` use Convex validators (`v.string()`, `v.id()`, etc.)
- [ ] String inputs have length limits where appropriate
- [ ] IDs are validated with `v.id("tableName")` not `v.string()`
- [ ] No raw user input in database queries without validation
- [ ] Addon config validated with `validateConfig()` before storage

## REST API Security (`convex/api/v1/`)

### Review Checklist

- [ ] All endpoints require API key authentication
- [ ] Response format follows `{ success, data?, error? }` pattern
- [ ] Error messages don't leak internal details (stack traces, query plans)
- [ ] Rate limiting considered for public-facing endpoints
- [ ] CORS headers restricted to allowed origins

## Addon Data Isolation

### Review Checklist

- [ ] Addon data scoped to event (no cross-event data access)
- [ ] User responses keyed as `response:{personId}` (not guessable keys)
- [ ] Config mutations require MODERATOR+ role
- [ ] Data mutations verify event membership
- [ ] `onDisabled` and `onEventDeleted` clean up all addon data
- [ ] Trusted addon handlers don't expose `rawCtx` to user input

## Client-Side Security

### Review Checklist

- [ ] No secrets in client-side code (API keys, tokens)
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] External URLs validated before rendering as links
- [ ] File uploads validated for type and size
- [ ] No sensitive data in URL parameters or browser history
