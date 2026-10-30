import type { Page } from './content';

export const learningPages: Page[] = [
  {
    id: 'introduction',
    path: '/v2/introduction',
    title: 'Introduction',
    audience: 'Learn',
    version: 'v2',
    availability: 'Current',
    source: 'packages/portal/src/learning-content.ts',
    passages: [
      {
        id: 'build',
        title: 'Build with Groupi',
        text: 'Create an Event in your own account, preview a private Event widget, or connect another user through explicit delegated consent. Start with a credential-free simulation, then deliberately run local examples. REST v2 source support is not proof that your instance has deployed it.',
        references: [
          { title: 'Create your first Event', href: '/v2/integrator' },
          { title: 'Build a private Event widget', href: '/v2/event-widget' },
          { title: 'Build with an agent — Markdown', href: '/agents.md' },
        ],
      },
      {
        id: 'contributing',
        title: 'Contributing',
        keywords: [
          'contribution',
          'contributer',
          'local focused test',
          'Node version prerequisites',
        ],
        text: 'To contribute to Groupi, use CONTRIBUTING.md for repository setup, Node prerequisites, focused tests, pnpm check and pull requests. This Learn path is for integrations.',
        references: [
          {
            title: 'Contribution guide',
            href: 'https://github.com/groupi-app/groupi/blob/main/CONTRIBUTING.md',
          },
        ],
      },
    ],
  },
];

import { localExamples } from './learning-examples';
import type { Passage } from './content';
const reference = [
  { title: 'REST v2 exact schemas and operations', href: '/v2/reference/api' },
  { title: 'Download REST v2 OpenAPI', href: '/exports/openapi-v2.json' },
];
const evidence =
  'REST v2; source baseline ec33a44dce0ba9be828c3d8916d768ae81060a8c inspected 2026-10-30. Source support only. Deployment, issuer configuration and package registry availability are separately unverified. No SDK installation is required by these direct HTTP examples.';
