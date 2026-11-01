'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserActivityLog, PaginatedResult } from '@monorepo/shared-types';
import { api } from '@/lib/api';
import { DataTable } from '@/components/data-table/DataTable';
import { ColumnDef } from '@/components/data-table/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Modal } from '@/components/ui/Modal';
import {
  Activity,
  RefreshCw,
  Search,
  Eye,
  Copy,
  Check,
  AlertTriangle,
  Filter,
} from 'lucide-react';

interface ExtendedActivityLog extends UserActivityLog {
  target_user?: {
    user_uuid: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  actor_user?: {
    user_uuid: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
}

export default function ActivityLogsPage() {
  const [data, setData] = useState<ExtendedActivityLog[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<ExtendedActivityLog | null>(null);
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
    if (selectedAction !== 'ALL') params.append('action', selectedAction);

    try {
      const res = await api.get<PaginatedResult<ExtendedActivityLog>>(`/activity-logs?${params.toString()}`);
      setData(res.data);
      setTotalItems(res.meta.totalItems);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user activity logs');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, selectedAction]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionBadgeVariant = (action: string): 'default' | 'success' | 'warning' | 'danger' | 'indigo' => {
    if (action.includes('LOGIN')) return 'indigo';
    if (action.includes('LOGOUT')) return 'default';
    if (action.includes('REGISTER') || action.includes('CREATED')) return 'success';
    if (action.includes('DELETE') || action.includes('REVOKE')) return 'danger';
    if (action.includes('PASSWORD') || action.includes('SECURITY')) return 'warning';
    return 'default';
  };

  const columns: ColumnDef<ExtendedActivityLog>[] = [
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
      id: 'target_user',
      header: 'Target User',
      cell: (log) => {
        if (log.target_user) {
          return (
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-900">
                {log.target_user.first_name} {log.target_user.last_name}
              </span>
              <span className="text-[11px] text-slate-500">{log.target_user.email}</span>
            </div>
          );
        }
        return (
          <span className="text-xs font-mono text-slate-400">
            {log.user_uuid ? `${log.user_uuid.slice(0, 8)}...` : '—'}
          </span>
        );
      },
    },
    {
      id: 'actor',
      header: 'Actor',
      cell: (log) => {
        if (log.actor_user) {
          return (
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-900">
                {log.actor_user.first_name} {log.actor_user.last_name}
              </span>
              <span className="text-[11px] text-slate-500">{log.actor_user.email}</span>
            </div>
          );
        }
        return (
          <span className="text-xs text-slate-500">
            {log.actor_uuid ? `${log.actor_uuid.slice(0, 8)}...` : 'Self / System'}
          </span>
        );
      },
    },
    {
      id: 'ip_address',
      header: 'IP Address',
      accessorKey: 'ip_address',
      cell: (log) => (
        <span className="text-xs font-mono text-slate-600">
          {log.ip_address || '127.0.0.1'}
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
              copyToClipboard(log.correlation_id, log.activity_log_uuid);
            }}
            className="p-1 hover:text-slate-900 text-slate-400 rounded transition-colors"
            title="Copy correlation ID"
          >
            {copiedId === log.activity_log_uuid ? (
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
            { label: 'User Activity Logs' },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-600" />
              User Activity Logs
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              End-to-end trail of authenticated user actions, session security events, and administrative interventions.
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
            placeholder="Search action or correlation ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">Action:</span>
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setPage(1);
            }}
            className="text-xs rounded-lg border border-slate-200 px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Actions</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="USER_LOGOUT">USER_LOGOUT</option>
            <option value="USER_REGISTERED">USER_REGISTERED</option>
            <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
            <option value="USER_UPDATED">USER_UPDATED</option>
            <option value="ROLE_UPDATED">ROLE_UPDATED</option>
            <option value="STATUS_CHANGED">STATUS_CHANGED</option>
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
      <DataTable<ExtendedActivityLog>
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
        emptyMessage="No activity logs recorded matching criteria."
      />

      {/* Activity Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="User Activity Details"
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Activity UUID</span>
                <span className="font-mono text-slate-800 break-all">{selectedLog.activity_log_uuid}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Action</span>
                <Badge variant={getActionBadgeVariant(selectedLog.action)} className="mt-0.5">
                  {selectedLog.action}
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Target User</span>
                <span className="text-slate-800 font-medium">
                  {selectedLog.target_user
                    ? `${selectedLog.target_user.first_name} ${selectedLog.target_user.last_name} (${selectedLog.target_user.email})`
                    : selectedLog.user_uuid || 'None'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Actor</span>
                <span className="text-slate-800 font-medium">
                  {selectedLog.actor_user
                    ? `${selectedLog.actor_user.first_name} ${selectedLog.actor_user.last_name} (${selectedLog.actor_user.email})`
                    : selectedLog.actor_uuid || 'Self / System'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Correlation ID</span>
                <span className="font-mono text-slate-700">{selectedLog.correlation_id}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">IP Address</span>
                <span className="text-slate-700">{selectedLog.ip_address || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block font-medium">User Agent</span>
                <span className="text-slate-700 break-all">{selectedLog.user_agent || '—'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block font-medium">Timestamp</span>
                <span className="text-slate-800">{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
            </div>

            {/* Contextual Metadata JSON */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Contextual Metadata</span>
                <span className="text-[10px] text-slate-400">Sanitized (No secrets)</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg text-indigo-300 font-mono text-xs overflow-auto max-h-60">
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 ? (
                  <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                ) : (
                  <span className="text-slate-500 italic">No additional metadata recorded.</span>
                )}
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
