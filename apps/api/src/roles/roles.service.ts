import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role as PrismaRole } from '@prisma/client';
import { UserRole } from '@monorepo/shared-types';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getRolesSummary() {
    const roles: PrismaRole[] = [
      PrismaRole.SUPER_ADMIN,
      PrismaRole.ADMIN,
      PrismaRole.MODERATOR,
      PrismaRole.USER,
    ];

    const results = await Promise.all(
      roles.map(async (role) => {
        const [userCount, rolePerms] = await Promise.all([
          this.prisma.user.count({ where: { role } }),
          this.prisma.rolePermission.findMany({
            where: { role },
            include: { permission: true },
          }),
        ]);

        return {
          role,
          name: role.replace('_', ' '),
          userCount,
          permissions: rolePerms.map((rp) => rp.permission),
        };
      }),
    );

    return results;
  }

  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    });
  }

  async updateRolePermissions(
    targetRole: PrismaRole,
    permissionCodes: string[],
    actorRole: UserRole,
    actorUuid?: string,
  ) {
    // Privilege Hierarchy: Super Admin role can never have permissions removed or modified
    if (targetRole === PrismaRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin permissions are immutable and complete');
    }

    // Privilege Escalation Prevention: Admin cannot modify Admin/SuperAdmin permissions unless Super Admin
    if (actorRole !== UserRole.SUPER_ADMIN) {
      if (targetRole === PrismaRole.ADMIN) {
        throw new ForbiddenException('Only Super Admins can modify Administrator permissions');
      }
    }

    // Verify all permission codes exist
    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
    });

    if (permissions.length !== permissionCodes.length) {
      throw new BadRequestException('One or more permission codes are invalid');
    }

    // Atomic update of role permissions
    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { role: targetRole },
      });

      for (const p of permissions) {
        await tx.rolePermission.create({
          data: {
            role: targetRole,
            permission_uuid: p.permission_uuid,
          },
        });
      }
    });

    // Write structured audit log
    await this.auditService.logAuditEvent({
      actor_uuid: actorUuid,
      action: 'ROLE_PERMISSIONS_UPDATED',
      resource_type: 'RolePermission',
      affected_resource_uuid: targetRole,
      after_state: { role: targetRole, permissions: permissionCodes },
    });

    return { success: true, role: targetRole, updatedPermissions: permissionCodes };
  }
}

