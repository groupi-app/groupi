import { test, expect } from '../../fixtures/base.fixture';

test('shows line breaks and blank lines in a saved event description', async ({
  authenticatedPage,
  authenticatedUser,
  seeder,
}) => {
  const description = 'Bring a snack.\nDoors open at 6.\n\nSee you there!';
  const personId = authenticatedUser.personId;
  if (!personId) throw new Error('The event fixture needs an onboarded user.');

  const { eventId } = await seeder.createEvent({
    creatorPersonId: personId,
    title: 'Multiline description test',
    description,
    chosenDateTime: Date.now() + 86_400_000,
  });

  await authenticatedPage.goto(`/event/${eventId}`);

  const rendered = authenticatedPage.getByTestId('event-description');
  await expect(rendered).toBeVisible();
  await expect(rendered).toHaveCSS('white-space', 'pre-wrap');
  expect(await rendered.innerText()).toBe(description);
});
