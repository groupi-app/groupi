'use client';

import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({
  presentation = 'soft',
  className,
  ...props
}: ToasterProps & { presentation?: 'soft' }) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className={cn(
        'toaster group',
        presentation === 'soft' && 'soft-toast',
        className
      )}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
