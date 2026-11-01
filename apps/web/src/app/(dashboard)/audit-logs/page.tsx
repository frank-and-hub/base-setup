'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@monorepo/shared-utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RefreshCw, FileText, Database, ShieldAlert } from 'lucide-react';

interface AuditLog {
  _id: string;
  action: string;
  userId?: string;
  userEmail?: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<AuditLog[]>('/audit-logs?limit=50');
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Security & Audit Logs</h1>
            <Badge variant="emerald">MongoDB Document Store</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time append-only telemetry capturing authentication, token rotation, and user mutations.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Log Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Latest Document Records ({logs.length})
          </span>
          <span className="text-xs text-slate-400">Indexed by timestamp (descending)</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading MongoDB audit documents...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm">No audit entries recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const actionVariant = log.action.includes('CREATED')
                ? 'emerald'
                : log.action.includes('DELETED')
                ? 'rose'
                : log.action.includes('LOGIN')
                ? 'indigo'
                : 'amber';

              return (
                <div key={log._id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <Badge variant={actionVariant}>{log.action}</Badge>
                      <span className="text-xs font-medium text-slate-700">
                        Resource: <span className="text-slate-900 font-semibold">{log.resource}</span>
                      </span>
                      {log.resourceId && (
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {log.resourceId.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(log.timestamp)}</span>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap gap-4 mt-2">
                    {log.userEmail && (
                      <div>
                        User: <span className="font-semibold text-slate-900">{log.userEmail}</span>
                      </div>
                    )}
                    {log.ipAddress && (
                      <div>
                        IP: <span className="font-mono text-slate-800">{log.ipAddress}</span>
                      </div>
                    )}
                  </div>

                  {log.details && Object.keys(log.details).length > 0 && (
                    <pre className="mt-3 p-2.5 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

