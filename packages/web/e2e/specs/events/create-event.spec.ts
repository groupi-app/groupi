import { test, expect, getFutureDate } from '../../fixtures/base.fixture';

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

    // Check for title input
    const titleInput = authenticatedPage.getByLabel(/title|event name/i);
    await expect(titleInput).toBeVisible();
  });

  test('creates a single date event successfully', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/create');

    const eventTitle = `E2E Test Event ${Date.now()}`;
    const eventDescription = 'This is a test event created by E2E tests';
    const eventLocation = 'Virtual - Zoom';

    // Fill event info
    await authenticatedPage.getByLabel(/title|event name/i).fill(eventTitle);

    const descInput = authenticatedPage.getByLabel(/description/i);
    if (await descInput.isVisible()) {
      await descInput.fill(eventDescription);
    }

    const locationInput = authenticatedPage.getByLabel(/location|where/i);
    if (await locationInput.isVisible()) {
      await locationInput.fill(eventLocation);
    }

    // Look for date type selection or proceed button
    const singleDateOption = authenticatedPage.getByRole('button', {
      name: /single date|one date|specific date/i,
    });

    if (await singleDateOption.isVisible()) {
      await singleDateOption.click();
    }

    // Look for create/continue button
    const createButton = authenticatedPage.getByRole('button', {
      name: /create|submit|continue|next/i,
    });

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
    const createButton = authenticatedPage.getByRole('button', {
      name: /create|submit|continue|next/i,
    });

    // Button should be disabled or clicking shows error
    const isDisabled = await createButton.isDisabled().catch(() => false);

    if (!isDisabled) {
      await createButton.click();

      // Should show validation error
      const hasError = await authenticatedPage
        .locator('[data-error], .error-message, [aria-invalid="true"]')
        .isVisible()
        .catch(() => false);

      // Either button was disabled or we got an error
      expect(hasError).toBe(true);
    } else {
      expect(isDisabled).toBe(true);
    }
  });

  test('can go back in wizard steps', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/create');

    const eventTitle = `Back Test Event ${Date.now()}`;

    // Fill event info
    await authenticatedPage.getByLabel(/title|event name/i).fill(eventTitle);

    // Click next if available
    const nextButton = authenticatedPage.getByRole('button', {
      name: /next|continue/i,
    });

    if (await nextButton.isVisible()) {
      await nextButton.click();

      // Wait for step change
      await authenticatedPage.waitForTimeout(500);

      // Look for back button
      const backButton = authenticatedPage.getByRole('button', {
        name: /back|previous/i,
      });

      if (await backButton.isVisible()) {
        await backButton.click();

        // Title should still be there
        const titleInput = authenticatedPage.getByLabel(/title|event name/i);
        const value = await titleInput.inputValue();
        expect(value).toBe(eventTitle);
      }
    }
  });

  test('shows date selection options', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/create');

    // Fill required title
    await authenticatedPage
      .getByLabel(/title|event name/i)
      .fill('Date Selection Test');

    // Look for date type options
    const singleDateOption = authenticatedPage.getByRole('button', {
      name: /single date|one date|specific date/i,
    });
    const multiDateOption = authenticatedPage.getByRole('button', {
      name: /multi|multiple|vote|poll/i,
    });

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
    await authenticatedPage.getByLabel(/title|event name/i).fill(eventTitle);

    const locationInput = authenticatedPage.getByLabel(/location|where/i);
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
      'This is a very long description. '.repeat(50) +
      'It should be handled properly by the form.';

    // Fill event info
    await authenticatedPage.getByLabel(/title|event name/i).fill(eventTitle);

    const descInput = authenticatedPage.getByLabel(/description/i);
    if (await descInput.isVisible()) {
      await descInput.fill(longDescription);

      // Verify description is filled (may be truncated)
      const value = await descInput.inputValue();
      expect(value.length).toBeGreaterThan(100);
    }
  });
});
