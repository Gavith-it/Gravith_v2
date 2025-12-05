'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchJson } from '../utils/fetch';

import type { WorkProgressEntry } from '@/types/entities';

interface WorkProgressContextType {
  entries: WorkProgressEntry[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addEntry: (entry: WorkProgressInput) => Promise<WorkProgressEntry | null>;
  updateEntry: (id: string, entry: Partial<WorkProgressInput>) => Promise<WorkProgressEntry | null>;
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
  const payload = (await fetchJson<{
    entries?: WorkProgressEntry[];
    error?: string;
  }>('/api/work-progress').catch(() => ({}))) as {
    entries?: WorkProgressEntry[];
    error?: string;
  };

  if (payload.error) {
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
      // Optimistically update the cache IMMEDIATELY - update the entry in UI right away
      // This provides instant UI feedback before the API call completes
      const existingEntry = entries.find((e) => e.id === id);

      // Create optimistic update by merging existing entry with updates
      // Convert null values to undefined for fields that don't accept null in WorkProgressEntry
      const optimisticEntry: WorkProgressEntry | undefined = existingEntry
        ? {
            ...existingEntry,
            siteId: entry.siteId !== undefined ? entry.siteId : existingEntry.siteId,
            siteName: entry.siteName ?? existingEntry.siteName,
            workType: entry.workType ?? existingEntry.workType,
            description:
              entry.description !== undefined
                ? entry.description === null
                  ? undefined
                  : entry.description
                : existingEntry.description,
            workDate: entry.workDate ?? existingEntry.workDate,
            unit: entry.unit ?? existingEntry.unit,
            length: entry.length !== undefined ? entry.length : existingEntry.length,
            breadth: entry.breadth !== undefined ? entry.breadth : existingEntry.breadth,
            thickness: entry.thickness !== undefined ? entry.thickness : existingEntry.thickness,
            totalQuantity: entry.totalQuantity ?? existingEntry.totalQuantity,
            laborHours:
              entry.laborHours !== undefined ? (entry.laborHours ?? 0) : existingEntry.laborHours,
            progressPercentage:
              entry.progressPercentage !== undefined
                ? (entry.progressPercentage ?? 0)
                : existingEntry.progressPercentage,
            status: entry.status ?? existingEntry.status,
            notes: entry.notes !== undefined ? entry.notes : existingEntry.notes,
            photos: entry.photos ?? existingEntry.photos,
            materials: entry.materials
              ? entry.materials.map((m) => ({
                  id: '',
                  workProgressId: id,
                  materialId: m.materialId ?? null,
                  purchaseId: m.purchaseId ?? null,
                  materialName: m.materialName,
                  unit: m.unit,
                  quantity: m.quantity,
                  balanceQuantity: m.balanceQuantity ?? null,
                  organizationId: existingEntry.organizationId,
                  createdAt: '',
                  updatedAt: '',
                }))
              : existingEntry.materials,
          }
        : undefined;

      // Update cache optimistically for INSTANT UI update
      if (optimisticEntry) {
        setEntries((prev) =>
          prev.map((existing) => (existing.id === id ? optimisticEntry : existing)),
        );
      }

      // Perform the actual update in the background
      try {
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
          // Rollback optimistic update on error
          if (existingEntry) {
            setEntries((prev) => prev.map((e) => (e.id === id ? existingEntry : e)));
          }
          throw new Error(payload.error || 'Failed to update work progress entry.');
        }

        // Update with server response (more accurate than optimistic update)
        setEntries((prev) =>
          prev.map((existing) => (existing.id === id ? payload.entry! : existing)),
        );

        return payload.entry ?? null;
      } catch (error) {
        // Error already handled above with rollback
        throw error;
      }
    },
    [entries],
  );

  const deleteEntry = useCallback(
    async (id: string): Promise<boolean> => {
      // Optimistically update the cache IMMEDIATELY - remove the deleted entry from UI right away
      // This provides instant UI feedback before the API call completes
      const target = entries.find((entry) => entry.id === id);

      // Update cache optimistically for INSTANT UI update
      setEntries((prev) => prev.filter((entry) => entry.id !== id));

      // Perform the actual deletion in the background
      try {
        const response = await fetch(`/api/work-progress/${id}`, { method: 'DELETE' });
        const payload = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        };

        if (!response.ok || !payload.success) {
          // Rollback optimistic update on error
          if (target) {
            setEntries((prev) => {
              // Restore the entry to its original position (sorted by work date)
              const restored = [...prev, target].sort((a, b) => {
                if (a.workDate && b.workDate) {
                  return new Date(b.workDate).getTime() - new Date(a.workDate).getTime();
                }
                return 0;
              });
              return restored;
            });
          }
          throw new Error(payload.error || 'Failed to delete work progress entry.');
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
    [entries],
  );

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
