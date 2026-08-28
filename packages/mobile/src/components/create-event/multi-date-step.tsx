import { useState, useMemo } from 'react';
import { View, Pressable, ScrollView, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar, type DateData } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import {
  useCreateEventForm,
  type DateOption,
} from '@/context/create-event-context';
import { toast } from '@groupi/shared/platform';
import { EditableDateTimeItem } from './editable-date-time-item';
import { mergeSmartDateOptions } from './multi-date-options';
import { SmartDateInput } from './smart-date-input';

interface MultiDateStepProps {
  onNext: () => void;
  onBack: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayString(): string {
  return toDateString(new Date());
}

function getTimezoneString(): string {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offsetMinutes = new Date().getTimezoneOffset();
  const sign = offsetMinutes > 0 ? '-' : '+';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;
  const offset = minutes
    ? `${hours}:${String(minutes).padStart(2, '0')}`
    : String(hours);
  return `${timezone} (UTC${sign}${offset})`;
}

function parseDateString(ds: string): {
  year: number;
  month: number;
  day: number;
} {
  const [y, m, d] = ds.split('-').map(Number);
  return { year: y, month: m, day: d };
}

let nextDateId = 0;

type TimePicker = 'start' | 'end';

export function MultiDateStep({
  onNext,
  onBack,
  submitLabel = 'Next',
  isSubmitting = false,
}: MultiDateStepProps) {
  const { formState, updateFormState } = useCreateEventForm();
  const { dateOptions } = formState;
  const primaryColor = String(useCSSVariable('--color-primary') ?? '');
  const backgroundColor = String(useCSSVariable('--color-card') ?? '#fff');
  const foregroundColor = String(
    useCSSVariable('--color-foreground') ?? '#000'
  );
  const mutedColor = String(useCSSVariable('--color-muted-foreground') ?? '');

  // Multi-select: set of date strings currently toggled on the calendar
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  // Time that will be applied to all selected dates when adding
  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    return d;
  });
  const [endTime, setEndTime] = useState(() => {
    const d = new Date();
    d.setHours(19, 0, 0, 0);
    return d;
  });
  const [hasEndTime, setHasEndTime] = useState(false);
  const [activeTimePicker, setActiveTimePicker] = useState<TimePicker | null>(
    null
  );

  // Build marked dates: selected (toggled) dates + existing option dates (dots)
  const markedDates = useMemo(() => {
    const marks: Record<
      string,
      {
        selected?: boolean;
        selectedColor?: string;
        selectedTextColor?: string;
        marked?: boolean;
        dotColor?: string;
      }
    > = {};

    // Existing options get dots
    for (const opt of dateOptions) {
      const ds = toDateString(opt.date);
      marks[ds] = { marked: true, dotColor: primaryColor };
    }

    // Currently toggled dates get selected highlight
    for (const ds of selectedDates) {
      marks[ds] = {
        ...marks[ds],
        selected: true,
        selectedColor: primaryColor,
        selectedTextColor: '#ffffff',
      };
    }

    return marks;
  }, [dateOptions, selectedDates, primaryColor]);

  const calendarTheme = useMemo(
    () => ({
      calendarBackground: 'transparent',
      dayTextColor: foregroundColor,
      monthTextColor: foregroundColor,
      textSectionTitleColor: mutedColor,
      todayTextColor: primaryColor,
      selectedDayBackgroundColor: primaryColor,
      selectedDayTextColor: '#ffffff',
      arrowColor: primaryColor,
      textDisabledColor: `${mutedColor}60`,
      textDayFontSize: 15,
      textMonthFontSize: 16,
      textDayHeaderFontSize: 13,
      textMonthFontWeight: '600' as const,
      textDayFontWeight: '400' as const,
    }),
    [foregroundColor, mutedColor, primaryColor]
  );

  function handleDayPress(day: DateData) {
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(day.dateString)) {
        next.delete(day.dateString);
      } else {
        next.add(day.dateString);
      }
      return next;
    });
  }

  function handleStartTimeChange(date: Date | undefined) {
    if (!date) return;
    const updated = new Date(startTime);
    updated.setHours(date.getHours(), date.getMinutes(), 0, 0);
    setStartTime(updated);
    if (Platform.OS === 'android') {
      setActiveTimePicker(null);
    }
  }

  function handleEndTimeChange(date: Date | undefined) {
    if (!date) return;
    const updated = new Date(endTime);
    updated.setHours(date.getHours(), date.getMinutes(), 0, 0);
    setEndTime(updated);
    if (Platform.OS === 'android') {
      setActiveTimePicker(null);
    }
  }

  function toggleEndTime(checked: boolean) {
    if (checked) {
      const end = new Date(startTime);
      end.setHours(end.getHours() + 1);
      setEndTime(end);
      setHasEndTime(true);
    } else {
      setHasEndTime(false);
    }
  }

  function addOptions() {
    if (selectedDates.size === 0) {
      toast.error('Select at least one date on the calendar');
      return;
    }

    const startHours = startTime.getHours();
    const startMinutes = startTime.getMinutes();
    const endHours = endTime.getHours();
    const endMinutes = endTime.getMinutes();

    if (
      hasEndTime &&
      (endHours < startHours ||
        (endHours === startHours && endMinutes <= startMinutes))
    ) {
      toast.error('End time must be after start time');
      return;
    }

    const newOptions: DateOption[] = [];
    for (const ds of selectedDates) {
      const { year, month, day } = parseDateString(ds);
      const optDate = new Date(year, month - 1, day, startHours, startMinutes);

      if (optDate.getTime() <= Date.now()) {
        toast.error(`${formatDateShort(optDate)} is in the past`);
        return;
      }

      let optEnd: Date | undefined;
      if (hasEndTime) {
        optEnd = new Date(year, month - 1, day, endHours, endMinutes);
      }

      newOptions.push({
        id: `date-${nextDateId++}`,
        date: optDate,
        endDate: optEnd,
      });
    }

    const updated = [...dateOptions, ...newOptions].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    updateFormState({ dateOptions: updated });
    setSelectedDates(new Set());
  }

  function addSmartOptions(dates: Array<{ start: Date; end?: Date }>) {
    const result = mergeSmartDateOptions(
      dateOptions,
      dates,
      () => `date-${nextDateId++}`
    );

    if (result.addedCount === 0) {
      toast.info('Those date options are already in the list');
      return;
    }

    updateFormState({ dateOptions: result.options });
  }

  function updateOption(updated: DateOption) {
    const newOptions = dateOptions
      .map(opt => (opt.id === updated.id ? updated : opt))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    updateFormState({ dateOptions: newOptions });
  }

  function removeOption(id: string) {
    updateFormState({
      dateOptions: dateOptions.filter(d => d.id !== id),
    });
  }

  function clearAll() {
    updateFormState({ dateOptions: [] });
  }

  function handleNext() {
    if (dateOptions.length < 2) {
      toast.error('Add at least 2 date options');
      return;
    }
    const hasPastDate = dateOptions.some(
      opt => opt.date.getTime() <= Date.now()
    );
    if (hasPastDate) {
      toast.error('All dates must be in the future');
      return;
    }
    onNext();
  }

  const selectedCount = selectedDates.size;

  return (
    <ScrollView
      className='flex-1 px-4'
      keyboardShouldPersistTaps='handled'
      contentContainerClassName='pb-8'
    >
      <View className='gap-5'>
        <Text className='mt-2 text-2xl font-bold text-foreground'>
          Date Options
        </Text>
        <Text className='text-sm text-muted-foreground'>
          Describe your options or choose several dates manually.
        </Text>

        <SmartDateInput onDatesAdded={addSmartOptions} />

        <View className='flex-row items-center gap-3'>
          <View className='h-px flex-1 bg-border' />
          <Text className='text-xs text-muted-foreground'>
            or pick dates manually
          </Text>
          <View className='h-px flex-1 bg-border' />
        </View>

        {/* Calendar — multi-select via toggle */}
        <View className='overflow-hidden rounded-card border border-border bg-card'>
          <Calendar
            current={todayString()}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            minDate={todayString()}
            hideExtraDays
            enableSwipeMonths
            theme={calendarTheme}
            style={{ backgroundColor }}
            renderArrow={direction => (
              <Ionicons
                name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
                size={20}
                color={primaryColor}
              />
            )}
          />
        </View>

        {/* Time + Add card */}
        <View className='gap-3 rounded-card border border-border bg-card p-4'>
          {/* Time pickers row */}
          <View className='flex-row items-end gap-2'>
            <View className='flex-1 gap-1.5'>
              <Text className='text-xs font-medium text-muted-foreground'>
                {hasEndTime ? 'Start Time' : 'Time'}
              </Text>
              <Pressable
                onPress={() =>
                  setActiveTimePicker(
                    activeTimePicker === 'start' ? null : 'start'
                  )
                }
                className='flex-row items-center gap-2 rounded-input border border-border bg-background px-3 py-2.5'
              >
                <Ionicons name='time-outline' size={16} color={primaryColor} />
                <Text className='text-sm font-medium text-foreground'>
                  {formatTime(startTime)}
                </Text>
              </Pressable>
            </View>

            {hasEndTime ? (
              <>
                <Text className='pb-3 text-xs text-muted-foreground'>to</Text>
                <View className='flex-1 gap-1.5'>
                  <Text className='text-xs font-medium text-muted-foreground'>
                    End Time
                  </Text>
                  <Pressable
                    onPress={() =>
                      setActiveTimePicker(
                        activeTimePicker === 'end' ? null : 'end'
                      )
                    }
                    className='flex-row items-center gap-2 rounded-input border border-border bg-background px-3 py-2.5'
                  >
                    <Ionicons
                      name='time-outline'
                      size={16}
                      color={primaryColor}
                    />
                    <Text className='text-sm font-medium text-foreground'>
                      {formatTime(endTime)}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>

          {activeTimePicker === 'start' ? (
            <View className='overflow-hidden rounded-input border border-border'>
              <DateTimePicker
                value={startTime}
                mode='time'
                display='spinner'
                onChange={(_, date) => handleStartTimeChange(date)}
              />
              {Platform.OS === 'ios' ? (
                <Pressable
                  onPress={() => setActiveTimePicker(null)}
                  className='items-center border-t border-border py-2.5'
                >
                  <Text className='text-sm font-semibold text-primary'>
                    Done
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {activeTimePicker === 'end' ? (
            <View className='overflow-hidden rounded-input border border-border'>
              <DateTimePicker
                value={endTime}
                mode='time'
                display='spinner'
                onChange={(_, date) => handleEndTimeChange(date)}
              />
              {Platform.OS === 'ios' ? (
                <Pressable
                  onPress={() => setActiveTimePicker(null)}
                  className='items-center border-t border-border py-2.5'
                >
                  <Text className='text-sm font-semibold text-primary'>
                    Done
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* End time toggle */}
          <View className='flex-row items-center justify-between gap-3'>
            <View className='flex-row items-center gap-2'>
              <Switch checked={hasEndTime} onCheckedChange={toggleEndTime} />
              <Text className='text-sm text-foreground'>Include end time</Text>
            </View>
            <Text className='flex-1 text-right text-xs text-muted-foreground'>
              {getTimezoneString()}
            </Text>
          </View>

          {/* Add button */}
          <Button onPress={addOptions} disabled={selectedCount === 0}>
            {`Add ${selectedCount} Option${selectedCount !== 1 ? 's' : ''}`}
          </Button>
        </View>

        {/* Options list */}
        <View className='gap-2'>
          <View className='flex-row items-center justify-between'>
            <Text className='text-sm font-semibold text-foreground'>
              Options ({dateOptions.length})
            </Text>
            {dateOptions.length > 0 ? (
              <Pressable onPress={clearAll} hitSlop={8}>
                <Text className='text-xs font-medium text-destructive'>
                  Clear all
                </Text>
              </Pressable>
            ) : null}
          </View>

          {dateOptions.length === 0 ? (
            <View className='items-center rounded-card border border-dashed border-border py-8'>
              <Ionicons name='calendar-outline' size={28} color='#9ca3af' />
              <Text className='mt-2 text-sm text-muted-foreground'>
                No options added yet
              </Text>
              <Text className='text-xs text-muted-foreground'>
                Type naturally above or select dates from the calendar
              </Text>
            </View>
          ) : (
            <View className='overflow-hidden rounded-card border border-border'>
              {dateOptions.map((opt, index) => (
                <View
                  key={opt.id}
                  className={index > 0 ? 'border-t border-border' : ''}
                >
                  <EditableDateTimeItem
                    option={opt}
                    onUpdate={updateOption}
                    onDelete={() => removeOption(opt.id)}
                  />
                </View>
              ))}
            </View>
          )}

          {dateOptions.length > 0 && dateOptions.length < 2 ? (
            <Text className='text-center text-xs text-muted-foreground'>
              Add at least 2 options to continue
            </Text>
          ) : null}
        </View>

        <View className='mt-2 flex-row gap-3'>
          <Button variant='outline' onPress={onBack} className='flex-1'>
            Back
          </Button>
          <Button
            onPress={handleNext}
            disabled={dateOptions.length < 2}
            className='flex-1'
            isLoading={isSubmitting}
            loadingText='Saving...'
          >
            {submitLabel}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
