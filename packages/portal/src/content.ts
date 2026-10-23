export type Availability = 'Current' | 'Upcoming' | 'Proposed';
export interface Passage {
  id: string;
  title: string;
  text: string;
  code?: string;
  language?: string;
  keywords?: string[];
  references?: { title: string; href: string }[];
}
export interface Page {
  id: string;
  path: string;
  title: string;
  audience: string;
  version: string;
  availability: Availability;
  source: string;
  passages: Passage[];
}
export const guides: Page[] = [
  {
    id: 'integrator',
    path: '/v2/integrator',
    title: 'Read and create your first event',
    audience: 'Build',
    version: 'v2',
    availability: 'Current',
    source: 'convex/api/v2/routes/events.ts',
    passages: [
      {
        id: 'credentials',
        title: 'Choose an instance and credential',
        text: 'Use the HTTP-actions origin of your intended instance plus /api/v2. Obtain an API key from Settings → Account → API Keys in that instance. Keep the key in your terminal or secret manager. Never put an owner secret in a browser bundle. Source-verified examples require an instance running the matching API; hosted deployment and registry release are not established here.',
        keywords: ['authentication', 'auth', 'x-api-key'],
        code: 'export GROUPI_API_URL="https://YOUR-INSTANCE.convex.site/api/v2"\n# Set GROUPI_API_KEY privately in your terminal or secret manager.\ncurl --fail-with-body "$GROUPI_API_URL/profile" -H "x-api-key: $GROUPI_API_KEY"',
        language: 'sh',
      },
      {
        id: 'read-events',
        title: 'Read your events',
        text: 'First verify the account with GET /profile, then list accessible events. REST v2 returns resource bodies directly, rather than the v1 success/data wrapper.',
        code: 'curl --fail-with-body "$GROUPI_API_URL/events?pagination=cursor&limit=20" \\\n  -H "x-api-key: $GROUPI_API_KEY"',
        language: 'sh',
      },
      {
        id: 'empty-pages',
        title: 'Empty success and pagination',
        text: 'An empty list is a successful response. With pagination=cursor the envelope is {items: [], nextCursor: null}. Continue using the opaque nextCursor until it is null, including after an empty page. Do not parse or manufacture cursors. Without pagination, some operations retain legacy arrays; consult each operation.',
        keywords: ['pagination', 'next page', 'continuation'],
      },
      {
        id: 'create-event',
        title: 'Create one event',
        text: 'Generate and retain the request identifier before sending the request. The JSON response contains eventId. Fixed times need an explicit UTC offset; this minimal example creates an undated event.',
        code: 'REQUEST_ID=$(node -e \'console.log(Date.now()+"."+require("node:crypto").randomUUID())\')\ncurl --fail-with-body "$GROUPI_API_URL/events" \\\n  -H "x-api-key: $GROUPI_API_KEY" -H "Content-Type: application/json" \\\n  -H "Idempotency-Key: $REQUEST_ID" --data \'{"title":"Developer dinner"}\'',
        language: 'sh',
      },
      {
        id: 'uncertain-write',
        title: 'Recover an uncertain create',
        text: 'For this event creation example, retry an uncertain response with the same Idempotency-Key, same identity and identical body within 24 hours of its Unix-millisecond timestamp. A conflict or expired identifier requires inspection, not a new blind create. Other writes have operation-specific guarantees: inspect current state before deliberately resubmitting. Do not automatically retry arbitrary mutations.',
        keywords: ['Idempotency-Key', 'timeout', 'retry', 'replay'],
      },
      {
        id: 'authority',
        title: 'Account authority and credential bounds',
        text: 'A credential never grants more than the account’s current authority. Organizer and moderator roles belong to an event; a platform administrator is a separate role. A collection scope is not an event-specific grant. Verify distinct organizer and attendee identities independently with /profile; an attendee attempting organizer-only management must receive permission denied. 401 means credential/account eligibility; 403 means insufficient scope or current authority. Do not switch to an owner key to conceal the denial.',
      },
    ],
  },
];
guides.push(
  {
    id: 'contributor',
    path: '/v2/contributor',
    title: 'Run, test and submit a contribution',
    audience: 'Contribute',
    version: 'v2',
    availability: 'Current',
    source: 'package.json',
    passages: [
      {
        id: 'setup',
        title: 'Start with general programming prerequisites',
        text: 'Use Git, Node.js 22 or 24 and pnpm 10.12.1 (the root packageManager). React/TypeScript familiarity helps for UI work; Convex knowledge is introduced progressively. Clone the current repository and install its locked dependencies. A focused shared-package test does not require a live account or credentials.',
        code: 'git clone https://github.com/groupi-app/groupi.git\ncd groupi\ncorepack enable\npnpm install --frozen-lockfile',
        language: 'sh',
        keywords: ['contribute', 'prerequisites', 'Node version'],
      },
      {
        id: 'tests',
        title: 'Run one focused check',
        text: 'The shared GDL conformance suite is a useful first success with no service credentials. Run the workspace quality checks before submission. If pnpm reports an unsupported runtime, use Node 22 or 24; if the lock is stale, confirm the branch instead of rewriting it blindly. Humans can follow the repository development setup for servers; automated agents must use already-running services and must never run dev, start, build or Convex deployment commands.',
        code: 'pnpm --filter @groupi/shared exec vitest run src/gdl/conformance.test.ts\npnpm check\npnpm lint:tokens',
        language: 'sh',
      },
      {
        id: 'submit',
        title: 'Submit a reviewed contribution',
        text: 'Create a focused branch, explain the affected user flow and tests in your pull request, and follow CONTRIBUTING.md. Include a changeset for a user-facing change after agreeing its summary with the maintainer. Review permissions, compatibility and accessibility before requesting review. Never commit environment files or credentials.',
      },
    ],
  },
  {
    id: 'addons',
    path: '/v2/addons',
    title: 'Choose an add-on author path',
    audience: 'Build / Contribute',
    version: 'v2',
    availability: 'Current',
    source: 'docs/addon-framework.md',
    passages: [
      {
        id: 'source-handlers',
        title: 'Develop a source handler and component',
        text: 'Source contributors use defineAddonHandler, register the branded handler in the backend registry and register an explicit frontend AddonDefinition. Standard AddonContext scopes data to the current event and add-on. Lifecycle hooks cover enable/configuration, participant data and event changes; trusted rawCtx is privileged source code, not a sandbox for arbitrary downloaded code. Follow the existing bring-list handler as a bounded starting point, validate all configuration and add a component to the explicit catalog.',
        code: '// Generated from convex/addons/handlers/bringList.ts',
        language: 'typescript',
        keywords: ['handler', 'lifecycle', 'defineAddonHandler'],
      },
      {
        id: 'source-verification',
        title: 'Verify the scoped handler through a real fixture workflow',
        text: 'The source above is the current bring-list handler in convex/addons/handlers/bringList.ts. Its existing registry entry is in convex/addons/registry.ts and its frontend definition is in packages/web/features/addons/runtime/catalog.ts. Run the authenticated REST/CLI participation fixture to observe scoped configuration, participant validation and disabled-state cleanup without a live account. This fixture does not establish hosted notification or integration delivery.',
        code: 'pnpm --filter @groupi/convex exec vitest run tests/addon-participation-rest.test.ts',
        language: 'sh',
      },
      {
        id: 'templates',
        title: 'Author a reusable add-on template',
        text: 'An add-on template is a reusable definition; an event add-on uses its saved snapshot. Editing or deleting a template does not rewrite existing event configurations. For the CLI author path, first confirm addonAuthoring.version: 1 from the intended instance. Save this bounded portable definition as meal.json, then import it as a new private draft. Source/local availability is established; registry installation is not claimed.',
        code: '{\n  "schemaVersion": 1, "name": "Meal choice", "iconName": "listChecks",\n  "template": {"name": "Meal choice", "iconName": "listChecks", "sections": [\n    {"id": "meal", "title": "Meal", "layout": "form", "fields": [\n      {"id": "choice", "type": "select", "label": "Meal", "required": true, "options": ["Rice", "Pasta"]}\n    ]}\n  ]}\n}',
        language: 'json',
      },
      {
        id: 'template-first-success',
        title: 'Import, inspect and deliberately publish',
        text: 'Capture TEMPLATE_ID and saved version from the import response. Inspect the saved definition before publishing and enabling it on an event you may manage. Concurrent versions fail without applying the write. If a response is uncertain, get the definition before trying again. These commands use the current generated CLI reference.',
        code: 'groupi addons definitions import --file meal.json --format json\ngroupi addons definitions get TEMPLATE_ID --format json\ngroupi addons definitions publish TEMPLATE_ID --expected-version 1 --yes --format json\ngroupi addons enable EVENT_ID custom:TEMPLATE_ID --template-id TEMPLATE_ID --yes',
        language: 'sh',
      },
      {
        id: 'authorization',
        title: 'Check authorization and event isolation',
        text: 'Template ownership is independent of event organizer/moderator authority. Participant submissions use the authenticated identity, with no impersonation. Verify one event cannot read another event’s add-on data, and denied writes cause no side effects. A template is declarative data, not a dynamically installable arbitrary-code marketplace. send_webhook is unsupported for new authoring; configured actions can have side effects and must be inspected. See the existing authenticated REST participation and authoring fixtures for verification.',
      },
    ],
  },
  {
    id: 'cli',
    path: '/cli/0.1.0/guide',
    title: 'CLI and automation first success',
    audience: 'Build',
    version: 'cli-0.1.0',
    availability: 'Current',
    source: 'packages/cli/README.md',
    passages: [
      {
        id: 'installation',
        title: 'Use the verified source artifact',
        text: 'CLI 0.1.0 is available in this repository. Use Node 22 or 24 and the locked workspace installation. No registry publication is established by these docs; do not assume an npm beta is available. The local executable supplies the exact command catalog.',
        code: 'pnpm install --frozen-lockfile\nnode packages/cli/bin/groupi.js --version\nnode packages/cli/bin/groupi.js --help',
        language: 'sh',
        keywords: ['install', 'source'],
      },
      {
        id: 'credentials',
        title: 'Choose an instance, profile and identity',
        text: 'Choose both the REST v2 URL and authorization website from the same intended instance. After explicit browser login, verify the account before every sensitive workflow. Temporary environment keys must match GROUPI_API_KEY_PROFILE; --api-key-stdin reads a temporary key without saving it. Stored credentials use the OS keychain when available. Browser CLI authorization is distinct from delegated third-party sign-in.',
        code: 'groupi profile add development --api-url https://YOUR-INSTANCE.convex.site/api/v2 --web-url https://YOUR-APP\ngroupi --profile development auth login\ngroupi --profile development auth status --format json',
        language: 'sh',
      },
      {
        id: 'automation',
        title: 'Read and create using structured output',
        text: 'Use --format json and a trusted installed executable (or node packages/cli/bin/groupi.js from source). Exit codes: 0 success; 1 unexpected failure; 2 usage/validation/conflict/cancelled confirmation; 3 authentication/permission; 4 resource or endpoint missing; 5 network/rate-limit/unsupported-server/uncertain outcome. Inspect errors and the process exit status; JSON output does not make a failed process successful. Verify distinct organizer/attendee profiles using auth status. Retain a generated request identifier before creating; use the same identifier and unchanged arguments for an uncertain protected create.',
        code: 'groupi --profile development events list --limit 20 --format json\nREQUEST_ID=$(node -e \'console.log(Date.now()+"."+require("node:crypto").randomUUID())\')\ngroupi --profile development events create --title "Developer dinner" --request-id "$REQUEST_ID" --format json',
        language: 'sh',
        keywords: ['JSON', 'exit codes', 'automation'],
      },
      {
        id: 'pagination',
        title: 'Continue pages and recover failures',
        text: 'List commands support --limit and --cursor; --all explicitly retrieves all pages. Continue until nextCursor is null, including empty pages. A malformed continuation fails; preserve the reported error rather than treating incomplete data as a complete list. Writes are not automatically retried. After an uncertain unprotected write, inspect current server state before resubmission. auth logout --revoke revokes the selected stored credential; temporary keys are independent.',
        code: 'groupi --profile development events list --all --format json\ngroupi --profile development auth logout --revoke',
        language: 'sh',
      },
    ],
  },
  {
    id: 'architecture',
    path: '/v2/architecture',
    title: 'Understand the contribution boundaries',
    audience: 'Contribute',
    version: 'v2',
    availability: 'Current',
    source: 'docs/adr/0003-domain-owned-backend-operations.md',
    passages: [
      {
        id: 'boundaries',
        title: 'Domain-owned backend operations',
        text: 'Reusable operations live with their domain. Native Convex functions and versioned REST routes adapt verified identity to those operations; version folders own HTTP contracts, not business behavior. Each write transaction checks the actor’s current permissions. HTTP preflight alone cannot protect against authority changing between calls.',
      },
      {
        id: 'shared',
        title: 'Shared logic and platform UI',
        text: 'Cross-platform logic belongs in packages/shared, which never imports Next.js, Expo or React Native. Platform adapters supply navigation, storage and toast behavior. Web is client-only; live application data uses Convex useQuery/useMutation. Feature modules own their UI and hooks, and reusable presentation follows atoms, molecules, organisms and data-free templates.',
      },
    ],
  },
  {
    id: 'concepts',
    path: '/v2/concepts',
    title: 'Groupi concepts',
    audience: 'Build / Contribute',
    version: 'v2',
    availability: 'Current',
    source: 'GLOSSARY.md',
    passages: [
      {
        id: 'roles',
        title: 'Organizer, moderator and platform administrator',
        text: 'An organizer or moderator has a role in an individual event. A platform administrator has authority over an installation and is a separate concept. Event membership and RSVP are separate: joining does not confirm attendance. Current authority is checked for the operation being performed.',
      },
      {
        id: 'groups',
        title: 'Groups, invite lists and audiences',
        text: 'A Group is a formal membership community. An invite list is a private saved selection of existing users; editing it sends no invitation and changes no membership. An event audience determines visibility eligibility, independently of event membership, invitations and RSVP. A friend relationship is independent of shared Group membership.',
      },
    ],
  },
  {
    id: 'versions',
    path: '/v2/versions',
    title: 'Versions and availability',
    audience: 'Reference',
    version: 'v2',
    availability: 'Current',
    source: 'convex/api/v2/index.ts',
    passages: [
      {
        id: 'v2',
        title: 'REST v2',
        text: 'REST v2 is recommended for new integrations and is the CLI transport. Resource responses are direct JSON; page and delete envelopes are operation-specific. Source-generated references describe this checkout. They are not proof that a hosted instance has this release. Verify the target instance before executing examples.',
      },
      {
        id: 'v1',
        title: 'REST v1',
        text: 'REST v1 remains separately documented. Most resource successes wrap success/data. Do not assume path similarity means wire or authorization equivalence with v2. No retirement date or maintenance duration is currently promised. Select v1 explicitly for its generated reference.',
      },
    ],
  },
  {
    id: 'self-hosting',
    path: '/v2/self-hosting',
    title: 'Self-hosting status',
    audience: 'Build',
    version: 'v2',
    availability: 'Proposed',
    source: 'docs/self-hosting.md',
    passages: [
      {
        id: 'status',
        title: 'Proposed Linux Compose journey',
        text: 'A supported Linux Compose installation, enrollment, backup/restore and recovery journey is proposed and excluded from this implementation. Existing profile URL selection does not certify self-hosting. There is no runnable installation quickstart here. Self-hosting is not a launch dependency of this portal.',
      },
    ],
  },
  {
    id: 'sdks',
    path: '/v2/sdks',
    title: 'TypeScript and Python SDK availability',
    audience: 'Build',
    version: 'v2',
    availability: 'Upcoming',
    source: 'packages/sdk/README.md',
    passages: [
      {
        id: 'availability',
        title: 'Source candidates and published packages',
        text: 'The repository contains unpublished TypeScript and Python REST v2 SDK candidates. TypeScript supports Node.js 22 and 24; Python requires 3.11 or later and provides synchronous and asynchronous clients. Publication, hosted API compatibility and additional runtime support require separate release evidence. Use the source package instructions rather than assuming a registry package is available.',
      },
      {
        id: 'strict-types',
        title: 'Specific request and response types',
        text: 'Named SDK methods derive their inputs and results from the current OpenAPI operation catalog. TypeScript declarations and Python TypedDict models describe known fields, required arguments, literal choices and nullable results. Python includes runtime-importable schema types and py.typed metadata. Source freshness and positive and negative consumer type checks guard the generated contracts. Static types do not validate every response field from an arbitrary server at runtime.',
      },
      {
        id: 'read-events',
        title: 'Read Events with an explicit instance and credential',
        text: 'Use a server-side owner credential for this legacy API-key example. Keep it out of browser bundles. Iteration follows opaque cursors, including empty pages, and raises an error on malformed or repeated continuations. Use the explicit bounded-key or delegated credential mode when the intended workflow has narrower grants.',
        code: 'import { Groupi } from "@groupi/sdk";\nconst client = new Groupi({\n  instance: "https://YOUR-INSTANCE.convex.site",\n  credential: { type: "apiKey", key: process.env.GROUPI_API_KEY! },\n});\nfor await (const event of client.iterateEvents({ limit: 20 })) {\n  console.log(event.title);\n}',
        language: 'typescript',
      },
      {
        id: 'python',
        title: 'Use Python sync or async adapters',
        text: 'Groupi is synchronous; AsyncGroupi runs standard-library I/O in a worker thread. Cancelling an await cannot undo a write already sent by that worker. Connected sockets have bounded deadlines, while operating-system DNS resolution can exceed the deadline before a socket exists. The Python package README documents this runtime limit and uncertain-write errors.',
        code: 'from groupi_sdk import Groupi\nclient = Groupi(instance="https://YOUR-INSTANCE.convex.site", api_key=api_key)\nfor event in client.iterate_events(limit=20):\n    print(event["title"])',
        language: 'python',
      },
      {
        id: 'writes',
        title: 'Handle uncertainty without duplicate writes',
        text: 'Reads have bounded retries; writes never retry automatically. Errors preserve status and uncertainty. Persist an Event creation replay key and the unchanged body before sending, then deliberately reuse that key after an uncertain response within the server retention window. Inspect state before repeating other writes. Capability checks verify the selected instance; they never substitute a different host or a broader credential.',
      },
      {
        id: 'delegated',
        title: 'Keep delegated tokens bound to the approved client',
        text: 'DelegatedSession supports the approved native and confidential-web authorization-code profile with S256, state and an explicit issuer, audience, instance and client. Confidential web callers supply their own private-key assertion signer. Background refresh is separately consented and cannot expand access. Restored token state retains these bindings. The API adapter does not treat an unverified identity token as a signed-in user and never opens a browser or falls back to an owner key during an API call. See the SDK source README for the exact exchange and persistence interfaces.',
      },
      {
        id: 'evolution',
        title: 'Realtime and planned SDK improvements',
        text: 'The selected design adds optional Convex subscription modules while preserving the dependency-free REST core, with durable change delivery designed separately. Runtime response validation, browser realtime support, subscription credentials and the durable feed are future implementation targets. The evolution guide outlines resources, authentication, expiry, reconnects, limits, compatibility, replay, retention and release evidence; it does not announce available packages or endpoints.',
        references: [
          {
            title: 'Read the realtime and API/SDK evolution guide',
            href: '/v2/api-sdk-evolution',
          },
        ],
      },
    ],
  },
  {
    id: 'api-sdk-evolution',
    path: '/v2/api-sdk-evolution',
    title: 'Realtime and API/SDK evolution',
    audience: 'Build / Design',
    version: 'v2',
    availability: 'Proposed',
    source: 'docs/api-sdk-evolution-design.md',
    // Generated from the canonical outline; empty/stale source fails generation.
    passages: [],
  },
  {
    id: 'auth',
    path: '/v2/auth',
    title: 'Bounded access and delegated sign-in',
    audience: 'Build',
    version: 'v2',
    availability: 'Upcoming',
    source: 'docs/bounded-authorization.md',
    passages: [
      {
        id: 'availability',
        title: 'Verify the authorization capability first',
        text: 'Bounded credentials and delegated sign-in are source candidates in this repository. Verify the intended deployment before using them; this page does not establish a hosted release or configured OAuth issuer. Existing CLI browser login remains a separate flow. Credential bounds always intersect current account authority, and an authentication failure never switches to a broader key.',
      },
      {
        id: 'named-keys',
        title: 'Create a bounded key for selected Events',
        text: 'In Account settings, use bounded keys to choose a name, expiry, explicit actions and selected Events. User keys may instead explicitly select all current and future Events within current authority. Identity-only user keys need no Event selection. Copy the secret when it is shown once and keep it out of browser bundles and source control. Legacy collection keys remain separately labeled and have different permissions.',
        code: 'curl --fail-with-body "https://YOUR-INSTANCE.convex.site/api/v2/events" \\\n  -H "x-api-key: $GROUPI_BOUNDED_KEY"',
        language: 'sh',
      },
      {
        id: 'projections',
        title: 'Request each action and related field explicitly',
        text: 'Event reads, updates, member reads, discussion actions, file access and identity claims have separate actions. Write-only access returns identifiers, not discussion content or attachment URLs. File uploads require a granted eventId and files.upload; attachment expansion requires files.read. Event creation, membership administration, Groups and Invite Lists are not supported bounded actions. An unsupported operation fails closed; use the published action matrix before designing a workflow.',
      },
      {
        id: 'integrations',
        title: 'Give an integration its own discussion identity',
        text: 'An integration key selects Events and requires a current Organizer sponsor. The integration appears as the author of its own posts and replies and has no person record, membership or RSVP. It can edit or delete only its own discussion content. Sponsor authority is rechecked for each operation; sponsorship does not grant blanket access or impersonate the sponsor.',
      },
      {
        id: 'connections',
        title: 'Consent, background access and disconnect',
        text: 'The approved delegated profile uses authorization code with S256 PKCE, app-and-instance-specific identity, 60-second codes and 5-minute access tokens. Background access requires separate consent; rotating refresh is limited to 30 days and 7 days of inactivity. Initial clients are confidential web and native apps; browser-only refresh is unavailable. Connected Apps shows actions and resources and lets you disconnect. Disconnect stops future access but cannot delete copied data or terminate the app’s own session. Release readiness still requires issuer configuration and environment-specific verification.',
      },
      {
        id: 'revocation',
        title: 'Inspect and revoke access',
        text: 'Revoked or expired credentials fail without a grace period. Current membership and role loss reduce effective access even if a key has not expired. Owner-visible audit metadata is retained for 90 days and excludes raw credentials and resource bodies. Already committed writes and previously acquired file URLs are not undone by revocation.',
      },
    ],
  },
  {
    id: 'exports',
    path: '/v2/exports',
    title: 'Canonical docs for your own agent',
    audience: 'Build',
    version: 'v2',
    availability: 'Current',
    source: 'packages/portal/scripts/generate-content.ts',
    passages: [
      {
        id: 'formats',
        title: 'Public Markdown, text and JSON',
        code: 'curl --fail https://YOUR-PORTAL/llms.txt\ncurl --fail https://YOUR-PORTAL/exports/integrator.md\ncurl --fail https://YOUR-PORTAL/exports/search-index.json',
        language: 'sh',
        text: 'Download Markdown or plain text for any page, or retrieve the public JSON passage index and llms.txt. Exports use the same canonical corpus, versions, availability and source hashes as the portal. No account, hosted answer assistant or authenticated machine-query service is needed. Private events, credentials and repository planning are excluded.',
      },
    ],
  }
);
