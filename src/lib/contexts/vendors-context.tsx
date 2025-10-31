'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useCallback, useState } from 'react';

import type { Vendor } from '@/types';

// Use original mock data from vendors.tsx
const initialVendors: Vendor[] = [
  {
    id: '1',
    name: 'Heavy Equipment Rentals',
    category: 'Equipment',
    contactPerson: 'Suresh Patil',
    phone: '+91 98765 43210',
    email: 'suresh@heavyequipment.com',
    address: 'Industrial Area, Navi Mumbai, MH 400710',
    gstNumber: '27ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    bankAccount: '1234567890',
    ifscCode: 'SBIN0001234',
    paymentTerms: '30 days',
    rating: 4.5,
    totalPaid: 2500000,
    pendingAmount: 125000,
    lastPayment: '2024-02-20',
    status: 'active',
    registrationDate: '2023-01-15',
    notes: 'Reliable equipment supplier with good maintenance record',
    organizationId: 'org-1',
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2024-02-20T00:00:00Z',
  },
  {
    id: '2',
    name: 'Tata Steel Limited',
    category: 'Materials',
    contactPerson: 'Rajesh Kumar',
    phone: '+91 98765 43211',
    email: 'rajesh@tatasteel.com',
    address: 'Steel Plant Road, Jamshedpur, JH 831001',
    gstNumber: '20AABCT1332L1ZA',
    panNumber: 'AABCT1332L',
    bankAccount: '9876543210',
    ifscCode: 'HDFC0001234',
    paymentTerms: '45 days',
    rating: 5.0,
    totalPaid: 4500000,
    pendingAmount: 325000,
    lastPayment: '2024-02-25',
    status: 'active',
    registrationDate: '2023-01-10',
    notes: 'Premium steel supplier with excellent quality standards',
    organizationId: 'org-1',
    createdAt: '2023-01-10T00:00:00Z',
    updatedAt: '2024-02-25T00:00:00Z',
  },
  {
    id: '3',
    name: 'Local Contractors Association',
    category: 'Labour',
    contactPerson: 'Amit Sharma',
    phone: '+91 98765 43212',
    email: 'amit@localcontractors.com',
    address: 'Contractor Colony, Pune, MH 411001',
    gstNumber: '27DEFGH5678K1Z9',
    panNumber: 'DEFGH5678K',
    bankAccount: '1357924680',
    ifscCode: 'ICIC0001234',
    paymentTerms: '15 days',
    rating: 4.2,
    totalPaid: 1200000,
    pendingAmount: 95000,
    lastPayment: '2024-02-22',
    status: 'active',
    registrationDate: '2023-02-01',
    notes: 'Skilled labour contractors with timely delivery',
    organizationId: 'org-1',
    createdAt: '2023-02-01T00:00:00Z',
    updatedAt: '2024-02-22T00:00:00Z',
  },
  {
    id: '4',
    name: 'City Transport Services',
    category: 'Transport',
    contactPerson: 'Prakash Joshi',
    phone: '+91 98765 43213',
    email: 'prakash@citytransport.com',
    address: 'Transport Nagar, Mumbai, MH 400001',
    gstNumber: '27IJKLM9012N1Z3',
    panNumber: 'IJKLM9012N',
    bankAccount: '2468135790',
    ifscCode: 'AXIS0001234',
    paymentTerms: '7 days',
    rating: 4.0,
    totalPaid: 350000,
    pendingAmount: 25000,
    lastPayment: '2024-02-28',
    status: 'active',
    registrationDate: '2023-03-15',
    notes: 'Reliable transport services for material delivery',
    organizationId: 'org-1',
    createdAt: '2023-03-15T00:00:00Z',
    updatedAt: '2024-02-28T00:00:00Z',
  },
];

interface VendorsContextType {
  vendors: Vendor[];
  addVendor: (vendor: Omit<Vendor, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) => void;
  updateVendor: (id: string, vendor: Partial<Vendor>) => void;
}

const VendorsContext = createContext<VendorsContextType | undefined>(undefined);

export function VendorsProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);

  const addVendor = useCallback(
    (vendor: Omit<Vendor, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      setVendors((prev) => [
        ...prev,
        {
          ...vendor,
          id: (prev.length + 1).toString(),
          organizationId: 'org-1',
          createdAt: now,
          updatedAt: now,
        },
      ]);
    },
    [],
  );

  const updateVendor = useCallback((id: string, updates: Partial<Vendor>) => {
    setVendors((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v,
      ),
    );
  }, []);

  return (
    <VendorsContext.Provider value={{ vendors, addVendor, updateVendor }}>
      {children}
    </VendorsContext.Provider>
  );
}

export function useVendors() {
  const ctx = useContext(VendorsContext);
  if (!ctx) {
    throw new Error('useVendors must be used within a VendorsProvider');
  }
  return ctx;
}
