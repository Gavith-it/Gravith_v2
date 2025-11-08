'use client';

import {
  Plus,
  Fuel,
  Activity,
  DollarSign,
  Calendar,
  BarChart as BarChartIcon,
  Truck,
  Edit,
  Trash2,
} from 'lucide-react';
import React, { useState } from 'react';

import { FormDialog } from '@/components/common/FormDialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDialogState } from '@/lib/hooks/useDialogState';
import { formatDateShort } from '@/lib/utils';

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

interface VehicleUsage {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  startOdometer: number;
  endOdometer: number;
  totalDistance: number;
  workDescription: string;
  workCategory: 'Construction' | 'Transport' | 'Delivery' | 'Maintenance' | 'Other';
  siteId: string;
  siteName: string;
  operator: string;
  fuelConsumed: number;
  isRental: boolean;
  rentalCost?: number;
  vendor?: string;
  status: 'In Progress' | 'Completed' | 'Cancelled';
  notes?: string;
  recordedBy: string;
}

interface VehicleManagementProps {
  selectedVehicle?: string;
  onVehicleSelect?: (vehicleId: string) => void;
}

type RefuelingFormState = {
  vehicleId: string;
  date: string;
  fuelType: VehicleRefueling['fuelType'];
  quantity: string;
  cost: string;
  odometerReading: string;
  location: string;
  vendor: string;
  invoiceNumber: string;
  notes: string;
};

const emptyRefuelingFormState: RefuelingFormState = {
  vehicleId: '',
  date: '',
  fuelType: 'Diesel',
  quantity: '',
  cost: '',
  odometerReading: '',
  location: '',
  vendor: '',
  invoiceNumber: '',
  notes: '',
};

type UsageFormState = {
  vehicleId: string;
  date: string;
  startTime: string;
  endTime: string;
  startOdometer: string;
  endOdometer: string;
  workDescription: string;
  workCategory: VehicleUsage['workCategory'];
  siteId: string;
  fuelConsumed: string;
  notes: string;
};

const emptyUsageFormState: UsageFormState = {
  vehicleId: '',
  date: '',
  startTime: '',
  endTime: '',
  startOdometer: '',
  endOdometer: '',
  workDescription: '',
  workCategory: 'Construction',
  siteId: '',
  fuelConsumed: '',
  notes: '',
};

