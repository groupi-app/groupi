'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { IconPicker } from './icon-picker';
import { useBuilder } from './builder-context';

export function TemplateMetadataForm() {
  const { template, updateTemplate } = useBuilder();

  const hasFormSections = useMemo(
    () => template.sections.some(s => (s.layout ?? 'form') === 'form'),
    [template.sections]
  );

  const isCardOnly = template.settings?.cardOnly ?? false;

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='template-name'>Name</Label>
        <Input
          id='template-name'
          placeholder='e.g., Potluck Signup'
          value={template.name}
          onChange={e => updateTemplate({ name: e.target.value })}
          maxLength={60}
          className='rounded-input'
        />
        <p className='text-xs text-muted-foreground'>
          {template.name.length}/60
        </p>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='template-description'>Description</Label>
        <Textarea
          id='template-description'
          placeholder='A short description of what this add-on does'
          value={template.description}
          onChange={e => updateTemplate({ description: e.target.value })}
          maxLength={200}
          rows={2}
          className='resize-none rounded-input'
        />
        <p className='text-xs text-muted-foreground'>
          {template.description.length}/200
        </p>
      </div>

      <div className='space-y-2'>
        <Label>Icon</Label>
        <IconPicker
          value={template.iconName}
          onChange={iconName => updateTemplate({ iconName })}
        />
      </div>

      <div className='space-y-3'>
        <Label>Settings</Label>

        {/* Card-only mode */}
        <div className='flex min-w-0 items-start justify-between gap-4 rounded-input border border-border p-3'>
          <div>
            <p className='text-sm font-medium'>Card only</p>
            <p className='text-xs text-muted-foreground'>
              No dedicated page — toggles and buttons render on the event card
            </p>
          </div>
          <Switch
            className='shrink-0'
            aria-label='Card only'
            checked={isCardOnly}
            onCheckedChange={checked =>
              updateTemplate({
                settings: {
                  ...template.settings,
                  cardOnly: checked,
                  // Auto-disable requiresCompletion when enabling card-only
                  ...(checked ? { requiresCompletion: false } : {}),
                },
              })
            }
          />
        </div>

        {/* Require completion — disabled when card-only */}
        <div className='flex min-w-0 items-start justify-between gap-4 rounded-input border border-border p-3'>
          <div>
            <p className='text-sm font-medium'>Require completion</p>
            <p className='text-xs text-muted-foreground'>
              {isCardOnly
                ? 'Not available in card-only mode'
                : hasFormSections
                  ? 'Members must complete this add-on before viewing event content'
                  : 'Requires at least one form section'}
            </p>
          </div>
          <Switch
            className='shrink-0'
            checked={
              !isCardOnly &&
              hasFormSections &&
              (template.settings?.requiresCompletion ?? false)
            }
            aria-label='Require completion'
            disabled={isCardOnly || !hasFormSections}
            onCheckedChange={checked =>
              updateTemplate({
                settings: {
                  ...template.settings,
                  requiresCompletion: checked,
                },
              })
            }
          />
        </div>

        {/* Card subtitle */}
        <div className='space-y-1 rounded-input border p-3'>
          <Label htmlFor='template-card-subtitle'>Card subtitle</Label>
          <Input
            id='template-card-subtitle'
            value={template.settings?.cardSubtitle ?? ''}
            onChange={e =>
              updateTemplate({
                settings: {
                  ...template.settings,
                  cardSubtitle: e.target.value || undefined,
                },
              })
            }
            placeholder='e.g., {{response_count}} votes cast'
            className='h-8 rounded-input text-sm'
          />
          <p className='text-[10px] text-muted-foreground'>
            Default: &quot;N responses&quot;. Use {'{{response_count}}'} for the
            count.
          </p>
        </div>

        {/* Card link label — hidden when card-only */}
        {!isCardOnly && (
          <div className='space-y-1 rounded-input border p-3'>
            <Label htmlFor='template-card-link'>Card link label</Label>
            <Input
              id='template-card-link'
              value={template.settings?.cardLinkLabel ?? ''}
              onChange={e =>
                updateTemplate({
                  settings: {
                    ...template.settings,
                    cardLinkLabel: e.target.value || undefined,
                  },
                })
              }
              placeholder='View'
              className='h-8 rounded-input text-sm'
            />
          </div>
        )}

        {/* Submit button label — only for non-card-only with form sections */}
        {!isCardOnly && hasFormSections && (
          <div className='space-y-1 rounded-input border p-3'>
            <Label htmlFor='template-submit-label'>Submit button label</Label>
            <Input
              id='template-submit-label'
              value={template.submitButtonLabel ?? ''}
              onChange={e =>
                updateTemplate({
                  submitButtonLabel: e.target.value || undefined,
                })
              }
              placeholder='Submit Response'
              className='h-8 rounded-input text-sm'
            />
          </div>
        )}
      </div>
    </div>
  );
}
