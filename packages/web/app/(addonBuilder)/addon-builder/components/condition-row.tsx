'use client';

import { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  AutomationCondition,
  ConditionOperator,
  CustomAddonTemplate,
} from '@/lib/custom-addon-schema';
import {
  OPERATOR_META,
  getFieldInfo,
  getConditionFieldOptions,
  getOperatorsForCategory,
  type ConditionFieldOption,
} from './automation-utils';

interface ConditionRowProps {
  condition: AutomationCondition;
  /**
   * When template is provided and fieldOptions is not, field options are
   * computed via getConditionFieldOptions(template) (automation conditions).
   * When fieldOptions is provided, those are used directly (visibility conditions).
   */
  template?: CustomAddonTemplate;
  fieldOptions?: ConditionFieldOption[];
  onChange: (partial: Partial<AutomationCondition>) => void;
  onRemove: () => void;
}

export function ConditionRow({
  condition,
  template,
  fieldOptions: fieldOptionsProp,
  onChange,
  onRemove,
}: ConditionRowProps) {
  const fieldOptions = useMemo(
    () =>
      fieldOptionsProp ?? (template ? getConditionFieldOptions(template) : []),
    [fieldOptionsProp, template]
  );

  const fieldInfo = template
    ? getFieldInfo(condition.field, template)
    : { category: 'unknown' as const };
  const availableOperators = getOperatorsForCategory(fieldInfo.category);
  const operatorMeta = OPERATOR_META[condition.operator];

  const handleFieldChange = useCallback(
    (newField: string) => {
      const newInfo = template
        ? getFieldInfo(newField, template)
        : { category: 'unknown' as const };
      const newOps = getOperatorsForCategory(newInfo.category);
      const updates: Partial<AutomationCondition> = { field: newField };

      if (!newOps.includes(condition.operator)) {
        updates.operator = newOps[0];
      }
      updates.value = undefined;

      onChange(updates);
    },
    [template, condition.operator, onChange]
  );

  const knownValues =
    'enumValues' in fieldInfo
      ? fieldInfo.enumValues
      : 'elementValues' in fieldInfo
        ? fieldInfo.elementValues
        : undefined;
  const showDropdownValue =
    operatorMeta?.needsValue && knownValues && knownValues.length > 0;
  const showNumberValue =
    operatorMeta?.needsValue && fieldInfo.category === 'number' && !knownValues;
  const showTextValue =
    operatorMeta?.needsValue && !showDropdownValue && !showNumberValue;

  // Group field options by group
  const groups = useMemo(() => {
    const map = new Map<string, ConditionFieldOption[]>();
    for (const opt of fieldOptions) {
      const list = map.get(opt.group) ?? [];
      list.push(opt);
      map.set(opt.group, list);
    }
    return map;
  }, [fieldOptions]);

  return (
    <div className='flex items-start gap-1.5'>
      {/* Field selector */}
      <Select value={condition.field} onValueChange={handleFieldChange}>
        <SelectTrigger className='rounded-input text-xs h-8 min-w-[120px]'>
          <SelectValue placeholder='Field' />
        </SelectTrigger>
        <SelectContent>
          {[...groups.entries()].map(([group, opts]) => (
            <div key={group}>
              <div className='px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide'>
                {group}
              </div>
              {opts.map(fp => (
                <SelectItem key={fp.value} value={fp.value}>
                  {fp.label}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>

      {/* Operator selector */}
      <Select
        value={condition.operator}
        onValueChange={v => onChange({ operator: v as ConditionOperator })}
      >
        <SelectTrigger className='rounded-input text-xs h-8 min-w-[120px]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableOperators.map(op => (
            <SelectItem key={op} value={op}>
              {OPERATOR_META[op].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value input */}
      {showDropdownValue && (
        <Select
          value={String(condition.value ?? '')}
          onValueChange={v => onChange({ value: v })}
        >
          <SelectTrigger className='rounded-input text-xs h-8 min-w-[100px]'>
            <SelectValue placeholder='Value' />
          </SelectTrigger>
          <SelectContent>
            {knownValues.map(v => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showNumberValue && (
        <Input
          type='number'
          value={String(condition.value ?? '')}
          onChange={e =>
            onChange({
              value: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          placeholder='Value'
          className='rounded-input text-xs h-8'
        />
      )}

      {showTextValue && (
        <Input
          value={String(condition.value ?? '')}
          onChange={e => onChange({ value: e.target.value })}
          placeholder='Value'
          className='rounded-input text-xs h-8'
        />
      )}

      <Button
        variant='ghost'
        size='sm'
        onClick={onRemove}
        className='text-muted-foreground hover:text-error h-8 w-8 p-0 shrink-0'
        type='button'
      >
        ×
      </Button>
    </div>
  );
}
