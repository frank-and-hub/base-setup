'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface DataTableToolbarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  selectedCount?: number;
  filterComponent?: React.ReactNode;
  toolbarActions?: React.ReactNode;
}

export const DataTableToolbar: React.FC<DataTableToolbarProps> = ({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  selectedCount = 0,
  filterComponent,
  toolbarActions,
}) => {
  const [internalSearch, setInternalSearch] = useState(searchValue);

  useEffect(() => {
    setInternalSearch(searchValue);
  }, [searchValue]);

  // Debounced search
  useEffect(() => {
    if (!onSearchChange) return;
    const timer = setTimeout(() => {
      if (internalSearch !== searchValue) {
        onSearchChange(internalSearch);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [internalSearch, onSearchChange, searchValue]);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 border-b border-slate-200 bg-white">
      {/* Search Input & Custom Filter Slot */}
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {onSearchChange && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 placeholder-slate-400"
            />
            {internalSearch && (
              <button
                onClick={() => {
                  setInternalSearch('');
                  onSearchChange('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {filterComponent}

        {selectedCount > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
            {selectedCount} selected
          </span>
        )}
      </div>

      {/* Action Buttons Slot (e.g., Create button, Export, Refresh) */}
      {toolbarActions && (
        <div className="flex items-center gap-2.5 shrink-0">{toolbarActions}</div>
      )}
    </div>
  );
};

