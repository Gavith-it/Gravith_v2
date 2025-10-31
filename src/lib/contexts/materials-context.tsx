'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useState } from 'react';

// Shared Material interface that works for both MaterialManagement and SiteManagement
export interface SharedMaterial {
  id: string;
  materialName: string;
  site: string;
  quantity: number;
  unit: string;
  unitRate: number;
  costPerUnit: number;
  totalAmount: number;
  vendor: string;
  invoiceNumber: string;
  purchaseDate: string;
  addedBy: string;
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
  addMaterial: (material: Omit<SharedMaterial, 'id'>) => void;
  updateMaterial: (id: string, material: Partial<SharedMaterial>) => void;
  deleteMaterial: (id: string) => void;
  getMaterialsBySite: (siteId: string) => SharedMaterial[];
}

const MaterialsContext = createContext<MaterialsContextType | undefined>(undefined);

// Mock initial data that combines both use cases
const initialMaterials: SharedMaterial[] = [
  {
    id: '1',
    materialName: 'Ordinary Portland Cement (OPC 53)',
    site: 'Rajiv Nagar Residential Complex',
    quantity: 100,
    unit: 'bags',
    unitRate: 350,
    costPerUnit: 350,
    totalAmount: 35000,
    vendor: 'UltraTech Cement Ltd',
    invoiceNumber: 'UTC-2024-001',
    purchaseDate: '2024-01-15',
    addedBy: 'Amit Kumar',
    filledWeight: 5500,
    emptyWeight: 50,
    netWeight: 5450,
    weightUnit: 'kg',
    consumedQuantity: 65,
    remainingQuantity: 35,
    category: 'Cement',
  },
  {
    id: '2',
    materialName: 'TMT Steel Bars (12mm)',
    site: 'Green Valley Commercial Center',
    quantity: 50,
    unit: 'nos',
    unitRate: 850,
    costPerUnit: 850,
    totalAmount: 42500,
    vendor: 'JSW Steel',
    invoiceNumber: 'JSW-2024-002',
    purchaseDate: '2024-01-16',
    addedBy: 'Priya Sharma',
    filledWeight: 3000,
    emptyWeight: 0,
    netWeight: 3000,
    weightUnit: 'kg',
    consumedQuantity: 32,
    remainingQuantity: 18,
    category: 'Steel',
  },
  {
    id: '3',
    materialName: 'Ready Mix Concrete (M25)',
    site: 'Sunshine Apartments Phase II',
    quantity: 25,
    unit: 'cum',
    unitRate: 4500,
    costPerUnit: 4500,
    totalAmount: 112500,
    vendor: 'ACC Concrete',
    invoiceNumber: 'ACC-2024-003',
    purchaseDate: '2024-01-17',
    addedBy: 'Rahul Patel',
    consumedQuantity: 15,
    remainingQuantity: 10,
    category: 'Concrete',
  },
];

export function MaterialsProvider({ children }: { children: ReactNode }) {
  const [materials, setMaterials] = useState<SharedMaterial[]>(initialMaterials);

  const addMaterial = useCallback((material: Omit<SharedMaterial, 'id'>) => {
    setMaterials((prev) => {
      const newMaterial: SharedMaterial = {
        ...material,
        id: (prev.length + 1).toString(),
      };
      return [...prev, newMaterial];
    });
  }, []);

  const updateMaterial = useCallback((id: string, updates: Partial<SharedMaterial>) => {
    setMaterials((prev) =>
      prev.map((material) => (material.id === id ? { ...material, ...updates } : material)),
    );
  }, []);

  const deleteMaterial = useCallback((id: string) => {
    setMaterials((prev) => prev.filter((material) => material.id !== id));
  }, []);

  const getMaterialsBySite = useCallback(
    (siteName: string) => {
      return materials.filter((material) => material.site === siteName);
    },
    [materials],
  );

  return (
    <MaterialsContext.Provider
      value={{
        materials,
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
