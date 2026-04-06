# @groupi/web

## 0.2.0

### Minor Changes

- ea50569: Refactor addon framework with scoped context, handler builder, and expanded lifecycle

  **Backend:**
  - Replace raw `AddonHandler` interface with `defineAddonHandler()` builder pattern — provides runtime validation, brand checking, and automatic try/catch wrapping for `validateConfig`
  - Introduce scoped `AddonContext` for standard addons (data access, event info, members, notifications) and `TrustedAddonContext` for first-party addons needing raw DB/scheduler access
  - Add 4 new lifecycle hooks: `onEventUpdated`, `onDataSubmitted`, `onMemberJoined`, `onMemberLeft`
  - Refactor existing handlers (reminders, questionnaire, bring list) to use builder pattern and scoped context
  - Dispatch lifecycle events from event mutations (`updateEvent`, `removeMember`, `leaveEvent`, `banMember`, `joinDiscoverableEvent`)

  **Frontend:**
  - Add validated `registerAddon()` with duplicate detection, required field checks, and gating consistency validation
  - Expand addon hooks with `useEnableAddon`, `useUpdateAddonConfig`, `useDisableAddon`, `useSetAddonData`
  - Add side-effect imports to all 4 addon rendering entry points

- e37d1dd: Add extensible add-on framework for events

  Introduce a generic add-on system that allows optional, pluggable features to be attached to events. The framework manages lifecycle, configuration, storage, gating, and UI rendering through a handler + registry pattern on both backend and frontend.

  **Framework:**
  - New tables: `eventAddonConfigs`, `addonData`, `addonOptOuts`
  - Backend handler interface with lifecycle hooks (onEnabled, onDisabled, onConfigUpdated, onDateChosen, onDateReset, onEventDeleted)
  - Frontend registry with self-registering addon definitions
  - Generic hooks for addon config, data, and opt-out management
  - Addon gating system to require completion before accessing event content

  **Built-in add-ons:**
  - Reminders: refactored from legacy system to use the add-on framework with per-user opt-out support
  - Questionnaire: new add-on allowing organizers to create custom questionnaires with 7 question types (short answer, long answer, multiple choice, checkboxes, number, dropdown, yes/no); responses are gated and organizers can view all responses in a table

- aa5f12a: Add Bring List add-on for coordinating what attendees bring to events

  Organizers can define a list of items with quantities, and attendees claim what they'll bring. Single-quantity items toggle on/off; multi-quantity items show a picker. An overview card with claim progress is visible to all members, with CSV/JSON export available to organizers. Config changes clear all claims and notify members.

- ea50569: Add custom addon builder and template system

  Users can create custom addons from templates using a visual builder with drag-and-drop field configuration.

  **Backend:**
  - New `addonTemplates` table for user-created templates with versioning and draft/published states
  - Custom addon handler with template validation supporting 13 field types (text, number, select, multiselect, yesno, list_item, vote, toggle, action_button, static_text, dynamic_summary, divider, info_callout)
  - IFTTT-style automation engine with declarative trigger → condition → action chains supporting notifications, post creation, webhooks, and data operations
  - Section layouts (`form` and `interactive`) with field type restrictions per layout

  **Frontend:**
  - Visual addon builder at `/addon-builder` with drag-and-drop, preview panel, and YAML editor
  - Template picker for event creation wizard and manage addons page
  - Custom addon settings page at `/settings/custom-addons`
  - Field editors, condition evaluator, and custom addon renderer components

- ea50569: Add Discord integration add-on for syncing events with Discord servers

  Organizers can connect a Discord server to automatically create, update, and delete Discord scheduled events when Groupi event details change. Uses trusted handler context for scheduler access. Syncs event title, description, location, and date changes to Discord via the bot API.

- e37d1dd: Enhance profile view dialog with block, invite, and remove actions
  - Add action menu to profile dialog with options to invite to event, remove friend, and block user
  - Include confirmation dialogs for destructive actions (remove friend, block)
  - Integrate invite-to-event flow directly from user profiles

