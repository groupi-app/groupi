'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAction } from 'convex/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import {
  parseDateExpressions,
  tryClientDecomposition,
  formatParsedDateRange,
  validateParsedDates,
  type ParsedDateRange,
} from '@/lib/date-parser';
import { isGDL, parseGDL } from '@groupi/shared';
import { GDLHighlightedInput } from '@/components/gdl-highlighted-input';

// Dynamic import for api
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let aiActions: any;
function initApi() {
  if (!aiActions) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    aiActions = api.ai?.actions ?? {};
  }
}
initApi();

interface ParsedDateWithSelection extends ParsedDateRange {
  selected: boolean;
  id: string;
  validationErrors: string[];
}

interface SmartDateInputProps {
  onDatesAdded: (dates: Array<{ start: Date; end?: Date }>) => void;
  referenceDate?: Date;
  placeholder?: string;
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

type PreviewMode = 'empty' | 'gdl' | 'instant' | 'llm';

interface PreviewState {
  mode: PreviewMode;
  dates: Array<{ start: Date; end?: Date; note?: string }>;
  error?: string;
}

function formatDateOption(opt: {
  start: Date;
  end?: Date;
  note?: string;
}): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };
  const startStr = opt.start.toLocaleString(undefined, options);
  if (!opt.end) return startStr;
  const sameDay =
    opt.start.getFullYear() === opt.end.getFullYear() &&
    opt.start.getMonth() === opt.end.getMonth() &&
    opt.start.getDate() === opt.end.getDate();
  if (sameDay) {
    const endStr = opt.end.toLocaleString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${startStr} - ${endStr}`;
  }
  return `${startStr} - ${opt.end.toLocaleString(undefined, options)}`;
}

export function SmartDateInput({
  onDatesAdded,
  referenceDate,
  placeholder = 'e.g., Fr@18-20 or Tuesday and Thursday next week 6-8pm',
}: SmartDateInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [parsedDates, setParsedDates] = useState<ParsedDateWithSelection[]>([]);
  const decomposeDateExpression = useAction(aiActions.decomposeDateExpression);

  const debouncedInput = useDebounced(inputValue.trim(), 200);

  const preview = useMemo((): PreviewState => {
    if (!debouncedInput) return { mode: 'empty', dates: [] };
    const refDate = referenceDate || new Date();

    // Tier 1: GDL
    if (isGDL(debouncedInput)) {
      const result = parseGDL(debouncedInput, refDate);
      if (result.success) {
        return { mode: 'gdl', dates: result.results };
      }
      return { mode: 'gdl', dates: [], error: result.error };
    }

    // Tier 2: chrono-node client-side
    const clientResult = tryClientDecomposition(debouncedInput, refDate);
    if (clientResult && clientResult.length > 0) {
      return { mode: 'instant', dates: clientResult };
    }

    // Tier 3: LLM fallback
    return { mode: 'llm', dates: [] };
  }, [debouncedInput, referenceDate]);

  const handleAddDirect = useCallback(() => {
    if (preview.dates.length === 0) return;
    onDatesAdded(preview.dates.map(({ start, end }) => ({ start, end })));
    setInputValue('');
    toast.success(`Added ${preview.dates.length} date option(s)`);
  }, [preview, onDatesAdded]);

  const handleLLMParse = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setIsLoading(true);
    try {
      const refDate = referenceDate || new Date();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await decomposeDateExpression({
        input: trimmed,
        referenceDate: refDate.getTime(),
        timezone,
      });

      if (!result.success || !result.expressions?.length) {
        toast.error(
          result.error || 'Could not parse any dates. Please try rephrasing.'
        );
        return;
      }

      const parsed = parseDateExpressions(result.expressions, refDate);
      if (parsed.length === 0) {
        toast.error('Could not parse the dates. Please try rephrasing.');
        return;
      }

      const validations = validateParsedDates(parsed);
      const withSelection: ParsedDateWithSelection[] = parsed.map(
        (date, i) => ({
          ...date,
          id: `${Date.now()}-${i}`,
          selected: validations[i].isValid,
          validationErrors: validations[i].errors,
        })
      );

      setParsedDates(withSelection);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error parsing dates:', error);
      toast.error('Failed to parse dates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, referenceDate, decomposeDateExpression]);

  const handleSubmit = useCallback(() => {
    if (preview.mode === 'gdl' || preview.mode === 'instant') {
      handleAddDirect();
    } else if (preview.mode === 'llm') {
      handleLLMParse();
    }
  }, [preview.mode, handleAddDirect, handleLLMParse]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const toggleDateSelection = useCallback((id: string) => {
    setParsedDates(prev =>
      prev.map(date =>
        date.id === id ? { ...date, selected: !date.selected } : date
      )
    );
  }, []);

  const handleConfirmDates = useCallback(() => {
    const selectedDates = parsedDates
      .filter(date => date.selected)
      .map(({ start, end }) => ({ start, end }));

    if (selectedDates.length === 0) {
      toast.error('Please select at least one date');
      return;
    }

    onDatesAdded(selectedDates);
    setIsPreviewOpen(false);
    setInputValue('');
    setParsedDates([]);
    toast.success(`Added ${selectedDates.length} date option(s)`);
  }, [parsedDates, onDatesAdded]);

  const handleCancel = useCallback(() => {
    setIsPreviewOpen(false);
    setParsedDates([]);
  }, []);

  const selectedCount = parsedDates.filter(d => d.selected).length;
  const isLLMMode = preview.mode === 'llm';
  const isGDLMode = preview.mode === 'gdl';
  const hasDirectPreview =
    (preview.mode === 'gdl' || preview.mode === 'instant') &&
    preview.dates.length > 0;

  return (
    <>
      <div className='flex flex-col gap-1.5'>
        <div className='flex items-center gap-2'>
          <div className='relative flex-1'>
            <Icons.sparkles
              className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-lifted size-4 ${
                isLLMMode
                  ? 'smart-date-rainbow-icon'
                  : 'text-muted-foreground/30 transition-colors duration-normal'
              }`}
            />
            <GDLHighlightedInput
              value={inputValue}
              onChange={setInputValue}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              highlight={isGDLMode}
              rainbowFocus={isLLMMode}
              className='pl-9'
            />
          </div>
          {preview.mode !== 'empty' && (
            <Button
              type='button'
              onClick={handleSubmit}
              disabled={isLoading || (isGDLMode && preview.dates.length === 0)}
              size='sm'
              variant={hasDirectPreview ? 'default' : 'outline'}
            >
              {isLoading ? (
                <Icons.spinner className='size-4 animate-spin' />
              ) : hasDirectPreview ? (
                <Icons.plus className='size-4' />
              ) : (
                <Icons.sparkles className='size-4' />
              )}
            </Button>
          )}
        </div>

        {hasDirectPreview && (
          <div className='flex flex-wrap gap-1.5 px-1'>
            {[...preview.dates]
              .sort((a, b) => a.start.getTime() - b.start.getTime())
              .map((date, i) => (
                <span
                  key={i}
                  className='text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-badge'
                >
                  {formatDateOption(date)}
                  {date.note && ` — ${date.note}`}
                </span>
              ))}
          </div>
        )}

        {isGDLMode && preview.error && (
          <p className='text-xs text-error px-1'>{preview.error}</p>
        )}

        {isLLMMode && (
          <p className='text-xs text-muted-foreground px-1'>
            AI will parse this expression
          </p>
        )}

        {preview.mode === 'empty' && (
          <p className='text-xs text-muted-foreground px-1'>
            Describe your event times naturally or use a{' '}
            <a
              href='/gdl'
              target='_blank'
              rel='noopener noreferrer'
              className='underline hover:text-foreground transition-colors'
            >
              GDL expression
            </a>
          </p>
        )}
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Confirm Dates</DialogTitle>
            <DialogDescription>
              Review the interpreted dates below. Uncheck any you don&apos;t
              want to add.
            </DialogDescription>
          </DialogHeader>

          <div className='flex flex-col gap-3 max-h-80 overflow-y-auto py-2'>
            {parsedDates.map(date => (
              <label
                key={date.id}
                className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                  date.selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-muted/50'
                } ${date.validationErrors.length > 0 ? 'border-yellow-500/50' : ''}`}
              >
                <Checkbox
                  checked={date.selected}
                  onCheckedChange={() => toggleDateSelection(date.id)}
                  className='mt-0.5'
                />
                <div className='flex-1 min-w-0'>
                  <div className='text-sm font-medium'>
                    {formatParsedDateRange(date)}
                  </div>
                  {date.validationErrors.length > 0 && (
                    <div className='text-xs text-warning mt-1'>
                      {date.validationErrors.join(', ')}
                    </div>
                  )}
                </div>
              </label>
            ))}

            {parsedDates.length === 0 && (
              <p className='text-center text-muted-foreground py-4'>
                No dates to preview
              </p>
            )}
          </div>

          <DialogFooter className='flex-row gap-2 sm:gap-0'>
            <Button type='button' variant='outline' onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type='button'
              onClick={handleConfirmDates}
              disabled={selectedCount === 0}
            >
              Add {selectedCount} Date{selectedCount !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
