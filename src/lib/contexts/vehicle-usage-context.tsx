'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { VehicleUsage } from '@/types/entities';
import { fetchJson } from '../utils/fetch';

interface VehicleUsageContextType {
  records: VehicleUsage[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addRecord: (record: VehicleUsageInput) => Promise<VehicleUsage | null>;
  updateRecord: (
    id: string,
    updates: Partial<VehicleUsageInput>,
  ) => Promise<VehicleUsage | null>;
  deleteRecord: (id: string) => Promise<boolean>;
}

interface VehicleUsageInput {
  vehicleId: string;
  vehicleNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  startOdometer: number;
  endOdometer: number;
  totalDistance: number;
  workDescription: string;
  workCategory: VehicleUsage['workCategory'];
  siteId: string;
  siteName: string;
  operator: string;
  fuelConsumed: number;
  isRental: boolean;
  rentalCost?: number | null;
  vendor?: string | null;
  status: VehicleUsage['status'];
  notes?: string | null;
}

const VehicleUsageContext = createContext<VehicleUsageContextType | undefined>(undefined);

async function fetchUsageRecords(): Promise<VehicleUsage[]> {
  const payload = (await fetchJson<{
    records?: VehicleUsage[];
    error?: string;
  }>('/api/vehicles/usage').catch(() => ({}))) as {
    records?: VehicleUsage[];
    error?: string;
  };

  if (payload.error) {
    throw new Error(payload.error || 'Failed to load usage records.');
  }

  return payload.records ?? [];
}

export function VehicleUsageProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<VehicleUsage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchUsageRecords();
      setRecords(data);
    } catch (error) {
      console.error('Error loading usage records', error);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addRecord = useCallback(async (record: VehicleUsageInput): Promise<VehicleUsage | null> => {
    const response = await fetch('/api/vehicles/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      record?: VehicleUsage;
      error?: string;
    };

    if (!response.ok || !payload.record) {
      throw new Error(payload.error || 'Failed to create usage record.');
    }

    setRecords((prev) => [payload.record!, ...prev]);
    return payload.record ?? null;
  }, []);

  const updateRecord = useCallback(
    async (id: string, updates: Partial<VehicleUsageInput>): Promise<VehicleUsage | null> => {
      const response = await fetch(`/api/vehicles/usage/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        record?: VehicleUsage;
        error?: string;
      };

      if (!response.ok || !payload.record) {
        throw new Error(payload.error || 'Failed to update usage record.');
      }

      setRecords((prev) => prev.map((existing) => (existing.id === id ? payload.record! : existing)));
      return payload.record ?? null;
    },
    [],
  );

  const deleteRecord = useCallback(async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/vehicles/usage/${id}`, { method: 'DELETE' });
    const payload = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || !payload.success) {
      throw new Error(payload.error || 'Failed to delete usage record.');
    }

    setRecords((prev) => prev.filter((record) => record.id !== id));
    return true;
  }, []);

  const value = useMemo(
    (): VehicleUsageContextType => ({
      records,
      isLoading,
      refresh,
      addRecord,
      updateRecord,
      deleteRecord,
    }),
    [records, isLoading, refresh, addRecord, updateRecord, deleteRecord],
  );

  return <VehicleUsageContext.Provider value={value}>{children}</VehicleUsageContext.Provider>;
}

export function useVehicleUsage() {
  const context = useContext(VehicleUsageContext);
  if (context === undefined) {
    throw new Error('useVehicleUsage must be used within a VehicleUsageProvider');
  }
  return context;
}

