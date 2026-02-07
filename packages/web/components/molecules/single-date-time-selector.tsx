'use client';

import { useCallback, useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { formatDateTimeRangeShort, cn } from '@/lib/utils';
import {
  TIME_REGEX,
  addOneHour,
  getTimezoneString,
  getCurrentTimeString,
  combineDateAndTime,
} from '@/lib/datetime-helpers';

/**
 * Data returned by the SingleDateTimeSelector when values change
 */
export interface SingleDateTimeData {
  startDate: Date;
  startTime: string;
  hasEndTime: boolean;
  endDate?: Date;
  endTime?: string;
  /** Combined start Date object with time set */
  startDateTime: Date;
  /** Combined end Date object with time set (only if hasEndTime is true) */
  endDateTime?: Date;
  /** Whether the current values are valid */
  isValid: boolean;
}

interface SingleDateTimeSelectorProps {
  /** Initial start date */
  initialStartDate?: Date;
  /** Initial start time in HH:MM format */
  initialStartTime?: string;
  /** Whether end time is initially enabled */
  initialHasEndTime?: boolean;
  /** Initial end date */
  initialEndDate?: Date;
  /** Initial end time in HH:MM format */
  initialEndTime?: string;
  /** Callback when any value changes */
  onChange: (data: SingleDateTimeData) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Label for the start section */
  startLabel?: string;
  /** Label for the end section */
  endLabel?: string;
}

/**
 * A reusable component for selecting a single date/time with optional end time.
 * Features date range selection, integrated time pickers, and month/year dropdowns.
 * Used by both create and edit event flows.
 */
export function SingleDateTimeSelector({
  initialStartDate,
  initialStartTime,
  initialHasEndTime = false,
  initialEndDate,
  initialEndTime,
  onChange,
  disabled = false,
}: SingleDateTimeSelectorProps) {
  const currentTime = getCurrentTimeString();

  // Internal state
  const [startDate, setStartDate] = useState<Date>(
    initialStartDate ?? new Date()
  );
  const [startTime, setStartTime] = useState<string>(
    initialStartTime ?? currentTime
  );
  const [hasEndTime, setHasEndTime] = useState<boolean>(initialHasEndTime);
  const [endDate, setEndDate] = useState<Date>(
    initialEndDate ?? initialStartDate ?? new Date()
  );
  const [endTime, setEndTime] = useState<string>(
    initialEndTime ?? addOneHour(initialStartTime ?? currentTime)
  );

  // Compute combined datetime values
  const getStartDateTime = useCallback((): Date => {
    return combineDateAndTime(startDate, startTime);
  }, [startDate, startTime]);

  const getEndDateTime = useCallback((): Date | undefined => {
    if (!hasEndTime) return undefined;
    return combineDateAndTime(endDate, endTime);
  }, [hasEndTime, endDate, endTime]);

  // Validate the current state
  const isValid = useCallback((): boolean => {
    // Start time must be valid format
    if (!TIME_REGEX.test(startTime)) return false;

    // Start datetime must be in the future
    const startDT = getStartDateTime();
    if (startDT.getTime() <= Date.now()) return false;

    if (hasEndTime) {
      // End time must be valid format if end is enabled
      if (!TIME_REGEX.test(endTime)) return false;

      // End must be after start
      const endDT = getEndDateTime();
      if (!endDT || endDT.getTime() <= startDT.getTime()) return false;
    }

    return true;
  }, [startTime, hasEndTime, endTime, getStartDateTime, getEndDateTime]);

  // Notify parent of changes
  useEffect(() => {
    onChange({
      startDate,
      startTime,
      hasEndTime,
      endDate: hasEndTime ? endDate : undefined,
      endTime: hasEndTime ? endTime : undefined,
      startDateTime: getStartDateTime(),
      endDateTime: getEndDateTime(),
      isValid: isValid(),
    });
  }, [
    startDate,
    startTime,
    hasEndTime,
    endDate,
    endTime,
    onChange,
    getStartDateTime,
    getEndDateTime,
    isValid,
  ]);

  // Handle date range selection
  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    if (range?.from) {
      setStartDate(range.from);
    }
    if (range?.to) {
      setEndDate(range.to);
    } else if (range?.from) {
      // If only start is selected, set end to same day
      setEndDate(range.from);
    }
  }, []);

  // Handle single date selection
  const handleSingleDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      setStartDate(date);
    }
  }, []);

  // Handle end time toggle
  const handleHasEndTimeChange = useCallback(
    (value: boolean) => {
      setHasEndTime(value);
      if (value) {
        // Set defaults when enabling
        setEndDate(startDate);
        setEndTime(addOneHour(startTime));
      }
    },
    [startDate, startTime]
  );

  // Format display
  const getDisplayDateTime = () => {
    const start = getStartDateTime();
    const end = hasEndTime ? getEndDateTime() : null;
    return formatDateTimeRangeShort(start, end ?? undefined);
  };

  // Get date range for calendar
  const dateRange: DateRange | undefined = hasEndTime
    ? { from: startDate, to: endDate }
    : undefined;

  return (
    <div className='flex flex-col gap-6'>
      {/* Calendar Card with integrated time picker */}
      <div className='flex justify-center'>
        <Card className='w-fit overflow-hidden border-border shadow-raised'>
          <CardContent className='p-0'>
            {hasEndTime ? (
              // Date range mode when end time is enabled
              <Calendar
                mode='range'
                selected={dateRange}
                onSelect={handleDateRangeChange}
                defaultMonth={startDate}
                captionLayout='dropdown'
                size='xl'
                className='bg-transparent p-4'
                disabled={disabled ? disabled : { before: new Date() }}
              />
            ) : (
              // Single date mode
              <Calendar
                mode='single'
                selected={startDate}
                onSelect={handleSingleDateChange}
                defaultMonth={startDate}
                captionLayout='dropdown'
                size='xl'
                className='bg-transparent p-4'
                disabled={disabled ? disabled : { before: new Date() }}
              />
            )}
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
                  htmlFor='time-start'
                  className='text-xs font-medium text-muted-foreground'
                >
                  {hasEndTime ? 'Start Time' : 'Time'}
                </Label>
                <div className='relative flex items-center'>
                  <Icons.clock className='pointer-events-none absolute left-3.5 size-5 text-muted-foreground' />
                  <Input
                    id='time-start'
                    type='time'
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
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
                      htmlFor='time-end'
                      className='text-xs font-medium text-muted-foreground'
                    >
                      End Time
                    </Label>
                    <div className='relative flex items-center'>
                      <Icons.clock className='pointer-events-none absolute left-3.5 size-5 text-muted-foreground' />
                      <Input
                        id='time-end'
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

            {/* End Date Toggle + Timezone Row */}
            <div className='flex w-full items-center justify-between border-t border-border/50 pt-4'>
              <div className='flex items-center gap-3'>
                <Switch
                  checked={hasEndTime}
                  onCheckedChange={handleHasEndTimeChange}
                  disabled={disabled}
                />
                <Label className='cursor-pointer text-sm font-medium'>
                  Add end date/time
                </Label>
              </div>
              <span className='text-muted-foreground text-xs'>
                {getTimezoneString()}
              </span>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Preview */}
      <div className='mx-auto'>
        <div
          className={cn(
            'flex items-center rounded-card bg-muted px-6 py-4 max-w-lg w-max mx-auto',
            'shadow-raised border border-border'
          )}
        >
          <div className='flex items-center gap-3'>
            <Icons.calendar className='size-5 text-primary' />
            <h2 className='text-lg font-semibold'>{getDisplayDateTime()}</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
