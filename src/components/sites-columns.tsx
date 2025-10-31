import { Package, Truck, Fuel, Wrench, FileText, Eye, Download } from 'lucide-react';

import type { DataTableColumn } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export interface Site {
  id: string;
  name: string;
  location: string;
  startDate: string;
  expectedEndDate: string;
  status: 'Active' | 'Stopped' | 'Completed' | 'Canceled';
  budget: number;
  spent: number;
  description: string;
  progress: number;
}

export interface SiteExpense {
  id: string;
  siteId: string;
  category: 'Labour' | 'Materials' | 'Equipment' | 'Transport' | 'Utilities' | 'Other';
  description: string;
  amount: number;
  date: string;
  vendor: string;
  receipt: string;
}

export interface SiteDocument {
  id: string;
  siteId: string;
  name: string;
  type: 'drawings' | 'plans' | 'permits' | 'contracts' | 'reports' | 'other';
  uploadDate: string;
  size: string;
  uploadedBy: string;
}

export interface SiteLabour {
  id: string;
  siteId: string;
  name: string;
  age: number;
  contactNo: string;
  dailyWage: number;
  hourlyRate: number;
  daysWorked: number;
  hoursWorked: number;
  skillCategory:
    | 'Mason'
    | 'Helper'
    | 'Electrician'
    | 'Plumber'
    | 'Carpenter'
    | 'Operator'
    | 'Other';
  joinDate: string;
  status: 'active' | 'inactive';
}

export interface SiteVehicle {
  id: string;
  siteId: string;
  vehicleName: string;
  vehicleType:
    | 'Excavator'
    | 'Crane'
    | 'Truck'
    | 'Mixer'
    | 'JCB'
    | 'Loader'
    | 'Compactor'
    | 'Generator'
    | 'Other';
  registrationNumber: string;
  operator: string;
  rentalCostPerDay: number;
  fuelCostPerDay: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalCost: number;
  vendor: string;
  status: 'active' | 'maintenance' | 'idle' | 'returned';
  fuelConsumed: number;
  lastMaintenanceDate: string;
}

export const getStatusColor = (status: Site['status']) => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Completed':
      return 'bg-blue-100 text-blue-800';
    case 'Stopped':
      return 'bg-orange-100 text-orange-800';
    case 'Canceled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getVehicleStatusColor = (status: SiteVehicle['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800';
    case 'idle':
      return 'bg-gray-100 text-gray-800';
    case 'returned':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// behavior-preserving refactor: moved to DataTable columns
