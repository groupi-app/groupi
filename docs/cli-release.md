# CLI release verification

The CLI release path is independent of application releases. This runbook tracks
the evidence required by #228 (first beta) and #242 (complete release); adding the
workflow does not mean either release has happened.

## Table of Contents

- [Versioning and package audit](#versioning-and-package-audit)
- [Release gates](#release-gates)
- [Manual beta publication](#manual-beta-publication)
- [Evidence record](#evidence-record)

## Versioning and package audit

`@groupi/cli` is excluded from the linked web/mobile/shared/Convex Changesets group.
Only the CLI has `publishConfig.access: public`; the workspace default remains
restricted. The existing application version-PR workflow is unchanged and does
not publish packages. Never use recursive publication to release the CLI.

Approve the CLI changeset wording before creating a user-facing changeset. Review
the resulting version PR to confirm that CLI-only changes do not bump the linked
application group. Before the first beta, prepare and review the explicit CLI
prerelease version (`X.Y.Z-beta.N`) and regenerate its reference. Do not enter
workspace-wide Changesets prerelease mode as a shortcut: that can prerelease
unrelated pending application changes.

Run `pnpm --filter @groupi/cli test:package`. It packs and installs into a temporary
directory, checks the exact published dependencies and version, recursively audits
runtime/guidance files, rejects unexpected files and recognizable credential
material, verifies generated help, and exercises CLI and real REST contract tests
using the installed binary. The file audit is a defense against accidental
inclusion, not a comprehensive secret scanner. Review the archive manifest and
source diff as well. `GROUPI_PACKAGE_OUTPUT_DIR` retains the tested tarball only
when all checks pass; the release workflow publishes that exact archive.

## Release gates

The existing CLI CI matrix runs Node 22 and 24 on macOS, Windows, and Linux. It
checks native credential-store round trips and profile/deployment isolation;
Linux additionally exercises unavailable Secret Service. Command tests exercise
headless auth and mocked unavailable-store errors. These are distinct evidence:
mock adapters do not prove native OS integration. Collect all six green run links
for the exact release commit; do not substitute a run from an earlier commit.

Before approving the beta, verify the installed artifact against **isolated
staging**, with approved organizer and attendee identities:

1. Record the preview origin and actual backing auth/data deployment. A preview
   hostname alone does not establish isolation from production.
2. Complete browser login, list/create an event, invite the other identity,
   accept/respond as that attendee, and inspect attendance and expected
   notifications as organizer. Retain redacted human and JSON outputs.
3. Verify wrong/expired/revoked credentials, permission failures, repeated event
   and invite requests, lost-response recovery, and profile isolation. Confirm
   resulting backend state and notifications; an exit code alone is insufficient.
4. Record test data cleanup and temporary credential revocation. Do not place
   keys, authentication headers, real account email addresses, or raw credential
   stores in logs or release evidence.

Before the complete release, also verify discussion/media, social/settings,
existing add-ons, all role boundaries, content/mention safety, legacy text limits,
media ownership/rollback/cleanup, and pagination/retry behavior. Perform manual
TUI keyboard, confirmation, refresh/staleness/reconnect and CLI-fallback checks.
Link each result in the capability checklist. Only custom add-on definition
creation/edit/import/export may remain deferred to #243; existing add-on use is
required. Keep #100 open until all agreed core evidence is complete.

## Manual beta publication

Publication is **disabled by default**. No credentials or repository settings are
created by the workflow. A maintainer must first verify npm `groupi` scope
ownership, package write access, and permission to create the initial package.
An absent package listing proves none of these. Use the existing authorized npm
session/account permission views; never print authentication configuration or
tokens. Record the account/team and permission evidence without secrets.

After explicit authorization to publish and configure access, a maintainer must:

1. Configure the `cli-release` GitHub environment with required reviewers and a
   main-only deployment policy. Reviewers must inspect the evidence, not just the
   presence of its URL. Confirm these protections before enabling the workflow.
2. Supply an approved, package-scoped, expiring publishing credential as the
   **environment** secret `GROUPI_CLI_NPM_TOKEN`. Grant only the rights required
   for this package; do not broaden an unrelated token. Authentication setup is
   a separate action requiring approval, not a prerequisite to reviewing code.
3. Set repository variable `GROUPI_CLI_PUBLISH_ENABLED` to `true` only after the
   gates above are satisfied. Leave it unset until then.
4. Dispatch **Publish CLI beta** from `main`, giving the exact approved
   prerelease version and a GitHub issue/comment evidence URL. The workflow
   rejects other branches and stable versions, repeats the six-job verification,
   retains the tested archive, and waits for environment approval before publish.
5. Approve the environment job only for the reviewed commit/artifact and evidence.
   It publishes just the CLI tarball to the `beta` dist-tag, then installs that
   exact version from the public registry and checks version/help. This does not
   promote `latest` or release any other workspace package.
6. Repeat the installed staging smoke flow from the public registry and attach
   evidence before closing #228. A failure after publication does not undo the
   published version: inspect the registry and rerun verification, rather than
   republishing or deleting the package. Use a new version for corrections.

The initial workflow deliberately supports only beta publication. A stable
release needs a separately reviewed gate/tag change after #242 evidence is ready.
The workflow uses [pnpm tarball publication](https://pnpm.io/cli/publish); it does
not run lifecycle scripts or install workspace dependencies in the credentialed
publication job.

## Evidence record

Copy this record into the relevant issue; leave unexecuted checks pending.

| Gate                 | Required evidence                                                          | Status  |
| -------------------- | -------------------------------------------------------------------------- | ------- |
| Release identity     | Commit SHA, package version, archive SHA-256, workflow run                 | Pending |
| npm authority        | Verified account/team, scope ownership, package-create/write rights        | Pending |
| Release access       | Environment protection review and approved credential scope/expiry         | Pending |
| OS/runtime           | Six exact-commit matrix runs, native stores and headless failures          | Pending |
| Beta staging         | Isolated deployment, two identities, human/JSON flows, state/notifications | Pending |
| Error/retry behavior | Role/auth failures, duplicate/lost responses, profile isolation            | Pending |
| Complete scope       | Capability links, content/media/add-ons/social/settings checks             | Pending |
| TUI                  | Manual keyboard, confirmation, refresh/stale/reconnect/fallback results    | Pending |
| Public package       | Registry version, fresh install, registry-installed staging flow           | Pending |
| Cleanup              | Disposable data cleanup and temporary auth revocation evidence             | Pending |
