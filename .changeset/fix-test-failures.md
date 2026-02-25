---
'@groupi/convex': patch
---

Fix custom addon test failures and suppress convex-test scheduler errors

- Add missing `layout: 'interactive'` to test template fixtures containing `list_item` and `vote` fields
- Add `dangerouslyIgnoreUnhandledErrors` to vitest config to suppress known convex-test scheduler limitation
