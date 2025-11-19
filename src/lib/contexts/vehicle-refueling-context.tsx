'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { VehicleRefueling } from '@/types/entities';
import { fetchJson } from '../utils/fetch';

interface VehicleRefuelingContextType {
  records: VehicleRefueling[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addRecord: (record: VehicleRefuelingInput) => Promise<VehicleRefueling | null>;
  updateRecord: (
    id: string,
    updates: Partial<VehicleRefuelingInput>,
  ) => Promise<VehicleRefueling | null>;
  deleteRecord: (id: string) => Promise<boolean>;
}

interface VehicleRefuelingInput {
  vehicleId: string;
  vehicleNumber: string;
  date: string;
  fuelType: VehicleRefueling['fuelType'];
  quantity: number;
  unit: VehicleRefueling['unit'];
  cost: number;
  odometerReading: number;
  location: string;
  vendor: string;
  invoiceNumber: string;
  receiptUrl?: string | null;
  notes?: string | null;
}

const VehicleRefuelingContext = createContext<VehicleRefuelingContextType | undefined>(undefined);

async function fetchRefuelingRecords(): Promise<VehicleRefueling[]> {
  const payload = (await fetchJson<{
    records?: VehicleRefueling[];
    error?: string;
  }>('/api/vehicles/refueling').catch(() => ({}))) as {
    records?: VehicleRefueling[];
    error?: string;
  };

  if (payload.error) {
    throw new Error(payload.error || 'Failed to load refueling records.');
  }

  return payload.records ?? [];
}

export function VehicleRefuelingProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<VehicleRefueling[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchRefuelingRecords();
      setRecords(data);
    } catch (error) {
      console.error('Error loading refueling records', error);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addRecord = useCallback(
    async (record: VehicleRefuelingInput): Promise<VehicleRefueling | null> => {
      const response = await fetch('/api/vehicles/refueling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        record?: VehicleRefueling;
        error?: string;
      };

      if (!response.ok || !payload.record) {
        throw new Error(payload.error || 'Failed to create refueling record.');
      }

      setRecords((prev) => [payload.record!, ...prev]);
      return payload.record ?? null;
    },
    [],
  );

  const updateRecord = useCallback(
    async (
      id: string,
      updates: Partial<VehicleRefuelingInput>,
    ): Promise<VehicleRefueling | null> => {
      const response = await fetch(`/api/vehicles/refueling/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        record?: VehicleRefueling;
        error?: string;
      };

      if (!response.ok || !payload.record) {
        throw new Error(payload.error || 'Failed to update refueling record.');
      }

      setRecords((prev) => prev.map((existing) => (existing.id === id ? payload.record! : existing)));
      return payload.record ?? null;
    },
    [],
  );

  const deleteRecord = useCallback(async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/vehicles/refueling/${id}`, { method: 'DELETE' });
    const payload = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || !payload.success) {
      throw new Error(payload.error || 'Failed to delete refueling record.');
    }

    setRecords((prev) => prev.filter((record) => record.id !== id));
    return true;
  }, []);

  const value = useMemo(
    (): VehicleRefuelingContextType => ({
      records,
      isLoading,
      refresh,
      addRecord,
      updateRecord,
      deleteRecord,
    }),
    [records, isLoading, refresh, addRecord, updateRecord, deleteRecord],
  );

  return (
    <VehicleRefuelingContext.Provider value={value}>{children}</VehicleRefuelingContext.Provider>
  );
}

export function useVehicleRefueling() {
  const context = useContext(VehicleRefuelingContext);
  if (context === undefined) {
    throw new Error('useVehicleRefueling must be used within a VehicleRefuelingProvider');
  }
  return context;
}

