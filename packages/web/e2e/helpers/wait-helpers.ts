import { Page, Locator } from '@playwright/test';

/**
 * Wait helper utilities for E2E tests.
 *
 * Provides utilities for waiting on:
 * - Convex real-time data updates
 * - Loading states
 * - Toast notifications
 * - Custom conditions
 */

/**
 * Wait for a Convex real-time data update.
 * Waits for an element to appear with specific text, indicating data has loaded.
 */
export async function waitForConvexUpdate(
  page: Page,
  selector: string,
  expectedText: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const timeout = options.timeout || 10000;

  await page.locator(selector).filter({ hasText: expectedText }).waitFor({
    state: 'visible',
    timeout,
  });
}

/**
 * Wait for a Sonner toast notification.
 */
export async function waitForToast(
  page: Page,
  text: string | RegExp,
  options: {
    type?: 'success' | 'error' | 'info' | 'warning';
    timeout?: number;
  } = {}
): Promise<Locator> {
  const timeout = options.timeout || 5000;

  // Sonner toasts appear in a container with data-sonner-toast attribute
  const toastLocator = page
    .locator('[data-sonner-toast]')
    .filter({ hasText: text });

  await toastLocator.waitFor({ state: 'visible', timeout });

  return toastLocator;
}

/**
 * Wait for all loading states to complete.
 * Looks for common loading indicators and waits for them to disappear.
 */
export async function waitForLoadingComplete(
  page: Page,
  options: { timeout?: number } = {}
): Promise<void> {
  const timeout = options.timeout || 10000;

  // Common loading indicators
  const loadingSelectors = [
    // Skeleton loaders
    '[data-loading="true"]',
    '.skeleton',
    '[class*="skeleton"]',
    '[class*="Skeleton"]',
    // Spinners
    '[data-loading-spinner]',
    '.spinner',
    '[class*="spinner"]',
    // Loading text
    '[aria-busy="true"]',
  ];

  // Wait for all loading indicators to disappear
  await Promise.all(
    loadingSelectors.map(async selector => {
      const locator = page.locator(selector);
      const count = await locator.count();
      if (count > 0) {
        await locator.first().waitFor({ state: 'hidden', timeout });
      }
    })
  );
}

/**
 * Wait for navigation to complete and page to be interactive.
 */
export async function waitForPageReady(
  page: Page,
  options: { timeout?: number } = {}
): Promise<void> {
  const timeout = options.timeout || 10000;

  // Wait for network to be idle
  await page.waitForLoadState('networkidle', { timeout });

  // Wait for any loading states
  await waitForLoadingComplete(page, { timeout: timeout / 2 });
}

/**
 * Wait for URL to match a pattern.
 */
export async function waitForUrlPattern(
  page: Page,
  pattern: string | RegExp,
  options: { timeout?: number } = {}
): Promise<void> {
  const timeout = options.timeout || 10000;

  await page.waitForURL(pattern, { timeout });
}

/**
 * Retry an action until a condition is met.
 */
export async function retryUntil<T>(
  action: () => Promise<T>,
  predicate: (result: T) => boolean,
  options: {
    maxRetries?: number;
    delayMs?: number;
    timeout?: number;
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries || 10;
  const delayMs = options.delayMs || 500;
  const timeout = options.timeout || maxRetries * delayMs * 2;

  const startTime = Date.now();
  let lastResult: T;
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    if (Date.now() - startTime > timeout) {
      throw new Error(
        `retryUntil timed out after ${timeout}ms. Last error: ${lastError?.message}`
      );
    }

    try {
      lastResult = await action();
      if (predicate(lastResult)) {
        return lastResult;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  throw new Error(
    `retryUntil failed after ${maxRetries} retries. Last error: ${lastError?.message}`
  );
}

/**
 * Wait for an element to have specific text content.
 */
export async function waitForText(
  locator: Locator,
  text: string | RegExp,
  options: { timeout?: number } = {}
): Promise<void> {
  const timeout = options.timeout || 5000;

  if (typeof text === 'string') {
    await locator
      .filter({ hasText: text })
      .waitFor({ state: 'visible', timeout });
  } else {
    await locator
      .filter({ hasText: text })
      .waitFor({ state: 'visible', timeout });
  }
}

/**
 * Wait for an element count to match.
 */
export async function waitForCount(
  locator: Locator,
  expectedCount: number,
  options: { timeout?: number } = {}
): Promise<void> {
  const timeout = options.timeout || 5000;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const count = await locator.count();
    if (count === expectedCount) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const actualCount = await locator.count();
  throw new Error(
    `Expected ${expectedCount} elements but found ${actualCount} after ${timeout}ms`
  );
}

/**
 * Wait for network requests to a specific URL pattern to complete.
 */
export async function waitForApiCall(
  page: Page,
  urlPattern: string | RegExp,
  options: { timeout?: number; method?: string } = {}
): Promise<void> {
  const timeout = options.timeout || 10000;

  await page.waitForResponse(
    response => {
      const url = response.url();
      const matchesUrl =
        typeof urlPattern === 'string'
          ? url.includes(urlPattern)
          : urlPattern.test(url);

      const matchesMethod = options.method
        ? response.request().method() === options.method.toUpperCase()
        : true;

      return matchesUrl && matchesMethod;
    },
    { timeout }
  );
}
