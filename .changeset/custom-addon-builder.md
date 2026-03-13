---
'@groupi/web': minor
'@groupi/convex': minor
---

Add custom addon builder and template system

Users can create custom addons from templates using a visual builder with drag-and-drop field configuration.

**Backend:**

- New `addonTemplates` table for user-created templates with versioning and draft/published states
- Custom addon handler with template validation supporting 13 field types (text, number, select, multiselect, yesno, list_item, vote, toggle, action_button, static_text, dynamic_summary, divider, info_callout)
- IFTTT-style automation engine with declarative trigger → condition → action chains supporting notifications, post creation, webhooks, and data operations
- Section layouts (`form` and `interactive`) with field type restrictions per layout

**Frontend:**

- Visual addon builder at `/addon-builder` with drag-and-drop, preview panel, and YAML editor
- Template picker for event creation wizard and manage addons page
- Custom addon settings page at `/settings/custom-addons`
- Field editors, condition evaluator, and custom addon renderer components
