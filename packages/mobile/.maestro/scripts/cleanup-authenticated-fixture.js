if (output.authenticatedFixture) {
  var fixture = output.authenticatedFixture;
  var convexUrl = E2E_CONVEX_URL.endsWith('/')
    ? E2E_CONVEX_URL.slice(0, -1)
    : E2E_CONVEX_URL;
  var response = http.post(convexUrl + '/api/mutation', {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'e2e/mutations:cleanupTestData',
      args: {
        fixtureKey: E2E_FIXTURE_KEY,
        userIds: [fixture.userId],
        personIds: [fixture.personId],
        eventIds: [fixture.eventId],
        postIds: [fixture.postId],
        inviteIds: [],
        membershipIds: [fixture.membershipId],
        verificationIdentifiers: [fixture.loginCode],
      },
      format: 'json',
    }),
  });

  if (!response.ok) {
    throw new Error('Authenticated E2E fixture cleanup failed');
  }

  var result = json(response.body);
  if (result.status !== 'success' || !result.value || !result.value.success) {
    throw new Error('Authenticated E2E fixture cleanup was incomplete');
  }
}
