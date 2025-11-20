'use client';

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { Payment } from '@/types';
import { fetchJson } from '../utils/fetch';

interface PaymentsContextType {
  payments: Payment[];
  isLoading: boolean;
  refresh: (page?: number, limit?: number) => Promise<void>;
  addPayment: (payment: PaymentPayload) => Promise<Payment | null>;
  updatePayment: (id: string, updates: PaymentUpdatePayload) => Promise<Payment | null>;
  deletePayment: (id: string) => Promise<boolean>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type PaymentPayload = {
  clientName: string;
  amount: number;
  status?: Payment['status'];
  dueDate?: string;
  paidDate?: string;
  siteId?: string | null;
  siteName?: string | null;
};

type PaymentUpdatePayload = Partial<PaymentPayload>;

const PaymentsContext = createContext<PaymentsContextType | undefined>(undefined);

async function fetchPayments(page = 1, limit = 50): Promise<{
  payments: Payment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const payload = (await fetchJson<{
    payments?: Payment[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    error?: string;
  }>(`/api/payments?page=${page}&limit=${limit}`).catch(() => ({}))) as {
    payments?: Payment[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    error?: string;
  };

  if (payload.error) {
    throw new Error(payload.error || 'Failed to load payments.');
  }

  return {
    payments: payload.payments ?? [],
    pagination: payload.pagination,
  };
}

export function PaymentsProvider({ children }: { children: ReactNode }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | undefined>(undefined);

  const refresh = useCallback(async (page = 1, limit = 50) => {
    try {
      setIsLoading(true);
      const result = await fetchPayments(page, limit);
      setPayments(result.payments);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error loading payments', error);
      setPayments([]);
      toast.error('Failed to load payments.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addPayment = useCallback(async (payment: PaymentPayload): Promise<Payment | null> => {
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      payment?: Payment;
      error?: string;
    };

    if (!response.ok || !payload.payment) {
      throw new Error(payload.error || 'Failed to create payment.');
    }

    setPayments((prev) => [payload.payment!, ...prev]);
    return payload.payment ?? null;
  }, []);

  const updatePayment = useCallback(
    async (id: string, updates: PaymentUpdatePayload): Promise<Payment | null> => {
      const response = await fetch(`/api/payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        payment?: Payment;
        error?: string;
      };

      if (!response.ok || !payload.payment) {
        throw new Error(payload.error || 'Failed to update payment.');
      }

      setPayments((prev) =>
        prev.map((payment) => (payment.id === id ? payload.payment! : payment)),
      );

      return payload.payment ?? null;
    },
    [],
  );

  const deletePayment = useCallback(async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/payments/${id}`, {
      method: 'DELETE',
    });

    const payload = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || payload.success !== true) {
      throw new Error(payload.error || 'Failed to delete payment.');
    }

    setPayments((prev) => prev.filter((payment) => payment.id !== id));
    return true;
  }, []);

  const value = useMemo<PaymentsContextType>(
    () => ({
      payments,
      isLoading,
      refresh,
      addPayment,
      updatePayment,
      deletePayment,
      pagination,
    }),
    [payments, isLoading, refresh, addPayment, updatePayment, deletePayment, pagination],
  );

  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
}

export function usePayments() {
  const ctx = useContext(PaymentsContext);
  if (!ctx) {
    throw new Error('usePayments must be used within a PaymentsProvider');
  }
  return ctx;
}

