'use client';

import { Component, type ReactNode } from 'react';

export function UnavailableEventFeature({
  title,
  management = false,
}: {
  title: string;
  management?: boolean;
}) {
  return (
    <div
      role='status'
      className='space-y-1 rounded-card border border-border p-4'
    >
      <h2 className='font-heading font-semibold'>{title}</h2>
      <p className='text-sm text-muted-foreground'>
        {management
          ? 'This feature cannot be configured in this version. Its saved configuration and participant information are retained.'
          : 'This feature is unavailable in this version. Its saved information has been kept.'}
      </p>
    </div>
  );
}

/** Saved templates can outlive this renderer; never lose the whole Event to one feature. */
export class FeatureRenderingBoundary extends Component<
  {
    title: string;
    management?: boolean;
    children: ReactNode;
  },
  { unavailable: boolean }
> {
  state = { unavailable: false };
  static getDerivedStateFromError() {
    return { unavailable: true };
  }
  render() {
    return this.state.unavailable ? (
      <UnavailableEventFeature
        title={this.props.title}
        management={this.props.management}
      />
    ) : (
      this.props.children
    );
  }
}
