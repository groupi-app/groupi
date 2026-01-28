'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

export class QueryErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  // React.ErrorInfo type has complex generic constraints
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('QueryErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error);
      }

      return (
        <div className='flex flex-col items-center justify-center p-8 text-center'>
          <AlertTriangle className='w-12 h-12 text-destructive mb-4' />
          <h2 className='text-lg font-semibold mb-2'>Something went wrong</h2>
          <p className='text-muted-foreground mb-4'>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button
            onClick={() => this.setState({ hasError: false })}
            variant='outline'
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
