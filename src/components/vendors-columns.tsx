import { Building, Phone, Mail, Star, MoreHorizontal, Edit, Trash2 } from 'lucide-react';

import type { DataTableColumn } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Vendor {
  id: string;
  name: string;
  category: 'Materials' | 'Equipment' | 'Labour' | 'Transport' | 'Professional' | 'Other';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  panNumber: string;
  bankAccount: string;
  ifscCode: string;
  paymentTerms: string;
  rating: number;
  totalPaid: number;
  pendingAmount: number;
  lastPayment: string;
  status: 'active' | 'inactive' | 'blocked';
  registrationDate: string;
  notes: string;
}

export const getStatusColor = (status: Vendor['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    case 'blocked':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// behavior-preserving refactor: moved to DataTable columns
export const vendorColumns: DataTableColumn[] = [
  { key: 'name', label: 'Vendor Details', sortable: true },
  { key: 'contact', label: 'Contact', sortable: false },
  { key: 'totalPaid', label: 'Financial', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'rating', label: 'Rating', sortable: true },
];

export const createVendorTableData = (vendors: Vendor[]) => {
  return vendors.map((vendor) => ({
    name: (
      <div className="flex items-center gap-3">
        <Building className="h-4 w-4 text-blue-600" />
        <div>
          <div className="font-medium">{vendor.name}</div>
          <div className="text-sm text-gray-500">{vendor.category}</div>
        </div>
      </div>
    ),
    contact: (
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs">
          <Phone className="h-3 w-3" />
          {vendor.phone}
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Mail className="h-3 w-3" />
          {vendor.email}
        </div>
      </div>
    ),
    totalPaid: (
      <div className="space-y-1">
        <p className="text-sm font-medium">Paid: ₹{(vendor.totalPaid / 100000).toFixed(1)}L</p>
        <p className="text-sm text-orange-600">
          Pending: ₹{(vendor.pendingAmount / 1000).toFixed(0)}K
        </p>
      </div>
    ),
    status: <Badge className={getStatusColor(vendor.status)}>{vendor.status}</Badge>,
    rating: (
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 fill-current text-yellow-500" />
        <span className="text-sm font-medium">{vendor.rating.toFixed(1)}</span>
      </div>
    ),
  }));
};

export const createVendorActions = (
  onEdit: (vendor: Vendor) => void,
  onDelete: (vendor: Vendor) => void,
) => {
  const VendorActions = (vendor: Vendor) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(vendor)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Building className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(vendor)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  VendorActions.displayName = 'VendorActions';
  return VendorActions;
};
