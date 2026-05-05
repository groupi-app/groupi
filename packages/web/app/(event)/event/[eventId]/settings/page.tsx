'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getEventSettingsNav } from '@/config/event-settings';
import { SettingsPageTemplate } from '@/components/templates';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

export default function EventSettingsPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const navItems = getEventSettingsNav(eventId);

  useEffect(() => {
    const checkMobile = () => {
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isSmallScreen);

      if (!isSmallScreen) {
        router.replace(`/event/${eventId}/settings/details`);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [router, eventId]);

  if (isMobile === null || !isMobile) {
    return null;
  }

  return (
    <SettingsPageTemplate
      title='Event Settings'
      description='Choose a category'
      backHref={`/event/${eventId}`}
      showMobileBack={true}
    >
      <nav className='flex flex-col gap-2'>
        {navItems.map(item => {
          const Icon = Icons[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between w-full rounded-card p-4',
                'bg-card hover:bg-accent/80 transition-colors',
                'border border-border'
              )}
            >
              <div className='flex items-center gap-3'>
                <Icon className='h-5 w-5 text-muted-foreground' />
                <span className='font-medium'>{item.title}</span>
              </div>
              <Icons.forward className='h-5 w-5 text-muted-foreground' />
            </Link>
          );
        })}
      </nav>
    </SettingsPageTemplate>
  );
}
