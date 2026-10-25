# Discussion and media

`posts list <event-id>` and `replies list <post-id>` default to 20 records and
return `items` / `nextCursor`. Use `--limit`, `--cursor`, or explicit `--all`.
`posts get <id>` / `replies get <id>` return original stored rich content plus
attachment metadata. JSON preserves the HTML; human output projects readable text.

Create with `posts create <event-id> --title "Notes" --content "Hello"`, or
`replies create <post-id> --file reply.md --content-format markdown`. Choose one
of `--content`, `--file`, or `--stdin`; formats are `text` (default), `markdown`,
and explicit advanced `html`. Content stdin and `--api-key-stdin` are mutually
exclusive. Use a profile-bound environment key or a content file instead.

Edit with `posts edit <id> --title "New title"` to preserve the body unchanged.
To edit rich content, save the `content`/`text` JSON field to a UTF-8 file, retain
its supported markup and mention IDs, and pass `--file <path> --content-format html`.
Text/Markdown replacement is deliberate replacement; do not feed the human display
back as an edit. Unsupported HTML attributes/elements fail with a corrective path
instead of silently stripping formatting. Scripts, handlers, external embedded
content and unsafe links are rejected. Current app formatting, tables and inert
checklist checkboxes are supported. Mentions must be actual accessible event members;
blocked people cannot be mentioned. Notifications use the same structural parser.

Visible limits are title 100, post 3,000 and reply 5,000 Unicode characters, with a
separate 64 KiB rich-content payload cap. Unchanged legacy oversized content survives
unrelated edits; oversized edits must strictly shrink until within the normal limit.
Nothing is automatically truncated. Shared validation is used by app and REST writes.

Use `--attach <path...>` on create/edit. At most ten attachments may belong to one
post/reply, each at most 10 MiB, with the app's supported MIME types. All local files
upload before one parent transaction, so invalid metadata, ownership, count or content
rolls back the parent and attachment claims together. Attachment-only content is allowed;
removing its final attachment requires adding visible text in the same edit.
`posts attachments list <id>` and `replies attachments list <id>` expose accessible
parent attachments. Removal uses `attachments remove <id> <attachment-id> --yes` or
`edit <id> --remove-attachment <attachment-id> --yes`.

Deletes and attachment removal require target confirmation; JSON/headless callers
must supply `--yes`. Discussion writes are not replay-safe and are never automatically
retried. On `UNCERTAIN_OUTCOME`, inspect the parent/list before deciding whether to
repeat. Uploads belong to the authenticated uploader and purpose and can be claimed
once. Failed/cancelled operations attempt cleanup of known unclaimed uploads; committed
claims cannot be deleted by cleanup even when a response was lost. Unclaimed uploads
expire after 24 hours, including uploads whose responses were lost. No parent write is
sent after a failed upload. App upload tickets are one-use and expire after ten minutes.

Implementation and automated evidence do not establish live installed staging or
release completion. These remain explicit beta/release verification tasks.
