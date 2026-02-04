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
 * Helper to set up page error handling to prevent hanging tests.
 */
function setupPageErrorHandler(page: Page): void {
  page.on('pageerror', error => {
    // Log but don't throw - let the test continue
    // eslint-disable-next-line no-console
    console.warn('[Page Error]', error.message);
  });
}

/**
 * Helper to authenticate via the E2E login endpoint or magic link fallback.
 * Returns true if authentication was successful.
 */
async function authenticateUser(
  page: Page,
  baseURL: string,
  email: string,
  seeder: ConvexSeeder,
  targetUrl: string = '/events'
): Promise<boolean> {
  setupPageErrorHandler(page);

  try {
    // Try the fast E2E login endpoint first
    const response = await page.request.post(`${baseURL}/api/auth/e2e-login`, {
      data: {
        email,
        callbackURL: targetUrl,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok()) {
      const result = await response.json();

      if (result.magicLinkUrl) {
        await page.goto(result.magicLinkUrl);
        // Wait for navigation to complete - use domcontentloaded instead of networkidle
        await page.waitForURL(/\/(events|onboarding|create|settings)/, {
          timeout: 10000,
          waitUntil: 'domcontentloaded',
        });
        return true;
      }
    }

    // Fallback: Create magic link token directly (bypasses email sending)
    const magicLinkUrl = await seeder.createMagicLinkToken(email);

    if (magicLinkUrl) {
      await page.goto(magicLinkUrl);
      // Wait for redirect after magic link verification
      await page.waitForURL(/\/(events|onboarding|create|settings|sign-in)/, {
        timeout: 10000,
        waitUntil: 'domcontentloaded',
      });

      // If still on sign-in, navigate to target
      if (page.url().includes('/sign-in')) {
        await page.goto(`${baseURL}${targetUrl}`);
        await page.waitForURL(/\/(events|onboarding|create|settings)/, {
          timeout: 5000,
          waitUntil: 'domcontentloaded',
        });
      }
      return true;
    }

    // eslint-disable-next-line no-console
    console.warn(`Failed to create magic link token for ${email}`);
    return false;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Authentication setup error:', error);
    return false;
  }
}

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
  // eslint-disable-next-line no-empty-pattern
  seeder: async ({}, use) => {
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

    await authenticateUser(page, baseURL!, authenticatedUser.email, seeder);
    await page.close();

    await use(context);
    await context.close();
  },

  // Page with auth already set up
  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage();
    setupPageErrorHandler(page);
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

    await authenticateUser(
      page,
      baseURL!,
      unonboardedUser.email,
      seeder,
      '/onboarding'
    );
    await page.close();

    await use(context);
    await context.close();
  },

  // Page for unonboarded user
  unonboardedPage: async ({ unonboardedContext }, use) => {
    const page = await unonboardedContext.newPage();
    setupPageErrorHandler(page);
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
