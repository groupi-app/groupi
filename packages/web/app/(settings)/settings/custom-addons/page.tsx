'use client';

import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from '@/components/auth/auth-wrappers';
import { SettingsPageTemplate } from '@/components/templates';
import { EmptyState } from '@/components/molecules';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TemplateLibrary } from '@/app/(addonBuilder)/addon-builder/components/template-library';
import { Card } from '@/components/ui/card';

const experimentalBadge = (
  <Badge variant='default' className='text-[10px] px-2.5 py-0.5'>
    Experimental
  </Badge>
);

export default function CustomAddonsSettings() {
  return (
    <>
      <AuthLoading>
        <SettingsPageTemplate
          title='Add-ons'
          titleBadge={experimentalBadge}
          isLoading
          loadingContent={<LoadingSkeleton />}
        >
          <div />
        </SettingsPageTemplate>
      </AuthLoading>

      <Unauthenticated>
        <SettingsPageTemplate title='Add-ons' titleBadge={experimentalBadge}>
          <EmptyState
            icon={<Lock className='h-10 w-10' />}
            message='Authentication Required'
            description='Please sign in to manage your add-ons.'
            action={
              <Link href='/sign-in'>
                <Button>Sign In</Button>
              </Link>
            }
          />
        </SettingsPageTemplate>
      </Unauthenticated>

      <Authenticated>
        <SettingsPageTemplate
          title='Add-ons'
          titleBadge={experimentalBadge}
          description='Create and manage custom add-ons for your events.'
        >
          <TemplateLibrary showHeader={false} />
        </SettingsPageTemplate>
      </Authenticated>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      {[1, 2, 3].map(i => (
        <Card key={i} className='rounded-card shadow-raised p-4'>
          <div className='flex items-center gap-3'>
            <div className='size-10 animate-pulse rounded-button bg-muted' />
            <div className='space-y-2'>
              <div className='h-4 w-24 animate-pulse rounded bg-muted' />
              <div className='h-3 w-32 animate-pulse rounded bg-muted' />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
