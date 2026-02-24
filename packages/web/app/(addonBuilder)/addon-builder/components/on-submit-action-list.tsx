'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBuilder } from './builder-context';
import { ActionConfigurator } from './action-configurator';

export function OnSubmitActionList() {
  const { template, updateTemplate } = useBuilder();

  return (
    <div className='space-y-3'>
      <div className='space-y-1'>
        <Label className='text-xs'>Button label</Label>
        <Input
          value={template.submitButtonLabel ?? ''}
          onChange={e => updateTemplate({ submitButtonLabel: e.target.value })}
          placeholder='Submit Response'
          className='h-8 rounded-input text-sm'
        />
      </div>
      <ActionConfigurator
        actions={template.onSubmitActions ?? []}
        onChange={actions => updateTemplate({ onSubmitActions: actions })}
        template={template}
        triggerContext='form_submitted'
        label='Actions'
      />
    </div>
  );
}
