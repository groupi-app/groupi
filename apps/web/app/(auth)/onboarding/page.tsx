import { redirect } from 'next/navigation';
import { needsOnboarding } from '@groupi/services/server';
import { getSession } from '@groupi/services/server';
import { OnboardingContent } from './onboarding-content';

export default async function OnboardingPage() {
  'use cache: private';

  // Check if user is authenticated
  const [sessionError, session] = await getSession();
  if (sessionError || !session) {
    redirect('/sign-in');
  }

  // Check if user already completed onboarding
  const [onboardingError, needsOnboardingCheck] = await needsOnboarding();
  
  // If user doesn't need onboarding, redirect to events page
  if (!onboardingError && needsOnboardingCheck === false) {
    redirect('/events');
  }

  return <OnboardingContent />;
}

