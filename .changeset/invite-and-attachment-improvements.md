---
'@groupi/web': minor
---

Invite dialog and attachment editing improvements

- Remove redundant "Save" button from invite dialog — users now just hit Send
- Preserve invite dialog state when switching between Link/Email/Username tabs
- Fix post edit attachments not rendering (wrong destructuring path)
- Unify attachment editing controls: existing attachments now show spoiler toggle, edit alt text/filename, and delete — same as new uploads
- Remove delete icon from reply attachments when not in edit mode
