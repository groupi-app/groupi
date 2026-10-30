'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import * as React from 'react';

import { cn } from '@/lib/utils';

// Context to share the active tab value and layoutId for animation
interface TabsContextValue {
  activeTab: string | undefined;
  layoutId: string;
  presentation: 'default' | 'soft';
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  return context;
}

// Extended Tabs root that tracks active value for animation
interface TabsProps extends React.ComponentProps<typeof TabsPrimitive.Root> {
  /** Unique ID for the animated highlight (required when using multiple animated tabs) */
  layoutId?: string;
  /** Attached index tabs joined to their content sheet, without a moving highlight. */
  presentation?: 'default' | 'soft';
}

function Tabs({
  layoutId,
  presentation = 'soft',
  defaultValue,
  value,
  onValueChange,
  ...props
}: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(value ?? defaultValue);
  const generatedId = React.useId();
  const finalLayoutId = layoutId ?? `tabs-highlight-${generatedId}`;

  // Sync with controlled value
  React.useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value);
    }
  }, [value]);

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      setActiveTab(newValue);
      onValueChange?.(newValue);
    },
    [onValueChange]
  );

  return (
    <TabsContext.Provider
      value={{ activeTab, layoutId: finalLayoutId, presentation }}
    >
      <TabsPrimitive.Root
        defaultValue={defaultValue}
        value={value}
        onValueChange={handleValueChange}
        {...props}
      />
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const soft = useTabsContext()?.presentation === 'soft';
  return (
    <TabsPrimitive.List
      data-slot='tabs-list'
      data-presentation={soft ? 'soft' : undefined}
      className={cn(
        // Clean tab container with relative positioning for highlight
        'relative inline-flex h-10 items-center justify-center rounded-soft bg-muted p-1 text-muted-foreground border border-border/50 shadow-raised',
        soft &&
          'h-auto flex-nowrap justify-start gap-1 border-border bg-bg-sunken p-1 shadow-none',
        className
      )}
      {...props}
    />
  );
}

interface TabsTriggerProps
  extends React.ComponentProps<typeof TabsPrimitive.Trigger> {
  /** The value of this tab (required for animation) */
  value: string;
}

export function TabsTrigger({
  className,
  value,
  children,
  ...props
}: TabsTriggerProps) {
  const context = useTabsContext();
  const isActive = context?.activeTab === value;
  const soft = context?.presentation === 'soft';

  return (
    <TabsPrimitive.Trigger
      data-slot='tabs-trigger'
      data-presentation={soft ? 'soft' : undefined}
      value={value}
      className={cn(
        // Base styles - relative for stacking context, z-lifted to appear above highlight
        'relative z-lifted inline-flex items-center justify-center whitespace-nowrap rounded-soft px-4 py-1.5 text-sm font-medium ring-offset-background transition-colors duration-fast focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        // Text color transitions
        'hover:text-foreground data-[state=active]:text-foreground',
        soft &&
          'border-2 border-transparent whitespace-nowrap text-center font-semibold data-[state=active]:border-primary data-[state=active]:bg-background motion-reduce:transition-none',
        className
      )}
      suppressHydrationWarning
      {...props}
    >
      {/* Animated highlight background */}
      {isActive && context && !soft && (
        <motion.div
          layoutId={context.layoutId}
          className='absolute inset-0 rounded-soft bg-background shadow-raised'
          style={{ zIndex: -1 }}
          initial={false}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 35,
          }}
        />
      )}
      {children}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  const soft = useTabsContext()?.presentation === 'soft';
  return (
    <TabsPrimitive.Content
      data-slot='tabs-content'
      data-presentation={soft ? 'soft' : undefined}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      suppressHydrationWarning
      {...props}
    />
  );
}

TabsList.displayName = TabsPrimitive.List.displayName;
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs };
