'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import VehicleRefuelingForm from '@/components/forms/VehicleRefuelingForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from 'sonner';
import type { Vehicle as VehicleEntity, VehicleRefueling } from '@/types/entities';

type Vehicle = {
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
};

export default function VehicleRefuelingPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/vehicles', { cache: 'no-store' });
        const payload = (await response.json().catch(() => ({}))) as {
          vehicles?: VehicleEntity[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load vehicles');
        }

        // Map VehicleEntity to Vehicle format expected by form
        const mappedVehicles: Vehicle[] = (payload.vehicles ?? []).map((v) => ({
          id: v.id,
          vehicleNumber: v.vehicleNumber,
          type: v.type,
          make: v.make || '',
          model: v.model || '',
          year: v.year || 0,
          siteId: v.siteId || '',
          siteName: v.siteName || '',
          status: (v.status === 'available' || v.status === 'in_use'
            ? 'Active'
            : v.status === 'maintenance'
              ? 'Maintenance'
              : v.status === 'idle'
                ? 'Idle'
                : 'Returned') as Vehicle['status'],
          operator: v.operator || '',
          isRental: v.isRental,
          fuelCapacity: v.fuelCapacity || 0,
          currentFuelLevel: v.currentFuelLevel || 0,
          mileage: v.mileage || 0,
          lastMaintenanceDate: v.lastMaintenanceDate || '',
          nextMaintenanceDate: v.nextMaintenanceDate || '',
          insuranceExpiry: v.insuranceExpiry || '',
          registrationExpiry: v.registrationExpiry || '',
          createdAt: v.createdAt,
          lastUpdated: v.updatedAt,
        }));

        setVehicles(mappedVehicles);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load vehicles');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchVehicles();
  }, []);

  const handleSubmit = async (data: {
    vehicleId: string;
    date: string;
    fuelType: 'Petrol' | 'Diesel' | 'CNG' | 'Electric';
    quantity: number;
    cost: number;
    odometerReading: number;
    location: string;
    vendor: string;
    invoiceNumber: string;
    notes?: string;
  }) => {
    try {
      const selectedVehicle = vehicles.find((v) => v.id === data.vehicleId);

      if (!selectedVehicle) {
        throw new Error('Vehicle not found');
      }

      // Determine unit based on fuel type
      const unit: 'liters' | 'kWh' = data.fuelType === 'Electric' ? 'kWh' : 'liters';

      const response = await fetch('/api/vehicles/refueling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: data.vehicleId,
          vehicleNumber: selectedVehicle.vehicleNumber,
          date: data.date,
          fuelType: data.fuelType,
          quantity: data.quantity,
          unit,
          cost: data.cost,
          odometerReading: data.odometerReading,
          location: data.location,
          vendor: data.vendor,
          invoiceNumber: data.invoiceNumber,
          receiptUrl: null,
          notes: data.notes ?? null,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        refueling?: VehicleRefueling;
        error?: string;
      };

      if (!response.ok || !payload.refueling) {
        throw new Error(payload.error || 'Failed to create refueling record');
      }

      toast.success('Refueling record created successfully');
      router.push('/vehicles');
    } catch (error) {
      console.error('Error creating refueling record:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create refueling record');
      throw error; // Re-throw to let the form handle the error state
    }
  };

  const handleCancel = () => {
    router.push('/vehicles');
  };

  if (isLoading) {
    return <div className="container mx-auto py-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Vehicle Refueling" description="Track fuel fills and efficiency." />
      <div className="max-w-2xl mx-auto">
        <VehicleRefuelingForm vehicles={vehicles} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
