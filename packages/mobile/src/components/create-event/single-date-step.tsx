import { useState, useMemo } from 'react';
import { View, Pressable, ScrollView, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar, type DateData } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import { useCreateEventForm } from '@/context/create-event-context';
import { toast } from '@groupi/shared/platform';

interface SingleDateStepProps {
  onNext: () => void;
  onBack: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDateFull(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
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

type TimePicker = 'start' | 'end';

export function SingleDateStep({ onNext, onBack }: SingleDateStepProps) {
  const { formState, updateFormState } = useCreateEventForm();
  const { singleDate, singleEndDate, hasEndTime } = formState;
  const primaryColor = String(useCSSVariable('--color-primary') ?? '');
  const backgroundColor = String(useCSSVariable('--color-card') ?? '#fff');
  const foregroundColor = String(
    useCSSVariable('--color-foreground') ?? '#000'
  );
  const mutedColor = String(useCSSVariable('--color-muted-foreground') ?? '');

  const [activeTimePicker, setActiveTimePicker] = useState<TimePicker | null>(
    null
  );

  const selectedDateString = toDateString(singleDate);

  const markedDates = useMemo(
    () => ({
      [selectedDateString]: {
        selected: true,
        selectedColor: primaryColor,
        selectedTextColor: '#ffffff',
      },
    }),
    [selectedDateString, primaryColor]
  );

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
    const updated = new Date(singleDate);
    updated.setFullYear(day.year, day.month - 1, day.day);
    updateFormState({ singleDate: updated });

    if (hasEndTime && singleEndDate) {
      const updatedEnd = new Date(singleEndDate);
      updatedEnd.setFullYear(day.year, day.month - 1, day.day);
      updateFormState({ singleDate: updated, singleEndDate: updatedEnd });
    }
  }

  function handleStartTimeChange(date: Date | undefined) {
    if (!date) return;
    const updated = new Date(singleDate);
    updated.setHours(date.getHours(), date.getMinutes(), 0, 0);
    updateFormState({ singleDate: updated });
    if (Platform.OS === 'android') {
      setActiveTimePicker(null);
    }
  }

  function handleEndTimeChange(date: Date | undefined) {
    if (!date) return;
    const updated = new Date(singleEndDate ?? singleDate);
    updated.setFullYear(
      singleDate.getFullYear(),
      singleDate.getMonth(),
      singleDate.getDate()
    );
    updated.setHours(date.getHours(), date.getMinutes(), 0, 0);
    updateFormState({ singleEndDate: updated });
    if (Platform.OS === 'android') {
      setActiveTimePicker(null);
    }
  }

  function toggleEndTime(checked: boolean) {
    if (checked) {
      const end = new Date(singleDate);
      end.setHours(end.getHours() + 1);
      updateFormState({ hasEndTime: true, singleEndDate: end });
    } else {
      updateFormState({ hasEndTime: false, singleEndDate: undefined });
    }
  }

  function handleNext() {
    if (singleDate.getTime() <= Date.now()) {
      toast.error('Event date must be in the future');
      return;
    }
    if (hasEndTime && singleEndDate) {
      if (singleEndDate.getTime() <= singleDate.getTime()) {
        toast.error('End time must be after start time');
        return;
      }
    }
    onNext();
  }

  return (
    <ScrollView
      className='flex-1 px-4'
      keyboardShouldPersistTaps='handled'
      contentContainerClassName='pb-8'
    >
      <View className='gap-5'>
        <Text className='mt-2 text-2xl font-bold text-foreground'>
          Event Date & Time
        </Text>

        {/* Calendar */}
        <View className='overflow-hidden rounded-card border border-border bg-card'>
          <Calendar
            current={selectedDateString}
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

        {/* Time pickers */}
        <View className='gap-3 rounded-card border border-border bg-card p-4'>
          {/* Start time */}
          <View className='gap-1.5'>
            <Text className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
              {hasEndTime ? 'Start Time' : 'Time'}
            </Text>
            <Pressable
              onPress={() =>
                setActiveTimePicker(
                  activeTimePicker === 'start' ? null : 'start'
                )
              }
              className='flex-row items-center gap-3 rounded-input border border-border bg-background px-4 py-3'
            >
              <Ionicons name='time-outline' size={20} color={primaryColor} />
              <Text className='flex-1 text-base font-medium text-foreground'>
                {formatTime(singleDate)}
              </Text>
              <Ionicons
                name={
                  activeTimePicker === 'start' ? 'chevron-up' : 'chevron-down'
                }
                size={16}
                color={mutedColor}
              />
            </Pressable>

            {activeTimePicker === 'start' ? (
              <View className='overflow-hidden rounded-input border border-border'>
                <DateTimePicker
                  value={singleDate}
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
          </View>

          {/* End time */}
          {hasEndTime ? (
            <View className='gap-1.5'>
              <Text className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                End Time
              </Text>
              <Pressable
                onPress={() =>
                  setActiveTimePicker(activeTimePicker === 'end' ? null : 'end')
                }
                className='flex-row items-center gap-3 rounded-input border border-border bg-background px-4 py-3'
              >
                <Ionicons name='time-outline' size={20} color={primaryColor} />
                <Text className='flex-1 text-base font-medium text-foreground'>
                  {singleEndDate ? formatTime(singleEndDate) : '--:--'}
                </Text>
                <Ionicons
                  name={
                    activeTimePicker === 'end' ? 'chevron-up' : 'chevron-down'
                  }
                  size={16}
                  color={mutedColor}
                />
              </Pressable>

              {activeTimePicker === 'end' ? (
                <View className='overflow-hidden rounded-input border border-border'>
                  <DateTimePicker
                    value={singleEndDate ?? singleDate}
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
            </View>
          ) : null}

          {/* Toggle */}
          <View className='flex-row items-center justify-between border-t border-border pt-3'>
            <Text className='text-sm font-medium text-foreground'>
              Add end time
            </Text>
            <Switch checked={hasEndTime} onCheckedChange={toggleEndTime} />
          </View>
        </View>

        {/* Preview */}
        <View className='items-center rounded-card border border-border bg-muted/30 px-6 py-4'>
          <View className='flex-row items-center gap-2'>
            <Ionicons name='calendar' size={18} color={primaryColor} />
            <Text className='text-sm font-medium text-foreground'>
              {formatDateFull(singleDate)}
            </Text>
          </View>
          {hasEndTime && singleEndDate ? (
            <Text className='mt-1 text-xs text-muted-foreground'>
              until {formatTime(singleEndDate)}
            </Text>
          ) : null}
        </View>

        <View className='mt-2 flex-row gap-3'>
          <Button variant='outline' onPress={onBack} className='flex-1'>
            Back
          </Button>
          <Button onPress={handleNext} className='flex-1'>
            Next
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
