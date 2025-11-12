'use client';

import {
  Package,
  DollarSign,
  TrendingUp,
  Edit,
  Search,
  Building2,
  Grid3X3,
  Plus,
  Filter,
  CheckCircle2,
  Pause,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useTableState } from '../lib/hooks/useTableState';
import { formatDate } from '../lib/utils';

import MaterialMasterForm from './forms/MaterialMasterForm';
import type { MaterialMasterItem } from './shared/materialMasterData';
import type { MaterialMasterInput } from '@/types/materials';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function MaterialsPage() {
  // Material Master state
  const [materialMasterData, setMaterialMasterData] = useState<MaterialMasterItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [masterCategoryFilter, setMasterCategoryFilter] = useState<string>('all');
  const [masterStatusFilter, setMasterStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialMasterItem | null>(null);

  // Use shared state hooks
  const tableState = useTableState({
    initialSortField: 'name',
    initialSortDirection: 'asc',
    initialItemsPerPage: 10,
  });

  // Calculate summary statistics

  const fetchMaterials = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/materials');
      const payload = (await response.json().catch(() => ({}))) as {
        materials?: MaterialMasterItem[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load materials.');
      }

      const materials = payload.materials ?? [];
      const normalized: MaterialMasterItem[] = materials.map((material) => ({
        id: material.id,
        name: material.name,
        category: material.category,
        unit: material.unit,
        standardRate: material.standardRate,
        isActive: material.isActive,
        hsn: material.hsn,
        taxRate: material.taxRate,
        createdDate: material.createdDate ?? material.createdAt?.split('T')[0] ?? '',
        lastUpdated: material.lastUpdated ?? material.updatedAt?.split('T')[0] ?? '',
      }));
      setMaterialMasterData(normalized);
    } catch (error) {
      console.error('Error fetching materials', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load materials.');
      setMaterialMasterData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMaterials();
  }, [fetchMaterials]);

  const sortedAndFilteredMaterials = useMemo(() => {
    return materialMasterData
      .filter((material) => {
        const matchesSearch =
          searchQuery === '' ||
          material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          material.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          masterCategoryFilter === 'all' || material.category === masterCategoryFilter;
        const matchesStatus =
          masterStatusFilter === 'all' ||
          (masterStatusFilter === 'active' && material.isActive) ||
          (masterStatusFilter === 'inactive' && !material.isActive);
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        const aValue = a[tableState.sortField as keyof MaterialMasterItem];
        const bValue = b[tableState.sortField as keyof MaterialMasterItem];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return tableState.sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return tableState.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
  }, [materialMasterData, masterCategoryFilter, masterStatusFilter, searchQuery, tableState]);

  // Material Master functions
  const handleMaterialSubmit = useCallback(
    async (formData: MaterialMasterInput) => {
      setIsSaving(true);
      try {
        const isEditing = Boolean(editingMaterial);
        const response = await fetch(
          isEditing ? `/api/materials/${editingMaterial?.id}` : '/api/materials',
          {
            method: isEditing ? 'PATCH' : 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: formData.name,
              category: formData.category,
              unit: formData.unit,
              standardRate: formData.standardRate,
              isActive: formData.isActive,
              hsn: formData.hsn,
              taxRate: formData.taxRate,
            }),
          },
        );

        const payload = (await response.json().catch(() => ({}))) as {
          material?: MaterialMasterItem;
          error?: string;
        };

        if (!response.ok || !payload.material) {
          throw new Error(payload.error || 'Failed to save material.');
        }

        await fetchMaterials();
        toast.success(isEditing ? 'Material updated successfully.' : 'Material added successfully.');
        setEditingMaterial(null);
        setIsMaterialDialogOpen(false);
      } catch (error) {
        console.error('Failed to save material', error);
        toast.error(error instanceof Error ? error.message : 'Failed to save material.');
      } finally {
        setIsSaving(false);
      }
    },
    [editingMaterial, fetchMaterials],
  );

  const handleEditMaterial = (material: MaterialMasterItem) => {
    setEditingMaterial(material);
    setIsMaterialDialogOpen(true);
  };

  const handleAddNewMaterial = () => {
    setEditingMaterial(null);
    setIsMaterialDialogOpen(true);
  };

  const toggleMasterMaterialStatus = useCallback(
    async (materialId: string) => {
      try {
        const material = materialMasterData.find((m) => m.id === materialId);
        if (!material) return;

        const response = await fetch(`/api/materials/${materialId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isActive: !material.isActive,
          }),
        });

        const payload = (await response.json().catch(() => ({}))) as {
          material?: MaterialMasterItem;
          error?: string;
        };

        if (!response.ok || !payload.material) {
          throw new Error(payload.error || 'Failed to update material status.');
        }

        setMaterialMasterData((prev) =>
          prev.map((item) =>
            item.id === materialId
              ? {
                  ...item,
                  isActive: payload.material!.isActive,
                  lastUpdated: payload.material!.lastUpdated ?? item.lastUpdated,
                }
              : item,
          ),
        );
      } catch (error) {
        console.error('Failed to update material status', error);
        toast.error(error instanceof Error ? error.message : 'Failed to update status.');
      }
    },
    [materialMasterData],
  );

  const getMasterCategoryIcon = (category: string) => {
    switch (category) {
      case 'Cement':
        return Building2;
      case 'Steel':
        return Grid3X3;
      default:
        return Package;
    }
  };

  const totalMaterials = materialMasterData.length;
  const activeMaterials = useMemo(
    () => materialMasterData.filter((m) => m.isActive).length,
    [materialMasterData],
  );
  const totalCategories = useMemo(
    () => new Set(materialMasterData.map((m) => m.category)).size,
    [materialMasterData],
  );
  const averageRate = useMemo(() => {
    if (!materialMasterData.length) {
      return 0;
    }
    const total = materialMasterData.reduce((sum, m) => sum + m.standardRate, 0);
    return Math.round(total / materialMasterData.length);
  }, [materialMasterData]);

  return (
    <div className="w-full bg-background">
      <div className="p-4 md:p-6 space-y-6 max-w-full">
        {/* Material Master Statistics */}
        <Card className="w-full overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Materials</p>
                      <p className="text-2xl font-bold text-primary">{totalMaterials}</p>
                    </div>
                    <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Active Materials</p>
                      <p className="text-2xl font-bold text-green-600">
                        {activeMaterials}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Categories</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {totalCategories}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Avg. Rate</p>
                      <p className="text-2xl font-bold text-purple-600">
                        ₹{averageRate}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-purple-600" />
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
                      placeholder="Search materials..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  <Select value={masterCategoryFilter} onValueChange={setMasterCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Cement">Cement</SelectItem>
                      <SelectItem value="Steel">Steel</SelectItem>
                      <SelectItem value="Concrete">Concrete</SelectItem>
                      <SelectItem value="Bricks">Bricks</SelectItem>
                      <SelectItem value="Sand">Sand</SelectItem>
                      <SelectItem value="Aggregate">Aggregate</SelectItem>
                      <SelectItem value="Timber">Timber</SelectItem>
                      <SelectItem value="Electrical">Electrical</SelectItem>
                      <SelectItem value="Plumbing">Plumbing</SelectItem>
                      <SelectItem value="Paint">Paint</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={masterStatusFilter} onValueChange={setMasterStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
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
                        >
                          <Filter className="h-4 w-4" />
                          <span className="hidden sm:inline">Filter</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Filter materials by category and status</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Dialog
                    open={isMaterialDialogOpen}
                    onOpenChange={(open) => {
                      setIsMaterialDialogOpen(open);
                      if (!open) {
                        setEditingMaterial(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={handleAddNewMaterial}
                        className="gap-2 transition-all hover:shadow-md whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">New Material</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                      <DialogHeader className="space-y-3 flex-shrink-0">
                        <DialogTitle className="text-xl">
                          {editingMaterial ? 'Edit Material' : 'Add New Material'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingMaterial
                            ? 'Update material details in the master database'
                            : 'Create a new material entry in the master database'}
                        </DialogDescription>
                      </DialogHeader>
                      <Separator className="flex-shrink-0" />
                      <ScrollArea className="flex-1 -mx-6 px-6">
                        <div className="pr-4">
                          <MaterialMasterForm
                            onSubmit={handleMaterialSubmit}
                            onCancel={() => setIsMaterialDialogOpen(false)}
                            defaultValues={
                              editingMaterial
                                ? {
                                    name: editingMaterial.name,
                                    category: editingMaterial.category,
                                    unit: editingMaterial.unit,
                                    standardRate: editingMaterial.standardRate,
                                    isActive: editingMaterial.isActive,
                                    hsn: editingMaterial.hsn,
                                    taxRate: editingMaterial.taxRate,
                                  }
                                : undefined
                            }
                            isEdit={!!editingMaterial}
                          />
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium w-fit">
                {isLoading
                  ? 'Loading materials…'
                  : `${sortedAndFilteredMaterials.length} material${
                      sortedAndFilteredMaterials.length !== 1 ? 's' : ''
                    } found`}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Materials Table */}
        {isLoading ? (
          <Card className="w-full">
            <CardContent className="p-6 md:p-12">
              <div className="space-y-3 text-center text-muted-foreground">
                <p className="text-sm">Loading materials…</p>
              </div>
            </CardContent>
          </Card>
        ) : sortedAndFilteredMaterials.length === 0 ? (
          <Card className="w-full">
            <CardContent className="p-6 md:p-12">
              <div className="flex flex-col items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Materials Found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  {materialMasterData.length === 0
                    ? 'Start by adding your first material to manage inventory.'
                    : 'No materials match your current search and filter criteria.'}
                </p>
                <Button
                  onClick={handleAddNewMaterial}
                  className="gap-2 transition-all hover:shadow-md"
                  disabled={isSaving}
                >
                  <Plus className="h-4 w-4" />
                  Add Material
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">Material</TableHead>
                      <TableHead className="min-w-[120px]">Category</TableHead>
                      <TableHead className="min-w-[80px]">Unit</TableHead>
                      <TableHead className="min-w-[120px] text-right">Rate (₹)</TableHead>
                      <TableHead className="min-w-[100px]">HSN Code</TableHead>
                      <TableHead className="min-w-[80px]">Tax %</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Last Updated</TableHead>
                      <TableHead className="min-w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndFilteredMaterials.map((material) => {
                      const IconComponent = getMasterCategoryIcon(material.category);

                      // Convert units to short forms
                      const getShortUnit = (unit: string) => {
                        const unitMap: { [key: string]: string } = {
                          bags: 'bags',
                          kg: 'kg',
                          kilograms: 'kg',
                          tons: 'tons',
                          tonnes: 'tons',
                          'cubic meters': 'm³',
                          'cubic feet': 'ft³',
                          'square meters': 'm²',
                          'square feet': 'ft²',
                          meters: 'm',
                          feet: 'ft',
                          pieces: 'pcs',
                          units: 'units',
                          liters: 'L',
                          gallons: 'gal',
                          boxes: 'boxes',
                          rolls: 'rolls',
                          sheets: 'sheets',
                          bars: 'bars',
                          rods: 'rods',
                          pipes: 'pipes',
                          tubes: 'tubes',
                          cables: 'cables',
                          wires: 'wires',
                          switches: 'switches',
                          outlets: 'outlets',
                          fixtures: 'fixtures',
                          bulbs: 'bulbs',
                          tiles: 'tiles',
                          panels: 'panels',
                          boards: 'boards',
                          blocks: 'blocks',
                          bricks: 'bricks',
                          stones: 'stones',
                          gravel: 'gravel',
                          sand: 'sand',
                          cement: 'cement',
                          concrete: 'concrete',
                          mortar: 'mortar',
                          plaster: 'plaster',
                          paint: 'paint',
                          primer: 'primer',
                          varnish: 'varnish',
                          sealant: 'sealant',
                          adhesive: 'adhesive',
                          glue: 'glue',
                          screws: 'screws',
                          nails: 'nails',
                          bolts: 'bolts',
                          nuts: 'nuts',
                          washers: 'washers',
                          brackets: 'brackets',
                          hinges: 'hinges',
                          handles: 'handles',
                          locks: 'locks',
                          keys: 'keys',
                          chains: 'chains',
                          ropes: 'ropes',
                          cords: 'cords',
                          straps: 'straps',
                          belts: 'belts',
                          gaskets: 'gaskets',
                          'o-rings': 'o-rings',
                          seals: 'seals',
                          filters: 'filters',
                          screens: 'screens',
                          mesh: 'mesh',
                          netting: 'netting',
                          fabric: 'fabric',
                          cloth: 'cloth',
                          canvas: 'canvas',
                          plastic: 'plastic',
                          rubber: 'rubber',
                          foam: 'foam',
                          insulation: 'insulation',
                          padding: 'padding',
                          cushioning: 'cushioning',
                          packaging: 'pkg',
                          wrapping: 'wrap',
                          tape: 'tape',
                          labels: 'labels',
                          tags: 'tags',
                          markers: 'markers',
                          pens: 'pens',
                          pencils: 'pencils',
                          chalk: 'chalk',
                          crayons: 'crayons',
                          brushes: 'brushes',
                          rollers: 'rollers',
                          sponges: 'sponges',
                          cloths: 'cloths',
                          towels: 'towels',
                          rags: 'rags',
                          wipes: 'wipes',
                          cleaners: 'cleaners',
                          solvents: 'solvents',
                          detergents: 'detergents',
                          soaps: 'soaps',
                          disinfectants: 'disinfectants',
                          sanitizers: 'sanitizers',
                          lubricants: 'lubricants',
                          oils: 'oils',
                          greases: 'greases',
                          fuels: 'fuels',
                          gases: 'gases',
                          chemicals: 'chemicals',
                          powders: 'powders',
                          granules: 'granules',
                          pellets: 'pellets',
                          beads: 'beads',
                          chips: 'chips',
                          flakes: 'flakes',
                          shavings: 'shavings',
                          dust: 'dust',
                          powder: 'powder',
                          paste: 'paste',
                          gel: 'gel',
                          cream: 'cream',
                          lotion: 'lotion',
                          spray: 'spray',
                          aerosol: 'aerosol',
                          liquid: 'liquid',
                          solution: 'solution',
                          mixture: 'mixture',
                          compound: 'compound',
                          alloy: 'alloy',
                          blend: 'blend',
                          mix: 'mix',
                          batch: 'batch',
                          lot: 'lot',
                          set: 'set',
                          kit: 'kit',
                          package: 'pkg',
                          bundle: 'bundle',
                          group: 'group',
                          collection: 'collection',
                          assortment: 'assortment',
                          variety: 'variety',
                          selection: 'selection',
                          range: 'range',
                          series: 'series',
                          line: 'line',
                          family: 'family',
                          category: 'category',
                          type: 'type',
                          kind: 'kind',
                          sort: 'sort',
                          class: 'class',
                          grade: 'grade',
                          quality: 'quality',
                          standard: 'standard',
                          specification: 'spec',
                          model: 'model',
                          version: 'version',
                          edition: 'edition',
                          release: 'release',
                          update: 'update',
                          patch: 'patch',
                          fix: 'fix',
                          upgrade: 'upgrade',
                          enhancement: 'enhancement',
                          improvement: 'improvement',
                          modification: 'modification',
                          customization: 'customization',
                          personalization: 'personalization',
                          adaptation: 'adaptation',
                          adjustment: 'adjustment',
                          calibration: 'calibration',
                          configuration: 'config',
                          setup: 'setup',
                          installation: 'install',
                          assembly: 'assembly',
                          construction: 'construction',
                          fabrication: 'fabrication',
                          manufacturing: 'manufacturing',
                          production: 'production',
                          creation: 'creation',
                          generation: 'generation',
                          development: 'development',
                          design: 'design',
                          planning: 'planning',
                          scheduling: 'scheduling',
                          coordination: 'coordination',
                          management: 'management',
                          administration: 'administration',
                          supervision: 'supervision',
                          oversight: 'oversight',
                          monitoring: 'monitoring',
                          tracking: 'tracking',
                          logging: 'logging',
                          recording: 'recording',
                          documentation: 'documentation',
                          reporting: 'reporting',
                          analysis: 'analysis',
                          evaluation: 'evaluation',
                          assessment: 'assessment',
                          review: 'review',
                          inspection: 'inspection',
                          examination: 'examination',
                          testing: 'testing',
                          validation: 'validation',
                          verification: 'verification',
                          confirmation: 'confirmation',
                          approval: 'approval',
                          authorization: 'authorization',
                          permission: 'permission',
                          license: 'license',
                          certificate: 'certificate',
                          credential: 'credential',
                          qualification: 'qualification',
                          competency: 'competency',
                          skill: 'skill',
                          ability: 'ability',
                          capability: 'capability',
                          capacity: 'capacity',
                          potential: 'potential',
                          possibility: 'possibility',
                          opportunity: 'opportunity',
                          chance: 'chance',
                          probability: 'probability',
                          likelihood: 'likelihood',
                          risk: 'risk',
                          threat: 'threat',
                          danger: 'danger',
                          hazard: 'hazard',
                          safety: 'safety',
                          security: 'security',
                          protection: 'protection',
                          defense: 'defense',
                          prevention: 'prevention',
                          avoidance: 'avoidance',
                          mitigation: 'mitigation',
                          reduction: 'reduction',
                          minimization: 'minimization',
                          optimization: 'optimization',
                          maximization: 'maximization',
                        };
                        return unitMap[unit.toLowerCase()] || unit;
                      };

                      return (
                        <TableRow
                          key={material.id}
                          className="group cursor-pointer transition-all duration-200 hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 bg-primary/10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  <IconComponent className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-sm truncate">
                                  {material.name}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize text-xs">
                              {material.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {getShortUnit(material.unit)}
                          </TableCell>
                          <TableCell className="font-semibold text-primary text-right whitespace-nowrap">
                            ₹{material.standardRate.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {material.hsn || 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm">{material.taxRate}%</TableCell>
                          <TableCell>
                            <Badge
                              variant={material.isActive ? 'default' : 'destructive'}
                              className="text-xs flex items-center gap-1 w-fit whitespace-nowrap"
                            >
                              <div
                                className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${material.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                              />
                              {material.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(material.lastUpdated)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 justify-end">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditMaterial(material);
                                      }}
                                      className="h-8 w-8 p-0 transition-all hover:bg-primary/10"
                                      aria-label="Edit material"
                                    >
                                      <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit material</p>
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
                                        toggleMasterMaterialStatus(material.id);
                                      }}
                                      className="h-8 w-8 p-0 transition-all hover:bg-destructive/10"
                                      aria-label={
                                        material.isActive
                                          ? 'Deactivate material'
                                          : 'Activate material'
                                      }
                                    >
                                      {material.isActive ? (
                                        <Pause className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                      ) : (
                                        <CheckCircle2 className="h-3 w-3 text-muted-foreground hover:text-green-600" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{material.isActive ? 'Deactivate' : 'Activate'} material</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
