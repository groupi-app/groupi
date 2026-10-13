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
Production uses `trustworthy-warthog-524`, a different backend. These endpoint
observations distinguish targets; they do not independently prove all staging
authentication/provider configuration is isolated.

Live checks performed without a real credential:

- REST health returned HTTP 200 and advertised `eventWrites`,
  `eventCreationIdempotency`, `inviteWrites`, `inviteLists` and `attendanceWrites`.
- The installed CLI sent an explicitly scoped invalid synthetic key to the test
  backend: stdout was empty; stderr contained JSON `AUTH_REQUIRED`; exit was 3.
  The error explains invalid/expired/disabled/revoked keys without revealing input.
- The web E2E login endpoint rejected a keyless request with HTTP 403.

Existing seeding functions require `E2E_TESTING=true` and a matching
`E2E_FIXTURE_KEY` of at least 32 characters. `createTestSession` creates real auth
and person records; use fresh synthetic addresses because reusing an address
also clears that user's sessions. `cleanupTestData` accepts explicitly tracked
fixture IDs. The saved native fixture configuration belongs to
`bright-jellyfish-173`, not the test backend; it was not reused across targets.

Local Convex authorization could not inspect the test deployment, and an existing
preview credential failed authorization. The existing narrow Warp login flow was
prepared for reauthorization. No staging identity, event, invitation, or valid CLI
credential was created by these checks. Browser login, two-identity planning,
notifications, real revocation/expiry, permission denials, replay/lost-response
recovery and cleanup therefore remain pending live verification.

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

Remaining operational inputs: restored access to the isolated test deployment
and its fixture key; completed live evidence; authenticated npm scope/package
authority; approved CLI changeset wording and prerelease version; protected
main-only `cli-release` environment with required reviewers and a scoped expiring
credential; final six-job verification and explicit publication approval.
Registry installation and the repeated registry-installed staging smoke remain
post-publication checks. No version, registry, environment, secret, release-enable
variable or issue metadata was changed during this verification.