export const materialColumns: DataTableColumn[] = [
  { key: 'material', label: 'Material', sortable: true },
  { key: 'quantity', label: 'Quantity', sortable: true },
  { key: 'cost', label: 'Cost', sortable: true },
  { key: 'supplier', label: 'Supplier', sortable: true },
  { key: 'usage', label: 'Usage', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
];

export const vehicleColumns: DataTableColumn[] = [
  { key: 'vehicle', label: 'Vehicle/Equipment', sortable: true },
  { key: 'operator', label: 'Operator', sortable: true },
  { key: 'costDetails', label: 'Cost Details', sortable: false },
  { key: 'duration', label: 'Duration', sortable: true },
  { key: 'totalCost', label: 'Total Cost', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

export const documentColumns: DataTableColumn[] = [
  { key: 'document', label: 'Document', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'size', label: 'Size', sortable: true },
  { key: 'uploadDate', label: 'Upload Date', sortable: true },
  { key: 'uploadedBy', label: 'Uploaded By', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
];

export const expenseColumns: DataTableColumn[] = [
  { key: 'category', label: 'Category', sortable: true },
  { key: 'description', label: 'Description', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'vendor', label: 'Vendor', sortable: true },
  { key: 'receipt', label: 'Receipt', sortable: true },
];

export const labourColumns: DataTableColumn[] = [
  { key: 'workerDetails', label: 'Worker Details', sortable: true },
  { key: 'contact', label: 'Contact', sortable: true },
  { key: 'rates', label: 'Rates', sortable: false },
  { key: 'workDone', label: 'Work Done', sortable: false },
  { key: 'wagesOwed', label: 'Wages Owed', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

type MaterialData = {
  materialName: string;
  category: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  vendor?: string;
  consumedQuantity?: number;
  remainingQuantity?: number;
};

export const createMaterialTableData = (materials: MaterialData[]) => {
  return materials.map((material) => ({
    material: (
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Package className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{material.materialName}</p>
          <p className="text-sm text-gray-600">{material.category}</p>
        </div>
      </div>
    ),
    quantity: (
      <div>
        <p className="font-medium text-gray-900">
          {material.quantity} {material.unit}
        </p>
        <p className="text-sm text-gray-600">
          ₹{material.costPerUnit}/{material.unit}
        </p>
      </div>
    ),
    cost: (
      <p className="font-semibold text-gray-900">
        ₹{(material.quantity * material.costPerUnit).toLocaleString()}
      </p>
    ),
    supplier: <span className="text-gray-900">{material.vendor}</span>,
    usage: (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Used: {material.consumedQuantity}</span>
          <span className="text-gray-600">Left: {material.remainingQuantity}</span>
        </div>
        <div className="space-y-1">
          <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
            {Array.from({ length: 13 }, (_, index) => {
              const isUnusedSegment = index === 12;

              const monthColors = [
                'bg-red-500',
                'bg-orange-500',
                'bg-yellow-500',
                'bg-green-500',
                'bg-blue-500',
                'bg-indigo-500',
                'bg-purple-500',
                'bg-pink-500',
                'bg-teal-500',
                'bg-cyan-500',
                'bg-lime-500',
                'bg-amber-500',
              ];

              const segmentColor = isUnusedSegment ? 'bg-gray-300' : monthColors[index];
              const segmentWidth = isUnusedSegment
                ? `${((material.remainingQuantity ?? 0) / material.quantity) * 100}%`
                : `${((material.consumedQuantity ?? 0) / material.quantity / 12) * 100}%`;

              return (
                <div
                  key={index}
                  className={`${segmentColor} transition-all duration-200 hover:opacity-80`}
                  style={{ width: segmentWidth }}
                  title={
                    isUnusedSegment
                      ? `Unused: ${material.remainingQuantity ?? 0} ${material.unit}`
                      : `Month ${index + 1}: ${Math.round((material.consumedQuantity ?? 0) / 12)} ${material.unit}`
                  }
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Monthly Usage Distribution</span>
            <span>
              {(((material.consumedQuantity ?? 0) / material.quantity) * 100).toFixed(1)}% used
            </span>
          </div>
        </div>
      </div>
    ),
    status: (
      <Badge
        variant={(material.remainingQuantity ?? 0) > 0 ? 'default' : 'secondary'}
        className="text-sm px-3 py-1"
      >
        {(material.remainingQuantity ?? 0) > 0 ? 'Available' : 'Consumed'}
      </Badge>
    ),
  }));
};

export const createVehicleTableData = (vehicles: SiteVehicle[]) => {
  return vehicles.map((vehicle) => ({
    vehicle: (
      <div>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{vehicle.vehicleName}</p>
            <p className="text-xs text-muted-foreground">{vehicle.vehicleType}</p>
            <p className="text-xs text-muted-foreground">{vehicle.registrationNumber}</p>
          </div>
        </div>
      </div>
    ),
    operator: (
      <div>
        <p className="font-medium">{vehicle.operator}</p>
        <p className="text-xs text-muted-foreground">{vehicle.vendor}</p>
      </div>
    ),
    costDetails: (
      <div className="space-y-1">
        <p className="text-xs">Rental: ₹{vehicle.rentalCostPerDay}/day</p>
        <p className="text-xs">Fuel: ₹{vehicle.fuelCostPerDay}/day</p>
        <div className="flex items-center gap-1">
          <Fuel className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs">₹{vehicle.fuelConsumed.toLocaleString()}</span>
        </div>
      </div>
    ),
    duration: (
      <div>
        <p className="font-medium">{vehicle.totalDays} days</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(vehicle.startDate)} - {formatDate(vehicle.endDate)}
        </p>
      </div>
    ),
    totalCost: <p className="font-medium">₹{vehicle.totalCost.toLocaleString()}</p>,
    status: (
      <div className="space-y-1">
        <Badge className={getVehicleStatusColor(vehicle.status)}>{vehicle.status}</Badge>
        <div className="flex items-center gap-1">
          <Wrench className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs">{formatDate(vehicle.lastMaintenanceDate)}</span>
        </div>
      </div>
    ),
  }));
};

export const createDocumentTableData = (documents: SiteDocument[]) => {
  return documents.map((document) => ({
    document: (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{document.name}</span>
      </div>
    ),
    type: <Badge variant="outline">{document.type}</Badge>,
    size: document.size,
    uploadDate: formatDate(document.uploadDate),
    uploadedBy: document.uploadedBy,
    actions: (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    ),
  }));
};

export const createExpenseTableData = (expenses: SiteExpense[]) => {
  return expenses.map((expense) => ({
    category: <Badge variant="outline">{expense.category}</Badge>,
    description: expense.description,
    amount: <span className="font-medium">₹{expense.amount.toLocaleString()}</span>,
    date: formatDate(expense.date),
    vendor: expense.vendor,
    receipt: expense.receipt,
  }));
};

export const createLabourTableData = (labour: SiteLabour[]) => {
  const calculateWagesOwed = (labour: SiteLabour) => {
    return labour.daysWorked * labour.dailyWage + labour.hoursWorked * labour.hourlyRate;
  };

  return labour.map((worker) => ({
    workerDetails: (
      <div>
        <p className="font-medium">{worker.name}</p>
        <p className="text-xs text-muted-foreground">{worker.skillCategory}</p>
        <p className="text-xs text-muted-foreground">Age: {worker.age}</p>
      </div>
    ),
    contact: worker.contactNo,
    rates: (
      <div className="space-y-1">
        <p className="text-xs">Daily: ₹{worker.dailyWage}</p>
        <p className="text-xs">Hourly: ₹{worker.hourlyRate}</p>
      </div>
    ),
    workDone: (
      <div className="space-y-1">
        <p className="text-xs">{worker.daysWorked} days</p>
        <p className="text-xs">{worker.hoursWorked} hours</p>
      </div>
    ),
    wagesOwed: <span className="font-medium">₹{calculateWagesOwed(worker).toLocaleString()}</span>,
    status: (
      <Badge variant={worker.status === 'active' ? 'default' : 'secondary'}>{worker.status}</Badge>
    ),
  }));
};
