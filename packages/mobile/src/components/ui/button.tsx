import { Text, TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { useReducedMotion } from 'react-native-reanimated';
import { Platform, Pressable, ActivityIndicator } from 'react-native';

// NOTE: group-* is not supported yet by Uniwind

const buttonVariants = cva(
  cn(
    'group min-h-[44px] shrink-0 flex-row items-center justify-center gap-2 rounded-button shadow-none',
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-primary active:bg-primary-pressed border-2 border-sticker-edge shadow-raised',
          Platform.select({ web: 'hover:bg-primary/90' })
        ),
        destructive: cn(
          'bg-destructive active:bg-destructive-pressed border-2 border-sticker-edge shadow-raised',
          Platform.select({
            web: 'hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
          })
        ),
        outline: cn(
          'border-border bg-background active:bg-accent dark:bg-input/30 dark:border-input dark:active:bg-input/50 border shadow-none',
          Platform.select({
            web: 'hover:bg-accent dark:hover:bg-input/50',
          })
        ),
        secondary: cn(
          'bg-secondary active:bg-secondary-pressed border-2 border-sticker-edge shadow-raised',
          Platform.select({ web: 'hover:bg-secondary/80' })
        ),
        ghost: cn(
          'active:bg-accent dark:active:bg-accent/50',
          Platform.select({ web: 'hover:bg-accent dark:hover:bg-accent/50' })
        ),
        link: '',
      },
      size: {
        default: cn(
          'h-10 px-4 py-2 sm:h-9',
          Platform.select({ web: 'has-[>svg]:px-3' })
        ),
        sm: cn(
          'h-9 gap-1.5 rounded-button px-3 sm:h-8',
          Platform.select({ web: 'has-[>svg]:px-2.5' })
        ),
        lg: cn(
          'h-11 rounded-button px-6 sm:h-10',
          Platform.select({ web: 'has-[>svg]:px-4' })
        ),
        icon: 'h-10 min-w-[44px] w-10 sm:h-9 sm:w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  cn(
    'text-foreground text-sm font-medium',
    Platform.select({ web: 'pointer-events-none transition-colors' })
  ),
  {
    variants: {
      variant: {
        default: 'text-primary-foreground',
        destructive: 'text-destructive-foreground',
        outline: 'text-foreground',
        secondary: 'text-secondary-foreground',
        ghost: 'text-foreground',
        link: cn(
          'text-primary group-active:underline',
          Platform.select({
            web: 'underline-offset-4 hover:underline group-hover:underline',
          })
        ),
      },
      size: {
        default: '',
        sm: '',
        lg: '',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = React.ComponentProps<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;
    loadingText?: string;
  };

function Button({
  className,
  variant,
  size,
  isLoading,
  loadingText,
  children,
  disabled,
  accessibilityState,
  ...props
}: ButtonProps) {
  const isDisabled = !!(disabled || isLoading);
  const reducedMotion = useReducedMotion();
  const renderContent = (content: React.ReactNode) => (
    <>
      {isLoading && (
        <ActivityIndicator
          size='small'
          animating={!reducedMotion}
          colorClassName={
            variant === 'destructive'
              ? 'accent-destructive-foreground'
              : variant === 'secondary'
                ? 'accent-secondary-foreground'
                : variant === 'default' || !variant
                  ? 'accent-primary-foreground'
                  : 'accent-foreground'
          }
        />
      )}
      {isLoading && loadingText ? (
        <Text className={cn(buttonTextVariants({ variant, size }))}>
          {loadingText}
        </Text>
      ) : typeof content === 'string' ? (
        <Text className={cn(buttonTextVariants({ variant, size }))}>
          {content}
        </Text>
      ) : (
        content
      )}
    </>
  );
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(
          isDisabled && 'opacity-50',
          buttonVariants({ variant, size }),
          !isDisabled && !reducedMotion && 'active:translate-y-[3px]',
          className
        )}
        role='button'
        {...props}
        disabled={isDisabled}
        accessibilityState={{
          ...accessibilityState,
          disabled: !!isDisabled,
          busy: !!isLoading,
        }}
      >
        {typeof children === 'function'
          ? state => renderContent(children(state))
          : renderContent(children)}
      </Pressable>
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
