import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../database/prisma.service';
import { UserRole } from '@monorepo/shared-types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User context missing');
    }

    // Super Admin has unrestricted access to all endpoints
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Regular users have no admin permissions
    if (user.role === UserRole.USER) {
      throw new ForbiddenException('Standard users cannot perform administrative actions');
    }

    // Query active permissions for role
    let permissions: string[] = user.permissions;
    if (!permissions || !Array.isArray(permissions)) {
      const rolePerms = await this.prisma.rolePermission.findMany({
        where: { role: user.role },
        include: { permission: true },
      });
      permissions = rolePerms.map((rp) => rp.permission.code);
    }

    const hasAllRequired = requiredPermissions.every((perm) => permissions.includes(perm));
    if (!hasAllRequired) {
      const missing = requiredPermissions.filter((p) => !permissions.includes(p));
      throw new ForbiddenException(`Insufficient permissions: missing ${missing.join(', ')}`);
    }

    return true;
  }
}

