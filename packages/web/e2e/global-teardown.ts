import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright E2E tests.
 *
 * This runs once after all tests complete and can be used to:
 * - Clean up test data
 * - Generate reports
 * - Reset shared state
 */

async function globalTeardown(_config: FullConfig): Promise<void> {
  void _config; // Parameter required by Playwright but not used
  console.log(`\n📋 E2E Test Teardown`);
  console.log(`   ✅ Tests completed`);

  // Add any cleanup logic here if needed
  // For example, cleaning up test data created during tests

  console.log(`   📊 Report available: pnpm e2e:report\n`);
}

export default globalTeardown;
