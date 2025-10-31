# tRPC to Server Actions Migration Status

## Completed ✅

### 1. Server Actions Infrastructure (100%)

Created 8 server action files in `apps/web/actions/`:

- ✅ `event-actions.ts` - createEvent, updateEventDetails, deleteEvent, leaveEvent
- ✅ `post-actions.ts` - createPost, updatePost, deletePost
- ✅ `availability-actions.ts` - updateAvailabilities, chooseDateTime
- ✅ `invite-actions.ts` - createInvite, deleteInvite, acceptInvite
- ✅ `membership-actions.ts` - updateMemberRole, removeMember, updateRSVP
- ✅ `reply-actions.ts` - createReply, updateReply, deleteReply
- ✅ `notification-actions.ts` - markAsRead, markAsUnread, markAllAsRead
- ✅ `settings-actions.ts` - updateUserSettings

All actions:

- Return tuple pattern `[error, result]` for consistency
- Use `revalidateTag()` for granular cache invalidation
- Map cache tags from original tRPC routers

### 2. Component Updates (20+ of ~40 components)

Migrated key mutation components to use server actions:

**Event Domain:**

- ✅ `new-event-single-date.tsx` - Uses createEventAction
- ✅ `new-event-multi-date.tsx` - Uses createEventAction
- ✅ `deleteEventDialog.tsx` - Uses deleteEventAction
- ✅ `leaveEventDialog.tsx` - Uses leaveEventAction
- ✅ `edit-event-info.tsx` - Uses updateEventDetailsAction

**Post Domain:**

- ✅ `editor.tsx` - Uses createPostAction & updatePostAction
- ✅ `deletePostDialog.tsx` - Uses deletePostAction

**Reply Domain:**

- ✅ `reply-form.tsx` - Uses createReplyAction
- ✅ `deleteReplyDialog.tsx` - Uses deleteReplyAction

**Invite Domain:**

- ✅ `add-invite.tsx` - Uses createInviteAction
- ✅ `invite-accept.tsx` - Uses acceptInviteAction
- ✅ `delete-invites.tsx` - Uses deleteInviteAction

**Availability Domain:**

- ✅ `availability-form.tsx` - Uses updateAvailabilitiesAction

**Membership Domain:**

- ✅ `event-rsvp.tsx` - Uses updateRSVPAction
- ✅ `member-action-dialog.tsx` - Uses updateMemberRoleAction & removeMemberAction

### 3. Provider Cleanup

- ✅ Removed `TRPCProvider` from `client-providers.tsx`
- ✅ Removed tRPC import from providers

## In Progress 🚧

### Component Updates (~20 remaining)

Components that still use tRPC query hooks (read-only operations):

**Query components that may need conversion:**
These components use `useQuery` hooks for data fetching. Many might already be converted to server components with cache, but some client components may still use hooks:

- Various components in `(event)`, `(post)`, `(myEvents)`, `(settings)` directories
- Check for imports from `@groupi/hooks` for query usage

Most query operations should ideally be:

1. Converted to server components using cached service functions, OR
2. Left as client components if they require client-side interactivity (with data passed as props from server components)

## Remaining Tasks 📋

### 1. Code Cleanup

- [ ] Delete `packages/hooks/src/mutations/` directory (all files)
- [ ] Delete `packages/hooks/src/queries/` directory (all files - if converted to server components)
- [ ] Delete `packages/hooks/src/clients/trpc-client.ts`
- [ ] Delete `packages/hooks/src/clients/query-client.ts`
- [ ] Delete `packages/hooks/src/factories/trpc.ts`
- [ ] Delete `packages/hooks/src/factories/query-client.ts`
- [ ] Delete `apps/web/components/providers/trpc-provider.tsx`

### 2. Infrastructure Cleanup

- [ ] Delete `packages/api/` directory (entire tRPC package)
- [ ] Check and remove any tRPC API routes in `apps/web/app/api/trpc/`

### 3. Dependency Cleanup

Update `apps/web/package.json` and `packages/hooks/package.json`:

- [ ] Remove `@trpc/client`
- [ ] Remove `@trpc/react-query`
- [ ] Remove `@trpc/server`
- [ ] Remove `@tanstack/react-query`
- [ ] Remove `superjson`

### 4. Verification & Testing

- [ ] Run `pnpm install` after dependency removal
- [ ] Check for any remaining imports of `@groupi/hooks` with mutations
- [ ] Run linter and fix any issues
- [ ] Test key user flows:
  - Create event
  - Update event details
  - Create post
  - Reply to post
  - Accept invite
  - Update availability
  - Update RSVP
- [ ] Verify cache invalidation works (data updates after mutations)

## Migration Notes

### Pattern Used

**Before (tRPC):**

```typescript
const { createEvent } = useCreateEvent();
const [error, result] = await createEvent({ ...input });
```

**After (Server Action):**

```typescript
import { createEventAction } from '@/actions/event-actions';
const [error, result] = await createEventAction({ ...input });
```

### Error Handling

Maintained tuple pattern `[error, result]` for backward compatibility with existing error handling code.

### Cache Invalidation

Migrated from React Query invalidation to Next.js `revalidateTag()`:

- User-specific tags: `user-${userId}`, `user-${userId}-events`
- Resource-specific tags: `event-${eventId}`, `post-${postId}`, etc.
- Granular invalidation: `event-${eventId}-members`, `event-${eventId}-posts`

### Query Migration Strategy

Most queries should be handled by server components using cached service functions. Client components should receive data as props. Only interactive client components that need real-time updates should maintain client-side data fetching (if any).

## Next Steps

1. **Finish component updates** - Update remaining ~20 components with query hooks
2. **Clean up dead code** - Remove hooks package mutation/query files
3. **Delete tRPC infrastructure** - Remove packages/api and related files
4. **Update dependencies** - Remove tRPC and React Query from package.json
5. **Test thoroughly** - Verify all mutations work with server actions
6. **Performance check** - Ensure cache invalidation and PPR work correctly
