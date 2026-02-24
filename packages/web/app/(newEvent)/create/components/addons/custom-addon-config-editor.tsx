'use client';

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  createEmptyField,
  slugifyFieldId,
  type TemplateField,
  type TemplateSection,
  type FieldType,
} from '@/lib/custom-addon-schema';
import { OptionsEditor, ListItemsEditor } from '@/lib/field-editors';

// ===== ConfigurableFieldEditor =====

interface ConfigurableFieldEditorProps {
  field: TemplateField;
  onChange: (updated: TemplateField) => void;
}

export function ConfigurableFieldEditor({
  field,
  onChange,
}: ConfigurableFieldEditorProps) {
  const updateField = useCallback(
    (partial: Partial<TemplateField>) => {
      onChange({ ...field, ...partial });
    },
    [field, onChange]
  );

  return (
    <div className='space-y-2 rounded-card border p-3'>
      <div className='flex items-center gap-2'>
        <Badge variant='outline' className='shrink-0 rounded-badge text-xs'>
          {FIELD_TYPE_LABELS[field.type]}
        </Badge>
        <span className='text-sm font-medium'>{field.label}</span>
      </div>

      {field.type === 'text' && (
        <Input
          type='number'
          value={field.maxLength ?? ''}
          onChange={e =>
            updateField({
              maxLength: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
          placeholder='Max length (optional)'
          className='h-8 rounded-input text-xs'
        />
      )}

      {field.type === 'number' && (
        <div className='flex gap-2'>
          <Input
            type='number'
            value={field.min ?? ''}
            onChange={e =>
              updateField({
                min: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            placeholder='Min'
            className='h-8 rounded-input text-xs'
          />
          <Input
            type='number'
            value={field.max ?? ''}
            onChange={e =>
              updateField({
                max: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            placeholder='Max'
            className='h-8 rounded-input text-xs'
          />
        </div>
      )}

      {(field.type === 'select' ||
        field.type === 'multiselect' ||
        field.type === 'vote') && (
        <OptionsEditor
          options={field.options ?? []}
          onChange={options => updateField({ options })}
        />
      )}

      {field.type === 'list_item' && (
        <ListItemsEditor
          items={field.items ?? []}
          onChange={items => updateField({ items })}
        />
      )}
    </div>
  );
}

// ===== ConfigurableSectionEditor =====

interface ConfigurableSectionEditorProps {
  section: TemplateSection;
  onChange: (updated: TemplateSection) => void;
}

const DEFAULT_ALLOWED_TYPES: FieldType[] = [
  'text',
  'number',
  'select',
  'multiselect',
  'yesno',
];

/**
 * Re-derive all field IDs within a section from their labels.
 */
function resluggifySection(section: TemplateSection): TemplateSection {
  const usedIds: string[] = [];
  const fields = section.fields.map(field => {
    if (!field.label) return field;
    const newId = slugifyFieldId(field.label, usedIds);
    usedIds.push(newId);
    return newId !== field.id ? { ...field, id: newId } : field;
  });
  return { ...section, fields };
}

export function ConfigurableSectionEditor({
  section,
  onChange,
}: ConfigurableSectionEditorProps) {
  const allowedTypes = section.allowedFieldTypes?.length
    ? section.allowedFieldTypes
    : DEFAULT_ALLOWED_TYPES;

  const addField = useCallback(
    (type: FieldType) => {
      const newField = createEmptyField(type);
      onChange({ ...section, fields: [...section.fields, newField] });
    },
    [section, onChange]
  );

  const updateField = useCallback(
    (fieldId: string, partial: Partial<TemplateField>) => {
      onChange({
        ...section,
        fields: section.fields.map(f =>
          f.id === fieldId ? { ...f, ...partial } : f
        ),
      });
    },
    [section, onChange]
  );

  const removeField = useCallback(
    (fieldId: string) => {
      onChange({
        ...section,
        fields: section.fields.filter(f => f.id !== fieldId),
      });
    },
    [section, onChange]
  );

  const handleLabelBlur = useCallback(() => {
    onChange(resluggifySection(section));
  }, [section, onChange]);

  return (
    <div className='space-y-2 rounded-card border p-3'>
      <div>
        <p className='text-sm font-medium'>{section.title}</p>
        {section.description && (
          <p className='text-xs text-muted-foreground'>{section.description}</p>
        )}
      </div>

      {section.fields.map(field => (
        <SectionFieldEditor
          key={field.id}
          field={field}
          onUpdate={partial => updateField(field.id, partial)}
          onRemove={() => removeField(field.id)}
          onLabelBlur={handleLabelBlur}
        />
      ))}

      <Select onValueChange={v => addField(v as FieldType)}>
        <SelectTrigger className='h-8 rounded-input text-xs'>
          <SelectValue placeholder='Add a field...' />
        </SelectTrigger>
        <SelectContent className='rounded-dropdown'>
          {allowedTypes.map(type => (
            <SelectItem key={type} value={type}>
              {FIELD_TYPE_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ===== Individual field editor within a configurable section =====

function SectionFieldEditor({
  field,
  onUpdate,
  onRemove,
  onLabelBlur,
}: {
  field: TemplateField;
  onUpdate: (partial: Partial<TemplateField>) => void;
  onRemove: () => void;
  onLabelBlur: () => void;
}) {
  return (
    <div className='space-y-1.5 rounded-card border bg-muted/30 p-2'>
      <div className='flex items-center justify-between gap-2'>
        <Badge variant='outline' className='shrink-0 rounded-badge text-xs'>
          {FIELD_TYPE_LABELS[field.type]}
        </Badge>
        <div className='flex items-center gap-1'>
          <div className='flex items-center gap-1'>
            <Label className='text-xs text-muted-foreground'>Required</Label>
            <Switch
              checked={field.required}
              onCheckedChange={checked => onUpdate({ required: checked })}
              className='scale-75'
            />
          </div>
          <Button
            variant='ghost'
            size='icon'
            className='size-6'
            onClick={onRemove}
          >
            <Icons.close className='size-3' />
          </Button>
        </div>
      </div>

      <Input
        value={field.label}
        onChange={e => onUpdate({ label: e.target.value })}
        onBlur={onLabelBlur}
        placeholder='Field label'
        className='h-8 rounded-input text-sm'
      />

      {field.type === 'text' && (
        <div className='flex gap-2'>
          <Select
            value={field.variant ?? 'short'}
            onValueChange={v => onUpdate({ variant: v as 'short' | 'long' })}
          >
            <SelectTrigger className='h-8 w-32 rounded-input text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='rounded-dropdown'>
              <SelectItem value='short'>Short text</SelectItem>
              <SelectItem value='long'>Long text</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type='number'
            value={field.maxLength ?? ''}
            onChange={e =>
              onUpdate({
                maxLength: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
              })
            }
            placeholder='Max length'
            className='h-8 w-28 rounded-input text-xs'
          />
        </div>
      )}

      {field.type === 'number' && (
        <div className='flex gap-2'>
          <Input
            type='number'
            value={field.min ?? ''}
            onChange={e =>
              onUpdate({
                min: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            placeholder='Min'
            className='h-8 w-20 rounded-input text-xs'
          />
          <Input
            type='number'
            value={field.max ?? ''}
            onChange={e =>
              onUpdate({
                max: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            placeholder='Max'
            className='h-8 w-20 rounded-input text-xs'
          />
        </div>
      )}

      {(field.type === 'select' || field.type === 'multiselect') && (
        <OptionsEditor
          options={field.options ?? []}
          onChange={options => onUpdate({ options })}
        />
      )}
    </div>
  );
}
