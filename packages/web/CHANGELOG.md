# @groupi/web

## 1.0.0

### Minor Changes

- 35d0036: Save Event configuration atomically with shared drafts, and handle automatic completion and expired date polls while preserving participation history.
- 4e96ee3: Add bounded credentials, independent integration authorship, and delegated sign-in with consent and app review.
- 49da7c2: Selected-Group delegated applicant consent and private own-context read, with synchronized TypeScript/Python SDK and versioned synthetic integration contract.
- 49da7c2: Add administrator-approved Developer app branding across hosted sign-in, magic-link email, minimal onboarding and consent, with explicit account selection and safe recovery.
- 49da7c2: Expose a single current community Event with explicit absence and configuration conflicts, privacy-safe participation reads, and Organizer completion, reopening, and rescheduling controls with replay-safe SDK operations.
- 49da7c2: Deliver approved community-branded application decisions with trusted status returns and staff-visible, deduplicated email retries independent of admission.
- 49da7c2: Add explicit per-Group announcement opt-in and staff-triggered branded Event mail with durable recipient delivery, live eligibility checks, trusted preference returns and synchronized clients.
- 49da7c2: Add coordinated community exclusion with immediate access enforcement and truthful staff cleanup progress.
- 49da7c2: Resume coordinated community expulsion with authority-checked cleanup, persistent staff progress and explicit reinstatement that restores no participation, invitations or announcement consent.
- 0b8c85c: Add formal Groups across web, mobile, the developer API, and CLI, with managed
  membership, applications, joining questionnaires, persistent Group tools, and
  explicit announcements. Keep Group Event visibility separate from invitations,
  Event membership, and RSVP. New Event attendees start Pending, and ownership
  transfers require recipient acceptance. Require explicit resolution of owned
  Groups and Events before account deletion.
- f5a7247: Add Group-managed Discord access with explicit member connections, role or server membership modes, durable access cleanup, and scoped API/SDK connection journeys.
- 35d0036: Add Simple, Checklist and Bring list types in Events and Groups, with creator-managed participation settings, collaborative completion attribution and quantity claims while preserving existing lists.
- 35d0036: Let post authors and moderators control replies, and let moderators pin up to three posts per Event or Group without additional notifications.
- 9df172b: Add private invite lists across web, mobile, the developer API, and CLI. Manage
  saved selections and explicitly send ordinary event invitations from an editable
  recipient draft, with inline creation and protected retries. Anonymize deleted
  recipients and provide Needs attention repair without changing event membership
  or RSVP.
- 35d0036: Retire new Group announcement and Event email sends in favor of posts, reject retired send/retry APIs and CLI sends, and redirect old management links while preserving stored records, read/status and unsubscribe compatibility.
- b09e9c1: Add shared Post, Form, List and Poll creation across Events and Groups, integrate participant tools into Events, and move add-on management into Event Settings while preserving existing data.
- de67671: Refresh shared and page-specific components with Groupi’s sticker-book design language, consistent hierarchy, accessible actions, and feedback.
- bb0bd6e: Add an optional Support Groupi footer link for one-time contributions through a deployment-configured Stripe checkout.

### Patch Changes

- eaec01b: Support validated CLI add-on participation with participant isolation and consistent app automation behavior.
- eaec01b: Add CLI cover and avatar upload, replacement, and removal with validated owned images and safe recovery.
- eaec01b: Add safe CLI posts, replies, and file attachments with shared validation and atomic updates.
- e729fa1: Add secure CLI browser login with OS credential storage and profile-isolated authentication
- 49da7c2: Support delegated own community application submission, saved-snapshot editing and withdrawal with revision-safe replay, and synchronized TypeScript/Python clients.
- 49da7c2: Add independent community Event Join, revision-safe RSVP and Event Leave, plus own Group departure that retains independent Event participation, with synchronized clients.
- 35d0036: Streamline Form, List and Poll editing and participation, save Poll votes directly, and use compact inline results with permission-gated Form actions.
- 35d0036: Streamline Account and Developer settings, add-on authoring, Discord setup and application review with compact responsive controls and safer draft recovery.
- 9c30df4: Show redirecting feedback and a safe continuation link after a consent decision while the browser returns to the requesting app.
- dd246af: Show Discord server and profile cards with server icons, profile pictures, display names and usernames, while keeping connection problems visible.
- 27216ac: Separate Group overview, editing and management into focused pages with responsive navigation and concise contextual help.
- e93fe11: Improve Groups and Invite Lists layouts, selection feedback, and accessibility.
- 27216ac: Show clear restart guidance and hide stale Discord connection controls when a hosted request expires.
- 13a3485: Clarify the hosted Discord connection page with a compact app identity, clearer access details, and responsive actions.
- 4e96ee3: Validate known backend and add-on data types and preserve cleared answers across web and mobile.
- 81de951: Fix add-on completion and event-specific template behavior. Align native and REST permissions, notifications, reports, and add-on automations. Unify GDL date parsing across web, mobile, and REST with explicit timezones, overnight ranges, and daylight-saving validation. Organize add-ons and backend operations into focused modules and standardize shared workspace source consumption while preserving compiled package distribution.
- 8a6a7d0: Fix control state announcements, action-menu labels, toast delivery, asynchronous confirmations, and misleading navigation and validation feedback.
- 13c0249: Add public privacy policy and support pages with contact information and footer links.
- 72b3689: Keep event pages usable when attendee-list visibility is restricted, without requesting or exposing a roster the viewer cannot access.
- cd94e00: Fix attached tabs, compact RSVP and date controls, notification and presence indicators, unwanted surface borders, and duplicate event feedback. Move event ownership/deletion and Group management into permission-aware settings and menus.

  Replace event loading text with responsive skeletons that match the event page and logistics preview.

