'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { toast } from 'sonner';

import type { MaterialReceipt } from '@/types';

interface MaterialReceiptsContextType {
  receipts: MaterialReceipt[];
  addReceipt: (receipt: Omit<MaterialReceipt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateReceipt: (id: string, receipt: Partial<MaterialReceipt>) => void;
  deleteReceipt: (id: string) => void;
  linkReceiptToPurchase: (receiptId: string, purchaseId: string) => boolean;
  unlinkReceipt: (receiptId: string) => void;
  getUnlinkedReceipts: () => MaterialReceipt[];
  getReceiptById: (id: string) => MaterialReceipt | undefined;
}

const MaterialReceiptsContext = createContext<MaterialReceiptsContextType | undefined>(undefined);

// Mock initial data
const initialReceipts: MaterialReceipt[] = [
  {
    id: '1',
    date: '2024-10-15',
    vehicleNumber: 'KA-01-AB-1234',
    materialId: '1',
    materialName: 'Ordinary Portland Cement (OPC 53)',
    filledWeight: 5500,
    emptyWeight: 50,
    netWeight: 5450,
    vendorId: '2',
    vendorName: 'Tata Steel Limited',
    linkedPurchaseId: '1',
    organizationId: 'org-1',
    createdAt: '2024-10-15T10:30:00Z',
    updatedAt: '2024-10-15T10:30:00Z',
  },
  {
    id: '2',
    date: '2024-10-16',
    vehicleNumber: 'KA-02-CD-5678',
    materialId: '2',
    materialName: 'TMT Steel Bars 12mm',
    filledWeight: 3050,
    emptyWeight: 50,
    netWeight: 3000,
    vendorId: '2',
    vendorName: 'Tata Steel Limited',
    organizationId: 'org-1',
    createdAt: '2024-10-16T09:15:00Z',
    updatedAt: '2024-10-16T09:15:00Z',
  },
  {
    id: '3',
    date: '2024-10-17',
    vehicleNumber: 'KA-03-EF-9012',
    materialId: '5',
    materialName: 'River Sand (Fine)',
    filledWeight: 8200,
    emptyWeight: 200,
    netWeight: 8000,
    vendorId: '4',
    vendorName: 'City Transport Services',
    organizationId: 'org-1',
    createdAt: '2024-10-17T11:45:00Z',
    updatedAt: '2024-10-17T11:45:00Z',
  },
];

export function MaterialReceiptsProvider({ children }: { children: ReactNode }) {
  const [receipts, setReceipts] = useState<MaterialReceipt[]>(initialReceipts);

  const addReceipt = useCallback(
    (receipt: Omit<MaterialReceipt, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      setReceipts((prev) => {
        const newReceipt: MaterialReceipt = {
          ...receipt,
          id: (prev.length + 1).toString(),
          createdAt: now,
          updatedAt: now,
        };
        return [...prev, newReceipt];
      });
    },
    [],
  );

  const updateReceipt = useCallback((id: string, updates: Partial<MaterialReceipt>) => {
    setReceipts((prev) =>
      prev.map((receipt) =>
        receipt.id === id
          ? { ...receipt, ...updates, updatedAt: new Date().toISOString() }
          : receipt,
      ),
    );
  }, []);

  const deleteReceipt = useCallback((id: string) => {
    setReceipts((prev) => prev.filter((receipt) => receipt.id !== id));
  }, []);

  const linkReceiptToPurchase = useCallback((receiptId: string, purchaseId: string): boolean => {
    let foundReceipt: MaterialReceipt | undefined;

    setReceipts((prev) => {
      foundReceipt = prev.find((r) => r.id === receiptId);

      if (!foundReceipt) {
        toast.error('Receipt not found');
        return prev;
      }

      if (foundReceipt.linkedPurchaseId) {
        toast.error('This receipt is already linked to a purchase');
        return prev;
      }

      return prev.map((receipt) =>
        receipt.id === receiptId
          ? { ...receipt, linkedPurchaseId: purchaseId, updatedAt: new Date().toISOString() }
          : receipt,
      );
    });

    return !!foundReceipt && !foundReceipt.linkedPurchaseId;
  }, []);

  const unlinkReceipt = useCallback((receiptId: string) => {
    setReceipts((prev) =>
      prev.map((receipt) =>
        receipt.id === receiptId
          ? { ...receipt, linkedPurchaseId: undefined, updatedAt: new Date().toISOString() }
          : receipt,
      ),
    );
  }, []);

  const getUnlinkedReceipts = useCallback(() => {
    return receipts.filter((receipt) => !receipt.linkedPurchaseId);
  }, [receipts]);

  const getReceiptById = useCallback(
    (id: string) => {
      return receipts.find((receipt) => receipt.id === id);
    },
    [receipts],
  );

  return (
    <MaterialReceiptsContext.Provider
      value={{
        receipts,
        addReceipt,
        updateReceipt,
        deleteReceipt,
        linkReceiptToPurchase,
        unlinkReceipt,
        getUnlinkedReceipts,
        getReceiptById,
      }}
    >
      {children}
    </MaterialReceiptsContext.Provider>
  );
}

export function useMaterialReceipts() {
  const context = useContext(MaterialReceiptsContext);
  if (context === undefined) {
    throw new Error('useMaterialReceipts must be used within a MaterialReceiptsProvider');
  }
  return context;
}