export const firstEventPassages: Passage[] = [
  {
    id: 'outcome',
    title: 'Your finished Event — simulated',
    text: 'My first Groupi Event · Date not set · event_fixture_001. You will create one undated Event, read it back, and open it in the matching Groupi website. This finished card is a fixture, not an account result. The minimal source flow creates Organizer membership and a private-by-default Event without invitations or audience changes. No visibility field is sent: the create schema has none. Private-default and nonmember behavior still require verification on the intended deployed release.',
  },
  {
    id: 'credentials',
    title: '1. Choose an instance and credential',
    text:
      'Use your own account and an explicitly labeled legacy collection API key with events read/write and profile-read authority, obtained in Settings → Account → API Keys on the intended instance. Bounded keys and delegated access tokens cannot create Events. Select the HTTPS HTTP-actions origin plus /api/v2 and the separate matching website origin; never assume these hosts are interchangeable. Verify their pairing independently in the instance settings. Keep keys in local environment variables or a secret manager, never prompts, URLs, browser code, logs or the public simulation. ' +
      evidence,
    keywords: ['authentication', 'auth', 'x-api-key'],
    references: reference,
  },
  {
    id: 'read-events',
    title: '2. Verify your account and read Events',
    text: 'GET /profile with your legacy key returns a direct object including personId. Compare it privately against the intended account identifier, then GET /events?pagination=cursor&limit=20. Stop on the wrong account, wrong instance, 401 or 403 before any write. This own-account check is not a delegated identity check: delegated integrations use validated signed OIDC claims/userinfo, not global /profile.',
  },
  {
    id: 'empty-pages',
    title: 'Empty success and pagination',
    text: 'An empty list is a successful response: {"items":[],"nextCursor":null}. Keep following the opaque nextCursor until null, even after an empty page. The quickstart reads only the first page and does not claim that it lists every Event. REST v2 returns resource bodies directly, without the v1 success/data wrapper.',
    keywords: ['pagination', 'next page', 'continuation'],
  },
  {
    id: 'create-event',
    title: '3. Create one undated Event',
    text: 'Input is exactly {"title":"My first Groupi Event"}; title must be 1–200 characters. Persist a fresh <unix-ms>.<uuid-v4> request identity and the exact JSON body before POST /events with Idempotency-Key. Expected HTTP 201 body is {"eventId":"…","membershipId":"…"}. Do not add visibility, attendees, invitations or Group audiences. The examples below deliberately stop unless GROUPI_ALLOW_CREATE=yes is set locally after identity verification.',
  },
  {
    id: 'read-back',
    title: '4. Read back and open in Groupi',
    text: 'GET /events/{eventId} returns the Event object directly. Verify id and title match the retained request and chosenDateTime is null. Open the trusted matching website origin plus /event/{encodedEventId}, not the API origin. Done means one undated Event read back and a matching-instance link; report “verified” only after real permitted responses, otherwise “simulated” or “prepared”.',
    code: 'Expected local terminal output (illustrative identifiers):\nAccessible Events in first page: 0 (zero is success)\nVerified one undated Event: EVENT_ID My first Groupi Event\nOpen in Groupi: https://YOUR-APP/event/EVENT_ID',
    language: 'text',
  },
  {
    id: 'uncertain-write',
    title: 'Recover an uncertain create',
    text: 'A timeout can mean the create committed. Keep groupi-first-event.json and replay the same identity and unchanged payload within 24 hours of the request timestamp. These scripts retain state before the first write and reuse it after a lost response; after storing eventId they only read back. Editing the title, a different account/instance, a conflict or an expired identity stops the flow: inspect the account and retained request rather than blindly generating another create. Never automatically retry arbitrary mutations. Do not delete the state file to solve a failure.',
    keywords: ['Idempotency-Key', 'timeout', 'retry', 'replay'],
  },
  {
    id: 'authority',
    title: 'Wrong account or permission denied',
    text: 'A credential never grants more than current account authority. Organizer and Moderator are Event roles; a platform administrator is separate. 401 means credential/account eligibility; 403 means insufficient scope or current authority. Keep authorization failures as failures, with no owner-key fallback. A collection scope is not an Event-specific grant. Independent attendee/Organizer verification must use the appropriate identity mechanism for each credential mode.',
  },
  {
    id: 'run-locally',
    title: 'Run against my account',
    text: 'Copy one complete example below into a private local directory. TypeScript requires Node.js 22.18+ or 24 with native type stripping; Python requires Python 3.10+ standard library; cURL requires Bash, Python 3.10+ for safe JSON/state handling and curl 7.76+. These are runtime requirements, not registry-release claims. Set GROUPI_API_KEY privately; do not paste it into this portal. First omit GROUPI_ALLOW_CREATE to verify identity without writing. Only after approving the intended account, operation and matching origins, set it to yes and rerun the same file. HTTP redirects are rejected. Request state stays in groupi-first-event.json (owner-only file); keep it private. Do not run competing copies in the same directory.',
    code: 'export GROUPI_API_URL="https://YOUR-INSTANCE.convex.site/api/v2"\nexport GROUPI_WEB_URL="https://YOUR-APP"\nexport GROUPI_EXPECTED_PERSON_ID="YOUR_VERIFIED_PERSON_ID"\n# Independently verify these origins belong to your intended instance:\nexport GROUPI_CONFIRMED_API_URL="$GROUPI_API_URL"\nexport GROUPI_CONFIRMED_WEB_URL="$GROUPI_WEB_URL"\n# Set GROUPI_API_KEY privately. Do not enable shell tracing.\n# First run without GROUPI_ALLOW_CREATE. Then explicitly authorize one Event:\n# export GROUPI_ALLOW_CREATE=yes',
    language: 'sh',
  },
  ...(['typescript', 'python', 'curl'] as const).map(language => ({
    id: `local-${language}`,
    title: `Local ${language === 'typescript' ? 'TypeScript' : language === 'python' ? 'Python' : 'cURL'} example`,
    text: 'Complete direct HTTP example; local execution only. No unpublished SDK package is needed. Keep the state file for recovery and stop on authorization failures.',
    code: localExamples[language],
    language: language === 'curl' ? 'sh' : language,
  })),
  {
    id: 'cleanup',
    title: 'Keep or remove your test Event',
    text: 'Keep the Event if useful, or deliberately remove this exact test Event through the matching Groupi website after reviewing it. Cleanup is not automatic and must not remove a different Event. Revoke a temporary key in that instance’s API Key settings when finished. Retain the request record until the outcome is established, then securely remove local test state if no longer needed. Next build a private Event widget.',
    references: [
      { title: 'Build a private Event widget', href: '/v2/event-widget' },
      { title: 'Build with an agent — Markdown', href: '/agents.md' },
    ],
  },
];

