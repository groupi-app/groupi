---
'@groupi/convex': patch
'@groupi/web': patch
---

Fix presence/status system bugs causing inconsistent idle and lastSeen behavior

- Fix IDLE status persisting after page refresh by syncing status on mount
- Fix lastSeen going stale during continuous activity by removing dependency that reset the update interval
- Fix expired status blocking auto-idle transitions
- Fix manual IDLE being overwritten by auto-idle revert via new statusSource tracking
- Fix autoIdleEnabled=false preventing revert from idle back to online
