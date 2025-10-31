'use client';

import {
  Plus,
  Scale,
  TrendingUp,
  Package,
  Link as LinkIcon,
  Unlink,
  Edit,
  Trash2,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { useDialogState } from '../lib/hooks/useDialogState';
import { useTableState } from '../lib/hooks/useTableState';

import { DataTable } from './common/DataTable';
import { FormDialog } from './common/FormDialog';
import { MaterialReceiptForm } from './forms/MaterialReceiptForm';
import { PurchaseTabs } from './layout/PurchaseTabs';
import { useMaterialReceipts } from './shared/materialReceiptsContext';
import { useMaterials } from './shared/materialsContext';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { MaterialReceipt } from '@/types';

export function MaterialReceiptsPage() {
  const { receipts, deleteReceipt, linkReceiptToPurchase, unlinkReceipt } = useMaterialReceipts();
  const { materials } = useMaterials();

  // Use shared state hooks
  const tableState = useTableState({
    initialSortField: 'date',
    initialSortDirection: 'desc',
    initialItemsPerPage: 10,
  });

  const dialog = useDialogState<MaterialReceipt>();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedReceiptForLink, setSelectedReceiptForLink] = useState<MaterialReceipt | null>(
    null,
  );
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');

  // Calculate summary statistics
  const totalReceipts = receipts.length;
  const totalNetWeight = receipts.reduce((sum, receipt) => sum + receipt.netWeight, 0);
  const linkedCount = receipts.filter((r) => r.linkedPurchaseId).length;
  const openCount = receipts.filter((r) => !r.linkedPurchaseId).length;

  const sortedAndFilteredReceipts = receipts
    .filter((receipt) => {
      const matchesSearch =
        receipt.vehicleNumber.toLowerCase().includes(tableState.searchTerm.toLowerCase()) ||
        receipt.materialName.toLowerCase().includes(tableState.searchTerm.toLowerCase()) ||
        receipt.vendorName?.toLowerCase().includes(tableState.searchTerm.toLowerCase()) ||
        false;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'linked' && receipt.linkedPurchaseId) ||
        (statusFilter === 'open' && !receipt.linkedPurchaseId);
      // Category filter would require material category lookup
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[tableState.sortField as keyof MaterialReceipt];
      const bValue = b[tableState.sortField as keyof MaterialReceipt];

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

  const handleFormSubmit = () => {
    dialog.closeDialog();
  };

  const handleFormCancel = () => {
    dialog.closeDialog();
  };

  const handleEdit = (receipt: MaterialReceipt) => {
    dialog.openDialog(receipt);
  };

  const handleDelete = (receiptId: string) => {
    const receipt = receipts.find((r) => r.id === receiptId);
    if (receipt?.linkedPurchaseId) {
      toast.error('Cannot delete a linked receipt', {
        description: 'Please unlink the receipt from the purchase bill first.',
      });
      return;
    }
    deleteReceipt(receiptId);
    toast.success('Receipt deleted successfully');
  };

  const handleOpenLinkDialog = (receipt: MaterialReceipt) => {
    setSelectedReceiptForLink(receipt);
    setSelectedPurchaseId('');
    setLinkDialogOpen(true);
  };

  const handleLinkConfirm = () => {
    if (!selectedReceiptForLink || !selectedPurchaseId) {
      toast.error('Please select a purchase bill');
      return;
    }

    const success = linkReceiptToPurchase(selectedReceiptForLink.id, selectedPurchaseId);
    if (success) {
      toast.success('Receipt linked successfully', {
        description: `Receipt linked to purchase bill.`,
      });
      setLinkDialogOpen(false);
      setSelectedReceiptForLink(null);
      setSelectedPurchaseId('');
    }
  };

  const handleUnlink = (receipt: MaterialReceipt) => {
    if (!receipt.linkedPurchaseId) return;
    unlinkReceipt(receipt.id);
    toast.success('Receipt unlinked successfully');
  };

  // Get purchases that don't have a receipt linked
  const availablePurchases = materials.filter((m) => !m.linkedReceiptId);

  return (
    <div className="w-full bg-background">
      <PurchaseTabs />
      <div className="p-4 md:p-6 space-y-6 max-w-full">
        {/* Statistics */}
        <Card className="w-full overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Receipts</p>
                      <p className="text-2xl font-bold text-primary">{totalReceipts}</p>
                    </div>
                    <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Net Weight</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {totalNetWeight.toLocaleString()} kg
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Scale className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Linked</p>
                      <p className="text-2xl font-bold text-green-600">{linkedCount}</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <LinkIcon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Open</p>
                      <p className="text-2xl font-bold text-orange-600">{openCount}</p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
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
                      placeholder="Search by vehicle or material..."
                      value={tableState.searchTerm}
                      onChange={(e) => tableState.setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="linked">Linked</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
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
                        <p>Filter receipts by status</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <FormDialog
                    title={dialog.editingItem ? 'Edit Material Receipt' : 'Add Material Receipt'}
                    description={
                      dialog.editingItem
                        ? 'Update material receipt details'
                        : 'Record a new material receipt'
                    }
                    isOpen={dialog.isDialogOpen}
                    onOpenChange={(open) => {
                      if (open) {
                        dialog.openDialog();
                      } else {
                        dialog.closeDialog();
                      }
                    }}
                    maxWidth="max-w-3xl"
                    trigger={
                      <Button
                        onClick={() => dialog.openDialog()}
                        className="gap-2 transition-all hover:shadow-md whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Receipt</span>
                      </Button>
                    }
                  >
                    <MaterialReceiptForm
                      editingReceipt={dialog.editingItem}
                      onSubmit={handleFormSubmit}
                      onCancel={handleFormCancel}
                    />
                  </FormDialog>
                </div>
              </div>

              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium w-fit">
                {sortedAndFilteredReceipts.length} receipt
                {sortedAndFilteredReceipts.length !== 1 ? 's' : ''} found
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Receipts Table */}
        {sortedAndFilteredReceipts.length === 0 ? (
          <Card className="w-full">
            <CardContent className="p-6 md:p-12">
              <div className="flex flex-col items-center justify-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Receipts Found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  {receipts.length === 0
                    ? 'Start by recording your first material receipt.'
                    : 'No receipts match your current search and filter criteria.'}
                </p>
                <Button
                  onClick={() => dialog.openDialog()}
                  className="gap-2 transition-all hover:shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  Add Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full overflow-hidden">
            <CardContent className="p-0">
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', sortable: true },
                  { key: 'vehicle', label: 'Vehicle', sortable: true },
                  { key: 'material', label: 'Material', sortable: true },
                  { key: 'vendor', label: 'Vendor', sortable: true },
                  { key: 'weights', label: 'Weights (kg)', sortable: true },
                  { key: 'linkStatus', label: 'Link Status', sortable: false },
                  { key: 'actions', label: 'Actions', sortable: false },
                ]}
                data={sortedAndFilteredReceipts.map((receipt) => {
                  const linkedPurchase = receipt.linkedPurchaseId
                    ? materials.find((m) => m.id === receipt.linkedPurchaseId)
                    : null;

                  return {
                    date: (
                      <div className="font-medium">
                        {new Date(receipt.date).toLocaleDateString('en-IN')}
                      </div>
                    ),
                    vehicle: (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-primary/10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Package className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{receipt.vehicleNumber}</div>
                          <div className="text-sm text-muted-foreground">{receipt.date}</div>
                        </div>
                      </div>
                    ),
                    material: <div className="font-medium text-sm">{receipt.materialName}</div>,
                    vendor: (
                      <div className="text-sm">
                        {receipt.vendorName ? (
                          <div className="font-medium">{receipt.vendorName}</div>
                        ) : (
                          <span className="text-muted-foreground italic">No vendor</span>
                        )}
                      </div>
                    ),
                    weights: (
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Filled:</span>
                          <span className="font-medium">{receipt.filledWeight.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Empty:</span>
                          <span className="font-medium">{receipt.emptyWeight.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Net:</span>
                          <span className="font-bold text-primary">
                            {receipt.netWeight.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ),
                    linkStatus: receipt.linkedPurchaseId ? (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        Linked to {linkedPurchase?.invoiceNumber || 'Purchase'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Unlink className="h-3 w-3 mr-1" />
                        Open
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
                                  handleEdit(receipt);
                                }}
                                className="h-8 w-8 p-0 transition-all hover:bg-primary/10"
                              >
                                <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit receipt</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {receipt.linkedPurchaseId ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnlink(receipt);
                                  }}
                                  className="h-8 w-8 p-0 transition-all hover:bg-orange-100 dark:hover:bg-orange-900/30"
                                >
                                  <Unlink className="h-3 w-3 text-muted-foreground hover:text-orange-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Unlink from purchase</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenLinkDialog(receipt);
                                  }}
                                  className="h-8 w-8 p-0 transition-all hover:bg-green-100 dark:hover:bg-green-900/30"
                                >
                                  <LinkIcon className="h-3 w-3 text-muted-foreground hover:text-green-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Link to purchase</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(receipt.id);
                                }}
                                className="h-8 w-8 p-0 transition-all hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete receipt</p>
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
                totalPages={tableState.totalPages(sortedAndFilteredReceipts.length)}
                sortField={tableState.sortField}
                sortDirection={tableState.sortDirection}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Link to Purchase Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Receipt to Purchase Bill</DialogTitle>
            <DialogDescription>
              Select a purchase bill to link with receipt {selectedReceiptForLink?.vehicleNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedPurchaseId} onValueChange={setSelectedPurchaseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select purchase bill" />
              </SelectTrigger>
              <SelectContent>
                {availablePurchases.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No available purchases
                  </SelectItem>
                ) : (
                  availablePurchases.map((purchase) => (
                    <SelectItem key={purchase.id} value={purchase.id}>
                      {purchase.invoiceNumber} - {purchase.materialName} ({purchase.vendor})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkConfirm} disabled={!selectedPurchaseId}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
