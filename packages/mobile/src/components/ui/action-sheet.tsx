import { ActionSheetIOS, Platform, Alert } from 'react-native';

interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionSheetOptions {
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  cancelLabel?: string;
}

export function showActionSheet({
  title,
  message,
  options,
  cancelLabel = 'Cancel',
}: ActionSheetOptions) {
  if (Platform.OS === 'ios') {
    const labels = [...options.map(o => o.label), cancelLabel];
    const destructiveIndex = options.findIndex(o => o.destructive);

    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: labels,
        cancelButtonIndex: labels.length - 1,
        destructiveButtonIndex:
          destructiveIndex >= 0 ? destructiveIndex : undefined,
      },
      buttonIndex => {
        if (buttonIndex < options.length) {
          options[buttonIndex].onPress();
        }
      }
    );
  } else {
    // Android fallback using Alert with buttons (max 3 buttons)
    // For more options, you'd integrate a bottom sheet library
    const buttons: {
      text: string;
      style: 'default' | 'cancel' | 'destructive';
      onPress: () => void;
    }[] = options.map(opt => ({
      text: opt.label,
      style: (opt.destructive ? 'destructive' : 'default') as
        | 'default'
        | 'destructive',
      onPress: opt.onPress,
    }));

    buttons.push({ text: cancelLabel, style: 'cancel', onPress: () => {} });

    Alert.alert(title ?? '', message ?? '', buttons);
  }
}
