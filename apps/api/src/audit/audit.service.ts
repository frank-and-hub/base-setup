import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaService } from '../database/prisma.service';
import { ErrorLog, ErrorLogDocument } from './schemas/error-log.schema';
import { parsePaginationParams, buildPaginatedResult, redactSensitiveData } from '@monorepo/shared-utils';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectModel(ErrorLog.name)
    private readonly errorLogModel: Model<ErrorLogDocument>,
  ) {}

  // 1. Structured PostgreSQL Audit Logging
  async logAuditEvent(data: {
    actor_uuid?: string | null;
    actor_email?: string | null;
    action: string;
    resource_type: string;
    affected_resource_uuid?: string | null;
    correlation_id?: string;
    outcome?: 'SUCCESS' | 'FAILURE';
    before_state?: Record<string, any> | null;
    after_state?: Record<string, any> | null;
    ip_address?: string;
    user_agent?: string;
  }) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          actor_uuid: data.actor_uuid || null,
          actor_email: data.actor_email || null,
          action: data.action,
          resource_type: data.resource_type,
          affected_resource_uuid: data.affected_resource_uuid || null,
          correlation_id: data.correlation_id || crypto.randomUUID(),
          outcome: data.outcome || 'SUCCESS',
          before_state: data.before_state ? (redactSensitiveData(data.before_state) as any) : undefined,
          after_state: data.after_state ? (redactSensitiveData(data.after_state) as any) : undefined,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
        },
      });
    } catch (err: any) {
      this.logger.error(`Failed to record structured audit log: ${err?.message || err}`);
      return null;
    }
  }

  async findAuditLogs(query: any) {
    const { page, limit, skip, search, sortOrder } = parsePaginationParams(query);
    const where: Prisma.AuditLogWhereInput = {};

    if (query.action) {
      where.action = { contains: query.action, mode: 'insensitive' };
    }

    if (query.resource_type) {
      where.resource_type = query.resource_type;
    }

    if (query.outcome) {
      where.outcome = query.outcome;
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { resource_type: { contains: search, mode: 'insensitive' } },
        { actor_email: { contains: search, mode: 'insensitive' } },
        { correlation_id: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = new Date(query.startDate);
      if (query.endDate) where.timestamp.lte = new Date(query.endDate);
    }

    const [totalItems, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: sortOrder },
      }),
    ]);

    return buildPaginatedResult(logs, totalItems, page, limit);
  }

  // 2. MongoDB Application Error Logging
  async logApplicationError(data: {
    error_type: string;
    message: string;
    stack?: string;
    module?: string;
    environment?: string;
    correlation_id: string;
    status_code?: number;
    request_metadata?: any;
  }) {
    try {
      const entry = new this.errorLogModel({
        error_log_uuid: crypto.randomUUID(),
        error_type: data.error_type,
        message: data.message,
        stack: data.stack ? redactSensitiveData(data.stack) : undefined,
        module: data.module || 'API',
        environment: process.env.NODE_ENV || 'development',
        correlation_id: data.correlation_id,
        status_code: data.status_code || 500,
        request_metadata: data.request_metadata ? redactSensitiveData(data.request_metadata) : undefined,
        timestamp: new Date(),
      });
      return await entry.save();
    } catch (err: any) {
      this.logger.error(`Failed to record MongoDB application error log: ${err?.message || err}`);
      return null;
    }
  }

  async findErrorLogs(query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(Math.max(1, Number(query.limit) || 10), 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.search) {
      filter.$or = [
        { message: { $regex: query.search, $options: 'i' } },
        { error_type: { $regex: query.search, $options: 'i' } },
        { correlation_id: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.statusCode) {
      filter.status_code = Number(query.statusCode);
    }

    if (query.startDate || query.endDate) {
      filter.timestamp = {};
      if (query.startDate) filter.timestamp.$gte = new Date(query.startDate);
      if (query.endDate) filter.timestamp.$lte = new Date(query.endDate);
    }

    const [totalItems, logs] = await Promise.all([
      this.errorLogModel.countDocuments(filter),
      this.errorLogModel
        .find(filter)
        .sort({ timestamp: query.sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
    ]);

    return buildPaginatedResult(logs, totalItems, page, limit);
  }
}
