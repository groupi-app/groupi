# Participate in existing add-ons

Requires a server advertising `addonParticipation.version: 1`. Use `addons get
EVENT TYPE` to inspect enabled configuration and IDs. All submissions act as the
selected profile's authenticated participant, including when that person is an
organizer or moderator. There is no impersonation option.

| App action                  | CLI equivalent                                                                    | Data                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Bring-list claims           | `addons claim EVENT bring-list --data '{"cups":2}'`                               | Complete replacement of your item-ID/quantity map; positive integer quantities within remaining availability   |
| Questionnaire submit/update | `addons respond EVENT questionnaire --data-file answers.json`                     | Question-ID/answer object; answers obey required fields and configured types/options                           |
| Reminder preference         | `addons opt-out EVENT reminders` / `addons opt-in EVENT reminders`                | Explicit desired state; repeated calls preserve that state                                                     |
| Custom form                 | `addons respond EVENT custom:TEMPLATE --data-file answers.json`                   | Visible form field-ID/value object, validated against the installed definition                                 |
| Custom vote                 | `addons vote EVENT custom:TEMPLATE --field poll --data '{"options":["Pizza"]}'`   | Replace your selection; use an empty array to withdraw                                                         |
| Custom list items           | `addons claim EVENT custom:TEMPLATE --data '{"cups":1}'`                          | Complete replacement of your claims across the template's list fields                                          |
| Custom toggle               | `addons toggle EVENT custom:TEMPLATE --field enabled --data '{"enabled":false}'`  | Explicit desired state                                                                                         |
| Custom action button        | `addons execute EVENT custom:TEMPLATE --field button --yes`                       | Execute the actions already configured by the organizer; no arbitrary action JSON                              |
| Clear own response/claims   | `addons clear-response EVENT TYPE --yes` / `addons clear-claims EVENT TYPE --yes` | Delete only your own entry; repeated clearing succeeds                                                         |
| Inspect results             | `addons data EVENT TYPE --limit 20`                                               | Cursor-paginated app-visible participant data and your reminder opt-out state; supports `--cursor` and `--all` |

Discord has no separate participant submission or opt-out in the apps. Its
organizer actions remain `discord guilds refresh/list` and `addons enable`,
`configure`, and `disable`; event/date lifecycle drives Discord synchronization.
Custom definition authoring remains separate from participation.

`--data` and `--data-file` are mutually exclusive; JSON files are capped at 64 KiB.
Use `--format json` for machine output. Read the installed template before using
custom actions: submissions, votes, claims and toggles can run configured
notifications, webhooks, or event changes. Action buttons and clear commands
require confirmation (`--yes` in headless/JSON use).

Mutations are never automatically retried. After an uncertain outcome inspect
`addons data`, `addons get`, and any configured side effect (for example event
content or notifications) before deliberately resubmitting. Repeating a
submission updates one identity-bound record but can run its automations again.
Reminders use explicit state instead of a non-idempotent toggle.

Local evidence: `convex/tests/addon-participation-rest.test.ts` runs the real CLI
against authenticated REST handlers and an in-memory Convex database, covering
built-ins and an existing published custom template. It does not establish a
live hosted deployment, actual Discord delivery, or external webhook delivery.
