# Persistent Group polls

Group polls are independent, silent publications. They never select Event dates, change RSVP, inherit into Events, broadcast or run custom automation. They share Group tool instance metadata, Owner-controlled type availability and creation policy with forms and lists, while storing independent poll definitions and votes. Multiple polls coexist with ordinary forms and the designated joining questionnaire.

## Configuration and permissions

The default POLL policy is enabled with MANAGERS creation. The Owner can disable polls or permit MEMBERS creation. Creating requires current live, unbanned, admitted, onboarding-complete Group membership and the stated creation policy. Member creation does not grant management: only current content-eligible Owner/moderators configure, delete or moderate instances. Owner policy recovery follows the existing tool-policy boundary.

Create accepts title (1–100 trimmed characters), description (at most 2000), SINGLE or MULTIPLE mode, 2–50 options with unique stable printable IDs (1–64 ASCII letters/digits/underscore/hyphen) and unique trimmed labels (1–200 characters), plus immutable MANAGERS or MEMBERS results visibility. The shared Yes/No and Topics templates copy definitions into independent instances. Configuration and interaction have separate routes and controls. Disabled types retain manager list/settings/configure/delete access; ordinary voting/results remain disabled. Disabled management never bypasses required onboarding.

MANAGERS results disclose latest selections, saved definitions and author identity only to current content-eligible managers. MEMBERS results disclose those fields to current eligible members; contributions from deleted accounts may remain with anonymous context. This visibility is shown before voting and cannot be widened by configuration. No contact details, applications, onboarding answers or nonmember data are exposed.

## Voting and configuration compatibility

SINGLE accepts exactly one current option ID. MULTIPLE accepts one or more unique current IDs, up to the option count. Voting creates or replaces one latest vote per person/poll, with an indexed private revision history. Choices are sorted before storage. Exact-repeat current compatible selections return the saved revision, even if the caller's expected revision is older; they never duplicate votes or history. Changed selections require the current expectedRevision. Concurrent differing edits conflict rather than overwrite; transaction retries preserve one latest record.

Each configuration edit advances version, and stale submissions/configuration fail with CONFLICT. SemanticVersion advances only when the selection mode or sorted option-ID set changes. Relabeling, title/description edits and option reordering preserve validity. A material change makes prior votes historical, without deleting saved votes or their definitions. Changing back is another material revision, not automatic resurrection. Current interaction seeds only compatible selections; savedOptions/savedVersion and own paginated history retain original definitions.

Results are paginated latest vote records, not global aggregates. Each record states isCurrent and removed. Only isCurrent votes participate in the current poll; clients label historical/removed rows explicitly and do not present page counts as whole-poll totals. Bounded pages cap at 100 records, option definitions at 50. No unbounded vote/history scans compute current validity.

Own removal requires expectedRevision, clears selections and private history, and keeps an empty removed latest revision tombstone so delayed stale submissions cannot recreate the old vote. An exact removal retry succeeds without another increment. Current managers can similarly remove a latest vote, including anonymous shared records. Removal does not reveal current Group configuration. Own history includes authoritative voteRevision and remains available after departure, removal, ban or type disable; it grants only retained own snapshots. Rejoin seeds compatible saved votes; required onboarding, bans and current membership still gate ordinary content and writes.

## Public interfaces and lifecycle

App SDK: groupPolls queries getPoll, getPollForManagement, listPolls, listResults, getOwnHistory; mutations createPoll, configurePoll, submitVote, removeVote, removeResult, deletePoll. groupTools adds getPollPolicy/configurePollPolicy. Shared createGroupPollHooks receives the actual consuming application's Convex SDK.

REST v2 uses /groups/{groupId}/polls, /polls/{toolId}, /settings, /vote, /results, /results/{voteId}, /history and /poll-policy. Group read/write scopes and current domain permissions apply independently. PUT vote carries version, expectedRevision, selections. DELETE vote or a result carries expectedRevision. CLI groups polls provides equivalent create/configure/submit/remove-own/moderate/delete/list/get/settings/results/history and policy get/set commands. Writes require advertised groups.polls version 1 before mutation, strict JSON references, explicit destructive confirmation and truthful uncertain-outcome recovery.

Group retirement immediately purges each tool kind's definitions/latest/history and policies. All three account deletion paths purge private poll votes and all personal revision history, anonymize only disclosed shared latest context, and clear creator identity. Required ownership/account guards remain in force. Removed or banned users cannot read current definitions/results; own retained snapshots remain private until explicit removal, Group retirement or account deletion.

Verification covers actual authenticated invited entry, current authority/privacy, single/multiple validation, exact-repeat and stale write/removal behavior, cosmetic/material edits, disabled-manager recovery, leave/ban/rejoin, Group retirement, all account cleanup paths, independent Event RSVP, mounted consuming web/native SDK controls and real CLI-to-localhost authenticated HTTP. No live providers or device behavior are claimed.
