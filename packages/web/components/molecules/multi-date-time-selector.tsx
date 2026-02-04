'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { SmartDateInput } from '@/components/smart-date-input';
import { EditableDateTimeItem } from './editable-date-time-item';
import { cn } from '@/lib/utils';
import {
  TIME_REGEX,
  parseTimeString,
  addOneHour,
  getCurrentTimeString,
  getTimezoneString,
  generateId,
  sortDateTimeOptions,
  mergeDateTimeOptions,
  type DateTimeOption,
} from '@/lib/datetime-helpers';

interface MultiDateTimeSelectorProps {
  /** Initial date time options */
  initialOptions?: DateTimeOption[];
  /** Callback when options change */
  onChange: (options: DateTimeOption[]) => void;
  /** Minimum number of options required */
  minOptions?: number;
  /** Whether to show the SmartDateInput component */
  showSmartInput?: boolean;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

/**
 * A reusable component for selecting multiple date/time options with end time support.
 * Includes SmartDateInput for AI-powered natural language parsing and inline editing.
 * Used by both create and edit event flows.
 */
export function MultiDateTimeSelector({
  initialOptions = [],
  onChange,
  minOptions = 2,
  showSmartInput = true,
  disabled = false,
}: MultiDateTimeSelectorProps) {
  const currentTime = getCurrentTimeString();

  // Date time options state
  const [dateTimeOptions, setDateTimeOptions] = useState<DateTimeOption[]>(() =>
    sortDateTimeOptions(initialOptions)
  );

  // Batch add form state
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [time, setTime] = useState(currentTime);
  const [hasEndTime, setHasEndTime] = useState(false);
  const [endTime, setEndTime] = useState(addOneHour(currentTime));

  // Notify parent of changes
  useEffect(() => {
    onChange(dateTimeOptions);
  }, [dateTimeOptions, onChange]);

  // Handle dates from SmartDateInput
  const handleSmartDatesAdded = useCallback(
    (dates: Array<{ start: Date; end?: Date }>) => {
      const newOptions: DateTimeOption[] = dates.map(date => ({
        id: generateId(),
        start: date.start,
        end: date.end,
      }));

      setDateTimeOptions(prev => mergeDateTimeOptions(prev, newOptions));
    },
    []
  );

  // Add dates from batch form
  const handleAddBatchDates = useCallback(() => {
    if (selectedDates.length === 0) return;

    // Validate time format
    if (!TIME_REGEX.test(time)) return;
    if (hasEndTime && !TIME_REGEX.test(endTime)) return;

    // Validate end time is after start time if enabled
    if (hasEndTime) {
      const [startH, startM] = parseTimeString(time);
      const [endH, endM] = parseTimeString(endTime);
      if (endH * 60 + endM <= startH * 60 + startM) {
        return; // Invalid - end must be after start for same-day
      }
    }

    const [hours, minutes] = parseTimeString(time);

    const newOptions: DateTimeOption[] = selectedDates.map(date => {
      const start = new Date(date);
      start.setHours(hours, minutes, 0, 0);

      let end: Date | undefined;
      if (hasEndTime) {
        const [endH, endM] = parseTimeString(endTime);
        end = new Date(date);
        end.setHours(endH, endM, 0, 0);
      }

      return {
        id: generateId(),
        start,
        end,
      };
    });

    setDateTimeOptions(prev => mergeDateTimeOptions(prev, newOptions));

    // Clear selection
    setSelectedDates([]);
  }, [selectedDates, time, hasEndTime, endTime]);

  // Update a specific option
  const updateOption = useCallback(
    (id: string, updates: Partial<DateTimeOption>) => {
      setDateTimeOptions(prev => {
        const updated = prev.map(opt =>
          opt.id === id ? { ...opt, ...updates } : opt
        );
        return sortDateTimeOptions(updated);
      });
    },
    []
  );

  // Delete an option
  const deleteOption = useCallback((id: string) => {
    setDateTimeOptions(prev => prev.filter(opt => opt.id !== id));
  }, []);

  // Clear all options
  const clearAllOptions = useCallback(() => {
    setDateTimeOptions([]);
  }, []);

  const isValidForSubmit = dateTimeOptions.length >= minOptions;

  return (
    <div className='flex flex-col gap-6'>
      {/* Smart Date Input - AI-powered natural language parsing */}
      {showSmartInput && (
        <>
          <div className='max-w-md mx-auto w-full'>
            <SmartDateInput onDatesAdded={handleSmartDatesAdded} />
          </div>

          <div className='flex items-center gap-4 max-w-md mx-auto w-full'>
            <div className='flex-1 border-t border-border' />
            <span className='text-xs text-muted-foreground'>
              or pick dates manually
            </span>
            <div className='flex-1 border-t border-border' />
          </div>
        </>
      )}

      <div className='flex items-center md:items-start gap-5 md:gap-0 flex-col md:flex-row md:justify-evenly'>
        {/* Batch add dates section */}
        <div className='flex flex-col gap-4'>
          <Card className='w-fit overflow-hidden border-border shadow-raised'>
            <CardContent className='p-0'>
              <Calendar
                mode='multiple'
                selected={selectedDates}
                onSelect={dates => setSelectedDates(dates ?? [])}
                captionLayout='dropdown'
                size='xl'
                className='bg-transparent p-4'
                disabled={disabled ? disabled : { before: new Date() }}
              />
            </CardContent>

            <CardFooter className='flex flex-col gap-4 border-t border-border px-6 py-4 bg-muted/20'>
              {/* Time Inputs Row */}
              <div
                className={cn(
                  'flex w-full items-center gap-4',
                  hasEndTime
                    ? 'flex-col md:flex-row md:justify-between'
                    : 'justify-center'
                )}
              >
                {/* Start Time Input */}
                <div className='flex flex-col gap-2'>
                  <Label
                    htmlFor='time-batch-start'
                    className='text-xs font-medium text-muted-foreground'
                  >
                    {hasEndTime ? 'Start Time' : 'Time'}
                  </Label>
                  <div className='relative flex items-center'>
                    <Icons.clock className='pointer-events-none absolute left-3.5 size-5 text-muted-foreground' />
                    <Input
                      id='time-batch-start'
                      type='time'
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className='pl-11 w-44 h-12 text-lg cursor-text [&::-webkit-calendar-picker-indicator]:hidden'
                      disabled={disabled}
                    />
                  </div>
                </div>

                {/* End Time Input */}
                {hasEndTime && (
                  <>
                    <div className='hidden md:flex items-end pb-2'>
                      <span className='text-muted-foreground text-sm'>to</span>
                    </div>
                    <div className='flex flex-col gap-2'>
                      <Label
                        htmlFor='time-batch-end'
                        className='text-xs font-medium text-muted-foreground'
                      >
                        End Time
                      </Label>
                      <div className='relative flex items-center'>
                        <Icons.clock className='pointer-events-none absolute left-3.5 size-5 text-muted-foreground' />
                        <Input
                          id='time-batch-end'
                          type='time'
                          value={endTime}
                          onChange={e => setEndTime(e.target.value)}
                          className='pl-11 w-44 h-12 text-lg cursor-text [&::-webkit-calendar-picker-indicator]:hidden'
                          disabled={disabled}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* End Time Toggle + Timezone Row */}
              <div className='flex w-full items-center justify-between border-t border-border/50 pt-4'>
                <div className='flex items-center gap-3'>
                  <Switch
                    checked={hasEndTime}
                    onCheckedChange={setHasEndTime}
                    disabled={disabled}
                  />
                  <Label className='cursor-pointer text-sm font-medium'>
                    Include end time
                  </Label>
                </div>
                <span className='text-muted-foreground text-xs'>
                  {getTimezoneString()}
                </span>
              </div>

              {/* Add Button */}
              <Button
                disabled={selectedDates.length < 1 || disabled}
                className='flex items-center gap-1 w-full'
                type='button'
                onClick={handleAddBatchDates}
              >
                <Icons.plus className='size-5' />
                <span>
                  Add {selectedDates.length} Option
                  {selectedDates.length !== 1 ? 's' : ''}
                </span>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Options list with inline editing */}
        <div>
          <ScrollArea className='h-96 w-full max-w-sm rounded-md border border-border'>
            <div className='p-4'>
              <div className='flex items-center justify-between mb-3'>
                <h2 className='font-heading leading-none'>
                  Options ({dateTimeOptions.length})
                </h2>
                <Button
                  size='sm'
                  variant='ghost'
                  type='button'
                  className='flex items-center gap-1 text-xs hover:bg-destructive hover:text-destructive-foreground'
                  onClick={clearAllOptions}
                  disabled={dateTimeOptions.length === 0 || disabled}
                >
                  <Icons.delete className='size-4' />
                  <span>Clear</span>
                </Button>
              </div>

              {dateTimeOptions.length === 0 ? (
                <p className='text-muted-foreground text-sm text-center py-8'>
                  {showSmartInput
                    ? 'Type naturally above or select dates from the calendar'
                    : 'Select dates from the calendar and click "Add" to create options'}
                </p>
              ) : (
                <div className='divide-y divide-border'>
                  {dateTimeOptions.map(option => (
                    <EditableDateTimeItem
                      key={option.id}
                      option={option}
                      onUpdate={updates => updateOption(option.id, updates)}
                      onDelete={() => deleteOption(option.id)}
                      disabled={disabled}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Validation message */}
          {!isValidForSubmit && dateTimeOptions.length > 0 && (
            <p className='text-sm text-muted-foreground text-center mt-2'>
              Add at least {minOptions} options to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Export the type for use by consumers
export type { DateTimeOption };