- e37d1dd: Add in-app event invitation system

  Allow users to directly invite others to events with optional messages. Invitations can be pending, accepted, or declined.
  - New `eventInvites` table with full CRUD operations
  - Invite-to-event popover accessible from profile dialogs and event pages
  - User search for finding people to invite
  - "Invited" tab on the events page showing pending invitations with accept/decline actions
  - "Discover" tab for browsing events shared by friends or marked as public
  - New notification types for EVENT_INVITE_RECEIVED and EVENT_INVITE_ACCEPTED
  - Combined events + invites query for efficient tab switching

- e37d1dd: Add optional notes to RSVP responses, availability votes, and proposed dates
  - RSVP notes: attendees can add a short note (max 200 chars) when responding to an event, visible to themselves and organizers/moderators
  - Availability notes: users can add notes per date when marking availability
  - Potential datetime notes: organizers can annotate proposed event dates with notes visible to all members

- e37d1dd: Add privacy controls, event visibility, and user blocking
  - Event visibility settings: organizers can set events to PRIVATE, FRIENDS, or PUBLIC to control who can discover and join them
  - User privacy settings: granular controls for who can send friend requests (everyone, event members, no one) and event invites (everyone, event members, friends, no one)
  - User blocking: block/unblock users to prevent them from sending friend requests or event invites
  - New privacy settings page under user settings
  - Privacy checks enforced on friend request and event invite mutations

- e37d1dd: Add CSV and JSON export for questionnaire responses

  Organizers can export all questionnaire responses from the "All Responses" view via a dropdown menu. Includes a reusable export utility (`lib/export-utils.ts`) that any addon or page can use for downloading tabular data as CSV or JSON.

- 79441f0: Redesign UI with sticker journal aesthetic

  **Visual Updates:**
  - Apply sticker-style white borders and ring outlines to base UI components (Card, Badge, Avatar, Dialog, Sheet, Tabs)
  - Update atoms with sticker styling: PresenceIndicator, UnreadIndicator, EventDateBadge, HostingBadge, StatusIndicator
  - Enhance molecules: RoleBadge with solid sticker badges, EmptyState and LoadingState with sticker containers
  - Add new sticker components: LogoSticker, StickerIcon, StepBadge, StickerCard, StepItem

  **Homepage:**
  - Complete homepage redesign with animated sticker elements
  - Add "How It Works" section with step badges
  - Add feature cards with sticker-style presentation
  - Fix hydration error by using deterministic TypeAnimation sequence

  **Bug Fixes:**
  - Fix z-index issue where dropdown menus appeared behind popovers
  - Standardize destructive button styling across mobile drawers and desktop dropdowns
  - Consistent hover states: `hover:bg-destructive hover:text-destructive-foreground`

- c052bdb: Redesign theme settings UX with simplified two-option mode selector
  - Replace confusing "Always Light"/"Always Dark" terminology with cleaner "Single Theme" vs "Match System" toggle
  - Add expandable cards for system theme mapping that show current selection and reveal full theme gallery when clicked
  - Include both base themes and custom themes in expandable cards for system mode
  - Show unified theme list (base + custom) in single theme mode
  - Remove light/dark mode labels from theme cards (names are self-explanatory)
  - Add icons to mobile settings menu options (bell for Notifications, user for Account, palette for Appearance)

### Patch Changes

- ea50569: Fix sign-in page to redirect authenticated users and show loading state

  Redirect authenticated users away from the sign-in page instead of showing the sign-in form. Also redirect unauthenticated users away from add-account mode and show a loading spinner during auth state determination to prevent form flash.

