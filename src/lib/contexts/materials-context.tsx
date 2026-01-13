'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useAuth } from '../auth-context';
import { fetchJson } from '../utils/fetch';

// Shared Material interface that works for both MaterialManagement and SiteManagement
export interface SharedMaterial {
  id: string;
  materialId?: string;
  materialName: string;
  site: string;
  quantity: number;
  unit: string;
  unitRate: number;
  costPerUnit: number;
  totalAmount: number;
  vendor?: string;
  invoiceNumber?: string;
  purchaseDate?: string;
  receiptNumber?: string;
  addedBy?: string;
  filledWeight?: number;
  emptyWeight?: number;
  netWeight?: number;
  weightUnit?: string;
  // Site-specific fields
  consumedQuantity?: number;
  remainingQuantity?: number;
  category?: string;
  // Material Receipt linking
  linkedReceiptId?: string;
  // Payment fields
  paid?: number;
  balance?: number;
}

// Form data interface for adding materials
export interface MaterialFormData {
  materialId?: string;
  materialName: string;
  site: string;
  quantity: string;
  unit: string;
  unitRate: string;
  vendor: string;
  invoiceNumber: string;
  purchaseDate: Date;
  filledWeight: string;
  emptyWeight: string;
  netWeight: string;
  weightUnit: string;
  category?: string;
}

interface MaterialsContextType {
  materials: SharedMaterial[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addMaterial: (material: Omit<SharedMaterial, 'id'>) => Promise<SharedMaterial | null>;
  updateMaterial: (id: string, material: Partial<SharedMaterial>) => Promise<SharedMaterial | null>;
  deleteMaterial: (id: string) => Promise<boolean>;
  getMaterialsBySite: (siteName: string) => SharedMaterial[];
}

const MaterialsContext = createContext<MaterialsContextType | undefined>(undefined);

async function fetchPurchases(): Promise<SharedMaterial[]> {
  const payload = (await fetchJson<{
    purchases?: SharedMaterial[];
    error?: string;
  }>('/api/purchases').catch(() => ({}))) as {
    purchases?: SharedMaterial[];
    error?: string;
  };

  if (payload.error) {
    throw new Error(payload.error || 'Failed to load purchases.');
  }

  return payload.purchases ?? [];
}

export function MaterialsProvider({ children }: { children: ReactNode }) {
  const { isLoading: isAuthLoading } = useAuth();
  const [materials, setMaterials] = useState<SharedMaterial[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Use ref to prevent duplicate calls in React Strict Mode
  const hasInitialized = React.useRef(false);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const purchases = await fetchPurchases();
      setMaterials(purchases);
    } catch (error) {
      console.error('Error loading purchases', error);
      // Handle 401 errors gracefully
      if (error instanceof Error && error.message.includes('401')) {
        setMaterials([]);
      } else {
        setMaterials([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading before fetching, and only initialize once
    if (!isAuthLoading && !hasInitialized.current) {
      hasInitialized.current = true;
      void refresh();
    }
  }, [refresh, isAuthLoading]);

  const addMaterial = useCallback(
    async (material: Omit<SharedMaterial, 'id'>): Promise<SharedMaterial | null> => {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        purchase?: SharedMaterial;
        error?: string;
      };

      if (!response.ok || !payload.purchase) {
        throw new Error(payload.error || 'Failed to create purchase.');
      }

      setMaterials((prev) => {
        const withoutDuplicate = prev.filter((item) => item.id !== payload.purchase!.id);
        return [payload.purchase!, ...withoutDuplicate];
      });
      return payload.purchase ?? null;
    },
    [],
  );

  const updateMaterial = useCallback(
    async (id: string, updates: Partial<SharedMaterial>): Promise<SharedMaterial | null> => {
      const response = await fetch(`/api/purchases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        purchase?: SharedMaterial;
        error?: string;
      };

      if (!response.ok || !payload.purchase) {
        throw new Error(payload.error || 'Failed to update purchase.');
      }

      setMaterials((prev) =>
        prev.map((material) => (material.id === id ? payload.purchase! : material)),
      );

      return payload.purchase ?? null;
    },
    [],
  );

  const deleteMaterial = useCallback(
    async (id: string): Promise<boolean> => {
      // Optimistically update the cache IMMEDIATELY - remove the deleted purchase from UI right away
      // This provides instant UI feedback before the API call completes
      const target = materials.find((material) => material.id === id);

      // Update cache optimistically for INSTANT UI update
      setMaterials((prev) => prev.filter((material) => material.id !== id));

      // Perform the actual deletion in the background
      try {
        const response = await fetch(`/api/purchases/${id}`, {
          method: 'DELETE',
        });

        const payload = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        };

        if (!response.ok || !payload.success) {
          // Rollback optimistic update on error
          if (target) {
            setMaterials((prev) => {
              // Restore the purchase to its original position (sorted by purchase date)
              const restored = [...prev, target].sort((a, b) => {
                if (a.purchaseDate && b.purchaseDate) {
                  return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
                }
                return 0;
              });
              return restored;
            });
          }
          throw new Error(payload.error || 'Failed to delete purchase.');
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
    [materials],
  );

  const getMaterialsBySite = useCallback(
    (siteName: string) => materials.filter((material) => material.site === siteName),
    [materials],
  );

  return (
    <MaterialsContext.Provider
      value={{
        materials,
        isLoading,
        refresh,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        getMaterialsBySite,
      }}
    >
      {children}
    </MaterialsContext.Provider>
  );
}

export function useMaterials() {
  const context = useContext(MaterialsContext);
  if (context === undefined) {
    throw new Error('useMaterials must be used within a MaterialsProvider');
  }
  return context;
}
