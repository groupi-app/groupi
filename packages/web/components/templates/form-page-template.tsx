'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FormPageTemplateProps {
  /**
   * Page title (optional - some forms are self-describing)
   */
  title?: string;
  /**
   * URL to navigate back to (shows back button if provided)
   */
  backHref?: string;
  /**
   * Back button label
   * @default "Back"
   */
  backLabel?: string;
  /**
   * Skeleton/fallback to show while loading
   */
  skeleton?: React.ReactNode;
  /**
   * Form content
   */
  children: React.ReactNode;
  /**
   * Maximum width variant
   * @default "md" (max-w-3xl)
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

export function FormPageTemplate({
  title,
  backHref,
  backLabel = 'Back',
  skeleton,
  children,
  maxWidth = 'md',
  className,
}: FormPageTemplateProps) {
  const content = (
    <div className={cn('container pt-6 pb-8', className)}>
      <div className={cn('mx-auto', maxWidthClasses[maxWidth])}>
        {(backHref || title) && (
          <div className='flex items-center gap-4 mb-6'>
            {backHref && (
              <Button variant='ghost' size='sm' asChild>
                <Link href={backHref}>
                  <ChevronLeft className='h-4 w-4 mr-1' />
                  {backLabel}
                </Link>
              </Button>
            )}
            {title && (
              <h1 className='text-2xl font-heading font-medium'>{title}</h1>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );

  // If a skeleton is provided, wrap in Suspense
  if (skeleton) {
    return (
      <Suspense
        fallback={
          <div className={cn('container pt-6 pb-8', className)}>
            <div className={cn('mx-auto', maxWidthClasses[maxWidth])}>
              {(backHref || title) && (
                <div className='flex items-center gap-4 mb-6'>
                  {backHref && (
                    <Button variant='ghost' size='sm' disabled>
                      <ChevronLeft className='h-4 w-4 mr-1' />
                      {backLabel}
                    </Button>
                  )}
                  {title && (
                    <h1 className='text-2xl font-heading font-medium'>
                      {title}
                    </h1>
                  )}
                </div>
              )}
              {skeleton}
            </div>
          </div>
        }
      >
        {content}
      </Suspense>
    );
  }

  return content;
}
