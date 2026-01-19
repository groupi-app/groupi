import { ErrorType } from '@/components/error-display';

interface ParsedError {
  type: ErrorType;
  title: string;
  message: string;
}

/**
 * Parse an error and return user-friendly error information.
 * Technical details are stripped out and replaced with helpful messages.
 */
export function parseError(error: Error, context: 'event' | 'post' | 'invite' | 'general' = 'general'): ParsedError {
  const errorMessage = error.message || '';

  // Check for Convex validation errors (invalid ID format)
  if (
    errorMessage.includes('ArgumentValidationError') ||
    errorMessage.includes('v.id(') ||
    errorMessage.includes('Value does not match validator')
  ) {
    return getNotFoundError(context);
  }

  // Check for authentication/authorization errors
  if (
    errorMessage.includes('Unauthenticated') ||
    errorMessage.includes('Not authenticated') ||
    errorMessage.includes('Authentication required')
  ) {
    return {
      type: 'access-denied',
      title: 'Sign In Required',
      message: 'You need to sign in to access this page.',
    };
  }

  // Check for permission/authorization errors
  if (
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('Access denied') ||
    errorMessage.includes('Permission denied') ||
    errorMessage.includes('Not authorized') ||
    errorMessage.includes('Forbidden')
  ) {
    return {
      type: 'access-denied',
      title: 'Access Denied',
      message: getAccessDeniedMessage(context),
    };
  }

  // Check for not found errors
  if (
    errorMessage.includes('Not found') ||
    errorMessage.includes('not found') ||
    errorMessage.includes('does not exist') ||
    errorMessage.includes('doesn\'t exist')
  ) {
    return getNotFoundError(context);
  }

  // Check for network/connection errors
  if (
    errorMessage.includes('Network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('connection')
  ) {
    return {
      type: 'generic',
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
    };
  }

  // Default generic error - don't show technical details
  return {
    type: 'generic',
    title: 'Something Went Wrong',
    message: getGenericMessage(context),
  };
}

function getNotFoundError(context: string): ParsedError {
  switch (context) {
    case 'event':
      return {
        type: 'not-found',
        title: 'Event Not Found',
        message: 'This event doesn\'t exist or may have been deleted.',
      };
    case 'post':
      return {
        type: 'not-found',
        title: 'Post Not Found',
        message: 'This post doesn\'t exist or may have been deleted.',
      };
    case 'invite':
      return {
        type: 'expired',
        title: 'Invalid Invite',
        message: 'This invite link is invalid, expired, or has already been used.',
      };
    default:
      return {
        type: 'not-found',
        title: 'Not Found',
        message: 'The page you\'re looking for doesn\'t exist or may have been removed.',
      };
  }
}

function getAccessDeniedMessage(context: string): string {
  switch (context) {
    case 'event':
      return 'You don\'t have permission to access this event. You may need an invite link to join.';
    case 'post':
      return 'You don\'t have permission to view this post.';
    case 'invite':
      return 'You don\'t have permission to use this invite.';
    default:
      return 'You don\'t have permission to access this page.';
  }
}

function getGenericMessage(context: string): string {
  switch (context) {
    case 'event':
      return 'We encountered an error while loading the event. Please try again.';
    case 'post':
      return 'We encountered an error while loading the post. Please try again.';
    case 'invite':
      return 'We encountered an error with this invite. Please try again.';
    default:
      return 'We encountered an unexpected error. Please try again.';
  }
}
