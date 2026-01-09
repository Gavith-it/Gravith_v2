'use client';

import {
  Plus,
  Fuel,
  Activity,
  Calendar,
  BarChart as BarChartIcon,
  Truck,
  Edit,
  Trash2,
  Filter,
  RotateCcw,
  Eye,
  MapPin,
  User,
  Clock,
  Shield,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { fetcher, swrConfig } from '../lib/swr';

import { FilterSheet } from '@/components/filters/FilterSheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useVehicleRefueling, useVehicles, useVehicleUsage, useVendors } from '@/lib/contexts';
import { useDialogState } from '@/lib/hooks/useDialogState';
import { formatDateShort } from '@/lib/utils';
import { formatDateOnly, parseDateOnly } from '@/lib/utils/date';
import type {
  Vehicle as VehicleEntity,
  VehicleRefueling as VehicleRefuelingEntity,
  VehicleUsage as VehicleUsageEntity,
} from '@/types/entities';

type Vehicle = VehicleEntity;
type VehicleRefueling = VehicleRefuelingEntity;
type VehicleUsage = VehicleUsageEntity;

const VEHICLE_TYPE_OPTIONS: string[] = [
  'truck',
  'excavator',
  'crane',
  'mixer',
  'jcb',
  'loader',
  'compactor',
  'generator',
  'other',
];

const VEHICLE_STATUS_OPTIONS: Vehicle['status'][] = [
  'available',
  'in_use',
  'maintenance',
  'idle',
  'returned',
];

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
  operator: string;
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
  workCategory: 'transport',
  siteId: '',
  operator: '',
  notes: '',
};

