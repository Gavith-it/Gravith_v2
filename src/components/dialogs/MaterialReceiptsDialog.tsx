'use client';

import { Package, Scale, Link as LinkIcon, Unlink } from 'lucide-react';
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
import type { MaterialReceipt } from '@/types/entities';

interface MaterialReceiptsDialogProps {
  materialId: string;
  materialName: string;
  siteId?: string; // Optional: filter by site
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialReceiptsDialog({
  materialId,
  materialName,
  siteId,
  open,
  onOpenChange,
}: MaterialReceiptsDialogProps) {
  // Fetch first page to get total count
  const { data: firstPageData, isLoading: isLoadingFirstPage, error } = useSWR<{
    receipts: MaterialReceipt[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(open ? '/api/receipts?limit=100&page=1' : null, fetcher, swrConfig);

  const [allReceipts, setAllReceipts] = useState<MaterialReceipt[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setAllReceipts([]);
      setIsLoadingAll(false);
    }
  }, [open]);

  // Fetch all pages if there are multiple pages
  useEffect(() => {
    if (!open || !firstPageData?.pagination) return;

    const totalPages = firstPageData.pagination.totalPages;
    if (totalPages <= 1) {
      // Only one page, use the data we already have
      setAllReceipts(firstPageData.receipts || []);
      return;
    }

    // Fetch remaining pages
    setIsLoadingAll(true);
    const fetchAllPages = async () => {
      const receipts: MaterialReceipt[] = [...(firstPageData.receipts || [])];
      
      for (let page = 2; page <= totalPages; page++) {
        try {
          const response = await fetch(`/api/receipts?limit=100&page=${page}`);
          if (!response.ok) break;
          const data = (await response.json()) as {
            receipts: MaterialReceipt[];
            pagination?: {
              page: number;
              limit: number;
              total: number;
              totalPages: number;
            };
          };
          if (data.receipts) {
            receipts.push(...data.receipts);
          }
        } catch (err) {
          console.error(`Error fetching receipts page ${page}:`, err);
          break;
        }
      }
      
      setAllReceipts(receipts);
      setIsLoadingAll(false);
    };

    void fetchAllPages();
  }, [open, firstPageData]);

  const isLoading = isLoadingFirstPage || isLoadingAll;

  // Filter receipts by materialId and optionally siteId
  const filteredReceipts = useMemo(() => {
    if (!allReceipts.length && !firstPageData?.receipts) return [];
    
    const receiptsToFilter = allReceipts.length > 0 ? allReceipts : (firstPageData?.receipts || []);
    let receipts = receiptsToFilter.filter((receipt) => receipt.materialId === materialId);
    
    if (siteId) {
      receipts = receipts.filter(
        (receipt) =>
          receipt.siteId === siteId ||
          (receipt.siteName ?? '').toLowerCase() === siteId.toLowerCase(),
      );
    }
    
    return receipts.sort((a, b) => {
      // Sort by date descending (most recent first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [allReceipts, firstPageData, materialId, siteId]);

  // Calculate total inward quantity
  const totalInwardQty = useMemo(() => {
    return filteredReceipts.reduce((sum, receipt) => sum + (receipt.quantity ?? 0), 0);
  }, [filteredReceipts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="space-y-3 flex-shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">Material Receipts - {materialName}</DialogTitle>
          <DialogDescription>
            View all material receipts for this material
            {siteId ? ` at the selected site` : ' across all sites'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Loading receipts...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-destructive">
                Failed to load receipts. Please try again.
              </p>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Receipts Found</h3>
              <p className="text-muted-foreground text-center">
                No material receipts found for this material
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
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Receipts</p>
                        <p className="text-xl font-bold">{filteredReceipts.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Scale className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Inward Qty</p>
                        <p className="text-xl font-bold text-blue-600">
                          {totalInwardQty.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <LinkIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Linked Receipts</p>
                        <p className="text-xl font-bold text-green-600">
                          {filteredReceipts.filter((r) => r.linkedPurchaseId).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Receipts Table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Receipt Number</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Site</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Net Weight (kg)</TableHead>
                          <TableHead>Link Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReceipts.map((receipt) => (
                          <TableRow key={receipt.id}>
                            <TableCell className="font-medium">
                              {new Date(receipt.date).toLocaleDateString('en-IN')}
                            </TableCell>
                            <TableCell>
                              {receipt.receiptNumber || (
                                <span className="text-muted-foreground italic">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6 bg-primary/10">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    <Package className="h-3 w-3" />
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{receipt.vehicleNumber}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {receipt.vendorName ? (
                                <span className="text-sm">{receipt.vendorName}</span>
                              ) : (
                                <span className="text-muted-foreground italic text-sm">No vendor</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {receipt.siteName ? (
                                <span className="text-sm">{receipt.siteName}</span>
                              ) : (
                                <span className="text-muted-foreground italic text-sm">Unallocated</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {receipt.quantity.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="text-sm">
                                <div className="font-medium">{receipt.netWeight.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">
                                  Filled: {receipt.filledWeight.toFixed(2)} | Empty:{' '}
                                  {receipt.emptyWeight.toFixed(2)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {receipt.linkedPurchaseId ? (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                  <LinkIcon className="h-3 w-3 mr-1" />
                                  Linked
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Unlink className="h-3 w-3 mr-1" />
                                  Open
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
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

