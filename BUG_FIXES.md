# Bug Fixes Documentation

This document details all identified bugs, their fixes, and current status.

## Summary

| Status       | Count | Bugs                                                 |
| ------------ | ----- | ---------------------------------------------------- |
| ✅ Fixed     | 24    | See completed section below                          |
| ✅ Not a Bug | 1     | Natural language picker (already works in edit mode) |
| ⏳ Not Fixed | 2     | Presence status, smart date parsing                  |

---

## ✅ Completed Fixes

### Profile/Settings

1. **Profile Details Only Show in Edit Fields from Certain Pages** ✅
   - File: `packages/web/components/profile-edit-dialog.tsx`
   - Fix: Added tracking ref to detect when profile data has been populated, only reset form after data loads

2. **Settings Page Mobile Layout Issues** ✅
   - Files: `packages/web/app/(settings)/settings/page.tsx`, `layout.tsx`, `components/settings-nav.tsx`
   - Fix: Mobile now shows category selection page, added back button, proper navigation flow

3. **Profile Circle Doesn't Show Pointer Cursor** ✅
   - Files: `packages/web/components/member-icon.tsx`, `profile-dropdown.tsx`
   - Fix: Added `cursor-pointer` class to interactive elements

4. **Notification Ellipsis Menus Z-Index Issue** ✅
   - File: `packages/web/components/ui/action-menu-button.tsx`
   - Fix: Added `z-modal` class to DropdownMenuContent

### Events - General

5. **Address Autocomplete Not Showing** ✅
   - File: `packages/web/components/ui/command.tsx`
   - Fix: Added `z-popover` class to CommandList

6. **Image Position Modal Goes Offscreen** ✅
   - File: `packages/web/components/image-focal-point-picker.tsx`
   - Fix: Changed to viewport-relative sizing (`max-h-[90vh]`, `max-h-[50vh]`), added scrolling

7. **Event Details Edit Page Needs More Padding** ✅
   - File: `packages/web/components/templates/form-page-template.tsx`
   - Fix: Changed `pb-8` to `pb-24`

8. **Invite Page Should Redirect Existing Members** ✅
   - File: `packages/web/app/(event)/event/[eventId]/invite/page.tsx`
   - Fix: Added useEffect to redirect non-moderator members to event page

### Events - Dates

9. **AM/PM Cut Off in Date Poll Options** ✅
   - File: `packages/web/components/molecules/editable-date-time-item.tsx`
   - Fix: Changed input width from `w-[100px]` to `w-[130px]`

10. **Users Can Select Past Dates** ✅
    - Files: `single-date-time-selector.tsx`, `multi-date-time-selector.tsx`
    - Fix: Added `disabled={{ before: new Date() }}` to Calendar components

11. **Date Sorting Doesn't Work** ✅
    - File: `packages/web/components/molecules/editable-date-time-item.tsx`
    - Fix: Refactored to use "controlled when focused, derived when not" pattern for proper state sync

12. **Date Picker Opens to Current Date Instead of Selected Date** ✅
    - File: `packages/web/components/molecules/editable-date-time-item.tsx`
    - Fix: Added `defaultMonth={option.start}` and `defaultMonth={option.end}` to calendars

### Events - Posts/Replies

13. **Post and Reply Text Too Dark in Dark Themes** ✅
    - Files: `post-card-content.tsx`, `full-post.tsx`
    - Fix: Added `dark:prose-invert` class to prose containers

14. **Can't Delete Replies** ✅
    - File: `packages/web/app/(event)/event/[eventId]/post/[postId]/components/reply.tsx`
    - Fix: Refactored DropdownMenu to be self-contained, changed delete to use direct onClick

15. **Files Don't Show When Editing Posts** ✅
    - Files: `post-edit-wrapper.tsx`, `editor.tsx`
    - Fix: Added `existingAttachments` prop, display and delete capability for existing attachments

16. **Clicking Outside Image Modal Should Close It** ✅
    - File: `packages/web/components/ui/dialog.tsx`
    - Fix: Added overlay click handling with `preventOverlayClose` prop for controlled behavior

### Events - Other Users

17. **Can't Search Attendees by Username** ✅
    - File: `packages/web/app/(event)/event/[eventId]/attendees/components/attendees.tsx`
    - Fix: Added username to search filter logic

### My Events

18. **Event Sorting Doesn't Work** ✅
    - File: `packages/web/app/(myEvents)/events/components/event-grid.tsx`
    - Fix: Removed hardcoded sorting that was overriding page-level sorting

### Themes

19. **Custom Theme Thumbnail Colors Inconsistent** ✅
    - Files: `theme-card.tsx`, `appearance/page.tsx`
    - Fix: Added smart fallback chain using base theme colors and token hierarchy

20. **Can't Type Hex Code in Theme Editor** ✅
    - File: `packages/web/app/(settings)/settings/appearance/components/color-picker.tsx`
    - Fix: Added local state for typing, blur handling to reset invalid values

21. **Theme Editor Not Usable on Mobile** ✅
    - File: `packages/web/app/(settings)/settings/appearance/components/theme-editor-dialog.tsx`
    - Fix: Increased drawer height to 80vh, fixed popover portaling, improved layout

