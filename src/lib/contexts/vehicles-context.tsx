'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchJson } from '../utils/fetch';

import type { Vehicle } from '@/types/entities';

interface VehiclesContextType {
  vehicles: Vehicle[];
  isLoading: boolean;
  refresh: (page?: number, limit?: number) => Promise<void>;
  addVehicle: (vehicle: VehicleInput) => Promise<Vehicle | null>;
  updateVehicle: (id: string, updates: Partial<VehicleInput>) => Promise<Vehicle | null>;
  deleteVehicle: (id: string) => Promise<boolean>;
  pagination?: {
    page: number;
    limit: number;
    hasMore: boolean;
    // total?: number;      // Uncomment if using count query in API
    // totalPages?: number; // Uncomment if using count query in API
  };
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

async function fetchVehicles(
  page = 1,
  limit = 50,
): Promise<{
  vehicles: Vehicle[];
  pagination?: {
    page: number;
    limit: number;
    hasMore: boolean;
    // total?: number;      // Uncomment if using count query in API
    // totalPages?: number; // Uncomment if using count query in API
  };
}> {
  const payload = (await fetchJson<{
    vehicles?: Vehicle[];
    pagination?: {
      page: number;
      limit: number;
      hasMore: boolean;
      // total?: number;      // Uncomment if using count query in API
      // totalPages?: number; // Uncomment if using count query in API
    };
    error?: string;
  }>(`/api/vehicles?page=${page}&limit=${limit}`).catch(() => ({}))) as {
    vehicles?: Vehicle[];
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
    throw new Error(payload.error || 'Failed to load vehicles.');
  }

  return {
    vehicles: payload.vehicles ?? [],
    pagination: payload.pagination,
  };
}

export function VehiclesProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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
        const result = await fetchVehicles(page, limit);
        setVehicles(result.vehicles);
        setPagination(result.pagination);
      } catch (error) {
        console.error('Error loading vehicles', error);
        setVehicles([]);
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

      setVehicles((prev) =>
        prev.map((existing) => (existing.id === id ? payload.vehicle! : existing)),
      );
      return payload.vehicle ?? null;
    },
    [],
  );

  const deleteVehicle = useCallback(
    async (id: string): Promise<boolean> => {
      // Store the vehicle for potential rollback
      const vehicleToDelete = vehicles.find((v) => v.id === id);
      if (!vehicleToDelete) {
        throw new Error('Vehicle not found.');
      }

      // Optimistically update the cache IMMEDIATELY - remove the deleted vehicle from UI right away
      setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== id));

      // Update pagination if it exists
      // Note: With hasMore approach, we don't update pagination on delete
      // If using count query, uncomment below:
      // if (pagination) {
      //   setPagination((prev) =>
      //     prev
      //       ? {
      //           ...prev,
      //           total: Math.max(0, prev.total - 1),
      //         }
      //       : prev,
      //   );
      // }

      try {
        const response = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
        const payload = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        };

        if (!response.ok || !payload.success) {
          // Rollback optimistic update on error
          setVehicles((prev) => {
            // Restore vehicle to its original position (sorted by created_at if available)
            const restored = [...prev, vehicleToDelete].sort((a, b) => {
              if (a.createdAt && b.createdAt) {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              }
              return 0;
            });
            return restored;
          });

          // Rollback pagination
          // Note: With hasMore approach, we don't update pagination on delete
          // If using count query, uncomment below:
          // if (pagination) {
          //   setPagination((prev) =>
          //     prev
          //       ? {
          //           ...prev,
          //           total: prev.total + 1,
          //         }
          //       : prev,
          //   );
          // }

          throw new Error(payload.error || 'Failed to delete vehicle.');
        }

        return true;
      } catch (error) {
        // Rollback optimistic update on error (if not already rolled back)
        setVehicles((prev) => {
          if (!prev.find((v) => v.id === id)) {
            // Restore vehicle to its original position (sorted by created_at if available)
            const restored = [...prev, vehicleToDelete].sort((a, b) => {
              if (a.createdAt && b.createdAt) {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              }
              return 0;
            });
            return restored;
          }
          return prev;
        });

        // Rollback pagination (if not already rolled back)
        // Note: With hasMore approach, we don't update pagination on delete
        // If using count query, uncomment below:
        // if (pagination) {
        //   setPagination((prev) =>
        //     prev
        //       ? {
        //           ...prev,
        //           total: prev.total + 1,
        //         }
        //       : prev,
        //   );
        // }

        throw error;
      }
    },
    [vehicles, pagination],
  );

  const value = useMemo<VehiclesContextType>(
    () => ({
      vehicles,
      isLoading,
      refresh,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      pagination,
    }),
    [vehicles, isLoading, refresh, addVehicle, updateVehicle, deleteVehicle, pagination],
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
