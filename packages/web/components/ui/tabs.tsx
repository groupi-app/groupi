'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import * as React from 'react';

import { cn } from '@/lib/utils';

// Context to share the active tab value and layoutId for animation
interface TabsContextValue {
  activeTab: string | undefined;
  layoutId: string;
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
}

function Tabs({
  layoutId,
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
    <TabsContext.Provider value={{ activeTab, layoutId: finalLayoutId }}>
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
  return (
    <TabsPrimitive.List
      data-slot='tabs-list'
      className={cn(
        // Clean tab container with relative positioning for highlight
        'relative inline-flex h-10 items-center justify-center rounded-soft bg-muted p-1 text-muted-foreground border border-border/50 shadow-sm',
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

  return (
    <TabsPrimitive.Trigger
      data-slot='tabs-trigger'
      value={value}
      className={cn(
        // Base styles - relative for stacking context, z-10 to appear above highlight
        'relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-soft px-4 py-1.5 text-sm font-medium ring-offset-background transition-colors duration-fast focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        // Text color transitions
        'hover:text-foreground data-[state=active]:text-foreground',
        className
      )}
      suppressHydrationWarning
      {...props}
    >
      {/* Animated highlight background */}
      {isActive && context && (
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
  return (
    <TabsPrimitive.Content
      data-slot='tabs-content'
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
