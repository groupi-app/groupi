---
status: accepted
---

# Group-owned Discord access is explicit and respects Discord moderation

Discord community access belongs to a Group connection, independently of the existing Event scheduled-event add-on. Groupi governs Group admission and eligibility, while Discord owns conversations and server moderation. Each Group connects one existing server in either Role access mode (the default, using a dedicated role) or Server membership mode (an exclusive Groupi Group connection).

Only Discord accounts explicitly enrolled through Connect Discord are managed; enabling never purges unmatched server accounts. Required Group onboarding gates access. Departure/removal revokes the role or kicks the participant; Group bans and coordinated exclusion create Discord bans only in Server membership mode. Account replacement cannot gain access before old-account cleanup is confirmed. A person selects one managed Discord identity for Group access; this selection does not restrict which linked accounts can sign into Groupi. Explicitly selecting a replacement retires the prior managed identity while preserving its login capability until the person chooses to unlink it. These boundaries preserve intentional enrollment and avoid turning a shared-server role connection into server-wide authority.

Discord-side bans do not expel people from Groupi, and Groupi reinstatement never automatically unbans Discord. Discord exposes no conditional removal tied to an immutable ban instance, so reason markers and expiring audit records cannot safely establish exclusive ownership against staff intervention. Discord staff explicitly review/unban before a fresh eligible connection. Disabling hands existing membership/roles back to Discord staff rather than removing everyone. Group deletion uses the same handback policy; re-enabling or changing mode/server requires fresh participant connections rather than silent restoration or migration. Group managers receive no automatic Discord moderation powers.

Pending removals survive disablement/deletion/reconfiguration; new grants stop immediately. Connections expose explicit externally managed exceptions rather than promising impossible revocation, and delegated clients receive scoped status/hosted flows without Discord credentials. Known-at-connection unremovable identities may be explicit external exceptions. Later permission or hierarchy loss leaves managed removals blocked, visible and retryable; it never silently hands those accounts back or reports revocation as complete.

The user confirmed the complete shared understanding on 2026-10-23. This records the accepted design; implementation remains pending.
