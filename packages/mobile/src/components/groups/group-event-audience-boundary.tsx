import { Component, type ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
export class GroupEventAudienceBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <View className='gap-3 p-4'>
        <Text accessibilityRole='alert'>
          Shared Events unavailable. Your access may have changed.
        </Text>
        <Button
          accessibilityLabel='Retry shared Event access'
          onPress={() => this.setState({ failed: false })}
        >
          Try again
        </Button>
      </View>
    ) : (
      this.props.children
    );
  }
}
