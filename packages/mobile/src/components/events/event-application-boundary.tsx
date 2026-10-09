import { Component, type ReactNode } from 'react';
import { View } from 'react-native';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
export class EventApplicationBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <DetailScreenTemplate title='Event applications'>
        <View className='gap-4 pt-4'>
          <Text accessibilityRole='alert'>
            Applications are unavailable or your current Event authority has
            changed.
          </Text>
          <Button
            accessibilityLabel='Retry applications'
            variant='outline'
            onPress={() => this.setState({ failed: false })}
          >
            Retry applications
          </Button>
        </View>
      </DetailScreenTemplate>
    ) : (
      this.props.children
    );
  }
}
