import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Platform, TextInput } from 'react-native';

function Input({
  className,
  onFocus,
  onBlur,
  placeholderClassName: _placeholderClassName,
  ...props
}: React.ComponentPropsWithRef<typeof TextInput> & {
  placeholderClassName?: string;
  'aria-invalid'?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const invalid = props['aria-invalid'] === true;
  return (
    <TextInput
      className={cn(
        'dark:bg-input/30 border-input bg-background text-foreground flex min-h-12 w-full min-w-0 flex-row items-center rounded-input border px-3 py-2.5 text-base leading-5',
        props.editable === false &&
          cn(
            'opacity-50',
            Platform.select({
              web: 'disabled:pointer-events-none disabled:cursor-not-allowed',
            })
          ),
        Platform.select({
          web: cn(
            'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] md:text-sm',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
          ),
          native: 'placeholder:text-muted-foreground/50',
        }),
        focused && 'border-2 border-border-focus',
        invalid && 'border-2 border-border-error',
        className
      )}
      {...props}
      onFocus={event => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={event => {
        setFocused(false);
        onBlur?.(event);
      }}
    />
  );
}

export { Input };
