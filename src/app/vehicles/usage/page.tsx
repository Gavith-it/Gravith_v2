'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import VehicleUsageForm from '@/components/forms/VehicleUsageForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from 'sonner';
import type { Vehicle as VehicleEntity, Site, VehicleUsage } from '@/types/entities';

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

export default function VehicleUsagePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [vehiclesResponse, sitesResponse] = await Promise.all([
          fetch('/api/vehicles', { cache: 'no-store' }),
          fetch('/api/sites', { cache: 'no-store' }),
        ]);

        const vehiclesPayload = (await vehiclesResponse.json().catch(() => ({}))) as {
          vehicles?: VehicleEntity[];
          error?: string;
        };
        const sitesPayload = (await sitesResponse.json().catch(() => ({}))) as {
          sites?: Site[];
          error?: string;
        };

        if (!vehiclesResponse.ok) {
          throw new Error(vehiclesPayload.error || 'Failed to load vehicles');
        }
        if (!sitesResponse.ok) {
          throw new Error(sitesPayload.error || 'Failed to load sites');
        }

        // Map VehicleEntity to Vehicle format expected by form
        const mappedVehicles: Vehicle[] = (vehiclesPayload.vehicles ?? []).map((v) => ({
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
        setSites(
          (sitesPayload.sites ?? []).map((site) => ({
            id: site.id,
            name: site.name,
          })),
        );
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, []);

  const handleSubmit = async (data: {
    vehicleId: string;
    date: string;
    startTime: string;
    endTime: string;
    startOdometer: number;
    endOdometer: number;
    workDescription: string;
    workCategory: 'Transportation' | 'Material Hauling' | 'Equipment Transport' | 'Site Inspection' | 'Other';
    siteId: string;
    fuelConsumed: number;
    notes?: string;
  }) => {
    try {
      const selectedVehicle = vehicles.find((v) => v.id === data.vehicleId);
      const selectedSite = sites.find((s) => s.id === data.siteId);

      if (!selectedVehicle) {
        throw new Error('Vehicle not found');
      }
      if (!selectedSite) {
        throw new Error('Site not found');
      }

      const totalDistance = Math.max(0, data.endOdometer - data.startOdometer);

      // Fetch original vehicle entity to get vendor info
      const vehicleResponse = await fetch(`/api/vehicles/${data.vehicleId}`, { cache: 'no-store' });
      const vehiclePayload = (await vehicleResponse.json().catch(() => ({}))) as {
        vehicle?: VehicleEntity;
        error?: string;
      };
      const originalVehicle = vehiclePayload.vehicle;

      const response = await fetch('/api/vehicles/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: data.vehicleId,
          vehicleNumber: selectedVehicle.vehicleNumber,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          startOdometer: data.startOdometer,
          endOdometer: data.endOdometer,
          totalDistance,
          workDescription: data.workDescription,
          workCategory: data.workCategory,
          siteId: data.siteId,
          siteName: selectedSite.name,
          operator: selectedVehicle.operator || '',
          fuelConsumed: data.fuelConsumed,
          isRental: selectedVehicle.isRental ?? false,
          rentalCost: originalVehicle?.totalRentalCost ?? null,
          vendor: originalVehicle?.vendor ?? null,
          status: 'In Progress' as const,
          notes: data.notes ?? null,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        usage?: VehicleUsage;
        error?: string;
      };

      if (!response.ok || !payload.usage) {
        throw new Error(payload.error || 'Failed to create vehicle usage record');
      }

      toast.success('Vehicle usage recorded successfully');
      router.push('/vehicles');
    } catch (error) {
      console.error('Error creating vehicle usage:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create vehicle usage record');
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
