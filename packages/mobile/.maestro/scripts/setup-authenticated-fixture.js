function requirePreviewConvexUrl(value) {
  if (!value) {
    throw new Error('MAESTRO_E2E_CONVEX_URL is required');
  }

  if (!/^https:\/\/[a-z0-9-]+\.convex\.cloud\/?$/.test(value)) {
    throw new Error('Authenticated E2E requires a Convex cloud deployment URL');
  }
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

if (!E2E_FIXTURE_KEY || E2E_FIXTURE_KEY.length < 32) {
  throw new Error(
    'MAESTRO_E2E_FIXTURE_KEY must contain at least 32 characters'
  );
}

var convexUrl = requirePreviewConvexUrl(E2E_CONVEX_URL);
var response = http.post(convexUrl + '/api/mutation', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: 'e2e/mutations:createMobileFixture',
    args: { fixtureKey: E2E_FIXTURE_KEY },
    format: 'json',
  }),
});

if (!response.ok) {
  throw new Error('Could not create the authenticated E2E fixture');
}

var result = json(response.body);
if (result.status !== 'success' || !result.value || !result.value.loginCode) {
  throw new Error('The authenticated E2E fixture response was invalid');
}

// Store only the short-lived one-time code and cleanup identifiers. The
// reusable fixture key and resulting session cookie are never written to output.
output.authenticatedFixture = result.value;
