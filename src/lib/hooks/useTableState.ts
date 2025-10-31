import { useState, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface TableState {
  sortField: string;
  sortDirection: SortDirection;
  currentPage: number;
  itemsPerPage: number;
  searchTerm: string;
  filter: Record<string, string>;
}

export interface UseTableStateOptions {
  initialSortField?: string;
  initialSortDirection?: SortDirection;
  initialItemsPerPage?: number;
  initialFilter?: Record<string, string>;
}

export interface UseTableStateReturn {
  // State
  sortField: string;
  sortDirection: SortDirection;
  currentPage: number;
  itemsPerPage: number;
  searchTerm: string;
  filter: Record<string, string>;

  // Actions
  setSortField: (field: string) => void;
  setSortDirection: (direction: SortDirection) => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  setSearchTerm: (term: string) => void;
  setFilter: (filter: Record<string, string>) => void;
  updateFilter: (key: string, value: string) => void;
  clearFilter: (key?: string) => void;
  resetTableState: () => void;

  // Computed
  totalPages: (totalItems: number) => number;
  offset: number;
}

const defaultOptions: Required<UseTableStateOptions> = {
  initialSortField: '',
  initialSortDirection: 'asc',
  initialItemsPerPage: 10,
  initialFilter: {},
};

export function useTableState(options: UseTableStateOptions = {}): UseTableStateReturn {
  const opts = { ...defaultOptions, ...options };

  const [sortField, setSortField] = useState<string>(opts.initialSortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(opts.initialSortDirection);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(opts.initialItemsPerPage);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filter, setFilter] = useState<Record<string, string>>(opts.initialFilter);

  // Handle sort field changes - toggle direction if same field, otherwise set to asc
  const handleSetSortField = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
      // Reset to first page when sorting changes
      setCurrentPage(1);
    },
    [sortField],
  );

  // Handle sort direction changes
  const handleSetSortDirection = useCallback((direction: SortDirection) => {
    setSortDirection(direction);
    setCurrentPage(1);
  }, []);

  // Handle page changes
  const handleSetCurrentPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  // Handle items per page changes
  const handleSetItemsPerPage = useCallback((items: number) => {
    setItemsPerPage(Math.max(1, items));
    setCurrentPage(1); // Reset to first page
  }, []);

  // Handle search term changes
  const handleSetSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page
  }, []);

  // Handle filter changes (replace entire filter object)
  const handleSetFilter = useCallback((newFilter: Record<string, string>) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page
  }, []);

  // Update a specific filter key
  const updateFilter = useCallback((key: string, value: string) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page
  }, []);

  // Clear a specific filter key or all filters
  const clearFilter = useCallback((key?: string) => {
    if (key) {
      setFilter((prev) => {
        const { [key]: _, ...rest } = prev;
        void _; // Explicitly mark as intentionally unused
        return rest;
      });
    } else {
      setFilter({});
    }
    setCurrentPage(1); // Reset to first page
  }, []);

  // Reset all table state
  const resetTableState = useCallback(() => {
    setSortField(opts.initialSortField);
    setSortDirection(opts.initialSortDirection);
    setCurrentPage(1);
    setItemsPerPage(opts.initialItemsPerPage);
    setSearchTerm('');
    setFilter(opts.initialFilter);
  }, [
    opts.initialSortField,
    opts.initialSortDirection,
    opts.initialItemsPerPage,
    opts.initialFilter,
  ]);

  // Computed values
  const offset = (currentPage - 1) * itemsPerPage;

  const totalPages = useCallback(
    (totalItems: number) => {
      return Math.ceil(totalItems / itemsPerPage);
    },
    [itemsPerPage],
  );

  return {
    // State
    sortField,
    sortDirection,
    currentPage,
    itemsPerPage,
    searchTerm,
    filter,

    // Actions
    setSortField: handleSetSortField,
    setSortDirection: handleSetSortDirection,
    setCurrentPage: handleSetCurrentPage,
    setItemsPerPage: handleSetItemsPerPage,
    setSearchTerm: handleSetSearchTerm,
    setFilter: handleSetFilter,
    updateFilter,
    clearFilter,
    resetTableState,

    // Computed
    totalPages,
    offset,
  };
}