export function VehiclesPage({
  selectedVehicle: propSelectedVehicle,
  onVehicleSelect,
}: VehicleManagementProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: '1',
      vehicleNumber: 'EX-001',
      type: 'Excavator',
      make: 'CAT',
      model: '320D',
      year: 2022,
      siteId: '1',
      siteName: 'Residential Complex A',
      status: 'Active',
      operator: 'John Smith',
      isRental: true,
      vendor: 'Heavy Equipment Rentals',
      rentalCostPerDay: 8000,
      rentalStartDate: '2024-01-15',
      rentalEndDate: '2024-12-31',
      totalRentalDays: 320,
      totalRentalCost: 2560000,
      fuelCapacity: 200,
      currentFuelLevel: 150,
      mileage: 2500,
      lastMaintenanceDate: '2024-01-10',
      nextMaintenanceDate: '2024-04-10',
      insuranceExpiry: '2024-12-31',
      registrationExpiry: '2024-12-31',
      createdAt: '2024-01-15',
      lastUpdated: '2024-03-15',
    },
    {
      id: '2',
      vehicleNumber: 'CR-002',
      type: 'Crane',
      make: 'Liebherr',
      model: 'LTM 1200',
      year: 2021,
      siteId: '1',
      siteName: 'Residential Complex A',
      status: 'Active',
      operator: 'Mike Johnson',
      isRental: true,
      vendor: 'Crane Solutions Ltd',
      rentalCostPerDay: 12000,
      rentalStartDate: '2024-01-20',
      rentalEndDate: '2024-12-31',
      totalRentalDays: 290,
      totalRentalCost: 3480000,
      fuelCapacity: 300,
      currentFuelLevel: 200,
      mileage: 1800,
      lastMaintenanceDate: '2024-01-15',
      nextMaintenanceDate: '2024-04-15',
      insuranceExpiry: '2024-12-31',
      registrationExpiry: '2024-12-31',
      createdAt: '2024-01-20',
      lastUpdated: '2024-03-15',
    },
    {
      id: '3',
      vehicleNumber: 'TK-003',
      type: 'Truck',
      make: 'Tata',
      model: 'Prima 4038',
      year: 2023,
      siteId: '2',
      siteName: 'Commercial Plaza B',
      status: 'Maintenance',
      operator: 'Rajesh Kumar',
      isRental: false,
      fuelCapacity: 100,
      currentFuelLevel: 80,
      mileage: 4500,
      lastMaintenanceDate: '2024-02-15',
      nextMaintenanceDate: '2024-05-15',
      insuranceExpiry: '2025-06-30',
      registrationExpiry: '2025-06-30',
      createdAt: '2024-01-01',
      lastUpdated: '2024-03-15',
    },
  ]);

  const [refuelingRecords, setRefuelingRecords] = useState<VehicleRefueling[]>([
    {
      id: '1',
      vehicleId: '1',
      vehicleNumber: 'EX-001',
      date: '2024-03-10',
      fuelType: 'Diesel',
      quantity: 50,
      unit: 'liters',
      cost: 4250,
      odometerReading: 2480,
      location: 'Site Fuel Station',
      vendor: 'BP Fuel Station',
      invoiceNumber: 'BP-001234',
      notes: 'Regular refueling',
      recordedBy: 'John Smith',
    },
    {
      id: '2',
      vehicleId: '2',
      vehicleNumber: 'CR-002',
      date: '2024-03-12',
      fuelType: 'Diesel',
      quantity: 75,
      unit: 'liters',
      cost: 6375,
      odometerReading: 1780,
      location: 'Site Fuel Station',
      vendor: 'HP Fuel Station',
      invoiceNumber: 'HP-005678',
      notes: 'Heavy lifting operations',
      recordedBy: 'Mike Johnson',
    },
  ]);

  const [usageRecords, setUsageRecords] = useState<VehicleUsage[]>([
    {
      id: '1',
      vehicleId: '1',
      vehicleNumber: 'EX-001',
      date: '2024-03-15',
      startTime: '08:00',
      endTime: '17:00',
      startOdometer: 2480,
      endOdometer: 2490,
      totalDistance: 10,
      workDescription: 'Foundation excavation work',
      workCategory: 'Construction',
      siteId: '1',
      siteName: 'Residential Complex A',
      operator: 'John Smith',
      fuelConsumed: 40,
      isRental: true,
      rentalCost: 8000,
      vendor: 'Heavy Equipment Rentals',
      status: 'Completed',
      notes: 'Completed foundation work for Block A',
      recordedBy: 'Site Supervisor',
    },
    {
      id: '2',
      vehicleId: '2',
      vehicleNumber: 'CR-002',
      date: '2024-03-15',
      startTime: '09:00',
      endTime: '16:00',
      startOdometer: 1780,
      endOdometer: 1785,
      totalDistance: 5,
      workDescription: 'Steel beam lifting operations',
      workCategory: 'Construction',
      siteId: '1',
      siteName: 'Residential Complex A',
      operator: 'Mike Johnson',
      fuelConsumed: 25,
      isRental: true,
      rentalCost: 12000,
      vendor: 'Crane Solutions Ltd',
      status: 'Completed',
      notes: 'Lifted 12 steel beams for structural work',
      recordedBy: 'Site Supervisor',
    },
  ]);

  const [selectedVehicle, setSelectedVehicle] = useState<string>(propSelectedVehicle || '1');
  const [activeTab, setActiveTab] = useState('refueling');

  const refuelingDialog = useDialogState<VehicleRefueling>();
  const usageDialog = useDialogState<VehicleUsage>();

  const resetRefuelingForm = React.useCallback(() => {
    setRefuelingForm({
      ...emptyRefuelingFormState,
      vehicleId: selectedVehicle || '',
    });
  }, [selectedVehicle]);

  const resetUsageForm = React.useCallback(() => {
    const vehicle = vehicles.find((v) => v.id === selectedVehicle);
    setUsageForm({
      ...emptyUsageFormState,
      vehicleId: selectedVehicle || '',
      siteId: vehicle?.siteId || '',
    });
  }, [selectedVehicle, vehicles]);

  // Update selectedVehicle when prop changes
  React.useEffect(() => {
    if (propSelectedVehicle) {
      setSelectedVehicle(propSelectedVehicle);
    }
  }, [propSelectedVehicle]);

  React.useEffect(() => {
    if (!refuelingDialog.isDialogOpen) {
      resetRefuelingForm();
      return;
    }

    if (refuelingDialog.editingItem) {
      const item = refuelingDialog.editingItem;
      setRefuelingForm({
        vehicleId: item.vehicleId,
        date: item.date,
        fuelType: item.fuelType,
        quantity: item.quantity.toString(),
        cost: item.cost.toString(),
        odometerReading: item.odometerReading.toString(),
        location: item.location,
        vendor: item.vendor,
        invoiceNumber: item.invoiceNumber,
        notes: item.notes ?? '',
      });
    } else {
      resetRefuelingForm();
    }
  }, [refuelingDialog.isDialogOpen, refuelingDialog.editingItem, resetRefuelingForm]);

  React.useEffect(() => {
    if (!usageDialog.isDialogOpen) {
      resetUsageForm();
      return;
    }

    if (usageDialog.editingItem) {
      const item = usageDialog.editingItem;
      setUsageForm({
        vehicleId: item.vehicleId,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        startOdometer: item.startOdometer.toString(),
        endOdometer: item.endOdometer.toString(),
        workDescription: item.workDescription,
        workCategory: item.workCategory,
        siteId: item.siteId,
        fuelConsumed: item.fuelConsumed.toString(),
        notes: item.notes ?? '',
      });
    } else {
      resetUsageForm();
    }
  }, [usageDialog.isDialogOpen, usageDialog.editingItem, resetUsageForm]);

  // Form states
  const [refuelingForm, setRefuelingForm] = useState<RefuelingFormState>({
    ...emptyRefuelingFormState,
  });

  const [usageForm, setUsageForm] = useState<UsageFormState>({
    ...emptyUsageFormState,
  });

  // Calculate analytics
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status === 'Active').length;
  const totalFuelCost = refuelingRecords.reduce((sum, record) => sum + record.cost, 0);
  const averageFuelEfficiency =
    usageRecords.length > 0
      ? usageRecords.reduce((sum, record) => sum + record.totalDistance / record.fuelConsumed, 0) /
        usageRecords.length
      : 0;

  const currentVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicle);

  const handleRefuelingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = vehicles.find((v) => v.id === refuelingForm.vehicleId);

    const recordId = refuelingDialog.editingItem?.id || (refuelingRecords.length + 1).toString();

    const updatedRefueling: VehicleRefueling = {
      id: recordId,
      vehicleId: refuelingForm.vehicleId,
      vehicleNumber: vehicle?.vehicleNumber || '',
      date: refuelingForm.date,
      fuelType: refuelingForm.fuelType,
      quantity: Number(refuelingForm.quantity),
      unit: refuelingForm.fuelType === 'Electric' ? 'kWh' : 'liters',
      cost: Number(refuelingForm.cost),
      odometerReading: Number(refuelingForm.odometerReading),
      location: refuelingForm.location,
      vendor: refuelingForm.vendor,
      invoiceNumber: refuelingForm.invoiceNumber,
      notes: refuelingForm.notes,
      recordedBy: 'Current User',
    };

    if (refuelingDialog.editingItem) {
      setRefuelingRecords((prev) =>
        prev.map((record) => (record.id === recordId ? updatedRefueling : record)),
      );
    } else {
      setRefuelingRecords((prev) => [...prev, updatedRefueling]);

      // Update vehicle fuel level and mileage for newly added entries
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === refuelingForm.vehicleId
            ? {
                ...v,
                currentFuelLevel: Math.min(
                  v.fuelCapacity,
                  v.currentFuelLevel + Number(refuelingForm.quantity),
                ),
                mileage: Number(refuelingForm.odometerReading),
                lastUpdated: new Date().toISOString().split('T')[0],
              }
            : v,
        ),
      );
    }

    resetRefuelingForm();
    refuelingDialog.closeDialog();
  };

  const handleUsageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = vehicles.find((v) => v.id === usageForm.vehicleId);
    const totalDistance = Number(usageForm.endOdometer) - Number(usageForm.startOdometer);

    const recordId = usageDialog.editingItem?.id || (usageRecords.length + 1).toString();

    const updatedUsage: VehicleUsage = {
      id: recordId,
      vehicleId: usageForm.vehicleId,
      vehicleNumber: vehicle?.vehicleNumber || '',
      date: usageForm.date,
      startTime: usageForm.startTime,
      endTime: usageForm.endTime,
      startOdometer: Number(usageForm.startOdometer),
      endOdometer: Number(usageForm.endOdometer),
      totalDistance,
      workDescription: usageForm.workDescription,
      workCategory: usageForm.workCategory,
      siteId: usageForm.siteId,
      siteName: vehicles.find((v) => v.siteId === usageForm.siteId)?.siteName || '',
      operator: vehicle?.operator || '',
      fuelConsumed: Number(usageForm.fuelConsumed),
      isRental: vehicle?.isRental || false,
      rentalCost: vehicle?.isRental ? vehicle?.rentalCostPerDay : undefined,
      vendor: vehicle?.vendor,
      status: 'Completed',
      notes: usageForm.notes,
      recordedBy: 'Current User',
    };

    if (usageDialog.editingItem) {
      setUsageRecords((prev) =>
        prev.map((record) => (record.id === recordId ? updatedUsage : record)),
      );
    } else {
      setUsageRecords((prev) => [...prev, updatedUsage]);

      // Update vehicle mileage and fuel level when creating a new usage entry
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === usageForm.vehicleId
            ? {
                ...v,
                mileage: Number(usageForm.endOdometer),
                currentFuelLevel: Math.max(0, v.currentFuelLevel - Number(usageForm.fuelConsumed)),
                lastUpdated: new Date().toISOString().split('T')[0],
              }
            : v,
        ),
      );
    }

    resetUsageForm();
    usageDialog.closeDialog();
  };

  const handleEditRefueling = (record: VehicleRefueling) => {
    refuelingDialog.openDialog(record);
  };

  const handleDeleteRefueling = (recordId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this refueling record?')) {
      return;
    }
    setRefuelingRecords((prev) => prev.filter((record) => record.id !== recordId));
  };

  const handleEditUsage = (record: VehicleUsage) => {
    usageDialog.openDialog(record);
  };

  const handleDeleteUsage = (recordId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this usage record?')) {
      return;
    }
    setUsageRecords((prev) => prev.filter((record) => record.id !== recordId));
  };

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'Idle':
        return 'bg-gray-100 text-gray-800';
      case 'Returned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Chart data
  const fuelCostData = refuelingRecords.map((record) => ({
    date: record.date,
    cost: record.cost,
    vehicle: record.vehicleNumber,
  }));

  const usageData = usageRecords.map((record) => ({
    date: record.date,
    distance: record.totalDistance,
    fuel: record.fuelConsumed,
    vehicle: record.vehicleNumber,
  }));

  return (
    <>
      <div className="h-full w-full bg-background flex flex-col">
        {currentVehicle ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Navigation Tabs - Topmost */}
            <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-background to-muted/20">
              <CardContent className="px-6 py-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="refueling" className="flex items-center gap-2">
                    <Fuel className="h-4 w-4" />
                    Refueling
                  </TabsTrigger>
                  <TabsTrigger value="usage" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Usage
                  </TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>

            {/* Tab Content */}
            <TabsContent value="refueling" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">
                                Last Refueling
                              </p>
                              <p className="text-2xl font-bold text-blue-600">
                                {refuelingRecords.length > 0
                                  ? formatDateShort(
                                      refuelingRecords[refuelingRecords.length - 1].date,
                                    )
                                  : '-'}
                              </p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">
                                Monthly Consumption
                              </p>
                              <p className="text-2xl font-bold text-green-600">
                                {refuelingRecords
                                  .filter(
                                    (r) => new Date(r.date).getMonth() === new Date().getMonth(),
                                  )
                                  .reduce((sum, r) => sum + r.quantity, 0)}
                                L
                              </p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                              <Fuel className="h-6 w-6 text-green-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">
                                Monthly Cost
                              </p>
                              <p className="text-2xl font-bold text-primary">
                                ₹
                                {refuelingRecords
                                  .filter(
                                    (r) => new Date(r.date).getMonth() === new Date().getMonth(),
                                  )
                                  .reduce((sum, r) => sum + r.cost, 0)
                                  .toLocaleString()}
                              </p>
                            </div>
                            <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                              <DollarSign className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">
                                Avg Cost/Liter
                              </p>
                              <p className="text-2xl font-bold text-orange-600">
                                ₹
                                {(
                                  refuelingRecords.reduce((sum, r) => sum + r.cost, 0) /
                                  refuelingRecords.reduce((sum, r) => sum + r.quantity, 0)
                                ).toFixed(2)}
                              </p>
                            </div>
                            <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                              <BarChartIcon className="h-6 w-6 text-orange-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Refueling Records Table */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">Vehicle Refueling Records</h3>
                          <Button
                            onClick={() => {
                              resetRefuelingForm();
                              refuelingDialog.openDialog();
                            }}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Refueling
                          </Button>
                        </div>
                        <div className="overflow-x-auto">
                          <div className="max-h-[60vh] overflow-y-auto rounded-lg border">
                            <TooltipProvider>
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="border-b bg-muted/50">
                                    <th className="px-3 py-2 text-left">Date</th>
                                    <th className="px-3 py-2 text-left">Vehicle</th>
                                    <th className="px-3 py-2 text-left">Fuel Type</th>
                                    <th className="px-3 py-2 text-left">Quantity</th>
                                    <th className="px-3 py-2 text-left">Cost</th>
                                    <th className="px-3 py-2 text-left">Odometer</th>
                                    <th className="px-3 py-2 text-left">Location</th>
                                    <th className="px-3 py-2 text-left">Vendor</th>
                                    <th className="px-3 py-2 text-left">Invoice</th>
                                    <th className="px-3 py-2 text-left">Notes</th>
                                    <th className="px-3 py-2 text-left">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {refuelingRecords.map((record) => (
                                    <tr key={record.id} className="border-b hover:bg-muted/50">
                                      <td className="px-3 py-2">{record.date}</td>
                                      <td className="px-3 py-2">{record.vehicleNumber}</td>
                                      <td className="px-3 py-2">{record.fuelType}</td>
                                      <td className="px-3 py-2">
                                        {record.quantity} {record.unit}
                                      </td>
                                      <td className="px-3 py-2">₹{record.cost}</td>
                                      <td className="px-3 py-2">{record.odometerReading}</td>
                                      <td className="px-3 py-2">{record.location}</td>
                                      <td className="px-3 py-2">{record.vendor}</td>
                                      <td className="px-3 py-2">{record.invoiceNumber}</td>
                                      <td className="px-3 py-2">{record.notes || '-'}</td>
                                      <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleEditRefueling(record)}
                                                aria-label={`Edit refueling record ${record.invoiceNumber}`}
                                                className="h-8 w-8"
                                              >
                                                <Edit className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Edit</TooltipContent>
                                          </Tooltip>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleDeleteRefueling(record.id)}
                                                aria-label={`Delete refueling record ${record.invoiceNumber}`}
                                                className="h-8 w-8 border-destructive text-destructive hover:bg-destructive/10"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Delete</TooltipContent>
                                          </Tooltip>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </TooltipProvider>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Usage Tab */}
            <TabsContent value="usage" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Last Usage</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {usageRecords.length > 0
                                ? formatDateShort(usageRecords[usageRecords.length - 1].date)
                                : '-'}
                            </p>
                          </div>
                          <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Monthly Distance
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                              {usageRecords
                                .filter(
                                  (r) => new Date(r.date).getMonth() === new Date().getMonth(),
                                )
                                .reduce((sum, r) => sum + r.totalDistance, 0)}{' '}
                              km
                            </p>
                          </div>
                          <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <Truck className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Monthly Usage Cost
                            </p>
                            <p className="text-2xl font-bold text-primary">
                              ₹
                              {usageRecords
                                .filter(
                                  (r) => new Date(r.date).getMonth() === new Date().getMonth(),
                                )
                                .reduce((sum, r) => sum + (r.rentalCost || 0), 0)
                                .toLocaleString()}
                            </p>
                          </div>
                          <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Avg. Efficiency
                            </p>
                            <p className="text-2xl font-bold text-orange-600">
                              {(
                                usageRecords.reduce((sum, r) => sum + r.totalDistance, 0) /
                                usageRecords.reduce((sum, r) => sum + r.fuelConsumed, 1)
                              ).toFixed(2)}{' '}
                              km/L
                            </p>
                          </div>
                          <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                            <BarChartIcon className="h-6 w-6 text-orange-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Vehicle Usage Records</h3>
                        <Button
                          onClick={() => {
                            resetUsageForm();
                            usageDialog.openDialog();
                          }}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Usage Record
                        </Button>
                      </div>
                      <div className="overflow-x-auto">
                        <div className="max-h-[60vh] overflow-y-auto rounded-lg border">
                          <TooltipProvider>
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="px-3 py-2 text-left">Date</th>
                                  <th className="px-3 py-2 text-left">Vehicle</th>
                                  <th className="px-3 py-2 text-left">Driver</th>
                                  <th className="px-3 py-2 text-left">Purpose</th>
                                  <th className="px-3 py-2 text-left">Start Reading</th>
                                  <th className="px-3 py-2 text-left">End Reading</th>
                                  <th className="px-3 py-2 text-left">Distance</th>
                                  <th className="px-3 py-2 text-left">Status</th>
                                  <th className="px-3 py-2 text-left">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {usageRecords.map((record) => (
                                  <tr key={record.id} className="border-b hover:bg-muted/50">
                                    <td className="px-3 py-2">{record.date}</td>
                                    <td className="px-3 py-2">{record.vehicleNumber}</td>
                                    <td className="px-3 py-2">{record.operator}</td>
                                    <td className="px-3 py-2">{record.workDescription}</td>
                                    <td className="px-3 py-2">{record.startOdometer}</td>
                                    <td className="px-3 py-2">{record.endOdometer || '-'}</td>
                                    <td className="px-3 py-2">{record.totalDistance} km</td>
                                    <td className="px-3 py-2">
                                      <Badge
                                        variant={
                                          record.status === 'Completed' ? 'default' : 'secondary'
                                        }
                                      >
                                        {record.status}
                                      </Badge>
                                    </td>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="icon"
                                              onClick={() => handleEditUsage(record)}
                                              aria-label={`Edit usage record ${record.id}`}
                                              className="h-8 w-8"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Edit</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="icon"
                                              onClick={() => handleDeleteUsage(record.id)}
                                              aria-label={`Delete usage record ${record.id}`}
                                              className="h-8 w-8 border-destructive text-destructive hover:bg-destructive/10"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Delete</TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </TooltipProvider>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 hover:shadow-md transition-shadow">
              <CardContent className="p-12">
                <div className="text-center">
                  <Avatar className="h-24 w-24 bg-primary/10 mx-auto mb-6">
                    <AvatarFallback className="bg-primary/10">
                      <Truck className="h-12 w-12 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-2xl font-semibold mb-3">Select a Vehicle</h3>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                    Choose a vehicle from the list above to view detailed information, track usage,
                    and manage operations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Refueling Dialog */}
      <FormDialog
        title={refuelingDialog.isEditing ? 'Edit Refueling Record' : 'Add Refueling Record'}
        description="Record vehicle refueling details"
        isOpen={refuelingDialog.isDialogOpen}
        onOpenChange={(open) =>
          open
            ? refuelingDialog.openDialog(refuelingDialog.editingItem)
            : refuelingDialog.closeDialog()
        }
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleRefuelingSubmit} className="space-y-4">
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-4 pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle *</Label>
                  <Select
                    value={refuelingForm.vehicleId}
                    onValueChange={(value) =>
                      setRefuelingForm((prev) => ({ ...prev, vehicleId: value }))
                    }
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
                    date={refuelingForm.date ? new Date(refuelingForm.date) : undefined}
                    onSelect={(date) =>
                      setRefuelingForm((prev) => ({
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
                    value={refuelingForm.fuelType}
                    onValueChange={(value: VehicleRefueling['fuelType']) =>
                      setRefuelingForm((prev) => ({ ...prev, fuelType: value }))
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
                    value={refuelingForm.quantity}
                    onChange={(e) =>
                      setRefuelingForm((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    placeholder="50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost *</Label>
                  <Input
                    type="number"
                    value={refuelingForm.cost}
                    onChange={(e) =>
                      setRefuelingForm((prev) => ({ ...prev, cost: e.target.value }))
                    }
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
                    value={refuelingForm.odometerReading}
                    onChange={(e) =>
                      setRefuelingForm((prev) => ({ ...prev, odometerReading: e.target.value }))
                    }
                    placeholder="2480"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    value={refuelingForm.location}
                    onChange={(e) =>
                      setRefuelingForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="Site Fuel Station"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor *</Label>
                  <Input
                    value={refuelingForm.vendor}
                    onChange={(e) =>
                      setRefuelingForm((prev) => ({ ...prev, vendor: e.target.value }))
                    }
                    placeholder="BP Fuel Station"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice">Invoice Number *</Label>
                  <Input
                    value={refuelingForm.invoiceNumber}
                    onChange={(e) =>
                      setRefuelingForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))
                    }
                    placeholder="BP-001234"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  value={refuelingForm.notes}
                  onChange={(e) => setRefuelingForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => refuelingDialog.closeDialog()}>
              Cancel
            </Button>
            <Button type="submit">
              {refuelingDialog.isEditing ? 'Update Refueling' : 'Add Refueling'}
            </Button>
          </div>
        </form>
      </FormDialog>

      {/* Usage Dialog */}
      <FormDialog
        title={usageDialog.isEditing ? 'Edit Usage Record' : 'Add Usage Record'}
        description="Record vehicle usage details"
        isOpen={usageDialog.isDialogOpen}
        onOpenChange={(open) =>
          open ? usageDialog.openDialog(usageDialog.editingItem) : usageDialog.closeDialog()
        }
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleUsageSubmit} className="space-y-4">
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-4 pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle *</Label>
                  <Select
                    value={usageForm.vehicleId}
                    onValueChange={(value) =>
                      setUsageForm((prev) => ({ ...prev, vehicleId: value }))
                    }
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
                    date={usageForm.date ? new Date(usageForm.date) : undefined}
                    onSelect={(date) =>
                      setUsageForm((prev) => ({
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
                    value={usageForm.startTime}
                    onChange={(e) =>
                      setUsageForm((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    type="time"
                    value={usageForm.endTime}
                    onChange={(e) => setUsageForm((prev) => ({ ...prev, endTime: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startOdometer">Start Odometer *</Label>
                  <Input
                    type="number"
                    value={usageForm.startOdometer}
                    onChange={(e) =>
                      setUsageForm((prev) => ({ ...prev, startOdometer: e.target.value }))
                    }
                    placeholder="2480"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endOdometer">End Odometer *</Label>
                  <Input
                    type="number"
                    value={usageForm.endOdometer}
                    onChange={(e) =>
                      setUsageForm((prev) => ({ ...prev, endOdometer: e.target.value }))
                    }
                    placeholder="2490"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workDescription">Work Description *</Label>
                <Textarea
                  value={usageForm.workDescription}
                  onChange={(e) =>
                    setUsageForm((prev) => ({ ...prev, workDescription: e.target.value }))
                  }
                  placeholder="Describe the work performed..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workCategory">Work Category *</Label>
                  <Select
                    value={usageForm.workCategory}
                    onValueChange={(value: VehicleUsage['workCategory']) =>
                      setUsageForm((prev) => ({ ...prev, workCategory: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Construction">Construction</SelectItem>
                      <SelectItem value="Transport">Transport</SelectItem>
                      <SelectItem value="Delivery">Delivery</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site">Site *</Label>
                  <Select
                    value={usageForm.siteId}
                    onValueChange={(value) => setUsageForm((prev) => ({ ...prev, siteId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set(vehicles.map((vehicle) => vehicle.siteId))).map(
                        (siteId) => {
                          const siteName = vehicles.find(
                            (vehicle) => vehicle.siteId === siteId,
                          )?.siteName;
                          return (
                            <SelectItem key={siteId} value={siteId}>
                              {siteName}
                            </SelectItem>
                          );
                        },
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuelConsumed">Fuel Consumed (Liters) *</Label>
                  <Input
                    type="number"
                    value={usageForm.fuelConsumed}
                    onChange={(e) =>
                      setUsageForm((prev) => ({ ...prev, fuelConsumed: e.target.value }))
                    }
                    placeholder="40"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    value={usageForm.notes}
                    onChange={(e) => setUsageForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => usageDialog.closeDialog()}>
              Cancel
            </Button>
            <Button type="submit">
              <Activity className="h-4 w-4 mr-2" />
              {usageDialog.isEditing ? 'Update Usage Record' : 'Add Usage Record'}
            </Button>
          </div>
        </form>
      </FormDialog>
    </>
  );
}
