# Agent guidance verification

Evidence and release boundaries for the portable skill and generated CLI reference
owned by [issue #241](https://github.com/groupi-app/groupi/issues/241).

## Table of Contents

- [Automated checks](#automated-checks)
- [Instruction evidence](#instruction-evidence)
- [External release checks](#external-release-checks)

## Automated checks

`pnpm --filter @groupi/cli docs:check` compares distributed Markdown/JSON against
actual Commander definitions and the package version. Adding, removing, or changing
a command or option makes it fail until regeneration. Changing the workflow source
also makes the generated examples stale. `prepack` enforces the same check.

`pnpm --filter @groupi/cli exec vitest run tests/reference.test.ts` verifies that
reference version matches the executable, then executes the actual distributed
workflow argument arrays through the public binary with a local HTTP fixture.
Tests observe stdout, stderr, exit status, and visible attendance output. They
use synthetic temporary environment keys with separate organizer/attendee profiles,
never real credentials. JSON login is verified to return the documented structured
browser-interaction error without opening a browser or leaking the supplied key.

`tests/invite-lists.test.ts` additionally verifies anonymous unavailable JSON/text,
truthful available counts and Needs attention state, fresh-use rejection guidance,
repair forwarding and subsequent use, old-identity errors, and original-result
replay without a current-list read. Real account deletion and invitation semantics
remain covered at the authenticated backend seam; the local HTTP fixture proves
CLI transport and display behavior.

`pnpm --filter @groupi/cli test:package` packs and installs the package outside the
workspace. It verifies documentation, skill, generator, and runtime artifacts,
checks the installed reference, and reruns all public-entry tests with
`CLI_TEST_BIN` set to the installed executable. This includes the agent examples.
The installed generator requires only shipped CLI dependencies.

## Instruction evidence

The planning instructions exercise creation with a retained request identifier,
username invitation sending with a second identifier, invitation inspection and
acceptance by a distinct attendee, attendee RSVP, and organizer attendance reading
with explicit full pagination. Inspection instructions exercise account status,
bounded event listing, event detail, and the attendee's own RSVP. Invite-list
instructions exercise username discovery, private creation from selected person
IDs, collection browsing, detail inspection, editing, explicit event use with a
retained request identifier, and confirmed deletion through the same executable.
Creation and editing do not send invitations; only the explicit invite step does.
The fixture verifies its zero-sent/skipped response and retained identifier. Their source is
`agent-workflows.json`; generated prose contains the same arguments so command or
option removal fails the executable smoke checks.

This portable Markdown skill has no client-specific dependencies. The implementing
coding-agent context can read it and use its terminal examples, but this evidence
does not establish skill-installation or discovery behavior in every compatible
agent client. Copying the skill alone requires retaining access to the installed
package reference files; preserving the package's layout preserves relative links.

## External release checks

The fixture is instruction and packaging evidence, not a replacement for the real
REST/domain authorization tests or staging workflow. Before claiming final release
readiness, record a staging run with actual organizer/attendee identities and
observed permissions, state changes, and notifications; successful Node 22/24
checks on macOS, Windows, and Linux; real OS credential-store integration; approved
public registry publication permissions; and a chosen compatible client's actual
skill discovery/installation smoke test. Keep credentials and bearer invite tokens
out of all recorded evidence.

The generated command reference covers the installed surface. It does not claim
completion of deferred discussion/media work, the everyday TUI, or custom add-on
authoring, and cannot establish application parity merely because a command exists.