export function VehiclesPage({
  selectedVehicle: propSelectedVehicle,
  onVehicleSelect,
}: VehicleManagementProps) {
  const {
    vehicles,
    isLoading: isVehiclesLoading,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    refresh,
    pagination,
  } = useVehicles();
  const { vendors } = useVendors();

  const {
    records: refuelingRecords,
    isLoading: isRefuelingLoading,
    addRecord: createRefuelingRecord,
    updateRecord: editRefuelingRecord,
    deleteRecord: removeRefuelingRecord,
  } = useVehicleRefueling();

  const {
    records: usageRecords,
    isLoading: isUsageLoading,
    addRecord: createUsageRecord,
    updateRecord: editUsageRecord,
    deleteRecord: removeUsageRecord,
    refresh: refreshUsageRecords,
  } = useVehicleUsage();

  const [selectedVehicle, setSelectedVehicle] = useState<string>(propSelectedVehicle || '');
  const [activeTab, setActiveTab] = useState('refueling');
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [isVehicleDetailsDialogOpen, setIsVehicleDetailsDialogOpen] = useState(false);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);
  const [isSavingRefueling, setIsSavingRefueling] = useState(false);
  const [isSavingUsage, setIsSavingUsage] = useState(false);
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(50);

  // Fetch sites using SWR
  const { data: sitesData, isLoading: isSitesLoading } = useSWR<{
    sites: Array<{ id: string; name?: string | null }>;
  }>('/api/sites', fetcher, swrConfig);

  // Normalize and sort site options
  const siteOptions = useMemo(() => {
    if (!sitesData?.sites) return [];
    const normalized = sitesData.sites.map((site) => ({
      id: site.id,
      name: site.name?.trim() || 'Unnamed site',
    }));
    normalized.sort((a, b) => a.name.localeCompare(b.name));
    return normalized;
  }, [sitesData]);

  // Fetch vehicles with pagination - only when page changes
  useEffect(() => {
    // Only refresh if pagination state doesn't match current page/limit
    // This prevents duplicate calls when context already has the correct data
    const needsRefresh = !pagination || pagination.page !== page || pagination.limit !== limit;
    if (needsRefresh) {
      void refresh(page, limit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]); // Only depend on page/limit, refresh is stable from context

  const vendorOptions = useMemo(() => {
    return vendors
      .map((vendor) => vendor.name?.trim())
      .filter((name): name is string => Boolean(name && name.length > 0))
      .sort((a, b) => a.localeCompare(b));
  }, [vendors]);

  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: '',
    type: VEHICLE_TYPE_OPTIONS[0],
    status: 'available' as Vehicle['status'],
    isRental: false,
    vendor: '',
    rentalCostPerDay: '',
    make: '',
    model: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
  });

  const refuelingDialog = useDialogState<VehicleRefueling>();
  const usageDialog = useDialogState<VehicleUsage>();
  const [isRefuelingFilterSheetOpen, setIsRefuelingFilterSheetOpen] = useState(false);
  const [isUsageFilterSheetOpen, setIsUsageFilterSheetOpen] = useState(false);

  type RefuelingAdvancedFilterState = {
    vehicles: string[];
    fuelTypes: Array<VehicleRefueling['fuelType']>;
    vendors: string[];
    locations: string[];
    dateFrom?: string;
    dateTo?: string;
    quantityMin: string;
    quantityMax: string;
    costMin: string;
    costMax: string;
    hasInvoice: 'all' | 'with' | 'without';
  };

  const createDefaultRefuelingAdvancedFilters = (): RefuelingAdvancedFilterState => ({
    vehicles: [],
    fuelTypes: [],
    vendors: [],
    locations: [],
    dateFrom: undefined,
    dateTo: undefined,
    quantityMin: '',
    quantityMax: '',
    costMin: '',
    costMax: '',
    hasInvoice: 'all',
  });

  type UsageAdvancedFilterState = {
    vehicles: string[];
    sites: string[];
    categories: Array<VehicleUsage['workCategory']>;
    statuses: Array<VehicleUsage['status']>;
    dateFrom?: string;
    dateTo?: string;
    distanceMin: string;
    distanceMax: string;
    fuelMin: string;
    fuelMax: string;
    rentalType: 'all' | 'rental' | 'owned';
  };

  const createDefaultUsageAdvancedFilters = (): UsageAdvancedFilterState => ({
    vehicles: [],
    sites: [],
    categories: [],
    statuses: [],
    dateFrom: undefined,
    dateTo: undefined,
    distanceMin: '',
    distanceMax: '',
    fuelMin: '',
    fuelMax: '',
    rentalType: 'all',
  });

  const [appliedRefuelingFilters, setAppliedRefuelingFilters] =
    useState<RefuelingAdvancedFilterState>(createDefaultRefuelingAdvancedFilters());
  const [draftRefuelingFilters, setDraftRefuelingFilters] = useState<RefuelingAdvancedFilterState>(
    createDefaultRefuelingAdvancedFilters(),
  );

  const [appliedUsageFilters, setAppliedUsageFilters] = useState<UsageAdvancedFilterState>(
    createDefaultUsageAdvancedFilters(),
  );
  const [draftUsageFilters, setDraftUsageFilters] = useState<UsageAdvancedFilterState>(
    createDefaultUsageAdvancedFilters(),
  );

  const cloneRefuelingAdvancedFilters = (
    filters: RefuelingAdvancedFilterState,
  ): RefuelingAdvancedFilterState => ({
    ...filters,
    vehicles: [...filters.vehicles],
    fuelTypes: [...filters.fuelTypes],
    vendors: [...filters.vendors],
    locations: [...filters.locations],
  });

  const cloneUsageAdvancedFilters = (
    filters: UsageAdvancedFilterState,
  ): UsageAdvancedFilterState => ({
    ...filters,
    vehicles: [...filters.vehicles],
    sites: [...filters.sites],
    categories: [...filters.categories],
    statuses: [...filters.statuses],
  });

  const countRefuelingFilters = (filters: RefuelingAdvancedFilterState): number => {
    let count = 0;
    count += filters.vehicles.length;
    count += filters.fuelTypes.length;
    count += filters.vendors.length;
    count += filters.locations.length;
    if (filters.dateFrom || filters.dateTo) count += 1;
    if (filters.quantityMin !== '' || filters.quantityMax !== '') count += 1;
    if (filters.costMin !== '' || filters.costMax !== '') count += 1;
    if (filters.hasInvoice !== 'all') count += 1;
    return count;
  };

  const countUsageFilters = (filters: UsageAdvancedFilterState): number => {
    let count = 0;
    count += filters.vehicles.length;
    count += filters.sites.length;
    count += filters.categories.length;
    count += filters.statuses.length;
    if (filters.dateFrom || filters.dateTo) count += 1;
    if (filters.distanceMin !== '' || filters.distanceMax !== '') count += 1;
    if (filters.fuelMin !== '' || filters.fuelMax !== '') count += 1;
    if (filters.rentalType !== 'all') count += 1;
    return count;
  };

  const parseDateValue = (value?: string): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const parseNumber = (value: string): number | undefined => {
    if (value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const refuelingFilterOptions = useMemo(() => {
    const vehicleNumbers = new Set<string>();
    const fuelTypes = new Set<VehicleRefueling['fuelType']>();
    const vendors = new Set<string>();
    const locations = new Set<string>();

    refuelingRecords.forEach((record) => {
      if (record.vehicleNumber) vehicleNumbers.add(record.vehicleNumber);
      if (record.fuelType) fuelTypes.add(record.fuelType);
      if (record.vendor) vendors.add(record.vendor);
      if (record.location) locations.add(record.location);
    });

    return {
      vehicles: Array.from(vehicleNumbers).sort((a, b) => a.localeCompare(b)),
      fuelTypes: Array.from(fuelTypes).sort((a, b) => a.localeCompare(b)),
      vendors: Array.from(vendors).sort((a, b) => a.localeCompare(b)),
      locations: Array.from(locations).sort((a, b) => a.localeCompare(b)),
    };
  }, [refuelingRecords]);

  const usageFilterOptions = useMemo(() => {
    const vehicleNumbers = new Set<string>();
    const sites = new Set<string>();
    const categories = new Set<VehicleUsage['workCategory']>();
    const statuses = new Set<VehicleUsage['status']>();

    usageRecords.forEach((record) => {
      if (record.vehicleNumber) vehicleNumbers.add(record.vehicleNumber);
      if (record.siteName) sites.add(record.siteName);
      if (record.workCategory) categories.add(record.workCategory);
      if (record.status) statuses.add(record.status);
    });

    return {
      vehicles: Array.from(vehicleNumbers).sort((a, b) => a.localeCompare(b)),
      sites: Array.from(sites).sort((a, b) => a.localeCompare(b)),
      categories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
      statuses: Array.from(statuses).sort((a, b) => a.localeCompare(b)),
    };
  }, [usageRecords]);

  const filteredRefuelingRecords = useMemo(() => {
    const dateFrom = parseDateValue(appliedRefuelingFilters.dateFrom);
    const dateTo = parseDateValue(appliedRefuelingFilters.dateTo);
    const quantityMin = parseNumber(appliedRefuelingFilters.quantityMin);
    const quantityMax = parseNumber(appliedRefuelingFilters.quantityMax);
    const costMin = parseNumber(appliedRefuelingFilters.costMin);
    const costMax = parseNumber(appliedRefuelingFilters.costMax);

    return refuelingRecords.filter((record) => {
      const matchesVehicle =
        appliedRefuelingFilters.vehicles.length === 0 ||
        appliedRefuelingFilters.vehicles.includes(record.vehicleNumber);
      const matchesFuelType =
        appliedRefuelingFilters.fuelTypes.length === 0 ||
        appliedRefuelingFilters.fuelTypes.includes(record.fuelType);
      const matchesVendor =
        appliedRefuelingFilters.vendors.length === 0 ||
        appliedRefuelingFilters.vendors.includes(record.vendor);
      const matchesLocation =
        appliedRefuelingFilters.locations.length === 0 ||
        (record.location && appliedRefuelingFilters.locations.includes(record.location));
      const recordDate = parseDateValue(record.date);
      const matchesDateFrom = !dateFrom || (recordDate !== null && recordDate >= dateFrom);
      const matchesDateTo = !dateTo || (recordDate !== null && recordDate <= dateTo);
      const matchesQuantityMin =
        quantityMin === undefined || Number.isNaN(quantityMin) || record.quantity >= quantityMin;
      const matchesQuantityMax =
        quantityMax === undefined || Number.isNaN(quantityMax) || record.quantity <= quantityMax;
      const matchesCostMin =
        costMin === undefined || Number.isNaN(costMin) || record.cost >= costMin;
      const matchesCostMax =
        costMax === undefined || Number.isNaN(costMax) || record.cost <= costMax;
      const hasInvoice = Boolean(record.invoiceNumber && record.invoiceNumber.trim() !== '');
      const matchesInvoice =
        appliedRefuelingFilters.hasInvoice === 'all' ||
        (appliedRefuelingFilters.hasInvoice === 'with' && hasInvoice) ||
        (appliedRefuelingFilters.hasInvoice === 'without' && !hasInvoice);

      return (
        matchesVehicle &&
        matchesFuelType &&
        matchesVendor &&
        matchesLocation &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesQuantityMin &&
        matchesQuantityMax &&
        matchesCostMin &&
        matchesCostMax &&
        matchesInvoice
      );
    });
  }, [refuelingRecords, appliedRefuelingFilters]);

  const filteredUsageRecords = useMemo(() => {
    const dateFrom = parseDateValue(appliedUsageFilters.dateFrom);
    const dateTo = parseDateValue(appliedUsageFilters.dateTo);
    const distanceMin = parseNumber(appliedUsageFilters.distanceMin);
    const distanceMax = parseNumber(appliedUsageFilters.distanceMax);
    const fuelMin = parseNumber(appliedUsageFilters.fuelMin);
    const fuelMax = parseNumber(appliedUsageFilters.fuelMax);

    return usageRecords.filter((record) => {
      const matchesVehicle =
        appliedUsageFilters.vehicles.length === 0 ||
        appliedUsageFilters.vehicles.includes(record.vehicleNumber);
      const matchesSite =
        appliedUsageFilters.sites.length === 0 ||
        appliedUsageFilters.sites.includes(record.siteName);
      const matchesCategory =
        appliedUsageFilters.categories.length === 0 ||
        appliedUsageFilters.categories.includes(record.workCategory);
      const matchesStatus =
        appliedUsageFilters.statuses.length === 0 ||
        appliedUsageFilters.statuses.includes(record.status);
      const usageDate = parseDateValue(record.date);
      const matchesDateFrom = !dateFrom || (usageDate !== null && usageDate >= dateFrom);
      const matchesDateTo = !dateTo || (usageDate !== null && usageDate <= dateTo);
      const matchesDistanceMin =
        distanceMin === undefined ||
        Number.isNaN(distanceMin) ||
        record.totalDistance >= distanceMin;
      const matchesDistanceMax =
        distanceMax === undefined ||
        Number.isNaN(distanceMax) ||
        record.totalDistance <= distanceMax;
      const matchesFuelMin =
        fuelMin === undefined ||
        Number.isNaN(fuelMin) ||
        (record.fuelConsumed != null && record.fuelConsumed >= fuelMin);
      const matchesFuelMax =
        fuelMax === undefined ||
        Number.isNaN(fuelMax) ||
        (record.fuelConsumed != null && record.fuelConsumed <= fuelMax);
      const matchesRental =
        appliedUsageFilters.rentalType === 'all' ||
        (appliedUsageFilters.rentalType === 'rental' && record.isRental) ||
        (appliedUsageFilters.rentalType === 'owned' && !record.isRental);

      return (
        matchesVehicle &&
        matchesSite &&
        matchesCategory &&
        matchesStatus &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesDistanceMin &&
        matchesDistanceMax &&
        matchesFuelMin &&
        matchesFuelMax &&
        matchesRental
      );
    });
  }, [usageRecords, appliedUsageFilters]);

  const activeRefuelingFilterCount = useMemo(
    () => countRefuelingFilters(appliedRefuelingFilters),
    [appliedRefuelingFilters],
  );
  const hasActiveRefuelingFilters = activeRefuelingFilterCount > 0;

  const activeUsageFilterCount = useMemo(
    () => countUsageFilters(appliedUsageFilters),
    [appliedUsageFilters],
  );
  const hasActiveUsageFilters = activeUsageFilterCount > 0;

  const resetRefuelingForm = useCallback(() => {
    setRefuelingForm({
      ...emptyRefuelingFormState,
      vehicleId: selectedVehicle || '',
    });
  }, [selectedVehicle]);

  const resetUsageForm = useCallback(() => {
    const vehicle = vehicles.find((v) => v.id === selectedVehicle);
    setUsageForm({
      ...emptyUsageFormState,
      vehicleId: selectedVehicle || '',
      siteId: vehicle?.siteId || '',
      operator: vehicle?.operator || '',
    });
  }, [selectedVehicle, vehicles]);

  // Update selectedVehicle when prop changes
  useEffect(() => {
    if (propSelectedVehicle) {
      setSelectedVehicle(propSelectedVehicle);
    }
  }, [propSelectedVehicle]);

  useEffect(() => {
    if (vehicles.length === 0) {
      if (selectedVehicle) {
        setSelectedVehicle('');
        onVehicleSelect?.('');
      }
      return;
    }

    if (!selectedVehicle || !vehicles.some((vehicle) => vehicle.id === selectedVehicle)) {
      const nextId =
        propSelectedVehicle && vehicles.some((v) => v.id === propSelectedVehicle)
          ? propSelectedVehicle
          : vehicles[0].id;
      setSelectedVehicle(nextId);
      onVehicleSelect?.(nextId);
    }
  }, [vehicles, selectedVehicle, onVehicleSelect, propSelectedVehicle]);

  useEffect(() => {
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
        // location field removed - not used in form
        vendor: item.vendor,
        invoiceNumber: item.invoiceNumber,
        notes: item.notes ?? '',
      });
    } else {
      resetRefuelingForm();
    }
  }, [refuelingDialog.isDialogOpen, refuelingDialog.editingItem, resetRefuelingForm]);

  useEffect(() => {
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
        operator: item.operator,
        // fuelConsumed field removed - not used in form
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
  const activeVehicles = vehicles.filter((v) => ['available', 'in_use'].includes(v.status)).length;
  const totalFuelCost = refuelingRecords.reduce((sum, record) => sum + record.cost, 0);
  const totalDistanceTravelled = usageRecords.reduce(
    (sum, record) => sum + record.totalDistance,
    0,
  );
  const totalFuelConsumed = usageRecords.reduce(
    (sum, record) => sum + (record.fuelConsumed ?? 0),
    0,
  );
  const averageFuelEfficiency =
    totalFuelConsumed > 0 ? totalDistanceTravelled / totalFuelConsumed : 0;

  const currentVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicle);

  const vehicleSiteOptions = siteOptions;

  const handleViewVehicleDetails = useCallback((vehicle: Vehicle) => {
    setViewingVehicle(vehicle);
    setIsVehicleDetailsDialogOpen(true);
  }, []);

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in_use':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'idle':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'returned':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatStatus = (status: Vehicle['status']) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Handle scroll position checks
  const checkScrollButtons = useCallback(() => {
    if (!scrollContainerRef) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, [scrollContainerRef]);

  useEffect(() => {
    if (!scrollContainerRef) return;
    checkScrollButtons();
    const container = scrollContainerRef;
    container.addEventListener('scroll', checkScrollButtons);
    window.addEventListener('resize', checkScrollButtons);
    return () => {
      container.removeEventListener('scroll', checkScrollButtons);
      window.removeEventListener('resize', checkScrollButtons);
    };
  }, [scrollContainerRef, checkScrollButtons]);

  // Scroll to selected vehicle
  useEffect(() => {
    if (!scrollContainerRef || !selectedVehicle) return;
    const selectedCard = scrollContainerRef.querySelector(
      `[data-vehicle-id="${selectedVehicle}"]`,
    ) as HTMLElement;
    if (selectedCard) {
      selectedCard.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedVehicle, scrollContainerRef]);

  const scrollLeft = useCallback(() => {
    if (!scrollContainerRef) return;
    scrollContainerRef.scrollBy({
      left: -320,
      behavior: 'smooth',
    });
  }, [scrollContainerRef]);

  const scrollRight = useCallback(() => {
    if (!scrollContainerRef) return;
    scrollContainerRef.scrollBy({
      left: 320,
      behavior: 'smooth',
    });
  }, [scrollContainerRef]);

  const resetVehicleForm = useCallback(() => {
    setVehicleForm({
      vehicleNumber: '',
      type: VEHICLE_TYPE_OPTIONS[0],
      status: 'available',
      isRental: false,
      vendor: '',
      rentalCostPerDay: '',
      make: '',
      model: '',
      lastMaintenanceDate: '',
      nextMaintenanceDate: '',
    });
    setEditingVehicle(null);
  }, []);

  const handleVehicleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!vehicleForm.vehicleNumber.trim()) {
      toast.error('Vehicle number is required.');
      return;
    }

    if (vehicleForm.isRental && !vehicleForm.rentalCostPerDay.trim()) {
      toast.error('Rental cost per day is required for rental vehicles.');
      return;
    }

    if (
      vehicleForm.isRental &&
      vehicleForm.rentalCostPerDay.trim() &&
      (isNaN(parseFloat(vehicleForm.rentalCostPerDay)) ||
        parseFloat(vehicleForm.rentalCostPerDay) <= 0)
    ) {
      toast.error('Rental cost per day must be a positive number.');
      return;
    }

    setIsSavingVehicle(true);
    try {
      const rentalCostPerDayValue = vehicleForm.rentalCostPerDay
        ? parseFloat(vehicleForm.rentalCostPerDay)
        : null;
      const rentalCostPerDay =
        rentalCostPerDayValue && !isNaN(rentalCostPerDayValue) ? rentalCostPerDayValue : null;

      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, {
          vehicleNumber: vehicleForm.vehicleNumber.trim(),
          type: vehicleForm.type,
          status: vehicleForm.status,
          isRental: vehicleForm.isRental,
          vendor: vehicleForm.vendor.trim() || null,
          rentalCostPerDay: vehicleForm.isRental ? rentalCostPerDay : null,
          make: vehicleForm.make.trim() || null,
          model: vehicleForm.model.trim() || null,
          lastMaintenanceDate: vehicleForm.lastMaintenanceDate || null,
          nextMaintenanceDate: vehicleForm.nextMaintenanceDate || null,
        });
        toast.success('Vehicle updated.');
      } else {
        await addVehicle({
          vehicleNumber: vehicleForm.vehicleNumber.trim(),
          type: vehicleForm.type,
          status: vehicleForm.status,
          isRental: vehicleForm.isRental,
          vendor: vehicleForm.vendor.trim() || null,
          rentalCostPerDay: vehicleForm.isRental ? rentalCostPerDay : null,
          make: vehicleForm.make.trim() || null,
          model: vehicleForm.model.trim() || null,
          lastMaintenanceDate: vehicleForm.lastMaintenanceDate || null,
          nextMaintenanceDate: vehicleForm.nextMaintenanceDate || null,
        });
        toast.success('Vehicle created.');
      }
      resetVehicleForm();
      setIsVehicleDialogOpen(false);
    } catch (error) {
      console.error('Failed to save vehicle', error);
      toast.error(error instanceof Error ? error.message : 'Unable to save vehicle right now.');
    } finally {
      setIsSavingVehicle(false);
    }
  };

  const handleEditVehicle = useCallback((vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      vehicleNumber: vehicle.vehicleNumber,
      type: vehicle.type,
      status: vehicle.status,
      isRental: vehicle.isRental,
      vendor: vehicle.vendor || '',
      rentalCostPerDay: vehicle.rentalCostPerDay?.toString() || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      lastMaintenanceDate: vehicle.lastMaintenanceDate || '',
      nextMaintenanceDate: vehicle.nextMaintenanceDate || '',
    });
    setIsVehicleDialogOpen(true);
  }, []);

  const handleDeleteVehicle = useCallback(
    async (vehicleId: string) => {
      const vehicle = vehicles.find((v) => v.id === vehicleId);
      if (!vehicle) {
        return;
      }

      const confirmed = window.confirm(
        `Are you sure you want to delete "${vehicle.vehicleNumber || vehicle.name || 'this vehicle'}"? This action cannot be undone.`,
      );
      if (!confirmed) {
        return;
      }

      // Clear selection if deleted vehicle was selected
      if (selectedVehicle === vehicleId) {
        setSelectedVehicle('');
        onVehicleSelect?.('');
      }

      // Show success toast IMMEDIATELY (context will optimistically update)
      toast.success('Vehicle deleted successfully.');

      // Perform the deletion (context handles optimistic updates and rollback)
      try {
        await deleteVehicle(vehicleId);
      } catch (error) {
        console.error('Failed to delete vehicle', error);
        toast.error(
          error instanceof Error ? error.message : 'Unable to delete vehicle. Please try again.',
        );
      }
    },
    [vehicles, selectedVehicle, onVehicleSelect, deleteVehicle],
  );

  const handleRefuelingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = vehicles.find((v) => v.id === refuelingForm.vehicleId);

    if (!vehicle) {
      toast.error('Please select a vehicle.');
      return;
    }

    if (!refuelingForm.date) {
      toast.error('Please select a refueling date.');
      return;
    }

    if (!refuelingForm.vendor || refuelingForm.vendor.trim() === '') {
      toast.error('Please select a vendor.');
      return;
    }

    if (!refuelingForm.invoiceNumber || refuelingForm.invoiceNumber.trim() === '') {
      toast.error('Please enter an invoice number.');
      return;
    }

    const quantity = Number(refuelingForm.quantity);
    const cost = Number(refuelingForm.cost);
    const odometerReading = Number(refuelingForm.odometerReading);

    if ([quantity, cost, odometerReading].some((value) => Number.isNaN(value))) {
      toast.error('Please enter valid numeric values.');
      return;
    }

    if (quantity <= 0) {
      toast.error('Quantity must be greater than zero.');
      return;
    }

    if (cost <= 0) {
      toast.error('Cost must be greater than zero.');
      return;
    }

    const unit: VehicleRefueling['unit'] = refuelingForm.fuelType === 'Electric' ? 'kWh' : 'liters';

    const payload = {
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      date: refuelingForm.date,
      fuelType: refuelingForm.fuelType,
      quantity,
      unit,
      cost,
      odometerReading,
      location: null,
      vendor: refuelingForm.vendor,
      invoiceNumber: refuelingForm.invoiceNumber,
      receiptUrl: null,
      notes: refuelingForm.notes || null,
    };

    setIsSavingRefueling(true);
    try {
      if (refuelingDialog.editingItem) {
        // Include vehicleId and vehicleNumber in updates to allow changing vehicle
        await editRefuelingRecord(refuelingDialog.editingItem.id, payload);
        toast.success('Refueling record updated.');
      } else {
        await createRefuelingRecord(payload);
        toast.success('Refueling record added.');
      }
      resetRefuelingForm();
      refuelingDialog.closeDialog();
    } catch (error) {
      console.error('Failed to save refueling record', error);
      toast.error(
        error instanceof Error ? error.message : 'Unable to save refueling record right now.',
      );
    } finally {
      setIsSavingRefueling(false);
    }
  };

  const handleUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = vehicles.find((v) => v.id === usageForm.vehicleId);

    if (!vehicle) {
      toast.error('Please select a vehicle.');
      return;
    }

    if (!usageForm.date) {
      toast.error('Please select a usage date.');
      return;
    }

    const startOdometer = Number(usageForm.startOdometer);
    const endOdometer = Number(usageForm.endOdometer);

    if ([startOdometer, endOdometer].some((value) => Number.isNaN(value))) {
      toast.error('Please enter valid numeric values.');
      return;
    }

    const totalDistance = endOdometer - startOdometer;

    if (totalDistance < 0) {
      toast.error('End odometer must be greater than or equal to start odometer.');
      return;
    }

    const siteName =
      vehicleSiteOptions.find((option) => option.id === usageForm.siteId)?.name ??
      vehicle.siteName ??
      '';

    const operatorName = usageForm.operator.trim() || vehicle.operator || '';

    const payload = {
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      date: usageForm.date,
      startTime: usageForm.startTime,
      endTime: usageForm.endTime,
      startOdometer,
      endOdometer,
      totalDistance,
      workDescription: usageForm.workDescription,
      workCategory: usageForm.workCategory,
      siteId: usageForm.siteId,
      siteName,
      operator: operatorName,
      fuelConsumed: null,
      isRental: vehicle.isRental,
      rentalCost: vehicle.isRental ? (vehicle.rentalCostPerDay ?? null) : null,
      vendor: vehicle.vendor ?? null,
      status: 'Completed' as VehicleUsage['status'],
      notes: usageForm.notes || null,
    };

    setIsSavingUsage(true);
    try {
      if (usageDialog.editingItem) {
        await editUsageRecord(usageDialog.editingItem.id, payload);
        toast.success('Usage record updated.');
      } else {
        await createUsageRecord(payload);
        toast.success('Usage record added.');
      }

      resetUsageForm();
      usageDialog.closeDialog();
    } catch (error) {
      console.error('Failed to save usage record', error);
      toast.error(
        error instanceof Error ? error.message : 'Unable to save usage record right now.',
      );
    } finally {
      setIsSavingUsage(false);
    }
  };

  const handleEditRefueling = (record: VehicleRefueling) => {
    refuelingDialog.openDialog(record);
  };

  const handleDeleteRefueling = async (recordId: string) => {
    const record = refuelingRecords.find((r) => r.id === recordId);
    if (!record) {
      return;
    }

    const confirmed = window.confirm(
      `Delete refueling record for ${record.vehicleNumber} on ${formatDateOnly(new Date(record.date))}? This action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    // Show success toast IMMEDIATELY (context will optimistically update)
    toast.success('Refueling record deleted successfully.');

    // Perform the deletion (context handles optimistic updates and rollback)
    try {
      await removeRefuelingRecord(recordId);
    } catch (error) {
      console.error('Failed to delete refueling record', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to delete refueling record. Please try again.',
      );
    }
  };

  const handleEditUsage = (record: VehicleUsage) => {
    usageDialog.openDialog(record);
  };

  const handleDeleteUsage = async (recordId: string) => {
    const record = usageRecords.find((r) => r.id === recordId);
    if (!record) {
      return;
    }

    const confirmed = window.confirm(
      `Delete usage record for ${record.vehicleNumber} on ${formatDateOnly(new Date(record.date))}? This action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    // Perform the deletion (context handles optimistic updates and rollback)
    try {
      await removeUsageRecord(recordId);
      toast.success('Usage record deleted successfully.');
      // Note: No refresh needed - optimistic update already removes it from UI
      // Refresh would fetch cached data that might still include the deleted record
    } catch (error) {
      console.error('Failed to delete usage record', error);
      toast.error(
        error instanceof Error ? error.message : 'Unable to delete usage record. Please try again.',
      );
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

  if (isVehiclesLoading && vehicles.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full w-full bg-background flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b bg-background/80">
          <div>
            <p className="text-sm text-muted-foreground">Vehicles</p>
            <p className="text-lg font-semibold">
              {vehicles.length > 0 ? `${vehicles.length} tracked` : 'No vehicles yet'}
            </p>
          </div>
          <Button
            type="button"
            className="gap-2"
            onClick={() => {
              resetVehicleForm();
              setIsVehicleDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        </div>

        {/* Vehicle List Section */}
        {vehicles.length > 0 && (
          <div className="px-6 py-4 border-b bg-muted/30">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Tracked Vehicles</h3>
                <p className="text-xs text-muted-foreground">
                  Click on a vehicle to view details and manage operations
                </p>
              </div>
              {vehicles.length > 4 && (
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={scrollLeft}
                          disabled={!canScrollLeft}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Scroll Left</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={scrollRight}
                          disabled={!canScrollRight}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Scroll Right</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
            <div className="relative">
              {/* Scrollable Container */}
              <div
                ref={setScrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30 scroll-smooth"
                style={{
                  scrollbarWidth: 'thin',
                  msOverflowStyle: 'auto',
                }}
              >
                {vehicles.map((vehicle) => (
                  <Card
                    key={vehicle.id}
                    data-vehicle-id={vehicle.id}
                    className={`flex-shrink-0 w-[280px] cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
                      selectedVehicle === vehicle.id
                        ? 'border-primary shadow-md ring-2 ring-primary/20'
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedVehicle(vehicle.id);
                      onVehicleSelect?.(vehicle.id);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10 bg-primary/10 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <Truck className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {vehicle.vehicleNumber}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize truncate">
                              {vehicle.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewVehicleDetails(vehicle);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditVehicle(vehicle);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Vehicle</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleDeleteVehicle(vehicle.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Vehicle</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            className={`${getStatusColor(vehicle.status)} text-xs`}
                            variant="secondary"
                          >
                            {formatStatus(vehicle.status)}
                          </Badge>
                          {vehicle.isRental && (
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              Rental
                            </Badge>
                          )}
                        </div>
                        {vehicle.siteName && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{vehicle.siteName}</span>
                          </div>
                        )}
                        {vehicle.operator && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{vehicle.operator}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Pagination Controls */}
              {pagination && (pagination.hasMore || pagination.page > 1) && (
                <div className="flex items-center justify-between border-t px-4 py-3 mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {pagination.page * pagination.limit} vehicles
                    {/* If using count query, uncomment below: */}
                    {/* of {pagination.total} vehicles */}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page === 1 || isVehiclesLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    {/* Page number buttons - commented out with hasMore approach */}
                    {/* If using count query with totalPages, uncomment below: */}
                    {/* <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            disabled={isVehiclesLoading}
                            className="min-w-[2.5rem]"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div> */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!pagination.hasMore || isVehiclesLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
                                  .filter((r) => {
                                    const recordDate = new Date(r.date);
                                    const now = new Date();
                                    return (
                                      recordDate.getMonth() === now.getMonth() &&
                                      recordDate.getFullYear() === now.getFullYear()
                                    );
                                  })
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
                                  .filter((r) => {
                                    const recordDate = new Date(r.date);
                                    const now = new Date();
                                    return (
                                      recordDate.getMonth() === now.getMonth() &&
                                      recordDate.getFullYear() === now.getFullYear()
                                    );
                                  })
                                  .reduce((sum, r) => sum + r.cost, 0)
                                  .toLocaleString()}
                              </p>
                            </div>
                            <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                              <span className="text-2xl font-semibold text-primary">₹</span>
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
                                {(() => {
                                  const totalCost = refuelingRecords.reduce(
                                    (sum, r) => sum + r.cost,
                                    0,
                                  );
                                  const totalQuantity = refuelingRecords.reduce(
                                    (sum, r) => sum + r.quantity,
                                    0,
                                  );
                                  if (totalQuantity === 0) return '₹0.00';
                                  return `₹${(totalCost / totalQuantity).toFixed(2)}`;
                                })()}
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
                      <CardContent className="p-6 space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="text-lg font-semibold">Vehicle Refueling Records</h3>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 transition-all hover:shadow-md"
                                    onClick={() => {
                                      setDraftRefuelingFilters(
                                        cloneRefuelingAdvancedFilters(appliedRefuelingFilters),
                                      );
                                      setIsRefuelingFilterSheetOpen(true);
                                    }}
                                  >
                                    <Filter className="h-4 w-4" />
                                    <span className="hidden sm:inline">Filter</span>
                                    {hasActiveRefuelingFilters ? (
                                      <Badge variant="secondary" className="ml-2">
                                        {activeRefuelingFilterCount}
                                      </Badge>
                                    ) : null}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Open refueling filters</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 transition-all hover:shadow-md"
                              disabled={!hasActiveRefuelingFilters}
                              onClick={() => {
                                const reset = createDefaultRefuelingAdvancedFilters();
                                setAppliedRefuelingFilters(reset);
                                setDraftRefuelingFilters(reset);
                              }}
                            >
                              <RotateCcw className="h-4 w-4" />
                              <span className="hidden sm:inline">Clear filters</span>
                            </Button>
                            <Button
                              onClick={() => {
                                resetRefuelingForm();
                                refuelingDialog.openDialog();
                              }}
                              disabled={isVehiclesLoading || vehicles.length === 0}
                              className="gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add Refueling
                            </Button>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="px-3 py-1.5 text-sm font-medium w-fit"
                        >
                          {filteredRefuelingRecords.length} record
                          {filteredRefuelingRecords.length !== 1 ? 's' : ''} found
                        </Badge>
                        {hasActiveRefuelingFilters ? (
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const chips: string[] = [];
                              if (appliedRefuelingFilters.vehicles.length > 0) {
                                chips.push(
                                  `Vehicles: ${appliedRefuelingFilters.vehicles.join(', ')}`,
                                );
                              }
                              if (appliedRefuelingFilters.fuelTypes.length > 0) {
                                chips.push(`Fuel: ${appliedRefuelingFilters.fuelTypes.join(', ')}`);
                              }
                              if (appliedRefuelingFilters.vendors.length > 0) {
                                chips.push(
                                  `Vendors: ${appliedRefuelingFilters.vendors.join(', ')}`,
                                );
                              }
                              if (appliedRefuelingFilters.locations.length > 0) {
                                chips.push(
                                  `Locations: ${appliedRefuelingFilters.locations.join(', ')}`,
                                );
                              }
                              if (
                                appliedRefuelingFilters.dateFrom ||
                                appliedRefuelingFilters.dateTo
                              ) {
                                chips.push(
                                  `Date: ${appliedRefuelingFilters.dateFrom ?? 'Any'} → ${appliedRefuelingFilters.dateTo ?? 'Any'}`,
                                );
                              }
                              if (
                                appliedRefuelingFilters.quantityMin ||
                                appliedRefuelingFilters.quantityMax
                              ) {
                                chips.push(
                                  `Quantity: ${appliedRefuelingFilters.quantityMin || '0'} - ${appliedRefuelingFilters.quantityMax || '∞'}`,
                                );
                              }
                              if (
                                appliedRefuelingFilters.costMin ||
                                appliedRefuelingFilters.costMax
                              ) {
                                chips.push(
                                  `Cost: ₹${appliedRefuelingFilters.costMin || '0'} - ₹${appliedRefuelingFilters.costMax || '∞'}`,
                                );
                              }
                              if (appliedRefuelingFilters.hasInvoice !== 'all') {
                                chips.push(
                                  appliedRefuelingFilters.hasInvoice === 'with'
                                    ? 'With invoice'
                                    : 'Without invoice',
                                );
                              }
                              return chips;
                            })().map((chip) => (
                              <Badge
                                key={chip}
                                variant="outline"
                                className="rounded-full px-3 py-1 text-xs"
                              >
                                {chip}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
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
                                  {filteredRefuelingRecords.map((record) => (
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
                                                onClick={() =>
                                                  void handleDeleteRefueling(record.id)
                                                }
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
                                .filter((r) => {
                                  const recordDate = new Date(r.date);
                                  const now = new Date();
                                  return (
                                    recordDate.getMonth() === now.getMonth() &&
                                    recordDate.getFullYear() === now.getFullYear()
                                  );
                                })
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
                              {(() => {
                                const now = new Date();
                                const monthlyRecords = usageRecords.filter((r) => {
                                  const recordDate = new Date(r.date);
                                  return (
                                    recordDate.getMonth() === now.getMonth() &&
                                    recordDate.getFullYear() === now.getFullYear()
                                  );
                                });

                                return monthlyRecords
                                  .reduce((sum, record) => {
                                    // Only calculate cost for rental vehicles
                                    if (!record.isRental) return sum;

                                    // Try to use stored rentalCost if available
                                    if (record.rentalCost && record.rentalCost > 0) {
                                      return sum + record.rentalCost;
                                    }

                                    // Calculate from rentalCostPerDay if available
                                    const vehicle = vehicles.find((v) => v.id === record.vehicleId);
                                    if (vehicle?.isRental && vehicle?.rentalCostPerDay) {
                                      // Calculate hours used from startTime and endTime
                                      try {
                                        const startTime = new Date(
                                          `${record.date}T${record.startTime}`,
                                        );
                                        const endTime = new Date(
                                          `${record.date}T${record.endTime}`,
                                        );
                                        const hoursUsed =
                                          (endTime.getTime() - startTime.getTime()) /
                                          (1000 * 60 * 60);
                                        const daysUsed = hoursUsed / 24;
                                        const usageCost = vehicle.rentalCostPerDay * daysUsed;
                                        return sum + usageCost;
                                      } catch {
                                        // If time calculation fails, assume 1 day
                                        return sum + vehicle.rentalCostPerDay;
                                      }
                                    }

                                    return sum;
                                  }, 0)
                                  .toLocaleString();
                              })()}
                            </p>
                          </div>
                          <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                            <span className="text-2xl font-semibold text-primary">₹</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Monthly Avg. Efficiency
                            </p>
                            <p className="text-2xl font-bold text-orange-600">
                              {(() => {
                                const now = new Date();
                                const monthlyRecords = usageRecords.filter((r) => {
                                  const recordDate = new Date(r.date);
                                  return (
                                    recordDate.getMonth() === now.getMonth() &&
                                    recordDate.getFullYear() === now.getFullYear()
                                  );
                                });

                                const totalDistance = monthlyRecords.reduce(
                                  (sum, r) => sum + r.totalDistance,
                                  0,
                                );
                                const totalFuel = monthlyRecords.reduce(
                                  (sum, r) => sum + (r.fuelConsumed ?? 0),
                                  0,
                                );
                                if (totalFuel === 0) return '0.00 km/L';
                                return `${(totalDistance / totalFuel).toFixed(2)} km/L`;
                              })()}
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
                    <CardContent className="p-6 space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-lg font-semibold">Vehicle Usage Records</h3>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 transition-all hover:shadow-md"
                                  onClick={() => {
                                    setDraftUsageFilters(
                                      cloneUsageAdvancedFilters(appliedUsageFilters),
                                    );
                                    setIsUsageFilterSheetOpen(true);
                                  }}
                                >
                                  <Filter className="h-4 w-4" />
                                  <span className="hidden sm:inline">Filter</span>
                                  {hasActiveUsageFilters ? (
                                    <Badge variant="secondary" className="ml-2">
                                      {activeUsageFilterCount}
                                    </Badge>
                                  ) : null}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Open usage filters</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 transition-all hover:shadow-md"
                            disabled={!hasActiveUsageFilters}
                            onClick={() => {
                              const reset = createDefaultUsageAdvancedFilters();
                              setAppliedUsageFilters(reset);
                              setDraftUsageFilters(reset);
                            }}
                          >
                            <RotateCcw className="h-4 w-4" />
                            <span className="hidden sm:inline">Clear filters</span>
                          </Button>
                          <Button
                            onClick={() => {
                              resetUsageForm();
                              usageDialog.openDialog();
                            }}
                            disabled={isVehiclesLoading || vehicles.length === 0}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Usage Record
                          </Button>
                        </div>
                      </div>
                      <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium w-fit">
                        {filteredUsageRecords.length} record
                        {filteredUsageRecords.length !== 1 ? 's' : ''} found
                      </Badge>
                      {hasActiveUsageFilters ? (
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            const chips: string[] = [];
                            if (appliedUsageFilters.vehicles.length > 0) {
                              chips.push(`Vehicles: ${appliedUsageFilters.vehicles.join(', ')}`);
                            }
                            if (appliedUsageFilters.sites.length > 0) {
                              chips.push(`Sites: ${appliedUsageFilters.sites.join(', ')}`);
                            }
                            if (appliedUsageFilters.categories.length > 0) {
                              chips.push(
                                `Categories: ${appliedUsageFilters.categories.join(', ')}`,
                              );
                            }
                            if (appliedUsageFilters.statuses.length > 0) {
                              chips.push(`Statuses: ${appliedUsageFilters.statuses.join(', ')}`);
                            }
                            if (appliedUsageFilters.dateFrom || appliedUsageFilters.dateTo) {
                              chips.push(
                                `Date: ${appliedUsageFilters.dateFrom ?? 'Any'} → ${appliedUsageFilters.dateTo ?? 'Any'}`,
                              );
                            }
                            if (
                              appliedUsageFilters.distanceMin ||
                              appliedUsageFilters.distanceMax
                            ) {
                              chips.push(
                                `Distance: ${appliedUsageFilters.distanceMin || '0'}km - ${appliedUsageFilters.distanceMax || '∞'}km`,
                              );
                            }
                            if (appliedUsageFilters.fuelMin || appliedUsageFilters.fuelMax) {
                              chips.push(
                                `Fuel: ${appliedUsageFilters.fuelMin || '0'}L - ${appliedUsageFilters.fuelMax || '∞'}L`,
                              );
                            }
                            if (appliedUsageFilters.rentalType !== 'all') {
                              chips.push(
                                appliedUsageFilters.rentalType === 'rental'
                                  ? 'Rental only'
                                  : 'Owned only',
                              );
                            }
                            return chips;
                          })().map((chip) => (
                            <Badge
                              key={chip}
                              variant="outline"
                              className="rounded-full px-3 py-1 text-xs"
                            >
                              {chip}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
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
                                {filteredUsageRecords.map((record) => (
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
                                              onClick={() => void handleDeleteUsage(record.id)}
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

      <FilterSheet
        open={isRefuelingFilterSheetOpen}
        onOpenChange={setIsRefuelingFilterSheetOpen}
        title="Refueling filters"
        description="Refine refueling records with additional criteria."
        sections={[
          {
            id: 'refueling-vehicles',
            title: 'Vehicles',
            description: 'Show refueling entries for selected vehicles.',
            content:
              refuelingFilterOptions.vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No vehicles recorded yet.</p>
              ) : (
                <div className="grid gap-2">
                  {refuelingFilterOptions.vehicles.map((vehicle) => {
                    const checked = draftRefuelingFilters.vehicles.includes(vehicle);
                    return (
                      <Label key={vehicle} className="flex items-center gap-3 text-sm font-normal">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(checkedValue: boolean | 'indeterminate') =>
                            setDraftRefuelingFilters((prev) => {
                              const isChecked = checkedValue === true;
                              return {
                                ...prev,
                                vehicles: isChecked
                                  ? [...prev.vehicles, vehicle]
                                  : prev.vehicles.filter((item) => item !== vehicle),
                              };
                            })
                          }
                        />
                        <span>{vehicle}</span>
                      </Label>
                    );
                  })}
                </div>
              ),
          },
          {
            id: 'refueling-fuel',
            title: 'Fuel types',
            description: 'Limit results to certain fuel types.',
            content:
              refuelingFilterOptions.fuelTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No fuel types available.</p>
              ) : (
                <div className="grid gap-2">
                  {refuelingFilterOptions.fuelTypes.map((type) => {
                    const checked = draftRefuelingFilters.fuelTypes.includes(type);
                    return (
                      <Label key={type} className="flex items-center gap-3 text-sm font-normal">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(checkedValue: boolean | 'indeterminate') =>
                            setDraftRefuelingFilters((prev) => {
                              const isChecked = checkedValue === true;
                              return {
                                ...prev,
                                fuelTypes: isChecked
                                  ? [...prev.fuelTypes, type]
                                  : prev.fuelTypes.filter((item) => item !== type),
                              };
                            })
                          }
                        />
                        <span>{type}</span>
                      </Label>
                    );
                  })}
                </div>
              ),
          },
          {
            id: 'refueling-date',
            title: 'Date range',
            description: 'Filter by refueling date.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="refueling-date-from" className="text-sm font-medium">
                    From
                  </Label>
                  <Input
                    id="refueling-date-from"
                    type="date"
                    value={draftRefuelingFilters.dateFrom ?? ''}
                    onChange={(event) =>
                      setDraftRefuelingFilters((prev) => ({
                        ...prev,
                        dateFrom: event.target.value || undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="refueling-date-to" className="text-sm font-medium">
                    To
                  </Label>
                  <Input
                    id="refueling-date-to"
                    type="date"
                    value={draftRefuelingFilters.dateTo ?? ''}
                    onChange={(event) =>
                      setDraftRefuelingFilters((prev) => ({
                        ...prev,
                        dateTo: event.target.value || undefined,
                      }))
                    }
                  />
                </div>
              </div>
            ),
          },
          {
            id: 'refueling-cost',
            title: 'Cost range (₹)',
            description: 'Limit results to a spend band.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="refueling-cost-min" className="text-sm font-medium">
                    Min
                  </Label>
                  <Input
                    id="refueling-cost-min"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={draftRefuelingFilters.costMin}
                    onChange={(event) =>
                      setDraftRefuelingFilters((prev) => ({
                        ...prev,
                        costMin: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="refueling-cost-max" className="text-sm font-medium">
                    Max
                  </Label>
                  <Input
                    id="refueling-cost-max"
                    type="number"
                    inputMode="decimal"
                    placeholder="Any"
                    value={draftRefuelingFilters.costMax}
                    onChange={(event) =>
                      setDraftRefuelingFilters((prev) => ({
                        ...prev,
                        costMax: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ),
          },
          {
            id: 'refueling-invoice',
            title: 'Invoice status',
            description: 'Show records with or without invoice numbers.',
            content: (
              <Select
                value={draftRefuelingFilters.hasInvoice}
                onValueChange={(value: RefuelingAdvancedFilterState['hasInvoice']) =>
                  setDraftRefuelingFilters((prev) => ({ ...prev, hasInvoice: value }))
                }
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Invoice status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All records</SelectItem>
                  <SelectItem value="with">With invoice number</SelectItem>
                  <SelectItem value="without">Without invoice number</SelectItem>
                </SelectContent>
              </Select>
            ),
          },
        ]}
        onApply={() => {
          setAppliedRefuelingFilters(cloneRefuelingAdvancedFilters(draftRefuelingFilters));
          setIsRefuelingFilterSheetOpen(false);
        }}
        onReset={() => {
          const reset = createDefaultRefuelingAdvancedFilters();
          setDraftRefuelingFilters(reset);
          setAppliedRefuelingFilters(reset);
        }}
        isDirty={countRefuelingFilters(draftRefuelingFilters) > 0}
      />

      <FilterSheet
        open={isUsageFilterSheetOpen}
        onOpenChange={setIsUsageFilterSheetOpen}
        title="Usage filters"
        description="Refine vehicle usage records with additional criteria."
        sections={[
          {
            id: 'usage-vehicles',
            title: 'Vehicles',
            description: 'Show usage entries for selected vehicles.',
            content:
              usageFilterOptions.vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No vehicles recorded yet.</p>
              ) : (
                <div className="grid gap-2">
                  {usageFilterOptions.vehicles.map((vehicle) => {
                    const checked = draftUsageFilters.vehicles.includes(vehicle);
                    return (
                      <Label key={vehicle} className="flex items-center gap-3 text-sm font-normal">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(checkedValue: boolean | 'indeterminate') =>
                            setDraftUsageFilters((prev) => {
                              const isChecked = checkedValue === true;
                              return {
                                ...prev,
                                vehicles: isChecked
                                  ? [...prev.vehicles, vehicle]
                                  : prev.vehicles.filter((item) => item !== vehicle),
                              };
                            })
                          }
                        />
                        <span>{vehicle}</span>
                      </Label>
                    );
                  })}
                </div>
              ),
          },
          {
            id: 'usage-sites',
            title: 'Sites',
            description: 'Limit usage entries to selected sites.',
            content:
              usageFilterOptions.sites.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sites recorded yet.</p>
              ) : (
                <div className="grid gap-2">
                  {usageFilterOptions.sites.map((site) => {
                    const checked = draftUsageFilters.sites.includes(site);
                    return (
                      <Label key={site} className="flex items-center gap-3 text-sm font-normal">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(checkedValue: boolean | 'indeterminate') =>
                            setDraftUsageFilters((prev) => {
                              const isChecked = checkedValue === true;
                              return {
                                ...prev,
                                sites: isChecked
                                  ? [...prev.sites, site]
                                  : prev.sites.filter((item) => item !== site),
                              };
                            })
                          }
                        />
                        <span>{site}</span>
                      </Label>
                    );
                  })}
                </div>
              ),
          },
          {
            id: 'usage-status',
            title: 'Statuses',
            description: 'Filter by usage status.',
            content:
              usageFilterOptions.statuses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No statuses recorded yet.</p>
              ) : (
                <div className="grid gap-2">
                  {usageFilterOptions.statuses.map((status) => {
                    const checked = draftUsageFilters.statuses.includes(status);
                    return (
                      <Label key={status} className="flex items-center gap-3 text-sm font-normal">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(checkedValue: boolean | 'indeterminate') =>
                            setDraftUsageFilters((prev) => {
                              const isChecked = checkedValue === true;
                              return {
                                ...prev,
                                statuses: isChecked
                                  ? [...prev.statuses, status]
                                  : prev.statuses.filter((item) => item !== status),
                              };
                            })
                          }
                        />
                        <span>{status}</span>
                      </Label>
                    );
                  })}
                </div>
              ),
          },
          {
            id: 'usage-date',
            title: 'Date range',
            description: 'Filter by usage date.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="usage-date-from" className="text-sm font-medium">
                    From
                  </Label>
                  <Input
                    id="usage-date-from"
                    type="date"
                    value={draftUsageFilters.dateFrom ?? ''}
                    onChange={(event) =>
                      setDraftUsageFilters((prev) => ({
                        ...prev,
                        dateFrom: event.target.value || undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="usage-date-to" className="text-sm font-medium">
                    To
                  </Label>
                  <Input
                    id="usage-date-to"
                    type="date"
                    value={draftUsageFilters.dateTo ?? ''}
                    onChange={(event) =>
                      setDraftUsageFilters((prev) => ({
                        ...prev,
                        dateTo: event.target.value || undefined,
                      }))
                    }
                  />
                </div>
              </div>
            ),
          },
          {
            id: 'usage-distance',
            title: 'Distance (km)',
            description: 'Limit entries to a distance range.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="usage-distance-min" className="text-sm font-medium">
                    Min
                  </Label>
                  <Input
                    id="usage-distance-min"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={draftUsageFilters.distanceMin}
                    onChange={(event) =>
                      setDraftUsageFilters((prev) => ({
                        ...prev,
                        distanceMin: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="usage-distance-max" className="text-sm font-medium">
                    Max
                  </Label>
                  <Input
                    id="usage-distance-max"
                    type="number"
                    inputMode="decimal"
                    placeholder="Any"
                    value={draftUsageFilters.distanceMax}
                    onChange={(event) =>
                      setDraftUsageFilters((prev) => ({
                        ...prev,
                        distanceMax: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ),
          },
          {
            id: 'usage-fuel',
            title: 'Fuel consumed (L)',
            description: 'Filter by reported fuel consumption.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="usage-fuel-min" className="text-sm font-medium">
                    Min
                  </Label>
                  <Input
                    id="usage-fuel-min"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={draftUsageFilters.fuelMin}
                    onChange={(event) =>
                      setDraftUsageFilters((prev) => ({
                        ...prev,
                        fuelMin: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="usage-fuel-max" className="text-sm font-medium">
                    Max
                  </Label>
                  <Input
                    id="usage-fuel-max"
                    type="number"
                    inputMode="decimal"
                    placeholder="Any"
                    value={draftUsageFilters.fuelMax}
                    onChange={(event) =>
                      setDraftUsageFilters((prev) => ({
                        ...prev,
                        fuelMax: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ),
          },
          {
            id: 'usage-rental',
            title: 'Rental vs owned',
            description: 'Filter entries based on vehicle ownership.',
            content: (
              <Select
                value={draftUsageFilters.rentalType}
                onValueChange={(value: UsageAdvancedFilterState['rentalType']) =>
                  setDraftUsageFilters((prev) => ({ ...prev, rentalType: value }))
                }
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Vehicle ownership" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entries</SelectItem>
                  <SelectItem value="owned">Owned vehicles</SelectItem>
                  <SelectItem value="rental">Rental vehicles</SelectItem>
                </SelectContent>
              </Select>
            ),
          },
        ]}
        onApply={() => {
          setAppliedUsageFilters(cloneUsageAdvancedFilters(draftUsageFilters));
          setIsUsageFilterSheetOpen(false);
        }}
        onReset={() => {
          const reset = createDefaultUsageAdvancedFilters();
          setDraftUsageFilters(reset);
          setAppliedUsageFilters(reset);
        }}
        isDirty={countUsageFilters(draftUsageFilters) > 0}
      />

      {/* New Vehicle Dialog */}
      <Dialog
        open={isVehicleDialogOpen}
        onOpenChange={(open) => {
          setIsVehicleDialogOpen(open);
          if (!open) {
            resetVehicleForm();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="space-y-3 flex-shrink-0 px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl">
              {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
            </DialogTitle>
            <DialogDescription>
              {editingVehicle
                ? 'Update vehicle record details.'
                : 'Create a vehicle record so you can log refueling and usage against it.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <Card className="w-full border-0 shadow-none">
              <CardContent className="pt-6 px-6">
                <form id="vehicle-form" onSubmit={handleVehicleSubmit}>
                  <FieldGroup>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="vehicle-number">
                          Vehicle Number <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="vehicle-number"
                          value={vehicleForm.vehicleNumber}
                          onChange={(event) =>
                            setVehicleForm((prev) => ({
                              ...prev,
                              vehicleNumber: event.target.value,
                            }))
                          }
                          placeholder="MH-14-TC-9087"
                          required
                        />
                        <FieldDescription>Enter the vehicle registration number.</FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="vehicle-type">
                          Vehicle Type <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                          value={vehicleForm.type}
                          onValueChange={(value) =>
                            setVehicleForm((prev) => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger id="vehicle-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VEHICLE_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldDescription>Select the type of vehicle.</FieldDescription>
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="vehicle-status">
                        Status <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Select
                        value={vehicleForm.status}
                        onValueChange={(value: Vehicle['status']) =>
                          setVehicleForm((prev) => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger id="vehicle-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VEHICLE_STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>Current status of the vehicle.</FieldDescription>
                    </Field>

                    {/* Rental Information */}
                    <Field>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FieldLabel htmlFor="is-rental">Is Rental Vehicle</FieldLabel>
                          <FieldDescription>
                            Mark this vehicle as a rental if it&apos;s leased or rented from a
                            vendor.
                          </FieldDescription>
                        </div>
                        <Switch
                          id="is-rental"
                          checked={vehicleForm.isRental}
                          onCheckedChange={(checked) =>
                            setVehicleForm((prev) => ({
                              ...prev,
                              isRental: checked,
                              // Clear rental cost if unchecking rental
                              rentalCostPerDay: checked ? prev.rentalCostPerDay : '',
                              vendor: checked ? prev.vendor : '',
                            }))
                          }
                        />
                      </div>
                    </Field>

                    {vehicleForm.isRental && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor="rental-cost-per-day">
                            Rental Cost Per Day <span className="text-destructive">*</span>
                          </FieldLabel>
                          <Input
                            id="rental-cost-per-day"
                            type="number"
                            step="0.01"
                            min="0"
                            value={vehicleForm.rentalCostPerDay}
                            onChange={(event) =>
                              setVehicleForm((prev) => ({
                                ...prev,
                                rentalCostPerDay: event.target.value,
                              }))
                            }
                            placeholder="1000"
                          />
                          <FieldDescription>
                            Daily rental cost for this vehicle (required for rental vehicles).
                          </FieldDescription>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="vendor">Vendor</FieldLabel>
                          <Input
                            id="vendor"
                            value={vehicleForm.vendor}
                            onChange={(event) =>
                              setVehicleForm((prev) => ({
                                ...prev,
                                vendor: event.target.value,
                              }))
                            }
                            placeholder="Vendor name (optional)"
                          />
                          <FieldDescription>
                            Name of the vendor providing this rental vehicle (optional).
                          </FieldDescription>
                        </Field>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="vehicle-make">Make</FieldLabel>
                        <Input
                          id="vehicle-make"
                          value={vehicleForm.make}
                          onChange={(event) =>
                            setVehicleForm((prev) => ({ ...prev, make: event.target.value }))
                          }
                          placeholder="Volvo"
                        />
                        <FieldDescription>Vehicle manufacturer name (optional).</FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="vehicle-model">Model</FieldLabel>
                        <Input
                          id="vehicle-model"
                          value={vehicleForm.model}
                          onChange={(event) =>
                            setVehicleForm((prev) => ({ ...prev, model: event.target.value }))
                          }
                          placeholder="FMX 460"
                        />
                        <FieldDescription>Vehicle model name (optional).</FieldDescription>
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="last-maintenance-date">Last Service Date</FieldLabel>
                        <DatePicker
                          date={
                            vehicleForm.lastMaintenanceDate
                              ? parseDateOnly(vehicleForm.lastMaintenanceDate)
                              : undefined
                          }
                          onSelect={(date) =>
                            setVehicleForm((prev) => ({
                              ...prev,
                              lastMaintenanceDate: date ? formatDateOnly(date) : '',
                            }))
                          }
                          placeholder="Select last service date"
                        />
                        <FieldDescription>
                          Date of last maintenance service (optional).
                        </FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="next-maintenance-date">Next Service Date</FieldLabel>
                        <DatePicker
                          date={
                            vehicleForm.nextMaintenanceDate
                              ? parseDateOnly(vehicleForm.nextMaintenanceDate)
                              : undefined
                          }
                          onSelect={(date) =>
                            setVehicleForm((prev) => ({
                              ...prev,
                              nextMaintenanceDate: date ? formatDateOnly(date) : '',
                            }))
                          }
                          placeholder="Select next service date"
                        />
                        <FieldDescription>
                          Date when next maintenance is due (optional).
                        </FieldDescription>
                      </Field>
                    </div>
                  </FieldGroup>
                </form>
              </CardContent>
              <CardFooter className="border-t px-6">
                <div className="flex justify-end gap-2 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsVehicleDialogOpen(false)}
                    disabled={isSavingVehicle}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" form="vehicle-form" disabled={isSavingVehicle}>
                    {isSavingVehicle
                      ? 'Saving…'
                      : editingVehicle
                        ? 'Update Vehicle'
                        : 'Create Vehicle'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refueling Dialog */}
      <Dialog
        open={refuelingDialog.isDialogOpen}
        onOpenChange={(open) =>
          open
            ? refuelingDialog.openDialog(refuelingDialog.editingItem)
            : refuelingDialog.closeDialog()
        }
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="space-y-3 flex-shrink-0 px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl">
              {refuelingDialog.isEditing ? 'Edit Refueling Record' : 'Add Refueling Record'}
            </DialogTitle>
            <DialogDescription>Record vehicle refueling details</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <Card className="w-full border-0 shadow-none">
              <CardContent className="pt-6 px-6">
                <form id="refueling-form" onSubmit={handleRefuelingSubmit}>
                  <FieldGroup>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="vehicle">
                          Vehicle <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                          value={refuelingForm.vehicleId}
                          disabled={vehicles.length === 0}
                          onValueChange={(value) =>
                            setRefuelingForm((prev) => ({ ...prev, vehicleId: value }))
                          }
                        >
                          <SelectTrigger id="vehicle">
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
                        <FieldDescription>Select the vehicle for refueling.</FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="date">
                          Date <span className="text-destructive">*</span>
                        </FieldLabel>
                        <DatePicker
                          date={parseDateOnly(refuelingForm.date) ?? undefined}
                          onSelect={(date) =>
                            setRefuelingForm((prev) => ({
                              ...prev,
                              date: date ? formatDateOnly(date) : '',
                            }))
                          }
                          placeholder="Select refueling date"
                        />
                        <FieldDescription>Date when refueling occurred.</FieldDescription>
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <Field>
                        <FieldLabel htmlFor="fuelType">
                          Fuel Type <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                          value={refuelingForm.fuelType}
                          onValueChange={(value: VehicleRefueling['fuelType']) =>
                            setRefuelingForm((prev) => ({ ...prev, fuelType: value }))
                          }
                        >
                          <SelectTrigger id="fuelType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Diesel">Diesel</SelectItem>
                            <SelectItem value="Petrol">Petrol</SelectItem>
                            <SelectItem value="CNG">CNG</SelectItem>
                            <SelectItem value="Electric">Electric</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldDescription>Type of fuel used.</FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="quantity">
                          Quantity <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="quantity"
                          type="number"
                          value={refuelingForm.quantity}
                          onChange={(e) =>
                            setRefuelingForm((prev) => ({ ...prev, quantity: e.target.value }))
                          }
                          placeholder="50"
                          required
                          style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                        />
                        <FieldDescription>Amount of fuel in liters or kWh.</FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="cost">
                          Cost <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="cost"
                          type="number"
                          value={refuelingForm.cost}
                          onChange={(e) =>
                            setRefuelingForm((prev) => ({ ...prev, cost: e.target.value }))
                          }
                          placeholder="4250"
                          required
                          style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                        />
                        <FieldDescription>Total cost of refueling (₹).</FieldDescription>
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="odometer">
                          Odometer Reading <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="odometer"
                          type="number"
                          value={refuelingForm.odometerReading}
                          onChange={(e) =>
                            setRefuelingForm((prev) => ({
                              ...prev,
                              odometerReading: e.target.value,
                            }))
                          }
                          placeholder="2480"
                          required
                          style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                        />
                        <FieldDescription>Vehicle odometer reading at refueling.</FieldDescription>
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="vendor">
                          Vendor <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                          value={refuelingForm.vendor}
                          onValueChange={(value) => {
                            setRefuelingForm((prev) => ({ ...prev, vendor: value }));
                          }}
                        >
                          <SelectTrigger id="vendor">
                            <SelectValue
                              placeholder="Select vendor"
                              aria-label="Vendor selection"
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {vendorOptions.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldDescription>Fuel vendor or station name.</FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="invoice">
                          Invoice Number <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="invoice"
                          value={refuelingForm.invoiceNumber}
                          onChange={(e) =>
                            setRefuelingForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))
                          }
                          placeholder="BP-001234"
                          required
                        />
                        <FieldDescription>Invoice or receipt number from vendor.</FieldDescription>
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="notes">Notes</FieldLabel>
                      <Textarea
                        id="notes"
                        value={refuelingForm.notes}
                        onChange={(e) =>
                          setRefuelingForm((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        placeholder="Additional notes..."
                      />
                      <FieldDescription>
                        Any additional notes about this refueling.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </form>
              </CardContent>
              <CardFooter className="border-t px-6">
                <div className="flex justify-end gap-2 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => refuelingDialog.closeDialog()}
                    disabled={isSavingRefueling}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="refueling-form"
                    className="gap-2"
                    disabled={isSavingRefueling}
                  >
                    {isSavingRefueling ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Fuel className="h-4 w-4" />
                        {refuelingDialog.isEditing ? 'Update Refueling' : 'Add Refueling'}
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Usage Dialog */}
      <Dialog
        open={usageDialog.isDialogOpen}
        onOpenChange={(open) =>
          open ? usageDialog.openDialog(usageDialog.editingItem) : usageDialog.closeDialog()
        }
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="space-y-3 flex-shrink-0 px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl">
              {usageDialog.isEditing ? 'Edit Usage Record' : 'Add Usage Record'}
            </DialogTitle>
            <DialogDescription>Record vehicle usage details</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <Card className="w-full border-0 shadow-none">
              <CardContent className="pt-6 px-6">
                <form id="usage-form" onSubmit={handleUsageSubmit}>
                  <FieldGroup>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="vehicle">
                          Vehicle <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                          value={usageForm.vehicleId}
                          disabled={vehicles.length === 0}
                          onValueChange={(value) =>
                            setUsageForm((prev) => ({ ...prev, vehicleId: value }))
                          }
                        >
                          <SelectTrigger id="vehicle">
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
                        <FieldDescription>Select the vehicle used.</FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="date">
                          Date <span className="text-destructive">*</span>
                        </FieldLabel>
                        <DatePicker
                          date={parseDateOnly(usageForm.date) ?? undefined}
                          onSelect={(date) =>
                            setUsageForm((prev) => ({
                              ...prev,
                              date: date ? formatDateOnly(date) : '',
                            }))
                          }
                          placeholder="Select usage date"
                        />
                        <FieldDescription>Date when vehicle was used.</FieldDescription>
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="startTime">
                          Start Time <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="startTime"
                          type="time"
                          value={usageForm.startTime}
                          onChange={(e) =>
                            setUsageForm((prev) => ({ ...prev, startTime: e.target.value }))
                          }
                          required
                        />
                        <FieldDescription>Time when vehicle usage started.</FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="endTime">
                          End Time <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="endTime"
                          type="time"
                          value={usageForm.endTime}
                          onChange={(e) =>
                            setUsageForm((prev) => ({ ...prev, endTime: e.target.value }))
                          }
                          required
                        />
                        <FieldDescription>Time when vehicle usage ended.</FieldDescription>
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="startOdometer">
                          Start Odometer <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="startOdometer"
                          type="number"
                          value={usageForm.startOdometer}
                          onChange={(e) =>
                            setUsageForm((prev) => ({ ...prev, startOdometer: e.target.value }))
                          }
                          placeholder="2480"
                          required
                          style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                        />
                        <FieldDescription>Odometer reading at start of usage.</FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="endOdometer">
                          End Odometer <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id="endOdometer"
                          type="number"
                          value={usageForm.endOdometer}
                          onChange={(e) =>
                            setUsageForm((prev) => ({ ...prev, endOdometer: e.target.value }))
                          }
                          placeholder="2490"
                          required
                          style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                        />
                        <FieldDescription>Odometer reading at end of usage.</FieldDescription>
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="workDescription">Work Description</FieldLabel>
                      <Textarea
                        id="workDescription"
                        value={usageForm.workDescription}
                        onChange={(e) =>
                          setUsageForm((prev) => ({ ...prev, workDescription: e.target.value }))
                        }
                        placeholder="Describe the work performed..."
                      />
                      <FieldDescription>Detailed description of work performed.</FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="usage-driver">Driver / Operator</FieldLabel>
                      <Input
                        id="usage-driver"
                        value={usageForm.operator}
                        onChange={(e) =>
                          setUsageForm((prev) => ({ ...prev, operator: e.target.value }))
                        }
                        placeholder="Enter driver name"
                      />
                      <FieldDescription>
                        Name of the driver or operator (optional).
                      </FieldDescription>
                    </Field>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="workCategory">
                          Work Category <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                          value={usageForm.workCategory}
                          onValueChange={(value: VehicleUsage['workCategory']) =>
                            setUsageForm((prev) => ({ ...prev, workCategory: value }))
                          }
                        >
                          <SelectTrigger id="workCategory">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="construction">Construction</SelectItem>
                            <SelectItem value="transport">Transport</SelectItem>
                            <SelectItem value="delivery">Delivery</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="inspection">Inspection</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldDescription>Category of work performed.</FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="site">
                          Site <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                          value={usageForm.siteId}
                          disabled={isSitesLoading || vehicleSiteOptions.length === 0}
                          onValueChange={(value) =>
                            setUsageForm((prev) => ({ ...prev, siteId: value }))
                          }
                        >
                          <SelectTrigger id="site">
                            <SelectValue
                              placeholder={
                                isSitesLoading
                                  ? 'Loading sites...'
                                  : vehicleSiteOptions.length === 0
                                    ? 'No sites found'
                                    : 'Select site'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicleSiteOptions.map((site) => (
                              <SelectItem key={site.id} value={site.id}>
                                {site.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldDescription>Site where vehicle was used.</FieldDescription>
                      </Field>
                    </div>
                    <div className="space-y-2">
                      <Field>
                        <FieldLabel htmlFor="notes">Notes</FieldLabel>
                        <Textarea
                          id="notes"
                          value={usageForm.notes}
                          onChange={(e) =>
                            setUsageForm((prev) => ({ ...prev, notes: e.target.value }))
                          }
                          placeholder="Additional notes..."
                        />
                        <FieldDescription>Any additional notes about this usage.</FieldDescription>
                      </Field>
                    </div>
                  </FieldGroup>
                </form>
              </CardContent>
              <CardFooter className="border-t px-6">
                <div className="flex justify-end gap-2 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => usageDialog.closeDialog()}
                    disabled={isSavingUsage}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="usage-form"
                    className="gap-2"
                    disabled={isSavingUsage}
                  >
                    {isSavingUsage ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Activity className="h-4 w-4" />
                        {usageDialog.isEditing ? 'Update Usage Record' : 'Add Usage Record'}
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vehicle Details Dialog */}
      <Dialog open={isVehicleDetailsDialogOpen} onOpenChange={setIsVehicleDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Vehicle Details
            </DialogTitle>
            <DialogDescription>
              Comprehensive information about {viewingVehicle?.vehicleNumber}
            </DialogDescription>
          </DialogHeader>

          {viewingVehicle && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Vehicle Number</p>
                    <p className="font-medium">{viewingVehicle.vehicleNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{viewingVehicle.type}</p>
                  </div>
                  {viewingVehicle.make && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Make</p>
                      <p className="font-medium">{viewingVehicle.make}</p>
                    </div>
                  )}
                  {viewingVehicle.model && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Model</p>
                      <p className="font-medium">{viewingVehicle.model}</p>
                    </div>
                  )}
                  {viewingVehicle.year && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Year</p>
                      <p className="font-medium">{viewingVehicle.year}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(viewingVehicle.status)} variant="secondary">
                      {formatStatus(viewingVehicle.status)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Ownership</p>
                    <p className="font-medium">
                      {viewingVehicle.isRental ? 'Rental Vehicle' : 'Owned Vehicle'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location & Assignment */}
              {(viewingVehicle.siteName || viewingVehicle.operator) && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Assignment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingVehicle.siteName && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Site
                        </p>
                        <p className="font-medium">{viewingVehicle.siteName}</p>
                      </div>
                    )}
                    {viewingVehicle.operator && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Operator
                        </p>
                        <p className="font-medium">{viewingVehicle.operator}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rental Information */}
              {viewingVehicle.isRental && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Rental Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingVehicle.vendor && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Vendor</p>
                        <p className="font-medium">{viewingVehicle.vendor}</p>
                      </div>
                    )}
                    {viewingVehicle.rentalCostPerDay && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Daily Rental Cost</p>
                        <p className="font-medium">
                          ₹{viewingVehicle.rentalCostPerDay.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {viewingVehicle.rentalStartDate && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Rental Start Date
                        </p>
                        <p className="font-medium">
                          {formatDateShort(viewingVehicle.rentalStartDate)}
                        </p>
                      </div>
                    )}
                    {viewingVehicle.rentalEndDate && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Rental End Date
                        </p>
                        <p className="font-medium">
                          {formatDateShort(viewingVehicle.rentalEndDate)}
                        </p>
                      </div>
                    )}
                    {viewingVehicle.totalRentalDays && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Total Rental Days</p>
                        <p className="font-medium">{viewingVehicle.totalRentalDays} days</p>
                      </div>
                    )}
                    {viewingVehicle.totalRentalCost && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Total Rental Cost</p>
                        <p className="font-medium">
                          ₹{viewingVehicle.totalRentalCost.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fuel Information */}
              {(viewingVehicle.fuelCapacity ||
                viewingVehicle.currentFuelLevel !== null ||
                viewingVehicle.mileage) && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Fuel & Mileage
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {viewingVehicle.fuelCapacity && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Fuel className="h-3 w-3" />
                          Fuel Capacity
                        </p>
                        <p className="font-medium">{viewingVehicle.fuelCapacity} L</p>
                      </div>
                    )}
                    {viewingVehicle.currentFuelLevel !== null && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Current Fuel Level</p>
                        <p className="font-medium">{viewingVehicle.currentFuelLevel} L</p>
                      </div>
                    )}
                    {viewingVehicle.mileage && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Mileage</p>
                        <p className="font-medium">{viewingVehicle.mileage.toLocaleString()} km</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Maintenance & Insurance */}
              {(viewingVehicle.lastMaintenanceDate ||
                viewingVehicle.nextMaintenanceDate ||
                viewingVehicle.insuranceExpiry ||
                viewingVehicle.registrationExpiry) && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Maintenance & Compliance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingVehicle.lastMaintenanceDate && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last Maintenance
                        </p>
                        <p className="font-medium">
                          {formatDateShort(viewingVehicle.lastMaintenanceDate)}
                        </p>
                      </div>
                    )}
                    {viewingVehicle.nextMaintenanceDate && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Next Maintenance
                        </p>
                        <p className="font-medium">
                          {formatDateShort(viewingVehicle.nextMaintenanceDate)}
                        </p>
                      </div>
                    )}
                    {viewingVehicle.insuranceExpiry && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Insurance Expiry
                        </p>
                        <p className="font-medium">
                          {formatDateShort(viewingVehicle.insuranceExpiry)}
                        </p>
                      </div>
                    )}
                    {viewingVehicle.registrationExpiry && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Registration Expiry
                        </p>
                        <p className="font-medium">
                          {formatDateShort(viewingVehicle.registrationExpiry)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10">
                    <CardContent className="p-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Refueling Records</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {refuelingRecords.filter((r) => r.vehicleId === viewingVehicle.id).length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10">
                    <CardContent className="p-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Usage Records</p>
                        <p className="text-2xl font-bold text-green-600">
                          {usageRecords.filter((r) => r.vehicleId === viewingVehicle.id).length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5">
                    <CardContent className="p-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Total Distance</p>
                        <p className="text-2xl font-bold text-primary">
                          {usageRecords
                            .filter((r) => r.vehicleId === viewingVehicle.id)
                            .reduce((sum, r) => sum + r.totalDistance, 0)
                            .toLocaleString()}{' '}
                          km
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsVehicleDetailsDialogOpen(false);
                    setSelectedVehicle(viewingVehicle.id);
                    onVehicleSelect?.(viewingVehicle.id);
                  }}
                >
                  View Operations
                </Button>
                <Button onClick={() => setIsVehicleDetailsDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
