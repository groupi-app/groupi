import { Component, type ReactNode } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

/** Keep data-read failures inside their view so an editor draft survives. */
export class InviteListDataBoundary extends Component<
  { context: string; children: ReactNode; onFailure?: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFailure?.();
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View className='gap-3 rounded-card border border-border bg-card p-4'>
        <Text accessibilityRole='alert' className='text-destructive'>
          Unable to load {this.props.context}. Please try again.
        </Text>
        <Button
          variant='outline'
          accessibilityLabel={`Retry ${this.props.context}`}
          onPress={() => this.setState({ failed: false })}
        >
          Retry
        </Button>
      </View>
    );
  }
}
