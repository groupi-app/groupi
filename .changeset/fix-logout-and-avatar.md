---
'@groupi/web': patch
'@groupi/convex': patch
---

fix(auth): handle logout gracefully without throwing errors

- Fix "Unauthenticated" error when logging out by catching the error in getCurrentUser query
- Fix avatar empty src warning by passing undefined instead of empty string
- Add skeleton loading state for sign-in button during auth loading
- Remove unused demo pages (1, 2, 3, 4)
