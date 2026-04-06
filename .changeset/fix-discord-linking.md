---
'@groupi/web': patch
'@groupi/convex': patch
---

Fix Discord account linking in multi-session scenarios

- Add `account.accountLinking` configuration to Better Auth with `trustedProviders` and `allowDifferentEmails`, fixing failures when the Discord email differs from the active account's email
- Fix linked accounts UI not updating after unlinking — added `refetch` to `useLinkedAccounts` hook so the list updates instantly without a page refresh
- Add error handling for OAuth callback failures on the sign-in page (reads `?error=` query params and shows user-friendly messages)
- Add error handling for 4xx responses from the `/api/auth/link-social` endpoint in the linked accounts settings
