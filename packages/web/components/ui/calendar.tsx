'use client';

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from 'lucide-react';
import * as React from 'react';
import { DayFlag, DayPicker, SelectionState, UI } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from './button';

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  /** Size variant for calendar cells */
  size?: 'default' | 'lg' | 'xl';
};

// Size configurations for different variants
const sizeConfig = {
  default: { cell: 'h-9 w-9', text: 'text-sm', caption: 'h-9', nav: 'h-9 w-9' },
  lg: { cell: 'h-11 w-11', text: 'text-base', caption: 'h-10', nav: 'h-9 w-9' },
  xl: { cell: 'h-14 w-14', text: 'text-lg', caption: 'h-12', nav: 'h-10 w-10' },
};

export const Calendar = ({
  className,
  classNames,
  showOutsideDays = true,
  size = 'default',
  captionLayout,
  ...props
}: CalendarProps) => {
  const config = sizeConfig[size];
  const hasDropdown = captionLayout?.includes('dropdown');

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn('p-4', className)}
      classNames={{
        [UI.Months]: 'relative flex flex-col gap-4 sm:flex-row sm:gap-6',
        [UI.Month]: 'space-y-4',
        [UI.MonthCaption]: cn(
          'flex justify-center items-center relative',
          config.caption
        ),
        [UI.CaptionLabel]: cn(
          'font-semibold',
          config.text,
          // Hide completely when using dropdowns
          hasDropdown && 'hidden'
        ),
        [UI.Dropdowns]: 'flex items-center gap-2',
        [UI.MonthsDropdown]: cn(
          'appearance-none bg-transparent font-semibold cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2',
          config.text
        ),
        [UI.YearsDropdown]: cn(
          'appearance-none bg-transparent font-semibold cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md px-2',
          config.text
        ),
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ variant: 'outline' }),
          'absolute left-1 top-0 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent',
          'rounded-button transition-all duration-fast',
          config.nav
        ),
        [UI.NextMonthButton]: cn(
          buttonVariants({ variant: 'outline' }),
          'absolute right-1 top-0 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent',
          'rounded-button transition-all duration-fast',
          config.nav
        ),
        [UI.MonthGrid]: 'w-full border-collapse',
        [UI.Weekdays]: 'flex',
        [UI.Weekday]: cn(
          'text-muted-foreground font-medium',
          'flex items-center justify-center',
          config.text,
          config.cell
        ),
        [UI.Week]: 'flex w-full mt-1',
        [UI.Day]: cn('text-center p-0 relative select-none', config.cell),
        [UI.DayButton]: cn(
          buttonVariants({ variant: 'ghost' }),
          'p-0 font-normal',
          'hover:bg-primary/10 hover:text-primary',
          'rounded-button transition-all duration-fast',
          config.text,
          config.cell
        ),
        // Single selected: primary color, fully rounded (applied to cell, style button via child selector)
        [SelectionState.selected]: cn(
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:rounded-button',
          '[&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground'
        ),
        // Range start: cell has subtle bg with left rounding, button has primary
        // When combined with range_end (single day), both rounded-l-full and rounded-r-full apply = fully rounded
        [SelectionState.range_start]: cn(
          '!bg-primary/20 rounded-l-full',
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:rounded-button',
          '[&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground'
        ),
        // Range end: cell has subtle bg with right rounding, button has primary
        [SelectionState.range_end]: cn(
          '!bg-primary/20 rounded-r-full',
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:rounded-button',
          '[&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground'
        ),
        // Range middle: cell has subtle bg, button is transparent
        [SelectionState.range_middle]: cn(
          '!bg-primary/20',
          '[&>button]:bg-transparent [&>button]:text-foreground [&>button]:rounded-none',
          '[&>button]:hover:bg-primary/10'
        ),
        [DayFlag.today]: cn(
          '[&>button]:bg-accent [&>button]:text-accent-foreground [&>button]:font-semibold',
          '[&>button]:ring-2 [&>button]:ring-primary/20'
        ),
        [DayFlag.outside]: cn(
          'day-outside text-muted-foreground opacity-50',
          'aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30'
        ),
        [DayFlag.disabled]:
          'text-muted-foreground opacity-50 cursor-not-allowed',
        [DayFlag.hidden]: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ ...props }) => <Chevron {...props} />,
      }}
      {...props}
    />
  );
};

const Chevron = ({ orientation = 'left' }) => {
  switch (orientation) {
    case 'left':
      return <ChevronLeftIcon className='h-4 w-4' />;
    case 'right':
      return <ChevronRightIcon className='h-4 w-4' />;
    case 'up':
      return <ChevronUpIcon className='h-4 w-4' />;
    case 'down':
      return <ChevronDownIcon className='h-4 w-4' />;
    default:
      return null;
  }
};
