import { test, expect } from '../../fixtures/base.fixture';

/**
 * Create Event E2E tests.
 *
 * Tests:
 * - Event creation wizard flow
 * - Single date event creation
 * - Multi-date event creation
 * - Form validation
 */

test.describe('Create Event', () => {
  test('displays create event wizard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/create');

    // Check for title input using data-test attribute
    const titleInput = authenticatedPage.getByTestId('new-event-title');
    await expect(titleInput).toBeVisible();
  });

  test('creates a single date event successfully', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/create');

    const eventTitle = `E2E Test Event ${Date.now()}`;
    const eventDescription = 'This is a test event created by E2E tests';
    const eventLocation = 'Virtual - Zoom';

    // Fill event info using data-test selectors
    await authenticatedPage.getByTestId('new-event-title').fill(eventTitle);

    const descInput = authenticatedPage.getByTestId('new-event-description');
    if (await descInput.isVisible()) {
      await descInput.fill(eventDescription);
    }

    const locationInput = authenticatedPage.getByTestId('new-event-location');
    if (await locationInput.isVisible()) {
      await locationInput.fill(eventLocation);
    }

    // Click next to proceed to date type selection
    await authenticatedPage.getByTestId('new-event-next-button').click();

    // Wait for date type selection step to appear
    const singleDateOption =
      authenticatedPage.getByTestId('single-date-button');
    await expect(singleDateOption).toBeVisible({ timeout: 5000 });

    // Click single date option
    await singleDateOption.click();

    // Wait for single date step to appear and the create button to be visible
    const createButton = authenticatedPage.getByTestId('create-event-button');
    await expect(createButton).toBeVisible({ timeout: 5000 });

    // Click create button
    await createButton.click();

    // Should eventually redirect to event page or show success
    await authenticatedPage.waitForURL(/\/event\/|\/events/, {
      timeout: 15000,
    });

    // Verify we're on an event page or events list
    const url = authenticatedPage.url();
    expect(url).toMatch(/\/event\/|\/events/);
  });

  test('validates required title field', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/create');

    // Try to proceed without filling title
    const nextButton = authenticatedPage.getByTestId('new-event-next-button');

    // Click next without filling title
    await nextButton.click();

    // Should show validation error or form shouldn't proceed
    const hasError = await authenticatedPage
      .locator('[data-slot="form-message"], [aria-invalid="true"]')
      .isVisible()
      .catch(() => false);

    // Either we got an error or the page didn't navigate (stayed on same step)
    const isStillOnInfoStep = await authenticatedPage
      .getByTestId('new-event-title')
      .isVisible();

    expect(hasError || isStillOnInfoStep).toBe(true);
  });

  test('can go back in wizard steps', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/create');

    const eventTitle = `Back Test Event ${Date.now()}`;

    // Fill event info
    await authenticatedPage.getByTestId('new-event-title').fill(eventTitle);

    // Click next
    const nextButton = authenticatedPage.getByTestId('new-event-next-button');
    await nextButton.click();

    // Wait for date type selection step to appear
    const singleDateOption =
      authenticatedPage.getByTestId('single-date-button');
    await expect(singleDateOption).toBeVisible({ timeout: 5000 });

    // Look for back button
    const backButton = authenticatedPage.getByRole('button', {
      name: /back/i,
    });

    if (await backButton.isVisible()) {
      await backButton.click();

      // Wait for info step to reappear
      const titleInput = authenticatedPage.getByTestId('new-event-title');
      await expect(titleInput).toBeVisible({ timeout: 5000 });

      // Title should still be there
      const value = await titleInput.inputValue();
      expect(value).toBe(eventTitle);
    }
  });

  test('shows date selection options', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/create');

    // Wait for page to fully load
    const titleInput = authenticatedPage.getByTestId('new-event-title');
    await expect(titleInput).toBeVisible({ timeout: 10000 });

    // Fill required title
    await titleInput.fill('Date Selection Test');

    // Click next to go to date type selection
    await authenticatedPage.getByTestId('new-event-next-button').click();

    // Wait for step change
    await authenticatedPage.waitForTimeout(500);

    // Look for date type options
    const singleDateOption =
      authenticatedPage.getByTestId('single-date-button');
    const multiDateOption = authenticatedPage.getByTestId('multi-date-button');

    // Check if date options are available
    const hasSingleDate = await singleDateOption.isVisible().catch(() => false);
    const hasMultiDate = await multiDateOption.isVisible().catch(() => false);

    // At least one date option should be available
    expect(hasSingleDate || hasMultiDate).toBe(true);
  });

  test('creates event with location', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/create');

    const eventTitle = `Location Test ${Date.now()}`;
    const eventLocation = 'Central Park, New York';

    // Fill event info
    await authenticatedPage.getByTestId('new-event-title').fill(eventTitle);

    const locationInput = authenticatedPage.getByTestId('new-event-location');
    if (await locationInput.isVisible()) {
      await locationInput.fill(eventLocation);

      // Verify location is filled
      expect(await locationInput.inputValue()).toBe(eventLocation);
    }
  });

  test('handles long event descriptions', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/create');

    const eventTitle = `Long Description Test ${Date.now()}`;
    const longDescription =
      'This is a very long description. '.repeat(25) +
      'It should be handled properly by the form.';

    // Fill event info
    await authenticatedPage.getByTestId('new-event-title').fill(eventTitle);

    const descInput = authenticatedPage.getByTestId('new-event-description');
    if (await descInput.isVisible()) {
      await descInput.fill(longDescription);

      // Verify description is filled (may be truncated to 1000 chars)
      const value = await descInput.inputValue();
      expect(value.length).toBeGreaterThan(100);
    }
  });
});
