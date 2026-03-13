'use client';

import { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { Automation } from '@/lib/custom-addon-schema';
import { useBuilder } from './builder-context';
import { AutomationCard } from './automation-card';

function generateId(): string {
  return `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function AutomationList() {
  const { template, updateTemplate } = useBuilder();
  const automations = useMemo(
    () => template.automations ?? [],
    [template.automations]
  );

  const addAutomation = useCallback(() => {
    const newAutomation: Automation = {
      id: generateId(),
      name: '',
      enabled: true,
      trigger: { type: 'form_submitted' },
      conditions: [],
      actions: [],
    };
    updateTemplate({
      automations: [...automations, newAutomation],
    });
  }, [automations, updateTemplate]);

  const updateAutomation = useCallback(
    (id: string, partial: Partial<Automation>) => {
      updateTemplate({
        automations: automations.map(a =>
          a.id === id ? { ...a, ...partial } : a
        ),
      });
    },
    [automations, updateTemplate]
  );

  const removeAutomation = useCallback(
    (id: string) => {
      updateTemplate({
        automations: automations.filter(a => a.id !== id),
      });
    },
    [automations, updateTemplate]
  );

  return (
    <div className='space-y-3'>
      {automations.length === 0 && (
        <p className='text-sm text-muted-foreground'>
          No automations yet. Add one to make your add-on react to events.
        </p>
      )}

      {automations.map(automation => (
        <AutomationCard
          key={automation.id}
          automation={automation}
          template={template}
          onChange={partial => updateAutomation(automation.id, partial)}
          onRemove={() => removeAutomation(automation.id)}
        />
      ))}

      <Button
        variant='outline'
        onClick={addAutomation}
        className='w-full rounded-button'
        type='button'
      >
        + Add Automation
      </Button>
    </div>
  );
}