22. **Can Create Theme Where Everything is Same Color** ✅
    - File: `packages/web/app/(settings)/settings/appearance/components/theme-editor-dialog.tsx`
    - Fix: Added WCAG contrast validation with warning toast before save

### General

23. **Skeleton Loaders Flash on Tab Switch** ✅
    - Files: `packages/web/context/global-user-context.tsx`, `packages/web/hooks/convex/use-events.ts`
    - Fix: Implemented visibility-aware query caching pattern, cache data when tab is hidden

24. **Custom Theme Flashes Base Theme on Page Load** ✅
    - Files: `packages/web/components/theme-sync.tsx`, `packages/web/providers/theme-provider.tsx`, `packages/web/app/layout.tsx`
    - Fix: Multiple fixes applied:
      1. ThemeSync now waits for `customThemes` query to load before applying anything when user has custom theme selected (prevents premature fallback to base theme)
      2. Changed CSS selector from `.theme-custom-{id}` to `html.theme-custom-{id}` for higher specificity (0,1,1 vs 0,1,0)
      3. Added `data-custom-theme` attribute management for CSS overrides
      4. Enhanced preload script and ThemeProvider with comprehensive debug logging

---

## ⏳ Not Yet Fixed

### 1. No Way to Opt Out of Online Status

**Status:** Requires significant feature work

**Files that need changes:**

- `convex/schema.ts` - Add `presenceStatus` field to persons table
- `convex/persons/mutations.ts` - Add mutation to update status
- `packages/web/hooks/convex/use-presence.ts` - Respect status setting
- `packages/web/app/(settings)/settings/` - Add UI for status selection

**Required work:**

1. Schema change: Add `presenceStatus: v.optional(v.union(v.literal('ONLINE'), v.literal('AWAY'), v.literal('DO_NOT_DISTURB'), v.literal('INVISIBLE')))`
2. Backend: Add mutation to update presence status
3. Frontend: Add settings UI to select status
4. Presence hooks: Check status before sending heartbeats/showing as online

**Estimated scope:** Medium feature, not a simple bug fix

---

### 2. Smart Date Input Parsing Inconsistency

**Status:** Complex Chrono.js limitation

**File:** `packages/web/lib/date-parser.ts`

**Issue:** The time range regex pattern (lines 114-141) doesn't handle all AM/PM cases correctly. When only end time has meridiem (e.g., "2-5pm"), start time meridiem is inferred inconsistently.

**Potential fixes:**

1. Improve regex to require explicit meridiem on both times
2. Add smarter inference logic based on common usage patterns
3. Consider using a different date parsing library

**Estimated scope:** Requires research into Chrono.js limitations and user testing

---

### 3. Natural Language Date Picker Missing in Edit Mode

**Status:** ✅ Not a bug - Already working

**Files:** `new-event-multi-date.tsx`, `edit-event-multi-date.tsx`

**Finding:** The smart input IS already shown in edit mode (`showSmartInput={true}` on line 105 of `edit-event-multi-date.tsx`). This matches the create page behavior exactly. The original report appears to have been a misunderstanding - the feature works correctly in both create and edit modes

---

## Files Modified

The following files were modified to implement the fixes:

```
packages/web/components/profile-edit-dialog.tsx
packages/web/components/profile-dropdown.tsx
packages/web/components/member-icon.tsx
packages/web/components/ui/action-menu-button.tsx
packages/web/components/ui/command.tsx
packages/web/components/ui/dialog.tsx
packages/web/components/image-focal-point-picker.tsx
packages/web/components/templates/form-page-template.tsx
packages/web/components/templates/settings-page-template.tsx
packages/web/components/post-card-content.tsx
packages/web/components/mobile-nav.tsx
packages/web/components/molecules/editable-date-time-item.tsx
packages/web/components/molecules/single-date-time-selector.tsx
packages/web/components/molecules/multi-date-time-selector.tsx
packages/web/app/(settings)/settings/page.tsx
packages/web/app/(settings)/settings/layout.tsx
packages/web/app/(settings)/settings/appearance/components/color-picker.tsx
packages/web/app/(settings)/settings/appearance/components/theme-card.tsx
packages/web/app/(settings)/settings/appearance/components/theme-editor-dialog.tsx
packages/web/app/(settings)/settings/appearance/page.tsx
packages/web/app/(event)/event/[eventId]/invite/page.tsx
packages/web/app/(event)/event/[eventId]/attendees/components/attendees.tsx
packages/web/app/(event)/event/[eventId]/post/[postId]/components/reply.tsx
packages/web/app/(event)/event/[eventId]/post/[postId]/components/post-edit-wrapper.tsx
packages/web/app/(event)/event/[eventId]/post/[postId]/components/editor.tsx
packages/web/app/(event)/event/[eventId]/post/[postId]/components/full-post.tsx
packages/web/app/(myEvents)/events/components/event-grid.tsx
packages/web/context/global-user-context.tsx
packages/web/hooks/convex/use-events.ts
packages/web/providers/theme-provider.tsx
packages/web/components/theme-sync.tsx
packages/web/app/layout.tsx
```
