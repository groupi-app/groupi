# Web vs Mobile Gap Analysis

Comprehensive audit of features, UI elements, and quality-of-life items that exist in the web app but are missing or incomplete in the mobile app.

**Audit date:** 2026-04-13

## Table of Contents

- [Summary Statistics](#summary-statistics)
- [1. Event Add-on System](#1-event-add-on-system)
- [2. Event Management](#2-event-management)
- [3. Post & Discussion System](#3-post--discussion-system)
- [4. Real-Time & Presence Features](#4-real-time--presence-features)
- [5. Invite System](#5-invite-system)
- [6. Social & Friends Features](#6-social--friends-features)
- [7. Notifications](#7-notifications)
- [8. Event Discovery & Lists](#8-event-discovery--lists)
- [9. Member & Role Management](#9-member--role-management)
- [10. Settings](#10-settings)
- [11. Profile](#11-profile)
- [12. Authentication & Onboarding](#12-authentication--onboarding)
- [13. Admin Panel](#13-admin-panel)
- [14. Navigation & Layout](#14-navigation--layout)
- [15. Theming & Appearance](#15-theming--appearance)
- [16. Reporting & Moderation](#16-reporting--moderation)
- [17. Changelog](#17-changelog)
- [18. PWA Features](#18-pwa-features)
- [19. Component Architecture Gaps](#19-component-architecture-gaps)
- [20. Minor Quality-of-Life Gaps](#20-minor-quality-of-life-gaps)

---

## Summary Statistics

| Metric                 | Web  | Mobile |
| ---------------------- | ---- | ------ |
| Routes/screens         | 60+  | 25     |
| Components             | 160+ | 58     |
| Custom hooks           | 50+  | 5      |
| Utility/lib files      | 28+  | 4      |
| State stores           | 6    | 0      |
| Test files             | 40+  | 2      |
| Empty placeholder dirs | 0    | 6      |

---

## 1. Event Add-on System

The entire add-on framework is **completely absent** from the mobile app. This is the single largest feature gap.

### 1.1 Reminder Add-on — MISSING

- Configurable event reminders (30 min to 4 weeks before event)
- Per-attendee opt-out capability
- Smart availability checks preventing reminders for past events

### 1.2 Questionnaire Add-on — MISSING

- 7 question types: short answer, long answer, multiple choice, checkboxes, number, dropdown, yes/no
- Optional/required field configuration per question
- Attendee response submission and editing
- Organizer view of all responses
- Export responses to CSV or JSON

### 1.3 Bring List Add-on — MISSING

- Organizer creates list of items needed for event
- Per-item quantity tracking
- Attendees claim items they will bring
- Visual claim indicators with member avatars
- Export functionality for organizers

### 1.4 Discord Add-on — MISSING

- Link Discord server to event
- Bot invite flow
- Automatic creation of synced Discord scheduled events
- Event updates sync to Discord

### 1.5 Custom Add-on Renderer — MISSING

- Renders template-based custom add-ons
- Dynamic field types (text, number, select, multiselect, yesno, vote, list_item, toggle, action_button)
- Interactive vs form-based section layouts
- Automation engine with trigger → condition → action chains
- Configurable fields for organizer customization

### 1.6 Add-on Management — MISSING

- Enable/disable add-ons per event
- Configure add-on settings
- Template picker for pre-built add-on templates
- Add-on gating (require completion before event access)

### 1.7 Add-on Builder — MISSING

- Full visual editor for creating custom add-on templates
- Field type picker and section management
- Automation configuration with variables
- Live preview (attendee and organizer views)
- YAML editor for power users
- Template library and metadata management
- Icon picker for add-on branding

### 1.8 Custom Add-ons Settings Page — MISSING

- Template library management from user settings
- Create, edit, delete add-on templates

---

## 2. Event Management

### 2.1 Date Selection (Organizer Choosing Final Date) — MISSING

- Dedicated page for organizer to finalize event date from poll results
- Date cards ranked by availability votes
- Visual progress bars showing YES/MAYBE/NO distribution
- Two-step confirmation flow (overview → confirm)
- Per-date organizer notes (add/edit)

### 2.2 Change Date Flow — MISSING

- Ability to change an already-chosen date
- Option to switch between single date and multi-date poll
- Separate flows for single date change vs new multi-date poll

### 2.3 Event Muting — MISSING

- Toggle to mute/unmute event notifications
- Muted bell indicator on event cards
- Optimistic updates for instant feedback
- Muted events provider for consistent state

### 2.4 Availability Polling — View & Summary — PARTIAL

- **Mobile has**: Basic voting (YES/MAYBE/NO per date option)
- **Mobile missing**:
  - Per-date organizer notes
  - Response summary counts (X YES, Y MAYBE, Z NO)
  - Expandable member response lists per date option
  - "All Yes"/"All Maybe"/"All No" batch quick-select buttons
  - Ranked date cards showing best options
  - Sort by rank vs sort by date toggle

### 2.5 Event Visibility Setting During Creation — PARTIAL

- **Mobile has**: No visibility selector in create event wizard
- **Web has**: Visibility dropdown with Private, Friends Can Discover, Public options in the create event info step

### 2.6 Location Autocomplete — MISSING

- Web has a `LocationInput` component with autocomplete suggestions
- Mobile has a plain text input for location

### 2.7 Cover Image Focal Point — MISSING

- Web allows selecting a focal point on cover images via `ImageFocalPointPicker`
- Focal point is stored and used to position the image in different aspect ratios
- Mobile only uploads images without focal point support

### 2.8 Smart Date Input — MISSING

- Natural language date parsing (e.g., "Tuesday and Thursday next week 6-8pm")
- AI-powered decomposition of complex date expressions
- Preview dialog with parsed dates for validation
- Batch date addition from a single text input

### 2.9 Event Description Character Limit Discrepancy

- Web create form: max 1000 characters
- Web edit form: max 2000 characters
- Mobile edit form: max 2000 characters
- Mobile create form: No visible max (inconsistency)

### 2.10 Add-ons Step in Create Event Wizard — MISSING

- Web has a 5th step in the create wizard for configuring add-ons
- Mobile wizard has only 4 steps (Info → Date Type → Date → Review) with no add-on step

---

## 3. Post & Discussion System

### 3.1 Rich Text Editor (BlockNote) — MISSING

- Web uses BlockNote for rich text post creation/editing
- Supports bold, italic, lists, headings, and other formatting
- Mobile uses a plain text input only

### 3.2 @Mention Support — MISSING

- Web supports @mentioning event members in posts and replies
- Autocomplete dropdown showing member names
- Mentioned users receive `USER_MENTIONED` notifications
- Mention highlighting in rendered content
- Mobile has no mention capability

### 3.3 Post Editing — MISSING

- Web allows editing existing posts (title and content)
- Shows "edited" indicator on modified posts
- Unsaved changes warning dialog
- Mobile can only create and delete posts, not edit them

### 3.4 Spoiler Toggle on Attachments — MISSING

- Web allows marking attachments as spoilers
- Spoiler attachments are blurred until clicked
- Mobile attachments have no spoiler support

### 3.5 Alt Text on Attachments — MISSING

- Web supports adding alt text to image/video attachments for accessibility
- Mobile does not support alt text on attachments

### 3.6 Drag-and-Drop File Upload — MISSING (N/A)

- Web supports drag-and-drop file attachments in the editor
- This is inherently a web pattern, but the mobile equivalent (share sheet integration) doesn't exist either

### 3.7 Post Muting — MISSING

- Web has MutedPostsProvider for hiding muted posts
- Ability to mute individual posts
- Mobile has no post muting functionality

### 3.8 "Edited" Indicator on Posts — MISSING

- Web shows an "(edited)" badge next to timestamp for modified posts
- Mobile does not display this indicator (and can't edit posts anyway)

### 3.9 Reply Section Auto-Scroll & "Jump to Present" — MISSING

- Web has smart auto-scroll: auto-scrolls when user is at bottom, shows "Jump to Present" badge with new message count when scrolled up
- Intersection observer for visibility detection
- Mobile reply list is a basic flat list with no scroll intelligence

### 3.10 Up-Arrow to Edit Last Reply — MISSING

- Web supports pressing up arrow in empty reply input to edit your last reply
- Mobile has no reply editing at all

### 3.11 Post Sticky Header — MISSING

- Web has a sticky header on the post detail page that stays visible while scrolling replies
- Mobile has no sticky header behavior

### 3.12 Reply Editing — MISSING

- Web allows editing existing replies inline
- Mobile can only create and delete replies

---

## 4. Real-Time & Presence Features

### 4.1 Online/Offline Presence — MISSING

- Web tracks app-level presence (who's online)
- Green dot indicator on user avatars
- "Online", "Active now", or "Last seen X time ago" status text
- Heartbeat-based tracking with idle detection
- Local status computation (no polling)
- Mobile has no presence tracking whatsoever

### 4.2 Room-Level Presence (Who's Viewing) — MISSING

- Web tracks who's currently viewing a specific post thread
- Used for typing indicators and presence awareness
- Mobile has no room-level presence

### 4.3 Typing Indicators — MISSING

- Web shows Discord-style typing indicators in post threads
- Animated dots with stacked avatars (up to 3)
- Dynamic text: "Alice is typing", "Alice and Bob are typing", "Several people are typing"
- 300ms debounced, auto-clears on unmount and submit
- Mobile has no typing indicators

### 4.4 User Status (Online/Idle/DND/Invisible) — MISSING

- Web allows setting custom status: Online, Idle, Do Not Disturb, Invisible
- Duration-based status expiration (15 min, 1 hour, 4 hours, today, custom)
- Real-time countdown display
- Visible in profile dropdown, mobile nav, and member lists
- Mobile has no user status system

### 4.5 Tab Visibility & Idle Tracking — MISSING

- Web's VisibilityProvider pauses presence when tab is hidden or user is idle (5+ minutes)
- Reduces unnecessary backend heartbeats
- Mobile has no equivalent (though app backgrounding could serve similar purpose)

---

## 5. Invite System

### 5.1 Email Invitations — MISSING

- Web has a full email invitation system with:
  - Manual add (name, email, +1s)
  - Bulk add via comma/semicolon/newline separated emails
  - CSV file upload with drag-and-drop
  - CSV template download
  - Custom message field (max 480 chars)
  - Sent/pending/failed status tracking
  - Deduplication logic
- Mobile has no email invitation capability

### 5.2 Username-Based Invitations — MISSING

- Web allows inviting users by searching their username
  - Role selection for the invite (Moderator/Attendee)
  - Pending invite status tracking
  - Cancel pending invite
- Mobile has friend-based invites only (no username search for invites)

### 5.3 Invite Link QR Code — MISSING

- Web generates QR codes for invite links in the invite details dialog
- Mobile does not display QR codes

### 5.4 Invite Link Naming — MISSING

- Web allows giving invite links custom names/nicknames
- Mobile creates links without names

### 5.5 Invite Link Expiration Configuration — MISSING

- Web offers configurable expiration: 30 min, 1 hour, 6 hours, 12 hours, 1 day, 7 days, Never
- Mobile creates links without expiration configuration

### 5.6 Invite Link Max Uses — MISSING

- Web allows setting maximum use count for invite links
- Mobile creates links without use limits

### 5.7 Invite Usage Statistics — PARTIAL

- **Web shows**: Uses remaining, max uses, creation date, time until expiration
- **Mobile shows**: Usage counter (if max uses set), but limited detail

### 5.8 Batch Invite Deletion — MISSING

- Web allows selecting multiple invites via checkboxes and deleting them in batch
- Mobile only supports individual invite deletion

### 5.9 Unified Invite Dialog (Three-Tab Interface) — MISSING

- Web has a tabbed dialog (Link, Email, Username) for all invite methods
- Mobile has a simpler screen with link creation and friend-based invites

### 5.10 Invite to Event from Profile — MISSING

- Web has an "Invite to Event" button on profile views
- Shows popover with list of events the user can be invited to
- Quick invite per event with success checkmark
- Mobile profile view has no "invite to event" action

---

## 6. Social & Friends Features

### 6.1 Mutual Friends Display — MISSING

- Web shows mutual friends on profile views (count + avatar list)
- Clickable mutual friends to view their profiles
- Mobile profile view does not show mutual friends

### 6.2 Mutual Events Display — MISSING

- Web shows mutual events on profile views (count + event list)
- Each event shows title, location, date
- Clickable to navigate to event
- Dedicated MutualEventsDialog component
- Mobile profile view does not show mutual events

### 6.3 Mutual Info on Friend Requests — PARTIAL

- **Web shows**: Mutual friends avatars (overlapping, max 3), mutual events count, both clickable
- **Mobile shows**: Mutual event count text only (e.g., "2 mutual events") on requests tab

### 6.4 Friend Suggestions ("People from Your Events") — MISSING

- Web shows non-friend users from shared events as suggestions
- Appears in the Add tab of Friends dialog when not searching
- Shows mutual count and event count
- Mobile has search-only friend discovery

### 6.5 Outgoing Friend Requests Management — MISSING

- Web shows outgoing (sent) friend requests with cancel button in Requests tab
- Mobile Requests tab shows incoming requests only, no outgoing

### 6.6 Remove Friend from Profile — MISSING

- Web allows removing friends directly from the profile view dialog (via More menu)
- Mobile profile view shows "Friends" as disabled button but no removal action

### 6.7 Block User from Profile — MISSING

- Web allows blocking users directly from the profile view dialog
- Explanation of what blocking does
- Mobile has no blocking UI

### 6.8 Friend Request Button Variants — PARTIAL

- **Web has**: `default`, `sm`, `icon` variants with dropdown actions (e.g., cancel sent request)
- **Mobile has**: Single button variant with basic states (add, pending, friends)
- Mobile "Request Sent" state is just disabled — no option to cancel the request

---

## 7. Notifications

### 7.1 Individual Notification Actions — MISSING

- Web has per-notification action menu:
  - Mark as read / Mark as unread
  - Delete individual notification
- Mobile only has "Mark all as read" bulk action

### 7.2 Delete All Notifications — MISSING

- Web has "Delete all notifications" with confirmation dialog
- Mobile has no delete functionality for notifications

### 7.3 Notification Filtering (All/Unread Tabs) — MISSING

- Web has tab filtering between All and Unread notifications
- Mobile shows all notifications in a single list (unread highlighted but not filterable)

### 7.4 Smart Navigation from Notifications — PARTIAL

- **Web**: Friend request notifications open Friends dialog to specific tab
- **Mobile**: Friend request notifications navigate to `/friends` page (correct, but less precise — doesn't open to requests tab)

### 7.5 Notification Close State Memory — MISSING

- Web uses `notification-close-store` (Zustand) to remember collapsed state
- Mobile has no equivalent state persistence

### 7.6 Add-on Config Reset Notification Handling — MISSING

- Web handles `ADDON_CONFIG_RESET` notification type
- Mobile has the notification type in its mapping but no add-on system to accompany it

---

## 8. Event Discovery & Lists

### 8.1 Discover Tab — MISSING

- Web has a "Discover" tab showing public/friends-visible events
- Browse and join events without invitation
- Mobile has no event discovery feature

### 8.2 Event Invites Tab — MISSING

- Web has an "Invited" tab showing pending event invitations
- Accept/decline invites from the events list page
- Mobile has no tab for pending event invitations on the events list

### 8.3 Attended Tab — MISSING

- Web has an "Attended" tab showing past events
- Separate section from upcoming events
- Mobile shows all events in a single list with no past/upcoming separation

### 8.4 Event Filtering & Sorting — MISSING

- Web has filter controls: All events vs Owned by me
- Web has sort options: By title, created date, event date, last activity
- Collapsible past events section
- Mobile has no filtering or sorting controls

### 8.5 Visual Event Cards — PARTIAL

- **Web has**: Cover image with focal point, hosting badge, muted indicator, description preview, visibility indicator, organizer avatar, context menu with actions (mute, edit, change date, delete, report, leave)
- **Mobile has**: Title, organizer name, date, location, member count, RSVP dot, organizer badge — no cover image, no description preview, no context menu actions

### 8.6 Event Count Tabs with Badges — MISSING

- Web shows event counts on each tab (Upcoming: 5, Attended: 3, Invited: 2)
- Mobile shows total event count in welcome header only

### 8.7 Create Event Card in Grid — MISSING

- Web shows a "+" card in the event grid as a visual prompt to create events
- Mobile uses a floating action button (FAB) instead

---

## 9. Member & Role Management

### 9.1 Promote Member (Attendee → Moderator) — MISSING

- Web allows organizers to promote attendees to moderator role
- Confirmation dialog
- Mobile shows roles but has no promote action

### 9.2 Demote Member (Moderator → Attendee) — MISSING

- Web allows organizers to demote moderators back to attendee
- Confirmation dialog
- Mobile shows roles but has no demote action

### 9.3 Kick/Remove Member — MISSING

- Web allows organizers and moderators to remove members
- Confirmation dialog with role-specific messaging
- Mobile attendees page shows members but has no removal action

### 9.4 Ban Member — MISSING

- Web has member banning capability via `use-ban-member` hook
- Banned users cannot rejoin
- Mobile has no banning functionality

### 9.5 Attendee RSVP & Availability Detail in Member List — MISSING

- Web's attendee slate shows:
  - RSVP status with optional note (when date is set)
  - Expandable availability responses per date option (when no date set)
- Mobile attendees page shows RSVP status icon only (no notes, no availability detail)

### 9.6 Member Search in Attendees Page — MISSING

- Web has searchable attendee list
- Mobile has no search functionality on attendees page

---

## 10. Settings

### 10.1 Privacy Settings — MISSING

- Entire privacy settings page is absent from mobile
- **Friend Request Controls**: Who can send friend requests (Everyone / Event Members / No One)
- **Event Invite Controls**: Who can invite you to events (Everyone / Event Members / Friends / No One)
- **Blocked Users Management**: List, unblock users

### 10.2 Notification Settings — PARTIAL (Significantly Reduced)

- **Web has**:
  - Multiple notification methods (email, webhook, push)
  - Add/remove notification methods
  - Per-method configuration (webhook URL, format, custom template, headers)
  - 13 notification type categories with per-type checkboxes
  - Expandable/collapsible method cards
  - Enable/disable toggle per method
  - Custom naming for methods
  - Webhook formats: JSON, Discord, Slack, Teams, Custom
  - Template variables for custom formats
- **Mobile has**: Two simple toggles (push notifications, email notifications)

### 10.3 Custom Add-ons Settings — MISSING

- Web has a custom add-ons page under settings (experimental)
- Template library management
- Mobile has no equivalent

### 10.4 Delete Account Confirmation Depth — SAME (Both Have It)

Both web and mobile have delete account with confirmation dialog.

---

## 11. Profile

### 11.1 Profile Edit — PARTIAL

- **Web has**: Avatar upload with image cropping modal (canvas-based), display name, pronouns, bio (500 char limit), character counter
- **Mobile has**: Avatar change via image picker, display name, pronouns, bio (200 char limit), no cropping modal

### 11.2 Bio Character Limit Discrepancy

- Web: 500 character limit with counter
- Mobile: 200 character limit
- Onboarding (mobile): 200 character limit

### 11.3 Profile View — PARTIAL

- **Web has**: Online status indicator, pronouns, bio, mutual friends tab, mutual events tab, friend actions (add/accept/remove), invite to event, more menu (report, block, remove friend)
- **Mobile has**: Avatar, name, username, pronouns, bio, basic friend action button (add/pending/friends)

### 11.4 Avatar Image Cropping — MISSING

- Web has a full image crop modal with canvas for precise cropping
- Mobile uses the image picker's built-in editing (less precise)

---

## 12. Authentication & Onboarding

### 12.1 Google One Tap — MISSING

- Web has automatic Google authentication prompt on unauthenticated pages
- Session-aware redirect to onboarding or home
- Mobile relies on standard OAuth button press only

### 12.2 Email Verification Page — MISSING

- Web has a dedicated `/verify-email` page with token-based verification
- Shows success/error/expired states
- Mobile has no email verification page

### 12.3 Onboarding Bio Character Limit Discrepancy

- Web onboarding: Uses same profile edit fields (500 char bio)
- Mobile onboarding: 200 character bio limit

### 12.4 Account Switching — MISSING

- Web has multi-session account switcher
- Collapsible menu showing other accounts with avatars
- "Add another account" flow
- Session removal option
- Mobile has no account switching

---

## 13. Admin Panel

The entire admin panel is **completely absent** from the mobile app.

### 13.1 Admin Dashboard — MISSING

- Overview statistics (total users, events, posts, replies, pending reports)
- Quick action cards

### 13.2 User Management — MISSING

- `/admin/users` page for managing all users

### 13.3 Report Review — MISSING

- `/admin/reports` page for reviewing user reports

### 13.4 Data Explorer — MISSING

- `/admin/explorer` page with:
  - Breadcrumb navigation
  - Entity tables with sorting
  - Entity detail panels
  - Relation links between entities
  - Tab-based entity exploration

### 13.5 Query Builder — MISSING

- `/admin/query-builder` page with:
  - Entity picker
  - Filter groups
  - Sort configuration
  - Query preview
  - Results panel
  - Preset manager for saving queries

---

## 14. Navigation & Layout

### 14.1 Navigation Guard (Unsaved Changes) — MISSING

- Web warns when navigating away from pages with unsaved form changes
- Global navigation guard wrapper
- Confirmation dialog before leaving
- Mobile has no unsaved changes protection

### 14.2 Desktop Context Menu on Event Cards — MISSING

- Web supports right-click context menu on event cards with actions
- Mobile has no long-press context menu on event cards

### 14.3 Admin Link in Navigation — MISSING

- Web shows admin link for admin users in navigation
- Mobile has no admin navigation

### 14.4 Skeleton Loading Variety — PARTIAL

- Web has 18+ specific skeleton components for different contexts
- Mobile has 2 skeletons (event list, event detail)
- Missing skeletons: account settings, availability form, calendar, change date, invite details, member list, new event form, notification, post card, post detail, reply, settings form, user profile

---

## 15. Theming & Appearance

### 15.1 Custom Theme Creation — MISSING

- Web allows creating fully custom themes with:
  - Custom name and description
  - Color customization (brand, background, text, status colors)
  - Color picker with hex input
  - Contrast validation (warns if below 3:1 ratio)
  - Reset overrides
  - Edit and delete custom themes
- Mobile only has theme selection from predefined themes

### 15.2 System Theme Matching (Light/Dark Mapping) — MISSING

- Web has "Match System" mode where you assign different themes for light and dark system preferences
- Two expandable cards for mapping system light → theme and system dark → theme
- Mobile has theme selection but no system-matching configuration

### 15.3 Theme Sync from Backend — MISSING

- Web persists theme preferences to Convex and syncs across devices via `ThemeSync` component
- Custom theme CSS variables generated from overrides
- Mobile theme selection is device-local only

---

## 16. Reporting & Moderation

### 16.1 Report User — MISSING

- Web has report functionality accessible from profile view
- 6 report reason categories: Spam, Harassment, Hate Speech, Inappropriate Content, Impersonation, Other
- Optional details textarea (max 1000 chars)
- Duplicate report prevention
- Mobile has no reporting capability

### 16.2 Report Event — MISSING

- Web allows reporting events from the event header menu (non-organizer action)
- Mobile has no event reporting

---

## 17. Changelog

### 17.1 In-App Changelog — MISSING

- Web has `/changelog` page showing version history
- Generated from changeset entries
- Categorized changes (added, changed, fixed, etc.)
- Semantic versioning display
- Mobile has no changelog page

---

## 18. PWA Features

### 18.1 Service Worker Registration — N/A (Different Platform)

- Web registers service worker for offline support and install-to-home-screen
- Mobile is a native app — this is inherently different
- However, the mobile app may lack equivalent offline caching strategies

### 18.2 Web App Manifest — N/A (Different Platform)

- Web generates PWA manifest for installability
- Mobile has `app.config.ts` for native app metadata

---

## 19. Component Architecture Gaps

### 19.1 Empty Placeholder Directories

The mobile app has 6 component directories that are created but completely empty, indicating planned-but-unbuilt feature areas:

| Directory                       | Intended Purpose                |
| ------------------------------- | ------------------------------- |
| `src/components/availability/`  | Availability polling components |
| `src/components/friends/`       | Friend-specific components      |
| `src/components/invites/`       | Invite management components    |
| `src/components/notifications/` | Notification display components |
| `src/components/onboarding/`    | Onboarding flow components      |
| `src/components/profile/`       | Profile view/edit components    |

### 19.2 Hooks Gap

- Web has 50+ custom hooks across convex queries, mutations, and UI concerns
- Mobile has 5 hooks total (`use-auth`, `use-events`, `use-file-upload`, `use-image-picker`, `use-posts`)
- Missing hook categories: addons, availability, friends, invites, muting, notifications, presence, replies (dedicated), settings, users, visibility-aware queries, navigation guards, smart loading, cache invalidation

### 19.3 State Management Gap

- Web uses 4 Zustand stores for UI state (filter/sort, friends dialog, invite dialog, notification close)
- Mobile has 0 state stores — relies entirely on local component state and context

### 19.4 Utility/Lib Gap

- Web has 28+ lib files covering: date parsing, error utilities, event permissions, export utilities, CSV parsing, notification utilities, URL utilities, field editors, condition evaluators, custom addon schemas, validation
- Mobile has 4 lib files: auth client, convex client, platform setup, utils

### 19.5 Template Components — PARTIAL

- Web has 5 page templates: DetailPage, ErrorPage, FormPage, ListPage, SettingsPage
- Mobile has no template components (each page builds its own layout)

### 19.6 Molecule Components — PARTIAL

- Web has 20+ molecule components (reusable combinations of atoms)
- Mobile has no molecule-level components

---

## 20. Minor Quality-of-Life Gaps

### 20.1 Animated Layout Transitions (Framer Motion) — MISSING

- Web uses Framer Motion for staggered list animations, layout transitions, and smooth reordering
- Mobile has basic Reanimated animations for step transitions but no list-level motion

### 20.2 Optimistic Updates — PARTIAL

- Web extensively uses optimistic updates for instant UI feedback on mutations (invites, RSVP, muting, etc.)
- Mobile uses optimistic updates in fewer places

### 20.3 "99+" Badge Capping — MISSING

- Web caps notification/badge counts at "99+" for display
- Mobile shows raw count numbers

### 20.4 Hover Tooltips on Member Icons — MISSING

- Web shows tooltip with member name on avatar hover
- Mobile has no hover equivalent (could use long-press)

### 20.5 Date Formatting Consistency — PARTIAL

- Web has comprehensive date formatting: same-day ranges, multi-day events, end times, relative timestamps
- Mobile has basic date formatting but may lack edge case handling

### 20.6 Error Page Templates — MISSING

- Web has dedicated error pages (`error.tsx`, `global-error.tsx`) with branded error displays
- Mobile has no error boundary UI components

### 20.7 Loading Spinner Component — MISSING

- Web has a dedicated `loading-spinner.tsx` component
- Mobile uses ActivityIndicator directly

### 20.8 Sticker/Mascot UI Elements — MISSING

- Web uses `LogoSticker` and `StickerIcon` components with bouncy animations
- Mobile has `LogoSticker` atom but doesn't use sticker icons in the same way

### 20.9 Image Lightbox — MISSING

- Web has clickable cover images that open in a lightbox zoom view
- Mobile shows images inline with no zoom/lightbox

### 20.10 Keyboard Shortcuts — MISSING

- Web supports keyboard shortcuts (up-arrow to edit last reply, etc.)
- Mobile has no keyboard shortcut equivalents

### 20.11 Attachment Edit Dialog — MISSING

- Web has an attachment edit dialog for modifying attachment metadata (alt text, spoiler)
- Mobile has no attachment editing post-upload

### 20.12 Test Coverage Parity

- Web has 40+ test files covering hooks, components, and utilities
- Mobile has 2 test files (1 component test, 1 platform test)
- Significant testing gap for mobile features

### 20.13 Event Card Context Actions — MISSING

- Web event cards have an action menu with: Mute, Edit, Change Date, Delete, Report, Leave
- Mobile event cards are tap-only with no context actions

### 20.14 Collapsible Past Events — MISSING

- Web collapses past events in the event list with an expandable section
- Mobile shows all events in a single flat list

### 20.15 Invite Accept Flow Polish — PARTIAL

- **Web has**: Event details display (title, description, location, date/time), organizer info, already-member detection with redirect
- **Mobile has**: Basic token-based acceptance flow (less detail shown before accepting)

### 20.16 Smart Loading States — MISSING

- Web has `useSmartLoading` hook that prevents loading flash for fast responses
- Mobile shows loading states immediately regardless of speed

### 20.17 Cache Invalidation Hooks — MISSING

- Web has `useCacheInvalidation` hook for strategic cache management
- Mobile has no equivalent

### 20.18 Traced Mutations — MISSING

- Web has `useTracedMutation` hook for debugging/tracing mutation calls
- Mobile has no mutation tracing

### 20.19 Transient Form State — MISSING

- Web has `useTransientForm` hook for forms that don't persist to URL
- Mobile has no equivalent utility

---

## Priority Recommendations

### High Priority (Core Feature Gaps)

1. **Event muting** — Quality of life for active users
2. **Date selection for organizers** — Core event management flow is broken
3. **Availability summary view** — Users can vote but can't see aggregated results
4. **Member role management** (promote/demote/kick) — Event management is incomplete
5. **Post editing** — Basic content management
6. **Event filtering & sorting** — Essential for users with many events
7. **Privacy settings** — User safety controls
8. **Discover tab** — Event discovery
9. **Event invites tab** — Pending invitation management

### Medium Priority (Social & Polish)

10. **Typing indicators** — Real-time social presence
11. **Online/offline presence** — Social engagement
12. **Notification per-item actions** (mark read/unread, delete)
13. **Mutual friends/events on profiles** — Social context
14. **Friend suggestions** — Social growth
15. **Email invitations** — Major invite method
16. **Rich text in posts** — Content quality
17. **@Mentions** — Communication quality
18. **Reporting** — Safety feature
19. **Outgoing friend request management** — Cancel sent requests

### Lower Priority (Advanced Features)

20. **Add-on system** — Entire plugin framework
21. **Admin panel** — Administrative tools
22. **Custom themes** — Personalization
23. **Account switching** — Multi-account support
24. **Add-on builder** — Power user feature
25. **Changelog** — Transparency feature
26. **Smart date input** — Convenience feature
27. **Navigation guards** — UX polish
