import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from 'expo-router';

/**
 * Prevents navigation when the form has unsaved changes.
 * Shows an Alert dialog asking the user to confirm discarding changes.
 */
export function useUnsavedChanges(hasChanges: boolean) {
  const navigation = useNavigation();

  useEffect(() => {
    if (!hasChanges) return;

    const unsubscribe = navigation.addListener('beforeRemove', e => {
      e.preventDefault();

      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [hasChanges, navigation]);
}
