---
'@groupi/web': patch
---

Fix sign-in page to redirect authenticated users and show loading state

Redirect authenticated users away from the sign-in page instead of showing the sign-in form. Also redirect unauthenticated users away from add-account mode and show a loading spinner during auth state determination to prevent form flash.
