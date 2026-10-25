import { Component, type ReactNode } from 'react';
/** Keep query failures recoverable and hide final deletion while readiness is unknown. */
export class AccountResolutionBoundary extends Component<
  {
    children: ReactNode;
    fallback: (retry: () => void) => ReactNode;
  },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed
      ? this.props.fallback(() => this.setState({ failed: false }))
      : this.props.children;
  }
}
