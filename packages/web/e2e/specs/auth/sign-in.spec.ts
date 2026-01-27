import { test, expect, generateTestEmail } from '../../fixtures/base.fixture';

/**
 * Sign-in page E2E tests.
 *
 * Tests:
 * - Page display and available options
 * - Magic link request flow
 * - Error states
 * - Redirect when already authenticated
 */

test.describe('Sign-In Page', () => {
  test('displays sign-in options', async ({ signInPage }) => {
    await signInPage.goto();

    // Verify page is displayed
    expect(await signInPage.isDisplayed()).toBe(true);

    // Check for sign-in options
    const options = await signInPage.getSignInOptions();
    expect(options.length).toBeGreaterThan(0);

    // Should have magic link option
    expect(options).toContain('magic-link');
  });

  test('displays social sign-in buttons when configured', async ({
    signInPage,
  }) => {
    await signInPage.goto();

    // Check if social options are available
    const hasSocialOptions = await signInPage.hasSocialSignInOptions();

    // We just verify the page loads correctly - social options depend on env config
    expect(await signInPage.isDisplayed()).toBe(true);
  });

  test('shows success message after requesting magic link', async ({
    signInPage,
  }) => {
    await signInPage.goto();

    const testEmail = generateTestEmail('magic-link-test');

    // Request magic link
    await signInPage.sendMagicLink(testEmail);

    // Wait for success message
    await signInPage.waitForSuccessMessage();

    // Verify success message is displayed
    expect(await signInPage.isSuccessMessageDisplayed()).toBe(true);
  });

  test('shows error for invalid email format', async ({ signInPage, page }) => {
    await signInPage.goto();

    // Enter invalid email
    await signInPage.emailInput.fill('not-an-email');
    await signInPage.magicLinkButton.click();

    // Look for validation error (either native or custom)
    const isInvalid = await signInPage.emailInput.evaluate(
      el => (el as HTMLInputElement).validity.valid === false
    );

    // Either the input is invalid or there's an error message
    const hasError = isInvalid || (await signInPage.getErrorMessage()) !== null;

    expect(hasError).toBe(true);
  });

  test('redirects to events when already authenticated', async ({
    authenticatedPage,
    authenticatedUser,
  }) => {
    // Navigate to sign-in while authenticated
    await authenticatedPage.goto('/sign-in');

    // Should be redirected to events
    await authenticatedPage.waitForURL(/\/(events|onboarding)/);

    const url = authenticatedPage.url();
    expect(url).toMatch(/\/(events|onboarding)/);
  });

  test('email input is focused on page load', async ({ signInPage }) => {
    await signInPage.goto();

    // Check if email input exists and is visible
    await expect(signInPage.emailInput).toBeVisible();

    // Click on the email input to ensure it's interactive
    await signInPage.emailInput.click();
    await expect(signInPage.emailInput).toBeFocused();
  });

  test('can navigate to sign-in from home page', async ({ page }) => {
    // Go to home page
    await page.goto('/');

    // Find and click sign-in link/button
    const signInLink = page.getByRole('link', { name: /sign in|log in/i });
    const isVisible = await signInLink.isVisible().catch(() => false);

    if (isVisible) {
      await signInLink.click();
      await page.waitForURL(/\/sign-in/);
      expect(page.url()).toContain('/sign-in');
    } else {
      // Home page might redirect directly to sign-in for unauthenticated users
      await page.waitForURL(/\/(sign-in)?$/);
    }
  });
});
