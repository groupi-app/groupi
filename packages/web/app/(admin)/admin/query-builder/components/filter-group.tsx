'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { EntityPicker, type EntityType } from './entity-picker';
import type { FilterGroupData, FilterCondition } from './query-builder';

interface FieldDefinition {
  name: string;
  type: string;
  label: string;
  entityType?: EntityType;
  relationshipKey?: string;
  description?: string;
}

interface FilterGroupProps {
  group: FilterGroupData;
  fields: FieldDefinition[];
  onUpdate: (data: Partial<FilterGroupData>) => void;
  onRemove: () => void;
  showGroupLabel?: boolean;
}

const stringOperators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

const numberOperators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'gte', label: 'Greater Than or Equal' },
  { value: 'lt', label: 'Less Than' },
  { value: 'lte', label: 'Less Than or Equal' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

const datetimeOperators = [
  { value: 'gt', label: 'After' },
  { value: 'gte', label: 'On or After' },
  { value: 'lt', label: 'Before' },
  { value: 'lte', label: 'On or Before' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

const relationshipOperators = [
  { value: 'is', label: 'Is' },
  { value: 'is_not', label: "Isn't" },
];

function getOperatorsForField(fieldName: string, fields: FieldDefinition[]) {
  const field = fields.find(f => f.name === fieldName);
  if (field?.type === 'relationship') {
    return relationshipOperators;
  }
  if (field?.type === 'datetime') {
    return datetimeOperators;
  }
  return field?.type === 'number' ? numberOperators : stringOperators;
}

function getFieldDefinition(fieldName: string, fields: FieldDefinition[]): FieldDefinition | undefined {
  return fields.find(f => f.name === fieldName);
}

export function FilterGroup({
  group,
  fields,
  onUpdate,
  onRemove,
  showGroupLabel = true,
}: FilterGroupProps) {
  // Separate regular fields and relationship fields for better organization
  const regularFields = fields.filter(f => f.type !== 'relationship');
  const relationshipFields = fields.filter(f => f.type === 'relationship');

  const handleAddCondition = () => {
    const newCondition: FilterCondition = {
      id: `condition-${crypto.randomUUID()}`,
      field: regularFields[0]?.name || fields[0]?.name || '',
      operator: 'contains',
      value: '',
    };
    onUpdate({
      conditions: [...group.conditions, newCondition],
    });
  };

  const handleUpdateCondition = (conditionId: string, data: Partial<FilterCondition>) => {
    onUpdate({
      conditions: group.conditions.map(c =>
        c.id === conditionId ? { ...c, ...data } : c
      ),
    });
  };

  const handleRemoveCondition = (conditionId: string) => {
    if (group.conditions.length === 1) {
      onRemove();
    } else {
      onUpdate({
        conditions: group.conditions.filter(c => c.id !== conditionId),
      });
    }
  };

  const handleLogicChange = () => {
    onUpdate({
      logic: group.logic === 'AND' ? 'OR' : 'AND',
    });
  };

  const handleFieldChange = (conditionId: string, fieldName: string) => {
    const field = getFieldDefinition(fieldName, fields);
    const isRelationship = field?.type === 'relationship';
    const isDatetime = field?.type === 'datetime';

    // Set appropriate default operator based on field type
    let defaultOperator = 'contains';
    if (isRelationship) {
      defaultOperator = 'is';
    } else if (isDatetime) {
      defaultOperator = 'gt'; // "After" as default for dates
    } else if (field?.type === 'number') {
      defaultOperator = 'equals';
    }

    handleUpdateCondition(conditionId, {
      field: fieldName,
      operator: defaultOperator,
      value: '',
    });
  };

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4 space-y-3">
        {/* Group Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-6 font-mono"
              onClick={handleLogicChange}
            >
              {group.logic}
            </Button>
            {showGroupLabel && (
              <span className="text-sm text-muted-foreground">Filter Group</span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Icons.x className="h-4 w-4" />
          </Button>
        </div>

        {/* Conditions */}
        {group.conditions.map((condition, index) => {
          const fieldDef = getFieldDefinition(condition.field, fields);
          const isRelationship = fieldDef?.type === 'relationship';
          const isDatetime = fieldDef?.type === 'datetime';
          const operators = getOperatorsForField(condition.field, fields);

          return (
            <div key={condition.id} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-xs text-muted-foreground w-10 text-center font-mono">
                  {group.logic}
                </span>
              )}
              {index === 0 && <span className="w-10" />}

              {/* Field Select with optgroups for regular vs relationship */}
              <Select
                value={condition.field}
                onValueChange={value => handleFieldChange(condition.id, value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {regularFields.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Fields
                      </div>
                      {regularFields.map(field => (
                        <SelectItem key={field.name} value={field.name}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {relationshipFields.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                        Relationships
                      </div>
                      {relationshipFields.map(field => (
                        <SelectItem key={field.name} value={field.name}>
                          <div className="flex items-center gap-2">
                            <Icons.link className="h-3 w-3" />
                            {field.label}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>

              {/* Operator Select */}
              <Select
                value={condition.operator}
                onValueChange={value =>
                  handleUpdateCondition(condition.id, { operator: value })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map(op => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Value Input - EntityPicker for relationships, datetime picker for dates, Input for others */}
              {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                isRelationship && fieldDef?.entityType ? (
                  <EntityPicker
                    entityType={fieldDef.entityType}
                    value={String(condition.value || '')}
                    selectedLabel={condition.valueLabel}
                    onChange={(entityId, label) =>
                      handleUpdateCondition(condition.id, {
                        value: entityId,
                        valueLabel: label,
                      })
                    }
                    className="flex-1"
                  />
                ) : isDatetime ? (
                  <input
                    type="datetime-local"
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={
                      condition.value
                        ? new Date(Number(condition.value)).toISOString().slice(0, 16)
                        : ''
                    }
                    onChange={e =>
                      handleUpdateCondition(condition.id, {
                        value: e.target.value ? new Date(e.target.value).getTime() : '',
                      })
                    }
                  />
                ) : (
                  <Input
                    className="flex-1"
                    placeholder="Value"
                    value={String(condition.value || '')}
                    onChange={e =>
                      handleUpdateCondition(condition.id, { value: e.target.value })
                    }
                  />
                )
              )}

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleRemoveCondition(condition.id)}
              >
                <Icons.x className="h-4 w-4" />
              </Button>
            </div>
          );
        })}

        {/* Add Condition */}
        <Button variant="ghost" size="sm" className="w-full" onClick={handleAddCondition}>
          <Icons.plus className="h-4 w-4 mr-2" />
          Add Condition
        </Button>
      </CardContent>
    </Card>
  );
}
