'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { LoadingState } from '@/components/molecules/loading-state';

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
        <h1 className='text-3xl font-heading font-medium'>{title}</h1>
        {description && (
          <p className='text-muted-foreground mt-1'>{description}</p>
        )}
      </div>
      {isLoading ? (loadingContent ?? <LoadingState />) : children}
    </div>
  );
}
