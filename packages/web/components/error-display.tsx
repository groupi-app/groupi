'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * Error types for the ErrorDisplay component
 */
export type ErrorType =
  | 'not-found'      // 404 - Resource doesn't exist
  | 'access-denied'  // 403 - User doesn't have permission
  | 'expired'        // Resource has expired (e.g., invite)
  | 'generic';       // General error

interface ErrorConfig {
  icon: keyof typeof Icons;
  iconClassName: string;
  title: string;
  defaultMessage: string;
}

const errorConfigs: Record<ErrorType, ErrorConfig> = {
  'not-found': {
    icon: 'search',
    iconClassName: 'text-muted-foreground',
    title: 'Not Found',
    defaultMessage: "We couldn't find what you're looking for. It may have been deleted or never existed.",
  },
  'access-denied': {
    icon: 'ban',
    iconClassName: 'text-destructive',
    title: 'Access Denied',
    defaultMessage: "You don't have permission to view this page. Please contact the organizer if you think this is a mistake.",
  },
  'expired': {
    icon: 'time',
    iconClassName: 'text-amber-500',
    title: 'Expired',
    defaultMessage: "This link has expired and is no longer valid.",
  },
  'generic': {
    icon: 'warning',
    iconClassName: 'text-destructive',
    title: 'Something Went Wrong',
    defaultMessage: "An unexpected error occurred. Please try again later.",
  },
};

interface ErrorDisplayProps {
  /** The type of error to display */
  type?: ErrorType;
  /** Custom title (overrides default for error type) */
  title?: string;
  /** Custom message (overrides default for error type) */
  message?: string;
  /** Show the "Go Back" button */
  showBackButton?: boolean;
  /** Show the "Go Home" button */
  showHomeButton?: boolean;
  /** Show the "Try Again" button (requires onRetry callback) */
  showRetryButton?: boolean;
  /** Callback for the "Try Again" button */
  onRetry?: () => void;
  /** Custom action button */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  };
  /** Additional className for the container */
  className?: string;
  /** Whether to show in a compact size */
  compact?: boolean;
}

/**
 * A user-friendly error display component for expected errors.
 *
 * @example
 * // Not found error
 * <ErrorDisplay type="not-found" message="This event doesn't exist" />
 *
 * @example
 * // Access denied with custom action
 * <ErrorDisplay
 *   type="access-denied"
 *   action={{ label: "Request Access", onClick: handleRequestAccess }}
 * />
 *
 * @example
 * // Compact inline error
 * <ErrorDisplay type="not-found" compact message="Post not found" />
 */
export function ErrorDisplay({
  type = 'generic',
  title,
  message,
  showBackButton = true,
  showHomeButton = true,
  showRetryButton = false,
  onRetry,
  action,
  className,
  compact = false,
}: ErrorDisplayProps) {
  const router = useRouter();
  const config = errorConfigs[type];
  const IconComponent = Icons[config.icon];

  const displayTitle = title || config.title;
  const displayMessage = message || config.defaultMessage;

  if (compact) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 px-4', className)}>
        <div className={cn('rounded-full bg-muted p-3 mb-3', config.iconClassName)}>
          <IconComponent className="h-6 w-6" />
        </div>
        <h3 className="font-heading font-medium text-lg mb-1">{displayTitle}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          {displayMessage}
        </p>
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <Icons.back className="mr-1 h-4 w-4" />
              Go Back
            </Button>
          )}
          {action && (
            action.href ? (
              <Link href={action.href}>
                <Button variant={action.variant || 'default'} size="sm">
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button variant={action.variant || 'default'} size="sm" onClick={action.onClick}>
                {action.label}
              </Button>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[60vh] py-12 px-4', className)}>
      {/* Icon with background */}
      <div className={cn(
        'rounded-full bg-muted p-6 mb-6 animate-in fade-in zoom-in duration-300',
        config.iconClassName
      )}>
        <IconComponent className="h-12 w-12" />
      </div>

      {/* Title */}
      <h1 className="font-heading font-bold text-3xl md:text-4xl mb-3 text-center animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
        {displayTitle}
      </h1>

      {/* Message */}
      <p className="text-muted-foreground text-center max-w-md mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-150">
        {displayMessage}
      </p>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
        {showBackButton && (
          <Button variant="outline" onClick={() => router.back()}>
            <Icons.back className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        )}

        {showRetryButton && onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <Icons.undo className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}

        {showHomeButton && (
          <Link href="/events">
            <Button variant="default">
              <Icons.party className="mr-2 h-4 w-4" />
              My Events
            </Button>
          </Link>
        )}

        {action && (
          action.href ? (
            <Link href={action.href}>
              <Button variant={action.variant || 'default'}>
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button variant={action.variant || 'default'} onClick={action.onClick}>
              {action.label}
            </Button>
          )
        )}
      </div>

    </div>
  );
}

/**
 * Preset error components for common use cases
 */

export function NotFoundError({
  message,
  resourceType = 'page',
  ...props
}: Omit<ErrorDisplayProps, 'type'> & { resourceType?: string }) {
  return (
    <ErrorDisplay
      type="not-found"
      title={`${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} Not Found`}
      message={message || `This ${resourceType} doesn't exist or may have been deleted.`}
      {...props}
    />
  );
}

export function AccessDeniedError({
  message,
  ...props
}: Omit<ErrorDisplayProps, 'type'>) {
  return (
    <ErrorDisplay
      type="access-denied"
      message={message}
      {...props}
    />
  );
}

export function ExpiredError({
  message,
  ...props
}: Omit<ErrorDisplayProps, 'type'>) {
  return (
    <ErrorDisplay
      type="expired"
      message={message}
      {...props}
    />
  );
}
