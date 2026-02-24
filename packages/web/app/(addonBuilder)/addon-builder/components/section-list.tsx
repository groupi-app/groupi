'use client';

import { useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useBuilder } from './builder-context';
import { FieldCard } from './field-card';
import { FieldTypePicker } from './field-type-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createEmptyField,
  INPUT_FIELD_TYPES,
  FORM_FIELD_TYPES,
  INTERACTIVE_FIELD_TYPES,
  FIELD_TYPE_LABELS,
  getSectionErrors,
  type AutomationCondition,
  type FieldType,
  type SectionLayout,
  type TemplateSection,
} from '@/lib/custom-addon-schema';
import { ConditionRow } from './condition-row';
import { getVisibilityFieldOptionsExcludingSection } from './automation-utils';

function SortableSection({ section }: { section: TemplateSection }) {
  const {
    template,
    updateSection,
    updateTemplate,
    removeSection,
    addField,
    moveFields,
    validation,
  } = useBuilder();
  const sectionErrors = useMemo(
    () => getSectionErrors(validation, section.id),
    [validation, section.id]
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleAddField = useCallback(
    (type: FieldType) => {
      addField(section.id, createEmptyField(type));
    },
    [addField, section.id]
  );

  const fieldSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFieldDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = section.fields.findIndex(f => f.id === active.id);
      const newIndex = section.fields.findIndex(f => f.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        moveFields(section.id, oldIndex, newIndex);
      }
    },
    [section.fields, section.id, moveFields]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='rounded-card border bg-card shadow-raised'
    >
      <CardHeader className='flex flex-row items-center gap-2 pb-2'>
        <button
          className='cursor-grab touch-none text-muted-foreground hover:text-foreground'
          {...attributes}
          {...listeners}
        >
          <Icons.menu className='size-5' />
        </button>
        <Input
          value={section.title}
          onChange={e => updateSection(section.id, { title: e.target.value })}
          placeholder='Section title'
          className='flex-1 rounded-input font-semibold'
        />
        <Button
          variant='ghost'
          size='icon'
          className='size-8 shrink-0'
          onClick={() => removeSection(section.id)}
        >
          <Icons.trash className='size-4 text-muted-foreground' />
        </Button>
      </CardHeader>
      <CardContent className='space-y-2'>
        <Input
          value={section.description ?? ''}
          onChange={e =>
            updateSection(section.id, {
              description: e.target.value || undefined,
            })
          }
          placeholder='Section description (optional)'
          className='rounded-input text-sm'
        />

        <div className='flex items-center gap-2'>
          <Label
            htmlFor={`section-layout-${section.id}`}
            className='text-xs text-muted-foreground'
          >
            Layout
          </Label>
          <Select
            value={section.layout ?? 'form'}
            onValueChange={(value: string) => {
              const layout = value as SectionLayout;
              const allowedTypes =
                layout === 'interactive'
                  ? INTERACTIVE_FIELD_TYPES
                  : FORM_FIELD_TYPES;
              const removedCount = section.fields.filter(
                f => !allowedTypes.includes(f.type)
              ).length;
              if (
                removedCount > 0 &&
                !window.confirm(
                  `Switching layout will remove ${removedCount} incompatible field(s). Continue?`
                )
              )
                return;
              updateSection(section.id, {
                layout,
                fields: section.fields.filter(f =>
                  allowedTypes.includes(f.type)
                ),
              });
              // Auto-disable requiresCompletion if this was the last form section
              if (
                layout === 'interactive' &&
                template.settings?.requiresCompletion
              ) {
                const otherFormSections = template.sections.filter(
                  s => s.id !== section.id && (s.layout ?? 'form') === 'form'
                );
                if (otherFormSections.length === 0) {
                  updateTemplate({
                    settings: {
                      ...template.settings,
                      requiresCompletion: false,
                    },
                  });
                }
              }
            }}
          >
            <SelectTrigger
              id={`section-layout-${section.id}`}
              className='h-7 w-32 rounded-input text-xs'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='rounded-dropdown'>
              <SelectItem value='form'>Form</SelectItem>
              <SelectItem value='interactive'>Interactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <SectionVisibilityEditor section={section} />

        {sectionErrors.length > 0 &&
          sectionErrors.map((err, i) => (
            <p key={i} className='text-xs text-error'>
              {err}
            </p>
          ))}

        <div className='flex items-center gap-2'>
          <Switch
            id={`section-configurable-${section.id}`}
            checked={section.configurable ?? false}
            onCheckedChange={checked => {
              if (checked && section.fields.length > 0) {
                if (
                  !window.confirm(
                    `This will clear all ${section.fields.length} field(s) in this section. Continue?`
                  )
                )
                  return;
              }
              updateSection(section.id, {
                configurable: checked,
                ...(checked ? { fields: [] } : {}),
              });
            }}
            className='scale-75'
          />
          <Label
            htmlFor={`section-configurable-${section.id}`}
            className='text-xs text-muted-foreground'
          >
            Organizer configures
          </Label>
          {section.configurable && (
            <span className='text-xs italic text-muted-foreground'>
              — organizer adds fields when enabling
            </span>
          )}
        </div>

        {section.configurable && (
          <div className='space-y-1.5'>
            <Label className='text-xs text-muted-foreground'>
              Allowed field types
            </Label>
            <div className='flex flex-wrap gap-x-4 gap-y-1'>
              {INPUT_FIELD_TYPES.map(type => {
                const allowed = section.allowedFieldTypes ?? [];
                const isChecked =
                  allowed.length === 0 || allowed.includes(type);
                return (
                  <label
                    key={type}
                    className='flex items-center gap-1.5 text-xs'
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={checked => {
                        let next: FieldType[];
                        if (allowed.length === 0) {
                          // First uncheck — start from full list minus this one
                          next = INPUT_FIELD_TYPES.filter(t => t !== type);
                        } else if (checked) {
                          next = [...allowed, type];
                        } else {
                          next = allowed.filter(t => t !== type);
                        }
                        // If all are checked, clear the array (means "all allowed")
                        if (next.length === INPUT_FIELD_TYPES.length) {
                          next = [];
                        }
                        updateSection(section.id, {
                          allowedFieldTypes: next,
                        });
                      }}
                    />
                    {FIELD_TYPE_LABELS[type]}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {!section.configurable && (
          <>
            <DndContext
              sensors={fieldSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleFieldDragEnd}
            >
              <SortableContext
                items={section.fields.map(f => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {section.fields.map(field => (
                  <FieldCard
                    key={field.id}
                    sectionId={section.id}
                    field={field}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <FieldTypePicker
              onSelect={handleAddField}
              allowedTypes={
                section.layout === 'interactive'
                  ? INTERACTIVE_FIELD_TYPES
                  : FORM_FIELD_TYPES
              }
            />
          </>
        )}
      </CardContent>
    </div>
  );
}

// ===== Section Visibility Conditions Editor =====

function SectionVisibilityEditor({ section }: { section: TemplateSection }) {
  const { template, updateSection } = useBuilder();
  const conditions = useMemo(
    () => section.visibilityConditions ?? [],
    [section.visibilityConditions]
  );
  const fieldOptions = useMemo(
    () => getVisibilityFieldOptionsExcludingSection(template, section.id),
    [template, section.id]
  );

  const addCondition = useCallback(() => {
    const newCondition: AutomationCondition = {
      field: '',
      operator: 'equals',
      value: '',
    };
    updateSection(section.id, {
      visibilityConditions: [...conditions, newCondition],
    });
  }, [conditions, updateSection, section.id]);

  const updateCondition = useCallback(
    (index: number, partial: Partial<AutomationCondition>) => {
      const updated = conditions.map((c, i) =>
        i === index ? { ...c, ...partial } : c
      );
      updateSection(section.id, { visibilityConditions: updated });
    },
    [conditions, updateSection, section.id]
  );

  const removeCondition = useCallback(
    (index: number) => {
      const updated = conditions.filter((_, i) => i !== index);
      updateSection(section.id, {
        visibilityConditions: updated.length > 0 ? updated : undefined,
      });
    },
    [conditions, updateSection, section.id]
  );

  // Don't show if there are no fields from other sections to condition on
  if (fieldOptions.length === 0) return null;

  return (
    <div className='space-y-1.5 border-t pt-2'>
      <div className='flex items-center justify-between'>
        <Label className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
          Show when
        </Label>
        <Button
          variant='outline'
          size='sm'
          onClick={addCondition}
          className='h-6 px-2 text-xs'
          type='button'
        >
          + Condition
        </Button>
      </div>

      {conditions.length === 0 && (
        <p className='text-[10px] italic text-muted-foreground'>
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

export function SectionList() {
  const { template, addSection, moveSections } = useBuilder();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = template.sections.findIndex(s => s.id === active.id);
      const newIndex = template.sections.findIndex(s => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        moveSections(oldIndex, newIndex);
      }
    },
    [template.sections, moveSections]
  );

  const sectionIds = template.sections.map(s => s.id);

  return (
    <div className='space-y-4'>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sectionIds}
          strategy={verticalListSortingStrategy}
        >
          {template.sections.map(section => (
            <SortableSection key={section.id} section={section} />
          ))}
        </SortableContext>
      </DndContext>

      <Button
        variant='outline'
        className='w-full rounded-button'
        onClick={addSection}
      >
        <Icons.plus className='mr-2 size-4' />
        Add Section
      </Button>
    </div>
  );
}
