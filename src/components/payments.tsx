'use client';

import {
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2,
  User,
  Calendar,
  CreditCard,
  Receipt,
  FileText,
  Filter,
  Info,
  BarChart3,
  Search,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { DataTable } from '@/components/common/DataTable';
import { FormDialog } from '@/components/common/FormDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDialogState } from '@/lib/hooks/useDialogState';
import { useTableState } from '@/lib/hooks/useTableState';

interface Payment {
  id: string;
  clientName: string;
  projectName: string;
  contractValue: number;
  amountPaid: number;
  amountOutstanding: number;
  dueDate: string;
  status: 'paid' | 'partial' | 'overdue' | 'pending';
  lastPaymentDate?: string;
  paymentTerms: string;
  invoiceNumber: string;
  notes?: string;
}

interface PaymentRecord {
  id: string;
  paymentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'bank_transfer' | 'cheque' | 'cash' | 'online';
  transactionId?: string;
  receivedBy: string;
  notes?: string;
}

const mockPayments: Payment[] = [
  {
    id: '1',
    clientName: 'Acme Real Estate Pvt. Ltd.',
    projectName: 'Green Valley Apartments',
    contractValue: 50000000,
    amountPaid: 35000000,
    amountOutstanding: 15000000,
    dueDate: '2024-02-15',
    status: 'partial',
    lastPaymentDate: '2024-01-25',
    paymentTerms: '30 days',
    invoiceNumber: 'INV-2024-001',
    notes: 'Milestone payment pending',
  },
  {
    id: '2',
    clientName: 'Skyline Construction Co.',
    projectName: 'Metro Mall Complex',
    contractValue: 80000000,
    amountPaid: 80000000,
    amountOutstanding: 0,
    dueDate: '2024-01-30',
    status: 'paid',
    lastPaymentDate: '2024-01-28',
    paymentTerms: '45 days',
    invoiceNumber: 'INV-2024-002',
  },
  {
    id: '3',
    clientName: 'City Infrastructure Ltd.',
    projectName: 'Highway Bridge Project',
    contractValue: 120000000,
    amountPaid: 72000000,
    amountOutstanding: 48000000,
    dueDate: '2024-01-10',
    status: 'overdue',
    lastPaymentDate: '2023-12-15',
    paymentTerms: '60 days',
    invoiceNumber: 'INV-2024-003',
    notes: 'Follow up required - overdue by 25 days',
  },
  {
    id: '4',
    clientName: 'Residential Developers Inc.',
    projectName: 'Luxury Villas Phase 2',
    contractValue: 35000000,
    amountPaid: 0,
    amountOutstanding: 35000000,
    dueDate: '2024-02-28',
    status: 'pending',
    paymentTerms: '30 days',
    invoiceNumber: 'INV-2024-004',
  },
];

const mockPaymentRecords: PaymentRecord[] = [
  {
    id: '1',
    paymentId: '1',
    amount: 15000000,
    paymentDate: '2024-01-25',
    paymentMethod: 'bank_transfer',
    transactionId: 'TXN123456789',
    receivedBy: 'Finance Team',
    notes: 'First milestone payment',
  },
  {
    id: '2',
    paymentId: '1',
    amount: 20000000,
    paymentDate: '2024-01-10',
    paymentMethod: 'bank_transfer',
    transactionId: 'TXN987654321',
    receivedBy: 'Finance Team',
    notes: 'Initial advance payment',
  },
];

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

const enhancedTooltipStyle = {
  contentStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    border: '2px solid rgba(6, 182, 212, 0.3)',
    borderRadius: '12px',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(12px)',
    padding: '12px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  },
  labelStyle: {
    color: '#1e40af',
    fontWeight: '700',
    fontSize: '15px',
    marginBottom: '10px',
    textAlign: 'center' as const,
    borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
    paddingBottom: '6px',
  },
  itemStyle: {
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
    margin: '4px 0',
  },
};

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(mockPaymentRecords);

  // Use shared state hooks
  const tableState = useTableState({
    initialSortField: 'clientName',
    initialSortDirection: 'asc',
    initialItemsPerPage: 10,
  });

  const paymentDialog = useDialogState();
  const recordPaymentDialog = useDialogState();

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  const [paymentForm, setPaymentForm] = useState({
    clientName: '',
    projectName: '',
    contractValue: '',
    dueDate: '',
    paymentTerms: '',
    invoiceNumber: '',
    notes: '',
  });

  const [recordPaymentForm, setRecordPaymentForm] = useState({
    paymentId: '',
    amount: '',
    paymentDate: '',
    paymentMethod: 'bank_transfer' as PaymentRecord['paymentMethod'],
    transactionId: '',
    receivedBy: '',
    notes: '',
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newPayment: Payment = {
      id: (payments.length + 1).toString(),
      clientName: paymentForm.clientName,
      projectName: paymentForm.projectName,
      contractValue: Number(paymentForm.contractValue),
      amountPaid: 0,
      amountOutstanding: Number(paymentForm.contractValue),
      dueDate: paymentForm.dueDate,
      status: 'pending',
      paymentTerms: paymentForm.paymentTerms,
      invoiceNumber: paymentForm.invoiceNumber,
      notes: paymentForm.notes,
    };

    setPayments((prev) => [...prev, newPayment]);
    setPaymentForm({
      clientName: '',
      projectName: '',
      contractValue: '',
      dueDate: '',
      paymentTerms: '',
      invoiceNumber: '',
      notes: '',
    });
    paymentDialog.closeDialog();
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord: PaymentRecord = {
      id: (paymentRecords.length + 1).toString(),
      paymentId: recordPaymentForm.paymentId,
      amount: Number(recordPaymentForm.amount),
      paymentDate: recordPaymentForm.paymentDate,
      paymentMethod: recordPaymentForm.paymentMethod,
      transactionId: recordPaymentForm.transactionId,
      receivedBy: recordPaymentForm.receivedBy,
      notes: recordPaymentForm.notes,
    };

    setPaymentRecords((prev) => [...prev, newRecord]);

    // Update payment status
    setPayments((prev) =>
      prev.map((payment) => {
        if (payment.id === recordPaymentForm.paymentId) {
          const newAmountPaid = payment.amountPaid + Number(recordPaymentForm.amount);
          const newOutstanding = payment.contractValue - newAmountPaid;
          return {
            ...payment,
            amountPaid: newAmountPaid,
            amountOutstanding: newOutstanding,
            lastPaymentDate: recordPaymentForm.paymentDate,
            status: newOutstanding === 0 ? 'paid' : ('partial' as Payment['status']),
          };
        }
        return payment;
      }),
    );

    setRecordPaymentForm({
      paymentId: '',
      amount: '',
      paymentDate: '',
      paymentMethod: 'bank_transfer',
      transactionId: '',
      receivedBy: '',
      notes: '',
    });
    recordPaymentDialog.closeDialog();
  };

  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Partial
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPaymentMethodIcon = (method: PaymentRecord['paymentMethod']) => {
    switch (method) {
      case 'bank_transfer':
        return <CreditCard className="h-4 w-4" />;
      case 'cheque':
        return <FileText className="h-4 w-4" />;
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      case 'online':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const filteredPayments = payments
    .filter((payment) => {
      const matchesStatus =
        selectedStatusFilter === 'all' || payment.status === selectedStatusFilter;
      const matchesSearch =
        payment.clientName?.toLowerCase().includes(tableState.searchTerm.toLowerCase()) ||
        payment.projectName?.toLowerCase().includes(tableState.searchTerm.toLowerCase()) ||
        payment.invoiceNumber?.toLowerCase().includes(tableState.searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      const aValue = a[tableState.sortField as keyof Payment];
      const bValue = b[tableState.sortField as keyof Payment];

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

  // Analytics calculations
  const totalContractValue = payments.reduce((sum, payment) => sum + payment.contractValue, 0);
  const totalAmountPaid = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
  const totalOutstanding = payments.reduce((sum, payment) => sum + payment.amountOutstanding, 0);
  const overduePayments = payments.filter((p) => p.status === 'overdue');
  const overdueAmount = overduePayments.reduce(
    (sum, payment) => sum + payment.amountOutstanding,
    0,
  );

  // Status distribution for pie chart
  const statusDistribution = [
    {
      name: 'Paid',
      value: payments.filter((p) => p.status === 'paid').length,
      amount: payments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + p.contractValue, 0),
    },
    {
      name: 'Partial',
      value: payments.filter((p) => p.status === 'partial').length,
      amount: payments
        .filter((p) => p.status === 'partial')
        .reduce((sum, p) => sum + p.contractValue, 0),
    },
    {
      name: 'Overdue',
      value: payments.filter((p) => p.status === 'overdue').length,
      amount: payments
        .filter((p) => p.status === 'overdue')
        .reduce((sum, p) => sum + p.contractValue, 0),
    },
    {
      name: 'Pending',
      value: payments.filter((p) => p.status === 'pending').length,
      amount: payments
        .filter((p) => p.status === 'pending')
        .reduce((sum, p) => sum + p.contractValue, 0),
    },
  ];

  // Monthly payment trends
  const monthlyTrends = [
    { month: 'Oct', received: 25000000, due: 30000000 },
    { month: 'Nov', received: 45000000, due: 40000000 },
    { month: 'Dec', received: 35000000, due: 50000000 },
    { month: 'Jan', received: 80000000, due: 70000000 },
    { month: 'Feb', received: 15000000, due: 63000000 },
  ];

  // Client-wise payment analysis
  const clientAnalysis = payments.map((payment) => ({
    client:
      payment.clientName.length > 20
        ? payment.clientName.substring(0, 20) + '...'
        : payment.clientName,
    contractValue: payment.contractValue,
    paid: payment.amountPaid,
    outstanding: payment.amountOutstanding,
    paymentPercentage: (payment.amountPaid / payment.contractValue) * 100,
  }));

  return (
    <div className="h-full w-full bg-background flex flex-col">
      <Tabs defaultValue="payments" className="flex-1 flex flex-col overflow-hidden">
        {/* Navigation Tabs - Topmost */}
        <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-background to-muted/20">
          <CardContent className="px-6 py-4">
            <TabsList>
              <TabsTrigger value="payments">Payment Tracking</TabsTrigger>
              <TabsTrigger value="records">Payment History</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        {/* Payments Tab */}
        <TabsContent value="payments" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium text-muted-foreground">
                            Total Contracts
                          </p>
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Total number of active client contracts</p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          ₹{(totalContractValue / 10000000).toFixed(1)}Cr
                        </p>
                        <p className="text-xs text-blue-600">{payments.length} contracts</p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium text-muted-foreground">
                            Amount Received
                          </p>
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Total payments received from all clients</p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                          ₹{(totalAmountPaid / 10000000).toFixed(1)}Cr
                        </p>
                        <p className="text-xs text-green-600">
                          {((totalAmountPaid / totalContractValue) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  Total outstanding amount across all contracts
                                </p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">
                          ₹{(totalOutstanding / 10000000).toFixed(1)}Cr
                        </p>
                        <p className="text-xs text-orange-600">
                          {((totalOutstanding / totalContractValue) * 100).toFixed(1)}% pending
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                        <TrendingDown className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Payments that are past their due date</p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </div>
                        <p className="text-2xl font-bold text-red-600">
                          ₹{(overdueAmount / 10000000).toFixed(1)}Cr
                        </p>
                        <p className="text-xs text-red-600">{overduePayments.length} overdue</p>
                      </div>
                      <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Overdue Alerts */}
              {overduePayments.length > 0 && (
                <div className="space-y-2">
                  {overduePayments.map((payment) => (
                    <Alert key={payment.id} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Overdue Payment:</strong> {payment.clientName} -{' '}
                        {payment.projectName} - ₹{(payment.amountOutstanding / 10000000).toFixed(1)}
                        Cr due since {payment.dueDate}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Filters and Actions */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Client Payments</h3>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search payments..."
                          value={tableState.searchTerm}
                          onChange={(e) => tableState.setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={selectedStatusFilter}
                          onValueChange={setSelectedStatusFilter}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="outline"
                        onClick={recordPaymentDialog.openDialog}
                        className="gap-2"
                      >
                        <Receipt className="h-4 w-4" />
                        Record Payment
                      </Button>
                      <Button onClick={paymentDialog.openDialog} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Contract
                      </Button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <DataTable
                      columns={[
                        { key: 'client', label: 'Client & Project', sortable: true },
                        { key: 'contractValue', label: 'Contract Value', sortable: true },
                        { key: 'amountPaid', label: 'Amount Paid', sortable: true },
                        { key: 'amountOutstanding', label: 'Outstanding', sortable: true },
                        { key: 'paymentProgress', label: 'Payment Progress', sortable: false },
                        { key: 'dueDate', label: 'Due Date', sortable: true },
                        { key: 'status', label: 'Status', sortable: true },
                      ]}
                      data={filteredPayments.map((payment) => ({
                        client: (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{payment.clientName}</p>
                              <p className="text-xs text-muted-foreground">{payment.projectName}</p>
                            </div>
                          </div>
                        ),
                        contractValue: (
                          <p className="font-medium">
                            ₹{(payment.contractValue / 10000000).toFixed(1)}Cr
                          </p>
                        ),
                        amountPaid: (
                          <p className="font-medium text-green-600">
                            ₹{(payment.amountPaid / 10000000).toFixed(1)}Cr
                          </p>
                        ),
                        amountOutstanding: (
                          <p className="font-medium text-orange-600">
                            ₹{(payment.amountOutstanding / 10000000).toFixed(1)}Cr
                          </p>
                        ),
                        paymentProgress: (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>
                                {((payment.amountPaid / payment.contractValue) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <Progress
                              value={(payment.amountPaid / payment.contractValue) * 100}
                              className="h-2"
                            />
                          </div>
                        ),
                        dueDate: (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{payment.dueDate}</span>
                          </div>
                        ),
                        status: getStatusBadge(payment.status),
                      }))}
                      onSort={tableState.setSortField}
                      onPageChange={tableState.setCurrentPage}
                      pageSize={tableState.itemsPerPage}
                      currentPage={tableState.currentPage}
                      totalPages={tableState.totalPages(filteredPayments.length)}
                      sortField={tableState.sortField}
                      sortDirection={tableState.sortDirection}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="records" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Payment History</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <DataTable
                      columns={[
                        { key: 'paymentDate', label: 'Date', sortable: true },
                        { key: 'client', label: 'Client', sortable: true },
                        { key: 'amount', label: 'Amount', sortable: true },
                        { key: 'paymentMethod', label: 'Method', sortable: true },
                        { key: 'transactionId', label: 'Transaction ID', sortable: false },
                        { key: 'receivedBy', label: 'Received By', sortable: true },
                        { key: 'notes', label: 'Notes', sortable: false },
                      ]}
                      data={paymentRecords.map((record) => {
                        const payment = payments.find((p) => p.id === record.paymentId);
                        return {
                          paymentDate: record.paymentDate,
                          client: (
                            <div>
                              <p className="font-medium">{payment?.clientName}</p>
                              <p className="text-xs text-muted-foreground">
                                {payment?.projectName}
                              </p>
                            </div>
                          ),
                          amount: (
                            <p className="font-medium text-green-600">
                              ₹{(record.amount / 10000000).toFixed(1)}Cr
                            </p>
                          ),
                          paymentMethod: (
                            <div className="flex items-center gap-2">
                              {getPaymentMethodIcon(record.paymentMethod)}
                              <span className="text-sm capitalize">
                                {record.paymentMethod.replace('_', ' ')}
                              </span>
                            </div>
                          ),
                          transactionId: (
                            <span className="text-sm font-mono">{record.transactionId || '-'}</span>
                          ),
                          receivedBy: record.receivedBy,
                          notes: (
                            <span className="text-sm text-muted-foreground">
                              {record.notes || '-'}
                            </span>
                          ),
                        };
                      })}
                      onSort={() => {}}
                      pageSize={10}
                      currentPage={1}
                      totalPages={1}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Status Distribution */}
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Payment Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip {...enhancedTooltipStyle} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Monthly Payment Trends */}
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Monthly Payment Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `₹${(value / 10000000).toFixed(1)}Cr`} />
                        <Tooltip
                          {...enhancedTooltipStyle}
                          formatter={(value) => [`₹${(Number(value) / 10000000).toFixed(1)}Cr`, '']}
                        />
                        <Legend />
                        <Bar dataKey="received" fill="#10b981" name="Received" />
                        <Bar dataKey="due" fill="#f59e0b" name="Due" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Client Payment Analysis */}
                <Card className="lg:col-span-2 border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Client Payment Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={clientAnalysis} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          tickFormatter={(value) => `₹${(value / 10000000).toFixed(1)}Cr`}
                        />
                        <YAxis dataKey="client" type="category" width={150} />
                        <Tooltip
                          {...enhancedTooltipStyle}
                          formatter={(value) => [`₹${(Number(value) / 10000000).toFixed(1)}Cr`, '']}
                        />
                        <Legend />
                        <Bar dataKey="paid" fill="#10b981" name="Amount Paid" />
                        <Bar dataKey="outstanding" fill="#f59e0b" name="Outstanding" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Dialog Forms */}
      <FormDialog
        title="Record Payment Received"
        description="Update payment records for existing contracts"
        isOpen={recordPaymentDialog.isDialogOpen}
        onOpenChange={recordPaymentDialog.toggleDialog}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Contract</Label>
            <Select
              value={recordPaymentForm.paymentId}
              onValueChange={(value) =>
                setRecordPaymentForm((prev) => ({ ...prev, paymentId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose contract" />
              </SelectTrigger>
              <SelectContent>
                {payments
                  .filter((p) => p.amountOutstanding > 0)
                  .map((payment) => (
                    <SelectItem key={payment.id} value={payment.id}>
                      {payment.clientName} - {payment.projectName} (Outstanding: ₹
                      {(payment.amountOutstanding / 10000000).toFixed(1)}Cr)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount Received (₹)</Label>
              <Input
                type="number"
                value={recordPaymentForm.amount}
                onChange={(e) =>
                  setRecordPaymentForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="15000000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <DatePicker
                date={
                  recordPaymentForm.paymentDate
                    ? new Date(recordPaymentForm.paymentDate)
                    : undefined
                }
                onSelect={(date) =>
                  setRecordPaymentForm((prev) => ({
                    ...prev,
                    paymentDate: date ? date.toISOString().split('T')[0] : '',
                  }))
                }
                placeholder="Select payment date"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={recordPaymentForm.paymentMethod}
                onValueChange={(value) =>
                  setRecordPaymentForm((prev) => ({
                    ...prev,
                    paymentMethod: value as PaymentRecord['paymentMethod'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="online">Online Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transaction ID</Label>
              <Input
                value={recordPaymentForm.transactionId}
                onChange={(e) =>
                  setRecordPaymentForm((prev) => ({ ...prev, transactionId: e.target.value }))
                }
                placeholder="TXN123456789"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Received By</Label>
            <Input
              value={recordPaymentForm.receivedBy}
              onChange={(e) =>
                setRecordPaymentForm((prev) => ({ ...prev, receivedBy: e.target.value }))
              }
              placeholder="Finance Team"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input
              value={recordPaymentForm.notes}
              onChange={(e) => setRecordPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Milestone payment, advance, etc."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => recordPaymentDialog.closeDialog()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!recordPaymentForm.paymentId}>
              Record Payment
            </Button>
          </div>
        </form>
      </FormDialog>

      <FormDialog
        title="Add New Payment Contract"
        description="Create a new client payment tracking record"
        isOpen={paymentDialog.isDialogOpen}
        onOpenChange={paymentDialog.toggleDialog}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input
                value={paymentForm.clientName}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, clientName: e.target.value }))
                }
                placeholder="Acme Real Estate Pvt. Ltd."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                value={paymentForm.projectName}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, projectName: e.target.value }))
                }
                placeholder="Green Valley Apartments"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contract Value (₹)</Label>
              <Input
                type="number"
                value={paymentForm.contractValue}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, contractValue: e.target.value }))
                }
                placeholder="50000000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <DatePicker
                date={paymentForm.dueDate ? new Date(paymentForm.dueDate) : undefined}
                onSelect={(date) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    dueDate: date ? date.toISOString().split('T')[0] : '',
                  }))
                }
                placeholder="Select due date"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select
                value={paymentForm.paymentTerms}
                onValueChange={(value) =>
                  setPaymentForm((prev) => ({ ...prev, paymentTerms: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15 days">15 days</SelectItem>
                  <SelectItem value="30 days">30 days</SelectItem>
                  <SelectItem value="45 days">45 days</SelectItem>
                  <SelectItem value="60 days">60 days</SelectItem>
                  <SelectItem value="90 days">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input
                value={paymentForm.invoiceNumber}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))
                }
                placeholder="INV-2024-001"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional payment terms or notes"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => paymentDialog.closeDialog()}>
              Cancel
            </Button>
            <Button type="submit">Create Contract</Button>
          </div>
        </form>
      </FormDialog>
    </div>
  );
}
