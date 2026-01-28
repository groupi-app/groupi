/**
 * Tests for color theme
 */

import { describe, it, expect } from 'vitest';
import { Colors, type ColorScheme } from '../theme/colors';

describe('Colors', () => {
  describe('light theme', () => {
    it('should have primary color', () => {
      expect(Colors.light.primary).toBe('#007AFF');
    });

    it('should have background color', () => {
      expect(Colors.light.background).toBe('#FFFFFF');
    });

    it('should have card color', () => {
      expect(Colors.light.card).toBe('#F2F2F7');
    });

    it('should have text color', () => {
      expect(Colors.light.text).toBe('#000000');
    });

    it('should have border color', () => {
      expect(Colors.light.border).toBe('#C7C7CC');
    });

    it('should have notification color', () => {
      expect(Colors.light.notification).toBe('#FF3B30');
    });

    it('should have success color', () => {
      expect(Colors.light.success).toBe('#34C759');
    });

    it('should have warning color', () => {
      expect(Colors.light.warning).toBe('#FF9500');
    });

    it('should have secondary color', () => {
      expect(Colors.light.secondary).toBe('#8E8E93');
    });
  });

  describe('dark theme', () => {
    it('should have primary color', () => {
      expect(Colors.dark.primary).toBe('#0A84FF');
    });

    it('should have background color', () => {
      expect(Colors.dark.background).toBe('#000000');
    });

    it('should have card color', () => {
      expect(Colors.dark.card).toBe('#1C1C1E');
    });

    it('should have text color', () => {
      expect(Colors.dark.text).toBe('#FFFFFF');
    });

    it('should have border color', () => {
      expect(Colors.dark.border).toBe('#38383A');
    });

    it('should have notification color', () => {
      expect(Colors.dark.notification).toBe('#FF453A');
    });

    it('should have success color', () => {
      expect(Colors.dark.success).toBe('#30D158');
    });

    it('should have warning color', () => {
      expect(Colors.dark.warning).toBe('#FF9F0A');
    });

    it('should have secondary color', () => {
      expect(Colors.dark.secondary).toBe('#8E8E93');
    });
  });

  describe('theme structure', () => {
    it('should have light and dark themes', () => {
      expect(Colors).toHaveProperty('light');
      expect(Colors).toHaveProperty('dark');
    });

    it('should have same properties in light and dark', () => {
      const lightKeys = Object.keys(Colors.light);
      const darkKeys = Object.keys(Colors.dark);

      expect(lightKeys).toEqual(darkKeys);
    });

    it('light and dark should have all required colors', () => {
      const requiredColors = [
        'primary',
        'background',
        'card',
        'text',
        'border',
        'notification',
        'success',
        'warning',
        'secondary',
      ];

      requiredColors.forEach(color => {
        expect(Colors.light).toHaveProperty(color);
        expect(Colors.dark).toHaveProperty(color);
      });
    });
  });

  describe('type exports', () => {
    it('should allow ColorScheme type usage', () => {
      const scheme: ColorScheme = 'light';
      expect(['light', 'dark']).toContain(scheme);
    });

    it('should allow accessing theme via ColorScheme', () => {
      const scheme: ColorScheme = 'dark';
      const colors = Colors[scheme];
      expect(colors.primary).toBe('#0A84FF');
    });
  });
});
