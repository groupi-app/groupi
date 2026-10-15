# CLI beta verification — October 13, 2026

Evidence for [#228](https://github.com/groupi-app/groupi/issues/228) and the
installed guidance in [#241](https://github.com/groupi-app/groupi/issues/241).
This record distinguishes installed local tests, native integration, and live
staging observations. It does not establish publication readiness.

## Table of Contents

- [Artifact and local checks](#artifact-and-local-checks)
- [Exact-commit OS matrix](#exact-commit-os-matrix)
- [Installed agent guidance](#installed-agent-guidance)
- [Staging observations](#staging-observations)
- [Publication gates](#publication-gates)

## Artifact and local checks

Source baseline: `c307c779fd6907936c34303ac34f755c7fa266db` (`main`).
Package: `@groupi/cli@0.1.0`; local runtime: macOS, Node `22.23.3`, pnpm `10.12.1`.

| Check                                                    | Result                                                                        |
| -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Frozen workspace install                                 | Passed; lockfile unchanged                                                    |
| `pnpm check`                                             | Passed; existing lint warnings, no errors                                     |
| Generated reference freshness                            | Passed from source and installed package                                      |
| Packed file and credential-material audit                | Passed, 53 runtime/guidance files                                             |
| Installed executable CLI tests                           | 237 passed in 18 files                                                        |
| Installed CLI through authenticated REST/domain fixtures | 19 passed in 7 files                                                          |
| Native macOS credential store                            | Round trip, profile/deployment isolation, repeated removal and cleanup passed |

The local REST tests run Convex test fixtures, with synthetic identities and
storage. They exercise permission enforcement and side effects, but do not run
against the hosted staging deployment. Missing test OAuth provider configuration
produces expected fixture warnings; it does not establish real OAuth delivery.
The native Keychain script creates and removes synthetic entries only.

The focused beta auth/event/invitation/attendance REST suite also passed all 78
tests in four files. The first PR CI run exposed an existing wall-clock-sensitive
relative GDL replay test: `[Tu,Th]@18-20` could select an already-past time and
receive HTTP 400 instead of 201. The verification branch includes the shared
one-line fixed-clock anchor in that test, originally prepared as commit
`c30fb3604d9ccb4a3b19e5584d73ef1e5f4f1ee1`. No parser, date semantics, or CLI runtime
code changed. The originating track verified the affected 23 tests in UTC and
America/New_York and the full 673-test backend suite in UTC with its existing
scheduler-error handling. Fresh PR CI must still pass for the final commit.

The fresh macOS/Node 24 installed-package job also exceeded the default
five-second budget for the discussion workflow at 5.089 seconds. Only that
multi-command integration case now has an explicit 15-second test budget; all
assertions and product/client timeouts remain unchanged. Its six-test file passed
against the installed archive, followed by `pnpm check`.

The original baseline archive passed the package checks and has SHA-256
`7c5c75d22e94ad1ab3b7c8e1f3ea6f07f919be99a65b78a9a1e80d4461eb8463`.
After correcting stale README/guidance claims and documenting generic API-key
quotas, the separately packed archive passed the same checks with SHA-256
`a54f5e5def8b69fd5b5b5ccc07b1cc715e60f035123b48d8fafcf69b6be169a4`.
Neither archive has a beta prerelease version or is approved for publication.

## Exact-commit OS matrix

[CLI Package Checks run 37250681475](https://github.com/groupi-app/groupi/actions/runs/37250681475)
is a successful `push` run for the exact baseline SHA on `main`.

| Platform | Node | Successful job                                                                                 |
| -------- | ---- | ---------------------------------------------------------------------------------------------- |
| macOS    | 22   | [111577482265](https://github.com/groupi-app/groupi/actions/runs/37250681475/job/111577482265) |
| macOS    | 24   | [111577482495](https://github.com/groupi-app/groupi/actions/runs/37250681475/job/111577482495) |
| Windows  | 22   | [111577482434](https://github.com/groupi-app/groupi/actions/runs/37250681475/job/111577482434) |
| Windows  | 24   | [111577482407](https://github.com/groupi-app/groupi/actions/runs/37250681475/job/111577482407) |
| Linux    | 22   | [111577482436](https://github.com/groupi-app/groupi/actions/runs/37250681475/job/111577482436) |
| Linux    | 24   | [111577482415](https://github.com/groupi-app/groupi/actions/runs/37250681475/job/111577482415) |

Each job passed the installed-package check. macOS and Windows passed native
credential-store integration. Both Linux jobs passed Secret Service integration
and explicit unavailable-service behavior. Mocked command tests supply additional
headless/store-error coverage. The final approved beta commit must obtain its own
six successful jobs after version/reference and any subsequent changes.

## Installed agent guidance

The coding-agent context read the skill shipped in a fresh installation outside
the repository, followed its profile/authentication instructions, and checked the
installed generator and per-command JSON help. Observed stream/exit results:

| Invocation                                      | stdout                                        | stderr / exit                           |
| ----------------------------------------------- | --------------------------------------------- | --------------------------------------- |
| `--version`                                     | `0.1.0`                                       | Empty / 0                               |
| `events members --help --format json`           | JSON `text` containing supported paging flags | Empty / 0                               |
| `profile add staging-organizer … --format json` | Profile name and explicit API/web URLs        | Empty / 0                               |
| Unknown profile event listing                   | Empty                                         | JSON `UNKNOWN_PROFILE` / 2              |
| Named profile with an unscoped environment key  | Empty                                         | JSON `KEY_PROFILE_MISMATCH` / 3         |
| `auth login --format json`                      | Empty                                         | JSON `BROWSER_INTERACTION_REQUIRED` / 3 |

Temporary profiles were removed and contained only API/web URLs. The installed
planning and inspection workflow arrays passed the public executable tests with
distinct synthetic organizer/attendee profiles, invitation acceptance, RSVP and
visible attendance. These results establish direct skill use by this agent and
the documented terminal contract. Automatic skill discovery/installation in a
fresh compatible client session remains unverified.

## Staging observations

The user indicated `https://test.groupi.gg`. Its deployed client uses
`https://hushed-whale-308.convex.cloud`, with REST at
`https://hushed-whale-308.convex.site/api/v2`. The deployment's web source SHA is
`6d29f19890f995d820e4311fbaeb24f82eb3c12d`, which is newer than the CLI baseline.
Production uses `trustworthy-warthog-524`, a different backend. Existing local
Convex authorization confirmed test `SITE_URL` and `BETTER_AUTH_URL` both equal
`https://test.groupi.gg`, and `E2E_TESTING` was already true. Its fixture key was
absent. The authorized setup added one random temporary fixture key to this test
backend only and retained it in a dedicated temporary Keychain entry. Vercel and
production configuration were unchanged; no code was deployed.

The existing `createTestSession` seeder created two fresh disposable real auth and
person identities. An in-memory localhost bridge generated ordinary magic-link
verification redirects for browser sessions, then the installed CLI initiated
explicit PKCE-bound approval through the actual `cli-auth` page in independent
browser contexts. No credential or magic-link URL was written to evidence.

| Installed live workflow                      | Result                                                           |
| -------------------------------------------- | ---------------------------------------------------------------- |
| Browser login as each identity               | Passed; both stored in actual macOS Keychain                     |
| `auth status`                                | Correct distinct identities and `credential-store` source        |
| List and create event                        | Passed against test backend                                      |
| Repeat event request ID                      | Original event and membership returned                           |
| Send and repeat username invitation          | Original invitation returned                                     |
| Attendee inspect, accept and RSVP            | Accepted once; RSVP `YES`                                        |
| Organizer attendance, human and JSON         | Two members; attendee `ATTENDEE` / `YES`                         |
| Organizer notifications                      | `EVENT_INVITE_ACCEPTED` and `USER_RSVP` observed                 |
| Attendee notifications before Group workflow | `EVENT_INVITE_RECEIVED` observed                                 |
| Attendee attempts event deletion             | `FORBIDDEN`, exit 3; organizer subsequently read surviving event |

Additional live checks:

- Correct identity through temporary environment and stdin credentials; status
  reported the respective source without revealing the key.
- An actual saved Keychain record with an expired local timestamp returned
  `AUTH_EXPIRED`, exit 3, and the original valid record was restored. This tests
  client-side expiry; server-side expiry was not fabricated or claimed.
- An explicitly scoped invalid synthetic key returned empty stdout and structured
  `AUTH_REQUIRED` on stderr, exit 3.
- Both real CLI keys were revoked during cleanup. Attempts to use each old key
  returned `AUTH_REQUIRED`, exit 3, and its saved Keychain entry was absent.
- A controlled loopback relay forwarded authentication, original bodies and
  `Idempotency-Key`, then dropped the first successful staging event/invitation
  response. The installed CLI recovered each with two identical upstream attempts
  and one request ID. Backend reads verified one event and one invitation
  notification. Two earlier harness fixtures were explicitly deleted before the
  corrected relay verification; they are included in cleanup accounting.

The same disposable identities supported the parallel Groups acceptance track.
Its separate UI mutations created Group/Invite List fixtures and used three
explicitly tracked seeded events. Read-only installed CLI snapshots independently
confirmed that direct admission and approved application produced `ATTENDEE` /
`PENDING` memberships. These snapshots corroborate that track; they do not claim
Groups commands exist in this CLI baseline.

After a Group invitation created `GROUP_INVITE_RECEIVED`, the attendee's REST
notification list returned HTTP 500 (`REMOTE_ERROR`, exit 5). A scoped readonly
backend audit still confirmed exactly one invitation notification for the
recovery event. The Groups track traced the separate staging regression to the
notification projection returning `groupAnnouncement: null` while its return
validator omitted that field, and prepared a tested correction. That correction
was not deployed during this verification. Earlier core notification reads passed;
mixed Group notification REST reads require verification after the correction.

The Group notification correction is tracked in
[PR #368](https://github.com/groupi-app/groupi/pull/368). The parallel track also
verified that deleting a saved Invite List preserves its already-sent invitation;
acceptance subsequently created a second event member with RSVP `PENDING`.

Cleanup exposed another staging gap: ordinary event deletion left four
`eventInvites` rows referencing the deleted test events. The guarded fixture
cleanup removed only those exact owned IDs; no product cascade fix was made in
this PR. This result must be corrected or explicitly resolved before declaring
event deletion cleanup complete.

Final coordinated cleanup was verified with narrowly scoped backend reads:

| Resource                                                      | Final evidence                                                                               |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Seven tracked events, one Group, three Invite Lists           | Every exact ID resolves to `null`                                                            |
| Event memberships, member invitations and event notifications | Zero rows for all seven tracked event IDs                                                    |
| Two real CLI API keys                                         | Revoked; both old-key requests denied; both Keychain entries absent                          |
| Two disposable auth users and persons                         | Removed; both user counts zero and person IDs resolve to `null`                              |
| Seven remaining browser/fixture sessions                      | Removed: four organizer and three attendee; final counts zero                                |
| Temporary fixture key                                         | Matched owned value before removal; absent from test deployment and temporary Keychain entry |
| Local profiles and bridge                                     | Three temporary profiles removed; localhost bridge closed                                    |

No Group/Invite List or active event fixture remains. The normal replay-retention
policy and its scheduled cleanup were not bypassed. Existing test deployment
settings, including `E2E_TESTING`, retained their original values.

## Publication gates

Read-only publication inspection found:

- `@groupi/cli` has public access and the public npm registry configured. CLI
  version planning is independent of the linked application packages; its
  release-plan tests passed.
- The package remains `0.1.0`; the beta workflow requires an exact approved
  `X.Y.Z-beta.N` version matching the manifest and regenerated reference.
- Anonymous npm lookup returned HTTP 404 for `@groupi/cli`. No authenticated npm
  session was available; scope ownership and package-create/write rights are
  unverified. A 404 is not ownership evidence.
- Repository environment listing contains `Preview` and `Production`, but no
  `cli-release`. `GROUPI_CLI_PUBLISH_ENABLED` is absent. No CLI beta workflow run
  exists. The CLI publishing credential has not been configured or inspected.
- The existing workflow verifies six OS/runtime jobs, retains/checksums the exact
  tested archive, and publishes only that archive to `beta` after its environment
  gate. Registry version/help smoke runs after publication.

Remaining operational inputs: resolve/reverify the mixed Group notification REST
regression and event-invitation deletion cascade on the staging target;
authenticated npm scope/package authority;
approved CLI changeset wording and prerelease version; protected
main-only `cli-release` environment with required reviewers and a scoped expiring
credential; final six-job verification and explicit publication approval.
Registry installation and the repeated registry-installed staging smoke remain
post-publication checks. No package version, registry state, publishing environment,
publishing credential or release-enable variable was changed during verification.
The parent applied the documented `skip-changeset` label to this documentation and
test-only PR; these changes do not require a fabricated release changeset.
