"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { ShieldCheck, Lock, Edit3, Check, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@monorepo/shared-types";

export default function RolePermissionPage() {
  const { user: currentUser } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [assignedPerms, setAssignedPerms] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setPageError(null);
    try {
      const [rolesData, permsData] = await Promise.all([
        api.get<any[]>("/roles"),
        api.get<any[]>("/roles/permissions"),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (err: any) {
      console.error("Failed to load roles and permissions:", err);
      setPageError(err.message || "Failed to load roles and permissions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEditModal = (roleObj: any) => {
    setSelectedRole(roleObj);
    setAssignedPerms(roleObj.permissions.map((p: any) => p.code));
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleTogglePerm = (code: string) => {
    if (assignedPerms.includes(code)) {
      setAssignedPerms(assignedPerms.filter((p) => p !== code));
    } else {
      setAssignedPerms([...assignedPerms, code]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      await api.post(`/roles/${selectedRole.role}/permissions`, {
        permissions: assignedPerms,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
  const canManagePerms =
    isSuperAdmin ||
    Boolean(
      currentUser?.permissions &&
      currentUser.permissions.includes("permissions.manage"),
    );

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: "Role & Permission Management" }]} />
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Role-Based Access Control (RBAC)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Granular permission matrix and strict administrative privilege
          hierarchy.
        </p>
      </div>

      {pageError && (
        <Alert type="error" title="Error Loading Roles & Permissions">
          <div className="flex items-center justify-between">
            <span>{pageError}</span>
            <Button size="sm" variant="outline" onClick={loadData}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <Alert type="info" title="Strict Privilege Hierarchy Enforced">
        Super Admins possess complete authority across all system modules.
        Administrators and Moderators receive explicitly granted permissions.
        Non-Super Admins are strictly blocked from escalating privileges or
        modifying Super Admin accounts.
      </Alert>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((r) => {
          const isSuper = r.role === "SUPER_ADMIN";
          const isTargetAdmin = r.role === "ADMIN";
          const isBlockedNonSuperOnAdmin = !isSuperAdmin && isTargetAdmin;
          const isEditable =
            !isSuper && canManagePerms && !isBlockedNonSuperOnAdmin;

          let tooltip = "Edit permissions";
          if (isSuper) {
            tooltip = "Super Admin permissions are full and immutable";
          } else if (!canManagePerms) {
            tooltip = "Missing permissions.manage capability";
          } else if (isBlockedNonSuperOnAdmin) {
            tooltip = "Only Super Admins can modify Administrator permissions";
          }

          return (
            <Card key={r.role} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      isSuper ? "indigo" : r.role === "ADMIN" ? "blue" : "slate"
                    }
                  >
                    {r.name}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {r.userCount} Users
                  </span>
                </div>
                <CardTitle className="text-base mt-2">{r.role}</CardTitle>
                <CardDescription>
                  {isSuper
                    ? "Full unrestricted system clearance"
                    : `${r.permissions.length} granular capabilities assigned`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => openEditModal(r)}
                  disabled={!isEditable}
                  title={tooltip}
                >
                  {isSuper ? (
                    <>
                      <Lock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Full Access
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Edit Permissions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Complete System Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            System Permissions Registry ({permissions.length})
          </CardTitle>
          <CardDescription>
            All 12 granular capabilities defined across domain modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase font-semibold">
                  <th className="py-3 px-4">Permission Code</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {permissions.map((p) => (
                  <tr
                    key={p.permission_uuid}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700 dark:text-indigo-400">
                      {p.code}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {p.name}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="slate">{p.category}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {p.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Permissions Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Edit Permissions: ${selectedRole?.name}`}
        description="Select or deselect capabilities for this role."
        maxWidth="lg"
      >
        <div className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
            {permissions.map((p) => {
              const isChecked = assignedPerms.includes(p.code);
              return (
                <div
                  key={p.code}
                  onClick={() => handleTogglePerm(p.code)}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                    isChecked
                      ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Handled by parent div
                    className="mt-0.5 rounded text-indigo-600 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                  <div>
                    <div className="font-semibold text-xs">{p.name}</div>
                    <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      {p.code}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSavePermissions}
              isLoading={isSaving}
            >
              Save Permissions
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
