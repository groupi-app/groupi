'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ListPageTemplateProps {
  /**
   * Page title displayed as H1
   */
  title: string;
  /**
   * Optional subtitle or description
   */
  subtitle?: string;
  /**
   * Controls (filters, sort, actions) displayed in the header
   */
  controls?: React.ReactNode;
  /**
   * Main content (typically a list component)
   */
  children: React.ReactNode;
  /**
   * Maximum width variant
   * @default "lg" (max-w-4xl)
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /**
   * Additional class names for the container
   */
  className?: string;
  /**
   * Header layout variant
   * @default "row" - Title and controls side by side on desktop
   */
  headerLayout?: 'row' | 'stacked';
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: '',
};

export function ListPageTemplate({
  title,
  subtitle,
  controls,
  children,
  maxWidth = 'lg',
  className,
  headerLayout = 'row',
}: ListPageTemplateProps) {
  return (
    <div
      className={cn('container mx-auto', maxWidthClasses[maxWidth], className)}
    >
      <div
        className={cn(
          'py-4 gap-4',
          headerLayout === 'row'
            ? 'flex flex-col md:flex-row md:items-center md:justify-between'
            : 'flex flex-col'
        )}
      >
        <div>
          <h1 className='text-5xl font-heading font-medium'>{title}</h1>
          {subtitle && <p className='text-muted-foreground mt-1'>{subtitle}</p>}
        </div>
        {controls && <div className='flex items-center gap-2'>{controls}</div>}
      </div>
      {children}
    </div>
  );
}
