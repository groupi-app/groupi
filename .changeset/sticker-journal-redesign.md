---
'@groupi/web': minor
---

Redesign UI with sticker journal aesthetic

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
