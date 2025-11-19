'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Vehicle } from '@/types/entities';
import { fetchJson } from '../utils/fetch';

interface VehiclesContextType {
  vehicles: Vehicle[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addVehicle: (vehicle: VehicleInput) => Promise<Vehicle | null>;
  updateVehicle: (id: string, updates: Partial<VehicleInput>) => Promise<Vehicle | null>;
  deleteVehicle: (id: string) => Promise<boolean>;
}

interface VehicleInput {
  vehicleNumber: string;
  name?: string | null;
  type: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  status: Vehicle['status'];
  siteId?: string | null;
  siteName?: string | null;
  operator?: string | null;
  isRental: boolean;
  vendor?: string | null;
  rentalCostPerDay?: number | null;
  rentalStartDate?: string | null;
  rentalEndDate?: string | null;
  totalRentalDays?: number | null;
  totalRentalCost?: number | null;
  fuelCapacity?: number | null;
  currentFuelLevel?: number | null;
  mileage?: number | null;
  lastMaintenanceDate?: string | null;
  nextMaintenanceDate?: string | null;
  insuranceExpiry?: string | null;
  registrationExpiry?: string | null;
}

const VehiclesContext = createContext<VehiclesContextType | undefined>(undefined);

async function fetchVehicles(): Promise<Vehicle[]> {
  const payload = (await fetchJson<{
    vehicles?: Vehicle[];
    error?: string;
  }>('/api/vehicles').catch(() => ({}))) as {
    vehicles?: Vehicle[];
    error?: string;
  };

  if (payload.error) {
    throw new Error(payload.error || 'Failed to load vehicles.');
  }

  return payload.vehicles ?? [];
}

export function VehiclesProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles', error);
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addVehicle = useCallback(async (vehicle: VehicleInput): Promise<Vehicle | null> => {
    const response = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicle),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      vehicle?: Vehicle;
      error?: string;
    };

    if (!response.ok || !payload.vehicle) {
      throw new Error(payload.error || 'Failed to create vehicle.');
    }

    setVehicles((prev) => [payload.vehicle!, ...prev]);
    return payload.vehicle ?? null;
  }, []);

  const updateVehicle = useCallback(
    async (id: string, updates: Partial<VehicleInput>): Promise<Vehicle | null> => {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        vehicle?: Vehicle;
        error?: string;
      };

      if (!response.ok || !payload.vehicle) {
        throw new Error(payload.error || 'Failed to update vehicle.');
      }

      setVehicles((prev) => prev.map((existing) => (existing.id === id ? payload.vehicle! : existing)));
      return payload.vehicle ?? null;
    },
    [],
  );

  const deleteVehicle = useCallback(async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
    const payload = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || !payload.success) {
      throw new Error(payload.error || 'Failed to delete vehicle.');
    }

    setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== id));
    return true;
  }, []);

  const value = useMemo<VehiclesContextType>(
    () => ({
      vehicles,
      isLoading,
      refresh,
      addVehicle,
      updateVehicle,
      deleteVehicle,
    }),
    [vehicles, isLoading, refresh, addVehicle, updateVehicle, deleteVehicle],
  );

  return <VehiclesContext.Provider value={value}>{children}</VehiclesContext.Provider>;
}

export function useVehicles() {
  const context = useContext(VehiclesContext);
  if (context === undefined) {
    throw new Error('useVehicles must be used within a VehiclesProvider');
  }
  return context;
}

