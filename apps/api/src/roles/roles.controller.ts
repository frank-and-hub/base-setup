import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role as PrismaRole } from '@prisma/client';
import { UserRole } from '@monorepo/shared-types';

@ApiTags('Role & Permission Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'Get overview of roles, user counts, and assigned permissions' })
  async getRoles() {
    return this.rolesService.getRolesSummary();
  }

  @Get('permissions')
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'List all granular system permissions' })
  async getPermissions() {
    return this.rolesService.getAllPermissions();
  }

  @Post(':role/permissions')
  @RequirePermissions('permissions.manage')
  @ApiOperation({ summary: 'Assign granular permissions to a role (Super Admin / Admin)' })
  async updateRolePermissions(
    @Param('role') role: PrismaRole,
    @Body('permissions') permissions: string[],
    @CurrentUser('role') actorRole: UserRole,
    @CurrentUser('user_uuid') actorUuid: string,
  ) {
    return this.rolesService.updateRolePermissions(role, permissions, actorRole, actorUuid);
  }
}

