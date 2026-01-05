'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { fetchJson } from '../utils/fetch';

import type { Vendor } from '@/types';

interface VendorsContextType {
  vendors: Vendor[];
  isLoading: boolean;
  refresh: (page?: number, limit?: number) => Promise<void>;
  addVendor: (vendor: VendorPayload) => Promise<Vendor | null>;
  updateVendor: (id: string, updates: VendorUpdatePayload) => Promise<Vendor | null>;
  deleteVendor: (id: string) => Promise<boolean>;
  toggleVendorStatus: (id: string, status: Vendor['status']) => Promise<Vendor | null>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const VendorsContext = createContext<VendorsContextType | undefined>(undefined);

type VendorPayload = {
  name: string;
  category: Vendor['category'];
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  gstNumber?: string;
  panNumber?: string;
  bankAccount?: string;
  ifscCode?: string;
  paymentTerms?: string;
  notes?: string;
  status?: Vendor['status'];
  registrationDate?: string;
  lastPayment?: string;
  totalPaid?: number;
  pendingAmount?: number;
  rating?: number;
};

type VendorUpdatePayload = Partial<VendorPayload>;

async function fetchVendors(
  page = 1,
  limit = 50,
): Promise<{
  vendors: Vendor[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const payload = (await fetchJson<{
    vendors?: Vendor[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    error?: string;
  }>(`/api/vendors?page=${page}&limit=${limit}`).catch(() => ({}))) as {
    vendors?: Vendor[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    error?: string;
  };

  if (payload.error) {
    throw new Error(payload.error || 'Failed to load vendors.');
  }

  return {
    vendors: payload.vendors ?? [],
    pagination: payload.pagination,
  };
}

export function VendorsProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<
    | {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }
    | undefined
  >(undefined);

  // Use ref to prevent duplicate calls in React Strict Mode
  const hasInitialized = React.useRef(false);

  const refresh = useCallback(async (page = 1, limit = 50) => {
    try {
      setIsLoading(true);
      const result = await fetchVendors(page, limit);
      setVendors(result.vendors);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error loading vendors', error);
      setVendors([]);
      toast.error('Failed to load vendors.');
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

  const addVendor = useCallback(async (vendor: VendorPayload): Promise<Vendor | null> => {
    const response = await fetch('/api/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vendor),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      vendor?: Vendor;
      error?: string;
    };

    if (!response.ok || !payload.vendor) {
      throw new Error(payload.error || 'Failed to create vendor.');
    }

    setVendors((prev) => [payload.vendor!, ...prev]);
    return payload.vendor ?? null;
  }, []);

  const updateVendor = useCallback(
    async (id: string, updates: VendorUpdatePayload): Promise<Vendor | null> => {
      const response = await fetch(`/api/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        vendor?: Vendor;
        error?: string;
      };

      if (!response.ok || !payload.vendor) {
        throw new Error(payload.error || 'Failed to update vendor.');
      }

      setVendors((prev) => prev.map((vendor) => (vendor.id === id ? payload.vendor! : vendor)));

      return payload.vendor ?? null;
    },
    [],
  );

  const deleteVendor = useCallback(async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/vendors/${id}`, {
      method: 'DELETE',
    });

    const payload = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || payload.success !== true) {
      throw new Error(payload.error || 'Failed to delete vendor.');
    }

    setVendors((prev) => prev.filter((vendor) => vendor.id !== id));
    return true;
  }, []);

  const toggleVendorStatus = useCallback(
    async (id: string, status: Vendor['status']): Promise<Vendor | null> => {
      return updateVendor(id, { status });
    },
    [updateVendor],
  );

  const value = useMemo<VendorsContextType>(
    () => ({
      vendors,
      isLoading,
      refresh,
      addVendor,
      updateVendor,
      deleteVendor,
      toggleVendorStatus,
      pagination,
    }),
    [
      vendors,
      isLoading,
      refresh,
      addVendor,
      updateVendor,
      deleteVendor,
      toggleVendorStatus,
      pagination,
    ],
  );

  return <VendorsContext.Provider value={value}>{children}</VendorsContext.Provider>;
}

export function useVendors() {
  const ctx = useContext(VendorsContext);
  if (!ctx) {
    throw new Error('useVendors must be used within a VendorsProvider');
  }
  return ctx;
}
