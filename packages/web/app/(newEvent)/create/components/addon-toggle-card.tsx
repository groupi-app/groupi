'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { type AddonConfig, type AddonConfigProps } from './addon-registry';

interface AddonToggleCardProps extends AddonConfigProps {
  addon: AddonConfig;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function AddonToggleCard({
  addon,
  enabled,
  onToggle,
  formState,
  setFormState,
}: AddonToggleCardProps) {
  const IconComponent = Icons[addon.iconName];
  const [expanded, setExpanded] = useState(false);

  // Auto-expand when first enabled, collapse when disabled
  useEffect(() => {
    setExpanded(enabled);
  }, [enabled]);

  return (
    <Card
      className={cn(
        'transition-all duration-normal',
        enabled && 'ring-2 ring-primary/30'
      )}
    >
      <div className='flex items-center gap-3 p-4'>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-button bg-muted'>
          <IconComponent className='size-5 text-muted-foreground' />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium leading-none'>{addon.name}</p>
          <p className='text-sm text-muted-foreground mt-1'>
            {addon.description}
          </p>
        </div>
        {enabled && (
          <button
            type='button'
            onClick={() => setExpanded(prev => !prev)}
            className='shrink-0 p-1 rounded-md hover:bg-muted transition-colors duration-fast'
            aria-label={expanded ? 'Collapse settings' : 'Expand settings'}
          >
            <Icons.down
              className={cn(
                'size-4 text-muted-foreground transition-transform duration-normal',
                expanded && 'rotate-180'
              )}
            />
          </button>
        )}
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          data-test={`addon-toggle-${addon.id}`}
        />
      </div>
      <Collapsible open={enabled && expanded}>
        <CollapsibleContent>
          <div className='px-4 pb-4 pt-0'>
            <addon.CreateConfigComponent
              formState={formState}
              setFormState={setFormState}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
