'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AuditLog, PaginatedResult } from '@monorepo/shared-types';
import { api } from '@/lib/api';
import { DataTable } from '@/components/data-table/DataTable';
import { ColumnDef } from '@/components/data-table/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Modal } from '@/components/ui/Modal';
import {
  FileText,
  RefreshCw,
  Search,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Filter,
} from 'lucide-react';

export default function AuditLogsPage() {
  const [data, setData] = useState<AuditLog[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('ALL');
  const [selectedResource, setSelectedResource] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });

    if (search.trim()) params.append('search', search.trim());
    if (selectedOutcome !== 'ALL') params.append('outcome', selectedOutcome);
    if (selectedResource !== 'ALL') params.append('resource_type', selectedResource);

    try {
      const res = await api.get<PaginatedResult<AuditLog>>(`/audit-logs?${params.toString()}`);
      setData(res.data);
      setTotalItems(res.meta.totalItems);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, selectedOutcome, selectedResource]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionBadgeVariant = (action: string): 'default' | 'success' | 'warning' | 'danger' | 'indigo' => {
    if (action.includes('CREATE') || action.includes('REGISTER')) return 'success';
    if (action.includes('UPDATE') || action.includes('MODIFY')) return 'indigo';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'danger';
    if (action.includes('LOGIN') || action.includes('AUTH')) return 'default';
    return 'warning';
  };

  const columns: ColumnDef<AuditLog>[] = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      accessorKey: 'timestamp',
      sortable: true,
      cell: (log) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-800">
            {new Date(log.timestamp).toLocaleDateString()}
          </span>
          <span className="text-[11px] text-slate-500">
            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      ),
    },
    {
      id: 'actor',
      header: 'Actor',
      accessorKey: 'actor_email',
      cell: (log) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-900">
            {log.actor_email || 'System'}
          </span>
          {log.actor_uuid && (
            <span className="text-[10px] text-slate-400 font-mono">
              {log.actor_uuid.slice(0, 8)}...
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      accessorKey: 'action',
      cell: (log) => (
        <Badge variant={getActionBadgeVariant(log.action)}>
          {log.action}
        </Badge>
      ),
    },
    {
      id: 'resource',
      header: 'Resource',
      accessorKey: 'resource_type',
      cell: (log) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {log.resource_type}
        </span>
      ),
    },
    {
      id: 'outcome',
      header: 'Outcome',
      accessorKey: 'outcome',
      cell: (log) =>
        log.outcome === 'SUCCESS' ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            SUCCESS
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            FAILURE
          </span>
        ),
    },
    {
      id: 'correlation_id',
      header: 'Correlation ID',
      accessorKey: 'correlation_id',
      cell: (log) => (
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
          <span>{log.correlation_id.slice(0, 8)}...</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(log.correlation_id, log.audit_log_uuid);
            }}
            className="p-1 hover:text-slate-900 text-slate-400 rounded transition-colors"
            title="Copy correlation ID"
          >
            {copiedId === log.audit_log_uuid ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Details',
      cell: (log) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedLog(log)}
          className="text-xs flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          Inspect
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
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Audit Logs' },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Structured PostgreSQL Audit Logs
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Immutable audit log of all administrative actions, authorization events, and entity state changes.
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
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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
            placeholder="Search action, actor, resource, ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Outcome Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Outcome:</span>
            <select
              value={selectedOutcome}
              onChange={(e) => {
                setSelectedOutcome(e.target.value);
                setPage(1);
              }}
              className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Outcomes</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILURE">FAILURE</option>
            </select>
          </div>

          {/* Resource Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Resource:</span>
            <select
              value={selectedResource}
              onChange={(e) => {
                setSelectedResource(e.target.value);
                setPage(1);
              }}
              className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Resources</option>
              <option value="User">User</option>
              <option value="Role">Role</option>
              <option value="Setting">Setting</option>
              <option value="Navigation">Navigation</option>
              <option value="Session">Session</option>
            </select>
          </div>
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
      <DataTable<AuditLog>
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
        emptyMessage="No audit logs recorded for the selected criteria."
      />

      {/* Audit Log Inspect Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Audit Log Entry Details"
          size="xl"
        >
          <div className="space-y-6">
            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Log UUID</span>
                <span className="font-mono text-slate-800 break-all">{selectedLog.audit_log_uuid}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Action</span>
                <Badge variant={getActionBadgeVariant(selectedLog.action)} className="mt-0.5">
                  {selectedLog.action}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Outcome</span>
                <span className={`font-semibold ${selectedLog.outcome === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedLog.outcome}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Actor</span>
                <span className="text-slate-800 font-medium">{selectedLog.actor_email || 'System'}</span>
                {selectedLog.actor_uuid && (
                  <span className="text-[10px] text-slate-400 font-mono block">{selectedLog.actor_uuid}</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Resource Type & ID</span>
                <span className="text-slate-800 font-semibold">{selectedLog.resource_type}</span>
                {selectedLog.affected_resource_uuid && (
                  <span className="text-[10px] text-slate-400 font-mono block">{selectedLog.affected_resource_uuid}</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Timestamp</span>
                <span className="text-slate-800">{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Correlation ID</span>
                <span className="font-mono text-slate-700">{selectedLog.correlation_id}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">IP Address</span>
                <span className="text-slate-700">{selectedLog.ip_address || '—'}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block font-medium">User Agent</span>
                <span className="text-slate-700 truncate block" title={selectedLog.user_agent || ''}>
                  {selectedLog.user_agent || '—'}
                </span>
              </div>
            </div>

            {/* State Diffs (Before vs After) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before State */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Before State</span>
                  <span className="text-[10px] text-slate-400">Previous snapshot</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg text-emerald-400 font-mono text-xs overflow-auto max-h-60">
                  {selectedLog.before_state ? (
                    <pre>{JSON.stringify(selectedLog.before_state, null, 2)}</pre>
                  ) : (
                    <span className="text-slate-500 italic">No prior state recorded (e.g. creation event)</span>
                  )}
                </div>
              </div>

              {/* After State */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>After State</span>
                  <span className="text-[10px] text-slate-400">New snapshot</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg text-emerald-400 font-mono text-xs overflow-auto max-h-60">
                  {selectedLog.after_state ? (
                    <pre>{JSON.stringify(selectedLog.after_state, null, 2)}</pre>
                  ) : (
                    <span className="text-slate-500 italic">No state recorded (e.g. deletion event)</span>
                  )}
                </div>
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
