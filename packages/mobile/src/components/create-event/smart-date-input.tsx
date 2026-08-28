import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAction } from 'convex/react';
import * as WebBrowser from 'expo-web-browser';
import { useCSSVariable } from 'uniwind';

import { api } from 'convex/_generated/api';
import {
  formatParsedDateRange,
  isGDL,
  parseDateExpressions,
  parseGDL,
  tryClientDecomposition,
  validateParsedDates,
  type ParsedDateRange,
} from '@groupi/shared';
import { toast } from '@groupi/shared/platform';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { getPublicGdlUrl } from '@/lib/public-urls';

import { GdlReferenceGuide } from './gdl-reference-guide';

interface SmartDateInputProps {
  onDatesAdded: (dates: Array<{ start: Date; end?: Date }>) => void;
  referenceDate?: Date;
}

interface ParsedDateWithSelection extends ParsedDateRange {
  id: string;
  selected: boolean;
  validationErrors: string[];
}

type PreviewMode = 'empty' | 'gdl' | 'instant' | 'llm';

interface PreviewState {
  mode: PreviewMode;
  dates: Array<{ start: Date; end?: Date; note?: string }>;
  error?: string;
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

function formatDateOption(option: {
  start: Date;
  end?: Date;
  note?: string;
}): string {
  const start = option.start.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  if (!option.end) return start;

  const sameDay =
    option.start.getFullYear() === option.end.getFullYear() &&
    option.start.getMonth() === option.end.getMonth() &&
    option.start.getDate() === option.end.getDate();
  const end = option.end.toLocaleString(
    undefined,
    sameDay
      ? { hour: 'numeric', minute: '2-digit' }
      : {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }
  );

  return `${start} – ${end}`;
}

export function SmartDateInput({
  onDatesAdded,
  referenceDate,
}: SmartDateInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGdlGuideOpen, setIsGdlGuideOpen] = useState(false);
  const [parsedDates, setParsedDates] = useState<ParsedDateWithSelection[]>([]);
  const primaryColor = String(useCSSVariable('--color-primary') ?? '');
  const mutedColor = String(useCSSVariable('--color-muted-foreground') ?? '');
  const decomposeDateExpression = useAction(
    api.ai.actions.decomposeDateExpression
  );
  const debouncedInput = useDebounced(inputValue.trim(), 200);

  const preview = useMemo((): PreviewState => {
    if (!debouncedInput) return { mode: 'empty', dates: [] };
    const refDate = referenceDate ?? new Date();

    if (isGDL(debouncedInput)) {
      const result = parseGDL(debouncedInput, refDate);
      if (result.success) return { mode: 'gdl', dates: result.results };
      return { mode: 'gdl', dates: [], error: result.error };
    }

    const localDates = tryClientDecomposition(debouncedInput, refDate);
    if (localDates?.length) {
      return { mode: 'instant', dates: localDates };
    }

    return { mode: 'llm', dates: [] };
  }, [debouncedInput, referenceDate]);

  const addDirectDates = useCallback(() => {
    if (preview.dates.length === 0) return;
    onDatesAdded(preview.dates.map(({ start, end }) => ({ start, end })));
    setInputValue('');
    toast.success(`Added ${preview.dates.length} date option(s)`);
  }, [onDatesAdded, preview.dates]);