learningPages.push({
  id: 'agents',
  path: '/v2/agents',
  title: 'Build with Groupi — agent guide',
  audience: 'Learn / agents',
  version: 'v2',
  availability: 'Current',
  source: 'packages/portal/src/learning-content.ts',
  passages: [
    {
      id: 'purpose',
      title: 'Purpose and evidence',
      text:
        'Help the user build with Groupi in their existing framework and preferred language. Choose TypeScript, Python or cURL examples without replacing their stack. Canonical pinned guide: /v2/agents.md; /agents.md serves this same v2 guide. ' +
        evidence,
      references: [
        { title: 'Pinned v2 Markdown guide', href: '/v2/agents.md' },
      ],
    },
    {
      id: 'tasks',
      title: 'Choose one integration task',
      text: 'First own-account Event: needs a legacy collection key and authority to create. Private Event widget: needs an existing readable Event and a private local rendering context. Group Events: needs legacy credentials and current eligible Group read authority; audience changes are a separate optional task. Event updates: needs events.update or legacy events-write and the current Event role. Connect another user: needs an eligible registered client, configured issuer, exact callback and explicit user consent. Follow only the task needed, then the exact API reference.',
      references: [
        { title: 'First own-account Event', href: '/v2/integrator.md' },
        { title: 'Private Event widget', href: '/v2/event-widget.md' },
        { title: 'Group Events', href: '/v2/group-events.md' },
        { title: 'Event updates', href: '/v2/event-updates.md' },
        { title: 'Connect another user', href: '/v2/connect-users.md' },
      ],
    },
    {
      id: 'identity',
      title: 'Select instance, account and credential mode',
      text: 'Establish the intended API origin, matching website, account, requested operation and existing user authorization before requests. Legacy own-account creation verifies GET /profile and personId. Bounded Event reads/updates require explicit actions and resource selection intersected with current authority; not all bounded keys have identity access. For delegated tokens, global /profile is denied: validate exact issuer/audience, state, PKCE S256 and nonce; use permitted signed OIDC claims/userinfo. openid alone gives an opaque app-and-instance-specific subject. A bounded key or delegated token cannot create an Event. Stop if the capability or authority is missing; never substitute an owner key.',
      references: [
        {
          title: 'Credential modes and supported actions',
          href: '/exports/auth.md',
        },
      ],
    },
    {
      id: 'execution',
      title: 'Simulation, preparation and real execution',
      text: 'Documentation access is not account authorization. Run in the portal changes fixtures only and accepts no key. Copy local examples for real work; keep credentials in the user’s local environment or secret manager, never prompts, URLs, browser bundles or logs. An agent must establish authorization separately before live writes, invitations, audience changes, app registration or publication. Do not install an assumed SDK package: registry availability is unverified; use the direct HTTP examples with their stated runtimes. Report a prepared integration, a simulation and verified real success distinctly.',
    },
    {
      id: 'recovery',
      title: 'Recovery and privacy',
      text: 'For POST /events retain the exact payload and <unix-ms>.<uuid-v4> Idempotency-Key before sending. On uncertain response replay unchanged within 24 hours; conflict, expiry or changed account/instance means inspect, not a blind new create. Other writes require operation-specific inspection rather than assuming this guarantee. 401/403 remain failures. An Event read grant is not permission to republish; the first widget is private/local. No automatic invitations, cleanup, audience changes or background consent.',
    },
    {
      id: 'completion',
      title: 'Check completion against the task',
      text: 'First Event: one undated Event, matching permitted read-back and correct website /event/{id} link, retained replay identity, no invitations. Widget: private local display of permitted data with loading, empty, success and error states; no realtime promise. Group recipe: permitted upcoming/undated previews or empty success, correct pagination and no audience mutation; sharing is a separate authorized task. Update: permitted read-back matches the requested fields, or explicitly report that read permission is missing. Delegation: validated identity and permitted selected-resource operation; disconnect denial verified only when authorized. Record the actual environment and evidence; source availability is not deployed acceptance.',
      references: [
        { title: 'REST v2 Markdown reference', href: '/exports/api-v2.md' },
        { title: 'REST v2 OpenAPI schemas', href: '/exports/openapi-v2.json' },
        { title: 'Availability and evidence', href: '/exports/versions.md' },
      ],
    },
  ],
});

