---
'@groupi/web': minor
'@groupi/convex': minor
---

Add in-app event invitation system

Allow users to directly invite others to events with optional messages. Invitations can be pending, accepted, or declined.

- New `eventInvites` table with full CRUD operations
- Invite-to-event popover accessible from profile dialogs and event pages
- User search for finding people to invite
- "Invited" tab on the events page showing pending invitations with accept/decline actions
- "Discover" tab for browsing events shared by friends or marked as public
- New notification types for EVENT_INVITE_RECEIVED and EVENT_INVITE_ACCEPTED
- Combined events + invites query for efficient tab switching
