import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

export function getPostComposerKeyboardBehavior(platform: string) {
  return platform === 'ios' ? 'padding' : 'height';
}

export function PostComposerKeyboardView({ children }: PropsWithChildren) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={getPostComposerKeyboardBehavior(Platform.OS)}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
