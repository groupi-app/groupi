'use client';
import { useFormContext } from './form-context';
import { Calendar } from '@/components/ui/calendar';
import { isSameDay } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useRef, useState, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { useCreateEvent } from '@/hooks/mutations/use-create-event';
import { SmartDateInput } from '@/components/smart-date-input';

// Types for date time options with optional end times
interface DateTimeOption {
  id: string; // Unique ID for React keys
  start: Date;
  end?: Date;
}

// Helper to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Helper to parse time string
function parseTimeString(time: string): [number, number] {
  const [hours, minutes] = time.split(':').map(Number);
  return [hours, minutes];
}

// Helper to add one hour to a time string
function addOneHour(time: string): string {
  const [hours, minutes] = parseTimeString(time);
  const newHours = (hours + 1) % 24;
  return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Helper to format time for input
function formatTimeForInput(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Helper to get start of day for date comparison
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Form 1: Batch add dates
const form1Schema = z
  .object({
    dates: z
      .array(z.date())
      .min(1, { message: 'At least one date is required.' }),
    time: z.string().regex(timeRegex),
    hasEndTime: z.boolean(),
    endTime: z.string().regex(timeRegex).optional(),
  })
  .refine(
    data => {
      if (!data.hasEndTime || !data.endTime) return true;
      const [startH, startM] = parseTimeString(data.time);
      const [endH, endM] = parseTimeString(data.endTime);
      // For same-day batch add, end time must be after start time
      return endH * 60 + endM > startH * 60 + startM;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

// Form 2: Date options list
const form2Schema = z.object({
  dateTimeOptions: z
    .array(
      z.object({
        id: z.string(),
        start: z.date(),
        end: z.date().optional(),
      })
    )
    .min(2, { message: 'At least two date options are required.' }),
});

interface NewEventMultiDateProps {
  onBack: () => void;
}

export function NewEventMultiDate({ onBack }: NewEventMultiDateProps) {
  const { formState, reset } = useFormContext();
  const router = useRouter();
  const createEvent = useCreateEvent();
  const isSubmittingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentTime = new Date().toLocaleTimeString([], {
    timeStyle: 'short',
    hour12: false,
  });

  const form1 = useForm<z.infer<typeof form1Schema>>({
    resolver: zodResolver(form1Schema),
    defaultValues: {
      dates: [],
      time: currentTime,
      hasEndTime: false,
      endTime: addOneHour(currentTime),
    },
  });

  const form2 = useForm<z.infer<typeof form2Schema>>({
    resolver: zodResolver(form2Schema),
    defaultValues: {
      dateTimeOptions: [],
    },
  });

  // Watch form values
  const watchedDates =
    useWatch({ control: form1.control, name: 'dates' }) || [];
  const watchedHasEndTime = useWatch({
    control: form1.control,
    name: 'hasEndTime',
  });
  const watchedDateTimeOptions =
    useWatch({ control: form2.control, name: 'dateTimeOptions' }) || [];

  // Sort options chronologically - must be before early return (rules of hooks)
  const sortOptions = useCallback((options: DateTimeOption[]) => {
    return [...options].sort((a, b) => a.start.getTime() - b.start.getTime());
  }, []);

  // Handle dates from SmartDateInput - must be before early return (rules of hooks)
  const handleSmartDatesAdded = useCallback(
    (dates: Array<{ start: Date; end?: Date }>) => {
      const newOptions: DateTimeOption[] = dates.map(date => ({
        id: generateId(),
        start: date.start,
        end: date.end,
      }));

      // Merge with existing, avoiding duplicates
      const existing = form2.getValues('dateTimeOptions');
      const merged = [...existing];

      for (const newOpt of newOptions) {
        const isDuplicate = merged.some(
          opt =>
            opt.start.getTime() === newOpt.start.getTime() &&
            opt.end?.getTime() === newOpt.end?.getTime()
        );
        if (!isDuplicate) {
          merged.push(newOpt);
        }
      }

      // Sort and update
      form2.setValue('dateTimeOptions', sortOptions(merged));
    },
    [form2, sortOptions]
  );

  // In wizard mode, redirect is handled by parent
  if (!formState.title) {
    return null;
  }

  const getTimezoneString = () => {
    return `${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${
      new Date().getTimezoneOffset() > 0 ? '-' : '+'
    }${Math.abs(new Date().getTimezoneOffset() / 60).toString()})`;
  };

  // Add dates from form1 to form2
  async function onSubmit1(data: z.infer<typeof form1Schema>) {
    const [hours, minutes] = parseTimeString(data.time);

    const newOptions: DateTimeOption[] = data.dates.map(date => {
      const start = new Date(date);
      start.setHours(hours, minutes, 0, 0);

      let end: Date | undefined;
      if (data.hasEndTime && data.endTime) {
        const [endH, endM] = parseTimeString(data.endTime);
        end = new Date(date);
        end.setHours(endH, endM, 0, 0);
      }

      return {
        id: generateId(),
        start,
        end,
      };
    });

    // Merge with existing, avoiding duplicates
    const existing = form2.getValues('dateTimeOptions');
    const merged = [...existing];

    for (const newOpt of newOptions) {
      const isDuplicate = merged.some(
        opt =>
          opt.start.getTime() === newOpt.start.getTime() &&
          opt.end?.getTime() === newOpt.end?.getTime()
      );
      if (!isDuplicate) {
        merged.push(newOpt);
      }
    }

    // Sort and update
    form2.setValue('dateTimeOptions', sortOptions(merged));

    // Clear calendar selection
    form1.setValue('dates', []);
  }

  // Submit event
  async function onSubmit2(data: z.infer<typeof form2Schema>) {
    const { title, description, location, reminderOffset } = formState;

    isSubmittingRef.current = true;
    setIsSaving(true);
    try {
      const result = await createEvent({
        title,
        description,
        location,
        potentialDateTimeOptions: data.dateTimeOptions.map(opt => ({
          start: opt.start.toISOString(),
          end: opt.end?.toISOString(),
        })),
        reminderOffset,
      });
      toast.success('The event was created successfully.');
      reset();
      router.push(`/event/${result.eventId}`);
    } catch {
      toast.error('The event was unable to be created.');
    } finally {
      isSubmittingRef.current = false;
      setIsSaving(false);
    }
  }

  // Update a specific option
  const updateOption = (id: string, updates: Partial<DateTimeOption>) => {
    const options = form2.getValues('dateTimeOptions');
    const updated = options.map(opt =>
      opt.id === id ? { ...opt, ...updates } : opt
    );
    form2.setValue('dateTimeOptions', sortOptions(updated));
  };

  // Delete an option
  const deleteOption = (id: string) => {
    const options = form2.getValues('dateTimeOptions');
    form2.setValue(
      'dateTimeOptions',
      options.filter(opt => opt.id !== id)
    );
  };

  // Clear all options
  const clearAllOptions = () => {
    form2.setValue('dateTimeOptions', []);
  };

  return (
    <div className='my-8 flex flex-col gap-6'>
      {/* Smart Date Input - AI-powered natural language parsing */}
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

      <div className='flex items-center md:items-start gap-5 md:gap-0 flex-col md:flex-row md:justify-evenly'>
        {/* Form 1: Batch add dates */}
        <Form {...form1}>
          <form onSubmit={form1.handleSubmit(onSubmit1)}>
            <div className='flex flex-col gap-4'>
              <FormField
                control={form1.control}
                name='dates'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Calendar
                        mode='multiple'
                        className='rounded-md border border-border w-max mx-auto'
                        selected={field.value}
                        onSelect={dates =>
                          dates ? form1.setValue('dates', dates) : null
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time inputs */}
              <div className='flex items-center justify-center gap-2'>
                <FormField
                  control={form1.control}
                  name='time'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type='time'
                          className='w-28 cursor-text'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {watchedHasEndTime && (
                  <>
                    <span className='text-muted-foreground'>to</span>
                    <FormField
                      control={form1.control}
                      name='endTime'
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type='time'
                              className='w-28 cursor-text'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              {/* End time toggle */}
              <div className='flex items-center justify-center gap-2'>
                <FormField
                  control={form1.control}
                  name='hasEndTime'
                  render={({ field }) => (
                    <FormItem className='flex items-center gap-2'>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className='!mt-0 cursor-pointer text-sm'>
                        Include end time
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <span className='text-muted-foreground text-xs text-center'>
                {getTimezoneString()}
              </span>

              <Button
                disabled={watchedDates.length < 1}
                className='flex items-center gap-1 max-w-sm w-full mx-auto'
                type='submit'
              >
                <Icons.plus className='size-5' />
                <span>
                  Add {watchedDates.length} Option
                  {watchedDates.length !== 1 ? 's' : ''}
                </span>
              </Button>
            </div>
          </form>
        </Form>

        {/* Form 2: Options list with inline editing */}
        <Form {...form2}>
          <form id='form2' onSubmit={form2.handleSubmit(onSubmit2)}>
            <div>
              <ScrollArea className='h-96 w-full max-w-sm rounded-md border border-border'>
                <div className='p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <h2 className='font-heading leading-none'>
                      Options ({watchedDateTimeOptions.length})
                    </h2>
                    <Button
                      size='sm'
                      variant='ghost'
                      type='button'
                      className='flex items-center gap-1 text-xs hover:bg-destructive hover:text-destructive-foreground'
                      onClick={clearAllOptions}
                      disabled={watchedDateTimeOptions.length === 0}
                    >
                      <Icons.delete className='size-4' />
                      <span>Clear</span>
                    </Button>
                  </div>

                  {watchedDateTimeOptions.length === 0 ? (
                    <p className='text-muted-foreground text-sm text-center py-8'>
                      Select dates from the calendar and click &quot;Add&quot;
                      to create options
                    </p>
                  ) : (
                    <div className='divide-y divide-border'>
                      {watchedDateTimeOptions.map(option => (
                        <EditableDateTimeItem
                          key={option.id}
                          option={option}
                          onUpdate={updates => updateOption(option.id, updates)}
                          onDelete={() => deleteOption(option.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </form>
        </Form>
      </div>

      <div className='flex justify-between'>
        <Button
          type='button'
          className='flex items-center gap-1'
          variant='secondary'
          onClick={onBack}
        >
          <span>Back</span>
          <Icons.back className='text-sm' />
        </Button>
        <Button
          disabled={watchedDateTimeOptions.length < 2}
          type='submit'
          form='form2'
          isLoading={isSaving}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}

// Editable date time item component
interface EditableDateTimeItemProps {
  option: DateTimeOption;
  onUpdate: (updates: Partial<DateTimeOption>) => void;
  onDelete: () => void;
}

function EditableDateTimeItem({
  option,
  onUpdate,
  onDelete,
}: EditableDateTimeItemProps) {
  const [isEditingStart, setIsEditingStart] = useState(false);
  const [isEditingEnd, setIsEditingEnd] = useState(false);
  const [startTime, setStartTime] = useState(formatTimeForInput(option.start));
  const [endTime, setEndTime] = useState(
    option.end ? formatTimeForInput(option.end) : ''
  );

  // Handle start date change
  const handleStartDateChange = (date: Date | undefined) => {
    if (!date) return;
    const newStart = new Date(date);
    newStart.setHours(option.start.getHours(), option.start.getMinutes(), 0, 0);
    onUpdate({ start: newStart });
    setIsEditingStart(false);
  };

  // Handle start time change
  const handleStartTimeBlur = () => {
    if (!timeRegex.test(startTime)) {
      setStartTime(formatTimeForInput(option.start));
      return;
    }
    const [hours, minutes] = parseTimeString(startTime);
    const newStart = new Date(option.start);
    newStart.setHours(hours, minutes, 0, 0);

    // Validate end > start if end exists
    if (option.end && option.end.getTime() <= newStart.getTime()) {
      toast.error('Start time must be before end time');
      setStartTime(formatTimeForInput(option.start));
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

  // Handle end time change
  const handleEndTimeBlur = () => {
    if (!endTime) {
      // Remove end time
      onUpdate({ end: undefined });
      return;
    }
    if (!timeRegex.test(endTime)) {
      setEndTime(option.end ? formatTimeForInput(option.end) : '');
      return;
    }
    const [hours, minutes] = parseTimeString(endTime);
    const endDate = option.end || option.start;
    const newEnd = new Date(endDate);
    newEnd.setHours(hours, minutes, 0, 0);

    if (newEnd.getTime() <= option.start.getTime()) {
      toast.error('End time must be after start time');
      setEndTime(option.end ? formatTimeForInput(option.end) : '');
      return;
    }

    onUpdate({ end: newEnd });
  };

  // Add end time to this option
  const addEndTime = () => {
    const defaultEnd = new Date(option.start);
    defaultEnd.setHours(defaultEnd.getHours() + 1);
    onUpdate({ end: defaultEnd });
    setEndTime(formatTimeForInput(defaultEnd));
  };

  // Remove end time
  const removeEndTime = () => {
    onUpdate({ end: undefined });
    setEndTime('');
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
                />
              </PopoverContent>
            </Popover>
            <Input
              type='time'
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              onBlur={handleStartTimeBlur}
              className='w-[100px] h-8 text-sm shrink-0'
            />
            {!option.end && (
              <button
                type='button'
                onClick={addEndTime}
                className='text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap'
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
                onChange={e => setEndTime(e.target.value)}
                onBlur={handleEndTimeBlur}
                className='w-[100px] h-8 text-sm shrink-0'
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='size-7 text-muted-foreground hover:text-foreground shrink-0'
                onClick={removeEndTime}
                title='Remove end time'
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
        >
          <Icons.delete className='size-4' />
        </Button>
      </div>
    </div>
  );
}
