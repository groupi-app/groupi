import { BrowserContext, Page } from '@playwright/test';
import { ConvexSeeder } from './convex-seeder';

/**
 * Authentication helper for E2E tests.
 *
 * Provides utilities for:
 * - Creating authenticated sessions via Convex test functions
 * - Injecting session cookies for fast auth
 * - Testing full UI auth flows
 */
export class AuthHelper {
  private seeder: ConvexSeeder;
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.seeder = new ConvexSeeder();
    this.baseURL = baseURL;
  }

  /**
   * Create an authenticated session and inject cookies into the browser context.
   * This is the fast path for tests that need auth but don't test auth itself.
   */
  async createAuthenticatedSession(
    context: BrowserContext,
    userData: {
      email: string;
      name?: string;
      username?: string;
    }
  ): Promise<{
    userId: string;
    personId: string;
    sessionToken: string;
  }> {
    // Create test session via Convex
    const session = await this.seeder.createTestSession(userData);

    // Inject the session cookie
    await context.addCookies([
      {
        name: 'better-auth.session_token',
        value: session.sessionToken,
        domain: new URL(this.baseURL).hostname,
        path: '/',
        httpOnly: true,
        secure: this.baseURL.startsWith('https'),
        sameSite: 'Lax',
      },
    ]);

    return session;
  }

  /**
   * Perform UI-based login via magic link.
   * Use this when testing the actual auth flow.
   */
  async loginViaUI(
    page: Page,
    email: string
  ): Promise<{
    magicLinkUrl: string;
  }> {
    // Navigate to sign-in page
    await page.goto('/sign-in');

    // Fill in email
    await page.getByLabel(/email/i).fill(email);

    // Click send magic link button
    await page.getByRole('button', { name: /magic link|send link/i }).click();

    // Wait for success message
    await page.getByText(/check your email|link sent/i).waitFor();

    // Get the magic link from Convex (test-only function)
    const magicLinkUrl = await this.seeder.getLastMagicLink(email);

    return { magicLinkUrl };
  }

  /**
   * Complete magic link login by navigating to the magic link URL.
   */
  async completeMagicLinkLogin(
    page: Page,
    magicLinkUrl: string
  ): Promise<void> {
    await page.goto(magicLinkUrl);

    // Wait for redirect to events or onboarding
    await page.waitForURL(/\/(events|onboarding)/);
  }

  /**
   * Logout the current user via UI.
   */
  async logout(page: Page): Promise<void> {
    // Navigate to settings or find logout button
    await page.goto('/settings');

    // Click logout button
    await page.getByRole('button', { name: /sign out|logout/i }).click();

    // Wait for redirect to home or sign-in
    await page.waitForURL(/\/(sign-in)?$/);
  }

  /**
   * Clear all auth-related cookies.
   */
  async clearAuth(context: BrowserContext): Promise<void> {
    const cookies = await context.cookies();
    const authCookies = cookies.filter(
      c =>
        c.name.includes('better-auth') ||
        c.name.includes('session') ||
        c.name.includes('auth')
    );

    if (authCookies.length > 0) {
      await context.clearCookies();
    }
  }

  /**
   * Check if the current context has an active session.
   */
  async hasActiveSession(context: BrowserContext): Promise<boolean> {
    const cookies = await context.cookies();
    return cookies.some(c => c.name === 'better-auth.session_token');
  }

  /**
   * Get the seeder instance for direct data operations.
   */
  getSeeder(): ConvexSeeder {
    return this.seeder;
  }

  /**
   * Cleanup all test data created during the session.
   */
  async cleanup(): Promise<void> {
    await this.seeder.cleanup();
  }
}
