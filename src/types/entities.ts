/**
 * Core entity types for Gavith Build
 * All entities are tenant-scoped via organizationId
 */

/**
 * Organization entity
 */
export interface Organization {
  id: string;
  name: string;
  isActive: boolean;
  subscription?: 'free' | 'basic' | 'premium' | 'enterprise';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * User entity with organization context
 */
export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'user';
  organizationId: string;
  organizationRole:
    | 'owner'
    | 'admin'
    | 'manager'
    | 'user'
    | 'project-manager'
    | 'site-supervisor'
    | 'materials-manager'
    | 'finance-manager'
    | 'executive';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User with populated organization data
 */
export interface UserWithOrganization extends User {
  organization: Organization;
}

/**
 * Site entity for construction projects
 */
export interface Site {
  id: string;
  name: string;
  location: string;
  status: 'Active' | 'Stopped' | 'Completed' | 'Canceled';
  startDate: string;
  expectedEndDate?: string;
  endDate?: string;
  budget: number;
  spent: number;
  description?: string;
  progress: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  managerId?: string;
  imageUrl?: string;
}

/**
 * Material Master entity
 * Represents the catalog of materials available in the system
 */
export interface MaterialMaster {
  id: string;
  name: string;
  category:
    | 'Cement'
    | 'Steel'
    | 'Concrete'
    | 'Bricks'
    | 'Sand'
    | 'Aggregate'
    | 'Timber'
    | 'Electrical'
    | 'Plumbing'
    | 'Paint'
    | 'Other';
  unit: string;
  siteId?: string | null;
  siteName?: string | null;
  quantity: number;
  consumedQuantity: number;
  standardRate: number;
  isActive: boolean;
  hsn: string;
  taxRate: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  createdDate: string;
  lastUpdated: string;
  openingBalance?: number | null;
  siteAllocations?: Array<{ siteId: string; siteName: string; quantity: number }>;
}

/**
 * Material Purchase entity
 * Represents actual purchases of materials
 */
export interface MaterialPurchase {
  id: string;
  materialId: string;
  materialName: string;
  siteId?: string;
  siteName?: string;
  quantity: number;
  unit: string;
  unitRate: number;
  totalAmount: number;
  vendorInvoiceNumber: string;
  vendorName?: string;
  purchaseDate: string;
  filledWeight?: number;
  emptyWeight?: number;
  netWeight?: number;
  weightUnit?: string;
  consumedQuantity?: number;
  remainingQuantity?: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Material Receipt entity
 * Represents physical receipt of materials at site
 */
export interface MaterialReceipt {
  id: string;
  date: string;
  vehicleNumber: string;
  materialId: string;
  materialName: string;
  filledWeight: number;
  emptyWeight: number;
  netWeight: number;
  vendorId?: string | null;
  vendorName?: string | null;
  linkedPurchaseId?: string | null;
  siteId?: string;
  siteName?: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Work Progress entry with materials consumed
 */
export interface WorkProgressMaterial {
  id: string;
  workProgressId: string;
  materialId?: string | null;
  purchaseId?: string | null;
  materialName: string;
  unit: string;
  quantity: number;
  balanceQuantity?: number | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkProgressEntry {
  id: string;
  organizationId: string;
  siteId?: string | null;
  siteName: string;
  workType: string;
  description?: string;
  workDate: string;
  unit: string;
  length?: number | null;
  breadth?: number | null;
  thickness?: number | null;
  totalQuantity: number;
  laborHours: number;
  progressPercentage: number;
  status: 'in_progress' | 'completed' | 'on_hold';
  notes?: string | null;
  photos: string[];
  materials: WorkProgressMaterial[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

/**
 * Vehicle entity
 */
export interface Vehicle {
  id: string;
  vehicleNumber: string;
  name?: string;
  type: string;
  make?: string;
  model?: string;
  year?: number;
  status: 'available' | 'in_use' | 'maintenance' | 'idle' | 'returned';
  siteId?: string | null;
  siteName?: string | null;
  operator?: string | null;
  isRental: boolean;
  vendor?: string | null;
  rentalCostPerDay?: number | null;
  rentalStartDate?: string | null;
  rentalEndDate?: string | null;
  totalRentalDays?: number | null;
  totalRentalCost?: number | null;
  fuelCapacity?: number | null;
  currentFuelLevel?: number | null;
  mileage?: number | null;
  lastMaintenanceDate?: string | null;
  nextMaintenanceDate?: string | null;
  insuranceExpiry?: string | null;
  registrationExpiry?: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface VehicleUsage {
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
  workCategory: 'construction' | 'transport' | 'delivery' | 'maintenance' | 'inspection' | 'other';
  siteId: string;
  siteName: string;
  operator: string;
  fuelConsumed: number;
  isRental: boolean;
  rentalCost?: number | null;
  vendor?: string | null;
  status: 'In Progress' | 'Completed' | 'Cancelled';
  notes?: string | null;
  recordedBy: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleRefueling {
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
  receiptUrl?: string | null;
  notes?: string | null;
  recordedBy: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vendor entity
 */
export interface Vendor {
  id: string;
  name: string;
  category: 'Materials' | 'Equipment' | 'Labour' | 'Transport' | 'Professional' | 'Other';
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
  panNumber?: string;
  bankAccount?: string;
  ifscCode?: string;
  paymentTerms?: string;
  rating?: number;
  totalPaid?: number;
  pendingAmount?: number;
  lastPayment?: string;
  status: 'active' | 'inactive' | 'blocked';
  registrationDate?: string;
  notes?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Expense entity
 */
export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'Labour' | 'Materials' | 'Equipment' | 'Transport' | 'Utilities' | 'Other';
  subcategory?: string;
  date: string;
  vendor?: string;
  siteId?: string;
  siteName?: string;
  receipt?: string;
  status: 'paid' | 'pending' | 'overdue';
  approvedBy?: string;
  approvedByName?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown; // Index signature for DataTable compatibility
}

/**
 * Payment entity
 */
export interface Payment {
  id: string;
  clientName: string;
  amount: number;
  status: 'pending' | 'completed' | 'overdue';
  dueDate?: string;
  paidDate?: string;
  siteId?: string;
  siteName?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Project Activity entity
 */
export interface ProjectActivity {
  id: string;
  siteId: string;
  siteName: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  duration: number;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed';
  dependencies: string[];
  assignedTeam: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'Foundation' | 'Structure' | 'MEP' | 'Finishing' | 'External';
  resources: string[];
  milestones: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Project Milestone entity
 */
export interface ProjectMilestone {
  id: string;
  siteId: string;
  siteName?: string | null;
  name: string;
  date: string;
  description: string;
  status: 'pending' | 'achieved';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Site Labour entity
 */
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
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Site Vehicle entity
 */
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
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Site Document entity
 */
export interface SiteDocument {
  id: string;
  siteId: string;
  name: string;
  type: 'drawings' | 'plans' | 'permits' | 'contracts' | 'reports' | 'other';
  uploadDate: string;
  size: string;
  uploadedBy: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Site Expense entity (site-specific expense tracking)
 */
export interface SiteExpense {
  id: string;
  siteId: string;
  category: 'Labour' | 'Materials' | 'Equipment' | 'Transport' | 'Utilities' | 'Other';
  description: string;
  amount: number;
  date: string;
  vendor: string;
  receipt: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
