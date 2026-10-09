# Verification readiness

Check prerequisites at feature kickoff, before promising browser or native proof.
Do not start servers or builds to discover whether a usable runtime exists.

```sh
node scripts/verification-readiness.mjs https://test.groupi.gg FULL_DEPLOYED_SHA https://EXPECTED.convex.cloud
```

This read-only command fetches public deployment metadata and backend health. It
fails on unavailable/malformed metadata, a missing or mismatched commit, a
non-preview deployment, or an unexpected backend. The backend argument is optional
for discovery; supply it to verify the intended preview. JSON output includes local
HEAD and cached origin/main and origin/test refs, explicitly labelled as cached.
It does not fetch Git refs, read credentials, create accounts, or change data.
A successful health response proves reachability, not the backend's source SHA.
Use deployment evidence to establish the backend revision before feature testing.

New deployments publish commit and environment alongside their existing public
Convex URL. Older deployments without these fields correctly remain blocked until
redeployed through the normal authorized process. Deployment redirects are rejected;
use the actual preview origin. Protection or authentication pages are blockers, not
permission to bypass protection.

The automatic deployment-success workflow runs **public preview readiness only**.
Production deployments are excluded. This check never proves signed-in behavior.
The manual workflow requires an explicit preview URL, full commit, expected backend,
and a configured fixture key. It checks out that exact commit and fails rather than
silently skipping if prerequisites are absent. Fixture access must be configured on
the isolated backend too; a local key alone is not proof. Automatic mutation-based
E2E remains disabled until fixture and email isolation have been verified.

Record remaining prerequisites in the authoritative integration record:

| Prerequisite      | Evidence required to change unverified to verified                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| Signed-in browser | Isolated authorized test identity, matching deployment/backend, successful authenticated browser navigation |
| Native runtime    | Installed build revision and backend, named physical device or booted simulator, successful launch          |
| VoiceOver         | Guided real device/simulator observation of the feature's focus, announcements and navigation               |

The readiness report deliberately leaves these three areas unverified. A public
health response, saved cookie file, running simulator, or passing component test
cannot satisfy them. Record the missing item and owner early; obtain an existing
session/build or explicit fixture authorization through the normal workflow.

Run the gate's offline adversarial checks with:

```sh
node --test scripts/verification-readiness.test.mjs
```
