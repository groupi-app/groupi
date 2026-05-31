---
'@groupi/web': patch
'@groupi/convex': patch
---

Fix invite page allowing join button press before redirect when user is already an event member. The button is now disabled during the membership check, and the backend gracefully handles duplicate join attempts instead of erroring.
