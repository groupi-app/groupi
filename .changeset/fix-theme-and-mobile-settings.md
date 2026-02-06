---
'@groupi/web': patch
---

fix(web): respect system theme preference and hide settings sidebar on mobile

- Fix theme defaulting to light instead of respecting system preference on initial load
- Add effect to sync system preference after SSR hydration
- Hide settings sidebar on mobile for all settings pages, not just root
