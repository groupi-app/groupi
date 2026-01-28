import { FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
// This is needed because Playwright doesn't automatically load Next.js env files
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

/**
 * Global setup for Playwright E2E tests.
 *
 * This runs once before all tests and can be used to:
 * - Set up global test data
 * - Configure authentication state
 * - Verify the dev server is running
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';

  console.log(`\n📋 E2E Test Setup`);
  console.log(`   Base URL: ${baseURL}`);

  // Verify the dev server is accessible
  try {
    const response = await fetch(baseURL, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`   ⚠️  Server returned ${response.status}`);
    } else {
      console.log(`   ✅ Server is accessible`);
    }
  } catch {
    console.error(`   ❌ Cannot connect to ${baseURL}`);
    console.error(`   Make sure the dev server is running: pnpm dev`);
    throw new Error(`Dev server not accessible at ${baseURL}`);
  }

  console.log(`   🚀 Starting E2E tests...\n`);
}

export default globalSetup;
