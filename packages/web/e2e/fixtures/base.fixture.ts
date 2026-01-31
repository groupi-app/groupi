/* eslint-disable react-hooks/rules-of-hooks */
// The 'use' function below is a Playwright test fixture function, not a React hook

import { test as base, BrowserContext, Page } from '@playwright/test';
import { AuthHelper } from '../helpers/auth-helper';
import { ConvexSeeder } from '../helpers/convex-seeder';
import { SignInPage } from '../page-objects/sign-in.page';
import { OnboardingPage } from '../page-objects/onboarding.page';
import { EventsPage } from '../page-objects/events.page';
import { CreateEventPage } from '../page-objects/create-event.page';
import { EventDetailPage } from '../page-objects/event-detail.page';
import { PostPage } from '../page-objects/post.page';
import { InvitePage } from '../page-objects/invite.page';

/**
 * Extended test fixtures for Groupi E2E tests.
 *
 * Provides:
 * - Page objects for each page
 * - Authentication helpers
 * - Data seeding utilities
 * - Auto-cleanup after each test
 */

// Types for authenticated user fixture
type AuthenticatedUser = {
  userId: string;
  personId: string | null;
  sessionToken: string;
  email: string;
};

// Extended test type with all fixtures
type GroupiFixtures = {
  // Helpers
  authHelper: AuthHelper;
  seeder: ConvexSeeder;

  // Page objects
  signInPage: SignInPage;
  onboardingPage: OnboardingPage;
  eventsPage: EventsPage;
  createEventPage: CreateEventPage;
  eventDetailPage: EventDetailPage;
  postPage: PostPage;
  invitePage: InvitePage;

  // Authenticated context
  authenticatedUser: AuthenticatedUser;
  authenticatedContext: BrowserContext;
  authenticatedPage: Page;

  // Unonboarded (new user) context - for onboarding tests
  unonboardedUser: AuthenticatedUser;
  unonboardedContext: BrowserContext;
  unonboardedPage: Page;
};

/**
 * Extended test with Groupi-specific fixtures.
 */
