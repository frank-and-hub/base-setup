import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Setting } from '@monorepo/shared-types';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getAll(includePrivate = false): Promise<Setting[]> {
    const where = includePrivate ? {} : { is_public: true };
    const items = await this.prisma.setting.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    return items as unknown as Setting[];
  }

  async getByKey(key: string): Promise<Setting> {
    const item = await this.prisma.setting.findUnique({
      where: { key },
    });
    if (!item) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }
    return item as unknown as Setting;
  }

  async update(key: string, value: string, actorUuid?: string): Promise<Setting> {
    const existing = await this.prisma.setting.findUnique({
      where: { key },
    });
    if (!existing) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    // Validate type
    if (existing.type === 'BOOLEAN' && value !== 'true' && value !== 'false') {
      throw new BadRequestException(`Value for "${key}" must be "true" or "false"`);
    }
    if (existing.type === 'NUMBER' && isNaN(Number(value))) {
      throw new BadRequestException(`Value for "${key}" must be a valid number`);
    }
    if (existing.type === 'JSON') {
      try {
        JSON.parse(value);
      } catch {
        throw new BadRequestException(`Value for "${key}" must be valid JSON`);
      }
    }

    const updated = await this.prisma.setting.update({
      where: { key },
      data: {
        value,
        updated_by_uuid: actorUuid || null,
      },
    });

    // Write structured audit log
    await this.auditService.logAuditEvent({
      actor_uuid: actorUuid,
      action: 'SETTING_UPDATED',
      resource_type: 'Setting',
      affected_resource_uuid: key,
      before_state: { key, value: existing.value },
      after_state: { key, value: updated.value },
    });

    return updated as unknown as Setting;
  }
}

