'use client';

import {
  Plus,
  Package,
  Building2,
  Edit,
  Trash2,
  Search,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  Activity,
  Target,
  Wrench,
  FileText,
  Filter,
  AlertCircle,
  X,
  Image as ImageIcon,
  Upload,
  RotateCcw,
} from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DataTable } from '@/components/common/DataTable';
import { FormDialog } from '@/components/common/FormDialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FilterSheet } from '@/components/filters/FilterSheet';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMaterials, useWorkProgress } from '@/lib/contexts';
import type { WorkProgressEntry as WorkProgressEntity } from '@/types/entities';
import { useDialogState } from '@/lib/hooks/useDialogState';
import { useTableState } from '@/lib/hooks/useTableState';
import { formatDateShort } from '@/lib/utils';
import { formatDateOnly } from '@/lib/utils/date';

interface SiteOption {
  id: string;
  name: string;
  imageUrl?: string;
  location?: string;
  status?: 'Active' | 'Completed' | 'On Hold';
  progress?: number;
}

interface WorkProgressFormEntry {
  id: string;
  siteId: string;
  siteName: string;
  workType: string;
  description: string;
  date: string;
  unit: string;
  length?: number;
  breadth?: number;
  thickness?: number;
  totalQuantity: number;
  materialsUsed: {
    purchaseId: string;
    materialId?: string;
    materialName: string;
    quantity: number;
    unit: string;
    balanceStock: number;
  }[];
  laborHours: number;
  progressPercentage: number;
  notes: string;
  photos: string[];
  status: 'In Progress' | 'Completed' | 'On Hold';
}

const STATUS_LABEL_MAP: Record<WorkProgressEntity['status'], WorkProgressFormEntry['status']> = {
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
};

const STATUS_VALUE_MAP: Record<WorkProgressFormEntry['status'], WorkProgressEntity['status']> = {
  'In Progress': 'in_progress',
  Completed: 'completed',
  'On Hold': 'on_hold',
};

interface WorkProgressProps {
  selectedSite?: string;
  onSiteSelect?: (siteId: string) => void;
  filterBySite?: string;
}

