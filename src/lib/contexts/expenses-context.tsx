'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { Expense } from '@/types';
import { fetchJson } from '../utils/fetch';

interface ExpensesContextType {
  expenses: Expense[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addExpense: (expense: ExpensePayload) => Promise<Expense | null>;
  updateExpense: (id: string, updates: ExpenseUpdatePayload) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<boolean>;
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

async function fetchExpenses(): Promise<Expense[]> {
  const payload = (await fetchJson<{
    expenses?: Expense[];
    error?: string;
  }>('/api/expenses').catch(() => ({}))) as {
    expenses?: Expense[];
    error?: string;
  };

  if (payload.error) {
    throw new Error(payload.error || 'Failed to load expenses.');
  }

  return payload.expenses ?? [];
}

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses', error);
      setExpenses([]);
      toast.error('Failed to load expenses.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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

  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
    });

    const payload = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || payload.success !== true) {
      throw new Error(payload.error || 'Failed to delete expense.');
    }

    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
    return true;
  }, []);

  const value = useMemo<ExpensesContextType>(
    () => ({
      expenses,
      isLoading,
      refresh,
      addExpense,
      updateExpense,
      deleteExpense,
    }),
    [expenses, isLoading, refresh, addExpense, updateExpense, deleteExpense],
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

