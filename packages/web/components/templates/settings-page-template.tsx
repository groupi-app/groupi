'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { LoadingState } from '@/components/molecules/loading-state';
import Link from 'next/link';
import { Icons } from '@/components/icons';

export interface SettingsPageTemplateProps {
  /**
   * Page title
   */
  title: string;
  /**
   * Optional description below the title
   */
  description?: string;
  /**
   * Whether the page is in a loading state
   */
  isLoading?: boolean;
  /**
   * Custom loading component
   */
  loadingContent?: React.ReactNode;
  /**
   * Main content
   */
  children: React.ReactNode;
  /**
   * Maximum width variant
   * @default "sm" (max-w-2xl)
   */
  maxWidth?: 'sm' | 'md' | 'lg';
  /**
   * Additional class names for the container
   */
  className?: string;
  /**
   * Optional back link href. When provided, shows a back button on mobile.
   * Defaults to '/settings' for settings subpages.
   */
  backHref?: string | null;
  /**
   * Whether to show back button on mobile (defaults to true for settings pages)
   */
  showMobileBack?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
};

export function SettingsPageTemplate({
  title,
  description,
  isLoading = false,
  loadingContent,
  children,
  maxWidth = 'sm',
  className,
  backHref = '/settings',
  showMobileBack = true,
}: SettingsPageTemplateProps) {
  return (
    <div
      className={cn(
        'md:container mx-auto py-8',
        maxWidthClasses[maxWidth],
        className
      )}
    >
      <div className='mb-6'>
        {/* Mobile back button */}
        {showMobileBack && backHref && (
          <Link
            href={backHref}
            className='md:hidden flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-3 -ml-1'
          >
            <Icons.back className='h-5 w-5' />
            <span className='text-sm'>Settings</span>
          </Link>
        )}
        <h1 className='text-3xl font-heading font-medium'>{title}</h1>
        {description && (
          <p className='text-muted-foreground mt-1'>{description}</p>
        )}
      </div>
      {isLoading ? (loadingContent ?? <LoadingState />) : children}
    </div>
  );
}
