'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, UserStatus, PaginatedResult } from '@monorepo/shared-types';
import { formatDate } from '@monorepo/shared-utils';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { DataTable } from '@/components/data-table/DataTable';
import { ColumnDef } from '@/components/data-table/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { UserFormModal } from '@/components/users/UserFormModal';
import { DeleteUserModal } from '@/components/users/DeleteUserModal';
import { Plus, RefreshCw, Trash2, Edit2, ShieldAlert } from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  // Query & Pagination state
  const [data, setData] = useState<User[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });

    if (search.trim()) params.append('search', search.trim());
    if (selectedRole !== 'ALL') params.append('role', selectedRole);
    if (selectedStatus !== 'ALL') params.append('status', selectedStatus);

    try {
      const res = await api.get<PaginatedResult<User>>(`/users?${params.toString()}`);
      setData(res.data);
      setTotalItems(res.meta.totalItems);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, selectedRole, selectedStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Create / Edit submission
  const handleFormSubmit = async (payload: any) => {
    setIsActionLoading(true);
    try {
      if (activeUser) {
        await api.patch(`/users/${activeUser.id}`, payload);
      } else {
        await api.post('/users', payload);
      }
      fetchUsers();
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!activeUser) return;
    setIsActionLoading(true);
    try {
      await api.delete(`/users/${activeUser.id}`);
      setIsDeleteModalOpen(false);
      setActiveUser(null);
      setSelectedIds((prev) => prev.filter((id) => id !== activeUser.id));
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setIsActionLoading(false);
    }
  };

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isModeratorOrAdmin = isAdmin || currentUser?.role === UserRole.MODERATOR;

  // Table Columns Definition
  const columns: ColumnDef<User>[] = [
    {
      id: 'name',
      header: 'User',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
            {row.firstName?.[0]}
            {row.lastName?.[0]}
          </div>
          <div>
            <div className="font-semibold text-slate-900">
              {row.firstName} {row.lastName}
            </div>
            <div className="text-xs text-slate-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role (RBAC)',
      sortable: true,
      cell: (row) => {
        const variant =
          row.role === UserRole.ADMIN ? 'indigo' : row.role === UserRole.MODERATOR ? 'amber' : 'slate';
        return <Badge variant={variant}>{row.role}</Badge>;
      },
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => {
        const variant =
          row.status === UserStatus.ACTIVE
            ? 'emerald'
            : row.status === UserStatus.INACTIVE
            ? 'amber'
            : 'rose';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      id: 'createdAt',
      header: 'Created At',
      sortable: true,
      cell: (row) => <span className="text-xs text-slate-500">{formatDate(row.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {isModeratorOrAdmin && (
            <button
              onClick={() => {
                setActiveUser(row);
                setIsFormModalOpen(true);
              }}
              title="Edit User"
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                setActiveUser(row);
                setIsDeleteModalOpen(true);
              }}
              disabled={row.id === currentUser?.id}
              title={row.id === currentUser?.id ? 'Cannot delete yourself' : 'Delete User'}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            PostgreSQL relational data with server-side pagination, search, sorting, and RBAC actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => fetchUsers()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActiveUser(null);
                setIsFormModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* Reusable Data Table Component */}
      <DataTable<User>
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
        }}
        onSearchChange={(query) => {
          setSearch(query);
          setPage(1);
        }}
        searchValue={search}
        searchPlaceholder="Search by name or email..."
        selectable={isAdmin}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRetry={fetchUsers}
        emptyMessage="No users match your criteria"
        filterComponent={
          <div className="flex items-center gap-2">
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MODERATOR">Moderator</option>
              <option value="USER">User</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        }
      />

      {/* Create / Edit User Modal */}
      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        user={activeUser}
        isLoading={isActionLoading}
      />

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        user={activeUser}
        isLoading={isActionLoading}
      />
    </div>
  );
}

