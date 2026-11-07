"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "../ui/Button";

interface DataTablePaginationProps {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  page,
  limit,
  totalItems,
  totalPages,
  onPageChange,
  onLimitChange,
}) => {
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white">
      {/* Items Count & Limit Selector */}
      <div className="flex items-center gap-4 text-xs text-slate-600">
        <div>
          Showing{" "}
          <span className="font-semibold text-slate-900">{startItem}</span> to{" "}
          <span className="font-semibold text-slate-900">{endItem}</span> of{" "}
          <span className="font-semibold text-slate-900">{totalItems}</span>{" "}
          entries
        </div>
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs  focus:outline-none"
          >
            {[5, 10, 20, 50, 80, 100, 200, 500].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-600 mr-2">
          Page <span className="font-semibold text-slate-900">{page}</span> of{" "}
          <span className="font-semibold text-slate-900">
            {totalPages || 1}
          </span>
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="p-1.5 h-8 w-8"
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 h-8 w-8"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 h-8 w-8"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="p-1.5 h-8 w-8"
          title="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
