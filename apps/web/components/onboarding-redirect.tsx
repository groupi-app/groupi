import { redirect } from 'next/navigation';
import { needsOnboarding } from '@groupi/services/server';
import { getSession } from '@groupi/services/server';

/**
 * Server component that checks if user needs onboarding and redirects if necessary
 * Should be wrapped in OnboardingRedirectWrapper to prevent redirect loops
 */
export async function OnboardingRedirect() {
  'use cache: private';

  const [sessionError, session] = await getSession();

  // If no session, don't redirect (let auth pages handle it)
  if (sessionError || !session) {
    return null;
  }

  // Check if user needs onboarding
  const [onboardingError, needsOnboardingCheck] = await needsOnboarding();

  // If error checking onboarding status, don't redirect (fail gracefully)
  if (onboardingError || needsOnboardingCheck === false) {
    return null;
  }

  // User needs onboarding - redirect to onboarding page
  redirect('/onboarding');
}

