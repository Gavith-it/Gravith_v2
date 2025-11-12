'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

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
  const response = await fetch('/api/purchases', { cache: 'no-store' });
  const payload = (await response.json().catch(() => ({}))) as {
    purchases?: SharedMaterial[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || 'Failed to load purchases.');
  }

  return payload.purchases ?? [];
}

export function MaterialsProvider({ children }: { children: ReactNode }) {
  const [materials, setMaterials] = useState<SharedMaterial[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const purchases = await fetchPurchases();
      setMaterials(purchases);
    } catch (error) {
      console.error('Error loading purchases', error);
      setMaterials([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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

      setMaterials((prev) => [payload.purchase!, ...prev]);
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

  const deleteMaterial = useCallback(async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/purchases/${id}`, {
      method: 'DELETE',
    });

    const payload = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || !payload.success) {
      throw new Error(payload.error || 'Failed to delete purchase.');
    }

    setMaterials((prev) => prev.filter((material) => material.id !== id));
    return true;
  }, []);

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
