# Read and create your first event

v2 · Current · Source: convex/api/v2/routes/events.ts

Source availability does not establish hosted deployment or registry publication.

## Choose an instance and credential
Canonical passage: /v2/integrator#credentials

Use the HTTP-actions origin of your intended instance plus /api/v2. Obtain an API key from Settings → Account → API Keys in that instance. Keep the key in your terminal or secret manager. Never put an owner secret in a browser bundle. Source-verified examples require an instance running the matching API; hosted deployment and registry release are not established here.

```sh
export GROUPI_API_URL="https://YOUR-INSTANCE.convex.site/api/v2"
# Set GROUPI_API_KEY privately in your terminal or secret manager.
curl --fail-with-body "$GROUPI_API_URL/profile" -H "x-api-key: $GROUPI_API_KEY"
```

## Read your events
Canonical passage: /v2/integrator#read-events

First verify the account with GET /profile, then list accessible events. REST v2 returns resource bodies directly, rather than the v1 success/data wrapper.

```sh
curl --fail-with-body "$GROUPI_API_URL/events?pagination=cursor&limit=20" \
  -H "x-api-key: $GROUPI_API_KEY"
```

## Empty success and pagination
Canonical passage: /v2/integrator#empty-pages

An empty list is a successful response. With pagination=cursor the envelope is {items: [], nextCursor: null}. Continue using the opaque nextCursor until it is null, including after an empty page. Do not parse or manufacture cursors. Without pagination, some operations retain legacy arrays; consult each operation.

## Create one event
Canonical passage: /v2/integrator#create-event

Generate and retain the request identifier before sending the request. The JSON response contains eventId. Fixed times need an explicit UTC offset; this minimal example creates an undated event.

```sh
REQUEST_ID=$(node -e 'console.log(Date.now()+"."+require("node:crypto").randomUUID())')
curl --fail-with-body "$GROUPI_API_URL/events" \
  -H "x-api-key: $GROUPI_API_KEY" -H "Content-Type: application/json" \
  -H "Idempotency-Key: $REQUEST_ID" --data '{"title":"Developer dinner"}'
```

## Recover an uncertain create
Canonical passage: /v2/integrator#uncertain-write

For this event creation example, retry an uncertain response with the same Idempotency-Key, same identity and identical body within 24 hours of its Unix-millisecond timestamp. A conflict or expired identifier requires inspection, not a new blind create. Other writes have operation-specific guarantees: inspect current state before deliberately resubmitting. Do not automatically retry arbitrary mutations.

## Account authority and credential bounds
Canonical passage: /v2/integrator#authority

A credential never grants more than the account’s current authority. Organizer and moderator roles belong to an event; a platform administrator is a separate role. A collection scope is not an event-specific grant. Verify distinct organizer and attendee identities independently with /profile; an attendee attempting organizer-only management must receive permission denied. 401 means credential/account eligibility; 403 means insufficient scope or current authority. Do not switch to an owner key to conceal the denial.
