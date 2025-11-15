import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility functions for consistent formatting to prevent hydration issues
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-IN');
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  // Use a consistent format to prevent hydration mismatches
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateShort(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

export function formatIndianCurrencyShort(amount: number, decimals: number = 1): string {
  const absAmount = Math.abs(amount);

  if (absAmount >= 10_000_000) {
    return `${(amount / 10_000_000).toFixed(decimals)}Cr`;
  }

  if (absAmount >= 100_000) {
    return `${(amount / 100_000).toFixed(decimals)}L`;
  }

  if (absAmount >= 1_000) {
    return `${(amount / 1_000).toFixed(decimals)}K`;
  }

  return amount.toLocaleString('en-IN');
}
