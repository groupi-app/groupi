---
'@groupi/web': minor
'@groupi/convex': minor
---

Improve frontend performance and optimize Convex queries and mutations

Landing page now renders instantly without waiting for auth, reducing LCP from 6.2s to ~2.1s. Replaced framer-motion with CSS animations, deferred Sentry Replay and Google One Tap loading. Fixed full table scans in person lookups, merged duplicate page-load queries, batched notification fan-out, eliminated double auth calls in mutations, and added compound indexes for notification and membership queries. Upgraded Convex to 1.43.0.
