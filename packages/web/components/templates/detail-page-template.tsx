'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DetailPageTemplateProps {
  /**
   * Header component (event header, post header, etc.)
   */
  header?: React.ReactNode;
  /**
   * Main content
   */
  children: React.ReactNode;
  /**
   * Optional floating action button (e.g., "New Post" button)
   */
  floatingAction?: React.ReactNode;
  /**
   * Maximum width variant
   * @default "lg" (max-w-4xl)
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /**
   * Spacing between sections
   * @default "md"
   */
  spacing?: 'sm' | 'md' | 'lg';
  /**
   * Additional class names for the container
   */
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: '',
};

const spacingClasses = {
  sm: 'space-y-3',
  md: 'space-y-5',
  lg: 'space-y-8',
};

export function DetailPageTemplate({
  header,
  children,
  floatingAction,
  maxWidth = 'lg',
  spacing = 'md',
  className,
}: DetailPageTemplateProps) {
  return (
    <div
      className={cn('container pt-6 pb-24', spacingClasses[spacing], className)}
    >
      {header}
      <div
        className={cn('mx-auto flex flex-col gap-4', maxWidthClasses[maxWidth])}
      >
        {children}
      </div>
      {floatingAction}
    </div>
  );
}
