'use client';

import { useState, useCallback } from 'react';
import { useAction } from 'convex/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  formatParsedDateRange,
  validateParsedDates,
  type ParsedDateRange,
} from '@/lib/date-parser';

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

export function SmartDateInput({
  onDatesAdded,
  referenceDate,
  placeholder = 'e.g., Tuesday and Thursday next week 6-8pm',
}: SmartDateInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [parsedDates, setParsedDates] = useState<ParsedDateWithSelection[]>([]);

  const decomposeDateExpression = useAction(aiActions.decomposeDateExpression);

  const parseInput = useCallback(async () => {
    if (!inputValue.trim()) {
      toast.error('Please enter some date/time information');
      return;
    }

    setIsLoading(true);

    try {
      const refDate = referenceDate || new Date();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Call AI to decompose the input
      const result = await decomposeDateExpression({
        input: inputValue,
        referenceDate: refDate.getTime(),
        timezone,
      });

      if (!result.success || !result.expressions?.length) {
        toast.error(
          result.error || 'Could not parse any dates. Please try rephrasing.'
        );
        return;
      }

      // Parse the expressions with chrono-node
      const parsed = parseDateExpressions(result.expressions, refDate);

      if (parsed.length === 0) {
        toast.error('Could not parse the dates. Please try rephrasing.');
        return;
      }

      // Validate and add selection state
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        parseInput();
      }
    },
    [parseInput]
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

  return (
    <>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-2'>
          <div className='relative flex-1'>
            <Icons.sparkles className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
            <Input
              type='text'
              placeholder={placeholder}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className='pl-9 pr-4'
              disabled={isLoading}
            />
          </div>
          <Button
            type='button'
            onClick={parseInput}
            disabled={isLoading || !inputValue.trim()}
            size='sm'
          >
            {isLoading ? (
              <Icons.spinner className='size-4 animate-spin' />
            ) : (
              'Parse'
            )}
          </Button>
        </div>
        <p className='text-xs text-muted-foreground'>
          Describe your event times naturally. Press Enter or click Parse to
          interpret.
        </p>
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
                  <div className='text-xs text-muted-foreground truncate'>
                    Parsed from: &quot;{date.text}&quot;
                  </div>
                  {date.validationErrors.length > 0 && (
                    <div className='text-xs text-yellow-600 mt-1'>
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