learningPages.push({
  id: 'group-events',
  path: '/v2/group-events',
  title: 'Read Group Events',
  audience: 'Learn / recipes',
  version: 'v2',
  availability: 'Current',
  source: 'convex/api/v2/routes/groupEventAudiences.ts',
  passages: [
    {
      id: 'outcome',
      title: 'Outcome and prerequisites',
      text:
        'A currently eligible Group member can discover the shared upcoming or undated Event. Group managers receive no Event-management role from sharing. Use a legacy collection key with Group read scope and current eligible Group membership/onboarding to read existing shared Event previews. No initial mutation is needed. Optional sharing requires separate Event/Group write scopes, current Event Organizer authority and current Group sharing permission. Group audience management is not an events.read/events.update bounded or delegated capability. Separately scoped delegated community workflows do not authorize this management recipe. ' +
        evidence,
    },
    {
      id: 'read',
      title: '1. Read eligible Group Event previews',
      text: 'GET /groups/{groupId}/events?limit=20 returns {items:[{event,canWithdraw}],nextCursor}. The event is a safe logistics projection, not the full Event-detail schema. Follow opaque nextCursor until null, even when items is empty. Pages omit past or currently unreadable Events; an undated Event can be discoverable. Readability does not establish permission to publish these previews publicly.',
      code: 'curl --fail-with-body --max-time 30 \\\n  "$GROUPI_API_URL/groups/$GROUP_ID/events?limit=20" \\\n  -H "x-api-key: $GROUPI_API_KEY"',
      language: 'sh',
    },
    ...(['typescript', 'python', 'curl'] as const).map(language => ({
      id: `group-${language}`,
      title: `Complete ${language} Group read`,
      text: 'Use the first Event local instance/account setup and a legacy collection key permitting profile and Group reads. Set GROUPI_GROUP_ID to the intended Group. Save the complete script as recipe.mts (Node.js 22.18+ or 24), recipe.py (Python 3.10+) or recipe.sh (Bash, Python 3.10+, curl 7.76+). Run node recipe.mts, python3 recipe.py or bash recipe.sh. It follows opaque cursors even after an empty page and performs no writes. Private previews stay in your terminal; expected final output: Group previews: N (zero is success).',
      code: groupExamples[language],
      language: language === 'curl' ? 'sh' : language,
    })),
    {
      id: 'share',
      title: 'Optional: explicitly share a separate Event',
      text: 'Verify own-account identity and matching instance as in the first Event lesson. Inspect GET /events/{eventId}/audiences and the intended Group before changing its audience. With explicit user approval, POST /events/{eventId}/audiences/groups/{groupId}; this request has path identifiers and no JSON body. Expected HTTP 200 is {eventId,groupId,shared:true}. The Group policy chooses MANAGERS or MEMBERS; being an Event Organizer alone is insufficient. Never reconfigure Group policy merely to overcome denial.',
      code: 'curl --fail-with-body --max-time 30 -X POST \\\n  "$GROUPI_API_URL/events/$EVENT_ID/audiences/groups/$GROUP_ID" \\\n  -H "x-api-key: $GROUPI_API_KEY"',
      language: 'sh',
      references: reference,
    },
    {
      id: 'lifecycle',
      title: 'Group Event lifecycle and participation',
      text: 'Whole-Group sharing creates no invitation, membership or RSVP. Event admission is separate; an approved application creates Attendee membership with Pending RSVP under current audience/reviewer rules. Departure, bans, required-onboarding loss or withdrawal ends only the affected Group grant. Other audiences and independent Event membership/RSVP remain. Completed Events stop appearing in upcoming previews; a date poll needing new dates is a different lifecycle state.',
    },
    {
      id: 'recovery',
      title: 'Verify and recover deliberately',
      text: 'Done: the intended Group’s permitted page shows appropriate upcoming/undated previews or an explicit empty success, opaque pagination is respected, and no invitation, membership, RSVP or audience mutation was emitted. If the user separately authorized sharing, verify the intended audience grant by permitted read-back. On uncertain sharing or withdrawal, inspect current audiences before resubmitting; do not assume Event-create Idempotency-Key guarantees. 401/403 stops without credential fallback. A separately authorized DELETE /events/{eventId}/audiences/groups/{groupId} returns {eventId,groupId,shared:false}; it withdraws only that grant, not existing participation.',
      references: [
        {
          title: 'First Event identity and local setup',
          href: '/v2/integrator',
        },
        { title: 'Event updates', href: '/v2/event-updates' },
      ],
    },
  ],
});

