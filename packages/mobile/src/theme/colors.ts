/**
 * Color theme for React Native app
 * Follows React Navigation theme structure
 */

export const Colors = {
  light: {
    primary: '#007AFF',
    background: '#FFFFFF',
    card: '#F2F2F7',
    text: '#000000',
    border: '#C7C7CC',
    notification: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    secondary: '#8E8E93',
  },
  dark: {
    primary: '#0A84FF',
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    border: '#38383A',
    notification: '#FF453A',
    success: '#30D158',
    warning: '#FF9F0A',
    secondary: '#8E8E93',
  },
};

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;
