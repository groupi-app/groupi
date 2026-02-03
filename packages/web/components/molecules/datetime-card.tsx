'use client';

import { DateRange } from 'react-day-picker';
import { Calendar, CalendarProps } from '@/components/ui/calendar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

interface DateTimeCardProps {
  /** The label for the card header */
  label?: string;
  /** Selected date (for single mode) */
  date?: Date;
  /** Callback when date changes (for single mode) */
  onDateChange?: (date: Date | undefined) => void;
  /** Selected date range (for range mode) */
  dateRange?: DateRange;
  /** Callback when date range changes (for range mode) */
  onDateRangeChange?: (range: DateRange | undefined) => void;
  /** Time value in HH:MM format */
  time?: string;
  /** Callback when time changes */
  onTimeChange?: (time: string) => void;
  /** End time value in HH:MM format (for range mode) */
  endTime?: string;
  /** Callback when end time changes (for range mode) */
  onEndTimeChange?: (time: string) => void;
  /** Calendar mode */
  mode?: 'single' | 'range' | 'multiple';
  /** Whether to show time inputs */
  showTime?: boolean;
  /** Whether to show both start and end time inputs */
  showEndTime?: boolean;
  /** Additional calendar props */
  calendarProps?: Partial<CalendarProps>;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Additional class names for the card */
  className?: string;
}

/**
 * A card component that combines a calendar with integrated time picker(s).
 * Supports single date, date range, and multiple date selection modes.
 */
export function DateTimeCard({
  label,
  date,
  onDateChange,
  dateRange,
  onDateRangeChange,
  time,
  onTimeChange,
  endTime,
  onEndTimeChange,
  mode = 'single',
  showTime = true,
  showEndTime = false,
  calendarProps,
  disabled = false,
  className,
}: DateTimeCardProps) {
  return (
    <Card
      className={cn(
        'w-fit overflow-hidden border-border shadow-raised',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
    >
      {label && (
        <div className='px-4 py-3 border-b border-border bg-muted/30'>
          <Label className='text-sm font-semibold'>{label}</Label>
        </div>
      )}

      <CardContent className='p-0'>
        {mode === 'single' && (
          <Calendar
            {...calendarProps}
            mode='single'
            selected={date}
            onSelect={onDateChange}
            defaultMonth={date ?? new Date()}
            captionLayout='dropdown'
            size='lg'
            className={cn('bg-transparent p-4', calendarProps?.className)}
            disabled={disabled}
          />
        )}
        {mode === 'range' && (
          <Calendar
            {...calendarProps}
            mode='range'
            selected={dateRange}
            onSelect={onDateRangeChange}
            defaultMonth={dateRange?.from ?? new Date()}
            captionLayout='dropdown'
            size='lg'
            className={cn('bg-transparent p-4', calendarProps?.className)}
            disabled={disabled}
          />
        )}
        {mode === 'multiple' && (
          <Calendar
            {...calendarProps}
            mode='multiple'
            selected={date ? [date] : []}
            onSelect={dates => onDateChange?.(dates?.[0])}
            defaultMonth={date ?? new Date()}
            captionLayout='dropdown'
            size='lg'
            className={cn('bg-transparent p-4', calendarProps?.className)}
            disabled={disabled}
          />
        )}
      </CardContent>

      {showTime && (
        <CardFooter
          className={cn(
            'flex flex-col gap-4 border-t border-border px-4 py-4 bg-muted/20',
            showEndTime && 'gap-4'
          )}
        >
          {/* Start Time Input */}
          <div className='flex w-full flex-col gap-2'>
            <Label
              htmlFor='time-start'
              className='text-xs font-medium text-muted-foreground'
            >
              {showEndTime ? 'Start Time' : 'Time'}
            </Label>
            <div className='relative flex w-full items-center'>
              <Icons.clock className='pointer-events-none absolute left-3 size-4 text-muted-foreground' />
              <Input
                id='time-start'
                type='time'
                value={time ?? ''}
                onChange={e => onTimeChange?.(e.target.value)}
                className='pl-9 h-10 text-base cursor-text [&::-webkit-calendar-picker-indicator]:hidden'
                disabled={disabled}
              />
            </div>
          </div>

          {/* End Time Input (for range mode) */}
          {showEndTime && (
            <div className='flex w-full flex-col gap-2'>
              <Label
                htmlFor='time-end'
                className='text-xs font-medium text-muted-foreground'
              >
                End Time
              </Label>
              <div className='relative flex w-full items-center'>
                <Icons.clock className='pointer-events-none absolute left-3 size-4 text-muted-foreground' />
                <Input
                  id='time-end'
                  type='time'
                  value={endTime ?? ''}
                  onChange={e => onEndTimeChange?.(e.target.value)}
                  className='pl-9 h-10 text-base cursor-text [&::-webkit-calendar-picker-indicator]:hidden'
                  disabled={disabled}
                />
              </div>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * A simpler variant for displaying just a calendar in a card without time inputs.
 */
export function CalendarCard({
  label,
  date,
  onDateChange,
  dateRange,
  onDateRangeChange,
  mode = 'single',
  calendarProps,
  disabled = false,
  className,
}: Omit<
  DateTimeCardProps,
  | 'time'
  | 'onTimeChange'
  | 'endTime'
  | 'onEndTimeChange'
  | 'showTime'
  | 'showEndTime'
>) {
  return (
    <DateTimeCard
      label={label}
      date={date}
      onDateChange={onDateChange}
      dateRange={dateRange}
      onDateRangeChange={onDateRangeChange}
      mode={mode}
      showTime={false}
      calendarProps={calendarProps}
      disabled={disabled}
      className={className}
    />
  );
}
