# Custom add-on definition authoring

`groupi addons definitions` manages definitions owned by the authenticated
identity. Event organizer/moderator permission does not grant access to another
person's definitions. The server must advertise `addonAuthoring.version: 1` before
any authoring write. Older servers remain usable for their existing commands.

## Portable document

Create a UTF-8 JSON file (at most 64 KiB) such as `meal.json`:

```json
{
  "schemaVersion": 1,
  "name": "Meal choice",
  "description": "Choose a meal",
  "iconName": "listChecks",
  "template": {
    "name": "Meal choice",
    "description": "Choose a meal",
    "iconName": "listChecks",
    "sections": [
      {
        "id": "meal",
        "title": "Meal",
        "layout": "form",
        "fields": [
          {
            "id": "choice",
            "type": "select",
            "label": "Meal",
            "required": true,
            "options": ["Rice", "Pasta"]
          }
        ]
      }
    ]
  }
}
```

The document contains definition metadata and the complete template. It excludes
server IDs, ownership, publication state, timestamps and the saved revision.
`schemaVersion` is the portable format version; it is different from the saved
`version` used to protect writes against concurrent edits. Unknown properties,
duplicate identifiers, unsafe JSON keys and invalid field configurations are
rejected rather than discarded. Import always creates a new draft.

Supported field types are `text`, `number`, `select`, `multiselect`, `yesno`,
`list_item`, `vote`, `toggle`, `action_button`, `static_text`, `dynamic_summary`,
`divider` and `info_callout`. Supported template settings, configurable fields,
visibility conditions and declarative automations are preserved on round-trip.
Allowed actions are `notify_members`, `notify_organizers`, `notify_submitter`,
`create_post`, `update_event_description` and `set_addon_data`. These actions run
through the existing add-on lifecycle when participants use the template.

Webhook actions (`send_webhook`) and their URL/header configuration are explicitly
unsupported for authoring because the existing webhook runtime lacks a safe
outbound network boundary. Existing definitions containing such actions remain
readable/exportable in full, but cannot be imported, replaced or published through
these commands. Existing incomplete web drafts are also readable/exportable;
CLI writes require a complete valid definition. No unsupported content is silently
removed. The REST v2 OpenAPI schema documents the complete supported structure.

## Commands and lifecycle

```sh
groupi addons definitions import --file meal.json --format json
groupi addons definitions list --all --format json
groupi addons definitions get TEMPLATE_ID --format json
groupi addons definitions export TEMPLATE_ID > saved-definition.json
groupi addons definitions edit TEMPLATE_ID --file saved-definition.json --expected-version 1 --yes --format json
groupi addons definitions publish TEMPLATE_ID --expected-version 2 --yes --format json
groupi addons enable EVENT_ID custom:TEMPLATE_ID --template-id TEMPLATE_ID --yes
```

`create` and `import` both accept `--file` or piped `--stdin`. Choose exactly one;
`--stdin` cannot share input with `--api-key-stdin`. `export` always emits portable
JSON to stdout, including in human mode. Shell redirection controls where it is
saved; choose a new output file if you want to preserve an existing one.

Get the current saved `version` immediately before editing or changing lifecycle
state. `edit`, `publish`, `unpublish` and `delete` require `--expected-version` and
confirmation (`--yes` in JSON/headless mode). Conflicting versions fail without
applying changes; inspect/export the current document and deliberately reconcile
it before another write. Ordinary reads accept `--profile` and the usual
credential sources. Lists support `--limit`, `--cursor`, and explicit `--all`.

Every successful edit or publish/unpublish increments the saved version. Editing
a published definition preserves its published state after full validation.
Existing enabled event add-ons contain snapshots: editing, unpublishing or deleting
a definition does not rewrite those event configurations or participant data.
The existing event configuration commands remain subject to event permissions.

```sh
groupi addons definitions unpublish TEMPLATE_ID --expected-version 3 --yes
groupi addons definitions delete TEMPLATE_ID --expected-version 4 --yes
```

Writes are never automatically retried. If a response is lost, use `get` (or
`list --all` after create/import) on the same profile to inspect what happened.
A missing target after an uncertain delete may indicate the deletion succeeded.
Do not blindly re-import a document after an uncertain creation: that could create
a duplicate. A successful HTTP response missing the expected record/version is
also reported as `UNCERTAIN_OUTCOME`.
