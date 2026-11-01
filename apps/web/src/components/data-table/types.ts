import React from 'react';

export interface ColumnDef<T> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  error?: string | null;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onSearchChange?: (search: string) => void;
  searchValue?: string;
  searchPlaceholder?: string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  getRowId?: (row: T) => string;
  onRetry?: () => void;
  emptyMessage?: string;
  toolbarActions?: React.ReactNode;
  filterComponent?: React.ReactNode;
}

