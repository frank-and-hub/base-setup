'use client';

import React from 'react';
import { User } from '@monorepo/shared-types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertTriangle } from 'lucide-react';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  user: User | null;
  isLoading?: boolean;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  isLoading = false,
}) => {
  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Delete User"
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
          <div>
            This action cannot be undone. All active sessions and refresh tokens for{' '}
            <span className="font-semibold">{user.firstName} {user.lastName}</span> (
            {user.email}) will be permanently deleted.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} isLoading={isLoading}>
            Delete User
          </Button>
        </div>
      </div>
    </Modal>
  );
};

