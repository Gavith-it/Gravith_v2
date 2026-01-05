'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { fetchJson } from '../utils/fetch';

import type { Expense } from '@/types';

interface ExpensesContextType {
  expenses: Expense[];
  isLoading: boolean;
  refresh: (page?: number, limit?: number) => Promise<void>;
  addExpense: (expense: ExpensePayload) => Promise<Expense | null>;
  updateExpense: (id: string, updates: ExpenseUpdatePayload) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<boolean>;
  pagination?: {
    page: number;
    limit: number;
    hasMore: boolean;
    // total?: number;      // Uncomment if using count query in API
    // totalPages?: number; // Uncomment if using count query in API
  };
}

type ExpensePayload = {
  description: string;
  amount: number;
  category: Expense['category'];
  subcategory?: string;
  date: string;
  vendor?: string;
  siteId?: string | null;
  siteName?: string | null;
  receipt?: string;
  status?: Expense['status'];
  approvedBy?: string;
  purchaseId?: string | null;
  materialId?: string | null;
};

type ExpenseUpdatePayload = Partial<ExpensePayload>;

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

async function fetchExpenses(
  page = 1,
  limit = 50,
): Promise<{
  expenses: Expense[];
  pagination?: {
    page: number;
    limit: number;
    hasMore: boolean;
    // total?: number;      // Uncomment if using count query in API
    // totalPages?: number; // Uncomment if using count query in API
  };
}> {
  const payload = (await fetchJson<{
    expenses?: Expense[];
    pagination?: {
      page: number;
      limit: number;
      hasMore: boolean;
      // total?: number;      // Uncomment if using count query in API
      // totalPages?: number; // Uncomment if using count query in API
    };
    error?: string;
  }>(`/api/expenses?page=${page}&limit=${limit}`).catch(() => ({}))) as {
    expenses?: Expense[];
    pagination?: {
      page: number;
      limit: number;
      hasMore: boolean;
      // total?: number;      // Uncomment if using count query in API
      // totalPages?: number; // Uncomment if using count query in API
    };
    error?: string;
  };

  if (payload.error) {
    throw new Error(payload.error || 'Failed to load expenses.');
  }

  return {
    expenses: payload.expenses ?? [],
    pagination: payload.pagination,
  };
}

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<
    | {
        page: number;
        limit: number;
        hasMore: boolean;
        // total?: number;      // Uncomment if using count query in API
        // totalPages?: number; // Uncomment if using count query in API
      }
    | undefined
  >(undefined);

  // Use ref to track current fetch to prevent duplicate calls
  const currentFetchRef = React.useRef<{
    page: number;
    limit: number;
    promise?: Promise<void>;
  } | null>(null);

  const refresh = useCallback(async (page = 1, limit = 50) => {
    // Prevent duplicate calls with same parameters - return existing promise if already fetching
    if (currentFetchRef.current?.page === page && currentFetchRef.current?.limit === limit) {
      if (currentFetchRef.current.promise) {
        return currentFetchRef.current.promise; // Return existing promise to deduplicate
      }
    }

    // Create new fetch promise
    const fetchPromise = (async () => {
      try {
        setIsLoading(true);
        const result = await fetchExpenses(page, limit);
        setExpenses(result.expenses);
        setPagination(result.pagination);
      } catch (error) {
        console.error('Error loading expenses', error);
        setExpenses([]);
        toast.error('Failed to load expenses.');
      } finally {
        setIsLoading(false);
        // Clear the promise reference after fetch completes
        if (currentFetchRef.current?.page === page && currentFetchRef.current?.limit === limit) {
          currentFetchRef.current.promise = undefined;
        }
      }
    })();

    currentFetchRef.current = { page, limit, promise: fetchPromise };
    return fetchPromise;
  }, []);

  const addExpense = useCallback(async (expense: ExpensePayload): Promise<Expense | null> => {
    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      expense?: Expense;
      error?: string;
    };

    if (!response.ok || !payload.expense) {
      throw new Error(payload.error || 'Failed to create expense.');
    }

    setExpenses((prev) => [payload.expense!, ...prev]);
    return payload.expense ?? null;
  }, []);

  const updateExpense = useCallback(
    async (id: string, updates: ExpenseUpdatePayload): Promise<Expense | null> => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        expense?: Expense;
        error?: string;
      };

      if (!response.ok || !payload.expense) {
        throw new Error(payload.error || 'Failed to update expense.');
      }

      setExpenses((prev) =>
        prev.map((expense) => (expense.id === id ? payload.expense! : expense)),
      );

      return payload.expense ?? null;
    },
    [],
  );

  const deleteExpense = useCallback(
    async (id: string): Promise<boolean> => {
      // Optimistically update the cache IMMEDIATELY - remove the deleted expense from UI right away
      // This provides instant UI feedback before the API call completes
      const target = expenses.find((expense) => expense.id === id);

      // Update cache optimistically for INSTANT UI update
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));

      // Perform the actual deletion in the background
      try {
        const response = await fetch(`/api/expenses/${id}`, {
          method: 'DELETE',
        });

        const payload = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        };

        if (!response.ok || payload.success !== true) {
          // Rollback optimistic update on error
          if (target) {
            setExpenses((prev) => {
              // Restore the expense to its original position (sorted by date)
              const restored = [...prev, target].sort((a, b) => {
                if (a.date && b.date) {
                  return new Date(b.date).getTime() - new Date(a.date).getTime();
                }
                return 0;
              });
              return restored;
            });
          }
          throw new Error(payload.error || 'Failed to delete expense.');
        }

        // Don't revalidate immediately - keep the optimistic update
        // The deletion was successful, so the optimistic update is correct
        // The next refresh will naturally fetch fresh data
        return true;
      } catch (error) {
        // Error already handled above with rollback
        throw error;
      }
    },
    [expenses],
  );

  const value = useMemo<ExpensesContextType>(
    () => ({
      expenses,
      isLoading,
      refresh,
      addExpense,
      updateExpense,
      deleteExpense,
      pagination,
    }),
    [expenses, isLoading, refresh, addExpense, updateExpense, deleteExpense, pagination],
  );

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
}

export function useExpenses() {
  const ctx = useContext(ExpensesContext);
  if (!ctx) {
    throw new Error('useExpenses must be used within an ExpensesProvider');
  }
  return ctx;
}
