'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Vehicle {
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
  vendor?: string;
  rentalCostPerDay?: number;
  rentalStartDate?: string;
  rentalEndDate?: string;
  totalRentalDays?: number;
  totalRentalCost?: number;
  fuelCapacity: number;
  currentFuelLevel: number;
  mileage: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  insuranceExpiry: string;
  registrationExpiry: string;
  createdAt: string;
  lastUpdated: string;
}

interface VehicleUsage {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  startOdometer: number;
  endOdometer: number;
  distance: number;
  workDescription: string;
  workCategory:
    | 'Transportation'
    | 'Material Hauling'
    | 'Equipment Transport'
    | 'Site Inspection'
    | 'Other';
  siteId: string;
  siteName: string;
  fuelConsumed: number;
  notes?: string;
  recordedBy: string;
}

interface VehicleUsageFormProps {
  vehicles: Vehicle[];
  sites: Array<{ id: string; name: string }>;
  onSubmit: (
    usageData: Omit<VehicleUsage, 'id' | 'vehicleNumber' | 'siteName' | 'distance' | 'recordedBy'>,
  ) => void;
  onCancel: () => void;
}

export default function VehicleUsageForm({
  vehicles,
  sites,
  onSubmit,
  onCancel,
}: VehicleUsageFormProps) {
  const [formData, setFormData] = useState({
    vehicleId: '',
    date: '',
    startTime: '',
    endTime: '',
    startOdometer: '',
    endOdometer: '',
    workDescription: '',
    workCategory: 'Transportation' as VehicleUsage['workCategory'],
    siteId: '',
    fuelConsumed: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const usageData: Omit<
      VehicleUsage,
      'id' | 'vehicleNumber' | 'siteName' | 'distance' | 'recordedBy'
    > = {
      vehicleId: formData.vehicleId,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      startOdometer: Number(formData.startOdometer),
      endOdometer: Number(formData.endOdometer),
      workDescription: formData.workDescription,
      workCategory: formData.workCategory,
      siteId: formData.siteId,
      fuelConsumed: Number(formData.fuelConsumed),
      notes: formData.notes,
    };

    onSubmit(usageData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vehicle">Vehicle *</Label>
          <Select
            value={formData.vehicleId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, vehicleId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select vehicle" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicleNumber} - {vehicle.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <DatePicker
            date={formData.date ? new Date(formData.date) : undefined}
            onSelect={(date) =>
              setFormData((prev) => ({
                ...prev,
                date: date ? date.toISOString().split('T')[0] : '',
              }))
            }
            placeholder="Select usage date"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time *</Label>
          <Input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time *</Label>
          <Input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startOdometer">Start Odometer *</Label>
          <Input
            type="number"
            value={formData.startOdometer}
            onChange={(e) => setFormData((prev) => ({ ...prev, startOdometer: e.target.value }))}
            placeholder="2480"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endOdometer">End Odometer *</Label>
          <Input
            type="number"
            value={formData.endOdometer}
            onChange={(e) => setFormData((prev) => ({ ...prev, endOdometer: e.target.value }))}
            placeholder="2520"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="workCategory">Work Category *</Label>
          <Select
            value={formData.workCategory}
            onValueChange={(value: VehicleUsage['workCategory']) =>
              setFormData((prev) => ({ ...prev, workCategory: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Transportation">Transportation</SelectItem>
              <SelectItem value="Material Hauling">Material Hauling</SelectItem>
              <SelectItem value="Equipment Transport">Equipment Transport</SelectItem>
              <SelectItem value="Site Inspection">Site Inspection</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="site">Site *</Label>
          <Select
            value={formData.siteId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, siteId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select site" />
            </SelectTrigger>
            <SelectContent>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="workDescription">Work Description *</Label>
        <Textarea
          value={formData.workDescription}
          onChange={(e) => setFormData((prev) => ({ ...prev, workDescription: e.target.value }))}
          placeholder="Transporting materials from supplier to site"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fuelConsumed">Fuel Consumed (Liters)</Label>
        <Input
          type="number"
          value={formData.fuelConsumed}
          onChange={(e) => setFormData((prev) => ({ ...prev, fuelConsumed: e.target.value }))}
          placeholder="15"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes..."
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Usage</Button>
      </div>
    </form>
  );
}