import {
  widgetExamples,
  groupExamples,
  updateExamples,
  delegatedReadExamples,
} from './learning-examples';
learningPages.push({
  id: 'event-widget',
  path: '/v2/event-widget',
  title: 'Build a private Event widget',
  audience: 'Learn',
  version: 'v2',
  availability: 'Current',
  source: 'packages/portal/src/learning-content.ts',
  passages: [
    {
      id: 'outcome',
      title: 'Finished private widget — simulated',
      text:
        'My first Groupi Event · Date not set · Open in Groupi. The finished preview above/below uses fixture data only. Your goal is the same small card in your existing framework, backed by a permitted Event read in a private local context. This is not a public website feed and not a realtime subscription. ' +
        evidence,
    },
    {
      id: 'connect',
      title: '1. Connect locally, not in the browser',
      text: 'Prerequisites: an existing Event you may read, its ID, matching API and website origins, and one local runtime from the first Event lesson. Use the same identity-verified own-account local configuration for the examples below; GROUPI_ALLOW_CREATE is not needed because they only read. A separately designed bounded reader needs events.read and selected Event authority; do not reuse the legacy /profile preflight for a delegated token. Keep the key in the local process, never the browser bundle. Any development service must be loopback-only (127.0.0.1 or ::1), with no public tunnel, host binding, public cache or hosted proxy.',
      references: [
        {
          title: 'Local instance and account setup',
          href: '/v2/integrator#run-locally',
        },
        { title: 'Delegated identity branch', href: '/v2/connect-users' },
      ],
    },
    {
      id: 'retrieve',
      title: '2. Retrieve only the Event you need',
      text: 'Optionally set GROUPI_EVENT_ID locally, then GET /events/{eventId}. The direct response has id, title and nullable chosenDateTime; it is not {event:{…}}. Keep only the display fields. A successful empty list means no selected Event to display, not a failed connection. A denied single-Event request is an error, not an empty result. Leave GROUPI_EVENT_ID unset to follow opaque cursors until the first accessible Event, or explicit empty success only when nextCursor is null. An empty intermediate page is not an empty result. Each complete example starts a loopback-only local HTTP service; cURL performs the upstream requests with Python providing the local display server.',
      code: 'export GROUPI_EVENT_ID="YOUR_PERMITTED_EVENT_ID"\n# Run exactly one local example below after setting the verified instance/account variables.\n# Expected local projection, illustrative only:\n# {"id":"EVENT_ID","title":"My first Groupi Event","chosenDateTime":null}',
      language: 'sh',
      references: reference,
    },
    ...(['typescript', 'python', 'curl'] as const).map(language => ({
      id: `widget-${language}`,
      title: `Private widget ${language === 'typescript' ? 'TypeScript' : language === 'python' ? 'Python' : 'cURL'} complete example`,
      text: 'Complete local read-only widget. Use the first Event setup variables, but GROUPI_ALLOW_CREATE is not used. Save and run the matching script; open its printed http://127.0.0.1:PORT/ URL on this computer. The API key stays in the local server process, never in browser code. Ctrl-C stops the server. Never forward the port.',
      code: widgetExamples[language],
      language: language === 'curl' ? 'sh' : language,
    })),
    {
      id: 'display',
      title: '3. Render four visible states',
      text: 'Loading: announce that the private Event is being retrieved. Empty: show “No Event selected” for an empty successful collection. Success: display the title, “Date not set” for null, and the matching website /event/{encodedId} link. Error: show a safe failure and an explicit retry action; do not show stale private data after a denied read. Insert title as text, never raw HTML. The complete examples above serve this working display without a framework. Use Refresh for each new read. Adapt it to your preferred framework without changing the secret boundary; changing TypeScript/Python/cURL changes only the local transport.',
    },
    {
      id: 'privacy',
      title: '4. Keep your Event widget private',
      text: 'Your read access is not permission to republish Event data. Keep the local output and preview private; do not put it in static public files, browser storage, a public feed or a shared log. Public publishing needs a separate design, explicit permission and appropriate data/authorization boundaries. Refresh is an explicit read, not a realtime guarantee. Never add a public proxy holding an owner key.',
    },
    {
      id: 'done',
      title: 'Check your private result',
      text: 'Done: the permitted title and date state match read-back; the Open in Groupi destination uses the matching website; loading, empty, success and error are visible and distinguishable; real credentials are absent from browser code and public assets. On 401/403 or lost access clear the private card and stop; recheck the intended instance, account and permission without escalating credentials. No write recovery is needed because this lesson only reads. Report fixture versus verified results honestly.',
      references: [
        { title: 'Group Events recipe', href: '/v2/group-events' },
        { title: 'Event updates recipe', href: '/v2/event-updates' },
        { title: 'Build with an agent — Markdown', href: '/agents.md' },
      ],
    },
  ],
});

