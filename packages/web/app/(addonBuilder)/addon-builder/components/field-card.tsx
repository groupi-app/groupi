'use client';

import { useCallback, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import {
  FIELD_TYPE_LABELS,
  SUMMARY_TYPE_LABELS,
  CALLOUT_VARIANT_LABELS,
  BUTTON_VARIANT_LABELS,
  TEXT_FORMAT_LABELS,
  isDisplayField,
  getFieldErrors,
  type TemplateField,
  type SummaryType,
  type CalloutVariant,
  type ButtonVariant,
  type TextFormat,
  type AutomationAction,
  type AutomationCondition,
} from '@/lib/custom-addon-schema';
import { OptionsEditor, ListItemsEditor } from '@/lib/field-editors';
import { useBuilder } from './builder-context';
import { VariableInput } from './variable-input';
import { getDataBlocks } from './building-blocks';
import { ActionConfigurator } from './action-configurator';
import { ConditionRow } from './condition-row';
import { getVisibilityFieldOptions } from './automation-utils';

interface FieldCardProps {
  sectionId: string;
  field: TemplateField;
}

export function FieldCard({ sectionId, field }: FieldCardProps) {
  const { updateField, removeField, resluggifyFields, template, validation } =
    useBuilder();
  const dataBlocks = useMemo(() => getDataBlocks(template), [template]);
  const fieldErrors = useMemo(
    () => getFieldErrors(validation, field.id),
    [validation, field.id]
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const update = useCallback(
    (partial: Partial<TemplateField>) => {
      updateField(sectionId, field.id, partial);
    },
    [updateField, sectionId, field.id]
  );

  const isDisplay = isDisplayField(field.type);
  const supportsConfigurable =
    field.type === 'text' ||
    field.type === 'number' ||
    field.type === 'select' ||
    field.type === 'multiselect' ||
    field.type === 'vote' ||
    field.type === 'list_item';

  return (
    <div ref={setNodeRef} style={style}>
      <Card className='rounded-card border p-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <button
              className='cursor-grab touch-none text-muted-foreground hover:text-foreground'
              {...attributes}
              {...listeners}
            >
              <Icons.menu className='size-4 shrink-0' />
            </button>
            <Badge variant='outline' className='shrink-0 rounded-badge text-xs'>
              {FIELD_TYPE_LABELS[field.type]}
            </Badge>
          </div>
          <div className='flex items-center gap-1'>
            {!isDisplay && (
              <div className='flex items-center gap-1'>
                <Label
                  htmlFor={`required-${field.id}`}
                  className='text-xs text-muted-foreground'
                >
                  Required
                </Label>
                <Switch
                  id={`required-${field.id}`}
                  checked={field.required}
                  onCheckedChange={checked => update({ required: checked })}
                  className='scale-75'
                />
              </div>
            )}
            <Button
              variant='ghost'
              size='icon'
              className='size-7'
              onClick={() => removeField(sectionId, field.id)}
            >
              <Icons.trash className='size-3.5 text-muted-foreground' />
            </Button>
          </div>
        </div>

        {supportsConfigurable && (
          <div className='mt-2 flex items-center gap-2'>
            <Switch
              id={`configurable-${field.id}`}
              checked={field.configurable ?? false}
              onCheckedChange={checked => update({ configurable: checked })}
              className='scale-75'
            />
            <Label
              htmlFor={`configurable-${field.id}`}
              className='text-xs text-muted-foreground'
            >
              Organizer configures
            </Label>
            {field.configurable && (
              <span className='text-xs italic text-muted-foreground'>
                — content filled in per event
              </span>
            )}
          </div>
        )}

        <div className='mt-2 space-y-2'>
          {/* Label input — hidden for display fields and action buttons */}
          {!isDisplay && field.type !== 'action_button' && (
            <Input
              value={field.label}
              onChange={e => update({ label: e.target.value })}
              onBlur={resluggifyFields}
              placeholder='Field label'
              className='h-8 rounded-input text-sm'
            />
          )}

          {/* Text-specific options */}
          {field.type === 'text' && (
            <div className='flex gap-2'>
              <Select
                value={field.variant ?? 'short'}
                onValueChange={v => update({ variant: v as 'short' | 'long' })}
              >
                <SelectTrigger className='h-8 w-32 rounded-input text-xs'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='rounded-dropdown'>
                  <SelectItem value='short'>Short text</SelectItem>
                  <SelectItem value='long'>Long text</SelectItem>
                </SelectContent>
              </Select>
              {!field.configurable && (
                <Input
                  type='number'
                  value={field.maxLength ?? ''}
                  onChange={e =>
                    update({
                      maxLength: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder='Max length'
                  className='h-8 w-28 rounded-input text-xs'
                />
              )}
            </div>
          )}

          {/* Number-specific options — hidden when organizer configures */}
          {field.type === 'number' && !field.configurable && (
            <div className='flex gap-2'>
              <Input
                type='number'
                value={field.min ?? ''}
                onChange={e =>
                  update({
                    min: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                placeholder='Min'
                className='h-8 w-20 rounded-input text-xs'
              />
              <Input
                type='number'
                value={field.max ?? ''}
                onChange={e =>
                  update({
                    max: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                placeholder='Max'
                className='h-8 w-20 rounded-input text-xs'
              />
            </div>
          )}

          {/* Select / Multiselect options — hidden when organizer configures */}
          {(field.type === 'select' || field.type === 'multiselect') &&
            !field.configurable && (
              <OptionsEditor
                options={field.options ?? []}
                onChange={options => update({ options })}
              />
            )}

          {/* Vote options — hidden when organizer configures */}
          {field.type === 'vote' && (
            <div className='space-y-2'>
              {!field.configurable && (
                <OptionsEditor
                  options={field.options ?? []}
                  onChange={options => update({ options })}
                />
              )}
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-1'>
                  <Switch
                    checked={field.allowMultiple ?? false}
                    onCheckedChange={checked =>
                      update({ allowMultiple: checked })
                    }
                    className='scale-75'
                  />
                  <Label className='text-xs'>Allow multiple votes</Label>
                </div>
                <div className='flex items-center gap-1'>
                  <Switch
                    checked={field.showResults ?? true}
                    onCheckedChange={checked =>
                      update({ showResults: checked })
                    }
                    className='scale-75'
                  />
                  <Label className='text-xs'>Show results</Label>
                </div>
              </div>
              <ActionConfigurator
                actions={(field.actions as AutomationAction[]) ?? []}
                onChange={actions => update({ actions })}
                template={template}
                triggerContext='vote_cast'
                label='On vote cast'
              />
            </div>
          )}

          {/* List item items — hidden when organizer configures */}
          {field.type === 'list_item' && (
            <div className='space-y-2'>
              {!field.configurable && (
                <ListItemsEditor
                  items={field.items ?? []}
                  onChange={items => update({ items })}
                />
              )}
              <ActionConfigurator
                actions={(field.actions as AutomationAction[]) ?? []}
                onChange={actions => update({ actions })}
                template={template}
                triggerContext='list_item_claimed'
                label='On item claimed'
              />
            </div>
          )}

          {/* Toggle */}
          {field.type === 'toggle' && (
            <div className='space-y-2'>
              <div className='flex items-center gap-1'>
                <Switch
                  checked={field.defaultEnabled ?? true}
                  onCheckedChange={checked =>
                    update({ defaultEnabled: checked })
                  }
                  className='scale-75'
                />
                <Label className='text-xs'>Default: enabled</Label>
              </div>
              <ActionConfigurator
                actions={(field.actions as AutomationAction[]) ?? []}
                onChange={actions => update({ actions })}
                template={template}
                triggerContext='toggle_changed'
                label='On toggle changed'
              />
            </div>
          )}

          {/* Action button */}
          {field.type === 'action_button' && (
            <div className='space-y-2'>
              <div className='space-y-1'>
                <Label className='text-xs'>Button label</Label>
                <Input
                  value={field.buttonLabel ?? ''}
                  onChange={e => update({ buttonLabel: e.target.value })}
                  placeholder='Click Me'
                  className='h-8 rounded-input text-sm'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-xs'>Button style</Label>
                <Select
                  value={field.buttonVariant ?? 'default'}
                  onValueChange={v =>
                    update({ buttonVariant: v as ButtonVariant })
                  }
                >
                  <SelectTrigger className='h-8 w-40 rounded-input text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='rounded-dropdown'>
                    {(
                      Object.entries(BUTTON_VARIANT_LABELS) as [
                        ButtonVariant,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ActionConfigurator
                actions={(field.actions as AutomationAction[]) ?? []}
                onChange={actions => update({ actions })}
                template={template}
                triggerContext='form_submitted'
                label='Actions'
              />
            </div>
          )}

          {/* Static text */}
          {field.type === 'static_text' && (
            <div className='space-y-2'>
              <div className='space-y-1'>
                <Label className='text-xs'>Format</Label>
                <Select
                  value={field.textFormat ?? 'p'}
                  onValueChange={v => update({ textFormat: v as TextFormat })}
                >
                  <SelectTrigger className='h-8 rounded-input text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='rounded-dropdown'>
                    {(Object.keys(TEXT_FORMAT_LABELS) as TextFormat[]).map(
                      fmt => (
                        <SelectItem key={fmt} value={fmt}>
                          {TEXT_FORMAT_LABELS[fmt]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label className='text-xs'>Content</Label>
                <VariableInput
                  value={field.content ?? ''}
                  onChange={v => update({ content: v })}
                  dataBlocks={dataBlocks}
                  multiline
                  rows={3}
                  placeholder='Text to display. Type {{ for variables.'
                  className='resize-none rounded-input text-sm'
                />
              </div>
            </div>
          )}

          {/* Dynamic summary */}
          {field.type === 'dynamic_summary' && (
            <div className='space-y-2'>
              <div className='space-y-1'>
                <Label className='text-xs'>Summary type</Label>
                <Select
                  value={field.summaryType ?? 'response_count'}
                  onValueChange={v => update({ summaryType: v as SummaryType })}
                >
                  <SelectTrigger className='h-8 rounded-input text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='rounded-dropdown'>
                    {(
                      Object.entries(SUMMARY_TYPE_LABELS) as [
                        SummaryType,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label className='text-xs'>Label</Label>
                <Input
                  value={field.summaryLabel ?? ''}
                  onChange={e => update({ summaryLabel: e.target.value })}
                  placeholder='e.g. Total responses'
                  className='h-8 rounded-input text-sm'
                />
              </div>
            </div>
          )}

          {/* Divider */}
          {field.type === 'divider' && (
            <div className='space-y-1'>
              <Label className='text-xs'>Label (optional)</Label>
              <Input
                value={field.dividerLabel ?? ''}
                onChange={e => update({ dividerLabel: e.target.value })}
                placeholder='Internal name (optional)'
                className='h-8 rounded-input text-sm'
              />
            </div>
          )}

          {/* Info callout */}
          {field.type === 'info_callout' && (
            <div className='space-y-2'>
              <div className='space-y-1'>
                <Label className='text-xs'>Variant</Label>
                <Select
                  value={field.calloutVariant ?? 'info'}
                  onValueChange={v =>
                    update({ calloutVariant: v as CalloutVariant })
                  }
                >
                  <SelectTrigger className='h-8 w-32 rounded-input text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='rounded-dropdown'>
                    {(
                      Object.entries(CALLOUT_VARIANT_LABELS) as [
                        CalloutVariant,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label className='text-xs'>Message</Label>
                <VariableInput
                  value={field.calloutMessage ?? ''}
                  onChange={v => update({ calloutMessage: v })}
                  dataBlocks={dataBlocks}
                  multiline
                  rows={2}
                  placeholder='Notice text. Type {{ for variables.'
                  className='resize-none rounded-input text-sm'
                />
              </div>
            </div>
          )}
        </div>

        {/* Visibility conditions ("Show when") */}
        <VisibilityConditionsEditor field={field} update={update} />

        {fieldErrors.length > 0 && (
          <div className='mt-1.5'>
            {fieldErrors.map((err, i) => (
              <p key={i} className='text-xs text-error'>
                {err}
              </p>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ===== Visibility Conditions Editor =====

function VisibilityConditionsEditor({
  field,
  update,
}: {
  field: TemplateField;
  update: (partial: Partial<TemplateField>) => void;
}) {
  const { template } = useBuilder();
  const conditions = useMemo(
    () => field.visibilityConditions ?? [],
    [field.visibilityConditions]
  );
  const fieldOptions = useMemo(
    () => getVisibilityFieldOptions(template, field.id),
    [template, field.id]
  );

  const addCondition = useCallback(() => {
    const newCondition: AutomationCondition = {
      field: '',
      operator: 'equals',
      value: '',
    };
    update({ visibilityConditions: [...conditions, newCondition] });
  }, [conditions, update]);

  const updateCondition = useCallback(
    (index: number, partial: Partial<AutomationCondition>) => {
      const updated = conditions.map((c, i) =>
        i === index ? { ...c, ...partial } : c
      );
      update({ visibilityConditions: updated });
    },
    [conditions, update]
  );

  const removeCondition = useCallback(
    (index: number) => {
      const updated = conditions.filter((_, i) => i !== index);
      update({
        visibilityConditions: updated.length > 0 ? updated : undefined,
      });
    },
    [conditions, update]
  );

  // Don't show if there are no other input fields to condition on
  if (fieldOptions.length === 0) return null;

  return (
    <div className='mt-2 space-y-1.5 border-t pt-2'>
      <div className='flex items-center justify-between'>
        <Label className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
          Show when
        </Label>
        <Button
          variant='outline'
          size='sm'
          onClick={addCondition}
          className='h-6 text-xs px-2'
          type='button'
        >
          + Condition
        </Button>
      </div>

      {conditions.length === 0 && (
        <p className='text-[10px] text-muted-foreground italic'>
          No conditions — always visible
        </p>
      )}

      {conditions.map((condition, idx) => (
        <ConditionRow
          key={idx}
          condition={condition}
          template={template}
          fieldOptions={fieldOptions}
          onChange={partial => updateCondition(idx, partial)}
          onRemove={() => removeCondition(idx)}
        />
      ))}
    </div>
  );
}
