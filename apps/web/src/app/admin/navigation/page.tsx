'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { MenuItem, UserRole } from '@monorepo/shared-types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import {
  Menu,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  CornerDownRight,
  ShieldAlert,
} from 'lucide-react';

export default function NavigationManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    icon: 'Menu',
    route: '',
    parent_uuid: '',
    display_order: 0,
    required_permission: '',
    allowed_roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR],
    is_active: true,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<MenuItem[]>('/navigation/items');
      setItems(data);
    } catch (err: any) {
      console.error('Failed to load navigation items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      label: '',
      icon: 'Menu',
      route: '',
      parent_uuid: '',
      display_order: items.length + 1,
      required_permission: '',
      allowed_roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR],
      is_active: true,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      icon: item.icon,
      route: item.route,
      parent_uuid: item.parent_uuid || '',
      display_order: item.display_order,
      required_permission: item.required_permission || '',
      allowed_roles: item.allowed_roles,
      is_active: item.is_active,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    const payload: any = {
      label: formData.label,
      icon: formData.icon,
      route: formData.route,
      parent_uuid: formData.parent_uuid ? formData.parent_uuid : null,
      display_order: Number(formData.display_order),
      required_permission: formData.required_permission.trim() || null,
      allowed_roles: formData.allowed_roles,
      is_active: formData.is_active,
    };

    try {
      if (editingItem) {
        await api.patch(`/navigation/items/${editingItem.menu_uuid}`, payload);
      } else {
        await api.post('/navigation/items', payload);
      }
      setIsModalOpen(false);
      loadItems();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save navigation item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (menuUuid: string) => {
    if (!confirm('Are you sure you want to delete this menu item? Any child items will also be removed.')) return;
    try {
      await api.delete(`/navigation/items/${menuUuid}`);
      loadItems();
    } catch (err: any) {
      alert(err.message || 'Failed to delete menu item');
    }
  };

  const parentOptions = [
    { label: 'None (Root Navigation Item)', value: '' },
    ...items
      .filter((i) => !editingItem || i.menu_uuid !== editingItem.menu_uuid)
      .map((i) => ({ label: `${i.label} (${i.route})`, value: i.menu_uuid })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={[{ label: 'Navigation & Sidebar Management' }]} />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Database-Driven Dynamic Navigation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dynamic sidebar items, parent-child hierarchies, and role/permission visibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={loadItems}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Menu Item
          </Button>
        </div>
      </div>

      <Alert type="warning" title="Security Principle: Navigation is NOT Authorization">
        Hiding a menu item from the sidebar only modifies frontend presentation. Every protected API endpoint
        strictly checks roles and granular permissions independently on the NestJS backend.
      </Alert>

      {/* Navigation Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Menu className="w-5 h-5 text-indigo-600" />
            Configured Navigation Items ({items.length})
          </CardTitle>
          <CardDescription>
            Stored in PostgreSQL `menu_items` table with parent_uuid references
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Menu Label</th>
                  <th className="py-3 px-4">Icon</th>
                  <th className="py-3 px-4">Target Route</th>
                  <th className="py-3 px-4">Required Permission</th>
                  <th className="py-3 px-4">Allowed Roles</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const isChild = !!item.parent_uuid;
                  return (
                    <tr key={item.menu_uuid} className={`hover:bg-slate-50/50 ${isChild ? 'bg-slate-50/20' : ''}`}>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                        {item.display_order}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {isChild && <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />}
                          <span className={`font-semibold ${isChild ? 'text-slate-700' : 'text-slate-900'}`}>
                            {item.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{item.icon}</td>
                      <td className="py-3 px-4 font-mono text-indigo-600">{item.route}</td>
                      <td className="py-3 px-4">
                        {item.required_permission ? (
                          <Badge variant="indigo">{item.required_permission}</Badge>
                        ) : (
                          <span className="text-slate-400">None (Public to allowed roles)</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.allowed_roles.map((r) => (
                            <Badge key={r} variant="slate">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {item.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <XCircle className="w-3.5 h-3.5" /> Disabled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            title="Edit Item"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.menu_uuid)}
                            title="Delete Item"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Menu Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Navigation Item' : 'Create Navigation Item'}
        description="Configure sidebar display properties and permission visibility."
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Menu Label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g. Audit Logs"
              required
            />
            <Input
              label="Lucide Icon Name"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="e.g. ScrollText"
              required
            />
          </div>

          <Input
            label="Route Path"
            value={formData.route}
            onChange={(e) => setFormData({ ...formData, route: e.target.value })}
            placeholder="e.g. /admin/audit-logs"
            required
          />

          <Select
            label="Parent Navigation Item (Hierarchy)"
            value={formData.parent_uuid}
            onChange={(e) => setFormData({ ...formData, parent_uuid: e.target.value })}
            options={parentOptions}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Display Order (Sort weight)"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
              required
            />
            <Input
              label="Required Permission (Optional)"
              value={formData.required_permission}
              onChange={(e) => setFormData({ ...formData, required_permission: e.target.value })}
              placeholder="e.g. audit_logs.read"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded text-indigo-600 border-slate-300"
            />
            <label htmlFor="isActiveCheck" className="text-xs font-medium text-slate-700">
              Active (Visible in sidebar to authorized users)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              {editingItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

