import { View } from 'react-native';
import { cn } from '@/lib/utils';

/** Decorative perforation reserved for a paper content/action seam. */
export function PaperDivider({ className }: { className?: string }) {
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'
      className={cn(
        'w-full border-t border-dashed border-border-strong',
        className
      )}
    />
  );
}
