'use client';

import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import * as React from 'react';
import type { DateBefore, DateAfter } from 'react-day-picker';

import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from './utils';

interface DatePickerProps {
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /**
   * Minimum selectable date
   */
  minDate?: Date;
  /**
   * Maximum selectable date
   */
  maxDate?: Date;
  /**
   * Show clear button when date is selected
   */
  showClear?: boolean;
  /**
   * Accessible label for the date picker
   */
  ariaLabel?: string;
}

export function DatePicker({
  date,
  onSelect,
  placeholder = 'Pick a date',
  disabled = false,
  className,
  minDate,
  maxDate,
  showClear = false,
  ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(undefined);
  };

  // Build disabled matcher for react-day-picker
  const disabledDays = React.useMemo(() => {
    const matchers: Array<DateBefore | DateAfter> = [];
    if (minDate) {
      matchers.push({ before: minDate });
    }
    if (maxDate) {
      matchers.push({ after: maxDate });
    }
    return matchers.length > 0 ? matchers : undefined;
  }, [minDate, maxDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className,
          )}
          disabled={disabled}
          aria-label={ariaLabel || (date ? `Selected date: ${format(date, 'PPP')}` : placeholder)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          {date ? (
            <>
              <span className="flex-1">{format(date, 'PPP')}</span>
              {showClear && !disabled && (
                <X
                  className="ml-2 h-4 w-4 opacity-50 hover:opacity-100"
                  onClick={handleClear}
                  aria-label="Clear date"
                />
              )}
            </>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onSelect?.(selectedDate);
            setOpen(false);
          }}
          disabled={disabledDays}
          initialFocus
          captionLayout="dropdown"
          className="rounded-md border shadow-sm"
        />
      </PopoverContent>
    </Popover>
  );
}
