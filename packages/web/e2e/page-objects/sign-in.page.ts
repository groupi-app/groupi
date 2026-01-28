import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page object for the sign-in page.
 *
 * Handles:
 * - Magic link sign-in
 * - Social provider sign-in buttons
 * - Error states
 */
export class SignInPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly magicLinkButton: Locator;
  readonly discordButton: Locator;
  readonly googleButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Use id-based selectors for form inputs (more reliable than label matching)
    this.emailInput = page.locator('#identifier');
    this.magicLinkButton = page.getByRole('button', {
      name: /send magic link/i,
    });
    this.discordButton = page.getByRole('button', {
      name: /discord/i,
    });
    this.googleButton = page.getByRole('button', {
      name: /google/i,
    });
    this.successMessage = page.getByText(/check your email/i);
    // Use a more specific locator to avoid matching dev tools or route announcer
    this.errorMessage = page.locator(
      'form [data-error="true"], form .error-message, [data-slot="form-message"]'
    );
  }

  /**
   * Navigate to the sign-in page.
   */
  async goto(): Promise<void> {
    await super.goto('/sign-in');
    await this.waitForDataLoad();
  }

  /**
   * Check if we're on the sign-in page.
   */
  async isDisplayed(): Promise<boolean> {
    return this.isOnPath('/sign-in');
  }

  /**
   * Fill in the email and request a magic link.
   */
  async sendMagicLink(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.magicLinkButton.click();
  }

  /**
   * Wait for the success message after requesting a magic link.
   */
  async waitForSuccessMessage(): Promise<void> {
    await this.successMessage.waitFor({ state: 'visible' });
  }

  /**
   * Check if the success message is displayed.
   */
  async isSuccessMessageDisplayed(): Promise<boolean> {
    return this.successMessage.isVisible();
  }

  /**
   * Get the error message text.
   */
  async getErrorMessage(): Promise<string | null> {
    const isVisible = await this.errorMessage.isVisible();
    if (!isVisible) {
      return null;
    }
    return this.errorMessage.textContent();
  }

  /**
   * Click the Discord sign-in button.
   */
  async clickDiscordSignIn(): Promise<void> {
    await this.discordButton.click();
  }

  /**
   * Click the Google sign-in button.
   */
  async clickGoogleSignIn(): Promise<void> {
    await this.googleButton.click();
  }

  /**
   * Check if social sign-in options are displayed.
   */
  async hasSocialSignInOptions(): Promise<boolean> {
    const discordVisible = await this.discordButton
      .isVisible()
      .catch(() => false);
    const googleVisible = await this.googleButton
      .isVisible()
      .catch(() => false);
    return discordVisible || googleVisible;
  }

  /**
   * Get all visible sign-in options.
   */
  async getSignInOptions(): Promise<string[]> {
    const options: string[] = [];

    if (await this.magicLinkButton.isVisible().catch(() => false)) {
      options.push('magic-link');
    }
    if (await this.discordButton.isVisible().catch(() => false)) {
      options.push('discord');
    }
    if (await this.googleButton.isVisible().catch(() => false)) {
      options.push('google');
    }

    return options;
  }
}
