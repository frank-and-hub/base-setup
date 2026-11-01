import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { AuditLogEntry } from '@monorepo/shared-types';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditModel: Model<AuditLogDocument>,
  ) {}

  async logEvent(entry: Omit<AuditLogEntry, 'id'>): Promise<AuditLogDocument | null> {
    try {
      const created = new this.auditModel({
        ...entry,
        timestamp: entry.timestamp || new Date(),
      });
      return await created.save();
    } catch (error) {
      this.logger.error('Failed to write audit log to MongoDB', error);
      return null;
    }
  }

  async getRecentLogs(limit = 50, action?: string) {
    const filter = action ? { action } : {};
    return this.auditModel
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()
      .exec();
  }
}

