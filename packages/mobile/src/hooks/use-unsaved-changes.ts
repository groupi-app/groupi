import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from 'expo-router';

/**
 * Prevents navigation when the form has unsaved changes.
 * Shows an Alert dialog asking the user to confirm discarding changes.
 */
export function useUnsavedChanges(hasChanges: boolean) {
  const navigation = useNavigation();
  const allowNextNavigationRef = useRef(false);

  const allowNextNavigation = useCallback(() => {
    allowNextNavigationRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasChanges) return;

    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (allowNextNavigationRef.current) {
        allowNextNavigationRef.current = false;
        return;
      }

      e.preventDefault();

      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              allowNextNavigation();
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [allowNextNavigation, hasChanges, navigation]);

  return allowNextNavigation;
}
