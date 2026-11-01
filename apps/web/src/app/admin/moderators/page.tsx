'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { User, UserRole, UserStatus, PaginatedResult } from '@monorepo/shared-types';
import { formatDate } from '@monorepo/shared-utils';
import { DataTable } from '@/components/data-table/DataTable';
import { ColumnDef } from '@/components/data-table/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { UserCheck, Shield, RefreshCw, UserMinus, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ModeratorManagementPage() {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<User[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Promote Modal
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [candidateEmail, setCandidateEmail] = useState('');
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);

  const fetchModerators = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        role: UserRole.MODERATOR,
      });
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get<PaginatedResult<User>>(`/users?${params.toString()}`);
      setData(res.data);
      setTotalItems(res.meta.totalItems);
    } catch (err: any) {
      console.error('Failed to load moderators:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchModerators();
  }, [fetchModerators]);

  const handleDemote = async (userUuid: string) => {
    if (!confirm('Are you sure you want to revoke moderator status for this user?')) return;
    try {
      await api.patch(`/users/${userUuid}`, { role: UserRole.USER });
      fetchModerators();
    } catch (err: any) {
      alert(err.message || 'Failed to demote moderator');
    }
  };

  const handlePromoteCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPromoting(true);
    setPromoteError(null);

    try {
      // Find candidate by email
      const searchRes = await api.get<PaginatedResult<User>>(`/users?search=${candidateEmail.trim()}`);
      const candidate = searchRes.data.find((u) => u.email.toLowerCase() === candidateEmail.trim().toLowerCase());
      if (!candidate) {
        throw new Error('User with this email not found');
      }

      await api.patch(`/users/${candidate.user_uuid}`, { role: UserRole.MODERATOR });
      setIsPromoteModalOpen(false);
      setCandidateEmail('');
      fetchModerators();
    } catch (err: any) {
      setPromoteError(err.message || 'Failed to promote user');
    } finally {
      setIsPromoting(false);
    }
  };

  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

  const columns: ColumnDef<User>[] = [
    {
      id: 'name',
      header: 'Moderator',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
            {row.first_name?.[0]}
            {row.last_name?.[0]}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{row.first_name} {row.last_name}</div>
            <div className="text-[11px] text-slate-500 font-mono">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Account Status',
      cell: (row) => <Badge variant={row.status === 'ACTIVE' ? 'emerald' : 'amber'}>{row.status}</Badge>,
    },
    {
      id: 'created_at',
      header: 'Appointed Date',
      cell: (row) => <span className="text-[11px] text-slate-500">{formatDate(row.created_at)}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          {isSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDemote(row.user_uuid)}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
            >
              <UserMinus className="w-3.5 h-3.5 mr-1" />
              Demote to User
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={[{ label: 'Moderator Management' }]} />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Moderator Supervision</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervise staff with designated user moderation and audit inspection clearance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={fetchModerators}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsPromoteModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Appoint Moderator
          </Button>
        </div>
      </div>

      <Alert type="info" title="Delegated Moderation Clearance">
        Moderators have visibility into user records, can view individual user activity logs, and can edit
        permitted user profile statuses, but are restricted from managing roles, deleting users, or modifying system configurations.
      </Alert>

      <DataTable<User>
        data={data}
        columns={columns}
        totalItems={totalItems}
        page={page}
        limit={limit}
        totalPages={Math.ceil(totalItems / limit) || 1}
        isLoading={isLoading}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSortChange={() => {}}
        onSearchChange={setSearch}
        searchValue={search}
        searchPlaceholder="Search moderators..."
        getRowId={(r) => r.user_uuid}
      />

      {/* Appoint Moderator Modal */}
      <Modal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        title="Appoint New Moderator"
        description="Enter the registered email of an existing user to elevate them to Moderator."
        maxWidth="sm"
      >
        <form onSubmit={handlePromoteCandidate} className="space-y-4">
          {promoteError && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {promoteError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              User Email Address
            </label>
            <input
              type="email"
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPromoteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isPromoting}>
              Appoint Moderator
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