- 26ecd02: Fix Discord account linking in multi-session scenarios
  - Add `account.accountLinking` configuration to Better Auth with `trustedProviders` and `allowDifferentEmails`, fixing failures when the Discord email differs from the active account's email
  - Fix linked accounts UI not updating after unlinking — added `refetch` to `useLinkedAccounts` hook so the list updates instantly without a page refresh
  - Add error handling for OAuth callback failures on the sign-in page (reads `?error=` query params and shows user-friendly messages)
  - Add error handling for 4xx responses from the `/api/auth/link-social` endpoint in the linked accounts settings

- 9079bfd: fix(web): improve loading states and reduce UI flashes
  - Fix friend request loading state: clicking "Add" on multiple users no longer interferes with each other's loading spinners
  - Fix home page redirect: show loading spinner while auth state is determined, preventing marketing page flash for logged-in users
  - Fix theme persistence: save system-detected theme to localStorage so theme flash only happens once for new users
  - Fix presence status: prevent race condition that caused status to flash from online to idle on page navigation
  - Make cancel friend request optimistic: UI updates immediately when cancelling a sent request

- cd8f586: fix(auth): handle logout gracefully without throwing errors
  - Fix "Unauthenticated" error when logging out by catching the error in getCurrentUser query
  - Fix avatar empty src warning by passing undefined instead of empty string
  - Add skeleton loading state for sign-in button during auth loading
  - Remove unused demo pages (1, 2, 3, 4)

- f7fb966: Fix presence/status system bugs causing inconsistent idle and lastSeen behavior
  - Fix IDLE status persisting after page refresh by syncing status on mount
  - Fix lastSeen going stale during continuous activity by removing dependency that reset the update interval
  - Fix expired status blocking auto-idle transitions
  - Fix manual IDLE being overwritten by auto-idle revert via new statusSource tracking
  - Fix autoIdleEnabled=false preventing revert from idle back to online

- fb38493: Fix 20+ production bugs reported by users

  **Profile/Settings:**
  - Fix "Remove" button showing when no profile picture exists
  - Remove `signIn.social()` fallback in Discord linking that could log into wrong account

  **Events:**
  - Replace cmdk-based location input with plain input for reliable Google Places autocomplete
  - Add bottom margin to save button on event edit page so it clears mobile nav bar
  - Make invite dialog body scrollable on mobile
  - Fix "Go back" button on error pages when there's no browser history
  - Fix availability form navigating before mutation completes, causing poll to reappear
  - Remove deprecated legacy reminder field from event edit page

  **Add-ons:**
  - Allow clearing bring list quantity input (empty state before typing new number)
  - Cap bring list quantities at 999 and enforce max on input change

  **Dates:**
  - Update AI prompt to use "X pm to Y pm" format for better chrono-node parsing
  - Add `collisionPadding` to popover for better mobile positioning
  - Make calendar responsive with CSS variable `--cell-size` for mobile-friendly sizing

  **Posts/Replies:**
  - Add `dark:prose-invert` to reply content for OLED/dark theme readability
  - Force BlockNote editor text color to use theme foreground color
  - Make reply edit/delete menu button visible on mobile (not hover-only)
  - Show attachments when editing replies
  - Hide placeholder text on non-first blocks in BlockNote editor
  - Remove debug console.log statements from reply component
  - Update post editor loading skeletons to match real page layout (no toolbar)

  **Other Users:**
  - Fix mutual events dialog layout on mobile with stacked flex layout

  **Themes:**
  - Consolidate contrast warning and success toasts to prevent stacking
  - Replace fixed mobile preview with collapsible preview inside drawer

- b8b00c1: fix(web): respect system theme preference and hide settings sidebar on mobile
  - Fix theme defaulting to light instead of respecting system preference on initial load
  - Add effect to sync system preference after SSR hydration
  - Hide settings sidebar on mobile for all settings pages, not just root

- ea50569: Add custom addons settings navigation and UI refinements

  Add "Add-ons" link with experimental badge to settings navigation. Add blocks icon for addon builder. Minor badge, calendar, and settings template styling improvements.
