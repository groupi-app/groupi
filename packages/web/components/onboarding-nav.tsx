'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

/**
 * Minimal navigation for onboarding flow
 * Shows only logo and sign out button to prevent users from navigating
 * to other pages before completing onboarding
 */
export function OnboardingNav() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="ml-auto flex items-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="flex items-center gap-2"
      >
        <span>Sign Out</span>
        <Icons.signOut className="size-4" />
      </Button>
    </div>
  );
}
