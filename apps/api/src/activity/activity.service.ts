import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { parsePaginationParams, buildPaginatedResult } from '@monorepo/shared-utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logActivity(data: {
    user_uuid?: string | null;
    actor_uuid?: string | null;
    action: string;
    correlation_id?: string;
    metadata?: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
  }) {
    try {
      return await this.prisma.userActivityLog.create({
        data: {
          user_uuid: data.user_uuid || null,
          actor_uuid: data.actor_uuid || null,
          action: data.action,
          correlation_id: data.correlation_id || 'system',
          metadata: data.metadata ? (data.metadata as any) : undefined,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
        },
      });
    } catch (err: any) {
      this.logger.error(`Failed to record user activity log: ${err?.message || err}`);
      return null;
    }
  }

  async findAll(query: any) {
    const { page, limit, skip, search, sortOrder } = parsePaginationParams(query);
    const where: Prisma.UserActivityLogWhereInput = {};

    if (query.user_uuid) {
      where.user_uuid = query.user_uuid;
    }

    if (query.action) {
      where.action = { contains: query.action, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { correlation_id: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = new Date(query.startDate);
      if (query.endDate) where.timestamp.lte = new Date(query.endDate);
    }

    const [totalItems, logs] = await Promise.all([
      this.prisma.userActivityLog.count({ where }),
      this.prisma.userActivityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: sortOrder },
        include: {
          target_user: {
            select: { user_uuid: true, email: true, first_name: true, last_name: true },
          },
          actor_user: {
            select: { user_uuid: true, email: true, first_name: true, last_name: true },
          },
        },
      }),
    ]);

    return buildPaginatedResult(logs, totalItems, page, limit);
  }

  async findByUser(userUuid: string, limit = 20) {
    return this.prisma.userActivityLog.findMany({
      where: { user_uuid: userUuid },
      take: limit,
      orderBy: { timestamp: 'desc' },
    });
  }
}

