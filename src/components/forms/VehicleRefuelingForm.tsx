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

interface VehicleRefueling {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  date: string;
  fuelType: 'Petrol' | 'Diesel' | 'CNG' | 'Electric';
  quantity: number;
  unit: 'liters' | 'kWh';
  cost: number;
  odometerReading: number;
  location: string;
  vendor: string;
  invoiceNumber: string;
  receiptUrl?: string;
  notes?: string;
  recordedBy: string;
}

interface VehicleRefuelingFormProps {
  vehicles: Vehicle[];
  onSubmit: (refuelingData: Omit<VehicleRefueling, 'id' | 'vehicleNumber' | 'recordedBy'>) => void;
  onCancel: () => void;
}

export default function VehicleRefuelingForm({
  vehicles,
  onSubmit,
  onCancel,
}: VehicleRefuelingFormProps) {
  const [formData, setFormData] = useState({
    vehicleId: '',
    date: '',
    fuelType: 'Diesel' as VehicleRefueling['fuelType'],
    quantity: '',
    cost: '',
    odometerReading: '',
    location: '',
    vendor: '',
    invoiceNumber: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const refuelingData: Omit<VehicleRefueling, 'id' | 'vehicleNumber' | 'recordedBy'> = {
      vehicleId: formData.vehicleId,
      date: formData.date,
      fuelType: formData.fuelType,
      quantity: Number(formData.quantity),
      unit: formData.fuelType === 'Electric' ? 'kWh' : 'liters',
      cost: Number(formData.cost),
      odometerReading: Number(formData.odometerReading),
      location: formData.location,
      vendor: formData.vendor,
      invoiceNumber: formData.invoiceNumber,
      notes: formData.notes,
    };

    onSubmit(refuelingData);
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
            placeholder="Select refueling date"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fuelType">Fuel Type *</Label>
          <Select
            value={formData.fuelType}
            onValueChange={(value: VehicleRefueling['fuelType']) =>
              setFormData((prev) => ({ ...prev, fuelType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Diesel">Diesel</SelectItem>
              <SelectItem value="Petrol">Petrol</SelectItem>
              <SelectItem value="CNG">CNG</SelectItem>
              <SelectItem value="Electric">Electric</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
            placeholder="50"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cost">Cost *</Label>
          <Input
            type="number"
            value={formData.cost}
            onChange={(e) => setFormData((prev) => ({ ...prev, cost: e.target.value }))}
            placeholder="4250"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="odometer">Odometer Reading *</Label>
          <Input
            type="number"
            value={formData.odometerReading}
            onChange={(e) => setFormData((prev) => ({ ...prev, odometerReading: e.target.value }))}
            placeholder="2480"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="Site Fuel Station"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor *</Label>
          <Input
            value={formData.vendor}
            onChange={(e) => setFormData((prev) => ({ ...prev, vendor: e.target.value }))}
            placeholder="BP Fuel Station"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoice">Invoice Number *</Label>
          <Input
            value={formData.invoiceNumber}
            onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
            placeholder="BP-001234"
            required
          />
        </div>
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
        <Button type="submit">Add Refueling</Button>
      </div>
    </form>
  );
}