  const parseWithAI = useCallback(async () => {
    const input = inputValue.trim();
    if (!input || isLoading) return;

    setIsLoading(true);
    try {
      const refDate = referenceDate ?? new Date();
      const result = await decomposeDateExpression({
        input,
        referenceDate: refDate.getTime(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (!result.success || !result.expressions?.length) {
        toast.error(
          result.error ?? 'Could not parse any dates. Try rephrasing it.'
        );
        return;
      }

      const dates = parseDateExpressions(result.expressions, refDate);
      if (dates.length === 0) {
        toast.error('Could not parse those dates. Try rephrasing it.');
        return;
      }

      const validations = validateParsedDates(dates);
      setParsedDates(
        dates.map((date, index) => ({
          ...date,
          id: `${Date.now()}-${index}`,
          selected: validations[index].isValid,
          validationErrors: validations[index].errors,
        }))
      );
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Failed to parse smart dates:', error);
      toast.error('Smart Date could not be reached. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [decomposeDateExpression, inputValue, isLoading, referenceDate]);

  const handleSubmit = useCallback(() => {
    if (preview.mode === 'gdl' || preview.mode === 'instant') {
      addDirectDates();
      return;
    }

    if (preview.mode === 'llm') void parseWithAI();
  }, [addDirectDates, parseWithAI, preview.mode]);

  const selectGdlExample = useCallback((expression: string) => {
    setInputValue(expression);
    setIsGdlGuideOpen(false);
  }, []);

  const openFullGdlGuide = useCallback(async () => {
    try {
      await WebBrowser.openBrowserAsync(getPublicGdlUrl());
    } catch (error) {
      console.error('Failed to open the GDL guide:', error);
      toast.error('Could not open the GDL guide');
    }
  }, []);

  const toggleDate = useCallback((id: string) => {
    setParsedDates(current =>
      current.map(date =>
        date.id === id ? { ...date, selected: !date.selected } : date
      )
    );
  }, []);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setParsedDates([]);
  }, []);

  const confirmDates = useCallback(() => {
    const selected = parsedDates
      .filter(date => date.selected)
      .map(({ start, end }) => ({ start, end }));

    if (selected.length === 0) {
      toast.error('Select at least one date');
      return;
    }

    onDatesAdded(selected);
    setInputValue('');
    closePreview();
    toast.success(`Added ${selected.length} date option(s)`);
  }, [closePreview, onDatesAdded, parsedDates]);

  const selectedCount = parsedDates.filter(date => date.selected).length;
  const hasDirectPreview =
    (preview.mode === 'gdl' || preview.mode === 'instant') &&
    preview.dates.length > 0;

  return (
    <>
      <View className='gap-1.5'>
        <View className='flex-row items-center gap-2'>
          <View className='flex-1 justify-center'>
            <Input
              testID='smart-date-input'
              accessibilityLabel='Smart Date expression'
              value={inputValue}
              onChangeText={setInputValue}
              onSubmitEditing={handleSubmit}
              returnKeyType='done'
              blurOnSubmit={false}
              editable={!isLoading}
              placeholder='e.g., Fr@18-20 or Tuesday and Thursday next week 6-8pm'
              className='pl-9'
            />
            <View pointerEvents='none' className='absolute left-3'>
              <Ionicons
                name='sparkles'
                size={16}
                color={preview.mode === 'llm' ? primaryColor : mutedColor}
              />
            </View>
          </View>
          {preview.mode !== 'empty' ? (
            <Button
              testID='smart-date-submit'
              accessibilityLabel={
                hasDirectPreview ? 'Add parsed dates' : 'Parse dates with AI'
              }
              size='icon'
              variant={hasDirectPreview ? 'default' : 'outline'}
              disabled={
                isLoading ||
                (preview.mode === 'gdl' && preview.dates.length === 0)
              }
              onPress={handleSubmit}
            >
              {isLoading ? (
                <ActivityIndicator colorClassName='accent-primary' />
              ) : (
                <Ionicons
                  name={hasDirectPreview ? 'add' : 'sparkles'}
                  size={20}
                  color={hasDirectPreview ? '#ffffff' : primaryColor}
                />
              )}
            </Button>
          ) : null}
        </View>

        {hasDirectPreview ? (
          <View className='flex-row flex-wrap gap-1.5 px-1'>
            {[...preview.dates]
              .sort((a, b) => a.start.getTime() - b.start.getTime())
              .map((date, index) => (
                <View
                  key={`${date.start.getTime()}-${index}`}
                  className='rounded-badge bg-muted/50 px-2 py-0.5'
                >
                  <Text className='text-xs text-muted-foreground'>
                    {formatDateOption(date)}
                    {date.note ? ` — ${date.note}` : ''}
                  </Text>
                </View>
              ))}
          </View>
        ) : null}

        {preview.mode === 'gdl' && preview.error ? (
          <Text className='px-1 text-xs text-error'>{preview.error}</Text>
        ) : preview.mode === 'llm' ? (
          <Text className='px-1 text-xs text-muted-foreground'>
            AI will parse this expression
          </Text>
        ) : preview.mode === 'empty' ? (
          <View className='flex-row flex-wrap items-center px-1'>
            <Text className='text-xs text-muted-foreground'>
              Describe your event times naturally or use a{' '}
            </Text>
            <Pressable
              testID='gdl-reference-toggle'
              accessibilityRole='button'
              accessibilityLabel='GDL expression reference'
              accessibilityState={{ expanded: isGdlGuideOpen }}
              hitSlop={8}
              onPress={() => setIsGdlGuideOpen(open => !open)}
              className='flex-row items-center gap-0.5'
            >
              <Text className='text-xs font-semibold text-primary underline'>
                GDL expression
              </Text>
              <Ionicons
                name={isGdlGuideOpen ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={primaryColor}
              />
            </Pressable>
          </View>
        ) : null}

        {isGdlGuideOpen ? (
          <GdlReferenceGuide
            onClose={() => setIsGdlGuideOpen(false)}
            onOpenFullGuide={() => void openFullGdlGuide()}
            onSelectExample={selectGdlExample}
          />
        ) : null}
      </View>

      <Dialog
        open={isPreviewOpen}
        onOpenChange={open => {
          if (!open) closePreview();
        }}
      >
        <DialogContent className='mx-4'>
          <DialogHeader>
            <DialogTitle>Confirm Dates</DialogTitle>
            <DialogDescription>
              Review the interpreted options and deselect any you do not want.
            </DialogDescription>
          </DialogHeader>

          <ScrollView className='max-h-80' contentContainerClassName='gap-2'>
            {parsedDates.map(date => (
              <Pressable
                key={date.id}
                accessibilityRole='checkbox'
                accessibilityState={{ checked: date.selected }}
                onPress={() => toggleDate(date.id)}
                className={
                  date.selected
                    ? 'flex-row items-start gap-3 rounded-input border border-primary bg-primary/5 p-3'
                    : 'flex-row items-start gap-3 rounded-input border border-border bg-muted/50 p-3'
                }
              >
                <View
                  className={
                    date.selected
                      ? 'mt-0.5 size-5 items-center justify-center rounded border border-primary bg-primary'
                      : 'mt-0.5 size-5 rounded border border-border bg-background'
                  }
                >
                  {date.selected ? (
                    <Ionicons name='checkmark' size={14} color='#ffffff' />
                  ) : null}
                </View>
                <View className='flex-1 gap-1'>
                  <Text className='text-sm font-medium text-foreground'>
                    {formatParsedDateRange(date)}
                  </Text>
                  {date.validationErrors.length > 0 ? (
                    <Text className='text-xs text-warning'>
                      {date.validationErrors.join(', ')}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>

          <DialogFooter className='flex-row'>
            <Button variant='outline' onPress={closePreview} className='flex-1'>
              Cancel
            </Button>
            <Button
              onPress={confirmDates}
              disabled={selectedCount === 0}
              className='flex-1'
            >
              {`Add ${selectedCount} Date${selectedCount === 1 ? '' : 's'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
