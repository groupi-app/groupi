'use client';
import { settingsConfig } from '@/config/settings';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icons } from './icons';
import { Button } from './ui/button';

export function SettingsNav() {
  const [open, setOpen] = useState(false);
  const [hasTransition, setHasTransition] = useState(false);
  const currentPath = usePathname();
  return (
    <>
      <Button
        onClick={() => {
          setHasTransition(true);
          setOpen(true);
          setTimeout(() => {
            setHasTransition(false);
          }, 300);
        }}
        size='icon'
        variant='outline'
        className='z-10 md:hidden mb-2 ml-0'
      >
        <Icons.sidebar />
      </Button>
      <div
        className={cn(
          'fixed w-full md:sticky top-[5rem] border-r border-border duration-300 h-[calc(100vh-6rem-5rem)] z-30 bg-background md:bg-transparent',
          open ? 'left-0' : 'left-[calc(-100vw)] md:left-0',
          hasTransition ? 'transition-all ease-in-out' : 'transition-none'
        )}
      >
        <div className='flex items-center justify-between p-4 md:hidden'>
          <h1 className='font-heading text-2xl'>Settings</h1>
          <Button
            onClick={() => {
              setHasTransition(true);
              setOpen(false);
              setTimeout(() => {
                setHasTransition(false);
              }, 300);
            }}
            variant='ghost'
            size='icon'
          >
            <Icons.close />
          </Button>
        </div>
        <div className='flex flex-col p-2 gap-2 z-40'>
          {settingsConfig.settingsNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'w-full rounded-md hover:bg-accent transition-all p-2',
                currentPath === item.href ? 'bg-accent' : ''
              )}
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
