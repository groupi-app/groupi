'use client';

import { useCallback } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import type {
  AutomationAction,
  ActionType,
  TriggerType,
  CustomAddonTemplate,
} from '@/lib/custom-addon-schema';
import { ACTION_META } from './automation-utils';
import { ActionRow } from './action-row';

interface ActionConfiguratorProps {
  actions: AutomationAction[];
  onChange: (actions: AutomationAction[]) => void;
  template: CustomAddonTemplate;
  triggerContext?: TriggerType;
  label?: string;
}

export function ActionConfigurator({
  actions,
  onChange,
  template,
  triggerContext = 'form_submitted',
  label = 'Actions',
}: ActionConfiguratorProps) {
  const addAction = useCallback(
    (type: ActionType) => {
      const newAction: AutomationAction = { type, message: '' };
      onChange([...actions, newAction]);
    },
    [actions, onChange]
  );

  const updateAction = useCallback(
    (index: number, partial: Partial<AutomationAction>) => {
      const updated = actions.map((a, i) =>
        i === index ? { ...a, ...partial } : a
      );
      onChange(updated);
    },
    [actions, onChange]
  );

  const removeAction = useCallback(
    (index: number) => {
      onChange(actions.filter((_, i) => i !== index));
    },
    [actions, onChange]
  );

  return (
    <div className='space-y-1.5'>
      <div className='flex items-center justify-between'>
        <Label className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
          {label}
        </Label>
        <Select onValueChange={v => addAction(v as ActionType)}>
          <SelectTrigger className='h-7 w-auto text-xs border rounded-input px-2'>
            <span>+ Action</span>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ACTION_META) as ActionType[]).map(type => (
              <SelectItem key={type} value={type}>
                {ACTION_META[type].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {actions.length === 0 && (
        <p className='text-xs text-muted-foreground italic'>
          No actions configured
        </p>
      )}

      {actions.map((action, idx) => (
        <ActionRow
          key={idx}
          action={action}
          template={template}
          triggerType={triggerContext}
          onChange={partial => updateAction(idx, partial)}
          onRemove={() => removeAction(idx)}
        />
      ))}
    </div>
  );
}
