'use client';

import {
  Plus,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  FileText,
  Edit,
  Search,
  BarChart3,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle2,
  Pause,
  XCircle,
  ShoppingCart,
  Target,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { fetcher, swrConfig } from '../lib/swr';

import { ExpensesPage } from './expenses';
import { MaterialsPage } from './materials';
import { PurchasePage } from './purchase';
import { SchedulingPage } from './scheduling';
import { WorkProgressPage } from './work-progress';

import { FilterSheet } from '@/components/filters/FilterSheet';
import SiteForm from '@/components/forms/SiteForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/lib/auth-context';
import { formatDate, formatDateShort } from '@/lib/utils';
import type { Site, SiteInput } from '@/types/sites';

interface SiteManagementProps {
  selectedSite?: string;
  onSiteSelect?: (siteId: string) => void;
}

export function SitesPage({ selectedSite: propSelectedSite, onSiteSelect }: SiteManagementProps) {
  const { isLoading: isAuthLoading } = useAuth();
  const initialSelectedSite = propSelectedSite ?? null;
  const [selectedSite, setSelectedSite] = useState<string | null>(initialSelectedSite);
  const [isSiteDialogOpen, setIsSiteDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [sitesWithTransactions, setSitesWithTransactions] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletedSiteName, setDeletedSiteName] = useState<string | null>(null);
  // Use ref to track selectedSite to avoid infinite loops in fetchSites
  const selectedSiteRef = React.useRef<string | null>(initialSelectedSite);

  type SiteAdvancedFilterState = {
    locations: string[];
    budgetMin: string;
    budgetMax: string;
    startFrom?: string;
    startTo?: string;
    endFrom?: string;
    endTo?: string;
  };

  const createDefaultSiteAdvancedFilters = (): SiteAdvancedFilterState => ({
    locations: [],
    budgetMin: '',
    budgetMax: '',
    startFrom: undefined,
    startTo: undefined,
    endFrom: undefined,
    endTo: undefined,
  });

  const cloneSiteAdvancedFilters = (filters: SiteAdvancedFilterState): SiteAdvancedFilterState => ({
    ...filters,
    locations: [...filters.locations],
  });

  const isSiteAdvancedFilterDefault = (filters: SiteAdvancedFilterState): boolean => {
    return (
      filters.locations.length === 0 &&
      filters.budgetMin === '' &&
      filters.budgetMax === '' &&
      !filters.startFrom &&
      !filters.startTo &&
      !filters.endFrom &&
      !filters.endTo
    );
  };

  const countSiteAdvancedFilters = (filters: SiteAdvancedFilterState): number => {
    let count = 0;
    count += filters.locations.length;
    if (filters.budgetMin !== '' || filters.budgetMax !== '') count += 1;
    if (filters.startFrom || filters.startTo) count += 1;
    if (filters.endFrom || filters.endTo) count += 1;
    return count;
  };

  const parseDateValue = (value?: string): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const [appliedAdvancedFilters, setAppliedAdvancedFilters] = useState<SiteAdvancedFilterState>(
    () => createDefaultSiteAdvancedFilters(),
  );
  const [draftAdvancedFilters, setDraftAdvancedFilters] = useState<SiteAdvancedFilterState>(() =>
    createDefaultSiteAdvancedFilters(),
  );

  // Check if a site has linked transactions
  const checkSiteHasTransactions = useCallback(async (siteId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/sites/${siteId}/check-dependencies`);

      const payload = (await response.json().catch(() => ({}))) as {
        hasTransactions?: boolean;
        error?: string;
      };

      if (!response.ok) {
        // On error, assume site has transactions to be safe (hide delete button)
        return true;
      }

      return payload.hasTransactions ?? false;
    } catch (error) {
      // On error, assume site has transactions to be safe (hide delete button)
      console.error('Error checking site transactions', error);
      return true;
    }
  }, []);

  // Fetch sites using SWR
  const {
    data: sitesData,
    error: sitesError,
    isLoading: isSitesLoading,
    mutate: mutateSites,
  } = useSWR<{ sites: Site[] }>(
    !isAuthLoading ? '/api/sites' : null, // Only fetch when auth is ready
    fetcher,
    swrConfig,
  );

  const sites = sitesData?.sites ?? [];

  // Check which sites have transactions when sites data changes
  useEffect(() => {
    if (!sites.length || isSitesLoading) return;

    const checkTransactions = async () => {
      const sitesWithTx = new Set<string>();
      const batchSize = 5;
      for (let i = 0; i < sites.length; i += batchSize) {
        const batch = sites.slice(i, i + batchSize);
        const transactionChecks = await Promise.all(
          batch.map(async (site) => ({
            siteId: site.id,
            hasTransactions: await checkSiteHasTransactions(site.id),
          })),
        );
        transactionChecks.forEach(({ siteId, hasTransactions }) => {
          if (hasTransactions) {
            sitesWithTx.add(siteId);
          }
        });
      }
      setSitesWithTransactions(sitesWithTx);
    };

    void checkTransactions();
  }, [sites, isSitesLoading, checkSiteHasTransactions]);

  // Handle site selection when sites load
  useEffect(() => {
    if (isSitesLoading || !sites.length) return;

    const currentSelectedSite = selectedSiteRef.current;
    const nextSelection =
      (propSelectedSite &&
        sites.some((site) => site.id === propSelectedSite) &&
        propSelectedSite) ||
      (currentSelectedSite &&
        sites.some((site) => site.id === currentSelectedSite) &&
        currentSelectedSite) ||
      (sites.length ? sites[0].id : null);

    if (nextSelection !== currentSelectedSite) {
      selectedSiteRef.current = nextSelection;
      setSelectedSite(nextSelection);
    }
  }, [sites, propSelectedSite, isSitesLoading]);

  // Show error toast if fetch fails
  useEffect(() => {
    if (sitesError) {
      toast.error(sitesError instanceof Error ? sitesError.message : 'Failed to load sites.');
    }
  }, [sitesError]);

  // Handle propSelectedSite changes from parent
  useEffect(() => {
    if (propSelectedSite && propSelectedSite !== selectedSiteRef.current) {
      selectedSiteRef.current = propSelectedSite;
      setSelectedSite(propSelectedSite);
    }
  }, [propSelectedSite]);

  // Notify parent when selectedSite changes (but not during initial load)
  useEffect(() => {
    if (selectedSite && !isSitesLoading) {
      onSiteSelect?.(selectedSite);
    }
  }, [selectedSite, onSiteSelect, isSitesLoading]);

  // Ensure selectedSite is valid when sites change (only if current selection is invalid)
  useEffect(() => {
    if (isSitesLoading) {
      return;
    }

    if (!sites.length) {
      if (selectedSiteRef.current !== null) {
        selectedSiteRef.current = null;
        setSelectedSite(null);
      }
      return;
    }

    const currentSelected = selectedSiteRef.current;
    // Only update if current selection is invalid
    if (currentSelected && !sites.some((site) => site.id === currentSelected)) {
      const newSelection = sites[0]?.id ?? null;
      selectedSiteRef.current = newSelection;
      setSelectedSite(newSelection);
    } else if (!currentSelected && sites.length > 0) {
      // If no selection and sites exist, select first one
      const newSelection = sites[0]?.id ?? null;
      selectedSiteRef.current = newSelection;
      setSelectedSite(newSelection);
    }
  }, [sites, isSitesLoading]);

  const locationOptions = useMemo(() => {
    const uniqueLocations = new Set<string>();
    sites.forEach((site) => {
      if (site.location) uniqueLocations.add(site.location);
    });
    return Array.from(uniqueLocations).sort((a, b) => a.localeCompare(b));
  }, [sites]);

  const activeAdvancedFilterCount = useMemo(
    () => countSiteAdvancedFilters(appliedAdvancedFilters),
    [appliedAdvancedFilters],
  );
  const hasActiveAdvancedFilters = activeAdvancedFilterCount > 0;

  const filteredSites = useMemo(() => {
    const budgetMin =
      appliedAdvancedFilters.budgetMin !== ''
        ? Number(appliedAdvancedFilters.budgetMin)
        : undefined;
    const budgetMax =
      appliedAdvancedFilters.budgetMax !== ''
        ? Number(appliedAdvancedFilters.budgetMax)
        : undefined;
    const startFrom = parseDateValue(appliedAdvancedFilters.startFrom);
    const startTo = parseDateValue(appliedAdvancedFilters.startTo);
    const endFrom = parseDateValue(appliedAdvancedFilters.endFrom);
    const endTo = parseDateValue(appliedAdvancedFilters.endTo);

    return sites.filter((site) => {
      const matchesStatus = statusFilter === 'all' || site.status === statusFilter;
      const matchesSearch =
        searchQuery === '' ||
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocations =
        appliedAdvancedFilters.locations.length === 0 ||
        appliedAdvancedFilters.locations.includes(site.location);
      const matchesBudgetMin =
        budgetMin === undefined || Number.isNaN(budgetMin) || Number(site.budget ?? 0) >= budgetMin;
      const matchesBudgetMax =
        budgetMax === undefined || Number.isNaN(budgetMax) || Number(site.budget ?? 0) <= budgetMax;

      const siteStart = parseDateValue(site.startDate);
      const siteEnd = parseDateValue(site.expectedEndDate);

      const matchesStartFrom = !startFrom || (siteStart !== null && siteStart >= startFrom);
      const matchesStartTo = !startTo || (siteStart !== null && siteStart <= startTo);
      const matchesEndFrom = !endFrom || (siteEnd !== null && siteEnd >= endFrom);
      const matchesEndTo = !endTo || (siteEnd !== null && siteEnd <= endTo);

      return (
        matchesStatus &&
        matchesSearch &&
        matchesLocations &&
        matchesBudgetMin &&
        matchesBudgetMax &&
        matchesStartFrom &&
        matchesStartTo &&
        matchesEndFrom &&
        matchesEndTo
      );
    });
  }, [sites, statusFilter, searchQuery, appliedAdvancedFilters]);

  const currentSite = selectedSite
    ? (sites.find((site) => site.id === selectedSite) ?? null)
    : null;

  const currentSiteMetrics = useMemo(() => {
    if (!currentSite) {
      return null;
    }

    const budgetValue = Number(currentSite.budget ?? 0);
    const spentValue = Number(currentSite.spent ?? 0);
    const progressValue = Number(currentSite.progress ?? 0);
    const budgetCr = budgetValue / 10000000;
    const spentCr = spentValue / 10000000;
    const usagePercent = budgetValue > 0 ? (spentValue / budgetValue) * 100 : 0;
    const expectedEnd = currentSite.expectedEndDate ? new Date(currentSite.expectedEndDate) : null;
    const daysRemaining =
      expectedEnd !== null
        ? Math.max(0, Math.ceil((expectedEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    return {
      budgetValue,
      spentValue,
      progressValue,
      budgetCr,
      spentCr,
      usagePercent,
      daysRemaining,
    };
  }, [currentSite]);

  const handleSiteSubmit = useCallback(
    async (siteData: SiteInput) => {
      try {
        const isEditing = Boolean(editingSite);
        const response = await fetch(isEditing ? `/api/sites/${editingSite?.id}` : '/api/sites', {
          method: isEditing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(siteData),
        });

        const payload = (await response.json().catch(() => ({}))) as {
          site?: Site;
          error?: string;
        };

        if (!response.ok || !payload.site) {
          throw new Error(payload.error || 'Failed to save site.');
        }

        await mutateSites(); // Refresh sites data
        toast.success(isEditing ? 'Site updated successfully.' : 'Site created successfully.');
        setEditingSite(null);
        setIsSiteDialogOpen(false);
      } catch (error) {
        console.error('Failed to save site', error);
        toast.error(error instanceof Error ? error.message : 'Failed to save site.');
      }
    },
    [editingSite, mutateSites],
  );

  const handleEditSite = (site: Site) => {
    setEditingSite(site);
    setIsSiteDialogOpen(true);
  };

  const handleAddNewSite = () => {
    setEditingSite(null);
    setIsSiteDialogOpen(true);
  };

  const handleDeleteSite = useCallback(
    async (site: Site) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${site.name}"? This action cannot be undone.`,
      );
      if (!confirmed) {
        return;
      }

      try {
        const response = await fetch(`/api/sites/${site.id}`, {
          method: 'DELETE',
        });

        const payload = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
          dependencies?: string;
          counts?: {
            purchases?: number;
            expenses?: number;
            payments?: number;
            vehicleUsage?: number;
            workProgress?: number;
            materials?: number;
          };
        };

        if (!response.ok || !payload.success) {
          if (payload.dependencies) {
            toast.error(
              `Cannot delete site. It has ${payload.dependencies}. Please delete or unlink these transactions first.`,
              {
                duration: 6000,
              },
            );
          } else {
            throw new Error(payload.error || 'Failed to delete site.');
          }
          return;
        }

        // Refresh sites data
        await mutateSites();

        // Remove from sites with transactions
        setSitesWithTransactions((prev) => {
          const next = new Set(prev);
          next.delete(site.id);
          return next;
        });

        // Clear selection if deleted site was selected
        if (selectedSite === site.id) {
          selectedSiteRef.current = null;
          setSelectedSite(null);
        }

        // Show success dialog
        setDeletedSiteName(site.name);
        setIsDeleteDialogOpen(true);
      } catch (error) {
        console.error('Failed to delete site', error);
        toast.error(error instanceof Error ? error.message : 'Unable to delete site.');
      }
    },
    [selectedSite],
  );

  return (
    <div className="h-full w-full bg-background flex flex-col">
      {/* Top Section - Sites List */}
      <div className="h-2/5 min-h-[400px] flex flex-col border-b">
        {/* Search and Filter Controls */}
        <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-muted/30 to-background">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sites by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 transition-all focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  <SelectItem value="Active">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="Stopped">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                      Stopped
                    </div>
                  </SelectItem>
                  <SelectItem value="Completed">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full" />
                      Completed
                    </div>
                  </SelectItem>
                  <SelectItem value="Canceled">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-red-500 rounded-full" />
                      Canceled
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 transition-all hover:shadow-md"
                        onClick={() => {
                          setDraftAdvancedFilters(cloneSiteAdvancedFilters(appliedAdvancedFilters));
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
                    const resetFilters = createDefaultSiteAdvancedFilters();
                    setAppliedAdvancedFilters(resetFilters);
                    setDraftAdvancedFilters(resetFilters);
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear filters</span>
                </Button>
                <Dialog
                  open={isSiteDialogOpen}
                  onOpenChange={(open) => {
                    setIsSiteDialogOpen(open);
                    if (!open) {
                      setEditingSite(null);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      onClick={handleAddNewSite}
                      className="gap-2 transition-all hover:shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">New Site</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="space-y-3">
                      <DialogTitle className="text-xl">
                        {editingSite ? 'Edit Construction Site' : 'Add New Construction Site'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingSite
                          ? 'Update construction project site details'
                          : 'Create a new construction project site with all necessary information'}
                      </DialogDescription>
                    </DialogHeader>
                    <SiteForm
                      mode={editingSite ? 'edit' : 'new'}
                      site={editingSite || undefined}
                      onSubmit={handleSiteSubmit}
                      onCancel={() => setIsSiteDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex flex-col gap-2">
                <Badge variant="secondary" className="px-4 py-2 text-sm font-medium w-fit">
                  {isSitesLoading
                    ? 'Loading sites…'
                    : filteredSites.length
                      ? `${filteredSites.length} site${filteredSites.length !== 1 ? 's' : ''} found`
                      : 'No sites found'}
                </Badge>
                {hasActiveAdvancedFilters ? (
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const chips: string[] = [];
                      if (appliedAdvancedFilters.locations.length > 0) {
                        chips.push(`Locations: ${appliedAdvancedFilters.locations.join(', ')}`);
                      }
                      if (appliedAdvancedFilters.budgetMin || appliedAdvancedFilters.budgetMax) {
                        chips.push(
                          `Budget: ₹${appliedAdvancedFilters.budgetMin || 'Any'} - ₹${appliedAdvancedFilters.budgetMax || 'Any'}`,
                        );
                      }
                      if (appliedAdvancedFilters.startFrom || appliedAdvancedFilters.startTo) {
                        chips.push(
                          `Start: ${appliedAdvancedFilters.startFrom ?? 'Any'} → ${appliedAdvancedFilters.startTo ?? 'Any'}`,
                        );
                      }
                      if (appliedAdvancedFilters.endFrom || appliedAdvancedFilters.endTo) {
                        chips.push(
                          `Completion: ${appliedAdvancedFilters.endFrom ?? 'Any'} → ${appliedAdvancedFilters.endTo ?? 'Any'}`,
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sites List */}
        <div className="flex-1 overflow-hidden">
          <div className="p-6 h-full overflow-y-auto">
            {/* Navigation Controls */}
            {filteredSites.length > 4 && (
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const container = scrollContainerRef.current;
                    if (!container) return;

                    const cardWidth = 320 + 16; // w-80 (320px) + gap (16px)
                    const scrollAmount = cardWidth * 4; // Scroll by 4 cards
                    const currentScroll = container.scrollLeft;
                    const newPosition = Math.max(0, currentScroll - scrollAmount);
                    container.scrollTo({
                      left: newPosition,
                      behavior: 'smooth',
                    });
                    // Update position after animation completes
                    setTimeout(() => {
                      const containerAfterScroll = scrollContainerRef.current;
                      if (containerAfterScroll) {
                        setScrollPosition(containerAfterScroll.scrollLeft);
                      }
                    }, 500);
                  }}
                  disabled={(() => {
                    const container = scrollContainerRef.current;
                    return !container || container.scrollLeft <= 0;
                  })()}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {(() => {
                      const container = scrollContainerRef.current;
                      if (!container || container.scrollWidth <= container.clientWidth) {
                        return `1 / ${Math.ceil(filteredSites.length / 4)}`;
                      }
                      const currentPage = Math.min(
                        Math.max(1, Math.round(container.scrollLeft / ((320 + 16) * 4)) + 1),
                        Math.ceil(filteredSites.length / 4),
                      );
                      return `${currentPage} / ${Math.ceil(filteredSites.length / 4)}`;
                    })()}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const container = scrollContainerRef.current;
                    if (!container) return;

                    const cardWidth = 320 + 16; // w-80 (320px) + gap (16px)
                    const scrollAmount = cardWidth * 4; // Scroll by 4 cards
                    const currentScroll = container.scrollLeft;
                    const maxScroll = container.scrollWidth - container.clientWidth;
                    const newPosition = Math.min(maxScroll, currentScroll + scrollAmount);
                    container.scrollTo({
                      left: newPosition,
                      behavior: 'smooth',
                    });
                    // Update position after animation completes
                    setTimeout(() => {
                      const containerAfterScroll = scrollContainerRef.current;
                      if (containerAfterScroll) {
                        setScrollPosition(containerAfterScroll.scrollLeft);
                      }
                    }, 500);
                  }}
                  disabled={(() => {
                    const container = scrollContainerRef.current;
                    if (!container) return true;
                    return (
                      container.scrollLeft >= container.scrollWidth - container.clientWidth - 1
                    );
                  })()}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="relative w-full">
              <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-4 scroll-smooth pr-6"
                style={{
                  width: '100%',
                  scrollbarWidth: 'thin',
                  scrollbarGutter: 'stable',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                }}
                onScroll={(e) => {
                  // Debounce scroll position updates to prevent blinking
                  if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current);
                  }
                  // Capture scrollLeft immediately before the timeout
                  const target = e.currentTarget;
                  if (!target) return;
                  const scrollLeft = target.scrollLeft;
                  scrollTimeoutRef.current = setTimeout(() => {
                    // Use the ref to get the current value, fallback to captured value
                    const container = scrollContainerRef.current;
                    if (container) {
                      setScrollPosition(container.scrollLeft);
                    } else {
                      setScrollPosition(scrollLeft);
                    }
                  }, 50);
                }}
              >
                {!isSitesLoading && filteredSites.length === 0 ? (
                  <Card className="border-dashed border-2 border-border/70 bg-muted/10 w-full">
                    <CardContent className="p-8 text-center space-y-3">
                      <Building2 className="h-8 w-8 mx-auto text-muted-foreground" />
                      <h3 className="text-lg font-semibold">No sites found</h3>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your filters or create a new construction site to get started.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredSites.map((site) => {
                    const getStatusConfig = () => {
                      switch (site.status) {
                        case 'Active':
                          return {
                            color: 'bg-green-500',
                            bgLight: 'bg-green-50 dark:bg-green-950/30',
                            textColor: 'text-green-700 dark:text-green-400',
                            icon: CheckCircle2,
                          };
                        case 'Stopped':
                          return {
                            color: 'bg-yellow-500',
                            bgLight: 'bg-yellow-50 dark:bg-yellow-950/30',
                            textColor: 'text-yellow-700 dark:text-yellow-400',
                            icon: Pause,
                          };
                        case 'Completed':
                          return {
                            color: 'bg-blue-500',
                            bgLight: 'bg-blue-50 dark:bg-blue-950/30',
                            textColor: 'text-blue-700 dark:text-blue-400',
                            icon: CheckCircle2,
                          };
                        case 'Canceled':
                          return {
                            color: 'bg-red-500',
                            bgLight: 'bg-red-50 dark:bg-red-950/30',
                            textColor: 'text-red-700 dark:text-red-400',
                            icon: XCircle,
                          };
                        default:
                          return {
                            color: 'bg-muted-foreground',
                            bgLight: 'bg-muted/30',
                            textColor: 'text-muted-foreground',
                            icon: Clock,
                          };
                      }
                    };

                    const statusConfig = getStatusConfig();
                    const StatusIcon = statusConfig.icon;
                    const budgetValue = Number(site.budget ?? 0);
                    const spentValue = Number(site.spent ?? 0);
                    const progressValue = Number(site.progress ?? 0);
                    const budgetUsagePercent =
                      budgetValue > 0 ? (spentValue / budgetValue) * 100 : 0;
                    const isOverBudget = budgetUsagePercent > 90;
                    const budgetCrDisplay = (budgetValue / 10000000).toFixed(1);
                    const spentCrDisplay = (spentValue / 10000000).toFixed(1);
                    const startDateLabel = site.startDate ? formatDateShort(site.startDate) : '—';
                    const endDateLabel = site.expectedEndDate
                      ? formatDateShort(site.expectedEndDate)
                      : '—';

                    return (
                      <Card
                        key={site.id}
                        className={`group relative cursor-pointer transition-all duration-300 overflow-visible flex-shrink-0 w-80 ${
                          selectedSite === site.id
                            ? 'border-primary border-2 shadow-lg ring-2 ring-primary/30'
                            : 'border border-border hover:border-primary/40 hover:shadow-md'
                        }`}
                        onClick={() => {
                          // Update ref immediately to prevent race conditions
                          selectedSiteRef.current = site.id;
                          setSelectedSite(site.id);
                          onSiteSelect?.(site.id);
                        }}
                      >
                        <CardContent className="p-5">
                          <div className="mb-4 h-32 rounded-lg overflow-hidden border border-border/60 bg-gradient-to-br from-muted/40 to-muted/10 flex items-center justify-center">
                            <Building2 className="h-10 w-10 text-muted-foreground" />
                          </div>
                          {/* Header Section */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0 pr-3">
                              <h4 className="font-semibold text-lg leading-tight mb-2 truncate group-hover:text-primary transition-colors">
                                {site.name}
                              </h4>
                              <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{site.location}</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <Badge
                                className={`${statusConfig.bgLight} ${statusConfig.textColor} border-0 flex items-center gap-1.5 px-2.5 py-1`}
                              >
                                <StatusIcon className="h-3 w-3" />
                                <span className="font-medium">{site.status}</span>
                              </Badge>
                              <div className="flex items-center gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          handleEditSite(site);
                                        }}
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
                                        aria-label="Edit site"
                                      >
                                        <span>
                                          <Edit className="h-4 w-4" />
                                        </span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit site details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {!sitesWithTransactions.has(site.id) && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            handleDeleteSite(site);
                                          }}
                                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                                          aria-label="Delete site"
                                        >
                                          <span>
                                            <Trash2 className="h-4 w-4" />
                                          </span>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Delete site</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Progress Section */}
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-muted-foreground">
                                Project Progress
                              </span>
                              <span className="text-sm font-bold text-foreground">
                                {progressValue}%
                              </span>
                            </div>
                            <Progress
                              value={Math.min(Math.max(progressValue, 0), 100)}
                              className="h-2.5"
                            />
                          </div>

                          {/* Financial Overview */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
                              <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="h-3.5 w-3.5 text-primary" />
                                <p className="text-xs font-medium text-muted-foreground">Budget</p>
                              </div>
                              <p className="font-bold text-base text-primary">
                                ₹{budgetCrDisplay}Cr
                              </p>
                            </div>
                            <div className="rounded-lg bg-green-500/5 p-3 border border-green-500/10">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                                <p className="text-xs font-medium text-muted-foreground">Spent</p>
                              </div>
                              <p className="font-bold text-base text-green-600">
                                ₹{spentCrDisplay}Cr
                              </p>
                            </div>
                          </div>

                          {/* Timeline & Budget Usage */}
                          <div className="space-y-2.5 pt-3 border-t border-border/50">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {startDateLabel} - {endDateLabel}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-muted-foreground">
                                Budget Utilization
                              </span>
                              <Badge
                                variant={isOverBudget ? 'destructive' : 'secondary'}
                                className="text-xs font-semibold"
                              >
                                {budgetUsagePercent.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        </CardContent>

                        {/* Hover Effect Overlay */}
                        <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/20 rounded-lg transition-colors pointer-events-none" />
                      </Card>
                    );
                  })
                )}
              </div>
              {/* Scroll Indicators */}
              {filteredSites.length > 4 && (
                <div className="flex justify-center gap-2 mt-4">
                  {Array.from({ length: Math.ceil(filteredSites.length / 4) }).map((_, index) => {
                    const cardWidth = 320 + 16;
                    const currentPage = Math.round(scrollPosition / (cardWidth * 4));
                    const isActive = currentPage === index;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (scrollContainerRef.current) {
                            const newPosition = index * cardWidth * 4;
                            scrollContainerRef.current.scrollTo({
                              left: newPosition,
                              behavior: 'smooth',
                            });
                            // Update position after animation
                            setTimeout(() => {
                              if (scrollContainerRef.current) {
                                setScrollPosition(scrollContainerRef.current.scrollLeft);
                              }
                            }, 500);
                          }
                        }}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          isActive
                            ? 'w-8 bg-primary'
                            : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                        }`}
                        aria-label={`Go to page ${index + 1}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Success Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Site Deleted Successfully
            </DialogTitle>
            <DialogDescription>
              The site &quot;{deletedSiteName}&quot; has been permanently deleted from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsDeleteDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Section - Site Details */}
      <div className="flex-1 flex flex-col">
        <div className="h-full flex flex-col">
          {currentSite ? (
            <>
              {/* Site Header */}
              <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-background to-muted/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 bg-primary/10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Building2 className="h-7 w-7" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">{currentSite.name}</h1>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">{currentSite.location}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          currentSite.status === 'Active'
                            ? 'default'
                            : currentSite.status === 'Completed'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="px-3 py-1 text-sm font-medium"
                      >
                        {currentSite.status === 'Active' && (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        {currentSite.status === 'Stopped' && <Pause className="h-3 w-3 mr-1" />}
                        {currentSite.status === 'Completed' && (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        {currentSite.status === 'Canceled' && <XCircle className="h-3 w-3 mr-1" />}
                        {currentSite.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Site Overview Stats */}
              <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-muted/30 to-background">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Total Budget
                            </p>
                            <p className="text-2xl font-bold text-primary">
                              ₹{currentSiteMetrics ? currentSiteMetrics.budgetCr.toFixed(1) : '0.0'}
                              Cr
                            </p>
                          </div>
                          <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Amount Spent
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                              ₹{currentSiteMetrics ? currentSiteMetrics.spentCr.toFixed(1) : '0.0'}
                              Cr
                            </p>
                          </div>
                          <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Progress</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {currentSiteMetrics?.progressValue ?? 0}%
                            </p>
                          </div>
                          <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <BarChart3 className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Days Remaining
                            </p>
                            <p className="text-2xl font-bold text-orange-600">
                              {currentSiteMetrics?.daysRemaining ?? '—'}
                            </p>
                          </div>
                          <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                            <Clock className="h-6 w-6 text-orange-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Site Details Tabs */}
              <div className="flex-1 overflow-hidden min-w-0">
                <div className="h-full flex flex-col min-w-0">
                  <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-background to-muted/20 min-w-0">
                    <CardContent className="px-2 sm:px-6 py-4 min-w-0">
                      <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full min-w-0"
                      >
                        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6 lg:gap-1 bg-muted/50">
                          <TabsTrigger
                            value="overview"
                            className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all truncate min-w-0"
                          >
                            <Building2 className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden sm:inline truncate">Overview</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="purchase"
                            className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all truncate min-w-0"
                          >
                            <ShoppingCart className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden sm:inline truncate">Purchase</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="materials"
                            className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all truncate min-w-0"
                          >
                            <Package className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden sm:inline truncate">Materials</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="work-progress"
                            className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all truncate min-w-0"
                          >
                            <Target className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden sm:inline truncate">Work Progress</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="expenses"
                            className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all truncate min-w-0"
                          >
                            <DollarSign className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden sm:inline truncate">Expenses</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="scheduling"
                            className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all truncate min-w-0"
                          >
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden sm:inline truncate">Scheduling</span>
                          </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-y-auto min-w-0">
                          <div className="min-w-0">
                            <TabsContent value="overview" className="min-w-0">
                              <div className="p-6 space-y-6">
                                <div className="space-y-6">
                                  <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-4">
                                      <CardTitle className="flex items-center gap-3 text-lg">
                                        <Avatar className="h-8 w-8 bg-primary/10">
                                          <AvatarFallback className="bg-primary/10 text-primary">
                                            <FileText className="h-4 w-4" />
                                          </AvatarFallback>
                                        </Avatar>
                                        Project Description
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <Card className="bg-white/50 dark:bg-slate-800/50 border-border/50">
                                        <CardContent className="p-4">
                                          <p className="text-sm leading-relaxed text-muted-foreground">
                                            {currentSite.description}
                                          </p>
                                        </CardContent>
                                      </Card>
                                    </CardContent>
                                  </Card>

                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 hover:shadow-md transition-shadow">
                                      <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-3 text-base">
                                          <Avatar className="h-8 w-8 bg-blue-500/10">
                                            <AvatarFallback className="bg-blue-500/10 text-blue-600">
                                              <MapPin className="h-4 w-4" />
                                            </AvatarFallback>
                                          </Avatar>
                                          Location Details
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-3">
                                          <Card className="bg-white/50 dark:bg-slate-800/50 border-border/50">
                                            <CardContent className="p-3">
                                              <div className="flex items-center gap-3">
                                                <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                                <span className="text-sm font-medium">
                                                  {currentSite.location}
                                                </span>
                                              </div>
                                            </CardContent>
                                          </Card>
                                          <p className="text-xs text-muted-foreground">
                                            Construction site location and address details
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
                                      <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-3 text-base">
                                          <Avatar className="h-8 w-8 bg-green-500/10">
                                            <AvatarFallback className="bg-green-500/10 text-green-600">
                                              <Calendar className="h-4 w-4" />
                                            </AvatarFallback>
                                          </Avatar>
                                          Project Timeline
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-3">
                                          <Card className="bg-white/50 dark:bg-slate-800/50 border-border/50">
                                            <CardContent className="p-3">
                                              <div className="flex items-center gap-3">
                                                <Calendar className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                <div className="text-sm space-y-1">
                                                  <div className="font-medium">
                                                    Start: {formatDate(currentSite.startDate)}
                                                  </div>
                                                  <div className="font-medium">
                                                    End: {formatDate(currentSite.expectedEndDate)}
                                                  </div>
                                                </div>
                                              </div>
                                            </CardContent>
                                          </Card>
                                          <p className="text-xs text-muted-foreground">
                                            Project start and expected completion dates
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="purchase" className="mt-0 min-w-0">
                              <PurchasePage filterBySite={currentSite?.name} />
                            </TabsContent>

                            <TabsContent value="materials" className="mt-0 min-w-0">
                              <MaterialsPage filterBySite={currentSite?.id ?? undefined} />
                            </TabsContent>

                            <TabsContent value="work-progress" className="mt-0 min-w-0">
                              <WorkProgressPage filterBySite={currentSite?.name} />
                            </TabsContent>

                            <TabsContent value="expenses" className="mt-0 min-w-0">
                              <ExpensesPage filterBySite={currentSite?.name} />
                            </TabsContent>

                            <TabsContent value="scheduling" className="mt-0 min-w-0">
                              <SchedulingPage filterBySite={currentSite?.name} />
                            </TabsContent>
                          </div>
                        </div>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 hover:shadow-md transition-shadow">
                <CardContent className="p-12">
                  <div className="text-center">
                    <Avatar className="h-24 w-24 bg-primary/10 mx-auto mb-6">
                      <AvatarFallback className="bg-primary/10">
                        <Building2 className="h-12 w-12 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-2xl font-semibold mb-3">Select a Site</h3>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                      Choose a construction site from the list above to view detailed information,
                      manage materials, and track expenses.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        <FilterSheet
          open={isFilterSheetOpen}
          onOpenChange={setIsFilterSheetOpen}
          title="Site filters"
          description="Refine the site list with advanced criteria."
          sections={[
            {
              id: 'locations',
              title: 'Locations',
              description: 'Show sites that match the selected locations.',
              content:
                locationOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No locations available.</p>
                ) : (
                  <div className="grid gap-2">
                    {locationOptions.map((location) => {
                      const isChecked = draftAdvancedFilters.locations.includes(location);
                      return (
                        <Label
                          key={location}
                          className="flex items-center gap-3 text-sm font-normal"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              setDraftAdvancedFilters((prev) => {
                                const nextLocations =
                                  checked === true
                                    ? [...prev.locations, location]
                                    : prev.locations.filter((value) => value !== location);
                                return {
                                  ...prev,
                                  locations: nextLocations,
                                };
                              });
                            }}
                          />
                          <span>{location}</span>
                        </Label>
                      );
                    })}
                  </div>
                ),
            },
            {
              id: 'budget',
              title: 'Budget (₹)',
              description: 'Limit sites to a budget range.',
              content: (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="site-budget-min" className="text-sm font-medium">
                      Min
                    </Label>
                    <Input
                      id="site-budget-min"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={draftAdvancedFilters.budgetMin}
                      onChange={(event) =>
                        setDraftAdvancedFilters((prev) => ({
                          ...prev,
                          budgetMin: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="site-budget-max" className="text-sm font-medium">
                      Max
                    </Label>
                    <Input
                      id="site-budget-max"
                      type="number"
                      inputMode="decimal"
                      placeholder="Any"
                      value={draftAdvancedFilters.budgetMax}
                      onChange={(event) =>
                        setDraftAdvancedFilters((prev) => ({
                          ...prev,
                          budgetMax: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              ),
            },
            {
              id: 'start-date',
              title: 'Start date',
              description: 'Filter projects by their start date.',
              content: (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="site-start-from" className="text-sm font-medium">
                      From
                    </Label>
                    <Input
                      id="site-start-from"
                      type="date"
                      value={draftAdvancedFilters.startFrom ?? ''}
                      onChange={(event) =>
                        setDraftAdvancedFilters((prev) => ({
                          ...prev,
                          startFrom: event.target.value || undefined,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="site-start-to" className="text-sm font-medium">
                      To
                    </Label>
                    <Input
                      id="site-start-to"
                      type="date"
                      value={draftAdvancedFilters.startTo ?? ''}
                      onChange={(event) =>
                        setDraftAdvancedFilters((prev) => ({
                          ...prev,
                          startTo: event.target.value || undefined,
                        }))
                      }
                    />
                  </div>
                </div>
              ),
            },
            {
              id: 'end-date',
              title: 'Expected completion',
              description: 'Filter by expected completion date.',
              content: (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="site-end-from" className="text-sm font-medium">
                      From
                    </Label>
                    <Input
                      id="site-end-from"
                      type="date"
                      value={draftAdvancedFilters.endFrom ?? ''}
                      onChange={(event) =>
                        setDraftAdvancedFilters((prev) => ({
                          ...prev,
                          endFrom: event.target.value || undefined,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="site-end-to" className="text-sm font-medium">
                      To
                    </Label>
                    <Input
                      id="site-end-to"
                      type="date"
                      value={draftAdvancedFilters.endTo ?? ''}
                      onChange={(event) =>
                        setDraftAdvancedFilters((prev) => ({
                          ...prev,
                          endTo: event.target.value || undefined,
                        }))
                      }
                    />
                  </div>
                </div>
              ),
            },
          ]}
          onApply={() => {
            setAppliedAdvancedFilters(cloneSiteAdvancedFilters(draftAdvancedFilters));
            setIsFilterSheetOpen(false);
          }}
          onReset={() => {
            const resetFilters = createDefaultSiteAdvancedFilters();
            setDraftAdvancedFilters(resetFilters);
            setAppliedAdvancedFilters(resetFilters);
          }}
          isDirty={!isSiteAdvancedFilterDefault(draftAdvancedFilters)}
        />
      </div>
    </div>
  );
}
