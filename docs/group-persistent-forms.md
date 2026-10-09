# Persistent Group forms

Groups support multiple independent ongoing forms alongside the single designated
joining questionnaire. Ordinary forms never become admission requirements,
inherit onto Events, change Event add-ons, publish an Event, or send notifications
when created, configured or answered. Polls and lists are separate interactions;
this slice only exposes runnable forms.

The Group owner controls form availability and creation policy. The default is
enabled, with creation limited to the owner and moderators. The owner may permit
any eligible member to create forms. Current eligible managers manage any
ordinary form, regardless of its creator. Creating, reading current definitions,
answering, reading results and managing ordinary content require current live
membership, no Group ban and completion of required Group onboarding. Managers
have no exemption from the onboarding gate. Core owner policy recovery and one's
own saved snapshots/removal are narrow exceptions. Disabling forms blocks their
ordinary use and creation while preserving their configuration and records;
current eligible managers can still configure or explicitly delete preserved
forms. The manager form list remains available while disabled and links directly
to preserved settings. The dedicated manager configuration read returns definitions
without latest answers or results; ordinary reads, submission and results stay
disabled. Policy recovery remains available to the owner before onboarding.

## Interaction and visibility

Web and native expose direct Forms, Create, management, response, results and
history actions. Form creation reuses blank, feedback and check-in templates,
plus the existing seven-type question editor and answer primitives. Native
handles ordinary authoring and responses directly. Required questions validate
on save; an empty optional answer can be omitted. Question IDs must be unique;
forms support at most 50 questions and the shared questionnaire validator's
bounded labels, options and answers. Titles contain 1–100 trimmed characters,
descriptions at most 2,000. Responses reject unknown questions, invalid choices
and values of the wrong type.

Response visibility is chosen when creating a form and stays fixed:

- **MANAGERS**: personal answers are visible to their author and current eligible
  managers. Eligible members cannot read other authors' personal results.
- **MEMBERS**: latest shared contributions are visible to eligible Group members.
  Private revision history remains accessible only to its author.

Both interfaces explain visibility and retention before saving. They identify
anonymous shared results explicitly and do not return email addresses, contact
information or private notification preferences. Managers may remove an ordinary
response by its persistent result ID, including anonymous shared contributions.
Own removal erases the latest response and all its private revisions, including
after leaving, a ban, disabling forms or newly required onboarding. Manager
removal erases the targeted latest response and its associated private history.
Deleting a form erases its configuration, results and revisions after explicit
confirmation. These operations do not affect joining questionnaire records.

## Versions, editing and recovery

Each form has a persistent tool ID and configuration version. Configuration
writes supply the current version; competing/stale edits conflict instead of
silently overwriting. An accepted configuration write increments the version
and preserves every response with its original question definitions. Cosmetic
label/required-flag edits and option reorder retain compatible prefilled answers;
a changed question ID, type or option value set clears that question's current
prefill. Required-flag edits may retain existing valid answers because ordinary
forms have no admission completion decision. Saving always validates the entire
current definition. Historical snapshots remain intact even when prefill clears.

A save supplies the current form version, the author's expected latest response
revision (zero for the first save), and typed answers. A changed body against a
stale response revision conflicts. Two competing changed bodies cannot both win.
An exact repeat of the latest answers at the same configuration version returns
the existing revision without creating duplicate history, even when its expected
revision is stale. Each changed accepted save creates one private revision with
its question snapshot and replaces the latest result. Changing configuration
requires reviewing the new version before saving. Historical records remain
readable by their author after departure or a ban without exposing newer private
questions. Recovery is based on current versions and exact latest content;
there is no request-ID retention table or automatic replay of older revisions.
Creation is not automatically retried: inspect the form list after an uncertain
create result before submitting another creation.

## API and extension contracts

Convex `groupTools` defines persistent identity, FORM/POLL/LIST discriminators,
per-kind enabled/creation policy, fixed MANAGERS/MEMBERS visibility and shared
creation/interaction checks. `groupForms` owns form configuration, latest
responses, author-only revisions and its app-SDK-injected shared hook factory.
The discriminator and policy helpers are extension seams; they expose no runnable
poll/list behavior or automation. Static reusable templates live in shared
utilities. Indexed pages accept 1–100 records with opaque cursors.

REST uses `/api/v2/groups/{groupId}/forms`, individual `/{toolId}`, manager `/settings`, `/history`,
`/results`, `/response` and `/results/{responseId}`. The owner policy is
`/groups/{groupId}/form-policy`. Reads require Group read scope; writes require
Group write scope and recheck current live role/content eligibility inside the
mutation. REST tool/result IDs are scoped to the specified Group and form.
CLI `groups forms` exposes list/get/settings/history/results/create/configure/submit,
remove-own/delete/moderate and policy get/set. `--form-version` and
`--expected-revision` pass explicit versions; destructive operations use the
existing confirmation/`--yes` pattern. The generated CLI reference documents
all arguments. These endpoints return saved database state, never external
delivery claims; ordinary forms schedule no notification channels.

## Cleanup and verification

Group retirement removes indexed tool policies, configurations, responses and
revision histories in the shared Group cleanup transaction. All three real
account deletion paths (self, authenticated administrator and administrator
REST) purge personal MANAGERS latest responses and all author-owned private
revision history. A MEMBERS latest contribution survives anonymously; its
person reference and tool creator reference are removed. Shared anonymity does
not retain the author's private history. Existing Group ownership-transfer
requirements still apply before an owner can delete their account.

Targeted tests cover authenticated Convex/REST permission, persistence, private
results, current-manager onboarding, exact recovery and competing writes,
configuration compatibility, banned-author history, all three account deletion
paths and Group retirement. Mounted web/native tests use real consuming Convex
providers and production accessible form controls; CLI tests cross a real local
HTTP listener into the authenticated REST/Convex seam. Native tests substitute
host React Native primitives, so they prove component/provider behavior rather
than actual device keyboard, accessibility-service or OS behavior. No live
providers, accounts, deployment or full-suite run are part of these checks.
