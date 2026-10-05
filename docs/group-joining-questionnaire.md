# Group joining questionnaire

## Table of Contents

- [Admission and privacy](#admission-and-privacy)
- [Identity and retained answers](#identity-and-retained-answers)
- [Portable operations](#portable-operations)

## Admission and privacy

A Group admits an invited person immediately. The acceptance result reports
`joiningQuestionnaire` with `enabled`, `version`, `completed`, `shouldPrompt`,
`requiredCompletion`, `requiresCompletion` and `canAccessMemberContent`.
The designated form defaults to optional and is separate from immediate admission.
Owners may set `requiredCompletion: true`. An enabled required form gates only
Group-granted member content until current required answers are valid; submission
never repeats admission. Independent Event membership and other qualifying grants
remain unaffected. See [required onboarding](group-required-onboarding.md).

The current owner configures the form. Admitted, eligible members submit or edit
their own answers. Authors retain private read access after leaving or removal
while the Group exists. Current owners and moderators review private responses;
ordinary members cannot read another author's answers. Writes recheck live
account/Profile, current membership/role and active Group bans. Disabling the
form preserves definitions, answers and history while stopping prompts and edits.
Group deletion removes all form records; every supported account deletion path
immediately purges the author's personal records. Questionnaire records contain
no retained manager identity references.

## Identity and retained answers

There is exactly one designated joining form per Group. Up to 50 questions use
stable IDs and the seven core question types. Each question has a semantic
version. Its material fingerprint is the JSON encoding of type, required-answer
semantics and a sorted set of option values. Labels, question order and option
presentation order are cosmetic and preserve semantic versions. Type, option
value set or required-answer changes increment the version. Reusing a removed ID
continues its latest version; replacing an ID creates a distinct question.

Each answer retains the exact definition answered and its semantic version.
Editing appends a private history revision; it does not erase previous answers.
Current answers use at most 50 indexed lookups by Group, author, question ID and
semantic version. Materially changed questions cannot silently inherit an old
answer. Cosmetic changes and returning membership reuse current valid answers.
Omitted optional answers clear that current value and retain a history revision
with no answer. Required field validation applies to a voluntary submission; it
does not turn optional onboarding into a Group access gate.

Eligible current members receive current questions; former or Group-banned authors
receive only their last-submitted definitions and corresponding saved-version
answers, never new private Group questions. They retain paginated own history.

The current form contains bounded current questions, answers and last-submitted
`savedQuestions`. Retained revisions are read through cursor pagination, rather
than an unbounded history array or a scan of every version.

## Portable operations

Session clients use `groupQuestionnaires.queries.getJoiningQuestionnaire`,
`getJoiningQuestionnaireAccess`, `listJoiningQuestionnaireHistory` and
`listJoiningQuestionnaireAnswers`; mutations are `configureJoiningQuestionnaire`
and `submitJoiningQuestionnaire`. Shared `createGroupQuestionnaireHooks` injects
the consuming app's Convex SDK so subscriptions preserve its authenticated
provider. The access query returns only own entitlement booleans for safe landing
navigation, never question definitions or private answers.

REST uses `/api/v2/groups/{groupId}/joining-questionnaire`: GET reads the own form,
PUT configures it, PUT `/answers` submits the current configuration `version`, GET
`/history` pages retained own revisions (or `authorId` for managers), and GET
`/responses` pages manager review. Existing `groups` API-key read/write scope
applies. Stale submission versions reject with conflict and require a reload.

CLI uses `groups questionnaire get|status|configure|submit|history|responses`.
Configure requires `--enabled true|false --questions <json>`; submit requires
`--form-version <number> --answers <json>`. History supports `--author-id` for
current managers. Basic writes accept advertised `groupQuestionnaire.version: 1` or `2`; explicit
`--required-completion true|false` requires version `2` before mutation, and uncertain writes are not automatically retried. Legacy
invitation operations remain compatible without this capability.