export function WorkProgressPage({ filterBySite }: WorkProgressProps) {
  const searchParams = useSearchParams();
  const { materials, updateMaterial, refresh: refreshMaterials } = useMaterials();
  const {
    entries: workProgressEntriesRaw,
    isLoading: isWorkProgressLoading,
    addEntry: addWorkProgressEntry,
    updateEntry: updateWorkProgressEntry,
    deleteEntry: deleteWorkProgressEntry,
  } = useWorkProgress();

  // Use shared state hooks
  const tableState = useTableState({
    initialSortField: 'date',
    initialSortDirection: 'desc',
    initialItemsPerPage: 10,
  });

  const dialog = useDialogState<WorkProgressFormEntry>();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all');
  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([]);
  const [isSitesLoading, setIsSitesLoading] = useState<boolean>(true);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  type WorkAdvancedFilterState = {
    sites: string[];
    workTypes: string[];
    dateFrom?: string;
    dateTo?: string;
    progressMin: string;
    progressMax: string;
    laborMin: string;
    laborMax: string;
    hasPhotos: 'all' | 'with' | 'without';
    hasNotes: 'all' | 'with' | 'without';
    hasMaterials: 'all' | 'with' | 'without';
  };

  const createDefaultWorkAdvancedFilters = (): WorkAdvancedFilterState => ({
    sites: [],
    workTypes: [],
    dateFrom: undefined,
    dateTo: undefined,
    progressMin: '',
    progressMax: '',
    laborMin: '',
    laborMax: '',
    hasPhotos: 'all',
    hasNotes: 'all',
    hasMaterials: 'all',
  });

  const cloneWorkAdvancedFilters = (
    filters: WorkAdvancedFilterState,
  ): WorkAdvancedFilterState => ({
    ...filters,
    sites: [...filters.sites],
    workTypes: [...filters.workTypes],
  });

  const isWorkAdvancedFilterDefault = (filters: WorkAdvancedFilterState): boolean => {
    return (
      filters.sites.length === 0 &&
      filters.workTypes.length === 0 &&
      !filters.dateFrom &&
      !filters.dateTo &&
      filters.progressMin === '' &&
      filters.progressMax === '' &&
      filters.laborMin === '' &&
      filters.laborMax === '' &&
      filters.hasPhotos === 'all' &&
      filters.hasNotes === 'all' &&
      filters.hasMaterials === 'all'
    );
  };

  const countWorkAdvancedFilters = (filters: WorkAdvancedFilterState): number => {
    let count = 0;
    count += filters.sites.length;
    count += filters.workTypes.length;
    if (filters.dateFrom || filters.dateTo) count += 1;
    if (filters.progressMin !== '' || filters.progressMax !== '') count += 1;
    if (filters.laborMin !== '' || filters.laborMax !== '') count += 1;
    if (filters.hasPhotos !== 'all') count += 1;
    if (filters.hasNotes !== 'all') count += 1;
    if (filters.hasMaterials !== 'all') count += 1;
    return count;
  };

  const parseDateValue = (value?: string): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const [appliedAdvancedFilters, setAppliedAdvancedFilters] =
    useState<WorkAdvancedFilterState>(createDefaultWorkAdvancedFilters());
  const [draftAdvancedFilters, setDraftAdvancedFilters] =
    useState<WorkAdvancedFilterState>(createDefaultWorkAdvancedFilters());

  // Auto-open dialog if openDialog URL parameter is present
  useEffect(() => {
    if (searchParams?.get('openDialog') === 'true') {
      dialog.openDialog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const loadSites = async () => {
      try {
        setIsSitesLoading(true);
        const response = await fetch('/api/sites', { cache: 'no-store' });
        const payload = (await response.json().catch(() => ({}))) as {
          sites?: Array<{
            id: string;
            name: string;
            location?: string;
            status?: SiteOption['status'];
            progress?: number | null;
          }>;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load sites.');
        }

        const mappedSites =
          payload.sites?.map((site) => ({
            id: site.id,
            name: site.name,
            location: site.location,
            status: site.status ?? 'Active',
            progress: site.progress ?? undefined,
          })) ?? [];

        setSiteOptions(mappedSites);
      } catch (error) {
        console.error('Failed to load sites list', error);
        toast.error('Failed to load sites list.');
        setSiteOptions([]);
      } finally {
        setIsSitesLoading(false);
      }
    };

    void loadSites();
  }, []);

  const siteOptionsWithFilter = useMemo(() => {
    if (!filterBySite) {
      return siteOptions;
    }

    const existingSite = siteOptions.find((site) => site.name === filterBySite);
    if (existingSite) {
      return siteOptions;
    }

    const slug = filterBySite
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return [
      ...siteOptions,
      {
        id: `auto-${slug || 'site'}`,
        name: filterBySite,
      },
    ];
  }, [siteOptions, filterBySite]);

  const resolvedSite = useMemo(
    () =>
      filterBySite
        ? siteOptionsWithFilter.find((site) => site.name === filterBySite)
        : undefined,
    [filterBySite, siteOptionsWithFilter],
  );

  const workProgressEntries = useMemo<WorkProgressFormEntry[]>(
    () =>
      workProgressEntriesRaw.map((entry) => ({
        id: entry.id,
        siteId: entry.siteId ?? '',
        siteName: entry.siteName,
        workType: entry.workType,
        description: entry.description ?? '',
        date: entry.workDate,
        unit: entry.unit,
        length: entry.length ?? 0,
        breadth: entry.breadth ?? 0,
        thickness: entry.thickness ?? 0,
        totalQuantity: entry.totalQuantity,
        materialsUsed: (entry.materials ?? []).map((material) => {
          const fallbackPurchaseId =
            material.purchaseId ??
            (material.materialId
              ? materials.find((m) => m.materialId === material.materialId)?.id ?? ''
              : '');

          return {
            purchaseId: fallbackPurchaseId,
            materialId: material.materialId ?? undefined,
            materialName: material.materialName,
            quantity: material.quantity,
            unit: material.unit,
            balanceStock: material.balanceQuantity ?? 0,
          };
        }),
        laborHours: entry.laborHours,
        progressPercentage: entry.progressPercentage,
        notes: entry.notes ?? '',
        photos: entry.photos ?? [],
        status: STATUS_LABEL_MAP[entry.status] ?? 'In Progress',
      })),
    [materials, workProgressEntriesRaw],
  );

  const workTypeOptions = useMemo(() => {
    const types = new Set<string>();
    workProgressEntries.forEach((entry) => {
      if (entry.workType) {
        types.add(entry.workType);
      }
    });
    return Array.from(types).sort((a, b) => a.localeCompare(b));
  }, [workProgressEntries]);

  const activeAdvancedFilterCount = useMemo(
    () => countWorkAdvancedFilters(appliedAdvancedFilters),
    [appliedAdvancedFilters],
  );
  const hasActiveAdvancedFilters = activeAdvancedFilterCount > 0;

  const createEmptyWorkForm = (site?: { id: string; name: string }) => ({
    id: '',
    siteId: site?.id ?? '',
    siteName: site?.name ?? '',
    workType: '',
    description: '',
    date: '',
    unit: '',
    length: 0,
    breadth: 0,
    thickness: 0,
    totalQuantity: 0,
    materialsUsed: [] as {
      purchaseId: string;
      materialId?: string;
      materialName: string;
      quantity: number;
      unit: string;
      balanceStock: number;
    }[],
    laborHours: 0,
    progressPercentage: 0,
    notes: '',
    photos: [] as string[],
    status: 'In Progress' as WorkProgressFormEntry['status'],
  });

  const [workProgressForm, setWorkProgressForm] = useState(() => createEmptyWorkForm(resolvedSite));

  // Material selection state
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [materialQuantity, setMaterialQuantity] = useState(0);

  const selectedMaterialDetails = useMemo(() => {
    if (!selectedMaterial) return undefined;
    return materials.find((material) => material.id === selectedMaterial);
  }, [materials, selectedMaterial]);

  const pendingQuantityForSelected = useMemo(() => {
    if (!selectedMaterial) return 0;
    return workProgressForm.materialsUsed
      .filter((material) => material.purchaseId === selectedMaterial)
      .reduce((sum, material) => sum + material.quantity, 0);
  }, [selectedMaterial, workProgressForm.materialsUsed]);

  const projectedBalance =
    selectedMaterialDetails?.remainingQuantity !== undefined
      ? Math.max(
          0,
          (selectedMaterialDetails.remainingQuantity ?? 0) -
            pendingQuantityForSelected -
            materialQuantity,
        )
      : undefined;

  useEffect(() => {
    if (!dialog.isDialogOpen) {
      setWorkProgressForm((prev) => {
        if (prev.siteId || !resolvedSite) {
          return prev;
        }
        return createEmptyWorkForm(resolvedSite);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSite]);

  const buildMasterTotals = useCallback(() => {
    const totals = new Map<
      string,
      {
        remaining: number;
        consumed: number;
      }
    >();

    materials.forEach((item) => {
      if (!item.materialId) {
        return;
      }
      const ordered = item.quantity ?? 0;
      const consumed =
        item.consumedQuantity ??
        Math.max(0, ordered - (item.remainingQuantity ?? ordered));
      const remaining =
        item.remainingQuantity ?? Math.max(0, ordered - consumed);

      const existing = totals.get(item.materialId) ?? { remaining: 0, consumed: 0 };
      existing.remaining += remaining;
      existing.consumed += consumed;
      totals.set(item.materialId, existing);
    });

    return totals;
  }, [materials]);

  const applyMasterAdjustments = useCallback(
    async (
      adjustments: Map<string, { remainingDelta: number; consumedDelta: number }>,
      baseTotals: Map<string, { remaining: number; consumed: number }>,
    ) => {
      for (const [masterId, delta] of adjustments) {
        const base = baseTotals.get(masterId) ?? { remaining: 0, consumed: 0 };
        const finalRemaining = Math.max(0, base.remaining + delta.remainingDelta);
        const finalConsumed = Math.max(0, base.consumed + delta.consumedDelta);

        try {
          await fetch(`/api/materials/${masterId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quantity: finalRemaining,
              consumedQuantity: finalConsumed,
            }),
          });
          baseTotals.set(masterId, {
            remaining: finalRemaining,
            consumed: finalConsumed,
          });
        } catch (error) {
          console.error('Failed to sync material master totals', error);
        }
      }
    },
    [],
  );

  const buildPayload = useCallback(
    (form: WorkProgressFormEntry) => ({
      siteId: form.siteId || null,
      siteName: form.siteName,
      workType: form.workType,
      description: form.description || null,
      workDate: form.date,
      unit: form.unit,
      length: form.length || null,
      breadth: form.breadth || null,
      thickness: form.thickness || null,
      totalQuantity: form.totalQuantity,
      laborHours: form.laborHours,
      progressPercentage: form.progressPercentage,
      status: STATUS_VALUE_MAP[form.status],
      notes: form.notes || null,
      photos: form.photos,
      materials: form.materialsUsed.map((material) => {
        const purchase = materials.find((m) => m.id === material.purchaseId);
        return {
          materialId: material.materialId || purchase?.materialId || null,
          purchaseId: material.purchaseId || null,
          materialName: material.materialName,
          unit: material.unit,
          quantity: material.quantity,
          balanceQuantity: material.balanceStock,
        };
      }),
    }),
    [materials],
  );

  // Filter work progress entries
  const dateFrom = parseDateValue(appliedAdvancedFilters.dateFrom);
  const dateTo = parseDateValue(appliedAdvancedFilters.dateTo);
  const progressMin =
    appliedAdvancedFilters.progressMin !== ''
      ? Number(appliedAdvancedFilters.progressMin)
      : undefined;
  const progressMax =
    appliedAdvancedFilters.progressMax !== ''
      ? Number(appliedAdvancedFilters.progressMax)
      : undefined;
  const laborMin =
    appliedAdvancedFilters.laborMin !== ''
      ? Number(appliedAdvancedFilters.laborMin)
      : undefined;
  const laborMax =
    appliedAdvancedFilters.laborMax !== ''
      ? Number(appliedAdvancedFilters.laborMax)
      : undefined;

  const filteredEntries = workProgressEntries.filter((entry) => {
    const matchesSite = !filterBySite || entry.siteName === filterBySite;
    const matchesAdvancedSites =
      filterBySite ||
      appliedAdvancedFilters.sites.length === 0 ||
      appliedAdvancedFilters.sites.includes(entry.siteName);
    const matchesSearch =
      tableState.searchTerm === '' ||
      entry.description.toLowerCase().includes(tableState.searchTerm.toLowerCase()) ||
      entry.workType.toLowerCase().includes(tableState.searchTerm.toLowerCase()) ||
      entry.siteName.toLowerCase().includes(tableState.searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesWorkType = workTypeFilter === 'all' || entry.workType === workTypeFilter;
    const matchesAdvancedWorkTypes =
      appliedAdvancedFilters.workTypes.length === 0 ||
      appliedAdvancedFilters.workTypes.includes(entry.workType);
    const entryDate = parseDateValue(entry.date);
    const matchesDateFrom = !dateFrom || (entryDate !== null && entryDate >= dateFrom);
    const matchesDateTo = !dateTo || (entryDate !== null && entryDate <= dateTo);
    const matchesProgressMin =
      progressMin === undefined ||
      Number.isNaN(progressMin) ||
      entry.progressPercentage >= progressMin;
    const matchesProgressMax =
      progressMax === undefined ||
      Number.isNaN(progressMax) ||
      entry.progressPercentage <= progressMax;
    const matchesLaborMin =
      laborMin === undefined || Number.isNaN(laborMin) || entry.laborHours >= laborMin;
    const matchesLaborMax =
      laborMax === undefined || Number.isNaN(laborMax) || entry.laborHours <= laborMax;
    const hasPhotos = (entry.photos ?? []).length > 0;
    const matchesPhotos =
      appliedAdvancedFilters.hasPhotos === 'all' ||
      (appliedAdvancedFilters.hasPhotos === 'with' && hasPhotos) ||
      (appliedAdvancedFilters.hasPhotos === 'without' && !hasPhotos);
    const hasNotes = Boolean(entry.notes && entry.notes.trim().length > 0);
    const matchesNotes =
      appliedAdvancedFilters.hasNotes === 'all' ||
      (appliedAdvancedFilters.hasNotes === 'with' && hasNotes) ||
      (appliedAdvancedFilters.hasNotes === 'without' && !hasNotes);
    const hasMaterials = entry.materialsUsed.length > 0;
    const matchesMaterials =
      appliedAdvancedFilters.hasMaterials === 'all' ||
      (appliedAdvancedFilters.hasMaterials === 'with' && hasMaterials) ||
      (appliedAdvancedFilters.hasMaterials === 'without' && !hasMaterials);

    return (
      matchesSite &&
      matchesAdvancedSites &&
      matchesSearch &&
      matchesStatus &&
      matchesWorkType &&
      matchesAdvancedWorkTypes &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesProgressMin &&
      matchesProgressMax &&
      matchesLaborMin &&
      matchesLaborMax &&
      matchesPhotos &&
      matchesNotes &&
      matchesMaterials
    );
  });

  // Calculate statistics (filtered by site if applicable)
  const entriesForStats = filterBySite
    ? workProgressEntries.filter((e) => e.siteName === filterBySite)
    : workProgressEntries;
  const totalEntries = entriesForStats.length;
  const completedEntries = entriesForStats.filter((entry) => entry.status === 'Completed').length;
  const inProgressEntries = entriesForStats.filter(
    (entry) => entry.status === 'In Progress',
  ).length;
  const totalLaborHours = entriesForStats.reduce((sum, entry) => sum + entry.laborHours, 0);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !workProgressForm.siteName ||
      !workProgressForm.workType ||
      !workProgressForm.date ||
      !workProgressForm.unit
    ) {
      toast.error('Please complete all required fields.');
      return;
    }

    const payload = buildPayload(workProgressForm);
    const masterBaseTotals = buildMasterTotals();
    const masterAdjustments = new Map<string, { remainingDelta: number; consumedDelta: number }>();

    const accumulateMasterAdjustment = (masterId: string | undefined, consumedDelta: number, remainingDelta: number) => {
      if (!masterId) return;
      const existing = masterAdjustments.get(masterId) ?? { consumedDelta: 0, remainingDelta: 0 };
      existing.consumedDelta += consumedDelta;
      existing.remainingDelta += remainingDelta;
      masterAdjustments.set(masterId, existing);
    };

    try {
      if (dialog.editingItem) {
        await updateWorkProgressEntry(dialog.editingItem.id, payload);
        toast.success('Work progress updated successfully!');

        const previousMap = new Map<string, number>();
        (dialog.editingItem.materialsUsed ?? []).forEach((material) => {
          if (material.purchaseId) {
            previousMap.set(material.purchaseId, material.quantity);
          }
        });

        const materialDeltas = new Map<string, number>();

        workProgressForm.materialsUsed.forEach((material) => {
          if (!material.purchaseId) return;
          const previousQty = previousMap.get(material.purchaseId) ?? 0;
          const delta = material.quantity - previousQty;
          materialDeltas.set(material.purchaseId, delta);
          previousMap.delete(material.purchaseId);
        });

        previousMap.forEach((quantity, purchaseId) => {
          materialDeltas.set(purchaseId, -quantity);
        });

        for (const [purchaseId, delta] of materialDeltas) {
          if (delta === 0) continue;

          const purchase = materials.find((m) => m.id === purchaseId);
          if (!purchase) continue;

          const ordered = purchase.quantity ?? 0;
          const previousConsumed =
            purchase.consumedQuantity ??
            Math.max(0, ordered - (purchase.remainingQuantity ?? ordered));
          const previousRemaining =
            purchase.remainingQuantity ?? Math.max(0, ordered - previousConsumed);

          const updatedConsumed = Math.min(
            ordered,
            Math.max(0, previousConsumed + delta),
          );
          const consumedDelta = updatedConsumed - previousConsumed;
          const updatedRemaining = Math.max(0, ordered - updatedConsumed);
          const remainingDelta = updatedRemaining - previousRemaining;

          try {
            await updateMaterial(purchase.id, {
              ...purchase,
              consumedQuantity: updatedConsumed,
              remainingQuantity: updatedRemaining,
            });
            accumulateMasterAdjustment(purchase.materialId, consumedDelta, remainingDelta);
          } catch (error) {
            console.error('Failed to update material consumption', error);
            toast.error('Failed to update material consumption.');
          }
        }
      } else {
        await addWorkProgressEntry(payload);
        toast.success('Work progress recorded successfully!');

        for (const material of workProgressForm.materialsUsed) {
          const existingMaterial = materials.find((m) => m.id === material.purchaseId);
          if (!existingMaterial) continue;

          const totalOrdered = existingMaterial.quantity ?? 0;
          const prevConsumed =
            existingMaterial.consumedQuantity ??
            Math.max(0, totalOrdered - (existingMaterial.remainingQuantity ?? totalOrdered));
          const previousRemaining =
            existingMaterial.remainingQuantity ?? Math.max(0, totalOrdered - prevConsumed);

          const newConsumedQuantity = Math.min(
            totalOrdered,
            Math.max(0, prevConsumed + material.quantity),
          );
          const newRemainingQuantity = Math.max(0, totalOrdered - newConsumedQuantity);

          const consumedDelta = newConsumedQuantity - prevConsumed;
          const remainingDelta = newRemainingQuantity - previousRemaining;

          try {
            await updateMaterial(existingMaterial.id, {
              ...existingMaterial,
              consumedQuantity: newConsumedQuantity,
              remainingQuantity: newRemainingQuantity,
            });
            accumulateMasterAdjustment(
              existingMaterial.materialId,
              consumedDelta,
              remainingDelta,
            );
          } catch (error) {
              console.error('Failed to update material consumption', error);
              toast.error('Failed to update material consumption.');
          }
        }
      }

      await applyMasterAdjustments(masterAdjustments, masterBaseTotals);
      await refreshMaterials();

      dialog.closeDialog();
      setWorkProgressForm(createEmptyWorkForm(resolvedSite));
      setSelectedMaterial('');
      setMaterialQuantity(0);
    } catch (error) {
      console.error('Failed to save work progress entry', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to save work progress entry. Please try again.',
      );
    }
  };

  const handleEdit = (entry: WorkProgressFormEntry) => {
    dialog.openDialog(entry);
    setWorkProgressForm({
      id: entry.id,
      siteId: entry.siteId,
      siteName: entry.siteName,
      workType: entry.workType,
      description: entry.description,
      date: entry.date,
      unit: entry.unit,
      length: entry.length || 0,
      breadth: entry.breadth || 0,
      thickness: entry.thickness || 0,
      totalQuantity: entry.totalQuantity,
      materialsUsed: entry.materialsUsed,
      laborHours: entry.laborHours,
      progressPercentage: entry.progressPercentage,
      notes: entry.notes,
      photos: entry.photos,
      status: entry.status,
    });
  };

  // Handle adding material to the work entry
  const handleAddMaterial = () => {
    if (!selectedMaterial || materialQuantity <= 0) return;

    const material = materials.find((m) => m.id === selectedMaterial);
    if (!material) return;

    const balanceStock = material.remainingQuantity || 0;

    if (materialQuantity > balanceStock) {
      alert(`Insufficient stock! Available: ${balanceStock} ${material.unit}`);
      return;
    }

    const newMaterialEntry = {
      purchaseId: material.id,
      materialId: material.materialId ?? undefined,
      materialName: material.materialName,
      quantity: materialQuantity,
      unit: material.unit,
      balanceStock: balanceStock - materialQuantity,
    };

    setWorkProgressForm((prev) => ({
      ...prev,
      materialsUsed: [...prev.materialsUsed, newMaterialEntry],
    }));

    setSelectedMaterial('');
    setMaterialQuantity(0);
  };

  // Handle removing material from the work entry
  const handleRemoveMaterial = (index: number) => {
    setWorkProgressForm((prev) => ({
      ...prev,
      materialsUsed: prev.materialsUsed.filter((_, i) => i !== index),
    }));
  };

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // In production, upload to cloud storage and get URLs
    // For now, create local URLs
    const newPhotos = Array.from(files).map((file) => URL.createObjectURL(file));

    setWorkProgressForm((prev) => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos],
    }));
  };

  // Handle photo removal
  const handleRemovePhoto = (index: number) => {
    setWorkProgressForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  // Get available materials for selected site
  const getAvailableMaterials = () => {
    if (!workProgressForm.siteName) return [];
    return materials.filter(
      (m) => m.site === workProgressForm.siteName && (m.remainingQuantity || 0) > 0,
    );
  };

  const handleDelete = async (entryId: string, description: string) => {
    const confirmed = window.confirm(
      `Delete the work progress entry "${description || 'Untitled'}"? This action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteWorkProgressEntry(entryId);
      toast.success('Work progress entry deleted successfully.');
    } catch (error) {
      console.error('Failed to delete work progress entry', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to delete work progress entry right now.',
      );
    }
  };

  const getWorkTypeIcon = (workType: string) => {
    switch (workType) {
      case 'Foundation':
        return Building2;
      case 'Plumbing':
        return Wrench;
      case 'Electrical':
        return Activity;
      case 'Painting':
        return FileText;
      default:
        return Target;
    }
  };

  if (isWorkProgressLoading && workProgressEntries.length === 0) {
    return (
      <div className="w-full min-w-0 bg-background">
        <div className="flex h-64 items-center justify-center">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Loading work progress...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 bg-background">
      <div className="p-4 md:p-6 space-y-6 max-w-full min-w-0">
        {/* Work Progress Statistics */}
        <Card className="w-full overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Entries</p>
                      <p className="text-2xl font-bold text-primary">{totalEntries}</p>
                    </div>
                    <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{completedEntries}</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                      <p className="text-2xl font-bold text-blue-600">{inProgressEntries}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Labor Hours</p>
                      <p className="text-2xl font-bold text-orange-600">{totalLaborHours}</p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="w-full overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0 w-full">
                  <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-[400px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search work entries..."
                      value={tableState.searchTerm}
                      onChange={(e) => tableState.setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Work Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Foundation">Foundation</SelectItem>
                      <SelectItem value="Plumbing">Plumbing</SelectItem>
                      <SelectItem value="Electrical">Electrical</SelectItem>
                      <SelectItem value="Painting">Painting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 transition-all hover:shadow-md"
                          onClick={() => {
                            setDraftAdvancedFilters(cloneWorkAdvancedFilters(appliedAdvancedFilters));
                            setIsFilterSheetOpen(true);
                          }}
                        >
                          <Filter className="h-4 w-4" />
                          <span className="hidden sm:inline">Filter</span>
                          {hasActiveAdvancedFilters ? (
                            <Badge variant="secondary" className="ml-2">
                              {activeAdvancedFilterCount}
                            </Badge>
                          ) : null}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Open advanced filter options</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 transition-all hover:shadow-md"
                    disabled={!hasActiveAdvancedFilters}
                    onClick={() => {
                      const resetFilters = createDefaultWorkAdvancedFilters();
                      setAppliedAdvancedFilters(resetFilters);
                      setDraftAdvancedFilters(resetFilters);
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear filters</span>
                  </Button>
                  <FormDialog
                    title={dialog.editingItem ? 'Edit Work Entry' : 'Add New Work Entry'}
                    description={
                      dialog.editingItem
                        ? 'Update work progress details'
                        : 'Record new work progress and material usage'
                    }
                    isOpen={dialog.isDialogOpen}
                    maxWidth="max-w-2xl"
                    onOpenChange={(open) => {
                      if (open) {
                        dialog.openDialog();
                      } else {
                        dialog.closeDialog();
                      }
                    }}
                    trigger={
                      <Button
                        onClick={() => {
                          dialog.openDialog();
                          setWorkProgressForm(createEmptyWorkForm(resolvedSite));
                          setSelectedMaterial('');
                          setMaterialQuantity(0);
                        }}
                        disabled={isSitesLoading || siteOptionsWithFilter.length === 0}
                        className="gap-2 transition-all hover:shadow-md whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">New Entry</span>
                      </Button>
                    }
                  >
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <ScrollArea className="h-[55vh] md:h-[60vh] pr-6">
                        <div className="space-y-4 pr-1 pb-6">
                          {/* Basic Information */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-foreground">
                              Basic Information
                            </h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Work Type</Label>
                                <Select
                                  value={workProgressForm.workType}
                                  onValueChange={(value) =>
                                    setWorkProgressForm((prev) => ({ ...prev, workType: value }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select work type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Foundation">Foundation</SelectItem>
                                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                                    <SelectItem value="Electrical">Electrical</SelectItem>
                                    <SelectItem value="Painting">Painting</SelectItem>
                                    <SelectItem value="Roofing">Roofing</SelectItem>
                                    <SelectItem value="Flooring">Flooring</SelectItem>
                                    <SelectItem value="Masonry">Masonry</SelectItem>
                                    <SelectItem value="Plastering">Plastering</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Date</Label>
                                <DatePicker
                                  date={
                                    workProgressForm.date
                                      ? new Date(workProgressForm.date)
                                      : undefined
                                  }
                                  onSelect={(date) =>
                                    setWorkProgressForm((prev) => ({
                                      ...prev,
                                      date: date ? formatDateOnly(date) : '',
                                    }))
                                  }
                                  placeholder="Select work date"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Site</Label>
                              <Select
                                value={workProgressForm.siteId}
                                disabled={
                                  Boolean(resolvedSite) ||
                                  isSitesLoading ||
                                  siteOptionsWithFilter.length === 0
                                }
                                onValueChange={(value) => {
                                  const site = siteOptionsWithFilter.find((s) => s.id === value);
                                  setWorkProgressForm((prev) => ({
                                    ...prev,
                                    siteId: value,
                                    siteName: site?.name || '',
                                    materialsUsed: [], // Reset materials when site changes
                                  }));
                                  setSelectedMaterial('');
                                  setMaterialQuantity(0);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      resolvedSite
                                        ? resolvedSite.name
                                        : isSitesLoading
                                          ? 'Loading sites...'
                                          : siteOptionsWithFilter.length === 0
                                            ? 'No sites available'
                                            : 'Select site'
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {isSitesLoading ? (
                                    <SelectItem value="__loading" disabled>
                                      Loading sites...
                                    </SelectItem>
                                  ) : siteOptionsWithFilter.length === 0 ? (
                                    <SelectItem value="__none" disabled>
                                      No sites available. Create a site first.
                                    </SelectItem>
                                  ) : (
                                    siteOptionsWithFilter.map((site) => (
                                      <SelectItem key={site.id} value={site.id}>
                                        {site.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                placeholder="Describe the work performed"
                                value={workProgressForm.description}
                                onChange={(e) =>
                                  setWorkProgressForm((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                  }))
                                }
                                required
                                rows={3}
                              />
                            </div>
                          </div>

                          <Separator />

                          {/* Measurements */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-foreground">Measurements</h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Unit</Label>
                                <Select
                                  value={workProgressForm.unit}
                                  onValueChange={(value) =>
                                    setWorkProgressForm((prev) => ({ ...prev, unit: value }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="cum">Cubic Meter (cum)</SelectItem>
                                    <SelectItem value="sqm">Square Meter (sqm)</SelectItem>
                                    <SelectItem value="rmt">Running Meter (rmt)</SelectItem>
                                    <SelectItem value="nos">Numbers (nos)</SelectItem>
                                    <SelectItem value="sqft">Square Feet (sqft)</SelectItem>
                                    <SelectItem value="cft">Cubic Feet (cft)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Total Quantity</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={workProgressForm.totalQuantity || ''}
                                  onChange={(e) =>
                                    setWorkProgressForm((prev) => ({
                                      ...prev,
                                      totalQuantity: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              <div className="space-y-2">
                                <Label>Length (m)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={workProgressForm.length || ''}
                                  onChange={(e) =>
                                    setWorkProgressForm((prev) => ({
                                      ...prev,
                                      length: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Breadth (m)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={workProgressForm.breadth || ''}
                                  onChange={(e) =>
                                    setWorkProgressForm((prev) => ({
                                      ...prev,
                                      breadth: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Thickness (m)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={workProgressForm.thickness || ''}
                                  onChange={(e) =>
                                    setWorkProgressForm((prev) => ({
                                      ...prev,
                                      thickness: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* Material Consumption */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-foreground">
                              Material Consumption
                            </h3>

                            {!workProgressForm.siteId ? (
                              <div className="p-4 bg-muted rounded-lg text-center">
                                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  Please select a site first to add materials
                                </p>
                              </div>
                            ) : getAvailableMaterials().length === 0 ? (
                              <div className="p-4 bg-muted rounded-lg text-center">
                                <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  No materials available for this site
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex flex-col gap-3 md:flex-row">
                                  <div className="flex-1 space-y-2">
                                    <Label>Select Material</Label>
                                    <Select
                                      value={selectedMaterial}
                                      onValueChange={setSelectedMaterial}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Choose material" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getAvailableMaterials().map((material) => (
                                          <SelectItem key={material.id} value={material.id}>
                                            {material.materialName} (Balance:{' '}
                                            {material.remainingQuantity} {material.unit})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="md:w-32 space-y-2">
                                    <Label>Quantity</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0"
                                      value={materialQuantity || ''}
                                      onChange={(e) =>
                                        setMaterialQuantity(parseFloat(e.target.value) || 0)
                                      }
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <Button
                                      type="button"
                                      onClick={handleAddMaterial}
                                      size="sm"
                                      className="h-10"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {selectedMaterial && (
                                  <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-blue-900 dark:text-blue-100">
                                      <span className="font-medium">Balance Stock:</span>{' '}
                                      {(projectedBalance ??
                                        selectedMaterialDetails?.remainingQuantity ??
                                        0
                                      )
                                        .toLocaleString(undefined, {
                                          maximumFractionDigits: 2,
                                        })}{' '}
                                      {selectedMaterialDetails?.unit}
                                      {projectedBalance !== undefined &&
                                      selectedMaterialDetails?.remainingQuantity !== undefined
                                        ? ` (after this entry)`
                                        : ''}
                                    </p>
                                  </div>
                                )}

                                {workProgressForm.materialsUsed.length > 0 && (
                                  <div className="space-y-2">
                                    <Label>Added Materials</Label>
                                    <div className="space-y-2">
                                      {workProgressForm.materialsUsed.map((material, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                        >
                                          <div className="flex-1">
                                            <p className="text-sm font-medium">
                                              {material.materialName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              Quantity: {material.quantity} {material.unit} |
                                              Balance after: {material.balanceStock} {material.unit}
                                            </p>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveMaterial(index)}
                                            className="h-8 w-8 p-0"
                                          >
                                            <X className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <Separator />

                          {/* Labor & Progress */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-foreground">
                              Labor & Progress
                            </h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Labor Hours</Label>
                                <Input
                                  type="number"
                                  step="0.5"
                                  placeholder="0"
                                  value={workProgressForm.laborHours || ''}
                                  onChange={(e) =>
                                    setWorkProgressForm((prev) => ({
                                      ...prev,
                                      laborHours: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Progress Percentage</Label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  min="0"
                                  max="100"
                                  value={workProgressForm.progressPercentage || ''}
                                  onChange={(e) =>
                                    setWorkProgressForm((prev) => ({
                                      ...prev,
                                      progressPercentage: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Status</Label>
                              <Select
                                value={workProgressForm.status}
                                onValueChange={(value) =>
                                  setWorkProgressForm((prev) => ({
                                    ...prev,
                                    status: value as WorkProgressFormEntry['status'],
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Completed">Completed</SelectItem>
                                  <SelectItem value="On Hold">On Hold</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <Separator />

                          {/* Photo Attachments */}
                          <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-foreground">
                              Photo Attachments
                            </h3>

                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Label
                                  htmlFor="photo-upload"
                                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
                                >
                                  <Upload className="h-4 w-4" />
                                  <span>Upload Photos</span>
                                </Label>
                                <Input
                                  id="photo-upload"
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={handlePhotoUpload}
                                  className="hidden"
                                />
                              </div>

                              {workProgressForm.photos.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                  {workProgressForm.photos.map((photo, index) => (
                                    <div key={index} className="relative group">
                                      <div className="relative w-full h-24 rounded-lg border overflow-hidden">
                                        <Image
                                          src={photo}
                                          alt={`Work progress ${index + 1}`}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleRemovePhoto(index)}
                                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {workProgressForm.photos.length === 0 && (
                                <div className="p-6 bg-muted rounded-lg text-center">
                                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">
                                    No photos attached. Upload images to document work progress.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <Separator />

                          {/* Notes */}
                          <div className="space-y-2">
                            <Label>Additional Notes</Label>
                            <Textarea
                              placeholder="Additional notes or observations"
                              value={workProgressForm.notes}
                              onChange={(e) =>
                                setWorkProgressForm((prev) => ({ ...prev, notes: e.target.value }))
                              }
                              rows={3}
                            />
                          </div>
                        </div>
                      </ScrollArea>

                      <div className="flex justify-end gap-2 pt-4 border-t bg-background">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => dialog.closeDialog()}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {dialog.editingItem ? 'Update Entry' : 'Add Entry'}
                        </Button>
                      </div>
                    </form>
                  </FormDialog>
                </div>
              </div>

              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium w-fit">
                {filteredEntries.length} entr{filteredEntries.length !== 1 ? 'ies' : 'y'} found
              </Badge>
              {hasActiveAdvancedFilters ? (
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const chips: string[] = [];
                    if (!filterBySite && appliedAdvancedFilters.sites.length > 0) {
                      chips.push(`Sites: ${appliedAdvancedFilters.sites.join(', ')}`);
                    }
                    if (appliedAdvancedFilters.workTypes.length > 0) {
                      chips.push(`Work types: ${appliedAdvancedFilters.workTypes.join(', ')}`);
                    }
                    if (appliedAdvancedFilters.dateFrom || appliedAdvancedFilters.dateTo) {
                      chips.push(
                        `Date: ${appliedAdvancedFilters.dateFrom ?? 'Any'} → ${appliedAdvancedFilters.dateTo ?? 'Any'}`,
                      );
                    }
                    if (appliedAdvancedFilters.progressMin || appliedAdvancedFilters.progressMax) {
                      chips.push(
                        `Progress: ${appliedAdvancedFilters.progressMin || '0'}% - ${appliedAdvancedFilters.progressMax || '100'}%`,
                      );
                    }
                    if (appliedAdvancedFilters.laborMin || appliedAdvancedFilters.laborMax) {
                      chips.push(
                        `Labor hrs: ${appliedAdvancedFilters.laborMin || '0'} - ${appliedAdvancedFilters.laborMax || '∞'}`,
                      );
                    }
                    if (appliedAdvancedFilters.hasPhotos !== 'all') {
                      chips.push(
                        appliedAdvancedFilters.hasPhotos === 'with' ? 'With photos' : 'Without photos',
                      );
                    }
                    if (appliedAdvancedFilters.hasNotes !== 'all') {
                      chips.push(
                        appliedAdvancedFilters.hasNotes === 'with' ? 'With notes' : 'Without notes',
                      );
                    }
                    if (appliedAdvancedFilters.hasMaterials !== 'all') {
                      chips.push(
                        appliedAdvancedFilters.hasMaterials === 'with'
                          ? 'With materials'
                          : 'Without materials',
                      );
                    }
                    return chips;
                  })().map((chip) => (
                    <Badge key={chip} variant="outline" className="rounded-full px-3 py-1 text-xs">
                      {chip}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Work Progress Entries Table */}
        {filteredEntries.length === 0 ? (
          <Card className="w-full">
            <CardContent className="p-6 md:p-12">
              <div className="flex flex-col items-center justify-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Work Entries Found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  {workProgressEntries.length === 0
                    ? 'Start by recording your first work progress entry to track construction activities.'
                    : 'No work entries match your current search and filter criteria.'}
                </p>
                <Button
                  onClick={() => dialog.openDialog()}
                  className="gap-2 transition-all hover:shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  Add Work Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full overflow-hidden">
            <CardContent className="p-0">
              <DataTable
                columns={[
                  { key: 'workType', label: 'Work Type', sortable: true },
                  { key: 'siteName', label: 'Site', sortable: true },
                  { key: 'progressPercentage', label: 'Progress', sortable: true },
                  { key: 'laborHours', label: 'Labor Hours', sortable: true },
                  { key: 'date', label: 'Date', sortable: true },
                  { key: 'status', label: 'Status', sortable: true },
                  { key: 'actions', label: 'Actions', sortable: false },
                ]}
                data={filteredEntries.map((entry) => {
                  const IconComponent = getWorkTypeIcon(entry.workType);
                  return {
                    workType: (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-primary/10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <IconComponent className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{entry.workType}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {entry.description}
                          </div>
                        </div>
                      </div>
                    ),
                    siteName: (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{entry.siteName}</span>
                      </div>
                    ),
                    progressPercentage: (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">{entry.progressPercentage}%</span>
                        </div>
                        <Progress value={entry.progressPercentage} className="h-2" />
                      </div>
                    ),
                    laborHours: (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{entry.laborHours}h</span>
                      </div>
                    ),
                    date: (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDateShort(entry.date)}</span>
                      </div>
                    ),
                    status: (
                      <Badge
                        variant={
                          entry.status === 'Completed'
                            ? 'default'
                            : entry.status === 'In Progress'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="text-xs flex items-center gap-1 w-fit"
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            entry.status === 'Completed'
                              ? 'bg-green-500'
                              : entry.status === 'In Progress'
                                ? 'bg-blue-500'
                                : 'bg-yellow-500'
                          }`}
                        />
                        {entry.status}
                      </Badge>
                    ),
                    actions: (
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(entry);
                                }}
                                className="h-8 w-8 p-0 transition-all hover:bg-primary/10"
                              >
                                <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit work entry</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDelete(entry.id, entry.description ?? entry.workType);
                                }}
                                className="h-8 w-8 p-0 transition-all hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete work entry</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ),
                  };
                })}
                onSort={tableState.setSortField}
                onPageChange={tableState.setCurrentPage}
                pageSize={tableState.itemsPerPage}
                currentPage={tableState.currentPage}
                totalPages={tableState.totalPages(filteredEntries.length)}
                sortField={tableState.sortField}
                sortDirection={tableState.sortDirection}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <FilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        title="Work progress filters"
        description="Refine work entries with additional criteria."
        sections={[
          {
            id: 'sites',
            title: 'Sites',
            description: filterBySite
              ? `Entries already scoped to ${filterBySite}.`
              : 'Limit results to selected project sites.',
            content:
              filterBySite || siteOptions.length === 0 ? (
                filterBySite ? (
                  <p className="text-sm text-muted-foreground">
                    The list is already filtered to {filterBySite}.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No sites available.</p>
                )
              ) : (
                <div className="grid gap-2">
                  {siteOptions.map((site) => {
                    const isChecked = draftAdvancedFilters.sites.includes(site.name);
                    return (
                      <Label key={site.id} className="flex items-center gap-3 text-sm font-normal">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            setDraftAdvancedFilters((prev) => {
                              const next =
                                checked === true
                                  ? [...prev.sites, site.name]
                                  : prev.sites.filter((value) => value !== site.name);
                              return {
                                ...prev,
                                sites: next,
                              };
                            });
                          }}
                        />
                        <span>{site.name}</span>
                      </Label>
                    );
                  })}
    </div>
              ),
          },
          {
            id: 'work-types',
            title: 'Work types',
            description: 'Show entries for selected work categories.',
            content:
              workTypeOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No work types available.</p>
              ) : (
                <div className="grid gap-2">
                  {workTypeOptions.map((type) => {
                    const isChecked = draftAdvancedFilters.workTypes.includes(type);
                    return (
                      <Label key={type} className="flex items-center gap-3 text-sm font-normal">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            setDraftAdvancedFilters((prev) => {
                              const next =
                                checked === true
                                  ? [...prev.workTypes, type]
                                  : prev.workTypes.filter((value) => value !== type);
                              return {
                                ...prev,
                                workTypes: next,
                              };
                            });
                          }}
                        />
                        <span>{type}</span>
                      </Label>
                    );
                  })}
                </div>
              ),
          },
          {
            id: 'date',
            title: 'Work date',
            description: 'Filter entries by their scheduled date.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="work-date-from" className="text-sm font-medium">
                    From
                  </Label>
                  <Input
                    id="work-date-from"
                    type="date"
                    value={draftAdvancedFilters.dateFrom ?? ''}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        dateFrom: event.target.value || undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="work-date-to" className="text-sm font-medium">
                    To
                  </Label>
                  <Input
                    id="work-date-to"
                    type="date"
                    value={draftAdvancedFilters.dateTo ?? ''}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
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
            id: 'progress',
            title: 'Progress (%)',
            description: 'Limit entries to a progress percentage band.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="work-progress-min" className="text-sm font-medium">
                    Min
                  </Label>
                  <Input
                    id="work-progress-min"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={draftAdvancedFilters.progressMin}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        progressMin: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="work-progress-max" className="text-sm font-medium">
                    Max
                  </Label>
                  <Input
                    id="work-progress-max"
                    type="number"
                    inputMode="decimal"
                    placeholder="100"
                    value={draftAdvancedFilters.progressMax}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        progressMax: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ),
          },
          {
            id: 'labor',
            title: 'Labor hours',
            description: 'Filter by recorded labor hours.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="work-labor-min" className="text-sm font-medium">
                    Min
                  </Label>
                  <Input
                    id="work-labor-min"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={draftAdvancedFilters.laborMin}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        laborMin: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="work-labor-max" className="text-sm font-medium">
                    Max
                  </Label>
                  <Input
                    id="work-labor-max"
                    type="number"
                    inputMode="decimal"
                    placeholder="Any"
                    value={draftAdvancedFilters.laborMax}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        laborMax: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ),
          },
          {
            id: 'attachments',
            title: 'Content',
            description: 'Filter entries based on attachments and notes.',
            content: (
              <div className="grid gap-3 sm:grid-cols-3">
                <Select
                  value={draftAdvancedFilters.hasPhotos}
                  onValueChange={(value: WorkAdvancedFilterState['hasPhotos']) =>
                    setDraftAdvancedFilters((prev) => ({ ...prev, hasPhotos: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Photos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Photos: Any</SelectItem>
                    <SelectItem value="with">With photos</SelectItem>
                    <SelectItem value="without">Without photos</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={draftAdvancedFilters.hasNotes}
                  onValueChange={(value: WorkAdvancedFilterState['hasNotes']) =>
                    setDraftAdvancedFilters((prev) => ({ ...prev, hasNotes: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Notes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Notes: Any</SelectItem>
                    <SelectItem value="with">With notes</SelectItem>
                    <SelectItem value="without">Without notes</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={draftAdvancedFilters.hasMaterials}
                  onValueChange={(value: WorkAdvancedFilterState['hasMaterials']) =>
                    setDraftAdvancedFilters((prev) => ({ ...prev, hasMaterials: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Materials" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Materials: Any</SelectItem>
                    <SelectItem value="with">With materials</SelectItem>
                    <SelectItem value="without">Without materials</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ),
          },
        ]}
        onApply={() => {
          setAppliedAdvancedFilters(cloneWorkAdvancedFilters(draftAdvancedFilters));
          setIsFilterSheetOpen(false);
        }}
        onReset={() => {
          const resetFilters = createDefaultWorkAdvancedFilters();
          setDraftAdvancedFilters(resetFilters);
          setAppliedAdvancedFilters(resetFilters);
        }}
        isDirty={!isWorkAdvancedFilterDefault(draftAdvancedFilters)}
      />
    </div>
  );
}
