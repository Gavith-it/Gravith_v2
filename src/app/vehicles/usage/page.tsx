'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import VehicleUsageForm from '@/components/forms/VehicleUsageForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function VehicleUsagePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<
    Array<{
      id: string;
      vehicleNumber: string;
      type: string;
      make: string;
      model: string;
      year: number;
      siteId: string;
      siteName: string;
      status: 'Active' | 'Maintenance' | 'Idle' | 'Returned';
      operator: string;
      isRental: boolean;
      fuelCapacity: number;
      currentFuelLevel: number;
      mileage: number;
      lastMaintenanceDate: string;
      nextMaintenanceDate: string;
      insuranceExpiry: string;
      registrationExpiry: string;
      createdAt: string;
      lastUpdated: string;
    }>
  >([]);
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    // Fetch vehicles and sites data
    // This is a mock implementation - replace with actual API call
    const mockVehicles = [
      {
        id: '1',
        vehicleNumber: 'MH-01-AB-1234',
        type: 'Truck',
        make: 'Tata',
        model: 'Ace',
        year: 2020,
        siteId: '1',
        siteName: 'Residential Complex A',
        status: 'Active' as const,
        operator: 'John Doe',
        isRental: false,
        fuelCapacity: 50,
        currentFuelLevel: 30,
        mileage: 12,
        lastMaintenanceDate: '2024-01-01',
        nextMaintenanceDate: '2024-04-01',
        insuranceExpiry: '2024-12-31',
        registrationExpiry: '2024-12-31',
        createdAt: '2024-01-01T00:00:00Z',
        lastUpdated: '2024-01-01T00:00:00Z',
      },
    ];

    const mockSites = [
      { id: '1', name: 'Residential Complex A' },
      { id: '2', name: 'Commercial Building B' },
    ];

    setVehicles(mockVehicles);
    setSites(mockSites);
  }, []);

  const handleSubmit = (data: {
    vehicleId: string;
    date: string;
    startTime: string;
    endTime: string;
    startOdometer: number;
    endOdometer: number;
    workDescription: string;
    workCategory: string;
    siteId: string;
    fuelConsumed: number;
    notes?: string;
  }) => {
    // Handle form submission logic here
    console.log('Usage data:', data);
    // You can add API call to save the usage record
    router.push('/vehicles');
  };

  const handleCancel = () => {
    router.push('/vehicles');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Vehicle Usage" description="Log running hours and utilization." />
      <div className="max-w-2xl mx-auto">
        <VehicleUsageForm
          vehicles={vehicles}
          sites={sites}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
