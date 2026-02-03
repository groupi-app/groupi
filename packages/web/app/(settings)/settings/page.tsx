'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { settingsConfig } from '@/config/settings';
import { SettingsPageTemplate } from '@/components/templates';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

/**
 * Settings root page.
 * - On desktop (md+): Redirects to /settings/notifications
 * - On mobile: Shows category selection menu
 */
export default function SettingsPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      const isSmallScreen = window.innerWidth < 768; // md breakpoint
      setIsMobile(isSmallScreen);

      // On desktop, redirect to notifications
      if (!isSmallScreen) {
        router.replace('/settings/notifications');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [router]);

  // Show nothing while determining screen size
  if (isMobile === null) {
    return null;
  }

  // On desktop, show nothing (will redirect)
  if (!isMobile) {
    return null;
  }

  // On mobile, show category selection
  return (
    <SettingsPageTemplate
      title='Settings'
      description='Choose a category'
      showMobileBack={false}
    >
      <nav className='flex flex-col gap-2'>
        {settingsConfig.settingsNav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center justify-between w-full rounded-card p-4',
              'bg-card hover:bg-accent/80 transition-colors',
              'border border-border'
            )}
          >
            <span className='font-medium'>{item.title}</span>
            <Icons.forward className='h-5 w-5 text-muted-foreground' />
          </Link>
        ))}
      </nav>
    </SettingsPageTemplate>
  );
}
