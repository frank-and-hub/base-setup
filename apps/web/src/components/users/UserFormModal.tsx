'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus, CreateUserDto, UpdateUserDto } from '@monorepo/shared-types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserDto | UpdateUserDto) => Promise<void>;
  user?: User | null;
  isLoading?: boolean;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  isLoading = false,
}) => {
  const isEditing = !!user;

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        password: '',
        role: user.role,
        status: user.status,
      });
    } else {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.email || !formData.email.includes('@')) {
      errs.email = 'Valid email is required';
    }
    if (!formData.firstName.trim()) {
      errs.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errs.lastName = 'Last name is required';
    }
    if (!isEditing && (!formData.password || formData.password.length < 8)) {
      errs.password = 'Password must be at least 8 characters long';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: any = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
      status: formData.status,
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Operation failed' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit User Details' : 'Create New User'}
      description={
        isEditing
          ? 'Update the permissions, status, or identity for this user.'
          : 'Add a new member to PostgreSQL database with assigned RBAC role.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
            {errors.form}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="John"
            error={errors.firstName}
            required
          />
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Doe"
            error={errors.lastName}
            required
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="john.doe@example.com"
          error={errors.email}
          required
        />

        <Input
          label={isEditing ? 'New Password (optional)' : 'Password'}
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder={isEditing ? 'Leave blank to preserve existing password' : 'Min 8 characters'}
          error={errors.password}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Role (RBAC)"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            options={[
              { label: 'Standard User (USER)', value: UserRole.USER },
              { label: 'Moderator (MODERATOR)', value: UserRole.MODERATOR },
              { label: 'Administrator (ADMIN)', value: UserRole.ADMIN },
            ]}
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
            options={[
              { label: 'Active', value: UserStatus.ACTIVE },
              { label: 'Inactive', value: UserStatus.INACTIVE },
              { label: 'Suspended', value: UserStatus.SUSPENDED },
            ]}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

