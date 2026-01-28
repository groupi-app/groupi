'use client';

import { OnboardingContent } from './onboarding-content';
import { OnboardingGuard } from './components/onboarding-guard';

/**
 * Onboarding Page - Client-only architecture
 * - Uses OnboardingGuard to check auth and onboarding status
 * - Handles redirects client-side based on user state
 * - Real-time user data updates via Convex subscriptions
 */
export default function OnboardingPage() {
  return (
    <OnboardingGuard>
      <OnboardingContent />
    </OnboardingGuard>
  );
}
