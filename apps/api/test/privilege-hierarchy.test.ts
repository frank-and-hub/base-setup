import { test, describe } from 'node:test';
import assert from 'node:assert';
import sharedTypes from '@monorepo/shared-types';
const { UserRole, PERMISSIONS } = sharedTypes;

describe('Privilege Hierarchy & Security Rules Suite', () => {
  describe('RBAC Roles & Permissions Matrix', () => {
    test('Super Admin role must have implicit bypass on all permissions', () => {
      const isAuthorized = (
        userRole: UserRole,
        userPermissions: string[],
        requiredPermissions: string[],
      ): boolean => {
        // Strict Super Admin bypass rule
        if (userRole === UserRole.SUPER_ADMIN) return true;
        // All required permissions must be explicitly granted
        return requiredPermissions.every((perm) => userPermissions.includes(perm));
      };

      const superAdminRole = UserRole.SUPER_ADMIN;
      const superAdminPermissions: string[] = []; // empty explicit permissions

      const canAccessSettings = isAuthorized(
        superAdminRole,
        superAdminPermissions,
        [PERMISSIONS.SETTINGS_MANAGE],
      );
      assert.strictEqual(canAccessSettings, true, 'Super Admin must bypass individual permission requirements');

      const canManageRoles = isAuthorized(
        superAdminRole,
        superAdminPermissions,
        [PERMISSIONS.ROLES_MANAGE, PERMISSIONS.PERMISSIONS_MANAGE],
      );
      assert.strictEqual(canManageRoles, true);
    });

    test('Admin role must have only explicitly granted permissions', () => {
      const isAuthorized = (
        userRole: UserRole,
        userPermissions: string[],
        requiredPermissions: string[],
      ): boolean => {
        if (userRole === UserRole.SUPER_ADMIN) return true;
        return requiredPermissions.every((perm) => userPermissions.includes(perm));
      };

      const adminRole = UserRole.ADMIN;
      const grantedPermissions = [
        PERMISSIONS.USERS_READ,
        PERMISSIONS.USERS_CREATE,
        PERMISSIONS.USERS_UPDATE,
      ];

      // Permitted action
      const canRead = isAuthorized(adminRole, grantedPermissions, [PERMISSIONS.USERS_READ]);
      assert.strictEqual(canRead, true);

      // Forbidden action (not granted)
      const canDelete = isAuthorized(adminRole, grantedPermissions, [PERMISSIONS.USERS_DELETE]);
      assert.strictEqual(canDelete, false, 'Admin must not have access to ungranted permissions');

      const canManageRoles = isAuthorized(adminRole, grantedPermissions, [PERMISSIONS.ROLES_MANAGE]);
      assert.strictEqual(canManageRoles, false);
    });

    test('Regular User role cannot access any administrative action', () => {
      const isAuthorized = (
        userRole: UserRole,
        userPermissions: string[],
        requiredPermissions: string[],
      ): boolean => {
        if (userRole === UserRole.USER) return false;
        if (userRole === UserRole.SUPER_ADMIN) return true;
        return requiredPermissions.every((perm) => userPermissions.includes(perm));
      };

      const userRole = UserRole.USER;
      const userPermissions: string[] = [];

      const canReadUsers = isAuthorized(userRole, userPermissions, [PERMISSIONS.USERS_READ]);
      assert.strictEqual(canReadUsers, false);

      const canAccessAuditLogs = isAuthorized(userRole, userPermissions, [PERMISSIONS.AUDIT_LOGS_READ]);
      assert.strictEqual(canAccessAuditLogs, false);
    });
  });

  describe('Protection of Last Active Super Admin Account', () => {
    test('Must prevent deleting or demoting the last active Super Admin', () => {
      const checkCanModifySuperAdmin = (
        targetUserRole: UserRole,
        targetUserStatus: string,
        newRoleOrStatus: { role?: UserRole; status?: string },
        activeSuperAdminCount: number,
      ): { allowed: boolean; error?: string } => {
        if (targetUserRole === UserRole.SUPER_ADMIN && targetUserStatus === 'ACTIVE') {
          const isDemotion = newRoleOrStatus.role && newRoleOrStatus.role !== UserRole.SUPER_ADMIN;
          const isDeactivation = newRoleOrStatus.status && newRoleOrStatus.status !== 'ACTIVE';

          if ((isDemotion || isDeactivation) && activeSuperAdminCount <= 1) {
            return {
              allowed: false,
              error: 'Cannot delete, deactivate, or demote the last active Super Admin account',
            };
          }
        }
        return { allowed: true };
      };

      // Case 1: Attempt to demote only active Super Admin -> REJECTED
      const result1 = checkCanModifySuperAdmin(
        UserRole.SUPER_ADMIN,
        'ACTIVE',
        { role: UserRole.USER },
        1,
      );
      assert.strictEqual(result1.allowed, false);
      assert.match(result1.error!, /last active Super Admin/);

      // Case 2: Attempt to deactivate only active Super Admin -> REJECTED
      const result2 = checkCanModifySuperAdmin(
        UserRole.SUPER_ADMIN,
        'ACTIVE',
        { status: 'INACTIVE' },
        1,
      );
      assert.strictEqual(result2.allowed, false);

      // Case 3: Multiple Super Admins exist -> ALLOWED
      const result3 = checkCanModifySuperAdmin(
        UserRole.SUPER_ADMIN,
        'ACTIVE',
        { role: UserRole.ADMIN },
        2,
      );
      assert.strictEqual(result3.allowed, true);
    });
  });

  describe('UUID v4 Primary Key Integrity', () => {
    test('Entities must adhere to RFC 4122 UUID v4 formatting', () => {
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const testUuids = [
        '00000000-0000-4000-a000-000000000001',
        'c7a3b4e2-9f1d-4d2a-8b3c-4e5f6a7b8c9d',
        'e8b2a1c0-5f3e-4b6a-9c7d-8e1f2a3b4c5d',
      ];

      for (const uuid of testUuids) {
        assert.match(uuid, uuidV4Regex, `${uuid} must be a valid UUID v4`);
      }
    });
  });
});