learningPages.push({
  id: 'event-updates',
  path: '/v2/event-updates',
  title: 'Update an Event safely',
  audience: 'Learn / recipes',
  version: 'v2',
  availability: 'Current',
  source: 'convex/api/v2/schemas/events.ts',
  passages: [
    {
      id: 'outcome',
      title: 'Outcome and authority',
      text:
        'Change the title of an existing Event and, if separately permitted, read it back. Use a legacy events-write key or a bounded/delegated credential with events.update on the selected Event. Current Moderator-or-higher authority is required; date changes retain any stricter Organizer-only policy. A write-only grant acknowledges {eventId} but does not permit read-back or disclose existing content. ' +
        evidence,
    },
    {
      id: 'update',
      title: '1. Choose a supported field',
      text: 'PATCH /events/{eventId} accepts a nonempty object with title (1–200), description (up to 5000), location (up to 500), potentialDateTimeOptions or nullable reminderOffset. Do not invent visibility, expectedVersion or If-Match support. Date option starts/ends need explicit UTC offsets; do not silently replace date options in this title lesson. Verify identity using the chosen credential mode, inspect permitted current state, and obtain authorization for the exact change before sending {"title":"Planning dinner"}.',
      code: 'curl --fail-with-body --max-time 30 -X PATCH \\\n  "$GROUPI_API_URL/events/$EVENT_ID" \\\n  -H "x-api-key: $GROUPI_API_KEY" -H "Content-Type: application/json" \\\n  --data-binary \'{"title":"Planning dinner"}\'\n# For an explicitly delegated flow use only Authorization: Bearer, never both credentials.',
      language: 'sh',
      references: reference,
    },
    ...(['typescript', 'python', 'curl'] as const).map(language => ({
      id: `update-${language}`,
      title: `Complete ${language} title update`,
      text: 'This own-account variant requires a legacy key with profile-read, Event-read and Event-write permissions plus current Event management authority. Use the first Event local setup; set GROUPI_EVENT_ID and GROUPI_EVENT_TITLE to the exact approved change. Same runtimes as that lesson; save as recipe.mts/.py/.sh and run node/python3/bash respectively. Initially omit GROUPI_ALLOW_UPDATE: identity and read succeed, then the script stops without writing. Set GROUPI_ALLOW_UPDATE=yes only after approval. Each execution sends at most one PATCH; never rerun automatically after a timeout. Expected output: Verified title update: EVENT_ID TITLE. This is not the write-only or delegated variant.',
      code: updateExamples[language],
      language: language === 'curl' ? 'sh' : language,
    })),
    {
      id: 'verify',
      title: '2. Verify a permitted read-back',
      text: 'The bounded/delegated v2 acknowledgement is HTTP 200 {eventId}; legacy responses follow the exact operation reference. If events.read and current authority permit it, GET /events/{eventId} and compare title. Done means the intended field matches, with no unrelated mutation. If read permission is absent, report only the acknowledgement and missing verification; do not escalate to an owner key.',
    },
    {
      id: 'recovery',
      title: 'Recover without overwriting another change',
      text: 'Do not assume Idempotency-Key protects PATCH. After a timeout inspect the current permitted state and resolve concurrent changes with the user before deliberately resubmitting. A read-before-write is not an atomic concurrency guarantee. Keep 401/403 as failures, stop on lost role or scope, and never silently replace another user’s update. Any date/add-on lifecycle side effects remain canonical server behavior.',
      references: [
        { title: 'Credential modes and grants', href: '/v2/auth' },
        { title: 'Connect another user', href: '/v2/connect-users' },
      ],
    },
  ],
});

