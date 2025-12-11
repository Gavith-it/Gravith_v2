'use client';

import { Hammer, Calendar, Building2, Package } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import { fetcher, swrConfig } from '../../lib/swr';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { WorkProgressEntry } from '@/types/entities';

interface MaterialUtilizationDialogProps {
  materialId: string;
  materialName: string;
  siteId?: string; // Optional: filter by site
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialUtilizationDialog({
  materialId,
  materialName,
  siteId,
  open,
  onOpenChange,
}: MaterialUtilizationDialogProps) {
  // Fetch first page to get total count
  const { data: firstPageData, isLoading: isLoadingFirstPage, error } = useSWR<{
    entries?: WorkProgressEntry[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(open ? '/api/work-progress?limit=100&page=1' : null, fetcher, swrConfig);

  const [allEntries, setAllEntries] = useState<WorkProgressEntry[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setAllEntries([]);
      setIsLoadingAll(false);
    }
  }, [open]);

  // Fetch all pages if there are multiple pages
  useEffect(() => {
    if (!open || !firstPageData?.pagination) return;

    const totalPages = firstPageData.pagination.totalPages;
    if (totalPages <= 1) {
      // Only one page, use the data we already have
      setAllEntries(firstPageData.entries || []);
      return;
    }

    // Fetch remaining pages
    setIsLoadingAll(true);
    const fetchAllPages = async () => {
      const entries: WorkProgressEntry[] = [...(firstPageData.entries || [])];
      
      for (let page = 2; page <= totalPages; page++) {
        try {
          const response = await fetch(`/api/work-progress?limit=100&page=${page}`);
          if (!response.ok) break;
          const data = (await response.json()) as {
            entries?: WorkProgressEntry[];
            pagination?: {
              page: number;
              limit: number;
              total: number;
              totalPages: number;
            };
          };
          if (data.entries) {
            entries.push(...data.entries);
          }
        } catch (err) {
          console.error(`Error fetching work progress page ${page}:`, err);
          break;
        }
      }
      
      setAllEntries(entries);
      setIsLoadingAll(false);
    };

    void fetchAllPages();
  }, [open, firstPageData]);

  const isLoading = isLoadingFirstPage || isLoadingAll;

  // Filter work progress entries that consumed this material
  const filteredEntries = useMemo(() => {
    const entriesToFilter = allEntries.length > 0 ? allEntries : (firstPageData?.entries || []);
    if (!entriesToFilter.length) return [];

    let entries = entriesToFilter.filter((entry) => {
      // Check if this entry consumed the material
      return entry.materials?.some((material) => material.materialId === materialId);
    });

    // Filter by site if provided
    if (siteId) {
      entries = entries.filter(
        (entry) =>
          entry.siteId === siteId ||
          (entry.siteName ?? '').toLowerCase() === siteId.toLowerCase(),
      );
    }

    // Sort by date descending (most recent first)
    return entries.sort((a, b) => {
      return new Date(b.workDate).getTime() - new Date(a.workDate).getTime();
    });
  }, [allEntries, firstPageData, materialId, siteId]);

  // Calculate total utilized quantity and breakdown by work type
  const { totalUtilizedQty, breakdownByWorkType } = useMemo(() => {
    let total = 0;
    const breakdown = new Map<string, number>();

    filteredEntries.forEach((entry) => {
      const materialUsage = entry.materials?.find((m) => m.materialId === materialId);
      if (materialUsage) {
        const qty = materialUsage.quantity ?? 0;
        total += qty;
        const workType = entry.workType || 'Unknown';
        breakdown.set(workType, (breakdown.get(workType) || 0) + qty);
      }
    });

    return {
      totalUtilizedQty: total,
      breakdownByWorkType: Array.from(breakdown.entries()).map(([workType, qty]) => ({
        workType,
        qty,
      })),
    };
  }, [filteredEntries, materialId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="space-y-3 flex-shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">Material Utilization - {materialName}</DialogTitle>
          <DialogDescription>
            View all work progress entries that consumed this material
            {siteId ? ` at the selected site` : ' across all sites'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Loading utilization data...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-destructive">
                Failed to load utilization data. Please try again.
              </p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Hammer className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Utilization Found</h3>
              <p className="text-muted-foreground text-center">
                No work progress entries found that consumed this material
                {siteId ? ' at the selected site' : ''}.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Hammer className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Work Entries
                        </p>
                        <p className="text-xl font-bold">{filteredEntries.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Utilized Qty
                        </p>
                        <p className="text-xl font-bold text-orange-600">
                          {totalUtilizedQty.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Work Types</p>
                        <p className="text-xl font-bold text-purple-600">
                          {breakdownByWorkType.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown by Work Type */}
              {breakdownByWorkType.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3">Breakdown by Work Type</h3>
                    <div className="flex flex-wrap gap-2">
                      {breakdownByWorkType.map(({ workType, qty }) => (
                        <Badge key={workType} variant="outline" className="px-3 py-1">
                          <span className="font-medium">{workType}:</span>
                          <span className="ml-1">
                            {qty.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Work Progress Entries Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Site</TableHead>
                          <TableHead>Work Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Quantity Used</TableHead>
                          <TableHead className="text-right">Total Work Qty</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEntries.map((entry) => {
                          const materialUsage = entry.materials?.find(
                            (m) => m.materialId === materialId,
                          );
                          const qtyUsed = materialUsage?.quantity ?? 0;

                          return (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>{new Date(entry.workDate).toLocaleDateString('en-IN')}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6 bg-primary/10">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                      <Building2 className="h-3 w-3" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{entry.siteName}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="capitalize">
                                  {entry.workType}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-[300px]">
                                  <p className="text-sm truncate">
                                    {entry.description || (
                                      <span className="text-muted-foreground italic">No description</span>
                                    )}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-orange-600">
                                {qtyUsed.toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-sm">
                                  {entry.totalQuantity.toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                  })}{' '}
                                  {entry.unit}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    entry.status === 'completed'
                                      ? 'default'
                                      : entry.status === 'in_progress'
                                        ? 'secondary'
                                        : 'outline'
                                  }
                                  className="capitalize"
                                >
                                  {entry.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

