'use client';
import { Component, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
class Boundary extends Component<
  { children: ReactNode; onRetry: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className='space-y-3'>
        <p role='alert'>
          Event sharing is unavailable. Your current access or Group policy may
          have changed.
        </p>
        <Button variant='outline' onClick={this.props.onRetry}>
          Retry Event sharing
        </Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function AudienceBoundary({ children }: { children: ReactNode }) {
  const [attempt, setAttempt] = useState(0);
  return (
    <Boundary key={attempt} onRetry={() => setAttempt(value => value + 1)}>
      {children}
    </Boundary>
  );
}
