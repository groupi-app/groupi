'use client';

import { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  AutomationAction,
  TriggerType,
  CustomAddonTemplate,
} from '@/lib/custom-addon-schema';
import { ACTION_META } from './automation-utils';
import { VariablePicker } from './variable-picker';
import { VariableInput } from './variable-input';
import { getDataBlocksForTrigger } from './building-blocks';

/** Collect all toggle fields across all sections in a template. */
function getToggleFields(
  template: CustomAddonTemplate
): Array<{ id: string; label: string }> {
  const fields: Array<{ id: string; label: string }> = [];
  for (const section of template.sections ?? []) {
    for (const field of section.fields ?? []) {
      if (field.type === 'toggle') {
        fields.push({ id: field.id, label: field.label || field.id });
      }
    }
  }
  return fields;
}

interface ActionRowProps {
  action: AutomationAction;
  template: CustomAddonTemplate;
  triggerType: TriggerType;
  onChange: (partial: Partial<AutomationAction>) => void;
  onRemove: () => void;
}

export function ActionRow({
  action,
  template,
  triggerType,
  onChange,
  onRemove,
}: ActionRowProps) {
  const meta = ACTION_META[action.type];
  const dataBlocks = useMemo(
    () => getDataBlocksForTrigger(template, triggerType),
    [template, triggerType]
  );
  const toggleFields = useMemo(() => getToggleFields(template), [template]);
  const showToggleFilter =
    (action.type === 'notify_members' || action.type === 'notify_organizers') &&
    toggleFields.length > 0;

  const handleVariableInsert = useCallback(
    (field: 'message' | 'title' | 'webhookUrl' | 'key', variable: string) => {
      const current = (action[field] as string) ?? '';
      onChange({ [field]: current + variable });
    },
    [action, onChange]
  );

  const handleDataInsert = useCallback(
    (variable: string) => {
      const current = typeof action.data === 'string' ? action.data : '';
      onChange({ data: current + variable });
    },
    [action.data, onChange]
  );

  return (
    <div className='border border-border rounded-card p-3 space-y-2'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium'>{meta.label}</span>
        <Button
          variant='ghost'
          size='sm'
          onClick={onRemove}
          className='text-muted-foreground hover:text-error h-7 w-7 p-0'
          type='button'
        >
          ×
        </Button>
      </div>

      <p className='text-xs text-muted-foreground'>{meta.description}</p>

      {meta.requiresTitle && (
        <div className='space-y-1'>
          <div className='flex items-center justify-between'>
            <Label className='text-xs'>Title</Label>
            <VariablePicker
              template={template}
              triggerType={triggerType}
              onInsert={v => handleVariableInsert('title', v)}
            />
          </div>
          <VariableInput
            value={action.title ?? ''}
            onChange={v => onChange({ title: v })}
            dataBlocks={dataBlocks}
            placeholder='Post title'
            className='rounded-input text-sm'
          />
        </div>
      )}

      {meta.requiresMessage && (
        <div className='space-y-1'>
          <div className='flex items-center justify-between'>
            <Label className='text-xs'>Message</Label>
            <VariablePicker
              template={template}
              triggerType={triggerType}
              onInsert={v => handleVariableInsert('message', v)}
            />
          </div>
          <VariableInput
            value={action.message ?? ''}
            onChange={v => onChange({ message: v })}
            dataBlocks={dataBlocks}
            multiline
            placeholder='Message content — use {{variables}} for dynamic values'
            className='rounded-input text-sm min-h-[60px]'
          />
        </div>
      )}

      {meta.requiresUrl && (
        <>
          <div className='space-y-1'>
            <Label className='text-xs'>Webhook URL</Label>
            <Input
              value={action.webhookUrl ?? ''}
              onChange={e => onChange({ webhookUrl: e.target.value })}
              placeholder='https://example.com/webhook'
              className='rounded-input text-sm'
            />
          </div>
          <div className='space-y-1'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs'>Payload</Label>
              <VariablePicker
                template={template}
                triggerType={triggerType}
                onInsert={v => handleVariableInsert('message', v)}
              />
            </div>
            <VariableInput
              value={action.message ?? ''}
              onChange={v => onChange({ message: v })}
              dataBlocks={dataBlocks}
              multiline
              placeholder='JSON payload — use {{variables}} for dynamic values. Leave empty for default payload.'
              className='rounded-input text-sm min-h-[60px] font-mono'
            />
            <p className='text-[10px] text-muted-foreground'>
              Custom JSON body sent as HTTP POST. If empty, sends trigger
              context automatically.
            </p>
          </div>
        </>
      )}

      {meta.requiresKey && (
        <>
          <div className='space-y-1'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs'>Data key</Label>
              <VariablePicker
                template={template}
                triggerType={triggerType}
                onInsert={v => handleVariableInsert('key', v)}
              />
            </div>
            <VariableInput
              value={action.key ?? ''}
              onChange={v => onChange({ key: v })}
              dataBlocks={dataBlocks}
              placeholder='Key for the data entry'
              className='rounded-input text-sm'
            />
          </div>
          <div className='space-y-1'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs'>Data value</Label>
              <VariablePicker
                template={template}
                triggerType={triggerType}
                onInsert={handleDataInsert}
              />
            </div>
            <VariableInput
              value={
                typeof action.data === 'string'
                  ? action.data
                  : action.data !== undefined
                    ? JSON.stringify(action.data)
                    : ''
              }
              onChange={v => onChange({ data: v })}
              dataBlocks={dataBlocks}
              multiline
              placeholder='Value to store — use {{variables}} for dynamic values'
              className='rounded-input text-sm min-h-[60px]'
            />
          </div>
        </>
      )}

      {showToggleFilter && (
        <div className='space-y-1'>
          <Label className='text-xs'>Filter recipients by toggle</Label>
          <Select
            value={action.recipientToggleField ?? '__none__'}
            onValueChange={v =>
              onChange({
                recipientToggleField: v === '__none__' ? undefined : v,
              })
            }
          >
            <SelectTrigger className='h-8 rounded-input text-xs'>
              <SelectValue placeholder='All members' />
            </SelectTrigger>
            <SelectContent className='rounded-dropdown'>
              <SelectItem value='__none__'>All members</SelectItem>
              {toggleFields.map(tf => (
                <SelectItem key={tf.id} value={tf.id}>
                  {tf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className='text-[10px] text-muted-foreground'>
            Only send to members whose toggle is enabled
          </p>
        </div>
      )}
    </div>
  );
}
