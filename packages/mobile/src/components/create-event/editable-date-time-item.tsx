import { View, Pressable, Platform, TextInput } from 'react-native';
import { Text } from '@/components/ui/text';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, type DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import { useMemo, useState } from 'react';
import { toast } from '@groupi/shared/platform';
import type { DateOption } from '@/context/create-event-context';

interface EditableDateTimeItemProps {
  option: DateOption;
  onUpdate: (updated: DateOption) => void;
  onDelete: () => void;
}

type EditingField = 'date' | 'start-time' | 'end-time';

function formatDateShort(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'numeric',
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

export function EditableDateTimeItem({
  option,
  onUpdate,
  onDelete,
}: EditableDateTimeItemProps) {
  const primaryColor = String(useCSSVariable('--color-primary') ?? '');
  const mutedColor = String(useCSSVariable('--color-muted-foreground') ?? '');
  const destructiveColor = String(useCSSVariable('--color-destructive') ?? '');
  const foregroundColor = String(
    useCSSVariable('--color-foreground') ?? '#000'
  );
  const backgroundColor = String(useCSSVariable('--color-card') ?? '#fff');

  const [editing, setEditing] = useState<EditingField | null>(null);

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
      textDayFontSize: 14,
      textMonthFontSize: 15,
      textDayHeaderFontSize: 12,
      textMonthFontWeight: '600' as const,
      textDayFontWeight: '400' as const,
    }),
    [foregroundColor, mutedColor, primaryColor]
  );

  const dateString = toDateString(option.date);

  function handleDateChange(day: DateData) {
    const updated = new Date(option.date);
    updated.setFullYear(day.year, day.month - 1, day.day);

    let updatedEnd: Date | undefined;
    if (option.endDate) {
      updatedEnd = new Date(option.endDate);
      updatedEnd.setFullYear(day.year, day.month - 1, day.day);
    }

    onUpdate({ ...option, date: updated, endDate: updatedEnd });
    setEditing(null);
  }

  function handleStartTimeChange(date: Date | undefined) {
    if (!date) return;
    const updated = new Date(option.date);
    updated.setHours(date.getHours(), date.getMinutes(), 0, 0);

    if (option.endDate && updated.getTime() >= option.endDate.getTime()) {
      toast.error('Start time must be before end time');
      return;
    }

    onUpdate({ ...option, date: updated });
    if (Platform.OS === 'android') {
      setEditing(null);
    }
  }

  function handleEndTimeChange(date: Date | undefined) {
    if (!date) return;
    const updated = new Date(option.endDate ?? option.date);
    updated.setFullYear(
      option.date.getFullYear(),
      option.date.getMonth(),
      option.date.getDate()
    );
    updated.setHours(date.getHours(), date.getMinutes(), 0, 0);

    if (updated.getTime() <= option.date.getTime()) {
      toast.error('End time must be after start time');
      return;
    }

    onUpdate({ ...option, endDate: updated });
    if (Platform.OS === 'android') {
      setEditing(null);
    }
  }

  function addEndTime() {
    const end = new Date(option.date);
    end.setHours(end.getHours() + 1);
    onUpdate({ ...option, endDate: end });
  }

  function removeEndTime() {
    onUpdate({ ...option, endDate: undefined });
  }

  return (
    <View className='gap-2 bg-card px-4 py-3'>
      {/* Start row: date + time + actions */}
      <View className='flex-row items-center gap-2'>
        {/* Date button */}
        <Pressable
          onPress={() => setEditing(editing === 'date' ? null : 'date')}
          className='flex-row items-center gap-1 rounded-input border border-border bg-background px-2 py-1.5'
        >
          <Ionicons name='calendar-outline' size={14} color={primaryColor} />
          <Text className='text-xs font-medium text-foreground'>
            {formatDateShort(option.date)}
          </Text>
        </Pressable>

        {/* Start time button */}
        <Pressable
          onPress={() =>
            setEditing(editing === 'start-time' ? null : 'start-time')
          }
          className='flex-row items-center gap-1 rounded-input border border-border bg-background px-2 py-1.5'
        >
          <Ionicons name='time-outline' size={14} color={primaryColor} />
          <Text className='text-xs font-medium text-foreground'>
            {formatTime(option.date)}
          </Text>
        </Pressable>

        {/* + End button (only if no end date) */}
        {!option.endDate ? (
          <Pressable onPress={addEndTime} hitSlop={4}>
            <Text className='text-xs text-muted-foreground'>+ End</Text>
          </Pressable>
        ) : null}

        {/* Spacer + Delete */}
        <View className='flex-1' />
        <Pressable onPress={onDelete} hitSlop={8}>
          <Ionicons name='trash-outline' size={16} color={destructiveColor} />
        </Pressable>
      </View>

      {/* End time row (if end date exists) */}
      {option.endDate ? (
        <View className='flex-row items-center gap-2 pl-1'>
          <Text className='text-xs text-muted-foreground'>to</Text>

          <Pressable
            onPress={() =>
              setEditing(editing === 'end-time' ? null : 'end-time')
            }
            className='flex-row items-center gap-1 rounded-input border border-border bg-background px-2 py-1.5'
          >
            <Ionicons name='time-outline' size={14} color={primaryColor} />
            <Text className='text-xs font-medium text-foreground'>
              {formatTime(option.endDate)}
            </Text>
          </Pressable>

          <Pressable onPress={removeEndTime} hitSlop={4}>
            <Ionicons name='close-circle' size={16} color={mutedColor} />
          </Pressable>
        </View>
      ) : null}

      {/* Note field */}
      <View className='relative'>
        <TextInput
          value={option.note ?? ''}
          onChangeText={text =>
            onUpdate({ ...option, note: text || undefined })
          }
          placeholder='Add a note (optional)'
          placeholderTextColor={mutedColor}
          maxLength={200}
          multiline
          className='min-h-[32px] rounded-input border border-border bg-background px-2.5 py-1.5 text-xs text-foreground'
          style={{ textAlignVertical: 'top' }}
        />
        {option.note ? (
          <Text className='absolute bottom-1 right-2 text-[10px] text-muted-foreground'>
            {`${option.note.length}/200`}
          </Text>
        ) : null}
      </View>

      {/* Inline calendar for editing date */}
      {editing === 'date' ? (
        <View className='overflow-hidden rounded-input border border-border'>
          <Calendar
            current={dateString}
            onDayPress={handleDateChange}
            markedDates={{
              [dateString]: {
                selected: true,
                selectedColor: primaryColor,
                selectedTextColor: '#ffffff',
              },
            }}
            minDate={todayString()}
            hideExtraDays
            enableSwipeMonths
            theme={calendarTheme}
            style={{ backgroundColor }}
            renderArrow={direction => (
              <Ionicons
                name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
                size={18}
                color={primaryColor}
              />
            )}
          />
        </View>
      ) : null}

      {/* Inline time picker for start time */}
      {editing === 'start-time' ? (
        <View className='overflow-hidden rounded-input border border-border'>
          <DateTimePicker
            value={option.date}
            mode='time'
            display='spinner'
            onChange={(_, date) => handleStartTimeChange(date)}
          />
          {Platform.OS === 'ios' ? (
            <Pressable
              onPress={() => setEditing(null)}
              className='items-center border-t border-border py-2'
            >
              <Text className='text-sm font-semibold text-primary'>Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Inline time picker for end time */}
      {editing === 'end-time' && option.endDate ? (
        <View className='overflow-hidden rounded-input border border-border'>
          <DateTimePicker
            value={option.endDate}
            mode='time'
            display='spinner'
            onChange={(_, date) => handleEndTimeChange(date)}
          />
          {Platform.OS === 'ios' ? (
            <Pressable
              onPress={() => setEditing(null)}
              className='items-center border-t border-border py-2'
            >
              <Text className='text-sm font-semibold text-primary'>Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
