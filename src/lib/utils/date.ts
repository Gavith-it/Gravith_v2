import { format } from 'date-fns';

/**
 * Formats a Date object into a yyyy-MM-dd string based on the user's local timezone.
 * Using date-fns ensures we don't accidentally shift the day like toISOString does.
 */
export function formatDateOnly(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatOptionalDateOnly(date?: Date | null): string | undefined {
  return date ? formatDateOnly(date) : undefined;
}

/**
 * Parses a yyyy-MM-dd string into a Date object at local midnight.
 * Returns undefined when the string is invalid or empty.
 */
export function parseDateOnly(value?: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  const parts = value.split('-').map((part) => Number(part));
  if (parts.length !== 3) {
    return undefined;
  }

  const [year, month, day] = parts;
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return undefined;
  }

  return new Date(year, month - 1, day);
}

export function parseDateOnlyOrNull(value?: string | null): Date | null {
  return parseDateOnly(value) ?? null;
}

