'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Icons } from '@/components/icons';
import { isSameDay } from '@/lib/utils';
import { toast } from 'sonner';
import {
  TIME_REGEX,
  parseTimeString,
  addOneHour,
  formatTimeForInput,
  startOfDay,
  type DateTimeOption,
} from '@/lib/datetime-helpers';

interface EditableDateTimeItemProps {
  option: DateTimeOption;
  onUpdate: (updates: Partial<DateTimeOption>) => void;
  onDelete: () => void;
  disabled?: boolean;
}

/**
 * An editable date/time item for use in date option lists.
 * Supports inline editing of start date/time and optional end date/time.
 */
export function EditableDateTimeItem({
  option,
  onUpdate,
  onDelete,
  disabled = false,
}: EditableDateTimeItemProps) {
  const [isEditingStart, setIsEditingStart] = useState(false);
  const [isEditingEnd, setIsEditingEnd] = useState(false);

  // Track whether user is actively editing time inputs
  const [isEditingStartTime, setIsEditingStartTime] = useState(false);
  const [isEditingEndTime, setIsEditingEndTime] = useState(false);

  // Local state for time inputs (only used while editing)
  const [localStartTime, setLocalStartTime] = useState('');
  const [localEndTime, setLocalEndTime] = useState('');

  // Derive display values from props when not editing
  const startTime = isEditingStartTime
    ? localStartTime
    : formatTimeForInput(option.start);
  const endTime = isEditingEndTime
    ? localEndTime
    : option.end
      ? formatTimeForInput(option.end)
      : '';

  // Handle start date change
  const handleStartDateChange = (date: Date | undefined) => {
    if (!date) return;
    const newStart = new Date(date);
    newStart.setHours(option.start.getHours(), option.start.getMinutes(), 0, 0);
    onUpdate({ start: newStart });
    setIsEditingStart(false);
  };

  // Handle start time focus
  const handleStartTimeFocus = () => {
    setIsEditingStartTime(true);
    setLocalStartTime(formatTimeForInput(option.start));
  };

  // Handle start time change
  const handleStartTimeBlur = () => {
    setIsEditingStartTime(false);
    if (!TIME_REGEX.test(localStartTime)) {
      // Invalid format, just stop editing (display will revert to prop value)
      return;
    }
    const [hours, minutes] = parseTimeString(localStartTime);
    const newStart = new Date(option.start);
    newStart.setHours(hours, minutes, 0, 0);

    // Validate end > start if end exists
    if (option.end && option.end.getTime() <= newStart.getTime()) {
      toast.error('Start time must be before end time');
      return;
    }

    onUpdate({ start: newStart });
  };

  // Handle end date change
  const handleEndDateChange = (date: Date | undefined) => {
    if (!date) return;
    const currentEndTime = option.end
      ? formatTimeForInput(option.end)
      : addOneHour(startTime);
    const [hours, minutes] = parseTimeString(currentEndTime);
    const newEnd = new Date(date);
    newEnd.setHours(hours, minutes, 0, 0);

    if (newEnd.getTime() <= option.start.getTime()) {
      toast.error('End time must be after start time');
      return;
    }

    onUpdate({ end: newEnd });
    setIsEditingEnd(false);
  };

  // Handle end time focus
  const handleEndTimeFocus = () => {
    setIsEditingEndTime(true);
    setLocalEndTime(option.end ? formatTimeForInput(option.end) : '');
  };

  // Handle end time change
  const handleEndTimeBlur = () => {
    setIsEditingEndTime(false);
    if (!localEndTime) {
      // Remove end time
      onUpdate({ end: undefined });
      return;
    }
    if (!TIME_REGEX.test(localEndTime)) {
      // Invalid format, just stop editing (display will revert to prop value)
      return;
    }
    const [hours, minutes] = parseTimeString(localEndTime);
    const endDate = option.end || option.start;
    const newEnd = new Date(endDate);
    newEnd.setHours(hours, minutes, 0, 0);

    if (newEnd.getTime() <= option.start.getTime()) {
      toast.error('End time must be after start time');
      return;
    }

    onUpdate({ end: newEnd });
  };

  // Add end time to this option
  const addEndTime = () => {
    const defaultEnd = new Date(option.start);
    defaultEnd.setHours(defaultEnd.getHours() + 1);
    onUpdate({ end: defaultEnd });
  };

  // Remove end time
  const removeEndTime = () => {
    onUpdate({ end: undefined });
  };

  const sameDay = option.end ? isSameDay(option.start, option.end) : false;

  return (
    <div className='py-3'>
      <div className='flex items-start justify-between gap-2'>
        {/* Date/time content */}
        <div className='flex-1 min-w-0'>
          {/* Start row */}
          <div className='flex items-center gap-2'>
            <Popover open={isEditingStart} onOpenChange={setIsEditingStart}>
              <PopoverTrigger asChild>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='h-8 px-2 text-sm font-medium justify-start whitespace-nowrap'
                  disabled={disabled}
                >
                  <Icons.calendar className='size-3.5 mr-1.5 text-muted-foreground shrink-0' />
                  {option.start.toLocaleDateString([], {
                    weekday: 'short',
                    month: 'numeric',
                    day: 'numeric',
                  })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={option.start}
                  onSelect={handleStartDateChange}
                  defaultMonth={option.start}
                />
              </PopoverContent>
            </Popover>
            <Input
              type='time'
              value={startTime}
              onFocus={handleStartTimeFocus}
              onChange={e => setLocalStartTime(e.target.value)}
              onBlur={handleStartTimeBlur}
              className='w-[130px] h-8 text-sm shrink-0'
              disabled={disabled}
            />
            {!option.end && (
              <button
                type='button'
                onClick={addEndTime}
                className='text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap'
                disabled={disabled}
              >
                + End
              </button>
            )}
          </div>

          {/* End row - always on separate row when there's an end time */}
          {option.end && (
            <div className='flex items-center gap-2 mt-1.5'>
              <span className='text-muted-foreground text-xs mr-0.5'>to</span>
              {!sameDay && (
                <Popover open={isEditingEnd} onOpenChange={setIsEditingEnd}>
                  <PopoverTrigger asChild>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='h-8 px-2 text-sm justify-start whitespace-nowrap'
                      disabled={disabled}
                    >
                      <Icons.calendar className='size-3.5 mr-1.5 text-muted-foreground shrink-0' />
                      {option.end.toLocaleDateString([], {
                        weekday: 'short',
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={option.end}
                      onSelect={handleEndDateChange}
                      defaultMonth={option.end}
                      disabled={date =>
                        startOfDay(date) < startOfDay(option.start)
                      }
                    />
                  </PopoverContent>
                </Popover>
              )}
              <Input
                type='time'
                value={endTime}
                onFocus={handleEndTimeFocus}
                onChange={e => setLocalEndTime(e.target.value)}
                onBlur={handleEndTimeBlur}
                className='w-[130px] h-8 text-sm shrink-0'
                disabled={disabled}
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='size-7 text-muted-foreground hover:text-foreground shrink-0'
                onClick={removeEndTime}
                title='Remove end time'
                disabled={disabled}
              >
                <Icons.close className='size-3.5' />
              </Button>
            </div>
          )}
        </div>

        {/* Delete button */}
        <Button
          onClick={onDelete}
          type='button'
          variant='ghost'
          size='icon'
          className='size-8 hover:bg-destructive hover:text-destructive-foreground shrink-0'
          title='Remove option'
          disabled={disabled}
        >
          <Icons.delete className='size-4' />
        </Button>
      </div>

      {/* Note input */}
      <div className='mt-2 relative'>
        <Textarea
          value={option.note ?? ''}
          onChange={e => onUpdate({ note: e.target.value })}
          placeholder='Add a note (optional)'
          maxLength={200}
          className='min-h-[32px] text-xs resize-none py-1.5 px-2.5 pr-14'
          rows={1}
          disabled={disabled}
        />
        <span className='absolute bottom-1 right-2.5 text-[10px] text-muted-foreground'>
          {(option.note ?? '').length}/200
        </span>
      </div>
    </div>
  );
}
