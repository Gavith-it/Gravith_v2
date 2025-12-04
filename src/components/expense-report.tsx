'use client';

import { Download, FileText, Calendar, Building2, Filter, Loader2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { fetcher, swrConfig } from '../lib/swr';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { DatePicker } from './ui/date-picker';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

import { formatDate } from '@/lib/utils';
import type { Expense } from '@/types';

interface ExpenseReportProps {
  className?: string;
}

interface Site {
  id: string;
  name: string;
}

interface ExpenseReportData {
  expenses: Expense[];
  summary: {
    totalAmount: number;
    totalCount: number;
    categoryBreakdown: Record<Expense['category'], number>;
  };
}

const EXPENSE_CATEGORIES: Expense['category'][] = [
  'Labour',
  'Materials',
  'Equipment',
  'Transport',
  'Utilities',
  'Other',
];

export function ExpenseReport({ className }: ExpenseReportProps) {
  // Fetch sites using SWR (first page should be enough for dropdown)
  const { data: sitesData, isLoading: isLoadingSites } = useSWR<{ sites: Site[] }>(
    '/api/sites?page=1&limit=100',
    fetcher,
    swrConfig,
  );

  const sites = useMemo(() => sitesData?.sites ?? [], [sitesData]);
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [useCompleteDuration, setUseCompleteDuration] = useState<boolean>(true);
  const [reportData, setReportData] = useState<ExpenseReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

  // Fetch report data
  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSite !== 'all') {
        params.append('siteId', selectedSite);
      }
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (!useCompleteDuration) {
        if (dateFrom) {
          params.append('dateFrom', dateFrom.toISOString().split('T')[0]);
        }
        if (dateTo) {
          params.append('dateTo', dateTo.toISOString().split('T')[0]);
        }
      }

      const response = await fetch(`/api/expenses/report?${params.toString()}`);
      const payload = (await response.json().catch(() => ({}))) as ExpenseReportData & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load report data.');
      }

      setReportData(payload);
    } catch (error) {
      console.error('Failed to load report data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load report data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = () => {
    void fetchReportData();
  };

  const handleExportPDF = async () => {
    if (!reportData) {
      toast.error('Please generate a report first.');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      // Dynamic import for jsPDF to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredHeight: number) => {
        if (yPos + requiredHeight > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Expense Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Report Filters
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      yPos += 5;
      doc.text('Report Filters:', margin, yPos);
      yPos += 6;

      const selectedSiteName =
        selectedSite === 'all'
          ? 'All Sites'
          : sites.find((s) => s.id === selectedSite)?.name || 'Unknown';
      doc.text(`Site: ${selectedSiteName}`, margin + 5, yPos);
      yPos += 5;

      const categoryName = selectedCategory === 'all' ? 'All Categories' : selectedCategory;
      doc.text(`Category: ${categoryName}`, margin + 5, yPos);
      yPos += 5;

      const durationText = useCompleteDuration
        ? 'Complete Duration'
        : `From: ${dateFrom ? formatDate(dateFrom.toISOString()) : 'N/A'} To: ${dateTo ? formatDate(dateTo.toISOString()) : 'N/A'}`;
      doc.text(`Duration: ${durationText}`, margin + 5, yPos);
      yPos += 5;

      const generatedDate = new Date().toLocaleString();
      doc.text(`Generated: ${generatedDate}`, margin + 5, yPos);
      yPos += 10;

      // Summary Section
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Expenses: ${reportData.summary.totalCount}`, margin + 5, yPos);
      yPos += 5;
      doc.text(
        `Total Amount: ₹${reportData.summary.totalAmount.toLocaleString('en-IN')}`,
        margin + 5,
        yPos,
      );
      yPos += 8;

      // Category Breakdown
      if (Object.keys(reportData.summary.categoryBreakdown).length > 0) {
        checkPageBreak(30);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Category Breakdown', margin, yPos);
        yPos += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        Object.entries(reportData.summary.categoryBreakdown).forEach(([category, amount]) => {
          checkPageBreak(6);
          const percentage =
            reportData.summary.totalAmount > 0
              ? ((amount / reportData.summary.totalAmount) * 100).toFixed(1)
              : '0';
          doc.text(
            `${category}: ₹${amount.toLocaleString('en-IN')} (${percentage}%)`,
            margin + 5,
            yPos,
          );
          yPos += 5;
        });
        yPos += 5;
      }

      // Expense Details Table
      if (reportData.expenses.length > 0) {
        checkPageBreak(15);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Expense Details', margin, yPos);
        yPos += 8;

        // Table Header
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        const colWidths = [20, 50, 30, 30, 30, 30];
        const headers = ['Date', 'Description', 'Category', 'Site', 'Vendor', 'Amount'];
        let xPos = margin;
        headers.forEach((header, index) => {
          doc.text(header, xPos, yPos);
          xPos += colWidths[index];
        });
        yPos += 6;

        // Table Rows
        doc.setFont('helvetica', 'normal');
        reportData.expenses.forEach((expense) => {
          checkPageBreak(8);
          xPos = margin;
          const rowData = [
            formatDate(expense.date),
            expense.description.substring(0, 30),
            expense.category,
            expense.siteName || 'N/A',
            expense.vendor || 'N/A',
            `₹${expense.amount.toLocaleString('en-IN')}`,
          ];

          rowData.forEach((cell, index) => {
            doc.text(cell, xPos, yPos);
            xPos += colWidths[index];
          });
          yPos += 5;
        });
      } else {
        checkPageBreak(10);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('No expenses found for the selected filters.', margin, yPos);
      }

      // Save PDF
      const fileName = `expense-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Expense Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Site Selection */}
            <div className="space-y-2">
              <Label htmlFor="site-select">Site</Label>
              <Select
                value={selectedSite}
                onValueChange={setSelectedSite}
                disabled={isLoadingSites}
              >
                <SelectTrigger id="site-select">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={isLoadingSites ? 'Loading sites...' : 'Select Site'}>
                    {selectedSite === 'all'
                      ? 'All Sites'
                      : sites.find((s) => s.id === selectedSite)?.name || 'Select Site'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {isLoadingSites ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading sites...
                      </div>
                    </SelectItem>
                  ) : sites.length === 0 ? (
                    <SelectItem value="no-sites" disabled>
                      No sites available
                    </SelectItem>
                  ) : (
                    sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!isLoadingSites && sites.length > 0 && (
                <p className="text-xs text-muted-foreground">{sites.length} site(s) available</p>
              )}
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category-select">Expense Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category-select">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration Type */}
            <div className="space-y-2">
              <Label htmlFor="duration-type">Duration</Label>
              <Select
                value={useCompleteDuration ? 'complete' : 'custom'}
                onValueChange={(value) => setUseCompleteDuration(value === 'complete')}
              >
                <SelectTrigger id="duration-type">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complete">Complete Duration</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleGenerateReport} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Custom Date Range */}
          {!useCompleteDuration && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-from">From Date</Label>
                <DatePicker
                  date={dateFrom}
                  onSelect={setDateFrom}
                  placeholder="Select start date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to">To Date</Label>
                <DatePicker date={dateTo} onSelect={setDateTo} placeholder="Select end date" />
              </div>
            </div>
          )}

          {/* Report Results */}
          {reportData && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Total Expenses</div>
                    <div className="text-2xl font-bold">{reportData.summary.totalCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                    <div className="text-2xl font-bold">
                      ₹{reportData.summary.totalAmount.toLocaleString('en-IN')}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-2">Category Breakdown</div>
                    <div className="space-y-1">
                      {Object.entries(reportData.summary.categoryBreakdown).map(
                        ([category, amount]) => {
                          const percentage =
                            reportData.summary.totalAmount > 0
                              ? ((amount / reportData.summary.totalAmount) * 100).toFixed(1)
                              : '0';
                          return (
                            <div key={category} className="flex justify-between text-sm">
                              <span>{category}:</span>
                              <span className="font-medium">
                                ₹{amount.toLocaleString('en-IN')} ({percentage}%)
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Expense List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Expense Details</CardTitle>
                    <Button onClick={handleExportPDF} disabled={isGeneratingPDF} variant="outline">
                      {isGeneratingPDF ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {reportData.expenses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No expenses found for the selected filters.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {reportData.expenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{expense.description}</span>
                              <Badge variant="secondary">{expense.category}</Badge>
                              {expense.subcategory && (
                                <Badge variant="outline">{expense.subcategory}</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {expense.siteName && <span>Site: {expense.siteName}</span>}
                              {expense.vendor && (
                                <span className="ml-4">Vendor: {expense.vendor}</span>
                              )}
                              <span className="ml-4">Date: {formatDate(expense.date)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              ₹{expense.amount.toLocaleString('en-IN')}
                            </div>
                            <Badge
                              variant={
                                expense.status === 'paid'
                                  ? 'default'
                                  : expense.status === 'pending'
                                    ? 'secondary'
                                    : 'destructive'
                              }
                              className="text-xs"
                            >
                              {expense.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
