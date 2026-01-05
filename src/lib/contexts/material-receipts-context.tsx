'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { fetchJson } from '../utils/fetch';

import type { MaterialReceipt } from '@/types';

interface MaterialReceiptsContextType {
  receipts: MaterialReceipt[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addReceipt: (
    receipt: Omit<MaterialReceipt, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>,
  ) => Promise<MaterialReceipt | null>;
  addReceipts: (
    receipts: Array<Omit<MaterialReceipt, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>>,
  ) => Promise<MaterialReceipt[]>;
  updateReceipt: (id: string, updates: Partial<MaterialReceipt>) => Promise<MaterialReceipt | null>;
  deleteReceipt: (id: string) => Promise<boolean>;
  linkReceiptToPurchase: (receiptId: string, purchaseId: string) => Promise<boolean>;
  unlinkReceipt: (receiptId: string) => Promise<boolean>;
  getUnlinkedReceipts: () => MaterialReceipt[];
  getReceiptById: (id: string) => MaterialReceipt | undefined;
}

const MaterialReceiptsContext = createContext<MaterialReceiptsContextType | undefined>(undefined);

async function fetchReceipts(): Promise<MaterialReceipt[]> {
  const payload = (await fetchJson<{
    receipts?: MaterialReceipt[];
    error?: string;
  }>('/api/receipts').catch(() => ({}))) as {
    receipts?: MaterialReceipt[];
    error?: string;
  };

  if (payload.error) {
    throw new Error(payload.error || 'Failed to load receipts.');
  }

  return payload.receipts ?? [];
}

export function MaterialReceiptsProvider({ children }: { children: ReactNode }) {
  const [receipts, setReceipts] = useState<MaterialReceipt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Use ref to prevent duplicate calls in React Strict Mode
  const hasInitialized = React.useRef(false);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await fetchReceipts();
      setReceipts(result);
    } catch (error) {
      console.error('Error loading material receipts', error);
      setReceipts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only initialize once, even in React Strict Mode
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      void refresh();
    }
  }, [refresh]);

  const addReceipt = useCallback(
    async (
      receipt: Omit<MaterialReceipt, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>,
    ): Promise<MaterialReceipt | null> => {
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receipt),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        receipt?: MaterialReceipt;
        error?: string;
      };

      if (!response.ok || !payload.receipt) {
        throw new Error(payload.error || 'Failed to create receipt.');
      }

      setReceipts((prev) => [payload.receipt!, ...prev]);
      return payload.receipt ?? null;
    },
    [],
  );

  const addReceipts = useCallback(
    async (
      receiptsData: Array<
        Omit<MaterialReceipt, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>
      >,
    ): Promise<MaterialReceipt[]> => {
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipts: receiptsData }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        receipts?: MaterialReceipt[];
        error?: string;
      };

      if (!response.ok || !payload.receipts || payload.receipts.length === 0) {
        throw new Error(payload.error || 'Failed to create receipts.');
      }

      setReceipts((prev) => [...payload.receipts!, ...prev]);
      return payload.receipts;
    },
    [],
  );

  const updateReceipt = useCallback(
    async (id: string, updates: Partial<MaterialReceipt>): Promise<MaterialReceipt | null> => {
      const response = await fetch(`/api/receipts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        receipt?: MaterialReceipt;
        error?: string;
      };

      if (!response.ok || !payload.receipt) {
        throw new Error(payload.error || 'Failed to update receipt.');
      }

      setReceipts((prev) =>
        prev.map((receipt) => (receipt.id === id ? payload.receipt! : receipt)),
      );

      return payload.receipt ?? null;
    },
    [],
  );

  const deleteReceipt = useCallback(async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
    const payload = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || !payload.success) {
      throw new Error(payload.error || 'Failed to delete receipt.');
    }

    setReceipts((prev) => prev.filter((receipt) => receipt.id !== id));
    return true;
  }, []);

  const linkReceiptToPurchase = useCallback(
    async (receiptId: string, purchaseId: string): Promise<boolean> => {
      const receipt = receipts.find((r) => r.id === receiptId);

      if (!receipt) {
        toast.error('Receipt not found.');
        return false;
      }

      if (receipt.linkedPurchaseId) {
        toast.error('This receipt is already linked to a purchase.');
        return false;
      }

      try {
        await updateReceipt(receiptId, { linkedPurchaseId: purchaseId });
        return true;
      } catch (error) {
        console.error('Error linking receipt to purchase', error);
        toast.error(error instanceof Error ? error.message : 'Failed to link receipt to purchase.');
        return false;
      }
    },
    [receipts, updateReceipt],
  );

  const unlinkReceipt = useCallback(
    async (receiptId: string): Promise<boolean> => {
      const receipt = receipts.find((r) => r.id === receiptId);

      if (!receipt) {
        toast.error('Receipt not found.');
        return false;
      }

      if (!receipt.linkedPurchaseId) {
        return true;
      }

      try {
        await updateReceipt(receiptId, { linkedPurchaseId: null });
        return true;
      } catch (error) {
        console.error('Error unlinking receipt', error);
        toast.error(error instanceof Error ? error.message : 'Failed to unlink receipt.');
        return false;
      }
    },
    [receipts, updateReceipt],
  );

  const getUnlinkedReceipts = useCallback(() => {
    return receipts.filter((receipt) => !receipt.linkedPurchaseId);
  }, [receipts]);

  const getReceiptById = useCallback(
    (id: string) => receipts.find((receipt) => receipt.id === id),
    [receipts],
  );

  const value = useMemo<MaterialReceiptsContextType>(
    () => ({
      receipts,
      isLoading,
      refresh,
      addReceipt,
      addReceipts,
      updateReceipt,
      deleteReceipt,
      linkReceiptToPurchase,
      unlinkReceipt,
      getUnlinkedReceipts,
      getReceiptById,
    }),
    [
      receipts,
      isLoading,
      refresh,
      addReceipt,
      addReceipts,
      updateReceipt,
      deleteReceipt,
      linkReceiptToPurchase,
      unlinkReceipt,
      getUnlinkedReceipts,
      getReceiptById,
    ],
  );

  return (
    <MaterialReceiptsContext.Provider value={value}>{children}</MaterialReceiptsContext.Provider>
  );
}

export function useMaterialReceipts() {
  const context = useContext(MaterialReceiptsContext);
  if (context === undefined) {
    throw new Error('useMaterialReceipts must be used within a MaterialReceiptsProvider');
  }
  return context;
}
