'use client';

import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface DataTableColumn<TData = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  minWidth?: string;
  align?: 'left' | 'right' | 'center';
  render?: (row: TData) => React.ReactNode;
}

export interface DataTableProps<TData = unknown> {
  columns: DataTableColumn<TData>[];
  data: TData[];
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void;
  actions?: (row: TData) => React.ReactNode;
  pageSize?: number;
  currentPage?: number;
  totalPages?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export function DataTable<TData extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  data,
  onSort,
  onPageChange,
  actions,
  pageSize = 10,
  currentPage = 1,
  totalPages,
  sortField,
  sortDirection = 'asc',
}: DataTableProps<TData>) {
  const [internalPage, setInternalPage] = useState(1);
  const [internalSortField, setInternalSortField] = useState<string | undefined>();
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('asc');

  // Use external pagination if provided, otherwise use internal
  const page = currentPage ?? internalPage;
  const sortFieldValue = sortField ?? internalSortField;
  const sortDirectionValue = sortDirection ?? internalSortDirection;

  const handleSort = (field: string) => {
    const column = columns.find((col) => col.key === field);
    if (!column?.sortable) return;

    let newDirection: 'asc' | 'desc' = 'asc';
    if (sortFieldValue === field && sortDirectionValue === 'asc') {
      newDirection = 'desc';
    }

    if (onSort) {
      onSort(field, newDirection);
    } else {
      setInternalSortField(field);
      setInternalSortDirection(newDirection);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  // Calculate pagination
  const totalPagesValue = totalPages ?? Math.ceil(data.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = data.slice(startIndex, endIndex);

  const getAlignmentClass = (align?: 'left' | 'right' | 'center') => {
    switch (align) {
      case 'right':
        return 'text-right';
      case 'center':
        return 'text-center';
      default:
        return 'text-left';
    }
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="overflow-x-auto w-full min-w-0 max-w-full -mx-2 sm:mx-0 px-2 sm:px-0">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`font-semibold ${column.minWidth || ''} ${getAlignmentClass(column.align)} ${
                    column.sortable ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div
                    className={`flex items-center gap-2 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''}`}
                  >
                    <span>{column.label}</span>
                    {column.sortable &&
                      sortFieldValue === column.key &&
                      (sortDirectionValue === 'asc' ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
              ))}
              {actions && (
                <TableHead className="font-semibold text-right min-w-[100px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  key={(row as any).id || index}
                  className="group cursor-pointer transition-all duration-200 hover:bg-muted/50"
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={`${column.minWidth || ''} ${getAlignmentClass(column.align)} break-words sm:break-normal`}
                    >
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {column.render ? column.render(row) : (row as any)[column.key]}
                    </TableCell>
                  ))}
                  {actions && <TableCell className="text-right">{actions(row)}</TableCell>}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPagesValue > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPagesValue) }, (_, i) => {
                const pageNumber = i + 1;
                return (
                  <Button
                    key={pageNumber}
                    variant={page === pageNumber ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPagesValue}
              className="gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
