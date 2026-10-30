import { Pressable, View, useWindowDimensions } from 'react-native';
import {
  CheckCircle2,
  CircleAlert,
  Info,
  TriangleAlert,
} from 'lucide-react-native';
import type {
  ToastConfig,
  ToastConfigParams,
} from 'react-native-toast-message';
import { Text } from './text';
import { Icon } from './icon';

const outcomes = {
  success: { icon: CheckCircle2, color: 'text-text-success', label: 'Success' },
  error: { icon: CircleAlert, color: 'text-text-error', label: 'Error' },
  warning: {
    icon: TriangleAlert,
    color: 'text-text-warning',
    label: 'Warning',
  },
  info: { icon: Info, color: 'text-text-info', label: 'Information' },
};

export function ToastFeedback({
  outcome,
  text1,
  text2,
  onPress,
}: Partial<Pick<ToastConfigParams<unknown>, 'text1' | 'text2' | 'onPress'>> & {
  outcome: keyof typeof outcomes;
}) {
  const { width } = useWindowDimensions();
  const toastWidth = Math.max(0, Math.min(width - 32, 512));
  const { icon, color, label } = outcomes[outcome];
  const announcement = [label, text1, text2].filter(Boolean).join('. ');
  const content = (
    <View
      accessibilityLiveRegion='polite'
      accessible={!onPress}
      accessibilityLabel={announcement}
      style={{ width: toastWidth }}
      className='mx-4 max-w-lg flex-row items-center gap-3 rounded-card border-2 border-sticker-edge bg-popover px-4 py-3 shadow-floating'
    >
      <Icon
        as={icon}
        size={22}
        className={color}
        accessibilityElementsHidden
        importantForAccessibility='no-hide-descendants'
      />
      <View className='min-w-0 flex-1 gap-1'>
        {text1 ? (
          <Text className='text-sm font-semibold text-popover-foreground'>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text className='text-sm text-popover-foreground'>{text2}</Text>
        ) : null}
      </View>
    </View>
  );
  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={announcement}
      accessibilityLiveRegion='polite'
    >
      {content}
    </Pressable>
  ) : (
    content
  );
}

export const toastConfig: ToastConfig = {
  success: props => <ToastFeedback {...props} outcome='success' />,
  error: props => <ToastFeedback {...props} outcome='error' />,
  warning: props => <ToastFeedback {...props} outcome='warning' />,
  info: props => <ToastFeedback {...props} outcome='info' />,
};