- d16afeb: Show requested app actions as checked, read-only permissions on the consent screen while keeping Allow and Deny as the explicit decision. Event selection and background access remain separate choices.
- 84bb797: Refine Group pages with clearer identity, compact tool navigation, and responsive member and shared Event layouts.
- Updated dependencies [35d0036]
- Updated dependencies [4e96ee3]
- Updated dependencies [eaec01b]
- Updated dependencies [eaec01b]
- Updated dependencies [49da7c2]
- Updated dependencies [49da7c2]
- Updated dependencies [49da7c2]
- Updated dependencies [49da7c2]
- Updated dependencies [dd246af]
- Updated dependencies [0b8c85c]
- Updated dependencies [f5a7247]
- Updated dependencies [81de951]
- Updated dependencies [35d0036]
- Updated dependencies [35d0036]
- Updated dependencies [9df172b]
- Updated dependencies [b09e9c1]
- Updated dependencies [de67671]
  - @groupi/shared@1.0.0

## 0.4.0

### Minor Changes

- a1c2752: Bring the native mobile app to production acceptance with native authentication and passkeys, push notifications, universal links, complete event and post workflows, attachment management, mobile-optimized parity, and signed release automation. Align the supporting Convex, shared, and web behavior for secure cross-platform authentication, linking, notifications, permissions, and preview deployments.

### Patch Changes

- d334a81: Fix magic-link sign-in for deep links with query parameters and reject unsafe callback redirects.
- dced5bf: Prompt users to sign in again when adding a passkey requires a fresh session.
- Updated dependencies [a1c2752]
  - @groupi/shared@0.4.0

## 0.3.0

### Minor Changes

- db6b391: Default event RSVPs from date-poll availability and include the assigned status in date-selected notifications.

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

- 7b6f456: Add Claude Code infrastructure: hooks, custom skills, sub-agents, and agent team support

  **Hooks** (`.claude/settings.json`):
  - Auto-format edited files with prettier
  - Block prohibited commands (dev servers, builds, npm/yarn)
  - Lint design tokens after TSX edits
  - Changeset reminder on session stop
  - Enable experimental agent teams

  **Custom Skills** (7 new in `.claude/skills/`):
  - `convex-feature` — end-to-end backend feature development workflow
  - `web-component` — atomic component architecture with design tokens
  - `addon-dev` — add-on framework development process
  - `cross-platform-hook` — shared hook factory pattern
  - `test-convex` — Convex backend testing with test helpers
  - `security-review` — security checklist for auth, authz, and data isolation
  - `schema-migration` — safe schema evolution and migration patterns

  **Custom Sub-agents** (6 new in `.claude/agents/`):
  - `convex-expert` — backend development with Convex MCP tools
  - `ui-expert` — frontend/UI with Playwright browser tools
  - `test-expert` — testing across all packages
  - `reviewer` — read-only code review
  - `security-expert` — security analysis
  - `cicd-expert` — CI/CD, GitHub Actions, deployments

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

- 53f988f: Invite dialog and attachment editing improvements
  - Remove redundant "Save" button from invite dialog — users now just hit Send
  - Preserve invite dialog state when switching between Link/Email/Username tabs
  - Fix post edit attachments not rendering (wrong destructuring path)
  - Unify attachment editing controls: existing attachments now show spoiler toggle, edit alt text/filename, and delete — same as new uploads
  - Remove delete icon from reply attachments when not in edit mode

- e37d1dd: Add optional notes to RSVP responses, availability votes, and proposed dates
  - RSVP notes: attendees can add a short note (max 200 chars) when responding to an event, visible to themselves and organizers/moderators
  - Availability notes: users can add notes per date when marking availability
  - Potential datetime notes: organizers can annotate proposed event dates with notes visible to all members

- 98be1cd: Improve frontend performance and optimize Convex queries and mutations

  Landing page now renders instantly without waiting for auth, reducing LCP from 6.2s to ~2.1s. Replaced framer-motion with CSS animations, deferred Sentry Replay and Google One Tap loading. Fixed full table scans in person lookups, merged duplicate page-load queries, batched notification fan-out, eliminated double auth calls in mutations, and added compound indexes for notification and membership queries. Upgraded Convex to 1.43.0.

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

- bf7f489: Fix CORS error when linking Discord or Google accounts by using a relative URL instead of an absolute URL constructed from NEXT_PUBLIC_BASE_URL
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

- 5fcc09b: Fix invite page allowing join button press before redirect when user is already an event member. The button is now disabled during the membership check, and the backend gracefully handles duplicate join attempts instead of erroring.
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

- 36354df: Simplify email invite dialog to a single-step workflow: add emails to list and send invites in one action, removing the confusing intermediate "Save" step and "Pending" badge
- ea50569: Add custom addons settings navigation and UI refinements

  Add "Add-ons" link with experimental badge to settings navigation. Add blocks icon for addon builder. Minor badge, calendar, and settings template styling improvements.
