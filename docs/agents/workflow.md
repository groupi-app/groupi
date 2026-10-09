# Agent Workflow

Establish verification prerequisites early and present release-note decisions together.

## Runtime readiness

Use the [verification readiness command](../verification-readiness.md) for public
deployment checks and its explicit authentication/device limitations.

At feature kickoff, identify every required browser/device check and discover the available setup using read-only evidence: the user's supplied URL, current integration record, deployment metadata, public runtime configuration, and booted device inventory. Record:

- Frontend URL and exact source/deployment SHA; whether it includes the feature under test.
- Backend URL/environment and evidence that its API/schema match that frontend. An HTTP 200 alone does not prove matching source.
- An isolated signed-in session/test identity and which data mutations the user has authorized.
- For native checks, installed feature build, device/simulator availability, matching backend, and a plan for actual VoiceOver observation.

Mark each prerequisite ready, missing, or unverified. Recheck when deployment/source/backend changes. Continue independent implementation and unit tests when a prerequisite is missing; report the exact blocked check and request only the missing setup or authorization. Use the [script policy](../../.agents/rules/scripts.md) for runtime boundaries. Existing approval remains valid within its scope.

A signed-out route smoke test, mocked router test, or accessibility tree inspection is evidence only for what it exercises. Authenticated navigation needs the real app session; VoiceOver needs observed focus and announcements. Record unavailable checks as open gates, never as successful skips. Keep current gates in the [integration status](integration/current-status.md).

## Changeset approval

After an agreed batch of user-facing work is concrete, prepare all proposed changesets together: each feature/fix summary, affected packages, and bump type. Present that batch once for user confirmation before creating the files. One approval covers the agreed summaries and package/bump choices; do not interrupt each ticket for the same decision. If existing session approval already covers those exact choices, proceed.

Create separate changesets where the features/fixes warrant them; batching approval does not require combining unrelated release notes. If scope changes materially, present only the changed choices for confirmation. User confirmation is still required; broad implementation approval alone is not approval of a release-note summary. Follow [Changesets Guide](../changesets.md) for mechanics and non-user-facing exemptions.
