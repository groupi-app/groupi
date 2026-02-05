---
'@groupi/web': patch
---

fix(web): improve loading states and reduce UI flashes

- Fix friend request loading state: clicking "Add" on multiple users no longer interferes with each other's loading spinners
- Fix home page redirect: show loading spinner while auth state is determined, preventing marketing page flash for logged-in users
- Fix theme persistence: save system-detected theme to localStorage so theme flash only happens once for new users
