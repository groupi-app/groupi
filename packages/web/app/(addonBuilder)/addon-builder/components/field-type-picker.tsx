'use client';

import {
  FIELD_TYPE_LABELS,
  FIELD_TYPE_DESCRIPTIONS,
  type FieldType,
} from '@/lib/custom-addon-schema';

/** Picker UI groups — intentionally separate from the layout-based arrays */
const PICKER_INPUT_TYPES: FieldType[] = [
  'text',
  'number',
  'select',
  'multiselect',
  'yesno',
];
const PICKER_INTERACTIVE_TYPES: FieldType[] = [
  'list_item',
  'vote',
  'toggle',
  'action_button',
];
const PICKER_DISPLAY_TYPES: FieldType[] = [
  'static_text',
  'dynamic_summary',
  'divider',
  'info_callout',
];
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

interface FieldTypePickerProps {
  onSelect: (type: FieldType) => void;
  /** When provided, only show types in this list */
  allowedTypes?: FieldType[];
}

export function FieldTypePicker({
  onSelect,
  allowedTypes,
}: FieldTypePickerProps) {
  const isAllowed = (type: FieldType) =>
    !allowedTypes || allowedTypes.includes(type);

  const inputTypes = PICKER_INPUT_TYPES.filter(isAllowed);
  const interactiveTypes = PICKER_INTERACTIVE_TYPES.filter(isAllowed);
  const displayTypes = PICKER_DISPLAY_TYPES.filter(isAllowed);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='rounded-button'>
          <Icons.plus className='mr-1 size-3' />
          Add Field
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56 rounded-dropdown' align='start'>
        {inputTypes.length > 0 && (
          <>
            <DropdownMenuLabel className='text-xs text-muted-foreground'>
              Input
            </DropdownMenuLabel>
            {inputTypes.map(type => (
              <DropdownMenuItem key={type} onClick={() => onSelect(type)}>
                <div>
                  <p className='text-sm font-medium'>
                    {FIELD_TYPE_LABELS[type]}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {FIELD_TYPE_DESCRIPTIONS[type]}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        {interactiveTypes.length > 0 && (
          <>
            {inputTypes.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className='text-xs text-muted-foreground'>
              Interactive
            </DropdownMenuLabel>
            {interactiveTypes.map(type => (
              <DropdownMenuItem key={type} onClick={() => onSelect(type)}>
                <div>
                  <p className='text-sm font-medium'>
                    {FIELD_TYPE_LABELS[type]}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {FIELD_TYPE_DESCRIPTIONS[type]}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        {displayTypes.length > 0 && (
          <>
            {(inputTypes.length > 0 || interactiveTypes.length > 0) && (
              <DropdownMenuSeparator />
            )}
            <DropdownMenuLabel className='text-xs text-muted-foreground'>
              Display
            </DropdownMenuLabel>
            {displayTypes.map(type => (
              <DropdownMenuItem key={type} onClick={() => onSelect(type)}>
                <div>
                  <p className='text-sm font-medium'>
                    {FIELD_TYPE_LABELS[type]}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {FIELD_TYPE_DESCRIPTIONS[type]}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
