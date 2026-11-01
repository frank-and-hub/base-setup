import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma, Role as PrismaRole } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto, User, PaginatedResult, UserRole, UserStatus } from '@monorepo/shared-types';
import { parsePaginationParams, buildPaginatedResult } from '@monorepo/shared-utils';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly activityService: ActivityService,
  ) {}

  async findAll(query: UserQueryDto): Promise<PaginatedResult<User>> {
    const { page, limit, skip, search, sortOrder } = parsePaginationParams(query);
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { phone_number: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.role) where.role = query.role as PrismaRole;
    if (query.status) where.status = query.status as any;

    if (query.startDate || query.endDate) {
      where.created_at = {};
      if (query.startDate) where.created_at.gte = new Date(query.startDate);
      if (query.endDate) where.created_at.lte = new Date(query.endDate);
    }

    const sortField = query.sortBy || 'created_at';
    const orderBy: Prisma.UserOrderByWithRelationInput = { [sortField]: sortOrder };

    const [totalItems, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          user_uuid: true,
          email: true,
          first_name: true,
          last_name: true,
          phone_number: true,
          address: true,
          profile_picture_url: true,
          role: true,
          status: true,
          last_login_at: true,
          failed_login_attempts: true,
          created_at: true,
          updated_at: true,
        },
      }),
    ]);

    const mapped: User[] = users.map((u) => ({
      ...u,
      role: u.role as UserRole,
      status: u.status as UserStatus,
    }));

    return buildPaginatedResult(mapped, totalItems, page, limit);
  }

  async findById(userUuid: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { user_uuid: userUuid },
      select: {
        user_uuid: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        address: true,
        profile_picture_url: true,
        role: true,
        status: true,
        last_login_at: true,
        failed_login_attempts: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userUuid} not found`);
    }

    return {
      ...user,
      role: user.role as UserRole,
      status: user.status as UserStatus,
    };
  }

  async create(dto: CreateUserDto, actorUuid?: string, actorRole?: UserRole): Promise<User> {
    // Privilege Escalation Prevention (Requirement 9.5)
    if (dto.role === UserRole.SUPER_ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only a Super Admin can create another Super Admin');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordToHash = dto.password || 'TemporaryPassword123!';
    const passwordHash = await bcrypt.hash(passwordToHash, 10);

    const created = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password_hash: passwordHash,
        first_name: dto.first_name,
        last_name: dto.last_name,
        phone_number: dto.phone_number || null,
        address: dto.address || null,
        role: (dto.role as PrismaRole) || PrismaRole.USER,
        status: (dto.status as any) || 'ACTIVE',
      },
      select: {
        user_uuid: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        address: true,
        profile_picture_url: true,
        role: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Record Structured Audit Log
    await this.auditService.logAuditEvent({
      actor_uuid: actorUuid,
      action: 'USER_CREATED',
      resource_type: 'User',
      affected_resource_uuid: created.user_uuid,
      after_state: { email: created.email, role: created.role, status: created.status },
    });

    // Record User Activity Log
    await this.activityService.logActivity({
      user_uuid: created.user_uuid,
      actor_uuid: actorUuid,
      action: 'ADMIN_USER_CREATED',
      metadata: { role: created.role },
    });

    return {
      ...created,
      role: created.role as UserRole,
      status: created.status as UserStatus,
    };
  }

  async update(
    userUuid: string,
    dto: UpdateUserDto,
    actorUuid?: string,
    actorRole?: UserRole,
  ): Promise<User> {
    const existing = await this.findById(userUuid);

    // Privilege Escalation Check: Non-SuperAdmins cannot modify a Super Admin
    if (existing.role === UserRole.SUPER_ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only a Super Admin can modify a Super Admin profile or role');
    }

    if (dto.role === UserRole.SUPER_ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only a Super Admin can promote a user to Super Admin');
    }

    // Protect Last Active Super Admin (Requirement 9.5)
    if (existing.role === UserRole.SUPER_ADMIN && dto.role && dto.role !== UserRole.SUPER_ADMIN) {
      const activeSuperAdminCount = await this.prisma.user.count({
        where: { role: PrismaRole.SUPER_ADMIN, status: 'ACTIVE' },
      });
      if (activeSuperAdminCount <= 1) {
        throw new BadRequestException('Cannot demote the last active Super Admin account');
      }
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.email && dto.email.toLowerCase() !== existing.email) {
      const emailLower = dto.email.toLowerCase();
      const duplicate = await this.prisma.user.findUnique({ where: { email: emailLower } });
      if (duplicate && duplicate.user_uuid !== userUuid) {
        throw new ConflictException('Email already in use by another account');
      }
      data.email = emailLower;
    }

    if (dto.first_name) data.first_name = dto.first_name;
    if (dto.last_name) data.last_name = dto.last_name;
    if (dto.phone_number !== undefined) data.phone_number = dto.phone_number;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.profile_picture_url !== undefined) data.profile_picture_url = dto.profile_picture_url;
    if (dto.role) data.role = dto.role as PrismaRole;
    if (dto.status) data.status = dto.status as any;
    if (dto.password && dto.password.length >= 8) {
      data.password_hash = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { user_uuid: userUuid },
      data,
      select: {
        user_uuid: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        address: true,
        profile_picture_url: true,
        role: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Audit and Activity Logs
    await this.auditService.logAuditEvent({
      actor_uuid: actorUuid,
      action: 'USER_UPDATED',
      resource_type: 'User',
      affected_resource_uuid: userUuid,
      before_state: { role: existing.role, status: existing.status },
      after_state: { role: updated.role, status: updated.status },
    });

    await this.activityService.logActivity({
      user_uuid: userUuid,
      actor_uuid: actorUuid,
      action: 'PROFILE_UPDATED',
      metadata: { modified_fields: Object.keys(data) },
    });

    return {
      ...updated,
      role: updated.role as UserRole,
      status: updated.status as UserStatus,
    };
  }

  async remove(userUuid: string, actorUuid?: string, actorRole?: UserRole) {
    const existing = await this.findById(userUuid);

    // Protect Last Active Super Admin (Requirement 9.5)
    if (existing.role === UserRole.SUPER_ADMIN) {
      const activeSuperAdminCount = await this.prisma.user.count({
        where: { role: PrismaRole.SUPER_ADMIN, status: 'ACTIVE' },
      });
      if (activeSuperAdminCount <= 1) {
        throw new BadRequestException('Cannot delete the last active Super Admin account');
      }
    }

    if (existing.role === UserRole.SUPER_ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only a Super Admin can delete a Super Admin account');
    }

    if (userUuid === actorUuid) {
      throw new BadRequestException('You cannot delete your own account from the admin panel');
    }

    await this.prisma.user.delete({
      where: { user_uuid: userUuid },
    });

    await this.auditService.logAuditEvent({
      actor_uuid: actorUuid,
      action: 'USER_DELETED',
      resource_type: 'User',
      affected_resource_uuid: userUuid,
      before_state: { email: existing.email, role: existing.role },
    });

    await this.activityService.logActivity({
      user_uuid: null,
      actor_uuid: actorUuid,
      action: 'ADMIN_USER_DELETED',
      metadata: { deleted_user_uuid: userUuid, email: existing.email },
    });

    return { success: true, user_uuid: userUuid };
  }

  // Dashboard Overview Metrics (Requirement 9.2)
  async getDashboardMetrics() {
    const [totalUsers, activeUsers, inactiveUsers, suspendedUsers, rolesDistribution] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { status: 'ACTIVE' } }),
        this.prisma.user.count({ where: { status: 'INACTIVE' } }),
        this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
        this.prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
      ]);

    // Registrations in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRegistrations = await this.prisma.user.count({
      where: { created_at: { gte: sevenDaysAgo } },
    });

    const recentActivity = await this.prisma.userActivityLog.findMany({
      take: 6,
      orderBy: { timestamp: 'desc' },
      include: {
        actor_user: {
          select: { first_name: true, last_name: true, email: true },
        },
      },
    });

    const recentAudit = await this.prisma.auditLog.findMany({
      take: 6,
      orderBy: { timestamp: 'desc' },
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        suspended: suspendedUsers,
        recentRegistrations,
      },
      roles: rolesDistribution.map((r) => ({ role: r.role, count: r._count.role })),
      recentActivity,
      recentAudit,
    };
  }
}
