import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page object for the onboarding page.
 *
 * Handles:
 * - Profile setup (username, name, bio)
 * - Onboarding completion
 */
export class OnboardingPage extends BasePage {
  // Locators
  readonly usernameInput: Locator;
  readonly nameInput: Locator;
  readonly bioInput: Locator;
  readonly continueButton: Locator;
  readonly skipButton: Locator;

  constructor(page: Page) {
    super(page);

    // Use id-based selectors for form inputs (more reliable than label matching)
    this.usernameInput = page.locator('#username');
    this.nameInput = page.locator('#displayName');
    this.bioInput = page.locator('#bio');
    this.continueButton = page.getByRole('button', {
      name: /complete setup/i,
    });
    this.skipButton = page.getByRole('button', { name: /skip/i });
  }

  /**
   * Navigate to the onboarding page.
   */
  async goto(): Promise<void> {
    await super.goto('/onboarding');
    await this.waitForDataLoad();
  }

  /**
   * Check if we're on the onboarding page.
   */
  async isDisplayed(): Promise<boolean> {
    return this.isOnPath('/onboarding');
  }

  /**
   * Fill in the profile form.
   */
  async fillProfile(data: {
    username?: string;
    name?: string;
    bio?: string;
  }): Promise<void> {
    if (data.username) {
      await this.usernameInput.fill(data.username);
    }
    if (data.name) {
      await this.nameInput.fill(data.name);
    }
    if (data.bio) {
      await this.bioInput.fill(data.bio);
    }
  }

  /**
   * Complete the onboarding process.
   */
  async completeOnboarding(data?: {
    username?: string;
    name?: string;
    bio?: string;
  }): Promise<void> {
    if (data) {
      await this.fillProfile(data);
    }

    await this.continueButton.click();

    // Wait for redirect to events page
    await this.waitForNavigation(/\/events/);
  }

  /**
   * Skip onboarding if available.
   */
  async skipOnboarding(): Promise<void> {
    const isSkipVisible = await this.skipButton.isVisible().catch(() => false);
    if (isSkipVisible) {
      await this.skipButton.click();
      await this.waitForNavigation(/\/events/);
    }
  }

  /**
   * Check if the continue button is enabled.
   */
  async isContinueEnabled(): Promise<boolean> {
    return this.continueButton.isEnabled();
  }

  /**
   * Get validation error for username.
   */
  async getUsernameError(): Promise<string | null> {
    const errorElement = this.page.locator(
      '[data-error="username"], #username-error, [aria-describedby*="username"]'
    );
    const isVisible = await errorElement.isVisible().catch(() => false);
    if (!isVisible) {
      return null;
    }
    return errorElement.textContent();
  }

  /**
   * Get the current form values.
   */
  async getFormValues(): Promise<{
    username: string;
    name: string;
    bio: string;
  }> {
    return {
      username: await this.usernameInput.inputValue(),
      name: await this.nameInput.inputValue(),
      bio: await this.bioInput.inputValue(),
    };
  }
}
