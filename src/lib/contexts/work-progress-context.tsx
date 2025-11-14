'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { WorkProgressEntry } from '@/types/entities';

interface WorkProgressContextType {
  entries: WorkProgressEntry[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addEntry: (
    entry: WorkProgressInput,
  ) => Promise<WorkProgressEntry | null>;
  updateEntry: (
    id: string,
    entry: Partial<WorkProgressInput>,
  ) => Promise<WorkProgressEntry | null>;
  deleteEntry: (id: string) => Promise<boolean>;
}

const WorkProgressContext = createContext<WorkProgressContextType | undefined>(undefined);

interface WorkProgressInput {
  siteId?: string | null;
  siteName: string;
  workType: string;
  description?: string | null;
  workDate: string;
  unit: string;
  length?: number | null;
  breadth?: number | null;
  thickness?: number | null;
  totalQuantity: number;
  laborHours?: number | null;
  progressPercentage?: number | null;
  status: WorkProgressEntry['status'];
  notes?: string | null;
  photos?: string[];
  materials?: Array<{
    materialId?: string | null;
    purchaseId?: string | null;
    materialName: string;
    unit: string;
    quantity: number;
    balanceQuantity?: number | null;
  }>;
}

async function fetchEntries(): Promise<WorkProgressEntry[]> {
  const response = await fetch('/api/work-progress', { cache: 'no-store' });
  const payload = (await response.json().catch(() => ({}))) as {
    entries?: WorkProgressEntry[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to load work progress entries.');
  }

  return payload.entries ?? [];
}

export function WorkProgressProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<WorkProgressEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await fetchEntries();
      setEntries(result);
    } catch (error) {
      console.error('Error loading work progress entries', error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addEntry = useCallback(
    async (entry: WorkProgressInput): Promise<WorkProgressEntry | null> => {
      const response = await fetch('/api/work-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        entry?: WorkProgressEntry;
        error?: string;
      };

      if (!response.ok || !payload.entry) {
        throw new Error(payload.error || 'Failed to create work progress entry.');
      }

      setEntries((prev) => [payload.entry!, ...prev]);
      return payload.entry ?? null;
    },
    [],
  );

  const updateEntry = useCallback(
    async (id: string, entry: Partial<WorkProgressInput>): Promise<WorkProgressEntry | null> => {
      const response = await fetch(`/api/work-progress/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        entry?: WorkProgressEntry;
        error?: string;
      };

      if (!response.ok || !payload.entry) {
        throw new Error(payload.error || 'Failed to update work progress entry.');
      }

      setEntries((prev) =>
        prev.map((existing) => (existing.id === id ? payload.entry! : existing)),
      );

      return payload.entry ?? null;
    },
    [],
  );

  const deleteEntry = useCallback(async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/work-progress/${id}`, { method: 'DELETE' });
    const payload = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || !payload.success) {
      throw new Error(payload.error || 'Failed to delete work progress entry.');
    }

    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    return true;
  }, []);

  const value = useMemo<WorkProgressContextType>(
    () => ({
      entries,
      isLoading,
      refresh,
      addEntry,
      updateEntry,
      deleteEntry,
    }),
    [entries, isLoading, refresh, addEntry, updateEntry, deleteEntry],
  );

  return <WorkProgressContext.Provider value={value}>{children}</WorkProgressContext.Provider>;
}

export function useWorkProgress() {
  const context = useContext(WorkProgressContext);
  if (context === undefined) {
    throw new Error('useWorkProgress must be used within a WorkProgressProvider');
  }
  return context;
}

