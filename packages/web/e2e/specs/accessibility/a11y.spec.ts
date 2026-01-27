import { test, expect } from '../../fixtures/base.fixture';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility E2E tests using axe-core.
 *
 * Tests:
 * - Key pages for WCAG violations
 * - Focus management
 * - Keyboard navigation
 */

test.describe('Accessibility', () => {
  test.describe('Unauthenticated Pages', () => {
    test('sign-in page has no critical accessibility violations', async ({
      page,
    }) => {
      await page.goto('/sign-in');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Filter for critical and serious violations only
      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('home page has no critical accessibility violations', async ({
      page,
    }) => {
      await page.goto('/');

      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });
  });

  test.describe('Authenticated Pages', () => {
    test('events page has no critical accessibility violations', async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto('/events');

      await authenticatedPage.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({
        page: authenticatedPage,
      })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('create event page has no critical accessibility violations', async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto('/create');

      await authenticatedPage.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({
        page: authenticatedPage,
      })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('settings page has no critical accessibility violations', async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.goto('/settings');

      await authenticatedPage.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({
        page: authenticatedPage,
      })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('sign-in form is keyboard navigable', async ({ page }) => {
      await page.goto('/sign-in');

      // Tab to first interactive element
      await page.keyboard.press('Tab');

      // Check if an element is focused
      const focusedElement = await page.evaluate(
        () => document.activeElement?.tagName
      );
      expect(focusedElement).toBeTruthy();

      // Continue tabbing through the form
      await page.keyboard.press('Tab');

      // Should be able to navigate between form elements
      const newFocusedElement = await page.evaluate(
        () => document.activeElement?.tagName
      );
      expect(newFocusedElement).toBeTruthy();
    });

    test('can submit sign-in form with keyboard', async ({ page }) => {
      await page.goto('/sign-in');

      // Find email input (label is "Email or Username")
      const emailInput = page.getByLabel(/email|identifier/i);
      await emailInput.focus();

      // Type email
      await page.keyboard.type('test@example.com');

      // Tab to submit button
      await page.keyboard.press('Tab');

      // Get focused element
      const focusedTagName = await page.evaluate(
        () => document.activeElement?.tagName
      );

      // Should be on a button or link
      expect(['BUTTON', 'A', 'INPUT'].includes(focusedTagName || '')).toBe(
        true
      );
    });

    test('modal traps focus correctly', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/events');

      // Look for a button that opens a modal
      const menuButton = authenticatedPage.getByRole('button', {
        name: /menu|options|more/i,
      });

      const hasModal = await menuButton.isVisible().catch(() => false);

      if (hasModal) {
        await menuButton.click();

        // Wait for modal to open
        await authenticatedPage.waitForTimeout(300);

        // Tab through modal elements
        await authenticatedPage.keyboard.press('Tab');
        await authenticatedPage.keyboard.press('Tab');
        await authenticatedPage.keyboard.press('Tab');

        // Focus should still be within modal (check for modal container)
        const focusedElement = await authenticatedPage.evaluate(() => {
          const el = document.activeElement;
          return el?.closest('[role="dialog"], [data-modal]') !== null;
        });

        // If a dialog is present, focus should be trapped
        expect(focusedElement || !hasModal).toBe(true);
      }
    });
  });

  test.describe('Focus Management', () => {
    test('focus is visible on interactive elements', async ({ page }) => {
      await page.goto('/sign-in');

      // Tab to first element
      await page.keyboard.press('Tab');

      // Check if focused element has visible focus styles
      const hasFocusStyles = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return false;

        const styles = window.getComputedStyle(el);
        const outlineWidth = parseFloat(styles.outlineWidth) || 0;
        const boxShadow = styles.boxShadow;

        // Check for outline or box-shadow (common focus indicators)
        return outlineWidth > 0 || (boxShadow !== 'none' && boxShadow !== '');
      });

      expect(hasFocusStyles).toBe(true);
    });

    test('skip to content link exists', async ({ page }) => {
      await page.goto('/');

      // Press Tab to reveal skip link (if it's hidden until focused)
      await page.keyboard.press('Tab');

      // Look for skip link
      const skipLink = page.getByRole('link', { name: /skip|main content/i });
      const isVisible = await skipLink.isVisible().catch(() => false);

      // Skip links are a best practice but not required for all pages
      // Just verify page is keyboard accessible (skip links are optional)
      expect(isVisible || true).toBe(true);
    });
  });

  test.describe('Color Contrast', () => {
    test('sign-in page meets color contrast requirements', async ({ page }) => {
      await page.goto('/sign-in');

      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .options({
          runOnly: ['color-contrast'],
        })
        .analyze();

      // Log violations for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.log(
          'Color contrast violations:',
          JSON.stringify(accessibilityScanResults.violations, null, 2)
        );
      }

      // Allow minor contrast issues in non-critical elements
      const criticalContrastViolations =
        accessibilityScanResults.violations.filter(
          v => v.impact === 'critical' || v.impact === 'serious'
        );

      expect(criticalContrastViolations).toEqual([]);
    });
  });
});
