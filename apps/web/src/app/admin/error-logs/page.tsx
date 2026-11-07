"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppErrorLog, PaginatedResult } from "@monorepo/shared-types";
import { api } from "@/lib/api";
import { DataTable } from "@/components/data-table/DataTable";
import { ColumnDef } from "@/components/data-table/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Modal } from "@/components/ui/Modal";
import {
  RefreshCw,
  Search,
  Copy,
  Check,
  AlertTriangle,
  ServerCrash,
  Code2,
  Terminal,
  Filter,
} from "lucide-react";

export default function ErrorLogsPage() {
  const [data, setData] = useState<AppErrorLog[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedStatusCode, setSelectedStatusCode] = useState<string>("ALL");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [selectedLog, setSelectedLog] = useState<AppErrorLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedStack, setCopiedStack] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });

    if (search.trim()) params.append("search", search.trim());
    if (selectedStatusCode !== "ALL")
      params.append("statusCode", selectedStatusCode);

    try {
      const res = await api.get<PaginatedResult<AppErrorLog>>(
        `/error-logs?${params.toString()}`,
      );
      setData(res.data);
      setTotalItems(res.meta.totalItems);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      setError(err.message || "Failed to fetch MongoDB error logs");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, selectedStatusCode]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyStackTrace = (stack: string) => {
    navigator.clipboard.writeText(stack);
    setCopiedStack(true);
    setTimeout(() => setCopiedStack(false), 2000);
  };

  const getStatusBadgeVariant = (
    code: number,
  ): "danger" | "warning" | "default" => {
    if (code >= 500) return "danger";
    if (code >= 400) return "warning";
    return "default";
  };

  const columns: ColumnDef<AppErrorLog>[] = [
    {
      id: "timestamp",
      header: "Timestamp",
      accessorKey: "timestamp",
      sortable: true,
      cell: (log) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-800">
            {new Date(log.timestamp).toLocaleDateString()}
          </span>
          <span className="text-[11px] text-slate-500">
            {new Date(log.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      id: "status_code",
      header: "Status",
      accessorKey: "status_code",
      cell: (log) => (
        <Badge variant={getStatusBadgeVariant(log.status_code)}>
          {log.status_code || 500}
        </Badge>
      ),
    },
    {
      id: "error_type",
      header: "Error Type",
      accessorKey: "error_type",
      cell: (log) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-800 border border-slate-200">
          {log.error_type}
        </span>
      ),
    },
    {
      id: "module",
      header: "Module",
      accessorKey: "module",
      cell: (log) => (
        <span className="text-xs font-medium text-slate-600">
          {log.module || "API"}
        </span>
      ),
    },
    {
      id: "message",
      header: "Message",
      accessorKey: "message",
      cell: (log) => (
        <div
          className="max-w-xs truncate text-xs text-slate-900 font-medium"
          title={log.message}
        >
          {log.message}
        </div>
      ),
    },
    {
      id: "correlation_id",
      header: "Correlation ID",
      accessorKey: "correlation_id",
      cell: (log) => (
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
          <span>{log.correlation_id.slice(0, 8)}...</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(log.correlation_id, log.error_log_uuid);
            }}
            className="p-1 hover:text-slate-900 text-slate-400 rounded transition-colors"
            title="Copy correlation ID"
          >
            {copiedId === log.error_log_uuid ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (log) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedLog(log)}
          className="text-xs flex items-center gap-1"
        >
          <Terminal className="w-3.5 h-3.5 text-rose-600" />
          Inspect Stack
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Header */}
      <div>
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Application Error Logs" },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ServerCrash className="w-6 h-6 text-rose-600" />
              MongoDB Application Error Logs
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Document-oriented storage of uncaught exceptions, HTTP failures,
              correlation traces, and stack traces.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs()}
              disabled={isLoading}
              className="flex items-center gap-1.5"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search error message, type, or correlation ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none  transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">Status Code:</span>
          <select
            value={selectedStatusCode}
            onChange={(e) => {
              setSelectedStatusCode(e.target.value);
              setPage(1);
            }}
            className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Status Codes</option>
            <option value="500">500 Internal Server Error</option>
            <option value="400">400 Bad Request</option>
            <option value="401">401 Unauthorized</option>
            <option value="403">403 Forbidden</option>
            <option value="404">404 Not Found</option>
          </select>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Data Table */}
      <DataTable<AppErrorLog>
        data={data}
        columns={columns}
        totalItems={totalItems}
        page={page}
        limit={limit}
        totalPages={totalPages}
        isLoading={isLoading}
        error={error}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        onSortChange={(field, order) => {
          setSortBy(field);
          setSortOrder(order);
          setPage(1);
        }}
        emptyMessage="No application error logs currently recorded."
      />

      {/* Stack Trace & Error Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Error Telemetry & Stack Trace"
          size="xl"
        >
          <div className="space-y-6">
            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">
                  Status Code
                </span>
                <Badge
                  variant={getStatusBadgeVariant(selectedLog.status_code)}
                  className="mt-0.5"
                >
                  HTTP {selectedLog.status_code}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">
                  Error Type
                </span>
                <span className="font-semibold text-slate-800 font-mono">
                  {selectedLog.error_type}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">
                  Environment
                </span>
                <span className="font-mono text-slate-700">
                  {selectedLog.environment}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Module</span>
                <span className="text-slate-800 font-medium">
                  {selectedLog.module}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">
                  Correlation ID
                </span>
                <span className="font-mono text-slate-700">
                  {selectedLog.correlation_id}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">
                  Timestamp
                </span>
                <span className="text-slate-800">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
              <span className="text-xs font-semibold text-rose-800 block mb-1">
                Message:
              </span>
              <p className="text-sm font-mono text-rose-950 break-words">
                {selectedLog.message}
              </p>
            </div>

            {/* Request Telemetry */}
            {selectedLog.request_metadata && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 block">
                  HTTP Request Context
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-100 rounded-lg text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block">Method</span>
                    <span className="text-slate-800 font-bold">
                      {selectedLog.request_metadata.method || "GET"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">URL</span>
                    <span
                      className="text-slate-800 truncate block"
                      title={selectedLog.request_metadata.url}
                    >
                      {selectedLog.request_metadata.url || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">IP</span>
                    <span className="text-slate-800">
                      {selectedLog.request_metadata.ip || "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Stack Trace */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-rose-600" />
                  Stack Trace
                </span>
                {selectedLog.stack && (
                  <button
                    onClick={() => copyStackTrace(selectedLog.stack!)}
                    className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {copiedStack ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Trace</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="p-4 bg-slate-950 rounded-xl text-rose-400 font-mono text-xs overflow-auto max-h-80 whitespace-pre">
                {selectedLog.stack || "No stack trace recorded for this error."}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
