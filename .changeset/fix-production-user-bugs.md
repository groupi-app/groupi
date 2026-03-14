---
'@groupi/web': patch
'@groupi/convex': patch
---

Fix 20+ production bugs reported by users

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
