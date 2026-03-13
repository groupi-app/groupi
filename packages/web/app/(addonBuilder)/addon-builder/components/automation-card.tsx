'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  Automation,
  AutomationAction,
  AutomationCondition,
  TriggerType,
  ActionType,
  CustomAddonTemplate,
} from '@/lib/custom-addon-schema';
import {
  TRIGGER_META,
  ACTION_META,
  getAvailableTriggers,
  getListItemFields,
} from './automation-utils';
import { ActionRow } from './action-row';
import { ConditionRow } from './condition-row';

interface AutomationCardProps {
  automation: Automation;
  template: CustomAddonTemplate;
  onChange: (updated: Partial<Automation>) => void;
  onRemove: () => void;
}

export function AutomationCard({
  automation,
  template,
  onChange,
  onRemove,
}: AutomationCardProps) {
  const availableTriggers = getAvailableTriggers(template);

  const updateTrigger = useCallback(
    (type: TriggerType) => {
      onChange({
        trigger: { ...automation.trigger, type },
      });
    },
    [automation.trigger, onChange]
  );

  const addCondition = useCallback(() => {
    const newCondition: AutomationCondition = {
      field: '',
      operator: 'equals',
      value: '',
    };
    onChange({ conditions: [...automation.conditions, newCondition] });
  }, [automation.conditions, onChange]);

  const updateCondition = useCallback(
    (index: number, partial: Partial<AutomationCondition>) => {
      const updated = automation.conditions.map((c, i) =>
        i === index ? { ...c, ...partial } : c
      );
      onChange({ conditions: updated });
    },
    [automation.conditions, onChange]
  );

  const removeCondition = useCallback(
    (index: number) => {
      onChange({
        conditions: automation.conditions.filter((_, i) => i !== index),
      });
    },
    [automation.conditions, onChange]
  );

  const addAction = useCallback(
    (type: ActionType) => {
      const newAction: AutomationAction = { type, message: '' };
      onChange({ actions: [...automation.actions, newAction] });
    },
    [automation.actions, onChange]
  );

  const updateAction = useCallback(
    (index: number, partial: Partial<AutomationAction>) => {
      const updated = automation.actions.map((a, i) =>
        i === index ? { ...a, ...partial } : a
      );
      onChange({ actions: updated });
    },
    [automation.actions, onChange]
  );

  const removeAction = useCallback(
    (index: number) => {
      onChange({ actions: automation.actions.filter((_, i) => i !== index) });
    },
    [automation.actions, onChange]
  );

  return (
    <Card className='rounded-card shadow-raised'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between gap-2'>
          <Input
            value={automation.name}
            onChange={e => onChange({ name: e.target.value })}
            placeholder='Automation name'
            className='text-sm font-medium border-none p-0 h-auto focus-visible:ring-0 bg-transparent'
          />
          <div className='flex items-center gap-2 shrink-0'>
            <Switch
              checked={automation.enabled}
              onCheckedChange={enabled => onChange({ enabled })}
            />
            <Button
              variant='ghost'
              size='sm'
              onClick={onRemove}
              className='text-muted-foreground hover:text-error h-7 w-7 p-0'
            >
              ×
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4 pt-0'>
        {/* Trigger */}
        <div className='space-y-1.5'>
          <Label className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
            When
          </Label>
          <Select
            value={automation.trigger.type}
            onValueChange={v => updateTrigger(v as TriggerType)}
          >
            <SelectTrigger className='rounded-input'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTriggers.map(type => (
                <SelectItem key={type} value={type}>
                  <div>
                    <div className='text-sm'>{TRIGGER_META[type].label}</div>
                    <div className='text-xs text-muted-foreground'>
                      {TRIGGER_META[type].description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Extra trigger config */}
          {automation.trigger.type === 'list_item_full' && (
            <Select
              value={automation.trigger.fieldId ?? ''}
              onValueChange={v =>
                onChange({ trigger: { ...automation.trigger, fieldId: v } })
              }
            >
              <SelectTrigger className='rounded-input'>
                <SelectValue placeholder='Select list field' />
              </SelectTrigger>
              <SelectContent>
                {getListItemFields(template).map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label || f.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {automation.trigger.type === 'vote_threshold' && (
            <Input
              type='number'
              min={1}
              value={automation.trigger.threshold ?? ''}
              onChange={e =>
                onChange({
                  trigger: {
                    ...automation.trigger,
                    threshold: parseInt(e.target.value) || undefined,
                  },
                })
              }
              placeholder='Vote count threshold'
              className='rounded-input'
            />
          )}
        </div>

        {/* Conditions */}
        <div className='space-y-1.5'>
          <div className='flex items-center justify-between'>
            <Label className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
              Only if
            </Label>
            <Button
              variant='outline'
              size='sm'
              onClick={addCondition}
              className='h-7 text-xs'
              type='button'
            >
              + Condition
            </Button>
          </div>

          {automation.conditions.length === 0 && (
            <p className='text-xs text-muted-foreground italic'>
              No conditions — automation always fires
            </p>
          )}

          {automation.conditions.map((condition, idx) => (
            <ConditionRow
              key={idx}
              condition={condition}
              template={template}
              onChange={partial => updateCondition(idx, partial)}
              onRemove={() => removeCondition(idx)}
            />
          ))}
        </div>

        {/* Actions */}
        <div className='space-y-1.5'>
          <div className='flex items-center justify-between'>
            <Label className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
              Then
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

          {automation.actions.length === 0 && (
            <p className='text-xs text-error'>
              At least one action is required
            </p>
          )}

          {automation.actions.map((action, idx) => (
            <ActionRow
              key={idx}
              action={action}
              template={template}
              triggerType={automation.trigger.type}
              onChange={partial => updateAction(idx, partial)}
              onRemove={() => removeAction(idx)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