export const test = base.extend<GroupiFixtures>({
  // Auth helper - auto-cleanup after each test
  authHelper: async ({ baseURL }, use) => {
    const helper = new AuthHelper(baseURL);
    await use(helper);
    await helper.cleanup();
  },

  // Seeder - auto-cleanup after each test
  seeder: async (_, use) => {
    const seeder = new ConvexSeeder();
    await use(seeder);
    await seeder.cleanup();
  },

  // Page objects
  signInPage: async ({ page }, use) => {
    await use(new SignInPage(page));
  },

  onboardingPage: async ({ page }, use) => {
    await use(new OnboardingPage(page));
  },

  eventsPage: async ({ page }, use) => {
    await use(new EventsPage(page));
  },

  createEventPage: async ({ page }, use) => {
    await use(new CreateEventPage(page));
  },

  eventDetailPage: async ({ page }, use) => {
    await use(new EventDetailPage(page));
  },

  postPage: async ({ page }, use) => {
    await use(new PostPage(page));
  },

  invitePage: async ({ page }, use) => {
    await use(new InvitePage(page));
  },

  // Pre-created authenticated user
  authenticatedUser: async ({ authHelper }, use) => {
    const email = `e2e-test-${Date.now()}@test.groupi.gg`;
    const session = await authHelper.getSeeder().createTestSession({
      email,
      name: 'E2E Test User',
      username: `e2euser${Date.now()}`,
    });

    await use({
      ...session,
      email,
    });
  },

  // Browser context with auth - uses E2E login endpoint for proper authentication
  authenticatedContext: async (
    { browser, baseURL, authenticatedUser },
    use
  ) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const seeder = new ConvexSeeder();

    try {
      // Use the E2E login endpoint which handles the full magic link flow
      // and returns the signed session cookie
      const response = await page.request.post(
        `${baseURL}/api/auth/e2e-login`,
        {
          data: {
            email: authenticatedUser.email,
            callbackURL: '/events',
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok()) {
        const result = await response.json();

        // Navigate to a protected page to establish the session
        if (result.magicLinkUrl) {
          await page.goto(result.magicLinkUrl);
          await page.waitForURL(/\/(events|onboarding|create)/, {
            timeout: 15000,
          });
        }
      } else {
        // Fallback: Try UI-based magic link flow
        await page.goto(`${baseURL}/sign-in`);
        await page.locator('#identifier').fill(authenticatedUser.email);
        await page.getByRole('button', { name: /send magic link/i }).click();

        // Wait a bit for the magic link to be sent and verification record created
        await page.waitForTimeout(1500);

        // Poll for the magic link verification record with retries
        const magicLinkUrl = await seeder.waitForMagicLink(
          authenticatedUser.email,
          25, // 25 attempts
          400 // 400ms between attempts (10 seconds total)
        );

        if (magicLinkUrl) {
          // Navigate to magic link to verify and establish session
          await page.goto(magicLinkUrl);

          // Wait for the verification to complete
          // The magic link might redirect or might stay on the verification page
          await page.waitForTimeout(2000);

          // Now navigate to a protected page to verify authentication worked
          await page.goto(`${baseURL}/events`);

          // Wait for either events page or onboarding redirect
          try {
            await page.waitForURL(/\/(events|onboarding|create)/, {
              timeout: 10000,
            });
          } catch {
            // If we're still on sign-in, authentication failed
            const currentUrl = page.url();
            if (currentUrl.includes('/sign-in')) {
              console.warn(
                `Magic link verification failed - still on sign-in page`
              );
            }
          }
        } else {
          console.warn(
            `Failed to get magic link for ${authenticatedUser.email}`
          );
        }
      }
    } catch (error) {
      console.warn('Authentication setup error:', error);
    } finally {
      await page.close();
    }

    await use(context);
    await context.close();
  },

  // Page with auth already set up
  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage();
    await use(page);
    await page.close();
  },

  // Unonboarded user - authenticated but no person record (for onboarding tests)
  unonboardedUser: async ({ authHelper }, use) => {
    const email = `e2e-unonboarded-${Date.now()}@test.groupi.gg`;
    const session = await authHelper.getSeeder().createTestSession({
      email,
      name: 'E2E Unonboarded User',
      username: `unonboarded${Date.now()}`,
      skipPerson: true,
    });

    await use({
      ...session,
      email,
    });
  },

  // Browser context for unonboarded user
  unonboardedContext: async ({ browser, baseURL, unonboardedUser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const seeder = new ConvexSeeder();

    try {
      // Use UI-based magic link flow for unonboarded users
      await page.goto(`${baseURL}/sign-in`);
      await page.locator('#identifier').fill(unonboardedUser.email);
      await page.getByRole('button', { name: /send magic link/i }).click();

      // Wait for the magic link to be sent
      await page.waitForTimeout(2000);

      // Poll for the magic link with more retries for mobile browsers
      const magicLinkUrl = await seeder.waitForMagicLink(
        unonboardedUser.email,
        30,
        500
      );

      if (magicLinkUrl) {
        await page.goto(magicLinkUrl);

        // Wait for magic link verification to complete
        // On mobile browsers, this can take longer
        await page.waitForTimeout(3000);

        // Navigate to onboarding and wait for it to fully load
        await page.goto(`${baseURL}/onboarding`);

        // Wait for either the onboarding form or redirect
        try {
          await page.waitForURL(/\/(onboarding|events)/, { timeout: 10000 });
        } catch {
          // If still on sign-in, the auth failed - log for debugging
          const currentUrl = page.url();
          if (currentUrl.includes('/sign-in')) {
            console.warn(
              `Unonboarded auth failed - still on sign-in page for ${unonboardedUser.email}`
            );
          }
        }
      } else {
        console.warn(
          `Failed to get magic link for unonboarded user ${unonboardedUser.email}`
        );
      }
    } catch (error) {
      console.warn('Unonboarded auth setup error:', error);
    } finally {
      await page.close();
    }

    await use(context);
    await context.close();
  },

  // Page for unonboarded user
  unonboardedPage: async ({ unonboardedContext }, use) => {
    const page = await unonboardedContext.newPage();
    await use(page);
    await page.close();
  },
});

/**
 * Re-export expect for convenience.
 */
export { expect } from '@playwright/test';

/**
 * Helper to generate unique test emails.
 */
export function generateTestEmail(prefix: string = 'e2e'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.groupi.gg`;
}

/**
 * Helper to generate unique test usernames.
 */
export function generateTestUsername(prefix: string = 'e2e'): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Helper to format a date for date inputs.
 */
export function formatDateForInput(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Helper to get a future date string.
 */
export function getFutureDate(daysFromNow: number = 7): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return formatDateForInput(date);
}