learningPages.push({
  id: 'connect-users',
  path: '/v2/connect-users',
  title: 'Connect another user',
  audience: 'Learn / recipes',
  version: 'v2',
  availability: 'Upcoming',
  source: 'docs/delegated-sign-in.md',
  passages: [
    {
      id: 'outcome',
      title: 'Outcome and prerequisites',
      text:
        'An explicitly consenting user connects an eligible Developer app to selected Events on one configured instance. This is not the own-account API-key quickstart. Prerequisites are a verified deployed issuer, registered eligible app, exact registered callback and approved client type. Registration, wider-access review and consent are separate actions requiring authorization; receiving this guide performs none of them. New apps are owner-only for testing until eligible for wider access. ' +
        evidence,
    },
    {
      id: 'protocol',
      title: '1. Complete the supported consent protocol',
      text: 'Use authorization code with PKCE S256, exact issuer and API audience validation, callback state and ID-token nonce verification. Discover protocol endpoints only from the trusted pinned issuer under /oauth; never follow arbitrary credential redirects or switch instances on failure. Confidential web clients use private_key_jwt with their private key kept local/server-side; native clients use the system browser and no token-endpoint secret. Exact callback rules apply. Implicit, password, client-credentials and browser-only refresh clients are outside this profile. Preserve the user’s existing framework and use its audited OIDC client rather than inventing a token parser.',
      references: [{ title: 'Authorization public guide', href: '/v2/auth' }],
    },
    {
      id: 'implementation-gate',
      title: 'Implementation gate — sign-in is not complete',
      text: 'Full runnable connection setup is not yet supplied here. The source SDK DelegatedSession creates state, nonce and PKCE S256 and checks exchange state, but explicitly does not consume or verify identity ID tokens. Its successful token exchange is not verified sign-in. A complete tutorial still needs a selected, audited OIDC client integrated with the exact callback, signed ID-token verification against pinned issuer keys, client audience, expiry and nonce checks, and an explicitly authorized configured issuer/app. Do not substitute decoded JWT claims, a preobtained bearer, environment assertions or global /profile for this missing verification. The examples below are complete post-consent resource reads only; they do not meet the end-to-end connection done condition. Issuer configuration, app registration and live consent remain separately gated. No unpublished npm/PyPI install is required or claimed.',
      references: [
        {
          title: 'Delegated source contract and verification limits',
          href: 'https://github.com/groupi-app/groupi/blob/ec33a44dce0ba9be828c3d8916d768ae81060a8c/docs/delegated-sign-in.md',
        },
      ],
    },
    {
      id: 'identity',
      title: '2. Verify permitted identity',
      text: 'Do not call global REST /profile with a delegated credential. openid provides an opaque app-and-instance-specific subject through validated signed ID-token claims; display name and email require independent identity.display-name and identity.email consent. Pin the issuer and account selected in consent. An identity-only token has no Event API actions. Never infer a global personId or reuse the legacy expected-personId check from the own-account scripts.',
    },
    {
      id: 'read',
      title: '3. Read one selected Event',
      text: 'After the user explicitly grants events.read and selects the Event (or explicitly selects all current and future Events), send exactly one Authorization: Bearer credential to the pinned REST v2 resource. GET /events/{eventId} returns the permitted direct Event projection. Current membership and grant state are still enforced. Missing/expired/revoked consent returns failure; never attach an owner key, launch a consent popup or silently choose broader resources as fallback.',
      code: 'curl --fail-with-body --max-time 30 \\\n  "$GROUPI_API_URL/events/$EVENT_ID" \\\n  -H "Authorization: Bearer $GROUPI_ACCESS_TOKEN"\n# Token stays local. Do not use x-api-key alongside Bearer or add -L.',
      language: 'sh',
      references: reference,
    },
    ...(['typescript', 'python', 'curl'] as const).map(language => ({
      id: `delegated-${language}`,
      title: `Post-consent ${language} resource read`,
      text: 'Not a connection tutorial or identity check. Run only after your audited OIDC client completes the protocol and establishes the intended issuer/subject and explicit events.read grant. Set GROUPI_ISSUER to the confirmed https://INSTANCE/oauth issuer, GROUPI_API_URL and GROUPI_CONFIRMED_API_URL to its /api/v2 resource, GROUPI_EVENT_ID to the selected Event, and GROUPI_ACCESS_TOKEN privately from that verified session. No legacy-key variables are used. Save as delegated-read.mts/.py/.sh and run node/python3/bash with the stated runtime. Expected private terminal output is the direct {id,title,chosenDateTime} projection. A denied request remains an error; the script never creates an Event or starts consent.',
      code: delegatedReadExamples[language],
      language: language === 'curl' ? 'sh' : language,
    })),
    {
      id: 'actions',
      title: 'Supported actions are explicit',
      text: 'Event read and update, member read, discussion actions and file access have distinct actions and resource checks. Event creation and deletion, invitations and general membership administration are not inferred from events.read/events.update. A selected community/Discord grant, where separately deployed and consented, is a different capability, not blanket Group management. An unsupported delegated create fails closed; stop and explain the missing capability instead of changing credentials. events.update still requires current Event management authority and returns only {eventId}; file expansion requires its own permission.',
    },
    {
      id: 'disconnect',
      title: '4. Handle expiry and disconnect',
      text: 'Access tokens last five minutes. Background access requires separate offline_access consent; rotating refresh has a 30-day absolute and seven-day inactivity ceiling. Codes are single-use and short-lived; do not blindly replay an uncertain token exchange. Use the protocol client’s documented recovery, and request fresh consent only when explicitly authorized. Disconnect in Connected Apps stops future delegated access after committed revocation, but does not erase copied data or terminate the app’s own session. Already committed writes and acquired file URLs are not undone.',
    },
    {
      id: 'done',
      title: 'Check the connected result',
      text: 'Done: validated instance-specific identity, the expressly granted selected-Event read returns permitted data, denied actions remain denied, and the app exposes disconnect handling without claiming that it deletes copied information. If authorized to test revocation, observe a later resource request denied after disconnect; otherwise record that live gate as unverified. Never claim issuer configuration, security review or deployed acceptance from source examples alone.',
      references: [
        { title: 'Private Event widget', href: '/v2/event-widget' },
        { title: 'Update a permitted Event', href: '/v2/event-updates' },
      ],
    },
  ],
});
