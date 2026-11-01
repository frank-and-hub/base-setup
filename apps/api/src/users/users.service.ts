import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { parsePaginationParams, buildPaginatedResult } from '@monorepo/shared-utils';
import { User, PaginatedResult, AuditAction, UserRole, UserStatus } from '@monorepo/shared-types';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: QueryUserDto): Promise<PaginatedResult<User>> {
    const { page, limit, skip, search, sortBy, sortOrder } = parsePaginationParams(query);

    // Build Prisma filtering conditions
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.status) {
      where.status = query.status;
    }

    // Build ordering
    const validSortFields = ['email', 'firstName', 'lastName', 'role', 'status', 'createdAt', 'updatedAt'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderBy = { [orderField]: sortOrder };

    const [totalItems, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const mappedUsers: User[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role as UserRole,
      status: u.status as UserStatus,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return buildPaginatedResult(mappedUsers, totalItems, page, limit);
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      ...user,
      role: user.role as UserRole,
      status: user.status as UserStatus,
    };
  }

  async create(dto: CreateUserDto, actorId?: string): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordToHash = dto.password || 'TemporaryPassword123!';
    const passwordHash = await bcrypt.hash(passwordToHash, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || 'USER',
        status: dto.status || 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Write audit log to MongoDB
    await this.auditService.logEvent({
      action: AuditAction.USER_CREATED,
      userId: actorId,
      resource: 'User',
      resourceId: user.id,
      details: { email: user.email, role: user.role, status: user.status },
      timestamp: new Date(),
    });

    return {
      ...user,
      role: user.role as UserRole,
      status: user.status as UserStatus,
    };
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string): Promise<User> {
    await this.findById(id);

    const data: Prisma.UserUpdateInput = {};

    if (dto.email) {
      const emailLower = dto.email.toLowerCase();
      const existing = await this.prisma.user.findUnique({
        where: { email: emailLower },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('This email is already in use by another account');
      }
      data.email = emailLower;
    }

    if (dto.firstName) data.firstName = dto.firstName;
    if (dto.lastName) data.lastName = dto.lastName;
    if (dto.role) data.role = dto.role;
    if (dto.status) data.status = dto.status;
    if (dto.password && dto.password.length >= 8) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Write audit log to MongoDB
    await this.auditService.logEvent({
      action: AuditAction.USER_UPDATED,
      userId: actorId,
      resource: 'User',
      resourceId: updated.id,
      details: { modifiedFields: Object.keys(data) },
      timestamp: new Date(),
    });

    return {
      ...updated,
      role: updated.role as UserRole,
      status: updated.status as UserStatus,
    };
  }

  async remove(id: string, actorId?: string): Promise<{ success: boolean; id: string }> {
    await this.findById(id);

    await this.prisma.user.delete({
      where: { id },
    });

    // Write audit log to MongoDB
    await this.auditService.logEvent({
      action: AuditAction.USER_DELETED,
      userId: actorId,
      resource: 'User',
      resourceId: id,
      timestamp: new Date(),
    });

    return { success: true, id };
  }
}

