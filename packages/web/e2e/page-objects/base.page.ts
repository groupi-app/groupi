import { Page, Locator } from '@playwright/test';

/**
 * Base page object class with common utilities.
 *
 * All page objects should extend this class to inherit:
 * - Navigation helpers
 * - Wait utilities
 * - Common element interactions
 */
export abstract class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a specific path.
   */
  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for the page data to load (skeleton disappears).
   * Override in subclasses for page-specific loading indicators.
   */
  async waitForDataLoad(options: { timeout?: number } = {}): Promise<void> {
    const timeout = options.timeout || 10000;

    // Wait for skeleton elements to disappear
    const skeletonSelectors = [
      '[data-loading="true"]',
      '.skeleton',
      '[class*="skeleton"]',
      '[aria-busy="true"]',
    ];

    for (const selector of skeletonSelectors) {
      const locator = this.page.locator(selector);
      const count = await locator.count();
      if (count > 0) {
        await locator.first().waitFor({ state: 'hidden', timeout });
      }
    }
  }

  /**
   * Wait for a specific element to be visible.
   */
  async waitForElement(
    selector: string,
    options: { timeout?: number } = {}
  ): Promise<Locator> {
    const timeout = options.timeout || 10000;
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    return locator;
  }

  /**
   * Get the current toast notification message.
   */
  async getToastMessage(): Promise<string | null> {
    const toast = this.page.locator('[data-sonner-toast]').first();
    const isVisible = await toast.isVisible().catch(() => false);

    if (!isVisible) {
      return null;
    }

    return toast.textContent();
  }

  /**
   * Wait for a toast notification with specific text.
   */
  async waitForToast(
    text: string | RegExp,
    options: { timeout?: number } = {}
  ): Promise<Locator> {
    const timeout = options.timeout || 5000;
    const toast = this.page
      .locator('[data-sonner-toast]')
      .filter({ hasText: text });

    await toast.waitFor({ state: 'visible', timeout });
    return toast;
  }

  /**
   * Wait for navigation to a specific URL pattern.
   */
  async waitForNavigation(
    pattern: string | RegExp,
    options: { timeout?: number } = {}
  ): Promise<void> {
    const timeout = options.timeout || 10000;
    await this.page.waitForURL(pattern, { timeout });
  }

  /**
   * Click a button by its accessible name.
   */
  async clickButton(name: string | RegExp): Promise<void> {
    await this.page.getByRole('button', { name }).click();
  }

  /**
   * Click a link by its accessible name.
   */
  async clickLink(name: string | RegExp): Promise<void> {
    await this.page.getByRole('link', { name }).click();
  }

  /**
   * Fill a form field by its label.
   */
  async fillByLabel(label: string | RegExp, value: string): Promise<void> {
    await this.page.getByLabel(label).fill(value);
  }

  /**
   * Get the current URL.
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Get the current pathname.
   */
  getCurrentPath(): string {
    return new URL(this.page.url()).pathname;
  }

  /**
   * Check if we're on a specific path.
   */
  isOnPath(path: string | RegExp): boolean {
    const currentPath = this.getCurrentPath();
    if (typeof path === 'string') {
      return currentPath === path || currentPath.startsWith(path);
    }
    return path.test(currentPath);
  }

  /**
   * Take a screenshot with a descriptive name.
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `e2e/screenshots/${name}.png` });
  }

  /**
   * Get the page title.
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Check if an element is visible.
   */
  async isVisible(selector: string): Promise<boolean> {
    return this.page.locator(selector).isVisible();
  }

  /**
   * Get text content of an element.
   */
  async getText(selector: string): Promise<string | null> {
    return this.page.locator(selector).textContent();
  }

  /**
   * Get all text content of elements matching a selector.
   */
  async getAllText(selector: string): Promise<string[]> {
    const elements = this.page.locator(selector);
    const count = await elements.count();
    const texts: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await elements.nth(i).textContent();
      if (text) {
        texts.push(text);
      }
    }

    return texts;
  }
}
